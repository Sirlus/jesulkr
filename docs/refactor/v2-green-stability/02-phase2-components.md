# Phase 2: 컴포넌트 정의 추가 (9개 신규)

> 목표: v2 신규 부품 9개 정의 파일 생성 + 기존 파일 수정

## 📝 신규 추가 파일 목록 (9개)

### 1. `src/lib/game/designer/components/red3.ts` — 3중 빨간 마나

```typescript
// 2칸 압축 빨간 마나, 비용 2로 빨강 3 제공
export const red3Def = {
  type: 'red3' as const,
  name: '3중 빨간 마나',
  width: 2,
  height: 1,
  manaCost: 2,
  redPower: 3,
  bluePower: 0,
  greenPower: 0,
  damage: 0,
  description: '2칸짜리 압축 빨간 마나입니다. 마나 비용 2로 빨간 마나 3을 제공합니다.',
  isManaSource: true,
  isWire: false,
  requiresStability: false,
} as const;
```

### 2. `src/lib/game/designer/components/mediumWire.ts` — 중형 도선

```typescript
// 3색 전달 직선 도선, 회전으로 방향 지정
export const mediumWireDef = {
  type: 'mediumWire' as const,
  name: '중형 도선',
  width: 1,
  height: 1,
  manaCost: 0,
  redPower: 0,
  bluePower: 0,
  greenPower: 0,
  damage: 0,
  description: '빨강/파랑/초록을 전달하는 직선 도선입니다. 회전으로 가로/세로 방향을 정합니다.',
  isManaSource: false,
  isWire: true,
  wireColors: ['red', 'blue', 'green'] as const,
  directional: true, // rotation 0=가로, 1=세로
  requiresStability: false,
} as const;
```

### 3. `src/lib/game/designer/components/mediumHub.ts` — 중형 허브

```typescript
// 4방향 허브, 안정도 1 필요
export const mediumHubDef = {
  type: 'mediumHub' as const,
  name: '중형 허브',
  width: 1,
  height: 1,
  manaCost: 0,
  redPower: 0,
  bluePower: 0,
  greenPower: 0,
  damage: 0,
  description: '중형 마나망의 4방향 허브입니다. 주변 8칸 안의 작동 중 안정기 1개가 있어야 최종 전달 부품으로 활성화됩니다.',
  isManaSource: false,
  isWire: true,
  wireColors: ['red', 'blue', 'green'] as const,
  directional: false,
  requiresStability: true,
  stabilityRequired: 1,
} as const;
```

### 4. `src/lib/game/designer/components/extractor.ts` — 추출기

```typescript
// 도선망에서 색상별 필터링 출력
export const extractorDef = {
  type: 'extractor' as const,
  name: '추출기',
  width: 1,
  height: 1,
  manaCost: 0,
  redPower: 0,
  bluePower: 0,
  greenPower: 0,
  damage: 0,
  description: '도선망에서 선택한 색의 마나만 뽑아 화살표 방향의 인접 부품에 공급합니다.',
  isManaSource: false,
  isWire: false,
  directional: true,
  colorSelection: true, // 추출기 색상 순환
} as const;

// 추출기 색상 순환 헬퍼
export function cycleExtractorColor(color: 'red' | 'blue' | 'green'): 'red' | 'blue' | 'green' {
  const cycle: ('red' | 'blue' | 'green')[] = ['red', 'blue', 'green'];
  const idx = cycle.indexOf(color);
  return cycle[(idx + 1) % 3];
}
```

### 5. `src/lib/game/designer/components/stabilizer.ts` — 안정기

```typescript
// 파랑 1 필요, 주변 8칸에 안정도 +1
export const stabilizerDef = {
  type: 'stabilizer' as const,
  name: '안정기',
  width: 1,
  height: 1,
  manaCost: 0,
  redPower: 0,
  bluePower: 0,
  greenPower: 0,
  damage: 0,
  description: '파란 마나 1개가 연결되면 작동하고 주변 8칸에 안정도 1을 제공합니다.',
  isManaSource: false,
  isWire: false,
  requiresBlue: 1,
  providesStability: true,
  stabilityAura: 1,
  stabilityRange: 1, // 쉐비셰프 거리
} as const;
```

### 6. `src/lib/game/designer/components/greenMana.ts` — 초록 마나

