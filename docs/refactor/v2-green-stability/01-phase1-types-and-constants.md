# Phase 1: 타입 및 상수 확장

> 목표: v2 신규 부품을 위한 타입 정의와 상수 추가

## 📝 변경 파일 목록

### 1. `src/lib/game/types.ts`

#### 변경 사항

```diff
+ // v2 신규 부품 타입
+ export type ComponentType =
+   | 'red' | 'red3' | 'blueGen'
+   | 'wire' | 'mediumWire' | 'mediumHub'
+   | 'extractor' | 'stabilizer'
+   | 'circle' | 'oval' | 'kernel' | 'mixed2'
+   | 'greenMana' | 'green3x2' | 'greenPair2'
+   | 'mixedCore' | 'ultimateCore'
+   | 'eraser';

+ // 추출기 색상 타입
+ export type ExtractorColor = 'red' | 'blue' | 'green';

  export interface Component {
    id: string;
    type: ComponentType;
    x: number;
    y: number;
    w: number;
    h: number;
    rotation?: number;
+   color?: ExtractorColor; // 추출기 색상 (red/blue/green)
  }

+ // 색상별 도선망 반환 타입
+ export interface WireGroup {
+   color: 'red' | 'blue' | 'green';
+   ids: Set<string>;
+   cells: Set<string>;
+   components: Set<string>;
+ }
+ 
+ export interface WireNetworkData {
+   groupsByColor: {
+     red: WireGroup[];
+     blue: WireGroup[];
+     green: WireGroup[];
+   };
+   compGroupsByColor: {
+     red: Map<string, Set<number>>;
+     blue: Map<string, Set<number>>;
+     green: Map<string, Set<number>>;
+   };
+ }

+ // 스펠 통계 확장
+ export interface SpellStats {
+   castTime: number;
+   manaCost: number;
+   redCount: number;
+   redManaCost: number;
+   greenCount: number;
+   greenManaCost: number;
+   activeBlueCount: number;
+   inactiveBlueCount: number;
+   activeStabilizerCount: number;
+   activeHubCount: number;
+   maxStability: number;
+   damage: number;
+   aoeDamage: number;
+   globalDamage: number;
+   breakdown: string;
+   valid: boolean;
+ }

+ // 계산 컨텍스트 (안정도/활성화 상태)
+ export interface CalcCtx {
+   activeBlueIds?: Set<string>;
+   activeGreenIds?: Set<string>;
+   activeStabilizerIds?: Set<string>;
+   activeHubIds?: Set<string>;
+   hubBootstrap?: boolean;
+ }
```

### 2. `src/lib/game/constants.ts`

```diff
+ // === v2 Green/Stability 상수 ===
+ 
+ /** 녹색 마나 관련 */
+ export const GREEN_MANA = {
+   /** 2칸 혼합 회로와 접촉 시 필요 마나 비용 */
+   COST_PER_ACTIVE: 2,
+   /** 활성화 시 제공하는 마나 */
+   MANA_PROVIDED: 1,
+ } as const;
+ 
+ /** 안정도 관련 */
+ export const STABILITY = {
+   /** 안정기가 제공하는 안정도 값 */
+   PER_STABILIZER: 1,
+   /** 안정기 영향 범위 (쉐비셰프 거리 1 = 주변 8칸) */
+   RANGE: 1,
+   /** 안정기 활성에 필요한 파란 마나 */
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
+   /** 회전 0 = 우측(0도), 1 = 하단(90도), 2 = 좌측(180도), 3 = 상단(270도) */
+   DIRECTION_MAP: [
+     { dx: 1, dy: 0 },  // 우
+     { dx: 0, dy: 1 },  // 하
+     { dx: -1, dy: 0 }, // 좌
+     { dx: 0, dy: -1 }, // 상
+   ] as const,
+ } as const;
```

## 🧪 테스트 계획

1. TypeScript 컴파일 에러 없는지 확인
2. `ComponentType`이 18개인지 확인
3. `ExtractorColor` 순환 로직 단위 테스트

## ✅ 완료 조건

- [ ] `types.ts`에 모든 신규 타입 정의 추가
- [ ] `constants.ts`에 v2 상수 추가
- [ ] `tsc --noEmit` 통과
- [ ] 기존 파일에서 타입 참조 에러 없음

## 예상 소요: 30분