// services/analyzeApi.ts

export interface DirectionAnalysis {
  traffic_level: string;
  edge_density: number;
  ambulance_detected: boolean;
  confidence: number | null;
}

export interface AnalyzeResponse {
  intersection_id: string;
  mode: string;
  analysis: {
    north: DirectionAnalysis;
    south: DirectionAnalysis;
    east: DirectionAnalysis;
    west: DirectionAnalysis;
  };
  signal_plan: any;
  reason: string;
}

import { BACKEND_BASE_URL } from "@/lib/apiConfig";

const BASE_URL = BACKEND_BASE_URL;

export async function analyzeIntersection(
  north: File,
  south: File,
  east: File,
  west: File,
): Promise<AnalyzeResponse> {
  const formData = new FormData();
  formData.append("north_image", north);
  formData.append("south_image", south);
  formData.append("east_image", east);
  formData.append("west_image", west);

  try {
    const response = await fetch(`${BASE_URL}/analyze`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Backend error: ${response.status} - ${err}`);
    }

    return await response.json();
  } catch (error) {
    console.error("❌ Analyze failed:", error);
    throw error;
  }
}
