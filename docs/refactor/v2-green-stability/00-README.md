# 🌿 V2 Green/Stability 시스템 리팩토링 계획 (업데이트됨)

> Jesulkr_v2_beta.html의 Green Mana / Stability 프로토타입을 SvelteKit 아키텍처에 반영
>
> **중요**: 기존 코드베이스(v1.5, 9개 부품) 기반, 하위 호환 유지

## 📋 개요

v2 beta에서 추가된 **녹색 마나 시스템**, **안정도 시스템**, **색상별 도선망**을 기존 Svelte 구조에 통합하는 단계별 계획입니다.

## ⚠️ 현재 코드베이스 상태

| 파일 | 현재 상태 | 비고 |
|------|----------|------|
| `types.ts` | 9개 `ComponentType` | `Component.id: number` |
| `constants.ts` | v1 상수 | `TOOL_ORDER`, `TOOL_DESCRIPTIONS`가 `registry.ts`에서 파생 |
| `designer/components/*.ts` | 9개 부품 정의 | `ComponentDef` 인터페이스 사용 |
| `designer/components/registry.ts` | `ALL_DEFS` | `ORDERED_TYPES`, `CIRCUIT_TYPES`, `STORABLE_TYPES` 파생 |
| `designer/WireNetwork.ts` | 단일 도선망 | `ConnectionGraph = { groups, compGroups }` |
| `designer/StatsCalculator.ts` | red/blue만 | `CalcContext`에 green/stability 없음 |
| `designer/Components.ts` | `createComponentFromGridCoord` | `color` 필드 미지원 |
| `battle/DamageResolver.ts` | normal + AOE | `globalDamage` 미지원 |
| `battle/CastingSystem.ts` | 마나/쿨타임/맵해금 체크 | stability 체크 없음 |
| `i18n/ko.ts`, `i18n/en.ts` | 점 표기법 키 | v2 용어 누락 |

**결론**: v2 기능은 미구현. 단계별 구현 필요.

---

## 🎯 목표

1. **9개 신규 부품** 추가
   - `red3`, `mediumWire`, `mediumHub`, `extractor`, `stabilizer`
   - `greenMana`, `green3x2`, `greenPair2`, `ultimateCore`
2. **3색상 마나 시스템** 도입 (빨강/파랑/초록)
3. **색상별 도선망 v3** 교체 (단일 → 색상별 독립망)
4. **안정도 시스템** 추가
5. **전체 데미지** 기능 추가
6. 프로토타입 완료 후 `PROTOTYPE_UNLOCK_ALL_TOOLS = false`로 전환

---

## 📁 폼더 구조 변경 계획

```
src/lib/game/
├── constants.ts                    [변경] GREEN_MANA, STABILITY, PROTOTYPE_UNLOCK_ALL_TOOLS 추가
├── types.ts                        [변경] ComponentType 9개 추가, ExtractorColor, globalDamage 등 추가
│
├── designer/
│   ├── Components.ts               [변경] createComponentFromGridCoord에 color 지원
│   ├── StatsCalculator.ts          [변경] green/stability/globalDamage 반영, CalcContext 확장
│   ├── WireNetwork.ts              [변경] buildColorConnectionGraph 추가 (기존 함수는 하위 호환 유지)
│   ├── ExtractorSystem.ts          [신규] 추출기 로직
│   ├── StabilitySystem.ts          [신규] 안정도 계산
│   │
│   └── components/
│       ├── def.ts                  [변경] ComponentRole에 'extractor'|'stabilizer' 추가, CalcContext 확장
│       ├── red.ts                  [변경] getRedPower/getRedCost 헬퍼 추가
│       ├── red3.ts                 [신규]
│       ├── blueGen.ts              [변경 없음]
│       ├── wire.ts                 [변경 없음]
│       ├── mediumWire.ts           [신규]
│       ├── mediumHub.ts            [신규]
│       ├── extractor.ts            [신규]
│       ├── stabilizer.ts           [신규]
│       ├── circle.ts               [변경 없음]
│       ├── oval.ts                 [변경 없음]
│       ├── kernel.ts               [변경 없음]
│       ├── mixed2.ts               [변경 없음]
│       ├── greenMana.ts            [신규]
│       ├── green3x2.ts             [신규]
│       ├── greenPair2.ts           [신규]
│       ├── mixedCore.ts            [변경 없음]
│       ├── ultimateCore.ts         [신규]
│       ├── eraser.ts               [변경 없음]
│       └── registry.ts             [변경] 9개 신규 부품 등록
│
├── battle/
│   ├── BattleEngine.ts             [변경 없음] (globalDamage는 DamageResolver에서 처리)
│   ├── DamageResolver.ts           [변경] globalDamage 지원
│   └── CastingSystem.ts            [변경] invalid spell 거부, 안정도/녹색 요구사항 반영
│
├── i18n/
│   ├── ko.ts                       [변경] 9개 부품명 + 안정도/전체 용어
│   └── en.ts                       [변경] 9개 부품명 + 안정도/전체 용어
│
└── stores/
    └── gameState.svelte.ts         [변경 없음] (실제 경로: src/lib/stores/gameState.svelte.ts)
```

