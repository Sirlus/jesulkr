// ============================================================
// i18n — Internationalization
// ============================================================
import type { Language } from '../types';
import ko from './ko';
import en from './en';

let currentLang: Language = 'ko';
const locales: Record<Language, Record<string, string>> = { ko, en };

export function setLanguage(lang: Language): void {
  currentLang = lang;
}

export function getLanguage(): Language {
  return currentLang;
}

/** Translate a key */
export function t(key: string, ...args: (string | number)[]): string {
  const locale = locales[currentLang];
  let str = locale[key] || key;
  // Simple positional replacement: {0}, {1}, etc.
  if (args.length > 0) {
    str = str.replace(/\{(\d+)\}/g, (_, idx) => String(args[Number(idx)] ?? ''));
  }
  return str;
}

/** Format key label for UI (en text helper) */
export function fmtSlotLabel(index: number): string {
  if (currentLang === 'en') return `Slot ${index + 1}`;
  return `${index + 1}번 슬롯`;
}

export function fmtDeckLabel(index: number): string {
  if (currentLang === 'en') return `Deck ${index + 1}`;
  return `덱 ${index + 1}`;
}
