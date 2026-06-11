<script lang="ts">
  import { game } from '$lib/stores/game';
  import * as Storage from '$lib/game/core/Storage';

  let langLoaded = $state(typeof window !== 'undefined' ? Storage.loadLanguage() : null);

  function onSelectLang(lang: 'ko' | 'en') {
    langLoaded = lang;
    game.setLanguage(lang);
  }
</script>

{#if !langLoaded}
<div id="languageModal" class="languageModal">
  <div class="languageBox">
    <div class="languageLogo">Jesulkr</div>
    <div class="languageSub">언어를 선택하세요.<br>Select your language.</div>
    <div class="languageButtons">
      <button type="button" onclick={() => onSelectLang('ko')}>한국어</button>
      <button type="button" onclick={() => onSelectLang('en')}>English</button>
    </div>
    <div class="languageFoot">처음 선택한 언어는 이 브라우저에 저장됩니다.</div>
  </div>
</div>
{/if}
