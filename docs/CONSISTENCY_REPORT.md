# Jesulkr 정합성 보고서 (원작 HTML v1.3 기준)

> **기준**: `/home/dev/jesulkr/Jesulkr_v1.3.html` (통짜 HTML, ~178KB)  
> **대상**: `/home/dev/jesulkr-svelte` (SvelteKit 포팅 버전 v1.3.0)  
> **검토일**: 2026-06-10
> **검증 커맨드**: `npm run check` → **29 errors, 4 warnings**

---

## 1. 개요

원작 HTML v1.3은 단일 파일에 **CSS ~370줄 + JavaScript ~2,000줄**로 완전한 게임이 구현된 상태입니다.  
`jesulkr-svelte`는 이 원작을 SvelteKit + TypeScript 모듈로 포팅한 프로젝트이나, **핵심 게임 로직의 메서드 누락**, **빌드/타입 오류 다수**, **다수의 UI/UX 기능 누락**이 확인되었습니다.  
현재 `npm run check` 기준 **29개의 타입/스벨트 오류**가 있어 즉시적인 빌드 및 실행이 어려운 상태입니다.

---

## 2. 치명적 불일치 (빌드/런타임 실패)

### 2.1 Vite / SvelteKit 설정 오류

| 항목 | 원작 | `jesulkr-svelte` | 문제 |
|------|------|------------------|------|
| 빌드 설정 | 없음 (정적 HTML) | `vite.config.ts` | `adapter`, `paths`가 `sveltekit()` 플러그인 **안**에 위치. SvelteKit 표준 API 위반으로 빌드 실패 가능성 높음. |
| SvelteKit 설정 | 없음 | 없음 | `svelte.config.js` 파일 자체가 없음. `adapter`와 `paths`는 반드시 여기에 위치해야 함. |

**근거**: SvelteKit 2.x에서는 `adapter`와 `paths`는 `svelte.config.js`의 `kit` 객체에 설정해야 합니다.  
**또한** `svelte.config.js` 파일이 프로젝트에 존재하지 않습니다.

### 2.2 GameManager 미구현 메서드 (9개)

원작 HTML에는 모두 구현된 기능이나, `jesulkr-svelte`의 `src/lib/stores/game.ts`에는 **정의조차 없는 메서드**입니다.  
`API.md`에도 공개 API로 기술되어 있으나 실제 구현이 없습니다.

| 메서드 | 원작 함수명 | 호출 위치 | 기능 | 비고 |
|--------|------------|----------|------|------|
| `eraseComponent` | `eraseAtPointer` / `eraseCellAt` | `+page.svelte` (우클릭) | 설계판 부품 삭제 | — |
| `saveSpell` | `saveSpellToSlot` | `+page.svelte` (저장 버튼) | 설계 → 슬롯 저장 | — |
| `loadSpell` | `loadSpellFromSlot` | `+page.svelte` (슬롯 클릭) | 슬롯 → 설계 불러오기 | — |
| `renderDesigner` | `renderDesigner` | `+page.svelte`, `game.ts` | 설계판 DOM 렌더링 | — |
| `clearDesign` | `clearDesigner` | `+page.svelte` (초기화 버튼) | 설계판 전체 초기화 | — |
| `recordRun` | `recordCurrentRun` | `game.ts` (`startBattle`, `checkUnlocks`) | 전투 기록 저장 | — |
| `trimComponents` | `trimComponentsToFrame` | `game.ts` (`setFrame`) | 프레임 밖 부품 제거 | — |
| `spellStats` | (계산 함수) | `game.ts`, `routes/test/+page.svelte` | 현재 설계 통계 반환 | API 문서에도 있음 |
| `startLoop` | (GameManager 낶) | `game.ts` (`initCanvas`) | Canvas 렌더링 루프 시작 | — |

> **결과**: 위 9개 메서드가 없으면 **설계 화면의 모든 상호작용(배치/삭제/저장/불러오기)과 전투 기록 저장, 루프가 동작하지 않습니다.**

### 2.3 타입/빌드 오류 (svelte-check 29 errors)

`npm run check` 실행 결과 확인된 주요 오류:

