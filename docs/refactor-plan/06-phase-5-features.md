# Phase 5: Features

> **목표**: 원작 HTML v1.3에 있으나 `jesulkr-svelte`에 누락된 기능 구현  
> **기간**: 4~5일  
> **브랜치**: `refactor/phase-5-features` (base: `refactor/phase-4-ui`)

---

## 5-0. 누락 기능 목록

| # | 기능 | 원작 구현 | 복잡도 | 우선순위 |
|---|------|----------|--------|---------|
| 1 | 맵 선택 모달 | `mapModal`, `renderMapCards` | 중간 | P1 |
| 2 | 덱 관리 UI | `deckControls`, 10개 덱 | 중간 | P1 |
| 3 | 키 설정 모달 | `keySettingsModal`, 키 캡처 | 높음 | P1 |
| 4 | 자동 마나 보존 | `autoReserveInput` | 낮음 | P2 |
| 5 | 설계 배치 미리보기 | `placementGhost` | 중간 | P2 |
| 6 | SVG 도구 아이콘 | `toolIconSvg` | 낮음 | P3 |
| 7 | 설계판 휠 회전 | `onDesignWheel` | 낮음 | P3 |
| 8 | 드래그 연속 배치 | `placingDrag` | 중간 | P2 |
| 9 | 도구 해금 UI 표시 | `locked` 클래스, 배지 | 낮음 | P2 |
| 10 | 술식 필요 맵 체크 | `getSpellRequiredMap` | 낮음 | P2 |
| 11 | 모바일 터치 지원 | `touchstart/move/end` | 중간 | P2 |
| 12 | 모바일 레이아웃 | `mobile-layout` 클래스 | 중간 | P2 |

---

## 5-1. 맵 선택 모달 (`MapSelectModal.svelte`)

### 요구사항

- 3개 맵 카드 표시 (해금/잠김/선택 상태)
- 각 맵의 별 조건, 최고 기록(assist/pure), 해금 조건 표시
- 별 총합 요약 표시
- 기록 모드 선택 버튼 (assist / pure)
- 테스트 해금 비밀번호 입력 (1111)
- 전투 시작 버튼 (해금 + 술식 저장 필요)

### 구현

