# 리팩터링 전체 체크리스트

> **사용법**: 매일 아침 확인. 완료 항목은 `[x]`로 표시.  
> **브랜치 규칙**: 각 Phase는 `refactor/phase-N-xxx` 브랜치에서 작업 → PR → squash merge

---

## Phase 0: 선행조건

- [ ] `refactor/base` 브랜치 생성 및 푸시
- [ ] 원작 HTML v1.3을 `reference-v1.3.html`로 복사 (`.gitignore` 추가)
- [ ] 현재 빌드/테스트 상태 기록
- [ ] `daily-log.md` 생성

---

## Phase 1: Foundation

### 1-1. SvelteKit 설정 수리
- [ ] `svelte.config.js` 생성
- [ ] `vite.config.ts`에서 `adapter`/`paths` 제거
- [ ] `npm run build` 성공

### 1-2. 패키지 매니저 정리
- [ ] `package-lock.json` 제거 (bun.lock 단독 사용 시)
- [ ] `sass-embedded` 제거 (불필요 시)
- [ ] `npm install` 실행

### 1-3. GameManager 메서드 구현 (9개)
- [ ] `eraseComponent(e)`
- [ ] `saveSpell(name, slotIndex)`
- [ ] `loadSpell(slotIndex)`
- [ ] `renderDesigner()`
- [ ] `clearDesign()`
- [ ] `recordRun()`
- [ ] `trimComponents()`
- [ ] `spellStats()`
- [ ] `startLoop()`

### 1-4. 헬퍼 메서드
- [ ] `getBoardLocalFromPointer(e)`
- [ ] `getNearestCellFromPointer(e)`
- [ ] `componentAtPointer(e)`
- [ ] `removeComponentAt(x, y)`

### 1-4. 타입/빌드 오류 해소
- [ ] `DamageResolver.ts` / `BattleEngine.ts` `getAutoTarget` 반환 타입 통일
- [ ] `Store.ts` `BattleState` import 충돌 해소
- [ ] `ko.ts` / `en.ts` 중복 키 제거
- [ ] `toggleDesigner()` 불필요한 타입 비교 정리

### 1-5. 기타 수정
- [ ] `updateStatsDisplay` 7개 카드로 확장
- [ ] `castSlot` 에러 메시지 교정 (`battle.only`)
- [ ] `initClient` 이중 호출 제거
- [ ] i18n 신규 키 추가 (`battle.only`, `trimmed.outside`, `dpm`, `dpt`)

### 1-6. 검증
- [ ] 설계 화면 열기/닫기
- [ ] 부품 배치 (좌클릭)
- [ ] 부품 삭제 (우클릭)
- [ ] 슬롯 저장
- [ ] 슬롯 불러오기
- [ ] 전투 시작 → 진행 → 게임 오버
- [ ] 게임 오버 후 기록 저장 확인
- [ ] `npm run check` 오류 0
- [ ] `npm run test` 전체 통과

---

## Phase 2: Core Logic

### 2-1. 게임 밸런스 복원
- [ ] 몬스터 속도 증가 `survival * 0.45` 복원
- [ ] `spawnOneMonster`에 `survival` 파라미터 추가

### 2-2. 데이터 정합성
- [ ] 맵 2 별 조건 `[55000, 65000, 75000]` 확인
- [ ] `MAPS[2].desc` 텍스트를 별 조건과 동기화 (55,000 / 65,000 / 75,000점)
- [ ] `README.md`, `GAME_DESIGN.md`, `CONSISTENCY_REPORT.md` 동기화

### 2-3. 상태 로직 개선
- [ ] `getTotalStars`에 `includeCurrentRun` 파라미터 추가
- [ ] `Store.ts`에 `totalStarsWithoutCurrent` getter 추가
- [ ] `effectiveManaRegen` 일관성 확인

### 2-4. 토스트 메시지
- [ ] 보스 등장 토스트 (`boss.appeared`)
- [ ] 마나 재생 복원 토스트 (`mana.bonus.activated`)
- [ ] `checkUnlocks`에 마나 복원 토스트 로직 추가

### 2-5. 기타
- [ ] `castSlot` 상황별 에러 메시지 (`cooldown.active`)
- [ ] `spawnTimer` 초기값 `10` 통일
- [ ] `clearAllStorage` 구현
- [ ] i18n 키 추가 (`boss.appeared`, `mana.bonus.activated`, `star.earned`, `cooldown.active`)

