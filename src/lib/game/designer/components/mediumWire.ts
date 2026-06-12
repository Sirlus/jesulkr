// ============================================================
// Component — mediumWire (중형 도선)
// ============================================================
import type { ComponentDef } from './def';

export const mediumWire: ComponentDef = {
  type: 'mediumWire',
  role: 'wire',
  name: '중형 도선',
  text: '빨강/파랑/초록을 전달하는 직선 도선입니다. 회전으로 가로/세로 방향을 정합니다.',
  formula: '3색 전달 (직선)',
  size: { w: 1, h: 1, rotatable: true },
  requiredMap: 2,
  order: 21,
};
