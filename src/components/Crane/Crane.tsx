/**
 * Crane — AS/RS stacker crane.
 *
 * Z-up coordinate convention:
 *  • Rail runs along X (bay axis)
 *  • Racks are at ±Y from the crane aisle (Y = floor depth)
 *  • Fork extends in ±Y to reach the racks
 *  • Mast and carriage travel along Z (height)
 *
 * railPosition is the world-space aisle centre (crane origin).
 */
import { useCallback } from 'react';
import { useSpring, animated } from '@react-spring/three';
import { useWarehouseStore } from '../../store/useWarehouseStore';
import { CRANE_STATUS_COLORS } from '../../utils/colors';
import type { CraneConfig, LayoutConfig } from '../../config/types';
import { getCraneRailLength, getCraneRailXRange, getForkMaxExtension, getRackHeight } from '../../config/layoutGeometry';
import { Fork } from './Fork';

interface CraneProps {
  config: CraneConfig;
  layout: LayoutConfig;
}

const RAIL_H    = 0.14;
const RAIL_D    = 0.18;
const MAST_W    = 0.20;
const CAR_W     = 0.48;
const CAR_H     = 0.36;
const CAR_D     = 0.36;
const RAIL_COL  = '#eff2f3';
const MAST_COL  = '#546e7a';
const CAR_COL   = '#607d8b';

export function Crane({ config, layout }: CraneProps) {
  const { id, railPosition, rackIds } = config;

  const craneState  = useWarehouseStore((s) => s.craneStates[id]);
  const sel         = useWarehouseStore((s) => s.selectedObject);
  const setSelected = useWarehouseStore((s) => s.setSelectedObject);
  const statusColor = CRANE_STATUS_COLORS[craneState?.status ?? 'idle'];
  const isSelected  = sel?.type === 'crane' && sel.id === id;

  const onClick = useCallback(
    (e: { stopPropagation: () => void }) => {
      e.stopPropagation();
      setSelected(isSelected ? null : { type: 'crane', id });
    },
    [id, isSelected, setSelected],
  );

  const pairedRacks = rackIds
    .map((rid) => layout.racks.find((r) => r.id === rid)!)
    .filter(Boolean);    

  const railLength = getCraneRailLength(config, layout);

  const mastHeight = pairedRacks.length
    ? Math.max(...pairedRacks.map((r) => getRackHeight(r))) + 0.5
    : 6;

  // Fork max extension: distance from crane aisle centre to rack face along Y
  // Racks are at ±Y (was ±Z in Y-up layout) — use position[1] for Y in Z-up
  const forkMaxExtension = getForkMaxExtension(config, layout);

  const [minX, maxX] = getCraneRailXRange(config, layout);
  const xRange = Math.max(maxX - minX - CAR_W, 0.1);
  const zMax   = mastHeight - CAR_H;

  const { carriageX, carriageZ } = useSpring({
    carriageX: minX - railPosition[0] + CAR_W / 2 + (craneState?.xPosition ?? 0) * xRange,
    carriageZ: (craneState?.yPosition  ?? 0) * zMax + CAR_H / 2,
    config: { tension: 75, friction: 26 },
  });

  return (
    <group position={railPosition}>
      {/* Ground rail — lies along X in XY floor plane */}
      <mesh position={[0, 0, RAIL_H / 2]}>
        <boxGeometry args={[railLength, RAIL_D, RAIL_H]} />
        <meshStandardMaterial color={RAIL_COL} metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Mast + carriage move along X rail */}
      {/* @ts-ignore animated.group JSX prop */}
      <animated.group position-x={carriageX}>
        {/* Vertical mast column — extends along Z (height) */}
        <mesh position={[0, 0, mastHeight / 2]}>
          <boxGeometry args={[MAST_W, MAST_W, mastHeight]} />
          <meshStandardMaterial color={MAST_COL} metalness={0.6} roughness={0.3} />
        </mesh>

        {/* Carriage slides up/down the mast (along Z) */}
        {/* @ts-ignore animated.group JSX prop */}
        <animated.group position-z={carriageZ}>
          {/* Carriage body — clickable */}
          <mesh onClick={onClick}>
            <boxGeometry args={[CAR_W, CAR_D, CAR_H]} />
            <meshStandardMaterial
              color={isSelected ? '#90cdf4' : CAR_COL}
              emissive={isSelected ? '#90cdf4' : '#000000'}
              emissiveIntensity={isSelected ? 0.35 : 0}
              metalness={0.5} roughness={0.4}
            />
          </mesh>

          {/* Status indicator light (above carriage in Z) */}
          <mesh position={[0, 0, CAR_H / 2 + 0.09]}>
            <sphereGeometry args={[0.09, 8, 8]} />
            <meshStandardMaterial
              color={statusColor}
              emissive={statusColor}
              emissiveIntensity={0.9}
            />
          </mesh>

          {/* Fork extends ±Y toward racks */}
          <Fork craneId={id} maxExtension={forkMaxExtension} />
        </animated.group>
      </animated.group>
    </group>
  );
}
