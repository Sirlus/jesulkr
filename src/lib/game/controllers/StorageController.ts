import * as Storage from '$lib/game/core/Storage';
import { setLanguage as applyLanguage, t } from '$lib/game/i18n';
import type { Language } from '$lib/game/types';
import { showToast } from '$lib/game/ui/Toast';
import type { GameManager } from '$lib/stores/game';

export function initClient(gm: GameManager) {
  gm.store.loadFromStorage();
  gm.store.slots = [...gm.store.slots];
  gm.store.slotAutoModes = [...gm.store.slotAutoModes];
  gm.store.decks = [...gm.store.decks];
  gm.store.deckNames = [...gm.store.deckNames];
  applyLanguage(gm.store.language);
}

export function setLanguage(gm: GameManager, lang: Language) {
  gm.store.language = lang;
  applyLanguage(lang);
  if (typeof document !== 'undefined') document.documentElement.lang = lang;
  Storage.saveLanguage(lang);
}

export function clearAllData(gm: GameManager) {
  gm.battle.battleStarted = false;
  gm.battle.activeRunMapId = null;
  gm.battle.activeRunMode = null;
  Storage.clearAllStorage();
  gm.store.loadFromStorage();
  gm.state = 'design';
  showToast(t('data.cleared'), 'good');
}

export function saveAutoManaReserve(gm: GameManager) {
  Storage.saveAutoManaReserve(gm.store.autoManaReserve);
}
