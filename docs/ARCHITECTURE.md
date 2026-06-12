# Jesulkr v2.0 아키텍처 문서

## 1. 개요

Jesulkr v2.0은 **싱글톤 GameManager** 중심의 상태 관리 아키텍처를 사용합니다. SvelteKit의 반응형 시스템과 별도로, 게임 상태는 순수 TypeScript 클래스로 관리되며 DOM 조작은 명시적 메서드 호출로 이루어집니다.

> **2026-06-12 현황**: v2 Green/Stability 리팩터링 완료. `svelte-check` 0 errors, 141 tests 통과.

v1.5의 핵심 기능:
- **덱(Deck) 저장**: 5개 슬롯 묶음을 10개 세트로 저장/불러오기 (`StorageDecks`) ✅ 구현
- **키 설정(Key Settings)**: 슬롯 발사키 및 조작키 전부 사용자 재정의 (`StorageKeys`) ✅ 구현
- **배속(Speed)**: 1x/2x/4x/8x 실시간 변경 (`setBattleSpeed`) ✅ 구현
- **설계 미리보기**: 마우스 hover 시 배치 위치 및 유효성 실시간 프리뷰 (`PlacementGhost.svelte`) ✅ 구현
- **모바일 대응**: 터치 이벤트, 반응형 미디어쿼리, 가상 키패드 방지 (`mobile.ts`) ✅ 구현
- **도구 해금 로직**: `requiredMapForTool`, `isToolUnlocked` ✅ 구현
- **마나 보너스 토글**: `toggleManaBonus()` ✅ 구현
- **맵 선택/덱 관리/키 설정 모달**: 3개 Svelte 모달 컴포넌트 ✅ 구현

## 2. 상태 관리 흐름

```
+-------------+     +----------------+     +------------------+
|  GameManager | --> |     Store      | --> |   localStorage   |
|  (싱글톤)    |     |  (순수 데이터)  |     |   (영속 저장)     |
+-------------+     +----------------+     +------------------+
      |
      v
+-------------+     +----------------+     +------------------+
|   Canvas    | <-- | BattleRenderer | <-- |  updateBattleTick |
|  (렌더링)    |     |  (Canvas 2D)   |     |   (20 tick/sec)   |
+-------------+     +----------------+     +------------------+
      |
      v
+-------------+     +----------------+
|    DOM      | <-- |   UI modules   |
|  (HTML/CSS) |     | (HUD, Slots...)|
+-------------+     +----------------+
```

### 2.1 GameManager (`src/lib/stores/game.ts`)

게임의 모든 상호작용과 상태 변경의 진입점입니다.

| 역할 | 설명 |
|------|------|
| `initClient()` | 브라우저 환경에서 localStorage 로드, 언어 설정 |
| `initCanvas()` | Canvas 초기화 및 렌더링 루프 시작 (`GameLoop.ts`) |
| `startBattle()` | 전투 상태 초기화 및 시작 (`recordRun()` 포함) |
| `castSlot(i)` | i번 슬롯 수동 발사 |
| `toggleDesigner()` | 설계 화면 ↔ 전투 화면 전환 |
| `placeComponent()` | 설계판에 부품 배치 |
| `setLanguage()` | 언어 변경 (ko/en) |

> 모든 진입점이 구현 완료되었습니다. `GameManager`의 핵심 메서드는 `game.ts`(542줄)에 정의되어 있으며, `GameLoop.ts`, `SpellManager.ts`, `DesignerRenderer.ts`로 분리되었습니다.

### 2.2 Store (`src/lib/game/core/Store.ts`)

순수 데이터 컨테이너입니다. UI 로직이 없으며, 모든 필드는 직접 할당 가능합니다.

주요 상태 슬라이스:
- `designer`: 설계판 크기, 부품 배열, 현재 도구
- `battle`: 점수, 마나, 몬스터, 발사체, 효과
- `slots[5]`: 저장된 5개 술식
- `records`: 맵별 최고 기록 (assist/pure)
- `unlocks`: 맵/부품 해금 상태

### 2.3 반응형 상태 (`src/lib/stores/gameState.svelte.ts`)

Svelte 5 `$state` 룬을 사용한 반응형 상태 관리입니다. `gameState` 객체를 통해 UI 컴포넌트가 상태 변화를 자동으로 감지합니다.

