/**
 * FPScene3D.tsx — renders the floor plan as 3D geometry (Z-up).
 *
 * Track types and their 3D appearance:
 *   Default     → flat grey/layer-coloured conveyor slab
 *   InboundHs   → green platform with upward arrow indicator
 *   OutboundHs  → orange platform with downward arrow indicator
 *   BCRRead     → pink thin slab with scanner post
 *   Lift        → vertical shaft spanning all floors
 *   Palletizer  → elevated platform with pedestal
 *
 * Every track is positioned at [worldX, worldY, floorZ + halfHeight] where
 * floorZ = getLayerZ(track.layerId) from layerConfig.ts.
 */
import { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Html, Text, Billboard } from '@react-three/drei';
import type { FloorPlanData, FPTrack, FPBox, RackConfig } from '../../config/types';
import { getRackHeight } from '../../config/layoutGeometry';
import { fp2world, fpM } from '../../config/fp2world';
import { getLayerZ } from '../../config/layerConfig';
import { getGroupById } from '../../config/groupConfig';
import { useWarehouseStore } from '../../store/useWarehouseStore';

// ── FP Equipment Box (3D) — with selection pulsing ────────────────────────────
function FPBoxMesh({ box, selected }: { box: FPBox; selected: boolean }) {
  const bx = box.x3d ?? box.x;
  const by = box.y3d ?? box.y;
  const [wx, wy] = fp2world(bx + box.w / 2, by + box.h / 2);
  const ww = Math.max(fpM(box.w), 0.1);
  const wd = Math.max(fpM(box.h), 0.1);
  const floorZ = box.layerId ? getLayerZ(box.layerId) : 0;
  const opacity = Math.max(box.bgAlpha ?? 0.5, 0.55);
  const transparent = opacity < 0.98;
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const pad = 0.12;

  useFrame(({ clock }) => {
    if (!selected || !matRef.current) return;
    matRef.current.emissiveIntensity = 0.55 + 0.45 * Math.sin(clock.getElapsedTime() * 5);
  });

  const label = box.unitId ?? box.text ?? '';

  return (
    <group position={[wx, wy, floorZ + BOX_H / 2]}>
      <mesh>
        <boxGeometry args={[ww, wd, BOX_H]} />
        <meshStandardMaterial ref={matRef}
          color={selected ? '#ff5400' : (box.bgColor || '#334155')}
          emissive={selected ? '#ff5400' : '#000000'}
          emissiveIntensity={selected ? 0.55 : 0}
          transparent={transparent} opacity={opacity}
          depthWrite={!transparent} roughness={0.72} metalness={0.05} />
      </mesh>
      {selected && (
        <mesh>
          <boxGeometry args={[ww + pad, wd + pad, BOX_H + pad]} />
          <meshStandardMaterial color="#ff5400" emissive="#ff5400" emissiveIntensity={1}
            transparent opacity={0.25} depthWrite={false} />
        </mesh>
      )}
      {label && (
        <Html center distanceFactor={28} position={[0, 0, BOX_H / 2 + 0.4]}
          style={{ pointerEvents: 'none' }}>
          <div style={{
            background: 'rgba(0,0,0,0.72)', color: selected ? '#ff9966' : '#f6ad55',
            fontFamily: 'monospace', fontSize: 10, fontWeight: 700,
            padding: '1px 6px', borderRadius: 3, whiteSpace: 'nowrap',
            border: `1px solid ${selected ? 'rgba(255,84,0,0.5)' : 'rgba(246,173,85,0.25)'}`,
          }}>
            {label}
          </div>
        </Html>
      )}
    </group>
  );
}

// ── Search beacon — bouncing arrow that appears above a found track ────────────
const BEACON_COLOR = '#ff5400';

