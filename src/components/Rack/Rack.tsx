import { useCallback } from 'react';
import type { RackConfig } from '../../config/types';
import { getRackCellHeight, getRackDepth, getRackHeight, getRackLength } from '../../config/layoutGeometry';
import { useWarehouseStore } from '../../store/useWarehouseStore';
import { RackFrame } from './RackFrame';
import { RackCell } from './RackCell';

interface RackProps {
  config: RackConfig;
}

export function Rack({ config }: RackProps) {
  const { id, position, banks, bays, levels, cellWidth, cellDepth } = config;
  const selected = useWarehouseStore((s) => s.selectedObject);
  const setSelected = useWarehouseStore((s) => s.setSelectedObject);
  const isSelected = selected?.type === 'rack' && selected.id === id;

  const totalW = getRackLength(config);
  const totalH = getRackHeight(config);
  const totalD = getRackDepth(config);
  const cellHeight = getRackCellHeight(config);

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
      {/* Label */}
      {/* We avoid @react-three/drei Text here to keep deps simple; label in UI overlay */}
    </group>
  );
}
