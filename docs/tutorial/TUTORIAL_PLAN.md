# Jesulkr 튜토리얼 구현 계획

> 작성일: 2025-07-16  
> 버전: v2.0  
> **구현 완료: 2026-06-12**

## 개요

튜토리얼 시스템은 다음 3가지 레이어로 구현되었습니다:

- **레이어 1 — 온보딩 모달** (`TutorialModal.svelte`): 첫 실행 시 5장 슬라이드 안내
- **레이어 2 — 빈 보드 힌트** (`DesignerPanel.svelte`): 설계판이 비어있을 때 인라인 가이드
- **레이어 3 — 도구 설명** (`toolInfo`): 부품 선택 시 이름·설명·공식 상시 표시 (기존 기능)

---

## 구현 현황 (2026-06-12)

### ✅ 완료된 것

| 항목 | 파일 | 내용 |
|------|------|------|
| 온보딩 모달 | `src/lib/components/TutorialModal.svelte` | 첫 실행 5장 슬라이드, 키보드 지원, 건너뛰기 |
| 빈 보드 힌트 | `src/lib/components/DesignerPanel.svelte` | 부품이 없을 때 4단계 가이드 표시 |
| i18n 키 추가 | `src/lib/game/i18n/ko.ts`, `en.ts` | 튜토리얼 + 힌트 텍스트 ko/en |
| CSS 스타일 | `src/lib/game/style.css` | `.tutorialOverlay`, `.emptyBoardHint` 등 |
| saveTutorialSeen() | `src/lib/stores/game.ts` | 완료 상태 저장 메서드 연결 |
| 페이지 마운트 | `src/routes/+page.svelte` | `<TutorialModal />` 삽입 |

### ❌ 미구현 (이후 과제)

| 항목 | 이유 |
|------|------|
| HelpModal (도움말 탭 모달) | 범위 외, 필요 시 별도 작업 |
| 맥락형 토스트 힌트 (게임 중) | 기존 Toast로 일부 대체됨 |

---

## 온보딩 모달 상세

### 슬라이드 구성 (5장)

| # | 아이콘 | 제목 | 핵심 내용 |
|---|--------|------|-----------|
| 1 | ⚡ | 술식 설계 타워 디펜스 | 게임 루프 요약 |
| 2 | 🔴 | 빨간 마나와 회로 | 3가지 빨강 회로 + 쿨타임 원리 |
| 3 | 🔗 | 도선과 파란 마나 | 도선 연결 + 혼합 회로 효율 |
| 4 | ⚔️ | 전투와 슬롯 | 발사 방법 + 자동 마나 보존 |
| 5 | 🗺️ | 맵과 별 | 해금 조건 + 마나 보너스 |

### 동작 방식

- `localStorage`에서 `tutorialSeen` 미설정 시 표시, 설정 시 영구 숨김
- 점 인디케이터 클릭으로 임의 슬라이드 이동 가능
- 키보드: `→` / `Enter` 다음, `←` 이전, `Esc` 건너뛰기
- 건너뛰기 버튼은 항상 우상단에 노출

---

## 빈 보드 힌트 상세

`DesignerPanel.svelte`의 설계판 위에 `{#if components.length === 0}` 조건으로 표시됩니다.

```
① 빨간 점 마나 선택
② 설계판 클릭
③ 바로 옆에 1칸 회로 배치
④ 우측 [슬롯에 저장] 클릭
```

부품을 하나라도 놓으면 자동으로 사라집니다 (재사용 방해 없음).

---

## 관련 파일

```
src/lib/components/TutorialModal.svelte   ← 신규
src/lib/components/DesignerPanel.svelte   ← 빈 보드 힌트 추가
src/lib/game/i18n/ko.ts                   ← hint.empty.board.*, tut.* 키 추가
src/lib/game/i18n/en.ts                   ← 동일
src/lib/game/style.css                    ← 튜토리얼 CSS 추가
src/lib/stores/game.ts                    ← saveTutorialSeen() 추가
src/routes/+page.svelte                   ← <TutorialModal /> 삽입
```

---

## 관련 문서

- [docs/GAME_DESIGN.md](../GAME_DESIGN.md) - 게임 메커니즘 상세
- [docs/API.md](../API.md) - API 참조
- `src/lib/game/constants.ts` - `STORAGE_KEY_TUTORIAL_SEEN` 정의
- `src/lib/game/i18n/ko.ts`, `en.ts` - 다국어 지원


> 작성일: 2025-07-16
> 버전: v2.0

## 개요

튜토리얼 시스템은 2단계로 구현합니다:
- **Level 1 (단순)**: 온보딩 힌트 - 첫 플레이 시 간단한 안내 메시지
- **Level 2 (중간)**: 도움말 메뉴 + 툴팁 - 종합 가이드 및 부품 설명

---

## Level 1: 온보딩 힌트 (Simple Onboarding)

### 목적
첫 플레이어가 게임의 기본적인-flow를 이해하도록 간단한 힌트를 표시합니다.

