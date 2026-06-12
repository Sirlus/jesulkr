// ============================================================
// Component — greenMana (초록 마나)
// ============================================================
import type { ComponentDef } from './def';

export const greenMana: ComponentDef = {
  type: 'greenMana',
  role: 'mana',
  name: '초록 마나',
  text: '2x2 크기의 초록마나 부품입니다. 2칸 혼합 회로와 닿아 있으면 마나 2를 소모해 초록마나 1을 제공합니다.',
  formula: 'mixed2 접촉 시 초록 1 (비용 +2)',
  size: { w: 2, h: 2 },
  requiredMap: 2,
  order: 34,
  style: `
.piece.greenMana::after{left:14%;right:14%;top:14%;bottom:14%;border:4px solid var(--green);border-radius:14px;background:radial-gradient(circle,var(--green) 0 16%,rgba(112,255,192,.16) 17% 38%,transparent 39%);box-shadow:0 0 20px rgba(112,255,192,.46),inset 0 0 14px rgba(112,255,192,.18)}
.piece.greenMana::before{left:34%;right:34%;top:34%;bottom:34%;border-radius:50%;background:var(--green);box-shadow:0 0 12px var(--green)}
.previewPiece.greenMana::after{content:"";position:absolute;display:block;left:10%;right:10%;top:10%;bottom:10%;border:2px solid var(--green);border-radius:7px;background:radial-gradient(circle,var(--green) 0 13%,transparent 14%)}
.toolIcon.greenMana::after{left:8px;right:8px;top:8px;bottom:8px;border:3px solid var(--green);border-radius:8px;background:radial-gradient(circle,var(--green) 0 20%,transparent 21%)}
`,
};
