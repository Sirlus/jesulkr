// ============================================================
// SpellManager — 술식 저장 / 불러오기 / 초기화
// ============================================================
import type { GameManager } from './game';
import type { SpellData } from '$lib/game/types';
import * as Storage from '$lib/game/core/Storage';
import { MAX_SPELL_NAME_LENGTH } from '$lib/game/constants';
import { t } from '$lib/game/i18n';
import { clone } from '$lib/game/utils/helpers';
import { showToast } from '$lib/game/ui/Toast';
import { gameRx } from './game.svelte';

/** 현재 설계를 지정한 슬롯에 저장합니다 */
export function saveSpell(gm: GameManager, name: string, slotIndex: number) {
  if (slotIndex < 0 || slotIndex > 4) { showToast(t('invalid.slot'), 'bad'); return; }
  const stats = gm.spellStats();
  if (!stats.valid) { showToast(t('invalid.spell'), 'bad'); return; }
  const n = (name || '').trim() || (t('unnamed.spell') || '이름 없는 술식');
  const spell: SpellData = {
    id: 'spell_' + Date.now(),
    name: n.slice(0, MAX_SPELL_NAME_LENGTH),
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
  showToast(t('slot.saved', slotIndex + 1), 'good');
}

/** 지정한 슬롯의 술식을 설계판으로 불러옵니다 */
export function loadSpell(gm: GameManager, slotIndex: number) {
  const spell = gm.slots[slotIndex];
  if (!spell) { showToast(t('no.spell'), 'bad'); return; }
  gm.designer.width = spell.width;
  gm.designer.height = spell.height;
  gm.designer.components = clone(spell.components);
  gm.designer.nextId = 1 + gm.designer.components.reduce((m, c) => Math.max(m, Number(c.id) || 0), 0);
  gm.designer.spellName = spell.name;
  if (gm.state !== 'design') gm.store.returnStateAfterDesign = gm.state;
  gm.state = 'design';
  // gameRx.sync will render designer (called from onStateChange)
  showToast(t('slot.loaded', slotIndex + 1), 'good');
}

/** 설계판의 모든 부품을 제거합니다 */
export function clearDesign(gm: GameManager) {
  gm.designer.components = [];
  gm.designer.nextId = 1;
  gm.designer.spellName = '';
  gameRx.syncFull(gm);
}
