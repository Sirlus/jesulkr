<script lang="ts">
  import { gameState } from '$lib/stores/gameState.svelte';
  import { game } from '$lib/stores/game';
  import { t } from '$lib/game/i18n';
  import { TOOL_ORDER, TOOL_DESCRIPTIONS, CELL, GAP } from '$lib/game/constants';
  import { applyMobileDesignerScale } from '$lib/game/utils/mobile';
  import StatCard from './StatCard.svelte';
  import PlacementGhost from './PlacementGhost.svelte';

  let selectedSlot = $state(0);
  let boardEl = $state<HTMLElement | null>(null);

  const stats = $derived(game.spellStats());
  const boardWidth = $derived(gameState.designer.width * (CELL + GAP) - GAP);
  const boardHeight = $derived(gameState.designer.height * (CELL + GAP) - GAP);

  $effect(() => {
    if (!boardEl) return;
    boardWidth;
    boardHeight;
    applyMobileDesignerScale(boardEl, gameState.designer.width, gameState.designer.height);
  });

  function onBoardMouseDown(e: MouseEvent) {
    game.onDesignBoardMouseDown(e);
  }

  function onBoardMouseMove(e: MouseEvent) {
    game.onDesignBoardMouseMove(e);
    const coord = game.getBoardGridCoordFromPointer(e);
    if (coord) {
      game.setDesignerPreview(Math.floor(coord.gx), Math.floor(coord.gy));
    }
  }

  function onBoardMouseUp() {
    game.endDrag();
    game.clearDesignerPreview();
  }

  function onBoardMouseLeave() {
    game.endDrag();
    game.clearDesignerPreview();
  }

  function onBoardWheel(e: WheelEvent) {
    e.preventDefault();
    game.rotateTool();
  }

  function onBoardTouchStart(e: TouchEvent) {
    if (e.touches.length !== 1) return;
    const t = e.touches[0];
    e.preventDefault();
    game.onDesignBoardMouseDown({ clientX: t.clientX, clientY: t.clientY, button: 0, preventDefault: () => {} } as MouseEvent);
  }

  function onBoardTouchMove(e: TouchEvent) {
    if (e.touches.length !== 1) return;
    const t = e.touches[0];
    e.preventDefault();
    onBoardMouseMove({ clientX: t.clientX, clientY: t.clientY } as MouseEvent);
  }

  function onBoardTouchEnd() {
    onBoardMouseUp();
  }
</script>

<section
  id="designerPanel"
  class="panel designerPanel"
  class:hidden={gameState.state !== 'design'}
