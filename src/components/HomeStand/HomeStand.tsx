/**
 * HomeStand.tsx — renders a physical tray staging stand.
 *
 * A HomeStand is where trays wait before being picked up by a crane.
 * Visual style: amber/yellow platform with hazard stripes, raised on short legs.
 * Can be configured as 1 or 2 side-by-side units via the `units` field in JSON.
 *
 * Relationship to Track:
 *  - Track segments with type 'HomeStand' mark the tray POSITION (yellow tile on track)
 *  - HomeStand objects (this component) show the PHYSICAL FRAME/STRUCTURE around that spot
 *  - They are positioned at the same XZ but are visually distinct
 *
 * Interaction:
 *  - Clicking selects the homestand → shows SelectionPopup
 */
import { useCallback } from 'react';
import { Html } from '@react-three/drei';
import { useWarehouseStore } from '../../store/useWarehouseStore';
import {
  HOMESTAND_COLOR,
  HOMESTAND_STRIPE_COLOR,
  HOMESTAND_LEG_COLOR,
} from '../../utils/colors';
import type { HomeStandConfig } from '../../config/types';

interface HomeStandProps {
  config: HomeStandConfig;
  showLabels?: boolean;
}

// ── Sub-component: renders one physical stand unit ─────────────────────────────
function StandUnit({
  offsetX,
  unitSize,
  isSelected,
  onClick,
}: {
  offsetX: number;
  unitSize: [number, number, number];
  isSelected: boolean;
  onClick: (e: { stopPropagation: () => void }) => void;
}) {
  const [uw, uh, ud] = unitSize;
  const LEG_H = 0.22;     // height of support legs
  const STRIPE_W = 0.12;  // width of each hazard stripe

  // Number of hazard stripes across the platform surface
  const stripeCount = Math.floor(uw / (STRIPE_W * 2.2));

  return (
    <group position={[offsetX, 0, 0]}>
      {/* Support legs (4 corners) — Z-up: height along Z */}
      {[[-1, -1], [-1, 1], [1, -1], [1, 1]].map(([sx, sy]) => (
        <mesh
          key={`leg-${sx}-${sy}`}
          position={[sx * (uw / 2 - 0.08), sy * (ud / 2 - 0.08), LEG_H / 2]}
        >
          <boxGeometry args={[0.07, 0.07, LEG_H]} />
          <meshStandardMaterial color={HOMESTAND_LEG_COLOR} metalness={0.6} roughness={0.3} />
        </mesh>
      ))}

      {/* Platform surface — amber base, clickable */}
      <mesh
        position={[0, 0, LEG_H + uh / 2]}
        onClick={onClick}
      >
        <boxGeometry args={[uw, ud, uh]} />
        <meshStandardMaterial
          color={isSelected ? '#90cdf4' : HOMESTAND_COLOR}
          emissive={isSelected ? '#90cdf4' : HOMESTAND_COLOR}
          emissiveIntensity={isSelected ? 0.4 : 0.15}
          metalness={0.3}
          roughness={0.5}
        />
      </mesh>

      {/* Hazard stripes on top of platform */}
      {Array.from({ length: stripeCount }).map((_, i) => {
        const stripeX = -uw / 2 + STRIPE_W + i * (STRIPE_W * 2.2);
        return (
          <mesh
            key={i}
            position={[stripeX, 0, LEG_H + uh + 0.004]}
          >
            <boxGeometry args={[STRIPE_W * 0.7, ud - 0.06, 0.008]} />
            <meshStandardMaterial
              color={HOMESTAND_STRIPE_COLOR}
              emissive={HOMESTAND_STRIPE_COLOR}
              emissiveIntensity={0.4}
              roughness={0.4}
            />
          </mesh>
        );
      })}

      {/* Rim border around platform top */}
      {[
        { p: [0,       ud / 2,  LEG_H + uh + 0.004], s: [uw,  0.04,  0.008] },
        { p: [0,      -ud / 2,  LEG_H + uh + 0.004], s: [uw,  0.04,  0.008] },
        { p: [ uw / 2, 0,       LEG_H + uh + 0.004], s: [0.04, ud,   0.008] },
        { p: [-uw / 2, 0,       LEG_H + uh + 0.004], s: [0.04, ud,   0.008] },
      ].map((rim, i) => (
        <mesh key={i} position={rim.p as [number, number, number]}>
          <boxGeometry args={rim.s as [number, number, number]} />
          <meshStandardMaterial color={HOMESTAND_LEG_COLOR} metalness={0.7} roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function HomeStand({ config, showLabels = true }: HomeStandProps) {
  const { id, name, position, rotation, units, unitSize } = config;

  const sel         = useWarehouseStore((s) => s.selectedObject);
  const setSelected = useWarehouseStore((s) => s.setSelectedObject);

  const isSelected = sel?.type === 'homestand' && sel.id === id;
  const rot = rotation ?? [0, 0, 0];

  const onClick = useCallback(
    (e: { stopPropagation: () => void }) => {
      e.stopPropagation();
      setSelected(isSelected ? null : { type: 'homestand', id });
    },
    [id, isSelected, setSelected],
  );

  // When units=2, space the two platforms side-by-side along X
  const spacing = unitSize[0] + 0.12;
  const offsets = units === 2
    ? [-spacing / 2, spacing / 2]
    : [0];

  const totalH = 0.22 + unitSize[1]; // leg height + platform height

  return (
    <group position={position} rotation={rot as [number, number, number]}>
      {offsets.map((ox) => (
        <StandUnit
          key={ox}
          offsetX={ox}
          unitSize={unitSize}
          isSelected={isSelected}
          onClick={onClick}
        />
      ))}

      {/* Selection wireframe overlay */}
      {isSelected && (
        <mesh position={[0, 0, totalH / 2]}>
          <boxGeometry args={[units * (unitSize[0] + 0.12), unitSize[2] + 0.06, totalH + 0.05]} />
          <meshStandardMaterial color="#90cdf4" wireframe transparent opacity={0.6} />
        </mesh>
      )}

      {/* HTML label */}
      {showLabels && (
        <Html
          center
          position={[0, 0, totalH + 0.45]}
          distanceFactor={20}
          style={{ pointerEvents: 'none' }}
        >
          <div
            style={{
              background: 'rgba(0,0,0,0.72)',
              color: isSelected ? '#90cdf4' : HOMESTAND_STRIPE_COLOR,
              fontFamily: 'monospace',
              fontSize: 11,
              fontWeight: 600,
              padding: '2px 7px',
              borderRadius: 4,
              whiteSpace: 'nowrap',
              border: `1px solid ${isSelected ? '#90cdf455' : '#f6e05e44'}`,
              letterSpacing: 0.5,
            }}
          >
            {name}
          </div>
        </Html>
      )}
    </group>
  );
}
