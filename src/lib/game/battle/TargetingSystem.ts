// ============================================================
// Battle — Targeting
// ============================================================
import type { Monster } from '../types';

/** Get the enemy closest to the base (highest y) */
export function getAutoTarget(monsters: Monster[]): Monster | null {
  let best: Monster | null = null;
  for (const m of monsters) {
    if (m.hp <= 0) continue;
    if (!best || m.y > best.y) best = m;
  }
  return best;
}

/** Get the current target: selected if alive, otherwise auto-target */
export function getCurrentTarget(
  monsters: Monster[],
  selectedTargetId: number | null,
): Monster | null {
  if (selectedTargetId != null) {
    const sel = monsters.find(m => m.id === selectedTargetId && m.hp > 0);
    if (sel) return sel;
  }
  return getAutoTarget(monsters);
}

/** Pick a monster by canvas click coordinates */
export function pickMonsterAt(
  monsters: Monster[],
  canvasX: number,
  canvasY: number,
): Monster | null {
  let picked: Monster | null = null;
  let best = Infinity;
  for (const m of monsters) {
    const d = Math.hypot(m.x - canvasX, m.y - canvasY);
    const r = m.boss ? 44 : 30;
    if (d < r && d < best) { picked = m; best = d; }
  }
  return picked;
}
