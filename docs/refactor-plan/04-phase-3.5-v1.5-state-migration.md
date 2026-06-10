# Phase 3.5: v1.5 상태·게임로직 마이그레이션

> **목표**: main 브랜치 `Jesulkr_v1.5.html`의 상태 필드, localStorage, 핵심 계산/검증 로직을 Svelte Store/GameManager로 통합  
> **기간**: 1~2일  
> **선행 조건**: Phase 3 완료 (EventBus 제거, DOM 중앙화)  
> **브랜치**: `refactor/phase-3.5-v1.5` (base: `refactor/phase-3-reactive`)

---

## 원칙

- **UI는 Phase 4/5에서 구현**. Phase 3.5는 상태·로직·저장만 다룬다.
- 1.5 버전과 **동일한 localStorage 키**를 사용하여 호환성 유지.
- 기존 테스트 회귀 없음이 최우선.

---

## 1.5 버전 기능 분류

### Phase 3.5 대상 (상태·로직·저장)

| 기능 | 1.5 추가 | 현재 Svelte 상태 | 필요 작업 |
|------|---------|------------------|-----------|
| 마나 복원 복원 ON/OFF 토글 | `manaBonusEnabled` 저장/불러오기, `getEffectiveManaRegen` | `Store.manaBonusEnabled` 존재, 저장 확인 필요 | 저장 로직 검증, 토글 메서드 추가 |
| 도구 해금/잠금 | `requiredMapForTool`, `isToolUnlocked`, `getLockedToolNamesFromComponents` | 미구현 | 유틸 함수 + GameManager 통합 |
| 런 모드 저장/불러오기 | `RUN_MODE_STORAGE_KEY` | `Store.selectedRunMode` 존재, 저장 불확실 | 저장/불러오기 검증 |
| 튜토리얼 상태 저장/불러오기 | `TUTORIAL_SEEN_STORAGE_KEY` | 미구현 | Storage 유틸 + Store 필드 추가 |
| 모바일 레이아웃 감지 | `isMobileLayout`, `shouldUseMobileLayout` | CSS만 존재 | 유틸 함수 신규 |
| 설계 미리보기 좌표 | `designer.previewX/Y` | `DesignerState`에 필드 존재 | GameManager 메서드 추가 |
| 맵 잠금 해제 코드 | `tryUnlockAllMaps` | 미구현 | GameManager 메서드 추가 |
| 덱 저장/불러오기 기반 | `DECK_STORAGE_KEY`, `hasSavedDeck` | `Store.decks/deckNames` 존재, 메서드 없음 | GameManager 메서드 추가 |

### Phase 4 대상 (UI 컴포넌트)

| 기능 | 이유 |
|------|------|
| 튜토리얼 모달 | 마크업 + 단계 관리 UI. Svelte 컴포넌트가 적합 |
| 맵 선택 모달 | `mapModal`, `renderMapCards`. Svelte 컴포넌트가 적합 |
| 덱 관리 UI | `deckControls`, 저장/불러오기/이름 변경 UI |
| 키 설정 모달 | `keySettingsModal`, 키 캡처 UI |
| 마나 복원 복원 토글 UI | `.manaBonusToggle` 버튼 |
| 자동 마나 보존 입력 | `autoReserveControl` |
| 설계 배치 미리보기/고스트 | `placementGhost`, `ghost` DOM 렌더링 |
| SVG 도구 아이콘 | `.toolIconSvg` CSS 대체 |
| 모바일 터치 지원 | `touchToPseudoMouseEvent` 이벤트 핸들링 |

### Phase 5/6 대상 (고급 기능·품질)

| 기능 | 이유 |
|------|------|
| 드래그 연속 배치 | `placingDrag`, `lastDragPlaceKey` |
| 설계판 휠 회전 | `onDesignWheel` |
| Canvas 성능 개선 | offscreen 캐싱, `devicePixelRatio` |
| i18n 중복키 정리 | `ko.ts`, `en.ts` |

---

## 세부 작업

### 3.5-1. 마나 복원 복원 토글 (30분)

**파일**:
- `src/lib/game/core/Storage.ts` — `loadManaBonusEnabled` / `saveManaBonusEnabled` 동작 확인
- `src/lib/game/core/Store.ts` — 이미 필드 존재
- `src/lib/stores/game.ts` — `toggleManaBonus()` 메서드 추가
- `src/lib/stores/game.svelte.ts` — `syncFull`에 마나 복원 복원 상태 표시 추가

**완료 기준**:
- `game.toggleManaBonus()` 호출 시 `Store.manaBonusEnabled` 토글 + localStorage 저장
- `get effectiveManaRegen`이 토글 상태를 반영

---

### 3.5-2. 도구 해금 로직 (1시간)

**파일**:
- `src/lib/game/utils/progression.ts` — 함수 추가:
  - `requiredMapForTool(tool: string): number`
  - `isToolUnlocked(tool: string, unlocks, records): boolean`
  - `getLockedToolNamesFromComponents(components): string[]`
