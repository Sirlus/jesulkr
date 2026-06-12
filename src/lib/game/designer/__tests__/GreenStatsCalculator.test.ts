/**
 * Stats calculator tests for green-mana-based and stability-based circuits:
 * greenMana, green3x2, greenPair2, ultimateCore, mediumHub.
 */
import { describe, it, expect } from 'vitest';
import { calculateSpellStats } from '../StatsCalculator';
import { c } from './helpers';

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
    // Layout (x→, y↓):
    //   [greenMana 2×2][green3x2 3×2][blueGen]
    //   [mixed2   2×1]               [red   ]
    //
    // greenMana(0,0,2,2) touches mixed2(0,2,2,1) → green active ✓
    // green3x2(2,1,3,2) adjacent to greenMana cell (1,1) ✓
    // green3x2(2,1,3,2) adjacent to blueGen cell (5,1) ✓
    // blueGen(5,1) activated by red(5,0) ✓
    // red(5,0) NOT adjacent to green3x2 (closest cell is (4,1)) ✓
    const stats = calculateSpellStats({
      width: 7, height: 3,
      components: [
        c(1, 'greenMana', 0, 0, 2, 2),
        c(2, 'mixed2', 0, 2, 2, 1),
        c(3, 'green3x2', 2, 1, 3, 2),
        c(4, 'blueGen', 5, 1),
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

  it('ultimateCore requires stability — inactive without stabilizers', () => {
    // blueGen×2 adjacent to core → blue=2, red3×2 → red=6, greenMana → green=1
    // but no stabilizers → stability=0 → core stays inactive
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
    // Grid (x→ y↓), core = (2,2,4,4) occupies x=2..5, y=2..5
    //
    //  x: 0  1  2  3  4  5  6  7
    // y0: [gM2x2][gM2x2]  [m2  ]                     ← green#1 (top)
    // y1: [gM2x2][gM2x2]  [m2  ]
    // y2: [gM2x2][ core  ][r3 ][bG]
    // y3: [gM2x2][ core  ][r3 ][bG]
    // y4: [gM2x2][ core  ][bG][rd]
    // y5: [gM2x2][ core  ][bG][rd]
    // y6: [m2  ][s ][s ]      [s ]                    ← stabs (cheb=1 from core)
    // y7:        [bG][bG]      [bG]
    // y8:        [rd][rd]      [rd]
    //
    // Red (≥6): red3(6,2) + red3(6,3) → 3+3=6 ✓
    //   both adjacent to core right border (x=5)
    //
    // Blue (≥2): blueGen(6,4) + red(7,4) ✓
    //            blueGen(6,5) + red(7,5) ✓
    //   both adjacent to core, both activated
    //
    // Stabilizer (×3, cheb ≤ 1 from core y=2..5):
    //   stab(2,6): cheb = max(0, 6-5)=1 ✓  → blueGen(2,7)+red(2,8)
    //   stab(3,6): cheb = max(0, 1)=1 ✓    → blueGen(3,7)+red(3,8)
    //   stab(5,6): cheb = max(0, 1)=1 ✓    → blueGen(5,7)+red(5,8)
    //
    // Green (≥3): three greenMana adjacent to core
    //   greenMana(2,0,2,2): x=2..3,y=0..1, adjacent to core(2,2) via (2,1)-(2,2) ✓
    //     mixed2(4,0,2,1) at x=4..5,y=0 → adjacent to greenMana#1 cell(3,0) ✓
    //   greenMana(0,2,2,2): x=0..1,y=2..3, adjacent to core(2,2) via (1,2)-(2,2) ✓
    //     mixed2(0,1,2,1) at x=0..1,y=1 → adjacent to greenMana#2 cell(0,2) ✓
    //   greenMana(0,4,2,2): x=0..1,y=4..5, adjacent to core(2,4) via (1,4)-(2,4) ✓
    //     mixed2(0,6,2,1) at x=0..1,y=6 → adjacent to greenMana#3 cell(0,5) ✓
    //
    // All conditions met → damage=1400, globalDamage=100

    const stats = calculateSpellStats({
      width: 10, height: 10,
      components: [
        // core: x=2..5, y=2..5
        c(1, 'ultimateCore', 2, 2, 4, 4),

        // Red (≥6): two red3 adjacent to core right border (x=5)
        c(2, 'red3', 6, 2, 2, 1),   // (6,2)(7,2) → adjacent to core(5,2) ✓
        c(3, 'red3', 6, 3, 2, 1),   // (6,3)(7,3) → adjacent to core(5,3) ✓

        // Blue (≥2): two blueGens adjacent to core right border, each with own red
        c(4, 'blueGen', 6, 4),       // adjacent to core(5,4) ✓
        c(5, 'red',     7, 4),       // activates blueGen(6,4)
        c(6, 'blueGen', 6, 5),       // adjacent to core(5,5) ✓
        c(7, 'red',     7, 5),       // activates blueGen(6,5)

        // Stabilizers (Chebyshev ≤ 1 from core), each with its own blueGen+red
        c(8,  'stabilizer', 2, 6),   // cheb=max(0, 6-5)=1 ✓
        c(9,  'blueGen',    2, 7),
        c(10, 'red',        2, 8),

        c(11, 'stabilizer', 3, 6),   // cheb=max(0, 1)=1 ✓
        c(12, 'blueGen',    3, 7),
        c(13, 'red',        3, 8),

        c(14, 'stabilizer', 5, 6),   // cheb=max(0, 1)=1 ✓
        c(15, 'blueGen',    5, 7),
        c(16, 'red',        5, 8),

        // Green (≥3): three greenMana adjacent to core
        c(17, 'greenMana', 2, 0, 2, 2),  // (2,0)(3,0)(2,1)(3,1) — adjacent to core(2,2) ✓
        c(18, 'mixed2',    4, 0, 2, 1),  // (4,0)(5,0) — adjacent to greenMana#1 (3,0) ✓

        c(19, 'greenMana', 0, 2, 2, 2),  // (0,2)(1,2)(0,3)(1,3) — adjacent to core(2,2) ✓
        c(20, 'mixed2',    0, 1, 2, 1),  // (0,1)(1,1) — adjacent to greenMana#2 (0,2) ✓

        c(21, 'greenMana', 0, 4, 2, 2),  // (0,4)(1,4)(0,5)(1,5) — adjacent to core(2,4) ✓
        c(22, 'mixed2',    0, 6, 2, 1),  // (0,6)(1,6) — adjacent to greenMana#3 (0,5) ✓
      ],
    });

    expect(stats.activeBlueCount).toBeGreaterThanOrEqual(2);
    expect(stats.activeStabilizerCount).toBeGreaterThanOrEqual(3);
    expect(stats.maxStability).toBeGreaterThanOrEqual(3);
    expect(stats.greenCount).toBeGreaterThanOrEqual(3);
    expect(stats.damage).toBe(1400);
    expect(stats.globalDamage).toBe(100);
  });

  it('mediumHub enables network only when active', () => {
    // Without stability — hub inactive → circle gets no red
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
    expect(statsWithoutStability.damage).toBe(0);

    // With stability — hub active → circle gets 1 red
    // stabilizer(3,1): Chebyshev from hub(2,0) = max(1,1) = 1 ✓
    // blueGen(2,1) adjacent to stabilizer ✓, activated by red(2,2) ✓
    // red(2,2) is NOT adjacent to any wire in the mediumWire network
    const statsWithStability = calculateSpellStats({
      width: 6, height: 4,
      components: [
        c(1, 'red', 0, 0),
        c(2, 'mediumWire', 1, 0),
        c(3, 'mediumHub', 2, 0),
        c(4, 'mediumWire', 3, 0),
        c(5, 'circle', 4, 0),
        c(6, 'stabilizer', 3, 1),
        c(7, 'blueGen', 2, 1),
        c(8, 'red', 2, 2),
      ],
    });
    expect(statsWithStability.damage).toBe(1);
  });
});
