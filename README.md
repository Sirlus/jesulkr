# Jesulkr (제슬커) v2.0

> Svelte 5 + SvelteKit으로 제작된 타워 디펜스형 술식 설계 게임

## 개요

**Jesulkr**는 플레이어가 직접 술식(스펠)을 설계하고, 이를 슬롯에 장착하여 몬스터의 침공으로부터 기지를 지키는 게임입니다.

- **술식 설계**: 설계판에 다양한 부품(회로, 마나원, 도선 등)을 배치하여 술식의 데미지, 마나 소모, 쿨타임을 결정합니다.
- **전투**: 설계한 술식을 5개 슬롯에 장착하고, 타이밍에 맞춰 발사하거나 자동 모드로 운용합니다.
- **맵 & 해금**: 3개의 맵이 있으며, 높은 점수를 획득해 별을 모으면 새로운 부품과 맵이 해금됩니다.

---

## 기술 스택

| 구분 | 기술 |
|------|------|
| 프레임워크 | Svelte 5 (runes mode), SvelteKit 2 |
| 언어 | TypeScript 6 |
| 번들러 | Vite 8 |
| 스타일 | CSS |
| 테스트 | Vitest 4 |
| 포맷터 | Prettier 3 + prettier-plugin-svelte |
| 린트 | ESLint 10 + typescript-eslint + eslint-plugin-svelte |
| 패키지 매니저 | bun |
| 배포 | 정적 사이트 (`@sveltejs/adapter-static`) |

---

## 프로젝트 구조

```
src/
├── routes/
│   ├── +page.svelte              # 메인 진입점
│   ├── +layout.svelte            # 루트 레이아웃
│   └── test/+page.svelte         # 테스트 페이지
├── lib/
│   ├── components/               # 15개 Svelte 5 컴포넌트
│   │   ├── Toast.svelte
│   │   ├── KeyBadge.svelte
│   │   ├── SpeedButton.svelte
│   │   ├── StatCard.svelte
│   │   ├── SlotCard.svelte
│   │   ├── SlotPanel.svelte
│   │   ├── HUD.svelte
│   │   ├── BattleSection.svelte
│   │   ├── DesignerPanel.svelte
│   │   ├── LanguageModal.svelte
│   │   ├── MainMenu.svelte
│   │   ├── MapSelectModal.svelte
│   │   ├── DeckControls.svelte
│   │   ├── KeySettingsModal.svelte
│   │   └── PlacementGhost.svelte
│   ├── stores/
│   │   ├── game.ts               # GameManager
│   │   ├── gameState.svelte.ts   # 반응형 상태 ($state)
│   │   ├── toast.svelte.ts       # 토스트 상태
│   │   ├── GameLoop.ts           # RAF 게임 루프
│   │   ├── DesignerRenderer.ts   # 설계판 렌더링
│   │   ├── SpellManager.ts       # 술식 저장/불러오기
│   │   └── __tests__/
│   └── game/
│       ├── types.ts
│       ├── constants.ts
│       ├── style.css
│       ├── i18n/                 # ko, en
│       ├── core/                 # Store, Storage* (7개 모듈)
│       ├── designer/             # Components, StatsCalculator, WireNetwork,
│       │                         # StabilitySystem, ExtractorSystem
│       │   └── components/       # 18개 부품 정의 (v2에서 9개 추가)
│       ├── battle/               # BattleEngine, BattleRenderer, Targeting 등
│       ├── ui/                   # Toast.ts
│       └── utils/                # helpers, progression, mobile, dom
```

---

## 버전 정보

| 버전 | 특징 |
|------|------|
| v1.0 | 기본 술식 설계 + 3개 맵 |
| v1.1 | 별 시스템, 맵 해금 |
| v1.2 | 도선 네트워크, 혼합 회로 |
| v1.3 | 덱 시스템, 키 설정, 배속 조절, 설계 미리보기, 모바일 대응 |
| v1.5 | 마나 보너스 토글, 도구 해금, 튜토리얼, Svelte 컴포넌트 15개 분리 |
| **v2.0** | **초록 마나 시스템, 안정도 시스템, 추출기, 중형 도선/허브, 9개 신규 부품** |

