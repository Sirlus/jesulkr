# Phase 3: 핵심 엔진 변경

> **상태**: ✅ **완료** (2026-06-12)
>
> **중요**: WireNetwork v3, ExtractorSystem, StabilitySystem 신규, StatsCalculator 다중 패스 계산
>
> **구현 완료**: 색상별 도선망 v3, 다중 패스 안정도 계산, 추출기 색상 시스템

---

## 3-1. `WireNetwork.ts` — 색상별 도선망 v3

### 설계 원칙

- 기존 `buildConnectionGraph()`는 **그대로 유지**하여 v1 코드와 테스트를 보호.
- 새로운 `buildColorConnectionGraph()`를 추가해 색상별 그래프를 반환.
- 중형 허브는 `activeHubIds`를 받아 활성 여부를 결정 (안정도에 따라 달라짐).
- 중형 도선은 회전에 따라 가로/세로 방향으로만 연결.

### API

```typescript
import type { Component, ConnectionGraph } from '../types';

export interface ColorConnectionGraph {
  red: ConnectionGraph;
  blue: ConnectionGraph;
  green: ConnectionGraph;
}

/** 색상별 도선망을 구축합니다. activeHubIds에 포함된 mediumHub만 전도체로 사용됩니다. */
export function buildColorConnectionGraph(
  components: Component[],
  activeHubIds: Set<number>,
): ColorConnectionGraph;

/** 기존 v1 함수 — 하위 호환용 */
export function buildConnectionGraph(components: Component[]): ConnectionGraph;

/** 특정 컴포넌트가 color 그래프에서 연결된 부품들을 반환 */
export function getConnectedComponentsByColor(
  component: Component,
  components: Component[],
  graph: ColorConnectionGraph,
  color: 'red' | 'blue' | 'green',
  predicate: (c: Component) => boolean,
): Component[];
```

### 도선 규칙 v3

| 도선 | red 그래프 | blue 그래프 | green 그래프 | 방향 |
|------|-----------|------------|-------------|------|
| `wire` | ✅ | ✅ | ❌ | 4방향 |
| `mediumWire` | ✅ | ✅ | ✅ | 회전 방향 직선 |
| `mediumHub` (active) | ✅ | ✅ | ✅ | 4방향 |
| `mediumHub` (inactive) | ❌ | ❌ | ❌ | — |

### 구현 가이드

```typescript
function isWireForColor(type: string, color: 'red' | 'blue' | 'green'): boolean {
  if (type === 'wire') return color !== 'green';
  if (type === 'mediumWire') return true;
  if (type === 'mediumHub') return true; // activeHubIds로 추가 필터링
  return false;
}

function getWireNeighbors(
  comp: Component,
  color: 'red' | 'blue' | 'green',
): [number, number][] {
  if (comp.type === 'mediumWire') {
    // rotation 0: 가로 (좌/우), 1: 세로 (상/하)
    const dirs = comp.rotation === 1
      ? [[0, -1], [0, 1]]
      : [[1, 0], [-1, 0]];
    return dirs.map(([dx, dy]) => [comp.x + dx, comp.y + dy]);
  }
  // wire, mediumHub
  return [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => [comp.x + dx, comp.y + dy]);
}
```

---

## 3-2. `StabilitySystem.ts` (신규)

### API

```typescript
import type { Component } from '../types';
import type { ColorConnectionGraph } from '../designer/WireNetwork';

/** 안정기가 작동 중인지 판정 (파란 마나 연결 필요) */
export function isActiveStabilizer(
  comp: Component,
  components: Component[],
  graph: ColorConnectionGraph,
  isActiveBlue: (id: number) => boolean,
): boolean;

/** comp 위치에서 받는 총 안정도 */
export function stabilityAt(
  comp: Component,
  components: Component[],
  activeStabilizerIds: Set<number>,
): number;

/** 두 컴포넌트 사이의 쉐비셰프 거리 (대각선 포함 8방향) */
export function chebyshevDistance(a: Component, b: Component): number;
```

