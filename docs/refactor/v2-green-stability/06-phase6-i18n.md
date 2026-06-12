# Phase 6: i18n 반영

> **현재 상태**: 9개 부품명만 번역됨. v2 용어 및 신규 부품명 누락.
>
> **규칙**: 기존과 동일하게 점 표기법 키 사용. `ko.ts`와 `en.ts` 모두 동일한 키셋 유지.

## 변경 파일

### 1. `src/lib/game/i18n/ko.ts`

```diff
  'red.mana': '빨간 점 마나',
  'blue.generator': '파란 마나 생성기',
  'wire': '도선',
  'circle': '1칸 회로',
  'oval': '2칸 타원',
  'kernel': '2x2 핵',
  'mixed2': '2칸 혼합',
  'mixed.core': '9칸 혼합 핵',
  'eraser': '지우개',
+
+ // v2 신규 부품명
+ 'red3': '3중 빨간 마나',
+ 'medium.wire': '중형 도선',
+ 'medium.hub': '중형 허브',
+ 'extractor': '추출기',
+ 'stabilizer': '안정기',
+ 'green.mana': '초록 마나',
+ 'green3x2': '3x2 순환 회로',
+ 'green.pair2': '2x2 녹청 회로',
+ 'ultimate.core': '4x4 안정 핵',
+
+ // v2 용어
+ 'green.mana.term': '초록마나',
+ 'stability': '안정도',
+ 'global.damage': '전체 데미지',
+ 'all.monsters': '모든 몬스터',
+ 'small.wire': '소형 도선',
```

### 2. `src/lib/game/i18n/en.ts`

```diff
  'red.mana': 'Red Mana',
  'blue.generator': 'Blue Mana Generator',
  'wire': 'Wire',
  'circle': '1-cell Circuit',
  'oval': '2-cell Oval',
  'kernel': '2x2 Core',
  'mixed2': '2-cell Hybrid',
  'mixed.core': '9-cell Hybrid Core',
  'eraser': 'Eraser',
+
+ // v2 new component names
+ 'red3': 'Triple Red Mana',
+ 'medium.wire': 'Medium Wire',
+ 'medium.hub': 'Medium Hub',
+ 'extractor': 'Extractor',
+ 'stabilizer': 'Stabilizer',
+ 'green.mana': 'Green Mana',
+ 'green3x2': '3x2 Cycle Circuit',
+ 'green.pair2': '2x2 Green-Blue Circuit',
+ 'ultimate.core': '4x4 Stability Core',
+
+ // v2 terms
+ 'green.mana.term': 'Green Mana',
+ 'stability': 'Stability',
+ 'global.damage': 'Global Damage',
+ 'all.monsters': 'All Monsters',
+ 'small.wire': 'Small Wire',
```

### 3. `src/lib/game/constants.ts`의 `TOOL_DESCRIPTIONS`

`TOOL_DESCRIPTIONS`는 `registry.ts`의 `ALL_DEFS`에서 자동 파생되므로, 컴포넌트 정의의 `name` 필드만 번역하면 됩니다. 추가 수동 매핑 불필요.

단, UI에서 `t(tool)` 형태로 도구 이름을 조회하는 곳이 있다면 해당 키(`'red3'`, `'medium.wire'` 등)가 `ko.ts`/`en.ts`에 존재해야 합니다.

---

## 완료 조건

- [ ] `ko.ts`: 9개 부품명 + v2 용어 추가
- [ ] `en.ts`: 9개 부품명 번역 + v2 용어 추가
- [ ] `npm run check` 통과
- [ ] 누락된 번역 키가 없는지 `t()` 호출부 검색 확인

## 예상 소요: 30분
