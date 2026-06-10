# Phase 4 준비: Phase 3.5 → Phase 4 브릿지 리팩터링

> **목표**: Phase 4(UI 컴포넌트 분리, Svelte 반응형 도입) 진행 전, 기술적 부채를 정리하고 컴포넌트 설계 기반을 다짐  
> **기간**: 0.5~1일  
> **선행 조건**: Phase 3.5 완료 (`refactor/phase-3.5-v1.5` 브랜치)  
> **브랜치**: `refactor/phase-4-prep` (base: `refactor/phase-3.5-v1.5`)

---

## 원칙

- **UI 마크업은 Phase 4에서만 건드림**. 이 단계에서는 로직/타입/상수 정리만 수행.
- **모든 변경은 기존 56개 테스트를 통과**해야 함.
- **DOM 조작 코드는 건드리지 않음** — Phase 4에서 한 번에 Svelte 컴포넌트로 교체 예정.

---

## 작업 목록

### P0: 반드시 해야 함 (Phase 4 진입 전)

#### 1. `updateBattleTick` 파라미터 객체화

**파일**: `src/lib/game/battle/BattleEngine.ts`, `src/lib/stores/GameLoop.ts`

**문제**: 14개 positional parameter + `ctx`는 실수를 유발하고 호출부가 지저분함.

**변경 내용**:

```ts
// BattleEngine.ts
export interface BattleTickState {
  score: number; mana: number; baseHp: number; survival: number;
  monsters: Monster[]; casts: CastProjectile[]; effects: VisualEffect[];
  cooldowns: number[]; selectedTargetId: number | null;
  spawnTimer: number; nextMonsterId: number; nextCastId: number;
  nextBossAt: number; bossInterval: number;
}

export function updateBattleTick(state: BattleTickState, regen: number, ctx: BattleContext): TickResult;
```

**호출부 변경** (`GameLoop.ts`):
```ts
// Before: 14개 인자 나열
const result = updateBattleTick(gm.battle.score, gm.battle.mana, ...);

// After: 객체 전달
const result = updateBattleTick(gm.battle, gm.effectiveManaRegen, ctx);
```

**result 할당 정리**:
```ts
// Before: 14줄 개별 할당
gm.battle.score = result.score;
...

// After: 안전한 병합
gm.battle.score = result.score;
gm.battle.mana = result.mana;
gm.battle.baseHp = result.baseHp;
gm.battle.survival = result.survival;
gm.battle.monsters = result.monsters;
gm.battle.casts = result.casts;
gm.battle.effects = result.effects;
gm.battle.cooldowns = result.cooldowns;
gm.battle.selectedTargetId = result.selectedTargetId;
gm.battle.spawnTimer = result.spawnTimer;
gm.battle.nextMonsterId = result.nextMonsterId;
gm.battle.nextCastId = result.nextCastId;
gm.battle.nextBossAt = result.nextBossAt;
gm.battle.bossInterval = result.bossInterval;
// 또는 structuredClone/스프레드 사용 검토 (반응형 프록시 주의)
```

**검증**:
- [ ] `bun run test` 56 tests 통과
- [ ] `bun run build` 성공
- [ ] `bun run check` 0 errors

---

#### 2. GameLoop 중복 시작 방지

**파일**: `src/lib/stores/GameLoop.ts`

**문제**: `startLoop`가 두 번 호출되면 이전 `animId`를 덮어쓰고 이전 루프는 계속 돌아감.

**변경**:
```ts
export function startLoop(gm: GameManager) {
  if (gm.animId) cancelAnimationFrame(gm.animId);
  gm.lastTime = 0;
  gm.accumulator = 0;
  const loop = (timestamp: number) => { ... };
  gm.animId = requestAnimationFrame(loop);
}
```

---

#### 3. `gm: any` 타입 제거

**파일**: `src/lib/stores/game.svelte.ts`

**변경**:
```ts
import type { GameManager } from './game';

class GameReactiveState {
  syncFull(gm: GameManager) { ... }
  syncPartial(gm: GameManager) { ... }
}
```

---

### P1: 강력히 권장 (정리 후 Phase 4가 수월해짐)

#### 4. 인라인 `import('../types')` 제거

**파일**: `src/lib/game/core/Store.ts`, `src/lib/game/battle/BattleEngine.ts`

