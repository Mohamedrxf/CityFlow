import { useEffect, useState } from "react";
import {
    Navigation,
    TrendingUp,
    AlertTriangle,
    CheckCircle,
    Zap,
    Activity,
    GitBranch
} from "lucide-react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer
} from "recharts";

const baseRoute = ["D1", "C1", "B1", "B2", "B3", "B4", "C4", "D4"];
const altRoute = ["D1", "C1", "C2", "C3", "C4", "D4"];

const trafficData = [
    { time: "0m", congestion: 85 },
    { time: "5m", congestion: 70 },
    { time: "10m", congestion: 55 },
    { time: "15m", congestion: 40 },
];

const RouteOptimization = () => {
    const [step, setStep] = useState(0);
    const [eta, setEta] = useState(52);
    const [confidence, setConfidence] = useState(94);
    const [rerouting, setRerouting] = useState(false);

    useEffect(() => {
        const t = setInterval(() => {
            setStep((s) => (s + 1) % baseRoute.length);
            setEta((e) => Math.max(18, e - 2));
            setConfidence((c) => Math.min(99, c + Math.random()));

            // Simulate rerouting trigger
            if (Math.random() > 0.8) setRerouting(true);
            else setRerouting(false);

        }, 2500);

        return () => clearInterval(t);
    }, []);

    return (
        <div className="p-6 text-white space-y-6">

            {/* HEADER */}
            <div className="flex items-center gap-3">
                <Navigation className="text-orange-400" />
                <h1 className="text-2xl font-bold tracking-wide">
                    Route Optimization Intelligence
                </h1>
            </div>

            {/* TOP METRICS */}
            <div className="grid grid-cols-4 gap-4">

                <Metric title="ETA" value={`${eta}s`} color="text-orange-400" />
                <Metric title="AI Confidence" value={`${confidence.toFixed(1)}%`} color="text-green-400" />
                <Metric title="Rerouting" value={rerouting ? "TRIGGERED" : "STABLE"} color="text-yellow-400" />
                <Metric title="System Load" value="OPTIMAL" color="text-blue-400" />

            </div>

            {/* ROUTE COMPARISON */}
            <div className="grid grid-cols-2 gap-6">

                <RouteCard
                    title="AI Optimized Route"
                    route={baseRoute}
                    step={step}
                    color="orange"
                />

                <RouteCard
                    title="Fallback Route"
                    route={altRoute}
                    step={-1}
                    color="blue"
                />

            </div>

            {/* LIVE TRAFFIC INTELLIGENCE */}
            <div className="bg-black/60 p-6 rounded-xl border border-gray-800">
                <h2 className="flex items-center gap-2 mb-4">
                    <TrendingUp /> Live Congestion Forecast
                </h2>

                <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={trafficData}>
                            <XAxis dataKey="time" stroke="#888" />
                            <YAxis stroke="#888" />
                            <Tooltip />
                            <Line type="monotone" dataKey="congestion" stroke="#22c55e" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* AI EXPLANATION + RISKS */}
            <div className="grid grid-cols-2 gap-6">

                <Card title="AI Decision Engine" icon={<CheckCircle className="text-green-400" />}>
                    <ul className="space-y-2 text-sm text-gray-300">
                        <li>• Selected minimal latency path</li>
                        <li>• Avoided congestion cluster at B3</li>
                        <li>• Prioritized signal preemption</li>
                        <li>• Continuous graph recalculation</li>
                    </ul>
                </Card>

                <Card title="Risk Analysis" icon={<AlertTriangle className="text-yellow-400" />}>
                    <ul className="space-y-2 text-sm text-gray-300">
                        <li>• Medium congestion predicted (next 5m)</li>
                        <li>• Pedestrian crossing density ↑</li>
                        <li>• Signal delay probability: 12%</li>
                    </ul>
                </Card>

            </div>

            {/* TIMELINE */}
            <div className="bg-black/60 p-5 rounded-xl border border-gray-800">
                <h2 className="flex items-center gap-2 mb-3">
                    <Activity /> Operational Timeline
                </h2>

                <div className="text-sm text-gray-300 space-y-2">
                    <p>• Detection → Route Generated (0.2s)</p>
                    <p>• Signals Pre-cleared → Corridor Created</p>
                    <p>• Live Tracking → Adaptive Optimization</p>
                    <p>• ETA Continuously Reduced</p>
                </div>
            </div>

            {/* SYSTEM STATUS */}
            <div className="bg-black/60 p-5 rounded-xl border border-orange-500/20 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <Zap className="text-orange-400" />
                    <span className="font-semibold">
                        AI Routing Engine Active
                    </span>
                </div>

                <span className="text-green-400 text-sm animate-pulse">
                    ● LIVE
                </span>
            </div>

        </div>
    );
};

/* ───────── COMPONENTS ───────── */

const Metric = ({ title, value, color }: any) => (
    <div className="bg-black/60 p-4 rounded-xl border border-gray-800">
        <p className="text-sm text-gray-400">{title}</p>
        <h2 className={`text-xl font-bold ${color}`}>{value}</h2>
    </div>
);

const RouteCard = ({ title, route, step, color }: any) => {
    return (
        <div className="bg-black/60 p-5 rounded-xl border border-gray-800">
            <h2 className="flex items-center gap-2 mb-3">
                <GitBranch className={`text-${color}-400`} />
                {title}
            </h2>

            <div className="flex flex-wrap gap-2">
                {route.map((node: string, i: number) => (
                    <span
                        key={node}
                        className={`px-3 py-1 rounded text-sm font-semibold
                        ${i === step
                                ? "bg-orange-500 text-white"
                                : "bg-gray-800 text-gray-400"}`}
                    >
                        {node}
                    </span>
                ))}
            </div>
        </div>
    );
};

const Card = ({ title, icon, children }: any) => (
    <div className="bg-black/60 p-5 rounded-xl border border-gray-800">
        <h2 className="flex items-center gap-2 mb-3">
            {icon} {title}
        </h2>
        {children}
    </div>
);

export default RouteOptimization;