# Phase 2 — toolInfo 공식 표시 + 도움말 버튼 🔲

> 예상 공수: 30분  
> 선행 조건: Phase 1 ✅

---

## 목표

1. 설계판 `toolInfo` 영역에 데미지 공식(`formula`) 노출
2. 메인 메뉴에 "도움말" 버튼 추가 (Phase 3 HelpModal 진입점)

---

## 작업 상세

### 2-A. toolInfo에 formula 표시

**파일**: `src/lib/components/DesignerPanel.svelte`

```svelte
<!-- 현재 -->
<div id="toolInfo" class="toolInfo">
  {#if gameState.designer.tool && TOOL_DESCRIPTIONS[gameState.designer.tool]}
    <b>{TOOL_DESCRIPTIONS[gameState.designer.tool].name}</b>
    <div class="small">{TOOL_DESCRIPTIONS[gameState.designer.tool].text}</div>
  {:else}
    {t('select.tool')}
  {/if}
</div>

<!-- 변경 후 -->
<div id="toolInfo" class="toolInfo">
  {#if gameState.designer.tool && TOOL_DESCRIPTIONS[gameState.designer.tool]}
    {@const info = TOOL_DESCRIPTIONS[gameState.designer.tool]}
    <b>{info.name}</b>
    <div class="small">{info.text}</div>
    {#if info.formula}
      <div class="formula">⚡ {info.formula}</div>
    {/if}
  {:else}
    {t('select.tool')}
  {/if}
</div>
```

> `style.css`에 `.toolInfo .formula { color: var(--gold); font-weight: 800 }` 규칙이 이미 있음 — CSS 추가 불필요.

**formula가 없는 부품**: `wire`, `eraser` 등은 formula가 빈 문자열이라 `{#if info.formula}` 조건으로 자연스럽게 숨김.

---

### 2-B. MainMenu에 도움말 버튼

**파일**: `src/lib/components/MainMenu.svelte`

prop 추가:
```svelte
let { onOpenKeySettings, onOpenMapSelect, onToggleDeck, onOpenHelp } = $props<{
  onOpenKeySettings?: () => void;
  onOpenMapSelect?: () => void;
  onToggleDeck?: () => void;
  onOpenHelp?: () => void;   // ← 추가
}>();
```

버튼 삽입 (맵 선택 바로 위):
```svelte
<button type="button" onclick={() => handleAction(onOpenHelp)}>❓ {t('help')}</button>
```

**파일**: `src/routes/+page.svelte`

```svelte
<!-- HelpModal bind 추가 (Phase 3에서 실제 컴포넌트 생성) -->
let helpModal: { open: () => void };

<MainMenu
  onOpenKeySettings={() => keyModal?.open()}
  onOpenMapSelect={() => mapModal?.open()}
  onToggleDeck={() => showDeck = !showDeck}
  onOpenHelp={() => helpModal?.open()}   <!-- ← 추가 -->
/>
```

---

### 2-C. i18n `help` 키 추가

**파일**: `src/lib/game/i18n/ko.ts`
```typescript
'help': '도움말',
```

**파일**: `src/lib/game/i18n/en.ts`
```typescript
'help': 'Help',
```

---

## 완료 체크리스트

- [ ] 2-A `DesignerPanel.svelte` — toolInfo formula 표시
- [ ] 2-B `MainMenu.svelte` — `onOpenHelp` prop + 버튼
- [ ] 2-B `+page.svelte` — `helpModal` 바인딩 + `onOpenHelp` 연결
- [ ] 2-C i18n `help` 키 ko/en 추가
- [ ] `npx svelte-check` 0 errors 확인

---

## 다음 단계

→ [Phase 3](./Phase3-help-modal.md)