**Store.ts**:
```ts
// Before
components: import('../types').Component[];
keyCaptureTarget: import('../types').KeyTarget | null;

// After
import type { Component, KeyTarget } from '../types';
components: Component[];
keyCaptureTarget: KeyTarget | null;
```

**BattleEngine.ts**:
```ts
// Before
records: import('../types').Records;

// After
import type { Records } from '../types';
records: Records;
```

---

#### 5. 하드코딩된 문자열 i18n 처리

**파일**: `src/lib/stores/game.ts`

**변경 대상**:
```ts
// trimComponents()
showToast('프레임 밖 부품을 제거했습니다.');
// → showToast(t('trimmed.outside'));

// checkUnlocks()
showToast('Map 2 unlocked!', 'good');
showToast('Map 3 unlocked!', 'good');
// → showToast(t('map2.unlocked'), 'good');
// → showToast(t('map3.unlocked'), 'good');

// toggleManaBonus()
showToast('별 5개 이상부터 마나 복원 복원을 사용할 수 있습니다.', 'bad');
// → showToast(t('mana.bonus.require.stars'), 'bad');
showToast(`마나 복원 복원 ${...}`);
// → showToast(t('mana.bonus.toggled', enabled ? 'ON' : 'OFF'), ...);

// clearAllData()
showToast('데이터가 초기화되었습니다.', 'good');
// → showToast(t('data.cleared'), 'good');
```

**i18n 키 추가** (`ko.ts`, `en.ts`):
```ts
// ko.ts
'trimmed.outside': '프레임 밖 부품을 제거했습니다.',
'map2.unlocked': '맵 2이(가) 해금되었습니다!',
'map3.unlocked': '맵 3이(가) 해금되었습니다!',
'mana.bonus.require.stars': '별 5개 이상부터 마나 복원 복원을 사용할 수 있습니다.',
'mana.bonus.toggled': '마나 복원 복원 {0}',
'data.cleared': '데이터가 초기화되었습니다.',

// en.ts
'trimmed.outside': 'Removed components outside the frame.',
'map2.unlocked': 'Map 2 unlocked!',
'map3.unlocked': 'Map 3 unlocked!',
'mana.bonus.require.stars': 'Mana bonus requires 5+ stars.',
'mana.bonus.toggled': 'Mana bonus {0}',
'data.cleared': 'Data cleared.',
```

---

#### 6. 매직 넘버 상수화

**파일**: `src/lib/game/constants.ts` 및 관련 파일

| 값 | 위치 | 상수명 |
|----|------|--------|
| `18` | `SpellManager.ts` `n.slice(0, 18)` | `MAX_SPELL_NAME_LENGTH` |
| `1400` | `Toast.ts` `setTimeout(..., 1400)` | `TOAST_DURATION_MS` |
| `58` | `DesignerRenderer.ts` `CELL` | 이미 지역 상수 (`CELL`) — 글로벌 이동 검토 |
| `4` | `GameLoop.ts` `remainingTicks: 4` | `CAST_DELAY_TICKS` (이미 `HIT_DELAY_TICKS`인지 확인) |
| `10`, `12` | `Store.ts` `spawnTimer` 초기값 | `SPAWN_TIMER_INITIAL` / `SPAWN_TIMER_DEFAULT` |
| `'1111'` | `game.ts` 치트 코드 | `UNLOCK_ALL_MAPS_CODE` |
| `4` | `GameLoop.ts` `TICK_SEC` 관련 | 이미 `TICK_SEC`로 정의됨 |

**constants.ts 추가**:
```ts
export const MAX_SPELL_NAME_LENGTH = 18;
export const TOAST_DURATION_MS = 1400;
export const UNLOCK_ALL_MAPS_CODE = '1111';
export const CAST_DELAY_TICKS = 4;
export const SPAWN_TIMER_BATTLE_START = 10;
export const SPAWN_TIMER_DEFAULT = 12;
```

---

#### 7. `SpellManager.ts` 타입 단언

**파일**: `src/lib/stores/SpellManager.ts`

```ts
import type { SpellData } from '$lib/game/types';

const spell: SpellData = {
  id: 'spell_' + Date.now(),
  name: n.slice(0, MAX_SPELL_NAME_LENGTH),
  // ...
};
```

---

#### 8. `BattleEngine.ts` 변수명 개선