### 기존 상태
- `STORAGE_KEY_TUTORIAL_SEEN = 'jesulkr_tutorial_seen_v2'`가 `constants.ts`에 이미 정의됨
- 아직 로직이 연결되지 않음

### 구현 내용

#### 1.1 튜토리얼 Seen 플래그 관리
```typescript
// src/lib/game/core/StorageMisc.ts (신규 또는 기존 파일)
// 또는 src/lib/game/controllers/StorageController.ts에 추가
export function loadTutorialSeen(): boolean {
  return localStorage.getItem(STORAGE_KEY_TUTORIAL_SEEN) === 'true';
}

export function saveTutorialSeen(seen: boolean): void {
  localStorage.setItem(STORAGE_KEY_TUTORIAL_SEEN, String(seen));
}
```

#### 1.2 힌트 표시 시점

| 시점 | 힌트 메시지 (ko) | 힌트 메시지 (en) |
|------|----------------|----------------|
| 게임 시작 (저장된 술식 없음) | `설계 화면에서 D를 눌러 술식을设计和보세요` | Press D to open the spell designer |
| 부품 선택 후 | `빨간 마나와 회로를 배치하세요` | Place red mana and a circuit |
| 저장 가능 상태 | `저장 버튼을 눌러 슬롯에 저장하세요` | Click Save to save to a slot |
| 전투 시작 전 | `전투 시작 버튼을 눌러 전투를 시작하세요` | Click Start Battle to begin |
| 첫 몬스터 등장 | `키 1~5로 술식을 발사하세요` | Press 1~5 to cast spells |

#### 1.3 구현 위치
- `src/routes/+page.svelte`: `onMount`에서 튜토리얼 Seen 상태 확인 및 첫 힌트 표시
- `src/lib/game/core/StorageMisc.ts`: 로드/세이브 함수 (또는 기존 Storage에 통합)
- `src/lib/game/ui/Toast.ts`:既存の `showToast` 함수 활용

---

## Level 2: 도움말 메뉴 + 툴팁 (Help Menu + Tooltips)

### 목적
게임 중 언제든지 도움말을 볼 수 있고, 부품에 마우스 올리면 설명을 확인할 수 있도록 합니다.

### 구현 내용

#### 2.1 도움말 버튼 추가 (MainMenu)
```svelte
<!-- src/lib/components/MainMenu.svelte -->
<button type="button" onclick={() => openHelpModal()}>{t('help')}</button>
```

#### 2.2 HelpModal 컴포넌트 생성
```svelte
<!-- src/lib/components/HelpModal.svelte -->
```

구성:
- **탭 구조**:
  - 개요: 게임 설명, 핵심 루프
  - 부품: 18개 부품 목록 + 설명
  - 조작법: 키 바인딩 설명
  - 맵: 3개 맵 정보 + 별 조건
- **닫기**: 우상단 X 버튼 또는 Esc

#### 2.3 툴팁 표시 (DesignerPanel)

디자인 选项:

**Option A: ToolInfo 영역 활용 (기존 활용)**
```svelte
<!-- src/lib/components/DesignerPanel.svelte (기존 toolInfo div 개선) -->
<div id="toolInfo" class="toolInfo">
  {@const info = TOOL_DESCRIPTIONS[gameState.designer.tool]}
  <b>{info.name}</b>
  <div class="small">{info.text}</div>
  <div class="formula">{info.formula}</div>  <!-- 신규 추가 -->
</div>
```

**Option B: Hover Tooltip (신규 구현)**
```svelte
<!-- src/lib/components/DesignerPanel.svelte -->
{#each TOOL_ORDER as tool}
  {@const info = TOOL_DESCRIPTIONS[tool]}
  <button 
    class="toolBtn"
    title={info.name + '\n' + info.text}  <!-- 기본 title 속성 활용 -->
  >
    ...
  </button>
{/each}
```
- `title` 속성만으로도 브라우저 기본 툴팁 표시 가능
- CSS로 스타일 개선 가능 (`tooltip` 클래스)

#### 2.4 부품 설명 (TOOL_DESCRIPTIONS 활용)

```typescript
// src/lib/game/constants.ts (기존)
export const TOOL_DESCRIPTIONS: Record<string, ToolDescriptor> = Object.fromEntries(
  ALL_DEFS.map(d => [d.type, { name: d.name, text: d.text, formula: d.formula }]),
);
```
- `name`: 표시 이름
- `text`: 부품 설명
- `formula`: 데미지 공식 요약

#### 2.5 구현 우선순위

1. **HelpModal 생성** - 가장 중요 (전체 가이드)
2. **도움말 버튼 추가** - MainMenu에 버튼
3. **툴팁 개선** - 기존 `toolInfo` 영역에 공식(formula) 추가发行

---

## 18개 부품 설명 (참조용)

### v1.5 기존 (9개)

