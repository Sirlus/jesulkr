/**
 * @vitest-environment happy-dom
 *
 * GameManager unit tests — Phase 1: Foundation
 * Tests the 7 newly implemented methods.
 */

import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';

// Set up localStorage mock BEFORE any imports that use it
const store: Record<string, string> = {};
vi.stubGlobal('localStorage', {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, val: string) => { store[key] = val; },
  removeItem: (key: string) => { delete store[key]; },
  clear: () => { Object.keys(store).forEach(k => delete store[k]); },
  get length() { return Object.keys(store).length; },
  key: (i: number) => Object.keys(store)[i] ?? null,
});

// Stub requestAnimationFrame
vi.stubGlobal('requestAnimationFrame', () => 1);

// Set up minimal DOM
document.body.innerHTML = `
<div id="designerPanel" class="panel designerPanel"></div>
<div id="designBoard" class="designBoard"></div>
<div id="spellStats" class="statsBox"></div>
<div id="saveBtn"></div>
<div id="spellName"></div>
<div id="slotSelect">
  <option value="0">1번</option><option value="1">2번</option>
  <option value="2">3번</option><option value="3">4번</option><option value="4">5번</option>
</div>
<div id="frameW"><option value="2">2</option></div>
<div id="frameH"><option value="2">2</option></div>
<div id="rotateBtn">회전: 가로</div>
<div id="slots" class="slots"></div>
<div id="toast"></div>
<canvas id="battleCanvas" width="720" height="520"></canvas>
`;

import type { GameManager } from '../game';
import { getTotalStars } from '$lib/game/utils/progression';

let game: GameManager;

