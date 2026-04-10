/**
 * PlaybackControls.tsx — Play / Pause simulation controls.
 *
 * Reads and writes `isPlaying` from the global warehouse store.
 * When paused, useMockData stops all interval-driven state changes so cranes freeze.
 * When resumed, all intervals restart and simulation continues.
 *
 * Position: bottom-center of the viewport (above SelectionPopup).
 */
import { useWarehouseStore } from '../../store/useWarehouseStore';

const BTN: React.CSSProperties = {
  padding: '7px 18px',
  borderRadius: 6,
  border: 'none',
  cursor: 'pointer',
  fontFamily: 'monospace',
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: 1,
  transition: 'opacity .15s, background .15s',
  display: 'flex',
  alignItems: 'center',
  gap: 6,
};

export function PlaybackControls() {
  const isPlaying = useWarehouseStore((s) => s.isPlaying);
  const setPlaying = useWarehouseStore((s) => s.setPlaying);
  const requestViewReset = useWarehouseStore((s) => s.requestViewReset);

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: 6,
        alignItems: 'center',
        background: 'rgba(15,20,30,0.85)',
        borderRadius: 8,
        padding: '6px 10px',
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(6px)',
        zIndex: 5,
      }}
    >
      <button
        onClick={() => requestViewReset()}
        title="Reset 3D camera"
        style={{
          ...BTN,
          background: 'rgba(45,55,72,0.85)',
          color: '#90cdf4',
        }}
      >
        RESET VIEW
      </button>

      <button
        onClick={() => setPlaying(true)}
        title="Resume simulation"
        style={{
          ...BTN,
          background: isPlaying ? '#276749' : 'rgba(39,103,73,0.5)',
          color: '#c6f6d5',
          opacity: isPlaying ? 1 : 0.7,
        }}
      >
        <span style={{ fontSize: 15 }}>▶</span> PLAY
      </button>

      {/* Pause button */}
      <button
        onClick={() => setPlaying(false)}
        title="Pause simulation"
        style={{
          ...BTN,
          background: !isPlaying ? '#744210' : 'rgba(116,66,16,0.5)',
          color: '#fbd38d',
          opacity: !isPlaying ? 1 : 0.7,
        }}
      >
        <span style={{ fontSize: 15 }}>⏸</span> PAUSE
      </button>

      {/* Status indicator */}
      <div
        style={{
          marginLeft: 4,
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          color: '#718096',
          fontFamily: 'monospace',
          fontSize: 11,
        }}
      >
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: isPlaying ? '#68d391' : '#fc8181',
            display: 'inline-block',
            boxShadow: isPlaying ? '0 0 6px #68d391' : 'none',
          }}
        />
        {isPlaying ? 'SIM RUNNING' : 'PAUSED'}
      </div>
    </div>
  );
}
