# Phase 2: Core Logic

> **목표**: 원작 HTML v1.3과 100% 동일한 게임 밸런스 및 규칙 구현  
> **기간**: 1~2일  
> **브랜치**: `refactor/phase-2-core-logic` (base: `refactor/phase-1-foundation`)

---

## 2-1. 몬스터 속도 증가 복원

### 문제

`jesulkr-svelte`의 `BattleEngine.ts`에서 일반 몬스터 속도가 `42 + Math.random() * 18`으로 고정되어 있음.  
원작은 `42 + game.survival * 0.45 + Math.random() * 18`으로 생존 시간이 길어질수록 속도가 증가함.

### 변경 위치

`src/lib/game/battle/BattleEngine.ts`, `spawnOneMonster` 함수 (라인 31~46)

### 변경 내용

```ts
// 변경 전
const speed = boss ? 25 : (42 + Math.random() * 18);

// 변경 후
const speed = boss ? 25 : (42 + survival * 0.45 + Math.random() * 18);
```

### 주의사항

- `updateBattleTick` 함수 시그니처에 `survival`이 이미 포함되어 있음.
- `spawnOneMonster`에 `survival` 파라미터 추가 필요.

```ts
function spawnOneMonster(
  monsters: Monster[], forcedHp: number | null, boss: boolean,
  canvasWidth: number, nextId: number, minHp: number, maxHp: number,
  survival: number, // 추가
): Monster[] {
  // ...
  const speed = boss ? 25 : (42 + survival * 0.45 + Math.random() * 18);
  // ...
}
```

호출부도 수정:

```ts
// 보스 스폰
spawnOneMonster(m, ctx.map.bossHp || 500, true, ctx.canvasWidth, mId++, ctx.map.minHp, ctx.map.maxHp, nsv);

// 일반 몬스터 스폰
spawnOneMonster(m, null, false, ctx.canvasWidth, mId++, ctx.map.minHp, ctx.map.maxHp, nsv);
```

---

## 2-2. 맵 2 별 조건 수정

### 문제

`constants.ts`의 맵 2 별 조건이 `[55000, 60000, 65000]`으로 되어 있음.  
원작 코드는 `[55000, 65000, 75000]`.

### 변경 위치

`src/lib/game/constants.ts` (라인 38~42)

### 변경 내용

```ts
export const STAR_THRESHOLDS: Record<number, number[]> = {
  1: [15000, 20000, 25000],
  2: [55000, 65000, 75000], // ← 수정
  3: [60000, 70000, 80000],
};
```

### 연쇄 수정

- [ ] `README.md`의 맵 2 별 조건 테이블 동기화
- [ ] `GAME_DESIGN.md`의 맵 2 별 조건 동기화
- [ ] 원작 HTML의 맵 2 설명 텍스트도 `60000/65000`으로 잘못되어 있으나, 이는 원작의 텍스트 버그이므로 **코드 기준**으로 통일

---

## 2-3. `getTotalStars` 개선

### 문제

원작의 `getTotalStars(includeCurrentRun)` 파라미터가 `jesulkr-svelte`에서 사라짐.  
맵 선택 화면에서는 현재 전투 점수를 제외한 별 개수를 표시해야 하고,  
전투 중 HUD에서는 현재 전투 점수를 포함한 별 개수를 표시해야 함.

### 변경 위치

`src/lib/game/utils/progression.ts`

### 변경 내용

```ts
export function getTotalStars(
  records: Records,
  battle: BattleState,
  state: GameState,
  activeRunMapId: number | null,
  includeCurrentRun: boolean = true, // 추가
): number {
  let total = 0;
  const runId = (includeCurrentRun && (state === 'battle' || state === 'paused' || state === 'gameover') && battle.battleStarted)
    ? Number(activeRunMapId || 0) : 0;
  // ... 나머지 동일
}
```

`Store.ts`의 `totalStars` getter도 수정:

```ts
get totalStars(): number {
  return getTotalStars(this.records, this.battle, this.state, this.battle.activeRunMapId, true);
}
```

