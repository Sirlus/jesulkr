// ============================================================
// Designer — Spell stats calculator (calculateSpellStats)
// ============================================================
import type { Component, SpellStats, ColorConnectionGraph, ExtractorColor } from '../types';
import { buildColorConnectionGraph, getConnectedComponentsByColor, getDirectNeighborComponents } from './WireNetwork';
import { isActiveStabilizer, stabilityAt } from './StabilitySystem';
import { extractorHasInputOfColor, extractorOutputTarget } from './ExtractorSystem';
import { GREEN_MANA, MEDIUM_HUB, CORE_AOE_TARGET_LIMIT } from '../constants';
import { getDef, CIRCUIT_TYPES } from './components/registry';
import { getRedPower, getRedCost } from './components/red';
import type { CalcContext } from './components/def';

export interface SpellModel {
  width: number;
  height: number;
  components: Component[];
}

interface ExtractorOutput {
  color: ExtractorColor;
  targetId: number;
}

/** Count red power connected to a component via the red-bearing network. */
function countRedPower(
  component: Component,
  components: Component[],
  graph: ColorConnectionGraph,
): number {
  const sources = getConnectedComponentsByColor(
    component, components, graph, 'red',
    c => getRedPower(c) > 0,
  );
  return sources.reduce((sum, c) => sum + getRedPower(c), 0);
}

/** Count active blue generators connected to a component via the blue-bearing network. */
function countActiveBlue(
  component: Component,
  components: Component[],
  graph: ColorConnectionGraph,
  activeBlueIds: Set<number>,
): number {
  return getConnectedComponentsByColor(
    component, components, graph, 'blue',
    c => c.type === 'blueGen' && activeBlueIds.has(c.id),
  ).length;
}

/** Count active green mana connected to a component via the green-bearing network. */
function countActiveGreen(
  component: Component,
  components: Component[],
  graph: ColorConnectionGraph,
  activeGreenIds: Set<number>,
): number {
  return getConnectedComponentsByColor(
    component, components, graph, 'green',
    c => c.type === 'greenMana' && activeGreenIds.has(c.id),
  ).length;
}

/**
 * Calculate all stats for a spell design.
 *
 * v2 calculation order (multi-pass):
 * 1. Active blue generators (need red connection)
 * 2. Active stabilizers (need active blue connection)
 * 3. Stability map
 * 4. Active medium hubs (need stability ≥ 1)
 * 5. Rebuild color graphs until hub activation converges
 * 6. Active green mana (need mixed2 contact)
 * 7. Extractor outputs
 * 8. Circuit damage / aoe / globalDamage
 */
