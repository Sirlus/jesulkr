# Changelog

## [2.0.0] - 2026-06-12

### Added
- v2 Green/Stability 시스템 통합 ([`docs/refactor/v2-green-stability/`](docs/refactor/v2-green-stability/TODO.md))
  - 9개 신규 부품: `red3`, `mediumWire`, `mediumHub`, `extractor`, `stabilizer`, `greenMana`, `green3x2`, `greenPair2`, `ultimateCore` (총 18개 ComponentType)
  - 3색상 마나 시스템 (빨강/파랑/초록) + 색상별 도선망 v3 (`buildColorConnectionGraph`)
  - 안정도(Stability) 시스템: `StabilitySystem` (체비셰프 거리 기반)
  - 추출기 색상 순환 UX (red → blue → green)
  - 전체 데미지(`globalDamage`) — 시전 시 모든 몬스터에 가해지는 추가 피해
  - `DamageResolver`로 데미지 처리 위임 (BattleEngine 단순화)
- 4개 신규 테스트 파일: `ExtractorSystem`, `StabilitySystem`, `ColorWireNetwork`, `GreenStatsCalculator`
- 9개 v2 부품 i18n 키 + 안정도/전체 데미지 용어 (ko/en)

### Changed
- 단위 테스트: 87 → **141 tests** (12 test files, `npm test` 모두 통과)
- `Component` 인터페이스: `color?: ExtractorColor` 필드 추가
- `SpellData`, `SpellStats` 인터페이스: `globalDamage`, `redManaCost`, `greenCount`, `greenManaCost`, `activeStabilizerCount`, `activeHubCount`, `maxStability` 필드 추가
- `BattleEngine.ts`: 데미지 해결 로직을 `DamageResolver.resolveCast`로 위임

### Fixed
- v2 부품의 인라인 `style:` 필드가 레지스트리에서 수집되지 않던 문제 — `def.ts`의 `ComponentDef` 인터페이스에 명시화

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