| 파일 | 오류 내용 | 심각도 |
|------|----------|--------|
| `DamageResolver.ts:27` | `Monster \| null`을 `Monster \| undefined`에 할당 불가 | 높음 |
| `BattleEngine.ts:138` | 동일 타입 불일치 (`getAutoTarget` 반환값) | 높음 |
| `Store.ts:6` | `BattleState` import가 로컬 선언과 충돌 | 높음 |
| `ko.ts:95`, `en.ts:95-96` | 객체 리터럴에 중복 키 존재 | 높음 |
| `game.ts` 다수 | 미구현 메서드 참조 (`startLoop`, `trimComponents`, `renderDesigner`, `spellStats`, `recordRun`, `loadSpell`) | 높음 |
| `+page.svelte` 다수 | 동일 미구현 메서드 참조 (`eraseComponent`, `renderDesigner`, `saveSpell`, `clearDesign`) | 높음 |
| `routes/test/+page.svelte:47` | `spellStats` 미구현 참조 | 중간 |

> **결과**: 타입 체크만 합격해야 실제 실행이 가능합니다. 현재는 `svelte-check`가 통과하지 않습니다.

---

## 3. 중대한 게임 로직 불일치

### 3.1 몬스터 속도 증가 누락

| 구분 | 원작 HTML v1.3 | `jesulkr-svelte` |
|------|---------------|------------------|
| **일반 몬스터 속도** | `42 + game.survival * 0.45 + Math.random() * 18` | `42 + Math.random() * 18` |
| **영향** | 생존 시간이 길어질수록 몬스터가 점점 빨라짐 | 속도가 시간에 따라 증가하지 않음 |

**위치**: 원작 `spawnMonster()` (라인 1271) vs `jesulkr-svelte/src/lib/game/battle/BattleEngine.ts` (라인 38)

> ⚠️ **게임 밸런스에 직접적인 영향**. 원작 의도대로라면 후반부로 갈수록 몬스터가 빨라져야 합니다.

### 3.2 `constants.ts` 낶 별 조건 불일치

| 항목 | 값 | 상태 |
|------|-----|------|
| `STAR_THRESHOLDS[2]` | `[55000, 65000, 75000]` | ✅ 코드 상 올바름 |
| `MAPS[2].desc` | "별 조건: 55,000 / 60,000 / 65,000점" | ❌ **텍스트 오류**. `STAR_THRESHOLDS[2]`와 불일치 |
| `GAME_DESIGN.md` | `[55000, 65000, 75000]` | ✅ 올바름 |

**결론**: `STAR_THRESHOLDS`는 원작 코드 기준으로 올바륩니다. 다만 `MAPS[2].desc`의 설명 텍스트가 `STAR_THRESHOLDS[2]`와 다르게 되어 있어, 플레이어에게 잘못된 정보를 노출할 수 있습니다.

### 3.3 `getTotalStars` 파라미터 재구성

| 구분 | 원작 | `jesulkr-svelte` |
|------|------|------------------|
| 함수 시그니처 | `getTotalStars(includeCurrentRun)` | `getTotalStars(records, battle, state, activeRunMapId)` |
| `includeCurrentRun` | 현재 진행 중인 전투 점수를 별 계산에 포함할지 여부 | 남겨진 파라미터 없음. 남겨진 로직으로 `runId === id`일 때 `battle.score`를 포함시킴 |

`jesulkr-svelte`의 `progression.ts`는 `includeCurrentRun` boolean 대신 `state`/`battle`/`activeRunMapId`를 받아 낶에서 판단합니다.  
기능적으로는 현재 런의 별 포함/제외 개념이 유지되나, **API 인터페이스가 완전히 변경**되었습니다.

### 3.4 `castSlot` 에러 메시지 부적절

| 상황 | 원작 메시지 | `jesulkr-svelte` 메시지 |
|------|------------|------------------------|
| `state !== 'battle'` | `"전투 중에만 술식을 사용할 수 있습니다."` | `"마나 부족"` (`t('not.enough.mana')`) |

> 원작은 상황별 정확한 메시지를 출력하지만, svelte 버전은 잘못된 메시지를 출력합니다.

---

## 4. 기능 누락 (원작 있음 → svelte 없음)

