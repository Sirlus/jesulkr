# v2 Green/Stability Refactoring TODO (업데이트됨)

> 계획서 리뷰 후 보강된 구현 체크리스트

## 현재 상태 (분석 완료)
- Component Types: 9 (`red`, `blueGen`, `wire`, `circle`, `oval`, `kernel`, `mixed2`, `mixedCore`, `eraser`)
- WireNetwork: 단일 그래프 (`buildConnectionGraph`)
- StatsCalculator: red/blue만, `CalcContext`에 green/stability/globalDamage 없음
- ComponentDef: `role`, `size`, `requiredMap`, `order`, `calc` 기반
- DamageResolver: 존재하나 `BattleEngine.ts`에서 직접 데미지 처리 중
- Types: `ExtractorColor`, `ColorConnectionGraph`, `SpellData.globalDamage` 누락

## 목표 상태
- Component Types: 18 (+9개 신규)
- WireNetwork: 색상별 도선망 v3 (`buildColorConnectionGraph` 추가, 기존 함수 유지)
- StatsCalculator: +green, stability, globalDamage, 다중 패스 계산
- BattleEngine: inline globalDamage 처리
- CastingSystem: 레거시 호환 (`globalDamage` 기본값)

---

## 구현 순서 (Phases)

### Phase 1: Types & Constants (30min)
- [x] `types.ts`: `ExtractorColor`, `ColorConnectionGraph`, `SpellData.globalDamage`, `SpellStats` 확장
- [x] `constants.ts`: `PROTOTYPE_UNLOCK_ALL_TOOLS`, `GREEN_MANA`, `STABILITY`, `MEDIUM_HUB`, `MEDIUM_WIRE`, `SMALL_WIRE`, `EXTRACTOR`
- [x] `designer/components/def.ts`: `ComponentRole`에 `'extractor'`, `'stabilizer'` 추가, `CalcContext` 확장, `CalcResult.globalDamage` 추가
- [x] `npm run check` 통과

### Phase 2: Components (2h)
- [x] `designer/components/red3.ts`
- [x] `designer/components/mediumWire.ts`
- [x] `designer/components/mediumHub.ts`
- [x] `designer/components/extractor.ts`
- [x] `designer/components/stabilizer.ts`
- [x] `designer/components/greenMana.ts`
- [x] `designer/components/green3x2.ts` (+ calc)
- [x] `designer/components/greenPair2.ts` (+ calc)
- [x] `designer/components/ultimateCore.ts` (+ calc)
- [x] `designer/components/registry.ts`: 9개 import 및 등록
- [x] `designer/components/red.ts`: `getRedPower` / `getRedCost` 헬퍼 추가
- [x] `npm run check` 통과

### Phase 3: Engine (5h)
- [x] `designer/WireNetwork.ts`: `buildColorConnectionGraph` 추가, 방향성 mediumWire 처리
- [x] `designer/StabilitySystem.ts`: `isActiveStabilizer`, `stabilityAt`, `chebyshevDistance`
- [x] `designer/ExtractorSystem.ts`: `cycleExtractorColor`, `extractorOutputTarget`, `extractorHasInputOfColor`
- [x] `designer/StatsCalculator.ts`: v2 CalcContext 확장 (부분 완료 - 다중 패스 미구현)
- [x] `designer/Components.ts`: `createComponentFromGridCoord`에 `color` 매개변수 추가
- [x] `npm run check` 통과

### Phase 4: Battle (1h)
- [x] `battle/BattleEngine.ts`: `globalDamage` inline 처리 추가
- [x] `battle/CastingSystem.ts`: `globalDamage` 기본값 처리
- [x] `npm run check` 통과

### Phase 5: UI (3h)
- [x] `stores/game.ts`: 추출기 색상 순환 메서드 추가 — [`cycleExtractorColor()`](src/lib/stores/game.ts:75) 위임 구현
- [x] `components/DesignerPanel.svelte`: 추출기 색상 순환 UX, 스탯 패널 확장 — 키보드/클릭 모두 지원, 툴 아이콘·피스에 색상 클래스 적용
- [x] `components/PlacementGhost.svelte`: 추출기 색상 전달 — [`createComponentFromGridCoord()`](src/lib/components/PlacementGhost.svelte:13) 인자로 `extractorColor` 전달
- [x] v2 부품 스타일 — `style.css` 단일 파일 대신 각 컴포넌트 정의 파일의 `style:` 필드로 인라인(예: [`red3.ts`](src/lib/game/designer/components/red3.ts:15), [`extractor.ts`](src/lib/game/designer/components/extractor.ts:15)). 레지스트리가 수집해 한 번에 주입
- [x] `npm run check` 통과 — 0 errors / 0 warnings

### Phase 6: i18n (30min)
- [x] `i18n/ko.ts`: 9개 부품명 + v2 용어 추가
- [x] `i18n/en.ts`: 9개 부품명 번역 + v2 용어 추가
- [x] `npm run check` 통과

### Phase 7: Testing (4h)
- [~] `PROTOTYPE_UNLOCK_ALL_TOOLS = true` 설정 — **불필요**. 해금은 [`isMapUnlocked()`](src/lib/game/core/StorageUnlocks.ts:29) 기반 별 진행도로 동작. 개발자 숏컷은 [`constants.ts:27-28`](src/lib/game/constants.ts:27)에 주석으로만 남음
- [x] `ExtractorSystem.test.ts` — 11 tests ✓
- [x] `StabilitySystem.test.ts` — 11 tests ✓
- [x] `ColorWireNetwork.test.ts` — 17 tests ✓
- [x] `GreenStatsCalculator.test.ts` — 10 tests ✓
- [x] `BattleEngine.test.ts`에 globalDamage 시나리오 추가 — [`globalDamage hits all monsters on cast resolution`](src/lib/game/battle/__tests__/BattleEngine.test.ts:74) ✓
- [x] 레거시 저장 데이터 호환 테스트 — [`migrates legacy "mana" type to "red"`](src/lib/game/core/__tests__/StorageSlots.test.ts:43) ✓ + `CastingSystem.ts:73-78` `globalDamage` 기본값 처리
- [~] `PROTOTYPE_UNLOCK_ALL_TOOLS = false` 전환 — **불필요** (위 사유 동일). 12 파일 / 141 테스트 모두 통과

**전체 테스트 결과**: `npm test` → Test Files 12 passed, Tests 141 passed ✓

---

## 예상 총 소요

**16.5시간**
- Phase 1: 0.5h
- Phase 2: 2h
- Phase 3: 5h
- Phase 4: 1h
- Phase 5: 3h
- Phase 6: 0.5h
- Phase 7: 4h

## 우선순위
1. P0: Phase 1 + 2 (타입/컴포넌트 없으면 진행 불가)
2. P0: Phase 3 WireNetwork + Stability + Extractor (가장 복잡)
3. P1: Phase 4 + 5
4. P2: Phase 6 + 7
