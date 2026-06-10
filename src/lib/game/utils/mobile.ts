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
