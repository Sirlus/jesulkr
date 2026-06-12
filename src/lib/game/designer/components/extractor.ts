// ============================================================
// Component — extractor (추출기)
// ============================================================
import type { ComponentDef } from './def';

export const extractor: ComponentDef = {
  type: 'extractor',
  role: 'extractor',
  name: '추출기',
  text: '도선망에서 선택한 색의 마나만 뽑아 화살표 방향의 인접 부품에 공급합니다.',
  formula: '색상별 1방향 출력',
  size: { w: 1, h: 1, rotatable: true },
  requiredMap: 2,
  order: 23,
};