## 3. 전투 엔진

### 3.1 Tick 기반 시뮬레이션

전투는 **고정 시간 간격(20 tick/sec, TICK_SEC = 1/20)**으로 업데이트됩니다. `requestAnimationFrame` 루프에서 누적 시간(accumulator)을 기반으로 필요한 tick 수만큼 `updateBattleTick`을 호출합니다.

```ts
// GameManager 낶의 루프 (요약)
while (accumulator >= TICK_SEC) {
  updateBattleTick(...); // 물리/게임 로직
  accumulator -= TICK_SEC;
}
renderer.render(...); // 매 프레임 렌더링
```

### 3.2 updateBattleTick (`src/lib/game/battle/BattleEngine.ts`)

한 tick 동안 수행되는 작업 순서:

1. **마나 재생**: `effectiveManaRegen * TICK_SEC` 만큼 마나 회복
2. **쿨타임 감소**: 5개 슬롯의 쿨타임 -1
3. **자동 발사**: assist 모드에서 auto ON 슬롯의 조건 체크 및 발사체 생성
4. **보스 생성**: `repeatingBoss` 맵에서 시간 기준 보스 스폰
5. **몬스터 생성**: spawnTimer 기준 일반 몬스터 스폰 (생존 시간에 따라 간격 감소)
6. **몬스터 이동**: y축 이동, 기지 도달 시 HP 감소
7. **발사체 해결**: 4 tick 후 도착, 데미지 적용 및 효과 생성
8. **효프 감소**: life time 초과 효과 제거

### 3.3 BattleRenderer (`src/lib/game/battle/BattleRenderer.ts`)

Canvas 2D를 사용한 즉시 모드 렌더링:

- **배경**: `#07101e` 색상, 레인 구분선 (점선)
- **기지 영역**: 하단 38px, 붉은색 경계선
- **발사체**: 기지→대상 직선 + 도착 지점 원형 파동
- **몬스터**: 원형, HP 텍스트, 처음 표시, 보스는 더 큰 원 + HP 바
- **효과**: 히트(빨강), 킬(초록), AOE(파랑), 기지 피해(분홍)
- **오버레이**: 일시정지/게임오버 시 반투명 + 텍스트

## 4. 설계 시스템

### 4.1 부품 배치 (`src/lib/game/designer/Components.ts`)

- **크기 정의**: `red`(1x1), `red3`(2x1), `oval`(2x1/1x2), `kernel`(2x2), `mixedCore`(3x3), `ultimateCore`(4x4) 등 18종
- **충돌 검사**: AABB(축 정렬 경계 상자) 기반 오버랩 체크
- **그리드 스냅**: 클릭 위치를 설계판 크기로 정규화 후 반올림
- **추출기 색상**: `createComponentFromGridCoord`에 `color` 파라미터로 전달

### 4.2 색상별 도선망 (`src/lib/game/designer/WireNetwork.ts`)

v2에서 도선망이 **색상별로 독립**됩니다.

```
빨강 - wire - wire - 회로       (wire: 적/청 전달)
초록 마나 - mediumWire - 회로   (mediumWire: 적/청/녹 전달)
```

`buildColorConnectionGraph()`: red / blue / green 3개 `ConnectionGraph`를 독립적으로 생성.  
`getConnectedComponentsByColor()`: 직접 인접 + 색상별 wire 그룹으로 연결된 컴포넌트 반환.

기존 `buildConnectionGraph()` / `getConnectedComponents()`는 레거시 호환으로 유지.

### 4.3 안정도 시스템 (`src/lib/game/designer/StabilitySystem.ts`)

- `isActiveStabilizer()`: 활성 blueGen과 blue 네트워크로 연결된 경우 활성화
- `stabilityAt()`: 활성 stabilizer들 중 Chebyshev 거리 ≤ 1인 것들의 합산
- `chebyshevDistance()`: 두 컴포넌트 바운딩박스 기준 Chebyshev 거리

### 4.4 추출기 시스템 (`src/lib/game/designer/ExtractorSystem.ts`)

- `extractorOutputTarget()`: 회전 방향에 따라 출력 대상 컴포넌트 결정
- `extractorHasInputOfColor()`: 지정 색상이 추출기 입력 측에 연결됐는지 확인
- `cycleExtractorColor()`: red → blue → green → red 색상 순환

