import { describe, it, expect } from 'vitest';
import { calculateSpellStats } from '../StatsCalculator';
import { c } from './helpers';

describe('calculateSpellStats', () => {
  it('invalid: empty design', () => {
    const s = calculateSpellStats({ width: 2, height: 2, components: [] });
    expect(s.valid).toBe(false);
    expect(s.damage).toBe(0);
    expect(s.manaCost).toBe(0);
    expect(s.castTime).toBe(4);
  });

  it('basic: red + adjacent circle', () => {
    const s = calculateSpellStats({
      width: 2, height: 2,
      components: [c(1, 'red', 0, 0), c(2, 'circle', 1, 0)],
    });
    expect(s.valid).toBe(true);
    expect(s.damage).toBe(1);
    expect(s.manaCost).toBe(1);
    expect(s.castTime).toBe(4);
  });

  it('invalid: no red mana', () => {
    const s = calculateSpellStats({
      width: 2, height: 2,
      components: [c(1, 'circle', 0, 0)],
    });
    expect(s.valid).toBe(false);
  });

  it('invalid: no circuits', () => {
    const s = calculateSpellStats({
      width: 2, height: 2,
      components: [c(1, 'red', 0, 0)],
    });
    expect(s.valid).toBe(false);
  });

  it('oval: 2 reds both adjacent to oval', () => {
    const s = calculateSpellStats({
      width: 4, height: 1,
      components: [
        c(1, 'red', 0, 0),
        c(2, 'red', 3, 0),
        c(3, 'oval', 1, 0, 2, 1),
      ],
    });
    // oval occupies (1,0)-(2,0), red(0,0) adjacent at left, red(3,0) adjacent at right
    expect(s.valid).toBe(true);
    expect(s.damage).toBe(5); // floor(2/2) × 5
    expect(s.manaCost).toBe(2);
  });

  it('kernel: 3 reds via wires', () => {
    const s = calculateSpellStats({
      width: 5, height: 2,
      components: [
        c(1, 'red', 0, 0),
        c(2, 'red', 0, 1),
        c(3, 'red', 4, 0),
        c(4, 'wire', 3, 0),
        c(5, 'kernel', 1, 0, 2, 2),
      ],
    });
    // kernel (1,0)-(2,0),(1,1)-(2,1). red(0,0) adj, red(0,1) adj.
    // red(4,0)→wire(3,0)→adjacent to kernel(2,0) ✓
    expect(s.valid).toBe(true);
    expect(s.damage).toBe(12); // floor(3/3) × 12
    expect(s.manaCost).toBe(3);
  });

  it('mixed2: red adjacent but blueGen not connected to mixed2', () => {
    // blueGen(0,1) activates (adjacent to red(0,0)) but is NOT adjacent to mixed2(1,0..2,0)
    // → blue=0 for mixed2 → min(1,0)×8=0 → no damage, invalid (no circuit damage)
    const s = calculateSpellStats({
      width: 3, height: 2,
      components: [
        c(1, 'red', 0, 0),
        c(2, 'blueGen', 0, 1),
        c(3, 'mixed2', 1, 0, 2, 1),
      ],
    });
    expect(s.damage).toBe(0);
    expect(s.activeBlueCount).toBe(1);
    expect(s.valid).toBe(false);
  });

  it('mixed2: blueGen adjacent to both red and mixed2', () => {
    const s = calculateSpellStats({
      width: 4, height: 2,
      components: [
        c(1, 'red', 0, 0),
        c(2, 'blueGen', 0, 1),
        c(3, 'wire', 1, 0),
        c(4, 'mixed2', 1, 1, 2, 1),
      ],
    });
    // mixed2(1,1)~(2,1). wire(1,0) below is (1,1) → mixed2 ✓
    // red(0,0)→wire(1,0)→mixed2(1,1) ✓
    // blueGen(0,1): adj to red(0,0) ✓ (→ active), and right is (1,1) which IS mixed2 ✓
    // So red=1, blue=1 → min(1,1)×8=8
    expect(s.valid).toBe(true);
    expect(s.damage).toBe(8);
    expect(s.manaCost).toBe(3);
    expect(s.activeBlueCount).toBe(1);
  });
});
