<script lang="ts">
  import { gameState } from '$lib/stores/gameState.svelte';
  import { game } from '$lib/stores/game';
  import { t } from '$lib/game/i18n';
  import { STAR_THRESHOLDS, STAR_MANA_REGEN, MANA_BONUS_STAR_COUNT } from '$lib/game/constants';
  import * as Storage from '$lib/game/core/Storage';

  let showModal = $state(false);
  let unlockCode = $state('');

  const totalStars = $derived(gameState.totalStars);
  const regen = $derived(gameState.effectiveManaRegen);

  export function open() {
    if (gameState.state === 'battle') game.togglePause();
    showModal = true;
  }

  export function close() {
    showModal = false;
  }

  function selectMap(mapId: number) {
    if (!game.isMapUnlocked(mapId)) return;
    game.setCurrentMap(mapId);
    close();
    game.startBattle();
  }

  function tryUnlock() {
    game.tryUnlockAllMaps(unlockCode.trim());
    unlockCode = '';
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
          onclick={() => game.setRunMode('assist')}
        >
          {t('auto.mode')}
        </button>
        <button
          class:active={gameState.selectedRunMode === 'pure'}
          onclick={() => game.setRunMode('pure')}
        >
          {t('manual.mode')}
        </button>
      </div>

      <div class="mapCards">
        {#each [1, 2, 3] as mapId}
          {@const map = game.getMap(mapId)}
          {@const unlocked = game.isMapUnlocked(mapId)}
          {@const active = gameState.currentMap?.id === mapId}
          {@const stars = game.getMapStars(mapId)}
          {@const thresholds = STAR_THRESHOLDS[mapId] || []}
          {@const assistRec = Storage.getMapRecord(gameState.records, mapId, 'assist')}
          {@const pureRec = Storage.getMapRecord(gameState.records, mapId, 'pure')}

          <div class="mapCard" class:active class:locked={!unlocked}>
            <h3>{map?.name}</h3>
            <div class="mapDesc">{map?.desc}</div>
            <div class="mapUnlock">
              {t('status')}: <b>{unlocked ? t('unlocked') : t(game.getUnlockText(mapId))}</b>
            </div>
            <div class="mapRecordGrid">
              <div class="mapRecord">
                <span>{t('auto.best')}</span>
                <b>{(assistRec.score || 0).toLocaleString()}</b>{t('pts')}
                <span class="starLine">{game.renderStars(stars)}</span>
              </div>
              <div class="mapRecord">
                <span>{t('pure.best')}</span>
                <b>{(pureRec.score || 0).toLocaleString()}</b>{t('pts')}
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
              disabled={!unlocked || !gameState.hasSavedSpell()}
              onclick={() => selectMap(mapId)}
            >
              {#if !unlocked}
                {t('locked')}
              {:else if !gameState.hasSavedSpell()}
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
