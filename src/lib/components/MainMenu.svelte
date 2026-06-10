<script lang="ts">
  import { game } from '$lib/stores/game';

  let panelOpen = $state(false);

  function onSelectLang(lang: 'ko' | 'en') {
    game.setLanguage(lang);
  }
</script>

<div id="mainMenuWrap" class="mainMenuWrap">
  <button id="mainMenuBtn" class="mainMenuBtn" type="button" onclick={() => panelOpen = !panelOpen}>메뉴</button>
  <div id="mainMenuPanel" class="mainMenuPanel" class:hidden={!panelOpen}>
    <div class="mainMenuTitle">메뉴</div>
    <button id="menuKeySettingsBtn" type="button">키 설정</button>
    <div class="mainMenuLang">
      <div class="mainMenuLangLabel">언어</div>
      <div class="mainMenuLangButtons">
        <button type="button" onclick={() => onSelectLang('ko')}>한국어</button>
        <button type="button" onclick={() => onSelectLang('en')}>English</button>
      </div>
    </div>
  </div>
</div>
