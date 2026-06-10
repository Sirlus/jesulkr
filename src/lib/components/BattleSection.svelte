<script lang="ts">
  import { onMount } from 'svelte';
  import { game } from '$lib/stores/game';
  import { t } from '$lib/game/i18n';

  let canvas: HTMLCanvasElement;

  onMount(() => {
    game.initCanvas(canvas);
    return () => {
      if (game.animId) cancelAnimationFrame(game.animId);
    };
  });
</script>

<section class="panel combatPanel">
  <div class="panelTitle"><span>{t('battle.screen')}</span></div>
  <canvas id="battleCanvas" width="720" height="520" bind:this={canvas}></canvas>
  <div class="battleButtons">
    <button onclick={() => game.toggleDesigner()}>{t('open.designer')} ({game.getControlKeyLabel('toggleDesign')})</button>
    <button onclick={() => game.togglePause()}>{t('pause')} ({game.getControlKeyLabel('pause')})</button>
    <button onclick={() => game.restartBattle()}>{t('restart.battle')} ({game.getControlKeyLabel('restart')})</button>
  </div>
</section>
