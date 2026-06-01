import { useEffect, useRef } from 'react';
import { useWarehouseStore } from '../../store/useWarehouseStore';
import { CELL_COLORS, TRACK_COLORS, CRANE_STATUS_COLORS, EQUIPMENT_COLORS } from '../../utils/colors';
import type { LayoutConfig } from '../../config/types';
import { cellKey, trackSegKey } from '../../config/types';

interface SelectionPopupProps {
  layout: LayoutConfig;
}

const TYPE_META = {
  rack: { label: 'RACK', accent: '#60a5fa', icon: '' },
  cell: { label: 'RACK CELL', accent: '#2e7cf6', icon: '' },
  crane: { label: 'CRANE', accent: '#e6952b', icon: '' },
  tray: { label: 'TRAY', accent: '#48bb78', icon: '' },
  track: { label: 'TRACK', accent: '#90a4ae', icon: '' },
  fptrack: { label: 'TRACK', accent: '#6ee7b7', icon: '' },
  fpbox: { label: 'EQUIPMENT', accent: '#f6ad55', icon: '' },
  equipment: { label: 'EQUIPMENT', accent: '#f6ad55', icon: '' },
  homestand: { label: 'HOME STAND', accent: '#f6e05e', icon: '' },
} as const;

function Row({ label, value, badge }: { label: string; value: React.ReactNode; badge?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '3px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <span style={{ color: '#718096', flexShrink: 0 }}>{label}</span>
      <span style={{ color: '#e2e8f0', textAlign: 'right', display: 'flex', alignItems: 'center', gap: 5 }}>
        {badge && <span style={{ width: 8, height: 8, borderRadius: '50%', background: badge, display: 'inline-block', flexShrink: 0 }} />}
        {value}
      </span>
    </div>
  );
}

