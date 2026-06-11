# Jesulkr v1.5 프로젝트 구조 문서

> **문서 작성일**: 2026-06-11  
> **버전**: v1.3.0  
> **프로젝트**: jesulkr (제슬커) - 타워 디펜스型 술식 설계 게임

---

## 1. 프로젝트 개요

### 1.1 프로젝트 소개

**Jesulkr**는 플레이어가 직접 술식(스펠)을 설계하고, 이를 슬롯에 장착하여 몬스터의 침공으로부터 기지를 지키는 타워 디펜스 게임입니다.

- **술식 설계**: 설계판에 다양한 부품(회로, 마나원, 도선 등)을 배치하여 술식의 데미지, 마나 소모, 쿨타임을 결정합니다.
- **전투**: 설계한 술식을 5개 슬롯에 장착하고, 타이밍에 맞춰 발사하거나 자동 모드로 운용합니다.
- **맵 & 해금**: 3개의 맵이 있으며, 높은 점수를 획득해 별을 모으면 새로운 부품과 맵이 해금됩니다.

### 1.2 기술 스택

| 구분 | 기술 |
|------|------|
| 프레임워크 | Svelte 5 (runes mode), SvelteKit 2 |
| 언어 | TypeScript 6 |
| 번들러 | Vite 8 |
| 스타일 | CSS |
| 테스트 | Vitest 4 |
| 포맷터 | Prettier 3 |
| 린트 | ESLint 10 |
| 패키지 매니저 | bun |
| 배포 | @sveltejs/adapter-static |

### 1.3 주요 기능 (v1.5)

- ✅ 덱 시스템 (10개 덱 저장/불러오기)
- ✅ 키 설정 (사용자 정의 키 바인딩)
- ✅ 전투 배속 (x1/x2/x4/x8)
- ✅ 설계 미리보기 (실시간 배치 프리뷰)
- ✅ 모바일 대응 (터치 이벤트)
- ✅ 도구 해금 시스템
- ✅ 마나 보너스 토글

---

## 2. 디렉토리 구조

