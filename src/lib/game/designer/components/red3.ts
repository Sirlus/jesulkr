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