### 구현 가이드

```typescript
import { STABILITY } from '../constants';
import { getConnectedComponentsByColor } from '../designer/WireNetwork';

export function isActiveStabilizer(
  comp: Component,
  components: Component[],
  graph: ColorConnectionGraph,
  isActiveBlue: (id: number) => boolean,
): boolean {
  const blues = getConnectedComponentsByColor(
    comp, components, graph, 'blue',
    c => c.type === 'blueGen' && isActiveBlue(c.id),
  );
  return blues.length >= STABILITY.BLUE_REQUIRED;
}

export function stabilityAt(
  comp: Component,
  components: Component[],
  activeStabilizerIds: Set<number>,
): number {
  let sum = 0;
  for (const other of components) {
    if (other.type !== 'stabilizer') continue;
    if (!activeStabilizerIds.has(other.id)) continue;
    if (chebyshevDistance(comp, other) <= STABILITY.RANGE) {
      sum += STABILITY.PER_STABILIZER;
    }
  }
  return sum;
}

export function chebyshevDistance(a: Component, b: Component): number {
  const aRight = a.x + a.w - 1;
  const aBottom = a.y + a.h - 1;
  const bRight = b.x + b.w - 1;
  const bBottom = b.y + b.h - 1;
  const dx = Math.max(0, Math.max(b.x - aRight, a.x - bRight));
  const dy = Math.max(0, Math.max(b.y - aBottom, a.y - bBottom));
  return Math.max(dx, dy);
}
```

---

## 3-3. `ExtractorSystem.ts` (신규)

### API

```typescript
import type { Component, ExtractorColor } from '../types';
import type { ColorConnectionGraph } from '../designer/WireNetwork';
import { EXTRACTOR } from '../constants';

/** 추출기 색상을 순환: red → blue → green → red */
export function cycleExtractorColor(color: ExtractorColor): ExtractorColor;

/** 추출기의 출력 방향(회전)에 있는 인접 부품 반환 */
export function extractorOutputTarget(
  extractor: Component,
  components: Component[],
): Component | null;

/** 추출기 입력 측이 특정 색상의 도선망/소스에 연결되어 있는지 확인 */
export function extractorHasInputOfColor(
  extractor: Component,
  components: Component[],
  graph: ColorConnectionGraph,
  color: ExtractorColor,
): boolean;
```

### 구현 가이드

```typescript
import { componentAt } from '../designer/Components';
import { getConnectedComponentsByColor } from '../designer/WireNetwork';

export function cycleExtractorColor(color: ExtractorColor): ExtractorColor {
  const idx = EXTRACTOR.COLOR_CYCLE.indexOf(color);
  return EXTRACTOR.COLOR_CYCLE[(idx + 1) % EXTRACTOR.COLOR_CYCLE.length];
}

export function extractorOutputTarget(
  extractor: Component,
  components: Component[],
): Component | null {
  const dir = EXTRACTOR.DIRECTION_MAP[extractor.rotation % 4];
  return componentAt(components, extractor.x + dir.dx, extractor.y + dir.dy);
}

export function extractorHasInputOfColor(
  extractor: Component,
  components: Component[],
  graph: ColorConnectionGraph,
  color: ExtractorColor,
): boolean {
  const dir = EXTRACTOR.DIRECTION_MAP[extractor.rotation % 4];
  const inputX = extractor.x - dir.dx;
  const inputY = extractor.y - dir.dy;
  const inputComp = componentAt(components, inputX, inputY);
  if (!inputComp) return false;

  // 직접 소스인 경우
  if (isSourceOfColor(inputComp, color)) return true;

  // 도선을 통해 연결된 소스가 있는 경우
  if (isWireForColorAndActive(inputComp, color)) {
    const sources = getConnectedComponentsByColor(
      inputComp, components, graph, color,
      c => isSourceOfColor(c, color),
    );
    return sources.length > 0;
  }

  return false;
}

function isSourceOfColor(comp: Component, color: ExtractorColor): boolean {
  if (color === 'red') return comp.type === 'red' || comp.type === 'red3';
  if (color === 'blue') return comp.type === 'blueGen';
  if (color === 'green') return comp.type === 'greenMana'; // 활성 여부는 StatsCalculator에서 별도 판정
  return false;
}

function isWireForColorAndActive(comp: Component, color: ExtractorColor): boolean {
  if (comp.type === 'wire') return color !== 'green';
  if (comp.type === 'mediumWire') return true;
  if (comp.type === 'mediumHub') return true; // activeHubIds로 추가 필터링 필요
  return false;
}
```

