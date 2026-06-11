# Jesulkr v1.5 API 문서

이 문서는 게임 개발 및 확장 시 직접 사용하게 되는 주요 클래스와 함수의 공개 인터페이스를 설명합니다.

원작 HTML v1.5를 SvelteKit + Svelte 5로 포팅한 버전의 API를 다룹니다.

> **2026-06-11 기준**: Phase 0~5 리팩터링 완료. 모든 GameManager 메서드가 구현되었으며, `svelte-check` 0 errors 상태입니다. v1.5 기능(도구 해금, 마나 보너스 토글, 덱 관리, 키 설정, 설계 미리보기 등)이 모두 통합되었습니다.

---

## GameManager (`src/lib/stores/game.ts`)

전체 게임의 진입점이자 중앙 제어기입니다. 애플리케이션 전역에서 하나의 인스턴스만 존재합니다.

```ts
import { game } from '$lib/stores/game';
```

### 초기화

#### `initClient()`
브라우저 환경에서 한 번 호출합니다. `localStorage`로부터 모든 저장 데이터를 로드하고 언어를 설정합니다.

```ts
if (typeof window !== 'undefined') game.initClient();
```

#### `initCanvas(canvas: HTMLCanvasElement)` ✅
전투 캔버스를 초기화하고 렌더링 루프를 시작합니다.

```ts
const canvas = document.getElementById('battleCanvas') as HTMLCanvasElement;
game.initCanvas(canvas);
```

---

### 상태 접근자 (Getters)

| 속성 | 타입 | 설명 |
|------|------|------|
| `state` | `GameState` | 현재 화면 상태 (`design`, `ready`, `battle`, `paused`, `gameover`) |
| `designer` | `DesignerState` | 설계판 상태 (크기, 부품, 도구) |
| `battle` | `BattleState` | 전투 상태 (점수, 마나, 몬스터 등) |
| `slots` | `(SpellData \| null)[]` | 5개 술식 슬롯 |
| `currentMap` | `MapDef` | 현재 선택된 맵 |
| `selectedRunMode` | `string` | 현재 기록 모드 (`assist` / `pure`) |
| `keyBindings` | `KeyBinding[]` | 슬롯 키 바인딩 |
| `controlBindings` | `Record<string, KeyBinding>` | 조작 키 바인딩 |
| `unlocks` | `Record<string, boolean>` | 맵/부품 해금 상태 |
| `records` | `Records` | 맵별 최고 기록 |
| `totalStars` | `number` | 전체 획득 별 개수 |
| `effectiveManaRegen` | `number` | 현재 적용 중인 마나 재생량 |
| `hasSavedSpell` | `boolean` | 슬롯에 저장된 술식이 하나라도 있는지 |
| `manaBonusEnabled` | `boolean` | 별 본너스 마나 재생 ON/OFF |

---

### 설계 (Designer)

#### `setTool(tool: string)` ✅
현재 선택 도구를 변경합니다.

```ts
game.setTool('circle');   // 1칸 회로 선택
game.setTool('eraser');   // 지우개 선택
```

#### `rotateTool()` ✅
회전 가능한 도구(`oval`, `mixed2`)의 방향을 토글합니다.

#### `setFrame(w: number, h: number)` ⚠️ 부분 동작
설계판 크기를 변경합니다. 범위는 1×1 ~ 11×11.

> `setFrame()` 내에서 호출됩니다.

```ts
game.setFrame(3, 3);  // 3×3 설계판
```

#### `placeComponent(e: MouseEvent): boolean` ✅
마우스 이벤트 위치에 현재 선택한 도구를 배치합니다. 배치 성공 여부를 반환합니다.

```ts
board.addEventListener('mousedown', (e) => {
  game.placeComponent(e);
});
```

#### `eraseComponent(e: MouseEvent): void` ✅ 구현됨
마우스 위치의 부품을 제거합니다.

#### `clearDesign(): void` ✅ 구현됨
설계판의 모든 부품을 제거합니다.

> "설계 초기화" 버튼의 `onclick`에 연결되어 있습니다.

#### `saveSpell(name: string, slotIndex: number): void` ✅ 구현됨
현재 설계를 지정한 슬롯에 저장합니다. 유효하지 않은 설계는 저장되지 않습니다.

```ts
game.saveSpell('화염구', 0);  // 0번 슬롯에 저장
```

#### `loadSpell(slotIndex: number): void` ✅ 구현됨
지정한 슬롯의 술식을 설계판으로 불러옵니다.

> 전투가 아닐 때 슬롯 클릭 시 호출됩니다.

