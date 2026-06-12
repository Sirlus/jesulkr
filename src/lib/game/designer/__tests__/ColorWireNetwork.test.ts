/**
 * @file ColorWireNetwork.test.ts
 * v2 unit tests — Phase 7: color-aware wire connection graph.
 *
 * Verifies that the color-aware wire BFS:
 *   - properly partitions wires into red / blue / green networks,
 *   - respects wire rotation (small wire = 4-dir, mediumWire = straight, hub = 4-dir),
 *   - honors the active mediumHub allowlist,
 *   - and degrades gracefully for empty / single-node / cyclically-wired inputs.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  buildColorConnectionGraph,
  getConnectedComponentsByColor,
} from '../WireNetwork';
import type { Component } from '../../types';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

let nextId = 1;

/**
 * Build a Component with a deterministic id (auto-incremented) and the given shape.
 * Type is `as any` so we can freely mix in custom types not in the registry
 * (the BFS only checks `wire`, `mediumWire`, `mediumHub` membership).
 */
function c(
  type: string,
  x: number,
  y: number,
  w = 1,
  h = 1,
  rotation = 0,
): Component {
  return { id: nextId++, type: type as Component['type'], x, y, w, h, rotation };
}

beforeEach(() => {
  nextId = 1;
});

// ---------------------------------------------------------------------------
// buildColorConnectionGraph — happy path
// ---------------------------------------------------------------------------

