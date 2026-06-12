// ============================================================
// Battle — Game engine (tick update, spawn)
// ============================================================
import type { Monster, CastProjectile, VisualEffect, MapDef, SpellData, Records } from '../types';
import { TICK_SEC, LANES, MAX_MANA } from '../constants';
import { getAutoTarget } from './TargetingSystem';
import { resolveCast } from './DamageResolver';

/** 전투 엔진이 외부 상태(슬롯, 해금, 기록 등)를 참조하기 위한 컨텍스트 */
export interface BattleContext {
  slots: (SpellData | null)[];
  slotAutoModes: boolean[];
  autoManaReserve: number;
  unlocks: Record<string, boolean>;
  records: Records;
  runMode: string;
  canvasWidth: number;
  canvasHeight: number;
  map: MapDef;
}

/** updateBattleTick에 전달되는 현재 전투 상태 */
export interface BattleTickState {
  score: number; mana: number; baseHp: number; survival: number;
  monsters: Monster[]; casts: CastProjectile[]; effects: VisualEffect[];
  cooldowns: number[]; selectedTargetId: number | null;
  spawnTimer: number; nextMonsterId: number; nextCastId: number;
  nextBossAt: number; bossInterval: number;
}

/** updateBattleTick이 반환하는 다음 프레임 상태 */
export interface TickResult {
  score: number; mana: number; baseHp: number; survival: number;
  monsters: Monster[]; casts: CastProjectile[]; effects: VisualEffect[];
  cooldowns: number[]; selectedTargetId: number | null;
  spawnTimer: number; nextMonsterId: number; nextCastId: number;
  nextBossAt: number; bossInterval: number;
  isGameOver: boolean; killedAny: boolean; bossSpawned: boolean;
}

/** 하나의 몬스터를 생성합니다. 보스인 경우 생존 시간에 따른 속도 증가가 적용되지 않습니다. */
function spawnOneMonster(
  forcedHp: number | null, boss: boolean,
  canvasWidth: number, nextId: number, minHp: number, maxHp: number,
  survival: number,
): Monster {
  const lane = Math.floor(Math.random() * LANES);
  const laneW = canvasWidth / LANES;
  const hp = forcedHp ?? (minHp + Math.floor(Math.random() * (maxHp - minHp + 1)));
  const speed = boss ? 25 : (42 + survival * 0.45 + Math.random() * 18);
  return {
    id: nextId, lane,
    x: laneW * lane + laneW / 2,
    y: boss ? -42 : -26,
    hp, maxHp: hp, speed, boss: !!boss,
  };
}

/**
 * Update one fixed tick of the battle.
 */
export function updateBattleTick(
  state: BattleTickState,
  regen: number,
  ctx: BattleContext,
): TickResult {
  let m = [...state.monsters];
  let e = [...state.effects];
  const cds = [...state.cooldowns];
  let sid = state.selectedTargetId;
  let mId = state.nextMonsterId;
  let cId = state.nextCastId;
  let nextBossAtAcc = state.nextBossAt;
  let bossIntervalAcc = state.bossInterval;
  let spawnTimerAcc = state.spawnTimer;
  let nextScore = state.score;
  let nextMana = state.mana;
  let nextBaseHp = state.baseHp;
  let nextSurvival = state.survival;
  let killedAny = false;
  let bossSpawned = false;
  const casts2 = [...state.casts];

  // 1. Mana regen
  nextMana = Math.min(MAX_MANA, nextMana + regen * TICK_SEC);
  nextSurvival += TICK_SEC;

  // 2. Cooldowns
  for (let i = 0; i < 5; i++) if (cds[i] > 0) cds[i]--;

  // 3. Auto-cast
  if (ctx.runMode !== 'pure') {
    for (let i = 0; i < 5; i++) {
      if (!ctx.slotAutoModes[i]) continue;
      if (cds[i] > 0) continue;
      const sp = ctx.slots[i];
      if (!sp) continue;
      if (nextMana < sp.manaCost) continue;
      if ((nextMana - sp.manaCost) < ctx.autoManaReserve) continue;
      const target = getAutoTarget(m);
      if (!target) continue;
      nextMana -= sp.manaCost;
      cds[i] = sp.castTime;
      casts2.push({
        id: cId++, spell: JSON.parse(JSON.stringify(sp)),
        targetId: target.id, slotIndex: i,
        remainingTicks: 4, totalTicks: 4,
      });
    }
  }

  // 4. Boss spawn
  if (ctx.map.repeatingBoss && nextSurvival >= nextBossAtAcc) {
    m.push(spawnOneMonster(ctx.map.bossHp || 500, true, ctx.canvasWidth, mId++, ctx.map.minHp, ctx.map.maxHp, nextSurvival));
    bossSpawned = true;
    bossIntervalAcc *= (ctx.map.bossIntervalDecay || 0.84);
    nextBossAtAcc += bossIntervalAcc;
  }

  // 5. Monster spawn
  spawnTimerAcc--;
  if (spawnTimerAcc <= 0) {
    m.push(spawnOneMonster(null, false, ctx.canvasWidth, mId++, ctx.map.minHp, ctx.map.maxHp, nextSurvival));
    const interval = 1.35 - nextSurvival * 0.008;
    spawnTimerAcc = Math.max(1, Math.floor(interval / TICK_SEC * (0.75 + Math.random() * 0.5)));
  }

  // 6. Move monsters
  const baseY = ctx.canvasHeight - 34;
  for (const mon of m) {
    mon.y += mon.speed * TICK_SEC;
    if (mon.y > baseY) {
      mon.reached = true;
      if (mon.boss || mon.maxHp >= 500) nextBaseHp = 0; else nextBaseHp -= 1;
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
      // Use resolveCast from DamageResolver to avoid duplicate logic
      const result = resolveCast(c, m, ctx.canvasWidth, ctx.canvasHeight);
      m = result.monsters;
      e = e.concat(result.effects).concat(result.aoeEffects);
      if (result.killedAny) {
        killedAny = true;
        nextScore += result.scoreDelta;
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
    score: nextScore, mana: nextMana, baseHp: nextBaseHp, survival: nextSurvival,
    monsters: m, casts: newCasts, effects: e,
    cooldowns: cds, selectedTargetId: sid,
    spawnTimer: spawnTimerAcc, nextMonsterId: mId, nextCastId: cId,
    nextBossAt: nextBossAtAcc, bossInterval: bossIntervalAcc,
    isGameOver: nextBaseHp <= 0, killedAny, bossSpawned,
  };
}