function SearchBeacon({ floorPlan, satelliteOffsets, racks = [] }: {
  floorPlan: FloorPlanData;
  satelliteOffsets: Map<string, [number, number]>;
  racks?: RackConfig[];
}) {
  const focusRequest = useWarehouseStore((s) => s.focusRequest);
  const groupRef     = useRef<THREE.Group>(null);
  const lastToken    = useRef(-1);
  const fadeTimer    = useRef<ReturnType<typeof setTimeout> | null>(null);
  // topZ = 객체 상단 높이 (비콘은 topZ 위에 떠있음)
  const [beacon, setBeacon] = useState<{ x: number; y: number; topZ: number } | null>(null);

  useEffect(() => {
    if (!focusRequest) return;
    if (focusRequest.token === lastToken.current) return;
    lastToken.current = focusRequest.token;

    const sel = focusRequest.selection;
    let wx = 0, wy = 0, topZ = 0;

    if (sel.type === 'fptrack') {
      const track = floorPlan.tracks.find((t) => t.id === sel.id);
      if (!track) return;
      // satellite offset 적용 — 3D에서 XY가 이동된 트랙 처리
      const off = satelliteOffsets.get(track.id);
      const ex = track.x + (off?.[0] ?? 0);
      const ey = track.y + (off?.[1] ?? 0);
      [wx, wy] = fp2world(ex + track.w / 2, ey + track.h / 2);
      const floorZ = getLayerZ(track.layerId);
      // 트랙 타입별 높이 반영
      const trackH = track.trackType === 'Palletizer' || track.trackType === 'Depalletizer'
        ? PALLET_H + 0.1
        : track.trackType === 'InboundHs' || track.trackType === 'OutboundHs'
        ? HS_H + 0.6  // 폴 포함
        : TRACK_H;
      topZ = floorZ + trackH;
    } else if (sel.type === 'fpbox') {
      const box = floorPlan.boxes.find((b) => b.id === sel.id);
      if (box) {
        const bx = box.x3d ?? box.x;
        const by = box.y3d ?? box.y;
        [wx, wy] = fp2world(bx + box.w / 2, by + box.h / 2);
        const floorZ = box.layerId ? getLayerZ(box.layerId) : 0;
        topZ = floorZ + BOX_H; // 박스는 3m 높이
      } else {
        const crane = floorPlan.cranes.find((c) => c.id === sel.id);
        if (!crane) return;
        [wx, wy] = fp2world(crane.x + crane.totalW / 2, crane.bank2Y + crane.totalH / 2);
        const craneFloorZ = crane.layerId ? getLayerZ(crane.layerId) : 0;
        // 해당 크레인 존과 이름이 겹치는 3D 랙의 실제 높이를 반영
        const craneId = crane.id; // e.g. "CDC1"
        const pairedRacks = racks.filter((r) =>
          r.id.startsWith(craneId) || craneId.startsWith(r.id.replace(/-[LR]$/, ''))
        );
        const maxRackH = pairedRacks.length
          ? Math.max(...pairedRacks.map((r) => getRackHeight(r)))
          : BOX_H;
        topZ = craneFloorZ + maxRackH;
      }
    } else {
      return;
    }

    setBeacon({ x: wx, y: wy, topZ });

    if (fadeTimer.current) clearTimeout(fadeTimer.current);
    fadeTimer.current = setTimeout(() => setBeacon(null), 3500);
  }, [focusRequest, floorPlan]);

  useFrame(({ clock }) => {
    if (!groupRef.current || !beacon) return;
    const t = clock.getElapsedTime();
    groupRef.current.position.z = beacon.topZ + 1.5 + Math.sin(t * 5) * 0.3;
  });

  if (!beacon) return null;

  return (
    <group ref={groupRef} position={[beacon.x, beacon.y, beacon.topZ + 1.5]}>
      {/* 아래를 향한 원뿔 — tip이 -Z 방향 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -0.35]}>
        <coneGeometry args={[0.32, 1.1, 16]} />
        <meshStandardMaterial color={BEACON_COLOR} emissive={BEACON_COLOR} emissiveIntensity={2.0} />
      </mesh>
      {/* 상단 구 (지도 핀 헤드) */}
      <mesh position={[0, 0, 0.42]}>
        <sphereGeometry args={[0.36, 20, 20]} />
        <meshStandardMaterial color={BEACON_COLOR} emissive={BEACON_COLOR} emissiveIntensity={1.8} />
      </mesh>
      {/* 내부 밝은 하이라이트 구 */}
      <mesh position={[0, 0, 0.55]}>
        <sphereGeometry args={[0.18, 12, 12]} />
        <meshStandardMaterial color="#fff0e8" emissive="#ffffff" emissiveIntensity={3.0} />
      </mesh>
    </group>
  );
}

// ── Constants ──────────────────────────────────────────────────────────────────
const TRACK_H    = 0.22;   // default conveyor slab height (m)
const HS_H       = 0.30;   // HomeStand platform height
const PALLET_H   = 0.38;   // palletizer platform height
const CLICK_DELTA_MAX = 4; // px — suppress click if pointer moved more than this (drag vs click)
const LIFT_W_MIN = 0.35;
const BOX_H      = 3;

