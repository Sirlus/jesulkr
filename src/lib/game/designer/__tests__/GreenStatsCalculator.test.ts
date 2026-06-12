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
        c(1, 'greenMana', 0, 0, 2, 2),
        c(2, 'mixed2', 0, 2, 2, 1),
        c(3, 'green3x2', 2, 1, 3, 2),
        c(4, 'blueGen', 3, 0),
        // red is placed far from green3x2 to avoid instability
        c(5, 'red', 6, 0),
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
    // red(0,0) → wire(1,0) → extractor input(1,0). extractor outputs to (3,0) circle.
    // circle gets +1 from extractor.
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
    // Has red, blue, green but no stabilizer → no stability
    expect(stats.maxStability).toBe(0);
    expect(stats.globalDamage).toBe(0);
    expect(stats.damage).toBe(0);
  });

  it('ultimateCore activates with sufficient stability', () => {
    const stats = calculateSpellStats({
      width: 10, height: 6,
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
        c(10, 'greenMana', 5, 4, 2, 2),
        c(11, 'mixed2', 7, 4, 2, 1),
        // stabilizer near ultimateCore, activated by blueGen(4,2) via wire
        c(12, 'wire', 5, 4),
        c(13, 'stabilizer', 6, 4),
        c(14, 'wire', 6, 3),
        c(15, 'wire', 6, 2),
        c(16, 'wire', 5, 2),
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
      width: 6, height: 3,
      components: [
        c(1, 'red', 0, 0),
        c(2, 'mediumWire', 1, 0),
        c(3, 'mediumHub', 2, 0),
        c(4, 'mediumWire', 3, 0),
        c(5, 'circle', 4, 0),
        // activate stabilizer via blueGen
        c(6, 'blueGen', 2, 1),
        c(7, 'red', 1, 1),
        c(8, 'stabilizer', 3, 1),
      ],
    });
    // stabilizer active, hub active, circle gets red
    expect(statsWithStability.damage).toBe(1);
  });
});
