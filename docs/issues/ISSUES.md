# 이슈 리포트 — 술식 설계 클릭/드래그 불가 (해결됨)

> **상태: ✅ 해결 완료** — 브라우저 실측 디버깅으로 근본 원인을 규명하고 수정했습니다.
> **작성일**: 2026-06-11 · **환경**: 로컬 개발 서버 (Vite dev, `http://localhost:5173/`) · **검증**: 브라우저 자동화 + `bun run test`(91 통과) + `bun run check`(0 에러)

---

## 요약

술식 설계 화면에서 **도구 선택이 화면에 반영되지 않고, 보드를 클릭/드래그해도 부품이 보이지 않는** 문제가 보고되었습니다.

여러 차례의 이전 디버깅은 이를 "보드 클릭 이벤트 버그" 또는 "좌표 계산 버그"로 오진했습니다. 실제 근본 원인은 **상태가 반응형(reactive)이 아니었던 것** 하나였습니다. 도구 선택·부품 배치·통계 계산 등 내부 로직은 모두 정상 동작했지만, 상태 변경이 **DOM에 전혀 반영되지 않아** 사용자에게는 "아무것도 안 되는 것"처럼 보였습니다.

---

## 근본 원인 (브라우저 실측으로 증명)

### 1) 비반응형 상태 — 핵심 원인

`src/lib/stores/gameState.svelte.ts`:

```ts
// 문제 코드
export const gameState = $state(new Store());
```

- Svelte 5의 `$state()`는 **plain object/array만 깊은 프록시(deep proxy)**로 감쌉니다.
- `Store`는 **클래스 인스턴스**이므로 `$state()`가 프록시로 감싸지 못하고, 그 필드(`designer`, `battle` 등)는 **반응형이 되지 않습니다.**

**브라우저 실측 증거:**

| 검증 | 결과 |
|------|------|
| `gameState.constructor.name` | `"Store"` (프록시 아님) |
| 도구 클릭 후 `designer.tool` | `kernel`/`eraser`로 **바뀜** |
| 화면의 `.active` 하이라이트 | **안 바뀜** (계속 첫 도구) |
| `designer.width = 5` 직접 변경 | select/grid DOM **미갱신** |
| 보드 클릭 → `placeComponent` | 상태엔 부품 추가됨, DOM엔 `.piece` **0개** |

→ 즉, **로직은 정상이나 렌더링(반응성)이 죽어 있었음.** `binding_property_non_reactive` 경고(`bind:value={gameState.designer.spellName}`)도 동일한 원인이었습니다.

### 2) 파생된 2차 버그 — 저장 시 `DataCloneError`

반응형으로 고친 직후 노출된 후속 버그:

```
DataCloneError: Failed to execute 'structuredClone' ... could not be cloned.
  at clone (helpers.ts) ← saveSpell (SpellManager.ts)
```

- `designer.components`가 이제 Svelte 반응형 **프록시**라서 `structuredClone`이 복제하지 못함.
- 술식 저장이 예외로 중단 → 슬롯 저장/전투 진입 불가.

### 3) 좌표 매핑이 CSS 스케일을 무시 (모바일 잠재 버그)

`getBoardGridCoordFromPointer`가 고정 상수 `CELL + GAP`로 좌표를 계산해, 모바일에서 적용되는 보드 CSS `scale` 변환을 반영하지 못했습니다. (단위 테스트 `maps pointer coordinates using rendered board size`가 이를 검증)

---

## 오진 이력 (참고)

| 이전 진단 | 실제 |
|-----------|------|
| "전투 버튼이 상태/조건 때문에 안 눌리는 것처럼 보임" | 버튼은 정상. **화면 미갱신**이 원인 |
| "`placeComponent` 분수 좌표 → `Math.floor`로 패치" | 좌표는 정상. 배치 결과가 **렌더링 안 됨** |
| "슬롯 인덱스 타입 불일치/검증 부족" | 무관. 저장 자체가 **반응형 프록시 클론 실패**로 중단 |

세 증상(버튼·보드·술식 선택)은 별개 버그가 아니라 **단일 반응성 결함**의 표면적 표현이었습니다.

---

## 수정 내용

### 1) `Store`를 룬(rune) 모듈로 전환

