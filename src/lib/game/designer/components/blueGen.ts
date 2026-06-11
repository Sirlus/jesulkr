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
};
