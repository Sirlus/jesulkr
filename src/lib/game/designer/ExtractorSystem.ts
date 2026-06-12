// ============================================================
// Designer — Extractor System (추출기 시스템)
// ============================================================
import type { Component, ExtractorColor, ColorConnectionGraph } from '../types';
import { componentAt } from './Components';
import { getConnectedComponentsByColor } from './WireNetwork';
import { EXTRACTOR } from '../constants';

/**
 * Cycle extractor color: red → blue → green → red
 */
export function cycleExtractorColor(color: ExtractorColor): ExtractorColor {
  const idx = EXTRACTOR.COLOR_CYCLE.indexOf(color);
  return EXTRACTOR.COLOR_CYCLE[(idx + 1) % EXTRACTOR.COLOR_CYCLE.length];
}

/**
 * Get the output direction of an extractor based on rotation.
 * Returns the offset to the adjacent cell in the output direction.
 */
export function getExtractorDirection(extractor: Component): { dx: number; dy: number } {
  return EXTRACTOR.DIRECTION_MAP[extractor.rotation % 4];
}

/**
 * Get the target component in the output direction of an extractor.
 */
export function extractorOutputTarget(
  extractor: Component,
  components: Component[],
): Component | null {
  const dir = getExtractorDirection(extractor);
  return componentAt(components, extractor.x + dir.dx, extractor.y + dir.dy);
}

/**
 * Check if the input side of an extractor is connected to a source of the given color.
 */
export function extractorHasInputOfColor(
  extractor: Component,
  components: Component[],
  graph: ColorConnectionGraph,
  color: ExtractorColor,
): boolean {
  const dir = getExtractorDirection(extractor);
  const inputX = extractor.x - dir.dx;
  const inputY = extractor.y - dir.dy;
  const inputComp = componentAt(components, inputX, inputY);

  if (!inputComp) return false;

  // Direct source
  if (isSourceOfColor(inputComp, color)) return true;

  // Connected via wire network
  if (isWireForColorAndActive(inputComp, color)) {
    const sources = getConnectedComponentsByColor(
      inputComp,
      components,
      graph,
      color,
      c => isSourceOfColor(c, color),
    );
    return sources.length > 0;
  }

  return false;
}

/**
 * Check if a component is a source of the given color.
 */
function isSourceOfColor(comp: Component, color: ExtractorColor): boolean {
  if (color === 'red') return comp.type === 'red' || comp.type === 'red3';
  if (color === 'blue') return comp.type === 'blueGen';
  if (color === 'green') return comp.type === 'greenMana';
  return false;
}

/**
 * Check if a component is a wire that can carry the given color.
 */
function isWireForColorAndActive(comp: Component, color: ExtractorColor): boolean {
  if (comp.type === 'wire') return color !== 'green';
  if (comp.type === 'mediumWire') return true;
  if (comp.type === 'mediumHub') return true;
  return false;
}
