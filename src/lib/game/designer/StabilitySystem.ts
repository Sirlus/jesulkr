// ============================================================
// Designer — Stability System (안정도 시스템)
// ============================================================
import type { Component, ColorConnectionGraph } from '../types';
import { getConnectedComponentsByColor } from './WireNetwork';
import { STABILITY } from '../constants';

/**
 * Check if a Stabilizer is active (connected to at least one active Blue Generator).
 */
export function isActiveStabilizer(
  comp: Component,
  components: Component[],
  graph: ColorConnectionGraph,
  isActiveBlue: (id: number) => boolean,
): boolean {
  const blues = getConnectedComponentsByColor(
    comp,
    components,
    graph,
    'blue',
    c => c.type === 'blueGen' && isActiveBlue(c.id),
  );
  return blues.length >= STABILITY.BLUE_REQUIRED;
}

/**
 * Calculate stability at a component's position from all active stabilizers.
 */
export function stabilityAt(
  comp: Component,
  components: Component[],
  activeStabilizerIds: Set<number>,
): number {
  let sum = 0;
  for (const other of components) {
    if (other.type !== 'stabilizer') continue;
    if (!activeStabilizerIds.has(other.id)) continue;
    if (chebyshevDistance(comp, other) <= STABILITY.RANGE) {
      sum += STABILITY.PER_STABILIZER;
    }
  }
  return sum;
}

/**
 * Calculate Chebyshev distance (max of dx, dy) between two components.
 * Considers the bounding boxes of both components.
 */
export function chebyshevDistance(a: Component, b: Component): number {
  const aRight = a.x + a.w - 1;
  const aBottom = a.y + a.h - 1;
  const bRight = b.x + b.w - 1;
  const bBottom = b.y + b.h - 1;

  const dx = Math.max(0, Math.max(b.x - aRight, a.x - bRight));
  const dy = Math.max(0, Math.max(b.y - aBottom, a.y - bBottom));

  return Math.max(dx, dy);
}
