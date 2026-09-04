import { useMemo } from "react";
import type { Position3D } from "./types";

interface CityIntersectionProps {
  id: string;
  position: [number, number, number];
  isHospital?: boolean;
}

function Crosswalk({ position, rotation }: { position: [number, number, number]; rotation?: number }) {
  const stripes = useMemo(() => {
    const items: { x: number; z: number }[] = [];
    for (let i = -2; i <= 2; i++) {
      items.push({ x: i * 0.8, z: 0 });
    }
    return items;
  }, []);

  return (
    <group position={position} rotation={[0, rotation || 0, 0]}>
      {stripes.map((stripe, i) => (
        <mesh key={i} position={[stripe.x, 0.02, stripe.z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.4, 3]} />
          <meshStandardMaterial color="#c0c8d0" />
        </mesh>
      ))}
    </group>
  );
}

export function CityIntersection({ id, position, isHospital = false }: CityIntersectionProps) {
  return (
    <group position={position}>
      {/* Intersection surface */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[8, 8]} />
        <meshStandardMaterial color="#1e2430" roughness={0.85} />
      </mesh>

      {/* Stop lines */}
      <mesh position={[0, 0.01, 3.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.3, 6]} />
        <meshStandardMaterial color="#d0d8e0" />
      </mesh>
      <mesh position={[0, 0.01, -3.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.3, 6]} />
        <meshStandardMaterial color="#d0d8e0" />
      </mesh>
      <mesh position={[3.5, 0.01, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
        <planeGeometry args={[0.3, 6]} />
        <meshStandardMaterial color="#d0d8e0" />
      </mesh>
      <mesh position={[-3.5, 0.01, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
        <planeGeometry args={[0.3, 6]} />
        <meshStandardMaterial color="#d0d8e0" />
      </mesh>

      {/* Crosswalks */}
      <Crosswalk position={[3.2, 0, 3.2]} />
      <Crosswalk position={[-3.2, 0, -3.2]} />
      <Crosswalk position={[3.2, 0, -3.2]} rotation={Math.PI / 2} />
      <Crosswalk position={[-3.2, 0, 3.2]} rotation={Math.PI / 2} />

      {/* Hospital marker */}
      {isHospital && (
        <group>
          <mesh position={[0, 1.5, 0]}>
            <boxGeometry args={[4, 3, 3]} />
            <meshStandardMaterial color="#2a4a6a" />
          </mesh>
          {/* Hospital cross */}
          <mesh position={[0, 2.5, 1.51]}>
            <boxGeometry args={[1.2, 0.3, 0.05]} />
            <meshStandardMaterial color="#ff4040" emissive="#ff4040" emissiveIntensity={0.5} />
          </mesh>
          <mesh position={[0, 2.5, 1.51]}>
            <boxGeometry args={[0.3, 1.2, 0.05]} />
            <meshStandardMaterial color="#ff4040" emissive="#ff4040" emissiveIntensity={0.5} />
          </mesh>
        </group>
      )}

      {/* Intersection label (for non-hospital) */}
      {!isHospital && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[1.5, 32]} />
          <meshStandardMaterial color="#2a3040" />
        </mesh>
      )}
    </group>
  );
}
