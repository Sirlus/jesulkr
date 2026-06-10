# Phase 4: UI Components

> **목표**: `+page.svelte`의 176줄 monolith를 Svelte 컴포넌트로 분리하고, 명령형 DOM 조작을 선언적 템플릿으로 전환  
> **기간**: 5~7일  
> **브랜치**: `refactor/phase-4-ui` (base: `refactor/phase-3.5-v1.5`)  
> **선행 조건**: Phase 3.5 완료 (v1.5 상태/로직 통합)

---

## 4-0. 전략

> **바텀업 분리**: Leaf 컴포넌트(Toast, KeyBadge)부터 시작 → 복합 컴포넌트(SlotPanel, DesignerPanel) → 최종적으로 +page.svelte 정리

```
+page.svelte (현재 176줄)
    ↓
┌─────────────────────────────────────┐
│ LanguageModal.svelte                │  ← 최초 진입 시 표시
│ MainMenu.svelte                     │  ← 우측 상단 고정 메뉴
│ HUD.svelte                          │  ← 상단 정보 표시줄
│ BattleSection.svelte                │  ← 전투 화면 + 캔버스 + 버튼
│ SlotPanel.svelte                    │  ← 슬롯 5개 + 배속 + 마나 보존
│ DesignerPanel.svelte                │  ← 설계 화면 전체
│ MapSelectModal.svelte               │  ← 맵 선택 (Phase 5)
│ KeySettingsModal.svelte             │  ← 키 설정 (Phase 5)
│ Toast.svelte                        │  ← 토스트 알림
└─────────────────────────────────────┘
```

---

## 4-0. Phase 3.5에서 마련된 기반

Phase 3.5를 통해 다음 상태/메서드가 GameManager/Store에 통합되어 있어, Phase 4 컴포넌트에서 직접 사용 가능:

| 기반 | 위치 | Phase 4 사용처 |
|------|------|---------------|
| `game.toggleManaBonus()` | `game.ts` | `SlotPanel.svelte` 마나 복원 복원 토글 |
| `game.isToolUnlocked(tool)` | `game.ts` | `DesignerPanel.svelte` 도구 버튼 잠금 |
| `game.setDesignerPreview(x,y)` | `game.ts` | `DesignerPanel.svelte` 배치 고스트 |
| `game.tutorialSeen` | `Store.ts` | `LanguageModal.svelte` 튜토리얼 자동 표시 |
| `isMobileLayout()` | `mobile.ts` | 모든 컴포넌트 반응형 레이아웃 |
| `game.saveDeck/loadDeck/renameDeck` | `game.ts` | `DeckControls.svelte` (Phase 5) |
| `game.tryUnlockAllMaps(code)` | `game.ts` | `MapSelectModal.svelte` (Phase 5) |

---

## 4-1. Leaf 컴포넌트

### 4-1-1. `Toast.svelte`

```svelte
<!-- src/lib/components/Toast.svelte -->
<script lang="ts">
  import { gameState } from '$lib/stores/gameState.svelte';

  let visible = $state(false);
  let message = $state('');
  let type = $state<'good' | 'bad' | ''>('');
  let timer: ReturnType<typeof setTimeout>;

  export function show(text: string, toastType?: 'good' | 'bad') {
    message = text;
    type = toastType || '';
    visible = true;
    clearTimeout(timer);
    timer = setTimeout(() => { visible = false; }, 1400);
  }
</script>

<div
  id="toast"
  class:show={visible}
  class:good={type === 'good'}
  class:bad={type === 'bad'}
  role="status"
  aria-live="polite"
>
  {message}
</div>
```

**기존 대비 개선**:
- `role="status"`, `aria-live="polite"` 추가 (접근성)
- `class:` 디렉티브로 조걸 클래스
- `show()` 메서드를 외부에서 호출 가능

---

### 4-1-2. `KeyBadge.svelte`

```svelte
<!-- src/lib/components/KeyBadge.svelte -->
<script lang="ts">
  let { label }: { label: string } = $props();
</script>

<div class="keyBadge">{label}</div>
```

---

### 4-1-3. `SpeedButton.svelte`

