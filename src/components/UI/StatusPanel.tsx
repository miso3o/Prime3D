import { useWarehouseStore } from '../../store/useWarehouseStore';
import { CRANE_STATUS_COLORS } from '../../utils/colors';
import type { LayoutConfig } from '../../config/types';

interface StatusPanelProps {
  layout: LayoutConfig;
}

export function StatusPanel({ layout }: StatusPanelProps) {
  const craneStates = useWarehouseStore((s) => s.craneStates);

  return (
    <div
      style={{
        position: 'absolute',
        top: 16,
        right: 16,
        background: 'rgba(15,20,30,0.85)',
        borderRadius: 8,
        padding: '12px 16px',
        color: '#e2e8f0',
        fontSize: 12,
        fontFamily: 'monospace',
        backdropFilter: 'blur(6px)',
        border: '1px solid rgba(255,255,255,0.08)',
        minWidth: 200,
        maxWidth: 250,
        maxHeight: 'calc(100vh - 32px)',
        overflowY: 'auto',
      }}
    >
      <div style={{ fontWeight: 700, fontSize: 11, letterSpacing: 1, color: '#90cdf4', marginBottom: 10 }}>
        PRIME3D MONITOR
      </div>

      <div style={{ color: '#718096', fontSize: 11, marginBottom: 10 }}>
        Click any object to inspect
      </div>

      {/* Crane summary list */}
      <div style={{ fontWeight: 700, fontSize: 11, letterSpacing: 1, color: '#90cdf4', marginBottom: 8 }}>
        CRANES
      </div>
      {layout.cranes.map((c) => {
        const cs = craneStates[c.id];
        const statusColor = CRANE_STATUS_COLORS[cs?.status ?? 'idle'];
        return (
          <div key={c.id} style={{ marginBottom: 7 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#cbd5e0' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: statusColor, display: 'inline-block', flexShrink: 0 }} />
              {c.id}
            </div>
            {cs && (
              <div style={{ color: '#4a5568', paddingLeft: 13, fontSize: 11 }}>
                {cs.status} · X {(cs.xPosition * 100).toFixed(0)}% · Y {(cs.yPosition * 100).toFixed(0)}%
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
