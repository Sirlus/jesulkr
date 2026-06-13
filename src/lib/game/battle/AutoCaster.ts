// ============================================================
// Battle — Auto-cast logic with smart targeting
// ============================================================
import type { Monster, CastProjectile, SpellData } from '../types';
import { CORE_AOE_TARGET_LIMIT } from '../constants';
import { getCurrentTarget } from './TargetingSystem';

export interface AutoCastContext {
  slots: (SpellData | null)[];
  slotAutoModes: boolean[];
  autoManaReserve: number;
  runMode: string;
}

export interface AutoCastInput {
  monsters: Monster[];
  casts: CastProjectile[];
  cooldowns: number[];
  selectedTargetId: number | null;
  mana: number;
  nextCastId: number;
}

export interface AutoCastResult {
  newCasts: CastProjectile[];
  mana: number;
  cooldowns: number[];
  nextCastId: number;
}

/**
 * 비행 중인 투사체들의 예정 피해량을 몬스터별로 시뮬레이션해
 * "이미 죽을 예정인 몬스터(doomed)"를 판별한다.
 */
function buildDoomedSet(
  inFlight: CastProjectile[],
  monsters: Monster[],
): { pendingDmg: Map<number, number>; doomed: Set<number> } {
  const pendingDmg = new Map<number, number>(monsters.map(m => [m.id, 0]));

  // globalDamage: 모든 몬스터에 적용
  const totalGlobal = inFlight.reduce((sum, c) => sum + (Number(c.spell.globalDamage) || 0), 0);
  if (totalGlobal > 0) {
    for (const [id, cur] of pendingDmg) pendingDmg.set(id, cur + totalGlobal);
  }

  for (const c of inFlight) {
    // direct damage
    const directTarget = monsters.find(m => m.id === c.targetId);
    if (directTarget) {
      pendingDmg.set(directTarget.id, (pendingDmg.get(directTarget.id) ?? 0) + (Number(c.spell.damage) || 0));
    }

    // AOE: y 내림차순 상위 CORE_AOE_TARGET_LIMIT 마리
    const aoeDmg = Number(c.spell.aoeDamage) || 0;
    if (aoeDmg > 0) {
      const aoeTargets = [...monsters].sort((a, b) => b.y - a.y).slice(0, CORE_AOE_TARGET_LIMIT);
      for (const t of aoeTargets) {
        pendingDmg.set(t.id, (pendingDmg.get(t.id) ?? 0) + aoeDmg);
      }
    }
  }

  const doomed = new Set<number>(
    monsters.filter(m => (pendingDmg.get(m.id) ?? 0) >= m.hp).map(m => m.id),
  );

  return { pendingDmg, doomed };
}

/**
 * 확정 피해량을 pendingDmg / doomed에 반영한다.
 * 새로 발사되는 투사체의 피해를 추가해 다음 슬롯이 올바른 판단을 내릴 수 있게 한다.
 */
function applySpellToPending(
  spell: SpellData,
  targetId: number,
  monsters: Monster[],
  pendingDmg: Map<number, number>,
  doomed: Set<number>,
): void {
  // direct
  const newDirect = (pendingDmg.get(targetId) ?? 0) + (Number(spell.damage) || 0);
  pendingDmg.set(targetId, newDirect);
  const targetMon = monsters.find(m => m.id === targetId);
  if (targetMon && newDirect >= targetMon.hp) doomed.add(targetId);

  // AOE
  const aoeDmg = Number(spell.aoeDamage) || 0;
  if (aoeDmg > 0) {
    const aoeTargets = [...monsters].sort((a, b) => b.y - a.y).slice(0, CORE_AOE_TARGET_LIMIT);
    for (const t of aoeTargets) {
      const updated = (pendingDmg.get(t.id) ?? 0) + aoeDmg;
      pendingDmg.set(t.id, updated);
      if (updated >= t.hp) doomed.add(t.id);
    }
  }

  // global
  const globalDmg = Number(spell.globalDamage) || 0;
  if (globalDmg > 0) {
    for (const mon of monsters) {
      const updated = (pendingDmg.get(mon.id) ?? 0) + globalDmg;
      pendingDmg.set(mon.id, updated);
      if (updated >= mon.hp) doomed.add(mon.id);
    }
  }
}

/**
 * doomed가 아닌 몬스터 중 가장 위협적인 타겟을 선택한다.
 * - 선택 타겟이 살아있고 doomed가 아니면 우선 사용
 * - 아니면 doomed 제외 후 y 최대값
 * - 전부 doomed면 어쩔 수 없이 최우선 타겟 (낭비 최소화)
 */
function pickTarget(
  monsters: Monster[],
  selectedTargetId: number | null,
  doomed: Set<number>,
): Monster | null {
  const preferred = getCurrentTarget(monsters, selectedTargetId);
  const alive = monsters.filter(x => x.hp > 0);
  const notDoomed = alive.filter(x => !doomed.has(x.id));

  if (preferred && !doomed.has(preferred.id)) return preferred;
  return notDoomed.sort((a, b) => b.y - a.y)[0] ?? alive.sort((a, b) => b.y - a.y)[0] ?? null;
}

/**
 * 한 틱의 자동 캐스트를 처리한다.
 *
 * - 슬롯별 비행 중 투사체가 있으면 추가 발사 차단
 * - 비행 중인 투사체의 예정 피해량을 시뮬레이션해 doomed 몬스터 판별
 * - 새 투사체는 doomed가 아닌 몬스터를 우선 타겟
 * - 발사할 때마다 pendingDmg / doomed를 실시간 업데이트해 슬롯 간 중복 방지
 */
export function runAutoCast(input: AutoCastInput, ctx: AutoCastContext): AutoCastResult {
  const { monsters, casts, selectedTargetId } = input;
  let { mana, nextCastId } = input;
  const cooldowns = [...input.cooldowns];
  const newCasts = [...casts];

  const inFlight = newCasts.filter(c => c.remainingTicks > 0);
  const slotsInFlight = new Set<number>(inFlight.map(c => c.slotIndex));
  const { pendingDmg, doomed } = buildDoomedSet(inFlight, monsters);

  for (let i = 0; i < 5; i++) {
    if (!ctx.slotAutoModes[i]) continue;
    if (cooldowns[i] > 0) continue;
    if (slotsInFlight.has(i)) continue;
    const sp = ctx.slots[i];
    if (!sp) continue;
    if (mana < sp.manaCost) continue;
    if ((mana - sp.manaCost) < ctx.autoManaReserve) continue;

    const target = pickTarget(monsters, selectedTargetId, doomed);
    if (!target) continue;

    // 확정 피해 반영 (다음 슬롯이 올바른 판단을 내리도록)
    applySpellToPending(sp, target.id, monsters, pendingDmg, doomed);
    slotsInFlight.add(i);

    mana -= sp.manaCost;
    cooldowns[i] = sp.castTime;
    newCasts.push({
      id: nextCastId++,
      spell: JSON.parse(JSON.stringify(sp)),
      targetId: target.id,
      slotIndex: i,
      remainingTicks: 4,
      totalTicks: 4,
    });
  }

  return { newCasts, mana, cooldowns, nextCastId };
}
