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
  style: `
.piece.ultimateCore::after{left:8%;right:8%;top:8%;bottom:8%;border:5px solid var(--green);border-radius:50%;background:radial-gradient(circle,rgba(255,70,92,.85) 0 7%,transparent 8% 20%,rgba(81,168,255,.25) 21% 32%,transparent 33%);box-shadow:0 0 28px rgba(112,255,192,.42),inset 0 0 22px rgba(255,70,92,.18)}
.piece.ultimateCore::before{left:4%;right:4%;top:42%;height:16%;border:4px solid var(--blue);border-radius:50%;transform:rotate(-24deg);box-shadow:0 0 18px rgba(81,168,255,.4)}
.previewPiece.ultimateCore::after{content:"";position:absolute;display:block;left:8%;right:8%;top:8%;bottom:8%;border:2px solid var(--green);border-radius:50%;background:radial-gradient(circle,rgba(255,70,92,.5) 0 10%,transparent 11%)}
.toolIcon.ultimateCore::after{left:7px;right:7px;top:7px;bottom:7px;border:3px solid var(--green);border-radius:50%;background:radial-gradient(circle,rgba(255,70,92,.6) 0 12%,transparent 13%)}
`,
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
