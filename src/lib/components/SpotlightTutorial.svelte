<script lang="ts">
  // ============================================================
  // SpotlightTutorial — 스포트라이트 기반 가이디드 투어
  //
  // 작동 방식:
  //   - 게임 상태($effect)를 감지해 단계를 자동 진행
  //   - 현재 단계에 해당하는 DOM 요소에 .tut-spotlight CSS 클래스 부여
  //   - box-shadow 트릭으로 해당 요소만 밝게, 나머지는 어둡게
  //   - 말풍선은 하이라이트 요소 위치 기준 동적 배치
  //   - step 8(게임오버)은 스포트라이트 없이 중앙 메시지 + 버튼
  //   - 건너뛰기는 언제든 가능
  // ============================================================
  import { onMount, tick } from 'svelte';
  import { game } from '$lib/stores/game';
  import { gameState } from '$lib/stores/gameState.svelte';
  import * as Storage from '$lib/game/core/Storage';
  import { t } from '$lib/game/i18n';

  // ── 단계 정의 ────────────────────────────────────────────────
  // targetIds: 하이라이트할 요소 id 배열 (복수 지원, 빈 배열 = 오버레이만)
  // msgKey: i18n 키
  // condition: 이 단계가 '완료'됐다고 판단하는 함수 (자동 진행)
  // noOverlay: true면 어두운 배경 없이 말풍선만 표시 (게임오버 단계)
  const STEPS = [
    {
      targetIds: ['toolBar'],
      msgKey: 'tut2.step1',
      condition: () => redToolClicked,
    },
    {
      targetIds: ['designBoard'],
      msgKey: 'tut2.step2',
      condition: () => gameState.designer.components.length >= 1,
    },
    {
      targetIds: ['toolBar', 'designBoard'],
      msgKey: 'tut2.step3',
      condition: () => game.spellStats().damage >= 1,
    },
    {
      targetIds: ['saveBtn'],
      msgKey: 'tut2.step4',
      condition: () => gameState.hasSavedSpell(),
    },
    {
      targetIds: ['startBattleBtn'],
      msgKey: 'tut2.step5',
      condition: () => gameState.state === 'battle',
    },
    {
      targetIds: ['slots'],
      msgKey: 'tut2.step6',
      condition: () => hasCastOnce,
    },
    {
      targetIds: ['speedControls'],
      msgKey: 'tut2.step7',
      // 배속이 1배 초과로 바뀌면 진행
      condition: () => speedChanged,
    },
    {
      targetIds: [],
      msgKey: 'tut2.step8',
      noOverlay: true,
      // 게임오버 = 이 단계는 자동 완료 없음 — 버튼으로만 닫힘
      condition: () => false,
    },
  ] as const;

  // ── 상태 ─────────────────────────────────────────────────────
  let active = $state(false);
  let step = $state(0);
  let hasCastOnce = $state(false);
  let speedChanged = $state(false);
  let tooltipStyle = $state('');
  let prevMana = $state(20);
  let redToolClicked = $state(false);

  // 전투 중 마나 감소 = 발사
  $effect(() => {
    if (gameState.state === 'battle') {
      const cur = gameState.battle.mana;
      if (cur < prevMana) hasCastOnce = true;
      prevMana = cur;
    }
  });

  // 게임오버 감지 — step 6 이후(전투 진입 후) 게임오버가 되면 step 8로 점프
  $effect(() => {
    if (!active) return;
    if (gameState.state === 'gameover' && step >= 5) {
      jumpToGameOver();
    }
  });

  async function jumpToGameOver() {
    prevTargets.forEach(el => el.classList.remove('tut-spotlight'));
    prevTargets = [];
    step = STEPS.length - 1; // step 8
    await tick();
    // 게임오버 단계는 화면 중앙 고정
    tooltipStyle = 'left:50%;top:50%;transform:translate(-50%,-50%)';
  }

  // ── 단계 자동 진행 ───────────────────────────────────────────
  $effect(() => {
    if (!active || step >= STEPS.length) return;
    if (STEPS[step].condition()) {
      advance();
    }
  });

  async function advance() {
    if (step >= STEPS.length - 1) {
      await tick();
      finish();
      return;
    }
    step++;
    await tick();
    updateSpotlight();
  }

  // ── 스포트라이트 DOM 조작 ────────────────────────────────────
  let prevTargets: Element[] = [];

  async function updateSpotlight() {
    prevTargets.forEach(el => el.classList.remove('tut-spotlight'));
    prevTargets = [];

    await tick();
    const ids = STEPS[step]?.targetIds;
    if (!ids || ids.length === 0) return;

    const els = ids.map(id => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    if (els.length === 0) return;

    els.forEach(el => el.classList.add('tut-spotlight'));
    prevTargets = els;
    positionTooltip(els[0]);
  }

  function positionTooltip(el: Element) {
    const rect = el.getBoundingClientRect();
    const viewH = window.innerHeight;
    const viewW = window.innerWidth;

    const spaceBelow = viewH - rect.bottom;
    const top = spaceBelow > 120
      ? rect.bottom + 12
      : rect.top - 12;

    const centerX = rect.left + rect.width / 2;
    const left = Math.max(16, Math.min(viewW - 316, centerX - 150));

    const above = spaceBelow <= 120;
    tooltipStyle = `left:${left}px;top:${top}px;${above ? 'transform:translateY(-100%) translateY(-12px)' : ''}`;
  }

  // ── 생명주기 ─────────────────────────────────────────────────
  onMount(() => {
    if (!Storage.loadTutorialSeen()) {
      active = true;
      tick().then(() => updateSpotlight());
    }

    // step 1: 빨간 마나 버튼 클릭 감지
    function onToolBarClick(e: MouseEvent) {
      if (!active || step !== 0) return;
      if ((e.target as Element).closest('.toolBtn[data-tool="red"]')) redToolClicked = true;
    }
    // step 7: 배속 버튼 클릭 감지
    function onSpeedClick(e: MouseEvent) {
      if (!active || step !== 6) return;
      if ((e.target as Element).closest('.speedBtn')) speedChanged = true;
    }

    document.addEventListener('click', onToolBarClick, true);
    document.addEventListener('click', onSpeedClick, true);
    return () => {
      document.removeEventListener('click', onToolBarClick, true);
      document.removeEventListener('click', onSpeedClick, true);
    };
  });

  function finish() {
    prevTargets.forEach(el => el.classList.remove('tut-spotlight'));
    prevTargets = [];
    active = false;
    game.saveTutorialSeen();
  }

  function skip() { finish(); }

  function onGameOverConfirm() {
    finish();
    game.toggleDesigner();
  }

  function onResize() {
    if (!active || prevTargets.length === 0) return;
    positionTooltip(prevTargets[0]);
  }

  // 현재 단계가 게임오버 단계인지
  const isGameOverStep = $derived(active && step === STEPS.length - 1 && !!(STEPS[step] as { noOverlay?: boolean }).noOverlay);
</script>

<svelte:window onresize={onResize} />

{#if active && step < STEPS.length}
  {#if !isGameOverStep}
    <!-- 어두운 배경 오버레이 -->
    <div class="tutSpotlightOverlay" aria-hidden="true"></div>
  {/if}

  <!-- 말풍선 / 게임오버 카드 -->
  <div
    class="tutTooltip"
    class:tutTooltipGameOver={isGameOverStep}
    role={isGameOverStep ? 'dialog' : 'status'}
    aria-live={isGameOverStep ? undefined : 'polite'}
    aria-modal={isGameOverStep ? 'true' : undefined}
    style={tooltipStyle}
  >
    <div class="tutTooltipBody">
      {#if !isGameOverStep}
        <span class="tutTooltipStep">{step + 1} / {STEPS.length}</span>
      {/if}
      <p class="tutTooltipMsg">{t(STEPS[step].msgKey)}</p>
    </div>
    <div class="tutTooltipFoot">
      {#if isGameOverStep}
        <button class="tutConfirmBtn good" type="button" onclick={onGameOverConfirm}>
          {t('tut2.step8.cta')}
        </button>
        <button class="tutSkipBtn" type="button" onclick={skip}>
          {t('tut.skip')}
        </button>
      {:else}
        <button class="tutSkipBtn" type="button" onclick={skip}>
          {t('tut.skip')}
        </button>
      {/if}
    </div>
  </div>
{/if}
