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
};
