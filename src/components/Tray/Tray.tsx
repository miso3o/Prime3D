/**
 * Tray.tsx — animated tray that travels between tracks, cranes, and rack cells.
 *
 * Z-UP coordinate system:
 *   X  = left/right   (track.direction 'x')
 *   Y  = floor depth  (track.direction 'y')
 *   Z  = height above floor
 *
 * computeTrayWorldPos returns [x, y, z] where z is the height the tray rides at.
 */
import { useRef, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useWarehouseStore } from '../../store/useWarehouseStore';
import type { LayoutConfig, TrayLocation } from '../../config/types';
import { getCraneRailXRange, getRackCellHeight, getRackDepth, getRackHeight, getRackLength } from '../../config/layoutGeometry';

interface TrayProps {
  trayId: string;
  layout: LayoutConfig;
}

const TRAY_W     = 0.9;
const TRAY_D     = 0.7;
const TRAY_H     = 0.12;   // Z-up: height is Z dimension
const TRAY_Z_OFF = 0.24;   // Z offset above track surface
const TRAY_COLOR     = '#81c784';
const TRAY_SEL_COLOR = '#c6f6d5';

export function computeTrayWorldPos(location: TrayLocation, layout: LayoutConfig): THREE.Vector3 {
  // ── On a conveyor track ────────────────────────────────────────────────────
  if (location.type === 'track') {
    const track = layout.tracks.find((t) => t.id === location.trackId);
    if (!track) return new THREE.Vector3();
    const seg = track.segments.find((s) => s.id === location.segmentId);
    if (!seg) return new THREE.Vector3();

    const [segLen] = track.segmentSize;
    const offset   = seg.localIndex * segLen + segLen / 2;
    const [tx, ty, tz] = track.position;

    // Z-up: direction 'x' offsets along X, direction 'y' offsets along Y
    const x = track.direction === 'x' ? tx + offset : tx;
    const y = track.direction === 'y' ? ty + offset : ty;
    // tz is the track's Z base (floor level); tray rides above the track slab
    return new THREE.Vector3(x, y, tz + TRAY_Z_OFF);
  }

  // ── On a crane carriage ────────────────────────────────────────────────────
  if (location.type === 'crane') {
    const crane = layout.cranes.find((c) => c.id === location.craneId);
    if (!crane) return new THREE.Vector3();

    const cs = useWarehouseStore.getState().craneStates[location.craneId];
    const pairedRacks = crane.rackIds
      .map((rid) => layout.racks.find((r) => r.id === rid)!)
      .filter(Boolean);
    const mastH = pairedRacks.length
      ? Math.max(...pairedRacks.map((r) => getRackHeight(r))) + 0.5
      : 6;
    const [minX, maxX] = getCraneRailXRange(crane, layout);
    const xRange = Math.max(maxX - minX - 0.48, 0.1);
    const zMax   = mastH - 0.36;

    const cx = minX + 0.24 + (cs?.xPosition ?? 0) * xRange;
    const cy = crane.railPosition[1];
    const cz = crane.railPosition[2] + (cs?.yPosition ?? 0) * zMax + 0.18;

    return new THREE.Vector3(cx, cy, cz + TRAY_H / 2);
  }

  // ── Stored in a rack cell ──────────────────────────────────────────────────
  if (location.type === 'rack') {
    const rack = layout.racks.find((r) => r.id === location.rackId);
    if (!rack) return new THREE.Vector3();

    const [rx, ry, rz] = rack.position;
    const totalW = getRackLength(rack);
    const totalD = getRackDepth(rack);
    const cellHeight = getRackCellHeight(rack);

    // Z-up: bay → X, bank → Y, level → Z
    const cellX = rx + location.bay   * rack.cellWidth  - totalW / 2 + rack.cellWidth  / 2;
    const cellY = ry + location.bank  * rack.cellDepth  - totalD / 2 + rack.cellDepth  / 2;
    const cellZ = rz + location.level * cellHeight + cellHeight / 2;

    return new THREE.Vector3(cellX, cellY, cellZ);
  }

  return new THREE.Vector3();
}

export function Tray({ trayId, layout }: TrayProps) {
  const meshRef    = useRef<THREE.Mesh>(null);
  const currentPos = useRef(new THREE.Vector3());

  const trayState   = useWarehouseStore((s) => s.trays.find((t) => t.id === trayId));
  const sel         = useWarehouseStore((s) => s.selectedObject);
  const setSelected = useWarehouseStore((s) => s.setSelectedObject);
  const isSelected  = sel?.type === 'tray' && sel.id === trayId;

  const onClick = useCallback(
    (e: { stopPropagation: () => void }) => {
      e.stopPropagation();
      setSelected(isSelected ? null : { type: 'tray', id: trayId });
    },
    [trayId, isSelected, setSelected],
  );

  useFrame(() => {
    if (!meshRef.current || !trayState) return;
    const target = computeTrayWorldPos(trayState.location, layout);
    currentPos.current.lerp(target, 0.08);
    meshRef.current.position.copy(currentPos.current);
  });

  if (!trayState) return null;

  return (
    // Z-up: args = [X-width, Y-depth, Z-height]
    <mesh ref={meshRef} onClick={onClick}>
      <boxGeometry args={[TRAY_W, TRAY_D, TRAY_H]} />
      <meshStandardMaterial
        color={isSelected ? TRAY_SEL_COLOR : TRAY_COLOR}
        emissive={isSelected ? TRAY_SEL_COLOR : TRAY_COLOR}
        emissiveIntensity={isSelected ? 0.5 : 0.05}
        metalness={0.2}
        roughness={0.5}
      />
    </mesh>
  );
}
