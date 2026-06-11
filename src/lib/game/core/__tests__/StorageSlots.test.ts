/**
 * @vitest-environment happy-dom
 *
 * StorageSlots unit tests — Phase 6: Quality
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { normalizeSpell, loadSlots, saveSlots } from '../StorageSlots';

const storage = new Map<string, string>();
Object.defineProperty(global, 'localStorage', {
  value: {
    getItem: (k: string) => storage.get(k) ?? null,
    setItem: (k: string, v: string) => { storage.set(k, v); },
    removeItem: (k: string) => { storage.delete(k); },
  },
  writable: true,
});

beforeEach(() => storage.clear());

describe('normalizeSpell', () => {
  it('validates a spell with red + circle components', () => {
    const spell = normalizeSpell({
      width: 2, height: 2,
      components: [
        { id: 1, type: 'red', x: 0, y: 0, w: 1, h: 1, rotation: 0 },
        { id: 2, type: 'circle', x: 1, y: 0, w: 1, h: 1, rotation: 0 },
      ],
    });
    expect(spell).not.toBeNull();
    expect(spell!.damage).toBeGreaterThan(0);
  });

  it('rejects spell with no circuits (only red mana)', () => {
    const spell = normalizeSpell({
      width: 2, height: 2,
      components: [{ id: 1, type: 'red', x: 0, y: 0, w: 1, h: 1, rotation: 0 }],
    });
    expect(spell).toBeNull();
  });

  it('migrates legacy "mana" type to "red"', () => {
    const spell = normalizeSpell({
      width: 2, height: 2,
      components: [
        { id: 1, type: 'mana', x: 0, y: 0, w: 1, h: 1, rotation: 0 },
        { id: 2, type: 'circle', x: 1, y: 0, w: 1, h: 1, rotation: 0 },
      ],
    });
    expect(spell).not.toBeNull();
    expect(spell!.components[0].type).toBe('red');
  });

  it('returns null for non-object input', () => {
    expect(normalizeSpell(null)).toBeNull();
    expect(normalizeSpell('invalid')).toBeNull();
    expect(normalizeSpell(123)).toBeNull();
  });

  it('returns null for objects without components array', () => {
    expect(normalizeSpell({ width: 2, height: 2 })).toBeNull();
  });
});

describe('loadSlots / saveSlots', () => {
  it('returns 5 nulls when no storage exists', () => {
    const slots = loadSlots();
    expect(slots).toEqual([null, null, null, null, null]);
    expect(slots.length).toBe(5);
  });

  it('round-trips a slot with a valid spell', () => {
    saveSlots([
      { id: 's1', name: 'Fire', width: 2, height: 2, components: [
        { id: 1, type: 'circle', x: 0, y: 0, w: 1, h: 1, rotation: 0 },
        { id: 2, type: 'red', x: 1, y: 0, w: 1, h: 1, rotation: 0 },
      ], castTime: 4, manaCost: 1, damage: 1, aoeDamage: 0, breakdown: [] },
      null, null, null, null,
    ]);
    const loaded = loadSlots();
    expect(loaded[0]?.name).toBe('Fire');
    expect(loaded[1]).toBeNull();
  });

  it('handles empty slots array', () => {
    saveSlots([null, null, null, null, null]);
    const loaded = loadSlots();
    expect(loaded).toEqual([null, null, null, null, null]);
  });
});