```svelte
<!-- src/lib/components/MapSelectModal.svelte -->
<script lang="ts">
  import { gameState } from '$lib/stores/gameState.svelte';
  import { gameActions } from '$lib/stores/gameActions';
  import { t } from '$lib/game/i18n';
  import { STAR_THRESHOLDS } from '$lib/game/constants';
  import * as Storage from '$lib/game/core/Storage';

  let showModal = $state(false);
  let unlockCode = $state('');

  const totalStars = $derived(gameState.totalStars);
  const regen = $derived(gameState.effectiveManaRegen);

  function open() {
    if (gameState.state === 'battle') gameActions.togglePause();
    showModal = true;
  }

  function close() {
    showModal = false;
  }

  function selectMap(mapId: number) {
    if (!gameActions.isMapUnlocked(mapId)) return;
    gameActions.setCurrentMap(mapId);
    close();
    gameActions.startBattle();
  }

  function tryUnlock() {
    if (unlockCode.trim() === '1111') {
      gameActions.unlockAllMaps();
      unlockCode = '';
    } else {
      gameActions.showToast(t('wrong.password'), 'bad');
    }
  }
</script>

{#if showModal}
  <div class="mapModal" role="dialog" aria-modal="true" aria-labelledby="mapSelectTitle">
    <div class="mapBox">
      <div class="panelTitle">
        <span id="mapSelectTitle">{t('map.select')}</span>
        <button onclick={close}>{t('close')}</button>
      </div>

      <div class="mapStarSummary">
        ★ {totalStars}/9
        <span>{t('star.bonus.info', MANA_BONUS_STAR_COUNT, STAR_MANA_REGEN, regen)}</span>
      </div>

      <div class="runModeRow">
        <span>{t('record.mode')}</span>
        <button
          class:active={gameState.selectedRunMode === 'assist'}
          onclick={() => gameActions.setRunMode('assist')}
        >
          {t('auto.mode')}
        </button>
        <button
          class:active={gameState.selectedRunMode === 'pure'}
          onclick={() => gameActions.setRunMode('pure')}
        >
          {t('manual.mode')}
        </button>
      </div>

      <div class="mapCards">
        {#each [1, 2, 3] as mapId}
          {@const map = gameActions.getMap(mapId)}
          {@const unlocked = gameActions.isMapUnlocked(mapId)}
          {@const active = gameState.currentMap?.id === mapId}
          {@const stars = gameActions.getMapStars(mapId)}
          {@const thresholds = STAR_THRESHOLDS[mapId] || []}
          {@const assistRec = Storage.getMapRecord(gameState.records, mapId, 'assist')}
          {@const pureRec = Storage.getMapRecord(gameState.records, mapId, 'pure')}

          <div class="mapCard" class:active class:locked={!unlocked}>
            <h3>{map.name}</h3>
            <div class="mapDesc">{map.desc}</div>
            <div class="mapUnlock">
              {t('status')} <b>{unlocked ? t('unlocked') : t(gameActions.getUnlockText(mapId))}</b>
            </div>
            <div class="mapRecordGrid">
              <div class="mapRecord">
                <span>{t('auto.best')}</span>
                <b>{assistRec.score.toLocaleString()}</b>{t('pts')}
                <span class="starLine">{gameActions.renderStars(stars)}</span>
              </div>
              <div class="mapRecord">
                <span>{t('pure.best')}</span>
                <b>{pureRec.score.toLocaleString()}</b>{t('pts')}
              </div>
            </div>
            <div class="mapThreshold">
              {t('star.requirements')}<br>
              ★1 {thresholds[0]?.toLocaleString()}{t('pts')} ·
              ★2 {thresholds[1]?.toLocaleString()}{t('pts')} ·
              ★3 {thresholds[2]?.toLocaleString()}{t('pts')}
            </div>
            <button
              class:good={unlocked}
              disabled={!unlocked || !gameState.hasSavedSpell}
              onclick={() => selectMap(mapId)}
            >
              {#if !unlocked}
                {t('locked')}
              {:else if !gameState.hasSavedSpell}
                {t('spell.needed')}
              {:else}
                {t('start.battle.with.mode', gameState.selectedRunMode)}
              {/if}
            </button>
          </div>
        {/each}
      </div>

      <div class="unlockCodeRow">
        <span>{t('unlock.password')}</span>
        <input bind:value={unlockCode} onkeydown={(e) => e.key === 'Enter' && tryUnlock()} />
        <button onclick={tryUnlock}>{t('unlock.all')}</button>
      </div>
    </div>
  </div>
{/if}
```

---

## 5-2. 덱 관리 UI (`DeckControls.svelte`)

### 요구사항

- 10개 덱 선택 드롭다운
- 덱 이름 편집/저장
- 현재 5개 슬롯 → 덱 저장
- 덱 → 현재 슬롯 불러오기
- 덱 상태 표시 (몇 개 저장됨)

### 구현

