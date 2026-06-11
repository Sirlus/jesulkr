# 🌿 V2 Green/Stability 시스템 리팩토링 계획

> Jesulkr_v2_beta.html의 Green Mana / Stability 프로토타입을 SvelteKit 아키텍처에 반영

## 📋 개요

v2 beta에서 추가된 **녹색 마나 시스템**, **안정도 시스템**, **색상별 도선망**을
기존 Svelte 구조에 통합하는 단계별 계획입니다.

---

## 🎯 목표

1. **9개 신규 부품** 추가 (red3, mediumWire, mediumHub, extractor, stabilizer, greenMana, green3x2, greenPair2, ultimateCore)
2. **3색상 마나 시스템** 도입 (빨강/파랑/→초록)
3. **색상별 도선망 v3** 교체 (단일 → 색상별 독립망)
4. **안정도 시스템** 추가
5. **전체 데미지** 기능 추가
6. 프로토타입 완료 후 `PROTOTYPE_UNLOCK_ALL_TOOLS = false`로 전환

---

## 📁 폴더 구조 변경 계획

```
src/lib/game/
├── constants.ts                    [변경] GREEN_MANA, STABILITY 상수 추가
├── types.ts                        [변경] ComponentType 9개 추가, 안정도 필드 추가
│
├── designer/
│   ├── Components.ts               [변경] createComponent() 확장
│   ├── StatsCalculator.ts          [변경] calculateSpellStats() 녹색/안정도 반영
│   ├── WireNetwork.ts              [대폭변경] buildConnectionGraph 색상별 분리
│   ├── ExtractorSystem.ts          [신규] 추출기 로직
│   └── StabilitySystem.ts          [신규] 안정도 계산
│   │
│   └── components/
│       ├── red.ts                  [변경] getRedPower/cost 분리
│       ├── red3.ts                 [신규] 3중 빨간 마나
│       ├── blueGen.ts              [변경] 활성 판정 로직 수정
│       ├── wire.ts                 [변경] 소형 도선으로 제한
│       ├── mediumWire.ts           [신규] 중형 도선
│       ├── mediumHub.ts            [신규] 중형 허브
│       ├── extractor.ts            [신규] 추출기
│       ├── stabilizer.ts           [신규] 안정기
│       ├── circle.ts               [변경 없음]
│       ├── oval.ts                 [변경 없음]
│       ├── kernel.ts               [변경 없음]
│       ├── mixed2.ts               [변경] 초록생성 기능 제거
│       ├── greenMana.ts            [신규] 초록 마나
│       ├── green3x2.ts             [신규] 3x2 순환 회로
│       ├── greenPair2.ts           [신규] 2x2 녹청 회로
│       ├── mixedCore.ts            [변경] 전체데미지 추가
│       ├── ultimateCore.ts         [신규] 4x4 안정 핵
│       ├── eraser.ts               [변경 없음]
│       └── registry.ts             [변경] 9개 신규 부품 등록
│
├── battle/
│   ├── BattleEngine.ts             [변경] globalDamage 처리
│   ├── DamageResolver.ts           [변경] 전체 데미지 지원
│   └── CastingSystem.ts            [변경] 녹색/안정도 요구사항 체크
│
├── i18n/
│   ├── ko.ts                       [변경] 9개 부품명 + 안정도/전체 번역
│   └── en.ts                       [변경] 9개 부품명 + 안정도/전체 번역
│
└── stores/
    └── gameState.svelte.ts         [변경] extractorColor 상태 추가
```

---

## 🔀 주요 변경 사항 맵핑

### 1. 컴포넌트 타입 확장 (`types.ts`)

```typescript
// 현재: 9개
type ComponentType = 'red' | 'blueGen' | 'wire' | 'circle' | 'oval' | 'kernel' | 'mixed2' | 'mixedCore' | 'eraser'

// v2: 18개
type ComponentType =
  | 'red' | 'red3' | 'blueGen'
  | 'wire' | 'mediumWire' | 'mediumHub'
  | 'extractor' | 'stabilizer'
  | 'circle' | 'oval' | 'kernel' | 'mixed2'
  | 'greenMana' | 'green3x2' | 'greenPair2'
  | 'mixedCore' | 'ultimateCore'
  | 'eraser'
```

### 2. Component 인터페이스 확장

```typescript
// 현재
interface Component {
  id: string;
  type: ComponentType;
  x: number;
  y: number;
  w: number;
  h: number;
  rotation?: number;
}

// v2: color 필드 추가 (extractor용)
interface Component {
  id: string;
  type: ComponentType;
  x: number;
  y: number;
  w: number;
  h: number;
  rotation?: number;
  color?: 'red' | 'blue' | 'green'; // 추출기 색상
}
```

