# Phase 2: 컴포넌트 정의 추가 (9개 신규)

> 목표: v2 신규 부품 9개 정의 파일 생성 + `registry.ts` 수정
>
> **중요**: 실제 `ComponentDef` 인터페이스(`def.ts`) 형식 준수. `role`, `size`, `requiredMap`, `order`, `calc` 필드 필수.

## 📝 현재 코드베이스 상태

### `src/lib/game/designer/components/` (현재 9개)

```
blueGen.ts  circle.ts  def.ts  eraser.ts  kernel.ts
mixed2.ts  mixedCore.ts  oval.ts  red.ts  registry.ts  wire.ts
```

### `def.ts` (실제 인터페이스)

```typescript
export type ComponentRole =
  | 'mana' | 'generator' | 'wire' | 'circuit' | 'tool'
  | 'extractor' | 'stabilizer'; // Phase 1에서 확장

export interface CalcContext {
  red: number;
  blue: number;
  green: number;
  stability: number;
  component: Component;
  components: Component[];
  neighbors: Component[];
  connectedTo: (target: Component, predicate: (c: Component) => boolean) => number;
  isActiveBlue: (id: number) => boolean;
  isActiveStabilizer: (id: number) => boolean;
  isActiveHub: (id: number) => boolean;
}

export interface CalcResult {
  damage: number;
  aoe?: number;
  globalDamage?: number; // Phase 1에서 확장
  detail: string;
}

export interface ComponentDef {
  type: string;
  role: ComponentRole;
  name: string;
  text: string;
  formula: string;
  size: { w: number; h: number; rotatable?: boolean };
  requiredMap: number;
  order: number;
  calc?: (ctx: CalcContext) => CalcResult;
}
```

---

## 📝 신규 추가 파일 목록 (9개)

> 아래 `requiredMap`과 `order`는 제안값이며, 실제 게임 밸런스/툴바 배치에 맞게 조정 가능.

### 1. `src/lib/game/designer/components/red3.ts` — 3중 빨간 마나

```typescript
import type { ComponentDef } from './def';

export const red3: ComponentDef = {
  type: 'red3',
  role: 'mana',
  name: '3중 빨간 마나',
  text: '2칸짜리 압축 빨간 마나입니다. 마나 비용 2로 빨간 마나 3을 제공합니다.',
  formula: '비용 +2, 빨강 마나 3',
  size: { w: 2, h: 1, rotatable: true },
  requiredMap: 1,
  order: 1,
};

/** 빨간 마나 부품의 빨강 출력 계수 */
export function getRedPower(comp: { type: string }): number {
  if (comp.type === 'red3') return 3;
  if (comp.type === 'red') return 1;
  return 0;
}

/** 빨간 마나 부품의 마나 비용 */
export function getRedCost(comp: { type: string }): number {
  if (comp.type === 'red3') return 2;
  if (comp.type === 'red') return 1;
  return 0;
}
```

### 2. `src/lib/game/designer/components/mediumWire.ts` — 중형 도선

```typescript
import type { ComponentDef } from './def';

export const mediumWire: ComponentDef = {
  type: 'mediumWire',
  role: 'wire',
  name: '중형 도선',
  text: '빨강/파랑/초록을 전달하는 직선 도선입니다. 회전으로 가로/세로 방향을 정합니다.',
  formula: '3색 전달 (직선)',
  size: { w: 1, h: 1, rotatable: true },
  requiredMap: 2,
  order: 21,
};
```

### 3. `src/lib/game/designer/components/mediumHub.ts` — 중형 허브

```typescript
import type { ComponentDef } from './def';

export const mediumHub: ComponentDef = {
  type: 'mediumHub',
  role: 'wire',
  name: '중형 허브',
  text: '중형 마나망의 4방향 허브입니다. 주변 8칸 내 작동 중인 안정기 1개가 있어야 모든 방향으로 전달됩니다.',
  formula: '4방향, 안정도 1 필요',
  size: { w: 1, h: 1 },
  requiredMap: 3,
  order: 22,
};
```