### 4.5 통계 계산 (`src/lib/game/designer/StatsCalculator.ts`)

`calculateSpellStats(model)`는 v2 다중 패스로 전체 통계를 계산합니다.

**계산 순서 (8단계)**:
1. blueGen 활성화 (연결 빨강 ≥ 1)
2. stabilizer 활성화 (활성 blueGen 연결)
3. 안정도 맵 계산 (Chebyshev 거리 기반)
4. mediumHub 활성화 (안정도 ≥ 1)
5. 1~4 고정점 수렴까지 반복 (최대 5회)
6. greenMana 활성화 (mixed2 직접 인접)
7. 추출기 출력 결정
8. 회로별 CalcContext 구성 → `def.calc()` 호출 → 데미지 합산

**저장 가능 조건**:
- 빨간 마나 ≥ 1
- 회로 ≥ 1
- 일반 데미지 ≥ 1

## 5. 저장 시스템 (`src/lib/game/core/Storage*.ts`)

모듈별로 분리된 저장 계층:

| 모듈 | 역할 |
|------|------|
| `StorageBase` | JSON 직렬화/역직렬화, 마이그레이션 래퍼 |
| `StorageSlots` | 5개 슬롯 불러오기/저장, 레거시 마이그레이션 |
| `StorageDecks` | 덱(슬롯 묶음) 저장/불러오기 |
| `StorageRecords` | 맵별 최고 점수 및 별 개수 계산 |
| `StorageUnlocks` | 맵 해금 조건 평가 (별 개수 기반) |
| `StorageKeys` | 키 바인딩 기본값 및 사용자 설정 |
| `StorageMisc` | 자동 모드, 언어, 배속 등 기타 설정 |

### 5.1 마이그레이션

- `slots_v1` → `slots_v2`: 필드명 정규화 (`w`, `h`, `rotation` 등)
- `records_v1/v2` → `records_v3`: 구조 변경 대응

## 6. 국제화 (i18n)

`src/lib/game/i18n/`에 언어별 키-값 객체를 두고, `t(key, ...args)` 함수로 번역합니다.

```ts
import { t } from '$lib/game/i18n';
t('not.enough.mana'); // "마나 부족"
t('score');           // "점수"
```

- **ko.ts**: 한국어 (기본)
- **en.ts**: 영어
- `setLanguage('ko' | 'en')`로 전환, `localStorage`에 저장

## 7. 테스트

Vitest를 사용한 단위 테스트 (총 141 tests, 12 files):

| 테스트 파일 | 대상 |
|-------------|------|
| `WireNetwork.test.ts` | 도선 네트워크 BFS, 연결성 |
| `ColorWireNetwork.test.ts` | 색상별 도선망 v2 |
| `Components.test.ts` | 부품 충돌, 크기, 배치 |
| `StabilitySystem.test.ts` | 안정도 계산, Chebyshev 거리 |
| `ExtractorSystem.test.ts` | 추출기 방향, 색상 입력 |
| `StatsCalculator.test.ts` | 통계 계산, mixedCore 복합 조건 |
| `GreenStatsCalculator.test.ts` | 초록/안정도/ultimateCore 시나리오 |
| `TargetingSystem.test.ts` | 타겟팅 우선순위, 클릭 선택 |
| `BattleEngine.test.ts` | 전투 엔진, globalDamage |
| `StorageSlots.test.ts` | 슬롯 저장/마이그레이션 |
| `StorageRecords.test.ts` | 기록 저장/별 계산 |
| `GameManager.test.ts` | 통합 상태 관리 |

```sh
bun run test        # 한 번 실행
bun run test:watch  # 감시 모드
```

## 8. 빌드 및 배포

- **Adapter**: `@sveltejs/adapter-static`
- **설정**: `svelte.config.js` (SvelteKit 2.x 표준)
- **출력**: `build/` 디렉토리 (정적 HTML/JS/CSS)
- **배포**: GitHub Pages, Cloudflare Pages, Vercel 등 임의 정적 호스팅 가능

```sh
npm run build
# build/ 디렉토리 업로드
```

### 현재 빌드 상태 (2026-06-12)

- `npm run check` 기준 **0 errors, 0 warnings**
- `npm run test` 기준 **141 tests 통과** (12 files)
- `npm run build` **정상 성공**