### 3. StatsCalculator 확장

```typescript
// 현재 반환값
{ manaCost, redCount, blueCount, damage, aoeDamage, castTime, valid }

// v2 반환값
{
  manaCost, redCount, redManaCost, greenCount, greenManaCost,
  activeBlueCount, inactiveBlueCount,
  activeStabilizerCount, activeHubCount, maxStability,
  damage, aoeDamage, globalDamage, castTime, valid
}
```

### 4. WireNetwork 시스템 대개조 (가장 큰 변경)

```
v1.5: 단일 도선망
  buildConnectionGraph() → { groups, compGroups }

v2: 색상별 독립 도선망 v3
  buildConnectionGraph() → { groupsByColor, compGroupsByColor }
    ├── red:   [소형도선, 중형도선, 중형허브]
    ├── blue:  [소형도선, 중형도선, 중형허브]
    └── green: [중형도선만, 중형허브]
```

**핵심 변경점:**
- 소형 도선: 빨강/파랑만 전달, 초록 불가
- 중형 도선: 3색 모두 전달, 직선 방향성 있음
- 중형 허브: 안정기 1개 필요, 4방향 전달
- 추출기: 도선망에서 특정 색상만 필터링하여 인접 부품에 공급

### 5. 추출기 시스템 (신규)

```typescript
// ExtractorSystem.ts
interface ExtractorSystem {
  // 추출기 색상 순환: 빨강 → 파랑 → 초록
  cycleColor(current: 'red' | 'blue' | 'green'): 'red' | 'blue' | 'green';

  // 추출기가 특정 출력을Components에 연결하는지 확인
  extractorOutputsTo(extractor: Component, target: Component): boolean;

  // 도선망에서 추출기가 뽑는 색상만 소스로 인정
  getExtractorInputSources(extractor, allComponents, graph, color): Component[];
}
```

### 6. 안정도 시스템 (신규)

```typescript
// StabilitySystem.ts
interface StabilitySystem {
  // 안정기 활성 확인: 파랑 1 필요
  isActiveStabilizer(comp: Component, ctx: CalcCtx): boolean;

  // 컴포넌트별 안정도 계산 (주변 8칸)
  stabilityFor(comp: Component, allComponents, ctx): number;

  // 쉐비셰프 거리 계산 (대각선 포함 8방향)
  chebyshevDistance(a: Component, b: Component): number;
}
```

---

## 🚀 구현 단계별 계획

### Phase 1: 타입 및 상수 확장 (30분)
- [ ] `types.ts`: ComponentType 18개로 확장, color 필드 추가
- [ ] `constants.ts`: 초록/안정도 관련 상수 추가

### Phase 2: 컴포넌트 정의 추가 (2시간)
- [ ] `components/red3.ts`: 3중 빨간 마나 정의
- [ ] `components/mediumWire.ts`: 중형 도선 정의
- [ ] `components/mediumHub.ts`: 중형 허브 정의
- [ ] `components/extractor.ts`: 추출기 정의
- [ ] `components/stabilizer.ts`: 안정기 정의
- [ ] `components/greenMana.ts`: 초록 마나 정의
- [ ] `components/green3x2.ts`: 3x2 순환 회로 정의
- [ ] `components/greenPair2.ts`: 2x2 녹청 회로 정의
- [ ] `components/ultimateCore.ts`: 4x4 안정 핵 정의
- [ ] `registry.ts`: 신규 9개 부품 등록

### Phase 3: 핵심 엔진 변경 (3시간)
- [ ] `WireNetwork.ts`: 색상별 도선망 v3 구현
- [ ] `ExtractorSystem.ts`: 추출기 로직 구현
- [ ] `StabilitySystem.ts`: 안정도 계산 구현
- [ ] `StatsCalculator.ts`: green/stability/global 반영
- [ ] `Components.ts`: createComponent() 확장

### Phase 4: 전투 시스템 반영 (1시간)
- [ ] `BattleEngine.ts`: globalDamage 처리
- [ ] `DamageResolver.ts`: 전체 데미지 지원
- [ ] `CastingSystem.ts`: 녹색/안정도 요구사항 체크

### Phase 5: UI 반영 (2시간)
- [ ] `toolBar`: 9개 신규 도구 버튼 추가
- [ ] `toolInfo`: 신규 부품 설명 표시
- [ ] `DesignBoard`: 신규 부품 CSS 렌더링
- [ ] `PlacementGhost`: 신규 부품 배치 미리보기
- [ ] CSS: v2 beta에서 .piece.* 스타일 복사

