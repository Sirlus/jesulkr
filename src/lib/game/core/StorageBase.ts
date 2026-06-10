// ============================================================
// Base storage utilities
// ============================================================

export function loadJSONraw(key: string): string | null {
  return localStorage.getItem(key);
}

export function saveJSONraw(key: string, raw: string): void {
  localStorage.setItem(key, raw);
}

export function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function saveJSON(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export function removeKey(key: string): void {
  localStorage.removeItem(key);
}
