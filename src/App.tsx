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
import { useState, useEffect, useRef } from 'react';
import { Scene }            from './components/Scene/Scene';
import { FloorPlan2D }      from './components/FloorPlan/FloorPlan2D';
import { Designer2D }       from './components/FloorPlan/Designer2D';
import { LayoutEditor }     from './components/UI/LayoutEditor';
import { SelectionPopup }   from './components/UI/SelectionPopup';
import { PlaybackControls } from './components/UI/PlaybackControls';
import { ViewToggle }       from './components/UI/ViewToggle';
import { useWarehouseStore } from './store/useWarehouseStore';
import defaultLayoutJson    from './config/defaultLayout.json';
import type { LayoutConfig } from './config/types';
import { findByUnitId, normalizeLayout } from './config/layoutGeometry';
import type { FloorId } from './config/layerConfig';

const DEFAULT_LAYOUT = normalizeLayout(defaultLayoutJson as unknown as LayoutConfig);


function FpsDisplay() {
  const [fps, setFps] = useState(0);
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());
  useEffect(() => {
    let rafId: number;
    const tick = () => {
      frameCount.current++;
      const now = performance.now();
      if (now - lastTime.current >= 1000) {
        setFps(Math.round(frameCount.current * 1000 / (now - lastTime.current)));
        frameCount.current = 0;
        lastTime.current = now;
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);
  return (
    <div style={{
      position: 'absolute', bottom: 16, left: 16,
      background: 'rgba(15,20,30,0.82)', color: '#90cdf4',
      fontFamily: 'monospace', fontSize: 11, fontWeight: 700,
      padding: '4px 8px', borderRadius: 4,
      border: '1px solid rgba(255,255,255,0.08)',
      pointerEvents: 'none', zIndex: 5,
    }}>
      {fps} FPS
    </div>
  );
}

function App() {
  const [layout, setLayout] = useState<LayoutConfig>(DEFAULT_LAYOUT);
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('2d');
  const [searchUnitId, setSearchUnitId] = useState('');
  const [showTrackIds, setShowTrackIds] = useState(false);
  const [devMode, setDevMode] = useState(false);
  const [activeFloor, setActiveFloor] = useState<FloorId | 'all'>('all');
  const [notFound, setNotFound]       = useState(false);
  const notFoundTimer                 = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const store = useWarehouseStore.getState();
    for (const crane of layout.cranes) {
      store.setCraneState(crane.id, {
        id: crane.id,
        status: 'idle',
        xPosition: 0,
        yPosition: 0,
        forkExtension: 0,
      });
    }
  }, [layout]);

  const designerMode = useWarehouseStore((s) => s.designerMode);
  const setDesigner  = useWarehouseStore((s) => s.setDesignerMode);
  const setSelected = useWarehouseStore((s) => s.setSelectedObject);
  const requestFocus = useWarehouseStore((s) => s.requestFocus);

  // 층 탭 변경 — 선택 및 검색 초기화
  const handleFloorChange = (floor: FloorId | 'all') => {
    setActiveFloor(floor);
    setSelected(null);
    setSearchUnitId('');
  };

  const handleSearch = () => {
    const match = findByUnitId(layout, searchUnitId);
    if (!match) {
      // 찾을 수 없음 — 입력창 흔들림 + 토스트
      if (notFoundTimer.current) clearTimeout(notFoundTimer.current);
      setNotFound(true);
      notFoundTimer.current = setTimeout(() => setNotFound(false), 1800);
      return;
    }
    // 현재 필터와 다른 층이면 해당 층으로 자동 전환
    if (activeFloor !== 'all') {
      let targetLayerId: string | undefined;
      if (match.type === 'fptrack') targetLayerId = match.layerId;
      if (match.type === 'fpbox') {
        const box = layout.floorPlan?.boxes.find((b) => b.id === match.id);
        const crane = layout.floorPlan?.cranes.find((c) => c.id === match.id);
        targetLayerId = box?.layerId ?? crane?.layerId;
      }
      if (targetLayerId && targetLayerId !== activeFloor) {
        setActiveFloor(targetLayerId as FloorId);
      }
    }
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
        <FloorPlan2D floorPlan={layout.floorPlan} showTrackIds={showTrackIds} activeFloor={activeFloor} onFloorChange={handleFloorChange} />
      ) : (
        <Scene layout={layout} showTrackIds={showTrackIds} onLayoutChange={setLayout} />
      )}

      {/* ── FPS display (bottom-left, 3D only) ───────────────────────────────── */}
      {viewMode === '3d' && <FpsDisplay />}

      {/* ── Selection popup ───────────────────────────────────────────────────── */}
      <SelectionPopup layout={layout} />

      {/* ── Playback controls (bottom-left, dev mode only) ───────────────────── */}
      {devMode && <PlaybackControls />}

      {/* ── Character image — Ctrl+Click to toggle dev mode ──────────────────── */}
      <img
        src="/character1.png"
        alt=""
        title={devMode ? 'Dev mode ON — battery factory running at full capacity! (Ctrl+Click to exit)' : "Hi! I'm Zaion, guardian of the MES factory. Every single battery cell is under my watch!"}
        onClick={(e) => { if (e.ctrlKey) setDevMode((d) => !d); else window.open('/MES_GUIDE.html', 'mes_guide'); }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLImageElement).style.filter = devMode ? 'drop-shadow(0 0 10px #90cdf4)' : 'drop-shadow(0 0 10px #90cdf4)'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLImageElement).style.filter = devMode ? 'drop-shadow(0 0 6px #90cdf4)' : 'none'; }}
        style={{
          position: 'absolute',
          bottom: 16,
          left: 16,
          width: 100,
          height: 120,
          objectFit: 'contain',
          cursor: 'pointer',
          zIndex: 5,
          filter: devMode ? 'drop-shadow(0 0 6px #90cdf4)' : 'none',
          transition: 'filter .2s',
          userSelect: 'none',
        }}
      />

      {/* ── View toggle: 3D / 2D (left column, dev mode only) ───────────────── */}
      {devMode && <ViewToggle viewMode={viewMode} onToggle={() => setViewMode((m) => (m === '3d' ? '2d' : '3d'))} />}

      {/* ── Raw JSON editor (right side, dev mode only) ──────────────────────── */}
      {devMode && <LayoutEditor layout={layout} onApply={(next) => setLayout(normalizeLayout(next))} />}

      {/* ── Title bar (top-left) ─────────────────────────────────────────────── */}
      <img
        src="/prime_logo.png"
        alt="PRIME3D"
        style={{
          position: 'absolute',
          top: 16,
          left: 16,
          height: 36,
          width: 'auto',
          objectFit: 'contain',
          pointerEvents: 'none',
          zIndex: 5,
        }}
      />

      {/* ── Search + TrackID toggle (top-right) ──────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          zIndex: 6,
        }}
      >
        {/* Not-found 토스트 */}
        {notFound && (
          <div style={{
            position: 'absolute',
            top: 48,
            right: 0,
            background: 'rgba(185,28,28,0.92)',
            color: '#fecaca',
            fontFamily: 'monospace',
            fontSize: 11,
            fontWeight: 700,
            padding: '5px 12px',
            borderRadius: 6,
            whiteSpace: 'nowrap',
            animation: 'toast-fade 1.8s ease forwards',
            pointerEvents: 'none',
            zIndex: 20,
          }}>
            ✕ Unit ID not found
          </div>
        )}
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            value={searchUnitId}
            onChange={(e) => { setSearchUnitId(e.target.value); if (notFound) setNotFound(false); }}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
            placeholder="Search UnitID"
            style={{
              width: 160,
              padding: '6px 10px',
              borderRadius: 6,
              border: notFound ? '1px solid #f87171' : '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(15,20,30,0.85)',
              color: '#e2e8f0',
              fontFamily: 'monospace',
              fontSize: 12,
              animation: notFound ? 'input-shake 0.4s ease' : 'none',
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
        <label
          title="Show TrackID labels"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 6,
            padding: '5px 8px',
            borderRadius: 6,
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(15,20,30,0.85)',
            color: showTrackIds ? '#bee3f8' : '#94a3b8',
            fontFamily: 'monospace',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            userSelect: 'none',
            width: 'fit-content',
            alignSelf: 'flex-end',
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
      </div>


      {/* ── Designer mode button (bottom-right, dev mode only) ───────────────── */}
      {devMode && (
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
      )}
    </div>
  );
}

export default App;
