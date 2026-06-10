// ============================================================
// SpellManager — 술식 저장 / 불러오기 / 초기화
// ============================================================
import type { GameManager } from './game';
import * as Storage from '$lib/game/core/Storage';
import { t } from '$lib/game/i18n';
import { clone } from '$lib/game/utils/helpers';
import { showToast } from '$lib/game/ui/Toast';
import { gameRx } from './game.svelte';

/** 현재 설계를 지정한 슬롯에 저장합니다 */
export function saveSpell(gm: GameManager, name: string, slotIndex: number) {
  if (slotIndex < 0 || slotIndex > 4) { showToast('잘못된 슬롯입니다.', 'bad'); return; }
  const stats = gm.spellStats();
  if (!stats.valid) { showToast('유효한 술식이 아닙니다.', 'bad'); return; }
  const n = (name || '').trim() || (t('unnamed.spell') || '이름 없는 술식');
  const spell = {
    id: 'spell_' + Date.now(),
    name: n.slice(0, 18),
    width: gm.designer.width,
    height: gm.designer.height,
    components: clone(gm.designer.components),
    castTime: stats.castTime,
    manaCost: stats.manaCost,
    damage: stats.damage,
    aoeDamage: stats.aoeDamage,
    breakdown: stats.breakdown,
  };
  gm.store.slots[slotIndex] = spell;
  Storage.saveSlots(gm.slots);
  gameRx.syncFull(gm);
  showToast(`${slotIndex + 1}번 슬롯에 저장했습니다.`, 'good');
}

/** 지정한 슬롯의 술식을 설계판으로 불러옵니다 */
export function loadSpell(gm: GameManager, slotIndex: number) {
  const spell = gm.slots[slotIndex];
  if (!spell) { showToast(t('no.spell'), 'bad'); return; }
  gm.designer.width = spell.width;
  gm.designer.height = spell.height;
  gm.designer.components = clone(spell.components);
  gm.designer.nextId = 1 + gm.designer.components.reduce((m, c) => Math.max(m, Number(c.id) || 0), 0);
  const nameInput = document.getElementById('spellName') as HTMLInputElement;
  if (nameInput) nameInput.value = spell.name;
  const slotSelect = document.getElementById('slotSelect') as HTMLSelectElement;
  if (slotSelect) slotSelect.value = String(slotIndex);
  if (gm.state !== 'design') gm.store.returnStateAfterDesign = gm.state;
  gm.state = 'design';
  // gameRx.sync will render designer (called from onStateChange)
  showToast(`${slotIndex + 1}번 슬롯을 불러왔습니다.`, 'good');
}

/** 설계판의 모든 부품을 제거합니다 */
export function clearDesign(gm: GameManager) {
  gm.designer.components = [];
  gm.designer.nextId = 1;
  const nameInput = document.getElementById('spellName') as HTMLInputElement;
  if (nameInput) nameInput.value = '';
  gameRx.syncFull(gm);
}
