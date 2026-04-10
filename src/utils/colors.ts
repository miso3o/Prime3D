/**
 * colors.ts — centralized color palette for Prime3D.
 *
 * All status-driven colors live here so visual style is consistent and easy to update.
 * Equipment type colors are also defined here for the Equipment component.
 */
import type { CellStatus, TrackSegmentStatus, CraneStatus } from '../config/types';
import type { EquipmentConfig } from '../config/types';

// ── Cell status colors ─────────────────────────────────────────────────────────
export const CELL_COLORS: Record<CellStatus, string> = {
  empty:    '#d0d5dd',
  occupied: '#2e7cf6',
  reserved: '#f5a623',
  error:    '#e53e3e',
  disabled: '#4a5568',
};

// ── Track segment status colors ────────────────────────────────────────────────
export const TRACK_COLORS: Record<TrackSegmentStatus, string> = {
  idle:     '#718096',
  running:  '#38a169',
  waiting:  '#d69e2e',
  error:    '#e53e3e',
  disabled: '#2d3748',
};

// ── Crane status colors ────────────────────────────────────────────────────────
export const CRANE_STATUS_COLORS: Record<CraneStatus, string> = {
  idle:       '#a0aec0',
  moving:     '#63b3ed',
  storing:    '#68d391',
  retrieving: '#f6ad55',
  error:      '#fc8181',
};

// ── Cell emissive colors (glow intensity per status) ──────────────────────────
export const CELL_EMISSIVE: Record<CellStatus, string> = {
  empty:    '#000000',
  occupied: '#0a2a6e',
  reserved: '#7a4d00',
  error:    '#7a0000',
  disabled: '#000000',
};

// ── Equipment type colors ──────────────────────────────────────────────────────
// Each equipment type has a body color and an accent/emissive color
export const EQUIPMENT_COLORS: Record<EquipmentConfig['type'], { body: string; accent: string; emissive: string }> = {
  conveyor: { body: '#546e7a', accent: '#78909c', emissive: '#1a2a30' },
  buffer:   { body: '#4a5568', accent: '#718096', emissive: '#1a1f2a' },
  input:    { body: '#276749', accent: '#68d391', emissive: '#0a2a1a' },
  output:   { body: '#744210', accent: '#f6ad55', emissive: '#2a1a00' },
  lift:     { body: '#2b4c7e', accent: '#63b3ed', emissive: '#0a1a30' },
  other:    { body: '#4a5568', accent: '#a0aec0', emissive: '#1a1f28' },
};

// ── HomeStand colors ───────────────────────────────────────────────────────────
export const HOMESTAND_COLOR       = '#c8962a'; // warm amber platform
export const HOMESTAND_STRIPE_COLOR = '#f6e05e'; // bright yellow stripes
export const HOMESTAND_LEG_COLOR   = '#744210'; // dark brown legs
