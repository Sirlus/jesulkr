<script lang="ts">
  import { gameState } from '$lib/stores/gameState.svelte';
  import { game } from '$lib/stores/game';

  let { speed }: { speed: number } = $props();
</script>

<button
  class="speedBtn"
  class:active={gameState.battle.battleSpeed === speed}
  data-speed={speed}
  onclick={() => game.setBattleSpeed(speed)}
  title="{speed}배속"
>
  x{speed}
</button>
