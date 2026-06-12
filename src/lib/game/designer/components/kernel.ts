import type { ComponentDef } from './def';

export const kernel: ComponentDef = {
  type: 'kernel',
  role: 'circuit',
  name: '2x2 핵',
  text: '기존 빨간 2x2 핵입니다. 연결된 빨간 마나 3개 묶음마다 일반 데미지 12를 냅니다.',
  formula: 'floor(빨간 마나 / 3) × 12',
  size: { w: 2, h: 2 },
  requiredMap: 1,
  order: 5,
  calc: ({ red }) => {
    const groups = Math.floor(red / 3);
    return {
      damage: groups * 12,
      detail: `floor(빨간 ${red} / 3) = ${groups}묶음 × 12`,
    };
  },
  style: `
.piece.kernel::after{width:76%;height:76%;border:4px solid var(--red);border-radius:43%;box-shadow:0 0 16px rgba(255,70,92,.45),inset 0 0 16px rgba(255,70,92,.18)}
.previewPiece.kernel::after{content:"";position:absolute;display:block;left:8%;right:8%;top:8%;bottom:8%;border:2px solid var(--red);border-radius:42%}
.toolIcon.kernel::after{left:4px;right:4px;top:4px;bottom:4px;border:4px solid var(--red);border-radius:42%;box-shadow:0 0 10px rgba(255,70,92,.45)}
`,
};
