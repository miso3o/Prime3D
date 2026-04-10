/**
 * SelectionPopup.tsx — floating info panel shown when an object is selected.
 *
 * Displays contextual information for whatever is currently selected:
 *   - RACK CELL:    rack ID, cell coordinates, status
 *   - CRANE:        ID, status, position percentages, fork state
 *   - TRAY:         ID, current location (track / crane / rack)
 *   - TRACK SEGMENT: track ID, segment ID, type, status
 *   - EQUIPMENT:    ID, name, type, position
 *   - HOME STAND:   ID, name, units, linked crane
 *
 * Positioned at bottom-center above the playback controls.
 * Dismissed by clicking ✕ or clicking blank space in the scene.
 */
import { useWarehouseStore } from '../../store/useWarehouseStore';
import { CELL_COLORS, TRACK_COLORS, CRANE_STATUS_COLORS, EQUIPMENT_COLORS } from '../../utils/colors';
import type { LayoutConfig } from '../../config/types';
import { trackSegKey } from '../../config/types';
import { getFloorForLayer } from '../../config/layerConfig';

interface SelectionPopupProps {
  layout: LayoutConfig;
}

// ── Type accent palette ────────────────────────────────────────────────────────
const TYPE_META = {
  cell:      { label: 'RACK CELL',      accent: '#2e7cf6', icon: '▦' },
  crane:     { label: 'CRANE',          accent: '#e6952b', icon: '⬆' },
  tray:      { label: 'TRAY',           accent: '#48bb78', icon: '▬' },
  track:     { label: 'TRACK SEGMENT',  accent: '#90a4ae', icon: '⇒' },
  fptrack:   { label: 'TRACK SEGMENT',  accent: '#6ee7b7', icon: '⇒' },
  equipment: { label: 'EQUIPMENT',      accent: '#f6ad55', icon: '⚙' },
  homestand: { label: 'HOME STAND',     accent: '#f6e05e', icon: '⏹' },
} as const;

// ── Generic info row ───────────────────────────────────────────────────────────
function Row({ label, value, badge }: { label: string; value: React.ReactNode; badge?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '3px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <span style={{ color: '#718096', flexShrink: 0 }}>{label}</span>
      <span style={{ color: '#e2e8f0', textAlign: 'right', display: 'flex', alignItems: 'center', gap: 5 }}>
        {badge && (
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: badge, display: 'inline-block', flexShrink: 0 }} />
        )}
        {value}
      </span>
    </div>
  );
}

// ── Per-type content components ────────────────────────────────────────────────

function CellContent({ layout }: { layout: LayoutConfig }) {
  const sel        = useWarehouseStore((s) => s.selectedObject);
  const cellStates = useWarehouseStore((s) => s.cellStates);
  if (sel?.type !== 'cell') return null;

  const rack   = layout.racks.find((r) => r.id === sel.rackId);
  const status = cellStates[sel.key] ?? 'empty';

  return (
    <>
      <Row label="Rack"      value={sel.rackId} />
      <Row label="Bank"      value={sel.bank} />
      <Row label="Bay"       value={sel.bay} />
      <Row label="Level"     value={sel.level} />
      {rack && <Row label="Cell size" value={`${rack.cellWidth}×${rack.cellHeight}×${rack.cellDepth} m`} />}
      <Row label="Status"    value={status} badge={CELL_COLORS[status]} />
    </>
  );
}

function CraneContent({ layout }: { layout: LayoutConfig }) {
  const sel         = useWarehouseStore((s) => s.selectedObject);
  const craneStates = useWarehouseStore((s) => s.craneStates);
  if (sel?.type !== 'crane') return null;

  const cfg = layout.cranes.find((c) => c.id === sel.id);
  const cs  = craneStates[sel.id];

  return (
    <>
      <Row label="ID"      value={sel.id} />
      <Row label="Status"  value={cs?.status ?? '—'} badge={CRANE_STATUS_COLORS[cs?.status ?? 'idle']} />
      <Row label="X pos"   value={cs ? `${(cs.xPosition * 100).toFixed(0)} %` : '—'} />
      <Row label="Y pos"   value={cs ? `${(cs.yPosition * 100).toFixed(0)} %` : '—'} />
      <Row label="Fork"    value={cs ? cs.forkExtension.toFixed(2) : '—'} />
      {cfg && <Row label="Racks" value={cfg.rackIds.join(', ')} />}
    </>
  );
}

