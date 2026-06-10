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
