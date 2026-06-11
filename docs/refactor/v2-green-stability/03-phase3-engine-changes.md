# Phase 3~7: 핵심 엔진 → UI → i18n → 테스트

> Phase 3 핵심 엔진 변경부터 Phase 7 통합 테스트까지

---

## Phase 3: 핵심 엔진 변경 (3시간)

### 3-1. `WireNetwork.ts` — 색상별 도선망 v3

**가장 큰 변경. 기존 단일 도선망을 색상별 독립망으로 분할.**

#### 현재 구조
```typescript
buildConnectionGraph(components) → { groups, compGroups }
// 단일 그룹 배열, 모든 색상 통합
```

#### v2 구조
```typescript
buildConnectionGraph(components, ctx) → { groupsByColor, compGroupsByColor }
// 색상별 독립 그룹

interface WireNetworkData {
  groupsByColor: {
    red: WireGroup[];
    blue: WireGroup[];
    green: WireGroup[];
  };
  compGroupsByColor: {
    red: Map<string, Set<number>>;
    blue: Map<string, Set<number>>;
    green: Map<string, Set<number>>;
  };
}
```

#### 핵심 변경 함수
- `buildConnectionGraph()`: 색상이별 BFS로 그래프 구축
- `carryColorsFor(comp, ctx)`: 컴포넌트가 전달할 수 있는 색상 목록 반환
- `wirePortsFor(comp, ctx)`: 방향성 도선의 포트 정보
- `hasWirePort(comp, dir, ctx)`: 특정 방향으로 연결 가능한지
- `isWireLike(comp, ctx)`: 도선 역할을 하는지

#### 도선 규칙 v3
| 도선 | 색상 | 방향 | 안정도 |
|------|------|------|--------|
| 소형(wire) | 빨강/파랑 | 무방향 | 없음 |
| 중형(mediumWire) | 빨강/파랑/초록 | 직선(회전) | 없음 |
| 허브(mediumHub) | 빨강/파랑/초록 | 4방향 | 1 필요 |

### 3-2. `ExtractorSystem.ts` (신규)

```typescript
// ExtractorSystem.ts
export interface ExtractorSystem {
  cycleColor: (color: ExtractorColor) => ExtractorColor;
  extractorOutputsTo: (extractor: Component, target: Component) => boolean;
  getExtractorInputSources: (
    extractor: Component, 
    components: Component[], 
    graph: WireNetworkData, 
    color: ExtractorColor
  ) => Component[];
}

export function createExtractorSystem(): ExtractorSystem { ... }
```

 핵심 로직:
1. 추출기 회전 방향(0~3)으로 출력 방향 결정
2. 화살표 반대 방향 도선망에서 동일 색상 검색
3. 해당 색상 마나만 필터링하여 출력

### 3-3. `StabilitySystem.ts` (신규)

```typescript
// StabilitySystem.ts
export interface StabilitySystem {
  isActiveStabilizer: (comp: Component, ctx: CalcCtx) => boolean;
  stabilityFor: (comp: Component, components: Component[], ctx: CalcCtx) => number;
}

export function createStabilitySystem(): StabilitySystem { ... }

// 쉐비셰프 거리 계산 (대각선 포함 8방향)
export function chebyshevDistance(a: Component, b: Component): number {
  const dx = Math.max(0, Math.max(b.x - (a.x + a.w - 1), (a.x) - (b.x + b.w - 1)));
  const dy = Math.max(0, Math.max(b.y - (a.y + a.h - 1), (a.y) - (b.y + b.h - 1)));
  return Math.max(dx, dy);
}
```

### 3-4. `StatsCalculator.ts` — 확장

```typescript
// 확장된 반환 타입
interface SpellStats {
  manaCost: number;
  redCount: number;
  redManaCost: number;
  greenCount: number;
  greenManaCost: number;
  activeBlueCount: number;
  inactiveBlueCount: number;
  activeStabilizerCount: number;
  activeHubCount: number;
  maxStability: number;
  damage: number;
  aoeDamage: number;
  globalDamage: number;
  castTime: number;
  valid: boolean;
}
```

**주요 변경:**
- `calculateSpellStats()`에 ctx 파라미터 추가
- 녹색 마나 활성화 계산 (mixed2 접촉 여부 확인)
- 안정기 활성/전달 안정도 합산
- 중형 허브 활성 판정
- ultimateCore globalDamage 산출
- breakdown 문자열에 안정도/전체데미지 포함

### 3-5. `Components.ts` — createComponent 확장

```typescript
// color 필드 지원 추가
export function createComponent(
  type: ComponentType, 
  x: number, 
  y: number, 
  rotation = 0, 
  color?: ExtractorColor
): Component {
  const def = COMPONENT_DEFS.find(d => d.type === type);
  if (!def) throw new Error(`Unknown component type: ${type}`);
  
  const comp: Component = {
    id: generateId(),
    type,
    x, y,
    w: def.width,
    h: def.height,
    rotation,
    ...(color ? { color } : {}),
  };
  return comp;
}
```

