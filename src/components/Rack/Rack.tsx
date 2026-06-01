import { useCallback, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { RackConfig } from '../../config/types';
import { getRackCellHeight, getRackDepth, getRackHeight, getRackLength } from '../../config/layoutGeometry';
import { useWarehouseStore } from '../../store/useWarehouseStore';
import { RackFrame } from './RackFrame';
import { RackCell } from './RackCell';

interface RackProps {
  config: RackConfig;
  highlighted?: boolean;
}

export function Rack({ config, highlighted = false }: RackProps) {
  const { id, position, banks, bays, levels, cellWidth, cellDepth } = config;
  const selected = useWarehouseStore((s) => s.selectedObject);
  const setSelected = useWarehouseStore((s) => s.setSelectedObject);
  const isSelected = selected?.type === 'rack' && selected.id === id;
  const haloRef = useRef<THREE.MeshStandardMaterial>(null);

  const totalW = getRackLength(config);
  const totalH = getRackHeight(config);
  const totalD = getRackDepth(config);
  const cellHeight = getRackCellHeight(config);

  useFrame(({ clock }) => {
    if (!highlighted || !haloRef.current) return;
    haloRef.current.opacity = 0.25 + 0.25 * Math.abs(Math.sin(clock.getElapsedTime() * 5));
    haloRef.current.emissiveIntensity = 1.5 + 0.5 * Math.abs(Math.sin(clock.getElapsedTime() * 5));
  });

  const cells = [];
  for (let bk = 0; bk < banks; bk++) {
    for (let b = 0; b < bays; b++) {
      for (let lv = 0; lv < levels; lv++) {
        const cx = b * cellWidth - totalW / 2 + cellWidth / 2;
        const cy = bk * cellDepth - totalD / 2 + cellDepth / 2;
        const cz = lv * cellHeight + cellHeight / 2;
        cells.push(
          <RackCell
            key={`${bk}-${b}-${lv}`}
            rackId={id}
            bank={bk}
            bay={b}
            level={lv}
            position={[cx, cy, cz]}
            size={[cellWidth, cellHeight, cellDepth]}
          />,
        );
      }
    }
  }

  const onClick = useCallback(
    (e: { stopPropagation: () => void }) => {
      e.stopPropagation();
      setSelected(isSelected ? null : { type: 'rack', id });
    },
    [id, isSelected, setSelected],
  );

  return (
    <group position={position} onClick={onClick}>
      <RackFrame config={config} />
      {cells}
      {/* Highlight halo — pulsing orange overlay when crane is selected */}
      {highlighted && (
        <>
          {/* 외부 glow 레이어 */}
          <mesh position={[0, 0, totalH / 2]}>
            <boxGeometry args={[totalW + 0.35, totalD + 0.35, totalH + 0.35]} />
            <meshStandardMaterial
              ref={haloRef}
              color="#ff5400"
              emissive="#ff5400"
              emissiveIntensity={2}
              transparent
              opacity={0.3}
              depthWrite={false}
            />
          </mesh>
          {/* 엣지 라인 강조 — 조금 더 작은 wireframe */}
          <mesh position={[0, 0, totalH / 2]}>
            <boxGeometry args={[totalW + 0.08, totalD + 0.08, totalH + 0.08]} />
            <meshBasicMaterial
              color="#ff5400"
              transparent
              opacity={0.7}
              depthWrite={false}
              wireframe
            />
          </mesh>
        </>
      )}
    </group>
  );
}
