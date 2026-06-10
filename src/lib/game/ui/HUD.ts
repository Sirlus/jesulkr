// ============================================================
// UI — HUD (top bar + battle panel)
// ============================================================
import { $ } from '../utils/dom';
import { MAX_MANA } from '../constants';
import { t } from '../i18n';

export function updateHUD(
  score: number, mana: number, baseHp: number, survival: number,
  regen: number, stateLabel: string, mapLabel: string,
  modeLabel: string,
): void {
  setText('hudScore', String(score));
  setText('hudMana', `${mana.toFixed(1)} / ${MAX_MANA} (+${regen}/s)`);
  setText('hudBase', String(Math.max(0, baseHp)));
  setText('hudTime', `${Math.floor(survival)}s`);
  setText('hudState', stateLabel);
  setText('hudMap', mapLabel);

  setText('battleHudMap', `${mapLabel} · ${modeLabel}`);
  setText('battleHudScore', String(score));
  setText('battleHudMana', `${mana.toFixed(1)} / ${MAX_MANA} (+${regen}/s)`);
  setText('battleHudBase', String(Math.max(0, baseHp)));
}

function setText(id: string, text: string): void {
  const el = $(id);
  if (el) el.textContent = text;
}
