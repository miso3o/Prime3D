/**
 * useMockData.ts - simulated warehouse activity with valid crane / tray paths.
 */
import { useEffect, useRef } from 'react';
import { useWarehouseStore } from '../store/useWarehouseStore';
import type { LayoutConfig } from '../config/types';
import { cellKey, trackSegKey } from '../config/types';
import { clampForkExtension, getCraneReachSign } from '../config/layoutGeometry';

function rnd(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

export function useMockData(layout: LayoutConfig) {
  const initialized = useRef(false);
  const isPlaying = useWarehouseStore((s) => s.isPlaying);

  useEffect(() => {
    const store = useWarehouseStore.getState();

    for (const crane of layout.cranes) {
      store.setCraneState(crane.id, {
        id: crane.id,
        status: 'idle',
        xPosition: 0.5,
        yPosition: 0,
        forkExtension: 0,
      });
    }

    for (const track of layout.tracks) {
      for (const seg of track.segments) {
        store.setTrackStatus(trackSegKey(track.id, seg.id), seg.type === 'HomeStand' ? 'waiting' : 'idle');
      }
    }

    if (!initialized.current) {
      initialized.current = true;
      for (const rack of layout.racks) {
        for (let bk = 0; bk < rack.banks; bk++) {
          for (let b = 0; b < rack.bays; b++) {
            for (let lv = 0; lv < rack.levels; lv++) {
              if (Math.random() < 0.4) {
                store.setCellStatus(cellKey(rack.id, bk, b, lv), 'occupied');
              }
            }
          }
        }
      }
    }

    const existingTrayIds = new Set(store.trays.map((t) => t.id));
    for (const track of layout.tracks) {
      const trayId = `tray-${track.id}`;
      if (!existingTrayIds.has(trayId) && track.segments.length > 0) {
        store.addTray({
          id: trayId,
          location: { type: 'track', trackId: track.id, segmentId: track.segments[0].id },
        });
      }
    }
  }, [layout]);

  useEffect(() => {
    if (!isPlaying) return;

    const intervals: ReturnType<typeof setInterval>[] = [];

    for (const crane of layout.cranes) {
      const linkedTrack = layout.tracks.find((track) => track.linkedCraneId === crane.id);
      const trayId = linkedTrack ? `tray-${linkedTrack.id}` : null;
      const pairedRacks = crane.rackIds
        .map((rackId) => layout.racks.find((rack) => rack.id === rackId))
        .filter((rack): rack is NonNullable<typeof rack> => Boolean(rack));
      const homeStand = linkedTrack?.segments.find((seg) => seg.type === 'HomeStand');
      const normalSegments = linkedTrack?.segments.filter((seg) => seg.type !== 'HomeStand') ?? [];

      let phase = 0;
      const phasesPerCycle = 8;

      const iv = setInterval(() => {
        const store = useWarehouseStore.getState();
        if (!store.isPlaying) return;

        const cycleIndex = Math.floor(phase / phasesPerCycle);
        const p = phase % phasesPerCycle;
        const targetRack = pairedRacks.length ? pairedRacks[cycleIndex % pairedRacks.length] : undefined;
        const bay = targetRack ? Math.min(Math.floor(rnd(0.05, 0.95) * targetRack.bays), targetRack.bays - 1) : 0;
        const level = targetRack ? Math.min(Math.floor(rnd(0, 0.85) * targetRack.levels), targetRack.levels - 1) : 0;
        const forkSign = targetRack ? clampForkExtension(crane, layout, getCraneReachSign(crane, targetRack)) : 0;
        const activeSeg = normalSegments[p % Math.max(normalSegments.length, 1)];

        if (p === 0 && linkedTrack) {
          for (const seg of linkedTrack.segments) {
            store.setTrackStatus(trackSegKey(linkedTrack.id, seg.id), seg.type === 'HomeStand' ? 'waiting' : 'running');
          }
          if (trayId && activeSeg) {
            store.setTrayLocation(trayId, { type: 'track', trackId: linkedTrack.id, segmentId: activeSeg.id });
          }
        }

        if (p === 1 && targetRack) {
          store.setCraneState(crane.id, {
            status: 'moving',
            xPosition: Math.max(0.02, Math.min(0.98, bay / Math.max(targetRack.bays - 1, 1))),
            yPosition: Math.max(0, Math.min(0.95, level / Math.max(targetRack.levels - 1, 1))),
            forkExtension: 0,
          });
          if (trayId) {
            store.setTrayLocation(trayId, { type: 'crane', craneId: crane.id });
          }
        }

        if (p === 2) {
          store.setCraneState(crane.id, { status: 'storing', forkExtension: forkSign });
        }

        if (p === 3 && targetRack) {
          store.setCellStatus(cellKey(targetRack.id, 0, bay, level), 'occupied');
          if (trayId) {
            store.setTrayLocation(trayId, { type: 'rack', rackId: targetRack.id, bank: 0, bay, level });
          }
          store.setCraneState(crane.id, { status: 'idle', forkExtension: 0 });
        }

        if (p === 4 && targetRack) {
          store.setCraneState(crane.id, {
            status: 'moving',
            xPosition: Math.max(0.02, Math.min(0.98, bay / Math.max(targetRack.bays - 1, 1))),
            yPosition: Math.max(0, Math.min(0.95, level / Math.max(targetRack.levels - 1, 1))),
            forkExtension: 0,
          });
        }

        if (p === 5) {
          store.setCraneState(crane.id, { status: 'retrieving', forkExtension: forkSign });
          if (trayId) {
            store.setTrayLocation(trayId, { type: 'crane', craneId: crane.id });
          }
        }

        if (p === 6 && linkedTrack && trayId && homeStand) {
          store.setCraneState(crane.id, { status: 'idle', forkExtension: 0 });
          store.setTrayLocation(trayId, { type: 'track', trackId: linkedTrack.id, segmentId: homeStand.id });
        }

        if (p === phasesPerCycle - 1 && linkedTrack) {
          for (const seg of linkedTrack.segments) {
            store.setTrackStatus(trackSegKey(linkedTrack.id, seg.id), seg.type === 'HomeStand' ? 'waiting' : 'idle');
          }
        }

        phase++;
      }, 900 + Math.random() * 300);

      intervals.push(iv);
    }

    return () => intervals.forEach(clearInterval);
  }, [layout, isPlaying]);
}
