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
  style: `
.piece.circle::after{width:34px;height:34px;border:4px solid var(--red);border-radius:50%;box-shadow:0 0 10px rgba(255,70,92,.35),inset 0 0 10px rgba(255,70,92,.16)}
.previewPiece.circle::after{content:"";position:absolute;display:block;left:18%;right:18%;top:18%;bottom:18%;border:2px solid var(--red);border-radius:50%}
.toolIcon.circle::after{left:50%;top:50%;width:24px;height:24px;border:4px solid var(--red);border-radius:50%;transform:translate(-50%,-50%);box-shadow:0 0 8px rgba(255,70,92,.45)}
`,
};
