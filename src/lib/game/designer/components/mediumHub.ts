// ============================================================
// Component — mediumHub (중형 허브)
// ============================================================
import type { ComponentDef } from './def';

export const mediumHub: ComponentDef = {
  type: 'mediumHub',
  role: 'wire',
  name: '중형 허브',
  text: '중형 마나망의 4방향 허브입니다. 주변 8칸 내 작동 중인 안정기 1개가 있어야 모든 방향으로 전달됩니다.',
  formula: '4방향, 안정도 1 필요',
  size: { w: 1, h: 1 },
  requiredMap: 3,
  order: 22,
};
