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
import { getCraneRailXRange, getForkMaxExtension, getRackCellHeight, getRackDepth, getRackHeight, getRackLength } from '../../config/layoutGeometry';
import { fp2world } from '../../config/fp2world';
import { getLayerZ } from '../../config/layerConfig';

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

function getVisibleTrackAnchor(trackId: string, segmentId: string, layout: LayoutConfig) {
  const track = layout.tracks.find((t) => t.id === trackId);
  if (!track?.linkedCraneId || !layout.floorPlan) return null;
  const crane = layout.cranes.find((c) => c.id === track.linkedCraneId);
  if (!crane?.homeStandTracks) return null;
  const seg = track.segments.find((s) => s.id === segmentId);
  const homeSeg = track.segments.find((s) => s.type === 'HomeStand');
  if (!seg || !homeSeg) return null;

  const unitIds = [...crane.homeStandTracks.inbound, ...crane.homeStandTracks.outbound];
  const candidates = layout.floorPlan.tracks.filter((fpTrack) => unitIds.includes(fpTrack.unitId));
  if (candidates.length === 0) return null;

  const [legacyHomeX, legacyHomeY] = [
    track.direction === 'x'
      ? track.position[0] + homeSeg.localIndex * track.segmentSize[0] + track.segmentSize[0] / 2
      : track.position[0],
    track.direction === 'y'
      ? track.position[1] + homeSeg.localIndex * track.segmentSize[0] + track.segmentSize[0] / 2
      : track.position[1],
  ];

  const anchor = candidates.reduce((best, fpTrack) => {
    const [wx, wy] = fp2world(fpTrack.x + fpTrack.w / 2, fpTrack.y + fpTrack.h / 2);
    const dist = Math.hypot(wx - legacyHomeX, wy - legacyHomeY);
    return !best || dist < best.dist ? { fpTrack, wx, wy, dist } : best;
  }, null as null | { fpTrack: NonNullable<LayoutConfig['floorPlan']>['tracks'][number]; wx: number; wy: number; dist: number });

  if (!anchor) return null;
  const delta = (seg.localIndex - homeSeg.localIndex) * track.segmentSize[0];
  const x = track.direction === 'x' ? anchor.wx + delta : anchor.wx;
  const y = track.direction === 'y' ? anchor.wy + delta : anchor.wy;
  return new THREE.Vector3(x, y, getLayerZ(anchor.fpTrack.layerId) + TRAY_Z_OFF);
}

export function computeTrayWorldPos(location: TrayLocation, layout: LayoutConfig): THREE.Vector3 {
  // ── On a conveyor track ────────────────────────────────────────────────────
  if (location.type === 'track') {
    const visibleTrackPos = getVisibleTrackAnchor(location.trackId, location.segmentId, layout);
    if (visibleTrackPos) return visibleTrackPos;

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
    const cy = crane.railPosition[1] + (cs?.forkExtension ?? 0) * getForkMaxExtension(crane, layout);
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
