import { useState, useEffect } from "react";
import { Route, Ambulance, Zap, Hospital, MapPin, CheckCircle2, Clock, Car, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/status-card";
import { cn } from "@/lib/utils";
import { RouteImageUpload, RouteAnalysis } from "./RouteImageUpload";
import { toast } from "sonner";

interface RouteInfo {
  id: string;
  name: string;
  distance: string;
  baseETA: number; // in minutes
  vehicleCount: number | null;
  trafficDelay: number; // calculated delay based on vehicles
  totalETA: number;
  isOptimal: boolean;
}

const initialRoutes: RouteAnalysis[] = [
  { routeId: "route-a", routeName: "A", imageUrl: null, vehicleCount: null, isAnalyzing: false, isAnalyzed: false },
  { routeId: "route-b", routeName: "B", imageUrl: null, vehicleCount: null, isAnalyzing: false, isAnalyzed: false },
  { routeId: "route-c", routeName: "C", imageUrl: null, vehicleCount: null, isAnalyzing: false, isAnalyzed: false },
];

const routeDistances: { [key: string]: { distance: string; baseETA: number } } = {
  "route-a": { distance: "4.2 km", baseETA: 8 },
  "route-b": { distance: "5.8 km", baseETA: 11 },
  "route-c": { distance: "3.5 km", baseETA: 7 },
};

export const AmbulanceRouteOptimization = () => {
  const [routes, setRoutes] = useState<RouteAnalysis[]>(initialRoutes);
  const [routeInfo, setRouteInfo] = useState<RouteInfo[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationComplete, setOptimizationComplete] = useState(false);

  // Calculate route info whenever routes change
  useEffect(() => {
    const info: RouteInfo[] = routes.map((route) => {
      const { distance, baseETA } = routeDistances[route.routeId];
      const vehicleCount = route.vehicleCount ?? 0;
      // Traffic delay calculation: ~0.5 min per 10 vehicles
      const trafficDelay = route.isAnalyzed ? Math.round(vehicleCount * 0.05) : 0;
      const totalETA = baseETA + trafficDelay;
      
      return {
        id: route.routeId,
        name: route.routeName,
        distance,
        baseETA,
        vehicleCount: route.vehicleCount,
        trafficDelay,
        totalETA,
        isOptimal: false,
      };
    });
    
    // Find optimal route (lowest ETA among analyzed routes)
    const analyzedRoutes = info.filter((r) => routes.find((route) => route.routeId === r.id)?.isAnalyzed);
    if (analyzedRoutes.length > 0) {
      const minETA = Math.min(...analyzedRoutes.map((r) => r.totalETA));
      info.forEach((r) => {
        if (routes.find((route) => route.routeId === r.id)?.isAnalyzed && r.totalETA === minETA) {
          r.isOptimal = true;
        }
      });
    }
    
    setRouteInfo(info);
  }, [routes]);

  const handleImageUpload = (routeId: string, file: File) => {
    const imageUrl = URL.createObjectURL(file);
    
    setRoutes((prev) =>
      prev.map((route) =>
        route.routeId === routeId
          ? { ...route, imageUrl, isAnalyzing: true, isAnalyzed: false, vehicleCount: null }
          : route
      )
    );

    // Simulate AI analysis (random vehicle count between 5-80)
    setTimeout(() => {
      const vehicleCount = Math.floor(Math.random() * 75) + 5;
      setRoutes((prev) =>
        prev.map((route) =>
          route.routeId === routeId
            ? { ...route, isAnalyzing: false, isAnalyzed: true, vehicleCount }
            : route
        )
      );
      toast.success(`Route ${routeId.split("-")[1].toUpperCase()} analyzed: ${vehicleCount} vehicles detected`);
    }, 2000);
  };

  const handleRemoveImage = (routeId: string) => {
    setRoutes((prev) =>
      prev.map((route) =>
        route.routeId === routeId
          ? { ...route, imageUrl: null, isAnalyzing: false, isAnalyzed: false, vehicleCount: null }
          : route
      )
    );
    setSelectedRoute(null);
    setOptimizationComplete(false);
  };

  const handleOptimize = () => {
    const analyzedRoutes = routes.filter((r) => r.isAnalyzed);
    if (analyzedRoutes.length === 0) {
      toast.error("Please upload at least one traffic camera image to analyze");
      return;
    }

    setIsOptimizing(true);
    
    setTimeout(() => {
      const optimalRoute = routeInfo.find((r) => r.isOptimal);
      if (optimalRoute) {
        setSelectedRoute(optimalRoute.id);
        setOptimizationComplete(true);
        toast.success(`Optimal route selected: Route ${optimalRoute.name} with ${optimalRoute.totalETA} min ETA`);
      }
      setIsOptimizing(false);
    }, 1500);
  };

  const allAnalyzed = routes.every((r) => r.isAnalyzed);
  const anyAnalyzed = routes.some((r) => r.isAnalyzed);

  const getRouteColor = (name: string) => {
    switch (name) {
      case "A": return "route";
      case "B": return "warning";
      case "C": return "success";
      default: return "primary";
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
      {/* Left Side - Image Upload */}
      <RouteImageUpload 
        routes={routes} 
        onImageUpload={handleImageUpload}
        onRemoveImage={handleRemoveImage}
      />

      {/* Right Side - Route Analysis & Selection */}
      <div className="space-y-6">
        {/* Header */}
        <GlassCard>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-emergency/20 flex items-center justify-center">
              <Ambulance className="w-6 h-6 text-emergency" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Ambulance Route Optimizer</h2>
              <p className="text-xs text-muted-foreground">AI-powered optimal route selection to hospital</p>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emergency" />
              <span className="text-sm text-foreground">Current Location</span>
            </div>
            <div className="flex items-center gap-2">
              <Hospital className="w-4 h-4 text-success" />
              <span className="text-sm text-foreground">City General Hospital</span>
            </div>
          </div>
        </GlassCard>

        {/* Route Comparison */}
        <GlassCard className="flex-1">
          <div className="flex items-center gap-2 mb-4">
            <Route className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Route Comparison</h3>
          </div>

          <div className="space-y-3">
            {routeInfo.map((route) => {
              const routeData = routes.find((r) => r.routeId === route.id);
              const isAnalyzed = routeData?.isAnalyzed ?? false;
              const isSelected = selectedRoute === route.id;
              const colorClass = getRouteColor(route.name);
              
              return (
                <div
                  key={route.id}
                  className={cn(
                    "p-4 rounded-lg border-2 transition-all duration-300",
                    isSelected && optimizationComplete
                      ? `border-${colorClass} bg-${colorClass}/10 ring-2 ring-${colorClass}/30`
                      : route.isOptimal && isAnalyzed
                      ? `border-${colorClass}/50 bg-${colorClass}/5`
                      : "border-border bg-secondary/30"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                        `bg-${colorClass}/20 text-${colorClass}`
                      )}>
                        {route.name}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-foreground">Route {route.name}</p>
                        <p className="text-xs text-muted-foreground">{route.distance}</p>
                      </div>
                    </div>
                    
                    {route.isOptimal && isAnalyzed && (
                      <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-success/20 text-success text-xs font-medium">
                        <CheckCircle2 className="w-3 h-3" />
                        Optimal
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <div className="text-center p-2 rounded bg-background/50">
                      <Car className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">Vehicles</p>
                      <p className={cn(
                        "text-sm font-bold",
                        isAnalyzed ? "text-foreground" : "text-muted-foreground"
                      )}>
                        {isAnalyzed ? route.vehicleCount : "—"}
                      </p>
                    </div>
                    
                    <div className="text-center p-2 rounded bg-background/50">
                      <AlertTriangle className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">Delay</p>
                      <p className={cn(
                        "text-sm font-bold",
                        isAnalyzed 
                          ? route.trafficDelay > 3 ? "text-emergency" : route.trafficDelay > 1 ? "text-warning" : "text-success"
                          : "text-muted-foreground"
                      )}>
                        {isAnalyzed ? `+${route.trafficDelay}m` : "—"}
                      </p>
                    </div>
                    
                    <div className="text-center p-2 rounded bg-background/50">
                      <Clock className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">ETA</p>
                      <p className={cn(
                        "text-sm font-bold",
                        isAnalyzed ? "text-foreground" : "text-muted-foreground"
                      )}>
                        {isAnalyzed ? `${route.totalETA}m` : `${route.baseETA}m`}
                      </p>
                    </div>
                  </div>
                  
                  {!isAnalyzed && (
                    <p className="text-xs text-muted-foreground text-center mt-2 italic">
                      Upload camera image to analyze
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </GlassCard>

        {/* Optimization Button */}
        <Button
          variant="glow"
          size="lg"
          className="w-full"
          onClick={handleOptimize}
          disabled={isOptimizing || !anyAnalyzed}
        >
          {isOptimizing ? (
            <>
              <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              Calculating Optimal Route...
            </>
          ) : optimizationComplete ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Route Selected - Dispatch Ambulance
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              {allAnalyzed ? "Find Optimal Route" : anyAnalyzed ? "Analyze & Find Route" : "Upload Images First"}
            </>
          )}
        </Button>
        
        {!anyAnalyzed && (
          <p className="text-xs text-muted-foreground text-center">
            Upload traffic camera images for at least one route to enable optimization
          </p>
        )}
      </div>
    </div>
  );
};
