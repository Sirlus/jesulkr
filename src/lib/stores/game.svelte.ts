// ============================================================
// GameReactiveState — DOM 갱신 중앙화 브릿지
//
// GameManager.store를 직접 참조하며 모든 DOM 갱신을 한 곳에서 처리.
// Phase 4에서 Svelte 컴포넌트의 $effect/$state 템플릿으로 완전 대체 예정.
//
// ┌─ syncFull()  ─ 상태 변경 시 전체 DOM 재구축 ─┐
// │  body class, HUD, 슬롯 패널, 쿨타임, 설계판, 시작버튼 │
// └──────────────────────────────────────────────────────┘
// ┌─ syncPartial() ─ 매 프레임 경량 갱신 ─┐
// │  HUD 텍스트 + 쿨타임 바 width 만       │
// └────────────────────────────────────────┘
// ============================================================
import type { GameManager } from './game';
import { t } from '$lib/game/i18n';
import { updateHUD } from '$lib/game/ui/HUD';
import { renderSlots, updateCooldownBars } from '$lib/game/ui/SlotPanel';
import { renderDesigner } from './DesignerRenderer';
import * as Storage from '$lib/game/core/Storage';

class GameReactiveState {
  // ── Full sync: state transitions, slot save/load, designer ops ──
  syncFull(gm: GameManager) {
    const s = gm.store;
    const b = s.battle;
    const isDesign = s.state === 'design';

    // Body class
    document.body.classList.toggle('mode-design', isDesign);
    document.body.classList.toggle('mode-play', !isDesign);

    // Designer panel visibility
    const dp = document.getElementById('designerPanel');
    if (dp) dp.classList.toggle('hidden', !isDesign);

    // HUD
    updateHUD(
      b.score, b.mana, b.baseHp, b.survival,
      s.effectiveManaRegen,
      gm.stateLabel(),
      s.currentMap?.shortName || '-',
      s.selectedRunMode === 'pure' ? t('manual.mode') : t('auto.mode'),
    );

    // Slot panel (full re-render — only on state/designer changes)
    renderSlots('slots', s.slots,
      (i: number) => (s.keyBindings[i] || Storage.defaultKeyBindings()[i]).label || String(i + 1),
      s.slotAutoModes, s.selectedRunMode === 'pure', false,
      (i: number) => { s.slotAutoModes[i] = !s.slotAutoModes[i]; Storage.saveSlotAutoModes(s.slotAutoModes); this.syncFull(gm); },
      (i: number) => { if (s.state === 'battle') gm.castSlot(i); else gm.loadSpell(i); });

    // Cooldown bars
    updateCooldownBars(s.slots, b.cooldowns);

    // Start button
    const btn = document.getElementById('startBattleBtn') as HTMLButtonElement;
    if (btn) btn.disabled = !s.hasSavedSpell();

    // Designer board
    if (isDesign) renderDesigner(gm);
  }

  // ── Partial sync: per-frame lightweight HUD + cooldowns ──
  syncPartial(gm: GameManager) {
    const s = gm.store;
    const b = s.battle;
    updateHUD(
      b.score, b.mana, b.baseHp, b.survival,
      s.effectiveManaRegen,
      gm.stateLabel(),
      s.currentMap?.shortName || '-',
      s.selectedRunMode === 'pure' ? t('manual.mode') : t('auto.mode'),
    );
    updateCooldownBars(s.slots, b.cooldowns);
  }
}

export const gameRx = new GameReactiveState();