---

## Phase 4: 전투 시스템 반영 (1시간)

### 4-1. `BattleEngine.ts`
```typescript
// 스펠 시전 시 globalDamage 처리
function applySpellDamage(spell: Spell, game: Game) {
  // 기존 데미지
  applyNormalDamage(spell.damage);
  applyAoeDamage(spell.aoeDamage);
  
  // v2: 전체 데미지
  if (spell.globalDamage > 0) {
    for (const monster of game.monsters) {
      if (monster.hp > 0) {
        monster.hp -= spell.globalDamage;
        game.effects.push({
          type: 'hit',
          x: monster.x,
          y: monster.y,
          text: `-${spell.globalDamage}`
        });
      }
    }
  }
}
```

### 4-2. `DamageResolver.ts`
```typescript
// globalDamage 필드 지원
export function resolveDamage(spell: Spell, monsters: Monster[]) {
  return {
    normal: spell.damage,
    aoe: spell.aoeDamage,
    global: spell.globalDamage || 0,
    total: spell.damage + spell.aoeDamage * 3 + (spell.globalDamage || 0) * monsters.length,
  };
}
```

### 4-3. `CastingSystem.ts`
```typescript
// 녹색/안정도 요구사항 체크
export function canCastSpell(spell: Spell, ctx: CalcCtx): { canCast: boolean, reason?: string } {
  // 기존 마나 체크
  if (game.currentMana < spell.manaCost) {
    return { canCast: false, reason: '마나 부족' };
  }
  
  // v2: 안정도 체크
  if (spell.requiresStability && ctx.maxStability < spell.stabilityRequired) {
    return { canCast: false, reason: '안정도 부족' };
  }
  
  return { canCast: true };
}
```

---

## Phase 5: UI 반영 (2시간)

### 5-1. `DesignerPanel.svelte` — 도구 버튼 추가

```svelte
<!-- toolbar에 9개 신규 버튼 추가 -->
<div class="toolBar">
  <!-- 기존 -->
  <button class="toolBtn" data-tool="red">빨간 점 마나</button>
  <button class="toolBtn" data-tool="blueGen">파란 마나 생성기</button>
  <button class="toolBtn" data-tool="wire">소형 도선</button>
  <button class="toolBtn" data-tool="circle">1칸 회로</button>
  <button class="toolBtn" data-tool="oval">2칸 타원</button>
  <button class="toolBtn" data-tool="kernel">2x2 핵</button>
  <button class="toolBtn" data-tool="mixed2">2칸 혼합</button>
  <button class="toolBtn" data-tool="mixedCore">9칸 혼합 핵</button>
  <button class="toolBtn" data-tool="eraser">지우개</button>
  
  <!-- v2 신규 -->
  <button class="toolBtn" data-tool="red3">3중 빨간 마나</button>
  <button class="toolBtn" data-tool="mediumWire">중형 도선</button>
  <button class="toolBtn" data-tool="mediumHub">중형 허브</button>
  <button class="toolBtn" data-tool="extractor">추출기</button>
  <button class="toolBtn" data-tool="stabilizer">안정기</button>
  <button class="toolBtn" data-tool="greenMana">초록 마나</button>
  <button class="toolBtn" data-tool="green3x2">3x2 순환 회로</button>
  <button class="toolBtn" data-tool="greenPair2">2x2 녹청 회로</button>
  <button class="toolBtn" data-tool="ultimateCore">4x4 안정 핵</button>
</div>
```

### 5-2. `PlacementGhost.svelte` — 신규 부품 미리보기
- 신규 부품 CSS 클래스 매핑 추가
- 중형 도선 회전 미리보기 지원

### 5-3. v2 beta CSS 스타일 복사
```css
/* v2 beta에서 복사할 스타일 */
:root { --green: #70ffc0; --green2: #1ca875; --violet: #b790ff; }

.piece.red3::after { ... }
.piece.greenMana::after { ... }
.piece.mediumWire::after { ... }
.piece.mediumHub::after { ... }
.piece.extractor::after { ... }
.piece.stabilizer::after { ... }
.piece.green3x2::after { ... }
.piece.greenPair2::after { ... }
.piece.ultimateCore::after { ... }

.previewPiece.red3::after { ... }
/* ... previewPiece들도 동일하게 ... */

.prototypeNote { ... }
```

---

## Phase 6: i18n 반영 (30분)

### 6-1. `ko.ts`