```svelte
<!-- src/lib/components/SpeedButton.svelte -->
<script lang="ts">
  import { gameState } from '$lib/stores/gameState.svelte';
  import { gameActions } from '$lib/stores/gameActions';

  let { speed }: { speed: number } = $props();
</script>

<button
  class="speedBtn"
  class:active={gameState.battle.battleSpeed === speed}
  data-speed={speed}
  onclick={() => gameActions.setBattleSpeed(speed)}
  title="{speed}배속"
>
  x{speed}
</button>
```

---

## 4-2. 복합 컴포넌트

### 4-2-1. `SlotCard.svelte`

```svelte
<!-- src/lib/components/SlotCard.svelte -->
<script lang="ts">
  import { gameState } from '$lib/stores/gameState.svelte';
  import { gameActions } from '$lib/stores/gameActions';
  import { t } from '$lib/game/i18n';
  import KeyBadge from './KeyBadge.svelte';

  let { index, spell, cooldown }: {
    index: number;
    spell: SpellData | null;
    cooldown: number;
  } = $props();

  const isPureMode = $derived(
    (gameState.state === 'battle' || gameState.state === 'paused')
      ? (gameState.battle.activeRunMode || gameState.selectedRunMode) === 'pure'
      : gameState.selectedRunMode === 'pure'
  );

  const isAuto = $derived(gameState.slotAutoModes[index]);

  const cooldownPct = $derived(
    spell && cooldown > 0
      ? Math.min(100, (cooldown / Math.max(1, spell.castTime)) * 100)
      : 0
  );

  function onClick() {
    if (gameState.state === 'battle') {
      gameActions.castSlot(index);
    } else if (gameState.state !== 'paused' && gameState.state !== 'gameover') {
      gameActions.loadSpell(index);
    }
  }

  function toggleAuto(e: Event) {
    e.stopPropagation();
    gameActions.toggleSlotAuto(index);
  }
</script>

<div class="slot" class:empty={!spell} onclick={onClick}>
  <div class="slotHead">
    <KeyBadge label={gameActions.getSlotKeyLabel(index)} />
    <div class="slotName">{spell ? spell.name : t('empty')}</div>
  </div>

  {#if spell}
    <div class="slotStats">
      <div><span>{t('cooldown')}</span><b>{spell.castTime}t</b></div>
      <div><span>{t('mana')}</span><b>{spell.manaCost}</b></div>
      <div><span>{t('normal')}</span><b>{spell.damage}</b></div>
      <div><span>{t('special')}</span><b class="specialValue">
        {spell.aoeDamage > 0 ? `${t('scatter')} ${spell.aoeDamage}` : t('none')}
      </b></div>
    </div>

    <div class="slotModeRow">
      {#if isPureMode}
        <span>{t('cast.mode')}</span>
        <span class="manualOnlyBadge">{t('manual.mode')}</span>
      {:else}
        <span>{t('cast.mode')}</span>
        <button
          class="autoSwitch"
          class:on={isAuto}
          data-auto-slot={index}
          onclick={toggleAuto}
          type="button"
        >
          {isAuto ? t('auto') : t('manual')}
        </button>
      {/if}
    </div>
  {:else}
    <div class="small">{t('no.spell')}</div>
  {/if}

  <div class="cooldown" style="width: {cooldownPct}%"></div>
</div>
```

**기존 대비 개선**:
- `innerHTML` 제거, Svelte 템플릿 사용
- `$derived`로 쿨타임 퍼센트 자동 계산
- 클릭 핸들러가 컴포넌트 낶에 있음

---

### 4-2-2. `SlotPanel.svelte`

