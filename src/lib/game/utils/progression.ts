// ============================================================
// Progression helpers (stars, unlocks, mana regen)
// ============================================================
import type { Records, BattleState, GameState, Component } from '../types';
import { getMapProgressScore, getMapStars } from '../core/StorageRecords';
import { isMapUnlocked } from '../core/StorageUnlocks';
import { MANA_BONUS_STAR_COUNT, STAR_MANA_REGEN, BASE_MANA_REGEN } from '../constants';

export function getTotalStars(
  records: Records,
  battle: BattleState,
  state: GameState,
  activeRunMapId: number | null,
  includeCurrentRun: boolean = true,
): number {
  let total = 0;
  const runId = includeCurrentRun && (state === 'battle' || state === 'paused' || state === 'gameover') && battle.battleStarted
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

// ── Tool Unlock Helpers ──────────────────────────────────────
/**
 * 각 도구가 어느 맵 해금 시 사용 가능한지 반환합니다.
 * - 맵 1: red, circle, oval, kernel, eraser (기본)
 * - 맵 2: blueGen, wire, mixed2
 * - 맵 3: mixedCore
 */
export function requiredMapForTool(tool: string): number {
  if (tool === 'blueGen' || tool === 'wire' || tool === 'mixed2') return 2;
  if (tool === 'mixedCore') return 3;
  return 1;
}

/** 현재 해금 상태를 기준으로 도구가 사용 가능한지 확인합니다 */
export function isToolUnlocked(
  tool: string,
  unlocks: Record<string, boolean>,
  records: Records,
): boolean {
  return isMapUnlocked(requiredMapForTool(tool), unlocks, records);
}

/** 현재 설계판 부품 중 잠긴 도구의 이름 목록을 반환합니다 */
export function getLockedToolNamesFromComponents(
  components: Component[],
  unlocks: Record<string, boolean>,
  records: Records,
): string[] {
  const names: string[] = [];
  const seen = new Set<string>();
  for (const c of components || []) {
    const req = requiredMapForTool(c.type);
    if (req > 1 && !isMapUnlocked(req, unlocks, records) && !seen.has(c.type)) {
      seen.add(c.type);
      names.push(c.type);
    }
  }
  return names;
}
