# Phase 7: 테스트 및 정리

> **현재 상태**: `PROTOTYPE_UNLOCK_ALL_TOOLS` 미정의

## 테스트 시나리오

### 1. 프로토타입 상태 설정

```typescript
// src/lib/game/constants.ts
export const PROTOTYPE_UNLOCK_ALL_TOOLS = true; // 개발/테스트용
// 배포 시: false
```

`requiredMapForTool()`에서 이 플래그가 true면 모든 도구의 `requiredMap`을 1로 처리:

```diff
  export function requiredMapForTool(tool: string): number {
+   if (PROTOTYPE_UNLOCK_ALL_TOOLS) return 1;
    return getDef(tool)?.requiredMap ?? 1;
  }
```

### 2. 테스트 체크리스트

#### 타입/컴포넌트
- [ ] `ComponentType`이 18개로 컴파일됨
- [ ] `ALL_DEFS` 길이가 18
- [ ] `ORDERED_TYPES`에 18개 항목
- [ ] `CIRCUIT_TYPES`에 v2 회로(`green3x2`, `greenPair2`, `ultimateCore`) 포함
- [ ] `STORABLE_TYPES`에 `extractor`, `stabilizer` 포함

#### 색상별 도선망
- [ ] `buildColorConnectionGraph`가 `{ red, blue, green }` 반환
- [ ] 소형 도선: red/blue 그래프에 포함, green 그래프에 미포함
- [ ] 중형 도선: 3색 모두 전달, 회전에 따라 가로/세로 연결만 허용
- [ ] 중형 허브: 활성 시 4방향, 비활성 시 연결 차단
- [ ] 기존 `buildConnectionGraph`가 v1 스펙 그대로 동작

#### 안정도
- [ ] 안정기가 파란 마나 연결 시 활성화
- [ ] 안정기가 주변 8칸에 안정도 1 제공 (쉐비셰프 거리 1)
- [ ] 안정도 1 이상인 위치의 mediumHub 활성화
- [ ] 안정도 3 이상일 때 ultimateCore 데미지 발생
- [ ] 고정점 반복이 2회 이내에 수렴

#### 추출기
- [ ] `cycleExtractorColor`: red → blue → green → red
- [ ] 추출기 출력 방향이 회전에 따라 변경
- [ ] 입력 측 색상 도선망/소스에 연결되지 않으면 출력 없음
- [ ] 추출기 출력 대상 회로에 해당 색상 카운트 +1

#### 녹색 마나
- [ ] `greenMana`가 `mixed2`와 접촉 시 활성화
- [ ] 활성화된 `greenMana`가 초록 마나 1 제공
- [ ] 활성화된 `greenMana`당 마나 비용 +2
- [ ] `green3x2`: 초록≥1, 파랑≥1, 빨강=0 조건
- [ ] `greenPair2`: damage = min(초록, 파랑) × 40

#### 전체 데미지
- [ ] `ultimateCore` 시전 시 모든 생존 몬스터 HP 감소
- [ ] `globalDamage`가 `SpellData`에 저장/불러오기됨
- [ ] 레거시 저장 데이터 로드 시 `globalDamage`가 `0`으로 기본값 처리

#### 레거시 호환
- [ ] v1.x 저장 데이터 로딩
- [ ] `extractRed`/`extractBlue`/`extractGreen` → `extractor` + `color` 마이그레이션
- [ ] 기존 `red`, `blueGen`, `wire` 정상 동작

#### UI
- [ ] 18개 도구 버튼 모두 표시
- [ ] 추출기 선택 시 색상 순환 UI 작동
- [ ] PlacementGhost에 추출기 색상 반영
- [ ] 스탯 패널에 안정도/전체 데미지 표시

### 3. 새 테스트 파일

```
src/lib/game/designer/__tests__/
├── ExtractorSystem.test.ts
├── StabilitySystem.test.ts
├── ColorWireNetwork.test.ts
└── GreenStatsCalculator.test.ts
```

### 4. 레거시 호환 처리

```typescript
// StorageSlots.ts 또는 StorageDecks.ts
export function normalizeLegacySpell(raw: any): SpellData {
  const components = (raw.components || []).map((c: any) => {
    if (c.type === 'extractRed') return { ...c, type: 'extractor', color: 'red' };
    if (c.type === 'extractBlue') return { ...c, type: 'extractor', color: 'blue' };
    if (c.type === 'extractGreen') return { ...c, type: 'extractor', color: 'green' };
    if (c.type === 'mana') return { ...c, type: 'red' };
    return c;
  });

  return {
    ...raw,
    components,
    globalDamage: Number(raw.globalDamage) || 0,
  };
}
```

---

## 완료 조건

- [ ] `PROTOTYPE_UNLOCK_ALL_TOOLS = true`로 테스트
- [ ] 모든 시나리오 통과
- [ ] 레거시 호환성 확인
- [ ] `PROTOTYPE_UNLOCK_ALL_TOOLS = false` 전환
- [ ] `npm run check` 및 `npm run test` 통과

## 예상 소요: 4시간
