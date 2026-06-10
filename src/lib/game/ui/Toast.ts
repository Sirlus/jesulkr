// ============================================================
// UI — Toast notification
// ============================================================
import { $ } from '../utils/dom';
import { t } from '../i18n';
import { TOAST_DURATION_MS } from '../constants';

let timer: ReturnType<typeof setTimeout> | null = null;

export function showToast(text: string, type?: 'good' | 'bad'): void {
  const el = $<HTMLDivElement>('toast');
  if (!el) return;
  el.textContent = text;
  el.className = 'show';
  if (type) el.classList.add(type);
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => { el.className = ''; }, TOAST_DURATION_MS);
}
