import { useState } from "react";
import { Ambulance, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/status-card";
import { cn } from "@/lib/utils";
import { analyzeIntersection, IntersectionResponse } from "@/services/trafficApi";
import { toast } from "sonner";

/* ----------------------------------
   Types
----------------------------------- */
type Direction = "north" | "south" | "east" | "west";

const directions: Direction[] = ["north", "south", "east", "west"];

/* ----------------------------------
   Component
----------------------------------- */
export const AmbulanceRouteOptimization = () => {
  const [images, setImages] = useState<Partial<Record<Direction, File>>>({});
  const [result, setResult] = useState<IntersectionResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = (dir: Direction, file: File) => {
    setImages((prev) => ({ ...prev, [dir]: file }));
  };

  const handleAnalyze = async () => {
    if (directions.some((d) => !images[d])) {
      toast.error("Upload all 4 direction images");
      return;
    }

    setLoading(true);
    try {
      const response = await analyzeIntersection(images as any);
      setResult(response);

      toast.success(
        response.mode === "EMERGENCY"
          ? "🚑 Ambulance detected — Emergency mode activated"
          : "Intersection analyzed successfully"
      );
    } catch {
      toast.error("Backend analysis failed");
    } finally {
      setLoading(false);
    }
  };

  /* ----------------------------------
     UI
  ----------------------------------- */
  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <GlassCard>
        <h2 className="font-bold mb-4">Intersection CCTV Feeds</h2>
        <div className="grid grid-cols-2 gap-4">
          {directions.map((dir) => (
            <div key={dir} className="space-y-2">
              <label className="text-sm font-semibold capitalize">{dir}</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files && handleUpload(dir, e.target.files[0])}
              />
            </div>
          ))}
        </div>
        <Button className="w-full mt-4" onClick={handleAnalyze} disabled={loading}>
          {loading ? "Analyzing..." : "Analyze Intersection"}
        </Button>
      </GlassCard>

      {/* Emergency Banner */}
      {result?.mode === "EMERGENCY" && (
        <div className="bg-red-600 text-white px-6 py-3 rounded-xl animate-pulse flex items-center gap-2">
          <Ambulance className="w-5 h-5" />
          {result.reason}
        </div>
      )}

      {/* Signal Plan */}
      {result && (
        <GlassCard>
          <h3 className="font-semibold mb-3">Signal Status</h3>
          <div className="grid grid-cols-4 gap-3 text-center">
            {Object.entries(result.signal_plan).map(([dir, state]) => (
              <div
                key={dir}
                className={cn(
                  "p-3 rounded-lg font-bold",
                  state === "GREEN"
                    ? "bg-green-200 text-green-800"
                    : "bg-red-200 text-red-800"
                )}
              >
                {dir.toUpperCase()}
                <br />
                {state}
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Per-Direction Analysis */}
      {result && (
        <GlassCard>
          <h3 className="font-semibold mb-3">Traffic Analysis</h3>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(result.analysis).map(([dir, a]) => (
              <div key={dir} className="p-3 border rounded-lg">
                <div className="font-bold capitalize">{dir}</div>
                <div>Traffic: {a.traffic_level}</div>
                <div>Density: {a.edge_density}</div>
                {a.ambulance_detected && (
                  <div className="text-red-600 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    Ambulance ({a.confidence})
                  </div>
                )}
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
};
