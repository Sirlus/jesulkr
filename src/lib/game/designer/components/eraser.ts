import type { ComponentDef } from './def';

export const eraser: ComponentDef = {
  type: 'eraser',
  role: 'tool',
  name: '지우개',
  text: '클릭하거나 드래그한 칸의 부품을 제거합니다. 지우개가 아니어도 설계판에서 우클릭하면 즉시 삭제됩니다.',
  formula: '제거',
  size: { w: 1, h: 1 },
  requiredMap: 1,
  order: 8,
};
