/**
 * @vitest-environment happy-dom
 *
 * BattleEngine unit tests — Phase 6: Quality
 */

import { describe, it, expect } from 'vitest';
import { updateBattleTick, type BattleTickState, type BattleContext } from '../BattleEngine';
import type { Monster } from '../../types';

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
    map: { id: 1, shortName: 'M1', name: 'M1', desc: '', minHp: 1, maxHp: 20 },
    ...overrides,
  };
}

function makeState(overrides: Partial<BattleTickState> = {}): BattleTickState {
  return {
    score: 0, mana: 20, baseHp: 20, survival: 0,
    monsters: [], casts: [], effects: [],
    cooldowns: [0, 0, 0, 0, 0], selectedTargetId: null,
    spawnTimer: 10, nextMonsterId: 1, nextCastId: 1,
    nextBossAt: Infinity, bossInterval: 30,
    ...overrides,
  };
}

describe('updateBattleTick', () => {
  it('increases survival and regenerates mana', () => {
    const state = makeState({ mana: 10 });
    const result = updateBattleTick(state, 6, makeCtx());
    expect(result.survival).toBeCloseTo(0.05, 5);
    // 10 + 6 * 0.05 = 10.3
    expect(result.mana).toBeCloseTo(10.3, 5);
  });

  it('caps mana at MAX_MANA', () => {
    const state = makeState({ mana: 20 });
    const result = updateBattleTick(state, 100, makeCtx());
    expect(result.mana).toBe(20);
  });

  it('decreases cooldowns by 1', () => {
    const state = makeState({ cooldowns: [5, 3, 0, 0, 7] });
    const result = updateBattleTick(state, 6, makeCtx());
    expect(result.cooldowns).toEqual([4, 2, 0, 0, 6]);
  });

  it('spawns monster when spawnTimer reaches 0', () => {
    const state = makeState({ spawnTimer: 0 });
    const result = updateBattleTick(state, 6, makeCtx());
    expect(result.monsters.length).toBe(1);
    expect(result.monsters[0].hp).toBeGreaterThanOrEqual(1);
    expect(result.monsters[0].hp).toBeLessThanOrEqual(20);
    expect(result.spawnTimer).toBeGreaterThan(0);
    expect(result.nextMonsterId).toBe(2);
  });

  it('game over when baseHp is 0', () => {
    const state = makeState({ baseHp: 0 });
    const result = updateBattleTick(state, 6, makeCtx());
    expect(result.isGameOver).toBe(true);
  });
});
