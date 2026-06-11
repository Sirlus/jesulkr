# Jesulkr-svelte 개선 제안서

> **범위**: 원작 HTML과의 비교가 아닌, `jesulkr-svelte` 프로젝트 자체의 코드 품질, 아키텍처, SvelteKit 활용도 중심  
> **검토일**: 2026-06-10

---

## 1. SvelteKit / Svelte 5 활용 미흡

현재 프로젝트는 SvelteKit + Svelte 5를 사용하지만, **프레임워크의 핵심 기능을 거의 활용하지 않고 Vanilla JS 방식**으로 작성되어 있습니다.

### 1.1 반응형 시스템 미사용

| 현재 | 개선 방향 |
|------|----------|
| `GameManager`가 순수 TypeScript 클래스. Svelte의 반응형과 완전히 단절됨. | 게임 상태를 `$state()` 룬으로 관리하고, 컴포넌트에서 직접 바인딩. |
| `updateHUD()`, `renderSlots()` 등을 명시적 호출로 DOM 갱신 | Svelte 템플릿의 `{@html}` 또는 조걸 블록으로 선언적 렌더링 |
| `+page.svelte`에서 `onMount` 내 `addEventListener`로 직접 이벤트 바인딩 | Svelte의 `on:click`, `on:keydown` 디렉티브 사용 |
| `$derived(!langLoaded)`가 일반 변수에 적용되어 반응형이 아님 | `$state()`로 선언하거나 `$effect`로 감시 |

### 1.2 DOM 직접 조작 남용

| 위치 | 현재 | 개선 |
|------|------|------|
| `HUD.ts` | `document.getElementById`로 직접 textContent 변경 | Svelte 컴포넌트 props로 전달 |
| `SlotPanel.ts` | `document.createElement`로 슬롯 카드 생성 | `{#each}` 블록으로 선언적 렌더링 |
| `Toast.ts` | className 직접 토글 | `<div class:show={visible}>` |
| `game.ts` | `document.body.classList.toggle` | Svelte의 `class:` 디렉티브 또는 `$effect` |

### 1.3 Svelte 컴포넌트 분리 부재

`+page.svelte` 하나에 176줄의 마크업이 모두 들어 있습니다. 다음과 같이 분리하는 것을 권장합니다:

```
src/lib/components/
├── LanguageModal.svelte
├── MainMenu.svelte
├── HUD.svelte
├── BattleCanvas.svelte
├── SlotPanel.svelte
├── DesignerPanel.svelte
├── MapSelectModal.svelte
├── KeySettingsModal.svelte
└── Toast.svelte
```

---

## 2. 빌드 / 개발 환경

### 2.1 SvelteKit 설정

| 문제 | 현재 | 권고 |
|------|------|------|
| 설정 위치 | `adapter`, `paths`가 `vite.config.ts`의 `sveltekit()` 낶에 있음 | `svelte.config.js`를 신규 생성하여 `kit.adapter`, `kit.paths`로 이동 |

### 2.2 불필요한 의존성 / 설정

| 항목 | 현재 | 권고 |
|------|------|------|
| `sass-embedded` | `devDependencies`에 있으나 `.scss` 파일이 전혀 없음 | 제거 또는 스타일을 SCSS로 마이그레이션 |
| `globals: true` (vitest) | 테스트 파일이 모두 `import { describe, it, expect } from 'vitest'`를 명시 | `globals: true` 제거 |
| 패키지 매니저 | `bun.lock` + `package-lock.json` 동시 존재 | 하나만 유지 (권장: `bun.lock`) |

---

## 3. 코드 품질 / 아키텍처

### 3.1 God Object (GameManager)

`GameManager`가 **초기화, 설계, 전투, 저장, 설정, 렌더링** 등 너무 많은 책임을 가지고 있습니다.

```
현재: GameManager (280줄, 20개 이상의 public 메서드)
권고:
├── BattleController      # 전투 시작/일시정지/재시작/배속
├── DesignerController    # 설계 도구, 배치, 저장/불러오기
├── InputController       # 키보드/마우스/터치 입력
├── UIRenderer            # HUD, 슬롯, 토스트 (Svelte로 대체 권장)
└── StorageManager        # 저장/불러오기/마이그레이션
```

### 3.2 함수 파라미터 과다

`updateBattleTick`이 **14개의 positional parameter**를 받습니다.

```ts
// 현재 (권장하지 않음)
export function updateBattleTick(
  score, mana, baseHp, survival, monsters, casts, effects,
  cooldowns, selectedTargetId, spawnTimer, nextMonsterId, nextCastId,
  nextBossAt, bossInterval, regen, ctx
): TickResult

// 개선 (객체 구조화)
export function updateBattleTick(
  state: BattleTickState,
  ctx: BattleContext
): TickResult
```

