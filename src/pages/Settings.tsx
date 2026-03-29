import { useState } from "react";
import { Save, Sliders, Shield, Cpu, Wifi } from "lucide-react";

const Settings = () => {
    const [sensitivity, setSensitivity] = useState(70);
    const [autoOverride, setAutoOverride] = useState(true);
    const [darkMode, setDarkMode] = useState(true);
    const [simulationSpeed, setSimulationSpeed] = useState(1);
    const [apiEnabled, setApiEnabled] = useState(true);
    const [saved, setSaved] = useState(false);

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <div className="p-6 text-white space-y-6 bg-[#060C15] min-h-full">

            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Sliders size={20} /> System Settings
                </h1>

                <button
                    onClick={handleSave}
                    className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 px-4 py-2 rounded-lg text-sm font-semibold transition"
                >
                    <Save size={16} /> Save Changes
                </button>
            </div>

            {saved && (
                <div className="text-green-400 text-sm">
                    ✅ Settings saved successfully
                </div>
            )}

            {/* Detection Settings */}
            <div className="bg-black/50 border border-gray-800 p-5 rounded-xl space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2 text-orange-400">
                    <Cpu size={16} /> Detection Engine
                </h2>

                <div>
                    <label className="block mb-2 text-sm">
                        Detection Sensitivity: <span className="text-orange-400">{sensitivity}%</span>
                    </label>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={sensitivity}
                        onChange={(e) => setSensitivity(Number(e.target.value))}
                        className="w-full"
                    />
                </div>

                <Toggle
                    label="Enable Auto Override"
                    value={autoOverride}
                    onChange={setAutoOverride}
                />
            </div>

            {/* System Preferences */}
            <div className="bg-black/50 border border-gray-800 p-5 rounded-xl space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2 text-blue-400">
                    <Shield size={16} /> System Preferences
                </h2>

                <Toggle
                    label="Dark Mode"
                    value={darkMode}
                    onChange={setDarkMode}
                />

                <div>
                    <label className="block mb-2 text-sm">
                        Simulation Speed: <span className="text-blue-400">{simulationSpeed}x</span>
                    </label>
                    <input
                        type="range"
                        min="1"
                        max="5"
                        value={simulationSpeed}
                        onChange={(e) => setSimulationSpeed(Number(e.target.value))}
                        className="w-full"
                    />
                </div>
            </div>

            {/* API & Connectivity */}
            <div className="bg-black/50 border border-gray-800 p-5 rounded-xl space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2 text-green-400">
                    <Wifi size={16} /> API & Connectivity
                </h2>

                <Toggle
                    label="Enable Real-time API"
                    value={apiEnabled}
                    onChange={setApiEnabled}
                />

                <div className="text-sm text-gray-400">
                    Status:{" "}
                    <span className={apiEnabled ? "text-green-400" : "text-red-400"}>
                        {apiEnabled ? "Connected" : "Disconnected"}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default Settings;





/* ─── Reusable Toggle Component ─── */

const Toggle = ({
    label,
    value,
    onChange,
}: {
    label: string;
    value: boolean;
    onChange: (v: boolean) => void;
}) => {
    return (
        <div className="flex items-center justify-between">
            <span className="text-sm">{label}</span>

            <div
                onClick={() => onChange(!value)}
                className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition ${value ? "bg-orange-500" : "bg-gray-600"
                    }`}
            >
                <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition ${value ? "translate-x-6" : ""
                        }`}
                />
            </div>
        </div>
    );
};