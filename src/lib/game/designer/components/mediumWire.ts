// ============================================================
// Component — mediumWire (중형 도선)
// ============================================================
import type { ComponentDef } from './def';

export const mediumWire: ComponentDef = {
  type: 'mediumWire',
  role: 'wire',
  name: '중형 도선',
  text: '빨강/파랑/초록을 전달하는 직선 도선입니다. 회전으로 가로/세로 방향을 정합니다.',
  formula: '3색 전달 (직선)',
  size: { w: 1, h: 1, rotatable: true },
  requiredMap: 2,
  order: 21,
  style: `
.piece.mediumWire::after{left:8%;right:8%;top:42%;height:16%;border-radius:999px;background:linear-gradient(90deg,var(--blue),var(--green));box-shadow:0 0 12px rgba(112,255,192,.45)}
.piece.mediumWire.vertical::after{left:42%;right:auto;top:8%;bottom:8%;width:16%;height:auto;background:linear-gradient(180deg,var(--blue),var(--green))}
.previewPiece.mediumWire::after{content:"";position:absolute;display:block;left:10%;right:10%;top:43%;height:14%;background:linear-gradient(90deg,var(--blue),var(--green));border-radius:999px}
.previewPiece.mediumWire.vertical::after{left:43%;right:auto;top:10%;bottom:10%;width:14%;height:auto;background:linear-gradient(180deg,var(--blue),var(--green))}
.toolIcon.mediumWire::after{left:6px;right:6px;top:16px;height:6px;border-radius:999px;background:linear-gradient(90deg,var(--blue),var(--green))}
`,
};
