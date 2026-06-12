# Jesulkr 튜토리얼 구현 계획

> 최초 작성: 2025-07-16  
> 현황 업데이트: 2026-06-12

---

## 전체 현황

| Phase | 내용 | 상태 |
|-------|------|------|
| Phase 1 | 기반 구축 (스토리지, i18n, 온보딩 모달) | ✅ **완료** |
| Phase 2 | toolInfo 공식 표시 + 도움말 버튼 | 🔲 미완료 |
| Phase 3 | HelpModal (4탭 도움말 모달) | 🔲 미완료 |
| Phase 4 | 테스트 및 마무리 | 🔲 미완료 |

---

## Phase 1 — 기반 구축 ✅ 완료 (2026-06-12)

### 구현 내용

**스토리지**
- `StorageMisc.ts`: `loadTutorialSeen()` / `saveTutorialSeen()` 이미 존재
- `game.ts`: `saveTutorialSeen()` 메서드 연결 완료

**온보딩 모달** (`TutorialModal.svelte`)
- 첫 실행(언어 선택 직후)에만 표시, 완료 후 영구 숨김
- 5장 슬라이드: 게임루프 / 빨간마나+회로 / 도선+파란마나 / 전투+슬롯 / 맵+별
- 키보드 지원 (← → Enter Esc), 점 인디케이터, 건너뛰기 버튼 상시 노출

**빈 보드 힌트** (`DesignerPanel.svelte`)
- 설계판이 비었을 때 4단계 가이드 인라인 표시
- 부품 배치 즉시 자동 사라짐

**i18n**
- `tut.*` 키 (슬라이드 텍스트 5장) — ko/en 완료
- `hint.empty.board.*` 키 (빈 보드 힌트) — ko/en 완료

### 관련 파일
```
src/lib/components/TutorialModal.svelte      ← 신규
src/lib/components/DesignerPanel.svelte      ← 빈 보드 힌트 추가
src/lib/game/i18n/ko.ts / en.ts             ← tut.*, hint.empty.board.* 추가
src/lib/game/style.css                       ← .tutorialOverlay, .emptyBoardHint CSS
src/lib/stores/game.ts                       ← saveTutorialSeen() 추가
src/routes/+page.svelte                      ← <TutorialModal /> 삽입
```

---

## Phase 2 — toolInfo 공식 표시 + 도움말 버튼 🔲

> 예상 공수: 30분  
> 선행 조건: Phase 1 완료 (✅)

### 배경

현재 `toolInfo` 영역은 부품 이름과 설명(`text`)만 표시한다.  
각 부품 def에 `formula` 필드가 있지만 UI에 노출되지 않아 플레이어가 데미지 공식을 알기 어렵다.  
또한 메뉴에 도움말 진입점이 없어 Phase 3의 HelpModal에 접근할 수 없다.

### 작업 목록

#### 2-A. `toolInfo`에 `formula` 표시
**파일**: `src/lib/components/DesignerPanel.svelte`

현재:
```svelte
<div id="toolInfo" class="toolInfo">
  {#if gameState.designer.tool && TOOL_DESCRIPTIONS[gameState.designer.tool]}
    <b>{TOOL_DESCRIPTIONS[gameState.designer.tool].name}</b>
    <div class="small">{TOOL_DESCRIPTIONS[gameState.designer.tool].text}</div>
  {:else}
    {t('select.tool')}
  {/if}
</div>
```

변경 후:
```svelte
<div id="toolInfo" class="toolInfo">
  {#if gameState.designer.tool && TOOL_DESCRIPTIONS[gameState.designer.tool]}
    {@const info = TOOL_DESCRIPTIONS[gameState.designer.tool]}
    <b>{info.name}</b>
    <div class="small">{info.text}</div>
    {#if info.formula}
      <div class="formula">⚡ {info.formula}</div>
    {/if}
  {:else}
    {t('select.tool')}
  {/if}
</div>
```

CSS는 `style.css`에 이미 `.toolInfo .formula { color: var(--gold) }` 규칙이 있음 — 추가 불필요.

#### 2-B. MainMenu에 도움말 버튼 추가
**파일**: `src/lib/components/MainMenu.svelte`

- `onOpenHelp` prop 추가
- 메뉴 패널에 `{t('help')}` 버튼 삽입 (맵 선택 바로 위)

**파일**: `src/routes/+page.svelte`

- `HelpModal` bind + `onOpenHelp` 연결

#### 2-C. i18n 키 추가
**파일**: `src/lib/game/i18n/ko.ts`, `en.ts`

```typescript
'help': '도움말',       // en: 'Help'
```

### 완료 체크리스트
- [ ] 2-A `toolInfo`에 formula 표시
- [ ] 2-B MainMenu `help` 버튼 + prop 연결
- [ ] 2-C i18n `help` 키 추가
- [ ] `svelte-check` 0 errors 확인

---

## Phase 3 — HelpModal (4탭 도움말) 🔲

> 예상 공수: 2시간  
> 선행 조건: Phase 2 완료

### 배경

