<script lang="ts">
  import { gameState } from '$lib/stores/gameState.svelte';
  import { game } from '$lib/stores/game';
  import { t } from '$lib/game/i18n';
  import { CONTROL_ACTIONS } from '$lib/game/constants';
  import { showToast } from '$lib/game/ui/Toast';
  import type { KeyTarget } from '$lib/game/types';

  let showModal = $state(false);
  let captureTarget = $state<KeyTarget | null>(null);

  export function open() {
    showModal = true;
    captureTarget = null;
  }

  export function close() {
    showModal = false;
    captureTarget = null;
  }

  function startCapture(target: KeyTarget) {
    captureTarget = target;
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (!showModal) return;
    if (!captureTarget) {
      if (e.key === 'Escape') close();
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    if (e.key === 'Escape') {
      captureTarget = null;
      showToast(t('key.cancel'));
      return;
    }

    const binding = game.eventToBinding(e);
    if (!binding) {
      showToast(t('key.invalid'), 'bad');
      return;
    }

    const conflict = game.findBindingConflict(captureTarget, binding);
    if (conflict) {
      showToast(t('key.conflict', conflict), 'bad');
      return;
    }

    game.setBinding(captureTarget, binding);
    showToast(t('key.set', game.bindingNameForTarget(captureTarget), binding.label), 'good');
    captureTarget = null;
  }
</script>

<svelte:window onkeydown={handleKeyDown} />

{#if showModal}
  <div class="keySettingsModal" role="dialog" aria-modal="true">
    <div class="keySettingsBox">
      <div class="panelTitle">
        <span>{t('key.settings')}</span>
        <button onclick={close}>{t('close')}</button>
      </div>

      <div class="keySettingsGrid">
        <div class="keySettingSection">
          <h3>{t('spell.slots')}</h3>
          {#each [0, 1, 2, 3, 4] as i}
            <div class="keySettingRow">
              <span>{t('slot.number', i + 1)}<small>{t('slot.key.desc')}</small></span>
              <button
                class:capturing={captureTarget?.type === 'slot' && captureTarget.index === i}
                onclick={() => startCapture({ type: 'slot', index: i })}
              >
                {captureTarget?.type === 'slot' && captureTarget.index === i
                  ? t('key.press')
                  : game.getSlotKeyLabel(i)}
              </button>
            </div>
          {/each}
        </div>

        <div class="keySettingSection">
          <h3>{t('common.controls')}</h3>
          {#each CONTROL_ACTIONS as action}
            <div class="keySettingRow">
              <span>{action.name}<small>{action.desc}</small></span>
              <button
                class:capturing={captureTarget?.type === 'control' && captureTarget.id === action.id}
                onclick={() => startCapture({ type: 'control', id: action.id })}
              >
                {captureTarget?.type === 'control' && captureTarget.id === action.id
                  ? t('key.press')
                  : game.getControlKeyLabel(action.id)}
              </button>
            </div>
          {/each}
        </div>
      </div>

      <div class="keySettingsFooter">
        <button onclick={() => game.resetKeyBindings()}>
          {t('reset.all.keys')}
        </button>
      </div>
    </div>
  </div>
{/if}
