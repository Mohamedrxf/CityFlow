import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { NODE_POSITIONS } from "./cityLayout";
import type { Position3D } from "./types";

interface EmergencyRoute3DProps {
  nodeIds: string[];
  active: boolean;
}

export function EmergencyRoute3D({ nodeIds, active }: EmergencyRoute3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const markerRefs = useRef<THREE.Mesh[]>([]);

  const pathPoints = useMemo(() => {
    const points: Position3D[] = [];
    for (const nodeId of nodeIds) {
      const pos = NODE_POSITIONS[nodeId];
      if (pos) {
        points.push({ x: pos.x, y: 0.15, z: pos.z });
      }
    }
    return points;
  }, [nodeIds]);

  useFrame(() => {
    if (!active) return;
    const time = Date.now() * 0.002;
    markerRefs.current.forEach((marker, i) => {
      if (marker) {
        const offset = (time + i * 0.3) % 1;
        marker.scale.setScalar(0.8 + Math.sin(offset * Math.PI * 2) * 0.3);
      }
    });
  });

  if (pathPoints.length < 2) return null;

  return (
    <group ref={groupRef}>
      {/* Route path line */}
      {pathPoints.slice(0, -1).map((point, i) => {
        const nextPoint = pathPoints[i + 1];
        const dx = nextPoint.x - point.x;
        const dz = nextPoint.z - point.z;
        const length = Math.sqrt(dx * dx + dz * dz);
        const angle = Math.atan2(dx, dz);
        const midX = (point.x + nextPoint.x) / 2;
        const midZ = (point.z + nextPoint.z) / 2;

        return (
          <group
            key={`route-seg-${i}`}
            position={[midX, point.y, midZ]}
            rotation={[0, -angle, 0]}
          >
            {/* Route highlight strip */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[1.5, length]} />
              <meshStandardMaterial
                color={active ? "#20ff60" : "#406040"}
                emissive={active ? "#20ff60" : "#406040"}
                emissiveIntensity={active ? 0.6 : 0.1}
                transparent
                opacity={active ? 0.7 : 0.3}
              />
            </mesh>
          </group>
        );
      })}

      {/* Route markers at each node */}
      {pathPoints.map((point, i) => (
        <mesh
          key={`route-marker-${i}`}
          ref={(el) => {
            if (el) markerRefs.current[i] = el;
          }}
          position={[point.x, point.y + 0.3, point.z]}
        >
          <sphereGeometry args={[0.4, 12, 12]} />
          <meshStandardMaterial
            color={active ? "#20ff60" : "#406040"}
            emissive={active ? "#20ff60" : "#406040"}
            emissiveIntensity={active ? 0.8 : 0.2}
          />
        </mesh>
      ))}

      {/* Start marker */}
      {pathPoints[0] && (
        <mesh position={[pathPoints[0].x, pathPoints[0].y + 0.5, pathPoints[0].z]}>
          <cylinderGeometry args={[0.3, 0.5, 0.5, 8]} />
          <meshStandardMaterial
            color="#20ff60"
            emissive="#20ff60"
            emissiveIntensity={active ? 1.0 : 0.2}
          />
        </mesh>
      )}

      {/* End marker (hospital) */}
      {pathPoints.length > 1 && (
        <mesh
          position={[
            pathPoints[pathPoints.length - 1].x,
            pathPoints[pathPoints.length - 1].y + 0.5,
            pathPoints[pathPoints.length - 1].z,
          ]}
        >
          <cylinderGeometry args={[0.3, 0.5, 0.5, 8]} />
          <meshStandardMaterial
            color="#ff4040"
            emissive="#ff4040"
            emissiveIntensity={active ? 1.0 : 0.2}
          />
        </mesh>
      )}
    </group>
  );
}
