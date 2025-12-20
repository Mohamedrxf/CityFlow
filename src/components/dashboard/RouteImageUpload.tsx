import { useState, useRef } from "react";
import { Camera, Upload, X, Car, CheckCircle2, Loader2 } from "lucide-react";
import { GlassCard } from "@/components/ui/status-card";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface RouteAnalysis {
  routeId: string;
  routeName: string;
  imageUrl: string | null;
  vehicleCount: number | null;
  isAnalyzing: boolean;
  isAnalyzed: boolean;
}

interface RouteImageUploadProps {
  routes: RouteAnalysis[];
  onImageUpload: (routeId: string, file: File) => void;
  onRemoveImage: (routeId: string) => void;
}

const routeColors = {
  A: "border-route bg-route/10",
  B: "border-warning bg-warning/10", 
  C: "border-success bg-success/10",
};

const routeTextColors = {
  A: "text-route",
  B: "text-warning",
  C: "text-success",
};

export const RouteImageUpload = ({ routes, onImageUpload, onRemoveImage }: RouteImageUploadProps) => {
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const handleFileChange = (routeId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageUpload(routeId, file);
    }
  };

  const handleDrop = (routeId: string, e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      onImageUpload(routeId, file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <GlassCard className="h-full">
      <div className="flex items-center gap-2 mb-4">
        <Camera className="w-5 h-5 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Traffic Camera Feeds</h3>
      </div>
      
      <p className="text-xs text-muted-foreground mb-4">
        Upload images from traffic signal cameras for each route to analyze vehicle density
      </p>

      <div className="grid grid-cols-1 gap-4">
        {routes.map((route) => {
          const colorClass = routeColors[route.routeName as keyof typeof routeColors] || "border-border bg-secondary/50";
          const textColorClass = routeTextColors[route.routeName as keyof typeof routeTextColors] || "text-foreground";
          
          return (
            <div key={route.routeId} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className={cn("text-sm font-semibold", textColorClass)}>
                  Route {route.routeName}
                </span>
                {route.isAnalyzed && route.vehicleCount !== null && (
                  <div className="flex items-center gap-1 text-xs">
                    <Car className="w-3 h-3 text-muted-foreground" />
                    <span className="text-foreground font-medium">{route.vehicleCount} vehicles</span>
                  </div>
                )}
              </div>
              
              <div
                className={cn(
                  "relative aspect-video rounded-lg border-2 border-dashed overflow-hidden transition-all duration-200 cursor-pointer",
                  route.imageUrl ? "border-solid" : "hover:border-primary/50",
                  colorClass
                )}
                onDrop={(e) => handleDrop(route.routeId, e)}
                onDragOver={handleDragOver}
                onClick={() => !route.imageUrl && fileInputRefs.current[route.routeId]?.click()}
              >
                <input
                  type="file"
                  ref={(el) => (fileInputRefs.current[route.routeId] = el)}
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => handleFileChange(route.routeId, e)}
                />
                
                {route.imageUrl ? (
                  <>
                    <img
                      src={route.imageUrl}
                      alt={`Route ${route.routeName} camera feed`}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Analysis overlay */}
                    {route.isAnalyzing && (
                      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
                        <div className="text-center">
                          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-2" />
                          <p className="text-xs text-muted-foreground">Analyzing traffic...</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Analyzed overlay */}
                    {route.isAnalyzed && !route.isAnalyzing && (
                      <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent pointer-events-none">
                        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                          <div className="flex items-center gap-1 px-2 py-1 bg-card/90 backdrop-blur rounded text-xs">
                            <CheckCircle2 className="w-3 h-3 text-success" />
                            <span className="text-success font-medium">Analyzed</span>
                          </div>
                          <div className="flex items-center gap-1 px-2 py-1 bg-card/90 backdrop-blur rounded text-xs">
                            <Car className="w-3 h-3 text-foreground" />
                            <span className="text-foreground font-bold">{route.vehicleCount}</span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Remove button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 w-6 h-6 bg-card/90 backdrop-blur hover:bg-destructive hover:text-destructive-foreground"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveImage(route.routeId);
                      }}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                    <Upload className={cn("w-8 h-8 mb-2 opacity-50", textColorClass)} />
                    <p className="text-xs text-muted-foreground text-center">
                      Click or drag image from<br />traffic camera
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
};