const GROUP_FILL_DEFAULT = '#d1d5db';
function getTrackFill(groupId: string | undefined): string {
  return (groupId ? getGroupById(groupId)?.color : undefined) ?? GROUP_FILL_DEFAULT;
}

const STATUS_COLOR: Record<string, string> = {
  running: '#4ade80',
  waiting: '#facc15',
  error:   '#f87171',
};

// HomeStand type accent (matches FloorPlan2D TRACK_TYPE_FILL)
const HS_COLORS = {
  InboundHs:  { body: '#059669', emissive: '#10b981', indicator: '#6ee7b7' },
  OutboundHs: { body: '#ea580c', emissive: '#f97316', indicator: '#fdba74' },
};

// ── Track edge outline — slightly darker shade of the track's own color ────────
function TrackEdges({ ww, wd, color }: { ww: number; wd: number; color: string }) {
  const geo = useMemo(
    () => new THREE.EdgesGeometry(new THREE.BoxGeometry(ww, wd, TRACK_H)),
    [ww, wd],
  );
  const edgeColor = useMemo(() => {
    const c = new THREE.Color(color);
    c.multiplyScalar(0.35);
    return c;
  }, [color]);
  return (
    <lineSegments geometry={geo} renderOrder={1}>
      <lineBasicMaterial color={edgeColor} transparent opacity={0.7} />
    </lineSegments>
  );
}

// ── Default conveyor slab ──────────────────────────────────────────────────────
function DefaultTrack({ track, color, selected, onClick }: {
  track: FPTrack; color: string; selected: boolean; onClick: () => void;
}) {
  const [wx, wy] = fp2world(track.x + track.w / 2, track.y + track.h / 2);
  const ww = Math.max(fpM(track.w), 0.06);
  const wd = Math.max(fpM(track.h), 0.06);
  const floorZ = getLayerZ(track.layerId);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const pad = 0.06;

  useFrame(({ clock }) => {
    if (!selected || !matRef.current) return;
    matRef.current.emissiveIntensity = 0.55 + 0.45 * Math.sin(clock.getElapsedTime() * 5);
  });

  return (
    <group position={[wx, wy, floorZ + TRACK_H / 2]} onClick={(e) => { e.stopPropagation(); if (e.delta <= CLICK_DELTA_MAX) onClick(); }}>
      <mesh>
        <boxGeometry args={[ww, wd, TRACK_H]} />
        <meshStandardMaterial ref={matRef} color={color} roughness={0.55} metalness={selected ? 0.3 : 0.05}
          emissive={selected ? '#ff5400' : '#000'} emissiveIntensity={selected ? 0.55 : 0} />
      </mesh>
      <TrackEdges ww={ww} wd={wd} color={color} />
      {selected && (
        <mesh position={[0, 0, TRACK_H * 0.3]}>
          <boxGeometry args={[ww + pad, wd + pad, TRACK_H * 0.4]} />
          <meshStandardMaterial color="#ff5400" emissive="#ff5400" emissiveIntensity={1}
            transparent opacity={0.35} depthWrite={false} />
        </mesh>
      )}
    </group>
  );
}

// ── Inbound / Outbound HomeStand ───────────────────────────────────────────────
function HomeStandTrack({ track, type, selected, onClick }: {
  track: FPTrack; type: 'InboundHs' | 'OutboundHs'; selected: boolean; onClick: () => void;
}) {
  const [wx, wy] = fp2world(track.x + track.w / 2, track.y + track.h / 2);
  const ww = Math.max(fpM(track.w), 0.12);
  const wd = Math.max(fpM(track.h), 0.12);
  const floorZ = getLayerZ(track.layerId);
  const c = HS_COLORS[type];
  const poleH = 0.55;
  const isInbound = type === 'InboundHs';

  return (
    <group position={[wx, wy, floorZ]} onClick={(e) => { e.stopPropagation(); if (e.delta <= CLICK_DELTA_MAX) onClick(); }}>
      {/* Platform base */}
      <mesh position={[0, 0, HS_H / 2]}>
        <boxGeometry args={[ww, wd, HS_H]} />
        <meshStandardMaterial color={selected ? '#ff5400' : c.body}
          emissive={c.emissive} emissiveIntensity={selected ? 0.5 : 0.2} roughness={0.45} metalness={0.3} />
      </mesh>
      {/* Direction indicator pole */}
      <mesh position={[0, 0, HS_H + poleH / 2]}>
        <boxGeometry args={[0.05, 0.05, poleH]} />
        <meshStandardMaterial color={c.indicator} metalness={0.6} roughness={0.2} />
      </mesh>
      {/* Arrow head (diamond shape approximated as thin slab) */}
      <mesh
        position={[0, 0, HS_H + poleH + (isInbound ? 0.06 : -0.06)]}
        rotation={[0, 0, Math.PI / 4]}
      >
        <boxGeometry args={[0.14, 0.14, 0.04]} />
        <meshStandardMaterial color={c.indicator} emissive={c.indicator} emissiveIntensity={0.4} />
      </mesh>
    </group>
  );
}

