import * as Storage from '$lib/game/core/Storage';
import { MAPS, MAX_MANA, SPAWN_TIMER_BATTLE_START } from '$lib/game/constants';
import { getCurrentTarget, pickMonsterAt } from '$lib/game/battle/TargetingSystem';
import { t } from '$lib/game/i18n';
import type { GameState } from '$lib/game/types';
import { showToast } from '$lib/game/ui/Toast';
import { clone } from '$lib/game/utils/helpers';
import type { GameManager } from '$lib/stores/game';

export function startBattle(gm: GameManager) {
  if (!gm.hasSavedSpell) {
    showToast(t('spell.needed'), 'bad');
    return;
  }
  if (gm.battle.battleStarted && gm.state !== 'gameover') recordRun(gm);
  if (!gm.store.isMapUnlocked(gm.currentMap.id)) gm.store.currentMap = gm.store.getFirstUnlockedMap();
  const battle = gm.battle;
  battle.score = 0;
  battle.mana = MAX_MANA;
  battle.baseHp = 20;
  battle.survival = 0;
  battle.monsters = [];
  battle.casts = [];
  battle.effects = [];
  battle.cooldowns = [0, 0, 0, 0, 0];
  battle.selectedTargetId = null;
  battle.spawnTimer = SPAWN_TIMER_BATTLE_START;
  battle.nextMonsterId = 1;
  battle.nextCastId = 1;
  battle.activeRunMapId = gm.currentMap.id;
  battle.activeRunMode = gm.selectedRunMode;
  battle.bossInterval = gm.currentMap.bossInterval || 30;
  battle.nextBossAt = gm.currentMap.repeatingBoss ? (gm.currentMap.firstBossAt || 30) : Infinity;
  battle.battleStarted = true;
  gm.state = 'battle';
  showToast(`${gm.currentMap.shortName} ${t('start')}`, 'good');
}

export function restartBattle(gm: GameManager) {
  if (!gm.hasSavedSpell) {
    showToast(t('spell.needed'), 'bad');
    return;
  }
  startBattle(gm);
}

export function castSlot(gm: GameManager, index: number) {
  if (gm.state !== 'battle') {
    showToast(t('battle.only'), 'bad');
    return;
  }
  const spell = gm.slots[index];
  if (!spell) {
    showToast(t('no.spell'), 'bad');
    return;
  }
  if (gm.battle.cooldowns[index] > 0) {
    showToast(t('cooldown.active'), 'bad');
    return;
  }
  if (gm.battle.mana < spell.manaCost) {
    showToast(t('not.enough.mana'), 'bad');
    return;
  }
  const target = getCurrentTarget(gm.battle.monsters, gm.battle.selectedTargetId);
  if (!target) {
    showToast(t('no.target'), 'bad');
    return;
  }
  gm.battle.mana -= spell.manaCost;
  gm.battle.cooldowns[index] = spell.castTime;
  gm.battle.casts.push({
    id: gm.battle.nextCastId++,
    spell: clone(spell),
    targetId: target.id,
    slotIndex: index,
    remainingTicks: 4,
    totalTicks: 4,
  });
}

export function recordRun(gm: GameManager) {
  if (!gm.battle.battleStarted) return false;
  const id = String(gm.battle.activeRunMapId || '');
  if (!id || !MAPS[Number(id)]) return false;
  const mode = gm.battle.activeRunMode === 'pure' ? 'pure' : 'assist';
  const record = Storage.getMapRecord(gm.records, Number(id), mode);
  const next = {
    score: Math.max(record.score || 0, gm.battle.score || 0),
    time: Math.max(record.time || 0, gm.battle.survival || 0),
  };
  const changed = next.score !== record.score || next.time !== record.time;
  Storage.setMapRecord(gm.records, Number(id), mode, next);
  if (changed) Storage.saveRecords(gm.records);
  return changed;
}

export function checkUnlocks(gm: GameManager) {
  if (!gm.battle.activeRunMapId) return;
  const beforeMap2 = gm.store.isMapUnlocked(2);
  const beforeMap3 = gm.store.isMapUnlocked(3);
  const beforeStars = gm.totalStars;
  const beforeRegen = gm.effectiveManaRegen;
  recordRun(gm);
  const afterMap2 = gm.store.isMapUnlocked(2);
  const afterMap3 = gm.store.isMapUnlocked(3);
  const afterStars = gm.totalStars;
  const afterRegen = gm.effectiveManaRegen;
  if (!beforeMap2 && afterMap2) showToast(t('map2.unlocked'), 'good');
  else if (!beforeMap3 && afterMap3) showToast(t('map3.unlocked'), 'good');
  else if (beforeStars < afterStars) showToast(t('star.earned', afterStars), 'good');
  if (beforeRegen < afterRegen) showToast(t('mana.bonus.activated', afterRegen), 'good');
}

export function stateLabel(gm: GameManager): string {
  const labels: Record<string, string> = {
    ready: t('ready'),
    design: t('designing'),
    battle: t('fighting'),
    paused: t('pause'),
    gameover: t('game.over'),
  };
  return labels[gm.state] || gm.state;
}

export function onCanvasClick(gm: GameManager, e: MouseEvent) {
  if (!gm.canvas) return;
  const rect = gm.canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) * gm.canvas.width / rect.width;
  const y = (e.clientY - rect.top) * gm.canvas.height / rect.height;
  const picked = pickMonsterAt(gm.battle.monsters, x, y);
  if (picked) {
    gm.battle.selectedTargetId = picked.id;
    showToast(t('target.hp', picked.hp));
  }
}

export function togglePause(gm: GameManager) {
  if (gm.state === 'battle') {
    gm.state = 'paused';
    showToast(t('pause'));
  } else if (gm.state === 'paused') {
    gm.state = 'battle';
    showToast(t('ready'), 'good');
  }
}

export function toggleDesigner(gm: GameManager) {
  if (gm.state === 'design') {
    if (!gm.hasSavedSpell) {
      showToast(t('spell.needed'), 'bad');
      return;
    }
    const fallback: GameState = gm.battle.battleStarted ? 'battle' : 'ready';
    gm.state = gm.store.returnStateAfterDesign && gm.store.returnStateAfterDesign !== 'design'
      ? gm.store.returnStateAfterDesign
      : fallback;
  } else {
    gm.store.returnStateAfterDesign = gm.state;
    gm.state = 'design';
  }
}

export function setBattleSpeed(gm: GameManager, speed: number) {
  gm.battle.battleSpeed = [1, 2, 4, 8].includes(speed) ? speed : 1;
}
