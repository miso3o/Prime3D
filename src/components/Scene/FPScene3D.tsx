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
import { useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { Html, Text } from '@react-three/drei';
import type { FloorPlanData, FPTrack } from '../../config/types';
import { fp2world, fpM } from '../../config/fp2world';
import { getLayerZ } from '../../config/layerConfig';
import { useWarehouseStore } from '../../store/useWarehouseStore';

// ── Constants ──────────────────────────────────────────────────────────────────
const TRACK_H    = 0.22;   // default conveyor slab height (m)
const HS_H       = 0.30;   // HomeStand platform height
const PALLET_H   = 0.38;   // palletizer platform height
const LIFT_W_MIN = 0.35;
const BOX_H      = 3;

// Layer fill → matches FloorPlan2D.tsx
const LAYER_FILL: Record<string, string> = {
  layer_group1: '#93c5fd',
  layer_group2: '#67e8f9',
  layer_group3: '#6ee7b7',
  layer_group4: '#c4b5fd',
  layer_group5_1: '#fcd34d',
  layer_group5_2: '#fcd34d',
  layer_group6: '#fca5a5',
  layer_group7: '#f9a8d4',
  default:        '#d1d5db',
};

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
  return (
    <group position={[wx, wy, floorZ + TRACK_H / 2]} onClick={(e) => { e.stopPropagation(); onClick(); }}>
      <mesh>
        <boxGeometry args={[ww, wd, TRACK_H]} />
        <meshStandardMaterial color={color} roughness={0.55} metalness={selected ? 0.3 : 0.05}
          emissive={selected ? '#fbbf24' : '#000'} emissiveIntensity={selected ? 0.3 : 0} />
      </mesh>
      <TrackEdges ww={ww} wd={wd} color={color} />
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
    <group position={[wx, wy, floorZ]} onClick={(e) => { e.stopPropagation(); onClick(); }}>
      {/* Platform base */}
      <mesh position={[0, 0, HS_H / 2]}>
        <boxGeometry args={[ww, wd, HS_H]} />
        <meshStandardMaterial color={selected ? '#fbbf24' : c.body}
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
    <group position={[wx, wy, floorZ]} onClick={(e) => { e.stopPropagation(); onClick(); }}>
      {/* Slab — identical to DefaultTrack */}
      <group position={[0, 0, TRACK_H / 2]}>
        <mesh>
          <boxGeometry args={[ww, wd, TRACK_H]} />
          <meshStandardMaterial color={selected ? '#fbbf24' : color}
            roughness={0.55} metalness={selected ? 0.3 : 0.05}
            emissive={selected ? '#fbbf24' : '#000'} emissiveIntensity={selected ? 0.3 : 0} />
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
      <mesh position={[0, 0, PALLET_H]} onClick={(e) => { e.stopPropagation(); onClick(); }}>
        <boxGeometry args={[ww, wd, TRACK_H]} />
        <meshStandardMaterial color={selected ? '#fbbf24' : color}
          emissive={selected ? '#fbbf24' : color} emissiveIntensity={selected ? 0.35 : 0.1}
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
  const color    = LAYER_FILL[primaryTrack.layerId] ?? LAYER_FILL.default;
  return (
    <group position={[wx, wy, groupZ]} onClick={(e) => { e.stopPropagation(); onClick(); }}>
      <mesh position={[0, 0, shaftH / 2]}>
        <boxGeometry args={[sw * 0.6, sd * 0.6, shaftH]} />
        <meshStandardMaterial color={selected ? '#fbbf24' : color}
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
  const baseColor = LAYER_FILL[track.layerId] ?? LAYER_FILL.default;
  const color = selected ? '#fbbf24'
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
interface FPScene3DProps { floorPlan: FloorPlanData; showTrackIds?: boolean; }

export function FPScene3D({ floorPlan, showTrackIds = false }: FPScene3DProps) {
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

      {floorPlan.boxes.filter((box) => !box.invisible3d).map((box) => {
        const bx = box.x3d ?? box.x;
        const by = box.y3d ?? box.y;
        const [wx, wy] = fp2world(bx + box.w / 2, by + box.h / 2);
        const ww = Math.max(fpM(box.w), 0.1);
        const wd = Math.max(fpM(box.h), 0.1);
        const floorZ = box.layerId ? getLayerZ(box.layerId) : 0;
        const opacity = Math.max(box.bgAlpha ?? 0.5, 0.55);
        const transparent = opacity < 0.98;
        return (
          <mesh key={box.id} position={[wx, wy, floorZ + BOX_H / 2]}>
            <boxGeometry args={[ww, wd, BOX_H]} />
            <meshStandardMaterial color={box.bgColor || '#334155'}
              transparent={transparent} opacity={opacity} depthWrite={!transparent} roughness={0.72} metalness={0.05} />
          </mesh>
        );
      })}
    </>
  );
}
