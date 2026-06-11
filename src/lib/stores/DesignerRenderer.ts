// ============================================================
// DesignerRenderer — 설계판 DOM 렌더링 및 부품 삭제
// ============================================================
import type { GameManager } from './game';
import { t } from '$lib/game/i18n';

const CELL = 58, GAP = 4;
const pos = (n: number) => n * (CELL + GAP);
const pieceSize = (n: number) => n * CELL + (n - 1) * GAP;
const boardSize = (n: number) => n * CELL + (n - 1) * GAP;

/** 설계판 DOM을 그립니다 */
export function renderDesigner(gm: GameManager) {
  const board = document.getElementById('designBoard'); if (!board) return;
  board.innerHTML = '';
  board.style.width = boardSize(gm.designer.width) + 'px';
  board.style.height = boardSize(gm.designer.height) + 'px';
  for (let y = 0; y < gm.designer.height; y++) {
    for (let x = 0; x < gm.designer.width; x++) {
      const cell = document.createElement('div'); cell.className = 'gridCell';
      cell.style.left = pos(x) + 'px'; cell.style.top = pos(y) + 'px';
      cell.style.width = CELL + 'px'; cell.style.height = CELL + 'px';
      board.appendChild(cell);
    }
  }
  for (const c of gm.designer.components) {
    const piece = document.createElement('div');
    piece.className = 'piece ' + c.type + (c.h > c.w ? ' vertical' : ' horizontal');
    piece.style.left = pos(c.x) + 'px'; piece.style.top = pos(c.y) + 'px';
    piece.style.width = pieceSize(c.w) + 'px'; piece.style.height = pieceSize(c.h) + 'px';
    board.appendChild(piece);
  }
  const fw = document.getElementById('frameW') as HTMLSelectElement;
  const fh = document.getElementById('frameH') as HTMLSelectElement;
  if (fw) fw.value = String(gm.designer.width);
  if (fh) fh.value = String(gm.designer.height);
  const rb = document.getElementById('rotateBtn');
  if (rb) rb.textContent = gm.designer.rotation === 0 ? t('rotate.horizontal') : t('rotate.vertical');
}

/** 우클릭 또는 지우개 클릭으로 부품을 삭제합니다 */
export function eraseComponent(gm: GameManager, e: MouseEvent) {
  if (gm.state !== 'design') return;
  const board = document.getElementById('designBoard'); if (!board) return;
  const rect = board.getBoundingClientRect();
  const bw = gm.designer.width * CELL + (gm.designer.width - 1) * GAP;
  const bh = gm.designer.height * CELL + (gm.designer.height - 1) * GAP;
  if (!rect.width || !rect.height) return;
  const localX = (e.clientX - rect.left) * (bw / rect.width);
  const localY = (e.clientY - rect.top) * (bh / rect.height);
  for (let i = gm.designer.components.length - 1; i >= 0; i--) {
    const c = gm.designer.components[i];
    const left = pos(c.x), top = pos(c.y);
    if (localX >= left && localX <= left + pieceSize(c.w) && localY >= top && localY <= top + pieceSize(c.h)) {
      gm.designer.components = gm.designer.components.filter(x => x.id !== c.id);
      return;
    }
  }
  if (localX < 0 || localY < 0 || localX > bw || localY > bh) return;
  const step = CELL + GAP;
  const cx = Math.max(0, Math.min(gm.designer.width - 1, Math.round((localX - CELL / 2) / step)));
  const cy = Math.max(0, Math.min(gm.designer.height - 1, Math.round((localY - CELL / 2) / step)));
  const before = gm.designer.components.length;
  gm.designer.components = gm.designer.components.filter(
    c => !(cx >= c.x && cx < c.x + c.w && cy >= c.y && cy < c.y + c.h),
  );
}
