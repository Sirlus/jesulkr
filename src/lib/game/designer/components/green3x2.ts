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
  style: `
.piece.green3x2::after{left:8%;right:8%;top:26%;height:48%;border:5px solid var(--green);border-radius:999px;box-shadow:0 0 18px rgba(112,255,192,.45), inset 0 0 12px rgba(81,168,255,.16)}
.piece.green3x2.vertical::after{top:8%;bottom:8%;left:26%;width:48%;height:auto}
.piece.green3x2::before{left:15%;right:15%;top:47%;height:8%;border-radius:999px;background:var(--blue);box-shadow:0 0 10px var(--blue)}
.piece.green3x2.vertical::before{top:15%;bottom:15%;left:47%;width:8%;height:auto}
.previewPiece.green3x2::after{content:"";position:absolute;display:block;left:6%;right:6%;top:28%;bottom:28%;border:2px solid var(--green);border-radius:999px}
.previewPiece.green3x2.vertical::after{left:28%;right:28%;top:6%;bottom:6%}
.toolIcon.green3x2::after{left:6px;right:6px;top:11px;height:14px;border:3px solid var(--green);border-radius:999px}
`,
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
