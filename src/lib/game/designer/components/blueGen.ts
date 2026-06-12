import type { ComponentDef } from './def';

export const blueGen: ComponentDef = {
  type: 'blueGen',
  role: 'generator',
  name: '파란 마나 생성기',
  text: '빨간 마나와 직접 인접하거나 도선으로 연결되어야 작동합니다. 작동하면 추가 마나 2를 쓰고 파란 마나 1개를 제공합니다.',
  formula: '연결 빨간 마나 ≥ 1 → 파란 마나 1개, 비용 +2',
  size: { w: 1, h: 1 },
  requiredMap: 2,
  order: 1,
  style: `
.piece.blueGen::after{width:15px;height:15px;border-radius:50%;background:var(--blue);box-shadow:0 0 16px var(--blue),0 0 4px #fff inset}
.piece.blueGen::before{width:26px;height:26px;border:2px solid rgba(255,70,92,.7);border-radius:50%;box-shadow:0 0 10px rgba(255,70,92,.22)}
.previewPiece.blueGen::after{content:"";position:absolute;display:block;left:50%;top:50%;width:7px;height:7px;border-radius:50%;transform:translate(-50%,-50%);background:var(--blue);box-shadow:0 0 6px var(--blue)}
.toolIcon.blueGen::after{left:50%;top:50%;width:15px;height:15px;border-radius:50%;transform:translate(-50%,-50%);background:var(--blue);box-shadow:0 0 12px var(--blue),0 0 4px #fff inset}
.toolIcon.blueGen::before{left:50%;top:50%;width:28px;height:28px;border:2px solid var(--red);border-radius:50%;transform:translate(-50%,-50%);opacity:.75}
`,
};
