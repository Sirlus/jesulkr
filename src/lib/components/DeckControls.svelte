<script lang="ts">
  import { gameState } from '$lib/stores/gameState.svelte';
  import { game } from '$lib/stores/game';
  import { t } from '$lib/game/i18n';

  let selectedDeck = $state(0);
  let deckName = $state('');

  $effect(() => {
    deckName = gameState.deckNames[selectedDeck] || `${t('deck')} ${selectedDeck + 1}`;
  });

  const deck = $derived(gameState.decks[selectedDeck] || []);
  const savedCount = $derived(deck.filter(Boolean).length);
  const currentCount = $derived(gameState.slots.filter(Boolean).length);
</script>

<div class="deckControls">
  <div class="deckHead">
    <b>{t('deck.manager')}</b>
    <span>{t('deck.max.count')}</span>
  </div>

  <div class="deckRow deckNameRow">
    <select bind:value={selectedDeck}>
      {#each Array.from({ length: 10 }, (_, i) => i) as i}
        <option value={i}>{gameState.deckNames[i] || `${t('deck')} ${i + 1}`}</option>
      {/each}
    </select>
    <input bind:value={deckName} maxlength="18" placeholder={t('deck.name')} />
    <button onclick={() => game.saveDeckName(selectedDeck, deckName)}>
      {t('save.name')}
    </button>
  </div>

  <div class="deckRow">
    <button onclick={() => game.saveCurrentSlotsToDeck(selectedDeck)}>
      {t('save.to.deck')}
    </button>
    <button onclick={() => game.loadDeckToSlots(selectedDeck)}>
      {t('load.deck')}
    </button>
  </div>

  <div class="deckStatus">
    {gameState.deckNames[selectedDeck] || `${t('deck')} ${selectedDeck + 1}`}: {savedCount}/5 {t('saved')} ·
    {t('current.slots')}: {currentCount}/5
  </div>
</div>
