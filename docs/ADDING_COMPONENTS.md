# 새 회로술식(부품) 추가하는 법

> 이 게임의 부품(회로술식)은 **레지스트리 구조**로 관리됩니다.
> 새 술식을 추가하려면 **파일 하나를 만들고 두 군데에 한 줄씩** 등록하면 끝입니다.
> 데미지 계산·팔레트 순서·설명·크기·해금 조건이 모두 자동으로 반영됩니다.

---

## 빠른 요약 (3곳만 건드리면 됩니다)

1. `src/lib/game/designer/components/` 에 **새 파일 1개** 생성 (예: `fireburst.ts`)
2. `src/lib/game/designer/components/registry.ts` 에 **import 1줄 + 배열 1줄** 추가
3. `src/lib/game/types.ts` 의 `ComponentType` 에 **타입 이름 1줄** 추가
4. (선택) `src/lib/game/style.css` 에 비주얼 추가 — 안 하면 기존 모양 재사용 가능

---

## 1. 새 부품 파일 만들기

`src/lib/game/designer/components/` 폴더에 새 파일을 만들고 아래 템플릿을 채웁니다.

```ts
// fireburst.ts
import type { ComponentDef } from './def';

export const fireburst: ComponentDef = {
  type: 'fireburst',        // 고유 식별자 (영문, 다른 부품과 겹치면 안 됨)
  role: 'circuit',          // 'mana' | 'generator' | 'wire' | 'circuit' | 'tool'
  name: '화염 폭발',         // 화면에 표시되는 이름
  text: '설명 문구...',      // 도구 설명
  formula: 'min(빨강, 파랑) × 10', // 공식 요약
  size: { w: 2, h: 2 },     // 크기. 회전 가능하면 rotatable: true 추가
  requiredMap: 3,           // 몇 번째 맵을 깨야 해금되는지 (1 = 처음부터)
  order: 9,                 // 팔레트에서의 순서 (숫자 작을수록 앞)

  // 데미지 계산 — role 이 'circuit' 일 때만 필요
  calc: ({ red, blue }) => {
    const pairs = Math.min(red, blue);
    return {
      damage: pairs * 10,
      detail: `min(빨강 ${red}, 파랑 ${blue}) = ${pairs}쌍 × 10`,
    };
  },
};
```

### `calc` 함수에서 쓸 수 있는 값들

| 이름 | 설명 |
|------|------|
| `red` | 이 회로에 연결된 빨간 마나 개수 |
| `blue` | 이 회로에 연결된 활성 파란 마나 개수 |
| `neighbors` | 이 부품과 직접 인접한 부품 배열 |
| `connectedTo(부품, 조건)` | 특정 부품에 연결된 부품 중 조건에 맞는 개수 |
| `component`, `components` | 이 부품 / 전체 부품 목록 |
| `isActiveBlue(id)` | 해당 파란 생성기가 활성인지 |

`calc` 의 반환값:

```ts
return {
  damage: 일반_데미지,     // 필수
  aoe: 분산_데미지,        // 선택 (없으면 0)
  detail: '계산 설명 문구', // 필수 (통계창 breakdown 에 표시)
};
```

### 데미지 없는 부품 (마나·도선 등)

`role` 이 `mana`/`generator`/`wire`/`tool` 이면 `calc` 를 **생략**합니다.

---

## 2. 레지스트리에 등록

`src/lib/game/designer/components/registry.ts` 를 열고 두 줄을 추가합니다.

```ts
// (위쪽 import 묶음에 추가)
import { fireburst } from './fireburst';

// ...

export const ALL_DEFS: ComponentDef[] = [
  red,
  blueGen,
  wire,
  circle,
  oval,
  kernel,
  mixed2,
  mixedCore,
  fireburst,   // ← 추가
  eraser,
];
```

---

## 3. 타입에 등록

`src/lib/game/types.ts` 의 `ComponentType` 에 타입 이름을 추가합니다.

```ts
export type ComponentType =
  | 'red' | 'blueGen' | 'wire'
  | 'circle' | 'oval' | 'kernel'
  | 'mixed2' | 'mixedCore'
  | 'fireburst'   // ← 추가
  | 'eraser';
```

---

## 4. (선택) 비주얼 추가

비주얼을 새로 만들지 않으면 설계판에서 부품이 빈 칸처럼 보일 수 있습니다.
`src/lib/game/style.css` 에서 `.piece.기존타입::after` 규칙을 복사해
`.piece.fireburst::after` 로 이름만 바꿔 재사용하는 것이 가장 쉽습니다.

---

## GPT(챗봇)에게 시킬 때 쓸 프롬프트

> 아래는 우리 게임의 부품 정의 형식이야. 이 형식에 맞춰서 **새 파일 하나**만 만들어줘.
> - 부품 이름: (예: 화염 폭발)
> - 데미지 공식: (예: 연결된 빨강과 파랑 중 작은 수 × 10)
> - 크기: (예: 2x2)
> - 해금 맵: (예: 3번 맵)
>
> ```ts
> import type { ComponentDef } from './def';
>
> export const 부품이름: ComponentDef = {
>   type: '영문식별자',
>   role: 'circuit',
>   name: '한글 이름',
>   text: '설명',
>   formula: '공식 요약',
>   size: { w: 2, h: 2 },
>   requiredMap: 3,
>   order: 9,
>   calc: ({ red, blue }) => {
>     const pairs = Math.min(red, blue);
>     return { damage: pairs * 10, detail: `설명 ${pairs}` };
>   },
> };
> ```
>
> 그리고 registry.ts 에 추가할 import 줄과 배열 줄, types.ts 의 ComponentType 에 추가할 줄도 알려줘.

---

## 검증

추가 후 아래를 실행해 문제가 없는지 확인합니다.

```sh
bun run check   # 타입 검사
bun run test    # 테스트
```
