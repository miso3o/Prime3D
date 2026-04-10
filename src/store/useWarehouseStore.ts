/**
 * useWarehouseStore.ts — Zustand global store for Prime3D runtime state.
 *
 * Separates runtime (live) state from layout configuration (JSON-driven).
 * The layout (positions, sizes) lives in App.tsx React state.
 * The live state (crane positions, cell statuses, trays, playback) lives here.
 *
 * Consumers: Crane, RackCell, TrackSegment, Tray, SelectionPopup, DesignerPanel,
 *            PlaybackControls, useMockData
 */
import { create } from 'zustand';
import type {
  CellStatus,
  TrackSegmentStatus,
  CraneState,
  TrayState,
  TrayLocation,
  SelectedObject,
} from '../config/types';

interface WarehouseStore {
  // ── Cell states ──────────────────────────────────────────────────────────────
  cellStates: Record<string, CellStatus>;

  // ── Crane states ─────────────────────────────────────────────────────────────
  craneStates: Record<string, CraneState>;

  // ── Track segment statuses ───────────────────────────────────────────────────
  trackSegmentStatuses: Record<string, TrackSegmentStatus>;

  // ── Trays ────────────────────────────────────────────────────────────────────
  trays: TrayState[];

  // ── Selection ─────────────────────────────────────────────────────────────────
  selectedObject: SelectedObject | null;

  // ── Playback ─────────────────────────────────────────────────────────────────
  /** When false, useMockData simulation pauses (no crane/tray movement) */
  isPlaying: boolean;

  // ── Designer mode ─────────────────────────────────────────────────────────────
  /** When true, the DesignerPanel is shown and objects are editable */
  designerMode: boolean;
  focusRequest: { token: number; selection: SelectedObject } | null;
  viewResetToken: number;

  // ── Actions ───────────────────────────────────────────────────────────────────
  setCellStatus: (key: string, status: CellStatus) => void;
  setCraneState: (id: string, state: Partial<CraneState>) => void;
  setTrackStatus: (key: string, status: TrackSegmentStatus) => void;
  setTrayLocation: (trayId: string, location: TrayLocation) => void;
  addTray: (tray: TrayState) => void;
  setSelectedObject: (obj: SelectedObject | null) => void;
  setPlaying: (playing: boolean) => void;
  setDesignerMode: (enabled: boolean) => void;
  requestFocus: (selection: SelectedObject) => void;
  requestViewReset: () => void;
}

export const useWarehouseStore = create<WarehouseStore>((set) => ({
  cellStates: {},
  craneStates: {},
  trackSegmentStatuses: {},
  trays: [],
  selectedObject: null,
  isPlaying: true,   // simulation runs by default
  designerMode: false,
  focusRequest: null,
  viewResetToken: 0,

  // ── Setters ───────────────────────────────────────────────────────────────────

  setCellStatus: (key, status) =>
    set((s) => ({ cellStates: { ...s.cellStates, [key]: status } })),

  setCraneState: (id, partial) =>
    set((s) => ({
      craneStates: {
        ...s.craneStates,
        [id]: { ...s.craneStates[id], ...partial },
      },
    })),

  setTrackStatus: (key, status) =>
    set((s) => ({ trackSegmentStatuses: { ...s.trackSegmentStatuses, [key]: status } })),

  setTrayLocation: (trayId, location) =>
    set((s) => ({
      trays: s.trays.map((t) => (t.id === trayId ? { ...t, location } : t)),
    })),

  addTray: (tray) =>
    set((s) => ({ trays: [...s.trays, tray] })),

  setSelectedObject: (obj) =>
    set({ selectedObject: obj }),

  setPlaying: (playing) =>
    set({ isPlaying: playing }),

  setDesignerMode: (enabled) =>
    set({ designerMode: enabled }),

  requestFocus: (selection) =>
    set((s) => ({
      focusRequest: {
        token: (s.focusRequest?.token ?? 0) + 1,
        selection,
      },
    })),

  requestViewReset: () =>
    set((s) => ({ viewResetToken: s.viewResetToken + 1 })),
}));
