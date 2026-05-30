/**
 * FloorPlan2D.tsx — SVG-based factory floor plan view.
 *
 * Features:
 *  - Floor selector tabs: ALL / GRD 2F / 7F / 6F
 *    Positioned at top=58 so they don't overlap the ViewToggle (top=16, ~36px tall)
 *  - Click track → emits { type: 'fptrack', id, unitId, layerId }
 *  - Click equipment box → emits { type: 'fpbox', id }
 *  - Zoom/pan, status colour overlay
 */
import { useRef, useState, useCallback, useEffect, type WheelEvent, type PointerEvent } from 'react';
import type { FloorPlanData, FPTrack, FPBox, LayoutConfig } from '../../config/types';
import { useWarehouseStore } from '../../store/useWarehouseStore';
import { FLOOR_DEFS, type FloorId, LAYER_FLOOR_MAP } from '../../config/layerConfig';
import { computeTrayWorldPos } from '../Tray/Tray';
import { worldPointToFloorPlan } from '../../config/layoutGeometry';
import defaultLayoutJson from '../../config/defaultLayout.json';

const DEFAULT_LAYOUT = defaultLayoutJson as unknown as LayoutConfig;

// ── Layer → color ──────────────────────────────────────────────────────────────
const LAYER_COLORS: Record<string, { fill: string; stroke: string }> = {
  layer_group1: { fill: '#93c5fd', stroke: '#2563eb' },
  layer_group2: { fill: '#67e8f9', stroke: '#0891b2' },
  layer_group3: { fill: '#6ee7b7', stroke: '#059669' },
  layer_group4: { fill: '#c4b5fd', stroke: '#7c3aed' },
  layer_group5_1: { fill: '#fcd34d', stroke: '#b45309' },
  layer_group5_2: { fill: '#fcd34d', stroke: '#b45309' },
  layer_group6: { fill: '#fca5a5', stroke: '#dc2626' },
  layer_group7: { fill: '#f9a8d4', stroke: '#be185d' },
  default:        { fill: '#d1d5db', stroke: '#6b7280' },
};

// HomeStand type accent colours (overlay on top of layer fill)
const TRACK_TYPE_FILL: Record<string, string> = {
  InboundHs:  '#34d399',  // green
  OutboundHs: '#fb923c',  // orange
};

const STATUS_FILL: Record<string, string> = {
  running:  '#4ade80',
  waiting:  '#facc15',
  error:    '#f87171',
  disabled: '#6b7280',
};

function getLayerColor(layerId: string) {
  return LAYER_COLORS[layerId] ?? LAYER_COLORS.default;
}

// ── ViewBox helpers ────────────────────────────────────────────────────────────
interface VB { x: number; y: number; w: number; h: number }
const FULL_VB: VB = { x: 0, y: 0, w: 2549, h: 1500 };
const MIN_W = 200;
const MAX_W = 4000;

function clampVB(vb: VB, cw: number, ch: number): VB {
  const w = Math.max(MIN_W, Math.min(MAX_W, vb.w));
  const h = w / (cw / ch);
  const x = Math.max(-200, Math.min(FULL_VB.w + 200 - w, vb.x));
  const y = Math.max(-200, Math.min(FULL_VB.h + 200 - h, vb.y));
  return { x, y, w, h };
}

