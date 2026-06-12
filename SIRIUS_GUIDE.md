# 🌟 시리우스를 위한 새 술식 추가 가이드

> 코딩 몰라도 됩니다. GPT한테 복붙하면 끝이에요.

---

## 📋 전체 흐름 (딱 4단계)

```
1. 아이디어 정리
2. GPT한테 요청
3. 파일 3개 수정 (GPT가 다 알려줌)
4. 끝
```

---

## 🧠 1단계 — 아이디어 정리

새 술식을 만들기 전에 이 4가지만 정해요:

| 항목 | 예시 | 설명 |
|------|------|------|
| **이름** | 화염 결정 | 게임에서 보이는 이름 |
| **크기** | 2칸 가로 | 1×1 / 2×1 / 2×2 / 3×2 / 3×3 / 4×4 중 하나 |
| **데미지 공식** | 빨간 마나 × 3 | 아래 "마나 종류" 참고 |
| **해금 조건** | 맵 1부터 | 맵 1 / 맵 2 / 맵 3 중 하나 |

### 사용 가능한 마나 종류

- **빨간 마나** (`red`) — 기본. 가장 흔함
- **파란 마나** (`blue`) — 파란 마나 생성기가 있어야 연결됨
- **초록 마나** (`green`) — 초록 마나 부품이 있어야 연결됨
- **안정도** (`stability`) — 안정기 부품이 있어야 생김

### 데미지 종류

- **일반 데미지** (`damage`) — 타겟 1마리에게
- **분산 데미지** (`aoe`) — 가까운 적 최대 3마리에게 나눠서
- **전체 데미지** (`globalDamage`) — 화면의 **모든** 몬스터에게 동시에

---

## 🤖 2단계 — GPT한테 이렇게 요청하세요

아래 내용을 **전체 복사**해서 GPT에 붙여넣고, 맨 아래 `[여기 채워요]` 부분만 바꾸면 돼요.

---

````
나는 Jesulkr라는 게임에 새 술식(부품)을 추가하려고 해.
코딩은 잘 모르니까 파일 내용을 완성해서 줘.

===== 부품 정의 형식 (def.ts) =====

export interface ComponentDef {
  type: string;          // 영어 고유 ID (소문자+숫자만, 띄어쓰기 없음)
  role: ComponentRole;   // 'circuit' = 데미지 부품
  name: string;          // 게임에서 보이는 이름
  text: string;          // 툴팁 설명
  formula: string;       // 공식 요약 (한 줄)
  size: { w: number; h: number; rotatable?: boolean }; // 크기. rotatable은 회전 가능 여부
  requiredMap: number;   // 1=처음부터, 2=맵2 해금, 3=맵3 해금
  order: number;         // 팔레트 순서 (기존 최대값 + 1)
  calc: (ctx) => { damage, aoe?, globalDamage?, detail }; // 데미지 계산
  style?: string;        // CSS (없어도 됨)
}

// calc 함수에서 쓸 수 있는 값:
// ctx.red       → 연결된 빨간 마나 수
// ctx.blue      → 연결된 파란 마나 수
// ctx.green     → 연결된 초록 마나 수
// ctx.stability → 이 부품 위치의 안정도

===== 기존 부품 예시 1 (단순한 거) =====

export const circle: ComponentDef = {
  type: 'circle',
  role: 'circuit',
  name: '1칸 회로',
  text: '연결된 빨간 마나를 일반 데미지로 바꿉니다.',
  formula: '연결 빨간 마나 수 × 1',
  size: { w: 1, h: 1 },
  requiredMap: 1,
  order: 3,
  calc: ({ red }) => ({
    damage: red,
    detail: `빨간 ${red}개 × 1`,
  }),
  style: `
.piece.circle::after{width:34px;height:34px;border:4px solid var(--red);border-radius:50%;}
.previewPiece.circle::after{content:"";position:absolute;display:block;left:18%;right:18%;top:18%;bottom:18%;border:2px solid var(--red);border-radius:50%}
.toolIcon.circle::after{left:50%;top:50%;width:24px;height:24px;border:4px solid var(--red);border-radius:50%;transform:translate(-50%,-50%);}
`,
};

===== 기존 부품 예시 2 (조건 있는 거) =====

export const ultimateCore: ComponentDef = {
  type: 'ultimateCore',
  role: 'circuit',
  name: '4x4 안정 핵',
  text: '초록마나 3, 파란마나 2, 빨간마나 6, 안정도 3 이상이 필요합니다.',
  formula: '빨강≥6, 파랑≥2, 초록≥3, 안정도≥3 → 1400 + 전체 100',
  size: { w: 4, h: 4 },
  requiredMap: 3,
  order: 38,
  calc: ({ red, blue, green, stability }) => {
    const ok = red >= 6 && blue >= 2 && green >= 3 && stability >= 3;
    if (!ok) {
      return { damage: 0, globalDamage: 0, detail: `조건 불만족` };
    }
    return { damage: 1400, globalDamage: 100, detail: `일반 1400, 전체 100` };
  },
  style: `
.piece.ultimateCore::after{left:8%;right:8%;top:8%;bottom:8%;border:5px solid var(--green);border-radius:50%;}
.previewPiece.ultimateCore::after{content:"";position:absolute;display:block;left:8%;right:8%;top:8%;bottom:8%;border:2px solid var(--green);border-radius:50%;}
.toolIcon.ultimateCore::after{left:7px;right:7px;top:7px;bottom:7px;border:3px solid var(--green);border-radius:50%;}
`,
};

