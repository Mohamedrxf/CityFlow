import { useEffect, useState } from "react";
import {
    AlertTriangle,
    Activity,
    Cpu,
    Shield,
    FileText,
    Loader2,
} from "lucide-react";

import {
    LineChart,
    Line,
    XAxis,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

import { BACKEND_BASE_URL } from "@/lib/apiConfig";

// ─────────────────────────────────────────────
// INCIDENT DATA MODEL (matches backend/app.py)
// ─────────────────────────────────────────────
interface IncidentRecord {
    incident_id: string;
    ambulance_id: string;
    destination: string;
    start_time: string;
    end_time: string | null;
    route_taken: string[];
    signals_overridden: number;
    anomalies_detected: string[];
    total_time_mins: number | null;
    status: string;
}

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
    const [incidents, setIncidents] = useState<IncidentRecord[]>([]);
    const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
    const [incidentsLoading, setIncidentsLoading] = useState(false);
    const [incidentsError, setIncidentsError] = useState<string | null>(null);
    const [reportLoadingId, setReportLoadingId] = useState<string | null>(null);
    const [reportError, setReportError] = useState<string | null>(null);
    const [generatedReport, setGeneratedReport] = useState<{ incident_id: string; report: string } | null>(null);

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

    // ─────────────────────────────────────────
    // LOAD INCIDENT HISTORY
    // ─────────────────────────────────────────
    useEffect(() => {
        let alive = true;
        const loadIncidents = async () => {
            setIncidentsLoading(true);
            setIncidentsError(null);
            try {
                const res = await fetch(`${BACKEND_BASE_URL}/incidents`);
                if (!alive) return;
                if (!res.ok) {
                    setIncidentsError("Failed to load incidents");
                    return;
                }
                const data: IncidentRecord[] = await res.json();
                if (!alive) return;
                setIncidents(data);
            } catch {
                if (alive) setIncidentsError("Network error loading incidents");
            } finally {
                if (alive) setIncidentsLoading(false);
            }
        };
        loadIncidents();
        return () => { alive = false; };
    }, []);

    // ─────────────────────────────────────────
    // GENERATE REPORT
    // ─────────────────────────────────────────
    const handleGenerateReport = async (incidentId: string) => {
        if (reportLoadingId) return;
        setReportLoadingId(incidentId);
        setReportError(null);
        setGeneratedReport(null);
        setSelectedIncidentId(incidentId);
        try {
            const res = await fetch(`${BACKEND_BASE_URL}/generate-report/${incidentId}`, {
                method: "POST",
            });
            if (!res.ok) {
                setReportError("Failed to generate report");
                return;
            }
            const data = await res.json();
            setGeneratedReport({ incident_id: data.incident_id, report: data.report });
        } catch {
            setReportError("Network error generating report");
        } finally {
            setReportLoadingId(null);
        }
    };

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

            {/* INCIDENT HISTORY */}
            <div className="bg-black/40 border border-gray-800 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Shield size={16} className="text-cyan-400" />
                        <h2 className="text-sm text-gray-400">
                            INCIDENT HISTORY
                        </h2>
                    </div>
                    <span className="text-xs text-gray-500">
                        {incidents.length} record{incidents.length !== 1 ? "s" : ""}
                    </span>
                </div>

                {incidentsLoading ? (
                    <div className="flex items-center justify-center gap-3 rounded-xl border border-gray-800 bg-black/20 px-6 py-10">
                        <Loader2 size={20} className="animate-spin text-cyan-400" />
                        <p className="text-sm text-gray-400">Loading incidents...</p>
                    </div>
                ) : incidentsError ? (
                    <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-6 py-10 text-center">
                        <p className="text-sm text-red-300">{incidentsError}</p>
                    </div>
                ) : incidents.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-700 bg-black/20 px-6 py-10 text-center">
                        <FileText size={28} className="mx-auto mb-3 text-gray-600" />
                        <p className="text-sm text-gray-400">
                            No incidents loaded yet.
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                            Incident records will appear here when connected to the backend.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b border-gray-800 text-gray-500">
                                    <th className="pb-2 pr-4 font-medium">Incident ID</th>
                                    <th className="pb-2 pr-4 font-medium">Ambulance</th>
                                    <th className="pb-2 pr-4 font-medium">Destination</th>
                                    <th className="pb-2 pr-4 font-medium">Status</th>
                                    <th className="pb-2 pr-4 font-medium">Start Time</th>
                                    <th className="pb-2 pr-4 font-medium">End Time</th>
                                    <th className="pb-2 pr-4 font-medium">Duration (min)</th>
                                    <th className="pb-2 font-medium">Report</th>
                                </tr>
                            </thead>
                            <tbody>
                                {incidents.map((inc) => (
                                    <tr
                                        key={inc.incident_id}
                                        className={selectedIncidentId === inc.incident_id ? "bg-cyan-500/10" : ""}
                                    >
                                        <td className="py-2 pr-4 font-mono text-cyan-300">
                                            {inc.incident_id}
                                        </td>
                                        <td className="py-2 pr-4">{inc.ambulance_id}</td>
                                        <td className="py-2 pr-4">{inc.destination}</td>
                                        <td className="py-2 pr-4">
                                            <span
                                                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                                                    inc.status === "COMPLETED"
                                                        ? "bg-green-500/15 text-green-300"
                                                        : inc.status === "ACTIVE"
                                                        ? "bg-yellow-500/15 text-yellow-300"
                                                        : "bg-gray-500/15 text-gray-300"
                                                }`}
                                            >
                                                {inc.status}
                                            </span>
                                        </td>
                                        <td className="py-2 pr-4 text-gray-400">
                                            {inc.start_time ? new Date(inc.start_time).toLocaleString() : "—"}
                                        </td>
                                        <td className="py-2 pr-4 text-gray-400">
                                            {inc.end_time ? new Date(inc.end_time).toLocaleString() : "—"}
                                        </td>
                                        <td className="py-2 pr-4">
                                            {inc.total_time_mins !== null ? inc.total_time_mins : "—"}
                                        </td>
                                        <td className="py-2">
                                            <button
                                                onClick={() => handleGenerateReport(inc.incident_id)}
                                                disabled={reportLoadingId !== null}
                                                className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs text-cyan-300 transition hover:bg-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {reportLoadingId === inc.incident_id ? (
                                                    <span className="flex items-center gap-1">
                                                        <Loader2 size={12} className="animate-spin" />
                                                        Generating
                                                    </span>
                                                ) : (
                                                    "Generate Report"
                                                )}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {reportError && (
                    <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-300">
                        {reportError}
                    </div>
                )}

                {generatedReport && (
                    <div className="mt-4 rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-5">
                        <div className="mb-3 flex items-center gap-2">
                            <FileText size={16} className="text-cyan-400" />
                            <h3 className="text-sm font-semibold text-cyan-300">
                                Incident Report — {generatedReport.incident_id}
                            </h3>
                        </div>
                        <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-gray-300">
                            {generatedReport.report}
                        </pre>
                    </div>
                )}
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