### 2-6. 검증
- [ ] 몬스터 속도 30초 후 증가 확인
- [ ] 맵 2 별 3단계 75,000점
- [ ] 보스 등장 시 토스트
- [ ] 별 5개 달성 시 마나 토스트
- [ ] `getTotalStars`가 현재 전투 상태를 올바르게 제외/포함
- [ ] 저장 데이터 전체 삭제 후 복원
- [ ] `npm run check` 오류 0
- [ ] `npm run test` 전체 통과

---

## Phase 3: State Reactive ✅ (DOM 중앙화 브릿지)

> **실제 구현**: vitest와 Svelte 5 룬 공존 불가로, $state/$derived/$effect 대신 syncFull/syncPartial 기반 DOM 중앙화.
> 진정한 반응형 전환은 Phase 4에서 Svelte 컴포넌트 템플릿으로 달성.

### 3-1. Store 통합
- [x] `src/lib/stores/game.svelte.ts` 생성 (DOM 중앙화 브릿지)
- [x] `gameRx`가 `game.store` 직접 참조 (Store 이중화 해소)
- [x] `syncFull(gm)` — 상태 전환 시 전체 DOM 갱신
- [x] `syncPartial(gm)` — 매 프레임 HUD + 쿨타임만 경량 갱신
- [x] `EventBus.ts` 삭제, `Store.emit()` 제거

### 3-2. 수동 refresh 제거
- [x] `game.ts` — onStateChange/setLanguage/clearAllData/placeComponent/setTool/rotateTool/setFrame에서 refreshAll 제거, syncFull로 대체
- [x] `SpellManager.ts` — saveSpell/loadSpell/clearDesign에서 refresh 대신 syncFull
- [x] `GameLoop.ts` — refreshHUD/refreshCooldowns → syncPartial
- [x] `DesignerRenderer.ts` — eraseComponent에서 renderDesigner() 대신 syncFull
- [x] `+page.svelte` — 툴바 버튼에서 game.renderDesigner() 직접 호출 제거

### 3-3. Svelte 5 룬
- [⏳→P4] `$state` — Phase 4 Svelte 컴포넌트에서 도입
- [⏳→P4] `$derived` — Phase 4 Svelte 컴포넌트에서 도입
- [⏳→P4] `$effect` — Phase 4 Svelte 컴포넌트에서 도입
- [x] `+page.svelte` langLoaded → `$state` (dead `$derived` 제거)

### 3-4. 검증
- [x] build ✅
- [x] svelte-check 0 errors ✅
- [x] 56 tests (5 files) 모두 통과 ✅
- [x] 메모리 누수 없음 (syncPartial은 텍스트+width만 갱신)

---

## Phase 3.5: v1.5 상태·게임로직 마이그레이션 ✅

### 3.5-1. 마나 복원 복원 ON/OFF 토글 ✅
- [x] `Storage.ts` — `loadManaBonusEnabled` / `saveManaBonusEnabled` 동작 확인
- [x] `game.ts` — `toggleManaBonus()` 메서드 추가
- [x] `game.svelte.ts` — `syncFull`에 마나 복원 복원 상태 표시 (HUD에 effectiveManaRegen 반영됨)
- [x] `get effectiveManaRegen`이 토글 상태 반영 확인

### 3.5-2. 도구 해금 로직 ✅
- [x] `progression.ts` — `requiredMapForTool(tool)` 추가
- [x] `progression.ts` — `isToolUnlocked(tool, unlocks, records)` 추가
- [x] `progression.ts` — `getLockedToolNamesFromComponents(components, unlocks, records)` 추가
- [x] `game.ts` — `setTool()`에서 잠긴 도구 선택 시 첫 해금 도구로 폰백
- [⏳→P4] `game.ts` — `saveSpell()`에서 잠긴 도구 포함 시 저장 차단 (SpellManager 연동 필요)

### 3.5-3. 런 모드 저장/불러오기 ✅
- [x] Storage.saveSelectedRunMode/loadSelectedRunMode 확인
- [x] Store.loadFromStorage()에서 호출 확인
- [x] 런 모드 변경 후 새로고침 시 유지 확인

