# Phase 3.5 중간 점검 보고서

> 작성일: 2026-06-10
> 범위: Phase 0 ~ Phase 3.5 완료 시점
> 브랜치: `refactor/phase-3.5-v1.5`

---

## 1. 전체 완료 요약

| Phase | 목표 | 상태 | 핵심 산출물 |
|-------|------|------|------------|
| 0 | 선행조건 | ✅ | `refactor/base`, `reference-v1.3.html`, `daily-log.md` |
| 1 | Foundation | ✅ | `svelte.config.js`, 9개 GameManager 메서드, 게임 루프 복원 |
| 2 | Core Logic | ✅ | 원작 정합성 복원 (몬스터 속도, 별 조건, 토스트 등) |
| 3 | Reactive State | ✅ | DOM 중앙화 브릿지 (`syncFull`/`syncPartial`), EventBus 제거 |
| 3.5 | v1.5 Migration | ✅ | 도구 해금, 덱 관리, 튜토리얼 저장, 모바일 감지, 치트 코드 |

**검증 결과**:
- `npm run check` → **0 errors**
- `npm run test` → **56 tests 통과** (5 files)
- `npm run build` → **성공**

---

## 2. 파일 구조 현황

```
src/lib/stores/
├── game.ts                        # 443줄 — GameManager (파사드 + 일부 로직)
├── game.svelte.ts                 #  77줄 — DOM 중앙화 브릿지 (syncFull/syncPartial)
├── GameLoop.ts                    #  77줄 — requestAnimationFrame 루프
├── DesignerRenderer.ts            #  71줄 — 설계판 DOM 렌더링 + eraseComponent
├── SpellManager.ts                #  60줄 — 술식 저장/불러오기/초기화
└── __tests__/
    └── GameManager.test.ts        # 18+ 케이스

src/lib/game/
├── battle/
│   ├── BattleEngine.ts            # 178줄 — Tick 기반 전투 엔진
│   ├── BattleRenderer.ts          # Canvas 2D 렌더링
│   ├── CastingSystem.ts
│   ├── DamageResolver.ts
│   └── TargetingSystem.ts
├── core/
│   ├── Store.ts                   # 162줄 — 상태 컨테이너
│   ├── Storage.ts                 # 저장/불러오기 통합 export
│   ├── StorageBase.ts
│   ├── StorageSlots.ts
│   ├── StorageDecks.ts
│   ├── StorageRecords.ts
│   ├── StorageUnlocks.ts
│   ├── StorageKeys.ts
│   └── StorageMisc.ts             # 튜토리얼 상태 저장 추가
├── designer/
│   ├── StatsCalculator.ts         # 술식 통계 계산
│   ├── Components.ts              #  59줄 — 부품 배치/충돌
│   └── WireNetwork.ts             # 도선 네트워크 BFS
├── i18n/
│   ├── index.ts
│   ├── ko.ts                      # ⚠️ 중복 키 존재 (Phase 6 예정)
│   └── en.ts                      # ⚠️ 중복 키 존재
├── ui/
│   ├── HUD.ts                     #  29줄 — getElementById 직접 조작
│   ├── SlotPanel.ts               #  91줄 — createElement/innerHTML
│   └── Toast.ts                   #  17줄 — 단일 전역 타이머
└── utils/
    ├── helpers.ts
    ├── progression.ts             # getTotalStars + 도구 해금 로직
    └── mobile.ts                  # 신규 — 모바일 감지 유틸

src/routes/
└── +page.svelte                   # 195줄 — monolith, addEventListener 직접 바인딩
```

---

## 3. 변경사항 상세 (Phase 3 ~ 3.5)

### 3-1. DOM 중앙화 브릿지 (Phase 3 핵심)

| 항목 | 변경 전 | 변경 후 |
|------|--------|--------|
| 상태 갱신 | `EventBus.emit()` + 수동 `refreshAll()` | `gameRx.syncFull()` / `syncPartial()` |
| Store 구조 | GameManager 내 Store 이중화 가능성 | `gameRx`가 `game.store` 직접 참조 |
| 이벤트 버스 | `EventBus.ts` 존재 | **파일 삭제**, `Store.emit()` 제거 |

**아키텍처**:
```
GameManager.method() → gameRx.syncFull(gm) → DOM 전체 재구축
GameLoop.tick()      → gameRx.syncPartial(gm) → HUD 텍스트 + 쿨타임만 갱신
```

### 3-2. v1.5 기능 통합 (Phase 3.5)

