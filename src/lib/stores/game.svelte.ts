// ============================================================
// GameReactiveState — DOM 갱신 중앙화 브릿지
//
// Phase 4에서 Svelte 컴포넌트의 $effect/$state 템플릿으로 완전 대첵되어
// no-op 상태입니다. game.ts / GameLoop.ts의 호출은 유지하되 아무 동작도 하지 않습니다.
// ============================================================
import type { GameManager } from './game';

class GameReactiveState {
  syncFull(_gm: GameManager) { /* no-op — Svelte components handle rendering */ }
  syncPartial(_gm: GameManager) { /* no-op — Svelte components handle rendering */ }
}

export const gameRx = new GameReactiveState();
