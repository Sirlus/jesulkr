# Phase 1: Foundation — 게임 루프 복원

> **목표**: 빌드가 정상 동작하고, 설계→저장→전투→기록 핵심 루프가 완전히 동작하는 상태로 복원
> **기간**: 2~3일
> **선행 조건**: Phase 0 완료 (`refactor/base` 브랜치)

---

## 1-1. `svelte.config.js` 신규 생성 + `vite.config.ts` 정리

| 기존 문제 | `svelte.config.js` 없음. `adapter`, `paths`가 `vite.config.ts`의 `sveltekit()` 안에 위치 |
|-----------|-------------------------------------------------------------------------------------|
| 영향 | SvelteKit 2.x 표준 API 위반 → 빌드 실패 |
| 참조 | CONSISTENCY_REPORT.md §2.1 |

### 할 일

- [ ] `svelte.config.js` 생성
- [ ] `kit.adapter` (adapter-static, `fallback: '404.html'`)
- [ ] `kit.paths.base` (환경변수 `BASE_PATH` 기준)
- [ ] `vite.config.ts`에서 `adapter`, `paths` 제거 → `sveltekit()` 플러그인만 남김
- [ ] `bun run build` 통과 확인

### 코드

```js
// svelte.config.js (신규)
import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter({ fallback: '404.html' }),
    paths: {
      base: process.argv.includes('dev')
        ? ''
        : (process.env.BASE_PATH || ''),
    },
  },
};

export default config;
```

### 테스트

- [ ] `bun run build` → exit code 0
- [ ] `tests/smoke/build.test.ts` 작성

---

## 1-2. 7개 미구현 GameManager 메서드 구현

> 이 메서드들이 없으면 설계판의 모든 상호작용이 불가능합니다.

### 1-2a. `eraseComponent(e: MouseEvent)`

| 원작 | `eraseAtPointer` / `eraseCellAt` |
|------|----------------------------------|
| 호출 | `+page.svelte` line 24 (우클릭) |

- [ ] 마우스 좌표 → grid 변환 (기존 `placeComponent`와 동일 로직)
- [ ] `componentAt()` → `removeComponentAt()` → `renderDesigner()`
- [ ] `state !== 'design'` 시 early return

### 1-2b. `saveSpell(name: string, slotIndex: number)`

| 원작 | `saveSpellToSlot` |
|------|-------------------|
| 호출 | `+page.svelte` line 188 |

- [ ] `calculateSpellStats()` 로 유효성 검증
- [ ] 무효 시 토스트
- [ ] `Storage.saveSlots()` 영속화
- [ ] 슬롯 범위 0~4 검증

### 1-2c. `loadSpell(slotIndex: number)`

| 원작 | `loadSpellFromSlot` |
|------|---------------------|
| 호출 | `+page.svelte` line 211 |

- [ ] 슬롯 SpellData → designer 상태 복원
- [ ] 빈 슬롯 시 토스트
- [ ] `renderDesigner()` + `updateStatsDisplay()` 호출

### 1-2d. `renderDesigner()`

| 원작 | `renderDesigner` |
|------|------------------|
| 호출 | `placeComponent`, `eraseComponent`, `clearDesign`, `loadSpell`, `setFrame` |

- [ ] `#designBoard` innerHTML 리셋
- [ ] `width × height` 그리드 (CELL=58px, GAP=4px)
- [ ] 부품 타입별 배경색/테두리
- [ ] 회전된 oval/mixed2 세로 방향 표시

### 1-2e. `clearDesign()`

| 원작 | `clearDesigner` |
|------|-----------------|
| 호출 | `+page.svelte` line 189 |

- [ ] `components = []`, `nextId = 1`
- [ ] `renderDesigner()` + `updateStatsDisplay()`

### 1-2f. `recordRun()`

| 원작 | `recordCurrentRun` |
|------|--------------------|
| 호출 | `startBattle()` line 127, `checkUnlocks()` line 175 |

- [ ] `battle.activeRunMapId` null 체크
- [ ] `setMapRecord()` → `saveRecords()`
- [ ] `renderMapCards()` / `updateHud()` 호출로 별 재계산 반영

### 1-2g. `trimComponents()`

| 원작 | `trimComponentsToFrame` |
|------|-------------------------|
| 호출 | `setFrame()` line 82 |

- [ ] `filter(c => c.x + c.w <= width && c.y + c.h <= height)`

### 테스트

- [ ] `src/lib/stores/__tests__/GameManager.test.ts` (15 cases)

---

## 완료 기준

- [ ] `bun run build` 성공
- [ ] 설계판 부품 배치/삭제 가능
- [ ] 술식 저장/불러오기 가능
- [ ] 전투 후 기록 저장됨
- [ ] `GameManager.test.ts` 15+ 케이스 통과

## 산출물

| 파일 | 설명 |
|------|------|
| `svelte.config.js` | SvelteKit 빌드 설정 |
| `vite.config.ts` | adapter/paths 제거 |
| `src/lib/stores/game.ts` | 7개 메서드 구현 |
| `src/lib/stores/__tests__/GameManager.test.ts` | 단위 테스트 |
| `tests/smoke/build.test.ts` | 빌드 스모크 테스트 |