> **주의**: `greenMana`가 활성화된 경우에만 초록 소스로 인정해야 합니다. `isSourceOfColor`는 타입만 확인하고, StatsCalculator에서 활성화 여부를 최종 판단합니다.

---

## 3-4. `StatsCalculator.ts` — 확장 및 다중 패스

### 반환 타입

```typescript
export interface SpellStats {
  castTime: number;
  seconds: number;
  manaCost: number;
  redCount: number;              // red/red3 부품 수
  redManaCost: number;           // 빨강 마나 총 비용
  greenCount: number;            // 활성화된 greenMana 수
  greenManaCost: number;         // 초록 마나 총 비용
  activeBlueCount: number;
  inactiveBlueCount: number;
  activeStabilizerCount: number;
  activeHubCount: number;
  maxStability: number;
  damage: number;
  aoeDamage: number;
  globalDamage: number;
  breakdown: string[];
  valid: boolean;
}
```

### 계산 순서 (다중 패스)

```
1. 초기 그래프 생성 (모든 mediumHub를 활성으로 가정)
2. activeBlueGenerator 판정 (red source 연결)
3. activeStabilizer 판정 (active blue 연결)
4. stabilityAt 계산 → activeHubIds 결정
5. activeHubIds가 변경되었다면 1로 돌아가 그래프 재생성
6. 최종 그래프로 greenMana 활성 판정 (mixed2 접촉)
7. extractor 출력 평가
8. circuit damage / aoe / globalDamage 계산
9. manaCost 및 validity 결정
```

### 핵심 로직 스케치

