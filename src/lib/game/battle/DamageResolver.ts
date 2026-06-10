// ============================================================
// Battle — Damage resolution (resolveCast)
// ============================================================
import type { Monster, CastProjectile, VisualEffect, SpellData } from '../types';
import { CORE_AOE_TARGET_LIMIT } from '../constants';
import { getAutoTarget } from './TargetingSystem';

export interface ResolveResult {
  monsters: Monster[];
  effects: VisualEffect[];
  scoreDelta: number;
  killedAny: boolean;
  aoeEffects: VisualEffect[];
}

/**
 * Resolve a cast projectile upon arrival.
 * Applies normal damage + AOE scatter damage, returns kills and score.
 */
export function resolveCast(
  cast: CastProjectile,
  monsters: Monster[],
  canvasWidth: number,
  canvasHeight: number,
): ResolveResult {
  let target = monsters.find(m => m.id === cast.targetId && m.hp > 0);
  if (!target) target = getAutoTarget(monsters);
  if (!target) {
    return { monsters, effects: [], scoreDelta: 0, killedAny: false, aoeEffects: [] };
  }

  const effects: VisualEffect[] = [];
  const aoeEffects: VisualEffect[] = [];
  const dmg = cast.spell.damage;
  target.hp -= dmg;
  effects.push({
    type: 'hit', x: target.x, y: target.y, t: 0, life: 0.5, text: `-${dmg}`,
  });

  // AOE (Scatter from 9-cell Hybrid Core)
  const aoe = Number(cast.spell.aoeDamage) || 0;
  if (aoe > 0) {
    const aoeTargets = monsters
      .filter(m => m.hp > 0)
      .sort((a, b) => b.y - a.y)
      .slice(0, CORE_AOE_TARGET_LIMIT);

    for (const m of aoeTargets) {
      m.hp -= aoe;
      effects.push({
        type: 'hit', x: m.x, y: m.y, t: 0, life: 0.42, text: `-${aoe}`,
      });
    }
    aoeEffects.push({
      type: 'aoe', x: canvasWidth / 2, y: canvasHeight / 2, t: 0, life: 0.55, text: `분산 ${aoe}`,
    });
  }

  // Score and kill effects
  let scoreDelta = 0;
  let killedAny = false;
  for (const m of monsters) {
    if (m.hp <= 0) {
      killedAny = true;
      scoreDelta += m.maxHp * 10;
      effects.push({
        type: 'kill', x: m.x, y: m.y, t: 0, life: 0.7, text: `+${m.maxHp * 10}`,
      });
    }
  }

  return { monsters, effects, scoreDelta, killedAny, aoeEffects };
}
