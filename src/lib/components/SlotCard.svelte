<script lang="ts">
  import { gameState } from '$lib/stores/gameState.svelte';
  import { game } from '$lib/stores/game';
  import * as Storage from '$lib/game/core/Storage';
  import { t } from '$lib/game/i18n';
  import KeyBadge from './KeyBadge.svelte';

  let { index }: { index: number } = $props();

  const spell = $derived(gameState.slots[index]);
  const cooldown = $derived(gameState.battle.cooldowns[index]);
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
      game.castSlot(index);
    } else if (gameState.state !== 'paused' && gameState.state !== 'gameover') {
      game.loadSpell(index);
    }
  }

  function toggleAuto(e: Event) {
    e.stopPropagation();
    gameState.slotAutoModes[index] = !gameState.slotAutoModes[index];
    Storage.saveSlotAutoModes(gameState.slotAutoModes);
  }
</script>

<div class="slot" class:empty={!spell} role="button" tabindex="0" onclick={onClick} onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}>
  <div class="slotHead">
    <KeyBadge label={game.getSlotKeyLabel(index)} />
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
