<script lang="ts">
  import { gameState } from '$lib/stores/gameState.svelte';
  import { game } from '$lib/stores/game';
  import { t } from '$lib/game/i18n';
  import SlotCard from './SlotCard.svelte';
  import SpeedButton from './SpeedButton.svelte';

  const displayMap = $derived(gameState.currentMap?.shortName || '-');
  const displayScore = $derived(gameState.battle.score);
</script>

<aside class="panel slotPanel">
  <div class="battleTopHud">
    <div>{t('map')} <b>{displayMap}</b></div>
    <div>{t('score')} <b>{displayScore}</b></div>
    <div>{t('mana')} <b>{gameState.battle.mana.toFixed(1)} / 20</b></div>
    <div>{t('base.hp')} <b>{Math.max(0, gameState.battle.baseHp)}</b></div>
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
      oninput={(e) => game.autoManaReserve = Number(e.currentTarget.value)}
      onchange={() => game.saveAutoManaReserve()}
    />
  </label>

  <div class="panelTitle">
    <span>{t('spell.slots')}</span>
  </div>

  <div class="slots">
    {#each gameState.slots as spell, i}
      <SlotCard index={i} {spell} />
    {/each}
  </div>
</aside>