---

## 🔀 주요 변경 사항 맵핑

### 1. 컴포넌트 타입 확장 (`types.ts`)

```typescript
// 현재 (v1): 9개
type ComponentType =
  | 'red' | 'blueGen' | 'wire'
  | 'circle' | 'oval' | 'kernel'
  | 'mixed2' | 'mixedCore' | 'eraser';

// v2: 18개 (+9개 신규)
type ComponentType =
  | 'red' | 'red3' | 'blueGen'
  | 'wire' | 'mediumWire' | 'mediumHub'
  | 'extractor' | 'stabilizer'
  | 'circle' | 'oval' | 'kernel' | 'mixed2'
  | 'greenMana' | 'green3x2' | 'greenPair2'
  | 'mixedCore' | 'ultimateCore'
  | 'eraser';
```

### 2. Component 인터페이스 확장

```typescript
// v1
interface Component {
  id: number;
  type: ComponentType;
  x: number;
  y: number;
  w: number;
  h: number;
  rotation: number;
}

// v2
interface Component {
  id: number;
  type: ComponentType;
  x: number;
  y: number;
  w: number;
  h: number;
  rotation: number;
  color?: ExtractorColor; // 추출기 색상
}
```

### 3. SpellData / SpellStats 확장

```typescript
interface SpellData {
  // ... existing fields ...
  aoeDamage: number;
  globalDamage: number; // NEW
  breakdown: string[];
}

interface SpellStats {
  // ... existing fields ...
  redCount: number;
  redManaCost: number;        // NEW
  greenCount: number;         // NEW
  greenManaCost: number;      // NEW
  activeBlueCount: number;
  inactiveBlueCount: number;
  activeStabilizerCount: number; // NEW
  activeHubCount: number;        // NEW
  maxStability: number;          // NEW
  damage: number;
  aoeDamage: number;
  globalDamage: number;       // NEW
  breakdown: string[];
  valid: boolean;
}
```

### 4. WireNetwork 시스템 대개조

기존 `buildConnectionGraph()`는 단일 색상(모든 wire) 그래프를 반환합니다. v2에서는 색상별 그래프가 추가됩니다.

```typescript
// 기존 — 하위 호환 유지
export interface ConnectionGraph {
  groups: WireGroup[];
  compGroups: Map<number, Set<number>>;
}
export function buildConnectionGraph(components: Component[]): ConnectionGraph;

// 신규
export interface ColorConnectionGraph {
  red: ConnectionGraph;
  blue: ConnectionGraph;
  green: ConnectionGraph;
}
export function buildColorConnectionGraph(components: Component[]): ColorConnectionGraph;
```

도선 규칙 v3:

| 도선 | 색상 | 방향 | 안정도 |
|------|------|------|--------|
| 소형 `wire` | 빨강/파랑 | 무방향 | 없음 |
| 중형 `mediumWire` | 빨강/파랑/초록 | 직선(회전) | 없음 |
| 허브 `mediumHub` | 빨강/파랑/초록 | 4방향 | 1 필요 |

### 5. CalcContext 확장

```typescript
export interface CalcContext {
  red: number;
  blue: number;
  green: number;                       // NEW
  stability: number;                   // NEW: 이 회로 위치의 안정도
  component: Component;
  components: Component[];
  neighbors: Component[];
  connectedTo: (target: Component, predicate: (c: Component) => boolean) => number;
  isActiveBlue: (id: number) => boolean;
  isActiveStabilizer: (id: number) => boolean; // NEW
  isActiveHub: (id: number) => boolean;         // NEW
}
```

### 6. 추출기 시스템 (신규)

