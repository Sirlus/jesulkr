# Phase 3: Reactive State — Svelte 5 룬 도입

> **목표**: GameManager의 명령형 상태 관리를 Svelte 5 `$state`, `$derived`, `$effect` 기반으로 전환
> **기간**: 3~4일
> **선행 조건**: Phase 2 완료 (모든 게임 로직 정합성 확보)
> **브랜치**: `refactor/phase-3-reactive` (base: `refactor/phase-2-core-logic`)

---

## 현재 상태 진단

| 참조 | IMPROVEMENTS.md §1.1, §1.2; CONSISTENCY_REPORT.md §6.2 |
|------|-------------------------------------------------------|

| 현재 문제 | 설명 |
|-----------|------|
| `GameManager` 가 순수 TypeScript 클래스 | Svelte 반응형과 완전히 단절. 상태 변경 시 수동 `refreshAll()` 호출 |
| `HUD.ts` → `document.getElementById().textContent` | DOM 직접 조작 |
| `SlotPanel.ts` → `document.createElement` | 명령형 DOM 생성 |
| `Toast.ts` → `className` 수동 토글 | 선언적 UI 전환 없음 |
| `game.ts` → `document.body.classList.toggle` | CSS 클래스 직접 제어 |
| `$derived(!langLoaded)` 가 일반 변수에 적용 | 반응형이 아닌 dead code |

---

## 3-0. 전략 — 점진적 마이그레이션

`GameManager`를 한 번에 `$state`로 전환하는 것은 리스크가 큼.
**3단계 점진적 마이그레이션**을 적용:

```
1단계: Store 필드를 $state로 래핑 (game.svelte.ts 신규)
2단계: 파생 값을 $derived로 전환
3단계: DOM 조작을 $effect로 이관 → GameManager 코드 제거
```

### 주의사항

- `$state`는 `.svelte.ts` 모듈에서만 동작
- 기존 `GameManager`의 public 메서드 시그니처 유지 → 호출부 변경 최소화
- Phase 1~2에서 작성한 테스트 회귀 없음이 최우선

---

## 3-1. `game.svelte.ts` 신규 생성

### 변경 위치

`src/lib/stores/game.svelte.ts` (신규)

### 변경 내용

```ts
// game.svelte.ts
import { Store } from '$lib/game/core/Store';
import type { GameState } from '$lib/game/types';

class GameReactiveState {
  store = new Store();
  
  ui = $state({
    state: 'design' as GameState,
    toastText: '',
    toastType: '' as '' | 'good' | 'bad',
  });
  
  stateLabel = $derived(this.computeStateLabel());
  isDesignMode = $derived(this.ui.state === 'design');
  
  private computeStateLabel(): string {
    const m: Record<string, string> = {
      ready: '준비', design: '설계 중',
      battle: '전투 중', paused: '일시정지', gameover: '게임 오버',
    };
    return m[this.ui.state] || this.ui.state;
  }
}

export const gameRx = new GameReactiveState();
```

### 연쇄 수정

- [ ] `game.ts` (GameManager) 에서 `gameRx.store` 참조하도록 수정
- [ ] `+page.svelte` → `gameRx` import 추가

---

## 3-2. `$state` / `$derived` 전환 대상

### 저장소 상태 (Store.ts 필드 → $state 래퍼)

| Store 필드 | 전환 | 방식 |
|-----------|------|------|
| `state`, `slots`, `slotAutoModes` | `$state` | 게임 루프에서 읽기/쓰기 빈번 |
| `battle.score`, `battle.mana`, `battle.baseHp` | `$state` | HUD 실시간 표시 |
| `battle.monsters`, `battle.casts`, `battle.effects` | `$state` | Canvas 렌더링 |
| `battle.cooldowns` | `$state` | SlotPanel 쿨타임 오버레이 |
| `battle.survival`, `battle.battleSpeed` | `$state` | HUD + 속도 버튼 |
| `designer.components`, `designer.tool` | `$state` | 설계판 렌더링 |
| `currentMap`, `unlocks`, `records` | `$state` | 맵 선택, 별 표시 |

### 파생 값 ($derived)

| 값 | 계산식 |
|----|--------|
| `totalStars` | `getTotalStars(records, battle, state, activeRunMapId, includeCurrentRun)` |
| `effectiveManaRegen` | `totalStars >= 5 && manaBonusEnabled ? 10 : 6` |
| `stateLabel` | `{ design: '설계 중', battle: '전투 중', paused: '일시정지', ... }` |
| `hasSavedSpell` | `slots.some(Boolean)` |
| `isMap2Unlocked`, `isMap3Unlocked` | `isMapUnlocked(2/3, unlocks, records)` |

---

## 3-3. DOM 조작 → `$effect` 이관

### `onStateChange()` 제거

**변경 전** (`game.ts`):
```ts
onStateChange() {
  const isDesign = this.store.state === 'design';
  document.body.classList.toggle('mode-design', isDesign);
  document.body.classList.toggle('mode-play', !isDesign);
  this.refreshAll();
}
```

