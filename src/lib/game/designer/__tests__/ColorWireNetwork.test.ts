import { describe, it, expect } from 'vitest';
import { buildColorConnectionGraph, getConnectedComponentsByColor } from '../WireNetwork';
import type { Component } from '../../types';

function c(
  id: number,
  type: string,
  x: number,
  y: number,
  w = 1,
  h = 1,
  rotation = 0,
): Component {
  return { id, type: type as any, x, y, w, h, rotation };
}

describe('buildColorConnectionGraph', () => {
  it('small wire carries red and blue but not green', () => {
    const components = [
      c(1, 'red', 0, 0),
      c(2, 'wire', 1, 0),
      c(3, 'greenMana', 2, 0, 2, 2),
    ];
    const graph = buildColorConnectionGraph(components, new Set());

    // red can pass through small wire
    const redConnected = getConnectedComponentsByColor(
      components[0], components, graph, 'red', x => x.type === 'greenMana',
    );
    expect(redConnected).toHaveLength(1);

    // green cannot pass through small wire
    const greenConnected = getConnectedComponentsByColor(
      components[2], components, graph, 'green', x => x.type === 'red',
    );
    expect(greenConnected).toHaveLength(0);
  });

  it('mediumWire carries all three colors', () => {
    const components = [
      c(1, 'red', 0, 0),
      c(2, 'blueGen', 2, 0),
      c(3, 'greenMana', 4, 0, 2, 2),
      c(4, 'mediumWire', 1, 0),
      c(5, 'mediumWire', 3, 0),
    ];
    const graph = buildColorConnectionGraph(components, new Set());

    expect(getConnectedComponentsByColor(
      components[0], components, graph, 'red', x => x.type === 'blueGen',
    )).toHaveLength(1);

    expect(getConnectedComponentsByColor(
      components[0], components, graph, 'green', x => x.type === 'greenMana',
    )).toHaveLength(1);

    expect(getConnectedComponentsByColor(
      components[2], components, graph, 'blue', x => x.type === 'blueGen',
    )).toHaveLength(1);
  });

  it('mediumHub participates only when active', () => {
    const hub = c(1, 'mediumHub', 1, 0);
    const components = [
      c(2, 'red', 0, 0),
      hub,
      c(3, 'circle', 2, 0),
    ];

    // active hub
    const activeGraph = buildColorConnectionGraph(components, new Set([hub.id]));
    const connected = getConnectedComponentsByColor(
      components[0], components, activeGraph, 'red', x => x.type === 'circle',
    );
    expect(connected).toHaveLength(1);

    // inactive hub
    const inactiveGraph = buildColorConnectionGraph(components, new Set());
    const notConnected = getConnectedComponentsByColor(
      components[0], components, inactiveGraph, 'red', x => x.type === 'circle',
    );
    expect(notConnected).toHaveLength(0);
  });

  it('mediumWire respects rotation: horizontal connects left/right, vertical connects up/down', () => {
    const horizontalWire = c(1, 'mediumWire', 1, 1, 1, 1, 0);
    const verticalWire = c(2, 'mediumWire', 5, 1, 1, 1, 1);

    const components = [
      c(3, 'red', 0, 1),
      c(4, 'circle', 2, 1),
      horizontalWire,
      c(5, 'red', 5, 0),
      c(6, 'circle', 5, 2),
      verticalWire,
    ];

    const graph = buildColorConnectionGraph(components, new Set());

    // horizontal wire connects red(0,1) to circle(2,1)
    expect(getConnectedComponentsByColor(
      components[0], components, graph, 'red', x => x.type === 'circle',
    )).toHaveLength(1);

    // vertical wire connects red(5,0) to circle(5,2)
    expect(getConnectedComponentsByColor(
      components[3], components, graph, 'red', x => x.type === 'circle',
    )).toHaveLength(1);
  });
});
