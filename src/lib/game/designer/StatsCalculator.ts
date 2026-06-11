// ============================================================
// Designer — Spell stats calculator (calculateSpellStats)
// ============================================================
import type { Component, SpellStats } from '../types';
import { buildConnectionGraph, getConnectedComponents, getDirectNeighborComponents } from './WireNetwork';
import { CORE_AOE_TARGET_LIMIT } from '../constants';
import { getDef, CIRCUIT_TYPES } from './components/registry';

export interface SpellModel {
  width: number;
  height: number;
  components: Component[];
}

/**
 * Calculate all stats for a spell design:
 * - Mana cost
 * - Cast time (cooldown)
 * - Normal damage
 * - Special (AOE) damage
 * - Validity check
 */
export function calculateSpellStats(model: SpellModel): SpellStats {
  const { width, height, components } = model;
  const graph = buildConnectionGraph(components);

  const redSources = components.filter(c => c.type === 'red');
  const blueGens = components.filter(c => c.type === 'blueGen');
  const activeBlueIds = new Set<number>();
  const breakdown: string[] = [];

  // Determine active blue generators
  for (const b of blueGens) {
    const red = getConnectedComponents(b, components, graph, c => c.type === 'red').length;
    if (red >= 1) {
      activeBlueIds.add(b.id);
      breakdown.push(`파란 마나 생성기 ${b.id}: 연결 빨간 마나 ${red}개 → 활성, 비용 +2`);
    } else {
      breakdown.push(`파란 마나 생성기 ${b.id}: 연결 빨간 마나 없음 → 비활성`);
    }
  }

  let damage = 0;
  let aoeDamage = 0;

  const circuits = components.filter(c => CIRCUIT_TYPES.has(c.type));

  for (const c of circuits) {
    const red = getConnectedComponents(c, components, graph, x => x.type === 'red').length;
    const blue = getConnectedComponents(c, components, graph, x =>
      x.type === 'blueGen' && activeBlueIds.has(x.id),
    ).length;

    const def = getDef(c.type);
    const result = def?.calc?.({
      red,
      blue,
      component: c,
      components,
      neighbors: getDirectNeighborComponents(c, components),
      connectedTo: (target, predicate) =>
        getConnectedComponents(target, components, graph, predicate).length,
      isActiveBlue: id => activeBlueIds.has(id),
    });

    const d = result?.damage ?? 0;
    const label = def?.name ?? c.type;
    const detail = result?.detail ?? '';
    if (result?.aoe) aoeDamage += result.aoe;

    damage += d;
    breakdown.push(`${label} ${c.id}: ${detail} → ${d}`);
  }

  if (circuits.length === 0) breakdown.push('회로가 없습니다.');
  if (aoeDamage > 0) {
    breakdown.push(`특수 데미지: 분산 ${aoeDamage} (기지에 가까운 적 최대 ${CORE_AOE_TARGET_LIMIT}개)`);
  }
  breakdown.push(`총 일반 데미지: ${damage}`);

  const redCount = redSources.length;
  const activeBlueCount = activeBlueIds.size;
  const inactiveBlueCount = blueGens.length - activeBlueCount;
  const manaCost = redCount + activeBlueCount * 2;
  const castTime = width * height;

  return {
    castTime,
    seconds: castTime * (1 / 20),
    manaCost,
    redCount,
    activeBlueCount,
    inactiveBlueCount,
    damage,
    aoeDamage,
    breakdown,
    valid: redCount >= 1 && circuits.length >= 1 && damage >= 1,
  };
}
