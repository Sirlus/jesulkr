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
	import { lang as langState } from '$lib/game/i18n/language.svelte';
	import { isMobileLayout } from '$lib/game/utils/mobile';

	// ── 단계 정의 ────────────────────────────────────────────────
	// targetIds: 하이라이트할 요소 id 배열 (복수 지원, 빈 배열 = 오버레이만)
	// msgKey: i18n 키
	// condition: 이 단계가 '완료'됐다고 판단하는 함수 (자동 진행)
	// noOverlay: true면 어두운 배경 없이 말풍선만 표시 (게임오버 단계)
	const STEPS = [
		{
			// step 1: 빨간 점 마나 툴만 정확히 강조 (toolBar 전체 → 빨간 점 마나 셀렉터)
			targetIds: ['.toolBtn[data-tool="red"]'],
			msgKey: 'tut2.step1',
			condition: () => redToolClicked
		},
		{
			targetIds: ['#designBoard'],
			msgKey: 'tut2.step2',
			condition: () => gameState.designer.components.length >= 1
		},
		{
			// step 3: 1칸 회로 툴과 마나 배치 위치를 동시에 강조
			targetIds: ['.toolBtn[data-tool="circle"]', '#designBoard'],
			msgKey: 'tut2.step3',
			condition: () => game.spellStats().damage >= 1
		},
		{
			targetIds: ['#saveBtn'],
			msgKey: 'tut2.step4',
			condition: () => gameState.hasSavedSpell()
		},
		{
			targetIds: ['#startBattleBtn'],
			msgKey: 'tut2.step5',
			condition: () => gameState.state === 'battle'
		},
		{
			targetIds: ['#slots'],
			msgKey: 'tut2.step6',
			condition: () => hasCastOnce
		},
		{
			targetIds: ['#speedControls'],
			msgKey: 'tut2.step7',
			// 배속 버튼 클릭 OR 키보드 Z/X/C/V OR skip 버튼으로 진행 가능
			condition: () => speedChanged
		},
		{
			targetIds: [],
			msgKey: 'tut2.step8',
			noOverlay: true,
			// 게임오버 단계 — skip으로 바로 종료 가능 (모바일에서 게임오버까지 기다리지 않도록)
			condition: () => false
		}
	] as const;

	// ── props ────────────────────────────────────────────────────
	// (없음 — 튜토리얼 시작은 gameState.tutorialReplayTrigger로 감지)

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
		prevTargets.forEach((el) => el.classList.remove('tut-spotlight'));
		prevContainers.forEach((el) => el.classList.remove('tut-spotlight-container'));
		prevTargets = [];
		prevContainers = [];
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
		const newStep = step + 1;
		step = newStep;
		await tick();
		// Pass the new step value to ensure correct targetIds is used
		updateSpotlight(newStep);
	}

	// ── 스포트라이트 DOM 조작 ────────────────────────────────────
	let prevTargets: Element[] = [];
	let prevContainers: Element[] = [];

	async function updateSpotlight(targetStep?: number) {
		prevTargets.forEach((el) => el.classList.remove('tut-spotlight'));
		prevContainers.forEach((el) => el.classList.remove('tut-spotlight-container'));
		prevTargets = [];
		prevContainers = [];

		await tick();
		// Use passed targetStep if provided, otherwise use current step value
		const currentStep = targetStep ?? step;
		const selectors = STEPS[currentStep]?.targetIds;
		if (!selectors || selectors.length === 0) return;

		// id(#xxx)도 셀렉터(.toolBtn[data-tool="red"] 등)도 받을 수 있게 querySelector로 통일.
		// 단순 id 형태는 성능을 위해 getElementById 사용.
		const els = selectors
			.map((sel) => {
				if (sel.startsWith('#') && /^[#A-Za-z][\w-]*$/.test(sel)) {
					return document.getElementById(sel.slice(1));
				}
				return document.querySelector(sel);
			})
			.filter(Boolean) as HTMLElement[];
		if (els.length === 0) return;

		els.forEach((el) => el.classList.add('tut-spotlight'));
		prevTargets = els;

		// 모바일에서 fixed 부모 컨테이너(slotPanel 등)가 있으면 z-index를 올려줌
		// → 그렇지 않으면 부모의 stacking context 때문에 spotlight가 오버레이 아래로 묻힘
		const containers: Element[] = [];
		els.forEach((el) => {
			const panel = el.closest('.slotPanel');
			if (panel && !containers.includes(panel)) containers.push(panel);
		});
		containers.forEach((el) => el.classList.add('tut-spotlight-container'));
		prevContainers = containers;

		positionTooltip(els[0]);
	}

	function positionTooltip(el: Element) {
		const viewH = window.innerHeight;
		const viewW = window.innerWidth;

		// 복수 요소 하이라이트 시 — 모든 하이라이트 요소를 감싸는 통합 bounding box 사용
		let minTop = Infinity,
			maxBottom = -Infinity,
			minLeft = Infinity,
			maxRight = -Infinity;
		const targets = prevTargets.length > 0 ? prevTargets : [el];
		for (const target of targets) {
			const r = target.getBoundingClientRect();
			minTop = Math.min(minTop, r.top);
			maxBottom = Math.max(maxBottom, r.bottom);
			minLeft = Math.min(minLeft, r.left);
			maxRight = Math.max(maxRight, r.right);
		}
		const combinedWidth = maxRight - minLeft;

		const tooltipW = Math.min(300, viewW - 32);
		const spaceBelow = viewH - maxBottom;
		const above = spaceBelow < 140;

		const top = above ? minTop - 12 : maxBottom + 12;
		const centerX = minLeft + combinedWidth / 2;
		const left = Math.max(16, Math.min(viewW - tooltipW - 16, centerX - tooltipW / 2));

		tooltipStyle = `left:${left}px;top:${top}px;${above ? 'transform:translateY(-100%) translateY(-12px)' : ''}`;
	}

	// ── 외부에서 튜토리얼 강제 시작 ─────────────────────────────
	function startTutorial() {
		if (active) return;
		if (!langState.selected) return;
		// 상태 초기화
		step = 0;
		hasCastOnce = false;
		speedChanged = false;
		redToolClicked = false;
		prevMana = 20;
		active = true;
		tick().then(() => updateSpotlight());
	}

	// gameState.tutorialReplayTrigger 증가 시 튜토리얼 재시작
	$effect(() => {
		if (gameState.tutorialReplayTrigger > 0) {
			startTutorial();
		}
	});

	// ── 생명주기 ─────────────────────────────────────────────────
	// 언어 선택이 끝나기 전에는 튜토리얼을 시작하지 않습니다.
	// (LanguageModal이 langState.selected를 true로 만드는 순간 활성화)
	$effect(() => {
		if (active) return;
		if (Storage.loadTutorialSeen()) return;
		if (!langState.selected) return;
		active = true;
		tick().then(() => updateSpotlight());
	});

	onMount(() => {
		// step 1: 빨간 마나 버튼 클릭 감지
		function onToolBarClick(e: MouseEvent) {
			if (!active || step !== 0) return;
			if ((e.target as Element).closest('.toolBtn[data-tool="red"]')) redToolClicked = true;
		}
		// step 7: 배속 버튼 클릭 또는 키보드 Z/X/C/V 감지
		function onSpeedClick(e: MouseEvent) {
			if (!active || step !== 6) return;
			if ((e.target as Element).closest('.speedBtn')) speedChanged = true;
		}
		// 키보드 Z/X/C/V로 배속 변경 시에도 progression
		function onKeyDown(e: KeyboardEvent) {
			if (!active || step !== 6) return;
			// Z=배속1, X=배속2, C=배속4, V=배속8 (이미 battleSpeed 변경됨)
			if (['KeyZ', 'KeyX', 'KeyC', 'KeyV'].includes(e.code)) {
				speedChanged = true;
			}
		}

		document.addEventListener('click', onToolBarClick, true);
		document.addEventListener('click', onSpeedClick, true);
		document.addEventListener('keydown', onKeyDown, true);
		return () => {
			document.removeEventListener('click', onToolBarClick, true);
			document.removeEventListener('click', onSpeedClick, true);
			document.removeEventListener('keydown', onKeyDown, true);
		};
	});

	function finish() {
		prevTargets.forEach((el) => el.classList.remove('tut-spotlight'));
		prevContainers.forEach((el) => el.classList.remove('tut-spotlight-container'));
		prevTargets = [];
		prevContainers = [];
		active = false;
		game.saveTutorialSeen();
	}

	function skip() {
		finish();
	}

	function onGameOverConfirm() {
		finish();
		game.toggleDesigner();
	}

	function onResize() {
		if (!active || prevTargets.length === 0) return;
		positionTooltip(prevTargets[0]);
	}

	// 현재 단계가 게임오버 단계인지
	const isGameOverStep = $derived(
		active && step === STEPS.length - 1 && !!(STEPS[step] as { noOverlay?: boolean }).noOverlay
	);

	// 현재 단계의 i18n 메시지 — 모바일이면 .mobile 키 우선 사용
	function stepMsg(msgKey: string): string {
		if (isMobileLayout()) {
			const mobileKey = msgKey + '.mobile';
			const mobileText = t(mobileKey);
			// i18n이 키 자체를 그대로 반환하면 fallback 없는 것으로 간주
			if (mobileText !== mobileKey) return mobileText;
		}
		return t(msgKey);
	}
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
			<p class="tutTooltipMsg">{stepMsg(STEPS[step].msgKey)}</p>
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
