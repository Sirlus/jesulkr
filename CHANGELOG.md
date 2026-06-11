# Changelog

## [1.3.0] - 2026-06-11

### Added
- SvelteKit 포팅 완료 (단일 HTML → 모듈 구조)
- 15개 Svelte 5 컴포넌트 (`src/lib/components/`)
- Vitest 기반 단위 테스트 (87 tests, 8 test files)
- 다국어 지원 (ko/en, `src/lib/game/i18n/`)
- ESLint 도입 (`eslint src` → 0 errors, 0 warnings)
- CHANGELOG.md

### Changed
- 단일 HTML → SvelteKit 모듈 구조 (7단계 리팩터링)
- DOM 직접 조작 → Svelte 선언적 템플릿 (15개 컴포넌트)
- `GameManager` 패턴 → Svelte 5 `$state` 반응형 상태 (`gameState.svelte.ts`)
- `gameRx` no-op 브릿지 제거 (Svelte `$effect`/`$derived`로 대체)
- Canvas 렌더링: offscreen 캐싱 추가 (정적 레이어 사전 렌더링)
- `structuredClone` 도입 (JSON fallback 포함)
- `clone()` 함수 개선: `structuredClone` 우선 사용

### Fixed
- 몬스터 속도가 생존 시간에 따라 증가하지 않던 버그
- 맵 2 별 조건 수정 (55,000/65,000/75,000)
- `updateBattleTick` 파라미터 객체화 (`BattleTickState` 인터페이스)
- `innerHTML` 보안 위험 제거 (Svelte 템플릿으로 대체)

### Removed
- `sass-embedded` (사용되지 않는 의존성)
- `package-lock.json` (bun.lock만 유지)
- `EventBus.ts`, `HUD.ts`, `SlotPanel.ts` (dead DOM 모듈)
- `game.svelte.ts` (→ `gameState.svelte.ts` + `toast.svelte.ts`)
- `vitest.config.ts` `globals: true` (명시적 import 사용)

### Accessibility
- Toast: `role="status"`, `aria-live="polite"`, `aria-atomic="true"`
- LanguageModal: `role="dialog"`, `aria-modal="true"`, focus trap
- DesignerPanel tool buttons: `aria-label` 추가
