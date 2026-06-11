# Phase 5 Fix Plan

> **Created**: 2026-06-11 (from review)
> **Base branch**: `refactor/phase-5-features`
> **Target**: Resolve all Phase 5 integration gaps, behavioral bugs, and missing features

---

## Fix Overview

| # | Priority | Issue | Est. Effort |
|---|----------|-------|-------------|
| F1 | 🔴 P0 | MainMenu modal triggers not wired | 30min |
| F2 | 🔴 P0 | PlacementGhost not rendered in DesignerPanel | 30min |
| F3 | 🔴 P0 | DesignerPanel drag-methods not wired | 15min |
| F4 | 🟡 P1 | Auto Mana Reserve not persisted to localStorage | 5min |
| F5 | 🟡 P1 | KeySettingsModal missing toast feedback (4 cases) | 20min |
| F6 | 🟡 P1 | Mobile resize/orientation listeners missing | 10min |
| F7 | 🟡 P1 | Mobile touch events not implemented | 30min |
| F8 | 🟢 P2 | Mobile designer board scaling missing | 20min |
| F9 | 🟢 P2 | MapSelectModal.tryUnlock() dead branch | 5min |
| F10 | 🟢 P3 | Tutorial modal (P1 feature, not started) | 60min |

---

## F1: MainMenu Modal Triggers 🔴 P0

**Problem**: `MainMenu.svelte` has buttons but no `onclick` handlers. `MapSelectModal`, `KeySettingsModal`, `DeckControls` are imported in `+page.svelte` but cannot be opened. All Phase 5 features are unreachable.

**Files**: `src/lib/components/MainMenu.svelte`, `src/routes/+page.svelte`

### Plan

1. Convert `MainMenu` to accept callback props with `$props()`.
2. Add `bind:this` refs on modal components in `+page.svelte`.
3. Add a `showDeck` $state for DeckControls toggle.
4. Wire MainMenu buttons → modal open calls:
   - "키 설정" → `keyModal.open()`
   - "맵 선택" → `mapModal.open()`
   - "덱 관리" → toggle `showDeck`
   - "마나 보너스 ON/OFF" → `game.toggleManaBonus()`
   - "데이터 초기화" → `game.clearAllData()`


## F2: PlacementGhost Rendered in DesignerPanel 🔴 P0

**Problem**: `PlacementGhost.svelte` exists but is never imported/rendered. `setDesignerPreview`/`clearDesignerPreview` in `game.ts` are never called.

**Files**: `src/lib/components/DesignerPanel.svelte`

### Plan

1. Import `PlacementGhost` in `DesignerPanel.svelte`.
2. Add `onmousemove` handler on `#designBoard` calling `game.setDesignerPreview`.
3. Add `onmouseleave` handler calling `game.clearDesignerPreview`.
4. Render `<PlacementGhost />` inside `#designBoard` as sibling of grid cells.

### Acceptance
- [ ] Hovering over design board shows placement ghost
- [ ] Valid placement shows neutral ghost; invalid shows red
- [ ] Leaving the board clears the ghost
- [ ] Rotation changes update ghost shape immediately
### Acceptance
- [ ] "키 설정" button opens KeySettingsModal
- [ ] "맵 선택" button opens MapSelectModal
- [ ] "덱 관리" button toggles DeckControls visibility
- [ ] "마나 보너스 ON/OFF" calls toggleManaBonus with toast
- [ ] "데이터 초기화" calls clearAllData with toast
## F3: DesignerPanel Drag Methods Wired 🔴 P0

**Problem**: `DesignerPanel.svelte` calls `game.eraseComponent(e)` / `game.placeComponent(e)` directly, bypassing the drag state machine (`placingDrag`/`erasingDrag`/`lastDragPlaceKey`) in `game.ts` lines 497-538.

**Files**: `src/lib/components/DesignerPanel.svelte`

### Plan

Replace direct calls with `game.onDesignBoardMouseDown(e)`, `game.onDesignBoardMouseMove(e)`, and `game.endDrag()`. Add `onmouseup` handler to `#designBoard`.

### Acceptance
- [ ] Hold left mouse + drag → continuous placement of same component
- [ ] Hold right mouse + drag with eraser → continuous erasing
- [ ] Release mouse → drag state resets
- [ ] Single click still places one component

---

## F4: Auto Mana Reserve Persistence 🟡 P1

**Problem**: `SlotPanel.svelte` sets `game.autoManaReserve` but never calls `game.saveAutoManaReserve()`. Changes lost on page refresh.

**Files**: `src/lib/components/SlotPanel.svelte`

### Plan

Add `onchange={() => game.saveAutoManaReserve()}` to the autoReserveControl `<input>`.

### Acceptance
- [ ] Change auto mana reserve value, refresh page → value persists
- [ ] Value clamped to 0-20 range

---

## F5: KeySettingsModal Toast Feedback 🟡 P1

**Problem**: Key capture silently returns on invalid key, conflict, cancel, and success. Plan specifies toast messages for all four cases.

