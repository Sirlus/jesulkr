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

## Phase 3: State Reactive

### 3-1. Svelte 룬 상태
- [ ] `src/lib/stores/gameState.svelte.ts` 생성
- [ ] `DesignerState` 클래스 ($state)
- [ ] `BattleState` 클래스 ($state)
- [ ] `gameState` 객체 ($state, $derived)

### 3-2. GameManager 리팩터링
- [ ] `src/lib/stores/gameActions.ts` 생성 (순수 액션)
- [ ] 기존 `GameManager` 상태 → `gameState` 이전
- [ ] `legacyBridge.ts` 임시 동기화

### 3-3. Side-effect 자동화
- [ ] `$effect`로 body class 토글
- [ ] `$effect`로 Canvas 루프 제어
- [ ] `onStateChange()` 제거
- [ ] `refreshAll()` 제거

### 3-4. Canvas 루프 분리
- [ ] `src/lib/game/battle/GameLoop.ts` 생성
- [ ] `startLoop()` / `stopLoop()`
- [ ] `+page.svelte`에서 루프 연결

### 3-5. 검증
- [ ] 상태 변경 시 UI 자동 갱신
- [ ] Canvas 렌더링 정상
- [ ] 메모리 누수 없음 (루프 정지 확인)
- [ ] `npm run check` 통과
- [ ] `npm run test` 통과

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
