/**
 * Scene.tsx — main Three.js/R3F canvas (Z-up coordinate system).
 *
 * Z-UP convention:
 *   X = left/right    Y = floor depth (south = larger Y)    Z = height (up)
 *   camera.up = [0,0,1]   Grid lies in XY plane
 *
 * Default view: diagonal overview aligned to the 2D floor plan.
 * GRD appears upper-left and Aging/AG appears lower-right after Reset View.
 */
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, Html } from '@react-three/drei';
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
  showTrackIds?: boolean;
  onLayoutChange?: (next: LayoutConfig) => void;
}

// ── Default camera (2D-aligned diagonal overview) ─────────────────────────────
const DEFAULT_CAM_POS: [number, number, number]    = [8, 52, 28];
const DEFAULT_CAM_TARGET: [number, number, number] = [-5, 8, 2];
const WORLD_MIRROR_X = true;

function toRenderedPoint(point: [number, number, number]): [number, number, number] {
  return WORLD_MIRROR_X ? [-point[0], point[1], point[2]] : point;
}

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

    const renderedPoint = toRenderedPoint(point);
    const projected = new THREE.Vector3(...renderedPoint).project(camera);
    if (
      projected.z > -1 &&
      projected.z < 1 &&
      Math.abs(projected.x) < 0.7 &&
      Math.abs(projected.y) < 0.7
    ) {
      return;
    }

    const offset = new THREE.Vector3().subVectors(camera.position, ctrl.target);
    ctrl.target.set(...renderedPoint);
    camera.position.copy(new THREE.Vector3(...renderedPoint).add(offset));
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
function WarehouseScene({ layout, showTrackIds }: { layout: LayoutConfig; showTrackIds: boolean }) {
  const trays    = useWarehouseStore((s) => s.trays);
  const ctrlRef  = useRef<OrbitControlsImpl>(null);
  const floorPlanBoxIds = new Set(layout.floorPlan?.boxes.map((box) => box.id) ?? []);

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
      <group scale={WORLD_MIRROR_X ? [-1, 1, 1] : [1, 1, 1]}>
      {layout.floorPlan && <FPScene3D floorPlan={layout.floorPlan} showTrackIds={showTrackIds} />}
      {(layout.equipment ?? []).filter((equipment) => !floorPlanBoxIds.has(equipment.id)).map((equipment) => (
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
      </group>

    </>
  );
}

// ── Canvas wrapper ─────────────────────────────────────────────────────────────
export function Scene({ layout, showTrackIds = false }: SceneProps) {
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#0b0f1a' }}>
      <Canvas
        shadows
        camera={{ position: DEFAULT_CAM_POS, fov: 50, near: 0.5, far: 600 }}
        style={{ background: '#0b0f1a' }}
        onPointerMissed={() => useWarehouseStore.getState().setSelectedObject(null)}
      >
        <WarehouseScene layout={layout} showTrackIds={showTrackIds} />
      </Canvas>

      {/* Logo watermark */}
      <img
        src="/logo.png"
        alt=""
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 320,
          opacity: 0.05,
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      />
    </div>
  );
}
