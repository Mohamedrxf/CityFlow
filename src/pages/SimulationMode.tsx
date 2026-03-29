import { useState, useEffect } from "react";
import {
    Play, Pause, RotateCcw, Activity, Zap
} from "lucide-react";

const SimulationMode = () => {
    const [running, setRunning] = useState(false);
    const [progress, setProgress] = useState(0);
    const [speed, setSpeed] = useState(1);
    const [scenario, setScenario] = useState("normal");
    const [logs, setLogs] = useState<string[]>([]);

    // Simulation Loop
    useEffect(() => {
        if (!running) return;

        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    setRunning(false);
                    addLog("✅ Simulation completed");
                    return 100;
                }

                addLog(`🚑 Moving through intersection ${prev / 10 + 1}`);
                return prev + 5;
            });
        }, 1000 / speed);

        return () => clearInterval(interval);
    }, [running, speed]);

    const addLog = (msg: string) => {
        setLogs(prev => [msg, ...prev].slice(0, 8));
    };

    const handleStart = () => {
        setLogs([]);
        setProgress(0);
        setRunning(true);
        addLog("▶ Simulation started");
    };

    const handlePause = () => {
        setRunning(false);
        addLog("⏸ Simulation paused");
    };

    const handleReset = () => {
        setRunning(false);
        setProgress(0);
        setLogs([]);
    };

    return (
        <div className="p-6 text-white space-y-6 bg-[#060C15] min-h-full">

            {/* Header */}
            <h1 className="text-2xl font-bold flex items-center gap-2">
                🧪 Simulation Mode
            </h1>

            {/* Controls */}
            <div className="grid md:grid-cols-3 gap-5">

                {/* Scenario */}
                <Card title="Scenario">
                    <select
                        value={scenario}
                        onChange={(e) => setScenario(e.target.value)}
                        className="w-full bg-black border border-gray-700 p-2 rounded"
                    >
                        <option value="normal">Normal Traffic</option>
                        <option value="heavy">Heavy Traffic</option>
                        <option value="emergency">Multiple Emergencies</option>
                    </select>
                </Card>

                {/* Speed */}
                <Card title="Simulation Speed">
                    <input
                        type="range"
                        min="1"
                        max="5"
                        value={speed}
                        onChange={(e) => setSpeed(Number(e.target.value))}
                        className="w-full"
                    />
                    <p className="text-sm text-gray-400 mt-1">{speed}x speed</p>
                </Card>

                {/* Status */}
                <Card title="Status">
                    <p className={`text-sm ${running ? "text-green-400" : "text-red-400"}`}>
                        {running ? "Running..." : "Stopped"}
                    </p>
                </Card>

            </div>

            {/* Progress */}
            <div className="bg-black/50 border border-gray-800 p-5 rounded-xl">
                <p className="mb-2 text-sm text-gray-400">Simulation Progress</p>
                <div className="w-full bg-gray-800 h-3 rounded">
                    <div
                        className="bg-blue-500 h-3 rounded transition-all duration-500"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <p className="text-xs text-gray-500 mt-1">{progress}% complete</p>
            </div>

            {/* Controls Buttons */}
            <div className="flex gap-4">

                <button
                    onClick={handleStart}
                    className="flex items-center gap-2 bg-green-500 px-4 py-2 rounded hover:bg-green-600"
                >
                    <Play size={16} /> Start
                </button>

                <button
                    onClick={handlePause}
                    className="flex items-center gap-2 bg-yellow-500 px-4 py-2 rounded hover:bg-yellow-600"
                >
                    <Pause size={16} /> Pause
                </button>

                <button
                    onClick={handleReset}
                    className="flex items-center gap-2 bg-red-500 px-4 py-2 rounded hover:bg-red-600"
                >
                    <RotateCcw size={16} /> Reset
                </button>

            </div>

            {/* Logs */}
            <div className="bg-black/50 border border-gray-800 p-5 rounded-xl">
                <h2 className="text-sm mb-3 text-gray-400 flex items-center gap-2">
                    <Activity size={14} /> Live Simulation Logs
                </h2>

                <div className="space-y-2 text-sm text-gray-300">
                    {logs.length === 0 && <p>No activity yet...</p>}
                    {logs.map((log, i) => (
                        <p key={i}>• {log}</p>
                    ))}
                </div>
            </div>

        </div>
    );
};

export default SimulationMode;


/* ─── Reusable Card ─── */
const Card = ({ title, children }: any) => {
    return (
        <div className="bg-black/50 border border-gray-800 p-4 rounded-xl space-y-3">
            <h2 className="text-sm text-gray-400">{title}</h2>
            {children}
        </div>
    );
};