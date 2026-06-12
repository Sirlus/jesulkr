# Phase 4 — 테스트 및 마무리 🔲

> 예상 공수: 30분  
> 선행 조건: Phase 3 ✅

---

## 작업 목록

### 4-A. svelte-check

```bash
npx svelte-check --tsconfig ./tsconfig.json
# 목표: 0 errors, 0 warnings
```

---

### 4-B. 수동 확인 항목

#### 온보딩 모달 (Phase 1)
브라우저 콘솔에서 초기화 후 테스트:
```javascript
localStorage.removeItem('jesulkr_tutorial_seen_v2');
localStorage.removeItem('jesulkr_language_v1');
// 새로고침
```

- [ ] 언어 선택 → 슬라이드 5장 순서대로 표시
- [ ] `→` / `Enter` 다음 슬라이드, `←` 이전, `Esc` 닫힘
- [ ] 점 인디케이터 클릭으로 임의 이동
- [ ] 건너뛰기 클릭 → 재접속 시 미표시

#### 빈 보드 힌트 (Phase 1)
- [ ] 설계판 비었을 때 힌트 표시
- [ ] 부품 1개 배치 즉시 사라짐
- [ ] 전체 삭제 후 다시 표시

#### toolInfo formula (Phase 2)
- [ ] 빨간 점 마나 선택 → `⚡ 비용 +1` 표시
- [ ] 1칸 회로 선택 → `⚡ 연결 빨간 마나 수 × 1` 표시
- [ ] 도선(wire) 선택 → formula 줄 없음 (빈 문자열이라 숨김)
- [ ] 지우개 선택 → formula 줄 없음

#### 도움말 버튼 (Phase 2)
- [ ] 메뉴 열면 "❓ 도움말" 버튼 보임
- [ ] 클릭 → HelpModal 열림

#### HelpModal (Phase 3)
- [ ] X 버튼 / `Esc` / 오버레이 바깥 클릭으로 닫힘
- [ ] 4개 탭 전환 정상
- [ ] **개요**: 게임 루프, 통계 설명 텍스트 확인
- [ ] **부품**: 전체 부품 표시, 잠긴 부품 🔒 배지
- [ ] **조작법**: 현재 키 바인딩 기준으로 표시 (키 재설정 후 변경 확인)
- [ ] **맵**: 3개 맵 카드, 별 조건 수치 정확
- [ ] 언어 전환 후 모든 텍스트 ko↔en 반영

---

### 4-C. 문서 업데이트

- [ ] `TUTORIAL_PLAN.md` Phase 전체 상태 ✅ 로 갱신
- [ ] `GAME_DESIGN.md` 현황 라인 업데이트
- [ ] 구 Phase 파일 정리 (Phase2-onboarding.md 등 이전 계획 파일 삭제 or 아카이브)

---

### 4-D. 커밋 + 푸시

```bash
git add -A
git commit -m "feat: HelpModal, formula display, help menu button

- DesignerPanel: show formula in toolInfo
- MainMenu: add help button
- HelpModal: 4-tab reference modal (overview/components/controls/maps)
- i18n: help.* keys ko/en
- docs: update tutorial plan"

git push origin main
```

---

## 완료 체크리스트

- [ ] 4-A `svelte-check` 0 errors
- [ ] 4-B 수동 확인 항목 전체
- [ ] 4-C 문서 업데이트
- [ ] 4-D 커밋 + 푸시
