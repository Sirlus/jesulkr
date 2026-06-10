<script lang="ts">
  import { onMount } from 'svelte';
  import { game } from '$lib/stores/game';
  import { gameRx } from '$lib/stores/game.svelte';
  import * as Storage from '$lib/game/core/Storage';
  import '$lib/game/style.css';

  let canvas: HTMLCanvasElement;
  let langLoaded = $state(typeof window !== 'undefined' ? Storage.loadLanguage() : null);

  function onSelectLang(lang: 'ko' | 'en') {
    langLoaded = lang;
    game.setLanguage(lang);
  }

  onMount(() => {
    game.initClient();
    game.initCanvas(canvas);
    game.refreshAll();

    const board = document.getElementById('designBoard');
    if (board) {
      board.addEventListener('mousedown', (e: MouseEvent) => {
        if (e.button === 2) { e.preventDefault(); game.eraseComponent(e); return; }
        if (e.button !== 0) return;
        game.placeComponent(e);
      });
      board.addEventListener('contextmenu', (e) => e.preventDefault(), { signal: ac.signal });
    }

    canvas.addEventListener('click', (e) => game.onCanvasClick(e));

    document.addEventListener('keydown', (e) => {
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
    });

    const fw = document.getElementById('frameW') as HTMLSelectElement;
    const fh = document.getElementById('frameH') as HTMLSelectElement;
    if (fw && fh) { for (let i = 1; i <= 11; i++) { fw.add(new Option(String(i))); fh.add(new Option(String(i))); } fw.value = '2'; fh.value = '2'; }

    game.state = game.hasSavedSpell ? 'ready' : 'design';

    return () => { if (game.animId) cancelAnimationFrame(game.animId); };
  });
</script>

<svelte:head>
  <title>Jesulkr</title>
</svelte:head>


