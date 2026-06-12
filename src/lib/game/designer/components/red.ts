import type { ComponentDef } from './def';

export const red: ComponentDef = {
  type: 'red',
  role: 'mana',
  name: '빨간 점 마나',
  text: '기본 마나 소스입니다. 배치 1개당 마나 비용 +1. 기존 빨간 회로와 혼합 회로가 읽을 수 있습니다.',
  formula: '비용 +1',
  size: { w: 1, h: 1 },
  requiredMap: 1,
  order: 0,
  style: `
.piece.red::after{width:14px;height:14px;border-radius:50%;background:var(--red);box-shadow:0 0 16px var(--red),0 0 4px #fff inset}
.previewPiece.red::after{content:"";position:absolute;display:block;left:50%;top:50%;width:7px;height:7px;border-radius:50%;transform:translate(-50%,-50%);background:var(--red);box-shadow:0 0 6px var(--red)}
.toolIcon.red::after{left:50%;top:50%;width:15px;height:15px;border-radius:50%;transform:translate(-50%,-50%);background:var(--red);box-shadow:0 0 12px var(--red),0 0 4px #fff inset}
`,
};

/** 빨간 마나 부품의 빨강 출력 계수 */
export function getRedPower(comp: { type: string }): number {
  if (comp.type === 'red3') return 3;
  if (comp.type === 'red') return 1;
  return 0;
}

/** 빨간 마나 부품의 마나 비용 */
export function getRedCost(comp: { type: string }): number {
  if (comp.type === 'red3') return 2;
  if (comp.type === 'red') return 1;
  return 0;
}
