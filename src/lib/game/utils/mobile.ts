// ============================================================
// Mobile layout detection utilities
// ============================================================

/** 모바일 레이아웃이 현재 적용 중인지 확인 (body.mobile-layout 클래스 기준) */
export function isMobileLayout(): boolean {
  return typeof document !== 'undefined' && document.body.classList.contains('mobile-layout');
}

/** 모바일 레이아웃을 사용해야 하는 환경인지 확인 (좁은 화면 or 터치 기기) */
export function shouldUseMobileLayout(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(pointer: coarse)').matches || window.matchMedia('(max-width: 820px)').matches;
}

/** body에 mobile-layout 클래스를 토글합니다 */
export function updateMobileLayout(): void {
  if (typeof document === 'undefined') return;
  const useMobile = shouldUseMobileLayout();
  document.body.classList.toggle('mobile-layout', useMobile);
}

/** 모바일에서 디자이너 보드를 화면 너비에 맞게 스케일링합니다 */
export function applyMobileDesignerScale(
  board: HTMLElement,
  width: number,
  height: number,
): void {
  if (!shouldUseMobileLayout() || !board.parentElement) {
    board.style.transform = '';
    return;
  }
  const wrap = board.parentElement;
  const fullW = width * 62 - 4;
  const available = Math.max(220, wrap.clientWidth - 12);
  const scale = Math.min(1, available / Math.max(1, fullW));
  board.style.transform = `scale(${scale.toFixed(4)})`;
  board.style.transformOrigin = 'top center';
}