#### `spellStats(): SpellStats` ✅ 구현됨
현재 설계의 통계를 계산하여 반환합니다.

> `updateStatsDisplay()`와 `routes/test/+page.svelte`에서 호출하고 있습니다.

```ts
const stats = game.spellStats();
console.log(stats.damage, stats.manaCost, stats.valid);
```

#### `renderDesigner(): void` ✅ 구현됨
설계판 DOM을 그립니다.

> `placeComponent`, `setTool`, `rotateTool`, `clearDesign`, `loadSpell`, `setFrame` 등에서 호출됩니다.

#### `trimComponents(): void` ✅ 구현됨
프레임 크기를 벗어난 부품을 제거합니다.

> `setFrame()` 낶에서 호출됩니다.

---

### 전투 (Battle)

#### `startBattle()` ✅
전투를 시작합니다. 저장된 술식이 없으면 토스트 메시지를 출력합니다.

> ⚠️ `recordRun()`이 미구현이어서, 이미 진행 중인 런이 있을 때 이전 기록 저장 단계에서 런타임 오류가 발생할 수 있습니다.

#### `restartBattle()` ✅
현재 맵으로 전투를 즉시 재시작합니다.

#### `togglePause()` ✅
전투 중이면 일시정지, 일시정지 중이면 재개합니다.

#### `toggleDesigner()` ✅
설계 화면과 전투 화면을 전환합니다.

#### `castSlot(index: number)` ✅
지정한 슬롯의 술식을 수동 발사합니다.

> ⚠️ `state !== 'battle'`인 상황에서 원작과 다른 `"마나 부족"` 메시지를 출력합니다.

```ts
game.castSlot(0);  // 0번 슬롯 발사
```

#### `setBattleSpeed(speed: number)` ✅
전투 속도를 설정합니다. 허용 값: `1, 2, 4, 8`.

```ts
game.setBattleSpeed(4);  // 4배속
```

#### `onCanvasClick(e: MouseEvent)` ✅
캔버스 클릭 시 호출합니다. 클릭한 위치의 몬스터를 수동 타겟팅합니다.

#### `recordRun(): void` ✅ 구현됨
전투 종료/재시작 시 기록을 저장합니다.

> `startBattle()`과 `checkUnlocks()`에서 호출합니다.

#### `startLoop(): void` ✅ 구현됨
`initCanvas()`가 호출하는 Canvas 렌더링/업데이트 루프입니다.

---

### 설정 (Settings)

#### `setLanguage(lang: 'ko' | 'en')` ✅
게임 언어를 변경하고 `localStorage`에 저장합니다.

```ts
game.setLanguage('en');
```

#### `getSlotKeyLabel(index: number): string` ✅
지정한 슬롯에 할당된 키의 표시 이름을 반환합니다.

#### `isMapUnlocked(id: number): boolean` ✅
맵이 해금되었는지 확인합니다.

#### `getMapStars(id: number): number` ✅
특정 맵의 현재 획득 별 개수를 반환합니다.

---

## 통계 계산 (`src/lib/game/designer/StatsCalculator.ts`)

### `calculateSpellStats(model: SpellModel): SpellStats` ✅

설계된 술식의 모든 통계를 계산합니다.

```ts
import { calculateSpellStats } from '$lib/game/designer/StatsCalculator';

const stats = calculateSpellStats({
  width: 2,
  height: 2,
  components: [
    { id: 1, type: 'red', x: 0, y: 0, w: 1, h: 1, rotation: 0 },
    { id: 2, type: 'circle', x: 1, y: 0, w: 1, h: 1, rotation: 0 },
  ],
});

console.log(stats);
// {
//   castTime: 4,      // 2×2 = 4 tick
//   seconds: 0.2,     // 4/20초
//   manaCost: 1,      // 빨간 마나 1개
//   redCount: 1,
//   activeBlueCount: 0,
//   inactiveBlueCount: 0,
//   damage: 1,        // circle에 연결된 빨강 1개
//   aoeDamage: 0,
//   breakdown: [...], // 계산 상세 내역
//   valid: true,      // 저장 가능
// }
```

---

## 전투 업데이트 (`src/lib/game/battle/BattleEngine.ts`)

### `updateBattleTick(...): TickResult` ✅

고정 시간 간격(tick) 단위로 전투 상태를 업데이트합니다. 직접 호출하기보다는 `GameManager`의 루프 낶에서 사용됩니다.

> ⚠️ `spawnOneMonster`의 일반 몬스터 속도에 `survival * 0.45` 증가분이 누락되어 있어 원작 밸런스와 다릅니다.

