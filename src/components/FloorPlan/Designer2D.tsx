/**
 * Designer2D.tsx — full-screen 2D floor plan editor.
 *
 * Replaces the entire UI (including the 3D Scene) when designerMode is active.
 * Provides:
 *  - Full-screen SVG canvas rendering the floorPlan data
 *  - Click to select a track segment → properties shown in right panel
 *  - Drag selected track to reposition it (updates LayoutConfig.floorPlan)
 *  - Zoom/pan via mouse wheel + middle-button drag
 *  - Save JSON / Export buttons
 *  - Right-side properties panel for editing x, y, w, h of selected track
 *
 * The parent (App.tsx) renders this component instead of Scene when
 * designerMode === true, and passes onApply to push changes back to layout state.
 */
import {
  useRef, useState, useCallback, useEffect,
  type WheelEvent, type PointerEvent, type ChangeEvent,
} from 'react';
import type { LayoutConfig, FloorPlanData, FPTrack, FPTrackType } from '../../config/types';
import { getFloorForLayer } from '../../config/layerConfig';
import { useWarehouseStore } from '../../store/useWarehouseStore';

// ── Layer color map (same as FloorPlan2D) ─────────────────────────────────────
const LAYER_COLORS: Record<string, { fill: string; stroke: string }> = {
  layer_mncrxsud: { fill: '#93c5fd', stroke: '#2563eb' },
  layer_mncs2tlq: { fill: '#67e8f9', stroke: '#0891b2' },
  layer_mncs2zk3: { fill: '#6ee7b7', stroke: '#059669' },
  layer_mncs35c8: { fill: '#c4b5fd', stroke: '#7c3aed' },
  layer_mncs3a33: { fill: '#fcd34d', stroke: '#b45309' },
  layer_mncs3e54: { fill: '#fca5a5', stroke: '#dc2626' },
  layer_mncs3hsr: { fill: '#f9a8d4', stroke: '#be185d' },
  default:        { fill: '#d1d5db', stroke: '#6b7280' },
};

function layerColor(layerId: string) {
  return LAYER_COLORS[layerId] ?? LAYER_COLORS.default;
}

// ── ViewBox helpers ────────────────────────────────────────────────────────────
interface VB { x: number; y: number; w: number; h: number }
const FULL_VB: VB = { x: 0, y: 0, w: 2549, h: 1500 };

function clampVB(vb: VB, cw: number, ch: number): VB {
  const w = Math.max(150, Math.min(5000, vb.w));
  const h = w / (cw / ch);
  const x = Math.max(-300, Math.min(FULL_VB.w + 300 - w, vb.x));
  const y = Math.max(-300, Math.min(FULL_VB.h + 300 - h, vb.y));
  return { x, y, w, h };
}

/** Convert a clientX/Y into SVG coordinate space */
function clientToSVG(
  clientX: number, clientY: number,
  svgRect: DOMRect, vb: VB
): { x: number; y: number } {
  const px = (clientX - svgRect.left) / svgRect.width;
  const py = (clientY - svgRect.top)  / svgRect.height;
  return { x: vb.x + px * vb.w, y: vb.y + py * vb.h };
}

// ── NumField — small inline numeric input for the properties panel ─────────────
function NumField({
  label, value, onChange,
}: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
      <span style={{ width: 18, color: '#90cdf4', fontFamily: 'monospace', fontSize: 11 }}>
        {label}
      </span>
      <input
        type="number"
        value={value}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(Number(e.target.value))}
        style={{
          width: 70, padding: '2px 6px',
          background: '#1a2035', color: '#e2e8f0',
          border: '1px solid #2d3748', borderRadius: 4,
          fontFamily: 'monospace', fontSize: 12,
        }}
      />
    </label>
  );
}

