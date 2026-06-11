// ============================================================
// gameState — Svelte 5 reactive state (replaces imperative DOM bridge)
// ============================================================
import { Store } from '$lib/game/core/Store.svelte';

/** Global reactive game state. All reads in Svelte components should use this. */
export const gameState = new Store();
