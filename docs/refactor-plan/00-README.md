# Jesulkr-svelte 리팩터링 플랜

> **목표**: 원작 HTML v1.3의 게임성을 100% 재현하면서, SvelteKit/Svelte 5의 현대적 패턴으로 재구성  
> **기간**: 4~6주 (1인 기준, 풀타임 가정)  
> **작성일**: 2026-06-10  
> **환경**: `npm` 기준. `bun`이 설치되어 있다면 `bun`으로 대체 가능하나, 현재 CI/로컬 환경은 `npm`이 기본입니다.

---

## 어떻게 읽나요

1. **Phase 0** → 현재 상태와 선행조건 확인
2. **Phase 1** → 즉시 실행. 빌드가 되고 게임이 돌아가는 상태로 만듦
3. **Phase 2~5** → 순차적으로 진행. 각 Phase는 이전 Phase를 기반으로 함
4. **Phase 6** → 마무리. 품질 보증
5. **08-checklist.md** → 전체 작업의 체크리스트. 매일 아침 확인용

---

## Phase 개요

| Phase | 이름 | 목표 | 예상 기간 | 산출물 |
|-------|------|------|----------|--------|
| 0 | 선행조건 | 현재 상태 분석, Git 브랜치 전략 수립 | 당일 | 분석 문서 |
| 1 | Foundation | 빌드 고치고, 7개 메서드 구현해서 게임 루프 복원 | 2~3일 | 실행 가능한 게임 |
| 2 | Core Logic | 몬스터 속도, 별 조건 등 원작 정합성 완전 복원 | 1~2일 | 원작과 동일한 게임성 |
| 3 | State Reactive | Svelte 룬 도입, GameManager-Store 관계 재설계 | 3~4일 | 반응형 상태 관리 |
| 3.5 | v1.5 Migration | v1.5 상태·로직·저장 통합 (도구 해금, 마나 토글, 튜토리얼 등) | 1~2일 | v1.5 게임로직 기반 |
| 4 | UI Components | 페이지 monolith → 컴포넌트 분리 | 5~7일 | 선언적 UI |
| 5 | Features | 맵 모달, 덱, 키 설정 등 누락 기능 구현 | 4~5일 | 완전한 기능 세트 |
| 6 | Quality | 테스트, 접근성, 성능, 문서화 | 3~4일 | 프로덕션 품질 |

---

## 의존성 그래프

```
Phase 0 (선행조건)
    ↓
Phase 1 (Foundation) ──→ Phase 2 (Core Logic)
    ↓                         ↓
Phase 3 (State Reactive) ←──┘
    ↓
Phase 3.5 (v1.5 Migration)
    ↓
Phase 4 (UI Components)
    ↓
Phase 5 (Features)
    ↓
Phase 6 (Quality)
```

> **규칙**: 각 Phase는 이전 Phase가 완료된 후 시작. 단, Phase 2는 Phase 1과 병렬로 일부 시작 가능.

---

## Git 브랜치 전략

```
main
  └── refactor/phase-1-foundation
        └── refactor/phase-2-core-logic
              └── refactor/phase-3-reactive
                    └── refactor/phase-3.5-v1.5
                          └── refactor/phase-4-ui
                                └── refactor/phase-5-features
                                      └── refactor/phase-6-quality
```

각 Phase 완료 시 PR → squash merge. Phase 6 완료 후 `main`으로 최종 머지.

---

## 리스크 관리

| 리스크 | 대응 |
|--------|------|
| Phase 3(반응형)에서 기존 코드와 충돌 | Phase 1~2에서 **모든 테스트를 통과하는 상태**를 유지하며 점진적 교체 |
| Phase 4(UI)에서 기능 회귀 | 각 컴포넌트 분리 후 원작 HTML과 side-by-side 비교 테스트 |
| 일정 지연 | Phase 5(누락 기능)에서 우선순위 조정 가능. 핵심 루프는 Phase 2까지 완료 |
