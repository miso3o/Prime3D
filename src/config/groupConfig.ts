/**
 * groupConfig.ts — Group definitions for track color coding.
 *
 * Groups are independent of floors/layers. A track's groupId determines its
 * display color in both 2D and 3D views. Non-track objects are not affected
 * by group colors.
 *
 * Group ID corresponds to the first digit of a track's unitId
 * (e.g. unitId "1100" → Group 1, "5201" → Group 5).
 */

export type GroupId = '1' | '2' | '3' | '4' | '5' | '6' | '7';

export interface GroupDef {
  id: GroupId;
  name: string;      // long display name
  shortName: string; // short label for UI
  color: string;     // fill color for 3D and 2D track rendering
  stroke: string;    // stroke/border color for 2D track rendering
}

export const GROUP_DEFS: GroupDef[] = [
  { id: '1', name: 'Group 1', shortName: 'G1', color: '#93c5fd', stroke: '#2563eb' },
  { id: '2', name: 'Group 2', shortName: 'G2', color: '#67e8f9', stroke: '#0891b2' },
  { id: '3', name: 'Group 3', shortName: 'G3', color: '#6ee7b7', stroke: '#059669' },
  { id: '4', name: 'Group 4', shortName: 'G4', color: '#c4b5fd', stroke: '#7c3aed' },
  { id: '5', name: 'Group 5', shortName: 'G5', color: '#fcd34d', stroke: '#b45309' },
  { id: '6', name: 'Group 6', shortName: 'G6', color: '#fca5a5', stroke: '#dc2626' },
  { id: '7', name: 'Group 7', shortName: 'G7', color: '#f9a8d4', stroke: '#be185d' },
];

/** Return the GroupDef by its id (e.g. '1', '5'). */
export function getGroupById(groupId: string): GroupDef | undefined {
  return GROUP_DEFS.find((g) => g.id === groupId);
}

/**
 * Return the GroupDef for a unitId by its first digit.
 * e.g. "1100" → Group 1, "5201" → Group 5.
 */
export function getGroupForUnitId(unitId: string): GroupDef | undefined {
  const firstDigit = unitId?.[0] as GroupId | undefined;
  return firstDigit ? GROUP_DEFS.find((g) => g.id === firstDigit) : undefined;
}
