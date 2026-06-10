// ============================================================
// Storage — Map records & stars
// ============================================================
import type { Records, MapRecord } from '../types';
import { clone } from '../utils/helpers';
import { loadJSON, saveJSON } from './StorageBase';
import * as C from '../constants';

function emptyRecord(): MapRecord {
  return { score: 0, time: 0 };
}

function defaultRecords(): Records {
  const maps = { '1': emptyRecord(), '2': emptyRecord(), '3': emptyRecord() };
  return { assist: clone(maps), pure: clone(maps) };
}

function normalizeRecordShape(saved: any): Records {
  const records = defaultRecords();
  if (!saved || typeof saved !== 'object') return records;
  if (saved.assist || saved.pure) {
    for (const mode of ['assist', 'pure'] as const) {
      for (const id of ['1', '2', '3']) {
        if (saved[mode]?.[id]) {
          records[mode][id] = {
            score: Math.max(0, Number(saved[mode][id].score) || 0),
            time: Math.max(0, Number(saved[mode][id].time) || 0),
          };
        }
      }
    }
    return records;
  }
  // v1/v2 fallback
  for (const id of ['1', '2', '3']) {
    if (saved[id]) {
      records.assist[id] = {
        score: Math.max(0, Number(saved[id].score) || 0),
        time: Math.max(0, Number(saved[id].time) || 0),
      };
    }
  }
  return records;
}

export function loadRecords(): Records {
  let raw = localStorage.getItem(C.STORAGE_KEY_RECORDS);
  if (!raw) raw = localStorage.getItem(C.STORAGE_KEY_RECORDS_LEGACY);
  if (!raw) raw = localStorage.getItem(C.STORAGE_KEY_RECORDS_OLD);
  if (!raw) return defaultRecords();
  try {
    return normalizeRecordShape(JSON.parse(raw));
  } catch {
    return defaultRecords();
  }
}

export function saveRecords(records: Records): void {
  saveJSON(C.STORAGE_KEY_RECORDS, records);
}

export function getMapRecord(records: Records, id: number, mode: string): MapRecord {
  const m = mode === 'pure' ? 'pure' : 'assist';
  return records[m]?.[String(id)] || emptyRecord();
}

export function setMapRecord(records: Records, id: number, mode: string, record: MapRecord): void {
  const m = mode === 'pure' ? 'pure' : 'assist';
  if (!records[m]) records[m] = { '1': emptyRecord(), '2': emptyRecord(), '3': emptyRecord() };
  records[m][String(id)] = {
    score: Math.max(0, Number(record.score) || 0),
    time: Math.max(0, Number(record.time) || 0),
  };
}

export function getMapProgressScore(records: Records, id: number): number {
  return Math.max(
    getMapRecord(records, id, 'assist').score,
    getMapRecord(records, id, 'pure').score,
  );
}

export function getMapStars(records: Records, id: number, scoreOverride?: number): number {
  const thresholds = C.STAR_THRESHOLDS[id] || [];
  const score = scoreOverride == null ? getMapProgressScore(records, id) : Math.max(0, Number(scoreOverride) || 0);
  return thresholds.reduce((n, need) => n + (score >= need ? 1 : 0), 0);
}
