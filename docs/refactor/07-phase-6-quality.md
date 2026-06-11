# Phase 6: Quality

> **목표**: 테스트, 접근성, 성능, 문서화를 통해 프로덕션 품질 달성  
> **기간**: 3~4일  
> **브랜치**: `refactor/phase-6-quality` (base: `refactor/phase-5-features`)

---

## 6-1. 테스트 커버리지 확대

### 6-1-1. BattleEngine 단위 테스트

```ts
// src/lib/game/battle/__tests__/BattleEngine.test.ts
import { describe, it, expect } from 'vitest';
import { updateBattleTick } from '../BattleEngine';
import type { Monster, BattleContext } from '../types';

function makeCtx(overrides: Partial<BattleContext> = {}): BattleContext {
  return {
    slots: [null, null, null, null, null],
    slotAutoModes: [false, false, false, false, false],
    autoManaReserve: 0,
    unlocks: { '1': true, '2': true, '3': true },
    records: { assist: {}, pure: {} },
    runMode: 'assist',
    canvasWidth: 720,
    canvasHeight: 520,
    map: {
      id: 1, shortName: '맵 1', name: '맵 1', desc: '',
      minHp: 1, maxHp: 20
    },
    ...overrides,
  };
}

describe('updateBattleTick', () => {
  it('increases survival and regenerates mana', () => {
    const result = updateBattleTick(
      0, 10, 20, 0, [], [], [], [0,0,0,0,0], null,
      10, 1, 1, Infinity, 30, 6, makeCtx()
    );
    expect(result.survival).toBeCloseTo(0.05, 5); // TICK_SEC = 1/20
    expect(result.mana).toBeCloseTo(10.3, 5); // 6 * 0.05 = 0.3
  });

  it('decreases cooldowns', () => {
    const result = updateBattleTick(
      0, 20, 20, 0, [], [], [], [5, 3, 0, 0, 0], null,
      10, 1, 1, Infinity, 30, 6, makeCtx()
    );
    expect(result.cooldowns).toEqual([4, 2, 0, 0, 0]);
  });

  it('spawns monster when timer reaches 0', () => {
    const result = updateBattleTick(
      0, 20, 20, 60, [], [], [], [0,0,0,0,0], null,
      0, 1, 1, Infinity, 30, 6, makeCtx()
    );
    expect(result.monsters.length).toBeGreaterThan(0);
    expect(result.spawnTimer).toBeGreaterThan(0);
  });

  it('reduces baseHp when monster reaches base', () => {
    const monster: Monster = {
      id: 1, lane: 0, x: 100, y: 490, // near base (520-34=486)
      hp: 5, maxHp: 5, speed: 100, boss: false
    };
    const result = updateBattleTick(
      0, 20, 20, 0, [monster], [], [], [0,0,0,0,0], null,
      10, 2, 1, Infinity, 30, 6, makeCtx()
    );
    expect(result.baseHp).toBeLessThan(20);
    expect(result.monsters.length).toBe(0);
  });

  it('increases monster speed with survival', () => {
    // Phase 2에서 복원한 survival * 0.45 속도 증가 검증
    const ctx = makeCtx();
    const result1 = updateBattleTick(
      0, 20, 20, 0, [], [], [], [0,0,0,0,0], null,
      10, 1, 1, Infinity, 30, 6, ctx
    );
    // 첫 spawnTimer 감소 후 다음 spawn 확인
    expect(result1.spawnTimer).toBeGreaterThan(0);
  });

  it('spawns boss on repeatingBoss map', () => {
    const ctx = makeCtx({
      map: {
        id: 3, shortName: '맵 3', name: '맵 3', desc: '',
        minHp: 1, maxHp: 20, repeatingBoss: true,
        firstBossAt: 30, bossHp: 500, bossInterval: 30
      }
    });
    const result = updateBattleTick(
      0, 20, 20, 30, [], [], [], [0,0,0,0,0], null,
      10, 1, 1, 30, 30, 6, ctx
    );
    expect(result.spawnedBoss).toBe(true);
    expect(result.monsters.some(m => m.boss)).toBe(true);
  });

  it('game over when baseHp reaches 0', () => {
    const result = updateBattleTick(
      0, 20, 0, 0, [], [], [], [0,0,0,0,0], null,
      10, 1, 1, Infinity, 30, 6, makeCtx()
    );
    expect(result.isGameOver).toBe(true);
  });
});
```

