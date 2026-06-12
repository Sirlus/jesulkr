// ============================================================
// Component — green3x2 (3x2 순환 회로)
// ============================================================
import type { ComponentDef, CalcContext } from './def';

export const green3x2: ComponentDef = {
  type: 'green3x2',
  role: 'circuit',
  name: '3x2 순환 회로',
  text: '초록마나 1과 파란마나 1이 필요합니다. 빨간 마나가 연결되면 불안정해져 작동하지 않습니다.',
  formula: '초록≥1, 파랑≥1, 빨강=0 → 50',
  size: { w: 3, h: 2, rotatable: true },
  requiredMap: 2,
  order: 35,
  calc: ({ green, blue, red }) => {
    if (red > 0) {
      return { damage: 0, detail: `빨강 ${red}개 연결 → 불안정` };
    }
    const active = green >= 1 && blue >= 1;
    const damage = active ? 50 : 0;
    return {
      damage,
      detail: active
        ? `초록 ${green}, 파랑 ${blue} → 순환 작동`
        : `초록 ${green}, 파랑 ${blue} → 조건 불만족`,
    };
  },
};
