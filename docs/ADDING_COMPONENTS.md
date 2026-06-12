# 새 회로술식(부품) 추가하는 법

> 이 게임의 부품(회로술식)은 **레지스트리 구조**로 관리됩니다.
> 새 술식을 추가하려면 **파일 하나를 만들고 두 군데에 한 줄씩** 등록하면 끝입니다.
> 데미지 계산·팔레트 순서·설명·크기·해금 조건이 모두 자동으로 반영됩니다.

---

## 빠른 요약 (한 파일 + 두 줄)

1. `src/lib/game/designer/components/` 에 **새 파일 1개** 생성 (예: `fireburst.ts`) — **비주얼 CSS도 이 파일 안에** 넣습니다
2. `src/lib/game/designer/components/registry.ts` 에 **import 1줄 + 배열 1줄** 추가
3. `src/lib/game/types.ts` 의 `ComponentType` 에 **타입 이름 1줄** 추가

> 비주얼(piece/미리보기/팔레트 아이콘)은 def 파일의 `style` 필드에 CSS 문자열로 함께 넣습니다.
> 더 이상 `style.css` 를 따로 건드릴 필요가 없습니다.

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

  // 비주얼 CSS — 설계판 piece / 미리보기 / 팔레트 아이콘.
  // 부품 클래스가 raw DOM 으로 붙으므로 전역 CSS 로 주입됩니다(스코프 X).
  style: `
.piece.fireburst::after{width:78%;height:78%;border:5px solid var(--red);border-radius:50%}
.previewPiece.fireburst::after{content:"";position:absolute;display:block;left:8%;right:8%;top:8%;bottom:8%;border:2px solid var(--red);border-radius:50%}
.toolIcon.fireburst::after{left:4px;right:4px;top:4px;bottom:4px;border:4px solid var(--red);border-radius:50%}
`,
};
```

### `calc` 함수에서 쓸 수 있는 값들

| 이름 | 설명 |
|------|------|
| `red` | 이 회로에 연결된 빨간 마나 개수 |
| `blue` | 이 회로에 연결된 활성 파란 마나 개수 |
| `green` | 이 회로에 연결된 초록 마나 개수 |
| `stability` | 이 회로에 적용된 안정도 |
| `neighbors` | 이 부품과 직접 인접한 부품 배열 |
| `connectedTo(부품, 조건)` | 특정 부품에 연결된 부품 중 조건에 맞는 개수 |
| `component`, `components` | 이 부품 / 전체 부품 목록 |
| `isActiveBlue(id)` | 해당 파란 생성기가 활성인지 |

`calc` 의 반환값:

```ts
return {
  damage: 일반_데미지,       // 필수
  aoe: 분산_데미지,          // 선택 (없으면 0)
  globalDamage: 전체_데미지, // 선택 (모든 적에게 주는 피해)
  detail: '계산 설명 문구',   // 필수 (통계창 breakdown 에 표시)
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

## 4. 비주얼 CSS (def 의 `style` 필드)

부품의 모양은 **같은 def 파일의 `style` 필드**에 CSS 문자열로 넣습니다.
부품은 설계판에 raw DOM(`<div class="piece 타입">`)으로 그려지므로 **전역 CSS** 가 필요하며,
registry 가 모든 def 의 `style` 을 모아 `+page.svelte` 에서 한 번에 주입합니다.

세 가지 셀렉터를 채웁니다(가장 쉬운 방법은 기존 부품 CSS 를 복사해 타입 이름만 바꾸기):

| 셀렉터 | 용도 |
|--------|------|
| `.piece.타입::after` / `::before` | 설계판에 배치된 모양 |
| `.previewPiece.타입::after` / `::before` | 패널 미리보기 모양 (※ `content:"";position:absolute;display:block` 포함) |
| `.toolIcon.타입::after` / `::before` | 팔레트 버튼 아이콘 |

색상 변수: `var(--red)` `var(--blue)` `var(--green)` 등을 사용합니다.
회전 가능 부품은 `.piece.타입.vertical::after` 규칙도 추가합니다.

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
>   style: `
> .piece.영문식별자::after{width:78%;height:78%;border:5px solid var(--red);border-radius:50%}
> .previewPiece.영문식별자::after{content:"";position:absolute;display:block;left:8%;right:8%;top:8%;bottom:8%;border:2px solid var(--red);border-radius:50%}
> .toolIcon.영문식별자::after{left:4px;right:4px;top:4px;bottom:4px;border:4px solid var(--red);border-radius:50%}
> `,
> };
> ```
>
> 비주얼 CSS 는 위 `style` 필드 안에 함께 넣어줘(전역 CSS, 스코프 없음).
> 그리고 registry.ts 에 추가할 import 줄과 배열 줄, types.ts 의 ComponentType 에 추가할 줄도 알려줘.

---

## 검증

추가 후 아래를 실행해 문제가 없는지 확인합니다.

```sh
bun run check   # 타입 검사
bun run test    # 테스트
```