// ── Track segment rect ─────────────────────────────────────────────────────────
function TrackRect({ track, selected, onClick }: {
  track: FPTrack;
  selected: boolean;
  onClick: (t: FPTrack, e: React.MouseEvent) => void;
}) {
  const statuses = useWarehouseStore((s) => s.trackSegmentStatuses);
  const statusKey = Object.keys(statuses).find(
    (k) => k.includes(track.unitId) || k.endsWith(`:${track.id}`)
  );
  const status = statusKey ? statuses[statusKey] : undefined;
  const { fill, stroke } = getLayerColor(track.layerId);

  // Priority: selected > status > trackType > layer fill
  const fillColor = selected
    ? '#fbbf24'
    : (status && STATUS_FILL[status])
    ? STATUS_FILL[status]
    : (track.trackType && TRACK_TYPE_FILL[track.trackType])
    ? TRACK_TYPE_FILL[track.trackType]
    : fill;

  const strokeColor = selected ? '#f59e0b' : stroke;

  const isBCR = track.trackType === 'BCRRead';
  const markerR = 7;
  const markerCx = track.x + markerR + 2;
  const markerCy = track.y + markerR + 2;

  return (
    <g cursor="pointer" onClick={(e) => onClick(track, e)}>
      <rect
        x={track.x} y={track.y} width={track.w} height={track.h}
        fill={fillColor} stroke={strokeColor}
        strokeWidth={selected ? 2 : 0.8} rx={2}
      />
      {isBCR && (
        <>
          <circle cx={markerCx} cy={markerCy} r={markerR} fill="#ea580c" opacity={0.95} pointerEvents="none" />
          <text x={markerCx} y={markerCy + markerR * 0.38} textAnchor="middle"
            fontSize={markerR * 1.3} fill="white" fontFamily="monospace" fontWeight="700" pointerEvents="none">
            B
          </text>
        </>
      )}
    </g>
  );
}