```typescript
import { buildColorConnectionGraph, getConnectedComponentsByColor } from './WireNetwork';
import { isActiveStabilizer, stabilityAt } from './StabilitySystem';
import { getRedPower, getRedCost } from './components/red';
import { GREEN_MANA, MEDIUM_HUB } from '../constants';
import { getDef, CIRCUIT_TYPES } from './components/registry';

export function calculateSpellStats(model: SpellModel): SpellStats {
  const { width, height, components } = model;
  const breakdown: string[] = [];

  // --- 1~5. 그래프 + 안정도 고정점 반복 ---
  let activeHubIds = new Set<number>(
    components.filter(c => c.type === 'mediumHub').map(c => c.id),
  );
  let graph = buildColorConnectionGraph(components, activeHubIds);
  let prevHubIds: string;

  const activeBlueIds = new Set<number>();
  const activeStabilizerIds = new Set<number>();
  let stabilityMap = new Map<number, number>();

  for (let iter = 0; iter < 5; iter++) {
    // active blue
    activeBlueIds.clear();
    for (const b of components.filter(c => c.type === 'blueGen')) {
      const reds = getConnectedComponentsByColor(
        b, components, graph, 'red',
        c => getRedPower(c) > 0,
      );
      const redPower = reds.reduce((sum, c) => sum + getRedPower(c), 0);
      if (redPower >= 1) activeBlueIds.add(b.id);
    }

    // active stabilizer
    activeStabilizerIds.clear();
    for (const s of components.filter(c => c.type === 'stabilizer')) {
      if (isActiveStabilizer(s, components, graph, id => activeBlueIds.has(id))) {
        activeStabilizerIds.add(s.id);
      }
    }

    // stability map
    stabilityMap = new Map();
    for (const c of components) {
      stabilityMap.set(c.id, stabilityAt(c, components, activeStabilizerIds));
    }

    // active hub
    const nextHubIds = new Set<number>();
    for (const h of components.filter(c => c.type === 'mediumHub')) {
      if ((stabilityMap.get(h.id) ?? 0) >= MEDIUM_HUB.STABILITY_REQUIRED) {
        nextHubIds.add(h.id);
      }
    }

    const nextKey = [...nextHubIds].sort().join(',');
    if (nextKey === prevHubIds) {
      activeHubIds = nextHubIds;
      break;
    }
    prevHubIds = nextKey;
    activeHubIds = nextHubIds;
    graph = buildColorConnectionGraph(components, activeHubIds);
  }

  // --- 6. greenMana 활성화 ---
  const activeGreenIds = new Set<number>();
  for (const g of components.filter(c => c.type === 'greenMana')) {
    const touchingMixed2 = getDirectNeighborComponents(g, components)
      .some(c => c.type === 'mixed2');
    if (touchingMixed2) activeGreenIds.add(g.id);
  }

  // --- 7. extractor 출력 ---
  const extractorOutputs = new Map<number, { color: ExtractorColor; targetId: number }>();
  for (const e of components.filter(c => c.type === 'extractor')) {
    const color = e.color ?? 'red';
    if (extractorHasInputOfColor(e, components, graph, color)) {
      const target = extractorOutputTarget(e, components);
      if (target) extractorOutputs.set(e.id, { color, targetId: target.id });
    }
  }

  // --- 8. 회로 데미지 ---
  let damage = 0;
  let aoeDamage = 0;
  let globalDamage = 0;
  const circuits = components.filter(c => CIRCUIT_TYPES.has(c.type));

  for (const c of circuits) {
    const ctx = buildCalcContext(
      c, components, graph, activeBlueIds, activeStabilizerIds,
      activeHubIds, activeGreenIds, extractorOutputs, stabilityMap,
    );
    const def = getDef(c.type);
    const result = def?.calc?.(ctx) ?? { damage: 0, detail: '' };
    damage += result.damage ?? 0;
    aoeDamage += result.aoe ?? 0;
    globalDamage += result.globalDamage ?? 0;
    breakdown.push(`${def?.name ?? c.type} ${c.id}: ${result.detail} → 일반 ${result.damage ?? 0}`);
  }

  // --- 9. 비용 및 유효성 ---
  const redSources = components.filter(c => c.type === 'red' || c.type === 'red3');
  const redCount = redSources.length;
  const redManaCost = redSources.reduce((sum, c) => sum + getRedCost(c), 0);
  const greenCount = activeGreenIds.size;
  const greenManaCost = greenCount * GREEN_MANA.COST_PER_ACTIVE;
  const activeBlueCount = activeBlueIds.size;
  const inactiveBlueCount = components.filter(c => c.type === 'blueGen').length - activeBlueCount;
  const activeStabilizerCount = activeStabilizerIds.size;
  const activeHubCount = activeHubIds.size;
  const maxStability = Math.max(0, ...components.map(c => stabilityMap.get(c.id) ?? 0));
  const manaCost = redManaCost + greenManaCost + activeBlueCount * 2;
  const castTime = width * height;

  return {
    castTime,
    seconds: castTime * (1 / 20),
    manaCost,
    redCount,
    redManaCost,
    greenCount,
    greenManaCost,
    activeBlueCount,
    inactiveBlueCount,
    activeStabilizerCount,
    activeHubCount,
    maxStability,
    damage,
    aoeDamage,
    globalDamage,
    breakdown,
    valid: redCount >= 1 && circuits.length >= 1 && damage >= 1,
  };
}

function buildCalcContext(
  component: Component,
  components: Component[],
  graph: ColorConnectionGraph,
  activeBlueIds: Set<number>,
  activeStabilizerIds: Set<number>,
  activeHubIds: Set<number>,
  activeGreenIds: Set<number>,
  extractorOutputs: Map<number, { color: ExtractorColor; targetId: number }>,
  stabilityMap: Map<number, number>,
): CalcContext {
  const red = countColorPower(
    component, components, graph, 'red',
    c => getRedPower(c) > 0,
    getRedPower,
  );
  const blue = countConnected(
    component, components, graph, 'blue',
    c => c.type === 'blueGen' && activeBlueIds.has(c.id),
  );
  const green = countConnected(
    component, components, graph, 'green',
    c => c.type === 'greenMana' && activeGreenIds.has(c.id),
  );

  // extractor가 이 회로를 대상으로 출력하는 경우 색상 추가
  let redFromExtractor = 0;
  let blueFromExtractor = 0;
  let greenFromExtractor = 0;
  for (const [_, out] of extractorOutputs) {
    if (out.targetId === component.id) {
      if (out.color === 'red') redFromExtractor++;
      if (out.color === 'blue') blueFromExtractor++;
      if (out.color === 'green') greenFromExtractor++;
    }
  }

  return {
    red: red + redFromExtractor,
    blue: blue + blueFromExtractor,
    green: green + greenFromExtractor,
    stability: stabilityMap.get(component.id) ?? 0,
    component,
    components,
    neighbors: getDirectNeighborComponents(component, components),
    connectedTo: (target, predicate) =>
      getConnectedComponentsByColor(target, components, graph, 'red', predicate).length,
    isActiveBlue: id => activeBlueIds.has(id),
    isActiveStabilizer: id => activeStabilizerIds.has(id),
    isActiveHub: id => activeHubIds.has(id),
  };
}
```

