// ============================================================
// Component — stabilizer (안정기)
// ============================================================
import type { ComponentDef } from './def';

export const stabilizer: ComponentDef = {
  type: 'stabilizer',
  role: 'stabilizer',
  name: '안정기',
  text: '파란 마나 1개가 연결되면 작동하고 주변 8칸에 안정도 1을 제공합니다.',
  formula: '파랑 1 → 안정도 1 (반경 1)',
  size: { w: 1, h: 1 },
  requiredMap: 2,
  order: 24,
  style: `
.piece.stabilizer::after{left:17%;top:17%;width:38%;height:38%;border:4px solid var(--blue);border-radius:8px;box-shadow:0 0 14px rgba(81,168,255,.45), inset 0 0 10px rgba(81,168,255,.15)}
.piece.stabilizer::before{right:17%;bottom:17%;width:38%;height:38%;border:4px solid var(--blue);border-radius:8px;box-shadow:0 0 14px rgba(81,168,255,.45), inset 0 0 10px rgba(81,168,255,.15)}
.previewPiece.stabilizer::after{content:"";position:absolute;display:block;left:12%;top:12%;width:38%;height:38%;border:2px solid var(--blue);border-radius:4px}
.previewPiece.stabilizer::before{content:"";position:absolute;display:block;right:12%;bottom:12%;width:38%;height:38%;border:2px solid var(--blue);border-radius:4px}
.toolIcon.stabilizer::after{left:6px;top:6px;width:16px;height:16px;border:3px solid var(--blue);border-radius:4px}
.toolIcon.stabilizer::before{right:6px;bottom:6px;width:16px;height:16px;border:3px solid var(--blue);border-radius:4px}
`,
};
