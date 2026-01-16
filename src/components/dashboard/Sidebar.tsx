import { 
  Activity, 
  Route, 
  AlertTriangle, 
  TrendingUp, 
  Play, 
  BarChart3, 
  Settings,
  Map,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface SidebarItem {
  icon: React.ElementType;
  label: string;
  id: string;
  badge?: string;
}

const sidebarItems: SidebarItem[] = [
  { icon: Map, label: "Live Traffic Analysis", id: "traffic", badge: "Live" },
  { icon: Route, label: "Route Optimization", id: "routes" },
  { icon: AlertTriangle, label: "Emergency Priority", id: "emergency", badge: "3" },
  { icon: TrendingUp, label: "Prediction Insights", id: "predictions" },
  { icon: Play, label: "Simulation Mode", id: "simulation" },
  { icon: BarChart3, label: "Analytics Dashboard", id: "analytics" },
  { icon: Settings, label: "Settings", id: "settings" },
];

interface DashboardSidebarProps {
  activeItem: string;
  onItemClick: (id: string) => void;
}

export const DashboardSidebar = ({ activeItem, onItemClick }: DashboardSidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "h-full bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex-1 py-4 overflow-y-auto scrollbar-hide">
        <nav className="space-y-1 px-2">
          {sidebarItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = activeItem === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onItemClick(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                  "hover:bg-sidebar-accent",
                  isActive 
                    ? "bg-primary/10 text-primary border border-primary/20" 
                    : "text-sidebar-foreground border border-transparent",
                  "animate-fade-in"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <Icon className={cn(
                  "w-5 h-5 flex-shrink-0 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                )} />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left text-sm font-medium">{item.label}</span>
                    {item.badge && (
                      <span className={cn(
                        "px-2 py-0.5 text-xs font-medium rounded-full",
                        item.badge === "Live" 
                          ? "bg-success/20 text-success" 
                          : "bg-emergency/20 text-emergency"
                      )}>
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-2 border-t border-sidebar-border">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors"
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>
    </aside>
  );
};
