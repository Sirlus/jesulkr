// ============================================================
// Component — greenMana (초록 마나)
// ============================================================
import type { ComponentDef } from './def';

export const greenMana: ComponentDef = {
  type: 'greenMana',
  role: 'mana',
  name: '초록 마나',
  text: '2x2 크기의 초록마나 부품입니다. 2칸 혼합 회로와 닿아 있으면 마나 2를 소모해 초록마나 1을 제공합니다.',
  formula: 'mixed2 접촉 시 초록 1 (비용 +2)',
  size: { w: 2, h: 2 },
  requiredMap: 2,
  order: 34,
};
