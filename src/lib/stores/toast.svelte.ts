// ============================================================
// Toast state — Svelte 5 reactive toast notification
// ============================================================
import { TOAST_DURATION_MS } from '$lib/game/constants';

export const toastState = $state({
  visible: false,
  message: '',
  type: '' as 'good' | 'bad' | '',
  timer: null as ReturnType<typeof setTimeout> | null,
});

export function showToast(text: string, toastType?: 'good' | 'bad') {
  toastState.message = text;
  toastState.type = toastType || '';
  toastState.visible = true;
  if (toastState.timer) clearTimeout(toastState.timer);
  toastState.timer = setTimeout(() => { toastState.visible = false; }, TOAST_DURATION_MS);
}
