import { describe, it, expect } from 'vitest';
import { getAutoTarget, getCurrentTarget, pickMonsterAt } from '../TargetingSystem';

function makeMonster(id: number, y: number, hp: number, boss = false) {
  return { id, lane: 0, x: 100, y, hp, maxHp: hp, speed: 50, boss };
}

describe('getAutoTarget', () => {
  it('returns the closest monster to base (highest y)', () => {
    const monsters = [
      makeMonster(1, 50, 10),
      makeMonster(2, 200, 10),
      makeMonster(3, 100, 10),
    ];
    const target = getAutoTarget(monsters);
    expect(target?.id).toBe(2);
  });

  it('returns null for empty array', () => {
    expect(getAutoTarget([])).toBeNull();
  });

  it('skips dead monsters', () => {
    const monsters = [
      makeMonster(1, 50, 0),
      makeMonster(2, 200, 10),
    ];
    const target = getAutoTarget(monsters);
    expect(target?.id).toBe(2);
  });
});

describe('getCurrentTarget', () => {
  it('uses selected target if alive', () => {
    const monsters = [makeMonster(1, 50, 10), makeMonster(2, 200, 10)];
    expect(getCurrentTarget(monsters, 1)?.id).toBe(1);
  });

  it('falls back to auto target if selected is dead', () => {
    const monsters = [makeMonster(1, 50, 0), makeMonster(2, 200, 10)];
    expect(getCurrentTarget(monsters, 1)?.id).toBe(2);
  });

  it('falls back to auto target if no selection', () => {
    const monsters = [makeMonster(1, 50, 10), makeMonster(2, 200, 10)];
    expect(getCurrentTarget(monsters, null)?.id).toBe(2);
  });
});

describe('pickMonsterAt', () => {
  it('picks monster near click position', () => {
    const monsters = [makeMonster(1, 100, 10)];
    const picked = pickMonsterAt(monsters, 100, 100);
    expect(picked?.id).toBe(1);
  });

  it('returns null if click far from any monster', () => {
    const monsters = [makeMonster(1, 100, 10)];
    expect(pickMonsterAt(monsters, 0, 0)).toBeNull();
  });

  it('picks the closest monster', () => {
    const monsters = [makeMonster(1, 100, 10), makeMonster(2, 105, 10)];
    const picked = pickMonsterAt(monsters, 101, 102);
    expect(picked).not.toBeNull();
  });
});