```
jesulkr/
├── .gitignore                  # Git 무시 파일
├── .mcp.json                 # MCP 설정
├── .npmrc                    # npm 설정
├── .prettierignore          # Prettier 무시 파일
├── .prettierrc              # Prettier 설정
├── CHANGELOG.md             # 변경 로그
├── CLAUDE.md                 # Claude AI 설정
├── eslint.config.js          # ESLint 설정
├── index.html               # HTML 진입점
├── package.json             # 프로젝트 의존성
├── svelte.config.js         # SvelteKit 설정
├── test-buttons.mjs         # 테스트 버튼
├── tsconfig.json            # TypeScript 설정
├── vite.config.ts           # Vite 설정
├── vitest.config.ts        # Vitest 설정
│
├── docs/                    # 문서 디렉토리
│   ├── API.md               # API 문서
│   ├── ARCHITECTURE.md      # 아키텍처 문서
│   ├── CONSISTENCY_REPORT.md # 일관성 리포트
│   ├── GAME_DESIGN.md       # 게임 디자인 문서
│   ├── IMPROVEMENTS.md     # 개선 사항
│   ├── PROJECT_STRUCTURE.md # 프로젝트 구조 문서 (본 파일)
│   ├── checkpoints/         # 리뷰 체크포인트
│   │   ├── phase2-REVIEW.md
│   │   └── phase3.5-REVIEW.md
│   ├── issues/              # 이슈 문서
│   │   └── ISSUES.md
│   └── refactor/           # 리팩터링 문서
│       ├── 00-README.md
│       ├── 01-phase-0-prerequisites.md
│       ├── 02-phase-1-foundation.md
│       ├── 03-phase-2-core-logic.md
│       ├── 04-phase-3-reactive-state.md
│       ├── 04-phase-3.5-v1.5-state-migration.md
│       ├── 04-phase-4-preparation.md
│       ├── 05-phase-4-ui-components.md
│       ├── 06-phase-5-features.md
│       ├── 06-phase-5-fix-plan.md
│       ├── 07-phase-6-quality.md
│       ├── 08-checklist.md
│       └── daily-log.md
│
��── src/                     # 소스 코드
│   ├── app.d.ts             # 전역 타입 정의
│   ├── app.html            # 앱 HTML
│   ├── routes/             # SvelteKit 라우트
│   │   ├── +layout.svelte  # 루트 레이아웃
│   │   ├── +layout.ts      # 레이아웃 타입
│   │   ├── +page.svelte    # 메인 페이지
│   │   └── test/           # 테스트 페이지
│   │       └── +page.svelte
│   └── lib/                # 라이브러리
│       ├── index.ts         # 라이브러리 인덱스
│       ├── assets/         # 정적 자산
│       │   └── favicon.svg
│       ├── components/     # Svelte 컴포넌트 (15개)
│       │   ├── BattleSection.svelte
│       │   ├── DeckControls.svelte
│       │   ├── DesignerPanel.svelte
│       │   ├── HUD.svelte
│       │   ├── KeyBadge.svelte
│       │   ├── KeySettingsModal.svelte
│       │   ├── LanguageModal.svelte
│       │   ├── MainMenu.svelte
│       │   ├── MapSelectModal.svelte
│       │   ├── PlacementGhost.svelte
│       │   ├── SlotCard.svelte
│       │   ├── SlotPanel.svelte
│       │   ├── SpeedButton.svelte
│       │   ├── StatCard.svelte
│       │   └── Toast.svelte
│       ├── stores/         # 상태 관리
│       │   ├── game.ts               # GameManager (핵심)
│       │   ├── gameState.svelte.ts  # 반응형 상태 ($state)
│       │   ├── toast.svelte.ts     # 토스트 상태
│       │   ├── GameLoop.ts         # 게임 루프
│       │   ├── DesignerRenderer.ts # 설계판 렌더링
│       │   ├── SpellManager.ts      # 술식 저장/불러오기
│       │   └── __tests__/          # 테스트
│       │       └── GameManager.test.ts
│       └── game/           # 게임 로직
│           ├── types.ts            # 타입 정의
│           ├── constants.ts       # 상수
│           ├── style.css          # 스타일
│           ├── battle/           # 전투 시스템
│           │   ├── BattleEngine.ts     # 전투 엔진
│           │   ├── BattleRenderer.ts    # 전투 렌더러
│           │   ├── CastingSystem.ts     # 발사 시스템
│           │   ├── DamageResolver.ts    # 데미지 계산
│           │   ├── TargetingSystem.ts   # 타겟팅 시스템
│           │   └── __tests__/          # 테스트
│           │       ├── BattleEngine.test.ts
│           │       └── TargetingSystem.test.ts
│           ├── core/             # 핵심 저장/상태
│           │   ├── Storage.ts            # 저장 인터페이스
│           │   ├── StorageBase.ts      # 기본 저장
│           │   ├── StorageDecks.ts     # 덱 저장
│           │   ├── StorageKeys.ts     # 키 저장
│           │   ├── StorageMisc.ts     # 기타 저장
│           │   ├── StorageRecords.ts # 기록 저장
│           │   ├── StorageSlots.ts   # 슬롯 저장
│           │   ├── StorageUnlocks.ts # 해금 저장
│           │   ├── Store.svelte.ts   # Store 상태
│           │   └── __tests__/        # 테스트
│           │       ├── StorageRecords.test.ts
│           │       └── StorageSlots.test.ts
│           ├── designer/         # 설계 시스템
│           │   ├── Components.ts        # 부품 정의
│           │   ├── StatsCalculator.ts  # 통계 계산
│           │   ├── WireNetwork.ts      # 도선 네트워크
│           │   └── __tests__/          # 테스트
│           │       ├── Components.test.ts
│           │       ├── StatsCalculator.test.ts
│           │       └── WireNetwork.test.ts
│           ├── i18n/             # 국제화
│           │   ├── index.ts       # i18n 인터페이스
│           │   ├── ko.ts          # 한국어
│           │   ├── en.ts          # 영어
│           │   └── language.svelte.ts
│           ├── ui/               # UI 유틸리티
│           │   └── Toast.ts       # 토스트
│           └── utils/            # 유틸리티
│               ├── dom.ts           # DOM 유틸리티
│               ├── helpers.ts       # 헬퍼 함수
│               ├── mobile.ts       # 모바일 감지
│               └── progression.ts # 진행도
│
├── static/                  # 정적 파일
│   └── robots.txt
│
└── videos/                  # 동영상
    └── page@17f3c1f748dc81e656f592c41fc0e651.webm
```

---

## 3. 모듈 설명

### 3.1 핵심 모듈

| 모듈 | 경로 | 설명 |
|------|------|------|
| **GameManager** | `src/lib/stores/game.ts` | 전체 게임의 진입점, 싱글톤 패턴 |
| **Store** | `src/lib/game/core/Store.svelte.ts` | 순수 데이터 컨테이너 |
| **BattleEngine** | `src/lib/game/battle/BattleEngine.ts` | Tick 기반 전투 시뮬레이션 |
| **BattleRenderer** | `src/lib/game/battle/BattleRenderer.ts` | Canvas 2D 렌더링 |
| **Components** | `src/lib/game/designer/Components.ts` | 부품 정의 및 충돌 검사 |
| **StatsCalculator** | `src/lib/game/designer/StatsCalculator.ts` | 술식 통계 계산 |
| **WireNetwork** | `src/lib/game/designer/WireNetwork.ts` | 도선 네트워크 BFS |

### 3.2 저장 모듈 (Storage*.ts)

| 모듈 | 역할 |
|------|------|
| `StorageBase` | JSON 직렬화/역직렬화, 마이그레이션 |
| `StorageSlots` | 5개 슬롯 불러오기/저장 |
| `StorageDecks` | 덱(슬롯 묶음) 저장/불러오기 |
| `StorageRecords` | 맵별 최고 점수 및 별 계산 |
| `StorageUnlocks` | 맵/부품 해금 조건 평가 |
| `StorageKeys` | 키 바인딩 기본값 및 사용자 설정 |
| `StorageMisc` | 자동 모드, 언어, 배속 등 |

