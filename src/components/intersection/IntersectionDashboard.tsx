import { useState } from "react";
import { analyzeIntersection } from "@/services/trafficApi";
import { DirectionUploadCard } from "./DirectionUploadCard";
import { SignalDisplay } from "./SignalDisplay";
import { EmergencyBanner } from "./EmergencyBanner";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const DIRECTIONS = ["north", "south", "east", "west"] as const;

export const IntersectionDashboard = () => {
  const [images, setImages] = useState<Record<string, File | null>>({
    north: null,
    south: null,
    east: null,
    west: null,
  });

  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = (dir: string, file: File) => {
    setImages((prev) => ({ ...prev, [dir]: file }));
  };

  const handleAnalyze = async () => {
    if (Object.values(images).some((v) => !v)) {
      toast.error("Upload all four direction images");
      return;
    }

    const formData = new FormData();
    DIRECTIONS.forEach((d) => {
      formData.append(`${d}_image`, images[d]!);
    });

    try {
      setLoading(true);
      const res = await analyzeIntersection({
        north: images.north!,
        south: images.south!,
        east: images.east!,
        west: images.west!,
      });
      setResult(res);
      toast.success("Intersection analyzed");
    } catch {
      toast.error("Backend error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {result?.mode === "EMERGENCY" && <EmergencyBanner reason={result.reason} />}

      <div className="grid grid-cols-2 gap-4">
        {DIRECTIONS.map((dir) => (
          <DirectionUploadCard
            key={dir}
            direction={dir}
            onUpload={(file) => handleUpload(dir, file)}
            analysis={result?.analysis?.[dir]}
          />
        ))}
      </div>

      {result && <SignalDisplay signals={result.signal_plan} />}

      <Button onClick={handleAnalyze} disabled={loading} className="w-full">
        {loading ? "Analyzing..." : "Analyze Intersection"}
      </Button>
    </div>
  );
};
