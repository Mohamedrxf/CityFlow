import { BACKEND_BASE_URL } from "@/lib/apiConfig";

const API_URL = `${BACKEND_BASE_URL}/analyze`;

/**
 * Backend response contract (MATCHES FastAPI)
 */
export interface IntersectionResponse {
  intersection_id: string;
  mode: "NORMAL" | "EMERGENCY";
  reason: string;
  analysis: {
    north: DirectionAnalysis;
    south: DirectionAnalysis;
    east: DirectionAnalysis;
    west: DirectionAnalysis;
  };
  signal_plan: SignalPlan;
}

export interface DirectionAnalysis {
  traffic_level: "LOW" | "MEDIUM" | "HIGH";
  edge_density: number;
  ambulance_detected: boolean;
  confidence: number | null;
}

export interface SignalPlan {
  north: "GREEN" | "RED";
  south: "GREEN" | "RED";
  east: "GREEN" | "RED";
  west: "GREEN" | "RED";
}

/**
 * Analyze a full 4-way intersection
 */
export async function analyzeIntersection(images: {
  north: File;
  south: File;
  east: File;
  west: File;
}): Promise<IntersectionResponse> {
  const formData = new FormData();

  formData.append("north_image", images.north);
  formData.append("south_image", images.south);
  formData.append("east_image", images.east);
  formData.append("west_image", images.west);

  const response = await fetch(API_URL, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
}
