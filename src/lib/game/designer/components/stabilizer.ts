// ============================================================
// Component — stabilizer (안정기)
// ============================================================
import type { ComponentDef } from './def';

export const stabilizer: ComponentDef = {
  type: 'stabilizer',
  role: 'stabilizer',
  name: '안정기',
  text: '파란 마나 1개가 연결되면 작동하고 주변 8칸에 안정도 1을 제공합니다.',
  formula: '파랑 1 → 안정도 1 (반경 1)',
  size: { w: 1, h: 1 },
  requiredMap: 2,
  order: 24,
};
