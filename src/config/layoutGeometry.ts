import { fp2world, fpM, world2fp } from './fp2world';
import { getLayerZ } from './layerConfig';
import type {
  CraneConfig,
  EquipmentConfig,
  FPBox,
  FPTrack,
  LayoutConfig,
  RackConfig,
  SelectedObject,
} from './types';

const DEFAULT_RACK_HEIGHT = 6;
const DEFAULT_RAIL_OFFSET = 0.6;

export function getRackLength(rack: RackConfig): number {
  return rack.length ?? rack.bays * rack.cellWidth;
}

export function getRackHeight(rack: RackConfig): number {
  return rack.fixedHeight ?? DEFAULT_RACK_HEIGHT;
}

export function getRackCellHeight(rack: RackConfig): number {
  return getRackHeight(rack) / Math.max(rack.levels, 1);
}

export function getRackDepth(rack: RackConfig): number {
  return rack.banks * rack.cellDepth;
}

export function getRackBounds(rack: RackConfig) {
  const [x, y, z] = rack.position;
  const length = getRackLength(rack);
  const depth = getRackDepth(rack);
  const height = getRackHeight(rack);
  return {
    minX: x - length / 2,
    maxX: x + length / 2,
    minY: y - depth / 2,
    maxY: y + depth / 2,
    minZ: z,
    maxZ: z + height,
    center: [x, y, z + height / 2] as [number, number, number],
  };
}

export function getCraneRailLength(crane: CraneConfig, layout: LayoutConfig): number {
  if (crane.railMinX !== undefined && crane.railMaxX !== undefined) {
    return Math.max(crane.railMaxX - crane.railMinX, 2);
  }

  const servedRacks = crane.rackIds
    .map((rackId) => layout.racks.find((rack) => rack.id === rackId))
    .filter((rack): rack is RackConfig => Boolean(rack));
  const farthestReach = servedRacks.reduce((max, rack) => {
    const bounds = getRackBounds(rack);
    return Math.max(max, Math.abs(bounds.minX - crane.railPosition[0]), Math.abs(bounds.maxX - crane.railPosition[0]));
  }, 0);
  const leftOffset = crane.leftOffset ?? DEFAULT_RAIL_OFFSET;
  const rightOffset = crane.rightOffset ?? DEFAULT_RAIL_OFFSET;
  return Math.max(farthestReach * 2 + leftOffset + rightOffset, 2);
}

export function getCraneRailXRange(crane: CraneConfig, layout: LayoutConfig): [number, number] {
  if (crane.railMinX !== undefined && crane.railMaxX !== undefined) {
    return [crane.railMinX, crane.railMaxX];
  }

  const railLength = getCraneRailLength(crane, layout);
  const halfLength = railLength / 2;
  const leftOffset = crane.leftOffset ?? DEFAULT_RAIL_OFFSET;
  const rightOffset = crane.rightOffset ?? DEFAULT_RAIL_OFFSET;
  return [
    crane.railPosition[0] - halfLength + leftOffset / 2,
    crane.railPosition[0] + halfLength - rightOffset / 2,
  ];
}

export function getCraneReachSign(crane: CraneConfig, rack: RackConfig): -1 | 1 {
  return rack.position[1] >= crane.railPosition[1] ? 1 : -1;
}

export function getCraneReachSigns(crane: CraneConfig, layout: LayoutConfig): Array<-1 | 1> {
  const signs = crane.rackIds
    .map((rackId) => layout.racks.find((rack) => rack.id === rackId))
    .filter((rack): rack is RackConfig => Boolean(rack))
    .map((rack) => getCraneReachSign(crane, rack));
  return Array.from(new Set(signs));
}

export function clampForkExtension(crane: CraneConfig, layout: LayoutConfig, desired: number): number {
  const signs = getCraneReachSigns(crane, layout);
  if (desired === 0 || signs.length === 0) return 0;
  const sign = desired < 0 ? -1 : 1;
  return signs.includes(sign) ? sign : signs[0];
}

export function getForkMaxExtension(crane: CraneConfig, layout: LayoutConfig): number {
  const servedRacks = crane.rackIds
    .map((rackId) => layout.racks.find((rack) => rack.id === rackId))
    .filter((rack): rack is RackConfig => Boolean(rack));
  return servedRacks.reduce((max, rack) => {
    const depthOffset = Math.abs(rack.position[1] - crane.railPosition[1]) + rack.cellDepth * 0.45;
    return Math.max(max, depthOffset);
  }, 2);
}

export function getFPTrackBounds(track: FPTrack) {
  return {
    minX: track.x,
    minY: track.y,
    maxX: track.x + track.w,
    maxY: track.y + track.h,
    centerX: track.x + track.w / 2,
    centerY: track.y + track.h / 2,
  };
}