// ── BCR Read ───────────────────────────────────────────────────────────────────
function BCRTrack({ track, color, selected, onClick }: {
  track: FPTrack; color: string; selected: boolean; onClick: () => void;
}) {
  const [wx, wy] = fp2world(track.x + track.w / 2, track.y + track.h / 2);
  const ww = Math.max(fpM(track.w), 0.06);
  const wd = Math.max(fpM(track.h), 0.06);
  const floorZ = getLayerZ(track.layerId);
  // Badge radius: fits inside track, max 0.16 m
  const r = Math.min(0.16, Math.min(ww, wd) * 0.38);
  const markerX = -ww / 2 + r + 0.01;
  const markerY = -wd / 2 + r + 0.01;
  return (
    <group position={[wx, wy, floorZ]} onClick={(e) => { e.stopPropagation(); if (e.delta <= CLICK_DELTA_MAX) onClick(); }}>
      {/* Slab — identical to DefaultTrack */}
      <group position={[0, 0, TRACK_H / 2]}>
        <mesh>
          <boxGeometry args={[ww, wd, TRACK_H]} />
          <meshStandardMaterial color={selected ? '#ff5400' : color}
            roughness={0.55} metalness={selected ? 0.3 : 0.05}
            emissive={selected ? '#ff5400' : '#000'} emissiveIntensity={selected ? 0.3 : 0} />
        </mesh>
        <TrackEdges ww={ww} wd={wd} color={color} />
      </group>
      {/* BCR marker — 3D disc + text, respects depth buffer */}
      <group position={[markerX, markerY, TRACK_H + 0.015]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[r, r, 0.025, 16]} />
          <meshStandardMaterial color="#ea580c" emissive="#ea580c" emissiveIntensity={0.55} />
        </mesh>
        <Text position={[0, 0, 0.025]} fontSize={r} color="#ffffff" anchorX="center" anchorY="middle">
          B
        </Text>
      </group>
    </group>
  );
}

// ── Palletizer ─────────────────────────────────────────────────────────────────
function PalletizerTrack({ track, color, selected, onClick }: {
  track: FPTrack; color: string; selected: boolean; onClick: () => void;
}) {
  const [wx, wy] = fp2world(track.x + track.w / 2, track.y + track.h / 2);
  const ww = Math.max(fpM(track.w), 0.12);
  const wd = Math.max(fpM(track.h), 0.12);
  const floorZ = getLayerZ(track.layerId);
  return (
    <group position={[wx, wy, floorZ]}>
      <mesh position={[0, 0, PALLET_H * 0.35]}>
        <boxGeometry args={[ww * 0.85, wd * 0.85, PALLET_H * 0.7]} />
        <meshStandardMaterial color="#546e7a" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0, PALLET_H]} onClick={(e) => { e.stopPropagation(); if (e.delta <= CLICK_DELTA_MAX) onClick(); }}>
        <boxGeometry args={[ww, wd, TRACK_H]} />
        <meshStandardMaterial color={selected ? '#ff5400' : color}
          emissive={selected ? '#ff5400' : color} emissiveIntensity={selected ? 0.35 : 0.1}
          metalness={0.4} roughness={0.45} />
      </mesh>
    </group>
  );
}

