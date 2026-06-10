// ============================================================
// Storage — Misc settings (auto modes, language, etc.)
// ============================================================
import { loadJSON, saveJSON } from './StorageBase';
import * as C from '../constants';

export function defaultSlotAutoModes(): boolean[] {
  return [false, false, false, false, false];
}

export function loadSlotAutoModes(): boolean[] {
  const raw = localStorage.getItem(C.STORAGE_KEY_SLOT_AUTO);
  if (!raw) return defaultSlotAutoModes();
  try {
    const arr = JSON.parse(raw);
    return Array.from({ length: 5 }, (_, i) => !!(Array.isArray(arr) && arr[i]));
  } catch {
    return defaultSlotAutoModes();
  }
}

export function saveSlotAutoModes(modes: boolean[]): void {
  saveJSON(C.STORAGE_KEY_SLOT_AUTO, modes);
}

export function loadAutoManaReserve(): number {
  const raw = localStorage.getItem(C.STORAGE_KEY_AUTO_MANA_RESERVE);
  const n = Math.floor(Number(raw));
  return Number.isFinite(n) ? Math.max(0, Math.min(C.MAX_MANA, n)) : 0;
}

export function saveAutoManaReserve(v: number): void {
  saveJSON(C.STORAGE_KEY_AUTO_MANA_RESERVE, v);
}

export function loadManaBonusEnabled(): boolean {
  const raw = localStorage.getItem(C.STORAGE_KEY_MANA_BONUS);
  return raw === null ? true : raw !== 'false';
}

export function saveManaBonusEnabled(v: boolean): void {
  saveJSON(C.STORAGE_KEY_MANA_BONUS, v ? 'true' : 'false');
}

export function loadLanguage(): string | null {
  const raw = localStorage.getItem(C.STORAGE_KEY_LANGUAGE);
  return (raw === 'en' || raw === 'ko') ? raw : null;
}

export function saveLanguage(lang: string): void {
  localStorage.setItem(C.STORAGE_KEY_LANGUAGE, lang);
}

export function loadTutorialSeen(): boolean {
  return localStorage.getItem(C.STORAGE_KEY_TUTORIAL_SEEN) === 'seen';
}

export function saveTutorialSeen(seen: boolean): void {
  if (seen) localStorage.setItem(C.STORAGE_KEY_TUTORIAL_SEEN, 'seen');
  else localStorage.removeItem(C.STORAGE_KEY_TUTORIAL_SEEN);
}

export function loadSelectedRunMode(): string {
  const raw = localStorage.getItem(C.STORAGE_KEY_RUN_MODE);
  return raw === 'pure' ? 'pure' : 'assist';
}

export function saveSelectedRunMode(mode: string): void {
  localStorage.setItem(C.STORAGE_KEY_RUN_MODE, mode);
}