### 6-1-2. Storage 모듈 테스트

```ts
// src/lib/game/core/__tests__/StorageSlots.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { loadSlots, saveSlots, normalizeSpell } from '../StorageSlots';

// localStorage mock
const storage = new Map<string, string>();
Object.defineProperty(global, 'localStorage', {
  value: {
    getItem: (k: string) => storage.get(k) ?? null,
    setItem: (k: string, v: string) => storage.set(k, v),
    removeItem: (k: string) => storage.delete(k),
  },
  writable: true,
});

beforeEach(() => storage.clear());

describe('normalizeSpell', () => {
  it('validates red + circle', () => {
    const spell = normalizeSpell({
      id: 'test', name: 'Test',
      width: 2, height: 2,
      components: [
        { id: 1, type: 'red', x: 0, y: 0, w: 1, h: 1, rotation: 0 },
        { id: 2, type: 'circle', x: 1, y: 0, w: 1, h: 1, rotation: 0 },
      ]
    });
    expect(spell).not.toBeNull();
    expect(spell?.damage).toBe(1);
  });

  it('rejects spell with no circuits', () => {
    const spell = normalizeSpell({
      width: 2, height: 2,
      components: [{ id: 1, type: 'red', x: 0, y: 0, w: 1, h: 1, rotation: 0 }]
    });
    expect(spell).toBeNull();
  });

  it('migrates legacy "mana" type to "red"', () => {
    const spell = normalizeSpell({
      width: 2, height: 2,
      components: [{ id: 1, type: 'mana', x: 0, y: 0, w: 1, h: 1, rotation: 0 },
                   { id: 2, type: 'circle', x: 1, y: 0, w: 1, h: 1, rotation: 0 }]
    });
    expect(spell?.components[0].type).toBe('red');
  });
});

describe('loadSlots / saveSlots', () => {
  it('round-trips slots', () => {
    const slots = [
      { id: 's1', name: 'Fire', width: 2, height: 2, components: [], castTime: 4, manaCost: 1, damage: 1, aoeDamage: 0, breakdown: [] },
      null, null, null, null
    ];
    saveSlots(slots);
    const loaded = loadSlots();
    expect(loaded[0]?.name).toBe('Fire');
    expect(loaded[1]).toBeNull();
  });

  it('returns empty slots when no storage', () => {
    const slots = loadSlots();
    expect(slots).toEqual([null, null, null, null, null]);
  });
});
```

### 6-1-3. GameManager 통합 테스트

```ts
// src/lib/stores/__tests__/gameActions.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { gameActions } from '../gameActions';
import { gameState } from '../gameState.svelte';

describe('gameActions', () => {
  beforeEach(() => {
    // 상태 초기화
    gameState.slots = [null, null, null, null, null];
    gameState.designer.components = [];
    gameState.state = 'design';
  });

  it('saveSpell and loadSpell round-trip', () => {
    gameState.designer.components = [
      { id: 1, type: 'red', x: 0, y: 0, w: 1, h: 1, rotation: 0 },
      { id: 2, type: 'circle', x: 1, y: 0, w: 1, h: 1, rotation: 0 },
    ];
    gameActions.saveSpell('Fireball', 0);
    expect(gameState.slots[0]?.name).toBe('Fireball');

    gameState.designer.components = [];
    gameActions.loadSpell(0);
    expect(gameState.designer.components.length).toBe(2);
  });

  it('clearDesign removes all components', () => {
    gameState.designer.components = [{ id: 1, type: 'red', x: 0, y: 0, w: 1, h: 1, rotation: 0 }];
    gameActions.clearDesign();
    expect(gameState.designer.components.length).toBe(0);
  });

  it('setFrame trims outside components', () => {
    gameState.designer.components = [
      { id: 1, type: 'red', x: 2, y: 2, w: 1, h: 1, rotation: 0 },
    ];
    gameActions.setFrame(2, 2);
    expect(gameState.designer.components.length).toBe(0);
  });

  it('castSlot requires battle state', () => {
    gameState.state = 'ready';
    const result = gameActions.castSlot(0);
    // should show toast, not throw
    expect(gameState.state).toBe('ready');
  });
});
```

