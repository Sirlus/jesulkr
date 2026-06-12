<script lang="ts">
  // ============================================================
  // SpotlightTutorial — 스포트라이트 기반 가이디드 투어
  //
  // 작동 방식:
  //   - 게임 상태($derived)를 감지해 단계를 자동 진행
  //   - 현재 단계에 해당하는 DOM 요소에 .tut-spotlight CSS 클래스 부여
  //   - box-shadow 트릭으로 해당 요소만 밝게, 나머지는 어둡게
  //   - 말풍선은 하이라이트 요소 위치 기준 동적 배치
  //   - 건너뛰기는 언제든 가능
  // ============================================================
  import { onMount, tick } from 'svelte';
  import { game } from '$lib/stores/game';
  import { gameState } from '$lib/stores/gameState.svelte';
  import * as Storage from '$lib/game/core/Storage';
  import { t } from '$lib/game/i18n';

  // ── 단계 정의 ────────────────────────────────────────────────
  // targetIds: 하이라이트할 요소 id 배열 (복수 지원)
  // msgKey: i18n 키
  // condition: 이 단계가 '완료'됐다고 판단하는 함수 (자동 진행)
  const STEPS = [
    {
      targetIds: ['toolBar'],
      msgKey: 'tut2.step1',
      // 빨간 마나 버튼을 실제로 클릭했을 때만 진행
      condition: () => redToolClicked,
    },
    {
      targetIds: ['designBoard'],
      msgKey: 'tut2.step2',
      // 보드에 부품이 하나라도 배치되면 진행
      condition: () => gameState.designer.components.length >= 1,
    },
    {
      targetIds: ['toolBar', 'designBoard'],
      msgKey: 'tut2.step3',
      // 데미지가 1 이상이면 진행 (회로가 연결된 상태)
      condition: () => game.spellStats().damage >= 1,
    },
    {
      targetIds: ['saveBtn'],
      msgKey: 'tut2.step4',
      // 슬롯에 술식이 저장되면 진행
      condition: () => gameState.hasSavedSpell(),
    },
    {
      targetIds: ['startBattleBtn'],
      msgKey: 'tut2.step5',
      // 전투가 시작되면 진행
      condition: () => gameState.state === 'battle',
    },
    {
      targetIds: ['slots'],
      msgKey: 'tut2.step6',
      // 슬롯을 한 번이라도 발사하면 완료 (마나 감소 감지)
      condition: () => hasCastOnce,
    },
  ] as const;

  // ── 상태 ─────────────────────────────────────────────────────
  let active = $state(false);
  let step = $state(0);
  let hasCastOnce = $state(false);
  let tooltipStyle = $state('');
  let prevMana = $state(20);
  // step 1: 초기 tool이 red라도 클릭 전까지는 진행 안 함
  let redToolClicked = $state(false);

  // 전투 중 마나 감소 = 발사한 것으로 간주
  $effect(() => {
    if (gameState.state === 'battle') {
      const cur = gameState.battle.mana;
      if (cur < prevMana) hasCastOnce = true;
      prevMana = cur;
    }
  });

  // ── 단계 자동 진행 ───────────────────────────────────────────
  $effect(() => {
    if (!active || step >= STEPS.length) return;
    if (STEPS[step].condition()) {
      advance();
    }
  });

  async function advance() {
    if (step >= STEPS.length - 1) {
      // 마지막 단계 완료 → 튜토리얼 종료
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
    // 이전 타겟 클래스 전체 제거
    prevTargets.forEach(el => el.classList.remove('tut-spotlight'));
    prevTargets = [];

    await tick();
    const ids = STEPS[step]?.targetIds;
    if (!ids) return;

    const els = ids.map(id => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    if (els.length === 0) return;

    els.forEach(el => el.classList.add('tut-spotlight'));
    prevTargets = els;

    // 말풍선은 첫 번째 타겟 기준
    positionTooltip(els[0]);
  }

  function positionTooltip(el: Element) {
    const rect = el.getBoundingClientRect();
    const viewH = window.innerHeight;
    const viewW = window.innerWidth;

    // 요소 아래 공간이 충분하면 아래, 아니면 위
    const spaceBelow = viewH - rect.bottom;
    const top = spaceBelow > 120
      ? rect.bottom + 12
      : rect.top - 12; // translateY(-100%) 적용

    // 가로: 요소 중앙 기준, 화면 밖으로 나가지 않게 클램프
    const centerX = rect.left + rect.width / 2;
    const left = Math.max(16, Math.min(viewW - 316, centerX - 150));

    const above = spaceBelow <= 120;
    tooltipStyle = `left:${left}px;top:${top}px;${above ? 'transform:translateY(-100%) translateY(-12px)' : ''}`;
  }

  // ── 생명주기 ─────────────────────────────────────────────────
  onMount(() => {
    if (!Storage.loadTutorialSeen()) {
      active = true;
      // 첫 단계 스포트라이트 설정 (다음 틱에)
      tick().then(() => updateSpotlight());
    }

    // toolBar 클릭 감지 — step 1 진행 조건
    function onToolBarClick(e: MouseEvent) {
      if (!active || step !== 0) return;
      const btn = (e.target as Element).closest('.toolBtn[data-tool="red"]');
      if (btn) redToolClicked = true;
    }
    document.addEventListener('click', onToolBarClick, true);
    return () => document.removeEventListener('click', onToolBarClick, true);
  });

  function finish() {
    prevTargets.forEach(el => el.classList.remove('tut-spotlight'));
    prevTargets = [];
    active = false;
    game.saveTutorialSeen();
  }

  function skip() {
    finish();
  }

  // 화면 리사이즈 시 말풍선 재계산
  function onResize() {
    if (!active || prevTargets.length === 0) return;
    positionTooltip(prevTargets[0]);
  }
</script>

<svelte:window onresize={onResize} />

{#if active && step < STEPS.length}
  <!-- 어두운 배경 오버레이 (pointer-events: none — 클릭은 spotlight 요소로 통과) -->
  <div class="tutSpotlightOverlay" aria-hidden="true"></div>

  <!-- 말풍선 -->
  <div
    class="tutTooltip"
    role="status"
    aria-live="polite"
    style={tooltipStyle}
  >
    <div class="tutTooltipBody">
      <span class="tutTooltipStep">{step + 1} / {STEPS.length}</span>
      <p class="tutTooltipMsg">{t(STEPS[step].msgKey)}</p>
    </div>
    <div class="tutTooltipFoot">
      <button class="tutSkipBtn" type="button" onclick={skip}>
        {t('tut.skip')}
      </button>
    </div>
  </div>
{/if}
