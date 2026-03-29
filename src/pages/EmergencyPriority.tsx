import { useEffect, useState } from "react";
import {
    AlertTriangle,
    Activity,
    Cpu,
    Shield,
} from "lucide-react";

import {
    LineChart,
    Line,
    XAxis,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

// ─────────────────────────────────────────────
// 🔥 AI PRIORITY FUNCTION
// ─────────────────────────────────────────────
const calculatePriority = (severity: number, distance: number, traffic: number, eta: number) => {
    const score =
        severity * 0.4 +
        (100 - distance) * 0.25 +
        (100 - traffic) * 0.2 +
        (100 - eta) * 0.15;

    return Math.round(score);
};

// ─────────────────────────────────────────────
// INITIAL DATA
// ─────────────────────────────────────────────
const initialAmbulances = [
    { id: "AMB-01", severity: 95, distance: 20, traffic: 30, eta: 10 },
    { id: "AMB-02", severity: 70, distance: 50, traffic: 60, eta: 25 },
];

const EmergencyPriority = () => {
    const [ambulances, setAmbulances] = useState<any[]>([]);
    const [chartData, setChartData] = useState<any[]>([]);
    const [autoOverride, setAutoOverride] = useState(true);

    // ─────────────────────────────────────────
    // 🔄 REAL-TIME SIMULATION
    // ─────────────────────────────────────────
    useEffect(() => {
        const interval = setInterval(() => {
            const updated = initialAmbulances.map((amb) => {
                const newTraffic = Math.min(100, Math.max(10, amb.traffic + (Math.random() * 20 - 10)));
                const newDistance = Math.max(0, amb.distance - Math.random() * 5);
                const newEta = Math.max(1, amb.eta - Math.random() * 2);

                const score = calculatePriority(
                    amb.severity,
                    newDistance,
                    newTraffic,
                    newEta
                );

                return {
                    ...amb,
                    traffic: newTraffic,
                    distance: newDistance,
                    eta: newEta,
                    score,
                };
            });

            setAmbulances(updated);

            setChartData((prev) => [
                ...prev.slice(-10),
                {
                    time: new Date().toLocaleTimeString(),
                    score: updated[0].score,
                },
            ]);
        }, 2000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="p-6 text-white min-h-screen bg-gradient-to-br from-[#050A14] to-[#0B1522] space-y-6">

            {/* HEADER */}
            <div className="flex items-center gap-3">
                <AlertTriangle className="text-orange-400 animate-pulse" />
                <h1 className="text-2xl font-bold tracking-widest">
                    AI EMERGENCY CONTROL CENTER
                </h1>
            </div>

            {/* GRID */}
            <div className="grid grid-cols-3 gap-6">

                {/* LEFT PANEL */}
                <div className="col-span-2 bg-black/40 backdrop-blur-xl border border-gray-800 rounded-2xl p-5">

                    <div className="text-sm text-gray-400 mb-4 flex items-center gap-2">
                        <Activity size={16} /> LIVE PRIORITY ENGINE
                    </div>

                    <div className="space-y-4">
                        {ambulances.map((amb) => (
                            <div key={amb.id} className="p-4 bg-[#0B1522] rounded-xl border border-gray-800">

                                <div className="flex justify-between">
                                    <div>
                                        <div className="font-bold text-lg">{amb.id}</div>
                                        <div className="text-xs text-gray-500">
                                            Distance: {amb.distance.toFixed(1)} km
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <div className="text-green-400 font-bold">
                                            {amb.score}%
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            ETA: {amb.eta.toFixed(1)} min
                                        </div>
                                    </div>
                                </div>

                                {/* BAR */}
                                <div className="mt-3 h-2 bg-gray-800 rounded">
                                    <div
                                        className="h-2 bg-gradient-to-r from-red-500 to-orange-400"
                                        style={{ width: `${amb.score}%` }}
                                    />
                                </div>

                            </div>
                        ))}
                    </div>
                </div>

                {/* RIGHT PANEL */}
                <div className="bg-black/40 border border-gray-800 rounded-2xl p-5">

                    <div className="text-sm text-gray-400 mb-4 flex items-center gap-2">
                        <Cpu size={16} /> AI MODEL
                    </div>

                    <div className="text-xs space-y-2 text-gray-400">
                        <div>Severity Weight → 40%</div>
                        <div>Distance Weight → 25%</div>
                        <div>Traffic Weight → 20%</div>
                        <div>ETA Weight → 15%</div>
                    </div>

                    <button
                        onClick={() => setAutoOverride(!autoOverride)}
                        className={`mt-6 w-full py-2 rounded ${autoOverride
                                ? "bg-green-500 text-black"
                                : "bg-gray-700"
                            }`}
                    >
                        {autoOverride ? "AUTO MODE ON" : "MANUAL MODE"}
                    </button>
                </div>
            </div>

            {/* 📊 LIVE CHART */}
            <div className="bg-black/40 border border-gray-800 rounded-2xl p-5">
                <h2 className="text-sm text-gray-400 mb-4">
                    📊 Priority Trend (Real-Time)
                </h2>

                <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={chartData}>
                        <XAxis dataKey="time" hide />
                        <Tooltip />
                        <Line
                            type="monotone"
                            dataKey="score"
                            stroke="#FF6B00"
                            strokeWidth={2}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* FOOTER */}
            <div className="flex justify-between text-xs text-gray-400">
                <div>⚡ Latency: 120ms</div>
                <div>🚦 Overrides: 12</div>
                <div>🧠 AI Confidence: 98.2%</div>
            </div>
        </div>
    );
};

export default EmergencyPriority;