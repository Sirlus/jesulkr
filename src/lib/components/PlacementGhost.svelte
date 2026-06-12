<script lang="ts">
  import { gameState } from '$lib/stores/gameState.svelte';
  import { createComponentFromGridCoord, canPlaceComponent } from '$lib/game/designer/Components';

  const preview = $derived(
    gameState.designer.previewX !== null && gameState.designer.previewY !== null
      ? createComponentFromGridCoord(
          gameState.designer.tool,
          gameState.designer.previewX,
          gameState.designer.previewY,
          gameState.designer.nextId,
          gameState.designer.rotation,
          gameState.designer.tool === 'extractor' ? gameState.designer.extractorColor : undefined,
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
    class="piece placementGhost {preview.type}"
    class:invalid={!isValid}
    class:extractor-red={preview.type === 'extractor' && preview.color === 'red'}
    class:extractor-blue={preview.type === 'extractor' && preview.color === 'blue'}
    class:extractor-green={preview.type === 'extractor' && preview.color === 'green'}
    style:left="{preview.x * 62}px"
    style:top="{preview.y * 62}px"
    style:width="{preview.w * 58 + (preview.w - 1) * 4}px"
    style:height="{preview.h * 58 + (preview.h - 1) * 4}px"
  ></div>
{/if}
