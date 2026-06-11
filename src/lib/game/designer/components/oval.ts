import type { ComponentDef } from './def';

export const oval: ComponentDef = {
  type: 'oval',
  role: 'circuit',
  name: '2칸 타원',
  text: '기존 빨간 2칸 회로입니다. 연결된 빨간 마나 2개 묶음마다 일반 데미지 5를 냅니다.',
  formula: 'floor(빨간 마나 / 2) × 5',
  size: { w: 2, h: 1, rotatable: true },
  requiredMap: 1,
  order: 4,
  calc: ({ red }) => {
    const groups = Math.floor(red / 2);
    return {
      damage: groups * 5,
      detail: `floor(빨간 ${red} / 2) = ${groups}묶음 × 5`,
    };
  },
};