```svelte
<!-- src/lib/components/SlotPanel.svelte -->
<script lang="ts">
  import { gameState } from '$lib/stores/gameState.svelte';
  import { t } from '$lib/game/i18n';
  import SlotCard from './SlotCard.svelte';
  import SpeedButton from './SpeedButton.svelte';

  const displayMap = $derived(/* ... */);
  const displayScore = $derived(/* ... */);
</script>

<aside class="panel slotPanel">
  <div class="battleTopHud">
    <div>맵 <b>{displayMap?.shortName || '-'}</b></div>
    <div>점수 <b>{displayScore}</b></div>
    <div>마나 <b>{gameState.battle.mana.toFixed(1)} / 20</b></div>
    <div>기지 HP <b>{Math.max(0, gameState.battle.baseHp)}</b></div>
  </div>

  <div class="sideBattleControls">
    <div class="speedControls">
      <span>{t('speed')}</span>
      {#each [1, 2, 4, 8] as speed}
        <SpeedButton {speed} />
      {/each}
    </div>
  </div>

  <label class="autoReserveControl">
    <b>{t('auto.mana.reserve')}</b>
    <input
      type="number"
      min="0"
      max="20"
      step="1"
      value={gameState.autoManaReserve}
      oninput={(e) => gameActions.setAutoManaReserve(Number(e.currentTarget.value))}
    />
  </label>

  <div class="panelTitle">
    <span>{t('spell.slots')}</span>
  </div>

  <div class="slots">
    {#each gameState.slots as spell, i}
      <SlotCard
        index={i}
        {spell}
        cooldown={gameState.battle.cooldowns[i]}
      />
    {/each}
  </div>
</aside>
```

---

### 4-2-3. `DesignerPanel.svelte`

```svelte
<!-- src/lib/components/DesignerPanel.svelte -->
<script lang="ts">
  import { gameState } from '$lib/stores/gameState.svelte';
  import { gameActions } from '$lib/stores/gameActions';
  import { t } from '$lib/game/i18n';
  import { TOOL_ORDER, TOOL_DESCRIPTIONS } from '$lib/game/constants';

  let selectedSlot = $state(0);

  function onBoardMouseDown(e: MouseEvent) {
    if (e.button === 2) {
      e.preventDefault();
      gameActions.eraseComponent(e);
    } else if (e.button === 0) {
      gameActions.placeComponent(e);
    }
  }

  function onBoardWheel(e: WheelEvent) {
    e.preventDefault();
    gameActions.rotateTool();
  }
</script>

<section
  id="designerPanel"
  class="panel designerPanel"
  class:hidden={gameState.state !== 'design'}
>
  <div class="panelTitle">
    <span>{t('spell.designer')}</span>
    <button class="designerCloseBtn" onclick={() => gameActions.toggleDesigner()}>
      {t('to.battle')}
    </button>
  </div>

  <div class="designerLayout">
    <div>
      <div class="row">
        <label>
          {t('frame.width')}
          <select
            value={gameState.designer.width}
            onchange={(e) => gameActions.setFrame(Number(e.currentTarget.value), gameState.designer.height)}
          >
            {#each Array.from({ length: 11 }, (_, i) => i + 1) as n}
              <option value={n}>{n}</option>
            {/each}
          </select>
        </label>
        <label>
          {t('frame.height')}
          <select
            value={gameState.designer.height}
            onchange={(e) => gameActions.setFrame(gameState.designer.width, Number(e.currentTarget.value))}
          >
            {#each Array.from({ length: 11 }, (_, i) => i + 1) as n}
              <option value={n}>{n}</option>
            {/each}
          </select>
        </label>
        <button onclick={() => gameActions.rotateTool()}>
          {gameState.designer.rotation === 0 ? t('rotate.horizontal') : t('rotate.vertical')}
        </button>
      </div>

      <div id="toolBar" class="toolBar">
        {#each TOOL_ORDER as tool}
          {@const info = TOOL_DESCRIPTIONS[tool]}
          {@const unlocked = gameActions.isToolUnlocked(tool)}
          <button
            class="toolBtn"
            class:active={gameState.designer.tool === tool}
            class:locked={!unlocked}
            data-tool={tool}
            disabled={!unlocked}
            title={unlocked ? info.name : `${info.name} - ${t('requires.unlock')}`}
            onclick={() => { gameActions.setTool(tool); }}
          >
            {tool}
          </button>
        {/each}
      </div>

      <div id="toolInfo" class="toolInfo">
        {@html gameActions.renderToolInfoHtml()}
      </div>

      <div class="boardWrap">
        <div
          id="designBoard"
          class="designBoard"
          onmousedown={onBoardMouseDown}
          onwheel={onBoardWheel}
          oncontextmenu={(e) => e.preventDefault()}
        >
          <!-- 그리드 셀과 부품은 $effect로 렌더링 -->
        </div>
      </div>
    </div>

    <div class="sideControls">
      <label>
        {t('spell.name')}
        <input id="spellName" maxlength="18" placeholder={t('unnamed.spell')} />
      </label>
      <div id="spellStats" class="statsBox">
        {@html gameActions.renderStatsHtml()}
      </div>
      <label>
        {t('save.slot')}
        <select bind:value={selectedSlot}>
          {#each [0, 1, 2, 3, 4] as i}
            <option value={i}>{t('slot.number', i + 1)}</option>
          {/each}
        </select>
      </label>
      <button
        id="saveBtn"
        class="good"
        onclick={() => gameActions.saveSpell(
          (document.getElementById('spellName') as HTMLInputElement)?.value || '',
          selectedSlot
        )}
      >
        {t('save.to.slot')}
      </button>
      <button onclick={() => gameActions.clearDesign()}>{t('clear.design')}</button>
      <button id="startBattleBtn" class="good" disabled={!gameState.hasSavedSpell}>
        {t('start.battle')}
      </button>
    </div>
  </div>
</section>
```