export function calculateSpellStats(model: SpellModel): SpellStats {
  const { width, height, components } = model;
  const breakdown: string[] = [];

  const blueGens = components.filter(c => c.type === 'blueGen');
  const stabilizers = components.filter(c => c.type === 'stabilizer');
  const hubs = components.filter(c => c.type === 'mediumHub');
  const greenManas = components.filter(c => c.type === 'greenMana');
  const extractors = components.filter(c => c.type === 'extractor');

// ── 1~5. Fixed-point iteration for active hubs ─────────────────
  // Start with empty hub set - only activate hubs when stability >= 1 is detected
  let activeHubIds = new Set<number>();
  let graph = buildColorConnectionGraph(components, activeHubIds);
  let activeBlueIds = new Set<number>();
  let activeStabilizerIds = new Set<number>();
  let stabilityMap = new Map<number, number>();
  let converged = false;

  for (let iter = 0; iter < 5; iter++) {
    // Active blue generators
    activeBlueIds = new Set<number>();
    for (const b of blueGens) {
      if (countRedPower(b, components, graph) >= 1) {
        activeBlueIds.add(b.id);
      }
    }

    // Active stabilizers
    activeStabilizerIds = new Set<number>();
    for (const s of stabilizers) {
      if (isActiveStabilizer(s, components, graph, id => activeBlueIds.has(id))) {
        activeStabilizerIds.add(s.id);
      }
    }

    // Stability map
    stabilityMap = new Map<number, number>();
    for (const c of components) {
      stabilityMap.set(c.id, stabilityAt(c, components, activeStabilizerIds));
    }

    // Active hubs
    const nextHubIds = new Set<number>();
    for (const h of hubs) {
      if ((stabilityMap.get(h.id) ?? 0) >= MEDIUM_HUB.STABILITY_REQUIRED) {
        nextHubIds.add(h.id);
      }
    }

    const changed =
      nextHubIds.size !== activeHubIds.size ||
      [...nextHubIds].some(id => !activeHubIds.has(id));

    activeHubIds = nextHubIds;

    if (!changed) {
      converged = true;
      break;
    }

    graph = buildColorConnectionGraph(components, activeHubIds);
  }

  if (!converged) {
    breakdown.push('경고: 중형 허브 활성화가 고정점에 도달하지 못했습니다.');
  }

  if (activeBlueIds.size > 0) {
    breakdown.push(`활성 파란 마나 생성기: ${activeBlueIds.size}개`);
  }
  if (activeStabilizerIds.size > 0) {
    breakdown.push(`활성 안정기: ${activeStabilizerIds.size}개`);
  }
  if (activeHubIds.size > 0) {
    breakdown.push(`활성 중형 허브: ${activeHubIds.size}개`);
  }

  // ── 6. Active green mana ───────────────────────────────────────
  const activeGreenIds = new Set<number>();
  for (const g of greenManas) {
    const touchingMixed2 = getDirectNeighborComponents(g, components).some(c => c.type === 'mixed2');
    if (touchingMixed2) {
      activeGreenIds.add(g.id);
    }
  }
  if (activeGreenIds.size > 0) {
    breakdown.push(`활성 초록 마나: ${activeGreenIds.size}개 (mixed2 접촉)`);
  }

  // ── 7. Extractor outputs ───────────────────────────────────────
  const extractorOutputs = new Map<number, ExtractorOutput>();
  for (const e of extractors) {
    const color = e.color ?? 'red';
    if (extractorHasInputOfColor(e, components, graph, color)) {
      const target = extractorOutputTarget(e, components);
      if (target) {
        extractorOutputs.set(e.id, { color, targetId: target.id });
      }
    }
  }
  if (extractorOutputs.size > 0) {
    const summary = [...extractorOutputs.entries()]
      .map(([id, out]) => `${id}:${out.color}`)
      .join(', ');
    breakdown.push(`추출기 출력: ${summary}`);
  }

  // ── 8. Circuit damage ──────────────────────────────────────────
  let damage = 0;
  let aoeDamage = 0;
  let globalDamage = 0;
  const circuits = components.filter(c => CIRCUIT_TYPES.has(c.type));

  for (const c of circuits) {
    const red = countRedPower(c, components, graph);
    const blue = countActiveBlue(c, components, graph, activeBlueIds);
    const green = countActiveGreen(c, components, graph, activeGreenIds);

    // Extractor outputs targeting this circuit
    let redFromExtractors = 0;
    let blueFromExtractors = 0;
    let greenFromExtractors = 0;
    for (const out of extractorOutputs.values()) {
      if (out.targetId !== c.id) continue;
      if (out.color === 'red') redFromExtractors++;
      else if (out.color === 'blue') blueFromExtractors++;
      else if (out.color === 'green') greenFromExtractors++;
    }

    const ctx: CalcContext = {
      red: red + redFromExtractors,
      blue: blue + blueFromExtractors,
      green: green + greenFromExtractors,
      stability: stabilityMap.get(c.id) ?? 0,
      component: c,
      components,
      neighbors: getDirectNeighborComponents(c, components),
      connectedTo: (target, predicate) =>
        getConnectedComponentsByColor(target, components, graph, 'red', predicate).length,
      isActiveBlue: id => activeBlueIds.has(id),
      isActiveStabilizer: id => activeStabilizerIds.has(id),
      isActiveHub: id => activeHubIds.has(id),
    };

    const def = getDef(c.type);
    const result = def?.calc?.(ctx) ?? { damage: 0, detail: '' };

    damage += result.damage ?? 0;
    aoeDamage += result.aoe ?? 0;
    globalDamage += result.globalDamage ?? 0;

    const label = def?.name ?? c.type;
    const extra: string[] = [];
    if (result.aoe) extra.push(`분산 ${result.aoe}`);
    if (result.globalDamage) extra.push(`전체 ${result.globalDamage}`);
    const extraStr = extra.length > 0 ? ` (${extra.join(', ')})` : '';
    breakdown.push(`${label} ${c.id}: ${result.detail} → 일반 ${result.damage ?? 0}${extraStr}`);
  }

  if (circuits.length === 0) breakdown.push('회로가 없습니다.');
  if (aoeDamage > 0) {
    breakdown.push(`특수 데미지: 분산 ${aoeDamage} (기지에 가까운 적 최대 ${CORE_AOE_TARGET_LIMIT}개)`);
  }
  if (globalDamage > 0) {
    breakdown.push(`전체 데미지: ${globalDamage} (모든 몬스터)`);
  }
  breakdown.push(`총 일반 데미지: ${damage}`);

  // ── 9. Cost and validity ───────────────────────────────────────
  const redSources = components.filter(c => c.type === 'red' || c.type === 'red3');
  const redCount = redSources.length;
  const redManaCost = redSources.reduce((sum, c) => sum + getRedCost(c), 0);
  const greenCount = activeGreenIds.size;
  const greenManaCost = greenCount * GREEN_MANA.COST_PER_ACTIVE;
  const activeBlueCount = activeBlueIds.size;
  const inactiveBlueCount = blueGens.length - activeBlueCount;
  const activeStabilizerCount = activeStabilizerIds.size;
  const activeHubCount = activeHubIds.size;
  const maxStability = Math.max(0, ...components.map(c => stabilityMap.get(c.id) ?? 0));
  const manaCost = redManaCost + greenManaCost + activeBlueCount * 2;
  const castTime = width * height;

  return {
    castTime,
    seconds: castTime * (1 / 20),
    manaCost,
    redCount,
    redManaCost,
    greenCount,
    greenManaCost,
    activeBlueCount,
    inactiveBlueCount,
    activeStabilizerCount,
    activeHubCount,
    maxStability,
    damage,
    aoeDamage,
    globalDamage,
    breakdown,
    valid: redCount >= 1 && circuits.length >= 1 && damage >= 1,
  };
}
