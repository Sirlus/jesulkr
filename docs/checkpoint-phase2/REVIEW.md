# Phase 2 중간 점검 보고서

> 작성일: 2026-06-10
> 범위: Phase 0 ~ Phase 2 완료 시점

---

## 1. 파일 구조

```
src/lib/stores/
├── game.ts                        # 336줄 — GameManager 파사드
├── GameLoop.ts                    #  77줄 — requestAnimationFrame 루프
├── DesignerRenderer.ts            #  70줄 — 설계판 DOM 렌더링
├── SpellManager.ts                #  59줄 — 술식 저장/불러오기
└── __tests__/
    └── GameManager.test.ts        #   (15 tests)

src/lib/game/
├── battle/
│   ├── BattleEngine.ts            # 속도 survival 연동, bossSpawned 플래그
│   └── DamageResolver.ts          # ⚠️ 기존 오류 (Monster|null 타입)
├── core/
│   ├── Storage.ts                 # clearAllStorage() 추가
│   └── Store.ts                   # ⚠️ 기존 오류 (BattleState 충돌)
├── designer/
│   ├── StatsCalculator.ts         # ✅ 정상
│   └── Components.ts              # ✅ 정상
├── i18n/
│   ├── ko.ts                      # boss.appeared, mana.bonus.activated, star.earned 추가
│   └── en.ts                      # ⚠️ 기존 중복키 (start, scatter)
└── utils/
    └── progression.ts             # getTotalStars에 includeCurrentRun 파라미터 추가
```

---

## 2. 변경사항 상세

### 2-1. 몬스터 속도 survival 연동 ✅
- **Before**: `const speed = boss ? 25 : (42 + Math.random() * 18)`
- **After**: `const speed = boss ? 25 : (42 + survival * 0.45 + Math.random() * 18)`
- **파일**: `BattleEngine.ts` L39
- **영향**: 30초 생존 시 속도 ~55px/s, 60초 시 ~69px/s

### 2-2. 맵 2 별 임계값 ✅
- **확인**: 이미 `[55000, 65000, 75000]`으로 정확 (constants.ts L40)
- **변경 불필요**

### 2-3. getTotalStars includeCurrentRun ✅
- **Before**: 항상 현재 전투 점수 포함
- **After**: `includeCurrentRun: boolean = true` 파라미터 추가
- **파일**: `progression.ts` L13

### 2-4. effectiveManaRegen 일관성 ✅
- **확인**: Store.ts에서 `getTotalStars(records, battle, state, activeRunMapId)` 호출 (기본값 true)
- **정상**

### 2-5. 보스 등장 토스트 ✅
- **TickResult**: `bossSpawned: boolean` 필드 추가 (L28)
- **BattleEngine**: 보스 생성 시 `bs = true` 설정 (L108)
- **GameLoop**: `result.bossSpawned` 시 `t('boss.appeared')` 출력 (L52-54)

### 2-6. 마나 재생 복원 토스트 ✅
- **Before**: 별 개수만 비교
- **After**: `beforeRegen`/`afterRegen` 비교 추가, `t('mana.bonus.activated')` 출력 (L231-238)

### 2-7. castSlot 에러 메시지 ✅
- **순서**: spell 체크 → state 체크 → cooldown 체크 → mana 체크 → target 체크
- **정상**

### 2-8. spawnTimer 초기값 ✅
- **startBattle()**: `b.spawnTimer = 10` (L171) — 원작과 동일

### 2-11. clearAllData ✅
- **Storage.clearAllStorage()**: 16개 키 전체 제거
- **GameManager.clearAllData()**: 전투 상태 초기화 → storage 제거 → reload → design 상태

---

## 3. 검증 결과

| 항목 | 상태 |
|------|------|
| `bun run build` | ✅ 통과 |
| `bun run test` (53 tests, 5 files) | ✅ 통과 |
| `bun run check` | ⚠️ 기존 7개 오류 (Phase 2에서 신규 오류 없음) |

### 기존 오류 (해결 완료 ✅)
| 파일 | 오류 | 해결 |
|------|------|------|
| `Store.ts:6` | BattleState import 충돌 | ✅ svelte-check fix 커밋에서 해결 |
| `game.ts:472` | toggleDesigner 타입 비교 | ✅ svelte-check fix 커밋에서 해결 |
| `ko.ts:95` | 'start' 중복키 | ⏳ Phase 6 |
| `en.ts:95-96` | 'start', 'scatter' 중복키 | ⏳ Phase 6 |
| `BattleEngine.ts:138` | Monster\|null 타입 | ⏳ Phase 6 |
| `DamageResolver.ts:27` | Monster\|null 타입 | ⏳ Phase 6 |

---

## 4. 잠재적 이슈

### 4-1. `bossSpawned`가 한 틱만 유지됨
보스가 스폰된 틱에만 `bossSpawned=true`이고 다음 틱부터는 false로 리셋됨.
→ 의도된 동작 (원작도 동일). 보스 토스트는 스폰 시점에 한 번만 출력.

### 4-2. `clearAllStorage`가 `Storage.ts`에서 import 순서
`Storage.ts` L22에서 `import * as C from '../constants'`가 export 블록 이후에 위치.
TypeScript/ESM에서는 문제 없으나, 가독성 측면에서 파일 상단으로 이동 권장.

### 4-3. `t()` 함수의 매개변수 치환
`i18n/index.ts`의 `t()`는 `{0}`, `{1}` 패턴을 지원함. `t('mana.bonus.activated', afterRegen)` 호출 정상.

---

## 5. 테스트 커버리지

| 모듈 | 테스트 수 | 커버 항목 |
|------|----------|-----------|
| GameManager.test.ts | 18 | eraseComponent, saveSpell(3), loadSpell, renderDesigner(2), clearDesign, recordRun(4), trimComponents(2), checkUnlocks, clearAllData, getTotalStars |
| Components.test.ts | 15 | dimensionsFor, overlap, placement, at, remove |
| StatsCalculator.test.ts | 8 | empty, red+circle, no-red, no-circuit, oval, kernel, mixed2 |
| WireNetwork.test.ts | 6 | connection graph |
| TargetingSystem.test.ts | 9 | target selection |

### 이전 누락 → 해결 완료
- ✅ `clearAllData()` 단위 테스트 추가
- ✅ `getTotalStars(includeCurrentRun=false)` 단위 테스트 추가
- ✅ `checkUnlocks()` with star earned 테스트 추가

---

## 6. 권장 사항 (Phase 2 시점 → 업데이트)

1. ~~Phase 3 전에 `clearAllData` 단위 테스트 추가~~ ✅ 완료
2. `Storage.ts`의 import를 파일 상단으로 이동 → Phase 4에서
3. ~~Phase 3에서 Store.ts BattleState 충돌 해결~~ ✅ 완료 (svelte-check fix)
4. Phase 6에서 i18n 중복키 정리