```svelte
<!-- src/lib/components/DeckControls.svelte -->
<script lang="ts">
  import { gameState } from '$lib/stores/gameState.svelte';
  import { gameActions } from '$lib/stores/gameActions';
  import { t } from '$lib/game/i18n';

  let selectedDeck = $state(0);
  let deckName = $state('');

  $effect(() => {
    deckName = gameState.deckNames[selectedDeck] || `${t('deck')} ${selectedDeck + 1}`;
  });

  const deck = $derived(gameState.decks[selectedDeck] || []);
  const savedCount = $derived(deck.filter(Boolean).length);
  const currentCount = $derived(gameState.slots.filter(Boolean).length);
</script>

<div class="deckControls">
  <div class="deckHead">
    <b>{t('deck.manager')}</b>
    <span>{t('deck.max.count')}</span>
  </div>

  <div class="deckRow deckNameRow">
    <select bind:value={selectedDeck}>
      {#each Array.from({ length: 10 }, (_, i) => i) as i}
        <option value={i}>{gameState.deckNames[i] || `${t('deck')} ${i + 1}`}</option>
      {/each}
    </select>
    <input bind:value={deckName} maxlength="18" placeholder={t('deck.name')} />
    <button onclick={() => gameActions.saveDeckName(selectedDeck, deckName)}>
      {t('save.name')}
    </button>
  </div>

  <div class="deckRow">
    <button onclick={() => gameActions.saveCurrentSlotsToDeck(selectedDeck)}>
      {t('save.to.deck')}
    </button>
    <button onclick={() => gameActions.loadDeckToSlots(selectedDeck)}>
      {t('load.deck')}
    </button>
  </div>

  <div class="deckStatus">
    {gameState.deckNames[selectedDeck]}: {savedCount}/5 {t('saved')} ·
    {t('current.slots')}: {currentCount}/5
  </div>
</div>
```

---

## 5-3. 키 설정 모달 (`KeySettingsModal.svelte`)

### 요구사항

- 5개 슬롯 키 + 8개 조작 키 표시
- 키 클릭 → 새 키 입력 대기 상태
- Esc로 취소
- 중복 키 검사
- 모든 키 기본값 초기화

### 구현

```svelte
<!-- src/lib/components/KeySettingsModal.svelte -->
<script lang="ts">
  import { gameState } from '$lib/stores/gameState.svelte';
  import { gameActions } from '$lib/stores/gameActions';
  import { t } from '$lib/game/i18n';
  import { CONTROL_ACTIONS } from '$lib/game/constants';

  let showModal = $state(false);
  let captureTarget = $state<{ type: 'slot'; index: number } | { type: 'control'; id: string } | null>(null);

  function open() {
    showModal = true;
    captureTarget = null;
  }

  function close() {
    showModal = false;
    captureTarget = null;
  }

  function startCapture(target: typeof captureTarget) {
    captureTarget = target;
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (!showModal) return;
    if (!captureTarget) {
      if (e.key === 'Escape') close();
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    if (e.key === 'Escape') {
      captureTarget = null;
      gameActions.showToast(t('key.cancel'));
      return;
    }

    const binding = gameActions.eventToBinding(e);
    if (!binding) {
      gameActions.showToast(t('key.invalid'), 'bad');
      return;
    }

    const conflict = gameActions.findBindingConflict(captureTarget, binding);
    if (conflict) {
      gameActions.showToast(t('key.conflict', conflict), 'bad');
      return;
    }

    gameActions.setBinding(captureTarget, binding);
    gameActions.showToast(t('key.set', gameActions.bindingNameForTarget(captureTarget), binding.label), 'good');
    captureTarget = null;
  }
</script>

<svelte:window onkeydown={handleKeyDown} />

{#if showModal}
  <div class="keySettingsModal" role="dialog" aria-modal="true">
    <div class="keySettingsBox">
      <div class="panelTitle">
        <span>{t('key.settings')}</span>
        <button onclick={close}>{t('close')}</button>
      </div>

      <div class="keySettingsGrid">
        <div class="keySettingSection">
          <h3>{t('spell.slots')}</h3>
          {#each [0, 1, 2, 3, 4] as i}
            <div class="keySettingRow">
              <span>{t('slot.number', i + 1)}<small>{t('slot.key.desc')}</small></span>
              <button
                class:capturing={captureTarget?.type === 'slot' && captureTarget.index === i}
                onclick={() => startCapture({ type: 'slot', index: i })}
              >
                {captureTarget?.type === 'slot' && captureTarget.index === i
                  ? t('key.press')
                  : gameActions.getSlotKeyLabel(i)}
              </button>
            </div>
          {/each}
        </div>

        <div class="keySettingSection">
          <h3>{t('common.controls')}</h3>
          {#each CONTROL_ACTIONS as action}
            <div class="keySettingRow">
              <span>{action.name}<small>{action.desc}</small></span>
              <button
                class:capturing={captureTarget?.type === 'control' && captureTarget.id === action.id}
                onclick={() => startCapture({ type: 'control', id: action.id })}
              >
                {captureTarget?.type === 'control' && captureTarget.id === action.id
                  ? t('key.press')
                  : gameActions.getControlKeyLabel(action.id)}
              </button>
            </div>
          {/each}
        </div>
      </div>

      <div class="keySettingsFooter">
        <button onclick={() => gameActions.resetKeyBindings()}>
          {t('reset.all.keys')}
        </button>
      </div>
    </div>
  </div>
{/if}
```

