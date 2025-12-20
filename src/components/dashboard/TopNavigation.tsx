import { Activity, Bell, User, Clock, Cpu } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-card";
import { useEffect, useState } from "react";

export const TopNavigation = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="h-16 bg-card/80 backdrop-blur-xl border-b border-border flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Activity className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Intelligent Route Optimization</h1>
            <p className="text-xs text-muted-foreground">Smart City Transportation System</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <StatusBadge status="active" label="AI Engine Active" />

        <div className="h-8 w-px bg-border" />

        <div className="flex items-center gap-2 text-muted-foreground">
          <Cpu className="w-4 h-4" />
          <span className="text-sm font-medium">98.7%</span>
        </div>

        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span className="text-sm font-mono">
            {time.toLocaleTimeString('en-US', { hour12: false })}
          </span>
        </div>

        <div className="h-8 w-px bg-border" />

        <button className="relative p-2 rounded-lg hover:bg-secondary transition-colors">
          <Bell className="w-5 h-5 text-muted-foreground" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-emergency rounded-full" />
        </button>

        <button className="flex items-center gap-2 p-2 rounded-lg hover:bg-secondary transition-colors">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <User className="w-4 h-4 text-primary" />
          </div>
        </button>
      </div>
    </header>
  );
};
