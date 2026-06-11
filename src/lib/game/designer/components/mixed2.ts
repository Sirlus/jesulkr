import type { ComponentDef } from './def';

export const mixed2: ComponentDef = {
  type: 'mixed2',
  role: 'circuit',
  name: '2칸 혼합 회로',
  text: '빨간 마나와 파란 마나를 한 쌍으로 묶어 고효율 일반 데미지를 냅니다.',
  formula: 'min(빨간 마나, 파란 마나) × 8',
  size: { w: 2, h: 1, rotatable: true },
  requiredMap: 2,
  order: 6,
  calc: ({ red, blue }) => {
    const pairs = Math.min(red, blue);
    return {
      damage: pairs * 8,
      detail: `min(빨간 ${red}, 파란 ${blue}) = ${pairs}쌍 × 8`,
    };
  },
};