### 6-1-4. 테스트 실행 스크립트 업데이트

```json
// package.json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage"
  }
}
```

---

## 6-2. 접근성 (a11y)

### 6-2-1. 토스트 알림

```svelte
<!-- Toast.svelte -->
<div
  id="toast"
  class:show={visible}
  class:good={type === 'good'}
  class:bad={type === 'bad'}
  role="status"
  aria-live="polite"
  aria-atomic="true"
>
  {message}
</div>
```

### 6-2-2. 언어 선택 모달

```svelte
<!-- LanguageModal.svelte -->
<div
  class="languageModal"
  class:hidden={!show}
  role="dialog"
  aria-modal="true"
  aria-labelledby="langTitle"
>
  <div class="languageBox" role="document">
    <div id="langTitle" class="languageLogo">Jesulkr</div>
    <!-- 초점 트랩 -->
    <div class="languageButtons">
      <button
        type="button"
        onclick={() => selectLang('ko')}
        autofocus
      >
        한국어
      </button>
      <button type="button" onclick={() => selectLang('en')}>
        English
      </button>
    </div>
  </div>
</div>
```

### 6-2-3. 버튼 접근성

| 현재 | 개선 |
|------|------|
| 이모지 버튼 `🔴` | `<button aria-label="Red Mana">🔴</button>` |
| 키 설정 캡처 중 | `<button aria-live="polite">입력 중...</button>` |
| 모달 배경 | `<div role="button" tabindex="-1" onclick={close}></div>` |

### 6-2-4. 색상 대비 검증

```bash
#axe-core CLI 설치 (선택)
npm install -g @axe-core/cli
#axe http://localhost:5173 --tags wcag2aa
```

수동 검증 항목:
- [ ] `--muted: #9fb2cf` on `--bg: #07101d` → 대비율 ≥ 4.5:1
- [ ] `--gold: #ffd76d` on `--panel: #101b2e` → 대비율 ≥ 4.5:1
- [ ] `--good: #70ffc0` on `--bg: #07101d` → 대비율 ≥ 4.5:1

---

## 6-3. 성능

### 6-3-1. Canvas offscreen 캐싱

```ts
// src/lib/game/battle/BattleRenderer.ts
export class BattleRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private staticCanvas: HTMLCanvasElement; // 추가
  private staticCtx: CanvasRenderingContext2D; // 추가

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.staticCanvas = document.createElement('canvas');
    this.staticCanvas.width = canvas.width;
    this.staticCanvas.height = canvas.height;
    this.staticCtx = this.staticCanvas.getContext('2d')!;
    this.renderStaticLayer(); // 배경, 레인, 기지 영역은 한 번만 그림
  }

  private renderStaticLayer() {
    const w = this.staticCanvas.width;
    const h = this.staticCanvas.height;
    const ctx = this.staticCtx;
    // 배경
    ctx.fillStyle = '#07101e';
    ctx.fillRect(0, 0, w, h);
    // 레인
    ctx.strokeStyle = 'rgba(81,168,255,.22)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 10]);
    for (let i = 0; i <= LANES; i++) {
      const x = i * w / LANES;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    // 기지 영역
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(255,70,92,.12)';
    ctx.fillRect(0, h - 38, w, 38);
    ctx.strokeStyle = 'rgba(255,70,92,.65)';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(0, h - 38); ctx.lineTo(w, h - 38); ctx.stroke();
  }

  render(/* ... */) {
    const w = this.canvas.width;
    const h = this.canvas.height;
    this.ctx.clearRect(0, 0, w, h);
    // 정적 레이어 복사
    this.ctx.drawImage(this.staticCanvas, 0, 0);
    // 동적 요소만 그림 (몬스터, 발사체, 효과)
    // ...
  }
}
```

### 6-3-2. `structuredClone` 사용

```ts
// src/lib/game/utils/helpers.ts
export function clone<T>(obj: T): T {
  if (typeof structuredClone === 'function') {
    return structuredClone(obj);
  }
  return JSON.parse(JSON.stringify(obj));
}
```

### 6-3-3. localStorage debounce

