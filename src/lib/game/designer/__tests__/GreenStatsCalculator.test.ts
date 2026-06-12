import { describe, it, expect } from 'vitest';
import { calculateSpellStats } from '../StatsCalculator';
import type { Component, ExtractorColor } from '../../types';

function c(
  id: number,
  type: string,
  x: number,
  y: number,
  w = 1,
  h = 1,
  rotation = 0,
  color?: ExtractorColor,
): Component {
  return { id, type: type as any, x, y, w, h, rotation, color };
}

describe('v2 StatsCalculator', () => {
  it('red3 provides 3 red power and costs 2 mana', () => {
    const stats = calculateSpellStats({
      width: 3, height: 1,
      components: [c(1, 'red3', 0, 0, 2, 1), c(2, 'circle', 2, 0)],
    });
    expect(stats.damage).toBe(3);
    expect(stats.manaCost).toBe(2);
    expect(stats.redManaCost).toBe(2);
    expect(stats.redCount).toBe(1);
    expect(stats.valid).toBe(true);
  });

  it('greenMana activates when touching mixed2 and provides green mana', () => {
    const stats = calculateSpellStats({
      width: 4, height: 3,
      components: [
        c(1, 'greenMana', 0, 0, 2, 2),
        c(2, 'mixed2', 0, 2, 2, 1),
      ],
    });
    expect(stats.greenCount).toBe(1);
    expect(stats.greenManaCost).toBe(2);
  });

  it('greenMana is inactive without mixed2 contact', () => {
    const stats = calculateSpellStats({
      width: 4, height: 3,
      components: [
        c(1, 'greenMana', 0, 0, 2, 2),
        c(2, 'mixed2', 3, 2, 2, 1),
      ],
    });
    expect(stats.greenCount).toBe(0);
    expect(stats.greenManaCost).toBe(0);
  });

  it('green3x2 deals 50 damage with green + blue and no red', () => {
    const stats = calculateSpellStats({
      width: 7, height: 3,
      components: [
        // greenMana(0,0,2,2) touches mixed2(0,2,2,1) → green active ✓
        c(1, 'greenMana', 0, 0, 2, 2),
        c(2, 'mixed2', 0, 2, 2, 1),
        // green3x2(2,1,3,2) adjacent to greenMana cell (1,1) ✓
        // green3x2(2,1,3,2) adjacent to blueGen cell (5,1) ✓
        c(3, 'green3x2', 2, 1, 3, 2),
        // blueGen(5,1) adjacent to green3x2 cell (4,1) ✓
        // blueGen activated by red(5,0) adjacent ✓
        c(4, 'blueGen', 5, 1),
        // red(5,0) adjacent to blueGen(5,1) → activates blueGen ✓
        // red(5,0) is NOT adjacent to green3x2 (cells span x=2..4,y=1..2;
        // closest cell(4,1) neighbors are (5,1)[blueGen],(3,1),(4,2),(4,0))
        c(5, 'red', 5, 0),
      ],
    });
    expect(stats.damage).toBe(50);
    expect(stats.valid).toBe(true);
  });

  it('green3x2 deals 0 damage when red is connected', () => {
    const stats = calculateSpellStats({
      width: 5, height: 3,
      components: [
        c(1, 'greenMana', 0, 0, 2, 2),
        c(2, 'mixed2', 0, 2, 2, 1),
        c(3, 'green3x2', 2, 1, 3, 2),
        c(4, 'blueGen', 3, 0),
        c(5, 'red', 2, 0),
      ],
    });
    expect(stats.damage).toBe(0);
    expect(stats.valid).toBe(false);
  });

  it('greenPair2 damage is min(green, blue) × 40', () => {
    const stats = calculateSpellStats({
      width: 6, height: 3,
      components: [
        c(1, 'greenMana', 0, 0, 2, 2),
        c(2, 'mixed2', 0, 2, 2, 1),
        c(3, 'greenPair2', 2, 0, 2, 2),
        c(4, 'blueGen', 2, 2),
        c(5, 'red', 3, 2),
      ],
    });
    expect(stats.damage).toBe(40);
    expect(stats.valid).toBe(true);
  });

  it('extractor adds its color to the target circuit', () => {
    const stats = calculateSpellStats({
      width: 5, height: 2,
      components: [
        c(1, 'red', 0, 0),
        c(2, 'wire', 1, 0),
        c(3, 'extractor', 2, 0, 1, 1, 0, 'red'),
        c(4, 'circle', 3, 0),
      ],
    });
    expect(stats.damage).toBe(1);
    expect(stats.valid).toBe(true);
  });

  it('ultimateCore requires stability', () => {
    const stats = calculateSpellStats({
      width: 8, height: 5,
      components: [
        c(1, 'ultimateCore', 0, 0, 4, 4),
        c(2, 'red3', 4, 0, 2, 1),
        c(3, 'red3', 4, 1, 2, 1),
        c(4, 'blueGen', 4, 2),
        c(5, 'blueGen', 4, 3),
        c(6, 'red', 5, 2),
        c(7, 'red', 5, 3),
        c(8, 'greenMana', 5, 0, 2, 2),
        c(9, 'mixed2', 7, 0, 2, 1),
      ],
    });
    expect(stats.maxStability).toBe(0);
    expect(stats.globalDamage).toBe(0);
    expect(stats.damage).toBe(0);
  });

it('ultimateCore activates with sufficient stability', () => {
    const stats = calculateSpellStats({
      width: 12, height: 10,
      components: [
        // ultimateCore(0,0,4,4) spans x=0..3, y=0..3

        c(1, 'ultimateCore', 0, 0, 4, 4),

        // Red power: 2× red3 adjacent to core (cells (3,0)-(3,1) of core) → 6 red ≥ 6
        c(2, 'red3', 4, 0, 2, 1),
        c(3, 'red3', 4, 1, 2, 1),

        // 3 stabilizers in column at x=4, y=2..4 within Chebyshev 1 of core
        c(4, 'stabilizer', 4, 2),
        c(5, 'stabilizer', 4, 3),
        c(6, 'stabilizer', 4, 4),

        // BlueGens adjacent to each stabilizer
        c(7, 'blueGen', 5, 2),
        c(8, 'blueGen', 5, 3),
        c(9, 'blueGen', 5, 4),

        // Reds adjacent to each blueGen (activates blueGen)
        c(10, 'red', 6, 2),
        c(11, 'red', 6, 3),
        c(12, 'red', 6, 4),

        // Green mana: place greenMana adjacent to core border, each touching mixed2
        // Pair 1: greenMana at (0,4) touches core cells (0,3)(1,3)
        c(13, 'greenMana', 0, 4, 2, 2),
        c(14, 'mixed2', 0, 6, 2, 1),
        // Pair 2: another green pair at different location
        c(15, 'greenMana', 4, 4, 2, 2),
        c(16, 'mixed2', 4, 6, 2, 1),
        // Pair 3: one more green pair
        c(17, 'greenMana', 8, 4, 2, 2),
        c(18, 'mixed2', 8, 6, 2, 1),
      ],
    });
    expect(stats.maxStability).toBeGreaterThanOrEqual(3);
    expect(stats.damage).toBe(1400);
    expect(stats.globalDamage).toBe(100);
  });

  it('mediumHub enables network only when active', () => {
    const statsWithoutStability = calculateSpellStats({
      width: 5, height: 2,
      components: [
        c(1, 'red', 0, 0),
        c(2, 'mediumWire', 1, 0),
        c(3, 'mediumHub', 2, 0),
        c(4, 'mediumWire', 3, 0),
        c(5, 'circle', 4, 0),
      ],
    });
    // hub inactive without stability → circle gets no red
    expect(statsWithoutStability.damage).toBe(0);

    const statsWithStability = calculateSpellStats({
      width: 6, height: 4,
      components: [
        c(1, 'red', 0, 0),
        c(2, 'mediumWire', 1, 0),
        c(3, 'mediumHub', 2, 0),
        c(4, 'mediumWire', 3, 0),
        c(5, 'circle', 4, 0),
        // Stabilizer at (3,1) within Chebyshev 1 of hub(2,0): dx=1,dy=1 → 1 ✓
        c(6, 'stabilizer', 3, 1),
        // blueGen at (2,1) adjacent to stabilizer(3,1) ✓ (blue graph direct neighbor)
        c(7, 'blueGen', 2, 1),
        // red(2,2) adjacent to blueGen(2,1) ✓ — activates blueGen
        // red(2,2) is NOT adjacent to mediumWire(1,0) or (3,0) — no extra red in wire network
        c(8, 'red', 2, 2),
      ],
    });
    // stabilizer active, hub active, circle gets exactly 1 red from red(0,0) only
    expect(statsWithStability.damage).toBe(1);
  });
});