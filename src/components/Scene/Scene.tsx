/**
 * Scene.tsx — main Three.js/R3F canvas (Z-up coordinate system).
 *
 * Z-UP convention:
 *   X = left/right    Y = floor depth (south = larger Y)    Z = height (up)
 *   camera.up = [0,0,1]   Grid lies in XY plane
 *
 * Default view: near AG2 (Y≈52), looking north-west toward CDC1 (Y≈0).
 * This orientation matches the 2D floor plan where:
 *   - CDC1 appears at the top of the canvas (small fpY → small worldY → far from camera)
 *   - HAG/AG areas appear at the bottom (large fpY → large worldY → near camera)
 */
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, Html, Stats } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type { LayoutConfig } from '../../config/types';
import { getRackHeight, getWorldPointForSelection } from '../../config/layoutGeometry';
import { Rack } from '../Rack/Rack';
import { Crane } from '../Crane/Crane';
import { Tray } from '../Tray/Tray';
import { HomeStand } from '../HomeStand/HomeStand';
import { Equipment } from '../Equipment/Equipment';
import { FPScene3D } from './FPScene3D';
import { useWarehouseStore } from '../../store/useWarehouseStore';

interface SceneProps {
  layout: LayoutConfig;
  onLayoutChange?: (next: LayoutConfig) => void;
}

// ── Default camera (AG2 → CDC1 view) ──────────────────────────────────────────
// AG2 rail is at world Y≈27.6; CDC1 is at Y≈0.
// Camera placed south of AG2 (Y=52), elevated (Z=28), looking north toward CDC1.
// This orientation makes the 3D view directionally consistent with the 2D floor plan.
const DEFAULT_CAM_POS: [number, number, number]    = [8, 52, 28];
const DEFAULT_CAM_TARGET: [number, number, number] = [-5, 8, 2];

// ── Z-up camera setup ──────────────────────────────────────────────────────────
function CameraSetup() {
  const { camera } = useThree();
  useEffect(() => {
    camera.up.set(0, 0, 1);
    camera.updateProjectionMatrix();
  }, [camera]);
  return null;
}

function CameraSync({ layout }: { layout: LayoutConfig }) {
  const { camera, controls } = useThree();
  const focusRequest = useWarehouseStore((s) => s.focusRequest);
  const viewResetToken = useWarehouseStore((s) => s.viewResetToken);

  useEffect(() => {
    camera.position.set(...DEFAULT_CAM_POS);
    camera.up.set(0, 0, 1);
    camera.updateProjectionMatrix();
    const ctrl = controls as OrbitControlsImpl | null;
    if (ctrl) {
      ctrl.target.set(...DEFAULT_CAM_TARGET);
      ctrl.update();
    }
  }, [camera, controls, viewResetToken]);

  useEffect(() => {
    if (!focusRequest) return;
    const ctrl = controls as OrbitControlsImpl | null;
    if (!ctrl) return;
    const point = getWorldPointForSelection(layout, focusRequest.selection);
    if (!point) return;

    const projected = new THREE.Vector3(...point).project(camera);
    if (
      projected.z > -1 &&
      projected.z < 1 &&
      Math.abs(projected.x) < 0.7 &&
      Math.abs(projected.y) < 0.7
    ) {
      return;
    }

    const offset = new THREE.Vector3().subVectors(camera.position, ctrl.target);
    ctrl.target.set(...point);
    camera.position.copy(new THREE.Vector3(...point).add(offset));
    ctrl.update();
  }, [camera, controls, focusRequest, layout]);

  return null;
}

