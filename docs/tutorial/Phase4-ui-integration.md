# Phase 4: UI 통합 (UI Integration)

> 예상 시간: 1시간
> 선행 조건: Phase 1, 2, 3 완료

## 작업 목록

### 4.1 MainMenu에 도움말 버튼 추가
**파일**: `src/lib/components/MainMenu.svelte`

```svelte
<script lang="ts">
  import { t } from '$lib/game/i18n';
  
  // HelpModal 참조
  let helpModal: { open: () => void; close: () => void };
  
  let panelOpen = $state(false);

  function handleAction(fn: (() => void) | undefined) {
    panelOpen = false;
    fn?.();
  }
</script>

<div id="mainMenuWrap" class="mainMenuWrap">
  <button id="mainMenuBtn" class="mainMenuBtn" type="button" onclick={() => panelOpen = !panelOpen}>{t('menu')}</button>
  <div id="mainMenuPanel" class="mainMenuPanel" class:hidden={!panelOpen}>
    <div class="mainMenuTitle">{t('menu')}</div>
    <button type="button" onclick={() => handleAction(onOpenMapSelect)}>{t('map.select')}</button>
    <button type="button" onclick={() => handleAction(onOpenKeySettings)}>{t('key.settings')}</button>
    <button type="button" onclick={() => { panelOpen = false; onToggleDeck?.(); }}>{t('deck.manager')}</button>
    <button type="button" onclick={() => { panelOpen = false; helpModal?.open(); }}>{t('help')}</button>  <!--新增-->
    <button type="button" onclick={() => { panelOpen = false; game.toggleManaBonus(); }}>⚡ 마나 보너스 ON/OFF</button>
    <button type="button" onclick={() => { panelOpen = false; game.clearAllData(); }}>{t('clear.all.data')}</button>
    <!-- 기존 LangButtons 유지 -->
  </div>
</div>
```

**문서에 HelpModal import 추가**:
```svelte
<script lang="ts">
  import HelpModal from './HelpModal.svelte';
  // ...
  let helpModal: { open: () => void; close: () => void };
</script>

<!-- ... -->
<HelpModal bind:this={helpModal} />
```

### 4.2 DesignerPanel의 toolInfo에 공식(formula) 추가
**파일**: `src/lib/components/DesignerPanel.svelte`

```svelte
<div id="toolInfo" class="toolInfo">
  {#if gameState.designer.tool && TOOL_DESCRIPTIONS[gameState.designer.tool]}
    {@const info = TOOL_DESCRIPTIONS[gameState.designer.tool]}
    <b>{info.name}</b>
    <div class="small">{info.text}</div>
    {#if info.formula}  <!--新增: 공식 표시-->
      <div class="formula">{info.formula}</div>
    {/if}
  {:else}
    {t('select.tool')}
  {/if}
</div>
```

**CSS에 formula 스타일 추가** (필요시):
```css
.toolInfo .formula {
  font-size: 0.85em;
  color: var(--accent);
  margin-top: 4px;
  padding: 4px 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}
```

### 4.3 툴팁 스타일 최적화 (선택)
**파일**: `src/lib/game/style.css` 또는 `DesignerPanel.svelte`

```css
.toolBtn:hover::after {
  content: attr(title);
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: var(--bg-primary);
  color: var(--text-primary);
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  z-index: 100;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}
```

---

## 완료 체크리스트

- [ ] 4.1 MainMenu에 도움말 버튼 추가
- [ ] 4.2 HelpModal import 및 바인딩
- [ ] 4.3 DesignerPanel의 toolInfo에 공식(formula) 표시
- [ ] 4.4 CSS 스타일 최적화
- [ ] 4.5 bun run check 통과 확인

---

## 예상 산출물

| 파일 | 변경 내용 |
|-----|----------|
| `components/MainMenu.svelte` | 도움말 버튼 추가 |
| `components/DesignerPanel.svelte` | toolInfo에 공식 표시 |
| `game/style.css` | 툴팁 스타일 (선택) |