```typescript
export const ko: Record<string, string> = {
  // 기존...
  
  // v2 신규 부품명
  'red3': '3중 빨간 마나',
  'mediumWire': '중형 도선',
  'mediumHub': '중형 허브',
  'extractor': '추출기',
  'stabilizer': '안정기',
  'greenMana': '초록 마나',
  'green3x2': '3x2 순환 회로',
  'greenPair2': '2x2 녹청 회로',
  'ultimateCore': '4x4 안정 핵',
  
  // v2 새 용어
  'Stability': '안정도',
  'Global': '전체',
  'Green Mana': '초록마나',
  'Triple Red Mana': '3중 빨간 마나',
  'Small Wire': '소형 도선',
  'Red Extractor': '빨강 추출기',
  'Blue Extractor': '파랑 추출기',
  'Green Extractor': '초록 추출기',
  '3x2 Cycle Circuit': '3x2 순환 회로',
  '4x4 Stability Core': '4x4 안정 핵',
};
```

### 6-2. `en.ts`
```typescript
export const en: Record<string, string> = {
  // 기존 번역...
  
  // v2 translations
  '3중 빨간 마나': 'Triple Red Mana',
  '소형 도선': 'Small Wire',
  '중형 도선': 'Medium Wire',
  '중형 허브': 'Medium Hub',
  '추출기': 'Extractor',
  '안정기': 'Stabilizer',
  '초록 마나': 'Green Mana',
  '3x2 순환 회로': '3x2 Cycle Circuit',
  '2x2 녹청 회로': '2x2 Green-Blue Circuit',
  '4x4 안정 핵': '4x4 Stability Core',
  '안정도': 'Stability',
  '전체': 'Global',
};
```

---

## Phase 7: 테스트 및 정리 (2시간)

### 7-1. 프로토타입 상태 확인
```typescript
// constants.ts 또는 gameState.svelte.ts
export const PROTOTYPE_UNLOCK_ALL_TOOLS = true; // 테스트용
// 실제 배포 시: false
```

### 7-2. 테스트 시나리오
1. **모든 도구 배치 테스트**: 18개 도구 모두 배치 가능 확인
2. **색상별 도선망 테스트**: 
   - 소형 도선: 빨강/파랑만 전달, 초록 차단
   - 중형 도선: 3색 모두 전달
   - 중형 허브 + 안정기 활성화
3. **추출기 색상 순환**: 빨강→파랑→초록→빨강 확인
4. **안정도 계산**: 8방향 쉐비셰프 거리 확인
5. **녹색 마나 활성화**: mixed2 접촉 시 활성화 확인
6. **ultimateCore**: 전체 데미지 전 몬스터 적용 확인
7. **기존 호환성**: v1.x 저장 데이터 로딩 확인

### 7-3. 레거시 호환 처리
```typescript
// StorageSlots.ts 또는 StorageDecks.ts
export function normalizeLegacySpell(raw: any): Spell {
  // extractRed/extractBlue/extractGreen → extractor + color
  const comp = raw.components.map(c => {
    if (c.type === 'extractRed') return { ...c, type: 'extractor', color: 'red' };
    if (c.type === 'extractBlue') return { ...c, type: 'extractor', color: 'blue' };
    if (c.type === 'extractGreen') return { ...c, type: 'extractor', color: 'green' };
    if (c.type === 'mana') return { ...c, type: 'red' };
    return c;
  });
  
  return { ...raw, components: comp, globalDamage: raw.globalDamage || 0 };
}
```

---

## ✅ 전체 완료 조건

### Phase 3
- [ ] WireNetwork.ts 색상별 도선망 v3 구현
- [ ] ExtractorSystem.ts 신규 생성
- [ ] StabilitySystem.ts 신규 생성
- [ ] StatsCalculator.ts 확장
- [ ] Components.ts color 필드 지원

### Phase 4
- [ ] BattleEngine.ts globalDamage 처리
- [ ] DamageResolver.ts 전체 데미지 지원
- [ ] CastingSystem.ts 녹색/안정도 체크

### Phase 5
- [ ] DesignerPanel.svelte 9개 신규 도구 버튼
- [ ] PlacementGhost 신규 부품 CSS 매핑
- [ ] style.css에 v2 스타일 추가

### Phase 6
- [ ] ko.ts 9개 부품명 + 용어 추가
- [ ] en.ts 9개 부품명 번역 추가

### Phase 7
- [ ] PROTOTYPE_UNLOCK_ALL_TOOLS = true로 테스트
- [ ] 모든 시나리오 통과 확인
- [ ] 레거시 호환성 확인
- [ ] PROTOTYPE_UNLOCK_ALL_TOOLS = false 전환

---

## 예상 총 소요: 8.5시간
- Phase 3: 3시간 (핵심 엔진)
- Phase 4: 1시간 (전투 시스템)
- Phase 5: 2시간 (UI)
- Phase 6: 30분 (i18n)
- Phase 7: 2시간 (테스트)