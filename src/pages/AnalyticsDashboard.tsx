import { useState } from "react";
import {
    LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar
} from "recharts";
import {
    Activity, Zap, Clock, TrendingUp, ArrowUpRight, ArrowDownRight
} from "lucide-react";

const data = [
    { name: "Mon", emergencies: 20, response: 4.5 },
    { name: "Tue", emergencies: 35, response: 4.2 },
    { name: "Wed", emergencies: 25, response: 3.9 },
    { name: "Thu", emergencies: 40, response: 4.8 },
    { name: "Fri", emergencies: 30, response: 4.1 },
    { name: "Sat", emergencies: 50, response: 5.0 },
    { name: "Sun", emergencies: 45, response: 4.3 },
];

const AnalyticsDashboard = () => {
    const [range, setRange] = useState("weekly");

    return (
        <div className="p-6 text-white space-y-6 bg-[#060C15] min-h-full">

            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <TrendingUp size={20} className="text-orange-400" />
                    Analytics Control Center
                </h1>

                <select
                    value={range}
                    onChange={(e) => setRange(e.target.value)}
                    className="bg-black/60 border border-gray-700 px-3 py-1 rounded text-sm"
                >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                </select>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

                <Card
                    icon={<Activity />}
                    title="Total Emergencies"
                    value="128"
                    change="+12%"
                    positive
                    glow="shadow-green-500/20"
                />

                <Card
                    icon={<Clock />}
                    title="Avg Response Time"
                    value="4.2 min"
                    change="-8%"
                    positive
                    glow="shadow-blue-500/20"
                />

                <Card
                    icon={<Zap />}
                    title="Signals Overridden"
                    value="560"
                    change="+25%"
                    positive
                    glow="shadow-orange-500/20"
                />

            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Line Chart */}
                <GlassCard title="Emergency Trends">
                    <ResponsiveContainer width="100%" height={260}>
                        <LineChart data={data}>
                            <XAxis dataKey="name" stroke="#555" />
                            <YAxis stroke="#555" />
                            <Tooltip />
                            <Line
                                type="monotone"
                                dataKey="emergencies"
                                stroke="#00FFA3"
                                strokeWidth={3}
                                dot={{ r: 4 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </GlassCard>

                {/* Bar Chart */}
                <GlassCard title="Response Time (min)">
                    <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={data}>
                            <XAxis dataKey="name" stroke="#555" />
                            <YAxis stroke="#555" />
                            <Tooltip />
                            <Bar dataKey="response" fill="#4DA6FF" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </GlassCard>

            </div>

            {/* Advanced Insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* AI Insights */}
                <div className="bg-black/40 backdrop-blur-lg border border-gray-800 p-5 rounded-xl space-y-3">
                    <h2 className="text-lg font-semibold text-orange-400">🤖 AI Insights</h2>

                    <Insight text="Peak load detected on Saturday with +40% spike." color="text-orange-400" />
                    <Insight text="Response time improved via optimized routing." color="text-green-400" />
                    <Insight text="Signal override efficiency increased system throughput." color="text-blue-400" />
                </div>

                {/* System Efficiency */}
                <div className="bg-black/40 backdrop-blur-lg border border-gray-800 p-5 rounded-xl space-y-4">
                    <h2 className="text-lg font-semibold text-green-400">⚡ System Efficiency</h2>

                    <Progress label="Route Optimization" value={92} color="bg-green-400" />
                    <Progress label="Signal Sync Accuracy" value={87} color="bg-blue-400" />
                    <Progress label="Detection Accuracy" value={96} color="bg-orange-400" />
                </div>

            </div>

        </div>
    );
};

export default AnalyticsDashboard;



/* ─── KPI Card ─── */
const Card = ({
    icon,
    title,
    value,
    change,
    positive,
    glow
}: any) => {
    return (
        <div className={`bg-black/50 border border-gray-800 p-5 rounded-xl flex justify-between items-center shadow-lg ${glow} hover:scale-[1.02] transition`}>

            <div>
                <p className="text-sm text-gray-400">{title}</p>
                <h2 className="text-2xl font-bold">{value}</h2>

                <div className={`flex items-center gap-1 text-sm ${positive ? "text-green-400" : "text-red-400"}`}>
                    {positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    {change}
                </div>
            </div>

            <div className="opacity-60 text-orange-400">
                {icon}
            </div>
        </div>
    );
};


/* ─── Glass Card ─── */
const GlassCard = ({ title, children }: any) => {
    return (
        <div className="bg-black/40 backdrop-blur-xl border border-gray-800 p-4 rounded-xl shadow-lg">
            <h2 className="text-sm mb-3 text-gray-400">{title}</h2>
            {children}
        </div>
    );
};


/* ─── Insight Item ─── */
const Insight = ({ text, color }: any) => {
    return (
        <p className={`text-sm ${color}`}>
            • {text}
        </p>
    );
};


/* ─── Progress Bar ─── */
const Progress = ({ label, value, color }: any) => {
    return (
        <div>
            <div className="flex justify-between text-sm mb-1">
                <span>{label}</span>
                <span className="text-gray-400">{value}%</span>
            </div>

            <div className="w-full bg-gray-800 h-2 rounded">
                <div
                    className={`${color} h-2 rounded transition-all duration-700`}
                    style={{ width: `${value}%` }}
                />
            </div>
        </div>
    );
};