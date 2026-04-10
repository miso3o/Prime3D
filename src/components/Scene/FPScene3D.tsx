/**
 * FPScene3D.tsx — renders the fms_prime floor plan as 3D geometry (Z-up).
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
import { useCallback } from 'react';
import type { FloorPlanData, FPTrack } from '../../config/types';
import { fp2world, fpM } from '../../config/fp2world';
import { getLayerZ, INTER_FLOOR_SPAN } from '../../config/layerConfig';
import { useWarehouseStore } from '../../store/useWarehouseStore';

// ── Constants ──────────────────────────────────────────────────────────────────
const TRACK_H    = 0.22;   // default conveyor slab height (m)
const HS_H       = 0.30;   // HomeStand platform height
const BCR_H      = 0.10;   // BCR slab height
const PALLET_H   = 0.38;   // palletizer platform height
const LIFT_W_MIN = 0.35;
const BOX_H      = 0.04;

// Layer fill → matches FloorPlan2D.tsx
const LAYER_FILL: Record<string, string> = {
  layer_mncrxsud: '#93c5fd',
  layer_mncs2tlq: '#67e8f9',
  layer_mncs2zk3: '#6ee7b7',
  layer_mncs35c8: '#c4b5fd',
  layer_mncs3a33: '#fcd34d',
  layer_mncs3e54: '#fca5a5',
  layer_mncs3hsr: '#f9a8d4',
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

// ── Default conveyor slab ──────────────────────────────────────────────────────
function DefaultTrack({ track, color, selected, onClick }: {
  track: FPTrack; color: string; selected: boolean; onClick: () => void;
}) {
  const [wx, wy] = fp2world(track.x + track.w / 2, track.y + track.h / 2);
  const ww = Math.max(fpM(track.w), 0.06);
  const wd = Math.max(fpM(track.h), 0.06);
  const floorZ = getLayerZ(track.layerId);
  return (
    <mesh position={[wx, wy, floorZ + TRACK_H / 2]} onClick={(e) => { e.stopPropagation(); onClick(); }}>
      <boxGeometry args={[ww, wd, TRACK_H]} />
      <meshStandardMaterial color={color} roughness={0.55} metalness={selected ? 0.3 : 0.05}
        emissive={selected ? '#fbbf24' : '#000'} emissiveIntensity={selected ? 0.3 : 0} />
    </mesh>
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
function BCRTrack({ track, selected, onClick }: {
  track: FPTrack; selected: boolean; onClick: () => void;
}) {
  const [wx, wy] = fp2world(track.x + track.w / 2, track.y + track.h / 2);
  const ww = Math.max(fpM(track.w), 0.06);
  const wd = Math.max(fpM(track.h), 0.06);
  const floorZ = getLayerZ(track.layerId);
  return (
    <group position={[wx, wy, floorZ]} onClick={(e) => { e.stopPropagation(); onClick(); }}>
      {/* Thin slab */}
      <mesh position={[0, 0, BCR_H / 2]}>
        <boxGeometry args={[ww, wd, BCR_H]} />
        <meshStandardMaterial color={selected ? '#fbbf24' : '#f472b6'}
          emissive="#f472b6" emissiveIntensity={selected ? 0.5 : 0.15} roughness={0.4} metalness={0.2} />
      </mesh>
      {/* Scanner post */}
      <mesh position={[0, 0, BCR_H + 0.22]}>
        <boxGeometry args={[0.04, 0.04, 0.44]} />
        <meshStandardMaterial color="#475569" metalness={0.7} roughness={0.2} />
      </mesh>
      {/* Scanner head */}
      <mesh position={[0, 0, BCR_H + 0.44 + 0.04]}>
        <boxGeometry args={[0.12, 0.06, 0.08]} />
        <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={0.4} />
      </mesh>
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

// ── Lift ───────────────────────────────────────────────────────────────────────
function LiftTrack({ track, color, selected, onClick }: {
  track: FPTrack; color: string; selected: boolean; onClick: () => void;
}) {
  const [wx, wy] = fp2world(track.x + track.w / 2, track.y + track.h / 2);
  const sw = Math.max(fpM(track.w), LIFT_W_MIN);
  const sd = Math.max(fpM(track.h), LIFT_W_MIN);
  const floorZ = getLayerZ(track.layerId);
  const shaftH = INTER_FLOOR_SPAN + TRACK_H;
  return (
    <group position={[wx, wy, floorZ]} onClick={(e) => { e.stopPropagation(); onClick(); }}>
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
function TrackSegment3D({ track, selected, onSelect }: {
  track: FPTrack; selected: boolean; onSelect: (t: FPTrack) => void;
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
    return <HomeStandTrack track={track} type={type} selected={selected} onClick={onClick} />;
  if (type === 'BCRRead')
    return <BCRTrack track={track} selected={selected} onClick={onClick} />;
  if (type === 'Lift')
    return <LiftTrack track={track} color={baseColor} selected={selected} onClick={onClick} />;
  if (type === 'Palletizer')
    return <PalletizerTrack track={track} color={color} selected={selected} onClick={onClick} />;
  return <DefaultTrack track={track} color={color} selected={selected} onClick={onClick} />;
}

// ── Main component ─────────────────────────────────────────────────────────────
interface FPScene3DProps { floorPlan: FloorPlanData; }

export function FPScene3D({ floorPlan }: FPScene3DProps) {
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

  return (
    <>
      {floorPlan.tracks
        .filter((t) => visibleLayers.has(t.layerId))
        .map((t) => (
          <TrackSegment3D key={t.id} track={t} selected={selectedSegId === t.id} onSelect={onSelect} />
        ))}

      {floorPlan.boxes.map((box) => {
        const [wx, wy] = fp2world(box.x + box.w / 2, box.y + box.h / 2);
        const ww = Math.max(fpM(box.w), 0.1);
        const wd = Math.max(fpM(box.h), 0.1);
        return (
          <mesh key={box.id} position={[wx, wy, BOX_H / 2]}>
            <boxGeometry args={[ww, wd, BOX_H]} />
            <meshStandardMaterial color={box.bgColor || '#334155'}
              transparent opacity={Math.max(box.bgAlpha ?? 0.5, 0.25)} roughness={0.8} metalness={0} />
          </mesh>
        );
      })}
    </>
  );
}
