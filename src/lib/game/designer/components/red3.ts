// ============================================================
// Component — red3 (3중 빨간 마나)
// ============================================================
import type { ComponentDef } from './def';

export const red3: ComponentDef = {
  type: 'red3',
  role: 'mana',
  name: '3중 빨간 마나',
  text: '2칸짜리 압축 빨간 마나입니다. 마나 비용 2로 빨간 마나 3을 제공합니다.',
  formula: '비용 +2, 빨강 마나 3',
  size: { w: 2, h: 1, rotatable: true },
  requiredMap: 1,
  order: 1,
  style: `
.piece.red3::after{left:9%;right:9%;top:32%;bottom:32%;border:3px solid var(--red);border-radius:12px;background:radial-gradient(circle at 20% 50%,var(--red) 0 9%,transparent 10%),radial-gradient(circle at 50% 50%,var(--red) 0 9%,transparent 10%),radial-gradient(circle at 80% 50%,var(--red) 0 9%,transparent 10%);box-shadow:0 0 14px rgba(255,70,92,.38)}
.piece.red3.vertical::after{left:32%;right:32%;top:9%;bottom:9%;background:radial-gradient(circle at 50% 20%,var(--red) 0 9%,transparent 10%),radial-gradient(circle at 50% 50%,var(--red) 0 9%,transparent 10%),radial-gradient(circle at 50% 80%,var(--red) 0 9%,transparent 10%)}
.previewPiece.red3::after{content:"";position:absolute;display:block;left:8%;right:8%;top:30%;bottom:30%;border:2px solid var(--red);border-radius:6px;background:radial-gradient(circle at 20% 50%,var(--red) 0 10%,transparent 11%),radial-gradient(circle at 50% 50%,var(--red) 0 10%,transparent 11%),radial-gradient(circle at 80% 50%,var(--red) 0 10%,transparent 11%)}
.previewPiece.red3.vertical::after{left:30%;right:30%;top:8%;bottom:8%;background:radial-gradient(circle at 50% 20%,var(--red) 0 10%,transparent 11%),radial-gradient(circle at 50% 50%,var(--red) 0 10%,transparent 11%),radial-gradient(circle at 50% 80%,var(--red) 0 10%,transparent 11%)}
.toolIcon.red3::after{left:50%;top:50%;width:22px;height:22px;border:3px solid var(--red);border-radius:6px;transform:translate(-50%,-50%);background:radial-gradient(circle at 20% 50%,var(--red) 0 12%,transparent 13%),radial-gradient(circle at 50% 50%,var(--red) 0 12%,transparent 13%),radial-gradient(circle at 80% 50%,var(--red) 0 12%,transparent 13%)}
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
