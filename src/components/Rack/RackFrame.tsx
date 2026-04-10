import { useMemo } from 'react';
import type { RackConfig } from '../../config/types';
import { getRackDepth, getRackHeight, getRackLength } from '../../config/layoutGeometry';

interface RackFrameProps {
  config: RackConfig;
}

// Shelf-style rack: uprights at every bay edge + horizontal shelf boards at every level
// Z-up coordinate system: X=bay axis, Y=bank depth, Z=height
const UPRIGHT_W   = 0.06;
const UPRIGHT_COL = '#5a6e7e';
const SHELF_H     = 0.055;
const SHELF_COL   = '#607d8b';
const BASE_H      = 0.10;
const ENDPANEL_W  = 0.05;

export function RackFrame({ config }: RackFrameProps) {
  const { bays, levels, cellWidth } = config;

  const totalW = getRackLength(config);
  const totalH = getRackHeight(config);
  const totalD = getRackDepth(config);
  const cellHeight = totalH / Math.max(levels, 1);

  const elements = useMemo(() => {
    const items: React.ReactElement[] = [];

    // ── Vertical uprights (one per bay boundary) ──────────────────────────────
    // Z-up: upright spans full Y depth and full Z height
    for (let b = 0; b <= bays; b++) {
      const x = b * cellWidth - totalW / 2;
      items.push(
        <mesh key={`up-${b}`} position={[x, 0, totalH / 2]}>
          <boxGeometry args={[UPRIGHT_W, totalD, totalH]} />
          <meshStandardMaterial color={UPRIGHT_COL} metalness={0.55} roughness={0.35} />
        </mesh>,
      );
    }

    // ── Horizontal shelf boards (floor + one per level) ──────────────────────
    // Z-up: shelves lie in XY plane at height Z
    for (let lv = 0; lv <= levels; lv++) {
      const z   = lv * cellHeight;
      const col = lv === 0 ? '#455a64' : SHELF_COL;
      const h   = lv === 0 ? BASE_H : SHELF_H;
      items.push(
        <mesh key={`sh-${lv}`} position={[0, 0, z + h / 2]}>
          <boxGeometry args={[totalW, totalD, h]} />
          <meshStandardMaterial color={col} metalness={0.4} roughness={0.5} />
        </mesh>,
      );
    }

    // ── Side end-panels at ±X edges ──────────────────────────────────────────
    for (const sx of [-totalW / 2 - ENDPANEL_W / 2, totalW / 2 + ENDPANEL_W / 2]) {
      items.push(
        <mesh key={`ep-${sx}`} position={[sx, 0, totalH / 2]}>
          <boxGeometry args={[ENDPANEL_W, totalD, totalH]} />
          <meshStandardMaterial color="#37474f" metalness={0.5} roughness={0.4} />
        </mesh>,
      );
    }

    // ── Back walls on ±Y faces ────────────────────────────────────────────────
    for (const sign of [-1, 1]) {
      items.push(
        <mesh key={`bw-${sign}`} position={[0, sign * (totalD / 2 - 0.01), totalH / 2]}>
          <boxGeometry args={[totalW, 0.022, totalH]} />
          <meshStandardMaterial color="#263238" roughness={0.8} transparent opacity={0.55} />
        </mesh>,
      );
    }

    return items;
  }, [bays, levels, cellWidth, cellHeight, totalW, totalH, totalD]);

  return <group>{elements}</group>;
}
