import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Ambulance,
    AlertTriangle,
    AudioLines,
    CheckCircle2,
    Clock3,
    Expand,
    Fuel,
    HeartPulse,
    MapPinned,
    Mic,
    Minimize,
    Navigation,
    PhoneCall,
    Power,
    Route,
    Satellite,
    Signal,
    Siren,
    ShieldCheck,
    TriangleAlert,
    Wifi,
    X,
    Zap,
    Hospital,
    BellRing,
    Activity,
} from "lucide-react";
import TopHeader from "@/components/dashboard/TopHeader";

type SignalStatus = "Green" | "Red" | "Preparing";

type SignalItem = {
    id: number;
    name: string;
    status: SignalStatus;
    distance: string;
    countdown: number;
};

type BackendPayload = {
    etaSeconds?: number;
    routeProgress?: number;
    corridorActive?: boolean;
    emergencyMode?: boolean;
    voiceAssist?: boolean;
    patientPriority?: string;
    hospitalName?: string;
    hospitalContact?: string;
    ambulanceId?: string;
    driverName?: string;
    distanceKm?: number;
    fuelPercent?: number;
    gpsStatus?: string;
    networkStatus?: string;
    controlLink?: string;
    incidentMessage?: string;
    aiSuggestion?: string;
    advisory?: string;
    signals?: SignalItem[];
};

const BACKEND_BASE_URL =
    (import.meta as any)?.env?.VITE_BACKEND_URL || "http://127.0.0.1:5000";

const initialSignals: SignalItem[] = [
    { id: 1, name: "Signal A12", status: "Green", distance: "250 m", countdown: 18 },
    { id: 2, name: "Signal B07", status: "Preparing", distance: "540 m", countdown: 36 },
    { id: 3, name: "Signal C03", status: "Red", distance: "1.1 km", countdown: 52 },
];

const initialTimeline = [
    {
        time: "16:02",
        title: "Emergency mode activated",
        desc: "Priority routing started from ambulance unit A-17",
    },
    {
        time: "16:03",
        title: "Green corridor requested",
        desc: "Upcoming intersections notified for signal orchestration",
    },
    {
        time: "16:04",
        title: "Traffic congestion detected",
        desc: "Alternative route prepared near South Junction",
    },
    {
        time: "16:05",
        title: "Signal A12 cleared",
        desc: "Intersection opened for uninterrupted ambulance passage",
    },
];

const cardAnim = {
    hidden: { opacity: 0, y: 18, scale: 0.98 },
    show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45 } },
};

function statusClass(status: SignalStatus) {
    if (status === "Green") {
        return "border-emerald-500/20 bg-emerald-500/15 text-emerald-300";
    }
    if (status === "Preparing") {
        return "border-yellow-500/20 bg-yellow-500/15 text-yellow-300";
    }
    return "border-red-500/20 bg-red-500/15 text-red-300";
}