### 4. `src/lib/game/designer/components/extractor.ts` — 추출기

```typescript
import type { ComponentDef } from './def';

export const extractor: ComponentDef = {
  type: 'extractor',
  role: 'extractor',
  name: '추출기',
  text: '도선망에서 선택한 색의 마나만 뽑아 화살표 방향의 인접 부품에 공급합니다.',
  formula: '색상별 1방향 출력',
  size: { w: 1, h: 1, rotatable: true },
  requiredMap: 2,
  order: 23,
};
```

### 5. `src/lib/game/designer/components/stabilizer.ts` — 안정기

```typescript
import type { ComponentDef } from './def';

export const stabilizer: ComponentDef = {
  type: 'stabilizer',
  role: 'stabilizer',
  name: '안정기',
  text: '파란 마나 1개가 연결되면 작동하고 주변 8칸에 안정도 1을 제공합니다.',
  formula: '파랑 1 → 안정도 1 (반경 1)',
  size: { w: 1, h: 1 },
  requiredMap: 2,
  order: 24,
};
```

### 6. `src/lib/game/designer/components/greenMana.ts` — 초록 마나

```typescript
import type { ComponentDef } from './def';

export const greenMana: ComponentDef = {
  type: 'greenMana',
  role: 'mana',
  name: '초록 마나',
  text: '2x2 크기의 초록마나 부품입니다. 2칸 혼합 회로와 닿아 있으면 마나 2를 소모해 초록마나 1을 제공합니다.',
  formula: 'mixed2 접촉 시 초록 1 (비용 +2)',
  size: { w: 2, h: 2 },
  requiredMap: 2,
  order: 34,
};
```

### 7. `src/lib/game/designer/components/green3x2.ts` — 3x2 순환 회로

```typescript
import type { ComponentDef } from './def';

export const green3x2: ComponentDef = {
  type: 'green3x2',
  role: 'circuit',
  name: '3x2 순환 회로',
  text: '초록마나 1과 파란마나 1이 필요합니다. 빨간 마나가 연결되면 불안정해져 작동하지 않습니다.',
  formula: '초록≥1, 파랑≥1, 빨강=0 → 50',
  size: { w: 3, h: 2, rotatable: true },
  requiredMap: 2,
  order: 35,
  calc: ({ red, blue, green }) => {
    if (red > 0) {
      return { damage: 0, detail: `빨강 ${red}개 연결 → 불안정` };
    }
    const active = green >= 1 && blue >= 1;
    const damage = active ? 50 : 0;
    return {
      damage,
      detail: active
        ? `초록 ${green}, 파랑 ${blue} → 순환 작동`
        : `초록 ${green}, 파랑 ${blue} → 조건 불만족`,
    };
  },
};
```

### 8. `src/lib/game/designer/components/greenPair2.ts` — 2x2 녹청 회로

```typescript
import type { ComponentDef } from './def';

export const greenPair2: ComponentDef = {
  type: 'greenPair2',
  role: 'circuit',
  name: '2x2 녹청 회로',
  text: '초록마나와 파란마나를 한 쌍으로 묶어 쌍당 일반 데미지 40을 냅니다.',
  formula: 'min(초록, 파랑) × 40',
  size: { w: 2, h: 2 },
  requiredMap: 2,
  order: 36,
  calc: ({ green, blue }) => {
    const pairs = Math.min(green, blue);
    const damage = pairs * 40;
    return {
      damage,
      detail: `min(초록 ${green}, 파랑 ${blue}) = ${pairs}쌍 × 40`,
    };
  },
};
```

### 9. `src/lib/game/designer/components/ultimateCore.ts` — 4x4 안정 핵

