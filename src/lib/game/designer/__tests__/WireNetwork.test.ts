import { describe, it, expect } from 'vitest';
import { buildConnectionGraph, neighborCells, getDirectNeighborComponents } from '../WireNetwork';

describe('neighborCells', () => {
  it('returns 4 directional neighbors', () => {
    const neighbors = neighborCells(1, 1);
    expect(neighbors).toContainEqual([2, 1]);
    expect(neighbors).toContainEqual([0, 1]);
    expect(neighbors).toContainEqual([1, 2]);
    expect(neighbors).toContainEqual([1, 0]);
    expect(neighbors).toHaveLength(4);
  });
});

describe('buildConnectionGraph', () => {
  it('returns empty graph for no wires', () => {
    const components = [
      { id: 1, type: 'red' as const, x: 0, y: 0, w: 1, h: 1, rotation: 0 },
    ];
    const graph = buildConnectionGraph(components);
    expect(graph.groups).toHaveLength(0);
    expect(graph.compGroups.size).toBe(0);
  });

  it('groups connected wires', () => {
    const components = [
      { id: 1, type: 'wire' as const, x: 0, y: 0, w: 1, h: 1, rotation: 0 },
      { id: 2, type: 'wire' as const, x: 1, y: 0, w: 1, h: 1, rotation: 0 },
      { id: 3, type: 'wire' as const, x: 3, y: 3, w: 1, h: 1, rotation: 0 },
    ];
    const graph = buildConnectionGraph(components);
    expect(graph.groups).toHaveLength(2);
  });

  it('connects components through wire network', () => {
    const components = [
      { id: 1, type: 'wire' as const, x: 1, y: 0, w: 1, h: 1, rotation: 0 },
      { id: 2, type: 'wire' as const, x: 2, y: 0, w: 1, h: 1, rotation: 0 },
      { id: 3, type: 'red' as const, x: 0, y: 0, w: 1, h: 1, rotation: 0 },
      { id: 4, type: 'circle' as const, x: 3, y: 0, w: 1, h: 1, rotation: 0 },
    ];
    const graph = buildConnectionGraph(components);
    // Red (3) connected via wire (1,2) to circle (4)
    expect(graph.compGroups.has(3)).toBe(true);
    expect(graph.compGroups.has(4)).toBe(true);
  });
});

describe('getDirectNeighborComponents', () => {
  it('finds direct neighbors', () => {
    const components = [
      { id: 1, type: 'red' as const, x: 0, y: 0, w: 1, h: 1, rotation: 0 },
      { id: 2, type: 'circle' as const, x: 1, y: 0, w: 1, h: 1, rotation: 0 },
    ];
    const neighbors = getDirectNeighborComponents(components[0], components);
    expect(neighbors).toHaveLength(1);
    expect(neighbors[0].id).toBe(2);
  });

  it('returns empty for isolated component', () => {
    const components = [
      { id: 1, type: 'red' as const, x: 0, y: 0, w: 1, h: 1, rotation: 0 },
      { id: 2, type: 'circle' as const, x: 5, y: 5, w: 1, h: 1, rotation: 0 },
    ];
    const neighbors = getDirectNeighborComponents(components[0], components);
    expect(neighbors).toHaveLength(0);
  });
});
