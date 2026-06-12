# CSS 리팩토링: 가독성과 책임 중심 분할

## 목표
- `style.css` → 여러 책임 분리의 CSS 파일로 분할
- 가독성 提高 및 유지보수성 向上

## 분리 文件 结构

### Phase 1: CSS 파일 생성
- [x] 1. `styles/01-design-tokens.css` - CSS 변수 (--bg, --panel, --cell 등)
- [x] 2. `styles/02-base.css` - 기본 reset + *, html, body + 기본 요소
- [x] 3. `styles/03-layout.css` - 레이아웃 (.layout, .panel, .hud, .title)
- [x] 4. `styles/04-battle.css` - 전투 UI (.slot, #battleCanvas, .keyBadge)
- [x] 5. `styles/05-designer.css` - 설계 UI (.designerPanel, .boardWrap)
- [x] 6. `styles/06-components.css` - 재사용 컴포넌트 (deckControls, toolBar)
- [x] 7. `styles/07-modals.css` - 모달 (mapModal, keySettingsModal)
- [x] 8. `styles/08-animations.css` - @keyframes 만
- [x] 9. `styles/09-responsive.css` - @media queries only
- [ ] 10. `style.css` - @import 통합 파일로 변경

### Phase 2: 검증
- [ ] 개발 서버 실행 확인
- [ ] 빌드 확인

## 참고
- 기존 style.css 내용을 책임별로 区画하여 분리
- 상대 경로로 相互 참조는避免하여独立된 파일로作成
- 최종적으로 style.css 에서 全파일 @import
