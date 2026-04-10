import type { TrackConfig } from '../../config/types';
import { TrackSegment } from './TrackSegment';

interface TrackProps {
  config: TrackConfig;
}

export function Track({ config }: TrackProps) {
  const { id, position, direction, segmentSize, segments } = config;
  const [segLen, segWidth] = segmentSize;

  const rotationY = direction === 'x' ? 0 : Math.PI / 2;

  return (
    <group position={position}>
      {segments.map((seg) => {
        const offset = seg.localIndex * segLen;
        const pos: [number, number, number] =
          direction === 'x' ? [offset, 0, 0] : [0, 0, offset];

        return (
          <TrackSegment
            key={seg.id}
            trackId={id}
            config={seg}
            position={pos}
            size={[segLen, segWidth]}
            rotationY={rotationY}
          />
        );
      })}
    </group>
  );
}