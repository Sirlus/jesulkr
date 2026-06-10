// ============================================================
// Designer — Spell stats calculator (calculateSpellStats)
// ============================================================
import type { Component, SpellStats } from '../types';
import { buildConnectionGraph, getConnectedComponents, getDirectNeighborComponents } from './WireNetwork';
import { CORE_AOE_TARGET_LIMIT } from '../constants';

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

  const circuits = components.filter(c =>
    ['circle', 'oval', 'kernel', 'mixed2', 'mixedCore'].includes(c.type),
  );

  for (const c of circuits) {
    const red = getConnectedComponents(c, components, graph, x => x.type === 'red').length;
    const blue = getConnectedComponents(c, components, graph, x =>
      x.type === 'blueGen' && activeBlueIds.has(x.id),
    ).length;

    let d = 0;
    let label = '';
    let detail = '';

    if (c.type === 'circle') {
      d = red;
      label = '1칸 회로';
      detail = `빨간 ${red}개 × 1`;
    } else if (c.type === 'oval') {
      const groups = Math.floor(red / 2);
      d = groups * 5;
      label = '2칸 타원';
      detail = `floor(빨간 ${red} / 2) = ${groups}묶음 × 5`;
    } else if (c.type === 'kernel') {
      const groups = Math.floor(red / 3);
      d = groups * 12;
      label = '2x2 핵';
      detail = `floor(빨간 ${red} / 3) = ${groups}묶음 × 12`;
    } else if (c.type === 'mixed2') {
      const pairs = Math.min(red, blue);
      d = pairs * 8;
      label = '2칸 혼합 회로';
      detail = `min(빨간 ${red}, 파란 ${blue}) = ${pairs}쌍 × 8`;
    } else if (c.type === 'mixedCore') {
      const neighborCircles = getDirectNeighborComponents(c, components).filter(x => x.type === 'circle');
      const activeCircleCount = neighborCircles.filter(x =>
        getConnectedComponents(x, components, graph, y => y.type === 'red').length >= 1,
      ).length;
      const inactiveCircleCount = neighborCircles.length - activeCircleCount;
      const bluePairs = Math.floor(blue / 2);
      const groups = Math.min(red, bluePairs, activeCircleCount);
      d = groups * 60;
      if (groups > 0) aoeDamage += groups * 3;
      label = '9칸 혼합 핵';
      detail = `min(빨강 ${red}, floor(파란 ${blue} / 2) = ${bluePairs}, 인접 활성 1칸 회로 ${activeCircleCount}) = ${groups}묶음 × (일반 60 + 분산 3)`;
      if (groups > 0) detail += ` / 일반 ${d}, 특수 분산 ${groups * 3}`;
      if (inactiveCircleCount > 0) detail += ` / 비활성 1칸 회로 ${inactiveCircleCount}개 제외`;
    }

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
