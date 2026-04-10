/**
 * ViewToggle.tsx — switches between 3D perspective view and 2D top-down view.
 *
 * In 2D mode: the camera moves directly overhead and orbit rotation is disabled.
 *             The scene still renders the same JSON-driven objects but flat from above.
 * In 3D mode: standard orbit perspective view is restored.
 *
 * This is a pure UI control; the actual camera behavior is managed in Scene.tsx
 * by reading the viewMode prop.
 */

interface ViewToggleProps {
  viewMode: '3d' | '2d';
  onToggle: () => void;
}

export function ViewToggle({ viewMode, onToggle }: ViewToggleProps) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: 0,
        borderRadius: 7,
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.12)',
        background: 'rgba(15,20,30,0.85)',
        backdropFilter: 'blur(6px)',
        zIndex: 5,
      }}
    >
      {/* 3D button */}
      <button
        onClick={() => viewMode !== '3d' && onToggle()}
        style={{
          padding: '6px 18px',
          border: 'none',
          cursor: viewMode === '3d' ? 'default' : 'pointer',
          fontFamily: 'monospace',
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: 1,
          background: viewMode === '3d' ? '#2b6cb0' : 'transparent',
          color: viewMode === '3d' ? '#bee3f8' : '#718096',
          transition: 'background .2s, color .2s',
        }}
      >
        3D
      </button>

      {/* Divider */}
      <div style={{ width: 1, background: 'rgba(255,255,255,0.10)' }} />

      {/* 2D button */}
      <button
        onClick={() => viewMode !== '2d' && onToggle()}
        style={{
          padding: '6px 18px',
          border: 'none',
          cursor: viewMode === '2d' ? 'default' : 'pointer',
          fontFamily: 'monospace',
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: 1,
          background: viewMode === '2d' ? '#2b6cb0' : 'transparent',
          color: viewMode === '2d' ? '#bee3f8' : '#718096',
          transition: 'background .2s, color .2s',
        }}
      >
        2D
      </button>
    </div>
  );
}