### 3.3 타입 안정성

| 위치 | 문제 | 개선 |
|------|------|------|
| `StorageRecords.ts` | `saved: any` 사용 | `unknown` + 타입 가드 함수 |
| `Store.ts` | `import('../types').Component` 인라인 import | 파일 상단에서 정식 import |
| `game.ts` | `RunMode`가 `'assist' \| 'pure'`로 정의되었으나 `string`으로 취급되는 곳 다수 | `RunMode` 타입을 엄격하게 적용 |
| `BattleEngine.ts` | `ctx.runMode: string` | `ctx.runMode: RunMode` |

### 3.4 중복 정의

| 항목 | 위치 | 개선 |
|------|------|------|
| `BattleState` | `types.ts`와 `Store.ts`에 각각 정의 | `types.ts`의 것을 단일 소스로 사용 |
| `DesignerState` | `Store.ts`에만 존재 (types.ts에 없음) | 공통 타입으로 이동 |

### 3.5 i18n 품질

| 문제 | 위치 | 개선 |
|------|------|------|
| 중복 키 | `ko.ts`: `'scatter'` 2회, `en.ts`: `'scatter'` 2회, `'pause'` 2회 | 중복 제거 |
| 번역 누락 가능성 | 키 기반 방식은 누락 시 fallback으로 키 자체가 노출 | `t()`에서 누락 키 감지 로직 추가 (dev 모드에서만) |

---

## 4. 성능

### 4.1 Canvas 렌더링

| 현재 | 문제 | 개선 |
|------|------|------|
| `ctx.clearRect(0,0,w,h)` 후 전체 재렌더링 | 배경, 레인, 기지 등 매 프레임 동일한 요소를 다시 그림 | 정적 요소(배경, 레인)는 별도 offscreen canvas에 캐싱 |
| Canvas 크기 고정 `720x520` | 고해상도 디스플레이에서 blur | `devicePixelRatio` 고려한 동적 크기 조정 |

### 4.2 저장 (localStorage)

| 현재 | 문제 | 개선 |
|------|------|------|
| 모든 저장이 즉시 동기 `localStorage.setItem` | 빈번한 쓰기 (특히 전투 중 키 입력, 슬롯 토글 등) | debounce(300ms) 적용 또는 `requestIdleCallback` 활용 |
| `JSON.parse(JSON.stringify(obj))`로 deep clone | 큰 설계 데이터(11x11 그리드) 시 비효율 | structuredClone 사용 (브라우저 호환 확인) |

### 4.3 설계판 렌더링

| 현재 | 문제 | 개선 |
|------|------|------|
| `renderDesigner()`가 매번 `innerHTML=""` 후 전체 재생성 | 부품 30개 이상 시 DOM 조작 비용 | 가상 DOM diffing 또는 Svelte의 `{#each}`로 대체 |

---

## 5. 접근성 (a11y)

| 영역 | 현재 | 권고 |
|------|------|------|
| 토스트 알림 | 시각적 `.show` 클래스 토글만 | `role="status"`, `aria-live="polite"` 추가 |
| 언어 선택 | `aria-modal="true"`는 있으나 `aria-labelledby` 연결 미흡 | `aria-labelledby`와 초점 트랩 구현 |
| 버튼 | 이모지만 있는 버튼 다수 (🔴🔵⭕) | `aria-label` 또는 시각적 텍스트 제공 |
| 색상 대비 | CSS `--muted:#9fb2cf` 등 일부 색상 | WCAG AA 기준(4.5:1) 충족 여부 검증 |
| 키보드 | `Escape` 일부 처리 외 Tab 순환 미흡 | `tabindex`, `focus-visible` 체계적 적용 |

---

## 6. 테스트

### 6.1 누락된 테스트 영역

| 대상 | 현재 | 필요성 |
|------|------|--------|
| `BattleEngine.ts` | 없음 | 핵심 게임 로직. 회귀 방지 필수 |
| `BattleRenderer.ts` | 없음 | Canvas API mocking으로 시각적 출력 검증 가능 |
| `Storage*.ts` | 없음 | localStorage mocking으로 마이그레이션 로직 검증 |
| `HUD.ts` / `SlotPanel.ts` / `Toast.ts` | 없음 | DOM 조작 로직의 단위 테스트 |
| `game.ts` (GameManager) | 없음 | 통합 테스트 수준에서 핵심 시나리오 검증 필요 |

### 6.2 테스트 커버리지 현황

```
현재 테스트 커버리지:
✅ StatsCalculator.test.ts    (통계 계산)
✅ WireNetwork.test.ts         (도선 연결)
✅ Components.test.ts          (부품 배치)
✅ TargetingSystem.test.ts     (타겟팅)

❌ BattleEngine.test.ts        (누락)
❌ BattleRenderer.test.ts      (누락)
❌ StorageSlots.test.ts        (누락)
❌ StorageRecords.test.ts      (누락)
❌ GameManager.test.ts         (누락)
```