```ts
// src/lib/game/core/StorageBase.ts
const debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();

export function saveJSON(key: string, value: unknown): void {
  const raw = JSON.stringify(value);
  // 즉시 저장은 유지하되, 빈번한 호출 시 마지막 호출만 실행
  const existing = debounceTimers.get(key);
  if (existing) clearTimeout(existing);
  debounceTimers.set(key, setTimeout(() => {
    localStorage.setItem(key, raw);
    debounceTimers.delete(key);
  }, 50)); // 50ms debounce
}
```

### 6-3.4. devicePixelRatio 대응

```ts
// BattleCanvas.svelte
onMount(() => {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = 720 * dpr;
  canvas.height = 520 * dpr;
  canvas.style.width = '720px';
  canvas.style.height = '520px';
  const ctx = canvas.getContext('2d')!;
  ctx.scale(dpr, dpr);
  // ...
});
```

---

## 6-4. 문서화

### 6-4-1. JSDoc 추가

```ts
/**
 * 설계된 술식의 모든 통계를 계산합니다.
 * @param model - 설계 모델 (width, height, components)
 * @returns 쿨타임, 마나 비용, 데미지, 유효성 등의 통계
 */
export function calculateSpellStats(model: SpellModel): SpellStats {
  // ...
}
```

대상 함수:
- [ ] `calculateSpellStats`
- [ ] `buildConnectionGraph`
- [ ] `updateBattleTick`
- [ ] `spawnOneMonster`
- [ ] `GameActions`의 모든 public 메서드

### 6-4.2. CHANGELOG 작성

```markdown
# Changelog

## [1.3.0] - 2026-06-XX

### Added
- SvelteKit 포팅 완료
- 모듈화된 저장 시스템 (7개 Storage 모듈)
- Vitest 기반 단위 테스트
- 다국어 지원 (ko/en)

### Changed
- 단일 HTML → SvelteKit 모듈 구조
- DOM 직접 조작 → Svelte 선언적 템플릿

### Fixed
- 몬스터 속도가 생존 시간에 따라 증가하지 않던 버그
- 맵 2 별 조건이 잘못 설정되어 있던 버그
```

### 6-4.3. README 업데이트

- [ ] 기술 스택 테이블에 Svelte 5 룬 명시
- [ ] 프로젝트 구조에 `src/lib/components/` 추가
- [ ] 개발 스크립트에 `npm run check`, `npm run test` 추가
- [ ] 테스트 섹션에 테스트 커버리지 현황 추가

---

## 6-5. ESLint 도입

```bash
bun add -d eslint @eslint/js @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-plugin-svelte
```

```js
// eslint.config.js
import js from '@eslint/js';
import ts from 'typescript-eslint';
import svelte from 'eslint-plugin-svelte';

export default [
  js.configs.recommended,
  ...ts.configs.recommended,
  ...svelte.configs['flat/recommended'],
  {
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
        extraFileExtensions: ['.svelte'],
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'svelte/no-at-debug-tags': 'error',
    },
  },
];
```

```json
// package.json
{
  "scripts": {
    "lint": "eslint src",
    "lint:fix": "eslint src --fix"
  }
}
```

---

## 6-6. CI/CD 업데이트

### GitHub Actions workflow 수정

```yaml
# .github/workflows/deploy.yml (추가 단계)
      - name: Type Check
        run: npm run check

      - name: Test
        run: npm run test

      - name: Lint
        run: npm run lint
```

---

## 6-7. 검증 체크리스트

- [ ] BattleEngine.ts 테스트 커버리지 ≥ 80%
- [ ] Storage 모듈 테스트 커버리지 ≥ 80%
- [ ] GameManager 통합 테스트 ≥ 5개 시나리오
- [ ] axe-core로 a11y 오류 0개
- [ ] Canvas offscreen 캐싱 적용 후 CPU 사용량 감소
- [ ] `structuredClone` 폴백 정상 동작
- [ ] JSDoc이 모든 public API에 적용됨
- [ ] CHANGELOG에 v1.3.0 항목 작성됨
- [ ] ESLint 오류 0개, 경고 ≤ 10개
- [ ] CI workflow에 type check, test, lint 단계 추가됨

- [ ] ESLint 오류 0개, 경고 ≤ 10개
- [ ] CI workflow에 type check, test, lint 단계 추가됨

---

## 6-6. 코드 품질 및 아키텍처 개선

### 6-6-1. GameManager 책임 분리