### Phase 6: i18n 반영 (30분)
- [ ] `ko.ts`: 한국어 9개 부품명 + 설명 추가
- [ ] `en.ts`: English 9개 부품명 + 설명 추가

### Phase 7: 프로토타입 테스트 및 정리 (2시간)
- [ ] `PROTOTYPE_UNLOCK_ALL_TOOLS = true` 상태로 전체 테스트
- [ ] 도선망 연결 정상 확인
- [ ] 추출기 색상 순환 확인
- [ ] 안정도 시스템 확인
- [ ] `PROTOTYPE_UNLOCK_ALL_TOOLS = false` 전환

---

## ⚡ 우선순위

| 우선 | 단계 | 소요 | 비고 |
|------|------|------|------|
| 🔴 P0 | Phase 1 + 2 | 2.5시간 | 타입/컴포넌트 없으면 나머지 불가 |
| 🔴 P0 | Phase 3 핵심 | 2시간 | WireNetwork v3 가장 복잡 |
| 🟡 P1 | Phase 4 + 5 | 3시간 | UI 반영 |
| 🟡 P1 | Phase 3 나머지 | 1시간 | Extractor/Stability |
| 🟢 P2 | Phase 6 | 30분 | i18n은 별도로 미뤄도 가능 |
| 🟢 P2 | Phase 7 | 2시간 | 통합 테스트 |

---

## 📐 아키텍처 다이어그램

```
┌──────────────────────────────────────────────────────────────┐
│                    DesignerController                         │
│         (도구 선택, 배치, 회전, 추출기 색상 순환)                │
└──────────┬─────────────────────┬─────────────────────────────┘
           │                     │
           ▼                     ▼
┌──────────────────┐   ┌──────────────────────┐
│  Components.ts   │   │  DesignerRenderer    │
│ (createComponent)│   │  (Canvas/SVG 렌더링)  │
└────────┬─────────┘   └──────────┬───────────┘
         │                         │
         ▼                         ▼
┌──────────────────────────────────────────────┐
│              components/ registry             │
│  red | red3 | blueGen | wire | mediumWire    │
│  | mediumHub | extractor | stabilizer        │
│  | circle | oval | kernel | mixed2           │
│  | greenMana | green3x2 | greenPair2         │
│  | mixedCore | ultimateCore | eraser          │
└────────────────┬─────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────┐
│           WireNetwork.ts (신규 v3)            │
│  ┌──────────┬──────────┬──────────┐          │
│  │ red 망  │ blue 망  │green 망  │          │
│  │소형+중형│소형+중형│ 중형만     │          │
│  └──────────┴──────────┴──────────┘          │
│  → ExtractorSystem 필터링                     │
└────────────────┬─────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────┐
│         StatsCalculator.ts 확장               │
│  manaCost, redCount, greenCount,             │
│  activeBlueCount, stability,                 │
│  damage, aoeDamage, globalDamage             │
└────────────────┬─────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────┐
│         CastingSystem → BattleEngine          │
│  globalDamage → 모든 몬스터 피해               │
└──────────────────────────────────────────────┘
```

---

## ⚠️ 리스크 및 고려사항

### 1. **호환성**
- v1.x 저장된 술식은 `red, blueGen, wire, circle, oval, kernel, mixed2, mixedCore`만 포함
- v2 로더에서 `normalizeType()`으로 레거시 호환 처리 필요
- `extractRed/extractBlue/extractGreen` → `extractor` + `color` 매핑

### 2. **WireNetwork 변경 리스크**
- 기존 `buildConnectionGraph()` 반환값 구조 변경 (`groups, compGroups` → `groupsByColor, compGroupsByColor`)
- 기존 컴포넌트(red, blueGen, wire)는 하위 호환 wrapper 유지
- `getConnectedComponents()` 기존 함수명 유지, 내부적으로 색상별 호출

### 3. **성능**
- 색상별 도선망 BFS 3회 (기존 1회)
- 안정도 계산 O(n²) (컴포넌트 수 × 주변 8칸)
- 추출기 입력 소스 탐색 추가

### 4. **UI 복잡도**
- 도구 9개 → 18개로 증가 (2배)
- toolBar 그리드 레이아웃 수정 필요
- extractor는 버튼 다시 클릭으로 색상 순환 UI 필요

---

## 📝 참고

- v2 beta HTML 파일 위치: `Jesulkr_v2_beta.html`
- v1.5 HTML 파일 위치: `Jesulkr_v1.5.html` (git 복원됨)
- CSS 스타일 참조: v2 beta의 `.piece.*`, `.previewPiece.*`, `:root{--green...}` 블럭
- JS 핵심 로직 참조: v2 beta의 WireNetwork v3, ExtractorSystem, StabilitySystem