<script lang="ts">
  import { onMount } from 'svelte';
  import { game } from '$lib/stores/game';

  let log = $state('');
  let pass = $state(0);
  let fail = $state(0);
  let running = $state(true);

  function assert(label: string, ok: boolean, detail = '') {
    if (ok) pass++; else fail++;
    log += `${ok ? '✅' : '❌'} ${label}${detail ? ': ' + detail : ''}\n`;
  }

  function assertEq(label: string, actual: unknown, expected: unknown) {
    const ok = actual === expected;
    const detail = ok ? `${actual}` : `got ${actual}, expected ${expected}`;
    assert(label, ok, detail);
  }

  onMount(async () => {
    game.initClient();

    // ── Game Store ────────────────────────────────────────
    log += '── Store ──\n';
    assert('state initial', game.state === 'ready' || game.state === 'design');
    assert('has battle', !!game.battle);
    assert('has designer', !!game.designer);
    assert('5 slots', game.slots.length === 5);
    assertEq('currentMap id', game.currentMap?.id, 1);

    // ── Designer ──────────────────────────────────────────
    log += '\n── Designer ──\n';
    game.setFrame(3, 3);
    assertEq('frame set', `${game.designer.width}x${game.designer.height}`, '3x3');

    game.setTool('red');
    assertEq('tool set', game.designer.tool, 'red');

    game.rotateTool();
    assertEq('rotation toggled', game.designer.rotation, 1);
    game.rotateTool();
    assertEq('rotation toggled back', game.designer.rotation, 0);

    // ── Spell Stats via place + save ──────────────────────
    log += '\n── Spell Stats ──\n';
    const stats0 = game.spellStats();
    assert('empty design invalid', !stats0.valid);
    assertEq('zero damage', stats0.damage, 0);

    // ── Battle (no save = can't start) ────────────────────
    log += '\n── Battle ──\n';
    assert('no saved spell yet', !game.hasSavedSpell);

    // ── Storage ───────────────────────────────────────────
    log += '\n── Storage ──\n';
    assert('localStorage exists', typeof localStorage !== 'undefined');

    // ── i18n ──────────────────────────────────────────────
    log += '\n── i18n ──\n';
    import('$lib/game/i18n').then(({ t }) => {
      assert('score key', t('score').length > 0);
      assert('mana key', t('mana').length > 0);
      assert('none key', t('none').length > 0);
    });

    // ── Canvas ────────────────────────────────────────────
    log += '\n── Canvas ──\n';
    const can = document.createElement('canvas');
    can.width = 720; can.height = 520;
    game.initCanvas(can);
    assert('canvas set', game.canvas !== null);
    assert('renderer set', game.renderer !== null);

    // ── Speed ─────────────────────────────────────────────
    log += '\n── Speed ──\n';
    game.setBattleSpeed(4);
    assertEq('speed 4x', game.battle.battleSpeed, 4);
    game.setBattleSpeed(1);
    assertEq('speed 1x', game.battle.battleSpeed, 1);

    // ── Results ───────────────────────────────────────────
    running = false;
    log += `\n${'═'.repeat(36)}\n${pass + fail} tests: ${pass} ✅ passed, ${fail} ❌ failed\n`;
    if (fail === 0) log += '\n🎉 ALL TESTS PASSED!\n';
  });
</script>

<svelte:head>
  <title>Jesulkr — Test Page</title>
</svelte:head>

<div class="test-page">
  <h1>🧪 Jesulkr Test Suite</h1>
  <p>
    <span class="badge" class:pass={!running && fail===0} class:fail={fail>0}>
      {#if running}
        ⏳ Running...
      {:else if fail === 0}
        ✅ {pass}/{pass} Passed
      {:else}
        ❌ {fail} Failed / {pass+fail} Total
      {/if}
    </span>
  </p>
  <pre class="test-log">{log}</pre>
</div>

<style>
  .test-page { max-width: 800px; margin: 20px auto; padding: 20px; }
  h1 { color: #51a8ff; font-size: 24px; }
  .badge { display: inline-block; padding: 8px 16px; border-radius: 8px; font-weight: 700; font-size: 16px; }
  .badge.pass { background: #1a3a2a; color: #70ffc0; border: 1px solid #36b77e; }
  .badge.fail { background: #3a1a1a; color: #ff7380; border: 1px solid #ff465c; }
  .test-log {
    background: #0b1424; border: 1px solid #28456f; border-radius: 12px;
    padding: 16px; font-family: 'Courier New', monospace; font-size: 13px;
    line-height: 1.7; white-space: pre-wrap; color: #eef6ff; margin-top: 12px;
  }
</style>