// ── Lift (grouped: single shaft at primary track position) ────────────────────
function GroupedLiftTrack({ primaryTrack, groupZ, shaftH, selected, onClick }: {
  primaryTrack: FPTrack; groupZ: number; shaftH: number; selected: boolean; onClick: () => void;
}) {
  const [wx, wy] = fp2world(primaryTrack.x + primaryTrack.w / 2, primaryTrack.y + primaryTrack.h / 2);
  const sw       = Math.max(fpM(primaryTrack.w), LIFT_W_MIN);
  const sd       = Math.max(fpM(primaryTrack.h), LIFT_W_MIN);
  const color    = getTrackFill(primaryTrack.groupId);
  return (
    <group position={[wx, wy, groupZ]} onClick={(e) => { e.stopPropagation(); if (e.delta <= CLICK_DELTA_MAX) onClick(); }}>
      <mesh position={[0, 0, shaftH / 2]}>
        <boxGeometry args={[sw * 0.6, sd * 0.6, shaftH]} />
        <meshStandardMaterial color={selected ? '#ff5400' : color}
          emissive={color} emissiveIntensity={0.2} metalness={0.5} roughness={0.35} transparent opacity={0.85} />
      </mesh>
      {[0, shaftH].map((z) => (
        <mesh key={z} position={[0, 0, z + TRACK_H / 2]}>
          <boxGeometry args={[sw, sd, TRACK_H]} />
          <meshStandardMaterial color={color} metalness={0.4} roughness={0.5} />
        </mesh>
      ))}
      {[[-1,-1],[-1,1],[1,-1],[1,1]].map(([sx,sy]) => (
        <mesh key={`${sx}${sy}`} position={[sx * sw * 0.4, sy * sd * 0.4, shaftH / 2]}>
          <boxGeometry args={[0.06, 0.06, shaftH]} />
          <meshStandardMaterial color="#455a64" metalness={0.8} roughness={0.2} />
        </mesh>
      ))}
    </group>
  );
}

// ── Dispatcher ─────────────────────────────────────────────────────────────────
function TrackIdLabel({ track }: { track: FPTrack }) {
  const [wx, wy] = fp2world(track.x + track.w / 2, track.y + track.h / 2);
  const floorZ = getLayerZ(track.layerId);
  const label = track.unitId || track.id;
  return (
    <group position={[wx, wy, floorZ + 0.55]}>
      <Html center distanceFactor={34} style={{ pointerEvents: 'none' }}>
        <div style={{
          background: 'rgba(15,23,42,0.78)',
          color: '#e2e8f0',
          fontFamily: 'monospace',
          fontSize: 9,
          fontWeight: 700,
          padding: '1px 5px',
          borderRadius: 3,
          whiteSpace: 'nowrap',
          border: '1px solid rgba(226,232,240,0.24)',
        }}>
          {label}
        </div>
      </Html>
    </group>
  );
}