```typescript
// 2x2 크기, 2칸 혼합 회로와 접촉 시 마나 2 소모해 초록 1 제공
export const greenManaDef = {
  type: 'greenMana' as const,
  name: '초록 마나',
  width: 2,
  height: 2,
  manaCost: 2, // mixed2 접촉 시 추가 비용
  redPower: 0,
  bluePower: 0,
  greenPower: 1,
  damage: 0,
  description: '2x2 크기의 초록마나 부품입니다. 2칸 혼합 회로와 닿아 있으면 마나 2를 소모해 초록마나 1을 제공합니다.',
  isManaSource: true,
  requiresMixed2Contact: true,
  isWire: false,
  requiresStability: false,
} as const;
```

### 7. `src/lib/game/designer/components/green3x2.ts` — 3x2 순환 회로

```typescript
// 초록 1 + 파랑 1 필요, 빨강 금지
export const green3x2Def = {
  type: 'green3x2' as const,
  name: '3x2 순환 회로',
  width: 3,
  height: 2,
  damage: 50,
  description: '초록마나 1과 파란마나 1이 필요합니다. 빨간 마나가 연결되면 불안정해져 작동하지 않습니다.',
  greenPower: 1, // 최소 필요
  bluePower: 1,
  noRed: true, // 빨강 금지
  isManaSource: false,
  isWire: false,
  requiresStability: false,
} as const;
```

### 8. `src/lib/game/designer/components/greenPair2.ts` — 2x2 녹청 회로

```typescript
// 초록+파랑 쌍당 데미지 40
export const greenPair2Def = {
  type: 'greenPair2' as const,
  name: '2x2 녹청 회로',
  width: 2,
  height: 2,
  damage: 40, // min(초록, 파랑) × 40
  description: '초록마나와 파란마나를 한 쌍으로 묶어 쌍당 일반 데미지 40을 냅니다.',
  isManaSource: false,
  isWire: false,
  useMin: true,
  formula: 'min(초록, 파랑) × 40',
  requiresStability: false,
} as const;
```

### 9. `src/lib/game/designer/components/ultimateCore.ts` — 4x4 안정 핵

```typescript
// 초록 3 + 파랑 2 + 빨강 6 + 안정도 3 → 일반 1400 + 전체 100
export const ultimateCoreDef = {
  type: 'ultimateCore' as const,
  name: '4x4 안정 핵',
  width: 4,
  height: 4,
  greenRequired: 3,
  blueRequired: 2,
  redRequired: 6,
  stabilityRequired: 3,
  damage: 1400,
  globalDamage: 100,
  description: '초록마나 3, 파란마나 2, 빨간마나 6, 안정도 3 이상이 필요합니다. 성공하면 일반 1400과 모든 몬스터 100 피해를 줍니다.',
  isManaSource: false,
  isWire: false,
  requiresStability: true,
} as const;
```

---

## 📝 기존 파일 변경 목록

### `registry.ts`
```typescript
// 신규 import 9개 추가
import { red3Def } from './red3';
import { mediumWireDef } from './mediumWire';
import { mediumHubDef } from './mediumHub';
import { extractorDef, cycleExtractorColor } from './extractor';
import { stabilizerDef } from './stabilizer';
import { greenManaDef } from './greenMana';
import { green3x2Def } from './green3x2';
import { greenPair2Def } from './greenPair2';
import { ultimateCoreDef } from './ultimateCore';

// COMPONENT_DEFS 배열에 9개 추가
export const COMPONENT_DEFS: ComponentDefinition[] = [
  // 기존...
  red3Def,
  mediumWireDef,
  mediumHubDef,
  extractorDef,
  stabilizerDef,
  greenManaDef,
  green3x2Def,
  greenPair2Def,
  ultimateCoreDef,
];
```

### `red.ts`
```typescript
// getRedPower/getRedCost 헬퍼 분리
export function getRedPower(comp: Component): number {
  return comp.type === 'red3' ? 3 : (comp.type === 'red' ? 1 : 0);
}

export function getRedCost(comp: Component): number {
  return comp.type === 'red3' ? 2 : (comp.type === 'red' ? 1 : 0);
}
```

## ✅ 완료 조건

- [ ] 신규 9개 컴포넌트 정의 파일 생성
- [ ] registry.ts에 9개 등록
- [ ] red.ts에 getRedPower/cost 헬퍼 분리
- [ ] tsc --noEmit 통과
- [ ] 기존 컴포넌트 테스트 실패 없음

## 예상 소요: 2시간