import type { ComponentDef } from './def';

export const mixed2: ComponentDef = {
  type: 'mixed2',
  role: 'circuit',
  name: '2칸 혼합 회로',
  text: '빨간 마나와 파란 마나를 한 쌍으로 묶어 고효율 일반 데미지를 냅니다.',
  formula: 'min(빨간 마나, 파란 마나) × 8',
  size: { w: 2, h: 1, rotatable: true },
  requiredMap: 2,
  order: 6,
  calc: ({ red, blue }) => {
    const pairs = Math.min(red, blue);
    return {
      damage: pairs * 8,
      detail: `min(빨간 ${red}, 파란 ${blue}) = ${pairs}쌍 × 8`,
    };
  },
  style: `
.piece.mixed2::after{width:82%;height:42%;border:5px solid var(--blue);border-radius:999px;box-shadow:0 0 16px rgba(81,168,255,.4),inset 0 0 10px rgba(81,168,255,.14)}
.piece.mixed2.vertical::after{width:42%;height:82%}
.piece.mixed2::before{width:46%;height:10%;background:var(--red);border-radius:999px;transform:rotate(-25deg);box-shadow:0 0 9px var(--red)}
.previewPiece.mixed2::after{content:"";position:absolute;display:block;left:6%;right:6%;top:28%;bottom:28%;border:2px solid var(--blue);border-radius:999px}
.previewPiece.mixed2.vertical::after{left:28%;right:28%;top:6%;bottom:6%}
.toolIcon.mixed2::after{left:1px;right:1px;top:10px;height:13px;border:4px solid var(--blue);border-radius:999px;box-shadow:0 0 8px rgba(81,168,255,.45)}
.toolIcon.mixed2::before{left:8px;right:8px;top:16px;height:4px;background:var(--red);border-radius:999px;transform:rotate(-25deg);box-shadow:0 0 6px var(--red)}
`,
};
