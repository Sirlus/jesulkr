# 리팩터링 작업 일지

> 시작일: 2026-06-10

---

## 2026-06-10

### 오늘 목표
- [x] Phase 0 완료 — 선행조건 정리

### 완료한 것
- `+page.svelte` SVG 아이콘 변경사항 커밋
- `reference-v1.3.html` 복사 (178KB)
- `svelte.config.js` 생성 (adapter + paths 이동)
- `vite.config.ts` 정리 (불필요한 adapter/preprocess 제거)
- `bun` 설치 (~/.bun/bin/bun)
- `package-lock.json` 제거 (bun.lock만 유지)
- `bun install` 성공 (8 packages)
- `bun run build` 성공
- `bun run test` 성공 (4 files, 38 tests)
- `bun run check` — 29 errors / 4 warnings (예상된 상태, Phase 1에서 해결)

### 막힌 것 / 의사결정
- `bun`이 설치되어 있지 않았음. `curl -fsSL https://bun.sh/install | bash`로 설치 완료.
- `vite.config.ts`에 잘못 위치한 `adapter`/`paths`를 `svelte.config.js`로 이동.

### 내일 계획
- Phase 1 시작: GameManager 7개 미구현 메서드 구현

---

## 2026-06-10 (Phase 1)

### 오늘 목표
- [x] Phase 1 완료 — Foundation: 빌드 고치고, 9개 메서드 구현해서 게임 루프 복원

### 완료한 것
- ✅ `spellStats()` — 현재 설계 통계를 `calculateSpellStats`로 반환
- ✅ `eraseComponent(e: MouseEvent)` — 우클릭/지우개로 설계판 부품 삭제
- ✅ `renderDesigner()` — 설계판 DOM 렌더링 (그리드 셀 + 부품 조각)
- ✅ `trimComponents()` — 프레임 크기 벗어난 부품 제거
- ✅ `saveSpell(name, slotIndex)` — 현재 설계를 슬롯에 저장 (유효성 검증 포함)
- ✅ `loadSpell(slotIndex)` — 슬롯에서 설계 불러오기 (상태 전환 포함)
- ✅ `clearDesign()` — 설계판 초기화
- ✅ `recordRun()` — 전투 기록 저장 (최고 점수 보존, assist/pure 분리)
- ✅ `startLoop()` — requestAnimationFrame 게임 루프 (tick, render, HUD, gameover)
- ✅ `happy-dom` devDependency 추가 (DOM 테스트 환경)
- ✅ `src/lib/stores/__tests__/GameManager.test.ts` — 15개 단위 테스트
- ✅ `bun run build` 성공
- ✅ `bun run test` — 53 tests (5 files) all pass

### 막힌 것 / 의사결정
- `startLoop()` 내 `t` 매개변수가 i18n `t` 함수를 shadowing — `timestamp`로 rename
- `vitest` `node` 환경에서 localStorage/DOM 미지원 → `happy-dom` 추가 및 `@vitest-environment` directive 사용
- 모듈 수준 `game.initClient()`가 localStorage를 import 시점에 읽어서 실패 → `vi.stubGlobal` + 동적 import로 해결
- `svelte-check`: 기존 7개 오류 유지 (Store.ts BattleState 충돌, i18n 중복 키 등 — Phase 2-6에서 처리 예정)

### 다음 계획
- Phase 2: Core Logic — 몬스터 속도, 별 조건 등 원작 정합성 복원

### 추가: Phase 2 진행
- 2-1 ✅ 몬스터 속도 survival 연동 (`42 + survival * 0.45 + random`)
- 2-2 ✅ 맵 2 별 임계값 확인 (이미 정확: 55000/65000/75000)
- 2-3 ✅ `getTotalStars`에 `includeCurrentRun` 파라미터 추가
- 2-4 ✅ `effectiveManaRegen` 일관성 확인
- 2-5 ✅ 보스 등장 토스트 (`boss.appeared`)
- 2-6 ✅ 마나 재생 복원 토스트 (`mana.bonus.activated`, `star.earned`)
- 2-7 ✅ `castSlot` 순서 유지 (state → spell → cooldown → mana → target)
- 2-8 ✅ `spawnTimer` 초기값 10 확인
- 2-11 ✅ `clearAllData()` + `Storage.clearAllStorage()` 구현
- ✅ `bun run build` 통과, `bun run test` 53 tests 통과
- ✅ i18n 키 추가 (ko + en): `boss.appeared`, `mana.bonus.activated`, `star.earned`

### 다음 계획
- Phase 3: State Reactive — Svelte 룬 도입, GameManager-Store 관계 재설계

### Phase 3: Reactive State — DOM 중앙화 브릿지 (완료)

> **판정**: Svelte 5 룬($state/$derived/$effect)은 vitest happy-dom 환경과 공존 불가.
> Phase 4에서 Svelte 컴포넌트로 진정한 반응형 전환 예정.
> 현재 상태는 **Phase 3↔4 중간 브릿지: DOM 갱신 중앙화**.

- ✅ Store 통합 — `game.svelte.ts`가 `game.store`를 직접 참조 (Store 이중화 해소)
- ✅ DOM 갱신 중앙화 — `syncFull()` / `syncPartial()` 로 분리
  - `syncFull(gm)`: 상태 전환, 슬롯 저장/불러오기, 설계판 변경 시 전체 DOM 재구축
  - `syncPartial(gm)`: 매 프레임 경량 갱신 (HUD 텍스트 + 쿨타임 바 width 만)
- ✅ 성능 최적화 — GameLoop에서 슬롯 DOM 전체 재생성 X (syncPartial 사용)
- ✅ 토스트 통합 — gameRx 자체 토스트 제거, Toast.ts showToast만 사용
- ✅ 설계판 렌더링 통합 — DesignerRenderer도 gameRx.syncFull 통해 렌더링
- ✅ `game.ts` — `onStateChange` / `setLanguage` / `clearAllData` / `placeComponent`에서 명시적 refresh 제거
- ✅ `SpellManager.ts` — `saveSpell` / `loadSpell` / `clearDesign`에서 refresh 대신 gameRx.syncFull 호출
- ✅ `GameLoop.ts` — `refreshHUD()` / `refreshCooldowns()` 제거, gameRx.syncPartial로 대체
- ✅ `EventBus.ts` 삭제, `Store.emit()` 제거
- ✅ `+page.svelte` — gameRx import 제거, langLoaded는 $state 유지
- ✅ **검증**: build ✅, 56 tests ✅, svelte-check 0 errors

### Phase 3 완료 기준 달성 현황
- [x] Store 이중화 해소
- [x] DOM 갱신 자동화 (경량/전체 분리)
- [x] EventBus 제거
- [x] refreshAll/Slots/HUD 대부분 제거
- [x] Phase 1~2 테스트 전부 통과
- [⏳→P4] Svelte 5 반응형 룬 ($state/$derived/$effect) — Phase 4 Svelte 컴포넌트에서 도입

### 다음 계획
- Phase 4: UI Components — 페이지 monolith → Svelte 컴포넌트 분리
  → 이때 $state/$effect로 진정한 반응형 전환

### 추가: 모듈화
- `game.ts` 497줄 → 336줄로 분리
- `GameLoop.ts` (73줄) — `startLoop()` 
- `DesignerRenderer.ts` (70줄) — `renderDesigner()`, `eraseComponent()`
- `SpellManager.ts` (59줄) — `saveSpell()`, `loadSpell()`, `clearDesign()`
- GameManager는 얇은 파사드로 유지, 모든 public API는 `+page.svelte`와 호환
