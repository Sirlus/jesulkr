// ============================================================
// Component — mediumHub (중형 허브)
// ============================================================
import type { ComponentDef } from './def';

export const mediumHub: ComponentDef = {
  type: 'mediumHub',
  role: 'wire',
  name: '중형 허브',
  text: '중형 마나망의 4방향 허브입니다. 주변 8칸 내 작동 중인 안정기 1개가 있어야 모든 방향으로 전달됩니다.',
  formula: '4방향, 안정도 1 필요',
  size: { w: 1, h: 1 },
  requiredMap: 3,
  order: 22,
  style: `
.piece.mediumHub::after{left:10%;right:10%;top:42%;height:16%;border-radius:999px;background:linear-gradient(90deg,var(--blue),var(--green));box-shadow:0 0 12px rgba(112,255,192,.45)}
.piece.mediumHub::before{top:10%;bottom:10%;left:42%;width:16%;border-radius:999px;background:linear-gradient(180deg,var(--blue),var(--green));box-shadow:0 0 12px rgba(112,255,192,.45)}
.previewPiece.mediumHub::after{content:"";position:absolute;display:block;left:10%;right:10%;top:43%;height:14%;background:linear-gradient(90deg,var(--blue),var(--green));border-radius:999px}
.previewPiece.mediumHub::before{content:"";position:absolute;display:block;top:10%;bottom:10%;left:43%;width:14%;background:linear-gradient(180deg,var(--blue),var(--green));border-radius:999px}
.toolIcon.mediumHub::after{left:6px;right:6px;top:16px;height:6px;border-radius:999px;background:linear-gradient(90deg,var(--blue),var(--green))}
.toolIcon.mediumHub::before{top:6px;bottom:6px;left:16px;width:6px;border-radius:999px;background:linear-gradient(180deg,var(--blue),var(--green))}
`,
};