### 3.3 Svelte 컴포넌트 (15개)

| 컴포넌트 | 용도 |
|----------|------|
| `BattleSection.svelte` | 전투 캔버스 영역 |
| `DeckControls.svelte` | 덱 관리 컨트롤 |
| `DesignerPanel.svelte` | 설계판 패널 |
| `HUD.svelte` | 헤드업 디스플레이 |
| `KeyBadge.svelte` | 키 배지 |
| `KeySettingsModal.svelte` | 키 설정 모달 |
| `LanguageModal.svelte` | 언어 설정 모달 |
| `MainMenu.svelte` | 메인 메뉴 |
| `MapSelectModal.svelte` | 맵 선택 모달 |
| `PlacementGhost.svelte` | 배치 미리보기 |
| `SlotCard.svelte` | 슬롯 카드 |
| `SlotPanel.svelte` | 슬롯 패널 |
| `SpeedButton.svelte` | 속도 버튼 |
| `StatCard.svelte` | 통계 카드 |
| `Toast.svelte` | 토스트 알림 |

---

## 4. 데이터 흐름

### 4.1 상태 관리 흐름

```
      ┌─────────────────┐
      │   GameManager   │ (싱글톤)
      │ (src/lib/stores/
      │    game.ts)
      └────────┬────────┘
               │
               v
      ┌────────┴────────┐
      │ Store (데이터)   │
      │ (순수 TypeScript)│
      └────────┬────────┘
               │
               v
      ┌────────┴────────┐
      │  localStorage    │
      │  (영속 저장)      │
      └─────────────────┘
```

### 4.2 전투 흐름

```
      ┌─────────────────┐
      │   GameManager   │
      │  (전투 시작)     │
      └────────┬────────┘
               │
               v
      ┌────────┴────────┐
      │  GameLoop.ts     │ ──▶ requestAnimationFrame
      │  (20 tick/sec)  │
      └────────┬────────┘
               │
               v
      ┌────────┴────────┐
      │ BattleEngine   │ ──▶ updateBattleTick()
      │ (tick 로직)    │
      └────────┬────────┘
               │
               v
      ┌────────┴────────┐
      │ BattleRenderer│ ──▶ Canvas 2D 그리기
      │ (렌더링)        │
      └─────────────────┘
```

---

## 5. 키芭 bindings (localStorage)

| 저장 키 | 설명 |
|---------|------|
| `magic_design_game_slots_v2` | 5개 슬롯 술식 |
| `magic_design_game_decks_v1` | 덱 (10개 세트) |
| `magic_design_game_map_records_v3` | 맵별 기록 |
| `magic_design_game_map_unlocks_star_v2` | 해금 상태 |
| `magic_design_game_key_bindings_v1` | 키 바인딩 |
| `magic_design_game_slot_auto_modes_v1` | 자동 모드 |
| `jesulkr_language_v1` | 언어 설정 |

---

## 6. npm 스크립트

```sh
# 개발 서버 실행
bun run dev

# 프로덕션 빌드
bun run build

# 프로덕션 프리뷰
bun run preview

# 타입 체크
bun run check
bun run check:watch

# 테스트
bun run test
bun run test:watch
bun run test:ui

# 린트
bun run lint
bun run lint:fix

# 포맷팅
bun run format
```

---

## 7. 테스트 현황

- ** 프레임워크**: Vitest 4 (happy-dom)
- ** 테스트 파일 수**: 8개
- ** 테스트 수**: 87개

| 테스트 파일 | 대상 |
|-------------|------|
| `BattleEngine.test.ts` | 전투 엔진 |
| `TargetingSystem.test.ts` | 타겟팅 시스템 |
| `Components.test.ts` | 부품 충돌/크기 |
| `StatsCalculator.test.ts` | 통계 계산 |
| `WireNetwork.test.ts` | 도선 네트워크 |
| `StorageRecords.test.ts` | 기록 저장 |
| `StorageSlots.test.ts` | 슬롯 저장 |
| `GameManager.test.ts` | 게임 매니저 |

---

## 8. 버전 히스토리

| 버전 | 날짜 | 특징 |
|------|------|------|
| v1.0 | - | 기본 술식 설계 + 3개 맵 |
| v1.1 | - | 별 시스템, 맵 해금 |
| v1.2 | - | 도선 네트워크, 혼합 회로 |
| v1.3 | - | 덱 시스템, 키 설정, 배속 조절, 설계 미리보기, 모바일 |
| **v1.5** | 2026-06-11 | 마나 보너스 토글, 도구 해금, 튜토리얼, 15개 Svelte 컴포넌트 |

---

## 9. 관련 문서

- [README.md](../README.md) - 프로젝트 개요
- [docs/ARCHITECTURE.md](./ARCHITECTURE.md) - 아키텍처 상세
- [docs/API.md](./API.md) - API 레퍼런스
- [docs/GAME_DESIGN.md](./GAME_DESIGN.md) - 게임 디자인

---

*본 문서는 프로젝트의 구조를 파악하기 위해 작성되었습니다.*