---

## 5-4. 자동 마나 보존 (`AutoReserveControl`)

이미 `SlotPanel.svelte`에 input이 있으나, `gameState.autoManaReserve`와의 양방향 바인딩 필요:

```svelte
<input
  type="number"
  min="0"
  max="20"
  step="1"
  bind:value={gameState.autoManaReserve}
  onchange={() => gameActions.saveAutoManaReserve()}
/>
```

---

## 5-5. 설계 배치 미리보기 (`PlacementGhost`)

```svelte
<!-- src/lib/components/PlacementGhost.svelte -->
<script lang="ts">
  import { gameState } from '$lib/stores/gameState.svelte';
  import { gameActions } from '$lib/stores/gameActions';
  import { dimensionsFor, canPlaceComponent } from '$lib/game/designer/Components';

  const preview = $derived(
    gameState.designer.previewX !== null && gameState.designer.previewY !== null
      ? gameActions.createComponentFromGridCoord(
          gameState.designer.tool,
          gameState.designer.previewX,
          gameState.designer.previewY
        )
      : null
  );

  const isValid = $derived(
    preview && canPlaceComponent(preview, gameState.designer.components, gameState.designer.width, gameState.designer.height)
  );
</script>

{#if preview}
  {#each Array.from({ length: preview.h }, (_, dy) => dy) as dy}
    {#each Array.from({ length: preview.w }, (_, dx) => dx) as dx}
      {@const px = preview.x + dx}
      {@const py = preview.y + dy}
      {#if px >= 0 && py >= 0 && px < gameState.designer.width && py < gameState.designer.height}
        <div
          class="placementCellHint"
          class:invalid={!isValid}
          style:left="{px * 62}px"
          style:top="{py * 62}px"
          style:width="58px"
          style:height="58px"
        ></div>
      {/if}
    {/each}
  {/each}

  <div
    class="piece placementGhost"
    class:invalid={!isValid}
    style:left="{preview.x * 62}px"
    style:top="{preview.y * 62}px"
    style:width="{preview.w * 58 + (preview.w - 1) * 4}px"
    style:height="{preview.h * 58 + (preview.h - 1) * 4}px"
  ></div>
{/if}
```

---

## 5-6. 모바일 지원

### 5-6-1. 모바일 감지 및 클래스 토글

```ts
// src/lib/utils/mobile.ts
export function isMobileLayout(): boolean {
  return window.matchMedia('(pointer: coarse)').matches ||
         window.matchMedia('(max-width: 820px)').matches;
}

export function updateMobileLayout() {
  document.body.classList.toggle('mobile-layout', isMobileLayout());
}
```

```svelte
<!-- +page.svelte -->
<svelte:window
  onresize={updateMobileLayout}
  onorientationchange={updateMobileLayout}
/>
```

### 5-6-2. 터치 이벤트

