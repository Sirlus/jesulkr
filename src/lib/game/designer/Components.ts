// ============================================================
// Designer — Component placement, collision, dimensions
// ============================================================
import type { Component, ComponentType, ExtractorColor } from '../types';
import { getDef } from './components/registry';

export function dimensionsFor(type: string, rotation: number): { w: number; h: number; rotation: number } {
  const size = getDef(type)?.size;
  if (!size) return { w: 1, h: 1, rotation: 0 };
  if (size.rotatable) {
    const r = rotation === 1 ? 1 : 0;
    // 회전 시 가로/세로를 교환합니다
    return r
      ? { w: Math.min(size.w, size.h), h: Math.max(size.w, size.h), rotation: 1 }
      : { w: Math.max(size.w, size.h), h: Math.min(size.w, size.h), rotation: 0 };
  }
  return { w: size.w, h: size.h, rotation: 0 };
}

export function componentsOverlap(a: Component, b: Component): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function canPlaceComponent(
  comp: Component,
  components: Component[],
  width: number,
  height: number,
): boolean {
  if (comp.x < 0 || comp.y < 0 || comp.x + comp.w > width || comp.y + comp.h > height) {
    return false;
  }
  for (const other of components) {
    if (componentsOverlap(comp, other)) return false;
  }
  return true;
}

export function componentAt(components: Component[], x: number, y: number): Component | null {
  return components.find(c => x >= c.x && x < c.x + c.w && y >= c.y && y < c.y + c.h) || null;
}

export function removeComponentAt(
  components: Component[], x: number, y: number,
): Component[] {
  return components.filter(c => !(x >= c.x && x < c.x + c.w && y >= c.y && y < c.y + c.h));
}

export function createComponentFromGridCoord(
  type: string,
  gx: number,
  gy: number,
  nextId: number,
  rotation: number,
  color?: ExtractorColor,
): Component {
  const dim = dimensionsFor(type, rotation);
  const x = Math.floor(gx);
  const y = Math.floor(gy);
  return {
    id: nextId,
    type: type as ComponentType,
    x,
    y,
    w: dim.w,
    h: dim.h,
    rotation: dim.rotation,
    ...(color ? { color } : {}),
  };
}
