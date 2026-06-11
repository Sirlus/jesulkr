// ============================================================
// Storage — Key bindings
// ============================================================
import type { KeyBinding } from '../types';
import { clone } from '../utils/helpers';
import { saveJSON } from './StorageBase';
import * as C from '../constants';

export function formatKeyLabel(code: string, key: string): string {
  if (code?.startsWith('Key')) return code.slice(3).toUpperCase();
  if (code?.startsWith('Digit')) return code.slice(5);
  if (code?.startsWith('Numpad')) return 'N' + code.slice(6);
  if (code === 'Space') return 'SPC';
  if (code === 'Tab') return 'TAB';
  if (code === 'ArrowUp') return '↑';
  if (code === 'ArrowDown') return '↓';
  if (code === 'ArrowLeft') return '←';
  if (code === 'ArrowRight') return '→';
  if (key?.length === 1) return key.toUpperCase();
  return (key || code || '?').replace('Control', 'Ctrl').slice(0, 7);
}

function normalizeKeyBinding(raw: any): KeyBinding | null {
  if (!raw || typeof raw !== 'object') return null;
  const code = String(raw.code || '').trim();
  const key = String(raw.key || '');
  const label = String(raw.label || formatKeyLabel(code, key) || '').trim();
  if (!code && !key) return null;
  return { code, key, label: label.slice(0, 7) };
}

export function defaultKeyBindings(): KeyBinding[] {
  return [1, 2, 3, 4, 5].map(n => ({
    code: `Digit${n}`, key: String(n), label: String(n),
  }));
}

export function defaultControlBindings(): Record<string, KeyBinding> {
  const result: Record<string, KeyBinding> = {};
  for (const action of C.CONTROL_ACTIONS) result[action.id] = clone(action.def);
  return result;
}

export function loadKeyBindings(): KeyBinding[] {
  const defaults = defaultKeyBindings();
  const raw = localStorage.getItem(C.STORAGE_KEY_KEY_BINDINGS);
  if (!raw) return defaults;
  try {
    const saved = JSON.parse(raw);
    if (!Array.isArray(saved)) return defaults;
    return defaults.map((def, i) => normalizeKeyBinding(saved[i]) || def);
  } catch {
    return defaults;
  }
}

export function saveKeyBindings(bindings: KeyBinding[]): void {
  saveJSON(C.STORAGE_KEY_KEY_BINDINGS, bindings);
}

export function loadControlBindings(): Record<string, KeyBinding> {
  const defaults = defaultControlBindings();
  const raw = localStorage.getItem(C.STORAGE_KEY_CONTROL_BINDINGS);
  if (!raw) return defaults;
  try {
    const saved = JSON.parse(raw);
    const result = defaultControlBindings();
    if (!saved || typeof saved !== 'object') return defaults;
    for (const action of C.CONTROL_ACTIONS) {
      result[action.id] = normalizeKeyBinding(saved[action.id]) || result[action.id];
    }
    return result;
  } catch {
    return defaults;
  }
}

export function saveControlBindings(bindings: Record<string, KeyBinding>): void {
  saveJSON(C.STORAGE_KEY_CONTROL_BINDINGS, bindings);
}