> `countColorPower`, `countConnected`는 헬퍼 함수로, `getConnectedComponentsByColor`를 사용해 predicate에 맞는 부품을 세고, power 합산 시 가중치를 적용합니다.

---

## 3-5. `Components.ts` — `createComponentFromGridCoord` 확장

```diff
  export function createComponentFromGridCoord(
    type: string, gx: number, gy: number, nextId: number, rotation: number,
+   color?: ExtractorColor,
  ): Component {
    const dim = dimensionsFor(type, rotation);
    const x = Math.floor(gx);
    const y = Math.floor(gy);
    return {
      id: nextId,
      type: type as ComponentType,
      x, y,
      w: dim.w,
      h: dim.h,
      rotation: dim.rotation,
+     ...(color ? { color } : {}),
    };
  }
```

---

## ✅ Phase 3 완료 조건

- [x] `WireNetwork.ts`에 `buildColorConnectionGraph` 추가 (기존 함수 유지) — [`ColorWireNetwork.test.ts`](src/lib/game/designer/__tests__/ColorWireNetwork.test.ts) 17 tests ✓
- [x] `StabilitySystem.ts` 신규 생성 — [`StabilitySystem.test.ts`](src/lib/game/designer/__tests__/StabilitySystem.test.ts) 11 tests ✓
- [x] `ExtractorSystem.ts` 신규 생성 — [`ExtractorSystem.test.ts`](src/lib/game/designer/__tests__/ExtractorSystem.test.ts) 11 tests ✓
- [x] `StatsCalculator.ts`가 다중 패스로 green/stability/globalDamage 반영 — [`GreenStatsCalculator.test.ts`](src/lib/game/designer/__tests__/GreenStatsCalculator.test.ts) 10 tests ✓ + [`StatsCalculator.test.ts`](src/lib/game/designer/__tests__/StatsCalculator.test.ts) 8 tests ✓
- [x] `Components.ts`에 `color` 매개변수 추가 — [`Components.ts:54`](src/lib/game/designer/Components.ts:54)
- [x] `npm run check` 통과
- [x] 기존 `StatsCalculator`/`WireNetwork` 테스트 통과 — [`WireNetwork.test.ts`](src/lib/game/designer/__tests__/WireNetwork.test.ts) 6 tests ✓

## 예상 소요: 5시간
