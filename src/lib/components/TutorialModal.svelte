<script lang="ts">
  import { onMount } from 'svelte';
  import { game } from '$lib/stores/game';
  import * as Storage from '$lib/game/core/Storage';
  import { t } from '$lib/game/i18n';

  // 5장 슬라이드 정의 (ko/en 분기는 t()로 처리)
  const SLIDES = [
    {
      icon: '⚡',
      titleKey: 'tut.s1.title',
      bodyKey: 'tut.s1.body',
    },
    {
      icon: '🔴',
      titleKey: 'tut.s2.title',
      bodyKey: 'tut.s2.body',
    },
    {
      icon: '🔗',
      titleKey: 'tut.s3.title',
      bodyKey: 'tut.s3.body',
    },
    {
      icon: '⚔️',
      titleKey: 'tut.s4.title',
      bodyKey: 'tut.s4.body',
    },
    {
      icon: '🗺️',
      titleKey: 'tut.s5.title',
      bodyKey: 'tut.s5.body',
    },
  ];

  // SSR-safe default: hidden until we know the user's localStorage state.
  // Doing the read inside onMount avoids hydration mismatches.
  let visible = $state(false);
  let step = $state(0);

  onMount(() => {
    if (!Storage.loadTutorialSeen()) {
      visible = true;
    }
  });

  function close() {
    visible = false;
    game.saveTutorialSeen();
  }

  function next() {
    if (step < SLIDES.length - 1) {
      step++;
    } else {
      close();
    }
  }

  function prev() {
    if (step > 0) step--;
  }

  function onKeyDown(e: KeyboardEvent) {
    if (!visible) return;
    if (e.key === 'ArrowRight' || e.key === 'Enter') next();
    if (e.key === 'ArrowLeft') prev();
    if (e.key === 'Escape') close();
  }
</script>

<svelte:window onkeydown={onKeyDown} />

{#if visible}
<div
  class="tutorialOverlay"
  role="dialog"
  aria-modal="true"
  aria-labelledby="tutTitle"
>
  <div class="tutorialBox">
    <!-- 상단: 건너뛰기 -->
    <div class="tutorialHead">
      <span class="tutorialStep">{step + 1} / {SLIDES.length}</span>
      <button class="tutorialSkip" type="button" onclick={close}>
        {t('tut.skip')}
      </button>
    </div>

    <!-- 슬라이드 본문 -->
    <div class="tutorialSlide">
      <div class="tutorialIcon">{SLIDES[step].icon}</div>
      <h2 id="tutTitle" class="tutorialTitle">{t(SLIDES[step].titleKey)}</h2>
      <p class="tutorialBody">{t(SLIDES[step].bodyKey)}</p>
    </div>

    <!-- 점 인디케이터 -->
    <div class="tutorialDots" role="list" aria-label="슬라이드 위치">
      {#each SLIDES as _, i}
        <button
          class="tutorialDot"
          class:active={i === step}
          type="button"
          aria-label="{i + 1}번 슬라이드"
          onclick={() => step = i}
        ></button>
      {/each}
    </div>

    <!-- 하단 버튼 -->
    <div class="tutorialFoot">
      <button
        class="tutorialPrev"
        type="button"
        disabled={step === 0}
        onclick={prev}
        aria-label={t('tut.prev')}
      >
        ← {t('tut.prev')}
      </button>
      <button
        class="tutorialNext good"
        type="button"
        onclick={next}
      >
        {step === SLIDES.length - 1 ? t('tut.start') : t('tut.next')}
        {step < SLIDES.length - 1 ? ' →' : ' ✓'}
      </button>
    </div>
  </div>
</div>
{/if}
