interface ViewToggleProps {
  viewMode: '3d' | '2d';
  onToggle: () => void;
}

export function ViewToggle({ viewMode, onToggle }: ViewToggleProps) {
  const btn = (mode: '3d' | '2d') => ({
    width: 40,
    height: 40,
    border: 'none',
    cursor: viewMode === mode ? 'default' : 'pointer',
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 1,
    background: viewMode === mode ? '#2b6cb0' : 'transparent',
    color: viewMode === mode ? '#bee3f8' : '#718096',
    transition: 'background .2s, color .2s',
  });

  return (
    <div
      style={{
        position: 'absolute',
        top: 62,
        left: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
        borderRadius: 7,
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.12)',
        background: 'rgba(15,20,30,0.85)',
        backdropFilter: 'blur(6px)',
        zIndex: 5,
      }}
    >
      <button onClick={() => viewMode !== '3d' && onToggle()} style={btn('3d')}>3D</button>
      <div style={{ height: 1, background: 'rgba(255,255,255,0.10)' }} />
      <button onClick={() => viewMode !== '2d' && onToggle()} style={btn('2d')}>2D</button>
    </div>
  );
}
