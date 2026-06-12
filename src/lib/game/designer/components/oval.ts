import type { ComponentDef } from './def';

export const oval: ComponentDef = {
  type: 'oval',
  role: 'circuit',
  name: '2칸 타원',
  text: '기존 빨간 2칸 회로입니다. 연결된 빨간 마나 2개 묶음마다 일반 데미지 5를 냅니다.',
  formula: 'floor(빨간 마나 / 2) × 5',
  size: { w: 2, h: 1, rotatable: true },
  requiredMap: 1,
  order: 4,
  calc: ({ red }) => {
    const groups = Math.floor(red / 2);
    return {
      damage: groups * 5,
      detail: `floor(빨간 ${red} / 2) = ${groups}묶음 × 5`,
    };
  },
  style: `
.piece.oval::after{width:78%;height:48%;border:4px solid var(--red);border-radius:50%;box-shadow:0 0 12px rgba(255,70,92,.35),inset 0 0 10px rgba(255,70,92,.16)}
.piece.oval.vertical::after{width:48%;height:78%}
.previewPiece.oval::after{content:"";position:absolute;display:block;left:6%;right:6%;top:28%;bottom:28%;border:2px solid var(--red);border-radius:50%}
.previewPiece.oval.vertical::after{left:28%;right:28%;top:6%;bottom:6%}
.toolIcon.oval::after{left:2px;right:2px;top:10px;height:13px;border:4px solid var(--red);border-radius:999px;box-shadow:0 0 8px rgba(255,70,92,.45)}
`,
};
