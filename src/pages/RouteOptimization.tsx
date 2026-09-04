import { useEffect, useState, useMemo } from "react";
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
import { BACKEND_BASE_URL } from "@/lib/apiConfig";
import { CityFlow3DScene } from "@/components/cityflow/CityFlow3DScene";
import type { SignalState, VehicleData } from "@/components/cityflow/types";

// Authoritative graph nodes from backend city_graph.py
const GRAPH_NODES = [
    "INT_01", "INT_02", "INT_03", "INT_04",
    "INT_05", "INT_06", "INT_07", "INT_08",
    "HOSPITAL_A", "HOSPITAL_B",
];

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

    // Route planning inputs
    const [currentIntersection, setCurrentIntersection] = useState("");
    const [destination, setDestination] = useState("");
    const [speedMps, setSpeedMps] = useState("");

    // API state
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [liveRoute, setLiveRoute] = useState<string[] | null>(null);
    const [liveEta, setLiveEta] = useState<number | null>(null);

    // 3D visualization state (deterministic demo data)
    const [show3D, setShow3D] = useState(true);

    // Demo signals for 3D visualization (deterministic initial states)
    const demoSignals: Record<string, SignalState> = useMemo(() => ({
        INT_01: "GREEN",
        INT_02: "RED",
        INT_03: "GREEN",
        INT_04: "RED",
        INT_05: "GREEN",
        INT_06: "RED",
        INT_07: "GREEN",
        INT_08: "RED",
    }), []);

    // Demo vehicles for 3D visualization
    const demoVehicles: VehicleData[] = useMemo(() => [
        { id: "v1", type: "car", position: { x: -10, y: 0, z: -20 }, rotation: 0, speed: 2, color: "#3a6df0" },
        { id: "v2", type: "bus", position: { x: 10, y: 0, z: 0 }, rotation: Math.PI / 2, speed: 1.5, color: "#f0a030" },
        { id: "v3", type: "truck", position: { x: 0, y: 0, z: 10 }, rotation: Math.PI, speed: 1.8, color: "#50a050" },
    ], []);

    // Demo ambulance for 3D visualization
    const demoAmbulance = useMemo(() => ({
        id: "amb-1",
        position: { x: -20, y: 0, z: -20 },
        rotation: 0,
        progress: 0,
        emergencyActive: true,
    }), []);

    // Emergency route from live data or demo
    const emergencyRoute = useMemo(() => {
        if (liveRoute && liveRoute.length > 0) {
            return { nodeIds: liveRoute, active: true };
        }
        // Demo route: INT_01 -> INT_02 -> INT_05 -> INT_08 -> HOSPITAL_A
        return {
            nodeIds: ["INT_01", "INT_02", "INT_05", "INT_08", "HOSPITAL_A"],
            active: true,
        };
    }, [liveRoute]);

    useEffect(() => {
        const t = setInterval(() => {
            // Pause demo animation when live backend data is displayed
            if (liveRoute === null) {
                setStep((s) => (s + 1) % baseRoute.length);
            }
            if (liveEta === null) {
                setEta((e) => Math.max(18, e - 2));
            }
            setConfidence((c) => Math.min(99, c + Math.random()));

            if (Math.random() > 0.8) setRerouting(true);
            else setRerouting(false);

        }, 2500);

        return () => clearInterval(t);
    }, [liveRoute, liveEta]);

    const canPredict =
        currentIntersection !== "" &&
        destination !== "" &&
        speedMps !== "" &&
        Number(speedMps) > 0;

    const handlePredict = async () => {
        if (!canPredict) return;
        if (currentIntersection === destination) {
            setError("Current intersection and destination must be different.");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            const response = await fetch(`${BACKEND_BASE_URL}/predict-path`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    current_intersection: currentIntersection,
                    destination: destination,
                    speed_mps: Number(speedMps),
                }),
            });

            if (!response.ok) {
                setError(`Route prediction failed (HTTP ${response.status}). Please check your inputs.`);
                setLiveRoute(null);
                setLiveEta(null);
                return;
            }

            const data = await response.json();

            if (!data.path || typeof data.total_eta_seconds !== "number") {
                setError("Received invalid response from backend.");
                return;
            }

            setLiveRoute(data.path);
            setLiveEta(data.total_eta_seconds);
        } catch (err) {
            setError("Network error. Please ensure the backend is running.");
            setLiveRoute(null);
            setLiveEta(null);
        } finally {
            setIsLoading(false);
        }
    };

    // Use live backend data when available, otherwise fall back to demo
    const displayRoute = liveRoute ?? baseRoute;
    const displayEta = liveEta ?? eta;

    return (
        <div className="p-6 text-white space-y-6">

            {/* HEADER */}
            <div className="flex items-center gap-3">
                <Navigation className="text-orange-400" />
                <h1 className="text-2xl font-bold tracking-wide">
                    Route Optimization Intelligence
                </h1>
            </div>

            {/* 3D CityFlow Visualization */}
            {show3D && (
                <div className="bg-black/40 rounded-xl border border-gray-800 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800">
                        <span className="text-sm text-gray-400">3D City Traffic Visualization</span>
                        <button
                            onClick={() => setShow3D(false)}
                            className="text-xs text-gray-500 hover:text-gray-300 transition"
                        >
                            Hide 3D
                        </button>
                    </div>
                    <div className="h-[400px] w-full">
                        <CityFlow3DScene
                            signals={demoSignals}
                            vehicles={demoVehicles}
                            ambulance={demoAmbulance}
                            emergencyRoute={emergencyRoute}
                            emergencyActive={true}
                        />
                    </div>
                    <div className="px-4 py-2 border-t border-gray-800">
                        <p className="text-xs text-gray-500">
                            🧪 Demo visualization — Shows fictional city layout with emergency route.
                            {liveRoute ? " Live route from backend displayed." : " Submit route prediction to see live path."}
                        </p>
                    </div>
                </div>
            )}

            {!show3D && (
                <button
                    onClick={() => setShow3D(true)}
                    className="text-sm text-blue-400 hover:text-blue-300 transition"
                >
                    Show 3D Visualization
                </button>
            )}

            {/* ROUTE PLANNING CONTROLS */}
            <div className="bg-black/60 p-5 rounded-xl border border-gray-800">
                <h2 className="flex items-center gap-2 mb-4">
                    <Navigation className="text-orange-400" /> Route Planning
                </h2>

                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Current Intersection</label>
                        <select
                            value={currentIntersection}
                            onChange={(e) => setCurrentIntersection(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                        >
                            <option value="">Select intersection</option>
                            {GRAPH_NODES.map((node) => (
                                <option key={node} value={node}>{node}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Destination</label>
                        <select
                            value={destination}
                            onChange={(e) => setDestination(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                        >
                            <option value="">Select destination</option>
                            {GRAPH_NODES.map((node) => (
                                <option key={node} value={node}>{node}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Speed (m/s)</label>
                        <input
                            type="number"
                            min="0.1"
                            step="0.1"
                            value={speedMps}
                            onChange={(e) => setSpeedMps(e.target.value)}
                            placeholder="e.g. 11"
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-4 mt-4">
                    <button
                        onClick={handlePredict}
                        disabled={!canPredict || isLoading}
                        className="px-6 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold transition"
                    >
                        {isLoading ? "Predicting..." : "Predict Route"}
                    </button>

                    {error && (
                        <p className="text-sm text-red-400">{error}</p>
                    )}

                    {liveRoute !== null && !error && (
                        <p className="text-sm text-green-400">Route from backend</p>
                    )}
                </div>

                {!canPredict && !error && (
                    <p className="text-sm text-yellow-400 mt-3">
                        Select current intersection, destination, and enter a positive speed to enable route prediction.
                    </p>
                )}
            </div>

            {/* TOP METRICS */}
            <div className="grid grid-cols-4 gap-4">

                <Metric title="ETA" value={`${Math.round(displayEta)}s`} color="text-orange-400" />
                <Metric title="AI Confidence" value={`${confidence.toFixed(1)}%`} color="text-green-400" />
                <Metric title="Rerouting" value={rerouting ? "TRIGGERED" : "STABLE"} color="text-yellow-400" />
                <Metric title="System Load" value="OPTIMAL" color="text-blue-400" />

            </div>

            {/* ROUTE COMPARISON */}
            <div className="grid grid-cols-2 gap-6">

                <RouteCard
                    title="AI Optimized Route"
                    route={displayRoute}
                    step={liveRoute === null ? step : -1}
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