// ── Floor tab bar ─────────────────────────────────────────────────────────────
function FloorTabs({
  active, onChange,
}: { active: FloorId | 'all'; onChange: (f: FloorId | 'all') => void }) {
  const tabs: { id: FloorId | 'all'; label: string; color: string }[] = [
    { id: 'all', label: 'ALL', color: '#94a3b8' },
    ...FLOOR_DEFS.map((f) => ({ id: f.id as FloorId | 'all', label: f.shortName, color: f.color })),
  ];
  return (
    <div style={{
      position: 'absolute',
      top: 16,
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      gap: 4,
      zIndex: 8,                        // ← below ViewToggle (zIndex 5) but above SVG
      background: 'rgba(11,15,26,0.88)',
      borderRadius: 8,
      padding: '4px 6px',
      border: '1px solid #1e293b',
      backdropFilter: 'blur(8px)',
    }}>
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button key={tab.id} onClick={() => onChange(tab.id)} style={{
            padding: '4px 12px', borderRadius: 5,
            border: isActive ? `1px solid ${tab.color}66` : '1px solid transparent',
            background: isActive ? `${tab.color}22` : 'transparent',
            color: isActive ? tab.color : '#64748b',
            fontFamily: 'monospace', fontSize: 11,
            fontWeight: isActive ? 700 : 400,
            cursor: 'pointer', whiteSpace: 'nowrap',
          }}>
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

// ── Equipment image map ────────────────────────────────────────────────────────
const BOX_IMAGE_MAP: Record<string, string> = {
  GRD_1F: '/images/Grader.png',
  GRD_2F: '/images/Grader.png',
  HAG:    '/images/HT Aging.png',
  AG1:    '/images/Aging.png',
  AG2:    '/images/Aging.png',
  CDC1:   '/images/CDC.png',
  CDC2:   '/images/CDC.png',
  CDC3:   '/images/CDC.png',
  OCV1:   '/images/OCV.png',
  OCV2:   '/images/OCV.png',
  NGR1:   '/images/NG Selector.png',
  NGR2:   '/images/NG Selector.png',
  ASSY:   '/images/Lot.png',
};

// ── Main component ─────────────────────────────────────────────────────────────
interface FloorPlan2DProps {
  floorPlan: FloorPlanData;
  showTrackIds?: boolean;
}

export function FloorPlan2D({ floorPlan, showTrackIds = false }: FloorPlan2DProps) {
  const svgRef  = useRef<SVGSVGElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const [vb, setVB]              = useState<VB>(FULL_VB);
  const [isPanning, setIsPanning] = useState(false);
  const panStart                  = useRef<{ px: number; py: number; vb: VB } | null>(null);
  const [activeFloor, setActiveFloor] = useState<FloorId | 'all'>('all');
  const [imagePopup, setImagePopup]   = useState<string | null>(null);

  const selectedObject = useWarehouseStore((s) => s.selectedObject);
  const setSelected    = useWarehouseStore((s) => s.setSelectedObject);
  const focusRequest   = useWarehouseStore((s) => s.focusRequest);
  const trays          = useWarehouseStore((s) => s.trays);

  // ── Zoom ──────────────────────────────────────────────────────────────────────
  const onWheel = useCallback((e: WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const rect = svgRef.current!.getBoundingClientRect();
    const mx   = (e.clientX - rect.left) / rect.width;
    const my   = (e.clientY - rect.top)  / rect.height;
    setVB((prev) => {
      const factor = e.deltaY > 0 ? 1.12 : 0.89;
      const newW   = prev.w * factor;
      const newH   = newW / (rect.width / rect.height);
      return clampVB({ x: prev.x + mx * (prev.w - newW), y: prev.y + my * (prev.h - newH), w: newW, h: newH }, rect.width, rect.height);
    });
  }, []);

  // ── Pan ────────────────────────────────────────────────────────────────────────
  const onPointerDown = useCallback((e: PointerEvent<SVGSVGElement>) => {
    if (e.button !== 0) return;
    (e.target as Element).setPointerCapture(e.pointerId);
    setIsPanning(true);
    panStart.current = { px: e.clientX, py: e.clientY, vb };
  }, [vb]);

  const onPointerMove = useCallback((e: PointerEvent<SVGSVGElement>) => {
    if (!isPanning || !panStart.current) return;
    const rect = svgRef.current!.getBoundingClientRect();
    const dx   = ((e.clientX - panStart.current.px) / rect.width)  * panStart.current.vb.w;
    const dy   = ((e.clientY - panStart.current.py) / rect.height) * panStart.current.vb.h;
    const base = panStart.current.vb;
    setVB(clampVB({ x: base.x - dx, y: base.y - dy, w: base.w, h: base.h }, rect.width, rect.height));
  }, [isPanning]);

  const onPointerUp = useCallback(() => {
    setIsPanning(false);
    panStart.current = null;
  }, []);

  // ── Track click ───────────────────────────────────────────────────────────────
  const onTrackClick = useCallback((track: FPTrack, e: React.MouseEvent) => {
    setSelected(
      { type: 'fptrack', id: track.id, unitId: track.unitId, layerId: track.layerId },
      { x: e.clientX, y: e.clientY },
    );
  }, [setSelected]);

  // ── Equipment box click / double-click ────────────────────────────────────────
  const onBoxClick = useCallback((box: FPBox, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelected({ type: 'fpbox', id: box.id }, { x: e.clientX, y: e.clientY });
  }, [setSelected]);

  const onBoxDblClick = useCallback((box: FPBox, e: React.MouseEvent) => {
    e.stopPropagation();
    const img = BOX_IMAGE_MAP[box.text ?? ''];
    if (img) setImagePopup(img);
  }, [setImagePopup]);

  // ── Selected IDs ──────────────────────────────────────────────────────────────
  let selectedTrackId: string | null = null;
  if (selectedObject?.type === 'fptrack') selectedTrackId = selectedObject.id;
  if (selectedObject?.type === 'track') selectedTrackId = selectedObject.segmentId;

  const selectedBoxId = selectedObject?.type === 'fpbox' ? selectedObject.id : null;

  // ── Layer + floor filter ──────────────────────────────────────────────────────
  const visibleLayers = new Set(floorPlan.layers.filter((l) => l.visible).map((l) => l.id));
  const floorLayerIds: Set<string> = activeFloor === 'all'
    ? new Set(Object.keys(LAYER_FLOOR_MAP))
    : new Set(FLOOR_DEFS.find((f) => f.id === activeFloor)?.layerIds ?? []);

  const showTrack = (t: FPTrack) => visibleLayers.has(t.layerId) && floorLayerIds.has(t.layerId);
  const visibleTracks = floorPlan.tracks.filter(showTrack);
  const trackIdFontSize = visibleTracks.reduce((minSize, track) => {
    const label = track.unitId || track.id;
    const size = Math.max(9, Math.min(18, Math.min(track.w / Math.max(label.length, 1), track.h * 0.7)));
    return Math.min(minSize, size);
  }, 18);

  const viewBox = `${vb.x} ${vb.y} ${vb.w} ${vb.h}`;

  useEffect(() => {
    if (!focusRequest || focusRequest.selection.type !== 'fptrack') return;
    const selection = focusRequest.selection;
    const track = floorPlan.tracks.find((item) => item.id === selection.id);
    const rect = svgRef.current?.getBoundingClientRect();
    if (!track || !rect) return;
    const margin = 120;
    const next = {
      x: track.x + track.w / 2 - vb.w / 2,
      y: track.y + track.h / 2 - vb.h / 2,
      w: vb.w,
      h: vb.h,
    };
    const visible =
      track.x >= vb.x + margin &&
      track.x + track.w <= vb.x + vb.w - margin &&
      track.y >= vb.y + margin &&
      track.y + track.h <= vb.y + vb.h - margin;
    if (!visible) {
      setVB(clampVB(next, rect.width, rect.height));
    }
  }, [focusRequest, floorPlan.tracks, vb]);

  const canvasBg = floorPlan.backgroundColor ?? '#1a1f2e';

  return (
    <div ref={wrapRef} style={{ position: 'absolute', inset: 0, background: canvasBg, display: 'flex' }}>

      {/* Floor tabs — below ViewToggle */}
      <FloorTabs active={activeFloor} onChange={setActiveFloor} />

      <svg
        ref={svgRef}
        viewBox={viewBox}
        style={{ width: '100%', height: '100%', cursor: isPanning ? 'grabbing' : 'grab', userSelect: 'none' }}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        {/* Background */}
        <rect x={0} y={0} width={floorPlan.width} height={floorPlan.height} fill={floorPlan.backgroundColor} />

        {/* Logo watermark */}
        <image
          href="/logo.png"
          x={floorPlan.width / 2 - 200}
          y={floorPlan.height / 2 - 100}
          width={400}
          height={200}
          opacity={1}
          style={{ pointerEvents: 'none' }}
        />

        {/* Equipment boxes — clickable */}
        {floorPlan.boxes.map((box) => {
          const isSel = selectedBoxId === box.id;
          return (
            <g key={box.id} onClick={(e) => onBoxClick(box, e)} onDoubleClick={(e) => onBoxDblClick(box, e)} style={{ cursor: 'pointer' }}>
              <rect
                x={box.x} y={box.y} width={box.w} height={box.h}
                fill={box.bgColor} fillOpacity={box.bgAlpha}
                stroke={isSel ? '#fbbf24' : box.borderColor}
                strokeWidth={isSel ? 2.5 : box.borderWidth}
                rx={3}
              />
              {box.text && (
                <text
                  x={box.x + box.w / 2} y={box.y + box.h / 2 + box.fontSize * 0.35}
                  textAnchor="middle" fill={box.textColor}
                  fontSize={box.fontSize} fontFamily="Tahoma, Arial, sans-serif"
                  pointerEvents="none"
                >
                  {box.text}
                </text>
              )}
            </g>
          );
        })}

        {/* Crane zones */}
        {floorPlan.cranes.map((crane) => {
          const hasImage = crane.id in BOX_IMAGE_MAP;
          return (
            <g key={crane.id}
              cursor="pointer"
              onClick={(e) => setSelected({ type: 'fpbox', id: crane.id }, { x: e.clientX, y: e.clientY })}
              onDoubleClick={hasImage ? () => setImagePopup(BOX_IMAGE_MAP[crane.id]) : undefined}
            >
              <rect
                x={crane.x} y={crane.bank2Y} width={crane.totalW} height={crane.totalH}
                fill="rgba(37,99,235,0.10)" stroke="#3b82f6" strokeWidth={1.5} strokeDasharray="6 3" rx={3}
              />
              <text
                x={crane.x + crane.totalW / 2} y={crane.bank2Y + 16}
                textAnchor="middle" fill="#3b82f6"
                fontSize={13} fontFamily="monospace" fontWeight="bold"
                pointerEvents="none"
              >
                {crane.id}
              </text>
            </g>
          );
        })}

        {/* Track segments */}
        {visibleTracks.map((track) => (
          <TrackRect key={track.id} track={track} selected={selectedTrackId === track.id} onClick={onTrackClick} />
        ))}

        {showTrackIds && visibleTracks.map((track) => {
          const label = track.unitId || track.id;
          const labelW = Math.min(track.w - 4, label.length * trackIdFontSize * 0.68 + 8);
          const labelH = trackIdFontSize + 6;
          const cx = track.x + track.w / 2;
          const cy = track.y + track.h / 2;
          return (
            <g key={`id-${track.id}`} pointerEvents="none">
              <rect
                x={cx - labelW / 2}
                y={cy - labelH / 2}
                width={labelW}
                height={labelH}
                fill="rgba(255, 255, 255, 0.33)"
                stroke="rgba(15,23,42,0.12)"
                strokeWidth={0.5}
                rx={3}
              />
              <text
                x={cx}
                y={cy + trackIdFontSize * 0.35}
                textAnchor="middle"
                fill="#0f172a"
                fontSize={trackIdFontSize}
                fontFamily="monospace"
                fontWeight={700}
              >
                {label}
              </text>
            </g>
          );
        })}

        {trays.map((tray) => {
          const point = computeTrayWorldPos(tray.location, DEFAULT_LAYOUT);
          const [x, y] = worldPointToFloorPlan([point.x, point.y, point.z]);
          return (
            <circle
              key={tray.id}
              cx={x}
              cy={y}
              r={8}
              fill="#81c784"
              stroke="#14532d"
              strokeWidth={2}
            />
          );
        })}

        {/* Labels */}
        {floorPlan.labels.map((lbl) => {
          if (lbl.layerId && (!visibleLayers.has(lbl.layerId) || !floorLayerIds.has(lbl.layerId))) return null;
          return (
            <text
              key={lbl.id} x={lbl.x} y={lbl.y + lbl.fontSize}
              fill={lbl.color} fontSize={lbl.fontSize}
              fontFamily={lbl.fontFamily || 'Tahoma, Arial, sans-serif'}
              fontWeight={lbl.bold ? 'bold' : 'normal'}
              fontStyle={lbl.italic ? 'italic' : 'normal'}
              pointerEvents="none"
            >
              {lbl.text}
            </text>
          );
        })}

      </svg>

      {/* Equipment image popup */}
      {imagePopup && (
        <div
          style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.78)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 30, cursor: 'pointer' }}
          onClick={() => setImagePopup(null)}
        >
          <div
            style={{ position: 'relative', maxWidth: '82vw', maxHeight: '82vh', background: '#0f1726', borderRadius: 12, overflow: 'hidden', boxShadow: '0 8px 40px rgba(0,0,0,0.85)', border: '1px solid rgba(255,255,255,0.15)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setImagePopup(null)}
              style={{ position: 'absolute', top: 8, right: 8, zIndex: 1, background: 'rgba(0,0,0,0.65)', color: '#e2e8f0', border: 'none', borderRadius: '50%', width: 28, height: 28, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}
            >×</button>
            <img src={imagePopup} alt="Equipment" style={{ display: 'block', maxWidth: '82vw', maxHeight: '82vh', objectFit: 'contain' }} />
          </div>
        </div>
      )}

      {/* Reset View — bottom center */}
      <button
        onClick={() => setVB(FULL_VB)}
        style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', padding: '4px 14px', background: '#2d3748', color: '#90cdf4', border: 'none', borderRadius: 5, fontFamily: 'monospace', fontSize: 11, cursor: 'pointer', zIndex: 10 }}
      >
        ↺ Reset View
      </button>

      {/* Hints — bottom right */}
      <div style={{ position: 'absolute', bottom: 16, right: 16, color: '#374151', fontFamily: 'monospace', fontSize: 11, pointerEvents: 'none' }}>
        Scroll: zoom · Drag: pan · Click: select
      </div>
    </div>
  );
}
