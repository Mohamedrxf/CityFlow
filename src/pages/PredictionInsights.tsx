import { useState, useEffect } from "react";
import {
    LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import { Brain, AlertTriangle } from "lucide-react";

// ─── Types ───
interface DataPoint {
    time: number;
    traffic: number;
    delay: number;
}

// ─── Mock API (Replace later) ───
const fetchPredictionData = async (): Promise<DataPoint> => ({
    time: Date.now(),
    traffic: Math.random() * 100,
    delay: Math.random() * 10,
});

export default function PredictionInsights() {
    const [data, setData] = useState<DataPoint[]>([]);
    const [risk, setRisk] = useState("Medium");
    const [confidence, setConfidence] = useState(97.8);

    useEffect(() => {
        const interval = setInterval(async () => {
            const newData = await fetchPredictionData();
            setData((prev) => [...prev.slice(-12), newData]);

            const risks = ["Low", "Medium", "High"];
            setRisk(risks[Math.floor(Math.random() * 3)]);
            setConfidence((c) =>
                Math.max(90, Math.min(100, c + (Math.random() - 0.5)))
            );
        }, 2000);

        return () => clearInterval(interval);
    }, []);

    // ─── Heatmap ───
    const heatmap = Array.from({ length: 20 }, () => Math.random() * 100);

    const getColor = (v: number) => {
        if (v > 75) return "bg-red-500/80";
        if (v > 50) return "bg-yellow-400/80";
        return "bg-green-400/80";
    };

    return (
        <div className="p-6 text-white space-y-6">

            {/* ── Header ── */}
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-semibold tracking-wide">
                    AI Prediction Insights
                </h1>
                <span className="text-sm text-gray-400">
                    Live Model • Updating every 2s
                </span>
            </div>

            {/* ── Top Metrics ── */}
            <div className="grid grid-cols-2 gap-5">

                <div className="bg-[#0f172a] border border-gray-800 p-5 rounded-xl">
                    <div className="text-sm text-gray-400">Risk Level</div>
                    <div className="text-3xl font-bold mt-1 text-yellow-400">
                        {risk}
                    </div>
                </div>

                <div className="bg-[#0f172a] border border-gray-800 p-5 rounded-xl">
                    <div className="text-sm text-gray-400">AI Confidence</div>
                    <div className="text-3xl font-bold mt-1 text-green-400">
                        {confidence.toFixed(2)}%
                    </div>
                </div>

            </div>

            {/* ── Charts ── */}
            <div className="grid grid-cols-2 gap-5">

                {/* Traffic */}
                <div className="bg-[#0f172a] border border-gray-800 p-5 rounded-xl">
                    <h2 className="text-sm text-gray-400 mb-3">
                        Traffic Density Trend
                    </h2>

                    <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={data}>
                            <XAxis dataKey="time" hide />
                            <YAxis />
                            <Tooltip />
                            <Line
                                type="monotone"
                                dataKey="traffic"
                                stroke="#38bdf8"
                                strokeWidth={2}
                                dot={false}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Delay */}
                <div className="bg-[#0f172a] border border-gray-800 p-5 rounded-xl">
                    <h2 className="text-sm text-gray-400 mb-3">
                        Delay Forecast (mins)
                    </h2>

                    <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={data}>
                            <XAxis dataKey="time" hide />
                            <YAxis />
                            <Tooltip />
                            <Line
                                type="monotone"
                                dataKey="delay"
                                stroke="#fb923c"
                                strokeWidth={2}
                                dot={false}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

            </div>

            {/* ── Heatmap ── */}
            <div className="bg-[#0f172a] border border-gray-800 p-5 rounded-xl">
                <h2 className="text-sm text-gray-400 mb-3">
                    Congestion Heatmap
                </h2>

                <div className="grid grid-cols-5 gap-2">
                    {heatmap.map((v, i) => (
                        <div
                            key={i}
                            className={`h-10 rounded-md ${getColor(v)} transition`}
                        />
                    ))}
                </div>
            </div>

            {/* ── Explainable AI ── */}
            <div className="bg-[#0f172a] border border-gray-800 p-5 rounded-xl">
                <h2 className="flex items-center gap-2 text-sm text-gray-400 mb-3">
                    <Brain size={16} /> AI Explanation
                </h2>

                <div className="space-y-3 text-sm text-gray-300">

                    <div className="flex justify-between">
                        <span>Traffic Density Impact</span>
                        <span className="text-blue-400">High</span>
                    </div>

                    <div className="flex justify-between">
                        <span>Signal Delay Contribution</span>
                        <span className="text-orange-400">Moderate</span>
                    </div>

                    <div className="flex justify-between">
                        <span>Route Optimization Effect</span>
                        <span className="text-green-400">Positive</span>
                    </div>

                </div>
            </div>

        </div>
    );
}