---

## 주요 기능

### 1. 술식 설계 (Designer)

- **부품 배치**: 빨간 마나, 파란 마나 생성기, 도선, 다양한 회로를 설계판에 배치
- **v2 신규**: 초록 마나, 안정기, 추출기, 중형 도선/허브, 고위 회로 추가
- **회전**: `oval`, `mixed2`, `mediumWire` 등 일부 부품은 회전 가능
- **색상별 도선망**: `wire`(적/청), `mediumWire`(적/청/녹) 색상별로 독립적으로 신호 전달
- **추출기**: 한 색상의 마나를 다른 회로에 직접 주입
- **실시간 통계**: 배치 즉시 쿨타임, 마나 소모, 일반/특수/전체 데미지, 안정도, breakdown 표시
- **저장 조건**: 빨간 마나 1개 이상 + 회로 1개 이상 + 일반 데미지 1 이상

### 2. 전투 시스템 (Battle)

- **5개 레인**: 몬스터는 5개 레인 중 하나에서 기지 방향으로 이동
- **수동/자동 모드**:
  - `assist`: 자동 발사 ON/OFF 가능, 키 입력으로 수동 발사
  - `pure`: 완전 수동, 모든 발사를 직접 조작
- **속도 조절**: x1 / x2 / x4 / x8 배속 지원
- **v2 전체 데미지**: ultimateCore 발동 시 모든 몬스터에 동시 피해
- **보스전**: 맵 3에서는 HP 500의 보스가 주기적으로 등장

### 3. 진행 및 해금 (Progression)

- **별 시스템**: 각 맵별로 3단계 점수 기준(별)이 있으며, 달성 시 별 획득
- **마나 재생 보너스**: 총 별 5개 이상 획득 시 마나 재생 +4 (6→10)
- **맵 해금**:
  - 맵 1: 기본 해금
  - 맵 2: 맵 1에서 별 1개 이상 획득 시 해금
  - 맵 3: 맵 2에서 별 1개 이상 획득 시 해금

### 4. 저장 시스템 (Storage)

모든 데이터는 브라우저 `localStorage`에 저장됩니다.

| 저장 항목 | 키 |
|-----------|-----|
| 슬롯 술식 | `magic_design_game_slots_v2` |
| 덱 | `magic_design_game_decks_v1` |
| 기록 | `magic_design_game_map_records_v3` |
| 해금 상태 | `magic_design_game_map_unlocks_star_v2` |
| 키 바인딩 | `magic_design_game_key_bindings_v1` |
| 자동 모드 | `magic_design_game_slot_auto_modes_v1` |
| 언어 | `jesulkr_language_v1` |

---

## 스크립트

```sh
# 개발 서버
bun run dev

# 빌드 (정적)
bun run build

# 프로덕션 프리뷰
bun run preview

# 타입 체크
bun run check

# 테스트
bun run test

# 린트
bun run lint

# 포맷팅
bun run format
```

---

## 테스트 현황

- **테스트 프레임워크**: Vitest 4 (happy-dom 환경)
- **테스트 수**: 141 tests, 12 test files
- **주요 커버리지 대상**: BattleEngine, StorageSlots, StorageRecords, StatsCalculator, WireNetwork, ColorWireNetwork, StabilitySystem, ExtractorSystem, GreenStatsCalculator, Components, TargetingSystem, GameManager

## 문서

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — 아키텍처 및 모듈 상세
- [docs/GAME_DESIGN.md](docs/GAME_DESIGN.md) — 게임 메커니즘 및 수치 설계
- [docs/CONSISTENCY_REPORT.md](docs/CONSISTENCY_REPORT.md) — 정합성 검사 보고서

---

## 라이선스

비공개 프로젝트
