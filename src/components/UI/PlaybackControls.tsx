import { useWarehouseStore } from '../../store/useWarehouseStore';

const BTN: React.CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: 8,
  border: 'none',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 18,
  transition: 'background .15s, opacity .15s',
  flexShrink: 0,
};

export function PlaybackControls() {
  const isPlaying = useWarehouseStore((s) => s.isPlaying);
  const setPlaying = useWarehouseStore((s) => s.setPlaying);
  const requestViewReset = useWarehouseStore((s) => s.requestViewReset);

  return (
    <div
      style={{
        position: 'absolute',
        left: 16,
        top: '50%',
        transform: 'translateY(-50%)',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        alignItems: 'center',
        background: 'rgba(15,20,30,0.85)',
        borderRadius: 10,
        padding: '8px 6px',
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(6px)',
        zIndex: 5,
      }}
    >
      {/* Reset view */}
      <button
        onClick={() => requestViewReset()}
        title="Reset view"
        style={{ ...BTN, background: 'rgba(45,55,72,0.9)', color: '#90cdf4' }}
      >
        ↺
      </button>

      {/* Play */}
      <button
        onClick={() => setPlaying(true)}
        title="Play"
        style={{
          ...BTN,
          background: isPlaying ? '#276749' : 'rgba(39,103,73,0.4)',
          color: '#c6f6d5',
          opacity: isPlaying ? 1 : 0.6,
        }}
      >
        ▶
      </button>

      {/* Pause */}
      <button
        onClick={() => setPlaying(false)}
        title="Pause"
        style={{
          ...BTN,
          background: !isPlaying ? '#744210' : 'rgba(116,66,16,0.4)',
          color: '#fbd38d',
          opacity: !isPlaying ? 1 : 0.6,
        }}
      >
        ⏸
      </button>

      {/* Status dot */}
      <span
        title={isPlaying ? 'Simulation running' : 'Paused'}
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: isPlaying ? '#68d391' : '#fc8181',
          boxShadow: isPlaying ? '0 0 6px #68d391' : 'none',
          marginTop: 2,
          transition: 'background .2s, box-shadow .2s',
        }}
      />
    </div>
  );
}