describe('buildColorConnectionGraph — small wire', () => {
  it('should carry red and blue but not green when red/greenMana flank a small wire', () => {
    // Arrange
    const red = c('red', 0, 0);
    const wire = c('wire', 1, 0);
    const greenMana = c('greenMana', 2, 0, 2, 2);
    const components = [red, wire, greenMana];

    // Act
    const graph = buildColorConnectionGraph(components, new Set());

    // Assert — red reaches greenMana via red network
    expect(
      getConnectedComponentsByColor(red, components, graph, 'red', x => x.type === 'greenMana'),
    ).toHaveLength(1);

    // Assert — green is NOT carried by small wire
    expect(
      getConnectedComponentsByColor(greenMana, components, graph, 'green', x => x.type === 'red'),
    ).toHaveLength(0);
  });

  it('should propagate red through a 4-cell small-wire chain', () => {
    // Arrange: red → wire → wire → wire → circle
    const red = c('red', 0, 0);
    const w1 = c('wire', 1, 0);
    const w2 = c('wire', 2, 0);
    const w3 = c('wire', 3, 0);
    const circle = c('circle', 4, 0);
    const components = [red, w1, w2, w3, circle];

    // Act
    const graph = buildColorConnectionGraph(components, new Set());

    // Assert
    expect(
      getConnectedComponentsByColor(red, components, graph, 'red', x => x.type === 'circle'),
    ).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// buildColorConnectionGraph — mediumWire
// ---------------------------------------------------------------------------

describe('buildColorConnectionGraph — mediumWire', () => {
  it('should carry all three colors when the mediumWires are linked end-to-end', () => {
    // Arrange
    // A continuous horizontal chain of mediumWires connects all three endpoints.
    //   red(0,0) — mw(1,0) — mw(2,0) — mw(3,0) — mw(4,0) — greenMana(5,0,2,2)
    //                                       |
    //                                   blueGen(3,1)
    const red = c('red', 0, 0);
    const blueGen = c('blueGen', 3, 1);
    const greenMana = c('greenMana', 5, 0, 2, 2);
    const mw1 = c('mediumWire', 1, 0);
    const mw2 = c('mediumWire', 2, 0);
    const mw3 = c('mediumWire', 3, 0);
    const mw4 = c('mediumWire', 4, 0);
    const components = [red, blueGen, greenMana, mw1, mw2, mw3, mw4];

    // Act
    const graph = buildColorConnectionGraph(components, new Set());

    // Assert — red finds blueGen
    expect(
      getConnectedComponentsByColor(red, components, graph, 'red', x => x.type === 'blueGen'),
    ).toHaveLength(1);

    // Assert — red finds greenMana
    expect(
      getConnectedComponentsByColor(red, components, graph, 'red', x => x.type === 'greenMana'),
    ).toHaveLength(1);

    // Assert — greenMana finds blueGen
    expect(
      getConnectedComponentsByColor(greenMana, components, graph, 'green', x => x.type === 'blueGen'),
    ).toHaveLength(1);

    // Assert — blueGen finds greenMana
    expect(
      getConnectedComponentsByColor(blueGen, components, graph, 'blue', x => x.type === 'greenMana'),
    ).toHaveLength(1);
  });

  it('should not connect across a gap (no diagonal mediumWire)', () => {
    // Arrange: two isolated mediumWires that are not in each other's neighbor set
    const red = c('red', 0, 0);
    const mw = c('mediumWire', 1, 0);
    const circle = c('circle', 3, 0); // gap at (2,0)
    const components = [red, mw, circle];

    // Act
    const graph = buildColorConnectionGraph(components, new Set());

    // Assert — circle is NOT reached
    expect(
      getConnectedComponentsByColor(red, components, graph, 'red', x => x.type === 'circle'),
    ).toHaveLength(0);
  });

  it('should respect rotation: horizontal connects left/right, vertical connects up/down', () => {
    // Arrange
    const hWire = c('mediumWire', 1, 1, 1, 1, 0); // rotation 0 → horizontal
    const vWire = c('mediumWire', 5, 1, 1, 1, 1); // rotation 1 → vertical
    const components = [
      c('red', 0, 1),
      c('circle', 2, 1),
      hWire,
      c('red', 5, 0),
      c('circle', 5, 2),
      vWire,
    ];

    // Act
    const graph = buildColorConnectionGraph(components, new Set());

    // Assert
    expect(
      getConnectedComponentsByColor(components[0], components, graph, 'red', x => x.type === 'circle'),
    ).toHaveLength(1);
    expect(
      getConnectedComponentsByColor(components[3], components, graph, 'red', x => x.type === 'circle'),
    ).toHaveLength(1);
  });

  it('should treat rotation 2 as horizontal and rotation 3 as vertical', () => {
    // Arrange: rotation 2 and 3 are aliases of 0 and 1
    const hWire = c('mediumWire', 1, 1, 1, 1, 2); // rotation 2 → horizontal
    const vWire = c('mediumWire', 5, 1, 1, 1, 3); // rotation 3 → vertical
    const components = [
      c('red', 0, 1),
      c('circle', 2, 1),
      hWire,
      c('red', 5, 0),
      c('circle', 5, 2),
      vWire,
    ];

    // Act
    const graph = buildColorConnectionGraph(components, new Set());

    // Assert
    expect(
      getConnectedComponentsByColor(components[0], components, graph, 'red', x => x.type === 'circle'),
    ).toHaveLength(1);
    expect(
      getConnectedComponentsByColor(components[3], components, graph, 'red', x => x.type === 'circle'),
    ).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// buildColorConnectionGraph — mediumHub
// ---------------------------------------------------------------------------

describe('buildColorConnectionGraph — mediumHub', () => {
  it('should participate in the graph only when listed in activeHubIds', () => {
    // Arrange
    const red = c('red', 0, 0);
    const hub = c('mediumHub', 1, 0);
    const circle = c('circle', 2, 0);
    const components = [red, hub, circle];

    // Act + Assert — active hub lets the signal through
    const activeGraph = buildColorConnectionGraph(components, new Set([hub.id]));
    expect(
      getConnectedComponentsByColor(red, components, activeGraph, 'red', x => x.type === 'circle'),
    ).toHaveLength(1);

    // Act + Assert — inactive hub blocks the signal
    const inactiveGraph = buildColorConnectionGraph(components, new Set());
    expect(
      getConnectedComponentsByColor(red, components, inactiveGraph, 'red', x => x.type === 'circle'),
    ).toHaveLength(0);
  });

  it('should treat 4-direction (rotation does not constrain hub traversal)', () => {
    // Arrange: hub at (1,1) with circle above and below — both must be reachable
    const red = c('red', 0, 1);
    const hub = c('mediumHub', 1, 1, 1, 1, 0);
    const topCircle = c('circle', 1, 0);
    const bottomCircle = c('circle', 1, 2);
    const components = [red, hub, topCircle, bottomCircle];

    // Act
    const graph = buildColorConnectionGraph(components, new Set([hub.id]));

    // Assert — red reaches both circles
    const found = getConnectedComponentsByColor(
      red, components, graph, 'red', x => x.type === 'circle',
    );
    expect(found).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// buildColorConnectionGraph — graph shape and edge cases
// ---------------------------------------------------------------------------

describe('buildColorConnectionGraph — graph shape', () => {
  it('should return three independent connection graphs (red, blue, green)', () => {
    // Arrange
    const components = [
      c('red', 0, 0),
      c('blueGen', 0, 2),
      c('greenMana', 0, 4, 2, 2),
    ];

    // Act
    const graph = buildColorConnectionGraph(components, new Set());

    // Assert — the three subgraphs are objects with the ConnectionGraph shape
    expect(graph.red).toBeDefined();
    expect(graph.blue).toBeDefined();
    expect(graph.green).toBeDefined();
    expect(Array.isArray(graph.red.groups)).toBe(true);
    expect(Array.isArray(graph.blue.groups)).toBe(true);
    expect(Array.isArray(graph.green.groups)).toBe(true);
  });

  it('should produce empty groups for an empty component list', () => {
    // Arrange + Act
    const graph = buildColorConnectionGraph([], new Set());

    // Assert
    expect(graph.red.groups).toHaveLength(0);
    expect(graph.blue.groups).toHaveLength(0);
    expect(graph.green.groups).toHaveLength(0);
    expect(graph.red.compGroups.size).toBe(0);
  });

  it('should produce an empty group for a single isolated wire (no neighbors)', () => {
    // Arrange
    const wire = c('wire', 5, 5);

    // Act
    const graph = buildColorConnectionGraph([wire], new Set());

    // Assert — one group, no connected non-wire components
    expect(graph.red.groups).toHaveLength(1);
    expect(graph.red.groups[0].ids).toEqual(new Set([wire.id]));
    expect(graph.red.groups[0].components.size).toBe(0);
  });

  it('should treat two parallel wires (no shared cell) as two separate groups', () => {
    // Arrange
    const w1 = c('wire', 0, 0);
    const w2 = c('wire', 0, 5);

    // Act
    const graph = buildColorConnectionGraph([w1, w2], new Set());

    // Assert
    expect(graph.red.groups).toHaveLength(2);
  });

  it('should handle a 4-cell closed cycle of small wires', () => {
    // Arrange: square loop (0,0)-(1,0)-(1,1)-(0,1) — all reachable from (0,0)
    const w0 = c('wire', 0, 0);
    const w1 = c('wire', 1, 0);
    const w2 = c('wire', 1, 1);
    const w3 = c('wire', 0, 1);

    // Act
    const graph = buildColorConnectionGraph([w0, w1, w2, w3], new Set());

    // Assert — all four wires belong to a single group
    expect(graph.red.groups).toHaveLength(1);
    const allIds = graph.red.groups[0].ids;
    expect(allIds).toEqual(new Set([w0.id, w1.id, w2.id, w3.id]));
  });

  it('should keep large and small wires on the same color network when interleaved', () => {
    // Arrange: mediumWire(2,0) bridges two small wires around a non-wire source
    const red = c('red', 0, 0);
    const sw1 = c('wire', 1, 0);
    const mw = c('mediumWire', 2, 0);
    const sw2 = c('wire', 3, 0);
    const circle = c('circle', 4, 0);
    const components = [red, sw1, mw, sw2, circle];

    // Act
    const graph = buildColorConnectionGraph(components, new Set());

    // Assert
    expect(
      getConnectedComponentsByColor(red, components, graph, 'red', x => x.type === 'circle'),
    ).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// getConnectedComponentsByColor — predicate behavior
// ---------------------------------------------------------------------------

describe('getConnectedComponentsByColor — predicate behavior', () => {
  it('should return an empty array when no component matches the predicate', () => {
    // Arrange
    const red = c('red', 0, 0);
    const circle = c('circle', 1, 0);
    const components = [red, circle];

    // Act
    const graph = buildColorConnectionGraph(components, new Set());
    const result = getConnectedComponentsByColor(
      red, components, graph, 'red', () => false,
    );

    // Assert
    expect(result).toEqual([]);
  });

  it('should return unique components even when reachable via multiple paths', () => {
    // Arrange: a square wire loop creates two paths from red to circle
    //   red(0,0) — w(1,0) —+
    //                       |— w(2,0) — circle(3,0)
    //              w(1,1) —+
    const red = c('red', 0, 0);
    const circle = c('circle', 3, 0);
    const w0 = c('wire', 1, 0);
    const w1 = c('wire', 2, 0);
    const w2 = c('wire', 1, 1);
    const w3 = c('wire', 2, 1);
    const components = [red, circle, w0, w1, w2, w3];

    // Act
    const graph = buildColorConnectionGraph(components, new Set());
    const result = getConnectedComponentsByColor(
      red, components, graph, 'red', x => x.type === 'circle',
    );

    // Assert — the circle is reported once, not twice
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(circle.id);
  });

  it('should include direct neighbors plus network neighbors in a single result set', () => {
    // Arrange: red is directly adjacent to a wire, and connected to both circles
    //   red(0,0) — w(1,0) — w(2,0) — w(3,0) — indirectCircle(4,0)
    //               |
    //           directCircle(1,1)
    const red = c('red', 0, 0);
    const directCircle = c('circle', 1, 1);
    const w0 = c('wire', 1, 0);
    const w1 = c('wire', 2, 0);
    const w2 = c('wire', 3, 0);
    const indirectCircle = c('circle', 4, 0);
    const components = [red, directCircle, w0, w1, w2, indirectCircle];

    // Act
    const graph = buildColorConnectionGraph(components, new Set());
    const result = getConnectedComponentsByColor(
      red, components, graph, 'red', x => x.type === 'circle',
    );

    // Assert — both circles reported exactly once
    expect(result).toHaveLength(2);
    const ids = result.map(c => c.id).sort();
    expect(ids).toEqual([directCircle.id, indirectCircle.id].sort());
  });
});