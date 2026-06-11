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
};
