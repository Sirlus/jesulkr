/**
 * @vitest-environment happy-dom
 *
 * StorageRecords unit tests — Phase 6: Quality
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { loadRecords, saveRecords, getMapRecord, setMapRecord, getMapStars } from '../StorageRecords';

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

describe('loadRecords', () => {
  it('returns default empty records when no storage', () => {
    const records = loadRecords();
    expect(records.assist['1'].score).toBe(0);
    expect(records.assist['2'].score).toBe(0);
    expect(records.pure['1'].score).toBe(0);
  });
});

describe('saveRecords / loadRecords', () => {
  it('round-trips records', () => {
    const records = loadRecords();
    records.assist['1'] = { score: 15000, time: 120 };
    records.pure['2'] = { score: 55000, time: 300 };
    saveRecords(records);
    const loaded = loadRecords();
    expect(loaded.assist['1'].score).toBe(15000);
    expect(loaded.assist['1'].time).toBe(120);
    expect(loaded.pure['2'].score).toBe(55000);
  });
});

describe('getMapRecord', () => {
  it('returns empty record for unknown map', () => {
    const records = loadRecords();
    const rec = getMapRecord(records, 1, 'assist');
    expect(rec.score).toBe(0);
    expect(rec.time).toBe(0);
  });

  it('returns assist record', () => {
    const records = loadRecords();
    setMapRecord(records, 1, 'assist', { score: 20000, time: 100 });
    const rec = getMapRecord(records, 1, 'assist');
    expect(rec.score).toBe(20000);
  });

  it('returns pure record separately', () => {
    const records = loadRecords();
    setMapRecord(records, 1, 'assist', { score: 10000, time: 50 });
    setMapRecord(records, 1, 'pure', { score: 30000, time: 200 });
    expect(getMapRecord(records, 1, 'assist').score).toBe(10000);
    expect(getMapRecord(records, 1, 'pure').score).toBe(30000);
  });
});

describe('getMapStars', () => {
  it('returns 0 when no records', () => {
    const records = loadRecords();
    expect(getMapStars(records, 1)).toBe(0);
  });

  it('returns 1 for score above first threshold', () => {
    const records = loadRecords();
    // Map 1 thresholds: 15000, 20000, 25000
    setMapRecord(records, 1, 'assist', { score: 15000, time: 100 });
    expect(getMapStars(records, 1)).toBe(1);
  });

  it('returns 3 for score above all thresholds', () => {
    const records = loadRecords();
    setMapRecord(records, 1, 'assist', { score: 25000, time: 300 });
    expect(getMapStars(records, 1)).toBe(3);
  });

  it('uses scoreOverride when provided', () => {
    const records = loadRecords();
    setMapRecord(records, 1, 'assist', { score: 15000, time: 100 });
    expect(getMapStars(records, 1, 25000)).toBe(3);
  });
});
