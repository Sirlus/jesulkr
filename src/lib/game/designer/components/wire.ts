import type { ComponentDef } from './def';

export const wire: ComponentDef = {
  type: 'wire',
  role: 'wire',
  name: '도선',
  text: '맵 2에서 해금됩니다. 마나를 먼 회로에 연결합니다. 같은 도선망에 연결된 마나는 회로에 인접한 마나처럼 계산됩니다. 자체 비용과 일반 데미지는 없습니다.',
  formula: '연결 전달',
  size: { w: 1, h: 1 },
  requiredMap: 2,
  order: 2,
  style: `
.piece.wire::after{left:12%;right:12%;top:43%;height:14%;border-radius:999px;background:var(--blue);box-shadow:0 0 10px var(--blue)}
.piece.wire::before{top:12%;bottom:12%;left:43%;width:14%;border-radius:999px;background:var(--blue);box-shadow:0 0 10px var(--blue)}
.previewPiece.wire::after{content:"";position:absolute;display:block;left:12%;right:12%;top:43%;height:14%;background:var(--blue);border-radius:999px;box-shadow:0 0 4px var(--blue)}
.toolIcon.wire::after{left:5px;right:5px;top:15px;height:5px;background:var(--blue);border-radius:999px;box-shadow:0 0 8px var(--blue)}
.toolIcon.wire::before{top:5px;bottom:5px;left:15px;width:5px;background:var(--blue);border-radius:999px;box-shadow:0 0 8px var(--blue)}
`,
};
