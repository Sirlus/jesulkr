# Phase 01 — 스포트라이트 튜토리얼 ✅ 완료 (2026-06-12)

## 개요

첫 실행 시 게임의 핵심 루프(설계 → 저장 → 전투 → 발사)를 직접 체험시키는 가이디드 투어.  
나머지 화면을 어둡게 하고 현재 해야 할 요소만 밝게 표시하는 **스포트라이트** 방식.  
플레이어가 행동하면 자동으로 다음 단계로 넘어가며, 언제든 건너뛸 수 있다.

---

## 단계 구성 (6단계)

| 단계 | 하이라이트 요소 | 안내 메시지 | 완료 조건 |
|------|----------------|-------------|-----------|
| 1 | `#toolBar` | 빨간 점 마나를 선택하세요 | 빨간 마나 버튼 직접 클릭 |
| 2 | `#designBoard` | 설계판을 클릭해 마나를 배치하세요 | 부품 1개 이상 배치 |
| 3 | `#toolBar` + `#designBoard` | 회로를 선택하고 마나 옆에 배치하세요 | `damage >= 1` |
| 4 | `#saveBtn` | 슬롯에 저장하세요 | `hasSavedSpell()` |
| 5 | `#startBattleBtn` | 전투를 시작하세요 | `state === 'battle'` |
| 6 | `#slots` | 술식을 발사하세요 | 전투 중 마나 감소 감지 |

---

## 기술 구현

### 스포트라이트 효과

별도 마스크 DOM 없이 CSS `box-shadow` 트릭 사용:

```css
.tut-spotlight {
  z-index: 201 !important;
  box-shadow: 0 0 0 6px rgba(112,255,192,.55),
              0 0 0 9999px rgba(2,6,18,.72) !important;
  pointer-events: auto !important;
}
```

오버레이(`z-index: 200, pointer-events: none`)는 배경만 어둡게.  
하이라이트 요소는 `z-index: 201`로 오버레이 위에 뜨고 클릭도 정상 통과.

복수 요소 하이라이트 지원 — step 3처럼 팔레트와 보드를 동시에 밝힐 수 있음.

### 단계 자동 진행

`$effect`로 현재 단계의 `condition()`을 계속 감시.  
조건 충족 시 자동으로 `advance()` → 다음 단계 스포트라이트로 교체.

### 말풍선 위치

타겟 요소의 `getBoundingClientRect()`로 좌표 계산.  
요소 아래 공간이 120px 이상이면 아래, 아니면 위에 표시.  
가로는 요소 중앙 기준 ±150px, 화면 밖 클램프 처리.

---

## 관련 파일

```
src/lib/components/SpotlightTutorial.svelte   ← 메인 컴포넌트
src/lib/components/SlotPanel.svelte           ← id="slots" 추가
src/lib/game/style.css                        ← .tutSpotlightOverlay, .tut-spotlight, .tutTooltip
src/lib/game/i18n/ko.ts / en.ts              ← tut2.step1~6, tut.skip
src/lib/stores/game.ts                        ← saveTutorialSeen()
src/routes/+page.svelte                       ← <SpotlightTutorial /> 삽입
```

---

## 알려진 이슈

- 하이라이트 외곽선 모양이 요소 형태와 정확히 맞지 않는 경우 있음 (box-shadow 방식의 한계)
- step 3에서 카드 배치 위치가 부자연스러울 수 있음
- 향후 개선 시 SVG clip-path 마스크 방식으로 전환 고려

---

## 다음 과제

- Phase 02: `toolInfo`에 데미지 공식(`formula`) 표시 + 메뉴에 도움말 버튼
- Phase 03: HelpModal — 게임 중 언제든 열 수 있는 4탭 참고 모달
