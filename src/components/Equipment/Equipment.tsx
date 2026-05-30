/**
 * Equipment.tsx — renders an industrial equipment object (conveyor, buffer, lift, etc.).
 *
 * Visual style:
 *  - Main body: colored box based on equipment type (see EQUIPMENT_COLORS)
 *  - Top stripe: thin accent stripe indicating equipment type
 *  - Status light: small sphere on top corner
 *  - HTML label: floating name tag above the equipment
 *
 * Interaction:
 *  - Clicking the equipment body selects it in the store → shows SelectionPopup
 *  - Selected state shows emissive highlight
 */
import { useCallback } from 'react';
import { Html } from '@react-three/drei';
import { useWarehouseStore } from '../../store/useWarehouseStore';
import { EQUIPMENT_COLORS } from '../../utils/colors';
import type { EquipmentConfig } from '../../config/types';

interface EquipmentProps {
  config: EquipmentConfig;
  /** When true, this component renders Html labels (disable in 2D for performance) */
  showLabels?: boolean;
}

export function Equipment({ config, showLabels = true }: EquipmentProps) {
  const { id, name, type, position, rotation, size } = config;

  const sel         = useWarehouseStore((s) => s.selectedObject);
  const setSelected = useWarehouseStore((s) => s.setSelectedObject);

  const isSelected = sel?.type === 'equipment' && sel.id === id;
  const colors     = EQUIPMENT_COLORS[type];

  const [w, h, d] = size;
  const rot = rotation ?? [0, 0, 0];

  const onClick = useCallback(
    (e: { stopPropagation: () => void }) => {
      e.stopPropagation();
      setSelected(isSelected ? null : { type: 'equipment', id });
    },
    [id, isSelected, setSelected],
  );

  return (
    <group position={position} rotation={rot as [number, number, number]}>
      {/* Main body — clickable */}
      <mesh position={[0, 0, h / 2]} onClick={onClick}>
        <boxGeometry args={[w, d, h]} />
        <meshStandardMaterial
          color={isSelected ? '#90cdf4' : colors.body}
          emissive={isSelected ? '#90cdf4' : colors.emissive}
          emissiveIntensity={isSelected ? 0.4 : 0.1}
          metalness={0.5}
          roughness={0.45}
        />
      </mesh>

      {/* Accent stripe on top — type indicator band */}
      <mesh position={[0, 0, h + 0.015]}>
        <boxGeometry args={[w, d, 0.03]} />
        <meshStandardMaterial
          color={colors.accent}
          emissive={colors.accent}
          emissiveIntensity={0.3}
          roughness={0.3}
        />
      </mesh>

      {/* Status indicator light (top-left corner) */}
      <mesh position={[-w / 2 + 0.12, -d / 2 + 0.12, h + 0.10]}>
        <sphereGeometry args={[0.07, 8, 8]} />
        <meshStandardMaterial
          color={isSelected ? '#90cdf4' : colors.accent}
          emissive={isSelected ? '#90cdf4' : colors.accent}
          emissiveIntensity={0.7}
        />
      </mesh>

      {/* Corner legs (4x) — visual detail for conveyors/buffers */}
      {(type === 'conveyor' || type === 'buffer' || type === 'input' || type === 'output') &&
        [[-1, -1], [-1, 1], [1, -1], [1, 1]].map(([sx, sz]) => (
          <mesh
            key={`leg-${sx}-${sz}`}
            position={[sx * (w / 2 - 0.06), sz * (d / 2 - 0.06), h / 4]}
          >
            <boxGeometry args={[0.07, 0.07, h / 2]} />
            <meshStandardMaterial color="#37474f" metalness={0.7} roughness={0.3} />
          </mesh>
        ))}

      {/* HTML floating label — only when showLabels=true */}
      {showLabels && (
        <Html
          center
          position={[0, 0, h + 0.55]}
          distanceFactor={22}
          style={{ pointerEvents: 'none' }}
        >
          <div
            style={{
              background: 'rgba(0,0,0,0.72)',
              color: isSelected ? '#90cdf4' : colors.accent,
              fontFamily: 'monospace',
              fontSize: 11,
              fontWeight: 600,
              padding: '2px 7px',
              borderRadius: 4,
              whiteSpace: 'nowrap',
              border: `1px solid ${isSelected ? '#90cdf455' : colors.accent + '44'}`,
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
