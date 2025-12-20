import { Route, Clock, Ambulance, Bus, Truck, Zap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/status-card";
import { cn } from "@/lib/utils";
import { useState } from "react";

type VehicleType = "ambulance" | "bus" | "logistics";

interface VehicleOption {
  type: VehicleType;
  label: string;
  icon: React.ElementType;
}

const vehicleOptions: VehicleOption[] = [
  { type: "ambulance", label: "Ambulance", icon: Ambulance },
  { type: "bus", label: "Public Transport", icon: Bus },
  { type: "logistics", label: "Logistics", icon: Truck },
];

interface RouteComparison {
  label: string;
  current: string;
  optimized: string;
  improvement: string;
}

const routeData: RouteComparison[] = [
  { label: "Distance", current: "12.4 km", optimized: "11.8 km", improvement: "-5%" },
  { label: "ETA", current: "24 min", optimized: "16 min", improvement: "-33%" },
  { label: "Traffic Stops", current: "8", optimized: "3", improvement: "-62%" },
];

export const RouteOptimization = () => {
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleType>("ambulance");
  const [isOptimizing, setIsOptimizing] = useState(false);

  const handleOptimize = () => {
    setIsOptimizing(true);
    setTimeout(() => setIsOptimizing(false), 2000);
  };

  return (
    <GlassCard className="h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <Route className="w-5 h-5 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Dynamic Route Optimization</h3>
      </div>

      {/* Vehicle Priority Selector */}
      <div className="mb-4">
        <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Priority Mode</p>
        <div className="grid grid-cols-3 gap-2">
          {vehicleOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = selectedVehicle === option.type;
            return (
              <button
                key={option.type}
                onClick={() => setSelectedVehicle(option.type)}
                className={cn(
                  "flex flex-col items-center gap-1 p-3 rounded-lg border transition-all duration-200",
                  isSelected
                    ? "bg-primary/10 border-primary text-primary"
                    : "bg-secondary/50 border-border text-muted-foreground hover:border-primary/50"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{option.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Route Comparison */}
      <div className="flex-1 space-y-3 mb-4">
        <p className="text-xs text-muted-foreground uppercase tracking-wider">Route Comparison</p>
        
        <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground pb-2 border-b border-border">
          <span>Metric</span>
          <span className="text-center">Current</span>
          <span className="text-center">Optimized</span>
        </div>

        {routeData.map((route) => (
          <div key={route.label} className="grid grid-cols-3 gap-2 items-center text-sm">
            <span className="text-muted-foreground">{route.label}</span>
            <span className="text-center text-foreground/70">{route.current}</span>
            <div className="flex items-center justify-center gap-1">
              <span className="text-success font-medium">{route.optimized}</span>
              <span className="text-xs text-success">({route.improvement})</span>
            </div>
          </div>
        ))}
      </div>

      {/* Visual Route Preview */}
      <div className="mb-4 p-3 rounded-lg bg-secondary/30 border border-border">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          <span>Current Route</span>
          <ArrowRight className="w-4 h-4" />
          <span className="text-primary">Optimized Route</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1 bg-warning/50 rounded-full" />
          <Zap className="w-4 h-4 text-primary animate-pulse" />
          <div className="flex-1 h-1 bg-primary rounded-full" />
        </div>
      </div>

      {/* CTA Button */}
      <Button
        variant="glow"
        size="lg"
        className="w-full"
        onClick={handleOptimize}
        disabled={isOptimizing}
      >
        {isOptimizing ? (
          <>
            <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            Optimizing...
          </>
        ) : (
          <>
            <Zap className="w-4 h-4" />
            Apply AI Reroute
          </>
        )}
      </Button>
    </GlassCard>
  );
};