```typescript
// ExtractorSystem.ts
export type ExtractorColor = 'red' | 'blue' | 'green';

export function cycleExtractorColor(color: ExtractorColor): ExtractorColor;

// 추출기 출력 방향(회전)에 있는 인접 부품 반환
export function extractorOutputTarget(
  extractor: Component,
  components: Component[],
): Component | null;

// 추출기 입력 측(회전 반대 방향)이 특정 색상 도선망에 연결되어 있는지 확인
export function extractorHasInputOfColor(
  extractor: Component,
  components: Component[],
  graph: ColorConnectionGraph,
  color: ExtractorColor,
): boolean;
```

### 7. 안정도 시스템 (신규)

```typescript
// StabilitySystem.ts
export function isActiveStabilizer(
  comp: Component,
  components: Component[],
  graph: ColorConnectionGraph,
  isActiveBlue: (id: number) => boolean,
): boolean;

// comp의 위치에서 받는 총 안정도
export function stabilityAt(
  comp: Component,
  components: Component[],
  activeStabilizerIds: Set<number>,
): number;

// 대각선 포함 8방향 거리
export function chebyshevDistance(a: Component, b: Component): number;
```

---

## 🚀 구현 단계별 계획

### Phase 1: 타입 및 상수 확장
- `types.ts`: `ComponentType` 18개로 확장, `ExtractorColor`, `color?` 필드, `SpellData.globalDamage`, `SpellStats` 확장, `ColorConnectionGraph` 추가
- `constants.ts`: `GREEN_MANA`, `STABILITY`, `MEDIUM_HUB`, `MEDIUM_WIRE`, `SMALL_WIRE`, `EXTRACTOR`, `PROTOTYPE_UNLOCK_ALL_TOOLS` 추가

### Phase 2: 컴포넌트 정의 추가
- `def.ts`: `ComponentRole`에 `'extractor'`, `'stabilizer'` 추가, `CalcContext` 확장
- 9개 신규 컴포넌트 정의 파일 생성 (실제 `ComponentDef` 인터페이스 준수)
- `registry.ts`: 9개 등록
- `red.ts`: `getRedPower`/`getRedCost` 헬퍼 분리

### Phase 3: 핵심 엔진 변경
- `WireNetwork.ts`: `buildColorConnectionGraph()` 추가, 기존 함수는 하위 호환 유지
- `ExtractorSystem.ts`: 추출기 색상 순환, 출력 방향, 입력 체크
- `StabilitySystem.ts`: 안정기 활성 판정, 안정도 합산
- `StatsCalculator.ts`: 다중 패스 계산 (blue → stabilizer → hub → green → extractor → circuit)
- `Components.ts`: `createComponentFromGridCoord`에 `color` 매개변수 추가

### Phase 4: 전투 시스템 반영
- `DamageResolver.ts`: `globalDamage`를 모든 몬스터에 적용
- `CastingSystem.ts`: `spell.valid === false` 또는 stability 요구 불만족 시 시전 거부

### Phase 5: UI 반영
- `DesignerPanel.svelte`: 9개 신규 도구 버튼
- `PlacementGhost.svelte`: 신규 부품 CSS 매핑, 추출기 색상/방향 표시
- `style.css`: v2 beta 스타일 복사

### Phase 6: i18n 반영
- `ko.ts`, `en.ts`: 점 표기법 키로 9개 부품명 + 안정도/전체 용어 추가

### Phase 7: 프로토타입 테스트 및 정리
- `PROTOTYPE_UNLOCK_ALL_TOOLS = true`로 전체 테스트
- 레거시 v1 저장 데이터 로딩 확인
- `PROTOTYPE_UNLOCK_ALL_TOOLS = false` 전환

---

## ⚡ 우선순위

| 우선 | 단계 | 소요 추정 | 비고 |
|------|------|-----------|------|
| 🔴 P0 | Phase 1 + 2 | 3시간 | 타입/컴포넌트 없으면 나머지 불가 |
| 🔴 P0 | Phase 3 핵심 | 5시간 | WireNetwork v3 + 안정도/추출기 상호작용이 가장 복잡 |
| 🟡 P1 | Phase 4 | 1시간 | globalDamage는 DamageResolver에 집중 |
| 🟡 P1 | Phase 5 | 3시간 | 도구 18개 UI, 추출기 색상 순환 UX |
| 🟢 P2 | Phase 6 | 30분 | i18n은 별도로 미뤄도 가능 |
| 🟢 P2 | Phase 7 | 4시간 | 통합 테스트 및 버그 수정 |