>
  <div class="panelTitle">
    <span>{t('spell.designer')}</span>
    <button class="designerCloseBtn" onclick={() => game.toggleDesigner()}>
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
            onchange={(e) => game.setFrame(Number(e.currentTarget.value), gameState.designer.height)}
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
            onchange={(e) => game.setFrame(gameState.designer.width, Number(e.currentTarget.value))}
          >
            {#each Array.from({ length: 11 }, (_, i) => i + 1) as n}
              <option value={n}>{n}</option>
            {/each}
          </select>
        </label>
        <button onclick={() => game.rotateTool()}>
          {gameState.designer.rotation === 0 ? t('rotate.horizontal') : t('rotate.vertical')}
        </button>
      </div>

      <div id="toolBar" class="toolBar">
        {#each TOOL_ORDER as tool}
          {@const info = TOOL_DESCRIPTIONS[tool]}
          {@const unlocked = game.isToolUnlocked(tool)}
          <button
            class="toolBtn"
            class:active={gameState.designer.tool === tool}
            class:locked={!unlocked}
            data-tool={tool}
            disabled={!unlocked}
            title={unlocked ? info.name : `${info.name} - ${t('locked.tool')}`}
            aria-label={info.name}
            onclick={() => { game.setTool(tool); }}
          >
            <span class="toolIconSvg"><span class="toolIcon {tool}"></span></span>
          </button>
        {/each}
      </div>

      <div id="toolInfo" class="toolInfo">
        {#if gameState.designer.tool && TOOL_DESCRIPTIONS[gameState.designer.tool]}
          <b>{TOOL_DESCRIPTIONS[gameState.designer.tool].name}</b>
          <div class="small">{TOOL_DESCRIPTIONS[gameState.designer.tool].text}</div>
        {:else}
          {t('select.tool')}
        {/if}
      </div>

      <div class="boardWrap">
        <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
        <div
          bind:this={boardEl}
          id="designBoard"
          class="designBoard"
          role="application"
          aria-label="{t('spell.designer')}"
          style:width="{boardWidth}px"
          style:height="{boardHeight}px"
          onmousedown={onBoardMouseDown}
          onmousemove={onBoardMouseMove}
          onmouseup={onBoardMouseUp}
          onmouseleave={onBoardMouseLeave}
          ontouchstart={onBoardTouchStart}
          ontouchmove={onBoardTouchMove}
          ontouchend={onBoardTouchEnd}
          onwheel={onBoardWheel}
          oncontextmenu={(e) => e.preventDefault()}
        >
          {#each Array.from({ length: gameState.designer.height }, (_, y) => y) as y}
            {#each Array.from({ length: gameState.designer.width }, (_, x) => x) as x}
              <div
                class="gridCell"
                style:left="{x * (CELL + GAP)}px"
                style:top="{y * (CELL + GAP)}px"
                style:width="{CELL}px"
                style:height="{CELL}px"
              ></div>
            {/each}
          {/each}

          {#each gameState.designer.components as c (c.id)}
            <div
              class="piece {c.type}"
              class:vertical={c.h > c.w}
              style:left="{c.x * (CELL + GAP)}px"
              style:top="{c.y * (CELL + GAP)}px"
              style:width="{c.w * CELL + (c.w - 1) * GAP}px"
              style:height="{c.h * CELL + (c.h - 1) * GAP}px"
            ></div>
          {/each}

          <PlacementGhost />
        </div>
      </div>
    </div>

    <div class="sideControls">
      <label>
        {t('spell.name')}
        <input id="spellName" maxlength="18" placeholder={t('unnamed.spell')} bind:value={gameState.designer.spellName} />
      </label>
      <div id="spellStats" class="statsBox">
        <div class="statGrid">
          <StatCard label={t('cooldown')} value={stats.castTime} detail={`발사 0.20초 / 쿨 ${(stats.castTime * 0.05).toFixed(2)}초`} />
          <StatCard label={t('mana')} value={stats.manaCost} detail={`빨강 ${stats.redCount} + 파랑추가 ${stats.activeBlueCount * 2}`} />
          <StatCard label={t('normal.damage')} value={stats.damage} detail={stats.valid ? t('can.save') : t('cannot.save')} />
          <StatCard label={t('special.damage')} value={stats.aoeDamage > 0 ? `${t('scatter')} ${stats.aoeDamage}` : t('none')} />
        </div>
        <div class="breakdown">
          {#each stats.breakdown as line}
            <div>{line}</div>
          {/each}
        </div>
      </div>
      <label>
        {t('save.slot')}
        <select bind:value={selectedSlot} onchange={(e) => selectedSlot = Number(e.currentTarget.value)}>
          {#each [0, 1, 2, 3, 4] as i}
            <option value={i}>{t('slot.number', i + 1)}</option>
          {/each}
        </select>
      </label>
      <button
        id="saveBtn"
        class="good"
        disabled={!stats.valid}
        onclick={() => game.saveSpell(gameState.designer.spellName || '', Number(selectedSlot))}
      >
        {t('save.to.slot')}
      </button>
      <button onclick={() => game.clearDesign()}>{t('clear.design')}</button>
      <button id="startBattleBtn" class="good" disabled={!gameState.hasSavedSpell()} onclick={() => game.startBattle()}>
        {t('start.battle')}
      </button>
    </div>
  </div>
</section>
