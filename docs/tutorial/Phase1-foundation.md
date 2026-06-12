# Phase 1 — 기반 구축 ✅ 완료 (2026-06-12)

> 원래 계획과 달리 Toast 기반 맥락 힌트 대신 슬라이드 모달 방식으로 구현.  
> `TutorialHints.ts` 유틸리티는 불필요해져 생략.

---

## 구현 내용

### 1-A. 스토리지 연결

`StorageMisc.ts`에 `loadTutorialSeen()` / `saveTutorialSeen()`이 이미 존재했음.  
`game.ts`에 `saveTutorialSeen()` 퍼블릭 메서드를 추가해 컴포넌트에서 호출 가능하게 연결.

```typescript
// src/lib/stores/game.ts
saveTutorialSeen() {
  this.store.tutorialSeen = true;
  Storage.saveTutorialSeen(true);
}
```

### 1-B. 온보딩 모달 (`TutorialModal.svelte`)

언어 선택 직후 첫 실행에만 표시. 완료/건너뛰기 시 `tutorialSeen = 'seen'` 저장 → 이후 영구 숨김.

**슬라이드 5장**

| # | 키 | 내용 |
|---|-----|------|
| 1 | `tut.s1.*` | 게임 루프 요약 |
| 2 | `tut.s2.*` | 빨간 마나 + 3가지 회로 + 쿨타임 원리 |
| 3 | `tut.s3.*` | 도선 + 파란 마나 + 혼합 회로 |
| 4 | `tut.s4.*` | 슬롯 발사 + 자동/수동 + autoManaReserve |
| 5 | `tut.s5.*` | 맵 해금 + 별 + 마나 보너스 |

**UX**
- 점 인디케이터 클릭으로 임의 슬라이드 이동
- 키보드: `→` / `Enter` 다음, `←` 이전, `Esc` 건너뛰기
- 건너뛰기 버튼 우상단 상시 노출

### 1-C. 빈 보드 힌트 (`DesignerPanel.svelte`)

```svelte
{#if gameState.designer.components.length === 0}
  <div class="emptyBoardHint" aria-hidden="true">
    <div class="emptyBoardHintInner">
      <b>{t('hint.empty.board.title')}</b>
      {t('hint.empty.board.body')}
    </div>
  </div>
{/if}
```

부품을 하나라도 놓으면 즉시 사라짐.

### 1-D. i18n 추가 키

| 키 패턴 | 용도 |
|---------|------|
| `tut.skip`, `tut.prev`, `tut.next`, `tut.start` | 슬라이드 UI 버튼 |
| `tut.s1~5.title`, `tut.s1~5.body` | 슬라이드 본문 |
| `hint.empty.board.title`, `hint.empty.board.body` | 빈 보드 힌트 |

ko/en 모두 완료.

---

## 관련 파일

```
src/lib/components/TutorialModal.svelte   ← 신규
src/lib/components/DesignerPanel.svelte   ← 빈 보드 힌트 추가
src/lib/game/i18n/ko.ts / en.ts          ← tut.*, hint.empty.board.* 추가
src/lib/game/style.css                    ← .tutorialOverlay, .emptyBoardHint CSS
src/lib/stores/game.ts                    ← saveTutorialSeen() 추가
src/routes/+page.svelte                   ← <TutorialModal /> 삽입
```

---

## 다음 단계

→ [Phase 2](./Phase2-toolinfo-and-help-button.md)