| # | 기능 | 원작 구현 | `jesulkr-svelte` 상태 | 중요도 |
|---|------|----------|----------------------|--------|
| 4.1 | **맵 선택 모달** | `mapModal`, `renderMapCards`, `openMapSelect` | 없음. `startBattle()`이 바로 시작 | 높음 |
| 4.2 | **덱 관리 UI** | `deckControls`, 10개 덱 저장/불러오기/이름 변경 | 없음. `+page.svelte`에 마크업 없음 | 높음 |
| 4.3 | **키 설정 모달** | `keySettingsModal`, 키 캡처, 충돌 검사 | 없음. 메뉴 버튼만 있고 기능 없음 | 높음 |
| 4.4 | **자동 마나 보존 입력** | `autoReserveInput`, `updateAutoManaReserve` | 없음. `Store.ts`에는 필드 있으나 UI 없음 | 중간 |
| 4.5 | **설계 배치 미리보기** | `placementGhost`, `placementCellHint`, `renderPlacementGhost` | 없음 | 중간 |
| 4.6 | **SVG 도구 아이콘** | `toolIconSvg` (9개 SVG) | 부분 구현. CSS `toolIcon` 사용. 이모지는 사용하지 않음 | 낮음 |
| 4.7 | **설계판 휠 회전** | `onDesignWheel` (마우스 휠로 oval/mixed2 회전) | 없음 | 중간 |
| 4.8 | **드래그 연속 배치** | `placingDrag`, `lastDragPlaceKey` | 없음. 단일 클릭만 | 중간 |
| 4.9 | **도구 해금 UI 표시** | `locked` 클래스, 잠금 배지 "잠김"/"Locked" | 없음. 모든 도구 항상 표시 | 중간 |
| 4.10 | **술식 필요 맵 체크** | `getSpellRequiredMap`, `getLockedToolNamesFromComponents` | 없음. 해금되지 않은 부품으로도 술식 저장 가능 | 중간 |
| 4.11 | **모바일 터치 지원** | `touchstart/move/end`로 설계판 터치 배치 | 없음 | 높음 |
| 4.12 | **모바일 레이아웃 자동 전환** | `mobile-layout` 클래스, `shouldUseMobileLayout()` | 없음. CSS는 있으나 JS에서 클래스 토글 없음 | 높음 |
| 4.13 | **보스 등장 토스트** | `"HP 500 보스 등장"` | 없음 | 낮음 |
| 4.14 | **마나 재생 복원 토스트** | `"별 5개 달성: 초당 마나 10"` | 없음 (`checkUnlocks`에 누락) | 낮음 |
| 4.15 | **저장 데이터 전체 삭제** | `clearAllStorage` (상세한 초기화) | 없음. `Storage.ts`에 re-export 없음 | 중간 |
| 4.16 | **Canvas 게임 루프** | `requestAnimationFrame` 기반 루프 | `startLoop()` 메서드 자체가 없음 | 치명적 |

---

## 5. 정합성 확인된 부분 (양호)

| 영역 | 평가 |
|------|------|
| **핵심 게임 로직** | `StatsCalculator.ts`, `WireNetwork.ts`, `Components.ts`, `BattleEngine.ts`, `TargetingSystem.ts`가 원작과 거의 동일한 알고리즘을 사용함. |
| **상수 (대부분)** | `TICK_SEC`, `HIT_DELAY_TICKS`, `MAX_MANA`, `BASE_MANA_REGEN`, `STAR_MANA_REGEN`, `LANES`, `CELL`, `GAP`, `MAX_FRAME`, `CORE_AOE_TARGET_LIMIT` 등이 원작과 일치함. |
| **별 임계값** | `STAR_THRESHOLDS`가 원작 코드 기준으로 일치함. (단, `MAPS[2].desc` 텍스트는 오류) |
| **저장 키** | `magic_design_game_slots_v2`, `magic_design_game_decks_v1`, `jesulkr_language_v1` 등이 원작과 완전히 일치함. |
| **타입 정의** | `SpellData`, `Component`, `Monster`, `BattleState` 등이 원작의 객체 구조와 일치함. |
| **Canvas 렌더링** | `BattleRenderer.ts`의 배경, 레인, 기지, 발사체, 몬스터, 효과, 오버레이가 원작과 시각적으로 동일함. |
| **저장 시스템 모듈** | 7개 `Storage*.ts` 모듈이 원작의 저장 로직을 정확히 분리함. 마이그레이션(v1→v2→v3)도 일치함. |
| **i18n 키 구조** | `ko.ts`/`en.ts`의 번역 키가 원작의 `EN_REPLACEMENTS`와 의미적으로 대응됨. |

---

## 6. 기타 차이점

### 6.1 i18n 구현 방식

| 구분 | 원작 HTML v1.3 | `jesulkr-svelte` |
|------|---------------|------------------|
| 방식 | 텍스트 치환 (`EN_REPLACEMENTS` 배열 순회) | 키-값 객체 (`t(key, ...args)`) |
| DOM 번역 | `MutationObserver`로 동적 DOM 변경 감지 | Svelte 템플릿에서 직접 키 참조 |
| 결과 | 기능적으로 동등하나, svelte 방식이 더 예측 가능함 | ✅ |

