// ============================================================
// Component — greenPair2 (2x2 녹청 회로)
// ============================================================
import type { ComponentDef } from './def';

export const greenPair2: ComponentDef = {
  type: 'greenPair2',
  role: 'circuit',
  name: '2x2 녹청 회로',
  text: '초록마나와 파란마나를 한 쌍으로 묶어 쌍당 일반 데미지 40을 냅니다.',
  formula: 'min(초록, 파랑) × 40',
  size: { w: 2, h: 2 },
  requiredMap: 2,
  order: 36,
  calc: ({ green, blue }) => {
    const pairs = Math.min(green, blue);
    const damage = pairs * 40;
    return {
      damage,
      detail: `min(초록 ${green}, 파랑 ${blue}) = ${pairs}쌍 × 40`,
    };
  },
};
