// ============================================================
// Base storage utilities
// ============================================================

const debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();

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

/** Debounced save — useful for rapidly-changing values (e.g. auto mana reserve) */
export function saveJSONDebounced(key: string, value: unknown, delayMs = 50): void {
  const existing = debounceTimers.get(key);
  if (existing) clearTimeout(existing);
  debounceTimers.set(key, setTimeout(() => {
    localStorage.setItem(key, JSON.stringify(value));
    debounceTimers.delete(key);
  }, delayMs));
}

export function removeKey(key: string): void {
  localStorage.removeItem(key);
}
