import { CELL_COLORS, TRACK_COLORS } from '../../utils/colors';
import type { CellStatus, TrackSegmentStatus } from '../../config/types';

export function Legend() {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 16,
        left: 16,
        background: 'rgba(15,20,30,0.82)',
        borderRadius: 8,
        padding: '10px 14px',
        color: '#e2e8f0',
        fontSize: 12,
        fontFamily: 'monospace',
        backdropFilter: 'blur(6px)',
        border: '1px solid rgba(255,255,255,0.08)',
        minWidth: 160,
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 11, letterSpacing: 1, color: '#90cdf4' }}>
        CELL STATUS
      </div>
      {(Object.entries(CELL_COLORS) as [CellStatus, string][]).map(([status, color]) => (
        <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <div style={{ width: 12, height: 12, borderRadius: 3, background: color, flexShrink: 0 }} />
          <span style={{ textTransform: 'capitalize' }}>{status}</span>
        </div>
      ))}

      <div style={{ fontWeight: 700, marginTop: 12, marginBottom: 8, fontSize: 11, letterSpacing: 1, color: '#90cdf4' }}>
        TRACK STATUS
      </div>
      {(Object.entries(TRACK_COLORS) as [TrackSegmentStatus, string][]).map(([status, color]) => (
        <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <div style={{ width: 12, height: 12, borderRadius: 3, background: color, flexShrink: 0 }} />
          <span style={{ textTransform: 'capitalize' }}>{status}</span>
        </div>
      ))}
    </div>
  );
}