| 순서 | 타입 | 이름 | 설명 | 공식 |
|------|------|------|------|------|
| 1 | `red` | 빨간 점 마나 | 기본 마나 소스 | 비용 +1 |
| 2 | `red3` | 3중 빨간 마나 | 3배의 마나 발생 | 비용 +2 |
| 3 | `blueGen` | 파란 마나 생성기 | 파란 마나 2 소모 시 1 생성 | 비용 +2, 출력 1 |
| 4 | `wire` | 도선 | 네트워크 연결 (적/청) | 비용 0 |
| 5 | `mediumWire` | 중형 도선 | 3색상 네트워크 (v2) | 비용 0 |
| 6 | `mediumHub` | 중형 허브 | 안정도 필요 활성 (v2) | 안정도 1 필요 |
| 7 | `extractor` | 추출기 | 색상 변환 (v2) | 색상별 |
| 8 | `stabilizer` | 안정기 | 안정도 제공 (v2) | 안정도 +1 |
| 9 | `circle` | 1칸 회로 | 빨간 → 데미지 | 빨강 × 1 |
| 10 | `oval` | 2칸 타원 | 회전 가능 | floor(빨강/2) × 5 |
| 11 | `kernel` | 2×2 핵 | | floor(빨강/3) × 12 |
| 12 | `mixed2` | 2칸 혼합 | 회전 가능, 마나混合 | min(빨강, 파랑) × 8 |
| 13 | `greenMana` | 초록 마나 | 혼합 회로 연결 시 (v2) | 비용 +2 |
| 14 | `green3x2` | 3×2 순환 | 초록 마나 활용 (v2) | |
| 15 | `greenPair2` | 2×2 녹청 | | |
| 16 | `mixedCore` | 9칸 혼합핵 | AOE, circle 수 포함 | min(빨강, floor(파랑/2), circle 수) × (60+AOE) |
| 17 | `ultimateCore` | 4×4 안정핵 | 전체 데미지 (v2) | |
| 18 | `eraser` | 지우개 | 부품 삭제 | - |

---

## 파일 구조 (변경/신규)

### 변경 파일
| 파일 | 변경 내용 |
|------|----------|
| `src/lib/components/MainMenu.svelte` | 도움말 버튼 추가 |
| `src/lib/components/DesignerPanel.svelte` | 툴팁 개선 (선택) |
| `src/lib/game/controllers/StorageController.ts` | 튜토리얼 Seen 로직 추가 |

### 신규 파일
| 파일 | 내용 |
|------|------|
| `src/lib/components/HelpModal.svelte` | 도움말 모달 (Level 2) |
| `src/lib/components/Tooltip.svelte` | 커스텀 툴팁 (선택, Level 2) |

---

## Phase별 문서 목록

각 Phase별 상세 계획은 개별 문서를 참조하세요:

| Phase | 문서 | 예상 시간 |
|-------|------|----------|
| Phase 1 | [Phase1-foundation.md](./Phase1-foundation.md) | 2시간 |
| Phase 2 | [Phase2-onboarding.md](./Phase2-onboarding.md) | 1시간 |
| Phase 3 | [Phase3-help-modal.md](./Phase3-help-modal.md) | 3시간 |
| Phase 4 | [Phase4-ui-integration.md](./Phase4-ui-integration.md) | 1시간 |
| Phase 5 | [Phase5-testing.md](./Phase5-testing.md) | 1시간 |
| **총계** | | **8시간** |

## Phase별 핵심 작업 요약

### Phase 1: 기반 구축 (2시간)
- StorageMisc.ts: 튜토리얼 Seen 플래그 함수
- i18n: 힌트 메시지 (ko/en) 각 8개
- TutorialHints.ts: 힌트 표시 유틸리티

### Phase 2: 온보딩 힌트 (1시간)
- +page.svelte: 첫 방문 시 첫 힌트 표시
- DesignerController: 저장 시 힌트
- BattleController: 전투 시작 시 힌트

### Phase 3: 도움말 모달 (3시간)
- HelpModal.svelte: 4개 탭 (개요/부품/조작법/맵)
- 18개 부품 설명 포함

### Phase 4: UI 통합 (1시간)
- MainMenu: 도움말 버튼 추가
- DesignerPanel: 툴팁에 공식(formula) 표시

### Phase 5: 테스트 (1시간)
- HelpModal 렌더링
- 온보딩 힌트 시점
- 다국어 전환
- svelte-check

## 예상 공수 (Phase별 합계)

| Phase | 예상 시간 |
|-------|----------|
| Phase 1 | 2시간 |
| Phase 2 | 1시간 |
| Phase 3 | 3시간 |
| Phase 4 | 1시간 |
| Phase 5 | 1시간 |
| **총계** | **8시간** |

---

## 관련 문서

- [docs/GAME_DESIGN.md](../GAME_DESIGN.md) - 게임 메커니즘 상세
- [docs/API.md](../API.md) - API 참조
- `src/lib/game/constants.ts` - 상수 정의
- `src/lib/game/i18n/ko.ts`, `en.ts` - 다국어 지원