### 3.5-4. 튜토리얼 상태 저장/불러오기 ✅
- [x] constants.ts — STORAGE_KEY_TUTORIAL_SEEN 추가
- [x] StorageMisc.ts — loadTutorialSeen() / saveTutorialSeen() 추가
- [x] Store.ts — tutorialSeen 필드 추가, loadFromStorage() 통합

### 3.5-5. 모바일 감지 유틸 ✅
- [x] mobile.ts — isMobileLayout() / shouldUseMobileLayout() / updateMobileLayout() 신규
- [x] +page.svelte — onMount에서 updateMobileLayout() 호출

### 3.5-6. 설계 미리보기 좌표 ✅
- [x] game.ts — setDesignerPreview(x, y) / clearDesignerPreview() 추가
- [⏳→P4] game.svelte.ts — syncFull에서 미리보기 좌표 반영 (PlacementGhost.svelte)

### 3.5-7. 맵 잠금 해제 코드 ✅
- [x] game.ts — tryUnlockAllMaps(code) 추가
- [x] 올바른 코드(1111) 입력 시 모든 맵 + 별 9개 해금
- [x] 잘못된 코드 입력 시 토스트

### 3.5-8. 덱 관리 기반 메서드 ✅
- [x] game.ts — saveDeck(index) / loadDeck(index) / renameDeck(index, name) 추가
- [x] Storage.ts — 덱/덱이름 저장 함수 확인 (StorageDecks.ts 기존 구현)
- [x] 덱 저장/불러오기/이름 변경이 localStorage에 유지 확인

### 3.5-9. 검증 ✅
- [x] npm run test → 56 tests 통과
- [x] npm run build → 빌드 통과
- [x] npm run check → 신규 오류 0개

---

## Phase 4: UI Components

### 4-1. Leaf 컴포넌트
- [ ] `Toast.svelte` (role="status", aria-live)
- [ ] `KeyBadge.svelte`
- [ ] `SpeedButton.svelte`
- [ ] `StatCard.svelte`

### 4-2. 복합 컴포넌트
- [ ] `SlotCard.svelte`
- [ ] `SlotPanel.svelte`
- [ ] `DesignerPanel.svelte`
- [ ] `BattleCanvas.svelte`
- [ ] `BattleSection.svelte`
- [ ] `HUD.svelte`
- [ ] `LanguageModal.svelte`
- [ ] `MainMenu.svelte`

### 4-3. 선언적 전환
- [ ] `designBoard` innerHTML → `{#each}`
- [ ] `spellStats` innerHTML → `{#each}`
- [ ] `renderSlots` innerHTML → `{#each}`
- [ ] `updateHUD` textContent → `{gameState.battle.score}`

### 4-4. 이벤트 정리
- [ ] `document.addEventListener('keydown')` → `<svelte:window onkeydown>`
- [ ] `addEventListener('click')` → `onclick` 디렉티브
- [ ] `classList.toggle` → `class:` 디렉티브

### 4-5. `+page.svelte` 정리
- [ ] 176줄 → 50줄 이하
- [ ] 모든 마크업 컴포넌트로 분리

### 4-6. 검증
- [ ] `document.getElementById` 직접 조작 0개 (Canvas 제외)
- [ ] `innerHTML` 0개 (Canvas 제외)
- [ ] `classList.toggle` 0개
- [ ] 모든 UI 정상 동작
- [ ] `npm run check` 통과
- [ ] `npm run test` 통과

---

## Phase 5: Features

### 5-1. 맵 선택 모달
- [ ] `MapSelectModal.svelte`
- [ ] 3개 맵 카드 (해금/잠김/선택)
- [ ] 별 조건/기록 표시
- [ ] 기록 모드 선택 (assist/pure)
- [ ] 테스트 해금 (1111)
- [ ] 전투 시작 버튼

### 5-2. 덱 관리
- [ ] `DeckControls.svelte`
- [ ] 10개 덱 선택
- [ ] 덱 이름 편집/저장
- [ ] 슬롯 → 덱 저장
- [ ] 덱 → 슬롯 불러오기

