<script lang="ts">
  import { onMount } from 'svelte';
  import { game } from '$lib/stores/game';
  import { gameState } from '$lib/stores/gameState.svelte';
  import { updateMobileLayout } from '$lib/game/utils/mobile';
  import '$lib/game/style.css';
  import { getComponentStyles } from '$lib/game/designer/components/registry';

  const componentStyles = getComponentStyles();

  import LanguageModal from '$lib/components/LanguageModal.svelte';
  import SpotlightTutorial from '$lib/components/SpotlightTutorial.svelte';
  import MainMenu from '$lib/components/MainMenu.svelte';
  import HUD from '$lib/components/HUD.svelte';
  import BattleSection from '$lib/components/BattleSection.svelte';
  import SlotPanel from '$lib/components/SlotPanel.svelte';
  import DesignerPanel from '$lib/components/DesignerPanel.svelte';
  import Toast from '$lib/components/Toast.svelte';
  import MapSelectModal from '$lib/components/MapSelectModal.svelte';
  import DeckControls from '$lib/components/DeckControls.svelte';
  import KeySettingsModal from '$lib/components/KeySettingsModal.svelte';

  let mapModal: { open: () => void; close: () => void };
  let keyModal: { open: () => void; close: () => void };
  let showDeck = $state(false);

  onMount(() => {
    game.initClient();
    updateMobileLayout();
    const hasSavedSpell = game.hasSavedSpell;
    game.state = hasSavedSpell ? 'ready' : 'design';
  });

  $effect(() => {
    const isDesign = gameState.state === 'design';
    document.body.classList.toggle('mode-design', isDesign);
    document.body.classList.toggle('mode-play', !isDesign);
  });

  function onKeyDown(e: KeyboardEvent) {
    const tag = document.activeElement?.tagName || '';
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(tag) && e.key !== 'Escape') return;
    if (e.key === 'Escape') { if (game.state === 'design') game.toggleDesigner(); return; }
    for (let i = 0; i < 5; i++) {
      const b = game.keyBindings[i];
      if (b && (e.code === b.code || e.key === b.key)) { if (game.state === 'battle') game.castSlot(i); return; }
    }
    if (e.code === 'KeyD') game.toggleDesigner();
    if (e.code === 'Space') game.togglePause();
    if (e.code === 'KeyR') game.restartBattle();
  }
</script>

<svelte:head>
  <title>Jesulkr</title>
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html `<style>${componentStyles}</style>`}
</svelte:head>

<svelte:window
  onkeydown={onKeyDown}
  onresize={() => updateMobileLayout()}
  onorientationchange={() => updateMobileLayout()}
/>

<LanguageModal />
<SpotlightTutorial />
<MainMenu
  onOpenKeySettings={() => keyModal?.open()}
  onOpenMapSelect={() => mapModal?.open()}
  onToggleDeck={() => showDeck = !showDeck}
/>
<HUD />

<div class="layout">
  <BattleSection />
  <SlotPanel />
</div>

<DesignerPanel />
<MapSelectModal bind:this={mapModal} />
{#if showDeck}
  <DeckControls />
{/if}
<KeySettingsModal bind:this={keyModal} />
<Toast />
