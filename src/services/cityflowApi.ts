export interface AnalyzeResponse {
    intersection_id: string;
    mode: string;
    analysis: Record<
        string,
        {
            traffic_level: string;
            edge_density: number;
            ambulance_detected: boolean;
            confidence: number | null;
        }
    >;
    signal_plan: Record<string, string>;
    reason: string;
}

const API_BASE = "http://localhost:8000";

export async function analyzeIntersection(files: {
    north: File;
    south: File;
    east: File;
    west: File;
}): Promise<AnalyzeResponse> {
    const formData = new FormData();
    formData.append("north_image", files.north);
    formData.append("south_image", files.south);
    formData.append("east_image", files.east);
    formData.append("west_image", files.west);

    const response = await fetch(`${API_BASE}/analyze`, {
        method: "POST",
        body: formData,
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Failed to analyze intersection");
    }

    return response.json();
}