> **참고**: `designBoard` 낶의 DOM은 아직 명령형 (`innerHTML`)일 수 있음.  
> 이는 Phase 4.3에서 완전히 선언적으로 전환.

---

### 4-2-4. `BattleCanvas.svelte`

```svelte
<!-- src/lib/components/BattleCanvas.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { gameState } from '$lib/stores/gameState.svelte';
  import { startLoop, stopLoop } from '$lib/game/battle/GameLoop';
  import { BattleRenderer } from '$lib/game/battle/BattleRenderer';

  let canvas: HTMLCanvasElement;
  let renderer: BattleRenderer;

  onMount(() => {
    renderer = new BattleRenderer(canvas);
    startLoop(() => {
      renderer.render(
        gameState.battle.monsters,
        gameState.battle.casts,
        gameState.battle.effects,
        gameState.state,
        gameState.battle.selectedTargetId,
        gameActions.stateLabel(),
        gameState.state === 'paused' ? '일시정지 중...' : '클릭으로 타겟 지정'
      );
    });

    canvas.addEventListener('click', (e) => gameActions.onCanvasClick(e));

    return () => {
      stopLoop();
    };
  });
</script>

<canvas
  id="battleCanvas"
  width="720"
  height="520"
  bind:this={canvas}
></canvas>
```

---

## 4-3. 명령형 DOM → 선언적 전환

### 4-3-1. `designBoard` 선언적 렌더링

현재 `renderDesigner()`는 `innerHTML = ''` 후 `createElement`로 DOM을 생성함.  
이를 Svelte의 `{#each}`로 전환:

```svelte
<!-- DesignerPanel.svelte 낶의 designBoard 부분 -->
<div
  id="designBoard"
  class="designBoard"
  style:width="{gameState.designer.width * 62 - 4}px"
  style:height="{gameState.designer.height * 62 - 4}px"
  onmousedown={onBoardMouseDown}
  onwheel={onBoardWheel}
  oncontextmenu={(e) => e.preventDefault()}
>
  <!-- 그리드 셀 -->
  {#each Array.from({ length: gameState.designer.height }, (_, y) => y) as y}
    {#each Array.from({ length: gameState.designer.width }, (_, x) => x) as x}
      <div
        class="gridCell"
        style:left="{x * 62}px"
        style:top="{y * 62}px"
        style:width="58px"
        style:height="58px"
      ></div>
    {/each}
  {/each}

  <!-- 부품 -->
  {#each gameState.designer.components as c (c.id)}
    <div
      class="piece {c.type}"
      class:vertical={c.h > c.w}
      style:left="{c.x * 62}px"
      style:top="{c.y * 62}px"
      style:width="{c.w * 58 + (c.w - 1) * 4}px"
      style:height="{c.h * 58 + (c.h - 1) * 4}px"
    ></div>
  {/each}

  <!-- 배치 미리보기 (Phase 5에서 추가) -->
  {#if gameState.designer.previewX !== null && gameState.designer.previewY !== null}
    <PlacementGhost />
  {/if}
</div>
```

**성고려사항**:
- `11x11` 그리드 = 121개 셀. Svelte의 `{#each}`로 충분히 처리 가능.
- `key` (c.id) 사용으로 부품 이동/삭제 시 효율적 diffing.

### 4-3-2. `spellStats` 선언적 렌더링

