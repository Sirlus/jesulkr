// ============================================================
// GameLoop — requestAnimationFrame 기반 게임 루프
// ============================================================
import type { GameManager } from './game';
import { updateBattleTick, type BattleContext } from '$lib/game/battle/BattleEngine';
import { TICK_SEC } from '$lib/game/constants';
import { t } from '$lib/game/i18n';
import { showToast } from '$lib/game/ui/Toast';

/** requestAnimationFrame 기반 게임 루프를 시작합니다 */
export function startLoop(gm: GameManager) {
  if (gm.animId) cancelAnimationFrame(gm.animId);
  gm.lastTime = 0;
  gm.accumulator = 0;
  const loop = (timestamp: number) => {
    if (!gm.lastTime) gm.lastTime = timestamp;
    const dt = Math.min(0.1, (timestamp - gm.lastTime) / 1000);
    gm.lastTime = timestamp;
    if (gm.state === 'battle') gm.accumulator += dt * (gm.battle.battleSpeed || 1);
    else gm.accumulator = 0;
    while (gm.accumulator >= TICK_SEC) {
      const ctx: BattleContext = {
        slots: gm.slots,
        slotAutoModes: gm.slotsAuto,
        autoManaReserve: gm.autoManaReserve,
        unlocks: gm.unlocks,
        records: gm.records,
        runMode: gm.selectedRunMode,
        canvasWidth: gm.canvas?.width || 720,
        canvasHeight: gm.canvas?.height || 520,
        map: gm.currentMap,
      };
      const result = updateBattleTick(
        gm.battle,
        gm.effectiveManaRegen,
        ctx,
      );
      gm.battle.score = result.score;
      gm.battle.mana = result.mana;
      gm.battle.baseHp = result.baseHp;
      gm.battle.survival = result.survival;
      gm.battle.monsters = result.monsters;
      gm.battle.casts = result.casts;
      gm.battle.effects = result.effects;
      gm.battle.cooldowns = result.cooldowns;
      gm.battle.selectedTargetId = result.selectedTargetId;
      gm.battle.spawnTimer = result.spawnTimer;
      gm.battle.nextMonsterId = result.nextMonsterId;
      gm.battle.nextCastId = result.nextCastId;
      gm.battle.nextBossAt = result.nextBossAt;
      gm.battle.bossInterval = result.bossInterval;
      if (result.bossSpawned) {
        showToast(t('boss.appeared'), 'bad');
      }
      if (result.isGameOver) {
        gm.battle.baseHp = 0;
        gm.recordRun();
        gm.state = 'gameover';
        showToast(t('game.over'), 'bad');
      }
      gm.accumulator -= TICK_SEC;
    }

    if (gm.renderer && gm.canvas) {
      gm.renderer.render(
        gm.battle.monsters, gm.battle.casts, gm.battle.effects,
        gm.state, gm.battle.selectedTargetId,
        gm.stateLabel(),
        t('pause'),
      );
    }
    gm.animId = requestAnimationFrame(loop);
  };
  gm.animId = requestAnimationFrame(loop);
}
