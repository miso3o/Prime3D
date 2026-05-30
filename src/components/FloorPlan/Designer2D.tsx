import {
  useRef,
  useState,
  useCallback,
  useEffect,
  type WheelEvent,
  type PointerEvent,
  type ChangeEvent,
} from 'react';
import type {
  LayoutConfig,
  FloorPlanData,
  FPBox,
  FPCrane,
  FPLabel,
  FPTrack,
  FPTrackType,
} from '../../config/types';
import { getFloorForLayer } from '../../config/layerConfig';
import { useWarehouseStore } from '../../store/useWarehouseStore';

const LAYER_COLORS: Record<string, { fill: string; stroke: string }> = {
  layer_group1: { fill: '#93c5fd', stroke: '#2563eb' },
  layer_group2: { fill: '#67e8f9', stroke: '#0891b2' },
  layer_group3: { fill: '#6ee7b7', stroke: '#059669' },
  layer_group4: { fill: '#c4b5fd', stroke: '#7c3aed' },
  layer_group5_1: { fill: '#fcd34d', stroke: '#b45309' },
  layer_group5_2: { fill: '#fcd34d', stroke: '#b45309' },
  layer_group6: { fill: '#fca5a5', stroke: '#dc2626' },
  layer_group7: { fill: '#f9a8d4', stroke: '#be185d' },
  default: { fill: '#d1d5db', stroke: '#6b7280' },
};

function layerColor(layerId: string) {
  return LAYER_COLORS[layerId] ?? LAYER_COLORS.default;
}

interface VB { x: number; y: number; w: number; h: number }
interface Bounds { x: number; y: number; w: number; h: number }
type EditableKind = 'track' | 'box' | 'crane' | 'label';
type EditableSelection = { kind: EditableKind; id: string };
type GeometryPatch = Partial<Bounds>;
type EditableItem = { selection: EditableSelection; bounds: Bounds };
type FPDirection = 'left' | 'right' | 'up' | 'down';
type DesignerTool = 'select' | 'pan';
const DIR_OPTIONS: { value: FPDirection; label: string }[] = [
  { value: 'up', label: '↑' },
  { value: 'left', label: '←' },
  { value: 'right', label: '→' },
  { value: 'down', label: '↓' },
];

const FULL_VB: VB = { x: 0, y: 0, w: 2549, h: 1500 };
const SNAP_DISTANCE = 8;

function clampVB(vb: VB, cw: number, ch: number): VB {
  const w = Math.max(150, Math.min(5000, vb.w));
  const h = w / (cw / ch);
  const x = Math.max(-300, Math.min(FULL_VB.w + 300 - w, vb.x));
  const y = Math.max(-300, Math.min(FULL_VB.h + 300 - h, vb.y));
  return { x, y, w, h };
}

function clientToSVG(clientX: number, clientY: number, svgRect: DOMRect, vb: VB) {
  const px = (clientX - svgRect.left) / svgRect.width;
  const py = (clientY - svgRect.top) / svgRect.height;
  return { x: vb.x + px * vb.w, y: vb.y + py * vb.h };
}

function contains(bounds: Bounds, x: number, y: number) {
  return x >= bounds.x && x <= bounds.x + bounds.w && y >= bounds.y && y <= bounds.y + bounds.h;
}

function intersects(a: Bounds, b: Bounds) {
  return a.x <= b.x + b.w && a.x + a.w >= b.x && a.y <= b.y + b.h && a.y + a.h >= b.y;
}

function selectionKey(selection: EditableSelection) {
  return `${selection.kind}:${selection.id}`;
}

function sameSelection(a: EditableSelection, b: EditableSelection) {
  return a.kind === b.kind && a.id === b.id;
}

