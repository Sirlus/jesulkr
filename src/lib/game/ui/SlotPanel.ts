// ============================================================
// UI — Spell slot panel
// ============================================================
import type { SpellData } from '../types';
import { $, empty } from '../utils/dom';
import { escapeHtml, formatSpecialDamage } from '../utils/helpers';
import { t, fmtSlotLabel } from '../i18n';

export function renderSlots(
  containerId: string,
  slots: (SpellData | null)[],
  getKeyLabel: (i: number) => string,
  autoModes: boolean[],
  isPureMode: boolean,
  isMobile: boolean,
  onToggleAuto: (i: number) => void,
  onSlotClick: (i: number) => void,
): void {
  const el = $(containerId);
  if (!el) return;
  empty(el);

  for (let i = 0; i < 5; i++) {
    const spell = slots[i];
    const card = document.createElement('div');
    card.className = `slot${spell ? '' : ' empty'}`;

    const head = document.createElement('div');
    head.className = 'slotHead';
    head.innerHTML = `<div class="keyBadge">${escapeHtml(getKeyLabel(i))}</div><div class="slotName">${spell ? escapeHtml(spell.name) : t('empty')}</div>`;
    card.appendChild(head);

    if (spell) {
      const stats = document.createElement('div');
      stats.className = 'slotStats';
      stats.innerHTML =
        `<div><span>${t('cooldown')}</span><b>${spell.castTime}t</b></div>` +
        `<div><span>${t('mana')}</span><b>${spell.manaCost}</b></div>` +
        `<div><span>${t('normal')}</span><b>${spell.damage}</b></div>` +
        `<div><span>${t('special')}</span><b class="specialValue">${escapeHtml(formatSpecialDamage(spell.aoeDamage))}</b></div>`;
      card.appendChild(stats);

      const modeRow = document.createElement('div');
      modeRow.className = 'slotModeRow';
      if (isPureMode) {
        modeRow.innerHTML = `<span>${t('cast.mode')}</span><span class="manualOnlyBadge">${t('manual.mode')}</span>`;
      } else {
        const isAuto = !!autoModes[i];
        modeRow.innerHTML =
          `<span>${t('cast.mode')}</span>` +
          `<button class="autoSwitch ${isAuto ? 'on' : ''}" data-auto-slot="${i}" type="button">${isAuto ? t('auto') : t('manual')}</button>`;
        const autoBtn = modeRow.querySelector<HTMLButtonElement>('button[data-auto-slot]');
        if (autoBtn) {
          autoBtn.addEventListener('click', (ev) => {
            ev.stopPropagation();
            onToggleAuto(i);
          });
        }
      }
      card.appendChild(modeRow);

      card.addEventListener('click', (ev) => {
        if (ev.target && (ev.target as HTMLElement).closest?.('[data-auto-slot]')) return;
        onSlotClick(i);
      });
    } else {
      const emptyDiv = document.createElement('div');
      emptyDiv.className = 'small';
      emptyDiv.textContent = t('no.spell');
      card.appendChild(emptyDiv);
    }

    const cd = document.createElement('div');
    cd.className = 'cooldown';
    cd.id = `cooldown${i}`;
    card.appendChild(cd);
    el.appendChild(card);
  }
}

export function updateCooldownBars(slots: (SpellData | null)[], cooldowns: number[]): void {
  for (let i = 0; i < 5; i++) {
    const bar = $(`cooldown${i}`);
    if (!bar) continue;
    const spell = slots[i];
    const pct = spell && cooldowns[i] > 0
      ? Math.min(100, (cooldowns[i] / Math.max(1, spell.castTime)) * 100)
      : 0;
    bar.style.width = `${pct}%`;
  }
}
