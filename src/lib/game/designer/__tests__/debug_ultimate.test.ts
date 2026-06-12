import { describe, it } from 'vitest';
import { calculateSpellStats } from '../StatsCalculator';
import { c } from './helpers';

describe('debug', () => {
  it('print breakdown v2', () => {
    const stats = calculateSpellStats({
      width: 10, height: 8,
      components: [
        c(1, 'ultimateCore', 0, 0, 4, 4),
        c(2, 'red3', 4, 0, 2, 1),
        c(3, 'red3', 4, 1, 2, 1),
        c(4, 'blueGen', 4, 2),
        c(5, 'red', 5, 2),
        c(6, 'blueGen', 4, 3),
        c(7, 'red', 5, 3),
        c(8, 'stabilizer', 4, 4),
        c(9, 'blueGen', 5, 4),
        c(10, 'red', 6, 4),
        c(11, 'stabilizer', 3, 4),
        c(12, 'blueGen', 4, 5),
        c(13, 'red', 5, 5),
        c(14, 'stabilizer', 2, 4),
        c(15, 'blueGen', 3, 5),
        c(16, 'red', 4, 5),
        c(17, 'greenMana', 0, 4, 2, 2),
        c(18, 'mixed2', 0, 6, 2, 1),
        c(19, 'greenMana', 4, 0, 2, 2),
        c(20, 'mixed2', 6, 0, 2, 1),
        c(21, 'greenMana', 4, 6, 2, 2),
        c(22, 'mixed2', 4, 8, 2, 1),
      ],
    });

    console.log('activeBlueCount:', stats.activeBlueCount);
    console.log('activeStabilizerCount:', stats.activeStabilizerCount);
    console.log('maxStability:', stats.maxStability);
    console.log('greenCount:', stats.greenCount);
    console.log('damage:', stats.damage);
    console.log('\nBreakdown:');
    stats.breakdown.forEach(b => console.log(' -', b));
  });
});
