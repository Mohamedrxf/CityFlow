const API_URL = "http://127.0.0.1:8000/analyze-traffic";

export interface TrafficResult {
  traffic_level: "LOW" | "MEDIUM" | "HIGH";
  edge_density: number;
  delay_minutes: number;
}

export async function analyzeTraffic(
  file: File
): Promise<TrafficResult> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(API_URL, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Failed to analyze traffic");
  }

  return response.json();
}