{#if !langLoaded}
<div id="languageModal" class="languageModal">
  <div class="languageBox">
    <div class="languageLogo">Jesulkr</div>
    <div class="languageSub">언어를 선택하세요.<br>Select your language.</div>
    <div class="languageButtons">
      <button id="langKoBtn" type="button" onclick={() => onSelectLang('ko')}>한국어</button>
      <button id="langEnBtn" type="button" onclick={() => onSelectLang('en')}>English</button>
    </div>
    <div class="languageFoot">처음 선택한 언어는 이 브라우저에 저장됩니다.</div>
  </div>
</div>
{/if}

<div id="mainMenuWrap" class="mainMenuWrap">
  <button id="mainMenuBtn" class="mainMenuBtn" type="button" onclick={() => document.getElementById('mainMenuPanel')?.classList.toggle('hidden')}>메뉴</button>
  <div id="mainMenuPanel" class="mainMenuPanel hidden">
    <div class="mainMenuTitle">메뉴</div>
    <button id="menuKeySettingsBtn" type="button">키 설정</button>
    <div class="mainMenuLang">
      <div class="mainMenuLangLabel">언어</div>
      <div class="mainMenuLangButtons">
        <button id="menuLangKoBtn" type="button" onclick={() => onSelectLang('ko')}>한국어</button>
        <button id="menuLangEnBtn" type="button" onclick={() => onSelectLang('en')}>English</button>
      </div>
    </div>
  </div>
</div>


<div class="hud">
  <div class="title">Jesulkr</div>
  <div class="hudItem">점수 <b id="hudScore">0</b></div>
  <div class="hudItem">마나 <b id="hudMana">20 / 20</b></div>
  <div class="hudItem">기지 HP <b id="hudBase">20</b></div>
  <div class="hudItem">생존 <b id="hudTime">0초</b></div>
  <div class="hudItem">상태 <b id="hudState">설계 중</b></div>
  <div class="hudItem">맵 <b id="hudMap">-</b></div>
</div>

<div class="layout">
  <section class="panel combatPanel">
    <div class="panelTitle"><span>전투 화면</span></div>
    <canvas id="battleCanvas" width="720" height="520" bind:this={canvas}></canvas>
    <div class="battleButtons">
      <button id="openDesignerBtn" onclick={() => game.toggleDesigner()}>설계 열기 (D)</button>
      <button id="pauseBtn" onclick={() => game.togglePause()}>일시정지 (SPC)</button>
      <button id="restartBtn" onclick={() => game.restartBattle()}>전투 재시작 (R)</button>
    </div>
  </section>
  <aside class="panel slotPanel">
    <div class="sideBattleControls">
      <div class="speedControls">
        <span>배속</span>
        <button class="speedBtn active" data-speed="1" onclick={() => game.setBattleSpeed(1)}>x1</button>
        <button class="speedBtn" data-speed="2" onclick={() => game.setBattleSpeed(2)}>x2</button>
        <button class="speedBtn" data-speed="4" onclick={() => game.setBattleSpeed(4)}>x4</button>
        <button class="speedBtn" data-speed="8" onclick={() => game.setBattleSpeed(8)}>x8</button>
      </div>
    </div>
    <div class="battleTopHud">
      <div>맵 <b id="battleHudMap">-</b></div>
      <div>점수 <b id="battleHudScore">0</b></div>
      <div>마나 <b id="battleHudMana">20 / 20</b></div>
      <div>기지 HP <b id="battleHudBase">20</b></div>
    </div>
    <div class="panelTitle"><span>술식 슬롯</span></div>
    <div id="slots" class="slots"></div>
  </aside>
</div>

<section id="designerPanel" class="panel designerPanel hidden">
  <div class="panelTitle">
    <span>술식 설계</span>
    <button id="closeDesignerBtn" class="designerCloseBtn" onclick={() => game.toggleDesigner()}>전투 화면으로</button>
  </div>
  <div class="designerLayout">
    <div>
      <div class="row">
        <label>프레임 가로 <select id="frameW" onchange={(e) => game.setFrame(Number((e.target as HTMLSelectElement).value), game.designer.height)}></select></label>
        <label>세로 <select id="frameH" onchange={(e) => game.setFrame(game.designer.width, Number((e.target as HTMLSelectElement).value))}></select></label>
        <button id="rotateBtn" onclick={() => { game.rotateTool(); game.renderDesigner(); }}>회전: 가로</button>
      </div>
      <div id="toolBar" class="toolBar">
        <button class="toolBtn" data-tool="red" title="빨간 점 마나" onclick={() => { game.setTool('red'); game.renderDesigner(); }}>
          <span class="toolIconSvg"><span class="toolIcon red"></span></span>
        </button>
        <button class="toolBtn" data-tool="blueGen" title="파란 마나 생성기" onclick={() => { game.setTool('blueGen'); game.renderDesigner(); }}>
          <span class="toolIconSvg"><span class="toolIcon blueGen"></span></span>
        </button>
        <button class="toolBtn" data-tool="wire" title="도선" onclick={() => { game.setTool('wire'); game.renderDesigner(); }}>
          <span class="toolIconSvg"><span class="toolIcon wire"></span></span>
        </button>
        <button class="toolBtn" data-tool="circle" title="1칸 회로" onclick={() => { game.setTool('circle'); game.renderDesigner(); }}>
          <span class="toolIconSvg"><span class="toolIcon circle"></span></span>
        </button>
        <button class="toolBtn" data-tool="oval" title="2칸 타원" onclick={() => { game.setTool('oval'); game.renderDesigner(); }}>
          <span class="toolIconSvg"><span class="toolIcon oval"></span></span>
        </button>
        <button class="toolBtn" data-tool="kernel" title="2x2 핵" onclick={() => { game.setTool('kernel'); game.renderDesigner(); }}>
          <span class="toolIconSvg"><span class="toolIcon kernel"></span></span>
        </button>
        <button class="toolBtn" data-tool="mixed2" title="2칸 혼합 회로" onclick={() => { game.setTool('mixed2'); game.renderDesigner(); }}>
          <span class="toolIconSvg"><span class="toolIcon mixed2"></span></span>
        </button>
        <button class="toolBtn" data-tool="mixedCore" title="9칸 혼합 핵" onclick={() => { game.setTool('mixedCore'); game.renderDesigner(); }}>
          <span class="toolIconSvg"><span class="toolIcon mixedCore"></span></span>
        </button>
        <button class="toolBtn" data-tool="eraser" title="지우개" onclick={() => { game.setTool('eraser'); game.renderDesigner(); }}>
          <span class="toolIconSvg"><span class="toolIcon eraser"></span></span>
        </button>
      </div>
      <div id="toolInfo" class="toolInfo">도구를 선택하고 설계판을 클릭하세요</div>
      <div class="boardWrap"><div id="designBoard" class="designBoard"></div></div>
    </div>
    <div class="sideControls">
      <label>술식 이름 <input id="spellName" maxlength="18" placeholder="이름 없는 술식"></label>
      <div id="spellStats" class="statsBox"></div>
      <label>저장할 슬롯
        <select id="slotSelect">
          <option value="0">1번 슬롯</option>
          <option value="1">2번 슬롯</option>
          <option value="2">3번 슬롯</option>
          <option value="3">4번 슬롯</option>
          <option value="4">5번 슬롯</option>
        </select>
      </label>
      <button id="saveBtn" class="good" onclick={() => {const n=(document.getElementById('spellName') as HTMLInputElement)?.value||'';const i=Number((document.getElementById('slotSelect') as HTMLSelectElement)?.value||0);game.saveSpell(n,i);}}>슬롯에 저장</button>
      <button id="clearDesignBtn" onclick={() => game.clearDesign()}>설계 초기화</button>
      <button id="startBattleBtn" class="good" disabled onclick={() => game.startBattle()}>전투 시작</button>
    </div>
  </div>
</section>
<div id="toast"></div>