// ============================================================
// i18n — Internationalization
// ============================================================
import type { Language } from '../types';
import { lang } from './language.svelte';
import ko from './ko';
import en from './en';

const locales: Record<Language, Record<string, string>> = { ko, en };

export function setLanguage(l: Language): void {
  lang.current = l;
}

export function getLanguage(): Language {
  return lang.current;
}

/** Translate a key */
export function t(key: string, ...args: (string | number)[]): string {
  const locale = locales[lang.current];
  let str = locale[key] || key;
  // Simple positional replacement: {0}, {1}, etc.
  if (args.length > 0) {
    str = str.replace(/\{(\d+)\}/g, (_, idx) => String(args[Number(idx)] ?? ''));
  }
  return str;
}

/** Format key label for UI (en text helper) */
export function fmtSlotLabel(index: number): string {
  if (lang.current === 'en') return `Slot ${index + 1}`;
  return `${index + 1}번 슬롯`;
}

export function fmtDeckLabel(index: number): string {
  if (lang.current === 'en') return `Deck ${index + 1}`;
  return `덱 ${index + 1}`;
}