function getUnionBounds(items: EditableItem[]): Bounds | null {
  if (items.length === 0) return null;
  const minX = Math.min(...items.map((item) => item.bounds.x));
  const minY = Math.min(...items.map((item) => item.bounds.y));
  const maxX = Math.max(...items.map((item) => item.bounds.x + item.bounds.w));
  const maxY = Math.max(...items.map((item) => item.bounds.y + item.bounds.h));
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

function axes(bounds: Bounds) {
  return {
    x: [bounds.x, bounds.x + bounds.w / 2, bounds.x + bounds.w],
    y: [bounds.y, bounds.y + bounds.h / 2, bounds.y + bounds.h],
  };
}

function snapDelta(movingBounds: Bounds, otherItems: EditableItem[], dx: number, dy: number) {
  const moved = { ...movingBounds, x: movingBounds.x + dx, y: movingBounds.y + dy };
  const movingAxes = axes(moved);
  let snapX = 0;
  let snapY = 0;
  let bestX = SNAP_DISTANCE + 1;
  let bestY = SNAP_DISTANCE + 1;

  for (const item of otherItems) {
    const otherAxes = axes(item.bounds);
    for (const mx of movingAxes.x) {
      for (const ox of otherAxes.x) {
        const diff = ox - mx;
        const dist = Math.abs(diff);
        if (dist <= SNAP_DISTANCE && dist < bestX) {
          bestX = dist;
          snapX = diff;
        }
      }
    }
    for (const my of movingAxes.y) {
      for (const oy of otherAxes.y) {
        const diff = oy - my;
        const dist = Math.abs(diff);
        if (dist <= SNAP_DISTANCE && dist < bestY) {
          bestY = dist;
          snapY = diff;
        }
      }
    }
  }

  return { dx: dx + snapX, dy: dy + snapY };
}

function fallbackDirection(track: FPTrack): FPDirection {
  return track.fpDirection ?? (track.direction === 'y' ? 'down' : 'right');
}

function getTrackDirections(track: FPTrack): FPDirection[] {
  return track.fpDirections?.length ? track.fpDirections : [fallbackDirection(track)];
}

function NumField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
      <span style={{ width: 22, color: '#90cdf4', fontFamily: 'monospace', fontSize: 11 }}>
        {label}
      </span>
      <input
        type="number"
        value={value}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(Number(e.target.value))}
        style={{
          width: 76,
          padding: '2px 6px',
          background: '#1a2035',
          color: '#e2e8f0',
          border: '1px solid #2d3748',
          borderRadius: 4,
          fontFamily: 'monospace',
          fontSize: 12,
        }}
      />
    </label>
  );
}

function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
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
          flex: 1,
          padding: '2px 4px',
          background: '#1a2035',
          color: '#e2e8f0',
          border: '1px solid #2d3748',
          borderRadius: 4,
          fontFamily: 'monospace',
          fontSize: 11,
        }}
      >
        {value === undefined && <option value="">Mixed</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}

function dirButtonStyle(active: boolean, mixed: boolean): React.CSSProperties {
  return {
    width: 28,
    height: 28,
    borderRadius: 4,
    border: active ? '1px solid #90cdf4' : mixed ? '1px dashed #f6ad55' : '1px solid #2d3748',
    background: active ? '#1e3a5f' : mixed ? 'rgba(246,173,85,0.18)' : '#111827',
    color: active ? '#bee3f8' : mixed ? '#fbd38d' : '#718096',
    cursor: 'pointer',
    fontFamily: 'monospace',
    fontSize: 15,
    fontWeight: 700,
  };
}

interface Designer2DProps {
  layout: LayoutConfig;
  onApply: (next: LayoutConfig) => void;
}

const emptyFloorPlan: FloorPlanData = {
  width: 2549,
  height: 1500,
  backgroundColor: '#DEDEE2',
  tracks: [],
  cranes: [],
  labels: [],
  boxes: [],
  legend: { x: 70, y: 50, items: [], title: '', bgColor: '#F0F0F4', fontSize: 11 },
  layers: [],
};

