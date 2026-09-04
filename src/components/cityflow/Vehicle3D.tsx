import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import type { VehicleData } from "./types";

interface Vehicle3DProps {
  id: string;
  type: "car" | "bus" | "truck";
  position: { x: number; y: number; z: number };
  rotation: number;
  speed: number;
  color: string;
}

const VEHICLE_DIMENSIONS = {
  car: { width: 1.2, height: 0.8, length: 2.2 },
  bus: { width: 1.6, height: 1.4, length: 4 },
  truck: { width: 1.5, height: 1.2, length: 3.2 },
};

export function Vehicle3D({ type, position, rotation, speed, color }: Vehicle3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const dims = VEHICLE_DIMENSIONS[type];

  useFrame((_, delta) => {
    if (!groupRef.current || speed === 0) return;

    // Simple forward movement based on rotation
    const moveSpeed = speed * delta;
    groupRef.current.position.x += Math.sin(rotation) * moveSpeed;
    groupRef.current.position.z += Math.cos(rotation) * moveSpeed;
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
      position={[position.x, position.y + dims.height / 2, position.z]}
      rotation={[0, rotation, 0]}
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