| # | 기능 | 구현 위치 | 검증 |
|---|------|----------|------|
| 1 | 마나 복원 복원 ON/OFF | `game.ts` `toggleManaBonus()` | ✅ 토글 + 저장 |
| 2 | 도구 해금 로직 | `progression.ts` 3종 함수 | ✅ 잠긴 도구 폰백 |
| 3 | 런 모드 저장/불러오기 | 기존 `StorageMisc.ts` | ✅ 새로고침 유지 |
| 4 | 튜토리얼 상태 저장 | `StorageMisc.ts` + `Store.ts` | ✅ 저장/복원 |
| 5 | 모바일 감지 유틸 | `mobile.ts` 신규 | ✅ body 클래스 토글 |
| 6 | 설계 미리보기 좌표 | `game.ts` | ✅ 상태 저장 |
| 7 | 맵 잠금 해제 코드 | `game.ts` `tryUnlockAllMaps('1111')` | ✅ 해금 + 별 9개 |
| 8 | 덱 관리 메서드 | `saveDeck`/`loadDeck`/`renameDeck` | ✅ localStorage 유지 |

---

## 4. 코드 품질 평가

### 4-1. 양호한 부분 ✅

| 영역 | 평가 |
|------|------|
| 빌드/타입 | `svelte-check` 0 errors, 빌드 성공 |
| 테스트 | 56개 케이스 통과, 회귀 방지 |
| 모듈 분리 | GameLoop, DesignerRenderer, SpellManager가 GameManager에서 분리됨 |
| 저장 계층 | 7개 Storage 모듈로 체계적 분리, 마이그레이션 로직 완비 |
| 게임 로직 | `StatsCalculator`, `WireNetwork`, `BattleEngine` 알고리즘 정확 |

### 4-2. Phase 4 Pre-Refactoring 완료 (2026-06-10) ✅

| 상태 | 문제 | 조치 내용 |
|------|------|----------|
| ✅ 완료 | `updateBattleTick` 14개 positional param | `BattleTickState` 객체화 + 변수명 개선 (`ka`→`killedAny`, `nba`→`nextBossAtAcc` 등) |
| ✅ 완료 | GameLoop 중복 시작 | `cancelAnimationFrame` 방어 로직 추가 |
| ✅ 완료 | `gm: any` 타입 | `game.svelte.ts` → `GameManager` 타입 import |
| ✅ 완료 | 인라인 `import('../types')` | `Store.ts`, `BattleEngine.ts` → 정식 import로 이동 |
| ✅ 완료 | 하드코딩 문자열 | 16개 i18n 키 추가 (`ko.ts`, `en.ts`), `game.ts`/`SpellManager.ts`의 모든 하드코딩 → `t()` |
| ✅ 완료 | 매직 넘버 상수화 | `MAX_SPELL_NAME_LENGTH`, `TOAST_DURATION_MS`, `UNLOCK_ALL_MAPS_CODE`, `SPAWN_TIMER_BATTLE_START`, `SPAWN_TIMER_DEFAULT` |
| ✅ 완료 | `spawnOneMonster` 부수효과 | 배열 mutate → 순수 함수로 리팩터링 |
| ✅ 완료 | `SpellManager.ts` 타입 | `SpellData` 타입 단언 추가 |
| 🔴 남음 | GameManager God Object (443줄) | Phase 4에서 컴포넌트 분리와 함께 해소 |
| 🔴 남음 | DOM 직접 조작 (innerHTML, getElementById) | Phase 4에서 Svelte 선언적 템플릿으로 전면 교체 |
| 🟡 남음 | 이벤트 리스너 누적 (SlotPanel.ts) | Phase 4에서 Svelte 컴포넌트 전환 시 자동 해결 |

### 4-3. 구조적 부채 (Phase 4 해결 대상)

```
+page.svelte (195줄 monolith)
  ├── 언어 모달 마크업
  ├── 메인 메뉴 마크업
  ├── HUD 마크업 (getElementById 대상)
  ├── 전투 캔버스 + 버튼
  ├── 슬롯 패널 (getElementById 대상)
  ├── 설계 패널 (getElementById 대상)
  └── 토스트 div
```

**모든 하위 UI가 `id` 기반으로 GameManager/gameRx와 연결**되어 있어, Phase 4에서 Svelte 컴포넌트로 분리할 때 `id` 기반 DOM 조작을 전부 제거해야 합니다.

---

## 5. 알려진 버그/이슈

### 5-1. 저장 시 잠긴 도구 미검증
- `progression.ts`의 `getLockedToolNamesFromComponents`는 구현됨
- 그러나 `SpellManager.ts`의 `saveSpell()`에서 이를 호출하지 않음
- **결과**: 해금되지 않은 부품이 포함된 술식도 저장 가능
- **조치**: Phase 4에서 `saveSpell` 로직을 GameManager → 컴포넌트 액션으로 이관할 때 함께 처리

### 5-2. i18n 중복 키
- `ko.ts`: `'scatter'` 2회
- `en.ts`: `'scatter'` 2회, `'pause'` 2회
- `svelte-check` 경고 원인 (0 errors지만 warnings 존재)
- **조치**: Phase 6에서 정리

### 5-3. `DamageResolver.ts` / `BattleEngine.ts` 타입 불일치
- `Monster | null` vs `Monster | undefined`
- 현재는 런타임에 영향 없으나 타입 엄격성 저하
- **조치**: Phase 4 전 타입 통일

