// ============================================================
// Utility helpers
// ============================================================

/** Deep clone via structuredClone with JSON fallback */
export function clone<T>(obj: T): T {
  if (typeof structuredClone === 'function') {
    return structuredClone(obj);
  }
  return JSON.parse(JSON.stringify(obj));
}

/** Clamp integer within [min, max] */
export function clampInt(v: unknown, min: number, max: number): number {
  const n = Math.floor(Number(v));
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
}

/** Escape HTML entities */
export function escapeHtml(str: unknown): string {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

/** Format time in seconds → "X분 Y초" or English */
export function formatTime(sec: number, isEn: boolean): string {
  const s = Math.floor(Math.max(0, sec));
  const m = Math.floor(s / 60);
  const ss = s % 60;
  if (isEn) return m > 0 ? `${m}m ${ss}s` : `${ss}s`;
  return m > 0 ? `${m}분 ${ss}초` : `${ss}초`;
}

/** Generate a star HTML string */
export function renderStars(count: number): string {
  let html = '';
  for (let i = 1; i <= 3; i++) {
    html += i <= count ? '★' : '<span class="starOff">☆</span>';
  }
  return html;
}

/** Format special damage display */
export function formatSpecialDamage(aoeDamage: number): string {
  return aoeDamage > 0 ? `분산 ${aoeDamage}` : '없음';
}

/** Get default slot auto modes */
export function defaultSlotAutoModes(): boolean[] {
  return [false, false, false, false, false];
}

/** Get default unlocks */
export function defaultUnlocks(): Record<string, boolean> {
  return { '1': true, '2': false, '3': false };
}
