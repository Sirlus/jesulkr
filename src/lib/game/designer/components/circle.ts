import type { ComponentDef } from './def';

export const circle: ComponentDef = {
  type: 'circle',
  role: 'circuit',
  name: '1칸 회로',
  text: '연결된 빨간 마나를 일반 데미지로 바꿉니다. 일반 데미지가 1 이상 나오는 작동 중 상태일 때만 9칸 혼합 핵의 조건 부품으로 인정됩니다.',
  formula: '연결 빨간 마나 수 × 1',
  size: { w: 1, h: 1 },
  requiredMap: 1,
  order: 3,
  calc: ({ red }) => ({
    damage: red,
    detail: `빨간 ${red}개 × 1`,
  }),
};