### 6.2 상태 관리 방식

| 구분 | 원작 HTML v1.3 | `jesulkr-svelte` |
|------|---------------|------------------|
| 구조 | 평면 객체 (`game`, `designer`) | `GameManager` 싱글톤 + `Store` 클래스 |
| 반응형 | 없음 (수동 `renderSlots()`, `updateHud()` 호출) | Svelte 5 `$derived` 시도하나 `GameManager`가 store가 아니어서 미스매치 |
| 결과 | 원작은 명시적 갱신으로 안정적. svelte는 반응형 연동이 미흡함 | ⚠️ |

### 6.3 테스트

| 구분 | 원작 HTML v1.3 | `jesulkr-svelte` |
|------|---------------|------------------|
| 테스트 | 없음 | 4개 파일, 20개+ 케이스 (Vitest) |
| 결과 | — | ✅ svelte 버전이 테스트 커버리지에서 우위 |

---

## 7. 문서-코드 정합성 문제

| 문서 | 문제 | 상태 |
|------|------|------|
| `API.md` | `eraseComponent`, `saveSpell`, `loadSpell`, `renderDesigner`, `clearDesign`, `recordRun`, `trimComponents`, `spellStats`, `startLoop` 등이 공개 API로 기술되어 있으나 전부 미구현 | ❌ 불일치 |
| `ARCHITECTURE.md` | "덱 저장", "키 설정", "설계 미리보기", "모바일 대응"이 v1.3 추가 기능으로 나엵되나 대부분 미구현 | ⚠️ 과대 선언 |
| `GAME_DESIGN.md` | 맵 2 별 조건은 올바륾 | ✅ 일치 |
| `CONSISTENCY_REPORT.md` (본 보고서 이전 버전) | `constants.ts` 값이 `[55000, 60000, 65000]`이라고 잘못 기재 | ❌ 이번 검증에서 수정됨 |

---

## 8. 개선 우선순위

```
🔴 1순위 (즉시 수정) ─┬─ `svelte.config.js` 신규 생성 + `vite.config.ts` 정리
                      ├─ GameManager 9개 미구현 메서드 구현
                      ├─ `startLoop()` / Canvas 루프 복원
                      ├─ TypeScript/Svelte 타입 오류 29개 해결
                      ├─ 몬스터 속도 증가 로직 복원 (survival * 0.45)
                      └─ `MAPS[2].desc` 텍스트를 `[55000, 65000, 75000]`로 수정

🟡 2순위 (기능 복원) ─┬─ 맵 선택 모달 구현
                      ├─ 덱 관리 UI 구현
                      ├─ 키 설정 모달 구현
                      ├─ 자동 마나 보존 UI 연결
                      ├─ 설계 배치 미리보기 구현
                      └─ 모바일 터치/레이아웃 지원

🟢 3순위 (품질) ─────┬─ castSlot 에러 메시지 교정
                      ├─ i18n 중복 키 정리
                      ├─ `API.md`의 미구현 메서드 표기 또는 구현
                      ├─ 저장 데이터 전체 삭제 기능 추가
                      └─ 보스 등장 / 마나 재생 복원 토스트 추가
```

---

## 9. 결론

원작 HTML v1.3은 **완전히 동작하는 완성품**입니다. 반면 `jesulkr-svelte`는 **아키텍처와 모듈 분리는 우수하나, 실행 가능한 코드로서의 완성도가 크게 떨어지는 상태**입니다.

특히 다음 세 가지가 핵심입니다:

1. **빌드/타입 오류 29개**: `svelte-check`가 통과하지 않아, 현재 코드는 TypeScript/Svelte 컴파일러 기준으로도 부서진 상태입니다. 가장 먼저 해결해야 합니다.

2. **9개 미구현 메서드**: `GameManager`가 게임의 유일한 진입점인데, 설계/저장/기록/루프의 핵심 메서드가 전부 누락되어 있어 **게임의 핵심 루프(설계 → 저장 → 전투 → 기록)가 단절**되어 있습니다.

3. **몬스터 속도 증가 누락**: 원작의 중요한 밸런스 요소인 `survival * 0.45` 속도 증가가 빠져 있어, **게임 난이도가 의도보다 쉬워집니다.**

위 1순위 항목을 처리한 후에야 `jesulkr-svelte`가 원작 HTML v1.3을 의도한 대로 재현할 수 있습니다.
