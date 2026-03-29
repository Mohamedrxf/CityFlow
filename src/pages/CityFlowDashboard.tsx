import { useState, useEffect, useRef } from "react";
import {
    Navigation, Camera, Bell, Zap, Shield, Activity,
    Clock, Eye, Cpu, Wifi, CheckCircle, ChevronRight, MapPin,
    BarChart2, Settings, AlertTriangle, TrendingUp, PlayCircle,
} from "lucide-react";
import RouteOptimization from "./RouteOptimization";
import EmergencyPriority from "./EmergencyPriority";
import PredictionInsights from "./PredictionInsights";
import SimulationMode from "./SimulationMode";
import AnalyticsDashboard from "./AnalyticsDashboard";
import SettingsPage from "./Settings";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Intersection { id: string; x: number; y: number; }
interface Alert { id: number; t: string; msg: string; type: AlertType; }
interface Metrics { conf: number; lat: number; overrides: number; eta: number; }

type AlertType = "detect" | "route" | "override" | "info" | "move";
type SigState = "active" | "ahead" | "passed" | "off";
type NavPage = "live" | "route" | "emergency" | "prediction" | "simulation" | "analytics" | "settings";

// ─── Constants ────────────────────────────────────────────────────────────────

const INTERSECTIONS: Intersection[] = [
    { id: "A1", x: 95, y: 65 }, { id: "A2", x: 210, y: 65 }, { id: "A3", x: 325, y: 65 }, { id: "A4", x: 440, y: 65 }, { id: "A5", x: 555, y: 65 },
    { id: "B1", x: 95, y: 175 }, { id: "B2", x: 210, y: 175 }, { id: "B3", x: 325, y: 175 }, { id: "B4", x: 440, y: 175 }, { id: "B5", x: 555, y: 175 },
    { id: "C1", x: 95, y: 285 }, { id: "C2", x: 210, y: 285 }, { id: "C3", x: 325, y: 285 }, { id: "C4", x: 440, y: 285 }, { id: "C5", x: 555, y: 285 },
    { id: "D1", x: 95, y: 395 }, { id: "D2", x: 210, y: 395 }, { id: "D3", x: 325, y: 395 }, { id: "D4", x: 440, y: 395 }, { id: "D5", x: 555, y: 395 },
];

const getNode = (id: string) => INTERSECTIONS.find((n) => n.id === id);

const ROADS: [string, string][] = (() => {
    const r: [string, string][] = [];
    (["A", "B", "C", "D"] as const).forEach(row => {
        for (let c = 1; c <= 4; c++) r.push([`${row}${c}`, `${row}${c + 1}`]);
    });
    for (let c = 1; c <= 5; c++) {
        ([["A", "B"], ["B", "C"], ["C", "D"]] as const).forEach(([r1, r2]) =>
            r.push([`${r1}${c}`, `${r2}${c}`])
        );
    }
    return r;
})();

const ROUTE = ["D1", "C1", "B1", "B2", "B3", "B4", "C4", "D4"];

const isRouteRoad = (a: string, b: string) =>
    ROUTE.some((id, i) =>
        i < ROUTE.length - 1 &&
        ((ROUTE[i] === a && ROUTE[i + 1] === b) || (ROUTE[i] === b && ROUTE[i + 1] === a))
    );

const INIT_ALERTS: Alert[] = [
    { id: 1, t: "14:23:01", msg: "AMB-04 spotted at CAM-D1-SW · conf 96.4%", type: "detect" },
    { id: 2, t: "14:23:02", msg: "Route computed: D1 → D4 · 8 junctions", type: "route" },
    { id: 3, t: "14:23:03", msg: "Corridor activated · D1, C1, B1 → GREEN", type: "override" },
    { id: 4, t: "14:23:05", msg: "Audio fusion confirmed · siren @ 720 Hz", type: "info" },
];

const ALERT_C: Record<AlertType, string> = {
    detect: "#00FFA3", route: "#4DA6FF", override: "#FF6B00", info: "#8AA0B8", move: "#5A7090",
};

const SIG_C: Record<SigState, string> = {
    active: "#00FFA3", ahead: "#FFD700", passed: "#FF6B00", off: "#1A2D42",
};

