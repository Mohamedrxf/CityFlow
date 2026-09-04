import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { SignalState } from "./types";

interface TrafficSignal3DProps {
  position: [number, number, number];
  state: SignalState;
}

export function TrafficSignal3D({ position, state }: TrafficSignal3DProps) {
  const redRef = useRef<THREE.Mesh>(null);
  const yellowRef = useRef<THREE.Mesh>(null);
  const greenRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    // Subtle pulsing for active light
    const time = Date.now() * 0.003;
    const pulse = 0.7 + Math.sin(time) * 0.3;

    if (redRef.current) {
      const mat = redRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = state === "RED" ? pulse : 0.1;
    }
    if (yellowRef.current) {
      const mat = yellowRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = state === "YELLOW" ? pulse : 0.1;
    }
    if (greenRef.current) {
      const mat = greenRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = state === "GREEN" ? pulse : 0.1;
    }
  });

  return (
    <group position={position}>
      {/* Signal pole */}
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 3, 8]} />
        <meshStandardMaterial color="#2a2a2a" />
      </mesh>

      {/* Signal housing */}
      <mesh position={[0, 3.2, 0]}>
        <boxGeometry args={[0.6, 1.8, 0.4]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>

      {/* Red light */}
      <mesh ref={redRef} position={[0, 3.7, 0.21]}>
        <circleGeometry args={[0.2, 16]} />
        <meshStandardMaterial
          color={state === "RED" ? "#ff2020" : "#4a1010"}
          emissive={state === "RED" ? "#ff2020" : "#4a1010"}
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* Yellow light */}
      <mesh ref={yellowRef} position={[0, 3.2, 0.21]}>
        <circleGeometry args={[0.2, 16]} />
        <meshStandardMaterial
          color={state === "YELLOW" ? "#ffcc00" : "#4a3a10"}
          emissive={state === "YELLOW" ? "#ffcc00" : "#4a3a10"}
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* Green light */}
      <mesh ref={greenRef} position={[0, 2.7, 0.21]}>
        <circleGeometry args={[0.2, 16]} />
        <meshStandardMaterial
          color={state === "GREEN" ? "#20ff40" : "#104a20"}
          emissive={state === "GREEN" ? "#20ff40" : "#104a20"}
          emissiveIntensity={0.5}
        />
      </mesh>
    </group>
  );
}
