# Phase 1: 타입 및 상수 확장

> **상태**: ✅ **완료** (2026-06-12)
>
> 목표: v2 신규 부품을 위한 타입 정의와 상수 추가
>
> **중요**: 기존 코드 스타일(`id: number`, `ComponentDef` 인터페이스)과 하위 호환성 유지

## 📝 현재 코드베이스 상태

### `src/lib/game/types.ts` (실제)

```typescript
export type ComponentType =
  | 'red' | 'blueGen' | 'wire'
  | 'circle' | 'oval' | 'kernel'
  | 'mixed2' | 'mixedCore'
  | 'eraser';

export interface Component {
  id: number;
  type: ComponentType;
  x: number;
  y: number;
  w: number;
  h: number;
  rotation: number;
}

export interface SpellData {
  id: string;
  name: string;
  width: number;
  height: number;
  components: Component[];
  castTime: number;
  manaCost: number;
  damage: number;
  aoeDamage: number;
  breakdown: string[];
}

export interface SpellStats {
  castTime: number;
  seconds: number;
  manaCost: number;
  redCount: number;
  activeBlueCount: number;
  inactiveBlueCount: number;
  damage: number;
  aoeDamage: number;
  breakdown: string[];
  valid: boolean;
}

export interface ConnectionGraph {
  groups: WireGroup[];
  compGroups: Map<number, Set<number>>;
}
```

### `src/lib/game/constants.ts` (실제)

```typescript
// TOOL_DESCRIPTIONS, TOOL_ORDER는 registry.ts의 ALL_DEFS에서 파생
// 핵심 상수: TICK_SEC, HIT_DELAY_TICKS, CORE_AOE_TARGET_LIMIT, MAX_MANA, LANES, CELL, ...
```

---

## 📝 변경 파일 목록

### 1. `src/lib/game/types.ts`

#### 변경 사항

```diff
  /** 부품 타입 */
  export type ComponentType =
    | 'red' | 'blueGen' | 'wire'
    | 'circle' | 'oval' | 'kernel'
    | 'mixed2' | 'mixedCore'
-   | 'eraser';
+   | 'eraser'
+   // v2 신규 9개
+   | 'red3'
+   | 'mediumWire' | 'mediumHub'
+   | 'extractor' | 'stabilizer'
+   | 'greenMana' | 'green3x2' | 'greenPair2'
+   | 'ultimateCore';

+ /** 추출기 색상 */
+ export type ExtractorColor = 'red' | 'blue' | 'green';

  /** 설계도 위 부품 하나 */
  export interface Component {
    id: number;
    type: ComponentType;
    x: number;
    y: number;
    w: number;
    h: number;
    rotation: number;
+   // v2: 추출기 색상
+   color?: ExtractorColor;
  }

  /** 저장/불러오기용 술식 데이터 */
  export interface SpellData {
    id: string;
    name: string;
    width: number;
    height: number;
    components: Component[];
    castTime: number;
    manaCost: number;
    damage: number;
    aoeDamage: number;
+   globalDamage: number; // v2: 전체 데미지
    breakdown: string[];
  }

  /** 술식 통계 (편집 시 실시간 계산) */
  export interface SpellStats {
    castTime: number;
    seconds: number;
    manaCost: number;
    redCount: number;
+   redManaCost: number;            // v2
+   greenCount: number;             // v2
+   greenManaCost: number;          // v2
    activeBlueCount: number;
    inactiveBlueCount: number;
+   activeStabilizerCount: number;  // v2
+   activeHubCount: number;         // v2
+   maxStability: number;           // v2
    damage: number;
    aoeDamage: number;
+   globalDamage: number;           // v2
    breakdown: string[];
    valid: boolean;
  }

  /** 도선 네트워크 그래프 */
  export interface ConnectionGraph {
    groups: WireGroup[];
    compGroups: Map<number, Set<number>>;
  }

+ /** 색상별 도선망 그래프 (v2) */
+ export interface ColorConnectionGraph {
+   red: ConnectionGraph;
+   blue: ConnectionGraph;
+   green: ConnectionGraph;
+ }
```

### 2. `src/lib/game/constants.ts`

