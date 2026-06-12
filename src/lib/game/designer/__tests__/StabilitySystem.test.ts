import { describe, it, expect } from 'vitest';
import { isActiveStabilizer, stabilityAt, chebyshevDistance } from '../StabilitySystem';
import { buildColorConnectionGraph } from '../WireNetwork';
import { c } from './helpers';

describe('chebyshevDistance', () => {
  it('returns 1 for orthogonal neighbors', () => {
    const a = c(1, 'red', 0, 0);
    const b = c(2, 'red', 1, 0);
    expect(chebyshevDistance(a, b)).toBe(1);
  });

  it('returns 1 for diagonal neighbors', () => {
    const a = c(1, 'red', 0, 0);
    const b = c(2, 'red', 1, 1);
    expect(chebyshevDistance(a, b)).toBe(1);
  });

  it('returns 0 for overlapping components', () => {
    const a = c(1, 'red', 0, 0, 2, 2);
    const b = c(2, 'red', 1, 1, 2, 2);
    expect(chebyshevDistance(a, b)).toBe(0);
  });

  it('returns correct distance for far apart components', () => {
    const a = c(1, 'red', 0, 0);
    const b = c(2, 'red', 3, 4);
    expect(chebyshevDistance(a, b)).toBe(4);
  });
});

describe('isActiveStabilizer', () => {
  it('returns true when connected to an active blue generator', () => {
    const components = [
      c(1, 'red', 0, 0),
      c(2, 'blueGen', 1, 0),
      c(3, 'stabilizer', 2, 0),
    ];
    const graph = buildColorConnectionGraph(components, new Set());
    const activeBlueIds = new Set([2]);

    expect(isActiveStabilizer(components[2], components, graph, id => activeBlueIds.has(id))).toBe(true);
  });

  it('returns false when no active blue generator is connected', () => {
    const components = [
      c(1, 'stabilizer', 0, 0),
      c(2, 'blueGen', 1, 0),
    ];
    const graph = buildColorConnectionGraph(components, new Set());

    expect(isActiveStabilizer(components[0], components, graph, () => false)).toBe(false);
  });

  it('returns false when blue generator is inactive', () => {
    const components = [
      c(1, 'blueGen', 1, 0),
      c(2, 'stabilizer', 2, 0),
    ];
    const graph = buildColorConnectionGraph(components, new Set());

    // blueGen is inactive because no red connection
    expect(isActiveStabilizer(components[1], components, graph, () => false)).toBe(false);
  });
});

describe('stabilityAt', () => {
  it('returns stability from an active stabilizer within range', () => {
    const components = [
      c(1, 'stabilizer', 0, 0),
      c(2, 'circle', 1, 1),
    ];
    const stability = stabilityAt(components[1], components, new Set([1]));
    expect(stability).toBe(1);
  });

  it('returns 0 when stabilizer is out of range', () => {
    const components = [
      c(1, 'stabilizer', 0, 0),
      c(2, 'circle', 3, 3),
    ];
    const stability = stabilityAt(components[1], components, new Set([1]));
    expect(stability).toBe(0);
  });

  it('sums stability from multiple stabilizers', () => {
    const components = [
      c(1, 'stabilizer', 0, 0),
      c(2, 'stabilizer', 1, 0),
      c(3, 'circle', 0, 1),
    ];
    const stability = stabilityAt(components[2], components, new Set([1, 2]));
    expect(stability).toBe(2);
  });

  it('ignores inactive stabilizers', () => {
    const components = [
      c(1, 'stabilizer', 0, 0),
      c(2, 'circle', 1, 1),
    ];
    const stability = stabilityAt(components[1], components, new Set());
    expect(stability).toBe(0);
  });
});