===== 등록 방법 =====

완성된 부품은 아래 2개 파일을 수정해야 해.

[파일 1] src/lib/game/designer/components/registry.ts
- import 한 줄 추가
- ALL_DEFS 배열에 추가

[파일 2] src/lib/game/types.ts
- ComponentType에 타입 문자열 추가

===== CSS 색상 변수 =====
- var(--red)   → 빨간색 (#ff465c)
- var(--blue)  → 파란색 (#51a8ff)
- var(--green) → 초록색 (#70ffc0)

===== 내가 만들고 싶은 술식 =====

이름: [여기에 술식 이름 써요. 예: 번개 핵]
크기: [예: 2×2]
설명: [예: 빨간 마나와 파란 마나를 쌍으로 묶어 강력한 번개 데미지를 냄]
데미지 공식: [예: min(빨간, 파란) × 20]
특이사항: [예: 조건 불만족 시 0 / 회전 가능 / 분산 데미지도 줌 / 없으면 "없음"]
해금: [맵 1 / 맵 2 / 맵 3]
색상 테마: [빨간 / 파란 / 초록 / 혼합]
기존 최대 order 번호: 38

결과로 아래 3가지를 줘:
1. 새로 만들 파일 내용 (예: fireCrystal.ts)
2. registry.ts에서 바꿀 부분
3. types.ts에서 바꿀 부분
````

---

## 📁 3단계 — 파일 수정

GPT가 알려준 대로 딱 3군데만 바꾸면 돼요.

### 📄 새 파일 만들기

> 위치: `src/lib/game/designer/components/` 폴더 안에

GPT가 파일 내용을 통째로 줄 거예요. 그걸 그대로 복사해서 새 파일로 저장하면 됩니다.

예) `fireCrystal.ts` 파일을 그 폴더 안에 새로 만들고, GPT가 준 내용을 붙여넣기.

---

### 📄 registry.ts 수정

> 위치: `src/lib/game/designer/components/registry.ts`

GPT가 "여기에 이걸 추가하세요" 라고 정확히 알려줄 거예요.

**추가할 위치 2곳:**

```typescript
// ① 파일 맨 위쪽 import 목록 끝에 한 줄 추가
import { fireCrystal } from './fireCrystal';  // ← GPT가 이 줄을 줌

// ② ALL_DEFS 배열 안에 한 줄 추가
export const ALL_DEFS: ComponentDef[] = [
  // ... 기존 목록들 ...
  fireCrystal,  // ← GPT가 이 줄을 줌
  eraser,
];
```

---

### 📄 types.ts 수정

> 위치: `src/lib/game/types.ts`

`ComponentType` 이라는 부분을 찾아서 맨 끝에 한 줄 추가해요.

```typescript
export type ComponentType =
  | 'red' | 'blueGen' | 'wire'
  // ... 기존 목록들 ...
  | 'ultimateCore'
  | 'fireCrystal';  // ← 이 줄 추가 (GPT가 정확히 알려줌)
```

---

## ✅ 4단계 — 확인

파일 저장하고 게임을 열면 팔레트에 새 술식이 자동으로 나타나요.

안 나타나면? → GPT한테 "에러 메시지"를 그대로 복붙해서 보여주세요.

---

## 💡 자주 쓰는 공식 예시

참고용으로만 봐요. 이것 말고도 뭐든 가능해요.

| 아이디어 | 공식 예시 |
|---------|-----------|
| 빨간 마나가 많을수록 강함 | `red * 5` |
| 빨강 2개씩 묶어서 데미지 | `Math.floor(red / 2) * 10` |
| 빨강+파랑 짝 맞추기 | `Math.min(red, blue) * 15` |
| 조건 달성 시 폭발 | `red >= 5 && blue >= 3 ? 500 : 0` |
| 안정도 곱하기 | `red * stability * 3` |
| 초록+파랑 조합 | `Math.min(green, blue) * 40` |
| 모든 적 동시 피해 | `globalDamage: green * 10` |
| 분산 피해 | `aoe: red * 5` |

---

## ⚠️ 주의사항 딱 두 가지

1. **`type` 이름은 영어 소문자**만 (띄어쓰기 없음). 예: `fireCrystal` ✅ / `Fire Crystal` ❌
2. **같은 `type` 이름**을 두 번 쓰면 안 됨. 항상 새로운 이름 사용.

---

> 막히면 에러 메시지 들고 GPT한테 가면 됩니다. 끝! 🎉