게임 중 언제든 열 수 있는 상시 참고용 도움말 모달.  
온보딩 모달(Phase 1)은 첫 실행 1회용이라 이후엔 규칙을 다시 볼 방법이 없다.

### 구성

**파일**: `src/lib/components/HelpModal.svelte` (신규)

4개 탭:

| 탭 | 내용 |
|----|------|
| 개요 | 게임 루프, 술식 통계 설명 |
| 부품 | 전체 부품 목록 + 이름·설명·공식 (TOOL_DESCRIPTIONS 활용) |
| 조작법 | 키 테이블 (현재 keyBindings 기준으로 동적 표시) |
| 맵 | 3개 맵 정보, 별 조건, 해금 조건 |

### 인터페이스 설계

```svelte
<script lang="ts">
  import { game } from '$lib/stores/game';
  import { t } from '$lib/game/i18n';
  import { MAPS, STAR_THRESHOLDS, TOOL_ORDER, TOOL_DESCRIPTIONS, CONTROL_ACTIONS } from '$lib/game/constants';

  let { open = $bindable(false) } = $props<{ open?: boolean }>();
  let activeTab = $state<'overview' | 'components' | 'controls' | 'maps'>('overview');
</script>
```

닫기: X 버튼, Esc 키, 오버레이 클릭.  
CSS: `style.css`의 `.mapModal` / `.mapBox` 패턴을 그대로 재사용 (새 클래스 최소화).

### 주의사항

- 잠긴 부품(`requiredMap > 1`)은 부품 탭에서 `🔒 해금 필요` 배지 표시
- 조작법 탭은 현재 `game.keyBindings` / `game.controlBindings` 기준으로 렌더링 (키 재설정 반영)
- `TOOL_DESCRIPTIONS`는 이미 `name`, `text`, `formula` 모두 포함 — 별도 데이터 가공 불필요

### 완료 체크리스트
- [ ] 3-A `HelpModal.svelte` 기본 구조 + 오버레이/닫기
- [ ] 3-B 개요 탭 (게임 루프, 통계 설명)
- [ ] 3-C 부품 탭 (전체 목록, 잠금 표시)
- [ ] 3-D 조작법 탭 (동적 키 바인딩 표시)
- [ ] 3-E 맵 탭 (3개 맵, 별 조건)
- [ ] 3-F `+page.svelte`에 `<HelpModal>` 추가
- [ ] 3-G `svelte-check` 0 errors 확인

---

## Phase 4 — 테스트 및 마무리 🔲

> 예상 공수: 30분  
> 선행 조건: Phase 3 완료

### 작업 목록

#### 4-A. svelte-check
```bash
npx svelte-check --tsconfig ./tsconfig.json
# 목표: 0 errors, 0 warnings
```

#### 4-B. 수동 확인 항목

**온보딩 모달**
- localStorage 비운 뒤 언어 선택 → 슬라이드 정상 표시
- 건너뛰기 → 재접속 시 미표시
- 키보드 ← → Esc 동작

**빈 보드 힌트**
- 설계판 비었을 때 힌트 표시
- 부품 배치 시 즉시 사라짐

**toolInfo formula**
- 각 부품 선택 시 공식 표시
- formula 없는 부품(wire, eraser 등)은 빈 줄 없음

**HelpModal**
- 메뉴 → 도움말 → 4탭 전환 정상
- Esc / X / 오버레이 클릭 닫기
- 언어 전환 후 텍스트 변경 확인

#### 4-C. 문서 업데이트
- 이 파일(`TUTORIAL_PLAN.md`) Phase 상태 갱신
- `GAME_DESIGN.md` 현황 라인 업데이트

### 완료 체크리스트
- [ ] 4-A `svelte-check` 통과
- [ ] 4-B 수동 확인 항목 전체
- [ ] 4-C 문서 업데이트
- [ ] 커밋 + 푸시

---

## 관련 파일 전체 목록

### 기존 (Phase 1에서 생성/수정)
```
src/lib/components/TutorialModal.svelte
src/lib/components/DesignerPanel.svelte
src/lib/game/i18n/ko.ts
src/lib/game/i18n/en.ts
src/lib/game/style.css
src/lib/stores/game.ts
src/routes/+page.svelte
```

### Phase 2~3에서 수정/신규
```
src/lib/components/DesignerPanel.svelte     ← formula 표시 (수정)
src/lib/components/MainMenu.svelte          ← help 버튼 (수정)
src/lib/components/HelpModal.svelte         ← 신규
src/lib/game/i18n/ko.ts / en.ts            ← help 키 (수정)
src/routes/+page.svelte                     ← HelpModal 삽입 (수정)
```

---

## 참고

- [docs/GAME_DESIGN.md](../GAME_DESIGN.md) — 게임 메커니즘 전체 명세
- `src/lib/game/constants.ts` — `TOOL_DESCRIPTIONS`, `MAPS`, `STAR_THRESHOLDS`, `CONTROL_ACTIONS`
- `src/lib/game/core/StorageMisc.ts` — `loadTutorialSeen()`, `saveTutorialSeen()`
