import { TOOL_ORDER } from '$lib/game/constants';
import { createComponentFromGridCoord, canPlaceComponent } from '$lib/game/designer/Components';
import { calculateSpellStats } from '$lib/game/designer/StatsCalculator';
import { cycleExtractorColor as cycleExtractorColorPure } from '$lib/game/designer/ExtractorSystem';
import { t } from '$lib/game/i18n';
import { showToast } from '$lib/game/ui/Toast';
import { isToolUnlocked } from '$lib/game/utils/progression';
import { eraseComponent as eraseDesignerComponent, renderDesigner as renderDesignerBoard } from '$lib/stores/DesignerRenderer';
import type { GameManager } from '$lib/stores/game';

export function setTool(gm: GameManager, tool: string) {
  if (!isToolUnlocked(tool, gm.store.unlocks, gm.store.records)) {
    const first = TOOL_ORDER.find((candidate: string) =>
      candidate !== 'eraser' && isToolUnlocked(candidate, gm.store.unlocks, gm.store.records),
    ) || 'red';
    gm.designer.tool = first;
  } else {
    gm.designer.tool = tool;
  }
}

export function rotateTool(gm: GameManager) {
  gm.designer.rotation = gm.designer.rotation === 0 ? 1 : 0;
}

export function cycleExtractorColor(gm: GameManager) {
  gm.designer.extractorColor = cycleExtractorColorPure(gm.designer.extractorColor);
}

export function setFrame(gm: GameManager, width: number, height: number) {
  gm.designer.width = width;
  gm.designer.height = height;
  trimComponents(gm);
}

export function getBoardGridCoordFromPointer(
  gm: GameManager,
  e: { clientX: number; clientY: number },
): { gx: number; gy: number } | null {
  const board = document.getElementById('designBoard');
  if (!board) return null;
  const rect = board.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return null;
  const cellW = rect.width / gm.designer.width;
  const cellH = rect.height / gm.designer.height;
  const gx = (e.clientX - rect.left) / cellW;
  const gy = (e.clientY - rect.top) / cellH;
  return { gx, gy };
}

export function placeComponent(gm: GameManager, e: MouseEvent): boolean {
  if (gm.state !== 'design') return false;
  const coord = getBoardGridCoordFromPointer(gm, e);
  if (!coord) return false;
  const gx = Math.floor(coord.gx);
  const gy = Math.floor(coord.gy);
  const comp = createComponentFromGridCoord(gm.designer.tool, gx, gy, gm.designer.nextId, gm.designer.rotation);
  if (canPlaceComponent(comp, gm.designer.components, gm.designer.width, gm.designer.height)) {
    gm.designer.components.push(comp);
    gm.designer.nextId++;
    return true;
  }
  return false;
}

export function spellStats(gm: GameManager) {
  return calculateSpellStats({
    width: gm.designer.width,
    height: gm.designer.height,
    components: gm.designer.components,
  });
}

export function eraseComponent(gm: GameManager, e: MouseEvent) {
  eraseDesignerComponent(gm, e);
}

export function renderDesigner(gm: GameManager) {
  renderDesignerBoard(gm);
}

export function trimComponents(gm: GameManager) {
  const before = gm.designer.components.length;
  gm.designer.components = gm.designer.components.filter(
    (component) => component.x + component.w <= gm.designer.width && component.y + component.h <= gm.designer.height,
  );
  if (before !== gm.designer.components.length) showToast(t('trimmed.outside'));
}

export function setDesignerPreview(gm: GameManager, x: number, y: number) {
  gm.designer.previewX = x;
  gm.designer.previewY = y;
}

export function clearDesignerPreview(gm: GameManager) {
  gm.designer.previewX = null;
  gm.designer.previewY = null;
}
