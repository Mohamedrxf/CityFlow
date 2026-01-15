import { 
  Activity, 
  Route, 
  AlertTriangle, 
  TrendingUp, 
  Play, 
  BarChart3, 
  Settings,
  Map,
  Menu,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";

interface SidebarItem {
  icon: React.ElementType;
  label: string;
  id: string;
  badge?: string;
}

const sidebarItems: SidebarItem[] = [
  { icon: Map, label: "Live Traffic", id: "traffic", badge: "Live" },
  { icon: Route, label: "Route Optimization", id: "route" },
  { icon: AlertTriangle, label: "Emergency Priority", id: "emergency", badge: "3" },
  { icon: TrendingUp, label: "Prediction Insights", id: "predictions" },
  { icon: Play, label: "Simulation", id: "simulation" },
  { icon: BarChart3, label: "Analytics", id: "analytics" },
  { icon: Settings, label: "Settings", id: "settings" },
];

interface DashboardSidebarProps {
  activeItem: string;
  onItemClick: (id: string) => void;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

export const DashboardSidebar = ({ 
  activeItem, 
  onItemClick,
  collapsed: externalCollapsed,
  onCollapsedChange
}: DashboardSidebarProps) => {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useIsMobile();
  
  // Use external collapsed state if provided, otherwise use internal
  const collapsed = externalCollapsed !== undefined ? externalCollapsed : internalCollapsed;
  const setCollapsed = onCollapsedChange || setInternalCollapsed;

  useEffect(() => {
    if (!isMobile) {
      setMobileOpen(false);
    }
  }, [isMobile]);

  const handleItemClick = (id: string) => {
    onItemClick(id);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const SidebarContent = () => (
    <div className="flex-1 py-4 overflow-y-auto scrollbar-hide">
      <nav className="space-y-1 px-2">
        {sidebarItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = activeItem === item.id;

          const buttonContent = (
            <button
              key={item.id}
              onClick={() => handleItemClick(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-200 group relative",
                "hover:bg-sidebar-accent",
                isActive 
                  ? "bg-primary/10 text-primary border border-primary/20 shadow-sm shadow-primary/10" 
                  : "text-sidebar-foreground border border-transparent"
              )}
            >
              <Icon className={cn(
                "w-5 h-5 flex-shrink-0 transition-colors duration-200",
                isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
              )} />
              {!collapsed && (
                <>
                  <span className="flex-1 text-left text-sm font-medium">{item.label}</span>
                  {item.badge && (
                    <span className={cn(
                      "px-2 py-0.5 text-xs font-medium rounded-full transition-all",
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

          if (collapsed && !isMobile) {
            return (
              <Tooltip key={item.id}>
                <TooltipTrigger asChild>
                  {buttonContent}
                </TooltipTrigger>
                <TooltipContent side="right" className="ml-2">
                  <p>{item.label}</p>
                  {item.badge && <p className="text-xs text-muted-foreground mt-1">{item.badge}</p>}
                </TooltipContent>
              </Tooltip>
            );
          }

          return buttonContent;
        })}
      </nav>
    </div>
  );

  if (isMobile) {
    return (
      <>
        <button
          onClick={() => setMobileOpen(true)}
          className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-card/80 backdrop-blur-xl border border-border hover:bg-secondary transition-all duration-200 lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {mobileOpen && (
          <>
            <div 
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <aside
              className={cn(
                "fixed left-0 top-0 h-full bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 z-50 w-64 shadow-xl",
                mobileOpen ? "translate-x-0" : "-translate-x-full"
              )}
            >
              <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
                <h2 className="text-lg font-semibold">Menu</h2>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-2 rounded-lg hover:bg-sidebar-accent transition-colors"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <SidebarContent />
            </aside>
          </>
        )}
      </>
    );
  }

  return (
    <aside
      className={cn(
        "h-full bg-sidebar/95 backdrop-blur-sm border-r border-sidebar-border flex flex-col transition-[width] duration-300 ease-in-out",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <SidebarContent />
    </aside>
  );
};
