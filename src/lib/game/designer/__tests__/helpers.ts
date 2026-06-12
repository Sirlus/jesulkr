/**
 * Shared test helpers for designer unit tests.
 */
import type { Component, ExtractorColor } from '../../types';

/**
 * Create a Component fixture with sensible defaults.
 * `color` is only relevant for extractor components.
 */
export function c(
  id: number,
  type: string,
  x: number,
  y: number,
  w = 1,
  h = 1,
  rotation = 0,
  color?: ExtractorColor,
): Component {
  return { id, type: type as Component['type'], x, y, w, h, rotation, color };
}
