import { Camera, Eye, AlertCircle, Car, Gauge } from "lucide-react";
import { GlassCard } from "@/components/ui/status-card";
import { cn } from "@/lib/utils";

interface Detection {
  type: string;
  count: number;
  icon: React.ElementType;
}

const detections: Detection[] = [
  { type: "Vehicles", count: 47, icon: Car },
  { type: "Pedestrians", count: 23, icon: Eye },
  { type: "Obstructions", count: 2, icon: AlertCircle },
];

type DensityLevel = "High" | "Medium" | "Low";

export const TrafficIntelligence = () => {
  const densityLevel: DensityLevel = "Medium";
  const densityPercentage = 64;

  const getDensityColor = (level: DensityLevel) => {
    switch (level) {
      case "High":
        return "text-emergency";
      case "Medium":
        return "text-warning";
      case "Low":
        return "text-success";
    }
  };

  const getDensityBgColor = (level: DensityLevel) => {
    switch (level) {
      case "High":
        return "bg-emergency";
      case "Medium":
        return "bg-warning";
      case "Low":
        return "bg-success";
    }
  };

  return (
    <GlassCard className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Computer Vision – Traffic Intelligence</h3>
        </div>
        <span className="flex items-center gap-1 text-xs text-success">
          <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          Processing
        </span>
      </div>

      {/* Camera feed simulation */}
      <div className="relative aspect-video bg-background rounded-lg overflow-hidden mb-4 border border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
        
        {/* Simulated camera view */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
              <Camera className="w-8 h-8 text-primary/50" />
            </div>
            <p className="text-xs text-muted-foreground">Camera Feed: CAM-01</p>
            <p className="text-xs text-muted-foreground">Junction A-14</p>
          </div>
        </div>

        {/* AI Detection overlays */}
        <div className="absolute top-2 left-2 px-2 py-1 bg-card/90 backdrop-blur rounded text-xs font-mono text-success border border-border">
          AI: ACTIVE
        </div>
        
        {/* Detection boxes simulation */}
        <div className="absolute top-1/4 left-1/4 w-8 h-6 border-2 border-primary rounded animate-pulse opacity-60" />
        <div className="absolute top-1/3 right-1/3 w-10 h-7 border-2 border-primary rounded animate-pulse opacity-60" style={{ animationDelay: "200ms" }} />
        <div className="absolute bottom-1/4 left-1/2 w-6 h-5 border-2 border-warning rounded animate-pulse opacity-60" style={{ animationDelay: "400ms" }} />
      </div>

      {/* Traffic Density */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Gauge className="w-3 h-3" />
            Traffic Density
          </span>
          <span className={cn("text-sm font-semibold", getDensityColor(densityLevel))}>
            {densityLevel}
          </span>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              getDensityBgColor(densityLevel)
            )}
            style={{ width: `${densityPercentage}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">{densityPercentage}% capacity</p>
      </div>

      {/* Detections */}
      <div className="space-y-2 flex-1">
        <p className="text-xs text-muted-foreground uppercase tracking-wider">Live Detections</p>
        {detections.map((detection) => {
          const Icon = detection.icon;
          return (
            <div
              key={detection.type}
              className="flex items-center justify-between p-2 rounded-lg bg-secondary/50 border border-border/50"
            >
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-foreground">{detection.type}</span>
              </div>
              <span className="text-sm font-semibold text-foreground">{detection.count}</span>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
};