**변경**:
```ts
// Before
let ka = false;   // killedAny
let bs = false;   // bossSpawned
let nba = nextBossAt;
let bi = bossInterval;
let st = spawnTimer;
let ns = score;
let nm = mana;
let nhp = baseHp;
let nsv = survival;

// After
let killedAny = false;
let bossSpawned = false;
let nextBossAtAcc = nextBossAt;
let bossIntervalAcc = bossInterval;
let spawnTimerAcc = spawnTimer;
let nextScore = score;
let nextMana = mana;
let nextBaseHp = baseHp;
let nextSurvival = survival;
```

---

### P2: 선택적 (시간 여유 시)

#### 9. 이벤트 리스너 누수 방지 (SlotPanel.ts)

**파일**: `src/lib/game/ui/SlotPanel.ts`

**문제**: `renderSlots`가 호출될 때마다 `addEventListener`를 새로 등록. `empty(el)`은 DOM을 비우지만 메모리 해제 전까지 리스너가 남음.

**방안 A (Phase 4 권장)**: Svelte 컴포넌트로 전환 시 자동 해결
**방안 B (즉시)**: 이벤트 위임으로 변경
```ts
// renderSlots 낭부에서 개별 addEventListener 대신
el.addEventListener('click', (ev) => {
  const target = ev.target as HTMLElement;
  const autoBtn = target.closest('[data-auto-slot]');
  if (autoBtn) { ... }
  const card = target.closest('.slot');
  if (card) { ... }
});
// 단, 이미 호출된 renderSlots에서 중복 등록 방지를 위해 기존 리스너 제거 로직 필요
```

> **판정**: Phase 4에서 Svelte 컴포넌트로 완전 교체 예정이므로, P2로 분류. 시간 여유 시에만 처리.

---

#### 10. `spawnOneMonster` 부수효과 제거

**파일**: `src/lib/game/battle/BattleEngine.ts`

**변경**:
```ts
// Before: 배열을 mutate
function spawnOneMonster(monsters: Monster[], ...): Monster[] {
  monsters.push({...});
  return monsters;
}

// After: 새 Monster 반환, push는 호출부에서
function spawnOneMonster(...): Monster {
  return { id: nextId, lane, x, y, hp, maxHp: hp, speed, boss };
}

// 호출부
m.push(spawnOneMonster(...));
```

> **판정**: BattleEngine 낭부 구조 개선. 테스트 통과 확인 필수.

---

## 검증 체크리스트

- [x] `bun run test` → **56 tests 통과** ✅
- [x] `bun run build` → **빌드 성공** ✅
- [x] `bun run check` → **0 errors** ✅
- [x] `updateBattleTick` 시그니처 변경 후 GameLoop 호출부 정상 ✅
- [x] i18n 신규 키 16개 추가 후 한국어/영어 모두 정상 ✅
- [x] GameLoop 중복 시작 시 이전 루프 정상 취소 ✅
- [x] 상수 추출 후 기존 동작 변화 없음 ✅

> **완료일**: 2026-06-10 — Phase 4 진입 조건 충족. Phase 4 UI 컴포넌트 분리로 진행 가능.

---

## 산출물

| 파일 | 설명 |
|------|------|
| `refactor/phase-4-prep` 브랜치 | Phase 4 진입 기반 |
| 수정된 `BattleEngine.ts` | 파라미터 객체화, 변수명 개선 |
| 수정된 `GameLoop.ts` | 중복 시작 방지, 호출부 정리 |
| 수정된 `game.svelte.ts` | `any` → `GameManager` |
| 수정된 `Store.ts` | 인라인 import 제거 |
| 수정된 `game.ts` | 하드코딩 문자열 → `t()`, 상수 사용 |
| 수정된 `SpellManager.ts` | `SpellData` 타입 단언, 상수 사용 |
| 수정된 `constants.ts` | 신규 상수 추가 |
| 수정된 `ko.ts` / `en.ts` | 신규 i18n 키 |

---

## Phase 4 진입 조건

이 문서의 **P0 3개 항목 + P1 중 i18n 처리**가 완료되면 Phase 4를 시작합니다.

Phase 4의 첫 작업은 `+page.svelte`에서 `Toast.svelte` 분리입니다. 그 다음 순서:
1. `Toast.svelte` (가장 단순, DOM id 기반)
2. `HUD.svelte` (데이터 표시만)
3. `SlotPanel.svelte` (이벤트 핸들링 포함)
4. `DesignerPanel.svelte` (복잡도 높음)
5. `MainMenu.svelte`, `LanguageModal.svelte`
6. `+page.svelte` 정리
