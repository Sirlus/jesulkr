import { describe, it, expect } from 'vitest';
import { dimensionsFor, canPlaceComponent, componentAt, removeComponentAt, createComponentFromGridCoord, componentsOverlap } from '../Components';

describe('dimensionsFor', () => {
  it('returns 1x1 for red mana', () => {
    expect(dimensionsFor('red', 0)).toEqual({ w: 1, h: 1, rotation: 0 });
  });
  it('returns 2x1 for oval (horizontal)', () => {
    expect(dimensionsFor('oval', 0)).toEqual({ w: 2, h: 1, rotation: 0 });
  });
  it('returns 1x2 for oval (vertical)', () => {
    expect(dimensionsFor('oval', 1)).toEqual({ w: 1, h: 2, rotation: 1 });
  });
  it('returns 2x2 for kernel', () => {
    expect(dimensionsFor('kernel', 0)).toEqual({ w: 2, h: 2, rotation: 0 });
  });
  it('returns 3x3 for mixedCore', () => {
    expect(dimensionsFor('mixedCore', 0)).toEqual({ w: 3, h: 3, rotation: 0 });
  });
});

describe('componentsOverlap', () => {
  it('detects overlapping components', () => {
    const a = { id: 1, type: 'red' as const, x: 0, y: 0, w: 1, h: 1, rotation: 0 };
    const b = { id: 2, type: 'red' as const, x: 0, y: 0, w: 1, h: 1, rotation: 0 };
    expect(componentsOverlap(a, b)).toBe(true);
  });
  it('detects non-overlapping components', () => {
    const a = { id: 1, type: 'red' as const, x: 0, y: 0, w: 1, h: 1, rotation: 0 };
    const b = { id: 2, type: 'red' as const, x: 1, y: 1, w: 1, h: 1, rotation: 0 };
    expect(componentsOverlap(a, b)).toBe(false);
  });
});

describe('canPlaceComponent', () => {
  it('allows placement in empty board', () => {
    const comp = { id: 1, type: 'red' as const, x: 0, y: 0, w: 1, h: 1, rotation: 0 };
    expect(canPlaceComponent(comp, [], 2, 2)).toBe(true);
  });
  it('rejects placement out of bounds', () => {
    const comp = { id: 1, type: 'red' as const, x: 3, y: 0, w: 1, h: 1, rotation: 0 };
    expect(canPlaceComponent(comp, [], 2, 2)).toBe(false);
  });
  it('rejects overlapping placement', () => {
    const existing = [{ id: 1, type: 'red' as const, x: 0, y: 0, w: 1, h: 1, rotation: 0 }];
    const comp = { id: 2, type: 'red' as const, x: 0, y: 0, w: 1, h: 1, rotation: 0 };
    expect(canPlaceComponent(comp, existing, 2, 2)).toBe(false);
  });
});

describe('componentAt', () => {
  it('finds component at coordinate', () => {
    const components = [{ id: 1, type: 'red' as const, x: 0, y: 0, w: 2, h: 2, rotation: 0 }];
    expect(componentAt(components, 1, 1)?.id).toBe(1);
  });
  it('returns null for empty coordinate', () => {
    const components = [{ id: 1, type: 'red' as const, x: 0, y: 0, w: 1, h: 1, rotation: 0 }];
    expect(componentAt(components, 5, 5)).toBeNull();
  });
});

describe('removeComponentAt', () => {
  it('removes component at coordinate', () => {
    const components = [
      { id: 1, type: 'red' as const, x: 0, y: 0, w: 1, h: 1, rotation: 0 },
      { id: 2, type: 'circle' as const, x: 1, y: 0, w: 1, h: 1, rotation: 0 },
    ];
    const result = removeComponentAt(components, 0, 0);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(2);
  });
});

describe('createComponentFromGridCoord', () => {
  it('creates centered component', () => {
    const comp = createComponentFromGridCoord('red', 0.5, 0.5, 1, 0);
    expect(comp.x).toBe(0);
    expect(comp.y).toBe(0);
    expect(comp.w).toBe(1);
    expect(comp.h).toBe(1);
    expect(comp.id).toBe(1);
  });
  it('handles oval rotation', () => {
    const comp = createComponentFromGridCoord('oval', 1, 1, 2, 1);
    expect(comp.w).toBe(1);
    expect(comp.h).toBe(2);
    expect(comp.rotation).toBe(1);
  });
});