function TrayContent({ layout }: { layout: LayoutConfig }) {
  const sel   = useWarehouseStore((s) => s.selectedObject);
  const trays = useWarehouseStore((s) => s.trays);
  if (sel?.type !== 'tray') return null;

  const tray = trays.find((t) => t.id === sel.id);
  if (!tray) return <Row label="ID" value={sel.id} />;

  const loc = tray.location;

  let locLabel  = '';
  let locDetail = '';

  if (loc.type === 'track') {
    const track = layout.tracks.find((t) => t.id === loc.trackId);
    const seg   = track?.segments.find((s) => s.id === loc.segmentId);
    locLabel  = 'Track';
    locDetail = `${loc.trackId} › ${loc.segmentId}${seg ? ` (${seg.type})` : ''}`;
  } else if (loc.type === 'crane') {
    locLabel  = 'Crane';
    locDetail = loc.craneId;
  } else {
    locLabel  = 'Rack cell';
    locDetail = `${loc.rackId} B${loc.bay} L${loc.level}`;
  }

  return (
    <>
      <Row label="Tray ID"  value={sel.id} />
      <Row label="Location" value={locLabel} />
      <Row label="Detail"   value={locDetail} />
    </>
  );
}

function TrackContent({ layout }: { layout: LayoutConfig }) {
  const sel          = useWarehouseStore((s) => s.selectedObject);
  const trackStatuses = useWarehouseStore((s) => s.trackSegmentStatuses);
  if (sel?.type !== 'track') return null;

  const track  = layout.tracks.find((t) => t.id === sel.trackId);
  const seg    = track?.segments.find((s) => s.id === sel.segmentId);
  const status = trackStatuses[trackSegKey(sel.trackId, sel.segmentId)] ?? 'idle';

  return (
    <>
      <Row label="Track"     value={sel.trackId} />
      <Row label="Segment"   value={sel.segmentId} />
      <Row label="Type"      value={seg?.type ?? '—'} />
      <Row label="Status"    value={status} badge={TRACK_COLORS[status]} />
      {track && <Row label="Direction" value={track.direction.toUpperCase()} />}
      {track?.linkedCraneId && <Row label="Crane" value={track.linkedCraneId} />}
    </>
  );
}

function EquipmentContent({ layout }: { layout: LayoutConfig }) {
  const sel = useWarehouseStore((s) => s.selectedObject);
  if (sel?.type !== 'equipment') return null;

  const eq = (layout.equipment ?? []).find((e) => e.id === sel.id);
  if (!eq) return <Row label="ID" value={sel.id} />;

  const colors = EQUIPMENT_COLORS[eq.type];

  return (
    <>
      <Row label="ID"       value={eq.id} />
      <Row label="Name"     value={eq.name} />
      <Row label="Type"     value={eq.type} badge={colors.accent} />
      <Row label="Position" value={eq.position.map((v) => v.toFixed(1)).join(', ')} />
      <Row label="Size"     value={eq.size.map((v) => v.toFixed(1)).join(' × ')} />
    </>
  );
}