**변경 후** (`game.svelte.ts`):
```ts
$effect(() => {
  const isDesign = gameRx.ui.state === 'design';
  document.body.classList.toggle('mode-design', isDesign);
  document.body.classList.toggle('mode-play', !isDesign);
});
```

> `refreshAll()` 호출은 제거 — `$effect` 가 자동으로 DOM 갱신

### HUD, SlotPanel, Toast 이관

| 기존 모듈 | 이관 대상 | 비고 |
|-----------|----------|------|
| `HUD.ts` → `updateHUD()` | `$effect` + `$derived` | Phase 4에서 `HUD.svelte`로 완전 대체 |
| `SlotPanel.ts` → `renderSlots()` | `$effect` + `$derived` | Phase 4에서 `SlotPanel.svelte`로 완전 대체 |
| `Toast.ts` → `showToast()` | `$effect` (gameRx.ui.toastText 감시) | Phase 4에서 `Toast.svelte`로 완전 대체 |

### 토스트 이관 예시

```ts
// game.svelte.ts
let toastTimer: ReturnType<typeof setTimeout>;

export function showToast(text: string, type: 'good' | 'bad' = 'good') {
  gameRx.ui.toastText = text;
  gameRx.ui.toastType = type;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { gameRx.ui.toastText = ''; }, 1400);
}
```

---

## 3-4. BattleEngine → `$state` 호환

### 문제

`updateBattleTick()` 이 현재 상태를 mutate 하지 않고 새 `TickResult` 객체를 반환.
이를 `$state` 객체에 재할당하면 반응형 전파 발생.

### 변경 내용

```ts
// game loop 내부
const result = updateBattleTick(/* ... */, ctx);
// $state 내부 객체에 재할당 → 반응형 전파
Object.assign(gameRx.store.battle, result);

if (result.isGameOver) {
  gameRx.store.state = 'gameover';
}
```

### 주의사항

- `Object.assign` 은 1-depth 복사 → 중첩 배열은 참조 유지
- 배열 변경 감지를 위해 `structuredClone(result)` 사용 검토

---

## 3-5. +page.svelte 연동

### 변경 전
```svelte
<script>
  import { game } from '$lib/stores/game';
  let langLoaded = Storage.loadLanguage();
  let showLangModal = $derived(!langLoaded); // ❌ dead code
</script>
```

### 변경 후
```svelte
<script>
  import { gameRx, showToast } from '$lib/stores/game.svelte';
  import { game } from '$lib/stores/game'; // 메서드 호출용
  
  let langLoaded = $state(Storage.loadLanguage());
</script>

{#if !langLoaded}
  <LanguageModal onSelect={(lang) => { langLoaded = lang; game.setLanguage(lang); }} />
{/if}

<div class:hidden={!gameRx.isDesignMode}>
  <DesignerPanel />
</div>

<Toast /> <!-- gameRx.ui.toastText 변경 시 자동 표시 -->
```

---

## 3-6. EventBus 제거

### 문제

`EventBus`는 상태 변경을 구독자에게 알리기 위한 패턴이나,
`$state` + `$effect` 로 대체 가능.

### 변경 내용

- [ ] `EventBus.ts` → 제거
- [ ] `Store.emit('records')` → 제거 (별 재계산은 `$derived` 가 자동)
- [ ] `Store.emit('state')` → 제거 (`$state` 변경이 직접 감지됨)

---

## 검증 체크리스트

- [ ] `npm run dev` → 화면 렌더링 정상
- [ ] Phase 1~2 테스트 전부 통과 (회귀 없음)
- [ ] 설계판: 도구 선택/배치/삭제 동작
- [ ] 슬롯: 저장/불러오기/슬롯 클릭 동작
- [ ] 전투: 시작/일시정지/재시작/배속 동작
- [ ] HUD: 점수/마나/기지HP/생존시간 실시간 갱신
- [ ] 토스트: 메시지 표시/사라짐
- [ ] 언어 전환: 모든 UI 텍스트 갱신

---

## 완료 기준

- [ ] `game.svelte.ts` 모듈 정상 동작
- [ ] 상태 변경 시 HUD, 슬롯, 토스트 자동 갱신
- [ ] `refreshAll()`, `refreshSlots()`, `refreshHUD()` 호출 대부분 제거
- [ ] `onStateChange()` 메서드 제거
- [ ] `EventBus` 제거
- [ ] Phase 1~2 테스트 모두 통과 (회귀 없음)

## 산출물

| 파일 | 설명 |
|------|------|
| `src/lib/stores/game.svelte.ts` | $state/$derived/$effect 기반 반응형 상태 |
| `src/lib/stores/game.ts` | GameManager 유지 (메서드 레이어, store → gameRx.store) |
| `src/lib/game/core/EventBus.ts` | 제거 |
| `src/lib/game/ui/HUD.ts` | → $effect로 이관 (Phase 4에서 제거) |
| `src/lib/game/ui/SlotPanel.ts` | → $effect로 이관 (Phase 4에서 제거) |
| `src/lib/game/ui/Toast.ts` | → $effect + Toast.svelte (Phase 4에서 제거) |