```svelte
<!-- DesignerPanel.svelte 낶의 spellStats 부분 -->
<div id="spellStats" class="statsBox">
  <div class="statGrid">
    <StatCard label={t('cooldown')} value={stats.castTime} detail={`발사 0.20초 / 쿨 ${stats.seconds.toFixed(2)}초`} />
    <StatCard label={t('mana')} value={stats.manaCost} detail={`빨강 ${stats.redCount} + 파랑추가 ${stats.activeBlueCount * 2}`} />
    <StatCard label={t('normal.damage')} value={stats.damage} detail={stats.valid ? t('can.save') : t('cannot.save')} />
    <StatCard label={t('special.damage')} value={stats.aoeDamage > 0 ? `${t('scatter')} ${stats.aoeDamage}` : t('none')} />
    <StatCard label={t('dpm')} value={stats.manaCost > 0 ? (stats.damage / stats.manaCost).toFixed(2) : '-'} />
    <StatCard label={t('dpt')} value={stats.castTime > 0 ? (stats.damage / stats.castTime).toFixed(2) : '-'} />
    <StatCard label={t('blue.mana')} value={stats.activeBlueCount} detail={`${t('inactive')} ${stats.inactiveBlueCount}`} />
  </div>
  <div class="breakdown">
    {#each stats.breakdown as line}
      <div>{line}</div>
    {/each}
  </div>
</div>
```

---

## 4-4. `+page.svelte` 정리

### 최종 형태

```svelte
<!-- src/routes/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { gameState } from '$lib/stores/gameState.svelte';
  import LanguageModal from '$lib/components/LanguageModal.svelte';
  import MainMenu from '$lib/components/MainMenu.svelte';
  import HUD from '$lib/components/HUD.svelte';
  import BattleSection from '$lib/components/BattleSection.svelte';
  import SlotPanel from '$lib/components/SlotPanel.svelte';
  import DesignerPanel from '$lib/components/DesignerPanel.svelte';
  import Toast from '$lib/components/Toast.svelte';

  let toastRef: Toast;

  onMount(() => {
    gameActions.initClient();
    gameActions.initCanvas();
  });

  $effect(() => {
    document.body.classList.toggle('mode-design', gameState.state === 'design');
    document.body.classList.toggle('mode-play', gameState.state !== 'design');
  });
</script>

<svelte:head>
  <title>Jesulkr</title>
</svelte:head>

<LanguageModal />
<MainMenu />
<HUD />

<div class="layout">
  <BattleSection />
  <SlotPanel />
</div>

<DesignerPanel />
<Toast bind:this={toastRef} />
```

---

## 4-5. 이벤트 핸들링 정리

### 기존

```ts
// +page.svelte onMount 낶
document.addEventListener('keydown', (e) => { /* ... */ });
```

### 개선

```svelte
<!-- +page.svelte -->
<svelte:window onkeydown={(e) => gameActions.onKeyDown(e)} />
```

또는 `GameActions`에 키보드 핸들러를 두고, Svelte의 이벤트 위임 사용:

```svelte
<!-- BattleSection.svelte -->
<button onclick={() => gameActions.toggleDesigner()}>
  {t('open.designer')} ({gameActions.getControlKeyLabel('toggleDesign')})
</button>
```

---

## 4-6. 검증 체크리스트

- [ ] `+page.svelte`가 50줄 이하로 정리됨
- [ ] 모든 컴포넌트가 `.svelte` 파일로 분리됨
- [ ] `document.getElementById`로 직접 조작하는 코드가 0개 (Canvas 제외)
- [ ] `innerHTML` 사용이 0개 (Canvas 2D context 제외)
- [ ] `classList.toggle`이 0개 (Svelte `class:` 디렉티브로 대체)
- [ ] `npm run check` 통과
- [ ] `npm run test` 통과
- [ ] 브라우저에서 모든 UI가 정상 동작

---

## 산출물

| 파일/브랜치 | 설명 |
|------------|------|
| `refactor/phase-4-ui` | 컴포넌트 분리 완료 |
| `src/lib/components/*.svelte` | 9개 이상의 Svelte 컴포넌트 |
| 수정된 `src/routes/+page.svelte` | 50줄 이하의 진입점 |
| 제거된 `src/lib/ui/*.ts` | DOM 조작 UI 모듈 (HUD.ts, SlotPanel.ts, Toast.ts) |