function TrackSegment3D({ track, selected, showTrackId, onSelect }: {
  track: FPTrack; selected: boolean; showTrackId: boolean; onSelect: (t: FPTrack) => void;
}) {
  const statuses = useWarehouseStore((s) => s.trackSegmentStatuses);
  const statusKey = Object.keys(statuses).find(
    (k) => k.includes(track.unitId) || k.endsWith(`:${track.id}`)
  );
  const status = statusKey ? statuses[statusKey] : undefined;
  const baseColor = getTrackFill(track.groupId);
  const color = selected ? '#ff5400'
    : (status && STATUS_COLOR[status]) ? STATUS_COLOR[status]
    : baseColor;
  const onClick = useCallback(() => onSelect(track), [track, onSelect]);
  const type = track.trackType ?? 'Default';

  if (type === 'InboundHs' || type === 'OutboundHs')
    return (
      <>
        <HomeStandTrack track={track} type={type} selected={selected} onClick={onClick} />
        {showTrackId && <TrackIdLabel track={track} />}
      </>
    );
  if (type === 'BCRRead')
    return (
      <>
        <BCRTrack track={track} color={color} selected={selected} onClick={onClick} />
        {showTrackId && <TrackIdLabel track={track} />}
      </>
    );
  if (type === 'Palletizer' || type === 'Depalletizer')
    return (
      <>
        <PalletizerTrack track={track} color={color} selected={selected} onClick={onClick} />
        {showTrackId && <TrackIdLabel track={track} />}
      </>
    );
  return (
    <>
      <DefaultTrack track={track} color={color} selected={selected} onClick={onClick} />
      {showTrackId && <TrackIdLabel track={track} />}
    </>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
interface FPScene3DProps { floorPlan: FloorPlanData; racks?: RackConfig[]; showTrackIds?: boolean; }

export function FPScene3D({ floorPlan, racks = [], showTrackIds = false }: FPScene3DProps) {
  const selectedObject = useWarehouseStore((s) => s.selectedObject);
  const setSelected    = useWarehouseStore((s) => s.setSelectedObject);

  const selectedSegId =
    selectedObject?.type === 'fptrack' ? selectedObject.id
    : selectedObject?.type === 'track'  ? selectedObject.segmentId
    : null;

  const onSelect = useCallback(
    (t: FPTrack) => setSelected({ type: 'fptrack', id: t.id, unitId: t.unitId, layerId: t.layerId }),
    [setSelected],
  );

  const visibleLayers = new Set(floorPlan.layers.filter((l) => l.visible).map((l) => l.id));
  const trackById = new Map(floorPlan.tracks.map((t) => [t.id, t]));

  // ── Lift preprocessing ──────────────────────────────────────────────────────
  const suppressedLiftIds = new Set<string>();
  const satelliteOffsets  = new Map<string, [number, number]>();
  type LiftData = { primaryTrack: FPTrack; groupZ: number; shaftH: number };
  const primaryLiftData   = new Map<string, LiftData>();

  // Group ALL Lift tracks by unitId (visible or not, to resolve lift3dRef across layers)
  const liftGroups = new Map<string, FPTrack[]>();
  for (const t of floorPlan.tracks) {
    if (t.trackType === 'Lift') {
      const g = liftGroups.get(t.unitId) ?? [];
      g.push(t);
      liftGroups.set(t.unitId, g);
    }
  }

  for (const group of liftGroups.values()) {
    // Only process groups that have at least one visible track
    const visibleGroup = group.filter((t) => visibleLayers.has(t.layerId));
    if (!visibleGroup.length) continue;

    const suppTrack = group.find((t) => t.lift3dRef != null);
    let primaryTrack: FPTrack;
    let shaftH: number;

    if (suppTrack) {
      suppressedLiftIds.add(suppTrack.id);
      primaryTrack = trackById.get(suppTrack.lift3dRef!) ?? visibleGroup.find((t) => t !== suppTrack) ?? visibleGroup[0];
      const allZ = group.map((t) => getLayerZ(t.layerId));
      shaftH = suppTrack.lift3dShaftHeight ?? (Math.max(...allZ) - Math.min(...allZ) + TRACK_H);
      // Satellite XY offsets
      const dx = primaryTrack.x - suppTrack.x;
      const dy = primaryTrack.y - suppTrack.y;
      for (const satId of suppTrack.lift3dSatellites ?? []) {
        satelliteOffsets.set(satId, [dx, dy]);
      }
    } else {
      primaryTrack = visibleGroup.reduce((a, b) => getLayerZ(a.layerId) >= getLayerZ(b.layerId) ? a : b);
      for (const t of visibleGroup) {
        if (t.id !== primaryTrack.id) suppressedLiftIds.add(t.id);
      }
      const allZ = visibleGroup.map((t) => getLayerZ(t.layerId));
      shaftH = Math.max(...allZ) - Math.min(...allZ) + TRACK_H;
    }

    if (!visibleLayers.has(primaryTrack.layerId)) continue;
    const groupZ = Math.min(...group.map((t) => getLayerZ(t.layerId)));
    primaryLiftData.set(primaryTrack.id, { primaryTrack, groupZ, shaftH });
  }

  return (
    <>
      {floorPlan.tracks
        .filter((t) => visibleLayers.has(t.layerId))
        .map((t) => {
          // Suppressed secondary lift → skip
          if (suppressedLiftIds.has(t.id)) return null;

          // Primary grouped lift → render combined shaft
          const liftData = primaryLiftData.get(t.id);
          if (liftData) {
            const group = liftGroups.get(t.unitId) ?? [t];
            const groupSelected = group.some((g) => g.id === selectedSegId);
            return (
              <GroupedLiftTrack
                key={t.id}
                primaryTrack={liftData.primaryTrack}
                groupZ={liftData.groupZ}
                shaftH={liftData.shaftH}
                selected={groupSelected}
                onClick={() => onSelect(t)}
              />
            );
          }

          // Satellite track → shift XY to match primary lift position
          const offset = satelliteOffsets.get(t.id);
          const effectiveTrack = offset
            ? { ...t, x: t.x + offset[0], y: t.y + offset[1] }
            : t;

          return (
            <TrackSegment3D
              key={t.id}
              track={effectiveTrack}
              selected={selectedSegId === t.id}
              showTrackId={showTrackIds}
              onSelect={onSelect}
            />
          );
        })}

      {floorPlan.boxes.filter((box) =>
        !box.invisible3d &&
        (!box.layerId || visibleLayers.has(box.layerId))
      ).map((box) => (
        <FPBoxMesh
          key={box.id}
          box={box}
          selected={selectedObject?.type === 'fpbox' && selectedObject.id === box.id}
        />
      ))}

      <SearchBeacon floorPlan={floorPlan} satelliteOffsets={satelliteOffsets} racks={racks} />
    </>
  );
}
