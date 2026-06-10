// ============================================================
// Designer — Wire connection network (buildConnectionGraph)
// ============================================================
import type { Component, ConnectionGraph, WireGroup } from '../types';
import { componentAt, componentsOverlap } from './Components';

/** Get neighboring cell coordinates (4-dir) */
export function neighborCells(x: number, y: number): [number, number][] {
  return [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]];
}

/**
 * Build a wire connection graph.
 * Groups connected wires into networks, then records which non-wire components
 * touch each wire network.
 */
export function buildConnectionGraph(components: Component[]): ConnectionGraph {
  const wireMap = new Map<string, Component>();
  for (const c of components) {
    if (c.type === 'wire') wireMap.set(`${c.x},${c.y}`, c);
  }

  const visited = new Set<number>();
  const groups: WireGroup[] = [];
  const compGroups = new Map<number, Set<number>>();

  for (const wire of components.filter(c => c.type === 'wire')) {
    if (visited.has(wire.id)) continue;

    const q: Component[] = [wire];
    const ids = new Set<number>([wire.id]);
    const cells = new Set<string>([`${wire.x},${wire.y}`]);
    visited.add(wire.id);

    while (q.length) {
      const w = q.shift()!;
      for (const [nx, ny] of neighborCells(w.x, w.y)) {
        const key = `${nx},${ny}`;
        const other = wireMap.get(key);
        if (other && !visited.has(other.id)) {
          visited.add(other.id);
          ids.add(other.id);
          cells.add(`${other.x},${other.y}`);
          q.push(other);
        }
      }
    }

    groups.push({ ids, cells, components: new Set() });
  }

  for (let gi = 0; gi < groups.length; gi++) {
    const group = groups[gi];
    for (const key of group.cells) {
      const [x, y] = key.split(',').map(Number);
      for (const [nx, ny] of neighborCells(x, y)) {
        const comp = componentAt(components, nx, ny);
        if (comp && comp.type !== 'wire') {
          group.components.add(comp.id);
          if (!compGroups.has(comp.id)) compGroups.set(comp.id, new Set());
          compGroups.get(comp.id)!.add(gi);
        }
      }
    }
  }

  return { groups, compGroups };
}

/**
 * Get all directly adjacent components (4-dir) plus those connected via wire network.
 */
export function getConnectedComponents(
  component: Component,
  components: Component[],
  graph: ConnectionGraph,
  predicate: (c: Component) => boolean,
): Component[] {
  const result = new Map<number, Component>();

  // Direct neighbors
  for (const other of getDirectNeighborComponents(component, components)) {
    if (predicate(other)) result.set(other.id, other);
  }

  // Wire network neighbors
  const groupIds = graph.compGroups.get(component.id);
  if (groupIds) {
    for (const gi of groupIds) {
      for (const compId of graph.groups[gi].components) {
        if (compId === component.id) continue;
        const other = components.find(c => c.id === compId);
        if (other && predicate(other)) result.set(other.id, other);
      }
    }
  }

  return [...result.values()];
}

/**
 * Get components directly orthogonally adjacent to a component.
 */
export function getDirectNeighborComponents(
  component: Component,
  components: Component[],
): Component[] {
  const result = new Map<number, Component>();
  const own = new Set<string>();

  for (let y = component.y; y < component.y + component.h; y++) {
    for (let x = component.x; x < component.x + component.w; x++) {
      own.add(`${x},${y}`);
    }
  }

  for (let y = component.y; y < component.y + component.h; y++) {
    for (let x = component.x; x < component.x + component.w; x++) {
      for (const [nx, ny] of neighborCells(x, y)) {
        if (own.has(`${nx},${ny}`)) continue;
        const other = componentAt(components, nx, ny);
        if (other && other.id !== component.id) result.set(other.id, other);
      }
    }
  }

  return [...result.values()];
}
