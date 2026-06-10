# Jesulkr v1.3 아키텍처 문서

## 1. 개요

Jesulkr v1.3는 **싱글톤 GameManager** 중심의 상태 관리 아키텍처를 사용합니다. SvelteKit의 반응형 시스템과 별도로, 게임 상태는 순수 TypeScript 클래스로 관리되며 DOM 조작은 명시적 메서드 호출로 이루어집니다.

이 문서는 원작 HTML v1.3의 기능을 SvelteKit으로 포팅한 구조를 설명합니다.

v1.3의 핵심 추가 요소:
- **덱(Deck) 저장**: 5개 슬롯 묶음을 10개 세트로 저장/불러오기 (`StorageDecks`)
- **키 설정(Key Settings)**: 슬롯 발사키 및 조작키 전부 사용자 재정의 (`StorageKeys`)
- **배속(Speed)**: 1x/2x/4x/8x 실시간 변경 (`setBattleSpeed`)
- **설계 미리보기**: 마우스 hover 시 배치 위치 및 유효성 실시간 프리뷰
- **모바일 대응**: 터치 이벤트, 반응형 미디어쿼리, 가상 키패드 방지

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
| `initCanvas()` | Canvas 초기화 및 렌더 루프 시작 |
| `startBattle()` | 전투 상태 초기화 및 시작 |
| `castSlot(i)` | i번 슬롯 수동 발사 |
| `toggleDesigner()` | 설계 화면 ↔ 전투 화면 전환 |
| `placeComponent()` | 설계판에 부품 배치 |
| `setLanguage()` | 언어 변경 (ko/en) |

### 2.2 Store (`src/lib/game/core/Store.ts`)

순수 데이터 컨테이너입니다. UI 로직이 없으며, 모든 필드는 직접 할당 가능합니다.

주요 상태 슬라이스:
- `designer`: 설계판 크기, 부품 배열, 현재 도구
- `battle`: 점수, 마나, 몬스터, 발사체, 효과
- `slots[5]`: 저장된 5개 술식
- `records`: 맵별 최고 기록 (assist/pure)
- `unlocks`: 맵/부품 해금 상태

### 2.3 이벤트 버스 (`src/lib/game/core/EventBus.ts`)

Store 변경 알림을 위한 경량 이벤트 시스템입니다. 현재는 `emitStateChange(slice)`를 통해 특정 상태 슬라이스 변경을 알립니다.

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

- **크기 정의**: `red`(1x1), `oval`(2x1/1x2), `kernel`(2x2), `mixedCore`(3x3)
- **충돌 검사**: AABB(축 정렬 경계 상자) 기반 오버랩 체크
- **그리드 스냅**: 클릭 위치를 설계판 크기로 정규화 후 반올림

### 4.2 도선 네트워크 (`src/lib/game/designer/WireNetwork.ts`)

도선(`wire`)을 인접(4방향) 배치하면 하나의 네트워크로 연결됩니다.

```
빨강 - wire - wire - 회로
```

위 경우 회로는 빨간 마나와 연결된 것으로 간주됩니다.

`buildConnectionGraph()`:
1. 모든 wire를 BFS로 그룹화
2. 각 그룹의 인접 셀에 있는 비-wire 부품을 `components`에 등록
3. 부품→그룹, 그룹→부품 양방향 매핑 생성

`getConnectedComponents()`:
- 직접 인접한 부품 + 같은 wire 그룹에 연결된 모든 부품 반환

### 4.3 통계 계산 (`src/lib/game/designer/StatsCalculator.ts`)

`calculateSpellStats(model)`는 설계된 술식의 전체 통계를 계산합니다.

**계산 순서**:
1. 파란 마나 생성기 활성화 여부 판정 (연결된 빨간 마나 ≥ 1)
2. 각 회로별 데미지 계산:
   - `circle`: 연결 빨강 × 1
   - `oval`: floor(빨강 / 2) × 5
   - `kernel`: floor(빨강 / 3) × 12
   - `mixed2`: min(빨강, 파랑) × 8
   - `mixedCore`: min(빨강, floor(파랑/2), 인접 활성 circle 수) × (60 + 분산 3)
3. 총합 및 유효성 판정

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

Vitest를 사용한 단위 테스트:

| 테스트 파일 | 대상 |
|-------------|------|
| `TargetingSystem.test.ts` | 타겟팅 우선순위, 클릭 선택 |
| `Components.test.ts` | 부품 충돌, 크기, 배치 |
| `StatsCalculator.test.ts` | 통계 계산, mixedCore 복합 조건 |
| `WireNetwork.test.ts` | 도선 네트워크 BFS, 연결성 |

```sh
bun run test        # 한 번 실행
bun run test:watch  # 감시 모드
```

## 8. 빌드 및 배포

- **Adapter**: `@sveltejs/adapter-static`
- **출력**: `build/` 디렉토리 (정적 HTML/JS/CSS)
- **배포**: GitHub Pages, Cloudflare Pages, Vercel 등 임의 정적 호스팅 가능

```sh
bun run build
# build/ 디렉토리 업로드
```
