<script lang="ts">
  import { gameState } from '$lib/stores/gameState.svelte';
  import { game } from '$lib/stores/game';
  import { MAX_MANA } from '$lib/game/constants';
  import { t } from '$lib/game/i18n';

  const stateLabel = $derived(game.stateLabel());
</script>

<div class="hud">
  <div class="title">Jesulkr</div>
  <div class="hudItem">{t('score')} <b>{gameState.battle.score}</b></div>
  <div class="hudItem">{t('mana')} <b>{gameState.battle.mana.toFixed(1)} / {MAX_MANA} (+{gameState.effectiveManaRegen}/s)</b></div>
  <div class="hudItem">{t('base.hp')} <b>{Math.max(0, gameState.battle.baseHp)}</b></div>
  <div class="hudItem">{t('survival')} <b>{Math.floor(gameState.battle.survival)}{t('seconds')}</b></div>
  <div class="hudItem">{t('state')} <b>{stateLabel}</b></div>
  <div class="hudItem">{t('map')} <b>{gameState.currentMap?.shortName || '-'}</b></div>
</div>