```typescript
import type { ComponentDef } from './def';

export const ultimateCore: ComponentDef = {
  type: 'ultimateCore',
  role: 'circuit',
  name: '4x4 안정 핵',
  text: '초록마나 3, 파란마나 2, 빨간마나 6, 안정도 3 이상이 필요합니다. 성공하면 일반 데미지 1400과 모든 몬스터 100 피해를 줍니다.',
  formula: '빨강≥6, 파랑≥2, 초록≥3, 안정도≥3 → 1400 + 전체 100',
  size: { w: 4, h: 4 },
  requiredMap: 3,
  order: 38,
  calc: ({ red, blue, green, stability }) => {
    const ok = red >= 6 && blue >= 2 && green >= 3 && stability >= 3;
    if (!ok) {
      return {
        damage: 0,
        globalDamage: 0,
        detail: `빨강 ${red}, 파랑 ${blue}, 초록 ${green}, 안정도 ${stability} → 조건 불만족`,
      };
    }
    return {
      damage: 1400,
      globalDamage: 100,
      detail: `빨강 ${red}, 파랑 ${blue}, 초록 ${green}, 안정도 ${stability} → 일반 1400, 전체 100`,
    };
  },
};
```

---

## 📝 기존 파일 변경 목록

### `src/lib/game/designer/components/def.ts`

Phase 1에서 이미 확장했지만, `CalcResult`에 `globalDamage`가 필요합니다.

```diff
  export interface CalcResult {
    damage: number;
    aoe?: number;
+   globalDamage?: number;
    detail: string;
  }
```

### `src/lib/game/designer/components/red.ts`

```diff
  import type { ComponentDef } from './def';

  export const red: ComponentDef = { /* 기존 그대로 */ };

+ /** 빨간 마나 부품의 빨강 출력 계수 */
+ export function getRedPower(comp: { type: string }): number {
+   if (comp.type === 'red3') return 3;
+   if (comp.type === 'red') return 1;
+   return 0;
+ }
+
+ /** 빨간 마나 부품의 마나 비용 */
+ export function getRedCost(comp: { type: string }): number {
+   if (comp.type === 'red3') return 2;
+   if (comp.type === 'red') return 1;
+   return 0;
+ }
```

### `src/lib/game/designer/components/registry.ts`

```typescript
import type { ComponentDef } from './def';
import { red } from './red';
import { red3 } from './red3';
import { blueGen } from './blueGen';
import { wire } from './wire';
import { mediumWire } from './mediumWire';
import { mediumHub } from './mediumHub';
import { extractor } from './extractor';
import { stabilizer } from './stabilizer';
import { circle } from './circle';
import { oval } from './oval';
import { kernel } from './kernel';
import { mixed2 } from './mixed2';
import { greenMana } from './greenMana';
import { green3x2 } from './green3x2';
import { greenPair2 } from './greenPair2';
import { mixedCore } from './mixedCore';
import { ultimateCore } from './ultimateCore';
import { eraser } from './eraser';

export const ALL_DEFS: ComponentDef[] = [
  red,
  red3,
  blueGen,
  wire,
  mediumWire,
  mediumHub,
  extractor,
  stabilizer,
  circle,
  oval,
  kernel,
  mixed2,
  greenMana,
  green3x2,
  greenPair2,
  mixedCore,
  ultimateCore,
  eraser,
];

// DEF_BY_TYPE, getDef, ORDERED_TYPES, CIRCUIT_TYPES, STORABLE_TYPES는 기존 로직 유지
```

> `STORABLE_TYPES`는 `role !== 'tool'`이므로 새 `extractor`/`stabilizer`도 자동으로 저장 가능 대상이 됩니다.

---

## ✅ 완료 조건

- [ ] 9개 신규 컴포넌트 정의 파일 생성
- [ ] `registry.ts`에 9개 등록
- [ ] `red.ts`에 `getRedPower`/`getRedCost` 헬퍼 추가
- [ ] `def.ts` `CalcResult`에 `globalDamage` 추가
- [ ] `npm run check` 통과
- [ ] 기존 컴포넌트 테스트 실패 없음

## 예상 소요: 2시간
