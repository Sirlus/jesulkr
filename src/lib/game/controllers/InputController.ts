import * as Storage from '$lib/game/core/Storage';
import { CONTROL_ACTIONS } from '$lib/game/constants';
import { canPlaceComponent, createComponentFromGridCoord } from '$lib/game/designer/Components';
import { t } from '$lib/game/i18n';
import type { KeyBinding, KeyTarget } from '$lib/game/types';
import { showToast } from '$lib/game/ui/Toast';
import type { GameManager } from '$lib/stores/game';
import { eraseComponent, getBoardGridCoordFromPointer, placeComponent } from './DesignerController';

const SLOT_COUNT = 5;

export function eventToBinding(e: KeyboardEvent): KeyBinding | null {
  if (!e.code) return null;
  let label = e.key;
  if (e.code.startsWith('Key')) label = e.code.slice(3);
  else if (e.code.startsWith('Digit')) label = e.code.slice(5);
  else if (e.code === 'Space') label = 'SPC';
  else if (e.code === 'Enter') label = '↵';
  else if (e.code === 'Escape') label = 'ESC';
  else if (e.code === 'ArrowUp') label = '↑';
  else if (e.code === 'ArrowDown') label = '↓';
  else if (e.code === 'ArrowLeft') label = '←';
  else if (e.code === 'ArrowRight') label = '→';
  return { code: e.code, key: e.key, label: label.toUpperCase() };
}

export function findBindingConflict(gm: GameManager, target: KeyTarget, binding: KeyBinding): string | null {
  if (target.type === 'slot') {
    for (let index = 0; index < SLOT_COUNT; index++) {
      if (index === target.index) continue;
      const candidate = gm.keyBindings[index];
      if (candidate && candidate.code === binding.code) return gm.getSlotKeyLabel(index);
    }
  }
  for (const [id, candidate] of Object.entries(gm.controlBindings)) {
    if (target.type === 'control' && target.id === id) continue;
    if (candidate && candidate.code === binding.code) {
      const action = CONTROL_ACTIONS.find((controlAction) => controlAction.id === id);
      return action?.name || id;
    }
  }
  if (target.type === 'control') {
    for (let index = 0; index < SLOT_COUNT; index++) {
      const candidate = gm.keyBindings[index];
      if (candidate && candidate.code === binding.code) return gm.getSlotKeyLabel(index);
    }
  }
  return null;
}

export function setBinding(gm: GameManager, target: KeyTarget, binding: KeyBinding) {
  if (target.type === 'slot') {
    gm.store.keyBindings[target.index] = binding;
    Storage.saveKeyBindings(gm.store.keyBindings);
  } else {
    gm.store.controlBindings[target.id] = binding;
    Storage.saveControlBindings(gm.store.controlBindings);
  }
}

export function bindingNameForTarget(gm: GameManager, target: KeyTarget): string {
  if (target.type === 'slot') return t('slot.number', target.index + 1);
  const action = CONTROL_ACTIONS.find((controlAction) => controlAction.id === target.id);
  return action?.name || target.id;
}

export function resetKeyBindings(gm: GameManager) {
  gm.store.keyBindings = Storage.defaultKeyBindings();
  gm.store.controlBindings = Storage.defaultControlBindings();
  Storage.saveKeyBindings(gm.store.keyBindings);
  Storage.saveControlBindings(gm.store.controlBindings);
  showToast(t('reset.all.keys'), 'good');
}

export function onDesignBoardMouseDown(gm: GameManager, e: MouseEvent) {
  if (gm.state !== 'design') return;
  if (e.button === 2) {
    gm.erasingDrag = true;
    eraseComponent(gm, e);
  } else if (e.button === 0 && gm.designer.tool !== 'eraser') {
    gm.placingDrag = true;
    placeComponent(gm, e);
  } else if (e.button === 0 && gm.designer.tool === 'eraser') {
    gm.erasingDrag = true;
    eraseComponent(gm, e);
  }
}

export function onDesignBoardMouseMove(gm: GameManager, e: MouseEvent) {
  if (gm.state !== 'design') return;
  if (gm.erasingDrag && gm.designer.tool === 'eraser') {
    eraseComponent(gm, e);
  } else if (gm.placingDrag && gm.designer.tool !== 'eraser') {
    const coord = getBoardGridCoordFromPointer(gm, e);
    if (!coord) return;
    const gx = Math.floor(coord.gx);
    const gy = Math.floor(coord.gy);
    const component = createComponentFromGridCoord(gm.designer.tool, gx, gy, gm.designer.nextId, gm.designer.rotation);
    const key = `${component.type}:${component.x},${component.y}:${component.w}x${component.h}:${component.rotation}`;
    if (gm.lastDragPlaceKey === key) return;
    gm.lastDragPlaceKey = key;
    if (canPlaceComponent(component, gm.designer.components, gm.designer.width, gm.designer.height)) {
      gm.designer.components.push(component);
      gm.designer.nextId++;
    }
  }
}

export function endDrag(gm: GameManager) {
  gm.placingDrag = false;
  gm.erasingDrag = false;
  gm.lastDragPlaceKey = null;
}
