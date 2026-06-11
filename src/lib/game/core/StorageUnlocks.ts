// ============================================================
// Storage — Map unlocks
// ============================================================
import { saveJSON, removeKey } from './StorageBase';
import { defaultUnlocks } from '../utils/helpers';
import { getMapStars } from './StorageRecords';
import type { Records } from '../types';
import * as C from '../constants';

export function loadUnlocks(): Record<string, boolean> {
  removeKey(C.STORAGE_KEY_RECORDS_OLD);
  const unlocks = defaultUnlocks();
  const raw = localStorage.getItem(C.STORAGE_KEY_UNLOCKS);
  if (!raw) return unlocks;
  try {
    const saved = JSON.parse(raw);
    for (const id of ['1', '2', '3']) {
      if (saved && typeof saved[id] === 'boolean') unlocks[id] = saved[id];
    }
  } catch { /* ignore */ }
  unlocks['1'] = true;
  return unlocks;
}

export function saveUnlocks(unlocks: Record<string, boolean>): void {
  saveJSON(C.STORAGE_KEY_UNLOCKS, unlocks);
}

export function isMapUnlocked(
  id: number,
  unlocks: Record<string, boolean>,
  records: Records,
): boolean {
  id = Number(id);
  if (id === 1) return true;
  if (unlocks?.[String(id)]) return true;
  if (id === 2) return getMapStars(records, 1) >= 1;
  if (id === 3) return getMapStars(records, 2) >= 1;
  return false;
}

export function getFirstUnlockedMap(
  unlocks: Record<string, boolean>,
  records: Records,
  maps: (import('../types').MapDef | null)[],
): import('../types').MapDef {
  for (let i = 3; i >= 1; i--) {
    if (isMapUnlocked(i, unlocks, records)) return maps[i]!;
  }
  return maps[1]!;
}
