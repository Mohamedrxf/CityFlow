export type SignalState = "RED" | "YELLOW" | "GREEN";

export interface Position3D {
  x: number;
  y: number;
  z: number;
}

export interface VehicleData {
  id: string;
  type: "car" | "bus" | "truck";
  position: Position3D;
  rotation: number;
  speed: number;
  color: string;
  startNodeId: string;
  endNodeId: string;
  progress: number;
}

export interface AmbulanceData {
  id: string;
  position: Position3D;
  rotation: number;
  progress: number;
  emergencyActive: boolean;
}

export interface EmergencyRouteData {
  nodeIds: string[];
  active: boolean;
}

export interface RoadSegmentData {
  startNodeId: string;
  endNodeId: string;
}

export interface IntersectionData {
  id: string;
  position: Position3D;
  isHospital: boolean;
}
