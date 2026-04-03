import { useMemo, useState } from "react";
import {
    Save,
    SlidersHorizontal,
    Shield,
    Cpu,
    Wifi,
    Bell,
    Gauge,
    Route,
    Ambulance,
    Radar,
    CheckCircle2,
    AlertTriangle,
    RefreshCcw,
    Database,
} from "lucide-react";

type ToggleProps = {
    label: string;
    description?: string;
    value: boolean;
    onChange: (v: boolean) => void;
    accent?: string;
};

type SliderProps = {
    label: string;
    description?: string;
    value: number;
    min: number;
    max: number;
    step?: number;
    suffix?: string;
    onChange: (v: number) => void;
    accent?: string;
};

const Settings = () => {
    const [detectionSensitivity, setDetectionSensitivity] = useState(78);
    const [audioFusion, setAudioFusion] = useState(true);
    const [nightModeBoost, setNightModeBoost] = useState(true);
    const [autoOverride, setAutoOverride] = useState(true);
    const [manualApproval, setManualApproval] = useState(false);
    const [rerouteThreshold, setRerouteThreshold] = useState(62);
    const [simulationSpeed, setSimulationSpeed] = useState(2);
    const [apiEnabled, setApiEnabled] = useState(true);
    const [websocketEnabled, setWebsocketEnabled] = useState(true);
    const [gpsSync, setGpsSync] = useState(false);
    const [incidentAlerts, setIncidentAlerts] = useState(true);
    const [emailAlerts, setEmailAlerts] = useState(false);
    const [soundAlerts, setSoundAlerts] = useState(true);
    const [retentionDays, setRetentionDays] = useState(30);
    const [saved, setSaved] = useState(false);

    const systemHealth = useMemo(() => {
        let score = 70;
        if (apiEnabled) score += 8;
        if (websocketEnabled) score += 8;
        if (audioFusion) score += 5;
        if (nightModeBoost) score += 4;
        if (autoOverride) score += 3;
        if (gpsSync) score += 2;
        return Math.min(score, 100);
    }, [apiEnabled, websocketEnabled, audioFusion, nightModeBoost, autoOverride, gpsSync]);

    const modeLabel = manualApproval
        ? "Supervised Control"
        : autoOverride
            ? "Autonomous Response"
            : "Passive Monitoring";

    const saveSettings = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2200);
    };

    const resetDefaults = () => {
        setDetectionSensitivity(78);
        setAudioFusion(true);
        setNightModeBoost(true);
        setAutoOverride(true);
        setManualApproval(false);
        setRerouteThreshold(62);
        setSimulationSpeed(2);
        setApiEnabled(true);
        setWebsocketEnabled(true);
        setGpsSync(false);
        setIncidentAlerts(true);
        setEmailAlerts(false);
        setSoundAlerts(true);
        setRetentionDays(30);
        setSaved(false);
    };

    return (
        <div className="min-h-full bg-[#060C15] text-white p-6 space-y-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl border border-orange-500/30 bg-orange-500/10 p-2">
                            <SlidersHorizontal size={20} className="text-orange-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-wide">System Settings</h1>
                            <p className="text-sm text-slate-400">
                                Configure CityFlow’s ambulance detection, signal override, routing, simulation, and alerting behavior.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2">
                        <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Operating Mode</div>
                        <div className="text-sm font-semibold text-emerald-400">{modeLabel}</div>
                    </div>

                    <button
                        onClick={resetDefaults}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-800"
                    >
                        <RefreshCcw size={16} />
                        Reset Defaults
                    </button>

                    <button
                        onClick={saveSettings}
                        className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-orange-400"
                    >
                        <Save size={16} />
                        Save Changes
                    </button>
                </div>
            </div>

            {saved && (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
                    <CheckCircle2 size={16} />
                    Settings saved successfully. New parameters are ready for the live control workflow.
                </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    icon={<Cpu size={18} className="text-orange-400" />}
                    label="Detection Sensitivity"
                    value={`${detectionSensitivity}%`}
                    sub="YOLO + audio fusion threshold"
                    accent="orange"
                />
                <StatCard
                    icon={<Route size={18} className="text-cyan-400" />}
                    label="Reroute Trigger"
                    value={`${rerouteThreshold}%`}
                    sub="Congestion threshold for alternate path"
                    accent="cyan"
                />
                <StatCard
                    icon={<Gauge size={18} className="text-violet-400" />}
                    label="Simulation Speed"
                    value={`${simulationSpeed}x`}
                    sub="Testing and scenario playback rate"
                    accent="violet"
                />
                <StatCard
                    icon={<Shield size={18} className="text-emerald-400" />}
                    label="System Health"
                    value={`${systemHealth}%`}
                    sub="Composite readiness score"
                    accent="emerald"
                />
            </div>

            <div className="grid grid-cols-1 gap-6 2xl:grid-cols-[1.4fr_1fr]">
                <div className="space-y-6">
                    <SectionCard
                        icon={<Cpu size={16} className="text-orange-400" />}
                        title="Detection Engine"
                        description="Tune how aggressively CityFlow detects ambulances and validates emergency intent from multimodal inputs."
                    >
                        <div className="grid gap-5 lg:grid-cols-2">
                            <SliderControl
                                label="Detection Sensitivity"
                                description="Higher values reduce false positives but may miss distant or partially occluded ambulances."
                                value={detectionSensitivity}
                                min={0}
                                max={100}
                                suffix="%"
                                onChange={setDetectionSensitivity}
                                accent="orange"
                            />

                            <div className="space-y-4">
                                <ToggleControl
                                    label="Audio Siren Fusion"
                                    description="Combine visual detection with siren cues for stronger emergency confirmation."
                                    value={audioFusion}
                                    onChange={setAudioFusion}
                                    accent="orange"
                                />
                                <ToggleControl
                                    label="Night / Rain Confidence Boost"
                                    description="Apply adaptive weighting for low-light and adverse weather camera conditions."
                                    value={nightModeBoost}
                                    onChange={setNightModeBoost}
                                    accent="orange"
                                />
                            </div>
                        </div>
                    </SectionCard>

                    <SectionCard
                        icon={<Ambulance size={16} className="text-rose-400" />}
                        title="Emergency Response Logic"
                        description="Control signal override strategy, corridor activation policy, and operator supervision."
                    >
                        <div className="grid gap-5 lg:grid-cols-2">
                            <div className="space-y-4">
                                <ToggleControl
                                    label="Automatic Signal Override"
                                    description="Immediately pre-clear intersections when ambulance confidence crosses threshold."
                                    value={autoOverride}
                                    onChange={setAutoOverride}
                                    accent="rose"
                                />
                                <ToggleControl
                                    label="Manual Approval Required"
                                    description="Require human confirmation before green-corridor activation for live deployments."
                                    value={manualApproval}
                                    onChange={setManualApproval}
                                    accent="rose"
                                />
                            </div>

                            <SliderControl
                                label="Dynamic Reroute Threshold"
                                description="When congestion crosses this level, CityFlow switches to an alternate ambulance path."
                                value={rerouteThreshold}
                                min={0}
                                max={100}
                                suffix="%"
                                onChange={setRerouteThreshold}
                                accent="rose"
                            />
                        </div>
                    </SectionCard>

                    <SectionCard
                        icon={<Gauge size={16} className="text-violet-400" />}
                        title="Simulation & Testing"
                        description="Tune mock playback speed and scenario validation behavior before deploying into a real corridor."
                    >
                        <div className="grid gap-5 lg:grid-cols-2">
                            <SliderControl
                                label="Simulation Speed"
                                description="Speed multiplier for route playback, signal state progression, and training demos."
                                value={simulationSpeed}
                                min={1}
                                max={5}
                                step={1}
                                suffix="x"
                                onChange={setSimulationSpeed}
                                accent="violet"
                            />

                            <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-violet-300">
                                    <Radar size={15} />
                                    Validation Notes
                                </div>
                                <ul className="space-y-2 text-sm text-slate-400">
                                    <li>• Use 1x–2x for realistic operator training.</li>
                                    <li>• Use 3x–5x for quick corridor stress testing.</li>
                                    <li>• Pair with Prediction Insights for congestion simulation reviews.</li>
                                </ul>
                            </div>
                        </div>
                    </SectionCard>

                    <SectionCard
                        icon={<Bell size={16} className="text-cyan-400" />}
                        title="Alerting & Retention"
                        description="Manage incident notifications, audible alerts, and how long operational logs are kept."
                    >
                        <div className="grid gap-5 lg:grid-cols-2">
                            <div className="space-y-4">
                                <ToggleControl
                                    label="Incident Alerts"
                                    description="Notify operators when corridor activation, rerouting, or detection drops occur."
                                    value={incidentAlerts}
                                    onChange={setIncidentAlerts}
                                    accent="cyan"
                                />
                                <ToggleControl
                                    label="Email Notifications"
                                    description="Send system summaries and critical override alerts to operators."
                                    value={emailAlerts}
                                    onChange={setEmailAlerts}
                                    accent="cyan"
                                />
                                <ToggleControl
                                    label="Sound Alerts"
                                    description="Play audible warnings during live emergency signal transitions."
                                    value={soundAlerts}
                                    onChange={setSoundAlerts}
                                    accent="cyan"
                                />
                            </div>

                            <SliderControl
                                label="Operational Log Retention"
                                description="Choose how many days CityFlow keeps event history for review and analytics."
                                value={retentionDays}
                                min={7}
                                max={90}
                                step={1}
                                suffix=" days"
                                onChange={setRetentionDays}
                                accent="cyan"
                            />
                        </div>
                    </SectionCard>
                </div>

                <div className="space-y-6">
                    <SectionCard
                        icon={<Wifi size={16} className="text-emerald-400" />}
                        title="API & Connectivity"
                        description="Configure the communication layer for live data, route updates, and signal-control messaging."
                    >
                        <div className="space-y-4">
                            <ToggleControl
                                label="Enable Real-time API"
                                description="Allow live control-plane communication with backend services."
                                value={apiEnabled}
                                onChange={setApiEnabled}
                                accent="emerald"
                            />
                            <ToggleControl
                                label="Enable WebSocket Stream"
                                description="Use persistent event streaming for live ambulance tracking and signal updates."
                                value={websocketEnabled}
                                onChange={setWebsocketEnabled}
                                accent="emerald"
                            />
                            <ToggleControl
                                label="GPS / Hospital Sync"
                                description="Prepare CityFlow for future integration with ambulance GPS and hospital endpoints."
                                value={gpsSync}
                                onChange={setGpsSync}
                                accent="emerald"
                            />

                            <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                                <div className="mb-2 text-xs uppercase tracking-[0.2em] text-slate-500">
                                    Connectivity Status
                                </div>
                                <div className="space-y-2 text-sm">
                                    <StatusRow label="REST API" online={apiEnabled} />
                                    <StatusRow label="WebSocket Stream" online={websocketEnabled} />
                                    <StatusRow label="GPS Sync" online={gpsSync} />
                                </div>
                            </div>
                        </div>
                    </SectionCard>

                    <SectionCard
                        icon={<Database size={16} className="text-sky-400" />}
                        title="Deployment Profile"
                        description="A quick summary of how this configuration will behave in your smart-traffic domain."
                    >
                        <div className="space-y-4">
                            <ProfileItem
                                label="Detection Profile"
                                value={
                                    detectionSensitivity >= 80
                                        ? "Precision-first"
                                        : detectionSensitivity >= 60
                                            ? "Balanced"
                                            : "Recall-first"
                                }
                            />
                            <ProfileItem
                                label="Emergency Control"
                                value={manualApproval ? "Operator-supervised" : autoOverride ? "Autonomous corridor" : "Monitoring only"}
                            />
                            <ProfileItem
                                label="Simulation Readiness"
                                value={simulationSpeed >= 4 ? "Stress-test mode" : "Training mode"}
                            />
                            <ProfileItem
                                label="Alerting Policy"
                                value={incidentAlerts ? "Operational notifications enabled" : "Silent mode"}
                            />
                        </div>
                    </SectionCard>

                    <SectionCard
                        icon={<AlertTriangle size={16} className="text-amber-400" />}
                        title="Recommendations"
                        description="Suggested configuration based on a smart-city ambulance priority system."
                    >
                        <ul className="space-y-3 text-sm text-slate-300">
                            <li className="rounded-xl border border-amber-500/15 bg-amber-500/5 p-3">
                                For demos and judging rounds, keep <span className="font-semibold text-amber-300">Auto Override ON</span> and
                                <span className="font-semibold text-amber-300"> Audio Fusion ON</span> for a more realistic intelligent workflow.
                            </li>
                            <li className="rounded-xl border border-cyan-500/15 bg-cyan-500/5 p-3">
                                Use <span className="font-semibold text-cyan-300">WebSocket Stream ON</span> once you connect the dashboard to live
                                backend events for smoother real-time updates.
                            </li>
                            <li className="rounded-xl border border-emerald-500/15 bg-emerald-500/5 p-3">
                                For safe field testing, enable <span className="font-semibold text-emerald-300">Manual Approval</span> before moving beyond simulation.
                            </li>
                        </ul>
                    </SectionCard>
                </div>
            </div>
        </div>
    );
};

function SectionCard({
    icon,
    title,
    description,
    children,
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
    children: React.ReactNode;
}) {
    return (
        <div className="rounded-3xl border border-slate-800 bg-black/40 p-5 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
            <div className="mb-5 flex items-start gap-3">
                <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-2">
                    {icon}
                </div>
                <div>
                    <h2 className="text-lg font-semibold text-white">{title}</h2>
                    <p className="mt-1 text-sm text-slate-400">{description}</p>
                </div>
            </div>
            {children}
        </div>
    );
}

function StatCard({
    icon,
    label,
    value,
    sub,
    accent,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    sub: string;
    accent: "orange" | "cyan" | "violet" | "emerald";
}) {
    const accentMap = {
        orange: "from-orange-500/15 to-orange-500/5 border-orange-500/15",
        cyan: "from-cyan-500/15 to-cyan-500/5 border-cyan-500/15",
        violet: "from-violet-500/15 to-violet-500/5 border-violet-500/15",
        emerald: "from-emerald-500/15 to-emerald-500/5 border-emerald-500/15",
    };

    return (
        <div className={`rounded-2xl border bg-gradient-to-br p-4 ${accentMap[accent]}`}>
            <div className="mb-3 flex items-center justify-between">
                <div className="text-sm text-slate-400">{label}</div>
                {icon}
            </div>
            <div className="text-2xl font-bold text-white">{value}</div>
            <div className="mt-1 text-xs text-slate-500">{sub}</div>
        </div>
    );
}

function ToggleControl({
    label,
    description,
    value,
    onChange,
    accent = "orange",
}: ToggleProps) {
    const activeColor =
        accent === "orange"
            ? "bg-orange-500"
            : accent === "rose"
                ? "bg-rose-500"
                : accent === "cyan"
                    ? "bg-cyan-500"
                    : accent === "emerald"
                        ? "bg-emerald-500"
                        : accent === "violet"
                            ? "bg-violet-500"
                            : "bg-orange-500";

    return (
        <div className="flex items-start justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-950/45 p-4">
            <div>
                <div className="text-sm font-medium text-white">{label}</div>
                {description && <div className="mt-1 text-xs leading-5 text-slate-400">{description}</div>}
            </div>

            <button
                type="button"
                onClick={() => onChange(!value)}
                className={`relative h-7 w-14 rounded-full transition ${value ? activeColor : "bg-slate-700"}`}
            >
                <span
                    className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-md transition ${value ? "left-8" : "left-1"
                        }`}
                />
            </button>
        </div>
    );
}

function SliderControl({
    label,
    description,
    value,
    min,
    max,
    step = 1,
    suffix = "",
    onChange,
    accent = "orange",
}: SliderProps) {
    const accentText =
        accent === "orange"
            ? "text-orange-400"
            : accent === "rose"
                ? "text-rose-400"
                : accent === "cyan"
                    ? "text-cyan-400"
                    : accent === "emerald"
                        ? "text-emerald-400"
                        : accent === "violet"
                            ? "text-violet-400"
                            : "text-orange-400";

    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/45 p-4">
            <div className="mb-2 flex items-center justify-between gap-3">
                <div className="text-sm font-medium text-white">{label}</div>
                <div className={`text-sm font-semibold ${accentText}`}>
                    {value}
                    {suffix}
                </div>
            </div>

            {description && <div className="mb-4 text-xs leading-5 text-slate-400">{description}</div>}

            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                className="w-full accent-orange-500"
            />

            <div className="mt-2 flex justify-between text-[11px] text-slate-500">
                <span>
                    {min}
                    {suffix}
                </span>
                <span>
                    {max}
                    {suffix}
                </span>
            </div>
        </div>
    );
}

function StatusRow({ label, online }: { label: string; online: boolean }) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-slate-300">{label}</span>
            <span className={`text-xs font-medium ${online ? "text-emerald-400" : "text-rose-400"}`}>
                {online ? "● Online" : "● Offline"}
            </span>
        </div>
    );
}

function ProfileItem({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/45 p-3">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</div>
            <div className="mt-1 text-sm font-medium text-slate-200">{value}</div>
        </div>
    );
}

export default Settings;