**핵심 파라미터**:
- `regen`: 초당 마나 재생량
- `ctx: BattleContext`: 슬롯, 맵, 모드 등 전투 맥락

**반환값** (`TickResult`):
- `score`, `mana`, `baseHp`, `survival`: 갱신된 전투 수치
- `monsters`, `casts`, `effects`: 갱신된 엔티티 배열
- `cooldowns`: 슬롯 쿨타임 배열
- `isGameOver`: 게임 오버 여부
- `killedAny`: 이번 tick에 처치된 몬스터 존재 여부

---

## 도선 네트워크 (`src/lib/game/designer/WireNetwork.ts`)

### `buildConnectionGraph(components: Component[]): ConnectionGraph` ✅

모든 도선(`wire`)을 BFS로 그룹화하고, 각 그룹과 인접한 비-wire 부품을 연결합니다.

### `getConnectedComponents(component, components, graph, predicate): Component[]` ✅

특정 부품에 **직접 인접**하거나 **도선 네트워크로 연결**된 부품 중 `predicate`를 만족하는 부품을 모두 반환합니다.

```ts
import { buildConnectionGraph, getConnectedComponents } from '$lib/game/designer/WireNetwork';

const graph = buildConnectionGraph(components);
const redSources = getConnectedComponents(
  myCircuit,
  components,
  graph,
  c => c.type === 'red'
);
console.log(redSources.length);  // 연결된 빨간 마나 개수
```

### `getDirectNeighborComponents(component, components): Component[]` ✅

직접 인접(4방향)한 부품만 반환합니다. 도선 네트워크는 고려하지 않습니다.

---

## 국제화 (`src/lib/game/i18n/index.ts`)

### `t(key: string, ...args: (string | number)[]): string` ✅

번역 키를 현재 설정된 언어로 변환합니다. `{0}`, `{1}` 등의 플레이스홀더를 지원합니다.

> ⚠️ `ko.ts`와 `en.ts`에 중복 키가 존재하여 `svelte-check` 오류를 유발합니다.

```ts
import { t } from '$lib/game/i18n';

t('not.enough.mana');  // "마나 부족" (또는 "Not enough mana")
t('score');            // "점수" (또는 "Score")
```

### `setLanguage(lang: Language): void` ✅

현재 언어를 변경합니다.

```ts
setLanguage('ko');
```

---

## 저장 유틸리티 (`src/lib/game/core/Storage.ts`)

### 슬롯

```ts
import { loadSlots, saveSlots } from '$lib/game/core/Storage';

const slots = loadSlots();     // (SpellData | null)[]
saveSlots(slots);              // localStorage 저장
```

### 기록

```ts
import { loadRecords, saveRecords, getMapRecord, setMapRecord, getMapStars } from '$lib/game/core/Storage';

const records = loadRecords();
setMapRecord(records, 1, 'assist', { score: 25000, time: 120 });
saveRecords(records);

const stars = getMapStars(records, 1);  // 0~3
```

### 해금

```ts
import { loadUnlocks, saveUnlocks, isMapUnlocked } from '$lib/game/core/Storage';

const unlocks = loadUnlocks();
const ok = isMapUnlocked(2, unlocks, records);  // true/false
```

> ⚠️ `clearAllStorage`는 원작에 있었으나 `Storage.ts`에서 re-export되지 않고 있습니다.

---

## 타입 정의 (`src/lib/game/types.ts`)

핵심 타입 요약입니다. 전체 정의는 [types.ts](../src/lib/game/types.ts)를 참조하세요.

```ts
type GameState = 'design' | 'ready' | 'battle' | 'paused' | 'gameover';

type ComponentType = 'red' | 'blueGen' | 'wire' | 'circle' | 'oval' | 'kernel' | 'mixed2' | 'mixedCore' | 'eraser';

interface Component {
  id: number;
  type: ComponentType;
  x: number; y: number;
  w: number; h: number;
  rotation: number;
}

interface SpellData {
  id: string; name: string;
  width: number; height: number;
  components: Component[];
  castTime: number; manaCost: number;
  damage: number; aoeDamage: number;
  breakdown: string[];
}

interface Monster {
  id: number; lane: number;
  x: number; y: number;
  hp: number; maxHp: number;
  speed: number; boss: boolean;
}

interface BattleState {
  score: number; mana: number; baseHp: number; survival: number;
  monsters: Monster[];
  casts: CastProjectile[];
  effects: VisualEffect[];
  cooldowns: number[];
  selectedTargetId: number | null;
  spawnTimer: number; nextMonsterId: number; nextCastId: number;
  battleSpeed: number; activeRunMapId: number | null;
  nextBossAt: number; bossInterval: number;
}
```
