// ============================================================
// Battle — Casting system (cast, cooldown, auto-cast)
// ============================================================
import type { SpellData, CastProjectile, Monster, GameState } from '../types';
import { HIT_DELAY_TICKS } from '../constants';
import { clone } from '../utils/helpers';
import { getCurrentTarget } from './TargetingSystem';
import { isMapUnlocked } from '../core/StorageUnlocks';
import { requiredMapForTool } from '../constants';

function getSpellRequiredMap(spell: SpellData): number {
  let req = 1;
  for (const c of spell.components || []) {
    req = Math.max(req, requiredMapForTool(c.type));
  }
  return req;
}

export interface CastResult {
  success: boolean;
  message?: string;
}

/**
 * Try to cast a spell from a slot.
 * Returns { success: true } on success, or { success: false, message } on failure.
 */
export function tryCastSlot(
  index: number,
  spell: SpellData | null,
  mana: number,
  cooldowns: number[],
  monsters: Monster[],
  selectedTargetId: number | null,
  state: GameState,
  unlocks: Record<string, boolean>,
  records: import('../types').Records,
  autoManaReserve: number,
  auto: boolean,
  _silent: boolean,
): { result: CastResult; newMana?: number; projectile?: CastProjectile } {
  if (!spell) {
    return { result: { success: false, message: '이 슬롯에는 술식이 없습니다.' } };
  }

  const reqMap = getSpellRequiredMap(spell);
  if (!isMapUnlocked(reqMap, unlocks, records)) {
    return { result: { success: false, message: `이 술식은 맵 ${reqMap} 해금 후 사용할 수 있습니다.` } };
  }

  if (state !== 'battle') {
    return { result: { success: false, message: '전투 중에만 술식을 사용할 수 있습니다.' } };
  }

  if (cooldowns[index] > 0) {
    return { result: { success: false, message: '아직 쿨타임입니다.' } };
  }

  if (mana < spell.manaCost) {
    return { result: { success: false, message: '마나 부족' } };
  }

  // Auto mana reserve check
  if (auto && (mana - spell.manaCost) < autoManaReserve) {
    return { result: { success: false } };
  }

  const target = getCurrentTarget(monsters, selectedTargetId);
  if (!target) {
    return { result: { success: false, message: '대상 없음' } };
  }

  const newMana = mana - spell.manaCost;
  const projectile: CastProjectile = {
    id: Date.now() + Math.random(), // unique enough
    spell: clone(spell),
    targetId: target.id,
    slotIndex: index,
    remainingTicks: HIT_DELAY_TICKS,
    totalTicks: HIT_DELAY_TICKS,
  };

  return { result: { success: true }, newMana, projectile };
}
