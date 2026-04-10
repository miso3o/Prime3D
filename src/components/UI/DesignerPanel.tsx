/**
 * DesignerPanel.tsx — Layout Designer (table editor) for Prime3D.
 *
 * Shown when `designerMode=true` in the warehouse store.
 * Displays all layout objects in a tabbed table:
 *   Racks | Cranes | Tracks | Equipment | HomeStands
 *
 * Each row has inline-editable X/Y/Z position fields.
 * Changes are reflected IMMEDIATELY in the 3D scene (Apply on blur/Enter).
 *
 * "Save JSON" exports the current layout as a downloadable .json file.
 * "Reload Default" button in the header restores the original layout.
 *
 * Architecture:
 *  - DesignerPanel receives `layout` and `onApply` callback from App
 *  - User edits trigger onApply with the mutated layout
 *  - Scene re-renders with the new positions without page reload
 */
import { useState, useCallback, useEffect } from 'react';
import { useWarehouseStore } from '../../store/useWarehouseStore';
import type { LayoutConfig, RackConfig, CraneConfig, TrackConfig, EquipmentConfig, HomeStandConfig } from '../../config/types';

interface DesignerPanelProps {
  layout: LayoutConfig;
  onApply: (next: LayoutConfig) => void;
}

// ── Style helpers ──────────────────────────────────────────────────────────────

const PANEL_W = 520;

const s: Record<string, React.CSSProperties> = {
  panel: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: PANEL_W,
    height: '100%',
    background: 'rgba(10,14,24,0.97)',
    backdropFilter: 'blur(10px)',
    borderLeft: '1px solid rgba(255,255,255,0.10)',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 12,
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#d4e0f0',
  },
  header: {
    padding: '10px 16px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
  },
  tabs: {
    display: 'flex',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    flexShrink: 0,
  },
  body: {
    flex: 1,
    overflowY: 'auto',
    padding: '8px 0',
  },
  footer: {
    padding: '10px 16px',
    borderTop: '1px solid rgba(255,255,255,0.08)',
    display: 'flex',
    gap: 8,
    flexShrink: 0,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    textAlign: 'left',
    padding: '4px 10px',
    color: '#4a6075',
    fontSize: 10,
    letterSpacing: 1,
    fontWeight: 700,
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    position: 'sticky' as const,
    top: 0,
    background: 'rgba(10,14,24,0.97)',
    zIndex: 1,
  },
  td: {
    padding: '4px 8px',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
    verticalAlign: 'middle',
  },
  input: {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 4,
    color: '#c6d8f0',
    fontFamily: 'monospace',
    fontSize: 11,
    padding: '2px 5px',
    width: 70,
    textAlign: 'right' as const,
  },
  inputActive: {
    background: 'rgba(43,108,176,0.25)',
    border: '1px solid rgba(43,108,176,0.6)',
  },
  idCell: {
    color: '#90cdf4',
    fontSize: 11,
    fontWeight: 600,
  },
  typeCell: {
    color: '#718096',
    fontSize: 10,
    letterSpacing: 0.5,
  },
};

// ── Numeric field component ────────────────────────────────────────────────────

function NumField({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [draft, setDraft] = useState(String(value));
  const [active, setActive] = useState(false);

  // Sync from parent when not actively editing
  useEffect(() => {
    if (!active) setDraft(String(value));
  }, [value, active]);

  const commit = useCallback(() => {
    const n = parseFloat(draft);
    if (!isNaN(n)) onChange(n);
    else setDraft(String(value));
    setActive(false);
  }, [draft, value, onChange]);

  return (
    <input
      style={{ ...s.input, ...(active ? s.inputActive : {}) }}
      value={draft}
      onChange={(e) => { setDraft(e.target.value); setActive(true); }}
      onBlur={commit}
      onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setDraft(String(value)); setActive(false); } }}
      onFocus={() => setActive(true)}
    />
  );
}

// ── Text field component ───────────────────────────────────────────────────────

function TextField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!active) setDraft(value);
  }, [value, active]);

  const commit = useCallback(() => {
    if (draft.trim()) onChange(draft.trim());
    else setDraft(value);
    setActive(false);
  }, [draft, value, onChange]);

  return (
    <input
      style={{
        ...s.input,
        width: 90,
        textAlign: 'left',
        ...(active ? s.inputActive : {}),
      }}
      value={draft}
      onChange={(e) => { setDraft(e.target.value); setActive(true); }}
      onBlur={commit}
      onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setDraft(value); setActive(false); } }}
      onFocus={() => setActive(true)}
    />
  );
}

