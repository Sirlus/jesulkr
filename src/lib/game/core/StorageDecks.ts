// ============================================================
// Storage — Decks
// ============================================================
import type { SpellData } from '../types';
import { loadJSON, saveJSON } from './StorageBase';
import { normalizeSpell } from './StorageSlots';
import * as C from '../constants';

function emptyDeck(): (SpellData | null)[] {
  return [null, null, null, null, null];
}

function createEmptyDecks(): (SpellData | null)[][] {
  return Array.from({ length: 10 }, () => emptyDeck());
}

export function loadDecks(): (SpellData | null)[][] {
  const decks = createEmptyDecks();
  const raw = localStorage.getItem(C.STORAGE_KEY_DECKS);
  if (!raw) return decks;
  try {
    const saved = JSON.parse(raw);
    if (!Array.isArray(saved)) return decks;
    for (let d = 0; d < 10; d++) {
      const rawDeck = Array.isArray(saved[d])
        ? saved[d]
        : (saved[d] && Array.isArray(saved[d].slots) ? saved[d].slots : null);
      if (!rawDeck) continue;
      decks[d] = emptyDeck();
      for (let i = 0; i < 5; i++) {
        decks[d][i] = normalizeSpell(rawDeck[i]);
      }
    }
  } catch { /* ignore */ }
  return decks;
}

export function saveDecks(decks: (SpellData | null)[][]): void {
  saveJSON(C.STORAGE_KEY_DECKS, decks);
}

export function loadDeckNames(): string[] {
  const names: string[] = Array.from({ length: 10 }, (_, i) => `덱 ${i + 1}`);
  const raw = localStorage.getItem(C.STORAGE_KEY_DECK_NAMES);
  if (!raw) return names;
  try {
    const saved = JSON.parse(raw);
    if (!Array.isArray(saved)) return names;
    for (let i = 0; i < 10; i++) {
      const name = String(saved[i] || '').trim();
      if (name) names[i] = name.slice(0, 18);
    }
  } catch { /* ignore */ }
  return names;
}

export function saveDeckNames(names: string[]): void {
  saveJSON(C.STORAGE_KEY_DECK_NAMES, names);
}