| 참조 | IMPROVEMENTS.md §3.1 |
|------|---------------------|

현재 `GameManager`가 20개 이상의 public 메서드로 모든 책임을 가지고 있음.
Phase 3의 `$state` 도입 이후 자연스럽게 분리:

```
GameManager (메서드 레이어 유지)
├── BattleController      # startBattle, restartBattle, togglePause, castSlot, setBattleSpeed
├── DesignerController    # placeComponent, eraseComponent, setTool, rotateTool, setFrame
├── SpellManager          # saveSpell, loadSpell, clearDesign, trimComponents
├── InputController       # 키보드/마우스/터치 이벤트 라우팅
└── StorageManager        # loadFromStorage, clearAllData (기존 Storage.ts 모듈 활용)
```

- [ ] 각 컨트롤러를 `src/lib/game/controllers/` 디렉토리로 분리
- [ ] `GameManager`는 파사드 역할만 유지 (컨트롤러에 위임)

### 6-6-2. `updateBattleTick` 파라미터 객체화

| 참조 | IMPROVEMENTS.md §3.2 |
|------|---------------------|

```ts
// 변경 전: 14개 positional parameters
export function updateBattleTick(
  score, mana, baseHp, survival, monsters, casts, effects,
  cooldowns, selectedTargetId, spawnTimer, nextMonsterId, nextCastId,
  nextBossAt, bossInterval, regen, ctx
): TickResult

// 변경 후: 객체 구조화
interface BattleTickState {
  score: number; mana: number; baseHp: number; survival: number;
  monsters: Monster[]; casts: CastProjectile[]; effects: VisualEffect[];
  cooldowns: number[]; selectedTargetId: number | null;
  spawnTimer: number; nextMonsterId: number; nextCastId: number;
  nextBossAt: number; bossInterval: number;
}
export function updateBattleTick(state: BattleTickState, regen: number, ctx: BattleContext): TickResult
```

- [ ] `BattleTickState` 인터페이스 정의 (`types.ts` 또는 `BattleEngine.ts`)
- [ ] `GameManager` 호출부 수정 (game loop)
- [ ] `BattleEngine.test.ts` 테스트 업데이트

### 6-6-3. 불필요 의존성 및 설정 정리

- [ ] `sass-embedded` 제거 (`.scss` 파일 미사용)
- [ ] `vitest.config.ts` → `globals: true` 제거 (모든 테스트가 명시적 import 사용)
- [ ] `package-lock.json` 제거 (`bun.lock` 만 유지)
- [ ] `ESLint` + `@typescript-eslint` + `eslint-plugin-svelte` 도입

### 6-6-4. 보안 강화

- [ ] `innerHTML` 사용처 (`game.ts`, `SlotPanel.ts`, `HUD.ts`) → `escapeHtml` 적용 검증
- [ ] 사용자 입력 (술식 이름, 덱 이름) localStorage 저장 전 `escapeHtml` 확인
- [ ] Svelte 컴포넌트 전환 시 자동으로 innerHTML 제거됨 (Phase 4에서 처리)

---

## 완료 기준
---

## 완료 기준

- [ ] `npm run test` → 모든 테스트 통과 (70+ cases)
- [ ] `npm run check` → 타입 오류 0
- [ ] `npm run build` → 정상 빌드
- [ ] GameManager 컨트롤러 분리 완료
- [ ] `updateBattleTick` 파라미터 객체화 완료
- [ ] 불필요 의존성 제거 (sass-embedded, package-lock.json)
- [ ] ESLint 도입 및 통과
- [ ] innerHTML 보안 검증 완료
- [ ] WCAG AA 접근성 기준 충족
- [ ] Canvas 60fps 유지

## 산출물

| 파일/브랜치 | 설명 |
|------------|------|
| `refactor/phase-6-quality` | 프로덕션 품질 |
| `src/lib/game/battle/__tests__/BattleEngine.test.ts` | 전투 엔진 테스트 |
| `src/lib/game/core/__tests__/*.test.ts` | 저장 모듈 테스트 |
| `src/lib/stores/__tests__/gameActions.test.ts` | 통합 테스트 |
| `eslint.config.js` | ESLint 설정 |
| `CHANGELOG.md` | 변경 이력 |
| 수정된 `.github/workflows/deploy.yml` | CI 파이프라인 |
