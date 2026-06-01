/**
 * layerConfig.ts — floor definitions and Z-height mapping.
 *
 * Layer ID = Floor ID. There are exactly 4 layers, one per physical floor.
 * Objects reference a layerId to indicate which floor they belong to.
 * Group assignment (color) is handled separately in groupConfig.ts.
 *
 * ┌─────────────────────────────────────────┐
 * │  Floor    layerId   worldZ              │
 * │  7F       7F         0 m  (main level)  │
 * │  6F       6F        -5 m  (level below) │
 * │  GRD 1F   GRD1F      0 m  (grader low)  │
 * │  GRD 2F   GRD2F     +2.5 m (grader high)│
 * └─────────────────────────────────────────┘
 */

export type FloorId = '7F' | '6F' | 'GRD1F' | 'GRD2F';

export interface FloorDef {
  id: FloorId;
  name: string;      // long display name
  shortName: string; // short label for UI tab buttons
  worldZ: number;    // Z-axis base elevation (metres, Z-up convention)
  color: string;     // accent color for UI
}

export const FLOOR_DEFS: FloorDef[] = [
  { id: '6F',    name: 'Ground Floor',        shortName: 'GF',      worldZ: -5,   color: '#fca5a5' },
  { id: '7F',    name: 'Formation Floor',      shortName: 'FF',      worldZ:  0,   color: '#90cdf4' },
  { id: 'GRD1F', name: 'Grader 1st Floor',   shortName: 'GRD 1F',  worldZ:  0,   color: '#6ee7b7' },
  { id: 'GRD2F', name: 'Grader 2nd Floor',   shortName: 'GRD 2F',  worldZ:  2.5, color: '#6ee7b7' },
];

/** Flat lookup: layerId → FloorDef. Since layer IDs equal floor IDs this is a direct map. */
export const LAYER_FLOOR_MAP: Readonly<Record<string, FloorDef>> = Object.fromEntries(
  FLOOR_DEFS.map((f) => [f.id, f]),
);

/** Return the 3D Z-base elevation for a layer (default 0 if unknown). */
export function getLayerZ(layerId: string): number {
  return LAYER_FLOOR_MAP[layerId]?.worldZ ?? 0;
}

/** Return the FloorDef for a layerId, or undefined if unknown. */
export function getFloorForLayer(layerId: string): FloorDef | undefined {
  return LAYER_FLOOR_MAP[layerId];
}

/** Vertical span between highest and lowest floor (metres). */
export const INTER_FLOOR_SPAN =
  Math.max(...FLOOR_DEFS.map((f) => f.worldZ)) -
  Math.min(...FLOOR_DEFS.map((f) => f.worldZ));