// ── SelectField — small inline select for the properties panel ─────────────────
function SelectField<T extends string>({
  label, value, options, onChange,
}: {
  label: string;
  value: T | undefined;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <label style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
      <span style={{ width: 28, color: '#90cdf4', fontFamily: 'monospace', fontSize: 11 }}>
        {label}
      </span>
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value as T)}
        style={{
          flex: 1, padding: '2px 4px',
          background: '#1a2035', color: '#e2e8f0',
          border: '1px solid #2d3748', borderRadius: 4,
          fontFamily: 'monospace', fontSize: 11,
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
interface Designer2DProps {
  layout: LayoutConfig;
  onApply: (next: LayoutConfig) => void;
}

export function Designer2D({ layout, onApply }: Designer2DProps) {
  const setDesigner = useWarehouseStore((s) => s.setDesignerMode);

  // Work on a local mutable copy of floorPlan so we can track dirty state
  const [fp, setFP] = useState<FloorPlanData>(() =>
    layout.floorPlan
      ? JSON.parse(JSON.stringify(layout.floorPlan))
      : { width: 2549, height: 1500, backgroundColor: '#DEDEE2', tracks: [], cranes: [], conveyorLines: [], labels: [], boxes: [], legend: { x: 70, y: 50, items: [], title: '', bgColor: '#F0F0F4', fontSize: 11 }, layers: [] }
  );
  const [dirty, setDirty] = useState(false);

  // Selected track ID
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedTrack = fp.tracks.find((t) => t.id === selectedId) ?? null;

  // ViewBox state
  const [vb, setVB]              = useState<VB>(FULL_VB);
  const [isPanning, setIsPanning] = useState(false);
  const panStart                  = useRef<{ px: number; py: number; vb: VB } | null>(null);

  // Drag state
  const svgRef     = useRef<SVGSVGElement>(null);
  const dragStart  = useRef<{
    trackId: string; origX: number; origY: number;
    svgStartX: number; svgStartY: number;
  } | null>(null);

  // Keep fp in sync if layout.floorPlan is externally replaced (e.g., Load JSON)
  useEffect(() => {
    if (!layout.floorPlan) return;
    setFP(JSON.parse(JSON.stringify(layout.floorPlan)));
    setDirty(false);
  }, [layout.floorPlan]);

  // ── Track update helper ────────────────────────────────────────────────────
  const updateTrack = useCallback((id: string, patch: Partial<FPTrack>) => {
    setFP((prev) => ({
      ...prev,
      tracks: prev.tracks.map((t) => t.id === id ? { ...t, ...patch } : t),
    }));
    setDirty(true);
  }, []);

  // ── Apply changes back to layout ───────────────────────────────────────────
  const handleApply = useCallback(() => {
    onApply({ ...layout, floorPlan: fp });
    setDirty(false);
  }, [layout, fp, onApply]);

  // ── Export JSON (download) ─────────────────────────────────────────────────
  const handleExport = useCallback(() => {
    const blob = new Blob([JSON.stringify(fp, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'floorPlan.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [fp]);

  // ── Zoom ───────────────────────────────────────────────────────────────────
  const onWheel = useCallback((e: WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const rect = svgRef.current!.getBoundingClientRect();
    const mx   = (e.clientX - rect.left) / rect.width;
    const my   = (e.clientY - rect.top)  / rect.height;
    setVB((prev) => {
      const factor = e.deltaY > 0 ? 1.12 : 0.89;
      const newW   = prev.w * factor;
      const aspect = rect.width / rect.height;
      const newH   = newW / aspect;
      return clampVB({
        x: prev.x + mx * (prev.w - newW),
        y: prev.y + my * (prev.h - newH),
        w: newW, h: newH,
      }, rect.width, rect.height);
    });
  }, []);

  // ── Pointer events (pan + drag) ────────────────────────────────────────────
  const onPointerDown = useCallback((e: PointerEvent<SVGSVGElement>) => {
    (e.currentTarget as SVGSVGElement).setPointerCapture(e.pointerId);
    const rect   = svgRef.current!.getBoundingClientRect();
    const svgPos = clientToSVG(e.clientX, e.clientY, rect, vb);

    // Check if we hit a track
    const hit = fp.tracks.find((t) =>
      svgPos.x >= t.x && svgPos.x <= t.x + t.w &&
      svgPos.y >= t.y && svgPos.y <= t.y + t.h
    );

    if (hit) {
      setSelectedId(hit.id);
      dragStart.current = {
        trackId: hit.id,
        origX: hit.x, origY: hit.y,
        svgStartX: svgPos.x, svgStartY: svgPos.y,
      };
    } else {
      // Pan when clicking empty space
      setIsPanning(true);
      panStart.current = { px: e.clientX, py: e.clientY, vb };
    }
  }, [fp.tracks, vb]);

  const onPointerMove = useCallback((e: PointerEvent<SVGSVGElement>) => {
    const rect = svgRef.current!.getBoundingClientRect();

    if (dragStart.current) {
      const svgPos = clientToSVG(e.clientX, e.clientY, rect, vb);
      const dx = svgPos.x - dragStart.current.svgStartX;
      const dy = svgPos.y - dragStart.current.svgStartY;
      updateTrack(dragStart.current.trackId, {
        x: Math.round(dragStart.current.origX + dx),
        y: Math.round(dragStart.current.origY + dy),
      });
      return;
    }

    if (isPanning && panStart.current) {
      const dx = ((e.clientX - panStart.current.px) / rect.width)  * panStart.current.vb.w;
      const dy = ((e.clientY - panStart.current.py) / rect.height) * panStart.current.vb.h;
      const base = panStart.current.vb;
      setVB(clampVB({ x: base.x - dx, y: base.y - dy, w: base.w, h: base.h }, rect.width, rect.height));
    }
  }, [vb, isPanning, updateTrack]);

  const onPointerUp = useCallback(() => {
    dragStart.current = null;
    setIsPanning(false);
    panStart.current = null;
  }, []);

  const PANEL_W = 260;
  const viewBox  = `${vb.x} ${vb.y} ${vb.w} ${vb.h}`;

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', background: '#0f1420' }}>

      {/* ── SVG canvas ────────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <svg
          ref={svgRef}
          viewBox={viewBox}
          style={{
            width: '100%', height: '100%',
            cursor: isPanning ? 'grabbing' : (dragStart.current ? 'move' : 'default'),
            userSelect: 'none',
          }}
          onWheel={onWheel}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        >
          {/* Background */}
          <rect x={0} y={0} width={fp.width} height={fp.height} fill={fp.backgroundColor} />

          {/* Canvas border */}
          <rect x={0} y={0} width={fp.width} height={fp.height}
            fill="none" stroke="#94a3b8" strokeWidth={1} />

          {/* Equipment boxes */}
          {fp.boxes.map((box) => (
            <g key={box.id}>
              <rect
                x={box.x} y={box.y} width={box.w} height={box.h}
                fill={box.bgColor} fillOpacity={box.bgAlpha}
                stroke={box.borderColor} strokeWidth={box.borderWidth} rx={3}
              />
              {box.text && (
                <text
                  x={box.x + box.w / 2} y={box.y + box.h / 2 + box.fontSize * 0.35}
                  textAnchor="middle" fill={box.textColor}
                  fontSize={box.fontSize} fontFamily="Tahoma, Arial, sans-serif"
                >
                  {box.text}
                </text>
              )}
            </g>
          ))}

          {/* Crane zones */}
          {fp.cranes.map((crane) => (
            <g key={crane.id}>
              <rect
                x={crane.x} y={crane.bank2Y} width={crane.totalW} height={crane.totalH}
                fill="rgba(37,99,235,0.08)" stroke="#3b82f6"
                strokeWidth={1.5} strokeDasharray="6 3" rx={3}
              />
              <text
                x={crane.x + crane.totalW / 2} y={crane.bank2Y + 16}
                textAnchor="middle" fill="#3b82f6"
                fontSize={13} fontFamily="monospace" fontWeight="bold"
              >
                {crane.id}
              </text>
            </g>
          ))}

          {/* Track segments */}
          {fp.tracks.map((track) => {
            const { fill, stroke } = layerColor(track.layerId);
            const isSel = track.id === selectedId;
            return (
              <rect
                key={track.id}
                x={track.x} y={track.y} width={track.w} height={track.h}
                fill={isSel ? '#fbbf24' : fill}
                stroke={isSel ? '#f59e0b' : stroke}
                strokeWidth={isSel ? 2 : 0.8}
                rx={2}
                cursor="move"
              />
            );
          })}

          {/* Labels */}
          {fp.labels.map((lbl) => (
            <text
              key={lbl.id}
              x={lbl.x} y={lbl.y + lbl.fontSize}
              fill={lbl.color} fontSize={lbl.fontSize}
              fontFamily={lbl.fontFamily || 'Tahoma, Arial, sans-serif'}
              fontWeight={lbl.bold ? 'bold' : 'normal'}
              fontStyle={lbl.italic ? 'italic' : 'normal'}
              pointerEvents="none"
            >
              {lbl.text}
            </text>
          ))}

          {/* Selection handles */}
          {selectedTrack && (
            <rect
              x={selectedTrack.x - 2} y={selectedTrack.y - 2}
              width={selectedTrack.w + 4} height={selectedTrack.h + 4}
              fill="none" stroke="#f59e0b" strokeWidth={1.5}
              strokeDasharray="4 2" rx={3} pointerEvents="none"
            />
          )}
        </svg>

        {/* Zoom hint */}
        <div style={{
          position: 'absolute', bottom: 16, left: 16,
          color: '#4a5568', fontFamily: 'monospace', fontSize: 11, pointerEvents: 'none',
        }}>
          Scroll: zoom · Drag canvas: pan · Drag track: move
        </div>

        {/* Reset view */}
        <button
          onClick={() => setVB(FULL_VB)}
          style={{
            position: 'absolute', bottom: 16, left: '50%',
            transform: 'translateX(-50%)',
            padding: '4px 14px', background: '#2d3748', color: '#a0aec0',
            border: 'none', borderRadius: 5, fontFamily: 'monospace',
            fontSize: 11, cursor: 'pointer',
          }}
        >
          Fit All
        </button>
      </div>

      {/* ── Right properties panel ─────────────────────────────────────────────── */}
      <div style={{
        width: PANEL_W, flexShrink: 0,
        background: '#0d1117', borderLeft: '1px solid #1e293b',
        display: 'flex', flexDirection: 'column',
        fontFamily: 'monospace', color: '#e2e8f0',
        overflow: 'hidden',
      }}>

        {/* Header */}
        <div style={{
          padding: '10px 14px', borderBottom: '1px solid #1e293b',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontWeight: 700, fontSize: 13, color: '#f6ad55', letterSpacing: 1 }}>
            ✎ DESIGNER
          </span>
          <button
            onClick={() => setDesigner(false)}
            title="Exit designer mode"
            style={{
              background: 'none', border: 'none',
              color: '#718096', cursor: 'pointer', fontSize: 16,
            }}
          >
            ✕
          </button>
        </div>

        {/* Stats */}
        <div style={{ padding: '8px 14px', borderBottom: '1px solid #1e293b', fontSize: 11, color: '#718096' }}>
          {fp.tracks.length} tracks · {fp.cranes.length} cranes · {fp.boxes.length} zones
        </div>

        {/* Properties */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>
          {selectedTrack ? (
            <>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#90cdf4', marginBottom: 10 }}>
                {selectedTrack.id}
              </div>
              <div style={{ fontSize: 10, color: '#718096', marginBottom: 8 }}>
                Layer: {selectedTrack.layerId}
              </div>

              <NumField label="X" value={selectedTrack.x}
                onChange={(v) => updateTrack(selectedTrack.id, { x: v })} />
              <NumField label="Y" value={selectedTrack.y}
                onChange={(v) => updateTrack(selectedTrack.id, { y: v })} />
              <NumField label="W" value={selectedTrack.w}
                onChange={(v) => updateTrack(selectedTrack.id, { w: v })} />
              <NumField label="H" value={selectedTrack.h}
                onChange={(v) => updateTrack(selectedTrack.id, { h: v })} />

              <SelectField<'x' | 'y'>
                label="Dir"
                value={selectedTrack.direction}
                options={[
                  { value: 'x', label: 'X  left-right' },
                  { value: 'y', label: 'Y  front-back' },
                ]}
                onChange={(v) => updateTrack(selectedTrack.id, { direction: v })}
              />

              <SelectField<FPTrackType>
                label="Type"
                value={selectedTrack.trackType ?? 'Default'}
                options={[
                  { value: 'Default',    label: 'Default (conveyor)' },
                  { value: 'Lift',       label: 'Lift (vertical)'    },
                  { value: 'Palletizer', label: 'Palletizer'         },
                ]}
                onChange={(v) => updateTrack(selectedTrack.id, { trackType: v })}
              />

              {/* Floor info (read-only, derived from layer) */}
              <div style={{ fontSize: 10, color: '#718096', marginBottom: 4 }}>
                Floor: {getFloorForLayer(selectedTrack.layerId)?.shortName ?? '—'}
                {' '}(Z = {getFloorForLayer(selectedTrack.layerId)?.worldZ ?? 0} m)
              </div>

              <div style={{ marginTop: 8, display: 'flex', gap: 6, alignItems: 'center' }}>
                <div style={{
                  width: 14, height: 14, borderRadius: 3,
                  background: layerColor(selectedTrack.layerId).fill,
                  border: `1px solid ${layerColor(selectedTrack.layerId).stroke}`,
                  flexShrink: 0,
                }} />
                <span style={{ fontSize: 10, color: '#718096' }}>
                  {selectedTrack.colorSet}
                </span>
              </div>
            </>
          ) : (
            <div style={{ color: '#4a5568', fontSize: 11, marginTop: 8 }}>
              Click a track segment to select it
            </div>
          )}
        </div>

        {/* Layer legend */}
        <div style={{ padding: '10px 14px', borderTop: '1px solid #1e293b' }}>
          <div style={{ fontSize: 10, color: '#718096', marginBottom: 6 }}>LAYERS</div>
          {fp.layers
            .filter((l) => l.id !== 'default')
            .sort((a, b) => a.order - b.order)
            .map((layer) => {
              const c = layerColor(layer.id);
              return (
                <div key={layer.id}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <div style={{
                    width: 10, height: 10, borderRadius: 2,
                    background: c.fill, border: `1px solid ${c.stroke}`, flexShrink: 0,
                  }} />
                  <span style={{ fontSize: 10, color: '#a0aec0' }}>{layer.name}</span>
                </div>
              );
            })}
        </div>

        {/* Action buttons */}
        <div style={{ padding: '10px 14px', borderTop: '1px solid #1e293b', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <button
            onClick={handleApply}
            disabled={!dirty}
            style={{
              padding: '7px 0', borderRadius: 5, border: 'none',
              cursor: dirty ? 'pointer' : 'not-allowed',
              background: dirty ? '#2f855a' : '#1a2a22',
              color: dirty ? '#9ae6b4' : '#4a7a5a',
              fontFamily: 'monospace', fontSize: 12, fontWeight: 700,
            }}
          >
            {dirty ? '✓ Apply Changes' : 'No Changes'}
          </button>

          <button
            onClick={handleExport}
            style={{
              padding: '7px 0', borderRadius: 5, border: '1px solid #2d3748',
              cursor: 'pointer', background: 'transparent',
              color: '#90cdf4',
              fontFamily: 'monospace', fontSize: 12,
            }}
          >
            ↓ Export JSON
          </button>
        </div>
      </div>
    </div>
  );
}
