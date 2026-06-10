// ============================================================
// Progression helpers (stars, unlocks, mana regen)
// ============================================================
import type { Records, BattleState, GameState } from '../types';
import { getMapProgressScore, getMapStars } from '../core/StorageRecords';
import { MANA_BONUS_STAR_COUNT, STAR_MANA_REGEN, BASE_MANA_REGEN } from '../constants';

export function getTotalStars(
  records: Records,
  battle: BattleState,
  state: GameState,
  activeRunMapId: number | null,
): number {
  let total = 0;
  const runId = (state === 'battle' || state === 'paused' || state === 'gameover') && battle.battleStarted
    ? Number(activeRunMapId || 0) : 0;

  for (const id of [1, 2, 3]) {
    let score = getMapProgressScore(records, id);
    if (runId === id) score = Math.max(score, battle.score || 0);
    total += getMapStars(records, id, score);
  }
  return total;
}

export function canUseManaBonus(
  records: Records, battle: BattleState, state: GameState, activeRunMapId: number | null,
): boolean {
  return getTotalStars(records, battle, state, activeRunMapId) >= MANA_BONUS_STAR_COUNT;
}
