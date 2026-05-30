/**
 * App.tsx — root component for Prime3D warehouse monitor.
 *
 * View routing:
 *  - designerMode === true         → Designer2D (full-screen 2D editor, hides everything else)
 *  - viewMode === '2d'             → FloorPlan2D (SVG engineering floor plan)
 *  - viewMode === '3d' (default)   → Scene (Three.js 3D canvas)
 *
 * State owned here:
 *  - layout: LayoutConfig — the JSON-driven scene configuration.
 *  - viewMode: '3d' | '2d' — toggled via ViewToggle.
 *
 * Runtime state (crane positions, cell statuses, trays, playback, designer mode)
 * lives in useWarehouseStore (Zustand).
 */
import { useState } from 'react';
import { Scene }            from './components/Scene/Scene';
import { FloorPlan2D }      from './components/FloorPlan/FloorPlan2D';
import { Designer2D }       from './components/FloorPlan/Designer2D';
import { StatusPanel }      from './components/UI/StatusPanel';
import { Legend }           from './components/UI/Legend';
import { LayoutEditor }     from './components/UI/LayoutEditor';
import { SelectionPopup }   from './components/UI/SelectionPopup';
import { PlaybackControls } from './components/UI/PlaybackControls';
import { ViewToggle }       from './components/UI/ViewToggle';
import { useMockData }      from './hooks/useMockData';
import { useWarehouseStore } from './store/useWarehouseStore';
import defaultLayoutJson    from './config/defaultLayout.json';
import type { LayoutConfig } from './config/types';
import { findByUnitId, normalizeLayout } from './config/layoutGeometry';

const DEFAULT_LAYOUT = normalizeLayout(defaultLayoutJson as unknown as LayoutConfig);

function App() {
  const [layout, setLayout] = useState<LayoutConfig>(DEFAULT_LAYOUT);
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');
  const [searchUnitId, setSearchUnitId] = useState('');
  const [showTrackIds, setShowTrackIds] = useState(false);

  useMockData(layout);

  const designerMode = useWarehouseStore((s) => s.designerMode);
  const setDesigner  = useWarehouseStore((s) => s.setDesignerMode);
  const setSelected = useWarehouseStore((s) => s.setSelectedObject);
  const requestFocus = useWarehouseStore((s) => s.requestFocus);

  const handleSearch = () => {
    const match = findByUnitId(layout, searchUnitId);
    if (!match) return;
    setSelected(match);
    requestFocus(match);
  };

  // ── Designer2D — replaces entire UI ────────────────────────────────────────
  if (designerMode) {
    return (
      <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
        <Designer2D layout={layout} onApply={(next) => setLayout(normalizeLayout(next))} />
      </div>
    );
  }

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>

      {/* ── Main view: 3D Scene or 2D SVG floor plan ─────────────────────────── */}
      {viewMode === '2d' && layout.floorPlan ? (
        <FloorPlan2D floorPlan={layout.floorPlan} showTrackIds={showTrackIds} />
      ) : (
        <Scene layout={layout} showTrackIds={showTrackIds} onLayoutChange={setLayout} />
      )}

      {/* ── Status panel (top-right) ──────────────────────────────────────────── */}
      <StatusPanel layout={layout} />

      {/* ── Color legend (bottom-left) ────────────────────────────────────────── */}
      <Legend />

      {/* ── Selection popup ───────────────────────────────────────────────────── */}
      <SelectionPopup layout={layout} />

      {/* ── Playback controls (bottom-center) ────────────────────────────────── */}
      <PlaybackControls />

      {/* ── View toggle: 3D / 2D (top-center) ───────────────────────────────── */}
      <ViewToggle viewMode={viewMode} onToggle={() => setViewMode((m) => (m === '3d' ? '2d' : '3d'))} />

      <label
        title="Show TrackID labels"
        style={{
          position: 'absolute',
          top: 16,
          left: '50%',
          transform: 'translateX(90px)',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 10px',
          borderRadius: 6,
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(15,20,30,0.85)',
          color: showTrackIds ? '#bee3f8' : '#94a3b8',
          fontFamily: 'monospace',
          fontSize: 12,
          fontWeight: 700,
          cursor: 'pointer',
          zIndex: 7,
          userSelect: 'none',
          whiteSpace: 'nowrap',
        }}
      >
        <input
          type="checkbox"
          checked={showTrackIds}
          onChange={(e) => setShowTrackIds(e.target.checked)}
          style={{ margin: 0, accentColor: '#2b6cb0' }}
        />
        TrackID
      </label>

      {/* ── Raw JSON editor (right side, advanced) ───────────────────────────── */}
      <LayoutEditor layout={layout} onApply={(next) => setLayout(normalizeLayout(next))} />

      {/* ── Title bar (top-left) ─────────────────────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          top: 16,
          left: 16,
          color: '#90cdf4',
          fontFamily: 'monospace',
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: 2,
          background: 'rgba(179, 191, 216, 0)',
          padding: '6px 12px',
          borderRadius: 6,
          backdropFilter: 'blur(6px)',
          border: '1px solid rgba(255,255,255,0.08)',
          pointerEvents: 'none',
          zIndex: 5,
        }}
      >
        PRIME3D &mdash; Warehouse Monitor
      </div>

      <div
        style={{
          position: 'absolute',
          top: 16,
          left: 220,
          display: 'flex',
          gap: 6,
          zIndex: 6,
        }}
      >
        <input
          value={searchUnitId}
          onChange={(e) => setSearchUnitId(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
          placeholder="Search UnitId"
          style={{
            width: 160,
            padding: '6px 10px',
            borderRadius: 6,
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(15,20,30,0.85)',
            color: '#e2e8f0',
            fontFamily: 'monospace',
            fontSize: 12,
          }}
        />
        <button
          onClick={handleSearch}
          style={{
            padding: '6px 12px',
            borderRadius: 6,
            border: 'none',
            background: '#2b6cb0',
            color: '#bee3f8',
            fontFamily: 'monospace',
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          FIND
        </button>
      </div>

      {/* ── Designer mode button (bottom-right) ──────────────────────────────── */}
      <button
        onClick={() => setDesigner(true)}
        title="Open 2D layout designer"
        style={{
          position: 'absolute',
          bottom: 16,
          right: 16,
          padding: '7px 16px',
          borderRadius: 6,
          border: 'none',
          cursor: 'pointer',
          fontFamily: 'monospace',
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: 1,
          background: '#2d3748',
          color: '#a0aec0',
          transition: 'background .2s',
          zIndex: 6,
        }}
      >
        ✎ DESIGNER
      </button>
    </div>
  );
}

export default App;
