/**
 * types.ts — central TypeScript definitions for Prime3D.
 *
 * All layout configuration interfaces live here (JSON-driven scene).
 * Runtime state interfaces (crane positions, cell statuses, tray locations) also live here.
 *
 * Design principle: LayoutConfig is the single source of truth for WHERE things are.
 *                   WarehouseStore is the single source of truth for their RUNTIME STATE.
 */

// ── Layout Configuration Types ─────────────────────────────────────────────────

/**
 * RackConfig — one physical rack unit.
 * A "rack" is a shelf-style storage structure with cells arranged in a 3D grid:
 *   bays   → columns along X axis
 *   levels → rows along Y axis (height)
 *   banks  → depth along Z axis
 */
export interface RackConfig {
  id: string;
  unitId?: string;
  position: [number, number, number];
  banks: number;       // depth groups (Z axis)
  bays: number;        // columns (X axis)
  levels: number;      // rows / height (Y axis)
  cellWidth: number;
  cellHeight: number;
  cellDepth: number;
  fixedHeight?: number;
  length?: number;
  orientation: 'x' | 'z'; // axis along which bays extend
}

/**
 * CraneConfig — one AS/RS stacker crane.
 * Paired with 1 or 2 racks. Rail runs along X by default.
 * railPosition is the world-space center of the aisle at ground level.
 */
export interface CraneConfig {
  id: string;
  unitId?: string;
  railPosition: [number, number, number];
  rackIds: [string] | [string, string];
  forkSide?: 'front' | 'back' | 'Both';
  leftOffset?: number;
  rightOffset?: number;
  /** HomeStand track unitIds assigned to this crane (for future PLC integration) */
  homeStandTracks?: {
    inbound:  string[];  // unitIds of inbound HomeStand tracks
    outbound: string[];  // unitIds of outbound HomeStand tracks
  };
  /** Current operator-set target position (for PLC command building) */
  targetPosition?: {
    bank:  number;
    bay:   number;
    level: number;
  };
}

/**
 * TrackSegmentConfig — one segment (slot) on a conveyor track.
 * type 'HomeStand' marks the staging position where trays wait for crane pick-up.
 */
export interface TrackSegmentConfig {
  id: string;
  type: 'Normal' | 'HomeStand';
  localIndex: number; // zero-based index position along the track direction
}

/**
 * TrackConfig — one conveyor track consisting of multiple segments.
 * direction 'x' = track runs along the X axis, 'z' = runs along Z axis.
 * segmentSize: [lengthAlongDirection, perpendicularWidth].
 */
export interface TrackConfig {
  id: string;
  position: [number, number, number]; // world-space track origin
  direction: 'x' | 'y' | 'z';
  segmentSize: [number, number]; // [lengthAlong, width]
  segments: TrackSegmentConfig[];
  linkedCraneId?: string; // crane that serves this track's HomeStand
}

/**
 * EquipmentConfig — generic industrial equipment object (conveyors, lifts, buffers, etc.).
 * All positions/sizes/rotations are JSON-driven and fully adjustable in the designer.
 * type determines visual styling (color, shape hints).
 */
export interface EquipmentConfig {
  id: string;
  name: string;
  unitId?: string;
  /** Determines color scheme and visual appearance in the scene */
  type: 'conveyor' | 'buffer' | 'input' | 'output' | 'lift' | 'other';
  position: [number, number, number];
  rotation?: [number, number, number]; // Euler X, Y, Z in radians (optional)
  size: [number, number, number];      // [width(X), height(Y), depth(Z)]
}

/**
 * HomeStandConfig — physical tray staging stand.
 * Can be configured as 1 or 2 physical unit platforms depending on the warehouse setup.
 * Positioned near TrackConfig HomeStand segments to show the physical staging frame.
 */
export interface HomeStandConfig {
  id: string;
  name: string;
  position: [number, number, number]; // world-space origin
  rotation?: [number, number, number];
  /** Number of physical stand units: 1 = single, 2 = double (side by side along X) */
  units: 1 | 2;
  unitSize: [number, number, number]; // [width(X), height(Y), depth(Z)] per unit
  linkedCraneId?: string;
}

// ── Floor Plan (2D) Types ──────────────────────────────────────────────────────

/** One display layer in the 2D floor plan (matches fms_prime.json) */
export interface FPLayer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  order: number;
}

/**
 * FPTrack visual/functional type.
 *   Default     → flat conveyor slab
 *   Lift        → vertical column connecting floor levels
 *   Palletizer  → elevated palletizer platform
 *   InboundHs   → inbound HomeStand (staging position for crane pick-up)
 *   OutboundHs  → outbound HomeStand (staging position for crane deposit)
 *   BCRRead     → barcode reader position
 */
export type FPTrackType =
  | 'Default'
  | 'Lift'
  | 'Palletizer'
  | 'InboundHs'
  | 'OutboundHs'
  | 'BCRRead';

/** One conveyor track segment in the 2D floor plan (pixel coords) */
export interface FPTrack {
  id: string;
  unitId: string;
  x: number;
  y: number;
  w: number;
  h: number;
  colorSet: string;
  layerId: string;
  /** Conveyor travel direction in 2D: 'x' = left-right, 'y' = front-back */
  direction?: 'x' | 'y';
  /** 3D rendering type (Default if omitted). Lift renders as a vertical column. */
  trackType?: FPTrackType;
}