### 5-3. 키 설정 모달
- [ ] `KeySettingsModal.svelte`
- [ ] 5개 슬롯 키 표시
- [ ] 8개 조작 키 표시
- [ ] 키 캡처 (Esc 취소)
- [ ] 중복 검사
- [ ] 기본값 초기화

### 5-4. 기타 기능
- [ ] 자동 마나 보존 입력 연결
- [ ] 설계 배치 미리보기 (`PlacementGhost.svelte`)
- [ ] 모바일 감지/클스 토글
- [ ] 터치 이벤트 지원
- [ ] 디자이너 보드 스케일링
- [ ] 드래그 연속 배치
- [ ] 도구 해금 잠금 UI
- [ ] 술식 필요 맵 체크
- [ ] 설계판 휠 회전

### 5-5. 검증
- [ ] 맵 모달 전체 흐름
- [ ] 덱 저장/불러오기/이름 변경
- [ ] 키 설정 캡처/저장/초기화
- [ ] 모바일 터치 배치
- [ ] 드래그 연속 배치
- [ ] `npm run check` 통과
- [ ] `npm run test` 통과

---

## Phase 6: Quality

### 6-1. 테스트
- [ ] `BattleEngine.test.ts` (생존, 마나, 쿨타임, 스폰, 보스, 게임오버)
- [ ] `StorageSlots.test.ts` (normalizeSpell, load/save)
- [ ] `StorageRecords.test.ts` (마이그레이션, 별 계산)
- [ ] `gameActions.test.ts` (save/load, clear, trim, cast)
- [ ] 테스트 커버리지 ≥ 80% (BattleEngine, Storage)

### 6-2. 접근성
- [ ] 토스트 `role="status"`, `aria-live="polite"`
- [ ] 언어 모달 초점 트랩
- [ ] 이모지 버튼 `aria-label`
- [ ] 색상 대비 WCAG AA 검증
- [ ] 키보드 네비게이션 (Tab, Escape)

### 6-3. 성능
- [ ] Canvas offscreen 캐싱 (정적 레이어)
- [ ] `structuredClone` 사용 (fallback JSON)
- [ ] localStorage debounce (50ms)
- [ ] `devicePixelRatio` 대응

### 6-4. 문서화
- [ ] JSDoc: `calculateSpellStats`, `updateBattleTick`, `GameActions`
- [ ] `CHANGELOG.md` 작성 (v1.3.0)
- [ ] `README.md` 업데이트 (컴포넌트 구조, 스크립트)

### 6-5. 도구
- [ ] ESLint 설정 (`eslint.config.js`)
- [ ] `npm run lint` 통과 (오류 0, 경고 ≤ 10)
- [ ] CI workflow에 `check`, `test`, `lint` 추가

### 6-7. 아키텍처 개선
- [ ] GameManager 책임 분리 (BattleController, DesignerController, SpellManager, InputController)
- [ ] `updateBattleTick` 파라미터 → `BattleTickState` 객체화
- [ ] `vitest.config.ts` → `globals: true` 제거
- [ ] `package-lock.json` 제거 (bun.lock 만 유지)

### 6-8. 보안
- [ ] `innerHTML` 사용처 `escapeHtml` 적용 검증
- [ ] localStorage XSS 방어 확인

### 6-6. 최종 검증
- [ ] `npm run build` 성공
- [ ] `npm run check` 오류 0
- [ ] `npm run test` 전체 통과
- [ ] `npm run lint` 오류 0
- [ ] axe-core a11y 오류 0
- [ ] 브라우저에서 전체 플레이 가능
- [ ] 모바일에서 설계/전투 동작

---

## 최종 머지 체크리스트

- [ ] `refactor/phase-6-quality` → `main` PR 생성
- [ ] PR 설명에 변경사항 요약
- [ ] CI 통과 (build, check, test, lint)
- [ ] squash merge
- [ ] `refactor/*` 브랜치 정리 (선택)
- [ ] Git tag `v1.3.0` 생성

---

## 일일 진행 상황 기록

```
YYYY-MM-DD
──────────
완료: [ ] [ ] [ ]
진행: [ ] [ ]
차단: 
```

> **팁**: 매일 3개 이상의 체크리스트 항목을 완료하는 것을 목표로 합니다.  
> Phase 1~2는 기능 복원이므로 빠르게, Phase 3~4는 반응형 전환이므로 신중하게 진행합니다.