// ── Tab button ────────────────────────────────────────────────────────────────

function Tab({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: '7px 4px',
        border: 'none',
        background: active ? 'rgba(43,108,176,0.25)' : 'transparent',
        color: active ? '#90cdf4' : '#4a6075',
        fontFamily: 'monospace',
        fontSize: 11,
        fontWeight: active ? 700 : 400,
        cursor: 'pointer',
        borderBottom: active ? '2px solid #2b6cb0' : '2px solid transparent',
        transition: 'all .15s',
      }}
    >
      {label} <span style={{ color: '#4a6075', fontSize: 10 }}>({count})</span>
    </button>
  );
}

// ── Button helper ─────────────────────────────────────────────────────────────

function Btn({ children, color, onClick }: { children: React.ReactNode; color: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '6px 14px',
        borderRadius: 5,
        border: 'none',
        cursor: 'pointer',
        fontFamily: 'monospace',
        fontSize: 12,
        fontWeight: 600,
        background: color,
        color: '#e2e8f0',
        letterSpacing: 0.5,
      }}
    >
      {children}
    </button>
  );
}

// ── Tab content renderers ──────────────────────────────────────────────────────

function RacksTable({ layout, onApply }: { layout: LayoutConfig; onApply: (l: LayoutConfig) => void }) {
  const upd = (idx: number, axis: 0 | 1 | 2, v: number) => {
    const racks = layout.racks.map((r, i) => {
      if (i !== idx) return r;
      const pos: [number, number, number] = [...r.position] as [number, number, number];
      pos[axis] = v;
      return { ...r, position: pos };
    });
    onApply({ ...layout, racks });
  };

  return (
    <table style={s.table}>
      <thead>
        <tr>
          <th style={s.th}>ID</th>
          <th style={s.th}>Bays</th>
          <th style={s.th}>Lvl</th>
          <th style={s.th} title="Position X">X</th>
          <th style={s.th} title="Position Y">Y</th>
          <th style={s.th} title="Position Z">Z</th>
        </tr>
      </thead>
      <tbody>
        {layout.racks.map((r, i) => (
          <tr key={r.id}>
            <td style={{ ...s.td, ...s.idCell }}>{r.id}</td>
            <td style={{ ...s.td, ...s.typeCell }}>{r.bays}</td>
            <td style={{ ...s.td, ...s.typeCell }}>{r.levels}</td>
            <td style={s.td}><NumField value={r.position[0]} onChange={(v) => upd(i, 0, v)} /></td>
            <td style={s.td}><NumField value={r.position[1]} onChange={(v) => upd(i, 1, v)} /></td>
            <td style={s.td}><NumField value={r.position[2]} onChange={(v) => upd(i, 2, v)} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function CranesTable({ layout, onApply }: { layout: LayoutConfig; onApply: (l: LayoutConfig) => void }) {
  const upd = (idx: number, axis: 0 | 1 | 2, v: number) => {
    const cranes = layout.cranes.map((c, i) => {
      if (i !== idx) return c;
      const pos: [number, number, number] = [...c.railPosition] as [number, number, number];
      pos[axis] = v;
      return { ...c, railPosition: pos };
    });
    onApply({ ...layout, cranes });
  };

  return (
    <table style={s.table}>
      <thead>
        <tr>
          <th style={s.th}>ID</th>
          <th style={s.th}>Racks</th>
          <th style={s.th}>X</th>
          <th style={s.th}>Y</th>
          <th style={s.th}>Z</th>
        </tr>
      </thead>
      <tbody>
        {layout.cranes.map((c, i) => (
          <tr key={c.id}>
            <td style={{ ...s.td, ...s.idCell }}>{c.id}</td>
            <td style={{ ...s.td, ...s.typeCell, fontSize: 9 }}>{c.rackIds.join(', ')}</td>
            <td style={s.td}><NumField value={c.railPosition[0]} onChange={(v) => upd(i, 0, v)} /></td>
            <td style={s.td}><NumField value={c.railPosition[1]} onChange={(v) => upd(i, 1, v)} /></td>
            <td style={s.td}><NumField value={c.railPosition[2]} onChange={(v) => upd(i, 2, v)} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function TracksTable({ layout, onApply }: { layout: LayoutConfig; onApply: (l: LayoutConfig) => void }) {
  const upd = (idx: number, axis: 0 | 1 | 2, v: number) => {
    const tracks = layout.tracks.map((t, i) => {
      if (i !== idx) return t;
      const pos: [number, number, number] = [...t.position] as [number, number, number];
      pos[axis] = v;
      return { ...t, position: pos };
    });
    onApply({ ...layout, tracks });
  };

  return (
    <table style={s.table}>
      <thead>
        <tr>
          <th style={s.th}>ID</th>
          <th style={s.th}>Dir</th>
          <th style={s.th}>Segs</th>
          <th style={s.th}>X</th>
          <th style={s.th}>Y</th>
          <th style={s.th}>Z</th>
        </tr>
      </thead>
      <tbody>
        {layout.tracks.map((t, i) => (
          <tr key={t.id}>
            <td style={{ ...s.td, ...s.idCell }}>{t.id}</td>
            <td style={{ ...s.td, ...s.typeCell }}>{t.direction.toUpperCase()}</td>
            <td style={{ ...s.td, ...s.typeCell }}>{t.segments.length}</td>
            <td style={s.td}><NumField value={t.position[0]} onChange={(v) => upd(i, 0, v)} /></td>
            <td style={s.td}><NumField value={t.position[1]} onChange={(v) => upd(i, 1, v)} /></td>
            <td style={s.td}><NumField value={t.position[2]} onChange={(v) => upd(i, 2, v)} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function EquipmentTable({ layout, onApply }: { layout: LayoutConfig; onApply: (l: LayoutConfig) => void }) {
  const equipment = layout.equipment ?? [];

  const updPos = (idx: number, axis: 0 | 1 | 2, v: number) => {
    const next = equipment.map((eq, i): EquipmentConfig => {
      if (i !== idx) return eq;
      const pos: [number, number, number] = [...eq.position] as [number, number, number];
      pos[axis] = v;
      return { ...eq, position: pos };
    });
    onApply({ ...layout, equipment: next });
  };

  const updName = (idx: number, name: string) => {
    const next = equipment.map((eq, i) => (i !== idx ? eq : { ...eq, name }));
    onApply({ ...layout, equipment: next });
  };

  if (equipment.length === 0) {
    return <div style={{ padding: '16px', color: '#4a6075', fontStyle: 'italic' }}>No equipment defined.</div>;
  }

  return (
    <table style={s.table}>
      <thead>
        <tr>
          <th style={s.th}>ID</th>
          <th style={s.th}>Name</th>
          <th style={s.th}>Type</th>
          <th style={s.th}>X</th>
          <th style={s.th}>Y</th>
          <th style={s.th}>Z</th>
        </tr>
      </thead>
      <tbody>
        {equipment.map((eq, i) => (
          <tr key={eq.id}>
            <td style={{ ...s.td, ...s.idCell }}>{eq.id}</td>
            <td style={s.td}><TextField value={eq.name} onChange={(v) => updName(i, v)} /></td>
            <td style={{ ...s.td, ...s.typeCell }}>{eq.type}</td>
            <td style={s.td}><NumField value={eq.position[0]} onChange={(v) => updPos(i, 0, v)} /></td>
            <td style={s.td}><NumField value={eq.position[1]} onChange={(v) => updPos(i, 1, v)} /></td>
            <td style={s.td}><NumField value={eq.position[2]} onChange={(v) => updPos(i, 2, v)} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function HomeStandsTable({ layout, onApply }: { layout: LayoutConfig; onApply: (l: LayoutConfig) => void }) {
  const stands = layout.homeStands ?? [];

  const updPos = (idx: number, axis: 0 | 1 | 2, v: number) => {
    const next = stands.map((hs, i): HomeStandConfig => {
      if (i !== idx) return hs;
      const pos: [number, number, number] = [...hs.position] as [number, number, number];
      pos[axis] = v;
      return { ...hs, position: pos };
    });
    onApply({ ...layout, homeStands: next });
  };

  if (stands.length === 0) {
    return <div style={{ padding: '16px', color: '#4a6075', fontStyle: 'italic' }}>No home stands defined.</div>;
  }

  return (
    <table style={s.table}>
      <thead>
        <tr>
          <th style={s.th}>ID</th>
          <th style={s.th}>Units</th>
          <th style={s.th}>Crane</th>
          <th style={s.th}>X</th>
          <th style={s.th}>Y</th>
          <th style={s.th}>Z</th>
        </tr>
      </thead>
      <tbody>
        {stands.map((hs, i) => (
          <tr key={hs.id}>
            <td style={{ ...s.td, ...s.idCell }}>{hs.id}</td>
            <td style={{ ...s.td, ...s.typeCell }}>{hs.units}</td>
            <td style={{ ...s.td, ...s.typeCell }}>{hs.linkedCraneId ?? '—'}</td>
            <td style={s.td}><NumField value={hs.position[0]} onChange={(v) => updPos(i, 0, v)} /></td>
            <td style={s.td}><NumField value={hs.position[1]} onChange={(v) => updPos(i, 1, v)} /></td>
            <td style={s.td}><NumField value={hs.position[2]} onChange={(v) => updPos(i, 2, v)} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ── Main panel ─────────────────────────────────────────────────────────────────

type TabKey = 'racks' | 'cranes' | 'tracks' | 'equipment' | 'homestands';

export function DesignerPanel({ layout, onApply }: DesignerPanelProps) {
  const designerMode  = useWarehouseStore((s) => s.designerMode);
  const setDesigner   = useWarehouseStore((s) => s.setDesignerMode);
  const [activeTab, setActiveTab] = useState<TabKey>('racks');

  if (!designerMode) return null;

  // ── Save JSON to file ──────────────────────────────────────────────────────
  const saveJson = useCallback(() => {
    const blob = new Blob([JSON.stringify(layout, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'layout.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [layout]);

  // ── Import JSON from file ─────────────────────────────────────────────────
  const loadJson = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const parsed = JSON.parse(ev.target?.result as string) as LayoutConfig;
          if (!Array.isArray(parsed.racks)) throw new Error('Invalid layout: missing racks');
          onApply(parsed);
        } catch (err) {
          alert(`Failed to load JSON: ${err instanceof Error ? err.message : String(err)}`);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, [onApply]);

  const counts = {
    racks:      layout.racks.length,
    cranes:     layout.cranes.length,
    tracks:     layout.tracks.length,
    equipment:  (layout.equipment ?? []).length,
    homestands: (layout.homeStands ?? []).length,
  };

  return (
    <div style={s.panel}>
      {/* Header */}
      <div style={s.header}>
        <span style={{ color: '#90cdf4', fontWeight: 700, fontSize: 13, letterSpacing: 1 }}>
          ✎ DESIGNER
        </span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ color: '#4a6075', fontSize: 10 }}>
            Edit fields → changes apply live
          </span>
          <button
            onClick={() => setDesigner(false)}
            style={{
              background: 'none',
              border: 'none',
              color: '#718096',
              cursor: 'pointer',
              fontSize: 16,
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={s.tabs}>
        <Tab label="Racks"    count={counts.racks}      active={activeTab === 'racks'}      onClick={() => setActiveTab('racks')} />
        <Tab label="Cranes"   count={counts.cranes}     active={activeTab === 'cranes'}     onClick={() => setActiveTab('cranes')} />
        <Tab label="Tracks"   count={counts.tracks}     active={activeTab === 'tracks'}     onClick={() => setActiveTab('tracks')} />
        <Tab label="Equip"    count={counts.equipment}  active={activeTab === 'equipment'}  onClick={() => setActiveTab('equipment')} />
        <Tab label="Stands"   count={counts.homestands} active={activeTab === 'homestands'} onClick={() => setActiveTab('homestands')} />
      </div>

      {/* Table body */}
      <div style={s.body}>
        {activeTab === 'racks'      && <RacksTable      layout={layout} onApply={onApply} />}
        {activeTab === 'cranes'     && <CranesTable     layout={layout} onApply={onApply} />}
        {activeTab === 'tracks'     && <TracksTable     layout={layout} onApply={onApply} />}
        {activeTab === 'equipment'  && <EquipmentTable  layout={layout} onApply={onApply} />}
        {activeTab === 'homestands' && <HomeStandsTable layout={layout} onApply={onApply} />}
      </div>

      {/* Footer — action buttons */}
      <div style={s.footer}>
        <Btn color="#276749" onClick={saveJson}>↓ Save JSON</Btn>
        <Btn color="#2b4c7e" onClick={loadJson}>↑ Load JSON</Btn>
        <div style={{ marginLeft: 'auto', color: '#4a6075', fontSize: 10, display: 'flex', alignItems: 'center' }}>
          {Object.values(counts).reduce((a, b) => a + b, 0)} objects total
        </div>
      </div>
    </div>
  );
}
