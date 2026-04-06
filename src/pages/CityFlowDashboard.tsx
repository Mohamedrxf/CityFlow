import { useState, useEffect, useRef } from "react";
import {
    Navigation,
    Bell,
    Zap,
    Shield,
    Activity,
    Clock,
    Eye,
    Cpu,
    ChevronRight,
    MapPin,
    BarChart2,
    Settings as SettingsIcon,
    AlertTriangle,
    TrendingUp,
    PlayCircle,
    Upload,
    FileVideo,
    Image as ImageIcon,
    Camera,
    ScanSearch,
    Play,
    Crosshair,
    Radar,
} from "lucide-react";

import TopHeader from "@/components/dashboard/TopHeader";
import RouteOptimization from "./RouteOptimization";
import EmergencyPriority from "./EmergencyPriority";
import PredictionInsights from "./PredictionInsights";
import SimulationMode from "./SimulationMode";
import AnalyticsDashboard from "./AnalyticsDashboard";
import SettingsPage from "./Settings";
import { analyzeIntersection } from "../services/cityflowApi";

type AlertType = "detect" | "route" | "override" | "info" | "move" | "backend" | "media";
type NavPage =
    | "live"
    | "route"
    | "emergency"
    | "prediction"
    | "simulation"
    | "analytics"
    | "settings";

type Dir = "north" | "south" | "east" | "west";
type SignalState = "red" | "yellow" | "green";

interface Alert {
    id: number;
    t: string;
    msg: string;
    type: AlertType;
}

interface Metrics {
    conf: number;
    lat: number;
    overrides: number;
    eta: number;
}

interface AnalyzeResponse {
    intersection_id: string;
    mode: string;
    analysis: Record<
        string,
        {
            traffic_level: string;
            edge_density: number;
            ambulance_detected: boolean;
            confidence: number | null;
        }
    >;
    signal_plan: Record<string, string>;
    reason: string;
}

interface Vehicle {
    id: string;
    x: number;
    y: number;
    direction: Dir;
    speed: number;
    color: string;
    stopped: boolean;
}

interface TrafficSignal {
    direction: Dir;
    state: SignalState;
}

interface UploadMedia {
    image: File | null;
    video: File | null;
    imageUrl: string;
    videoUrl: string;
}

interface TrackingState {
    sourceType: "simulation" | "image" | "video";
    sourceName: string;
    detected: boolean;
    route: Dir | null;
    confidence: number;
    distanceToSignal: number;
    previewMode: "idle" | "scanning" | "tracking";
}

interface DetectionBox {
    x: number;
    y: number;
    width: number;
    height: number;
    label: string;
}

const ROUTE_SEQUENCE = ["LEFT ENTRY", "INTERSECTION", "AI GREEN PATH", "SAFE EXIT"];

const INIT_ALERTS: Alert[] = [
    { id: 1, t: "14:23:01", msg: "CityFlow control center online", type: "info" },
    { id: 2, t: "14:23:03", msg: "Waiting for ambulance image/video upload", type: "media" },
    { id: 3, t: "14:23:05", msg: "AI reroute engine ready for emergency corridor activation", type: "route" },
];

const ALERT_C: Record<AlertType, string> = {
    detect: "#00FFA3",
    route: "#4DA6FF",
    override: "#FF6B00",
    info: "#8AA0B8",
    move: "#5A7090",
    backend: "#FFD700",
    media: "#B388FF",
};

const NAV_ITEMS: { id: NavPage; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: "live", label: "Live Traffic Analysis", icon: <Activity size={15} />, badge: 0 },
    { id: "route", label: "Route Optimization", icon: <Navigation size={15} /> },
    { id: "emergency", label: "Emergency Priority", icon: <AlertTriangle size={15} />, badge: 3 },
    { id: "prediction", label: "Prediction Insights", icon: <TrendingUp size={15} /> },
    { id: "simulation", label: "Simulation Mode", icon: <PlayCircle size={15} /> },
    { id: "analytics", label: "Analytics Dashboard", icon: <BarChart2 size={15} /> },
    { id: "settings", label: "Settings", icon: <SettingsIcon size={15} /> },
];