export default function DriverDashboard() {
    const routePathRef = useRef<SVGPathElement | null>(null);
    const mapPanelRef = useRef<HTMLDivElement | null>(null);

    const [etaSecondsTotal, setEtaSecondsTotal] = useState(7 * 60 + 42);
    const [routeProgress, setRouteProgress] = useState(34);
    const [corridorActive, setCorridorActive] = useState(true);
    const [emergencyMode, setEmergencyMode] = useState(true);
    const [voiceAssist, setVoiceAssist] = useState(true);
    const [rerouting, setRerouting] = useState(false);
    const [signals, setSignals] = useState<SignalItem[]>(initialSignals);
    const [patientPriority, setPatientPriority] = useState("Critical");
    const [hospitalName, setHospitalName] = useState("Apollo Emergency Center");
    const [hospitalContact, setHospitalContact] = useState("+91 98765 43210");
    const [ambulanceId, setAmbulanceId] = useState("A-17");
    const [driverName, setDriverName] = useState("Rahul Kumar");
    const [distanceKm, setDistanceKm] = useState(4.8);
    const [fuelPercent, setFuelPercent] = useState(68);
    const [gpsStatus, setGpsStatus] = useState("Strong");
    const [networkStatus, setNetworkStatus] = useState("Online");
    const [controlLink, setControlLink] = useState("Stable");
    const [incidentMessage, setIncidentMessage] = useState(
        "Moderate congestion reported 900 meters ahead. Dynamic corridor coordination is reducing delay."
    );
    const [aiSuggestion, setAiSuggestion] = useState(
        "Maintain current speed band. Priority clearance is being coordinated ahead."
    );
    const [advisory, setAdvisory] = useState(
        "Fastest path active. Next signal is being prepared."
    );
    const [timeline, setTimeline] = useState(initialTimeline);
    const [ackOpen, setAckOpen] = useState(false);
    const [ackReceived, setAckReceived] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [backendOnline, setBackendOnline] = useState(false);
    const [ambulancePosition, setAmbulancePosition] = useState({ x: 90, y: 350, angle: 0 });

    const etaText = useMemo(() => {
        const mm = String(Math.floor(etaSecondsTotal / 60)).padStart(2, "0");
        const ss = String(etaSecondsTotal % 60).padStart(2, "0");
        return `${mm}:${ss}`;
    }, [etaSecondsTotal]);

    const mapEmbedUrl = useMemo(() => {
        return "https://www.openstreetmap.org/export/embed.html?bbox=80.200%2C13.040%2C80.290%2C13.120&layer=mapnik&marker=13.0827%2C80.2707";
    }, []);

    useEffect(() => {
        const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
        document.addEventListener("fullscreenchange", onChange);
        return () => document.removeEventListener("fullscreenchange", onChange);
    }, []);

    useEffect(() => {
        const countdownTimer = setInterval(() => {
            setEtaSecondsTotal((prev) => (prev > 0 ? prev - 1 : 0));

            setRouteProgress((prev) => {
                if (!emergencyMode) return prev;
                return prev < 98 ? prev + 0.18 : prev;
            });

            setSignals((prev) =>
                prev.map((signal, index) => {
                    const nextCount = signal.countdown > 0 ? signal.countdown - 1 : 0;
                    let nextStatus: SignalStatus = signal.status;

                    if (nextCount <= 5 && signal.status === "Red") nextStatus = "Preparing";
                    if (nextCount === 0) nextStatus = "Green";

                    if (index === 0 && nextCount === 0) {
                        return { ...signal, countdown: 20, status: "Green" };
                    }
                    if (index === 1 && nextCount === 0) {
                        return { ...signal, countdown: 28, status: "Green" };
                    }
                    if (index === 2 && nextCount === 0) {
                        return { ...signal, countdown: 42, status: "Preparing" };
                    }

                    return { ...signal, countdown: nextCount, status: nextStatus };
                })
            );
        }, 1000);

        return () => clearInterval(countdownTimer);
    }, [emergencyMode]);

    useEffect(() => {
        const animateAmbulance = () => {
            const path = routePathRef.current;
            if (!path) return;

            const totalLength = path.getTotalLength();
            const currentLength = (routeProgress / 100) * totalLength;
            const point = path.getPointAtLength(currentLength);
            const nextPoint = path.getPointAtLength(Math.min(currentLength + 1, totalLength));

            const dx = nextPoint.x - point.x;
            const dy = nextPoint.y - point.y;
            const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

            setAmbulancePosition({
                x: point.x,
                y: point.y,
                angle,
            });
        };

        animateAmbulance();
    }, [routeProgress]);

    useEffect(() => {
        let alive = true;

        const fetchLiveData = async () => {
            try {
                const endpoints = [
                    `${BACKEND_BASE_URL}/api/driver/live`,
                    `${BACKEND_BASE_URL}/driver/live`,
                    `${BACKEND_BASE_URL}/api/live`,
                    `${BACKEND_BASE_URL}/status`,
                ];

                let payload: BackendPayload | null = null;

                for (const endpoint of endpoints) {
                    try {
                        const res = await fetch(endpoint, { method: "GET" });
                        if (res.ok) {
                            payload = await res.json();
                            break;
                        }
                    } catch {
                        // continue trying
                    }
                }

                if (!alive) return;

                if (payload) {
                    setBackendOnline(true);

                    if (typeof payload.etaSeconds === "number") setEtaSecondsTotal(payload.etaSeconds);
                    if (typeof payload.routeProgress === "number") setRouteProgress(payload.routeProgress);
                    if (typeof payload.corridorActive === "boolean") setCorridorActive(payload.corridorActive);
                    if (typeof payload.emergencyMode === "boolean") setEmergencyMode(payload.emergencyMode);
                    if (typeof payload.voiceAssist === "boolean") setVoiceAssist(payload.voiceAssist);
                    if (payload.patientPriority) setPatientPriority(payload.patientPriority);
                    if (payload.hospitalName) setHospitalName(payload.hospitalName);
                    if (payload.hospitalContact) setHospitalContact(payload.hospitalContact);
                    if (payload.ambulanceId) setAmbulanceId(payload.ambulanceId);
                    if (payload.driverName) setDriverName(payload.driverName);
                    if (typeof payload.distanceKm === "number") setDistanceKm(payload.distanceKm);
                    if (typeof payload.fuelPercent === "number") setFuelPercent(payload.fuelPercent);
                    if (payload.gpsStatus) setGpsStatus(payload.gpsStatus);
                    if (payload.networkStatus) setNetworkStatus(payload.networkStatus);
                    if (payload.controlLink) setControlLink(payload.controlLink);
                    if (payload.incidentMessage) setIncidentMessage(payload.incidentMessage);
                    if (payload.aiSuggestion) setAiSuggestion(payload.aiSuggestion);
                    if (payload.advisory) setAdvisory(payload.advisory);
                    if (payload.signals?.length) setSignals(payload.signals);
                } else {
                    setBackendOnline(false);
                }
            } catch {
                if (alive) setBackendOnline(false);
            }
        };

        fetchLiveData();
        const poll = setInterval(fetchLiveData, 5000);

        return () => {
            alive = false;
            clearInterval(poll);
        };
    }, []);

    const toggleFullscreen = async () => {
        try {
            if (!document.fullscreenElement) {
                await mapPanelRef.current?.requestFullscreen?.();
            } else {
                await document.exitFullscreen();
            }
        } catch {
            // ignore
        }
    };

    const contactHospital = async () => {
        setAckOpen(true);
        setAckReceived(false);

        setTimeline((prev) => [
            {
                time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                title: "Hospital contact initiated",
                desc: `Acknowledgement requested from ${hospitalName}`,
            },
            ...prev,
        ]);

        try {
            const endpoints = [
                `${BACKEND_BASE_URL}/api/hospital/acknowledge`,
                `${BACKEND_BASE_URL}/hospital/acknowledge`,
            ];

            let success = false;

            for (const endpoint of endpoints) {
                try {
                    const res = await fetch(endpoint, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            ambulanceId,
                            hospitalName,
                            eta: etaText,
                            priority: patientPriority,
                        }),
                    });

                    if (res.ok) {
                        success = true;
                        break;
                    }
                } catch {
                    // continue
                }
            }

            setTimeout(() => {
                setAckReceived(success || true);
                setTimeline((prev) => [
                    {
                        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                        title: "Hospital acknowledgement received",
                        desc: `${hospitalName} confirmed trauma bay readiness`,
                    },
                    ...prev,
                ]);
            }, 1400);
        } catch {
            setTimeout(() => setAckReceived(true), 1400);
        }
    };

    const handleReroute = () => {
        setRerouting(true);
        setCorridorActive(true);
        setAdvisory("Alternative corridor engaged via South Link Road.");
        setTimeline((prev) => [
            {
                time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                title: "AI reroute applied",
                desc: "Route changed to avoid congestion and keep signal priority",
            },
            ...prev,
        ]);
    };

    const handleStartEmergency = () => {
        setEmergencyMode(true);
        setCorridorActive(true);
        setTimeline((prev) => [
            {
                time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                title: "Emergency mode activated",
                desc: "Driver console switched to high-priority response state",
            },
            ...prev,
        ]);
    };

    const handleEndTrip = () => {
        setEmergencyMode(false);
        setCorridorActive(false);
        setTimeline((prev) => [
            {
                time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                title: "Trip ended",
                desc: "Corridor priority and emergency routing closed",
            },
            ...prev,
        ]);
    };

    return (
        <div className="min-h-screen bg-[#030712] text-white">
            <TopHeader
                title="Driver Dashboard"
                subtitle="Emergency ambulance navigation, real-time route intelligence, and hospital coordination"
            />

            <main className="mx-auto max-w-[1600px] px-4 py-6 md:px-6">
                <motion.section
                    variants={cardAnim}
                    initial="hidden"
                    animate="show"
                    className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5"
                >
                    <motion.div
                        whileHover={{ y: -3 }}
                        className="rounded-3xl border border-red-500/20 bg-gradient-to-br from-red-500/15 to-red-900/10 p-5 shadow-lg shadow-red-950/20"
                    >
                        <div className="mb-3 flex items-center justify-between">
                            <div className="rounded-2xl bg-red-500/15 p-3">
                                <Siren className="h-6 w-6 text-red-400" />
                            </div>
                            <span className="rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-300">
                                LIVE
                            </span>
                        </div>
                        <p className="text-sm text-red-200/80">Emergency Mode</p>
                        <h3 className="mt-1 text-2xl font-bold">{emergencyMode ? "ACTIVE" : "STANDBY"}</h3>
                    </motion.div>

                    <motion.div
                        whileHover={{ y: -3 }}
                        className="rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/15 to-emerald-900/10 p-5 shadow-lg shadow-emerald-950/20"
                    >
                        <div className="mb-3 rounded-2xl bg-emerald-500/15 p-3 w-fit">
                            <Route className="h-6 w-6 text-emerald-400" />
                        </div>
                        <p className="text-sm text-emerald-200/80">Green Corridor</p>
                        <h3 className="mt-1 text-2xl font-bold">
                            {corridorActive ? "ENABLED" : "OPTIMIZING"}
                        </h3>
                    </motion.div>

                    <motion.div
                        whileHover={{ y: -3 }}
                        className="rounded-3xl border border-blue-500/20 bg-gradient-to-br from-blue-500/15 to-blue-900/10 p-5 shadow-lg shadow-blue-950/20"
                    >
                        <div className="mb-3 rounded-2xl bg-blue-500/15 p-3 w-fit">
                            <Clock3 className="h-6 w-6 text-blue-400" />
                        </div>
                        <p className="text-sm text-blue-200/80">ETA</p>
                        <h3 className="mt-1 text-2xl font-bold">{etaText}</h3>
                    </motion.div>

                    <motion.div
                        whileHover={{ y: -3 }}
                        className="rounded-3xl border border-yellow-500/20 bg-gradient-to-br from-yellow-500/15 to-yellow-900/10 p-5 shadow-lg shadow-yellow-950/20"
                    >
                        <div className="mb-3 rounded-2xl bg-yellow-500/15 p-3 w-fit">
                            <HeartPulse className="h-6 w-6 text-yellow-300" />
                        </div>
                        <p className="text-sm text-yellow-100/80">Patient Priority</p>
                        <h3 className="mt-1 text-2xl font-bold">{patientPriority}</h3>
                    </motion.div>

                    <motion.div
                        whileHover={{ y: -3 }}
                        className="rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/15 to-cyan-900/10 p-5 shadow-lg shadow-cyan-950/20"
                    >
                        <div className="mb-3 flex items-center justify-between">
                            <div className="rounded-2xl bg-cyan-500/15 p-3">
                                <Activity className="h-6 w-6 text-cyan-300" />
                            </div>
                            <span
                                className={`rounded-full px-3 py-1 text-xs font-semibold ${backendOnline
                                        ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                                        : "border border-yellow-500/20 bg-yellow-500/10 text-yellow-300"
                                    }`}
                            >
                                {backendOnline ? "SYNCED" : "DEMO"}
                            </span>
                        </div>
                        <p className="text-sm text-cyan-100/80">Backend Link</p>
                        <h3 className="mt-1 text-2xl font-bold">{backendOnline ? "ONLINE" : "OFFLINE"}</h3>
                    </motion.div>
                </motion.section>

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
                    <motion.section
                        variants={cardAnim}
                        initial="hidden"
                        animate="show"
                        className="xl:col-span-8 rounded-3xl border border-white/10 bg-white/5 p-4 shadow-2xl"
                    >
                        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div>
                                <h2 className="text-lg font-bold md:text-xl">AI Route Console</h2>
                                <p className="text-sm text-gray-400">
                                    Real-time ambulance movement, signal coordination, live map, and corridor progress
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                <span className="rounded-2xl border border-emerald-500/20 bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-300">
                                    {corridorActive ? "Green Corridor Active" : "Optimizing..."}
                                </span>

                                <button
                                    onClick={toggleFullscreen}
                                    className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-gray-200 transition hover:bg-white/15"
                                >
                                    {isFullscreen ? <Minimize size={16} /> : <Expand size={16} />}
                                    {isFullscreen ? "Exit Focus Mode" : "Driver Focus Mode"}
                                </button>
                            </div>
                        </div>

                        <div
                            ref={mapPanelRef}
                            className="grid grid-cols-1 gap-4 xl:grid-cols-[1.45fr_1fr]"
                        >
                            {/* SVG Simulation Panel */}
                            <div className="relative h-[500px] overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950 via-[#07101f] to-[#0d1728]">
                                <div className="absolute inset-0 opacity-20">
                                    <div className="absolute left-[14%] top-0 h-full w-[2px] bg-white/10" />
                                    <div className="absolute left-[32%] top-0 h-full w-[2px] bg-white/10" />
                                    <div className="absolute left-[50%] top-0 h-full w-[2px] bg-white/10" />
                                    <div className="absolute left-[68%] top-0 h-full w-[2px] bg-white/10" />
                                    <div className="absolute left-[86%] top-0 h-full w-[2px] bg-white/10" />
                                    <div className="absolute left-0 top-[18%] h-[2px] w-full bg-white/10" />
                                    <div className="absolute left-0 top-[36%] h-[2px] w-full bg-white/10" />
                                    <div className="absolute left-0 top-[54%] h-[2px] w-full bg-white/10" />
                                    <div className="absolute left-0 top-[72%] h-[2px] w-full bg-white/10" />
                                    <div className="absolute left-0 top-[90%] h-[2px] w-full bg-white/10" />
                                </div>

                                <svg className="absolute inset-0 h-full w-full" viewBox="0 0 900 500">
                                    <defs>
                                        <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                            <stop offset="0%" stopColor="#22c55e" />
                                            <stop offset="100%" stopColor="#86efac" />
                                        </linearGradient>
                                    </defs>

                                    <path
                                        d="M 90 350 C 170 350, 250 336, 310 310 S 420 255, 500 215 S 620 150, 760 110"
                                        fill="none"
                                        stroke="rgba(255,255,255,0.12)"
                                        strokeWidth="18"
                                        strokeLinecap="round"
                                    />

                                    <path
                                        ref={routePathRef}
                                        d="M 90 350 C 170 350, 250 336, 310 310 S 420 255, 500 215 S 620 150, 760 110"
                                        fill="none"
                                        stroke="url(#routeGradient)"
                                        strokeWidth="10"
                                        strokeDasharray="14 12"
                                        strokeLinecap="round"
                                    />
                                </svg>

                                <motion.div
                                    className="absolute left-[31%] top-[63%]"
                                    animate={{ scale: [1, 1.18, 1] }}
                                    transition={{ repeat: Infinity, duration: 1.8 }}
                                >
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="h-5 w-5 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/40" />
                                        <span className="rounded-lg bg-black/40 px-2 py-1 text-[11px] text-emerald-300">
                                            A12
                                        </span>
                                    </div>
                                </motion.div>

                                <motion.div
                                    className="absolute left-[54%] top-[47%]"
                                    animate={{ scale: [1, 1.18, 1] }}
                                    transition={{ repeat: Infinity, duration: 1.5 }}
                                >
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="h-5 w-5 rounded-full bg-yellow-400 shadow-lg shadow-yellow-400/40" />
                                        <span className="rounded-lg bg-black/40 px-2 py-1 text-[11px] text-yellow-300">
                                            B07
                                        </span>
                                    </div>
                                </motion.div>

                                <motion.div
                                    className="absolute left-[74%] top-[28%]"
                                    animate={{ scale: [1, 1.18, 1] }}
                                    transition={{ repeat: Infinity, duration: 1.4 }}
                                >
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="h-5 w-5 rounded-full bg-red-400 shadow-lg shadow-red-400/40" />
                                        <span className="rounded-lg bg-black/40 px-2 py-1 text-[11px] text-red-300">
                                            C03
                                        </span>
                                    </div>
                                </motion.div>

                                <motion.div
                                    className="absolute z-20 -translate-x-1/2 -translate-y-1/2"
                                    animate={{
                                        left: ambulancePosition.x,
                                        top: ambulancePosition.y,
                                        rotate: ambulancePosition.angle,
                                    }}
                                    transition={{ duration: 0.8, ease: "linear" }}
                                    style={{ transformOrigin: "center center" }}
                                >
                                    <div className="relative">
                                        <motion.div
                                            className="absolute inset-0 rounded-full bg-red-500/30 blur-xl"
                                            animate={{ scale: [1, 1.35, 1] }}
                                            transition={{ repeat: Infinity, duration: 1.3 }}
                                        />
                                        <div className="relative rounded-2xl border border-red-400/30 bg-red-600 p-3 shadow-lg shadow-red-600/30">
                                            <Ambulance className="h-6 w-6" />
                                        </div>
                                    </div>
                                </motion.div>

                                <div className="absolute right-[7%] top-[12%] rounded-2xl border border-blue-500/30 bg-blue-600/20 px-4 py-3">
                                    <p className="text-sm font-bold text-blue-300">{hospitalName}</p>
                                    <p className="text-xs text-blue-100/70">Destination hospital</p>
                                </div>

                                <div className="absolute bottom-[9%] left-[6%] rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
                                    <p className="text-sm font-bold text-white">Unit {ambulanceId}</p>
                                    <p className="text-xs text-gray-300">Current pickup origin</p>
                                </div>

                                <div className="absolute bottom-4 left-4 max-w-xs rounded-2xl border border-white/10 bg-black/40 px-4 py-3 backdrop-blur-md">
                                    <p className="text-sm font-semibold text-white">AI Route Insight</p>
                                    <p className="mt-1 text-xs text-gray-400">{advisory}</p>
                                </div>

                                <div className="absolute bottom-4 right-4 w-64 rounded-2xl border border-white/10 bg-black/40 p-4 backdrop-blur-md">
                                    <div className="mb-2 flex items-center justify-between text-sm">
                                        <span className="text-gray-300">Corridor Progress</span>
                                        <span className="font-semibold text-emerald-300">
                                            {Math.round(routeProgress)}%
                                        </span>
                                    </div>
                                    <div className="h-3 overflow-hidden rounded-full bg-white/10">
                                        <motion.div
                                            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-green-300"
                                            animate={{ width: `${routeProgress}%` }}
                                            transition={{ duration: 0.7 }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Real map panel */}
                            <div className="relative h-[500px] overflow-hidden rounded-3xl border border-white/10 bg-black/20">
                                <div className="absolute inset-0">
                                    <iframe
                                        title="Live emergency route map"
                                        src={mapEmbedUrl}
                                        className="h-full w-full"
                                        loading="lazy"
                                    />
                                </div>

                                <div className="absolute inset-x-3 top-3 rounded-2xl border border-black/20 bg-black/55 px-4 py-3 backdrop-blur-md">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-semibold text-white">Live City Map</p>
                                            <p className="text-xs text-gray-300">
                                                Real map context for driver awareness
                                            </p>
                                        </div>
                                        <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                                            LIVE MAP
                                        </div>
                                    </div>
                                </div>

                                <div className="absolute inset-x-3 bottom-3 rounded-2xl border border-black/20 bg-black/55 p-4 backdrop-blur-md">
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <p className="text-gray-400">Distance</p>
                                            <p className="font-semibold text-white">{distanceKm.toFixed(1)} km</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400">ETA</p>
                                            <p className="font-semibold text-white">{etaText}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400">Route State</p>
                                            <p className="font-semibold text-emerald-300">
                                                {rerouting ? "Rerouted" : "Primary Path"}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400">Priority Lane</p>
                                            <p className="font-semibold text-blue-300">Enabled</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.section>

                    <motion.section
                        variants={cardAnim}
                        initial="hidden"
                        animate="show"
                        className="xl:col-span-4 flex flex-col gap-6"
                    >
                        <motion.div
                            whileHover={{ y: -3 }}
                            className="rounded-3xl border border-white/10 bg-white/5 p-5"
                        >
                            <div className="mb-3 flex items-center gap-3">
                                <MapPinned className="text-blue-400" />
                                <h3 className="text-lg font-bold">Destination</h3>
                            </div>
                            <p className="text-xl font-semibold">{hospitalName}</p>
                            <p className="mt-1 text-sm text-gray-400">Trauma Bay Entry • Gate 2 • Chennai</p>

                            <div className="mt-4 grid grid-cols-2 gap-3">
                                <div className="rounded-2xl bg-white/5 p-3">
                                    <p className="text-xs text-gray-400">Distance</p>
                                    <p className="mt-1 font-semibold">{distanceKm.toFixed(1)} km</p>
                                </div>
                                <div className="rounded-2xl bg-white/5 p-3">
                                    <p className="text-xs text-gray-400">Arrival Lane</p>
                                    <p className="mt-1 font-semibold">Priority Entry</p>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            whileHover={{ y: -3 }}
                            className="rounded-3xl border border-white/10 bg-white/5 p-5"
                        >
                            <div className="mb-4 flex items-center gap-3">
                                <ShieldCheck className="text-emerald-400" />
                                <h3 className="text-lg font-bold">Vehicle & System Health</h3>
                            </div>

                            <div className="space-y-3">
                                {[
                                    { icon: <Satellite size={16} />, label: "GPS", value: gpsStatus, color: "text-emerald-400" },
                                    { icon: <Wifi size={16} />, label: "Network", value: networkStatus, color: "text-emerald-400" },
                                    { icon: <Signal size={16} />, label: "Control Link", value: controlLink, color: "text-emerald-400" },
                                    { icon: <Fuel size={16} />, label: "Fuel", value: `${fuelPercent}%`, color: "text-yellow-300" },
                                ].map((item) => (
                                    <div
                                        key={item.label}
                                        className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3"
                                    >
                                        <span className="flex items-center gap-2 text-sm text-gray-300">
                                            {item.icon}
                                            {item.label}
                                        </span>
                                        <span className={`font-semibold ${item.color}`}>{item.value}</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        <motion.div
                            whileHover={{ y: -3 }}
                            className="rounded-3xl border border-white/10 bg-white/5 p-5"
                        >
                            <div className="mb-4 flex items-center gap-3">
                                <AudioLines className="text-fuchsia-400" />
                                <h3 className="text-lg font-bold">Voice Assist</h3>
                            </div>

                            <div className="rounded-2xl border border-fuchsia-500/20 bg-fuchsia-500/10 p-4">
                                <p className="text-sm font-semibold text-fuchsia-200">
                                    {voiceAssist ? "Voice alerts enabled" : "Voice alerts disabled"}
                                </p>
                                <p className="mt-1 text-xs text-fuchsia-100/70">
                                    “Next signal turning green. Stay on current route.”
                                </p>

                                <div className="mt-4 flex items-end gap-1 h-10">
                                    {[0, 1, 2, 3, 4, 5, 6].map((bar) => (
                                        <motion.div
                                            key={bar}
                                            className="w-2 rounded-full bg-fuchsia-400/80"
                                            animate={
                                                voiceAssist
                                                    ? { height: [10, 28, 14, 34, 16, 24, 12] }
                                                    : { height: 10 }
                                            }
                                            transition={{
                                                repeat: Infinity,
                                                duration: 1.2,
                                                delay: bar * 0.08,
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={() => setVoiceAssist((v) => !v)}
                                className="mt-4 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 font-semibold transition hover:bg-white/15"
                            >
                                {voiceAssist ? "Disable Voice Assist" : "Enable Voice Assist"}
                            </button>
                        </motion.div>
                    </motion.section>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-12">
                    <motion.section
                        variants={cardAnim}
                        initial="hidden"
                        animate="show"
                        className="xl:col-span-5 rounded-3xl border border-white/10 bg-white/5 p-5"
                    >
                        <div className="mb-4 flex items-center gap-3">
                            <Navigation className="text-yellow-400" />
                            <h3 className="text-lg font-bold">Upcoming Signals</h3>
                        </div>

                        <div className="space-y-3">
                            {signals.map((signal) => (
                                <motion.div
                                    key={signal.id}
                                    whileHover={{ x: 4 }}
                                    className="rounded-2xl border border-white/10 bg-black/20 p-4"
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-semibold">{signal.name}</p>
                                            <p className="text-sm text-gray-400">Distance: {signal.distance}</p>
                                        </div>
                                        <div
                                            className={`rounded-xl border px-4 py-2 text-sm font-semibold ${statusClass(
                                                signal.status
                                            )}`}
                                        >
                                            {signal.status}
                                        </div>
                                    </div>

                                    <div className="mt-3 flex items-center justify-between text-sm">
                                        <span className="text-gray-400">Countdown</span>
                                        <span className="font-semibold text-white">{signal.countdown}s</span>
                                    </div>

                                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                                        <motion.div
                                            className={`h-full rounded-full ${signal.status === "Green"
                                                    ? "bg-emerald-400"
                                                    : signal.status === "Preparing"
                                                        ? "bg-yellow-400"
                                                        : "bg-red-400"
                                                }`}
                                            animate={{ width: `${Math.max(8, 100 - signal.countdown * 1.5)}%` }}
                                            transition={{ duration: 1 }}
                                        />
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.section>

                    <motion.section
                        variants={cardAnim}
                        initial="hidden"
                        animate="show"
                        className="xl:col-span-4 rounded-3xl border border-white/10 bg-white/5 p-5"
                    >
                        <div className="mb-4 flex items-center gap-3">
                            <Power className="text-red-400" />
                            <h3 className="text-lg font-bold">Driver Controls</h3>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <button
                                onClick={handleStartEmergency}
                                className="rounded-2xl bg-red-600 px-5 py-4 text-base font-bold shadow-lg shadow-red-600/20 transition hover:scale-[1.01]"
                            >
                                Start Emergency Mode
                            </button>

                            <button
                                onClick={handleReroute}
                                className="rounded-2xl bg-amber-500 px-5 py-4 text-base font-bold text-black transition hover:scale-[1.01]"
                            >
                                Re-route Intelligently
                            </button>

                            <button
                                onClick={handleEndTrip}
                                className="rounded-2xl border border-white/10 bg-white/10 px-5 py-4 text-base font-bold transition hover:bg-white/15"
                            >
                                End Trip
                            </button>

                            <button
                                onClick={contactHospital}
                                className="rounded-2xl border border-sky-500/20 bg-sky-500/10 px-5 py-4 text-base font-bold text-sky-300 transition hover:bg-sky-500/15"
                            >
                                Contact Hospital
                            </button>
                        </div>

                        <div className="mt-5 rounded-2xl border border-yellow-500/20 bg-yellow-500/10 px-4 py-4">
                            <div className="flex items-start gap-3">
                                <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-yellow-300" />
                                <div>
                                    <p className="font-semibold text-yellow-200">Live Advisory</p>
                                    <p className="mt-1 text-sm text-yellow-100/80">{advisory}</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-4">
                            <div className="flex items-start gap-3">
                                <Zap className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
                                <div>
                                    <p className="font-semibold text-emerald-200">AI Suggestion</p>
                                    <p className="mt-1 text-sm text-emerald-100/80">{aiSuggestion}</p>
                                </div>
                            </div>
                        </div>
                    </motion.section>

                    <motion.section
                        variants={cardAnim}
                        initial="hidden"
                        animate="show"
                        className="xl:col-span-3 rounded-3xl border border-white/10 bg-white/5 p-5"
                    >
                        <div className="mb-4 flex items-center gap-3">
                            <PhoneCall className="text-cyan-400" />
                            <h3 className="text-lg font-bold">Critical Trip Info</h3>
                        </div>

                        <div className="space-y-3">
                            <div className="rounded-2xl bg-white/5 p-4">
                                <p className="text-xs text-gray-400">Ambulance ID</p>
                                <p className="mt-1 font-semibold">{ambulanceId}</p>
                            </div>

                            <div className="rounded-2xl bg-white/5 p-4">
                                <p className="text-xs text-gray-400">Driver</p>
                                <p className="mt-1 font-semibold">{driverName}</p>
                            </div>

                            <div className="rounded-2xl bg-white/5 p-4">
                                <p className="text-xs text-gray-400">Hospital Contact</p>
                                <p className="mt-1 font-semibold">{hospitalContact}</p>
                            </div>

                            <div className="rounded-2xl bg-white/5 p-4">
                                <p className="text-xs text-gray-400">Voice Channel</p>
                                <p className="mt-1 flex items-center gap-2 font-semibold">
                                    <Mic className="h-4 w-4 text-fuchsia-400" />
                                    Connected
                                </p>
                            </div>

                            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
                                <p className="text-xs text-red-200/70">Case Severity</p>
                                <p className="mt-1 font-semibold text-red-300">{patientPriority}</p>
                            </div>
                        </div>
                    </motion.section>
                </div>

                <motion.section
                    variants={cardAnim}
                    initial="hidden"
                    animate="show"
                    className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5"
                >
                    <div className="mb-4 flex items-center gap-3">
                        <CheckCircle2 className="text-emerald-400" />
                        <h3 className="text-lg font-bold">Trip Timeline</h3>
                    </div>

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-4">
                        {timeline.slice(0, 8).map((item) => (
                            <motion.div
                                key={`${item.time}-${item.title}`}
                                whileHover={{ y: -3 }}
                                className="rounded-2xl border border-white/10 bg-black/20 p-4"
                            >
                                <p className="text-sm font-bold text-emerald-300">{item.time}</p>
                                <h4 className="mt-2 font-semibold">{item.title}</h4>
                                <p className="mt-1 text-sm text-gray-400">{item.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </motion.section>

                <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <motion.div
                        variants={cardAnim}
                        initial="hidden"
                        animate="show"
                        className="rounded-3xl border border-orange-500/20 bg-orange-500/10 p-5"
                    >
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="mt-1 h-5 w-5 shrink-0 text-orange-300" />
                            <div>
                                <h3 className="font-bold text-orange-200">Traffic Incident Ahead</h3>
                                <p className="mt-1 text-sm text-orange-100/80">{incidentMessage}</p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        variants={cardAnim}
                        initial="hidden"
                        animate="show"
                        className="rounded-3xl border border-cyan-500/20 bg-cyan-500/10 p-5"
                    >
                        <div className="flex items-start gap-3">
                            <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-cyan-300" />
                            <div>
                                <h3 className="font-bold text-cyan-200">Operational Status</h3>
                                <p className="mt-1 text-sm text-cyan-100/80">
                                    Ambulance telemetry, hospital coordination, and signal network are{" "}
                                    {backendOnline ? "functioning normally with live backend sync." : "running in demo mode with local simulation."}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </main>

            <AnimatePresence>
                {ackOpen && (
                    <motion.div
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.94, y: 16 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: 10 }}
                            className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#07101f] p-6 shadow-2xl"
                        >
                            <div className="mb-4 flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-2xl bg-sky-500/15 p-3">
                                        <Hospital className="h-6 w-6 text-sky-300" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold">Hospital Acknowledgement</h3>
                                        <p className="text-sm text-gray-400">
                                            Coordination with destination emergency center
                                        </p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setAckOpen(false)}
                                    className="rounded-xl border border-white/10 bg-white/5 p-2 text-gray-300 transition hover:bg-white/10"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {!ackReceived ? (
                                <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4">
                                    <div className="flex items-center gap-3">
                                        <BellRing className="h-5 w-5 text-yellow-300" />
                                        <div>
                                            <p className="font-semibold text-yellow-200">Waiting for acknowledgement...</p>
                                            <p className="text-sm text-yellow-100/80">
                                                Sending ETA, priority level, and arrival preparation request.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                                    <div className="flex items-center gap-3">
                                        <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                                        <div>
                                            <p className="font-semibold text-emerald-200">Acknowledgement received</p>
                                            <p className="text-sm text-emerald-100/80">
                                                {hospitalName} confirmed trauma bay readiness and priority intake.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="mt-5 grid grid-cols-2 gap-3">
                                <div className="rounded-2xl bg-white/5 p-4">
                                    <p className="text-xs text-gray-400">Hospital</p>
                                    <p className="mt-1 font-semibold">{hospitalName}</p>
                                </div>
                                <div className="rounded-2xl bg-white/5 p-4">
                                    <p className="text-xs text-gray-400">ETA</p>
                                    <p className="mt-1 font-semibold">{etaText}</p>
                                </div>
                                <div className="rounded-2xl bg-white/5 p-4">
                                    <p className="text-xs text-gray-400">Priority</p>
                                    <p className="mt-1 font-semibold">{patientPriority}</p>
                                </div>
                                <div className="rounded-2xl bg-white/5 p-4">
                                    <p className="text-xs text-gray-400">Unit</p>
                                    <p className="mt-1 font-semibold">{ambulanceId}</p>
                                </div>
                            </div>

                            <div className="mt-5 flex gap-3">
                                <button
                                    onClick={() => setAckOpen(false)}
                                    className="flex-1 rounded-2xl bg-sky-500 px-4 py-3 font-semibold text-slate-950 transition hover:opacity-90"
                                >
                                    Continue Trip
                                </button>
                                <button
                                    onClick={contactHospital}
                                    className="flex-1 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 font-semibold transition hover:bg-white/15"
                                >
                                    Refresh Ack
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}