// ── Reset-view button (inside canvas via HTML overlay) ─────────────────────────
function ResetViewButton() {
  const { camera, controls } = useThree();
  const handleReset = () => {
    camera.position.set(...DEFAULT_CAM_POS);
    camera.up.set(0, 0, 1);
    camera.updateProjectionMatrix();
    const ctrl = controls as OrbitControlsImpl | null;
    if (ctrl) {
      ctrl.target.set(...DEFAULT_CAM_TARGET);
      ctrl.update();
    }
  };
  return (
    <Html style={{ position: 'absolute', bottom: 16, right: 60, pointerEvents: 'none' }}>
      <button
        onPointerDown={(e) => { e.stopPropagation(); handleReset(); }}
        style={{
          pointerEvents: 'all',
          padding: '4px 10px',
          background: 'rgba(30,39,55,0.88)',
          color: '#90cdf4',
          border: '1px solid rgba(144,205,244,0.25)',
          borderRadius: 5,
          fontFamily: 'monospace',
          fontSize: 10,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        ⌂ Reset View
      </button>
    </Html>
  );
}

// ── Rack label ─────────────────────────────────────────────────────────────────
function RackLabel({ rackId, position, totalH }: {
  rackId: string; position: [number, number, number]; totalH: number;
}) {
  return (
    <group position={[position[0], position[1], position[2] + totalH + 0.5]}>
      <Html center distanceFactor={28} style={{ pointerEvents: 'none' }}>
        <div style={{
          background: 'rgba(0,0,0,0.68)', color: '#90cdf4',
          fontFamily: 'monospace', fontSize: 10, fontWeight: 700,
          padding: '1px 5px', borderRadius: 3, whiteSpace: 'nowrap',
          border: '1px solid rgba(144,205,244,0.2)', opacity: 0.9,
        }}>
          {rackId}
        </div>
      </Html>
    </group>
  );
}

// ── Crane label ────────────────────────────────────────────────────────────────
function CraneLabel({ craneId, position, mastH }: {
  craneId: string; position: [number, number, number]; mastH: number;
}) {
  return (
    <group position={[position[0], position[1], position[2] + mastH + 0.6]}>
      <Html center distanceFactor={30} style={{ pointerEvents: 'none' }}>
        <div style={{
          background: 'rgba(0,0,0,0.68)', color: '#f6ad55',
          fontFamily: 'monospace', fontSize: 10, fontWeight: 700,
          padding: '1px 6px', borderRadius: 3, whiteSpace: 'nowrap',
          border: '1px solid rgba(246,173,85,0.25)',
        }}>
          {craneId}
        </div>
      </Html>
    </group>
  );
}

// ── Inner scene ────────────────────────────────────────────────────────────────
function WarehouseScene({ layout }: { layout: LayoutConfig }) {
  const trays    = useWarehouseStore((s) => s.trays);
  const ctrlRef  = useRef<OrbitControlsImpl>(null);

  return (
    <>
      <CameraSetup />
      <CameraSync layout={layout} />

      {/* ── Lighting (Z-up: key light from high Z) ───────────────────────── */}
      <ambientLight intensity={0.55} />
      <directionalLight position={[20, -15, 50]} intensity={1.1} castShadow />
      <directionalLight position={[-20, 15, 35]} intensity={0.45} />
      <directionalLight position={[0, -30, 20]}  intensity={0.2} />

      {/* ── Floor grid — XY plane (Z-up) ─────────────────────────────────── */}
      <Grid
        args={[140, 90]}
        position={[-13, 13, -0.02]}
        rotation={[-Math.PI / 2, 0, 0]}
        cellColor="#1e2737"
        sectionColor="#2d3a4a"
        fadeDistance={220}
        cellSize={1.1}
        sectionSize={5.5}
      />

      {/* ── OrbitControls ────────────────────────────────────────────────── */}
      <OrbitControls
        ref={ctrlRef}
        makeDefault
        target={DEFAULT_CAM_TARGET}
        minDistance={5}
        maxDistance={380}
        maxPolarAngle={Math.PI / 2.05}
        enableDamping
        dampingFactor={0.07}
      />

      {/* ── Floor plan tracks + equipment ────────────────────────────────── */}
      {layout.floorPlan && <FPScene3D floorPlan={layout.floorPlan} />}
      {(layout.equipment ?? []).map((equipment) => (
        <Equipment key={equipment.id} config={equipment} />
      ))}

      {/* ── Racks ────────────────────────────────────────────────────────── */}
      {layout.racks.map((rack) => {
        const totalH = getRackHeight(rack);
        return (
          <group key={rack.id}>
            <Rack config={rack} />
            <RackLabel rackId={rack.id} position={rack.position} totalH={totalH} />
          </group>
        );
      })}

      {/* ── Cranes ───────────────────────────────────────────────────────── */}
      {layout.cranes.map((crane) => {
        const pairedRacks = crane.rackIds
          .map((rid) => layout.racks.find((r) => r.id === rid)!)
          .filter(Boolean);
        const mastH = pairedRacks.length
          ? Math.max(...pairedRacks.map((r) => getRackHeight(r))) + 0.5
          : 6;
        return (
          <group key={crane.id}>
            <Crane config={crane} layout={layout} />
            <CraneLabel craneId={crane.id} position={crane.railPosition} mastH={mastH} />
          </group>
        );
      })}

      {/* ── Home stands ──────────────────────────────────────────────────── */}
      {(layout.homeStands ?? []).map((hs) => (
        <HomeStand key={hs.id} config={hs} showLabels />
      ))}

      {/* ── Trays ────────────────────────────────────────────────────────── */}
      {trays.map((tray) => (
        <Tray key={tray.id} trayId={tray.id} layout={layout} />
      ))}

      <Stats />
    </>
  );
}

// ── Canvas wrapper ─────────────────────────────────────────────────────────────
export function Scene({ layout }: SceneProps) {
  return (
    <Canvas
      shadows
      camera={{ position: DEFAULT_CAM_POS, fov: 50, near: 0.5, far: 600 }}
      style={{ background: '#0b0f1a' }}
      onPointerMissed={() => useWarehouseStore.getState().setSelectedObject(null)}
    >
      <WarehouseScene layout={layout} />
    </Canvas>
  );
}