맵 선택 화면용 getter 추가 (나중에 맵 모달 구현 시 사용):

```ts
get totalStarsWithoutCurrent(): number {
  return getTotalStars(this.records, this.battle, this.state, this.battle.activeRunMapId, false);
}
```

---

## 2-4. `getEffectiveManaRegen` 일관성

### 문제

`Store.ts`의 `effectiveManaRegen` getter가 `getTotalStars`를 호출할 때 `includeCurrentRun` 개념이 모호함.

### 해결

```ts
get effectiveManaRegen(): number {
  const total = getTotalStars(this.records, this.battle, this.state, this.battle.activeRunMapId, true);
  return (total >= MANA_BONUS_STAR_COUNT && this.manaBonusEnabled) ? STAR_MANA_REGEN : BASE_MANA_REGEN;
}
```

---

## 2-5. 보스 등장 토스트 추가

### 문제

원작은 보스 등장 시 `"HP 500 보스 등장"` 토스트를 출력함.  
`jesulkr-svelte`에는 없음.

### 변경 위치

`src/lib/game/battle/BattleEngine.ts`의 `spawnOneMonster`

### 변경 내용

토스트는 `BattleEngine.ts`에서 직접 호출하면 순수 함수가 아니게 되므로,  
반환값에 `spawnedBoss: boolean`을 추가하거나, `TickResult`에 보스 스폰 여부를 포함.

```ts
export interface TickResult {
  // ... 기존 필드
  spawnedBoss?: boolean; // 추가
}
```

`GameManager`의 루프에서 처리:

```ts
// game.ts의 루프 내
const result = updateBattleTick(/* ... */);
if (result.spawnedBoss) {
  showToast(t('boss.appeared'), 'bad');
}
```

i18n 키 추가:
- `ko.ts`: `'boss.appeared': 'HP 500 보스 등장'`
- `en.ts`: `'boss.appeared': 'HP 500 boss appeared'`

---

## 2-6. 마나 재생 복원 토스트 추가

### 문제

원작의 `checkMapUnlocks`에서 별 5개 달성으로 마나 재생이 증가할 때 토스트를 출력함.  
`jesulkr-svelte`의 `checkUnlocks`에는 이 로직이 없음.

### 변경 위치

`src/lib/stores/game.ts`의 `checkUnlocks`

### 변경 내용

```ts
checkUnlocks() {
  if (!this.battle.activeRunMapId) return;
  const before2 = this.store.isMapUnlocked(2);
  const before3 = this.store.isMapUnlocked(3);
  const beforeStars = this.totalStars;
  const beforeRegen = this.effectiveManaRegen;
  this.recordRun();
  const after2 = this.store.isMapUnlocked(2);
  const after3 = this.store.isMapUnlocked(3);
  const afterStars = this.totalStars;
  const afterRegen = this.effectiveManaRegen;
  if (!before2 && after2) showToast(t('map2.unlocked'), 'good');
  else if (!before3 && after3) showToast(t('map3.unlocked'), 'good');
  else if (beforeStars < afterStars) showToast(t('star.earned', afterStars), 'good');
  if (beforeRegen < afterRegen) showToast(t('mana.bonus.activated', STAR_MANA_REGEN), 'good');
}
```

i18n 키 추가:
- `ko.ts`:
  - `'mana.bonus.activated': '별 5개 달성: 초당 마나 {0}'`
  - `'star.earned': '별 획득! ★ {0}/9'`
- `en.ts`:
  - `'mana.bonus.activated': '5 stars reached: mana regen {0}/sec'`
  - `'star.earned': 'Star earned! ★ {0}/9'`

---

## 2-7. `tryCastSlot` → 원작과 동일한 에러 메시지

### 문제

`jesulkr-svelte`의 `castSlot`은 에러 상황마다 부적절한 메시지를 출력함.  
원작은 상황별로 정확한 메시지를 출력함.

### 변경 위치

`src/lib/stores/game.ts`의 `castSlot`

### 변경 내용

