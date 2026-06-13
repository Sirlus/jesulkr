<script lang="ts">
  import { game } from '$lib/stores/game';
  import { t } from '$lib/game/i18n';

  let { onOpenKeySettings, onOpenMapSelect, onToggleDeck, onStartTutorial } = $props<{
    onOpenKeySettings?: () => void;
    onOpenMapSelect?: () => void;
    onToggleDeck?: () => void;
    onStartTutorial?: () => void;
  }>();

  let panelOpen = $state(false);

  function onSelectLang(lang: 'ko' | 'en') {
    game.setLanguage(lang);
  }

  function handleAction(fn: (() => void) | undefined) {
    panelOpen = false;
    fn?.();
  }
</script>

<div id="mainMenuWrap" class="mainMenuWrap">
  <button id="mainMenuBtn" class="mainMenuBtn" type="button" onclick={() => panelOpen = !panelOpen}>{t('menu')}</button>
  <div id="mainMenuPanel" class="mainMenuPanel" class:hidden={!panelOpen}>
    <div class="mainMenuTitle">{t('menu')}</div>
    <button type="button" onclick={() => handleAction(onOpenMapSelect)}>{t('map.select')}</button>
    <button type="button" onclick={() => handleAction(onOpenKeySettings)}>{t('key.settings')}</button>
    <button type="button" onclick={() => { panelOpen = false; onToggleDeck?.(); }}>{t('deck.manager')}</button>
    <button type="button" onclick={() => handleAction(onStartTutorial)}>{t('tutorial.replay')}</button>
    <button type="button" onclick={() => { panelOpen = false; game.toggleManaBonus(); }}>⚡ 마나 보너스 ON/OFF</button>
    <button type="button" onclick={() => { panelOpen = false; game.clearAllData(); }}>{t('clear.all.data')}</button>
    <div class="mainMenuLang">
      <div class="mainMenuLangLabel">{t('language')}</div>
      <div class="mainMenuLangButtons">
        <button type="button" onclick={() => onSelectLang('ko')}>한국어</button>
        <button type="button" onclick={() => onSelectLang('en')}>English</button>
      </div>
    </div>
  </div>
</div>
