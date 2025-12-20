import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface StatusBadgeProps {
  status: "active" | "warning" | "error" | "idle";
  label: string;
  pulse?: boolean;
  className?: string;
}

export const StatusBadge = ({ status, label, pulse = true, className }: StatusBadgeProps) => {
  const colors = {
    active: "bg-success",
    warning: "bg-warning",
    error: "bg-emergency",
    idle: "bg-muted-foreground",
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="relative flex h-2.5 w-2.5">
        {pulse && status === "active" && (
          <span className={cn("absolute inline-flex h-full w-full animate-ping rounded-full opacity-75", colors[status])} />
        )}
        <span className={cn("relative inline-flex h-2.5 w-2.5 rounded-full", colors[status])} />
      </span>
      <span className="text-sm font-medium text-foreground">{label}</span>
    </div>
  );
};

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  variant?: "default" | "success" | "warning" | "emergency";
  className?: string;
}

export const MetricCard = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
  variant = "default",
  className,
}: MetricCardProps) => {
  const trendColors = {
    up: "text-success",
    down: "text-emergency",
    neutral: "text-muted-foreground",
  };

  const borderColors = {
    default: "border-border/50",
    success: "border-success/30",
    warning: "border-warning/30",
    emergency: "border-emergency/30",
  };

  return (
    <div
      className={cn(
        "glass-card p-4 border transition-all duration-300 hover:border-primary/30",
        borderColors[variant],
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{title}</p>
          <p className="text-2xl font-semibold text-foreground">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {icon && <div className="text-primary/70">{icon}</div>}
      </div>
      {trend && trendValue && (
        <div className={cn("mt-2 text-xs font-medium", trendColors[trend])}>
          {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"} {trendValue}
        </div>
      )}
    </div>
  );
};

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  glow?: boolean;
}

export const GlassCard = ({ children, className, glow }: GlassCardProps) => {
  return (
    <div
      className={cn(
        "glass-card p-4",
        glow && "glow-effect",
        className
      )}
    >
      {children}
    </div>
  );
};