export function getWorldPointForSelection(layout: LayoutConfig, selection: SelectedObject): [number, number, number] | null {
  if (selection.type === 'fptrack') {
    const track = layout.floorPlan?.tracks.find((item) => item.id === selection.id);
    if (!track) return null;
    const floorZ = getLayerZ(track.layerId);
    return fp2world(track.x + track.w / 2, track.y + track.h / 2, floorZ + 0.2);
  }
  if (selection.type === 'rack') {
    const rack = layout.racks.find((item) => item.id === selection.id);
    return rack ? getRackBounds(rack).center : null;
  }
  if (selection.type === 'cell') {
    const rack = layout.racks.find((item) => item.id === selection.rackId);
    if (!rack) return null;
    const length = getRackLength(rack);
    const depth = getRackDepth(rack);
    const cellHeight = getRackCellHeight(rack);
    return [
      rack.position[0] + selection.bay * rack.cellWidth - length / 2 + rack.cellWidth / 2,
      rack.position[1] + selection.bank * rack.cellDepth - depth / 2 + rack.cellDepth / 2,
      rack.position[2] + selection.level * cellHeight + cellHeight / 2,
    ];
  }
  if (selection.type === 'crane') {
    const crane = layout.cranes.find((item) => item.id === selection.id);
    return crane ? [crane.railPosition[0], crane.railPosition[1], crane.railPosition[2] + 2] : null;
  }
  if (selection.type === 'equipment') {
    const equipment = (layout.equipment ?? []).find((item) => item.id === selection.id);
    return equipment ? [equipment.position[0], equipment.position[1], equipment.position[2] + equipment.size[1] / 2] : null;
  }
  if (selection.type === 'fpbox') {
    const box = layout.floorPlan?.boxes.find((item) => item.id === selection.id);
    if (box) {
      const bx = box.x3d ?? box.x;
      const by = box.y3d ?? box.y;
      const floorZ = box.layerId ? getLayerZ(box.layerId) : 0;
      return fp2world(bx + box.w / 2, by + box.h / 2, floorZ + 0.5);
    }
    // FP crane zone
    const fpCrane = layout.floorPlan?.cranes.find((item) => item.id === selection.id);
    if (fpCrane) {
      const craneZ = fpCrane.layerId ? getLayerZ(fpCrane.layerId) : 0;
      return fp2world(fpCrane.x + fpCrane.totalW / 2, fpCrane.bank2Y + fpCrane.totalH / 2, craneZ + 0.5);
    }
  }
  return null;
}

export function normalizeBoxToEquipment(box: FPBox): EquipmentConfig {
  const [wx, wy] = fp2world(box.x + box.w / 2, box.y + box.h / 2);
  return {
    id: box.id,
    unitId: box.unitId ?? box.text,
    name: box.text || box.id,
    type: box.text?.startsWith('OCV') ? 'output' : box.text?.startsWith('NGR') ? 'buffer' : 'other',
    position: [wx, wy, 0],
    size: [Math.max(fpM(box.w), 0.5), 0.4, Math.max(fpM(box.h), 0.5)],
  };
}

export function normalizeLayout(layout: LayoutConfig, floorPlanOverride?: LayoutConfig['floorPlan']): LayoutConfig {
  const floorPlan = floorPlanOverride ?? layout.floorPlan;
  const equipmentMap = new Map((layout.equipment ?? []).map((item) => [item.id, item]));
  for (const box of floorPlan?.boxes ?? []) {
    equipmentMap.set(box.id, {
      ...normalizeBoxToEquipment(box),
      ...equipmentMap.get(box.id),
    });
  }
  return {
    ...layout,
    equipment: Array.from(equipmentMap.values()),
    floorPlan,
  };
}

export function worldPointToFloorPlan(point: [number, number, number]) {
  return world2fp(point[0], point[1]);
}

export function findByUnitId(layout: LayoutConfig, rawUnitId: string): SelectedObject | null {
  const unitId = rawUnitId.trim();
  if (!unitId) return null;
  const q = unitId.toLowerCase();
  const eq = (v?: string) => v?.toLowerCase() === q;

  // FP tracks (unitId or id)
  const fpTrack = layout.floorPlan?.tracks.find((item) => eq(item.unitId) || eq(item.id));
  if (fpTrack) {
    return { type: 'fptrack', id: fpTrack.id, unitId: fpTrack.unitId, layerId: fpTrack.layerId };
  }

  // FP boxes — match by text (e.g. "CDC1", "GRD1") or unitId
  const fpBox = layout.floorPlan?.boxes.find((item) => eq(item.text) || eq(item.unitId) || eq(item.id));
  if (fpBox) return { type: 'fpbox', id: fpBox.id };

  // FP cranes
  const fpCrane = layout.floorPlan?.cranes.find((item) => eq(item.id) || eq(item.unitId));
  if (fpCrane) return { type: 'fpbox', id: fpCrane.id };

  const crane = layout.cranes.find((item) => eq(item.unitId) || eq(item.id));
  if (crane) return { type: 'crane', id: crane.id };

  const rack = layout.racks.find((item) => eq(item.unitId) || eq(item.id));
  if (rack) return { type: 'rack', id: rack.id };

  const equipment = (layout.equipment ?? []).find((item) => eq(item.unitId) || eq(item.id) || eq(item.name));
  if (equipment) return { type: 'equipment', id: equipment.id };

  return null;
}
