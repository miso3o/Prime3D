import { useCallback } from 'react';
import { useWarehouseStore } from '../../store/useWarehouseStore';
import { cellKey } from '../../config/types';
import { CELL_COLORS } from '../../utils/colors';

interface RackCellProps {
  rackId: string;
  bank: number;
  bay: number;
  level: number;
  position: [number, number, number];
  size: [number, number, number];
}

const PAD_X = 0.12;
const PAD_Y = 0.10;
const ITEM_H_RATIO = 0.60;
const FLOOR_OFFSET = 0.028;

export function RackCell({ rackId, bank, bay, level, position, size }: RackCellProps) {
  const key = cellKey(rackId, bank, bay, level);
  const status = useWarehouseStore((s) => s.cellStates[key] ?? 'empty');
  const sel = useWarehouseStore((s) => s.selectedObject);
  const setSelected = useWarehouseStore((s) => s.setSelectedObject);

  const isSelected = sel?.type === 'cell' && sel.key === key;

  const onClick = useCallback(
    (e: { stopPropagation: () => void }) => {
      e.stopPropagation();
      setSelected(
        isSelected ? null : { type: 'cell', key, rackId, bank, bay, level },
      );
    },
    [key, rackId, bank, bay, level, isSelected, setSelected],
  );

  if (status === 'empty') {
    if (!isSelected) return null;
    const [cw, ch, cd] = size;
    return (
      <mesh position={position} onClick={onClick}>
        <boxGeometry args={[cw - PAD_X, cd - PAD_Y, ch * 0.04]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.6} transparent opacity={0.5} />
      </mesh>
    );
  }

  const color = CELL_COLORS[status];
  const [cw, ch, cd] = size;
  const itemW = cw - PAD_X;
  const itemD = cd - PAD_Y;
  const itemH = ch * ITEM_H_RATIO;
  const itemZ = position[2] - ch / 2 + FLOOR_OFFSET + itemH / 2;
  const emissiveIntensity = isSelected ? 0.45 : (status === 'error' ? 0.25 : 0.1);

  return (
    <group onClick={onClick}>
      <mesh position={[position[0], position[1], itemZ]}>
        <boxGeometry args={[itemW, itemD, itemH]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={emissiveIntensity} roughness={0.55} metalness={0.05} />
      </mesh>
      <mesh position={[position[0], position[1], itemZ - itemH / 2 + 0.01]}>
        <boxGeometry args={[itemW, itemD, 0.02]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.05} roughness={0.3} />
      </mesh>
      {isSelected && (
        <mesh position={[position[0], position[1], itemZ]}>
          <boxGeometry args={[itemW + 0.04, itemD + 0.04, itemH + 0.04]} />
          <meshStandardMaterial color="#ffffff" wireframe />
        </mesh>
      )}
    </group>
  );
}