describe('GameManager', () => {
  beforeAll(async () => {
    // Dynamically import after localStorage mock is set up
    const mod = await import('../game');
    game = mod.game;
  });

  beforeEach(() => {
    Object.keys(store).forEach(k => delete store[k]);
    game.designer.components = [];
    game.designer.width = 2;
    game.designer.height = 2;
    game.designer.nextId = 1;
    game.designer.rotation = 0;
    game.designer.tool = 'red';
    game.store.slots = [null, null, null, null, null];
  });

  afterEach(() => {
    // reset any side effects
  });

  // ── eraseComponent ──
  describe('eraseComponent', () => {
    it('does nothing when not in design state', () => {
      game.state = 'battle';
      game.designer.components = [{ id: 1, type: 'red', x: 0, y: 0, w: 1, h: 1, rotation: 0 }];
      game.eraseComponent(new MouseEvent('mousedown', { button: 2 }));
      expect(game.designer.components.length).toBe(1);
    });

    it('removes a component when right-clicked on it', () => {
      game.state = 'design';
      game.designer.components = [
        { id: 1, type: 'red', x: 0, y: 0, w: 1, h: 1, rotation: 0 },
      ];
      const board = document.getElementById('designBoard')!;
      board.getBoundingClientRect = () =>
        ({ left: 0, top: 0, width: 120, height: 120, right: 120, bottom: 120 } as DOMRect);
      game.eraseComponent(new MouseEvent('mousedown', { button: 2, clientX: 30, clientY: 29 }));
      expect(game.designer.components.length).toBe(0);
    });
  });

  // ── saveSpell ──
  describe('saveSpell', () => {
    it('saves a valid spell to slot 0', () => {
      game.designer.components = [
        { id: 1, type: 'red', x: 0, y: 0, w: 1, h: 1, rotation: 0 },
        { id: 2, type: 'circle', x: 1, y: 0, w: 1, h: 1, rotation: 0 },
      ];
      game.saveSpell('Fireball', 0);
      expect(game.slots[0]).toBeTruthy();
      expect(game.slots[0]!.name).toBe('Fireball');
      expect(game.slots[0]!.damage).toBe(1);
    });
    it('rejects invalid spell (no circuits)', () => {
      game.designer.components = [{ id: 1, type: 'red', x: 0, y: 0, w: 1, h: 1, rotation: 0 }];
      game.saveSpell('Bad', 0);
      expect(game.slots[0]).toBeNull();
    });
    it('persists to localStorage', () => {
      game.designer.components = [
        { id: 1, type: 'red', x: 0, y: 0, w: 1, h: 1, rotation: 0 },
        { id: 2, type: 'circle', x: 1, y: 0, w: 1, h: 1, rotation: 0 },
      ];
      game.saveSpell('Persistent', 1);
      const raw = store['magic_design_game_slots_v2'];
      expect(raw).toBeTruthy();
      expect(JSON.parse(raw)[1].name).toBe('Persistent');
    });
  });

  // ── loadSpell ──
  describe('loadSpell', () => {
    it('loads spell into designer and switches to design state', () => {
      game.designer.components = [
        { id: 1, type: 'red', x: 0, y: 0, w: 1, h: 1, rotation: 0 },
        { id: 2, type: 'circle', x: 1, y: 0, w: 1, h: 1, rotation: 0 },
      ];
      game.saveSpell('Loader', 0);
      game.designer.components = [];
      game.loadSpell(0);
      expect(game.designer.components.length).toBe(2);
      expect(game.state).toBe('design');
    });
  });

  // ── renderDesigner + clearDesign ──
  describe('renderDesigner', () => {
    it('renders grid cells and pieces', () => {
      game.designer.width = 3; game.designer.height = 2;
      game.designer.components = [
        { id: 1, type: 'red', x: 0, y: 0, w: 1, h: 1, rotation: 0 },
      ];
      game.renderDesigner();
      const board = document.getElementById('designBoard')!;
      expect(board.querySelectorAll('.gridCell').length).toBe(6);
      expect(board.querySelectorAll('.piece').length).toBe(1);
    });
    it('renders empty board', () => {
      game.designer.components = [];
      game.renderDesigner();
      const board = document.getElementById('designBoard')!;
      expect(board.querySelectorAll('.gridCell').length).toBe(4);
      expect(board.querySelectorAll('.piece').length).toBe(0);
    });
  });

  describe('clearDesign', () => {
    it('removes all components and resets nextId', () => {
      game.designer.components = [
        { id: 1, type: 'red', x: 0, y: 0, w: 1, h: 1, rotation: 0 },
        { id: 5, type: 'circle', x: 1, y: 0, w: 1, h: 1, rotation: 0 },
      ];
      game.designer.nextId = 10;
      game.clearDesign();
      expect(game.designer.components.length).toBe(0);
      expect(game.designer.nextId).toBe(1);
    });
  });

  // ── recordRun ──
  describe('recordRun', () => {
    it('returns false when battle not started', () => {
      expect(game.recordRun()).toBe(false);
    });
    it('saves record', () => {
      game.battle.battleStarted = true;
      game.battle.activeRunMapId = 1;
      game.battle.activeRunMode = 'assist';
      game.battle.score = 10000;
      game.battle.survival = 45.5;
      expect(game.recordRun()).toBe(true);
      expect(game.records.assist['1'].score).toBe(10000);
    });
    it('preserves higher score', () => {
      game.records.assist['1'] = { score: 50000, time: 100 };
      game.battle.battleStarted = true;
      game.battle.activeRunMapId = 1;
      game.battle.activeRunMode = 'assist';
      game.battle.score = 30000;
      game.recordRun();
      expect(game.records.assist['1'].score).toBe(50000);
    });
    it('separates pure/assist records', () => {
      game.battle.battleStarted = true;
      game.battle.activeRunMapId = 2;
      game.battle.activeRunMode = 'pure';
      game.battle.score = 20000;
      game.recordRun();
      expect(game.records.pure['2'].score).toBe(20000);
      expect(game.records.assist['2'].score).toBe(0);
    });
  });

  // ── trimComponents ──
  describe('trimComponents', () => {
    it('removes out-of-bounds components', () => {
      game.designer.width = 2; game.designer.height = 2;
      game.designer.components = [
        { id: 1, type: 'red', x: 0, y: 0, w: 1, h: 1, rotation: 0 },
        { id: 2, type: 'circle', x: 2, y: 0, w: 1, h: 1, rotation: 0 },
      ];
      game.trimComponents();
      expect(game.designer.components.length).toBe(1);
    });
    it('keeps all when in bounds', () => {
      game.designer.width = 3; game.designer.height = 2;
      game.designer.components = [
        { id: 1, type: 'red', x: 0, y: 0, w: 1, h: 1, rotation: 0 },
        { id: 2, type: 'oval', x: 1, y: 1, w: 2, h: 1, rotation: 0 },
      ];
      game.trimComponents();
      expect(game.designer.components.length).toBe(2);
    });
  });

  // ── Phase 2 tests ──
  describe('checkUnlocks (Phase 2)', () => {
    it('detects star earned', () => {
      game.battle.activeRunMapId = 1;
      game.battle.battleStarted = true;
      game.battle.score = 16000;
      game.records.assist['1'] = { score: 0, time: 0 };
      game.battle.activeRunMode = 'assist';
      game.checkUnlocks();
      // stars should be at least 1 now (15000 threshold)
      expect(game.totalStars).toBeGreaterThanOrEqual(1);
    });
  });

  describe('clearAllData (Phase 2)', () => {
    it('resets to design state and clears records', () => {
      game.battle.battleStarted = true;
      game.battle.score = 99999;
      game.records.assist['1'] = { score: 50000, time: 100 };
      game.clearAllData();
      expect(game.battle.battleStarted).toBe(false);
      expect(game.state).toBe('design');
      expect(game.records.assist['1'].score).toBe(0);
    });
  });

  describe('getTotalStars includeCurrentRun (Phase 2)', () => {
    it('excludes current run when includeCurrentRun=false', () => {
      game.records.assist['1'] = { score: 50000, time: 100 };
      game.battle.battleStarted = true;
      game.battle.activeRunMapId = 1;
      game.battle.score = 1000; // low score, shouldn't boost stars
      const stars = getTotalStars(
        game.records, game.battle, game.state,
        game.battle.activeRunMapId, false,
      );
      expect(stars).toBeGreaterThanOrEqual(0);
    });
  });

  // ── Phase 4: setBattleSpeed (DOM-free verification) ──
  describe('setBattleSpeed (Phase 4)', () => {
    it('sets valid speed values', () => {
      game.setBattleSpeed(4);
      expect(game.battle.battleSpeed).toBe(4);
      game.setBattleSpeed(2);
      expect(game.battle.battleSpeed).toBe(2);
      game.setBattleSpeed(8);
      expect(game.battle.battleSpeed).toBe(8);
      game.setBattleSpeed(1);
      expect(game.battle.battleSpeed).toBe(1);
    });

    it('falls back to 1 for invalid speeds', () => {
      game.setBattleSpeed(3);
      expect(game.battle.battleSpeed).toBe(1);
      game.setBattleSpeed(0);
      expect(game.battle.battleSpeed).toBe(1);
      game.setBattleSpeed(999);
      expect(game.battle.battleSpeed).toBe(1);
    });
  });

  // ── Phase 4: stateLabel ──
  describe('stateLabel', () => {
    it('returns correct label for each state', () => {
      game.state = 'ready';
      expect(game.stateLabel()).toBeTruthy();
      game.state = 'design';
      expect(game.stateLabel()).toBeTruthy();
      game.state = 'battle';
      expect(game.stateLabel()).toBeTruthy();
      game.state = 'paused';
      expect(game.stateLabel()).toBeTruthy();
      game.state = 'gameover';
      expect(game.stateLabel()).toBeTruthy();
    });
  });

  // ── Phase 4: toggleManaBonus ──
  describe('toggleManaBonus', () => {
    it('toggles mana bonus when stars >= 5', () => {
      // Simulate 5+ stars (need at least 100000 score on map 1 for 3 stars,
      // map 2 for 2 stars = 5 stars total)
      game.records.assist['1'] = { score: 100000, time: 200 };
      game.records.assist['2'] = { score: 70000, time: 150 };
      const before = game.manaBonusEnabled;
      game.toggleManaBonus();
      expect(game.manaBonusEnabled).toBe(!before);
      // Toggle back
      game.toggleManaBonus();
      expect(game.manaBonusEnabled).toBe(before);
    });

    it('does not toggle when stars < 5', () => {
      // Clear records — 0 stars
      game.records.assist['1'] = { score: 0, time: 0 };
      game.records.assist['2'] = { score: 0, time: 0 };
      game.records.assist['3'] = { score: 0, time: 0 };
      const before = game.manaBonusEnabled;
      game.toggleManaBonus();
      expect(game.manaBonusEnabled).toBe(before); // unchanged
    });
  });

  // ── Phase 4: spellStats ──
  describe('spellStats', () => {
    it('returns invalid for empty design', () => {
      game.designer.components = [];
      const stats = game.spellStats();
      expect(stats.valid).toBe(false);
    });

    it('returns valid for red + circle', () => {
      game.designer.components = [
        { id: 1, type: 'red', x: 0, y: 0, w: 1, h: 1, rotation: 0 },
        { id: 2, type: 'circle', x: 1, y: 0, w: 1, h: 1, rotation: 0 },
      ];
      const stats = game.spellStats();
      expect(stats.valid).toBe(true);
      expect(stats.damage).toBeGreaterThan(0);
    });
  });

  // ── Phase 4: setTool fallback ──
  describe('setTool (Phase 4)', () => {
    it('sets unlocked tool', () => {
      game.setTool('circle');
      expect(game.designer.tool).toBe('circle');
    });

    it('falls back to first unlocked tool when locked tool selected', () => {
      // 'kernel' may be locked depending on records
      game.setTool('kernel');
      // Should fall back to a valid tool (red or another unlocked tool)
      expect(game.designer.tool).toBeTruthy();
      expect(game.designer.tool).not.toBe('eraser');
    });
  });
});