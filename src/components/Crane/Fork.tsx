/**
 * Fork — slides along the Y axis to insert into the rack cell.
 * Z-up convention: racks are at ±Y from the crane aisle.
 * forkExtension: -1 = rear rack (−Y), 0 = retracted, +1 = front rack (+Y)
 */
import { useSpring, animated } from '@react-spring/three';
import { useWarehouseStore } from '../../store/useWarehouseStore';

interface ForkProps {
  craneId: string;
  maxExtension: number;
}

const FORK_COLOR  = '#e2b96b';
const TINE_COLOR  = '#c8992a';
const FORK_W      = 0.50;
const FORK_BODY_H = 0.07;  // height in Z
const FORK_BODY_D = 0.55;  // depth along Y (extension direction)
const TINE_W      = 0.06;
const TINE_H      = 0.04;

export function Fork({ craneId, maxExtension }: ForkProps) {
  const forkExtension = useWarehouseStore((s) => s.craneStates[craneId]?.forkExtension ?? 0);
  const targetY = forkExtension * maxExtension;

  const { posY } = useSpring({
    posY: targetY,
    config: { tension: 110, friction: 22 },
  });

  const tineOffsets = [-FORK_W / 2 + TINE_W / 2 + 0.04, FORK_W / 2 - TINE_W / 2 - 0.04];

  return (
    // @ts-ignore animated.group JSX prop
    <animated.group position-y={posY}>
      {/* Fork platform body — lies in XY plane */}
      <mesh>
        <boxGeometry args={[FORK_W, FORK_BODY_D, FORK_BODY_H]} />
        <meshStandardMaterial color={FORK_COLOR} metalness={0.65} roughness={0.30} />
      </mesh>

      {/* Two tines protruding in Y direction, hanging below (−Z) */}
      {tineOffsets.map((tx) => (
        <mesh key={tx} position={[tx, FORK_BODY_D * 0.3, -FORK_BODY_H / 2 - TINE_H / 2]}>
          <boxGeometry args={[TINE_W, FORK_BODY_D * 1.2, TINE_H]} />
          <meshStandardMaterial color={TINE_COLOR} metalness={0.7} roughness={0.25} />
        </mesh>
      ))}
    </animated.group>
  );
}
