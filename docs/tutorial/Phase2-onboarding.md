# Phase 2: 온보딩 힌트 (Onboarding)

> 예상 시간: 1시간
> 선행 조건: Phase 1 완료

## 작업 목록

### 2.1 +page.svelte에 튜토리얼 상태 확인 로직 추가
**파일**: `src/routes/+page.svelte`

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { game } from '$lib/stores/game';
  import { gameState } from '$lib/stores/gameState.svelte';
  import { loadTutorialSeen } from '$lib/game/core/StorageMisc';  // Phase 1에서 추가
  import { showHint } from '$lib/game/ui/TutorialHints';       // Phase 1에서 추가

  let tutorialSeen = $state(false);

  onMount(() => {
    game.initClient();
    updateMobileLayout();
    
    // 튜토리얼 Seen 상태 로드
    tutorialSeen = loadTutorialSeen();
    
    const hasSavedSpell = game.hasSavedSpell;
    game.state = hasSavedSpell ? 'ready' : 'design';
    
    // 첫 방문 시 첫 힌트 표시
    if (!tutorialSeen) {
      showHint('open-designer');
    }
  });
</script>
```

### 2.2 시점별 힌트 표시 로직 구현

**파일**: `src/lib/game/controllers/DesignerController.ts`

```typescript
import { showHint, completeTutorial } from '../ui/TutorialHints';

// 설계 저장 시 힌트 표시
export function saveSpell(manager: GameManager, name: string, slotIndex: number) {
  // ... 기존 로직 ...
  
  // 저장 성공 시 힌트
  if (!loadTutorialSeen()) {
    showHint('start-battle');
  }
}
```

**파일**: `src/lib/game/controllers/BattleController.ts`

```typescript
import { showHint, completeTutorial } from '../ui/TutorialHints';

// 전투 시작 시 힌트 표시
export function startBattle(manager: GameManager) {
  // ... 기존 로직 ...
  
  // 전투 시작 시 힌트
  if (!loadTutorialSeen()) {
    showHint('cast-spells');
  }
}

// 첫 몬스터 처치 시 튜토리얼 완료 처리
export function onMonsterKilled(manager: GameManager) {
  if (!loadTutorialSeen()) {
    completeTutorial();
  }
}
```

### 2.3DesignerPanel에서 부품 선택 시 힌트
**파일**: `src/lib/components/DesignerPanel.svelte`

```svelte
<script lang="ts">
  import { showHint, loadTutorialSeen } from '$lib/game/ui/TutorialHints';

  function onToolClick(tool: string) {
    if (tool === 'extractor' && gameState.designer.tool === 'extractor') {
      game.cycleExtractorColor();
    } else {
      game.setTool(tool);
    }
    
    // 부품 선택 시 힌트 표시 (첫 방문且 설계 중)
    if (!loadTutorialSeen() && gameState.state === 'design') {
      showHint('place-components');
    }
  }
</script>
```

---

## 완료 체크리스트

- [ ] 2.1 +page.svelte에 튜토리얼 Seen 상태 확인
- [ ] 2.2 DesignerController에 저장 시 힌트 로직
- [ ] 2.3 BattleController에 전투 시작/종료 시 힌트 로직
- [ ] 2.4 DesignerPanel에 부품 선택 시 힌트 로직
- [ ] 2.5 수동 테스트 (힌�트 표시 확인)

---

## 예상 산출물

| 파일 | 변경 내용 |
|-----|----------|
| `routes/+page.svelte` | 튜토리얼 Seen 상태 확인 + 첫 힌트 |
| `controllers/DesignerController.ts` | 저장 시 힌트 |
| `controllers/BattleController.ts` | 전투 시작 시 힌트 |
| `components/DesignerPanel.svelte` | 부품 선택 시 힌트 |
