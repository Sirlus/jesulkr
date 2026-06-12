// ============================================================
// Component — ultimateCore (4x4 안정 핵)
// ============================================================
import type { ComponentDef } from './def';

export const ultimateCore: ComponentDef = {
  type: 'ultimateCore',
  role: 'circuit',
  name: '4x4 안정 핵',
  text: '초록마나 3, 파란마나 2, 빨간마나 6, 안정도 3 이상이 필요합니다. 성공하면 일반 데미지 1400과 모든 몬스터 100 피해를 줍니다.',
  formula: '빨강≥6, 파랑≥2, 초록≥3, 안정도≥3 → 1400 + 전체 100',
  size: { w: 4, h: 4 },
  requiredMap: 3,
  order: 38,
  calc: ({ red, blue, green, stability }) => {
    const ok = red >= 6 && blue >= 2 && green >= 3 && stability >= 3;
    if (!ok) {
      return {
        damage: 0,
        globalDamage: 0,
        detail: `빨강 ${red}, 파랑 ${blue}, 초록 ${green}, 안정도 ${stability} → 조건 불만족`,
      };
    }
    return {
      damage: 1400,
      globalDamage: 100,
      detail: `빨강 ${red}, 파랑 ${blue}, 초록 ${green}, 안정도 ${stability} → 일반 1400, 전체 100`,
    };
  },
};
