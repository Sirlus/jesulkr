// ============================================================
// Storage — Spell slots
// ============================================================
import * as C from '../constants';
import type { SpellData, Component } from '../types';
import { clampInt } from '../utils/helpers';
import { calculateSpellStats } from '../designer/StatsCalculator';
import { canPlaceComponent, dimensionsFor } from '../designer/Components';
import { STORABLE_TYPES } from '../designer/components/registry';
import { saveJSON } from './StorageBase';

const VALID_TYPES = STORABLE_TYPES;

function normalizeType(type: string): string {
  return type === 'mana' ? 'red' : type;
}

export function normalizeSpell(raw: unknown): SpellData | null {
  if (!raw || typeof raw !== 'object' || !Array.isArray((raw as any).components)) return null;
  const r = raw as any;
  const width = clampInt(r.width, 1, C.MAX_FRAME);
  const height = clampInt(r.height, 1, C.MAX_FRAME);
  const components: Component[] = [];
  for (let i = 0; i < r.components.length; i++) {
    const cr = r.components[i];
    if (!cr) continue;
    const type = normalizeType(cr.type);
    if (!VALID_TYPES.has(type)) continue;
    const x = clampInt(cr.x, 0, C.MAX_FRAME - 1);
    const y = clampInt(cr.y, 0, C.MAX_FRAME - 1);
    const rotation = cr.rotation === 1 ? 1 : 0;
    const dim = dimensionsFor(type, rotation);
    const comp: Component = {
      id: Number.isFinite(Number(cr.id)) ? Number(cr.id) : i + 1,
      type: type as Component['type'],
      x, y, w: dim.w, h: dim.h, rotation: dim.rotation,
    };
    if (canPlaceComponent(comp, components, width, height)) {
      components.push(comp);
    }
  }
  const stats = calculateSpellStats({ width, height, components });
  if (!stats.valid) return null;
  return {
    id: r.id || `loaded_${Date.now()}`,
    name: String(r.name || '이름 없는 술식').slice(0, C.MAX_SPELL_NAME_LENGTH),
    width, height, components,
    castTime: stats.castTime,
    manaCost: stats.manaCost,
    damage: stats.damage,
    aoeDamage: stats.aoeDamage,
    breakdown: stats.breakdown,
  };
}

export function loadSlots(): (SpellData | null)[] {
  const slots: (SpellData | null)[] = [null, null, null, null, null];
  let raw = localStorage.getItem(C.STORAGE_KEY_SLOTS);
  if (!raw) raw = localStorage.getItem(C.STORAGE_KEY_SLOTS_LEGACY);
  if (!raw) return slots;
  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return slots;
    for (let i = 0; i < 5; i++) {
      slots[i] = normalizeSpell(arr[i]);
    }
  } catch { /* reset */ }
  return slots;
}

export function saveSlots(slots: (SpellData | null)[]): void {
  saveJSON(C.STORAGE_KEY_SLOTS, slots);
}
