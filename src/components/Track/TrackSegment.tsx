import { useCallback } from 'react';
import type { TrackSegmentConfig } from '../../config/types';
import { useWarehouseStore } from '../../store/useWarehouseStore';
import { trackSegKey } from '../../config/types';
import { TRACK_COLORS } from '../../utils/colors';

interface TrackSegmentProps {
  trackId: string;
  config: TrackSegmentConfig;
  position: [number, number, number];
  size: [number, number];
  rotationY?: number;
}

const SEGMENT_THICKNESS = 0.08;
const ROLLER_COLOR = '#90a4ae';

export function TrackSegment({ trackId, config, position, size, rotationY = 0 }: TrackSegmentProps) {
  const key    = trackSegKey(trackId, config.id);
  const status = useWarehouseStore((s) => s.trackSegmentStatuses[key] ?? 'idle');
  const sel    = useWarehouseStore((s) => s.selectedObject);
  const setSelected = useWarehouseStore((s) => s.setSelectedObject);

  const isSelected  = sel?.type === 'track' && sel.trackId === trackId && sel.segmentId === config.id;
  const color = TRACK_COLORS[status];
  const isHomeStand = config.type === 'HomeStand';

  const onClick = useCallback(
    (e: { stopPropagation: () => void }) => {
      e.stopPropagation();
      setSelected(
        isSelected ? null : { type: 'track', trackId, segmentId: config.id },
      );
    },
    [trackId, config.id, isSelected, setSelected],
  );

  const [len, width] = size;

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Base plate — clickable */}
      <mesh position={[0, SEGMENT_THICKNESS / 2, 0]}     
        onClick={onClick}>
        <boxGeometry args={[len, SEGMENT_THICKNESS, width]} />
        <meshStandardMaterial
          color={color}
          emissive={isSelected ? '#ffffff' : color}
          emissiveIntensity={isSelected ? 0.3 : 0.15}
          roughness={0.7}
          metalness={0.2}
        />
      </mesh>

      {/* HomeStand highlight */}
      {isHomeStand && (
        <mesh position={[0, SEGMENT_THICKNESS + 0.005, 0]}>
          <boxGeometry args={[len - 0.05, 0.01, width - 0.05]} />
          <meshStandardMaterial color="#f6e05e" emissive="#f6e05e" emissiveIntensity={0.5} />
        </mesh>
      )}

      {/* Rollers */}
      {Array.from({ length: Math.round(len / 0.2) }).map((_, i) => (
        <mesh
          key={i}
          position={[-len / 2 + 0.1 + i * 0.2, SEGMENT_THICKNESS + 0.02, 0]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <cylinderGeometry args={[0.02, 0.02, width * 0.85, 6]} />
          <meshStandardMaterial color={ROLLER_COLOR} metalness={0.6} roughness={0.3} />
        </mesh>
      ))}

      {/* Side rails */}
      {[-width / 2 + 0.03, width / 2 - 0.03].map((z) => (
        <mesh key={z} position={[0, SEGMENT_THICKNESS + 0.05, z]}>
          <boxGeometry args={[len, 0.05, 0.04]} />
          <meshStandardMaterial color="#546e7a" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
}