**Files**: `src/lib/components/KeySettingsModal.svelte`

### Plan

Add `import { showToast } from '$lib/game/ui/Toast';` then add:
- `showToast(t('key.invalid'), 'bad')` when `eventToBinding` returns null
- `showToast(t('key.conflict', conflict), 'bad')` when `findBindingConflict` returns a name
- `showToast(t('key.set', ...), 'good')` after successful `setBinding`
- `showToast(t('key.cancel'))` when Escape pressed during capture

### Acceptance
- [ ] Invalid key → "Invalid key" toast
- [ ] Conflicting key → "Key already in use: {name}" toast
- [ ] Valid key → "Slot {n} → {key}" toast
- [ ] Escape during capture → "Cancelled" toast

---

## F6: Mobile Resize/Orientation Listeners 🟡 P1

**Problem**: `+page.svelte` calls `updateMobileLayout()` once in `onMount`. Window resize/orientation changes not handled.

**Files**: `src/routes/+page.svelte`

### Plan

Extend `<svelte:window>` to include:
```svelte
onresize={() => updateMobileLayout()}
onorientationchange={() => updateMobileLayout()}
```

### Acceptance
- [ ] Resize below 820px → mobile-layout class added
- [ ] Resize above 820px → mobile-layout class removed
- [ ] Rotate mobile device → layout updates

---

## F7: Mobile Touch Event Support 🟡 P1

**Problem**: `DesignerPanel.svelte` has only mouse events. Touch devices cannot interact with design board.

**Files**: `src/lib/components/DesignerPanel.svelte`

### Plan

Add `ontouchstart`, `ontouchmove`, `ontouchend` handlers on `#designBoard` that translate touch events to pseudo-MouseEvents and delegate to the existing mouse/drag handlers.

### Acceptance
- [ ] Single touch on grid cell → component placed
- [ ] Touch-drag → continuous placement
- [ ] Two-finger touch → ignored
- [ ] Touch-end → drag state resets

---

## F8: Mobile Designer Board Scaling 🟢 P2

**Problem**: Plan specifies `applyMobileDesignerScale()` for scaling the design board on narrow screens but it's not implemented.

**Files**: `src/lib/game/utils/mobile.ts`, `src/lib/components/DesignerPanel.svelte`

### Plan

1. Add `applyMobileDesignerScale(board, width, height)` to `mobile.ts`.
2. Call via `$effect` in `DesignerPanel.svelte` that reacts to designer width/height changes.

### Acceptance
- [ ] Narrow viewport (<820px) → board scales down
- [ ] Wide viewport → no scaling
- [ ] Resize triggers rescaling

---

## F9: MapSelectModal Dead Branch Cleanup 🟢 P2

**Problem**: `tryUnlock()` branches are identical — both call `game.tryUnlockAllMaps()`. The if/else is dead code.

**Files**: `src/lib/components/MapSelectModal.svelte` (lines 30-37)

### Plan

Simplify to a single call: `game.tryUnlockAllMaps(unlockCode.trim()); unlockCode = '';`. The method already handles wrong password internally.

### Acceptance
- [ ] Type 1111 → all maps unlocked, toast shown
- [ ] Type wrong code → "Wrong password" toast shown
- [ ] Input cleared after submission in both cases

---

## F10: Tutorial Modal 🟢 P3 — Deferred to Phase 6

**Problem**: Tutorial modal listed as P1 but not started. State support (`tutorialSeen`) exists.

**Decision**: Defer to Phase 6. Requires `TutorialModal.svelte`, step-by-step content, i18n support, and auto-show on first visit. Does not block other Phase 5 integration.

---

## Implementation Order

```
Session 1 (P0 — ~1.5h):
  F1  MainMenu triggers
  F2  PlacementGhost integration
  F3  DesignerPanel drag wiring

Session 2 (P1 — ~1h):
  F4  Auto mana reserve persist
  F5  KeySettings toast feedback
  F6  Mobile resize listeners
  F7  Mobile touch events

Session 3 (P2 — ~30min):
  F8  Mobile board scaling
  F9  Dead branch cleanup

Validation:
  npm run check      → 0 errors
  npm run test       → 65+ tests pass
  npm run build      → success
  Manual smoke test  → all modals openable, functions work
```

---

## Final Validation Checklist

- [ ] `npm run check` — 0 errors, 0 warnings
- [ ] `npm run test` — all tests pass
- [ ] `npm run build` — builds successfully
- [ ] Map Select Modal: open → select map → start battle
- [ ] Deck Controls: save slots → switch deck → load back
- [ ] Key Settings: change key → close → key persists → reset
- [ ] Auto Mana Reserve: change value → refresh → value persists
- [ ] Placement Ghost: hover board → ghost visible → leave → ghost gone
- [ ] Drag placement: hold mouse → drag → multiple components placed
- [ ] Mobile layout: resize to <820px → layout adapts
- [ ] Touch events: touch-to-place on design board
- [ ] Tool unlock lock icons visible on locked tools