---

## 7. 보안

| 항목 | 현재 | 위험도 | 개선 |
|------|------|--------|------|
| `innerHTML` 사용 | `updateStatsDisplay`, `renderSlots` 등 | 중간 | 사용자 입력이 아닌 낶部 생성 HTML이나, `escapeHtml` 적용 일관성 확인 |
| localStorage XSS | 사용자가 입력한 술식 이름, 덱 이름 등이 직접 저장 | 낮음 | 저장 직전 `escapeHtml` 또는 저장 후 렌더링 시 이스케이프 |
| HTML 주입 | `translateForLang`에서 DOM textNode 직접 변경 (원작 기준) | 낮음 | Svelte로 전환 시 자동 방지됨 |

---

## 8. 유지보수성

### 8.1 문서화

| 항목 | 현재 | 권고 |
|------|------|------|
| JSDoc / TSDoc | 거의 없음 | public API(`GameManager`, `Storage` 모듈)에 최소한의 JSDoc 추가 |
| CHANGELOG | 없음 | `CHANGELOG.md` 도입. 버전별 기능/버그/변경사항 기록 |
| 컴포넌트 문서 | 없음 | Storybook 도입 검토 (복잡도 대비 효과 적을 수 있음) |

### 8.2 코드 일관성

| 항목 | 현재 | 권고 |
|------|------|------|
| 따옴표 | `'string'`과 `"string"` 혼용 | Prettier 설정으로 통일 (현재 `prettier --check .`만 있음) |
| 세미콜론 | 일부 누락 | `prettier` 실행으로 자동 정렬 (현재 format 스크립트 있음) |
| 인덴트 | 일부 2칸, 일부 4칸 혼용 | Prettier로 통일 |

### 8.3 린트 / 타입 체크

| 항목 | 현재 | 권고 |
|------|------|------|
| ESLint | 없음 | `eslint` + `@typescript-eslint` + `eslint-plugin-svelte` 도입 |
| svelte-check | `check` 스크립트에 있음 | CI workflow에 `bun run check` 추가 |
| strict TypeScript | `strict: true` | ✅ 양호. 다만 `any` 사용처 제거 필요 |

---

## 9. 개선 우선순위 정리

```
P0 (즉시) ───┬─ svelte.config.js 생성 + vite.config.ts 정리
             ├─ GameManager 7개 미구현 메서드 구현
             └─ 몬스터 속도 증가 로직 복원 (게임 밸런스)

P1 (1주 내) ─┬─ Svelte 반응형 도입 ($state, $derived, $effect)
             ├─ DOM 직접 조작 → Svelte 선언적 템플릿 전환
             ├─ 컴포넌트 분리 (LanguageModal, SlotPanel, DesignerPanel 등)
             ├─ updateBattleTick 파라미터 객체화
             └─ 맵 선택 / 덱 관리 / 키 설정 모달 구현

P2 (2주 내) ─┬─ BattleEngine.ts 단위 테스트
             ├─ Storage 모듈 테스트 (localStorage mocking)
             ├─ 접근성 속성 추가 (aria-live, aria-label)
             ├─ i18n 중복 키 정리
             └─ GameManager 책임 분리 (BattleController, DesignerController 등)

P3 (한 달) ──┬─ Canvas offscreen 캐싱 (성능)
             ├─ devicePixelRatio 대응
             ├─ ESLint 도입
             ├─ JSDoc 추가
             └─ CHANGELOG 작성
```

---

## 10. 결론

`jesulkr-svelte`는 **모듈 분리와 타입 안전성 측면에서 원작보다 우수한 기반**을 가지고 있습니다.  
그러나 **SvelteKit/Svelte 5의 장점을 전혀 활용하지 못하고 있으며**, Vanilla JS 방식의 명령형 DOM 조작이 코드 전반에 남아 있어 프레임워크 전환의 의미가 반감되고 있습니다.

가장 중요한 것은 다음 두 가지입니다:

1. **Svelte의 선언적 템플릿으로 전환**: `innerHTML`, `document.createElement`, `classList.toggle` 등을 Svelte의 `{#if}`, `{#each}`, `bind:`, `class:`로 대체해야 합니다.
2. **반응형 상태 관리 도입**: `GameManager`의 직접 할당 방식을 `$state()` 기반으로 바꾸면, UI 갱신 로직의 상당 부분이 자동화됩니다.

이 두 가지를 중심으로 리팩토링하면, 코드량은 줄어들고 유지보수성은 크게 향상될 것입니다.