export function Designer2D({ layout, onApply }: Designer2DProps) {
  const setDesigner = useWarehouseStore((s) => s.setDesignerMode);
  const [fp, setFP] = useState<FloorPlanData>(() =>
    layout.floorPlan ? JSON.parse(JSON.stringify(layout.floorPlan)) : emptyFloorPlan
  );
  const [dirty, setDirty] = useState(false);
  const [selected, setSelected] = useState<EditableSelection[]>([]);
  const [tool, setTool] = useState<DesignerTool>('select');
  const [selectionBox, setSelectionBox] = useState<Bounds | null>(null);

  const [vb, setVB] = useState<VB>(FULL_VB);
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef<{ px: number; py: number; vb: VB } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const dragStart = useRef<{
    items: EditableItem[];
    otherItems: EditableItem[];
    groupBounds: Bounds;
    svgStartX: number;
    svgStartY: number;
  } | null>(null);
  const selectStart = useRef<{ x: number; y: number; additive: boolean } | null>(null);

  useEffect(() => {
    if (!layout.floorPlan) return;
    setFP(JSON.parse(JSON.stringify(layout.floorPlan)));
    setDirty(false);
  }, [layout.floorPlan]);

  const allItems: EditableItem[] = [
    ...fp.boxes.map((box): EditableItem => ({
      selection: { kind: 'box', id: box.id },
      bounds: { x: box.x, y: box.y, w: box.w, h: box.h },
    })),
    ...fp.cranes.map((crane): EditableItem => ({
      selection: { kind: 'crane', id: crane.id },
      bounds: { x: crane.x, y: crane.bank2Y, w: crane.totalW, h: crane.totalH },
    })),
    ...fp.tracks.map((track): EditableItem => ({
      selection: { kind: 'track', id: track.id },
      bounds: { x: track.x, y: track.y, w: track.w, h: track.h },
    })),
    ...fp.labels.map((label): EditableItem => ({
      selection: { kind: 'label', id: label.id },
      bounds: { x: label.x, y: label.y, w: label.w, h: label.h },
    })),
  ];
  const selectedItems = selected
    .map((selection) => allItems.find((item) => sameSelection(item.selection, selection)))
    .filter((item): item is EditableItem => Boolean(item));
  const primarySelection = selected.length === 1 ? selected[0] : null;
  const selectedTrack = primarySelection?.kind === 'track'
    ? fp.tracks.find((t) => t.id === primarySelection.id) ?? null
    : null;
  const selectedTracks = selected
    .filter((item) => item.kind === 'track')
    .map((item) => fp.tracks.find((track) => track.id === item.id))
    .filter((track): track is FPTrack => Boolean(track));
  const selectedDirectionSets = selectedTracks.map((track) => new Set(getTrackDirections(track)));
  const isDirChecked = useCallback((direction: FPDirection) => (
    selectedDirectionSets.length > 0 && selectedDirectionSets.every((dirs) => dirs.has(direction))
  ), [selectedDirectionSets]);
  const isDirMixed = useCallback((direction: FPDirection) => (
    selectedDirectionSets.some((dirs) => dirs.has(direction)) && !isDirChecked(direction)
  ), [isDirChecked, selectedDirectionSets]);
  const selectedBox = primarySelection?.kind === 'box'
    ? fp.boxes.find((b) => b.id === primarySelection.id) ?? null
    : null;
  const selectedLabel = primarySelection?.kind === 'label'
    ? fp.labels.find((l) => l.id === primarySelection.id) ?? null
    : null;
  const selectedBounds = getUnionBounds(selectedItems);

  const updateTrack = useCallback((id: string, patch: Partial<FPTrack>) => {
    setFP((prev) => ({ ...prev, tracks: prev.tracks.map((t) => t.id === id ? { ...t, ...patch } : t) }));
    setDirty(true);
  }, []);

  const updateBox = useCallback((id: string, patch: Partial<FPBox>) => {
    setFP((prev) => ({ ...prev, boxes: prev.boxes.map((b) => b.id === id ? { ...b, ...patch } : b) }));
    setDirty(true);
  }, []);

  const updateCrane = useCallback((id: string, patch: Partial<FPCrane>) => {
    setFP((prev) => ({ ...prev, cranes: prev.cranes.map((c) => c.id === id ? { ...c, ...patch } : c) }));
    setDirty(true);
  }, []);

  const updateLabel = useCallback((id: string, patch: Partial<FPLabel>) => {
    setFP((prev) => ({ ...prev, labels: prev.labels.map((l) => l.id === id ? { ...l, ...patch } : l) }));
    setDirty(true);
  }, []);

  const updateGeometry = useCallback((target: EditableSelection, patch: GeometryPatch) => {
    if (target.kind === 'track') updateTrack(target.id, patch);
    if (target.kind === 'box') updateBox(target.id, patch);
    if (target.kind === 'label') updateLabel(target.id, patch);
    if (target.kind === 'crane') {
      updateCrane(target.id, {
        ...(patch.x !== undefined ? { x: patch.x } : {}),
        ...(patch.y !== undefined ? { bank2Y: patch.y } : {}),
        ...(patch.w !== undefined ? { totalW: patch.w } : {}),
        ...(patch.h !== undefined ? { totalH: patch.h } : {}),
      });
    }
  }, [updateBox, updateCrane, updateLabel, updateTrack]);

  const moveItems = useCallback((items: EditableItem[], dx: number, dy: number) => {
    for (const item of items) {
      updateGeometry(item.selection, {
        x: Math.round(item.bounds.x + dx),
        y: Math.round(item.bounds.y + dy),
      });
    }
  }, [updateGeometry]);

  const updateSelectedBounds = useCallback((patch: GeometryPatch) => {
    if (!selectedBounds) return;
    const dx = patch.x !== undefined ? patch.x - selectedBounds.x : 0;
    const dy = patch.y !== undefined ? patch.y - selectedBounds.y : 0;
    const sx = patch.w !== undefined && selectedBounds.w !== 0 ? patch.w / selectedBounds.w : 1;
    const sy = patch.h !== undefined && selectedBounds.h !== 0 ? patch.h / selectedBounds.h : 1;

    for (const item of selectedItems) {
      const next: Bounds = {
        x: Math.round(selectedBounds.x + (item.bounds.x - selectedBounds.x) * sx + dx),
        y: Math.round(selectedBounds.y + (item.bounds.y - selectedBounds.y) * sy + dy),
        w: Math.round(item.bounds.w * sx),
        h: Math.round(item.bounds.h * sy),
      };
      updateGeometry(item.selection, next);
    }
  }, [selectedBounds, selectedItems, updateGeometry]);

  const toggleSelectedTrackDirection = useCallback((direction: FPDirection) => {
    const addDirection = !isDirChecked(direction);
    for (const track of selectedTracks) {
      const current = new Set(getTrackDirections(track));
      if (addDirection) current.add(direction);
      else current.delete(direction);
      const next = Array.from(current);
      const primary = next[0] ?? direction;
      const axis = primary === 'left' || primary === 'right' ? 'x' : 'y';
      updateTrack(track.id, {
        fpDirection: primary,
        fpDirections: next.length ? next : [direction],
        direction: axis,
      });
    }
  }, [isDirChecked, selectedTracks, updateTrack]);

  const handleApply = useCallback(() => {
    onApply({ ...layout, floorPlan: fp });
    setDirty(false);
  }, [layout, fp, onApply]);

  const handleExport = useCallback(() => {
    const nextLayout = { ...layout, floorPlan: fp };
    const blob = new Blob([JSON.stringify(nextLayout, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'defaultLayout.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [layout, fp]);

  const onWheel = useCallback((e: WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const rect = svgRef.current!.getBoundingClientRect();
    const mx = (e.clientX - rect.left) / rect.width;
    const my = (e.clientY - rect.top) / rect.height;
    setVB((prev) => {
      const factor = e.deltaY > 0 ? 1.12 : 0.89;
      const newW = prev.w * factor;
      const newH = newW / (rect.width / rect.height);
      return clampVB({
        x: prev.x + mx * (prev.w - newW),
        y: prev.y + my * (prev.h - newH),
        w: newW,
        h: newH,
      }, rect.width, rect.height);
    });
  }, []);

  const onPointerDown = useCallback((e: PointerEvent<SVGSVGElement>) => {
    (e.currentTarget as SVGSVGElement).setPointerCapture(e.pointerId);
    const rect = svgRef.current!.getBoundingClientRect();
    const svgPos = clientToSVG(e.clientX, e.clientY, rect, vb);

    if (tool === 'pan') {
      setIsPanning(true);
      panStart.current = { px: e.clientX, py: e.clientY, vb };
      return;
    }

    const labelHit = [...fp.labels].reverse().find((l) => contains(l, svgPos.x, svgPos.y));
    const trackHit = [...fp.tracks].reverse().find((t) => contains(t, svgPos.x, svgPos.y));
    const craneHit = [...fp.cranes].reverse().find((c) =>
      contains({ x: c.x, y: c.bank2Y, w: c.totalW, h: c.totalH }, svgPos.x, svgPos.y)
    );
    const boxHit = [...fp.boxes].reverse().find((b) => contains(b, svgPos.x, svgPos.y));

    const hit = labelHit
      ? { selection: { kind: 'label' as const, id: labelHit.id }, bounds: labelHit }
      : trackHit
      ? { selection: { kind: 'track' as const, id: trackHit.id }, bounds: trackHit }
      : craneHit
      ? {
          selection: { kind: 'crane' as const, id: craneHit.id },
          bounds: { x: craneHit.x, y: craneHit.bank2Y, w: craneHit.totalW, h: craneHit.totalH },
        }
      : boxHit
      ? { selection: { kind: 'box' as const, id: boxHit.id }, bounds: boxHit }
      : null;

    if (hit) {
      const alreadySelected = selected.some((item) => sameSelection(item, hit.selection));
      const multiKey = e.shiftKey || e.ctrlKey || e.metaKey;
      const nextSelected = multiKey
        ? alreadySelected
          ? selected.filter((item) => !sameSelection(item, hit.selection))
          : [...selected, hit.selection]
        : alreadySelected
        ? selected
        : [hit.selection];

      setSelected(nextSelected);
      if (multiKey && alreadySelected) {
        dragStart.current = null;
        return;
      }
      const nextSelectedItems = nextSelected
        .map((selection) => allItems.find((item) => sameSelection(item.selection, selection)))
        .filter((item): item is EditableItem => Boolean(item));
      const groupBounds = getUnionBounds(nextSelectedItems);
      if (!groupBounds) return;
      const selectedKeySet = new Set(nextSelected.map(selectionKey));
      dragStart.current = {
        items: nextSelectedItems,
        otherItems: allItems.filter((item) => !selectedKeySet.has(selectionKey(item.selection))),
        groupBounds,
        svgStartX: svgPos.x,
        svgStartY: svgPos.y,
      };
      return;
    }

    selectStart.current = {
      x: svgPos.x,
      y: svgPos.y,
      additive: e.shiftKey || e.ctrlKey || e.metaKey,
    };
    setSelectionBox({ x: svgPos.x, y: svgPos.y, w: 0, h: 0 });
    if (!selectStart.current.additive) setSelected([]);
  }, [allItems, fp.boxes, fp.cranes, fp.labels, fp.tracks, selected, tool, vb]);

  const onPointerMove = useCallback((e: PointerEvent<SVGSVGElement>) => {
    const rect = svgRef.current!.getBoundingClientRect();

    if (dragStart.current) {
      const svgPos = clientToSVG(e.clientX, e.clientY, rect, vb);
      const rawDx = svgPos.x - dragStart.current.svgStartX;
      const rawDy = svgPos.y - dragStart.current.svgStartY;
      const { dx, dy } = snapDelta(
        dragStart.current.groupBounds,
        dragStart.current.otherItems,
        rawDx,
        rawDy,
      );
      moveItems(dragStart.current.items, dx, dy);
      return;
    }

    if (selectStart.current) {
      const svgPos = clientToSVG(e.clientX, e.clientY, rect, vb);
      const x = Math.min(selectStart.current.x, svgPos.x);
      const y = Math.min(selectStart.current.y, svgPos.y);
      const box = {
        x,
        y,
        w: Math.abs(svgPos.x - selectStart.current.x),
        h: Math.abs(svgPos.y - selectStart.current.y),
      };
      setSelectionBox(box);
      const hits = allItems
        .filter((item) => intersects(item.bounds, box))
        .map((item) => item.selection);
      setSelected((prev) => {
        if (!selectStart.current?.additive) return hits;
        const merged = [...prev];
        for (const hit of hits) {
          if (!merged.some((item) => sameSelection(item, hit))) merged.push(hit);
        }
        return merged;
      });
      return;
    }

    if (isPanning && panStart.current) {
      const dx = ((e.clientX - panStart.current.px) / rect.width) * panStart.current.vb.w;
      const dy = ((e.clientY - panStart.current.py) / rect.height) * panStart.current.vb.h;
      const base = panStart.current.vb;
      setVB(clampVB({ x: base.x - dx, y: base.y - dy, w: base.w, h: base.h }, rect.width, rect.height));
    }
  }, [allItems, vb, isPanning, moveItems]);

  const onPointerUp = useCallback(() => {
    dragStart.current = null;
    selectStart.current = null;
    setSelectionBox(null);
    setIsPanning(false);
    panStart.current = null;
  }, []);

  const PANEL_W = 260;
  const viewBox = `${vb.x} ${vb.y} ${vb.w} ${vb.h}`;

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', background: '#0f1420' }}>
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <svg
          ref={svgRef}
          viewBox={viewBox}
          style={{
            width: '100%',
            height: '100%',
            cursor: tool === 'pan' ? (isPanning ? 'grabbing' : 'grab') : (dragStart.current ? 'move' : 'crosshair'),
            userSelect: 'none',
          }}
          onWheel={onWheel}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        >
          <rect x={0} y={0} width={fp.width} height={fp.height} fill={fp.backgroundColor} />
          <rect x={0} y={0} width={fp.width} height={fp.height} fill="none" stroke="#94a3b8" strokeWidth={1} />

          {fp.boxes.map((box) => {
            const isSel = selected.some((item) => item.kind === 'box' && item.id === box.id);
            return (
              <g key={box.id}>
                <rect
                  x={box.x}
                  y={box.y}
                  width={box.w}
                  height={box.h}
                  fill={box.bgColor}
                  fillOpacity={box.bgAlpha}
                  stroke={isSel ? '#f59e0b' : box.borderColor}
                  strokeWidth={isSel ? 2.5 : box.borderWidth}
                  rx={3}
                  cursor="move"
                />
                {box.text && (
                  <text
                    x={box.x + box.w / 2}
                    y={box.y + box.h / 2 + box.fontSize * 0.35}
                    textAnchor="middle"
                    fill={box.textColor}
                    fontSize={box.fontSize}
                    fontFamily="Tahoma, Arial, sans-serif"
                    pointerEvents="none"
                  >
                    {box.text}
                  </text>
                )}
              </g>
            );
          })}

          {fp.cranes.map((crane) => {
            const isSel = selected.some((item) => item.kind === 'crane' && item.id === crane.id);
            return (
              <g key={crane.id}>
                <rect
                  x={crane.x}
                  y={crane.bank2Y}
                  width={crane.totalW}
                  height={crane.totalH}
                  fill="rgba(37,99,235,0.08)"
                  stroke={isSel ? '#f59e0b' : '#3b82f6'}
                  strokeWidth={isSel ? 2.5 : 1.5}
                  strokeDasharray="6 3"
                  rx={3}
                  cursor="move"
                />
                <text
                  x={crane.x + crane.totalW / 2}
                  y={crane.bank2Y + 16}
                  textAnchor="middle"
                  fill="#3b82f6"
                  fontSize={13}
                  fontFamily="monospace"
                  fontWeight="bold"
                  pointerEvents="none"
                >
                  {crane.id}
                </text>
              </g>
            );
          })}

          {fp.tracks.map((track) => {
            const { fill, stroke } = layerColor(track.layerId);
            const isSel = selected.some((item) => item.kind === 'track' && item.id === track.id);
            return (
              <rect
                key={track.id}
                x={track.x}
                y={track.y}
                width={track.w}
                height={track.h}
                fill={isSel ? '#fbbf24' : fill}
                stroke={isSel ? '#f59e0b' : stroke}
                strokeWidth={isSel ? 2 : 0.8}
                rx={2}
                cursor="move"
              />
            );
          })}

          {fp.labels.map((lbl) => (
            <g key={lbl.id} cursor="move">
              {selected.some((item) => item.kind === 'label' && item.id === lbl.id) && (
                <rect
                  x={lbl.x}
                  y={lbl.y}
                  width={lbl.w}
                  height={lbl.h}
                  fill="rgba(245,158,11,0.08)"
                  stroke="#f59e0b"
                  strokeWidth={1.5}
                  strokeDasharray="4 2"
                  rx={2}
                />
              )}
              <text
                x={lbl.x}
                y={lbl.y + lbl.fontSize}
                fill={lbl.color}
                fontSize={lbl.fontSize}
                fontFamily={lbl.fontFamily || 'Tahoma, Arial, sans-serif'}
                fontWeight={lbl.bold ? 'bold' : 'normal'}
                fontStyle={lbl.italic ? 'italic' : 'normal'}
                pointerEvents="none"
              >
                {lbl.text}
              </text>
            </g>
          ))}

          {selectedBounds && (
            <rect
              x={selectedBounds.x - 2}
              y={selectedBounds.y - 2}
              width={selectedBounds.w + 4}
              height={selectedBounds.h + 4}
              fill="none"
              stroke="#f59e0b"
              strokeWidth={1.5}
              strokeDasharray="4 2"
              rx={3}
              pointerEvents="none"
            />
          )}

          {selectionBox && (
            <rect
              x={selectionBox.x}
              y={selectionBox.y}
              width={selectionBox.w}
              height={selectionBox.h}
              fill="rgba(59,130,246,0.12)"
              stroke="#60a5fa"
              strokeWidth={1.5}
              strokeDasharray="5 3"
              pointerEvents="none"
            />
          )}
        </svg>

        <div style={{
          position: 'absolute',
          top: 16,
          left: 16,
          display: 'flex',
          gap: 6,
          padding: 4,
          borderRadius: 6,
          background: 'rgba(13,17,23,0.9)',
          border: '1px solid #1e293b',
          zIndex: 2,
        }}>
          <button
            onClick={() => setTool('select')}
            title="Select objects"
            style={{
              width: 30,
              height: 28,
              borderRadius: 5,
              border: tool === 'select' ? '1px solid #90cdf4' : '1px solid transparent',
              background: tool === 'select' ? '#1e3a5f' : 'transparent',
              color: tool === 'select' ? '#bee3f8' : '#718096',
              cursor: 'pointer',
              fontFamily: 'monospace',
              fontSize: 15,
            }}
          >
            ↖
          </button>
          <button
            onClick={() => setTool('pan')}
            title="Pan canvas"
            style={{
              width: 30,
              height: 28,
              borderRadius: 5,
              border: tool === 'pan' ? '1px solid #90cdf4' : '1px solid transparent',
              background: tool === 'pan' ? '#1e3a5f' : 'transparent',
              color: tool === 'pan' ? '#bee3f8' : '#718096',
              cursor: 'pointer',
              fontFamily: 'monospace',
              fontSize: 15,
            }}
          >
            ✋
          </button>
        </div>

        <div style={{
          position: 'absolute',
          bottom: 16,
          left: 16,
          color: '#4a5568',
          fontFamily: 'monospace',
          fontSize: 11,
          pointerEvents: 'none',
        }}>
          Scroll: zoom | Cursor: select / box select | Hand: pan
        </div>

        <button
          onClick={() => setVB(FULL_VB)}
          style={{
            position: 'absolute',
            bottom: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '4px 14px',
            background: '#2d3748',
            color: '#a0aec0',
            border: 'none',
            borderRadius: 5,
            fontFamily: 'monospace',
            fontSize: 11,
            cursor: 'pointer',
          }}
        >
          Fit All
        </button>
      </div>

      <div style={{
        width: PANEL_W,
        flexShrink: 0,
        background: '#0d1117',
        borderLeft: '1px solid #1e293b',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'monospace',
        color: '#e2e8f0',
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '10px 14px',
          borderBottom: '1px solid #1e293b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <span style={{ fontWeight: 700, fontSize: 13, color: '#f6ad55', letterSpacing: 1 }}>
            DESIGNER
          </span>
          <button
            onClick={() => setDesigner(false)}
            title="Exit designer mode"
            style={{ background: 'none', border: 'none', color: '#718096', cursor: 'pointer', fontSize: 16 }}
          >
            x
          </button>
        </div>

        <div style={{ padding: '8px 14px', borderBottom: '1px solid #1e293b', fontSize: 11, color: '#718096' }}>
          {fp.tracks.length} tracks | {fp.cranes.length} cranes | {fp.boxes.length} zones | {fp.labels.length} labels
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>
          {selected.length > 0 && selectedBounds ? (
            <>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#90cdf4', marginBottom: 10 }}>
                {primarySelection
                  ? `${primarySelection.kind.toUpperCase()}: ${primarySelection.id}`
                  : `${selected.length} OBJECTS`}
              </div>

              <NumField label="X" value={selectedBounds.x} onChange={(v) => updateSelectedBounds({ x: v })} />
              <NumField label="Y" value={selectedBounds.y} onChange={(v) => updateSelectedBounds({ y: v })} />
              <NumField label="W" value={selectedBounds.w} onChange={(v) => updateSelectedBounds({ w: v })} />
              <NumField label="H" value={selectedBounds.h} onChange={(v) => updateSelectedBounds({ h: v })} />

              {selectedTracks.length > 0 && (
                <>
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ color: '#90cdf4', fontFamily: 'monospace', fontSize: 11, marginBottom: 5 }}>
                      Dir
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '28px 28px 28px', gridTemplateRows: '28px 28px 28px', gap: 3 }}>
                      <span />
                      <button
                        onClick={() => toggleSelectedTrackDirection('up')}
                        title="Up"
                        style={dirButtonStyle(isDirChecked('up'), isDirMixed('up'))}
                      >↑</button>
                      <span />
                      <button
                        onClick={() => toggleSelectedTrackDirection('left')}
                        title="Left"
                        style={dirButtonStyle(isDirChecked('left'), isDirMixed('left'))}
                      >←</button>
                      <span style={{ border: '1px solid #2d3748', borderRadius: 4, background: '#111827' }} />
                      <button
                        onClick={() => toggleSelectedTrackDirection('right')}
                        title="Right"
                        style={dirButtonStyle(isDirChecked('right'), isDirMixed('right'))}
                      >→</button>
                      <span />
                      <button
                        onClick={() => toggleSelectedTrackDirection('down')}
                        title="Down"
                        style={dirButtonStyle(isDirChecked('down'), isDirMixed('down'))}
                      >↓</button>
                      <span />
                    </div>
                  </div>

                  {selectedTrack && (
                    <div style={{ fontSize: 10, color: '#718096', marginBottom: 8 }}>
                      Layer: {selectedTrack.layerId}
                    </div>
                  )}
                </>
              )}

              {selectedTracks.length > 0 && (() => {
                const types = selectedTracks.map((t) => t.trackType ?? 'Default');
                const commonType = types.every((t) => t === types[0]) ? types[0] : undefined;
                return (
                  <SelectField<FPTrackType>
                    label={`Type${selectedTracks.length > 1 ? ` (${selectedTracks.length})` : ''}`}
                    value={commonType ?? 'Default'}
                    options={[
                      { value: 'Default', label: commonType === undefined ? '— mixed —' : 'Default' },
                      { value: 'Lift', label: 'Lift' },
                      { value: 'Palletizer', label: 'Palletizer' },
                      { value: 'Depalletizer', label: 'Depalletizer' },
                      { value: 'InboundHs', label: 'Inbound HS' },
                      { value: 'OutboundHs', label: 'Outbound HS' },
                      { value: 'BCRRead', label: 'BCR Read' },
                    ]}
                    onChange={(v) => selectedTracks.forEach((t) => updateTrack(t.id, { trackType: v }))}
                  />
                );
              })()}

              {selectedTrack && (
                <>
                  <div style={{ fontSize: 10, color: '#718096', marginBottom: 4 }}>
                    Floor: {getFloorForLayer(selectedTrack.layerId)?.shortName ?? '??'}{' '}
                    (Z = {getFloorForLayer(selectedTrack.layerId)?.worldZ ?? 0} m)
                  </div>

                  <div style={{ marginTop: 8, display: 'flex', gap: 6, alignItems: 'center' }}>
                    <div style={{
                      width: 14,
                      height: 14,
                      borderRadius: 3,
                      background: layerColor(selectedTrack.layerId).fill,
                      border: `1px solid ${layerColor(selectedTrack.layerId).stroke}`,
                      flexShrink: 0,
                    }} />
                    <span style={{ fontSize: 10, color: '#718096' }}>{selectedTrack.colorSet}</span>
                  </div>
                </>
              )}

              {selectedBox?.layerId && (
                <div style={{ fontSize: 10, color: '#718096', marginTop: 8 }}>
                  Layer: {selectedBox.layerId}
                </div>
              )}

              {selectedLabel && (
                <>
                  <NumField label="FS" value={selectedLabel.fontSize}
                    onChange={(v) => updateLabel(selectedLabel.id, { fontSize: v })} />
                  <div style={{ fontSize: 10, color: '#718096', marginTop: 8 }}>
                    Text: {selectedLabel.text}
                  </div>
                </>
              )}
            </>
          ) : (
            <div style={{ color: '#4a5568', fontSize: 11, marginTop: 8 }}>
              Click an object to select it
            </div>
          )}
        </div>

        <div style={{ padding: '10px 14px', borderTop: '1px solid #1e293b' }}>
          <div style={{ fontSize: 10, color: '#718096', marginBottom: 6 }}>LAYERS</div>
          {fp.layers
            .filter((l) => l.id !== 'default')
            .sort((a, b) => a.order - b.order)
            .map((layer) => {
              const c = layerColor(layer.id);
              return (
                <div key={layer.id} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <div style={{
                    width: 10,
                    height: 10,
                    borderRadius: 2,
                    background: c.fill,
                    border: `1px solid ${c.stroke}`,
                    flexShrink: 0,
                  }} />
                  <span style={{ fontSize: 10, color: '#a0aec0' }}>{layer.name}</span>
                </div>
              );
            })}
        </div>

        <div style={{ padding: '10px 14px', borderTop: '1px solid #1e293b', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <button
            onClick={handleApply}
            disabled={!dirty}
            style={{
              padding: '7px 0',
              borderRadius: 5,
              border: 'none',
              cursor: dirty ? 'pointer' : 'not-allowed',
              background: dirty ? '#2f855a' : '#1a2a22',
              color: dirty ? '#9ae6b4' : '#4a7a5a',
              fontFamily: 'monospace',
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {dirty ? 'Apply Changes' : 'No Changes'}
          </button>

          <button
            onClick={handleExport}
            style={{
              padding: '7px 0',
              borderRadius: 5,
              border: '1px solid #2d3748',
              cursor: 'pointer',
              background: 'transparent',
              color: '#90cdf4',
              fontFamily: 'monospace',
              fontSize: 12,
            }}
          >
            Export Layout
          </button>
        </div>
      </div>
    </div>
  );
}
