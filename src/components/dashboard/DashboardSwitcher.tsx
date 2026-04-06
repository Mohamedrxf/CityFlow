import { NavLink } from "react-router-dom";
import { Ambulance, Monitor } from "lucide-react";

const base =
    "px-4 py-2 rounded-xl text-sm md:text-base font-semibold transition-all duration-300 border";
const active =
    "bg-red-600 text-white border-red-500 shadow-lg shadow-red-500/20";
const inactive =
    "bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:text-white";

export default function DashboardSwitcher() {
    return (
        <div className="flex items-center gap-3">
            <NavLink
                to="/command"
                className={({ isActive }) => `${base} ${isActive ? active : inactive}`}
            >
                <span className="flex items-center gap-2">
                    <Monitor size={18} />
                    Command
                </span>
            </NavLink>

            <NavLink
                to="/driver"
                className={({ isActive }) => `${base} ${isActive ? active : inactive}`}
            >
                <span className="flex items-center gap-2">
                    <Ambulance size={18} />
                    Driver
                </span>
            </NavLink>
        </div>
    );
}