```svelte
<!-- DesignerPanel.svelte -->
<div
  id="designBoard"
  ontouchstart={(e) => {
    if (e.touches.length !== 1) return;
    const t = e.touches[0];
    onBoardMouseDown({ clientX: t.clientX, clientY: t.clientY, button: 0, preventDefault: () => e.preventDefault() } as MouseEvent);
  }}
  ontouchmove={(e) => {
    if (e.touches.length !== 1) return;
    const t = e.touches[0];
    gameActions.onDesignBoardMouseMove({ clientX: t.clientX, clientY: t.clientY } as MouseEvent);
  }}
  ontouchend={() => {
    gameActions.endDrag();
  }}
></div>
```

### 5-6-3. 디자이너 보드 스케일링

```ts
// src/lib/utils/mobile.ts
export function applyMobileDesignerScale(board: HTMLElement, width: number, height: number) {
  if (!isMobileLayout() || !board.parentElement) {
    board.style.transform = '';
    return;
  }
  const wrap = board.parentElement;
  const fullW = width * 62 - 4;
  const available = Math.max(220, wrap.clientWidth - 12);
  const scale = Math.min(1, available / Math.max(1, fullW));
  board.style.transform = `scale(${scale.toFixed(4)})`;
  board.style.transformOrigin = 'top center';
}
```

---

## 5-7. 드래그 연속 배치

```ts
// gameActions.ts
placingDrag = $state(false);
erasingDrag = $state(false);
lastDragPlaceKey = $state<string | null>(null);

onDesignBoardMouseDown(e: MouseEvent) {
  if (e.button === 2) {
    this.erasingDrag = true;
    this.eraseComponent(e);
  } else if (e.button === 0 && gameState.designer.tool !== 'eraser') {
    this.placingDrag = true;
    this.placeComponent(e);
  }
}

onDesignBoardMouseMove(e: MouseEvent) {
  if (this.erasingDrag && gameState.designer.tool === 'eraser') {
    this.eraseComponent(e);
  } else if (this.placingDrag && gameState.designer.tool !== 'eraser') {
    const coord = this.getBoardGridCoordFromPointer(e);
    if (!coord) return;
    const comp = createComponentFromGridCoord(gameState.designer.tool, coord.gx, coord.gy);
    const key = `${comp.type}:${comp.x},${comp.y}:${comp.w}x${comp.h}:${comp.rotation}`;
    if (this.lastDragPlaceKey === key) return;
    this.lastDragPlaceKey = key;
    if (canPlaceComponent(comp, gameState.designer.components, gameState.designer.width, gameState.designer.height)) {
      gameState.designer.components = [...gameState.designer.components, comp];
      gameState.designer.nextId++;
    }
  }
}

endDrag() {
  this.placingDrag = false;
  this.erasingDrag = false;
  this.lastDragPlaceKey = null;
}
```

---

## 5-8. 검증 체크리스트

- [ ] 맵 선택 모달 열기/닫기/맵 선택/전투 시작
- [ ] 덱 저장/불러오기/이름 변경
- [ ] 키 설정 캡처/중복 검사/저장/초기화
- [ ] 자동 마나 보존 값 저장/적용
- [ ] 설계 배치 미리보기 표시/유효성 색상
- [ ] 모바일에서 디자이너 보드 스케일링
- [ ] 터치로 설계판 배치/삭제
- [ ] 드래그 연속 배치
- [ ] 도구 해금 시 잠금 표시
- [ ] 해금되지 않은 부품 포함 술식 저장 시 경고

---

## 산출물

| 파일/브랜치 | 설명 |
|------------|------|
| `refactor/phase-5-features` | 완전한 기능 세트 |
| `MapSelectModal.svelte` | 맵 선택 |
| `DeckControls.svelte` | 덱 관리 |
| `KeySettingsModal.svelte` | 키 설정 |
| `PlacementGhost.svelte` | 배치 미리보기 |
| `mobile.ts` | 모바일 유틸리티 |