**예상 총 소요: 16.5시간** (기존 8.5시간보다 현실적)

---

## 📐 아키텍처 다이어그램

```
┌──────────────────────────────────────────────────────────────┐
│                    Designer / UI Layer                        │
│   (도구 선택 → Components.ts → PlacementGhost → DesignerPanel) │
└─────────────────────────┬────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────┐
│              components/registry.ts (18 defs)                 │
│  red | red3 | blueGen | wire | mediumWire | mediumHub          │
│  | extractor | stabilizer | circle | oval | kernel | mixed2    │
│  | greenMana | green3x2 | greenPair2 | mixedCore | ultimateCore│
│  | eraser                                                     │
└─────────────────────────┬────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────┐
│           WireNetwork.ts (v3, 색상별 그래프)                   │
│  ┌──────────┬──────────┬──────────┐                          │
│  │ red 망   │ blue 망  │ green 망 │                          │
│  │소형+중형 │소형+중형 │ 중형만   │                          │
│  └──────────┴──────────┴──────────┘                          │
└──────────┬──────────────────────────────┬────────────────────┘
           │                              │
           ▼                              ▼
┌──────────────────────┐      ┌──────────────────────┐
│   StabilitySystem    │      │   ExtractorSystem    │
│  (active stabilizer  │      │  (color cycle,       │
│   → hub activation)  │      │   directional I/O)   │
└──────────┬───────────┘      └──────────┬───────────┘
           │                             │
           └───────────┬─────────────────┘
                       ▼
┌──────────────────────────────────────────────────────────────┐
│              StatsCalculator.ts (다중 패스)                   │
│  1. active blue 판정                                          │
│  2. active stabilizer 판정                                    │
│  3. stability 합산 → active hub 판정                          │
│  4. active green 판정 (mixed2 접촉)                           │
│  5. extractor 출력 평가                                       │
│  6. circuit damage / globalDamage / aoe 계산                  │
└─────────────────────────┬────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────┐
│           DamageResolver.ts / CastingSystem.ts                │
│  globalDamage → 모든 몬스터 피해                               │
│  invalid/unstable spell → 시전 거부                           │
└──────────────────────────────────────────────────────────────┘
```

---

## ⚠️ 리스크 및 고려사항

### 1. 호환성
- v1.x 저장된 술식은 `red, blueGen, wire, circle, oval, kernel, mixed2, mixedCore`만 포함.
- v2 로더에서 `globalDamage: 0` 기본값 추가.
- `extractRed`/`extractBlue`/`extractGreen` 레거시 타입이 있을 경우 `extractor` + `color`로 마이그레이션.

### 2. WireNetwork 변경 리스크
- 기존 `buildConnectionGraph()` 시그니처를 유지하여 `StatsCalculator` 마이그레이션을 단계적으로 진행.
- 새로운 `buildColorConnectionGraph()`를 별도 함수로 추가해 기존 테스트를 보호.

### 3. 성능
- 색상별 BFS 3회 수행.
- 안정도 계산 O(n²). 설계 변경 시에만 재계산하며, hover preview에서 캐싱 고려.
- Extractor 입력 탐색 추가.

### 4. UI 복잡도
- 도구 9개 → 18개.
- `toolBar` 그리드 레이아웃 조정 필요.
- 추출기는 같은 도구 버튼을 다시 클릭하거나 별도 UI로 색상 순환.

### 5. 활성화 순서 의존성
안정도 계산은 다음 순서로 수행:
1. active blue generator 판정
2. stabilizer 활성 (blue 연결 필요)
3. stability 맵 계산
4. medium hub 활성 (stability ≥ 1 필요)
5. 색상별 그래프 재구성 (비활성 hub 제외)
6. green mana 활성 (mixed2 접촉)
7. extractor 출력
8. circuit damage 계산

---

## 📝 참고

- v2 beta HTML 파일 위치: `Jesulkr_v2_beta.html`
- v1.5 HTML 파일 위치: `Jesulkr_v1.5.html`
- CSS 스타일 참조: v2 beta의 `.piece.*`, `.previewPiece.*`, `:root{--green...}` 블럭
- JS 핵심 로직 참조: v2 beta의 WireNetwork v3, ExtractorSystem, StabilitySystem