- `src/lib/stores/game.ts` — 통합:
  - `setTool()`에서 잠긴 도구 선택 시 첫 해금 도구로 폰백
  - `saveSpell()`에서 잠긴 도구 포함 시 저장 차단 + 토스트

**완료 기준**:
- 맵 1 미해금 상태에서 맵 2 도구 선택 불가
- 잠긴 도구가 포함된 설계 저장 시 차단

---

### 3.5-3. 런 모드 저장/불러오기 검증 (20분)

**파일**:
- `src/lib/game/core/Storage.ts` — `saveSelectedRunMode` / `loadSelectedRunMode` 확인
- `src/lib/game/core/Store.ts` — `loadFromStorage()`에서 호출 여부 확인

**완료 기준**:
- 런 모드 변경 후 새로고침 시 유지

---

### 3.5-4. 튜토리얼 상태 저장/불러오기 (20분)

**파일**:
- `src/lib/game/core/StorageMisc.ts` 또는 `Storage.ts` — 추가:
  - `TUTORIAL_SEEN_KEY = "jesulkr_tutorial_seen_v2"`
  - `loadTutorialSeen(): boolean`
  - `saveTutorialSeen(seen: boolean)`
- `src/lib/game/core/Store.ts` — `tutorialSeen: boolean` 필드 추가, `loadFromStorage()` 통합

**완료 기준**:
- 튜토리얼 완료 후 새로고침 시 자동 표시 안 함

---

### 3.5-5. 모바일 감지 유틸 (20분)

**파일**:
- `src/lib/game/utils/mobile.ts` — 신규:
  - `isMobileLayout(): boolean` — `window.innerWidth <= 820 || matchMedia('(pointer: coarse)').matches`
  - `shouldUseMobileLayout(): boolean`
- `src/routes/+page.svelte` — `onMount`에서 `body.mobile-layout` 클래스 토글

**완료 기준**:
- 모바일 기기/좁은 화면에서 `body.mobile-layout` 클래스 적용

---

### 3.5-6. 설계 미리보기 좌표 (20분)

**파일**:
- `src/lib/stores/game.ts` — 메서드 추가:
  - `setDesignerPreview(x: number, y: number)`
  - `clearDesignerPreview()`
- `src/lib/stores/game.svelte.ts` — `syncFull`에서 미리보기 좌표 반영 (Phase 4에서 고스트 DOM으로 확장)

**완료 기준**:
- `designer.previewX/Y`가 상태 변경 시 갱신

---

### 3.5-7. 맵 잠금 해제 코드 (20분)

**파일**:
- `src/lib/stores/game.ts` — 메서드 추가:
  - `tryUnlockAllMaps(code: string): boolean`
  - 하드코딩된 코드 검증 (1.5 버전과 동일한 코드 사용)

**완료 기준**:
- 올바른 코드 입력 시 모든 맵 해금
- 잘못된 코드 입력 시 토스트

---

### 3.5-8. 덱 관리 기반 메서드 (30분)

**파일**:
- `src/lib/stores/game.ts` — 메서드 추가:
  - `saveDeck(index: number)` — 현재 설계를 덱에 저장
  - `loadDeck(index: number)` — 덱을 설계판으로 불러오기
  - `renameDeck(index: number, name: string)` — 덱 이름 변경
- `src/lib/game/core/Storage.ts` — `saveDecks` / `loadDecks` / `saveDeckNames` / `loadDeckNames` 이미 존재하는지 확인

**완료 기준**:
- 덱 저장/불러오기/이름 변경이 localStorage에 유지

---

## 검증 체크리스트

- [ ] `bun run test` → 56 tests 통과
- [ ] `bun run build` → 빌드 통과
- [ ] `bun run check` → 신규 오류 0개
- [ ] 마나 복원 복원 토글 후 새로고침 시 상태 유지
- [ ] 잠긴 도구 선택 시 첫 해금 도구로 폰백
- [ ] 잠긴 도구 포함 설계 저장 시 차단
- [ ] 런 모드 변경 후 새로고침 시 유지
- [ ] 튜토리얼 완료 후 새로고침 시 자동 표시 안 함
- [ ] 모바일 감지 시 `body.mobile-layout` 클래스 적용
- [ ] 맵 잠금 해제 코드 정상 동작
- [ ] 덱 저장/불러오기/이름 변경이 localStorage에 유지

---

## 산출물

| 파일 | 설명 |
|------|------|
| `src/lib/game/utils/progression.ts` | `requiredMapForTool`, `isToolUnlocked`, `getLockedToolNamesFromComponents` 추가 |
| `src/lib/game/utils/mobile.ts` | `isMobileLayout`, `shouldUseMobileLayout` 신규 |
| `src/lib/game/core/Storage*.ts` | 튜토리얼 저장/불러오기 추가 |
| `src/lib/game/core/Store.ts` | `tutorialSeen` 필드 추가 |
| `src/lib/stores/game.ts` | `toggleManaBonus`, `tryUnlockAllMaps`, 덱 메서드, 미리보기 메서드 추가 |
| `src/lib/stores/game.svelte.ts` | 마나 복원 복원 상태 표시 추가 |
| `src/routes/+page.svelte` | 모바일 클래스 토글 추가 |
