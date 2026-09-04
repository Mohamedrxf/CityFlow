import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Suspense } from "react";
import { CityRoadNetwork } from "./CityRoadNetwork";
import { CityIntersection } from "./CityIntersection";
import { TrafficSignal3D } from "./TrafficSignal3D";
import { Vehicle3D } from "./Vehicle3D";
import { Ambulance3D } from "./Ambulance3D";
import { EmergencyRoute3D } from "./EmergencyRoute3D";
import { NODE_POSITIONS, ROAD_SEGMENTS } from "./cityLayout";
import type { SignalState, VehicleData, AmbulanceData, EmergencyRouteData } from "./types";

interface CityFlow3DSceneProps {
  signals?: Record<string, SignalState>;
  vehicles?: VehicleData[];
  ambulance?: AmbulanceData;
  emergencyRoute?: EmergencyRouteData;
  emergencyActive?: boolean;
}

export function CityFlow3DScene({
  signals = {},
  vehicles = [],
  ambulance,
  emergencyRoute,
  emergencyActive = false,
}: CityFlow3DSceneProps) {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 40, 50], fov: 50 }}
      style={{ background: "#0a0f1a" }}
    >
      <Suspense fallback={null}>
        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[20, 40, 20]}
          intensity={0.8}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <directionalLight position={[-10, 20, -10]} intensity={0.3} />

        {/* Road Network */}
        <CityRoadNetwork segments={ROAD_SEGMENTS} />

        {/* Intersections */}
        {Object.entries(NODE_POSITIONS).map(([id, pos]) => (
          <CityIntersection
            key={id}
            id={id}
            position={[pos.x, 0, pos.z]}
            isHospital={id.startsWith("HOSPITAL")}
          />
        ))}

        {/* Traffic Signals */}
        {Object.entries(signals).map(([nodeId, state]) => {
          const pos = NODE_POSITIONS[nodeId];
          if (!pos) return null;
          return (
            <TrafficSignal3D
              key={`signal-${nodeId}`}
              position={[pos.x + 3, 0, pos.z + 3]}
              state={state}
            />
          );
        })}

        {/* Vehicles */}
        {vehicles.map((vehicle) => (
          <Vehicle3D key={vehicle.id} {...vehicle} />
        ))}

        {/* Ambulance */}
        {ambulance && <Ambulance3D {...ambulance} />}

        {/* Emergency Route */}
        {emergencyRoute && (
          <EmergencyRoute3D
            route={emergencyRoute.nodeIds}
            active={emergencyActive}
          />
        )}

        {/* Camera Controls */}
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          maxPolarAngle={Math.PI / 2.2}
          minDistance={10}
          maxDistance={100}
        />
      </Suspense>
    </Canvas>
  );
}