function FPTrackContent({ layout }: { layout: LayoutConfig }) {
  const sel          = useWarehouseStore((s) => s.selectedObject);
  const trackStatuses = useWarehouseStore((s) => s.trackSegmentStatuses);
  if (sel?.type !== 'fptrack') return null;

  const fpTrack = layout.floorPlan?.tracks.find((t) => t.id === sel.id);
  const statusKey = fpTrack
    ? Object.keys(trackStatuses).find(
        (k) => k.includes(fpTrack.unitId) || k.endsWith(`:${fpTrack.id}`)
      )
    : undefined;
  const status = statusKey ? trackStatuses[statusKey] : undefined;

  const floorName = getFloorForLayer(sel.layerId)?.shortName ?? '—';

  return (
    <>
      <Row label="Unit ID"   value={sel.unitId} />
      <Row label="Segment"   value={sel.id} />
      <Row label="Layer"     value={sel.layerId} />
      <Row label="Floor"     value={floorName} />
      {fpTrack && <Row label="Type"   value={fpTrack.trackType ?? 'Default'} />}
      {fpTrack && <Row label="Dir"    value={fpTrack.direction?.toUpperCase() ?? 'auto'} />}
      {status   && <Row label="Status" value={status} badge={TRACK_COLORS[status as keyof typeof TRACK_COLORS] ?? '#888'} />}
    </>
  );
}

function HomeStandContent({ layout }: { layout: LayoutConfig }) {
  const sel = useWarehouseStore((s) => s.selectedObject);
  if (sel?.type !== 'homestand') return null;

  const hs = (layout.homeStands ?? []).find((h) => h.id === sel.id);
  if (!hs) return <Row label="ID" value={sel.id} />;

  return (
    <>
      <Row label="ID"       value={hs.id} />
      <Row label="Name"     value={hs.name} />
      <Row label="Units"    value={`${hs.units} unit${hs.units > 1 ? 's' : ''}`} />
      <Row label="Position" value={hs.position.map((v) => v.toFixed(1)).join(', ')} />
      {hs.linkedCraneId && <Row label="Crane" value={hs.linkedCraneId} />}
    </>
  );
}

// ── Main popup ─────────────────────────────────────────────────────────────────

export function SelectionPopup({ layout }: SelectionPopupProps) {
  const sel         = useWarehouseStore((s) => s.selectedObject);
  const setSelected = useWarehouseStore((s) => s.setSelectedObject);

  if (!sel) return null;

  const meta = TYPE_META[sel.type];

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 72,
        left: '50%',
        transform: 'translateX(-50%)',
        minWidth: 270,
        maxWidth: 340,
        background: 'rgba(11,15,26,0.96)',
        border: `1px solid ${meta.accent}55`,
        borderRadius: 8,
        overflow: 'hidden',
        boxShadow: `0 4px 24px rgba(0,0,0,0.5), 0 0 0 1px ${meta.accent}22`,
        fontFamily: 'monospace',
        fontSize: 12,
        backdropFilter: 'blur(10px)',
        animation: 'popupIn 0.15s ease-out',
        zIndex: 20,
      }}
    >
      <style>{`
        @keyframes popupIn {
          from { opacity: 0; transform: translateX(-50%) translateY(6px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>

      {/* Header */}
      <div
        style={{
          background: `${meta.accent}22`,
          borderBottom: `1px solid ${meta.accent}44`,
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ color: meta.accent, fontWeight: 700, letterSpacing: 1, fontSize: 11 }}>
          {meta.icon}&nbsp; {meta.label}
        </span>
        <button
          onClick={() => setSelected(null)}
          style={{
            background: 'none',
            border: 'none',
            color: '#718096',
            cursor: 'pointer',
            fontSize: 14,
            lineHeight: 1,
            padding: '0 2px',
          }}
        >
          ✕
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 1 }}>
        {sel.type === 'cell'      && <CellContent      layout={layout} />}
        {sel.type === 'crane'     && <CraneContent     layout={layout} />}
        {sel.type === 'tray'      && <TrayContent      layout={layout} />}
        {sel.type === 'track'     && <TrackContent     layout={layout} />}
        {sel.type === 'fptrack'   && <FPTrackContent   layout={layout} />}
        {sel.type === 'equipment' && <EquipmentContent layout={layout} />}
        {sel.type === 'homestand' && <HomeStandContent layout={layout} />}
      </div>
    </div>
  );
}