const NAV_ITEMS: { id: NavPage; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: "live", label: "Live Traffic Analysis", icon: <Activity size={15} />, badge: 0 },
    { id: "route", label: "Route Optimization", icon: <Navigation size={15} /> },
    { id: "emergency", label: "Emergency Priority", icon: <AlertTriangle size={15} />, badge: 3 },
    { id: "prediction", label: "Prediction Insights", icon: <TrendingUp size={15} /> },
    { id: "simulation", label: "Simulation Mode", icon: <PlayCircle size={15} /> },
    { id: "analytics", label: "Analytics Dashboard", icon: <BarChart2 size={15} /> },
    { id: "settings", label: "Settings", icon: <Settings size={15} /> },
];

// ─── Global Styles ────────────────────────────────────────────────────────────

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;600;700&family=Share+Tech+Mono&family=Exo+2:wght@400;600;700;900&display=swap');
  .cf-root *, .cf-root *::before, .cf-root *::after { box-sizing:border-box; }
  .cf-root ::-webkit-scrollbar { width:3px; }
  .cf-root ::-webkit-scrollbar-thumb { background:#1A2D42; border-radius:2px; }
  @keyframes cf-blink     { 0%,100%{opacity:1}    50%{opacity:.2}  }
  @keyframes cf-fastblink { 0%,100%{opacity:1}    50%{opacity:.15} }
  @keyframes cf-scanline  { 0%{top:0} 50%{top:calc(100% - 1px)} 100%{top:0} }
  @keyframes cf-dash      { to{stroke-dashoffset:-16} }
  @keyframes cf-fadein    { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:none} }
  @keyframes cf-pulse     { 0%,100%{transform:scale(1)} 50%{transform:scale(1.06)} }
  .cf-blink      { animation:cf-blink     1.3s  infinite; }
  .cf-fastblink  { animation:cf-fastblink 0.65s infinite; }
  .cf-fadein     { animation:cf-fadein    0.3s  ease; }
  .cf-pulse      { animation:cf-pulse     2s    ease-in-out infinite; }
  .cf-rdash      { stroke-dasharray:6 4; animation:cf-dash 1.1s linear infinite; }
  .cf-scanline {
    position:absolute; left:0; right:0; height:1px;
    background:linear-gradient(90deg,transparent,#00FFA340,transparent);
    animation:cf-scanline 3.5s ease-in-out infinite; pointer-events:none;
  }
  .cf-nav-btn:hover { background:#0F1E2E !important; }
  .cf-nav-btn-active { background:#0F1E2E !important; border-left:2px solid #FF6B00 !important; }
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const mono: React.CSSProperties = { fontFamily: "'Share Tech Mono',monospace" };
const exo: React.CSSProperties = { fontFamily: "'Exo 2',sans-serif" };
const raj: React.CSSProperties = { fontFamily: "'Rajdhani',sans-serif" };

function Panel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
    return (
        <div style={{ background: "#0B1522", border: "1px solid #1A2D42", borderRadius: 4, ...style }}>
            {children}
        </div>
    );
}

function PTitle({ icon, label, extra }: { icon: React.ReactNode; label: string; extra?: React.ReactNode }) {
    return (
        <div style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "6px 10px", borderBottom: "1px solid #1A2D42",
            ...exo, fontWeight: 700, fontSize: 9, letterSpacing: 2,
            textTransform: "uppercase", color: "#4A6280", flexShrink: 0,
        }}>
            {icon}{label}
            {extra && <span style={{ marginLeft: "auto" }}>{extra}</span>}
        </div>
    );
}

