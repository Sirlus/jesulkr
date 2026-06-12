// ============================================================
// Designer — Wire connection network (buildConnectionGraph)
// ============================================================
import type { Component, ConnectionGraph, WireGroup, ColorConnectionGraph } from '../types';
import { componentAt } from './Components';
import { isWireType, getWireColors } from '../constants';

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

// ============================================================
// v2: Color-based Wire Network (색상별 도선망)
// ============================================================

type WireColor = 'red' | 'blue' | 'green';

/**
 * Check if a component type can carry a given color.
 * Uses constants from constants.ts (SMALL_WIRE.COLORS, MEDIUM_WIRE.COLORS)
 */
function isWireForColor(type: string, color: WireColor): boolean {
  const colors = getWireColors(type);
  return colors.includes(color);
}

/**
 * Get neighbor cells considering wire rotation for mediumWire.
 */
function getWireNeighborCells(comp: Component): [number, number][] {
  if (comp.type === 'mediumWire') {
    // rotation 0/2: horizontal (left/right), 1/3: vertical (up/down)
    const isHorizontal = comp.rotation === 0 || comp.rotation === 2;
    const dirs = isHorizontal
      ? [[1, 0], [-1, 0]]
      : [[0, 1], [0, -1]];
    return dirs.map(([dx, dy]) => [comp.x + dx, comp.y + dy]);
  }
  // wire, mediumHub: 4-direction
  return neighborCells(comp.x, comp.y);
}

/**
 * Get all cells occupied by a component (considers rotation for mediumWire).
 */
function getComponentCells(comp: Component): [number, number][] {
  const cells: [number, number][] = [];
  // Handle mediumWire rotation
  if (comp.type === 'mediumWire') {
    const isHorizontal = comp.rotation === 0 || comp.rotation === 2;
    if (isHorizontal) {
      // Horizontal: cells at (x, y) and (x+1, y) for 2-cell wire
      cells.push([comp.x, comp.y]);
      cells.push([comp.x + 1, comp.y]);
    } else {
      // Vertical: cells at (x, y) and (x, y+1)
      cells.push([comp.x, comp.y]);
      cells.push([comp.x, comp.y + 1]);
    }
    return cells;
  }
  // For other components, return all cells in their bounding box
  for (let dy = 0; dy < comp.h; dy++) {
    for (let dx = 0; dx < comp.w; dx++) {
      cells.push([comp.x + dx, comp.y + dy]);
    }
  }
  return cells;
}

/**
 * Build color-specific wire connection graphs.
 * Groups connected wires by color into networks.
 */
export function buildColorConnectionGraph(
  components: Component[],
  activeHubIds: Set<number>,
): ColorConnectionGraph {
  const createGraph = (color: WireColor): ConnectionGraph => {
    const wireMap = new Map<string, Component>();

    // Store wires at their anchor position only (for neighbor lookup)
    for (const c of components) {
      if (!isWireType(c.type)) continue;
      if (!isWireForColor(c.type, color)) continue;
      // For mediumHub, only include active hubs
      if (c.type === 'mediumHub' && !activeHubIds.has(c.id)) continue;
      wireMap.set(`${c.x},${c.y}`, c);
    }

    const visited = new Set<number>();
    const groups: WireGroup[] = [];
    const compGroups = new Map<number, Set<number>>();

    // Start BFS from all wires in the map
    for (const wire of components.filter(c => wireMap.has(`${c.x},${c.y}`))) {
      if (visited.has(wire.id)) continue;

      const q: Component[] = [wire];
      const ids = new Set<number>([wire.id]);
      const cells = new Set<string>([`${wire.x},${wire.y}`]);
      visited.add(wire.id);

      while (q.length) {
        const w = q.shift()!;
        // Use directional neighbor lookup based on rotation
        for (const [nx, ny] of getWireNeighborCells(w)) {
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

    // Add non-wire components connected to the wire network
    for (let gi = 0; gi < groups.length; gi++) {
      const group = groups[gi];
      for (const key of group.cells) {
        const [x, y] = key.split(',').map(Number);
        for (const [nx, ny] of neighborCells(x, y)) {
          const comp = componentAt(components, nx, ny);
          if (comp && !isWireType(comp.type)) {
            group.components.add(comp.id);
            if (!compGroups.has(comp.id)) compGroups.set(comp.id, new Set());
            compGroups.get(comp.id)!.add(gi);
          }
        }
      }
    }

    return { groups, compGroups };
  };

  return {
    red: createGraph('red'),
    blue: createGraph('blue'),
    green: createGraph('green'),
  };
}

/**
 * Get connected components by color.
 */
export function getConnectedComponentsByColor(
  component: Component,
  components: Component[],
  graph: ColorConnectionGraph,
  color: WireColor,
  predicate: (c: Component) => boolean,
): Component[] {
  const result = new Map<number, Component>();
  const colorGraph = graph[color];

  // Direct neighbors
  for (const other of getDirectNeighborComponents(component, components)) {
    if (predicate(other)) result.set(other.id, other);
  }

  // Wire network neighbors by color
  const groupIds = colorGraph?.compGroups.get(component.id);
  if (groupIds && colorGraph.groups) {
    for (const gi of groupIds) {
      for (const compId of colorGraph.groups[gi].components) {
        if (compId === component.id) continue;
        const other = components.find(c => c.id === compId);
        if (other && predicate(other)) result.set(other.id, other);
      }
    }
  }

  return [...result.values()];
}
