# Phase 5: UI 반영

> **현재 상태**: `TOOL_ORDER`가 `registry.ts`에서 자동 파생되므로 툴 버튼은 자동 생성됨. 추출기 색상 상태 및 v2 스타일은 미구현.

## 변경 파일

### 1. `src/lib/game/core/Store.svelte.ts` — 추출기 색상 상태 추가

```diff
  // designer 상태 슬라이스
  designer = $state({
    width: 5,
    height: 5,
    components: [] as Component[],
    tool: 'red' as ComponentType,
    rotation: 0,
    previewX: null as number | null,
    previewY: null as number | null,
    nextId: 1,
+   extractorColor: 'red' as ExtractorColor, // v2
  });
```

### 2. `src/lib/stores/game.ts` — 추출기 색상 순환 메서드 추가

```diff
+ import { cycleExtractorColor } from '$lib/game/designer/ExtractorSystem';

  setTool(tool: string) {
    // ... 기존 잠금 체크 ...
    gameState.designer.tool = tool as ComponentType;
+   if (tool === 'extractor') {
+     // 선택 시 기존 색상 유지, 순환은 별도 액션
+   }
  }

+ cycleExtractorColor() {
+   gameState.designer.extractorColor = cycleExtractorColor(gameState.designer.extractorColor);
+ }
```

### 3. `src/lib/components/DesignerPanel.svelte`

#### 3.1 툴 버튼
`TOOL_ORDER`가 자동으로 18개 버튼을 생성하므로 수동 추가 불필요. 다만 추출기 색상 순환 UX를 추가합니다.

```diff
  function onBoardWheel(e: WheelEvent) {
    e.preventDefault();
+   if (gameState.designer.tool === 'extractor') {
+     game.cycleExtractorColor();
+   } else {
      game.rotateTool();
+   }
  }
```

또는 툴 버튼을 다시 클릭하면 색상 순환:

```diff
  onclick={() => {
+   if (gameState.designer.tool === tool && tool === 'extractor') {
+     game.cycleExtractorColor();
+   } else {
      game.setTool(tool);
+   }
  }}
```

> **권장**: 휠 회전으로는 회전/색상을 모두 제어할 수 있으나, 모바일에서는 툴 버튼 재클릭이 더 직관적입니다. 둘 다 지원하는 것이 좋습니다.

#### 3.2 스탯 패널

```diff
  <div class="statGrid">
    <StatCard label={t('cooldown')} value={stats.castTime} detail={`발사 0.20초 / 쿨 ${(stats.castTime * 0.05).toFixed(2)}초`} />
-   <StatCard label={t('mana')} value={stats.manaCost} detail={`빨강 ${stats.redCount} + 파랑추가 ${stats.activeBlueCount * 2}`} />
+   <StatCard label={t('mana')} value={stats.manaCost} detail={`빨강 ${stats.redManaCost} + 초록 ${stats.greenManaCost} + 파랑 ${stats.activeBlueCount * 2}`} />
    <StatCard label={t('normal.damage')} value={stats.damage} detail={stats.valid ? t('can.save') : t('cannot.save')} />
    <StatCard label={t('special.damage')} value={stats.aoeDamage > 0 ? `${t('scatter')} ${stats.aoeDamage}` : t('none')} />
+   {#if stats.globalDamage > 0}
+     <StatCard label={t('global.damage')} value={stats.globalDamage} detail={t('all.monsters')} />
+   {/if}
+   {#if stats.maxStability > 0}
+     <StatCard label={t('stability')} value={stats.maxStability} detail={`안정기 ${stats.activeStabilizerCount} / 허브 ${stats.activeHubCount}`} />
+   {/if}
  </div>
```

### 4. `src/lib/components/PlacementGhost.svelte`

```diff
  const preview = $derived(
    gameState.designer.previewX !== null && gameState.designer.previewY !== null
      ? createComponentFromGridCoord(
          gameState.designer.tool,
          gameState.designer.previewX,
          gameState.designer.previewY,
          gameState.designer.nextId,
-         gameState.designer.rotation
+         gameState.designer.rotation,
+         gameState.designer.tool === 'extractor' ? gameState.designer.extractorColor : undefined
        )
      : null
  );
```

선택적으로 `placementGhost` 요소에 부품 타입 클래스를 추가해 미리보기 스타일을 적용할 수 있습니다.

```diff
  <div
    class="piece placementGhost {preview.type}"
+   class:extractor-red={preview.type === 'extractor' && preview.color === 'red'}
+   class:extractor-blue={preview.type === 'extractor' && preview.color === 'blue'}
+   class:extractor-green={preview.type === 'extractor' && preview.color === 'green'}
    class:invalid={!isValid}
    ...
  ></div>
```

### 5. `src/lib/stores/DesignerRenderer.ts` — 추출기 색상/방향 렌더링

실제 설계판에 배치된 부품 렌더링 시 추출기 색상과 방향을 시각적으로 표현:

```diff
  {#each gameState.designer.components as c (c.id)}
    <div
      class="piece {c.type}"
      class:vertical={c.h > c.w}
+     class:extractor-red={c.type === 'extractor' && c.color === 'red'}
+     class:extractor-blue={c.type === 'extractor' && c.color === 'blue'}
+     class:extractor-green={c.type === 'extractor' && c.color === 'green'}
+     style:transform={c.type === 'extractor' ? `rotate(${c.rotation * 90}deg)` : undefined}
      ...
    ></div>
  {/each}
```

> 실제 렌더링은 `DesignerPanel.svelte`에 인라인되어 있으므로, 위 변경은 `DesignerPanel.svelte` 낶의 `{#each gameState.designer.components}` 블록에 적용합니다.

### 6. `src/lib/game/style.css` — 글로벌 게임 스타일

```css
/* 색상 변수 */
:root {
  --green: #70ffc0;
  --green2: #1ca875;
  --violet: #b790ff;
}

/* 신규 부품 */
.piece.red3::after { content: '3R'; background: #ff4444; }
.piece.greenMana::after { content: 'GM'; background: var(--green); }
.piece.mediumWire::after { content: '↔'; }
.piece.mediumWire.vertical::after { content: '↕'; }
.piece.mediumHub::after { content: '◇'; }
.piece.extractor::after { content: '▶'; }
.piece.stabilizer::after { content: '◎'; }
.piece.green3x2::after { content: 'G3'; }
.piece.greenPair2::after { content: 'GB'; }
.piece.ultimateCore::after { content: 'U'; background: var(--violet); }

/* 추출기 색상 */
.piece.extractor.extractor-red::after { border-color: #ff4444; color: #ff4444; }
.piece.extractor.extractor-blue::after { border-color: #4444ff; color: #4444ff; }
.piece.extractor.extractor-green::after { border-color: var(--green); color: var(--green); }

/* 미리보기 */
.placementGhost.red3::after { content: '3R'; }
.placementGhost.greenMana::after { content: 'GM'; }
/* ... 나머지 신규 부품도 동일하게 ... */
```

---

## 완료 조건

- [ ] `Store.svelte.ts`에 `extractorColor` 상태 추가
- [ ] `game.ts`에 추출기 색상 순환 메서드 추가
- [ ] `DesignerPanel.svelte`: 추출기 색상 순환 UX, 스탯 패널 확장
- [ ] `PlacementGhost.svelte`: 추출기 색상 전달
- [ ] CSS에 v2 부품 스타일 추가
- [ ] `npm run check` 통과

## 예상 소요: 3시간
