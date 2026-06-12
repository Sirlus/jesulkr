import { describe, it } from 'vitest';
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

describe('debug', () => {
  it('print breakdown', () => {
    const stats = calculateSpellStats({
      width: 12, height: 10,
      components: [
        c(1, 'ultimateCore', 0, 0, 4, 4),
        c(2, 'red3', 4, 0, 2, 1),
        c(3, 'red3', 4, 1, 2, 1),
        c(4, 'stabilizer', 4, 2),
        c(5, 'stabilizer', 4, 3),
        c(6, 'stabilizer', 4, 4),
        c(7, 'blueGen', 5, 2),
        c(8, 'blueGen', 5, 3),
        c(9, 'blueGen', 5, 4),
        c(10, 'red', 6, 2),
        c(11, 'red', 6, 3),
        c(12, 'red', 6, 4),
        c(13, 'greenMana', 0, 4, 2, 2),
        c(14, 'mixed2', 0, 6, 2, 1),
        c(15, 'greenMana', 2, 4, 2, 2),
        c(16, 'mixed2', 2, 6, 2, 1),
        c(17, 'greenMana', 4, 6, 2, 2),
        c(18, 'mixed2', 4, 8, 2, 1),
      ],
    });

    console.log('maxStability:', stats.maxStability);
    console.log('damage:', stats.damage);
    console.log('globalDamage:', stats.globalDamage);
    console.log('greenCount:', stats.greenCount);
    console.log('activeBlueCount:', stats.activeBlueCount);
    console.log('activeStabilizerCount:', stats.activeStabilizerCount);
    console.log('\nBreakdown:');
    stats.breakdown.forEach(b => console.log(' -', b));
  });
});
