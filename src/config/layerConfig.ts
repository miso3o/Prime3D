/**
 * layerConfig.ts — centralized floor-layer mapping and Z-height definitions.
 *
 * The warehouse spans multiple physical floor levels.
 * Each FP layer ID belongs to exactly one floor.
 * In 3D (Z-up), objects on a given floor are offset by that floor's worldZ.
 *
 * ┌──────────────────────────────────────────────────────────┐
 * │  Floor          worldZ   Layers                          │
 * │  GRD 2nd Floor   +8 m    G5 (Grader area, upper gallery) │
 * │  7th Floor         0 m   G1 G2 G3 G4 G7  (main level)   │
 * │  6th Floor        -5 m   G6               (level below)  │
 * └──────────────────────────────────────────────────────────┘
 *
 * To change the mapping, edit FLOOR_DEFS below — no other file needs updating.
 */

export type FloorId = '7F' | '6F' | 'GRD2F';

export interface FloorDef {
  id: FloorId;
  name: string;        // long display name
  shortName: string;   // short label for UI tab buttons
  worldZ: number;      // Z-axis base elevation (metres, Z-up convention)
  layerIds: string[];  // FP layer IDs that belong to this floor
  color: string;       // accent color for UI
}

/**
 * FLOOR_DEFS — edit this to configure floor heights and layer membership.
 *
 * Layer ID → name mapping for reference:
 *   layer_mncrxsud = G1   layer_mncs2tlq = G2   layer_mncs2zk3 = G3
 *   layer_mncs35c8 = G4   layer_mncs3a33 = G5   layer_mncs3e54 = G6
 *   layer_mncs3hsr = G7
 */
export const FLOOR_DEFS: FloorDef[] = [
  {
    id: 'GRD2F',
    name: 'Grader 2nd Floor',
    shortName: 'GRD 2F',
    worldZ: 8,
    layerIds: ['layer_mncs3a33'],   // G5 — amber
    color: '#6ee7b7',
  },
  {
    id: '7F',
    name: '7th Floor',
    shortName: '7F',
    worldZ: 0,
    layerIds: [
      'layer_mncrxsud',  // G1 — blue
      'layer_mncs2tlq',  // G2 — cyan
      'layer_mncs2zk3',  // G3 — green
      'layer_mncs35c8',  // G4 — purple
      'layer_mncs3hsr',  // G7 — pink
    ],
    color: '#90cdf4',
  },
  {
    id: '6F',
    name: '6th Floor',
    shortName: '6F',
    worldZ: -5,
    layerIds: ['layer_mncs3e54'],   // G6 — red
    color: '#fca5a5',
  },
];

/** Flat lookup: layerId → FloorDef (built once at module load). */
export const LAYER_FLOOR_MAP: Readonly<Record<string, FloorDef>> = Object.fromEntries(
  FLOOR_DEFS.flatMap((f) => f.layerIds.map((id) => [id, f])),
);

/** Return the 3D Z-base elevation for a layer (default 0 if not in any floor). */
export function getLayerZ(layerId: string): number {
  return LAYER_FLOOR_MAP[layerId]?.worldZ ?? 0;
}

/** Return the FloorDef a layer belongs to, or undefined if unmapped. */
export function getFloorForLayer(layerId: string): FloorDef | undefined {
  return LAYER_FLOOR_MAP[layerId];
}

/**
 * Vertical gap between the highest and lowest floor (metres).
 * Used by Lift track rendering to span the full floor-to-floor distance.
 */
export const INTER_FLOOR_SPAN =
  Math.max(...FLOOR_DEFS.map((f) => f.worldZ)) -
  Math.min(...FLOOR_DEFS.map((f) => f.worldZ));
