import { TrendingUp, TrendingDown, Clock, AlertTriangle, CheckCircle, Zap } from "lucide-react";
import { GlassCard, MetricCard } from "@/components/ui/status-card";
import { cn } from "@/lib/utils";

interface Prediction {
  label: string;
  value: string;
  change: string;
  trend: "up" | "down";
  icon: React.ElementType;
}

const predictions: Prediction[] = [
  { label: "Predicted Delay", value: "4.2 min", change: "-23%", trend: "down", icon: Clock },
  { label: "Congestion Risk", value: "67%", change: "+5%", trend: "up", icon: AlertTriangle },
  { label: "Reroute Success", value: "94%", change: "+12%", trend: "down", icon: CheckCircle },
];

export const PredictiveInsights = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Predictive Insights</h3>
        </div>
        <span className="text-xs text-muted-foreground">Updated 30s ago</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {predictions.map((prediction, index) => {
          const Icon = prediction.icon;
          const TrendIcon = prediction.trend === "up" ? TrendingUp : TrendingDown;
          const isPositive = 
            (prediction.label === "Predicted Delay" && prediction.trend === "down") ||
            (prediction.label === "Reroute Success" && prediction.trend === "down") ||
            (prediction.label === "Congestion Risk" && prediction.trend === "down");

          return (
            <GlassCard
              key={prediction.label}
              className="animate-fade-in"
              glow={index === 2}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div className={cn(
                  "flex items-center gap-1 text-xs font-medium",
                  isPositive ? "text-success" : "text-emergency"
                )}>
                  <TrendIcon className="w-3 h-3" />
                  {prediction.change}
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground mb-1">{prediction.value}</p>
              <p className="text-xs text-muted-foreground">{prediction.label}</p>
            </GlassCard>
          );
        })}
      </div>

      {/* Mini chart simulation */}
      <GlassCard className="p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-muted-foreground">Congestion Probability (Next 2hrs)</span>
          <span className="text-xs text-primary font-medium">Live forecast</span>
        </div>
        <div className="h-20 flex items-end justify-between gap-1">
          {[35, 42, 58, 67, 72, 68, 55, 48, 42, 38, 35, 32].map((value, i) => (
            <div
              key={i}
              className={cn(
                "flex-1 rounded-t transition-all duration-300",
                value > 60 ? "bg-emergency/80" : value > 40 ? "bg-warning/80" : "bg-success/80"
              )}
              style={{ 
                height: `${value}%`,
                animationDelay: `${i * 50}ms`
              }}
            />
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>Now</span>
          <span>+30m</span>
          <span>+1h</span>
          <span>+1.5h</span>
          <span>+2h</span>
        </div>
      </GlassCard>
    </div>
  );
};
