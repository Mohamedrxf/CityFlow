import { Bell, User, Clock, Cpu, Moon, Sun, Menu } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-card";
import { Switch } from "@/components/ui/switch";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

interface TopNavigationProps {
  sidebarCollapsed: boolean;
  onSidebarToggle: () => void;
}

export const TopNavigation = ({ sidebarCollapsed, onSidebarToggle }: TopNavigationProps) => {
  const [time, setTime] = useState(new Date());
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="sticky top-0 z-50 h-16 bg-card/80 backdrop-blur-xl border-b border-border/50 flex items-center justify-between px-4 md:px-6 shadow-sm">
      <div className="flex items-center gap-3 md:gap-4">
        {/* Hamburger Menu Button */}
        <button
          onClick={onSidebarToggle}
          className={cn(
            "p-2 rounded-lg transition-colors duration-200 flex items-center justify-center",
            "bg-primary/10 hover:bg-primary/20 border border-primary/20",
            "shadow-sm hover:shadow-md",
            "text-primary"
          )}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5">
            <img
              src="/architecture-and-city.png"
              alt="CityFlow Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-base md:text-lg font-semibold text-foreground">
              CityFlow
            </h1>
            <p className="text-xs text-muted-foreground">
              Smart City Traffic Control
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4 lg:gap-6">
        <div className="hidden lg:flex items-center gap-4">
          <StatusBadge status="active" label="AI Engine Active" />
          <div className="h-8 w-px bg-border" />
          <div className="flex items-center gap-2 text-muted-foreground">
            <Cpu className="w-4 h-4" />
            <span className="text-sm font-medium">98.7%</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-mono">
              {time.toLocaleTimeString("en-US", { hour12: false })}
            </span>
          </div>
          <div className="h-8 w-px bg-border" />
        </div>

        <button 
          className="relative p-2 rounded-lg hover:bg-secondary/50 transition-colors duration-200"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5 text-muted-foreground" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-emergency rounded-full animate-pulse" />
        </button>

        <div className="h-8 w-px bg-border hidden sm:block" />

        <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-secondary/30">
          <Sun className={cn("w-4 h-4 transition-colors", theme === "light" ? "text-foreground" : "text-muted-foreground")} />
          {mounted && (
            <Switch
              checked={theme === "dark"}
              onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
              aria-label="Toggle theme"
              className="data-[state=checked]:bg-primary"
            />
          )}
          <Moon className={cn("w-4 h-4 transition-colors", theme === "dark" ? "text-foreground" : "text-muted-foreground")} />
        </div>

        <div className="h-8 w-px bg-border hidden sm:block" />

        <button 
          className="flex items-center gap-2 p-2 rounded-lg hover:bg-secondary/50 transition-colors duration-200"
          aria-label="Profile"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center border border-primary/20">
            <User className="w-4 h-4 text-primary" />
          </div>
        </button>
      </div>
    </header>
  );
};