const AI_DEMO_ROUTE = {
    startX: 30,
    startY: 250,
    stopX: 230,
    stopY: 250,
    centerX: 300,
    centerY: 250,
    rerouteX: 300,
    rerouteY: 95,
};

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;600;700;900&family=Share+Tech+Mono&family=Exo+2:wght@400;600;700;900&display=swap');
  .cf-root *, .cf-root *::before, .cf-root *::after { box-sizing:border-box; }
  .cf-root ::-webkit-scrollbar { width:6px; height:6px; }
  .cf-root ::-webkit-scrollbar-thumb { background:#1A2D42; border-radius:4px; }
  @keyframes cf-blink { 0%,100%{opacity:1} 50%{opacity:.2} }
  @keyframes cf-fastblink { 0%,100%{opacity:1} 50%{opacity:.15} }
  @keyframes cf-fadein { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:none} }
  @keyframes cf-pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.06)} }
  @keyframes cf-siren { 0%{filter:drop-shadow(0 0 6px #FF3B5C)} 50%{filter:drop-shadow(0 0 18px #4DA6FF)} 100%{filter:drop-shadow(0 0 6px #FF3B5C)} }
  @keyframes cf-red-alert { 0%{filter:drop-shadow(0 0 4px #FF6B00)} 50%{filter:drop-shadow(0 0 16px #FF6B00)} 100%{filter:drop-shadow(0 0 4px #FF6B00)} }
  @keyframes cf-green-glow { 0%{filter:drop-shadow(0 0 4px #00FFA3)} 50%{filter:drop-shadow(0 0 16px #00FFA3)} 100%{filter:drop-shadow(0 0 4px #00FFA3)} }
  @keyframes cf-purple-glow { 0%{box-shadow:0 0 0 rgba(179,136,255,.0)} 50%{box-shadow:0 0 22px rgba(179,136,255,.35)} 100%{box-shadow:0 0 0 rgba(179,136,255,.0)} }
  @keyframes cf-path-flow { to{stroke-dashoffset:-28} }
  @keyframes cf-stop-pulse { 0%,100%{opacity:.35} 50%{opacity:.8} }
  @keyframes cf-junction-pulse { 0%,100%{opacity:.12; transform:scale(1)} 50%{opacity:.28; transform:scale(1.15)} }
  @keyframes cf-road-sheen { 0%,100%{opacity:.18} 50%{opacity:.42} }
  .cf-blink { animation:cf-blink 1.3s infinite; }
  .cf-fastblink { animation:cf-fastblink 0.65s infinite; }
  .cf-fadein { animation:cf-fadein 0.3s ease; }
  .cf-pulse { animation:cf-pulse 2s ease-in-out infinite; }
  .cf-siren { animation:cf-siren 0.45s ease-in-out infinite; }
  .cf-red-alert { animation:cf-red-alert 0.6s ease-in-out infinite; }
  .cf-green-glow { animation:cf-green-glow 0.8s ease-in-out infinite; }
  .cf-purple-glow { animation:cf-purple-glow 1.5s ease-in-out infinite; }
  .cf-path-flow { stroke-dasharray:10 8; animation:cf-path-flow 1.1s linear infinite; }
  .cf-stop-pulse { animation:cf-stop-pulse .9s ease-in-out infinite; }
  .cf-junction-pulse { animation:cf-junction-pulse 1.1s ease-in-out infinite; transform-origin:center; }
  .cf-road-sheen { animation:cf-road-sheen 1.8s ease-in-out infinite; }
  .cf-nav-btn:hover { background:#0F1E2E !important; }
  .cf-nav-btn-active { background:#0F1E2E !important; border-left:2px solid #FF6B00 !important; }
`;

const mono: React.CSSProperties = { fontFamily: "'Share Tech Mono', monospace" };
const exo: React.CSSProperties = { fontFamily: "'Exo 2', sans-serif" };
const raj: React.CSSProperties = { fontFamily: "'Rajdhani', sans-serif" };

function Panel({
    children,
    style,
}: {
    children: React.ReactNode;
    style?: React.CSSProperties;
}) {
    return (
        <div
            style={{
                background: "#0B1522",
                border: "1px solid #1A2D42",
                borderRadius: 10,
                ...style,
            }}
        >
            {children}
        </div>
    );
}

function PTitle({
    icon,
    label,
    extra,
}: {
    icon: React.ReactNode;
    label: string;
    extra?: React.ReactNode;
}) {
    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 12px",
                borderBottom: "1px solid #1A2D42",
                ...exo,
                fontWeight: 700,
                fontSize: 10,
                letterSpacing: 2,
                textTransform: "uppercase",
                color: "#4A6280",
                flexShrink: 0,
            }}
        >
            {icon}
            {label}
            {extra && <span style={{ marginLeft: "auto" }}>{extra}</span>}
        </div>
    );
}

function Bar({ w, color }: { w: number; color: string }) {
    return (
        <div style={{ height: 4, background: "#1A2D42", borderRadius: 999, overflow: "hidden" }}>
            <div
                style={{
                    height: "100%",
                    width: `${Math.max(0, Math.min(100, w))}%`,
                    background: color,
                    borderRadius: 999,
                    transition: "width 0.6s ease",
                }}
            />
        </div>
    );
}

function PlaceholderPage({
    title,
    icon,
}: {
    title: string;
    icon: React.ReactNode;
}) {
    return (
        <div
            style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 16,
            }}
        >
            <div style={{ opacity: 0.15, transform: "scale(3)" }}>{icon}</div>
            <div
                style={{
                    ...exo,
                    fontWeight: 700,
                    fontSize: 16,
                    letterSpacing: 3,
                    color: "#4A6280",
                    textTransform: "uppercase",
                    marginTop: 24,
                }}
            >
                {title}
            </div>
            <div style={{ ...mono, fontSize: 11, color: "#2A3D52" }}>Module coming soon</div>
        </div>
    );
}

const getSignalBgColor = (state: SignalState) =>
    state === "green" ? "#00FFA3" : state === "yellow" ? "#FFD700" : "#FF6B00";

const formatTime = () => new Date().toLocaleTimeString("en-IN", { hour12: false });

const inferRouteFromFileName = (fileName: string): Dir => {
    const n = fileName.toLowerCase();
    if (n.includes("north") || n.includes("top")) return "north";
    if (n.includes("south") || n.includes("bottom")) return "south";
    if (n.includes("east") || n.includes("right")) return "east";
    return "west";
};

export default function CityFlowDashboard() {
    const [step, setStep] = useState<number>(0);
    const [alerts, setAlerts] = useState<Alert[]>(INIT_ALERTS);
    const [metrics, setMetrics] = useState<Metrics>({
        conf: 96.4,
        lat: 127,
        overrides: 3,
        eta: 47,
    });
    const [clock, setClock] = useState<Date>(new Date());
    const [navPage, setNavPage] = useState<NavPage>("live");
    const [sideOpen, setSideOpen] = useState<boolean>(true);
    const aidRef = useRef<number>(5);

    const [northFile, setNorthFile] = useState<File | null>(null);
    const [southFile, setSouthFile] = useState<File | null>(null);
    const [eastFile, setEastFile] = useState<File | null>(null);
    const [westFile, setWestFile] = useState<File | null>(null);

    const [media, setMedia] = useState<UploadMedia>({
        image: null,
        video: null,
        imageUrl: "",
        videoUrl: "",
    });
    const [detectionBox, setDetectionBox] = useState<DetectionBox | null>(null);
    const [tracking, setTracking] = useState<TrackingState>({
        sourceType: "simulation",
        sourceName: "Simulation Feed",
        detected: false,
        route: "west",
        confidence: 0,
        distanceToSignal: 100,
        previewMode: "idle",
    });

    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analyzeResult, setAnalyzeResult] = useState<AnalyzeResponse | null>(null);
    const [analyzeError, setAnalyzeError] = useState<string | null>(null);

    const [animationTime, setAnimationTime] = useState<number>(0);
    const [ambulanceX, setAmbulanceX] = useState<number>(30);
    const [ambulanceY, setAmbulanceY] = useState<number>(250);
    const [ambulanceActive, setAmbulanceActive] = useState<boolean>(true);
    const [vehicles, setVehicles] = useState<Vehicle[]>([
        { id: "car1", x: 28, y: 214, direction: "east", speed: 0.95, color: "#4DA6FF", stopped: false },
        { id: "car2", x: 88, y: 286, direction: "east", speed: 0.78, color: "#FFD700", stopped: false },
        { id: "car3", x: 536, y: 286, direction: "west", speed: 0.9, color: "#00FFA3", stopped: false },
        { id: "car4", x: 472, y: 214, direction: "west", speed: 0.74, color: "#54A0FF", stopped: false },
        { id: "car5", x: 286, y: 72, direction: "south", speed: 0.82, color: "#FF9F43", stopped: false },
        { id: "car6", x: 214, y: 430, direction: "north", speed: 0.76, color: "#9C88FF", stopped: false },
        { id: "car7", x: 214, y: 376, direction: "north", speed: 0.64, color: "#48DBFB", stopped: false },
        { id: "car8", x: 286, y: 144, direction: "south", speed: 0.7, color: "#F368E0", stopped: false },
    ]);
    const [signals, setSignals] = useState<TrafficSignal[]>([
        { direction: "north", state: "yellow" },
        { direction: "south", state: "red" },
        { direction: "east", state: "red" },
        { direction: "west", state: "red" },
    ]);

    const [lastAmbulanceAlert, setLastAmbulanceAlert] = useState<string>("");

    useEffect(() => {
        const t = setInterval(() => setClock(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    useEffect(() => {
        const t = setInterval(() => {
            setStep((s) => (s + 1) % ROUTE_SEQUENCE.length);
            setMetrics((m) => ({
                conf: +Math.max(88, Math.min(99, m.conf + (Math.random() - 0.5) * 1.2)).toFixed(1),
                lat: Math.floor(100 + Math.random() * 55),
                overrides: m.overrides + 1,
                eta: Math.max(0, m.eta - 2),
            }));
        }, 3500);
        return () => clearInterval(t);
    }, []);

    useEffect(() => {
        const animationInterval = setInterval(() => {
            setAnimationTime((t) => (t + 1) % 600);
        }, 50);
        return () => clearInterval(animationInterval);
    }, []);

    useEffect(() => {
        const time = animationTime;

        let newAmbulanceX = ambulanceX;
        let newAmbulanceY = ambulanceY;
        let newAlert = "";
        let ambActive = true;
        let distanceToSignal = 100;

        if (time < 130) {
            const t = time / 130;
            newAmbulanceX = AI_DEMO_ROUTE.startX + (AI_DEMO_ROUTE.stopX - AI_DEMO_ROUTE.startX) * t;
            newAmbulanceY = AI_DEMO_ROUTE.startY;
            distanceToSignal = Math.max(0, 100 - Math.floor(t * 70));
            if (time === 0) newAlert = "🚨 AMBULANCE DETECTED • Approaching from LEFT corridor";
        } else if (time < 175) {
            const t = (time - 130) / 45;
            newAmbulanceX = AI_DEMO_ROUTE.stopX + (AI_DEMO_ROUTE.centerX - AI_DEMO_ROUTE.stopX) * t;
            newAmbulanceY = AI_DEMO_ROUTE.stopY;
            distanceToSignal = Math.max(0, 30 - Math.floor(t * 30));
            if (time === 130) newAlert = "🛑 LEFT SIGNAL TURNED RED • AI searching alternate green corridor";
        } else if (time < 210) {
            newAmbulanceX = AI_DEMO_ROUTE.centerX;
            newAmbulanceY = AI_DEMO_ROUTE.centerY;
            distanceToSignal = 0;
            if (time === 175) newAlert = "✅ NORTH CORRIDOR TURNED GREEN • Ambulance rerouting automatically";
        } else if (time < 315) {
            const t = (time - 210) / 105;
            newAmbulanceX = AI_DEMO_ROUTE.rerouteX;
            newAmbulanceY = AI_DEMO_ROUTE.centerY + (AI_DEMO_ROUTE.rerouteY - AI_DEMO_ROUTE.centerY) * t;
            distanceToSignal = 0;
            if (time === 210) newAlert = "🚑 AMBULANCE REROUTED • Crossing through new AI green path";
        } else if (time < 430) {
            newAmbulanceX = AI_DEMO_ROUTE.rerouteX;
            newAmbulanceY = AI_DEMO_ROUTE.rerouteY;
            distanceToSignal = 0;
            if (time === 315) newAlert = "✨ GREEN CORRIDOR MAINTAINED • Ambulance cleared the junction";
        } else {
            newAmbulanceX = AI_DEMO_ROUTE.startX;
            newAmbulanceY = AI_DEMO_ROUTE.startY;
            ambActive = false;
            distanceToSignal = 100;
            if (time === 430) newAlert = "↻ CYCLE COMPLETE • Ready for next AI reroute demonstration";
        }

        setAmbulanceX(newAmbulanceX);
        setAmbulanceY(newAmbulanceY);
        setAmbulanceActive(ambActive);
        setTracking((prev) => ({
            ...prev,
            detected: true,
            route: "west",
            confidence: prev.previewMode === "idle" ? prev.confidence : Math.max(92, prev.confidence),
            distanceToSignal,
        }));

        if (newAlert && newAlert !== lastAmbulanceAlert) {
            setLastAmbulanceAlert(newAlert);
            setAlerts((prev) => [
                {
                    id: aidRef.current++,
                    t: formatTime(),
                    msg: newAlert,
                    type: time < 175 ? "detect" : time < 315 ? "override" : "move",
                },
                ...prev,
            ].slice(0, 16));
        }

        let newSignals: TrafficSignal[] = [
            { direction: "north", state: "red" },
            { direction: "south", state: "red" },
            { direction: "east", state: "red" },
            { direction: "west", state: "red" },
        ];

        if (time < 130) {
            newSignals = [
                { direction: "north", state: "red" },
                { direction: "south", state: "red" },
                { direction: "east", state: "red" },
                { direction: "west", state: "yellow" },
            ];
        } else if (time < 175) {
            newSignals = [
                { direction: "north", state: "yellow" },
                { direction: "south", state: "red" },
                { direction: "east", state: "red" },
                { direction: "west", state: "red" },
            ];
        } else if (time < 315) {
            newSignals = [
                { direction: "north", state: "green" },
                { direction: "south", state: "red" },
                { direction: "east", state: "red" },
                { direction: "west", state: "red" },
            ];
        } else if (time < 380) {
            newSignals = [
                { direction: "north", state: "green" },
                { direction: "south", state: "yellow" },
                { direction: "east", state: "red" },
                { direction: "west", state: "red" },
            ];
        } else {
            newSignals = [
                { direction: "north", state: "green" },
                { direction: "south", state: "red" },
                { direction: "east", state: "red" },
                { direction: "west", state: "green" },
            ];
        }

        setSignals(newSignals);

        setVehicles((prevVehicles) =>
            prevVehicles.map((vehicle) => {
                let newX = vehicle.x;
                let newY = vehicle.y;
                let stopped = false;
                const signalState = newSignals.find((s) => s.direction === vehicle.direction)?.state || "red";
                const sameRouteStop = vehicle.direction === "west" && distanceToSignal < 60 && ambActive;
                const ambDistance = Math.hypot(vehicle.x - newAmbulanceX, vehicle.y - newAmbulanceY);
                const isNearAmbulance = ambDistance < 60 && ambActive;

                const approachingStopLine =
                    (vehicle.direction === "east" && newX > 150 && newX < 230) ||
                    (vehicle.direction === "west" && newX < 445 && newX > 365) ||
                    (vehicle.direction === "south" && newY > 95 && newY < 205) ||
                    (vehicle.direction === "north" && newY < 405 && newY > 295);

                if ((signalState === "red" && approachingStopLine) || sameRouteStop || isNearAmbulance) {
                    stopped = true;
                } else {
                    if (vehicle.direction === "east") {
                        newX = vehicle.x + vehicle.speed;
                        if (newX > 620) newX = -24;
                    } else if (vehicle.direction === "west") {
                        newX = vehicle.x - vehicle.speed;
                        if (newX < -24) newX = 624;
                    } else if (vehicle.direction === "north") {
                        newY = vehicle.y - vehicle.speed;
                        if (newY < -24) newY = 524;
                    } else if (vehicle.direction === "south") {
                        newY = vehicle.y + vehicle.speed;
                        if (newY > 524) newY = -24;
                    }
                }

                return { ...vehicle, x: newX, y: newY, stopped };
            })
        );
    }, [animationTime, lastAmbulanceAlert, ambulanceX, ambulanceY]);

    useEffect(() => {
        return () => {
            if (media.imageUrl) URL.revokeObjectURL(media.imageUrl);
            if (media.videoUrl) URL.revokeObjectURL(media.videoUrl);
        };
    }, [media.imageUrl, media.videoUrl]);

    const handleMediaUpload = (file: File, kind: "image" | "video") => {
        const objectUrl = URL.createObjectURL(file);
        const routeGuess = inferRouteFromFileName(file.name);
        const confidence = file.name.toLowerCase().includes("ambulance") ? 97 : 91;

        setMedia((prev) => {
            if (kind === "image" && prev.imageUrl) URL.revokeObjectURL(prev.imageUrl);
            if (kind === "video" && prev.videoUrl) URL.revokeObjectURL(prev.videoUrl);
            return {
                image: kind === "image" ? file : prev.image,
                video: kind === "video" ? file : prev.video,
                imageUrl: kind === "image" ? objectUrl : prev.imageUrl,
                videoUrl: kind === "video" ? objectUrl : prev.videoUrl,
            };
        });

        setDetectionBox({ x: 18, y: 24, width: 92, height: 54, label: "AMBULANCE" });

        setTracking({
            sourceType: kind,
            sourceName: file.name,
            detected: true,
            route: routeGuess,
            confidence,
            distanceToSignal: 100,
            previewMode: "tracking",
        });

        setAnimationTime(0);

        setAlerts((prev) => [
            {
                id: aidRef.current++,
                t: formatTime(),
                msg: `${kind === "image" ? "Image" : "Video"} uploaded • Model locked ambulance from ${routeGuess.toUpperCase()} route • tracking started`,
                type: "media",
            },
            ...prev,
        ].slice(0, 16));
    };

    const handleMockTrack = () => {
        setDetectionBox({ x: 18, y: 24, width: 92, height: 54, label: "AMBULANCE" });
        setTracking({
            sourceType: media.video ? "video" : media.image ? "image" : "simulation",
            sourceName: media.video?.name || media.image?.name || "Simulation Feed",
            detected: true,
            route: "west",
            confidence: 95,
            distanceToSignal: 100,
            previewMode: "tracking",
        });
        setAnimationTime(0);
        setAlerts((prev) => [
            {
                id: aidRef.current++,
                t: formatTime(),
                msg: `Model locked ambulance track • Route inferred as LEFT corridor`,
                type: "detect",
            },
            ...prev,
        ].slice(0, 16));
    };

    const handleAnalyzeIntersection = async () => {
        if (!northFile || !southFile || !eastFile || !westFile) {
            setAnalyzeError("Please upload all 4 direction images.");
            return;
        }

        try {
            setIsAnalyzing(true);
            setAnalyzeError(null);

            const result = await analyzeIntersection({
                north: northFile,
                south: southFile,
                east: eastFile,
                west: westFile,
            });

            setAnalyzeResult(result);

            setAlerts((prev) => [
                {
                    id: aidRef.current++,
                    t: formatTime(),
                    msg: `Backend analyzed ${result.intersection_id} • mode ${result.mode} • ${result.reason}`,
                    type: "backend",
                },
                ...prev,
            ].slice(0, 16));
        } catch (error) {
            setAnalyzeError(error instanceof Error ? error.message : "Failed to analyze intersection");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const PAGE_COMPONENTS: Record<string, JSX.Element> = {
        route: <RouteOptimization />,
        emergency: <EmergencyPriority />,
        prediction: <PredictionInsights />,
        simulation: <SimulationMode />,
        analytics: <AnalyticsDashboard />,
        settings: <SettingsPage />,
    };

    const timeStr = clock.toLocaleTimeString("en-IN", { hour12: false });
    const dateStr = clock.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });

    const trackedRoute = "west" as Dir;
    const trackedSignalState = signals.find((s) => s.direction === trackedRoute)?.state ?? "red";
    const stoppedVehicles = vehicles.filter((v) => v.stopped).length;
    const movingVehicles = vehicles.filter((v) => !v.stopped).length;
    const modeLabel =
        tracking.sourceType === "simulation"
            ? "SIM TRACK"
            : tracking.sourceType === "image"
                ? "IMAGE TRACK"
                : "VIDEO TRACK";

    const previewBoxStyle: React.CSSProperties = {
        background: "linear-gradient(180deg,#0A1320,#09101A)",
        border: "1px solid #203040",
        borderRadius: 8,
        overflow: "hidden",
        minHeight: 150,
        position: "relative",
    };

    return (
        <>
            <style>{STYLES}</style>

            <div className="min-h-screen bg-[#030712] text-white">
                <TopHeader
                    title="Central Command Dashboard"
                    subtitle="Traffic control, ambulance tracking, and signal orchestration"
                />

                <div
                    className="cf-root"
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        minHeight: "calc(100vh - 88px)",
                        background: "#060C15",
                        color: "#C8D8E8",
                        ...raj,
                        overflowY: "auto",
                    }}
                >
                    <header
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "8px 16px",
                            background: "#080E18",
                            borderBottom: "1px solid #1A2D42",
                            flexShrink: 0,
                            gap: 12,
                            zIndex: 20,
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div
                                style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: 8,
                                    background: "linear-gradient(135deg,#FF6B00,#FF3B5C)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <Navigation size={18} color="white" />
                            </div>

                            <div>
                                <div
                                    style={{
                                        ...exo,
                                        fontWeight: 900,
                                        fontSize: 18,
                                        color: "#E8F4FF",
                                        letterSpacing: 3,
                                    }}
                                >
                                    CITYFLOW
                                </div>
                                <div
                                    style={{
                                        ...mono,
                                        fontSize: 8,
                                        color: "#4A6280",
                                        letterSpacing: 2,
                                    }}
                                >
                                    AI SMART AMBULANCE SYSTEM v3.6
                                </div>
                            </div>

                            <div
                                style={{
                                    width: 1,
                                    height: 30,
                                    background: "#1A2D42",
                                    margin: "0 8px",
                                }}
                            />

                            {[
                                { l: "SYSTEM", v: "ACTIVE", c: "#00FFA3" },
                                { l: "TRACK MODE", v: modeLabel, c: "#B388FF" },
                                { l: "ROUTE", v: "LEFT LIVE", c: "#FF6B00" },
                            ].map((b) => (
                                <div key={b.l} style={{ display: "flex", flexDirection: "column", marginRight: 6 }}>
                                    <span
                                        style={{
                                            ...exo,
                                            fontWeight: 700,
                                            fontSize: 8,
                                            letterSpacing: 2,
                                            color: "#4A6280",
                                        }}
                                    >
                                        {b.l}
                                    </span>
                                    <span
                                        style={{
                                            ...mono,
                                            fontSize: 14,
                                            color: b.c,
                                            fontWeight: 700,
                                        }}
                                    >
                                        {b.v}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                            <div style={{ textAlign: "right" }}>
                                <div
                                    style={{
                                        ...mono,
                                        fontSize: 22,
                                        color: "#E8F4FF",
                                        lineHeight: 1,
                                    }}
                                >
                                    {timeStr}
                                </div>
                                <div
                                    style={{
                                        ...mono,
                                        fontSize: 9,
                                        color: "#4A6280",
                                        letterSpacing: 1,
                                        marginTop: 2,
                                    }}
                                >
                                    {dateStr} IST
                                </div>
                            </div>

                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                    padding: "5px 12px",
                                    background: ambulanceActive ? "#FF6B0030" : "#1A2D42",
                                    border: `1px solid ${ambulanceActive ? "#FF6B00" : "#2A3D52"}`,
                                    borderRadius: 4,
                                    transition: "all 0.3s ease",
                                }}
                            >
                                <Bell size={13} color={ambulanceActive ? "#FF6B00" : "#4A6280"} />
                                <span
                                    style={{
                                        ...exo,
                                        fontWeight: 700,
                                        fontSize: 12,
                                        color: ambulanceActive ? "#FF6B00" : "#4A6280",
                                    }}
                                >
                                    {ambulanceActive ? "🚨 EMERGENCY ACTIVE" : "✓ SYSTEM READY"}
                                </span>
                                {ambulanceActive && (
                                    <div
                                        className="cf-fastblink"
                                        style={{
                                            width: 6,
                                            height: 6,
                                            borderRadius: "50%",
                                            background: "#FF6B00",
                                            marginLeft: 2,
                                        }}
                                    />
                                )}
                            </div>
                        </div>
                    </header>

                    <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>
                        <aside
                            style={{
                                width: sideOpen ? 220 : 48,
                                background: "#080E18",
                                borderRight: "1px solid #1A2D42",
                                display: "flex",
                                flexDirection: "column",
                                flexShrink: 0,
                                transition: "width 0.25s ease",
                                overflow: "hidden",
                            }}
                        >
                            <div style={{ flex: 1, paddingTop: 8 }}>
                                {NAV_ITEMS.map(({ id, label, icon, badge }) => (
                                    <button
                                        key={id}
                                        className={`cf-nav-btn${navPage === id ? " cf-nav-btn-active" : ""}`}
                                        onClick={() => setNavPage(id)}
                                        style={{
                                            width: "100%",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 10,
                                            padding: "10px 14px",
                                            background: "transparent",
                                            border: "none",
                                            borderLeft: navPage === id ? "2px solid #FF6B00" : "2px solid transparent",
                                            cursor: "pointer",
                                            color: navPage === id ? "#E8F4FF" : "#4A6280",
                                            ...exo,
                                            fontWeight: navPage === id ? 700 : 600,
                                            fontSize: 13,
                                            whiteSpace: "nowrap",
                                            transition: "all 0.15s",
                                        }}
                                    >
                                        <span
                                            style={{
                                                color: navPage === id ? "#FF6B00" : "#4A6280",
                                                flexShrink: 0,
                                            }}
                                        >
                                            {icon}
                                        </span>

                                        {sideOpen && <span style={{ flex: 1, textAlign: "left" }}>{label}</span>}

                                        {sideOpen && badge ? (
                                            <span
                                                style={{
                                                    ...mono,
                                                    fontSize: 9,
                                                    background: "#FF6B0030",
                                                    color: "#FF6B00",
                                                    border: "1px solid #FF6B0050",
                                                    borderRadius: 10,
                                                    padding: "1px 6px",
                                                }}
                                            >
                                                {badge}
                                            </span>
                                        ) : null}
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={() => setSideOpen((o) => !o)}
                                style={{
                                    padding: "10px 14px",
                                    background: "transparent",
                                    border: "none",
                                    borderTop: "1px solid #1A2D42",
                                    color: "#4A6280",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 10,
                                    ...exo,
                                    fontSize: 12,
                                    fontWeight: 600,
                                }}
                            >
                                <ChevronRight
                                    size={14}
                                    style={{
                                        transform: sideOpen ? "rotate(180deg)" : "none",
                                        transition: "transform 0.25s",
                                    }}
                                />
                                {sideOpen && <span>Collapse</span>}
                            </button>
                        </aside>

                        {navPage !== "live" ? (
                            <div style={{ flex: 1, display: "flex" }}>
                                {PAGE_COMPONENTS[navPage] ? (
                                    PAGE_COMPONENTS[navPage]
                                ) : (
                                    <PlaceholderPage
                                        title={NAV_ITEMS.find((n) => n.id === navPage)?.label ?? ""}
                                        icon={NAV_ITEMS.find((n) => n.id === navPage)?.icon}
                                    />
                                )}
                            </div>
                        ) : (
                            <div
                                style={{
                                    flex: 1,
                                    display: "flex",
                                    gap: 10,
                                    padding: 10,
                                    overflow: "auto",
                                    minHeight: 0,
                                    background: "#060C15",
                                    alignItems: "stretch",
                                }}
                            >
                                <div
                                    style={{
                                        width: 315,
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 10,
                                        flexShrink: 0,
                                    }}
                                >
                                    <Panel>
                                        <PTitle
                                            icon={<Activity size={10} />}
                                            label="Tracked Ambulance"
                                            extra={<span style={{ ...mono, fontSize: 9, color: "#B388FF" }}>{modeLabel}</span>}
                                        />
                                        <div style={{ padding: 12 }}>
                                            <div
                                                style={{
                                                    background: "#060C15",
                                                    border: "1px solid #FF6B0050",
                                                    borderRadius: 6,
                                                    padding: 12,
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        justifyContent: "space-between",
                                                        alignItems: "flex-start",
                                                        marginBottom: 10,
                                                    }}
                                                >
                                                    <div>
                                                        <div
                                                            style={{
                                                                ...exo,
                                                                fontWeight: 700,
                                                                fontSize: 18,
                                                                color: "#FF6B00",
                                                                letterSpacing: 1,
                                                            }}
                                                        >
                                                            AMB-04
                                                        </div>
                                                        <div style={{ ...mono, fontSize: 10, color: "#4A6280" }}>{tracking.sourceName}</div>
                                                    </div>

                                                    <span
                                                        style={{
                                                            ...mono,
                                                            fontSize: 9,
                                                            color: ambulanceActive ? "#FF6B00" : "#4A6280",
                                                            background: ambulanceActive ? "#FF6B0020" : "#1A2D42",
                                                            border: `1px solid ${ambulanceActive ? "#FF6B0050" : "#2A3D52"}`,
                                                            borderRadius: 4,
                                                            padding: "3px 7px",
                                                        }}
                                                    >
                                                        {ambulanceActive ? "● ACTIVE" : "○ IDLE"}
                                                    </span>
                                                </div>

                                                {[
                                                    ["Detected Route", "LEFT", "#E8F4FF"],
                                                    ["Signal State", trackedSignalState.toUpperCase(), getSignalBgColor(trackedSignalState)],
                                                    ["Confidence", `${tracking.confidence.toFixed(0)}%`, "#00FFA3"],
                                                    ["Distance To Signal", `${tracking.distanceToSignal}m`, "#FFD700"],
                                                ].map(([k, v, c]) => (
                                                    <div
                                                        key={k}
                                                        style={{
                                                            display: "flex",
                                                            justifyContent: "space-between",
                                                            fontSize: 11,
                                                            marginBottom: 5,
                                                        }}
                                                    >
                                                        <span style={{ color: "#4A6280" }}>{k}</span>
                                                        <span style={{ ...mono, color: c }}>{v}</span>
                                                    </div>
                                                ))}

                                                <div
                                                    style={{
                                                        marginTop: 10,
                                                        height: 4,
                                                        background: "#1A2D42",
                                                        borderRadius: 999,
                                                        overflow: "hidden",
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            height: "100%",
                                                            width: `${Math.max(0, Math.min(100, 100 - tracking.distanceToSignal))}%`,
                                                            background: "linear-gradient(90deg,#B388FF,#FF6B00,#00FFA3)",
                                                            transition: "width 0.35s ease",
                                                            borderRadius: 999,
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </Panel>

                                    <Panel style={{ display: "flex", flexDirection: "column", boxShadow: "0 0 18px rgba(179,136,255,.18)" }}>
                                        <PTitle
                                            icon={<Upload size={10} />}
                                            label="Ambulance Image / Video Tracking Upload"
                                            extra={<span style={{ ...mono, fontSize: 9, color: "#B388FF" }}>MODEL INPUT</span>}
                                        />
                                        <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                                                <div style={{ background: "linear-gradient(135deg,#09111C,#0D1827)", border: "1px solid #1A2D42", borderRadius: 10, padding: 10 }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                                                        <ImageIcon size={14} color="#B388FF" />
                                                        <span style={{ ...exo, fontSize: 11, color: "#C8D8E8", fontWeight: 700 }}>Image Input</span>
                                                    </div>
                                                    <div style={{ ...mono, fontSize: 8, color: "#7A90A8", lineHeight: 1.6 }}>
                                                        Upload ambulance frame for detection, route guess, and signal trigger demo.
                                                    </div>
                                                </div>
                                                <div style={{ background: "linear-gradient(135deg,#09111C,#0D1827)", border: "1px solid #1A2D42", borderRadius: 10, padding: 10 }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                                                        <FileVideo size={14} color="#4DA6FF" />
                                                        <span style={{ ...exo, fontSize: 11, color: "#C8D8E8", fontWeight: 700 }}>Video Input</span>
                                                    </div>
                                                    <div style={{ ...mono, fontSize: 8, color: "#7A90A8", lineHeight: 1.6 }}>
                                                        Upload moving ambulance clip to simulate live tracking and priority routing.
                                                    </div>
                                                </div>
                                            </div>

                                            <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                                <span style={{ ...exo, fontSize: 11, color: "#8AA0B8" }}>Upload ambulance image</span>
                                                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: "#09111C", border: "1px dashed #B388FF55", borderRadius: 8 }}>
                                                    <ImageIcon size={16} color="#B388FF" />
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(e) => e.target.files?.[0] && handleMediaUpload(e.target.files[0], "image")}
                                                        style={{ flex: 1, fontSize: 11, color: "#C8D8E8" }}
                                                    />
                                                </div>
                                            </label>

                                            <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                                <span style={{ ...exo, fontSize: 11, color: "#8AA0B8" }}>Upload ambulance video</span>
                                                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: "#09111C", border: "1px dashed #4DA6FF55", borderRadius: 8 }}>
                                                    <FileVideo size={16} color="#4DA6FF" />
                                                    <input
                                                        type="file"
                                                        accept="video/*"
                                                        onChange={(e) => e.target.files?.[0] && handleMediaUpload(e.target.files[0], "video")}
                                                        style={{ flex: 1, fontSize: 11, color: "#C8D8E8" }}
                                                    />
                                                </div>
                                            </label>

                                            <div style={{ display: "flex", gap: 8 }}>
                                                <button
                                                    onClick={handleMockTrack}
                                                    style={{
                                                        flex: 1,
                                                        background: "linear-gradient(135deg,#B388FF,#7C4DFF)",
                                                        border: "none",
                                                        color: "white",
                                                        padding: "10px 12px",
                                                        borderRadius: 8,
                                                        cursor: "pointer",
                                                        ...exo,
                                                        fontWeight: 700,
                                                        fontSize: 11,
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        gap: 8,
                                                    }}
                                                >
                                                    <ScanSearch size={14} /> Start Tracking
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        setTracking((prev) => ({
                                                            ...prev,
                                                            sourceType: "simulation",
                                                            sourceName: "Simulation Feed",
                                                            previewMode: "tracking",
                                                            route: "west",
                                                            confidence: 94,
                                                            distanceToSignal: 100,
                                                        }))
                                                    }
                                                    style={{
                                                        flex: 1,
                                                        background: "linear-gradient(135deg,#FF6B00,#FF3B5C)",
                                                        border: "none",
                                                        color: "white",
                                                        padding: "10px 12px",
                                                        borderRadius: 8,
                                                        cursor: "pointer",
                                                        ...exo,
                                                        fontWeight: 700,
                                                        fontSize: 11,
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        gap: 8,
                                                    }}
                                                >
                                                    <Play size={14} /> Use Demo Route
                                                </button>
                                            </div>

                                            <div
                                                style={{
                                                    ...mono,
                                                    fontSize: 9,
                                                    color: "#8AA0B8",
                                                    lineHeight: 1.7,
                                                    background: "#08101A",
                                                    border: "1px solid #1A2D42",
                                                    borderRadius: 8,
                                                    padding: 10,
                                                }}
                                            >
                                                <div>• Upload image/video containing ambulance</div>
                                                <div>• Model identifies ambulance and infers approach route</div>
                                                <div>• Distance-to-signal reduces in live preview</div>
                                                <div>• When ambulance gets closer, that route turns GREEN</div>
                                            </div>
                                        </div>
                                    </Panel>

                                    <Panel>
                                        <PTitle icon={<Camera size={10} />} label="Source Preview" />
                                        <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                                            <div style={previewBoxStyle}>
                                                {media.videoUrl ? (
                                                    <video src={media.videoUrl} controls muted style={{ width: "100%", height: 170, objectFit: "cover" }} />
                                                ) : media.imageUrl ? (
                                                    <img src={media.imageUrl} alt="ambulance source" style={{ width: "100%", height: 170, objectFit: "cover" }} />
                                                ) : (
                                                    <div style={{ height: 170, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 10, color: "#4A6280" }}>
                                                        <Upload size={28} />
                                                        <span style={{ ...mono, fontSize: 10 }}>Upload image/video to preview tracking source</span>
                                                    </div>
                                                )}

                                                {detectionBox && (media.videoUrl || media.imageUrl) && (
                                                    <>
                                                        <div
                                                            style={{
                                                                position: "absolute",
                                                                left: `${detectionBox.x}%`,
                                                                top: `${detectionBox.y}%`,
                                                                width: `${detectionBox.width}px`,
                                                                height: `${detectionBox.height}px`,
                                                                border: "2px solid #00FFA3",
                                                                borderRadius: 8,
                                                                boxShadow: "0 0 18px rgba(0,255,163,.25)",
                                                                pointerEvents: "none",
                                                            }}
                                                        />
                                                        <div
                                                            style={{
                                                                position: "absolute",
                                                                left: `${detectionBox.x}%`,
                                                                top: `${Math.max(4, detectionBox.y - 6)}%`,
                                                                background: "#00FFA3",
                                                                color: "#06111A",
                                                                ...mono,
                                                                fontSize: 8,
                                                                padding: "2px 6px",
                                                                borderRadius: 4,
                                                            }}
                                                        >
                                                            {detectionBox.label}
                                                        </div>
                                                        <div
                                                            style={{
                                                                position: "absolute",
                                                                right: 10,
                                                                bottom: 10,
                                                                background: "rgba(6,17,26,.88)",
                                                                border: "1px solid #1A2D42",
                                                                borderRadius: 6,
                                                                padding: "6px 8px",
                                                                ...mono,
                                                                fontSize: 8,
                                                                color: "#B388FF",
                                                            }}
                                                        >
                                                            ROUTE: LEFT • CONF {tracking.confidence.toFixed(0)}%
                                                        </div>
                                                    </>
                                                )}
                                            </div>

                                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                                                <div style={{ background: "#09111C", border: "1px solid #1A2D42", borderRadius: 8, padding: 10 }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                                                        <Crosshair size={12} color="#00FFA3" />
                                                        <span style={{ ...exo, fontSize: 10, color: "#C8D8E8", fontWeight: 700 }}>Detection Box</span>
                                                    </div>
                                                    <div style={{ ...mono, fontSize: 8, color: "#7A90A8", lineHeight: 1.6 }}>
                                                        {detectionBox ? "Ambulance locked in uploaded source." : "No object detected yet."}
                                                    </div>
                                                </div>
                                                <div style={{ background: "#09111C", border: "1px solid #1A2D42", borderRadius: 8, padding: 10 }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                                                        <Radar size={12} color="#FFD700" />
                                                        <span style={{ ...exo, fontSize: 10, color: "#C8D8E8", fontWeight: 700 }}>Model State</span>
                                                    </div>
                                                    <div style={{ ...mono, fontSize: 8, color: "#7A90A8", lineHeight: 1.6 }}>
                                                        {tracking.detected ? "Tracking LEFT corridor." : "Waiting for input media."}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Panel>
                                </div>

                                <Panel
                                    style={{
                                        flex: 1,
                                        display: "flex",
                                        flexDirection: "column",
                                        minWidth: 0,
                                        minHeight: 650,
                                        boxShadow: "0 0 32px rgba(77,166,255,.08), inset 0 0 0 1px rgba(255,255,255,.02)",
                                    }}
                                >
                                    <PTitle
                                        icon={<MapPin size={10} />}
                                        label="4-Way Intersection Traffic Control"
                                        extra={<span style={{ ...mono, fontSize: 9, color: trackedSignalState === "green" ? "#00FFA3" : "#FF6B00" }}>LEFT SIGNAL {trackedSignalState.toUpperCase()}</span>}
                                    />

                                    <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
                                        <div
                                            style={{
                                                position: "absolute",
                                                top: 12,
                                                right: 12,
                                                background: "#08101ACC",
                                                border: "1px solid #1A2D42",
                                                borderRadius: 6,
                                                padding: "8px 12px",
                                                zIndex: 10,
                                                fontSize: 8,
                                                ...mono,
                                            }}
                                        >
                                            <div style={{ color: "#4A6280", marginBottom: 6, fontWeight: 700 }}>LIVE LEGEND</div>
                                            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 10, height: 10, borderRadius: "50%", background: "#FF6B00" }} /><span style={{ color: "#C8D8E8" }}>Tracked Ambulance</span></div>
                                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 10, height: 6, background: "#4DA6FF" }} /><span style={{ color: "#C8D8E8" }}>Normal Vehicles</span></div>
                                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 10, height: 10, borderRadius: "50%", background: "#00FFA3" }} /><span style={{ color: "#C8D8E8" }}>New Green Path</span></div>
                                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 10, height: 10, borderRadius: "50%", background: "#FF6B00" }} /><span style={{ color: "#C8D8E8" }}>Blocked Old Path</span></div>
                                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 10, height: 10, borderRadius: "50%", background: "#B388FF" }} /><span style={{ color: "#C8D8E8" }}>AI Tracking</span></div>
                                            </div>
                                        </div>

                                        <svg viewBox="0 0 600 500" style={{ width: "100%", height: "100%" }} preserveAspectRatio="xMidYMid meet">
                                            <defs>
                                                <filter id="glow">
                                                    <feGaussianBlur stdDeviation="3" result="blur" />
                                                    <feMerge>
                                                        <feMergeNode in="blur" />
                                                        <feMergeNode in="SourceGraphic" />
                                                    </feMerge>
                                                </filter>
                                                <pattern id="bgGrid" width="24" height="24" patternUnits="userSpaceOnUse">
                                                    <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#1A2D42" strokeWidth="1" />
                                                </pattern>
                                                <linearGradient id="roadFillV" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#102131" />
                                                    <stop offset="50%" stopColor="#0D1E2D" />
                                                    <stop offset="100%" stopColor="#102131" />
                                                </linearGradient>
                                                <linearGradient id="roadFillH" x1="0" y1="0" x2="1" y2="0">
                                                    <stop offset="0%" stopColor="#102131" />
                                                    <stop offset="50%" stopColor="#0D1E2D" />
                                                    <stop offset="100%" stopColor="#102131" />
                                                </linearGradient>
                                            </defs>

                                            <rect width="600" height="500" fill="#070D1A" />
                                            <rect x="0" y="0" width="600" height="500" fill="url(#bgGrid)" opacity="0.08" />

                                            <rect x="200" y="0" width="200" height="500" rx="18" fill="url(#roadFillV)" />
                                            <rect x="218" y="0" width="164" height="500" rx="18" fill="#132637" />
                                            <rect x="200" y="0" width="200" height="500" fill="white" opacity="0.04" className="cf-road-sheen" />

                                            <rect x="0" y="150" width="600" height="200" rx="18" fill="url(#roadFillH)" />
                                            <rect x="0" y="168" width="600" height="164" rx="18" fill="#132637" />
                                            <rect x="0" y="150" width="600" height="200" fill="white" opacity="0.04" className="cf-road-sheen" />

                                            <line x1="300" y1="0" x2="300" y2="500" stroke="#1A2D42" strokeWidth="2" strokeDasharray="10,5" />
                                            <line x1="240" y1="0" x2="240" y2="500" stroke="#1A3547" strokeWidth="1" />
                                            <line x1="360" y1="0" x2="360" y2="500" stroke="#1A3547" strokeWidth="1" />
                                            <line x1="0" y1="250" x2="600" y2="250" stroke="#1A2D42" strokeWidth="2" strokeDasharray="10,5" />
                                            <line x1="0" y1="190" x2="600" y2="190" stroke="#1A3547" strokeWidth="1" />
                                            <line x1="0" y1="310" x2="600" y2="310" stroke="#1A3547" strokeWidth="1" />

                                            <path
                                                d="M 20 250 L 230 250"
                                                fill="none"
                                                stroke={signals.find((s) => s.direction === "west")?.state === "red" ? "#FF6B00" : "#FFD700"}
                                                strokeWidth="6"
                                                className="cf-path-flow"
                                                opacity="0.95"
                                            />
                                            <path
                                                d="M 300 250 L 300 80"
                                                fill="none"
                                                stroke={signals.find((s) => s.direction === "north")?.state === "green" ? "#00FFA3" : "#B388FF"}
                                                strokeWidth="6"
                                                className="cf-path-flow cf-green-glow"
                                                opacity="0.95"
                                            />
                                            <path d="M 300 250 L 560 250" fill="none" stroke="#2A3D52" strokeWidth="3" opacity="0.5" />
                                            <path d="M 300 250 L 300 460" fill="none" stroke="#2A3D52" strokeWidth="3" opacity="0.5" />

                                            {(["north", "south", "east", "west"] as Dir[]).map((dir) => {
                                                const signal = signals.find((s) => s.direction === dir)?.state ?? "red";
                                                const fill = getSignalBgColor(signal);

                                                if (dir === "north") {
                                                    return (
                                                        <g key={dir}>
                                                            <rect x="275" y="40" width="50" height="60" rx="4" fill="#0B1522" />
                                                            <circle cx="285" cy="55" r="6" fill={fill} className={signal === "green" ? "cf-green-glow" : signal === "red" ? "cf-red-alert" : ""} />
                                                            <circle cx="300" cy="55" r="6" fill="#2A3D52" />
                                                            <circle cx="315" cy="55" r="6" fill="#2A3D52" />
                                                            <text x="300" y="85" textAnchor="middle" fontSize="10" fill="#4A6280" fontFamily="monospace">
                                                                N
                                                            </text>
                                                        </g>
                                                    );
                                                }

                                                if (dir === "south") {
                                                    return (
                                                        <g key={dir}>
                                                            <rect x="275" y="400" width="50" height="60" rx="4" fill="#0B1522" />
                                                            <circle cx="285" cy="415" r="6" fill={fill} className={signal === "green" ? "cf-green-glow" : signal === "red" ? "cf-red-alert" : ""} />
                                                            <circle cx="300" cy="415" r="6" fill="#2A3D52" />
                                                            <circle cx="315" cy="415" r="6" fill="#2A3D52" />
                                                            <text x="300" y="450" textAnchor="middle" fontSize="10" fill="#4A6280" fontFamily="monospace">
                                                                S
                                                            </text>
                                                        </g>
                                                    );
                                                }

                                                if (dir === "east") {
                                                    return (
                                                        <g key={dir}>
                                                            <rect x="500" y="225" width="60" height="50" rx="4" fill="#0B1522" />
                                                            <circle cx="515" cy="235" r="6" fill={fill} className={signal === "green" ? "cf-green-glow" : signal === "red" ? "cf-red-alert" : ""} />
                                                            <circle cx="515" cy="250" r="6" fill="#2A3D52" />
                                                            <circle cx="515" cy="265" r="6" fill="#2A3D52" />
                                                            <text x="545" y="255" textAnchor="middle" fontSize="10" fill="#4A6280" fontFamily="monospace">
                                                                E
                                                            </text>
                                                        </g>
                                                    );
                                                }

                                                return (
                                                    <g key={dir}>
                                                        <rect x="-10" y="225" width="60" height="50" rx="4" fill="#0B1522" />
                                                        <circle cx="15" cy="235" r="6" fill={fill} className={signal === "green" ? "cf-green-glow" : signal === "red" ? "cf-red-alert" : ""} />
                                                        <circle cx="15" cy="250" r="6" fill="#2A3D52" />
                                                        <circle cx="15" cy="265" r="6" fill="#2A3D52" />
                                                        <text x="25" y="255" textAnchor="middle" fontSize="10" fill="#4A6280" fontFamily="monospace">
                                                            W
                                                        </text>
                                                    </g>
                                                );
                                            })}

                                            {vehicles.map((vehicle) => {
                                                const isHorizontal = vehicle.direction === "east" || vehicle.direction === "west";
                                                const width = isHorizontal ? 24 : 15;
                                                const height = isHorizontal ? 15 : 24;
                                                return (
                                                    <g key={vehicle.id}>
                                                        <rect x={vehicle.x - width / 2} y={vehicle.y - height / 2} width={width} height={height} rx="3" fill={vehicle.color} opacity={vehicle.stopped ? 0.42 : 0.92} filter="url(#glow)" />
                                                        <rect x={vehicle.x - width / 2 + 2} y={vehicle.y - height / 2 + 2} width={width - 4} height={height - 4} rx="2" fill="#173045" opacity={vehicle.stopped ? 0.35 : 0.78} />
                                                        <rect x={vehicle.x - width / 2 + 4} y={vehicle.y - height / 2 + 4} width={width - 8} height={height - 8} rx="2" fill="#0B1522" opacity="0.35" />
                                                        {vehicle.stopped && <circle cx={vehicle.x} cy={vehicle.y - 14} r="3" fill="#FF6B00" className="cf-stop-pulse" />}
                                                    </g>
                                                );
                                            })}

                                            <g className={ambulanceActive ? "cf-siren" : ""}>
                                                <circle cx={ambulanceX} cy={ambulanceY} r="22" fill="#FF6B00" opacity="0.14" filter="url(#glow)" />
                                                <circle cx={ambulanceX} cy={ambulanceY} r="30" fill="#FF6B00" opacity="0.05" filter="url(#glow)" />
                                                <rect x={ambulanceX - 15} y={ambulanceY - 11} width="30" height="22" rx="4" fill="#FF6B00" />
                                                <rect x={ambulanceX - 10} y={ambulanceY - 7} width="20" height="11" rx="2" fill="#173045" opacity="0.78" />
                                                <circle cx={ambulanceX - 8} cy={ambulanceY - 10} r="3" fill="#FF3B5C" />
                                                <circle cx={ambulanceX + 8} cy={ambulanceY - 10} r="3" fill="#4DA6FF" />
                                                <circle cx={ambulanceX - 8} cy={ambulanceY + 12} r="3" fill="#0F1E2E" />
                                                <circle cx={ambulanceX + 8} cy={ambulanceY + 12} r="3" fill="#0F1E2E" />
                                                <line x1={ambulanceX - 2} y1={ambulanceY - 5} x2={ambulanceX - 2} y2={ambulanceY + 5} stroke="white" strokeWidth="1.2" />
                                                <line x1={ambulanceX - 6} y1={ambulanceY} x2={ambulanceX + 2} y2={ambulanceY} stroke="white" strokeWidth="1.2" />
                                            </g>

                                            <g>
                                                <rect x="280" y="20" width="40" height="40" rx="4" fill="#00FFA312" stroke="#00FFA355" strokeWidth="1.5" />
                                                <rect x="298" y="30" width="4" height="20" fill="#00FFA3" />
                                                <rect x="288" y="40" width="24" height="4" fill="#00FFA3" />
                                                <text x="300" y="68" textAnchor="middle" fontSize="9" fill="#00FFA3" fontFamily="monospace" fontWeight="bold">
                                                    SAFE EXIT
                                                </text>
                                            </g>

                                            <circle cx="300" cy="250" r="28" fill="#FFD700" opacity="0.12" className="cf-junction-pulse" />
                                            <circle cx="300" cy="250" r="52" fill="#00FFA3" opacity={ambulanceActive ? 0.04 : 0} className="cf-junction-pulse" />
                                            <circle cx="300" cy="250" r="3" fill="#FFD700" opacity="0.65" />

                                            <text x="300" y="468" textAnchor="middle" fontSize="11" fill="#B388FF" fontFamily="monospace" fontWeight="bold">
                                                SOURCE: {tracking.sourceType.toUpperCase()} • VEHICLES HALT • LEFT RED • NORTH GREEN • AI REROUTE
                                            </text>
                                            <text x="300" y="488" textAnchor="middle" fontSize="11" fill="#00FFA3" fontFamily="monospace" fontWeight="bold">
                                                {ambulanceActive ? "🚨 SMART AI TRAFFIC SYSTEM • AMBULANCE MOVES FIRST • OTHER VEHICLES STOP" : "✓ NORMAL TRAFFIC FLOW • TRACKER READY"}
                                            </text>
                                        </svg>
                                    </div>
                                </Panel>

                                <div
                                    style={{
                                        width: 290,
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 10,
                                        flexShrink: 0,
                                    }}
                                >
                                    <Panel style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 260 }}>
                                        <PTitle icon={<Bell size={10} />} label="Activity Log" />
                                        <div
                                            style={{
                                                flex: 1,
                                                overflow: "auto",
                                                padding: 6,
                                                display: "flex",
                                                flexDirection: "column",
                                                gap: 3,
                                            }}
                                        >
                                            {alerts.map((a, i) => (
                                                <div
                                                    key={a.id}
                                                    className={i === 0 ? "cf-fadein" : ""}
                                                    style={{
                                                        padding: "6px 8px",
                                                        borderLeft: `2px solid ${ALERT_C[a.type]}`,
                                                        background: "#060C15",
                                                        borderRadius: "0 4px 4px 0",
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            ...mono,
                                                            fontSize: 8,
                                                            color: "#4A6280",
                                                            marginBottom: 2,
                                                        }}
                                                    >
                                                        {a.t}
                                                    </div>
                                                    <div
                                                        style={{
                                                            fontSize: 9,
                                                            color: "#7A90A8",
                                                            ...exo,
                                                            lineHeight: 1.3,
                                                        }}
                                                    >
                                                        {a.msg}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </Panel>

                                    <Panel>
                                        <PTitle icon={<BarChart2 size={10} />} label="Live Statistics" />
                                        <div
                                            style={{
                                                padding: "10px 12px",
                                                display: "flex",
                                                flexDirection: "column",
                                                gap: 8,
                                            }}
                                        >
                                            {[
                                                ["Vehicles Tracked", vehicles.length.toString(), "#4DA6FF"],
                                                ["Stopped Vehicles", stoppedVehicles.toString(), "#FF6B00"],
                                                ["Moving Vehicles", movingVehicles.toString(), "#00FFA3"],
                                                ["Tracking Confidence", `${tracking.confidence.toFixed(0)}%`, "#B388FF"],
                                            ].map(([label, val, color]) => (
                                                <div
                                                    key={label}
                                                    style={{
                                                        display: "flex",
                                                        justifyContent: "space-between",
                                                        alignItems: "center",
                                                        fontSize: 10,
                                                        paddingBottom: 6,
                                                        borderBottom: "1px solid #101822",
                                                    }}
                                                >
                                                    <span style={{ color: "#4A6280" }}>{label}</span>
                                                    <span
                                                        style={{
                                                            ...mono,
                                                            color,
                                                            fontWeight: 700,
                                                            fontSize: 12,
                                                        }}
                                                    >
                                                        {val}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </Panel>

                                    <Panel>
                                        <PTitle icon={<Shield size={10} />} label="System Health" />
                                        <div
                                            style={{
                                                padding: "10px 12px",
                                                display: "flex",
                                                flexDirection: "column",
                                                gap: 7,
                                            }}
                                        >
                                            {[
                                                ["Signal Control", true, "ACTIVE"],
                                                ["Vehicle Detection", true, "ONLINE"],
                                                ["Media Tracker", tracking.detected, tracking.detected ? "LOCKED" : "WAITING"],
                                                ["Emergency Protocol", ambulanceActive, ambulanceActive ? "ENABLED" : "READY"],
                                            ].map(([label, ok, status]) => (
                                                <div
                                                    key={String(label)}
                                                    style={{
                                                        display: "flex",
                                                        justifyContent: "space-between",
                                                        alignItems: "center",
                                                    }}
                                                >
                                                    <span style={{ fontSize: 10, color: "#4A6280", ...exo }}>{label as string}</span>
                                                    <span
                                                        style={{
                                                            ...mono,
                                                            fontSize: 9,
                                                            color: ok ? "#00FFA3" : "#FF6B0065",
                                                        }}
                                                    >
                                                        {ok ? "●" : "○"} {status as string}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </Panel>

                                    <Panel>
                                        <PTitle icon={<Cpu size={10} />} label="4-Way Backend Analysis" />
                                        <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                                            {[
                                                { label: "North", setter: setNorthFile, file: northFile },
                                                { label: "South", setter: setSouthFile, file: southFile },
                                                { label: "East", setter: setEastFile, file: eastFile },
                                                { label: "West", setter: setWestFile, file: westFile },
                                            ].map(({ label, setter, file }) => (
                                                <div key={label} style={{ background: "#060C15", border: "1px solid #1A2D42", borderRadius: 6, padding: 8 }}>
                                                    <div style={{ ...exo, fontSize: 10, color: "#4A6280", marginBottom: 4 }}>{label} Camera</div>
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(e) => setter(e.target.files?.[0] ?? null)}
                                                        style={{ width: "100%", color: "#C8D8E8", fontSize: 10 }}
                                                    />
                                                    <div style={{ ...mono, fontSize: 8, color: file ? "#00FFA3" : "#FF6B00", marginTop: 4 }}>
                                                        {file ? file.name : "No file selected"}
                                                    </div>
                                                </div>
                                            ))}

                                            <button
                                                onClick={handleAnalyzeIntersection}
                                                disabled={isAnalyzing}
                                                style={{
                                                    background: isAnalyzing ? "#1A2D42" : "linear-gradient(135deg,#FF6B00,#FF3B5C)",
                                                    border: "none",
                                                    color: "white",
                                                    padding: "10px 12px",
                                                    borderRadius: 8,
                                                    cursor: isAnalyzing ? "not-allowed" : "pointer",
                                                    ...exo,
                                                    fontWeight: 700,
                                                    fontSize: 11,
                                                }}
                                            >
                                                {isAnalyzing ? "ANALYZING..." : "ANALYZE 4-WAY INPUTS"}
                                            </button>

                                            {analyzeError && <div style={{ color: "#FF6B00", fontSize: 9, ...mono }}>{analyzeError}</div>}

                                            {analyzeResult && (
                                                <div style={{ background: "#060C15", border: "1px solid #1A2D42", borderRadius: 6, padding: 10 }}>
                                                    <div style={{ ...exo, fontSize: 11, color: "#00FFA3", marginBottom: 6 }}>Analysis Result</div>
                                                    <div style={{ ...mono, fontSize: 8, color: "#C8D8E8", lineHeight: 1.8 }}>
                                                        <div>Mode: {analyzeResult.mode}</div>
                                                        <div>Reason: {analyzeResult.reason}</div>
                                                        <div>Intersection: {analyzeResult.intersection_id}</div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </Panel>
                                </div>
                            </div>
                        )}
                    </div>

                    <div style={{ display: "flex", gap: 8, padding: "0 10px 10px", flexShrink: 0 }}>
                        {[
                            {
                                icon: <Clock size={14} />,
                                label: "API LATENCY",
                                val: `${metrics.lat}ms`,
                                sub: "< 200ms OPTIMAL",
                                color: "#4DA6FF",
                            },
                            {
                                icon: <Activity size={14} />,
                                label: "VEHICLES TRACKED",
                                val: vehicles.length.toString(),
                                sub: "REAL-TIME MONITORING",
                                color: "#00FFA3",
                            },
                            {
                                icon: <Zap size={14} />,
                                label: "SIGNAL OVERRIDES",
                                val: `${metrics.overrides}`,
                                sub: "LEFT TO NORTH REROUTE",
                                color: "#FF6B00",
                            },
                            {
                                icon: <Eye size={14} />,
                                label: "TRACK SOURCE",
                                val: tracking.sourceType.toUpperCase(),
                                sub: tracking.sourceName,
                                color: "#B388FF",
                            },
                            {
                                icon: <Shield size={14} />,
                                label: "RESPONSE TIME",
                                val: `${(metrics.lat * 0.5) | 0}ms`,
                                sub: "SIGNAL ACTIVATION",
                                color: "#00FFA3",
                            },
                        ].map(({ icon, label, val, sub, color }) => (
                            <div
                                key={label}
                                style={{
                                    flex: 1,
                                    background: "#0B1522",
                                    border: "1px solid #1A2D42",
                                    borderRadius: 8,
                                    padding: "8px 12px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 9,
                                }}
                            >
                                <div style={{ color, opacity: 0.55, flexShrink: 0 }}>{icon}</div>
                                <div style={{ minWidth: 0 }}>
                                    <div
                                        style={{
                                            ...exo,
                                            fontSize: 8,
                                            letterSpacing: 1.5,
                                            textTransform: "uppercase",
                                            color: "#3A5066",
                                            fontWeight: 700,
                                            marginBottom: 1,
                                        }}
                                    >
                                        {label}
                                    </div>
                                    <div
                                        style={{
                                            ...mono,
                                            fontSize: 18,
                                            color,
                                            lineHeight: 1,
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        {val}
                                    </div>
                                    <div
                                        style={{
                                            ...mono,
                                            fontSize: 8,
                                            color: "#203040",
                                            marginTop: 1,
                                            letterSpacing: 1,
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        {sub}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}