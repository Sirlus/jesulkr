<script lang="ts">
  import { onMount } from 'svelte';
  import { game } from '$lib/stores/game';
  import * as Storage from '$lib/game/core/Storage';
  import { updateMobileLayout } from '$lib/game/utils/mobile';
  import '$lib/game/style.css';

  import LanguageModal from '$lib/components/LanguageModal.svelte';
  import MainMenu from '$lib/components/MainMenu.svelte';
  import HUD from '$lib/components/HUD.svelte';
  import BattleSection from '$lib/components/BattleSection.svelte';
  import SlotPanel from '$lib/components/SlotPanel.svelte';
  import DesignerPanel from '$lib/components/DesignerPanel.svelte';
  import Toast from '$lib/components/Toast.svelte';

  onMount(() => {
    game.initClient();
    updateMobileLayout();
    game.state = game.hasSavedSpell ? 'ready' : 'design';
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
</svelte:head>

<svelte:window onkeydown={onKeyDown} />

<LanguageModal />
<MainMenu />
<HUD />

<div class="layout">
  <BattleSection />
  <SlotPanel />
</div>

<DesignerPanel />
<Toast />