```diff
+ // === v2 Green/Stability 상수 ===
+
+ /** 프로토타입: 모든 도구 강제 해금 */
+ export const PROTOTYPE_UNLOCK_ALL_TOOLS = false;
+
+ /** 녹색 마나 관련 */
+ export const GREEN_MANA = {
+   /** greenMana가 mixed2 접촉 시 추가로 소모하는 마나 */
+   COST_PER_ACTIVE: 2,
+   /** 활성화 시 제공하는 초록 마나 */
+   MANA_PROVIDED: 1,
+ } as const;
+
+ /** 안정도 관련 */
+ export const STABILITY = {
+   /** 안정기 1개가 제공하는 안정도 */
+   PER_STABILIZER: 1,
+   /** 안정기 영향 범위 (쉐비셰프 거리) */
+   RANGE: 1,
+   /** 안정기 활성에 필요한 파란 마나 연결 수 */
+   BLUE_REQUIRED: 1,
+ } as const;
+
+ /** 중형 허브 관련 */
+ export const MEDIUM_HUB = {
+   /** 활성에 필요한 안정도 */
+   STABILITY_REQUIRED: 1,
+ } as const;
+
+ /** 중형 도선 관련 */
+ export const MEDIUM_WIRE = {
+   /** 전달되는 색상 */
+   COLORS: ['red', 'blue', 'green'] as const,
+ } as const;
+
+ /** 소형 도선 관련 */
+ export const SMALL_WIRE = {
+   /** 전달되는 색상 (초록 제외) */
+   COLORS: ['red', 'blue'] as const,
+ } as const;
+
+ /** 추출기 관련 */
+ export const EXTRACTOR = {
+   /** 색상 순환 순서 */
+   COLOR_CYCLE: ['red', 'blue', 'green'] as const,
+   /** 회전 → 출력 방향 (우/하/좌/상) */
+   DIRECTION_MAP: [
+     { dx: 1, dy: 0 },   // 0: 우
+     { dx: 0, dy: 1 },   // 1: 하
+     { dx: -1, dy: 0 },  // 2: 좌
+     { dx: 0, dy: -1 },  // 3: 상
+   ] as const,
+ } as const;
```

### 3. `src/lib/game/designer/components/def.ts`

`ComponentRole`과 `CalcContext`도 이 단계에서 확장해야 Phase 2 컴포넌트 정의가 컴파일됩니다.

```diff
  export type ComponentRole =
    | 'mana'
    | 'generator'
    | 'wire'
    | 'circuit'
-   | 'tool';
+   | 'tool'
+   | 'extractor'   // v2
+   | 'stabilizer'; // v2

  export interface CalcContext {
    red: number;
    blue: number;
+   green: number;                       // v2
+   stability: number;                   // v2
    component: Component;
    components: Component[];
    neighbors: Component[];
    connectedTo: (target: Component, predicate: (c: Component) => boolean) => number;
    isActiveBlue: (id: number) => boolean;
+   isActiveStabilizer: (id: number) => boolean; // v2
+   isActiveHub: (id: number) => boolean;         // v2
  }
```

---

## 🧪 테스트 계획

1. `npm run check` — TypeScript / svelte-check 0 errors
2. `ComponentType`이 18개인지 타입 레벨 체크
3. `ExtractorColor` 순환 로직 단위 테스트 (Phase 3에서 추가)

## ✅ 완료 조건

- [x] `types.ts`에 모든 신규 타입 정의 추가 — 18개 `ComponentType` (line 14-25), `ExtractorColor`, `Component.color?`, `SpellData.globalDamage`, `SpellStats` v2 필드, `ColorConnectionGraph`
- [x] `constants.ts`에 v2 상수 추가 — `GREEN_MANA`, `STABILITY`, `MEDIUM_HUB`, `MEDIUM_WIRE`, `SMALL_WIRE`, `EXTRACTOR` (PROTOTYPE_UNLOCK_ALL_TOOLS는 의도적 미구현 — 주석)
- [x] `def.ts`에 `ComponentRole` 및 `CalcContext` 확장 — `'extractor'`/`'stabilizer'` role, `green`/`stability`/`isActiveStabilizer`/`isActiveHub` 컨텍스트
- [x] `npm run check` 통과 — 0 errors / 0 warnings
- [x] 기존 파일에서 타입 참조 에러 없음

## 예상 소요: 30분