```ts
castSlot(index: number) {
  const spell = this.slots[index];
  if (!spell) { showToast(t('no.spell'), 'bad'); return; }
  if (this.state !== 'battle') { showToast(t('battle.only'), 'bad'); return; }
  if (this.battle.cooldowns[index] > 0) { showToast(t('cooldown.active'), 'bad'); return; }
  if (this.battle.mana < spell.manaCost) { showToast(t('not.enough.mana'), 'bad'); return; }
  // ...
}
```

i18n 키 추가:
- `ko.ts`: `'cooldown.active': '아직 쿨타임입니다.'`
- `en.ts`: `'cooldown.active': 'Still on cooldown.'`

---

## 2-8. `freshBattle` → `startBattle` 순서 정리

### 문제

원작의 `startBattle`은 다음 순서를 따름:
1. `hasSavedSpell()` 체크
2. 진행 중 전투가 있으면 `recordCurrentRun()`
3. `currentMap`이 잠겨 있으면 첫 해금 맵으로
4. `freshBattle()` (상태 초기화)
5. `battleStarted = true`
6. `setState('battle')`

`jesulkr-svelte`는 대부분 유사하나, `spawnTimer` 초기값이 다름 (원작 10, svelte 12).

### 확인 및 수정

`src/lib/stores/game.ts`의 `startBattle`:

```ts
startBattle() {
  if (!this.hasSavedSpell) { showToast(t('spell.needed'), 'bad'); setState('design'); return; }
  if (this.battle.battleStarted && this.state !== 'gameover') this.recordRun();
  if (!this.store.isMapUnlocked(this.currentMap.id)) this.store.currentMap = this.store.getFirstUnlockedMap();
  const b = this.battle;
  b.score = 0; b.mana = MAX_MANA; b.baseHp = 20; b.survival = 0;
  b.monsters = []; b.casts = []; b.effects = [];
  b.cooldowns = [0, 0, 0, 0, 0]; b.selectedTargetId = null;
  b.spawnTimer = 10; // ← 원작과 동일하게 10으로 수정 (현재 12 또는 10)
  b.nextMonsterId = 1; b.nextCastId = 1;
  b.activeRunMapId = this.currentMap.id;
  b.activeRunMode = this.selectedRunMode;
  b.bossInterval = this.currentMap.bossInterval || 30;
  b.nextBossAt = this.currentMap.repeatingBoss ? (this.currentMap.firstBossAt || 30) : Infinity;
  this.battle.battleStarted = true;
  this.state = 'battle';
  showToast(`${this.currentMap.shortName} ${t('start')}`, 'good');
}
```

---

## 2-9. `spawnTimer` 초기값 통일

### 문제

- 원작 `freshBattle()`: `spawnTimer = 10`
- 원작 `createBattleState()`: `spawnTimer = 12`
- `jesulkr-svelte` `Store.ts`: `spawnTimer = 12`

### 결정

`freshBattle`의 값(10)을 신뢰. `Store.ts`의 초기값은 12로 유지필도 (게임 시작 전 대기 상태이므로).  
`startBattle`에서 `freshBattle` 호출 시 10으로 덮어쓰므로 문제 없음.

---

## 2-10. `normalizeSpell` id 필드

### 문제

원작: `id: raw.id || ("loaded_" + Date.now())`  
`jesulkr-svelte`: `id: r.id || \`loaded_${Date.now()}\``

→ 이미 동일함. 확인 완료.

---

## 2-11. `clearAllStorage` 구현

### 문제

원작에는 상세한 저장 데이터 초기화가 있으나, `jesulkr-svelte`에는 없음.

### 변경 위치

`src/lib/game/core/Storage.ts`에 re-export 추가  
`GameManager`에 메서드 추가 (또는 별도 유틸리티)

### 구현

```ts
// src/lib/stores/game.ts
clearAllData() {
  if (!confirm(t('confirm.clear.all'))) return;
  // 전투 상태 초기화
  this.battle.battleStarted = false;
  this.battle.activeRunMapId = null;
  this.battle.activeRunMode = null;
  // Storage 초기화
  Storage.clearAllStorage();
  // 상태 초기화
  this.store.loadFromStorage();
  this.state = 'design';
  this.refreshAll();
  showToast(t('data.cleared'), 'good');
}
```

