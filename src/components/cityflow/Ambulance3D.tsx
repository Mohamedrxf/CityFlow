import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { AmbulanceData } from "./types";

interface Ambulance3DProps {
  id: string;
  position: { x: number; y: number; z: number };
  rotation: number;
  progress: number;
  emergencyActive: boolean;
}

export function Ambulance3D({ position, rotation, progress, emergencyActive }: Ambulance3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const lightBarRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!groupRef.current) return;
    groupRef.current.position.set(position.x, position.y + 0.6, position.z);
    groupRef.current.rotation.y = rotation;

    // Alternate emergency light colors
    if (lightBarRef.current && emergencyActive) {
      const time = Date.now() * 0.005;
      const phase = Math.sin(time) > 0;
      const children = lightBarRef.current.children;
      if (children[0]) {
        const mat = (children[0] as THREE.Mesh).material as THREE.MeshStandardMaterial;
        mat.emissiveIntensity = phase ? 1.5 : 0.2;
      }
      if (children[1]) {
        const mat = (children[1] as THREE.Mesh).material as THREE.MeshStandardMaterial;
        mat.emissiveIntensity = phase ? 0.2 : 1.5;
      }
    }
  });

  return (
    <group ref={groupRef} position={[position.x, position.y + 0.6, position.z]} rotation={[0, rotation, 0]}>
      {/* Ambulance body */}
      <mesh castShadow>
        <boxGeometry args={[1.4, 1.0, 2.8]} />
        <meshStandardMaterial color="#f0f0f0" metalness={0.2} roughness={0.8} />
      </mesh>

      {/* Cabin */}
      <mesh position={[0, 0.3, -0.4]} castShadow>
        <boxGeometry args={[1.3, 0.4, 1.2]} />
        <meshStandardMaterial color="#e0e0e0" metalness={0.2} roughness={0.8} />
      </mesh>

      {/* Rear box */}
      <mesh position={[0, 0.2, 0.8]} castShadow>
        <boxGeometry args={[1.35, 0.6, 1.4]} />
        <meshStandardMaterial color="#f0f0f0" metalness={0.2} roughness={0.8} />
      </mesh>

      {/* Windows */}
      <mesh position={[0, 0.35, -0.4]}>
        <boxGeometry args={[1.25, 0.25, 1.1]} />
        <meshStandardMaterial color="#304050" metalness={0.8} roughness={0.2} transparent opacity={0.7} />
      </mesh>

      {/* Emergency light bar */}
      <group ref={lightBarRef} position={[0, 0.65, -0.2]}>
        {/* Red light */}
        <mesh position={[-0.3, 0, 0]}>
          <boxGeometry args={[0.3, 0.15, 0.3]} />
          <meshStandardMaterial
            color={emergencyActive ? "#ff2020" : "#4a1010"}
            emissive={emergencyActive ? "#ff2020" : "#4a1010"}
            emissiveIntensity={emergencyActive ? 1.0 : 0.1}
          />
        </mesh>
        {/* Blue light */}
        <mesh position={[0.3, 0, 0]}>
          <boxGeometry args={[0.3, 0.15, 0.3]} />
          <meshStandardMaterial
            color={emergencyActive ? "#2060ff" : "#10104a"}
            emissive={emergencyActive ? "#2060ff" : "#10104a"}
            emissiveIntensity={emergencyActive ? 1.0 : 0.1}
          />
        </mesh>
      </group>

      {/* Cross symbol on side */}
      <mesh position={[0.71, 0.2, 0.5]}>
        <boxGeometry args={[0.05, 0.4, 0.1]} />
        <meshStandardMaterial color="#ff2020" emissive="#ff2020" emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[0.71, 0.2, 0.5]}>
        <boxGeometry args={[0.05, 0.1, 0.4]} />
        <meshStandardMaterial color="#ff2020" emissive="#ff2020" emissiveIntensity={0.3} />
      </mesh>

      {/* Wheels */}
      {[
        [-0.75, -0.5, 0.9],
        [0.75, -0.5, 0.9],
        [-0.75, -0.5, -0.9],
        [0.75, -0.5, -0.9],
      ].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.3, 0.3, 0.2, 12]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>
      ))}

      {/* Headlights */}
      <mesh position={[-0.4, 0, 1.41]}>
        <boxGeometry args={[0.25, 0.2, 0.05]} />
        <meshStandardMaterial color="#ffffcc" emissive="#ffffcc" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[0.4, 0, 1.41]}>
        <boxGeometry args={[0.25, 0.2, 0.05]} />
        <meshStandardMaterial color="#ffffcc" emissive="#ffffcc" emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
}
