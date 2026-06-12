# v2 Green/Stability Refactoring TODO (업데이트됨)

> 계획서 리뷰 후 보강된 구현 체크리스트

## Current State (분석 완료)
- Component Types: 9 (`red`, `blueGen`, `wire`, `circle`, `oval`, `kernel`, `mixed2`, `mixedCore`, `eraser`)
- WireNetwork: 단일 그래프 (`buildConnectionGraph`)
- StatsCalculator: red/blue만, `CalcContext`에 green/stability/globalDamage 없음
- ComponentDef: `role`, `size`, `requiredMap`, `order`, `calc` 기반
- DamageResolver: 존재하나 `BattleEngine.ts`에서 직접 데미지 처리 중
- Types: `ExtractorColor`, `ColorConnectionGraph`, `SpellData.globalDamage` 누락

## Target State
- Component Types: 18 (+9개 신규)
- WireNetwork: 색상별 도선망 v3 (`buildColorConnectionGraph` 추가, 기존 함수 유지)
- StatsCalculator: +green, stability, globalDamage, 다중 패스 계산
- BattleEngine: inline globalDamage 처리
- CastingSystem: 레거시 호환 (`globalDamage` 기본값)

---

## Implementation Order

### Phase 1: Types & Constants (30min)
- [ ] `types.ts`: `ExtractorColor`, `ColorConnectionGraph`, `SpellData.globalDamage`, `SpellStats` 확장
- [ ] `constants.ts`: `PROTOTYPE_UNLOCK_ALL_TOOLS`, `GREEN_MANA`, `STABILITY`, `MEDIUM_HUB`, `MEDIUM_WIRE`, `SMALL_WIRE`, `EXTRACTOR`
- [ ] `def.ts`: `ComponentRole`에 `'extractor'`, `'stabilizer'` 추가, `CalcContext` 확장, `CalcResult.globalDamage` 추가
- [ ] `npm run check` 통과

### Phase 2: Components (2h)
- [ ] `designer/components/red3.ts`
- [ ] `designer/components/mediumWire.ts`
- [ ] `designer/components/mediumHub.ts`
- [ ] `designer/components/extractor.ts`
- [ ] `designer/components/stabilizer.ts`
- [ ] `designer/components/greenMana.ts`
- [ ] `designer/components/green3x2.ts` (+ calc)
- [ ] `designer/components/greenPair2.ts` (+ calc)
- [ ] `designer/components/ultimateCore.ts` (+ calc)
- [ ] `registry.ts`: 9개 import 및 등록
- [ ] `red.ts`: `getRedPower` / `getRedCost` 헬퍼 추가
- [ ] `npm run check` 통과

### Phase 3: Engine (5h)
- [ ] `WireNetwork.ts`: `buildColorConnectionGraph` 추가, 방향성 mediumWire 처리
- [ ] `StabilitySystem.ts`: `isActiveStabilizer`, `stabilityAt`, `chebyshevDistance`
- [ ] `ExtractorSystem.ts`: `cycleExtractorColor`, `extractorOutputTarget`, `extractorHasInputOfColor`
- [ ] `StatsCalculator.ts`: 다중 패스 계산 (blue → stabilizer → hub → green → extractor → circuit)
- [ ] `Components.ts`: `createComponentFromGridCoord`에 `color` 매개변수 추가
- [ ] 기존 테스트 통과

### Phase 4: Battle (1h)
- [ ] `BattleEngine.ts`: `globalDamage` inline 처리 추가
- [ ] `DamageResolver.ts`: `globalDamage` 지원
- [ ] `CastingSystem.ts`: `globalDamage` 기본값 처리
- [ ] 기존 테스트 통과

### Phase 5: UI (3h)
- [ ] `Store.svelte.ts`: `extractorColor` 상태 추가
- [ ] `game.ts`: 추출기 색상 순환 메서드 추가
- [ ] `DesignerPanel.svelte`: 추출기 색상 순환 UX, 스탯 패널 확장
- [ ] `PlacementGhost.svelte`: 추출기 색상 전달
- [ ] CSS: v2 부품 스타일 추가
- [ ] `npm run check` 통과

### Phase 6: i18n (30min)
- [ ] `ko.ts`: 9개 부품명 + v2 용어 추가
- [ ] `en.ts`: 9개 부품명 번역 + v2 용어 추가

### Phase 7: Testing (4h)
- [ ] `PROTOTYPE_UNLOCK_ALL_TOOLS = true` 설정
- [ ] `ExtractorSystem.test.ts`
- [ ] `StabilitySystem.test.ts`
- [ ] `ColorWireNetwork.test.ts`
- [ ] `GreenStatsCalculator.test.ts`
- [ ] `BattleEngine.test.ts`에 globalDamage 시나리오 추가
- [ ] 레거시 저장 데이터 호환 테스트
- [ ] 모든 테스트 통과 후 `PROTOTYPE_UNLOCK_ALL_TOOLS = false` 전환

---

## Estimated Total

**16.5시간**
- Phase 1: 0.5h
- Phase 2: 2h
- Phase 3: 5h
- Phase 4: 1h
- Phase 5: 3h
- Phase 6: 0.5h
- Phase 7: 4h

## Priority
1. P0: Phase 1 + 2 (타입/컴포넌트 없으면 진행 불가)
2. P0: Phase 3 WireNetwork + Stability + Extractor (가장 복잡)
3. P1: Phase 4 + 5
4. P2: Phase 6 + 7
