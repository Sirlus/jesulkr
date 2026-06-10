// ============================================================
// Battle — Game engine (tick update, spawn)
// ============================================================
import type { Monster, CastProjectile, VisualEffect, GameState, MapDef, SpellData } from '../types';
import { TICK_SEC, LANES, MAX_MANA } from '../constants';
import { tryCastSlot } from './CastingSystem';
import { resolveCast } from './DamageResolver';
import { getAutoTarget } from './TargetingSystem';

export interface BattleContext {
  slots: (SpellData | null)[];
  slotAutoModes: boolean[];
  autoManaReserve: number;
  unlocks: Record<string, boolean>;
  records: import('../types').Records;
  runMode: string;
  canvasWidth: number;
  canvasHeight: number;
  map: MapDef;
}

export interface TickResult {
  score: number; mana: number; baseHp: number; survival: number;
  monsters: Monster[]; casts: CastProjectile[]; effects: VisualEffect[];
  cooldowns: number[]; selectedTargetId: number | null;
  spawnTimer: number; nextMonsterId: number; nextCastId: number;
  nextBossAt: number; bossInterval: number;
  isGameOver: boolean; killedAny: boolean;
}

function spawnOneMonster(
  monsters: Monster[], forcedHp: number | null, boss: boolean,
  canvasWidth: number, nextId: number, minHp: number, maxHp: number,
): Monster[] {
  const lane = Math.floor(Math.random() * LANES);
  const laneW = canvasWidth / LANES;
  const hp = forcedHp ?? (minHp + Math.floor(Math.random() * (maxHp - minHp + 1)));
  const speed = boss ? 25 : (42 + Math.random() * 18);
  monsters.push({
    id: nextId, lane,
    x: laneW * lane + laneW / 2,
    y: boss ? -42 : -26,
    hp, maxHp: hp, speed, boss: !!boss,
  });
  return monsters;
}

/**
 * Update one fixed tick of the battle.
 */
export function updateBattleTick(
  score: number, mana: number, baseHp: number, survival: number,
  monsters: Monster[], casts: CastProjectile[], effects: VisualEffect[],
  cooldowns: number[], selectedTargetId: number | null,
  spawnTimer: number, nextMonsterId: number, nextCastId: number,
  nextBossAt: number, bossInterval: number,
  regen: number, ctx: BattleContext,
): TickResult {
  let m = [...monsters];
  let e = [...effects];
  let cds = [...cooldowns];
  let sid = selectedTargetId;
  let mId = nextMonsterId;
  let cId = nextCastId;
  let nba = nextBossAt;
  let bi = bossInterval;
  let st = spawnTimer;
  let ns = score;
  let nm = mana;
  let nhp = baseHp;
  let nsv = survival;
  let ka = false;
  let casts2 = [...casts];

  // 1. Mana regen
  nm = Math.min(MAX_MANA, nm + regen * TICK_SEC);
  nsv += TICK_SEC;

  // 2. Cooldowns
  for (let i = 0; i < 5; i++) if (cds[i] > 0) cds[i]--;

  // 3. Auto-cast
  if (ctx.runMode !== 'pure') {
    for (let i = 0; i < 5; i++) {
      if (!ctx.slotAutoModes[i]) continue;
      if (cds[i] > 0) continue;
      const sp = ctx.slots[i];
      if (!sp) continue;
      if (nm < sp.manaCost) continue;
      if ((nm - sp.manaCost) < ctx.autoManaReserve) continue;
      const target = getAutoTarget(m);
      if (!target) continue;
      nm -= sp.manaCost;
      cds[i] = sp.castTime;
      casts2.push({
        id: cId++, spell: JSON.parse(JSON.stringify(sp)),
        targetId: target.id, slotIndex: i,
        remainingTicks: 4, totalTicks: 4,
      });
    }
  }

  // 4. Boss spawn
  if (ctx.map.repeatingBoss && nsv >= nba) {
    spawnOneMonster(m, ctx.map.bossHp || 500, true, ctx.canvasWidth, mId++, ctx.map.minHp, ctx.map.maxHp);
    bi *= (ctx.map.bossIntervalDecay || 0.84);
    nba += bi;
  }

  // 5. Monster spawn
  st--;
  if (st <= 0) {
    spawnOneMonster(m, null, false, ctx.canvasWidth, mId++, ctx.map.minHp, ctx.map.maxHp);
    const interval = 1.35 - nsv * 0.008;
    st = Math.max(1, Math.floor(interval / TICK_SEC * (0.75 + Math.random() * 0.5)));
  }

  // 6. Move monsters
  const baseY = ctx.canvasHeight - 34;
  for (const mon of m) {
    mon.y += mon.speed * TICK_SEC;
    if (mon.y > baseY) {
      mon.reached = true;
      if (mon.boss || mon.maxHp >= 500) nhp = 0; else nhp -= 1;
      e.push({ type: 'base' as const, x: mon.x, y: baseY, t: 0, life: 0.5,
        text: (mon.boss || mon.maxHp >= 500) ? '보스 돌파' : '기지 피해' });
      if (sid === mon.id) sid = null;
    }
  }
  m = m.filter(x => !x.reached && x.hp > 0);

  // 7. Resolve projectiles
  const newCasts: CastProjectile[] = [];
  for (const c of casts2) {
    c.remainingTicks--;
    if (c.remainingTicks <= 0) {
      let target = m.find(x => x.id === c.targetId && x.hp > 0) ?? null;
      if (!target) target = getAutoTarget(m);
      if (target) {
        target.hp -= c.spell.damage;
        e.push({ type: 'hit' as const, x: target.x, y: target.y, t: 0, life: 0.5, text: `-${c.spell.damage}` });
        const aoe = c.spell.aoeDamage || 0;
        if (aoe > 0) {
          const aoeT = m.filter(x => x.hp > 0).sort((a, b) => b.y - a.y).slice(0, 3);
          for (const at of aoeT) { at.hp -= aoe; e.push({ type: 'hit' as const, x: at.x, y: at.y, t: 0, life: 0.42, text: `-${aoe}` }); }
          e.push({ type: 'aoe' as const, x: ctx.canvasWidth / 2, y: ctx.canvasHeight / 2, t: 0, life: 0.55, text: `분산 ${aoe}` });
        }
        for (const mon of m) {
          if (mon.hp <= 0) {
            ka = true;
            ns += mon.maxHp * 10;
            e.push({ type: 'kill' as const, x: mon.x, y: mon.y, t: 0, life: 0.7, text: `+${mon.maxHp * 10}` });
            if (sid === mon.id) sid = null;
          }
        }
      }
    } else {
      newCasts.push(c);
    }
  }
  m = m.filter(x => x.hp > 0);

  // 8. Effect lifetime
  for (const ef of e) ef.t += TICK_SEC;
  e = e.filter(ef => ef.t < ef.life);

  return {
    score: ns, mana: nm, baseHp: nhp, survival: nsv,
    monsters: m, casts: newCasts, effects: e,
    cooldowns: cds, selectedTargetId: sid,
    spawnTimer: st, nextMonsterId: mId, nextCastId: cId,
    nextBossAt: nba, bossInterval: bi,
    isGameOver: nhp <= 0, killedAny: ka,
  };
}
