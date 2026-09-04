import { useMemo } from "react";
import { NODE_POSITIONS, ROAD_WIDTH } from "./cityLayout";
import type { RoadSegmentData } from "./types";

interface CityRoadNetworkProps {
  segments: RoadSegmentData[];
}

function RoadSegment({
  startNodeId,
  endNodeId,
}: {
  startNodeId: string;
  endNodeId: string;
}) {
  const roadData = useMemo(() => {
    const start = NODE_POSITIONS[startNodeId];
    const end = NODE_POSITIONS[endNodeId];
    if (!start || !end) return null;

    const dx = end.x - start.x;
    const dz = end.z - start.z;
    const length = Math.sqrt(dx * dx + dz * dz);
    const angle = Math.atan2(dx, dz);
    const midX = (start.x + end.x) / 2;
    const midZ = (start.z + end.z) / 2;

    return { length, angle, midX, midZ };
  }, [startNodeId, endNodeId]);

  if (!roadData) return null;

  const { length, angle, midX, midZ } = roadData;

  return (
    <group position={[midX, 0.05, midZ]} rotation={[0, -angle, 0]}>
      {/* Main road surface */}
      <mesh receiveShadow>
        <planeGeometry args={[ROAD_WIDTH, length]} />
        <meshStandardMaterial color="#1a1f2a" roughness={0.9} />
      </mesh>

      {/* Center line markings */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.15, length - 2]} />
        <meshStandardMaterial color="#f0c040" emissive="#f0c040" emissiveIntensity={0.3} />
      </mesh>

      {/* Lane edge markings */}
      <mesh position={[ROAD_WIDTH / 2 - 0.3, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.1, length - 2]} />
        <meshStandardMaterial color="#404858" />
      </mesh>
      <mesh position={[-ROAD_WIDTH / 2 + 0.3, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.1, length - 2]} />
        <meshStandardMaterial color="#404858" />
      </mesh>
    </group>
  );
}

export function CityRoadNetwork({ segments }: CityRoadNetworkProps) {
  return (
    <group>
      {segments.map((segment, index) => (
        <RoadSegment
          key={`road-${segment.startNodeId}-${segment.endNodeId}-${index}`}
          startNodeId={segment.startNodeId}
          endNodeId={segment.endNodeId}
        />
      ))}
    </group>
  );
}
