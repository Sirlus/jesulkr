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
  style: `
.piece.greenPair2::after{left:11%;right:11%;top:11%;bottom:11%;border:5px solid var(--green);border-radius:16px;background:radial-gradient(circle at 50% 50%,var(--green) 0 10%,transparent 11%);box-shadow:0 0 20px rgba(112,255,192,.45),inset 0 0 12px rgba(112,255,192,.18)}
.piece.greenPair2::before{left:34%;right:34%;top:34%;bottom:34%;background:var(--blue);transform:rotate(45deg);border-radius:4px;box-shadow:0 0 12px var(--blue)}
.previewPiece.greenPair2::after{content:"";position:absolute;display:block;left:8%;right:8%;top:8%;bottom:8%;border:2px solid var(--green);border-radius:7px;background:radial-gradient(circle,var(--green) 0 11%,transparent 12%)}
.previewPiece.greenPair2::before{content:"";position:absolute;display:block;left:36%;right:36%;top:36%;bottom:36%;background:var(--blue);transform:rotate(45deg)}
.toolIcon.greenPair2::after{left:7px;right:7px;top:7px;bottom:7px;border:3px solid var(--green);border-radius:8px;background:radial-gradient(circle,var(--green) 0 14%,transparent 15%)}
`,
  calc: ({ green, blue }) => {
    const pairs = Math.min(green, blue);
    const damage = pairs * 40;
    return {
      damage,
      detail: `min(초록 ${green}, 파랑 ${blue}) = ${pairs}쌍 × 40`,
    };
  },
};