`Storage.ts`에 추가:

```ts
export function clearAllStorage(): void {
  const keys = [
    C.STORAGE_KEY_SLOTS, C.STORAGE_KEY_SLOTS_LEGACY,
    C.STORAGE_KEY_DECKS, C.STORAGE_KEY_DECK_NAMES,
    C.STORAGE_KEY_KEY_BINDINGS, C.STORAGE_KEY_CONTROL_BINDINGS,
    C.STORAGE_KEY_SLOT_AUTO, C.STORAGE_KEY_AUTO_MANA_RESERVE,
    C.STORAGE_KEY_MANA_BONUS, C.STORAGE_KEY_LANGUAGE,
    C.STORAGE_KEY_RUN_MODE, C.STORAGE_KEY_RECORDS,
    C.STORAGE_KEY_RECORDS_LEGACY, C.STORAGE_KEY_RECORDS_OLD,
    C.STORAGE_KEY_UNLOCKS, C.STORAGE_KEY_UNLOCKS_LEGACY,
  ];
  for (const key of keys) {
    try { localStorage.removeItem(key); } catch { /* ignore */ }
  }
}
```

---

## 2-12. 검증 체크리스트

- [ ] 몬스터 속도가 생존 시간에 따라 증가함 (30초 후 약 55 px/s, 60초 후 약 69 px/s)
- [ ] 맵 2 별 3단계가 75,000점으로 동작
- [ ] 보스 등장 시 토스트 출력
- [ ] 별 5개 달성 시 마나 재생 토스트 출력
- [ ] `getTotalStars(false)`가 현재 전투 점수를 제외하고 계산
- [ ] 전투 시작 시 `spawnTimer = 10`
- [ ] 저장 데이터 전체 삭제 후 초기 상태로 복원
- [ ] `bun run test` 전체 통과

---
- [ ] `bun run test` 전체 통과
- [ ] `updateBattleTick` 시그니처 준비: 호출부를 `BattleTickState` 객체로 래핑 (Phase 6에서 최종 객체화)

---

## 2-13. `updateBattleTick` 파라미터 정리 (선행 작업)

| 참조 | IMPROVEMENTS.md §3.2 |
|------|---------------------|

`updateBattleTick` 이 14개 positional parameter를 받고 있어 가독성과 유지보수성이 낮음.

### 할 일

- [ ] Phase 2에서는 기존 시그니처를 유지하되, 호출부에서 객체로 래핑
- [ ] Phase 6에서 `BattleTickState` 인터페이스로 최종 전환

```ts
// Phase 2: 임시 래퍼
function tick() {
  const state = {
    score: battle.score, mana: battle.mana, baseHp: battle.baseHp,
    survival: battle.survival, monsters: battle.monsters,
    casts: battle.casts, effects: battle.effects,
    cooldowns: battle.cooldowns, selectedTargetId: battle.selectedTargetId,
    spawnTimer: battle.spawnTimer, nextMonsterId: battle.nextMonsterId,
    nextCastId: battle.nextCastId, nextBossAt: battle.nextBossAt,
    bossInterval: battle.bossInterval,
  };
  const result = updateBattleTick(
    state.score, state.mana, state.baseHp, state.survival,
    state.monsters, state.casts, state.effects,
    state.cooldowns, state.selectedTargetId,
    state.spawnTimer, state.nextMonsterId, state.nextCastId,
    state.nextBossAt, state.bossInterval, regen, ctx
  );
}
```

## 산출물

| 파일/브랜치 | 설명 |
|------------|------|
| `refactor/phase-2-core-logic` | 원작과 동일한 게임 밸런스 |
| 수정된 `constants.ts` | 맵 2 별 조건 |
| 수정된 `BattleEngine.ts` | 몬스터 속도 증가, 보스 토스트 플래그 |
| 수정된 `progression.ts` | `includeCurrentRun` 파라미터 |
| 수정된 `game.ts` | 토스트 메시지, `clearAllData` |
| 수정된 `Storage.ts` | `clearAllStorage` |
