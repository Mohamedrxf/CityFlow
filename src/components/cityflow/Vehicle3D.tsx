import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { getPositionOnRoad } from "./cityLayout";
import type { Position3D } from "./types";

interface Vehicle3DProps {
  id: string;
  type: "car" | "bus" | "truck";
  startNodeId: string;
  endNodeId: string;
  progress: number;
  speed: number;
  color: string;
  position?: Position3D;
  rotation?: number;
  ambulancePosition?: Position3D | null;
  emergencyRouteNodeIds?: string[];
}

const VEHICLE_DIMENSIONS = {
  car: { width: 1.2, height: 0.8, length: 2.2 },
  bus: { width: 1.6, height: 1.4, length: 4 },
  truck: { width: 1.5, height: 1.2, length: 3.2 },
};

// Distance (in world units) within which a vehicle yields to an approaching ambulance
const YIELD_DISTANCE_THRESHOLD = 25;

// Checks whether this vehicle's road segment appears as a consecutive pair
// in the emergency route (in either travel direction)
function isVehicleOnEmergencyRoute(
  startNodeId: string,
  endNodeId: string,
  routeNodeIds: string[] | undefined
): boolean {
  if (!routeNodeIds || routeNodeIds.length < 2) return false;
  for (let i = 0; i < routeNodeIds.length - 1; i++) {
    const a = routeNodeIds[i];
    const b = routeNodeIds[i + 1];
    if (
      (a === startNodeId && b === endNodeId) ||
      (a === endNodeId && b === startNodeId)
    ) {
      return true;
    }
  }
  return false;
}

export function Vehicle3D({
  type,
  startNodeId,
  endNodeId,
  progress: initialProgress,
  speed,
  color,
  ambulancePosition,
  emergencyRouteNodeIds,
}: Vehicle3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const currentProgressRef = useRef(Math.min(1, Math.max(0, initialProgress)));
  const dims = VEHICLE_DIMENSIONS[type];

  // Compute segment geometry once from road node positions
  const segmentInfo = useMemo(() => {
    const start = getPositionOnRoad(startNodeId, endNodeId, 0);
    const end = getPositionOnRoad(startNodeId, endNodeId, 1);
    if (!start || !end) return null;

    const dx = end.x - start.x;
    const dz = end.z - start.z;
    const length = Math.sqrt(dx * dx + dz * dz);
    const angle = Math.atan2(dx, dz);

    return { start, end, length, angle };
  }, [startNodeId, endNodeId]);

  if (!segmentInfo) return null;

    // Initial road-based position for first render (before first frame)
  const initialPos = useMemo(
    () =>
      getPositionOnRoad(startNodeId, endNodeId, initialProgress) ??
      { x: 0, y: 0, z: 0 },
    [startNodeId, endNodeId, initialProgress]
  );

    useFrame((_, delta) => {
    if (!groupRef.current || !segmentInfo) return;
    if (currentProgressRef.current >= 1) return;

    // Determine effective speed: yield to ambulance if on its route and nearby
    let effectiveSpeed = speed;
    if (
      ambulancePosition &&
      emergencyRouteNodeIds &&
      isVehicleOnEmergencyRoute(startNodeId, endNodeId, emergencyRouteNodeIds)
    ) {
      const pos = getPositionOnRoad(
        startNodeId,
        endNodeId,
        currentProgressRef.current
      );
      if (pos) {
        const dx = pos.x - ambulancePosition.x;
        const dz = pos.z - ambulancePosition.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        if (distance < YIELD_DISTANCE_THRESHOLD) {
          effectiveSpeed = 0;
        }
      }
    }

    if (effectiveSpeed <= 0) return;

    const segmentLength = segmentInfo.length;
    if (segmentLength > 0) {
      currentProgressRef.current += (effectiveSpeed * delta) / segmentLength;
      currentProgressRef.current = Math.min(1, currentProgressRef.current);
    }

    const pos = getPositionOnRoad(
      startNodeId,
      endNodeId,
      currentProgressRef.current
    );
    if (pos) {
      groupRef.current.position.set(
        pos.x,
        pos.y + dims.height / 2,
        pos.z
      );
    }

    // Orient vehicle along road direction (start → end)
    groupRef.current.rotation.y = segmentInfo.angle;
  });

  const bodyColor = useMemo(() => {
    const colors: Record<string, string> = {
      car: "#3a6df0",
      bus: "#f0a030",
      truck: "#50a050",
    };
    return colors[type] || color || "#4080c0";
  }, [type, color]);

  return (
    <group
      ref={groupRef}
      position={[initialPos.x, initialPos.y + dims.height / 2, initialPos.z]}
      rotation={[0, segmentInfo.angle, 0]}
    >
      {/* Vehicle body */}
      <mesh castShadow>
        <boxGeometry args={[dims.width, dims.height, dims.length]} />
        <meshStandardMaterial color={bodyColor} metalness={0.3} roughness={0.7} />
      </mesh>

      {/* Roof / cabin */}
      <mesh position={[0, dims.height / 2 + 0.15, type === "bus" ? 0 : -0.2]} castShadow>
        <boxGeometry args={[dims.width * 0.85, 0.3, dims.length * 0.5]} />
        <meshStandardMaterial color="#1a2030" metalness={0.5} roughness={0.5} />
      </mesh>

      {/* Windows */}
      <mesh position={[0, dims.height / 2 + 0.15, type === "bus" ? 0 : -0.2]}>
        <boxGeometry args={[dims.width * 0.9, 0.2, dims.length * 0.45]} />
        <meshStandardMaterial color="#405060" metalness={0.8} roughness={0.2} transparent opacity={0.7} />
      </mesh>

      {/* Wheels */}
      {[
        [-dims.width / 2 - 0.1, -dims.height / 2, dims.length / 3],
        [dims.width / 2 + 0.1, -dims.height / 2, dims.length / 3],
        [-dims.width / 2 - 0.1, -dims.height / 2, -dims.length / 3],
        [dims.width / 2 + 0.1, -dims.height / 2, -dims.length / 3],
      ].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.25, 0.25, 0.15, 12]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>
      ))}

      {/* Headlights */}
      <mesh position={[-dims.width / 3, 0, dims.length / 2 + 0.01]}>
        <boxGeometry args={[0.2, 0.15, 0.05]} />
        <meshStandardMaterial color="#ffffcc" emissive="#ffffcc" emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[dims.width / 3, 0, dims.length / 2 + 0.01]}>
        <boxGeometry args={[0.2, 0.15, 0.05]} />
        <meshStandardMaterial color="#ffffcc" emissive="#ffffcc" emissiveIntensity={0.3} />
      </mesh>
    </group>
  );
}