function RackContent({ layout }: { layout: LayoutConfig }) {
  const sel = useWarehouseStore((s) => s.selectedObject);
  const cellStates = useWarehouseStore((s) => s.cellStates);
  if (sel?.type !== 'rack') return null;
  const rack = layout.racks.find((item) => item.id === sel.id);
  if (!rack) return <Row label="ID" value={sel.id} />;

  return (
    <>
      <Row label="ID" value={rack.id} />
      <Row label="Bays" value={rack.bays} />
      <Row label="Levels" value={rack.levels} />
      <div style={{ marginTop: 8, overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 10 }}>
          <tbody>
            {Array.from({ length: rack.levels }, (_, levelIndex) => {
              const level = rack.levels - levelIndex - 1;
              return (
                <tr key={level}>
                  {Array.from({ length: rack.bays }, (_, bay) => {
                    const status = cellStates[cellKey(rack.id, 0, bay, level)] ?? 'empty';
                    return (
                      <td key={`${level}-${bay}`} style={{ border: '1px solid rgba(255,255,255,0.08)', background: CELL_COLORS[status], color: '#0f172a', textAlign: 'center', padding: '3px 0' }}>
                        {status === 'occupied' ? '●' : ''}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

function CellContent({ layout }: { layout: LayoutConfig }) {
  const sel = useWarehouseStore((s) => s.selectedObject);
  const cellStates = useWarehouseStore((s) => s.cellStates);
  if (sel?.type !== 'cell') return null;
  const rack = layout.racks.find((r) => r.id === sel.rackId);
  const status = cellStates[sel.key] ?? 'empty';
  return (
    <>
      <Row label="Rack" value={sel.rackId} />
      <Row label="Bank" value={sel.bank} />
      <Row label="Bay" value={sel.bay} />
      <Row label="Level" value={sel.level} />
      {rack && <Row label="Cell size" value={`${rack.cellWidth}x${rack.cellHeight}x${rack.cellDepth} m`} />}
      <Row label="Status" value={status} badge={CELL_COLORS[status]} />
    </>
  );
}

function CraneContent({ layout }: { layout: LayoutConfig }) {
  const sel = useWarehouseStore((s) => s.selectedObject);
  const craneStates = useWarehouseStore((s) => s.craneStates);
  if (sel?.type !== 'crane') return null;
  const cfg = layout.cranes.find((c) => c.id === sel.id);
  const cs = craneStates[sel.id];
  return (
    <>
      <Row label="ID" value={sel.id} />
      <Row label="Status" value={cs?.status ?? '-'} badge={CRANE_STATUS_COLORS[cs?.status ?? 'idle']} />
      <Row label="X pos" value={cs ? `${(cs.xPosition * 100).toFixed(0)} %` : '-'} />
      <Row label="Y pos" value={cs ? `${(cs.yPosition * 100).toFixed(0)} %` : '-'} />
      <Row label="Fork" value={cs ? cs.forkExtension.toFixed(2) : '-'} />
      {cfg && <Row label="Racks" value={cfg.rackIds.join(', ')} />}
    </>
  );
}

function TrayContent({ layout }: { layout: LayoutConfig }) {
  const sel = useWarehouseStore((s) => s.selectedObject);
  const trays = useWarehouseStore((s) => s.trays);
  if (sel?.type !== 'tray') return null;
  const tray = trays.find((t) => t.id === sel.id);
  if (!tray) return <Row label="ID" value={sel.id} />;
  const loc = tray.location;
  let locLabel = '';
  let locDetail = '';
  if (loc.type === 'track') {
    const track = layout.tracks.find((t) => t.id === loc.trackId);
    const seg = track?.segments.find((s) => s.id === loc.segmentId);
    locLabel = 'Track';
    locDetail = `${loc.trackId} > ${loc.segmentId}${seg ? ` (${seg.type})` : ''}`;
  } else if (loc.type === 'crane') {
    locLabel = 'Crane';
    locDetail = loc.craneId;
  } else {
    locLabel = 'Rack cell';
    locDetail = loc.type === 'rack' ? `${loc.rackId} B${loc.bay} L${loc.level}` : '';
  }
  return (
    <>
      <Row label="Tray ID" value={sel.id} />
      <Row label="Location" value={locLabel} />
      <Row label="Detail" value={locDetail} />
    </>
  );
}

function TrackContent({ layout }: { layout: LayoutConfig }) {
  const sel = useWarehouseStore((s) => s.selectedObject);
  const trackStatuses = useWarehouseStore((s) => s.trackSegmentStatuses);
  if (sel?.type !== 'track') return null;
  const track = layout.tracks.find((t) => t.id === sel.trackId);
  const seg = track?.segments.find((s) => s.id === sel.segmentId);
  const status = trackStatuses[trackSegKey(sel.trackId, sel.segmentId)] ?? 'idle';
  return (
    <>
      <Row label="Track" value={sel.trackId} />
      <Row label="Segment" value={sel.segmentId} />
      <Row label="Type" value={seg?.type ?? '-'} />
      <Row label="Status" value={status} badge={TRACK_COLORS[status]} />
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
      <Row label="ID" value={eq.id} />
      <Row label="Name" value={eq.name} />
      <Row label="Type" value={eq.type} badge={colors.accent} />
      <Row label="Position" value={eq.position.map((v) => v.toFixed(1)).join(', ')} />
      <Row label="Size" value={eq.size.map((v) => v.toFixed(1)).join(' x ')} />
    </>
  );
}

function FPBoxContent({ layout }: { layout: LayoutConfig }) {
  const sel = useWarehouseStore((s) => s.selectedObject);
  if (sel?.type !== 'fpbox') return null;
  const eq    = (layout.equipment ?? []).find((e) => e.id === sel.id);
  const box   = layout.floorPlan?.boxes.find((b) => b.id === sel.id);
  const crane = layout.floorPlan?.cranes.find((c) => c.id === sel.id);
  const unitId = eq?.unitId ?? eq?.name ?? box?.text ?? crane?.id ?? sel.id;
  const rawId = sel.id.toUpperCase();
  const eqType = rawId.startsWith('CDC')
    ? 'CDC Rack'
    : (rawId.startsWith('HAG') || rawId.startsWith('AG'))
    ? 'Rack'
    : 'Equipment';
  return (
    <>
      <Row label="Unit ID" value={unitId} />
      <Row label="Type" value={eqType} />
    </>
  );
}

function FPTrackContent({ layout }: { layout: LayoutConfig }) {
  const sel = useWarehouseStore((s) => s.selectedObject);
  const trackStatuses = useWarehouseStore((s) => s.trackSegmentStatuses);
  if (sel?.type !== 'fptrack') return null;
  const fpTrack = layout.floorPlan?.tracks.find((t) => t.id === sel.id);
  const statusKey = fpTrack
    ? Object.keys(trackStatuses).find((k) => k.includes(fpTrack.unitId) || k.endsWith(`:${fpTrack.id}`))
    : undefined;
  const status = statusKey ? trackStatuses[statusKey] : undefined;
  return (
    <>
      <Row label="Unit ID" value={sel.unitId} />
      {fpTrack?.trackType && fpTrack.trackType !== 'Default' && (
        <Row label="Type" value={fpTrack.trackType} />
      )}
      {status && <Row label="Status" value={status} badge={TRACK_COLORS[status as keyof typeof TRACK_COLORS] ?? '#888'} />}
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
      <Row label="ID" value={hs.id} />
      <Row label="Name" value={hs.name} />
      <Row label="Units" value={`${hs.units} unit${hs.units > 1 ? 's' : ''}`} />
      <Row label="Position" value={hs.position.map((v) => v.toFixed(1)).join(', ')} />
      {hs.linkedCraneId && <Row label="Crane" value={hs.linkedCraneId} />}
    </>
  );
}

const POPUP_W = 160;
const POPUP_H = 180;
const OFFSET  = 12;

export function SelectionPopup({ layout }: SelectionPopupProps) {
  const sel      = useWarehouseStore((s) => s.selectedObject);
  const clickPos = useWarehouseStore((s) => s.clickPosition);
  const setSelected = useWarehouseStore((s) => s.setSelectedObject);
  const popupRef = useRef<HTMLDivElement>(null);

  // Rack/cell popups need extra width to show the cell grid comfortably
  const popupW = (() => {
    if (!sel) return POPUP_W;
    if (sel.type === 'rack') {
      const rack = layout.racks.find((r) => r.id === sel.id);
      return rack ? Math.max(260, Math.min(480, rack.bays * 24 + 80)) : 260;
    }
    if (sel.type === 'cell') {
      const rack = layout.racks.find((r) => r.id === sel.rackId);
      return rack ? Math.max(260, Math.min(480, rack.bays * 24 + 80)) : 260;
    }
    return POPUP_W;
  })();

  useEffect(() => {
    if (!sel) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelected(null); };
    const onPointerDown = (e: PointerEvent) => {
      if (e.detail >= 2) return; // 더블클릭 시 close 차단 — dblclick 핸들러가 먼저 실행되도록
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) setSelected(null);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [sel, setSelected]);

  if (!sel) return null;

  const meta = TYPE_META[sel.type as keyof typeof TYPE_META] ?? TYPE_META.track;

  // Position near click if available, otherwise fall back to bottom-center
  let posStyle: React.CSSProperties;
  if (clickPos) {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const left = clickPos.x + OFFSET + popupW > vw
      ? clickPos.x - popupW - OFFSET
      : clickPos.x + OFFSET;
    const top = clickPos.y + OFFSET + POPUP_H > vh
      ? clickPos.y - POPUP_H - OFFSET
      : clickPos.y + OFFSET;
    posStyle = { position: 'fixed', left, top };
  } else {
    posStyle = { position: 'absolute', bottom: 72, left: '50%', transform: 'translateX(-50%)' };
  }

  return (
    <div ref={popupRef} style={{ ...posStyle, minWidth: popupW, maxWidth: popupW, background: 'rgba(11,15,26,0.96)', border: `1px solid ${meta.accent}55`, borderRadius: 8, overflow: 'hidden', boxShadow: `0 4px 24px rgba(0,0,0,0.5), 0 0 0 1px ${meta.accent}22`, fontFamily: 'monospace', fontSize: 12, backdropFilter: 'blur(10px)', zIndex: 20 }}>
      <div style={{ background: `${meta.accent}22`, borderBottom: `1px solid ${meta.accent}44`, padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: meta.accent, fontWeight: 700, letterSpacing: 1, fontSize: 11 }}>{meta.icon} {meta.label}</span>
        <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: '#718096', cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: '0 2px' }}>x</button>
      </div>
      <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 1 }}>
        {sel.type === 'rack' && <RackContent layout={layout} />}
        {sel.type === 'cell' && <CellContent layout={layout} />}
        {sel.type === 'crane' && <CraneContent layout={layout} />}
        {sel.type === 'tray' && <TrayContent layout={layout} />}
        {sel.type === 'track' && <TrackContent layout={layout} />}
        {sel.type === 'fpbox' && <FPBoxContent layout={layout} />}
        {sel.type === 'fptrack' && <FPTrackContent layout={layout} />}
        {sel.type === 'equipment' && <EquipmentContent layout={layout} />}
        {sel.type === 'homestand' && <HomeStandContent layout={layout} />}
      </div>
    </div>
  );
}
