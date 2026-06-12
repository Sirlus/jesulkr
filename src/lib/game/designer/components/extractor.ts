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
  style: `
.piece.extractor{color:var(--red)}
.piece.extractor.extractor-blue{color:var(--blue)}
.piece.extractor.extractor-green{color:var(--green)}
.piece.extractor::after{left:13%;right:13%;top:20%;bottom:20%;clip-path:polygon(5% 20%,66% 20%,66% 5%,96% 50%,66% 95%,66% 80%,5% 80%);border-radius:5px;box-shadow:0 0 13px currentColor;background:currentColor;transform-origin:50% 50%}
.piece.extractor.vertical::after{transform:rotate(90deg)}
.piece.extractor.rot180::after{transform:rotate(180deg)}
.piece.extractor.rot270::after{transform:rotate(270deg)}
.piece.extractor::before{left:26%;right:26%;top:41%;height:18%;border-radius:999px;background:rgba(255,255,255,.28)}
.previewPiece.extractor{color:var(--red)}
.previewPiece.extractor.extractor-blue{color:var(--blue)}
.previewPiece.extractor.extractor-green{color:var(--green)}
.previewPiece.extractor::after{content:"";position:absolute;display:block;left:16%;right:16%;top:23%;bottom:23%;clip-path:polygon(5% 20%,66% 20%,66% 5%,96% 50%,66% 95%,66% 80%,5% 80%);background:currentColor}
.previewPiece.extractor.vertical::after{transform:rotate(90deg)}
.previewPiece.extractor.rot180::after{transform:rotate(180deg)}
.previewPiece.extractor.rot270::after{transform:rotate(270deg)}
.toolIcon.extractor{color:var(--red)}
.toolIcon.extractor.extractor-blue{color:var(--blue)}
.toolIcon.extractor.extractor-green{color:var(--green)}
.toolIcon.extractor::after{left:8px;right:8px;top:12px;bottom:12px;clip-path:polygon(5% 20%,66% 20%,66% 5%,96% 50%,66% 95%,66% 80%,5% 80%);background:currentColor}
`,
};