- `src/lib/game/core/Store.ts` → **`Store.svelte.ts`** 로 이름 변경 (룬은 `.svelte.ts`에서만 동작).
- 모든 필드를 `$state(...)`로 선언해 반응형으로 만듦.

```ts
export class Store {
  state = $state<GameState>('design');
  designer = $state<DesignerState>(createDesignerState());
  battle = $state<BattleState>(createBattleState());
  // ... 그 외 필드 전부 $state(...) 로 선언
}
```

- `gameState.svelte.ts`는 불필요해진 외부 `$state()` 래퍼 제거:

```ts
import { Store } from '$lib/game/core/Store.svelte';
export const gameState = new Store(); // 필드가 이미 룬으로 반응형
```

### 2) `clone()`을 프록시 안전하게

`src/lib/game/utils/helpers.ts` — `structuredClone` 실패 시 JSON 라운드트립으로 폴백(반응형 프록시 값 복제 가능):

```ts
export function clone<T>(obj: T): T {
  if (typeof structuredClone === 'function') {
    try { return structuredClone(obj); }
    catch { /* 반응형 프록시 → JSON 폴백 */ }
  }
  return JSON.parse(JSON.stringify(obj));
}
```

### 3) 좌표 매핑을 렌더 크기 기준으로

`src/lib/stores/game.ts` `getBoardGridCoordFromPointer` — 보드의 실제 렌더 크기로 셀 크기를 계산해 CSS 스케일(모바일)까지 대응:

```ts
const cellW = rect.width / this.designer.width;
const cellH = rect.height / this.designer.height;
const gx = (e.clientX - rect.left) / cellW;
const gy = (e.clientY - rect.top) / cellH;
```

### 4) 디버그 코드 정리

`game.ts`의 `[DEBUG]` `console.log`와 임시 `window.__game` 노출 제거.

---

## 검증 결과

### 브라우저 실측 (dev, 5173)

| 동작 | 결과 |
|------|------|
| 도구 클릭 (2x2 핵/지우개 등) | `.active` 하이라이트·설명 **정상 전환** ✅ |
| 보드 클릭 배치 | 부품이 클릭한 셀에 **렌더링됨** ✅ |
| 드래그 연속 배치 | 정상 ✅ |
| 우클릭 지우기 | 정상 ✅ |
| 프레임 크기 변경(select) | 그리드 즉시 갱신 ✅ |
| 술식 이름 입력 바인딩 | 정상 (경고 사라짐) ✅ |
| 슬롯 저장 | 예외 없이 저장, 슬롯에 표시 ✅ |
| 전투 시작 → 전투 화면 진입 | 정상 ✅ |
| 4셀 배치 좌표 | (0,0)·(62,0)·(0,62)·(62,62) 정확 ✅ |

### 자동화

- `bun run test` → **91 / 91 통과** (이전 실패 테스트 `maps pointer coordinates using rendered board size` 포함)
- `bun run check` → **0 에러 / 0 경고** (`binding_property_non_reactive` 경고 해소)

---

## 영향받은 파일

- `src/lib/game/core/Store.ts` → `src/lib/game/core/Store.svelte.ts` (이름 변경 + 필드 `$state` 선언)
- `src/lib/stores/gameState.svelte.ts` (import 경로 + 래퍼 제거)
- `src/lib/game/utils/helpers.ts` (`clone` 프록시 안전 폴백)
- `src/lib/stores/game.ts` (좌표 매핑 렌더 크기 기준 + 디버그 코드 제거)

---

## 교훈

- Svelte 5에서 **클래스 인스턴스를 `$state()`로 감싸도 반응형이 되지 않는다.** 클래스 필드에 `$state` 룬을 직접 선언해야 하며, 그러려면 `.svelte.ts` 모듈이어야 한다.
- 반응형 상태(`$state` 프록시)는 `structuredClone`으로 복제할 수 없다. JSON 폴백 또는 `$state.snapshot()`을 사용해야 한다.
- "클릭이 안 된다"는 증상은 **이벤트 미바인딩**이 아니라 **렌더 미갱신**일 수 있다. 상태 값과 DOM을 분리해 확인하면 빠르게 원인을 좁힐 수 있다.