---

## 6. 성능 현황

| 항목 | 상태 | 비고 |
|------|------|------|
| Canvas 렌더링 | 양호 | 매 프레임 전체 재렌더링 (Phase 6에서 offscreen 캐싱 예정) |
| DOM 갱신 | 개선됨 | Phase 3 이전 대비 `syncPartial`로 경량화 |
| 슬롯 패널 | 주의 | `renderSlots` 호출 시 DOM 전체 재생성 + 이벤트 리스너 재등록 |
| 설계판 | 주의 | `renderDesigner` 호출 시 `innerHTML=""` 후 전체 재생성 |
| 메모리 | 양호 | 누수 리포트 없음 (단, 이벤트 리스너 누적은 지속 감시 필요) |

---

## 7. 테스트 커버리지

| 모듈 | 테스트 수 | 커버 항목 |
|------|----------|-----------|
| GameManager.test.ts | 18+ | erase, save/load, render, clear, record, trim, checkUnlocks, clearAllData |
| Components.test.ts | 15 | dimensions, overlap, placement, at, remove |
| StatsCalculator.test.ts | 8 | empty, red+circle, no-red, no-circuit, oval, kernel, mixed2 |
| WireNetwork.test.ts | 6 | connection graph, BFS |
| TargetingSystem.test.ts | 9 | target priority, click selection |

**누락된 테스트** (Phase 6 목표):
- `BattleEngine.test.ts` (전투 시뮬레이션)
- `BattleRenderer.test.ts` (Canvas API mocking)
- `Storage*.test.ts` (localStorage mocking)
- `SlotPanel.ts` / `HUD.ts` (DOM 조작 로직)

---

## 8. Phase 4 진행 전 권장 사항 — 실행 결과 (2026-06-10)

| # | 항목 | 상태 | 변경 요약 |
|---|------|------|----------|
| 1 | P0: `updateBattleTick` 파라미터 객체화 | ✅ 완료 | `BattleTickState` 인터페이스, 변수명 개선 (`ka`→`killedAny`, `nba`→`nextBossAtAcc` 등), `GameLoop.ts` 호출부 단순화 |
| 2 | P0: GameLoop 중복 시작 방지 | ✅ 완료 | `startLoop()` 진입 시 `cancelAnimationFrame(animId)` + `lastTime`/`accumulator` 초기화 |
| 3 | P1: `any` 타입 제거 | ✅ 완료 | `game.svelte.ts`의 `gm: any` → `gm: GameManager` |
| 4 | P1: 인라인 import 제거 | ✅ 완료 | `Store.ts`: `Component`, `KeyTarget` 정식 import. `BattleEngine.ts`: `Records` 정식 import |
| 5 | P1: 하드코딩 문자열 i18n 처리 | ✅ 완료 | 16개 신규 i18n 키 추가, `game.ts`/`SpellManager.ts` 모든 하드코딩 문자열 → `t()` |
| 6 | P1: 매직 넘버 상수화 | ✅ 완료 | `MAX_SPELL_NAME_LENGTH`, `TOAST_DURATION_MS`, `UNLOCK_ALL_MAPS_CODE`, `SPAWN_TIMER_BATTLE_START`, `SPAWN_TIMER_DEFAULT` |
| 7 | P2: 이벤트 리스너 누수 방지 | ⏭️ Phase 4 | Svelte 컴포넌트 전환 시 자동 해결 예정 |

**추가 완료 항목**:
- P2: `spawnOneMonster` 부수효과 제거 — 배열 mutate 대신 `Monster` 반환 후 `push()`.
- P1: `SpellManager.ts` `SpellData` 타입 단언 — 타입 안정성 향상.

---

## 9. 다음 단계

- **Phase 4**: UI Components — 페이지 monolith → Svelte 컴포넌트 분리
  - `Toast.svelte`, `SlotPanel.svelte`, `DesignerPanel.svelte`, `HUD.svelte`
  - `BattleCanvas.svelte`, `LanguageModal.svelte`, `MainMenu.svelte`
  - `+page.svelte` 195줄 → 50줄 이하로 축소
  - `$state`/`$derived`/`$effect` 도입 (진정한 반응형)
- **Phase 5**: Features — 맵 모달, 덱 UI, 키 설정 모달 등
- **Phase 6**: Quality — 테스트 보강, 접근성, 성능, ESLint

---

> **종합 평가**: Phase 3.5까지 게임의 핵심 루프와 v1.5 로직이 모두 복원되었습니다. 빌드와 테스트가 깨끗하게 통과하는 안정적인 기반 위에, 이제 Svelte의 선언적 패턴으로 UI를 전환할 준비가 되었습니다. Phase 4 이전에 P0/P1 정리 작업을 먼저 수행하면 컴포넌트 분리 작업이 훨씬 수월해집니다.