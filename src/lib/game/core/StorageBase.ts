// ============================================================
// Base storage utilities
// ============================================================

const debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();

/** True when running in a browser (i.e. `localStorage` is available). */
function hasLocalStorage(): boolean {
	return (
		typeof globalThis !== 'undefined' &&
		typeof (globalThis as { localStorage?: Storage }).localStorage !== 'undefined'
	);
}

export function loadJSONraw(key: string): string | null {
	if (!hasLocalStorage()) return null;
	return localStorage.getItem(key);
}

export function saveJSONraw(key: string, raw: string): void {
	if (!hasLocalStorage()) return;
	localStorage.setItem(key, raw);
}

export function loadJSON<T>(key: string, fallback: T): T {
	if (!hasLocalStorage()) return fallback;
	try {
		const raw = localStorage.getItem(key);
		return raw ? (JSON.parse(raw) as T) : fallback;
	} catch {
		return fallback;
	}
}

export function saveJSON(key: string, value: unknown): void {
	if (!hasLocalStorage()) return;
	localStorage.setItem(key, JSON.stringify(value));
}

/** Debounced save — useful for rapidly-changing values (e.g. auto mana reserve) */
export function saveJSONDebounced(key: string, value: unknown, delayMs = 50): void {
	if (!hasLocalStorage()) return;
	const existing = debounceTimers.get(key);
	if (existing) clearTimeout(existing);
	debounceTimers.set(
		key,
		setTimeout(() => {
			if (!hasLocalStorage()) return;
			localStorage.setItem(key, JSON.stringify(value));
			debounceTimers.delete(key);
		}, delayMs)
	);
}

export function removeKey(key: string): void {
	if (!hasLocalStorage()) return;
	localStorage.removeItem(key);
}