/** One AS/RS crane zone in the 2D floor plan */
export interface FPCrane {
  id: string;
  unitId: string;
  x: number;
  bank2Y: number;
  slotN: number;
  slotIdPrefix: string;
  forkCount: number;
  totalW: number;
  totalH: number;
}

/** A conveyor line path (ordered list of track IDs) */
export interface FPConveyorLine {
  dir: number;
  trackIds: string[];
}

/** A text label in the 2D floor plan */
export interface FPLabel {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  text: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  bgColor: string;
  bold: boolean;
  italic: boolean;
  layerId?: string;
}

/** A filled/bordered rectangle — used for equipment zones (CDC, AG, HAG, OCV, etc.) */
export interface FPBox {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  bgColor: string;
  bgAlpha: number;
  borderColor: string;
  borderWidth: number;
  text: string;
  textColor: string;
  fontSize: number;
  zIndex: number;
  /** Optional unit identifier (editable in Designer) */
  unitId?: string;
  /** Optional layer assignment (determines 3D floor Z, editable in Designer) */
  layerId?: string;
}

/** Legend configuration for the 2D floor plan */
export interface FPLegend {
  x: number;
  y: number;
  items: { color: string; label: string }[];
  title: string;
  bgColor: string;
  fontSize: number;
}

/**
 * FloorPlanData — 2D factory floor plan derived from fms_prime.json.
 * Pixel coordinate space: width × height (default 2549 × 1500).
 * Embedded under the `floorPlan` key in LayoutConfig / defaultLayout.json.
 */
export interface FloorPlanData {
  width: number;
  height: number;
  backgroundColor: string;
  tracks: FPTrack[];
  cranes: FPCrane[];
  conveyorLines: FPConveyorLine[];
  labels: FPLabel[];
  boxes: FPBox[];
  legend: FPLegend;
  layers: FPLayer[];
}

/**
 * LayoutConfig — the root JSON schema object.
 * This is the single source of truth for the entire 3D scene layout.
 * All arrays are optional except racks, cranes, and tracks.
 */
export interface LayoutConfig {
  racks: RackConfig[];
  cranes: CraneConfig[];
  tracks: TrackConfig[];
  equipment?: EquipmentConfig[];
  homeStands?: HomeStandConfig[];
  floorPlan?: FloorPlanData;
}

// ── Runtime State Types ────────────────────────────────────────────────────────

/** Status of a single rack cell (used for color coding in RackCell) */
export type CellStatus = 'empty' | 'occupied' | 'reserved' | 'error' | 'disabled';

/** Status of a single track segment (used for color coding in TrackSegment) */
export type TrackSegmentStatus = 'idle' | 'running' | 'waiting' | 'error' | 'disabled';

/** Operational status of a crane (used for status indicator light color) */
export type CraneStatus = 'idle' | 'moving' | 'storing' | 'retrieving' | 'error';

/**
 * CraneState — live position and status of one crane.
 * xPosition and yPosition are normalized [0..1] for animation-friendly interpolation.
 * forkExtension: -1 = fully extended to left rack (−Z), 0 = retracted, +1 = right rack (+Z).
 */
export interface CraneState {
  id: string;
  status: CraneStatus;
  xPosition: number;    // normalized 0..1 along rail length
  yPosition: number;    // normalized 0..1 along mast height
  forkExtension: number;
}

/**
 * TrayLocation — where a tray currently is in the warehouse.
 * Used by Tray.tsx to compute world-space position for rendering.
 *
 * Movement rules:
 *  - track  → tray travels along the track segments
 *  - crane  → tray is on the crane carriage (moves with it)
 *  - rack   → tray is stored in a specific rack cell
 */
export type TrayLocation =
  | { type: 'track'; trackId: string; segmentId: string }
  | { type: 'crane'; craneId: string }
  | { type: 'rack';  rackId: string; bank: number; bay: number; level: number };

export interface TrayState {
  id: string;
  location: TrayLocation;
}

// ── Selection Types ────────────────────────────────────────────────────────────
/**
 * SelectedObject — discriminated union used in SelectionPopup and DesignerPanel.
 * Each variant carries the minimum data needed to look up full info from the layout.
 */
export type SelectedObject =
  | { type: 'rack';      id: string }
  | { type: 'cell';      key: string; rackId: string; bank: number; bay: number; level: number }
  | { type: 'crane';     id: string }
  | { type: 'tray';      id: string }
  | { type: 'track';     trackId: string; segmentId: string }
  /** FP-sourced track segment (clicked in 2D or 3D from floorPlan.tracks) */
  | { type: 'fptrack';   id: string; unitId: string; layerId: string }
  /** FP equipment zone box (clicked in 2D from floorPlan.boxes) */
  | { type: 'fpbox';     id: string }
  | { type: 'equipment'; id: string }
  | { type: 'homestand'; id: string };

// ── Key Helpers ────────────────────────────────────────────────────────────────

/** Canonical string key for a rack cell: "rackId:bank:bay:level" */
export function cellKey(rackId: string, bank: number, bay: number, level: number): string {
  return `${rackId}:${bank}:${bay}:${level}`;
}

/** Canonical string key for a track segment: "trackId:segmentId" */
export function trackSegKey(trackId: string, segmentId: string): string {
  return `${trackId}:${segmentId}`;
}
