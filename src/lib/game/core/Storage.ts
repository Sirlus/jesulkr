// ============================================================
// Storage — re-exports all storage modules
// ============================================================
export { loadJSON, saveJSON } from './StorageBase';
export { loadSlots, saveSlots, normalizeSpell } from './StorageSlots';
export { loadDecks, saveDecks, loadDeckNames, saveDeckNames } from './StorageDecks';
export { loadRecords, saveRecords, getMapRecord, setMapRecord, getMapStars } from './StorageRecords';
export { loadUnlocks, saveUnlocks, isMapUnlocked } from './StorageUnlocks';
export {
  defaultKeyBindings, defaultControlBindings, loadKeyBindings, saveKeyBindings,
  loadControlBindings, saveControlBindings, formatKeyLabel,
} from './StorageKeys';
export {
  loadSlotAutoModes, saveSlotAutoModes,
  loadAutoManaReserve, saveAutoManaReserve,
  loadManaBonusEnabled, saveManaBonusEnabled,
  loadLanguage, saveLanguage,
  loadSelectedRunMode, saveSelectedRunMode,
  defaultSlotAutoModes,
} from './StorageMisc';
export { loadJSONraw, saveJSONraw } from './StorageBase';
import * as C from '../constants';

/** 모든 저장 데이터를 localStorage에서 제거합니다 */
export function clearAllStorage(): void {
  const keys = [
    C.STORAGE_KEY_SLOTS, C.STORAGE_KEY_SLOTS_LEGACY,
    C.STORAGE_KEY_DECKS, C.STORAGE_KEY_DECK_NAMES,
    C.STORAGE_KEY_KEY_BINDINGS, C.STORAGE_KEY_CONTROL_BINDINGS,
    C.STORAGE_KEY_SLOT_AUTO, C.STORAGE_KEY_AUTO_MANA_RESERVE,
    C.STORAGE_KEY_MANA_BONUS, C.STORAGE_KEY_LANGUAGE,
    C.STORAGE_KEY_RUN_MODE, C.STORAGE_KEY_RECORDS,
    C.STORAGE_KEY_RECORDS_LEGACY, C.STORAGE_KEY_RECORDS_OLD,
    C.STORAGE_KEY_UNLOCKS, C.STORAGE_KEY_UNLOCKS_LEGACY,
  ];
  for (const key of keys) {
    try { localStorage.removeItem(key); } catch { /* ignore */ }
  }
}