function Bar({ w, color }: { w: number; color: string }) {
    return (
        <div style={{ height: 3, background: "#1A2D42", borderRadius: 2, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${w}%`, background: color, borderRadius: 2, transition: "width 0.6s ease" }} />
        </div>
    );
}

// ─── Placeholder pages ────────────────────────────────────────────────────────

function PlaceholderPage({ title, icon }: { title: string; icon: React.ReactNode }) {
    return (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
            <div style={{ opacity: 0.15, transform: "scale(3)" }}>{icon}</div>
            <div style={{ ...exo, fontWeight: 700, fontSize: 16, letterSpacing: 3, color: "#4A6280", textTransform: "uppercase", marginTop: 24 }}>
                {title}
            </div>
            <div style={{ ...mono, fontSize: 11, color: "#2A3D52" }}>Module coming soon</div>
        </div>
    );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function CityFlowDashboard() {
    const [step, setStep] = useState<number>(0);
    const [ping, setPing] = useState<boolean>(false);
    const [alerts, setAlerts] = useState<Alert[]>(INIT_ALERTS);
    const [metrics, setMetrics] = useState<Metrics>({ conf: 96.4, lat: 127, overrides: 3, eta: 47 });
    const [clock, setClock] = useState<Date>(new Date());
    const [navPage, setNavPage] = useState<NavPage>("live");
    const [sideOpen, setSideOpen] = useState<boolean>(true);
    const aidRef = useRef<number>(5);

    useEffect(() => {
        const t = setInterval(() => setClock(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    useEffect(() => {
        const t = setInterval(() => {
            setStep(s => {
                const from = ROUTE[s];
                const next = (s + 1) % ROUTE.length;
                const now = new Date().toLocaleTimeString("en-IN", { hour12: false });
                setAlerts(prev => [{
                    id: aidRef.current++, t: now,
                    msg: `AMB-04 · ${from} → ${ROUTE[next]} · override applied`,
                    type: "move" as AlertType,
                }, ...prev].slice(0, 14));
                setMetrics(m => ({
                    conf: +Math.max(88, Math.min(99, m.conf + (Math.random() - 0.5) * 1.8)).toFixed(1),
                    lat: Math.floor(100 + Math.random() * 65),
                    overrides: m.overrides + 1,
                    eta: Math.max(0, m.eta - 5),
                }));
                return next;
            });
        }, 3500);
        return () => clearInterval(t);
    }, []);

    useEffect(() => {
        const t = setInterval(() => setPing(p => !p), 750);
        return () => clearInterval(t);
    }, []);

    const sigState = (id: string): SigState => {
        const ri = ROUTE.indexOf(id);
        if (ri === -1) return "off";
        const d = ri - step;
        if (d === 0) return "active";
        if (d === 1 || d === 2) return "ahead";
        if (d < 0 && d >= -2) return "passed";
        return "off";
    };
    const PAGE_COMPONENTS: Record<string, JSX.Element> = {
        route: <RouteOptimization />,
        emergency: <EmergencyPriority />,
        prediction: <PredictionInsights />,
        simulation: <SimulationMode />,
        analytics: <AnalyticsDashboard />,
        settings: <Settings />,
    };

    const ambNode = getNode(ROUTE[step]);
    const timeStr = clock.toLocaleTimeString("en-IN", { hour12: false });
    const dateStr = clock.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

    return (
        <>
            <style>{STYLES}</style>
            <div className="cf-root" style={{
                display: "flex",
                flexDirection: "column",
                minHeight: "100vh",   // ✅ changed
                background: "#060C15",
                color: "#C8D8E8",
                ...raj,
                overflowY: "auto",    // ✅ allow scroll
            }}>

                {/* ══ HEADER ══════════════════════════════════════════════════════════ */}
                <header style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "8px 16px", background: "#080E18", borderBottom: "1px solid #1A2D42",
                    flexShrink: 0, gap: 12, zIndex: 20,
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 8, background: "linear-gradient(135deg,#FF6B00,#FF3B5C)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Navigation size={18} color="white" />
                        </div>
                        <div>
                            <div style={{ ...exo, fontWeight: 900, fontSize: 18, color: "#E8F4FF", letterSpacing: 3 }}>CITYFLOW</div>
                            <div style={{ ...mono, fontSize: 8, color: "#4A6280", letterSpacing: 2 }}>AI SMART AMBULANCE SYSTEM v2.4</div>
                        </div>
                        <div style={{ width: 1, height: 30, background: "#1A2D42", margin: "0 8px" }} />
                        {[
                            { l: "SYSTEM", v: "ACTIVE", c: "#00FFA3" },
                            { l: "CAMERAS", v: "12/12", c: "#4DA6FF" },
                            { l: "CORRIDORS", v: "1 LIVE", c: "#FF6B00" },
                        ].map(b => (
                            <div key={b.l} style={{ display: "flex", flexDirection: "column", marginRight: 6 }}>
                                <span style={{ ...exo, fontWeight: 700, fontSize: 8, letterSpacing: 2, color: "#4A6280" }}>{b.l}</span>
                                <span style={{ ...mono, fontSize: 14, color: b.c, fontWeight: 700 }}>{b.v}</span>
                            </div>
                        ))}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <div style={{ textAlign: "right" }}>
                            <div style={{ ...mono, fontSize: 22, color: "#E8F4FF", lineHeight: 1 }}>{timeStr}</div>
                            <div style={{ ...mono, fontSize: 9, color: "#4A6280", letterSpacing: 1, marginTop: 2 }}>{dateStr} IST</div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", background: "#FF6B0015", border: "1px solid #FF6B0050", borderRadius: 4 }}>
                            <Bell size={13} color="#FF6B00" />
                            <span style={{ ...exo, fontWeight: 700, fontSize: 12, color: "#FF6B00" }}>EMERGENCY ACTIVE</span>
                            <div className="cf-fastblink" style={{ width: 6, height: 6, borderRadius: "50%", background: "#FF6B00", marginLeft: 2 }} />
                        </div>
                    </div>
                </header>

                {/* ══ BODY ════════════════════════════════════════════════════════════ */}
                <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>

                    {/* ── SIDEBAR ── */}
                    <aside style={{
                        width: sideOpen ? 220 : 48,
                        background: "#080E18", borderRight: "1px solid #1A2D42",
                        display: "flex", flexDirection: "column", flexShrink: 0,
                        transition: "width 0.25s ease", overflow: "hidden",
                    }}>
                        <div style={{ flex: 1, paddingTop: 8 }}>
                            {NAV_ITEMS.map(({ id, label, icon, badge }) => (
                                <button
                                    key={id}
                                    className={`cf-nav-btn${navPage === id ? " cf-nav-btn-active" : ""}`}
                                    onClick={() => setNavPage(id)}
                                    style={{
                                        width: "100%", display: "flex", alignItems: "center", gap: 10,
                                        padding: "10px 14px", background: "transparent", border: "none",
                                        borderLeft: navPage === id ? "2px solid #FF6B00" : "2px solid transparent",
                                        cursor: "pointer", color: navPage === id ? "#E8F4FF" : "#4A6280",
                                        ...exo, fontWeight: navPage === id ? 700 : 600, fontSize: 13,
                                        whiteSpace: "nowrap", transition: "all 0.15s",
                                    }}
                                >
                                    <span style={{ color: navPage === id ? "#FF6B00" : "#4A6280", flexShrink: 0 }}>{icon}</span>
                                    {sideOpen && <span style={{ flex: 1, textAlign: "left" }}>{label}</span>}
                                    {sideOpen && badge ? (
                                        <span style={{ ...mono, fontSize: 9, background: "#FF6B0030", color: "#FF6B00", border: "1px solid #FF6B0050", borderRadius: 10, padding: "1px 6px" }}>
                                            {badge}
                                        </span>
                                    ) : null}
                                </button>
                            ))}
                        </div>

                        {/* Collapse toggle */}
                        <button
                            onClick={() => setSideOpen(o => !o)}
                            style={{ padding: "10px 14px", background: "transparent", border: "none", borderTop: "1px solid #1A2D42", color: "#4A6280", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, ...exo, fontSize: 12, fontWeight: 600 }}
                        >
                            <ChevronRight size={14} style={{ transform: sideOpen ? "rotate(180deg)" : "none", transition: "transform 0.25s" }} />
                            {sideOpen && <span>Collapse</span>}
                        </button>
                    </aside>

                    {/* ── PAGE CONTENT ── */}
                    {navPage !== "live" ? (
                        <div style={{ flex: 1, display: "flex" }}>
                            {PAGE_COMPONENTS[navPage] ? (
                                PAGE_COMPONENTS[navPage]
                            ) : (
                                <PlaceholderPage
                                    title={NAV_ITEMS.find(n => n.id === navPage)?.label ?? ""}
                                    icon={NAV_ITEMS.find(n => n.id === navPage)?.icon}
                                />
                            )}
                        </div>
                    ) : (
                        <div style={{ flex: 1, display: "flex", gap: 1, padding: 1, overflow: "auto", minHeight: 0, background: "#060C15" }}>

                            {/* ── LEFT PANEL ── */}
                            <div style={{ width: 214, display: "flex", flexDirection: "column", gap: 1, flexShrink: 0 }}>

                                {/* Ambulance Tracker */}
                                <Panel>
                                    <PTitle icon={<Activity size={10} />} label="Active Vehicle" />
                                    <div style={{ padding: 9 }}>
                                        <div style={{ background: "#060C15", border: "1px solid #FF6B0050", borderRadius: 4, padding: 10 }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                                                <div>
                                                    <div style={{ ...exo, fontWeight: 700, fontSize: 16, color: "#FF6B00", letterSpacing: 1 }}>AMB-04</div>
                                                    <div style={{ ...mono, fontSize: 9, color: "#4A6280" }}>KA-01-AM-2024</div>
                                                </div>
                                                <span style={{ ...mono, fontSize: 9, color: "#FF6B00", background: "#FF6B0020", border: "1px solid #FF6B0050", borderRadius: 2, padding: "2px 7px" }}>
                                                    ● LIVE
                                                </span>
                                            </div>
                                            {([
                                                ["Position", ROUTE[step], "#E8F4FF"],
                                                ["Destination", "D4 / HOSPITAL", "#00FFA3"],
                                                ["Progress", `${step + 1} / ${ROUTE.length}`, "#4DA6FF"],
                                                ["ETA", `~${Math.max(0, metrics.eta - step * 4)}s`, "#FFD700"],
                                            ] as [string, string, string][]).map(([k, v, c]) => (
                                                <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
                                                    <span style={{ color: "#4A6280" }}>{k}</span>
                                                    <span style={{ ...mono, color: c }}>{v}</span>
                                                </div>
                                            ))}
                                            <div style={{ marginTop: 9, height: 3, background: "#1A2D42", borderRadius: 2, overflow: "hidden" }}>
                                                <div style={{ height: "100%", width: `${((step + 1) / ROUTE.length) * 100}%`, background: "linear-gradient(90deg,#FF6B00,#FFD700)", transition: "width 0.8s ease", borderRadius: 2 }} />
                                            </div>
                                        </div>
                                    </div>
                                </Panel>

                                {/* Detection Engine */}
                                <Panel>
                                    <PTitle icon={<Cpu size={10} />} label="Detection Engine" />
                                    <div style={{ padding: "8px 10px", display: "flex", flexDirection: "column", gap: 7 }}>
                                        {[
                                            { label: "YOLO v8 Conf", val: `${metrics.conf}%`, color: "#00FFA3", w: metrics.conf },
                                            { label: "Audio Fusion", val: "88.3%", color: "#4DA6FF", w: 88.3 },
                                            { label: "Track Score", val: "0.94", color: "#FFD700", w: 94 },
                                        ].map(({ label, val, color, w }) => (
                                            <div key={label}>
                                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                                                    <span style={{ fontSize: 10, color: "#4A6280" }}>{label}</span>
                                                    <span style={{ ...mono, fontSize: 10, color }}>{val}</span>
                                                </div>
                                                <Bar w={w} color={color} />
                                            </div>
                                        ))}
                                        <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 8px", background: "#00FFA310", border: "1px solid #00FFA330", borderRadius: 3, marginTop: 2 }}>
                                            <CheckCircle size={11} color="#00FFA3" />
                                            <span style={{ ...exo, fontWeight: 700, fontSize: 10, color: "#00FFA3" }}>FUSION CONFIRMED</span>
                                        </div>
                                    </div>
                                </Panel>

                                {/* Camera Feeds */}
                                <Panel style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                                    <PTitle icon={<Camera size={10} />} label="Camera Feeds" />
                                    <div style={{ padding: 8, display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
                                        {[
                                            { cam: "CAM-D1-SW", status: "AMB DETECTED", active: true },
                                            { cam: "CAM-C1-NE", status: "TRACKING...", active: false },
                                            { cam: "CAM-B1-SE", status: "MONITORING", active: false },
                                        ].map(({ cam, status, active }) => (
                                            <div key={cam} style={{ background: "#060C15", border: "1px solid #1A2D42", borderRadius: 3, aspectRatio: "16/9", position: "relative", overflow: "hidden" }}>
                                                {(["top", "bottom"] as const).flatMap(v =>
                                                    (["left", "right"] as const).map(h => (
                                                        <div key={v + h} style={{
                                                            position: "absolute", [v]: 4, [h]: 4, width: 8, height: 8,
                                                            borderTop: v === "top" ? "1px solid #00FFA3" : "none",
                                                            borderBottom: v === "bottom" ? "1px solid #00FFA3" : "none",
                                                            borderLeft: h === "left" ? "1px solid #00FFA3" : "none",
                                                            borderRight: h === "right" ? "1px solid #00FFA3" : "none",
                                                        }} />
                                                    ))
                                                )}
                                                {active && <div className="cf-scanline" />}
                                                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "5px 7px" }}>
                                                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                                                        <span style={{ ...mono, fontSize: 8, color: "#00FFA3" }}>{cam}</span>
                                                        <span className="cf-fastblink" style={{ ...mono, fontSize: 8, color: "#FF3B5C" }}>● REC</span>
                                                    </div>
                                                    <div style={{ textAlign: "center", ...mono, fontSize: 9, color: active ? "#FF6B00" : "#2A3D52" }}>
                                                        {active && "► "}{status}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </Panel>
                            </div>

                            {/* ── CENTER MAP ── */}
                            <Panel style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
                                <PTitle
                                    icon={<MapPin size={10} />}
                                    label="City Grid — Live Signal Map"
                                    extra={<span style={{ ...mono, fontSize: 9, color: "#FF6B00" }}>CORRIDOR: {ROUTE[step]} → D4</span>}
                                />
                                <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
                                    {/* Legend */}
                                    <div style={{ position: "absolute", top: 10, right: 10, background: "#08101ACC", border: "1px solid #1A2D42", borderRadius: 4, padding: "7px 10px", zIndex: 10, display: "flex", flexDirection: "column", gap: 5 }}>
                                        {[
                                            { c: "#00FFA3", l: "ACTIVE / PRE-CLEARED" },
                                            { c: "#FF6B00", l: "JUST PASSED" },
                                            { c: "#1A2D42", l: "NORMAL" },
                                        ].map(({ c, l }) => (
                                            <div key={l} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 9, ...mono, color: "#4A6280" }}>
                                                <div style={{ width: 7, height: 7, borderRadius: "50%", background: c, flexShrink: 0 }} />{l}
                                            </div>
                                        ))}
                                        <div style={{ borderTop: "1px solid #1A2D42", marginTop: 3, paddingTop: 5, display: "flex", alignItems: "center", gap: 5, fontSize: 9, ...mono, color: "#FF6B00" }}>
                                            <div className="cf-blink" style={{ width: 7, height: 7, borderRadius: "50%", background: "#FF6B00", flexShrink: 0 }} />AMBULANCE
                                        </div>
                                    </div>

                                    <svg viewBox="0 0 660 480" style={{ width: "100%", height: "100%" }} preserveAspectRatio="xMidYMid meet">
                                        <defs>
                                            <pattern id="cf-bg" width="30" height="30" patternUnits="userSpaceOnUse">
                                                <path d="M30 0L0 0 0 30" fill="none" stroke="#0D1E2D" strokeWidth="0.5" />
                                            </pattern>
                                            <filter id="cf-glow">
                                                <feGaussianBlur stdDeviation="3.5" result="blur" />
                                                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                                            </filter>
                                        </defs>
                                        <rect width="660" height="480" fill="url(#cf-bg)" />

                                        <text x="325" y="22" textAnchor="middle" fontSize="9" fill="#142030" fontFamily="'Exo 2',sans-serif" fontWeight="700" letterSpacing="4">NORTH DISTRICT</text>
                                        <text x="47" y="230" textAnchor="middle" fontSize="8" fill="#142030" fontFamily="'Exo 2',sans-serif" fontWeight="700" letterSpacing="3" transform="rotate(-90 47 230)">WEST ZONE</text>
                                        <text x="308" y="462" textAnchor="middle" fontSize="9" fill="#142030" fontFamily="'Exo 2',sans-serif" fontWeight="700" letterSpacing="4">SOUTH DISTRICT</text>
                                        <text x="476" y="462" textAnchor="middle" fontSize="7" fill="#00FFA325" fontFamily="'Exo 2',sans-serif" fontWeight="700" letterSpacing="3">HOSPITAL ZONE</text>

                                        {/* Roads */}
                                        {ROADS.map(([id1, id2]) => {
                                            const a = getNode(id1), b = getNode(id2);
                                            if (!a || !b) return null;
                                            const onR = isRouteRoad(id1, id2);
                                            return (
                                                <g key={`${id1}-${id2}`}>
                                                    <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#0D1E2D" strokeWidth={onR ? 14 : 9} strokeLinecap="round" />
                                                    <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={onR ? "#172434" : "#101822"} strokeWidth={onR ? 10 : 6} strokeLinecap="round" />
                                                    {onR && (
                                                        <line
                                                            className="cf-rdash"
                                                            x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                                                            stroke="#00FFA355" strokeWidth="2" strokeLinecap="round"
                                                            strokeDasharray="6 4" fill="none"
                                                        />
                                                    )}
                                                </g>
                                            );
                                        })}

                                        {/* Intersections */}
                                        {INTERSECTIONS.map(node => {
                                            const state = sigState(node.id);
                                            const color = SIG_C[state];
                                            const isAct = state === "active";
                                            const inCor = state !== "off";
                                            return (
                                                <g key={node.id}>
                                                    {inCor && <circle cx={node.x} cy={node.y} r={isAct ? 22 : 16} fill={color} opacity={isAct ? 0.10 : 0.05} filter="url(#cf-glow)" />}
                                                    <circle cx={node.x} cy={node.y} r={11} fill="#080E18" stroke={color} strokeWidth={isAct ? 2 : 1} opacity={state === "off" ? 0.3 : 1} />
                                                    <circle cx={node.x} cy={node.y} r={5.5} fill={state === "off" ? "#1A2D42" : color} opacity={state === "off" ? 0.2 : isAct ? 1 : 0.65} />
                                                    <text x={node.x} y={node.y - 16} textAnchor="middle" fontSize="8" fill={state === "off" ? "#243344" : color} fontFamily="'Share Tech Mono',monospace" opacity={state === "off" ? 0.45 : 1}>{node.id}</text>
                                                    {inCor && (
                                                        <text x={node.x} y={node.y + 22} textAnchor="middle" fontSize="7" fill={color} fontFamily="'Exo 2',sans-serif" fontWeight="700" letterSpacing="1">
                                                            {isAct ? "PASSING" : state === "ahead" ? "PRE-CLR" : "RELEASE"}
                                                        </text>
                                                    )}
                                                </g>
                                            );
                                        })}

                                        {/* Ambulance */}
                                        {ambNode && (
                                            <g>
                                                <circle cx={ambNode.x} cy={ambNode.y} r={ping ? 20 : 14} fill="none" stroke="#FF6B00" strokeWidth={1} opacity={ping ? 0.22 : 0.55} style={{ transition: "all 0.7s ease" }} />
                                                <rect x={ambNode.x - 12} y={ambNode.y - 7} width={24} height={14} rx={3} fill="#FF6B00" filter="url(#cf-glow)" />
                                                <rect x={ambNode.x - 1.5} y={ambNode.y - 5.5} width={3} height={11} fill="white" opacity={0.92} />
                                                <rect x={ambNode.x - 5.5} y={ambNode.y - 1.5} width={11} height={3} fill="white" opacity={0.92} />
                                                <circle cx={ambNode.x - 7} cy={ambNode.y - 7} r={2.5} fill="#FF3B5C" />
                                                <circle cx={ambNode.x + 7} cy={ambNode.y - 7} r={2.5} fill="#4DA6FF" />
                                            </g>
                                        )}

                                        {/* Hospital marker */}
                                        <g>
                                            <rect x={424} y={379} width={32} height={32} rx={5} fill="#00FFA310" stroke="#00FFA340" strokeWidth={1} />
                                            <rect x={438} y={383} width={4} height={24} fill="#00FFA3" opacity={0.7} />
                                            <rect x={429} y={390} width={22} height={4} fill="#00FFA3" opacity={0.7} />
                                            <text x={440} y={422} textAnchor="middle" fontSize="7" fill="#00FFA3" fontFamily="'Share Tech Mono',monospace" letterSpacing="1">DEST</text>
                                        </g>
                                    </svg>
                                </div>
                            </Panel>

                            {/* ── RIGHT PANEL ── */}
                            <div style={{ width: 214, display: "flex", flexDirection: "column", gap: 1, flexShrink: 0 }}>

                                {/* Signal Log */}
                                <Panel style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                                    <PTitle icon={<Zap size={10} />} label="Signal Override Log" />
                                    <div style={{ flex: 1, overflow: "auto", padding: 4, display: "flex", flexDirection: "column", gap: 2 }}>
                                        {alerts.map((a, i) => (
                                            <div key={a.id} className={i === 0 ? "cf-fadein" : ""} style={{ padding: "5px 8px", borderLeft: `2px solid ${ALERT_C[a.type]}`, background: "#060C15", borderRadius: "0 3px 3px 0" }}>
                                                <div style={{ ...mono, fontSize: 8, color: "#4A6280", marginBottom: 2 }}>{a.t}</div>
                                                <div style={{ fontSize: 10, color: "#7A90A8", ...exo, lineHeight: 1.35 }}>{a.msg}</div>
                                            </div>
                                        ))}
                                    </div>
                                </Panel>

                                {/* Route Plan */}
                                <Panel>
                                    <PTitle icon={<Navigation size={10} />} label="Route Plan" />
                                    <div style={{ padding: 9 }}>
                                        <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginBottom: 8 }}>
                                            {ROUTE.map((id, i) => {
                                                const passed = i < step;
                                                const current = i === step;
                                                const ahead = i > step && i <= step + 2;
                                                return (
                                                    <div key={id} style={{ display: "flex", alignItems: "center", gap: 2 }}>
                                                        <span style={{
                                                            ...mono, fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 2,
                                                            background: current ? "#FF6B0030" : passed ? "#00FFA312" : ahead ? "#FFD70012" : "#1A2D42",
                                                            color: current ? "#FF6B00" : passed ? "#00FFA355" : ahead ? "#FFD700" : "#3A4D62",
                                                            border: `1px solid ${current ? "#FF6B0055" : passed ? "#00FFA325" : ahead ? "#FFD70025" : "#1A2D42"}`,
                                                        }}>
                                                            {current && "● "}{id}
                                                        </span>
                                                        {i < ROUTE.length - 1 && <ChevronRight size={8} color="#243344" />}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <div style={{ ...mono, fontSize: 9, color: "#4A6280" }}>
                                            CLEARED: {Math.min(step + 1, ROUTE.length)} / {ROUTE.length}
                                        </div>
                                    </div>
                                </Panel>

                                {/* System Status */}
                                <Panel>
                                    <PTitle icon={<Wifi size={10} />} label="System Status" />
                                    <div style={{ padding: "8px 10px", display: "flex", flexDirection: "column", gap: 6 }}>
                                        {([
                                            ["Detection Engine", true, "ONLINE"],
                                            ["Signal Override API", true, "ONLINE"],
                                            ["Route Predictor", true, "ACTIVE"],
                                            ["SUMO Simulation", false, "PENDING"],
                                            ["GPS Module", false, "OFFLINE"],
                                        ] as [string, boolean, string][]).map(([label, ok, status]) => (
                                            <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <span style={{ fontSize: 10, color: "#4A6280", ...exo }}>{label}</span>
                                                <span style={{ ...mono, fontSize: 9, color: ok ? "#00FFA3" : "#FF6B0065" }}>
                                                    {ok ? "●" : "○"} {status}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </Panel>
                            </div>

                        </div>
                    )}
                </div>

                {/* ══ METRICS BAR ════════════════════════════════════════════════════ */}
                <div style={{ display: "flex", gap: 1, padding: "0 1px 1px", flexShrink: 0 }}>
                    {[
                        { icon: <Clock size={14} />, label: "API LATENCY", val: `${metrics.lat}ms`, sub: "< 300ms TARGET", color: "#4DA6FF" },
                        { icon: <Eye size={14} />, label: "DETECTIONS TODAY", val: "47", sub: "FALSE POS: 0", color: "#00FFA3" },
                        { icon: <Zap size={14} />, label: "SIGNAL OVERRIDES", val: `${metrics.overrides}`, sub: "ACTIVE SESSION", color: "#FF6B00" },
                        { icon: <Activity size={14} />, label: "AVG CONFIDENCE", val: `${metrics.conf}%`, sub: "YOLO + AUDIO", color: "#FFD700" },
                        { icon: <Shield size={14} />, label: "SYSTEM UPTIME", val: "99.97%", sub: "LAST 30 DAYS", color: "#00FFA3" },
                    ].map(({ icon, label, val, sub, color }) => (
                        <div key={label} style={{ flex: 1, background: "#0B1522", border: "1px solid #1A2D42", borderRadius: 4, padding: "7px 12px", display: "flex", alignItems: "center", gap: 9 }}>
                            <div style={{ color, opacity: 0.55, flexShrink: 0 }}>{icon}</div>
                            <div>
                                <div style={{ ...exo, fontSize: 8, letterSpacing: 1.5, textTransform: "uppercase", color: "#3A5066", fontWeight: 700, marginBottom: 1 }}>{label}</div>
                                <div style={{ ...mono, fontSize: 22, color, lineHeight: 1 }}>{val}</div>
                                <div style={{ ...mono, fontSize: 8, color: "#203040", marginTop: 1, letterSpacing: 1 }}>{sub}</div>
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </>
    );
}