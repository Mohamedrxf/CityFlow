import type { Position3D, RoadSegmentData } from "./types";

// City layout mapping backend node IDs to 3D positions
// Layout:
//   INT_01 ---- INT_02 ---- INT_03
//      |            |            |
//   INT_04 ---- INT_05 ---- INT_06
//      |            |            |
//   INT_07 ---- INT_08 ---- HOSPITAL_A
//
// HOSPITAL_B is placed near INT_03

export const NODE_POSITIONS: Record<string, Position3D> = {
  INT_01: { x: -20, y: 0, z: -20 },
  INT_02: { x: 0, y: 0, z: -20 },
  INT_03: { x: 20, y: 0, z: -20 },
  INT_04: { x: -20, y: 0, z: 0 },
  INT_05: { x: 0, y: 0, z: 0 },
  INT_06: { x: 20, y: 0, z: 0 },
  INT_07: { x: -20, y: 0, z: 20 },
  INT_08: { x: 0, y: 0, z: 20 },
  HOSPITAL_A: { x: 20, y: 0, z: 20 },
  HOSPITAL_B: { x: 30, y: 0, z: -20 },
};

// Road segments connecting intersections
export const ROAD_SEGMENTS: RoadSegmentData[] = [
  // Horizontal roads (top)
  { startNodeId: "INT_01", endNodeId: "INT_02" },
  { startNodeId: "INT_02", endNodeId: "INT_03" },
  // Horizontal roads (middle)
  { startNodeId: "INT_04", endNodeId: "INT_05" },
  { startNodeId: "INT_05", endNodeId: "INT_06" },
  // Horizontal roads (bottom)
  { startNodeId: "INT_07", endNodeId: "INT_08" },
  { startNodeId: "INT_08", endNodeId: "HOSPITAL_A" },
  // Vertical roads (left)
  { startNodeId: "INT_01", endNodeId: "INT_04" },
  { startNodeId: "INT_04", endNodeId: "INT_07" },
  // Vertical roads (center)
  { startNodeId: "INT_02", endNodeId: "INT_05" },
  { startNodeId: "INT_05", endNodeId: "INT_08" },
  // Vertical roads (right)
  { startNodeId: "INT_03", endNodeId: "INT_06" },
  { startNodeId: "INT_06", endNodeId: "HOSPITAL_A" },
  // Hospital B connection
  { startNodeId: "INT_03", endNodeId: "HOSPITAL_B" },
];

// Grid size for road calculations
export const ROAD_WIDTH = 6;
export const LANE_WIDTH = 2.5;

// Get position by node ID
export function getNodePosition(nodeId: string): Position3D | null {
  return NODE_POSITIONS[nodeId] ?? null;
}

// Get world position on road between two nodes at progress (0-1)
export function getPositionOnRoad(
  startNodeId: string,
  endNodeId: string,
  progress: number
): Position3D | null {
  const start = NODE_POSITIONS[startNodeId];
  const end = NODE_POSITIONS[endNodeId];
  if (!start || !end) return null;

  return {
    x: start.x + (end.x - start.x) * progress,
    y: 0.1,
    z: start.z + (end.z - start.z) * progress,
  };
}

// Get world position along a multi-segment path at progress (0–1)
export function getPositionOnPath(
  nodeIds: string[],
  progress: number
): Position3D | null {
  if (nodeIds.length < 2) return null;

  const clamped = Math.min(1, Math.max(0, progress));

  const segments: { start: Position3D; end: Position3D; length: number }[] = [];
  let totalLength = 0;

  for (let i = 0; i < nodeIds.length - 1; i++) {
    const start = NODE_POSITIONS[nodeIds[i]];
    const end = NODE_POSITIONS[nodeIds[i + 1]];
    if (!start || !end) return null;
    const dx = end.x - start.x;
    const dz = end.z - start.z;
    const length = Math.sqrt(dx * dx + dz * dz);
    segments.push({ start, end, length });
    totalLength += length;
  }

  if (totalLength === 0) return null;

  const targetDistance = clamped * totalLength;
  let accumulated = 0;

  for (const seg of segments) {
    if (accumulated + seg.length >= targetDistance) {
      const localProgress = seg.length > 0
        ? (targetDistance - accumulated) / seg.length
        : 0;
      return {
        x: seg.start.x + (seg.end.x - seg.start.x) * localProgress,
        y: 0.1,
        z: seg.start.z + (seg.end.z - seg.start.z) * localProgress,
      };
    }
    accumulated += seg.length;
  }

  // At or past the last segment
  const last = segments[segments.length - 1];
  return { x: last.end.x, y: 0.1, z: last.end.z };
}
