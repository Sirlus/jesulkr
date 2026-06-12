import type { ComponentDef } from './def';

export const eraser: ComponentDef = {
  type: 'eraser',
  role: 'tool',
  name: '지우개',
  text: '클릭하거나 드래그한 칸의 부품을 제거합니다. 지우개가 아니어도 설계판에서 우클릭하면 즉시 삭제됩니다.',
  formula: '제거',
  size: { w: 1, h: 1 },
  requiredMap: 1,
  order: 8,
  style: `
.toolIcon.eraser::after{left:7px;top:9px;width:22px;height:14px;border-radius:4px;background:linear-gradient(135deg,#ff7380 0 50%,#cfe2fb 51%);transform:rotate(-18deg);box-shadow:0 0 8px rgba(255,115,128,.35)}
`,
};
