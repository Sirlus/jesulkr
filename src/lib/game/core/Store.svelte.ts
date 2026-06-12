// ============================================================
// Central Store — state container with change notifications
// ============================================================
import type {
  GameState, Language, Monster, CastProjectile, VisualEffect,
  SpellData, KeyBinding, Records, MapDef, Component, KeyTarget,
  ExtractorColor,
} from '../types';
import { MAPS, MAX_MANA, BASE_MANA_REGEN, STAR_MANA_REGEN, MANA_BONUS_STAR_COUNT, SPAWN_TIMER_DEFAULT } from '../constants';
import * as Storage from './Storage';
import { getMapProgressScore, getMapStars } from './StorageRecords';
import { isMapUnlocked, getFirstUnlockedMap } from './StorageUnlocks';
import { getTotalStars } from '../utils/progression';
import { defaultUnlocks, defaultSlotAutoModes } from '../utils/helpers';

// ── Designer State ────────────────────────────────────────────
export interface DesignerState {
  width: number;
  height: number;
  components: Component[];
  tool: string;
  rotation: number;
  nextId: number;
  previewX: number | null;
  previewY: number | null;
  spellName: string;
  extractorColor: ExtractorColor;
}

function createDesignerState(): DesignerState {
  return {
    width: 2,
    height: 2,
    components: [],
    tool: 'red',
    rotation: 0,
    nextId: 1,
    previewX: null,
    previewY: null,
    spellName: '',
    extractorColor: 'red',
  };
}

// ── Battle State ──────────────────────────────────────────────
export interface BattleState {
  score: number;
  mana: number;
  baseHp: number;
  survival: number;
  monsters: Monster[];
  casts: CastProjectile[];
  effects: VisualEffect[];
  cooldowns: number[];
  selectedTargetId: number | null;
  spawnTimer: number;
  nextMonsterId: number;
  nextCastId: number;
  accumulator: number;
  lastTime: number;
  battleStarted: boolean;
  battleSpeed: number;
  activeRunMapId: number | null;
  activeRunMode: string | null;
  nextBossAt: number;
  bossInterval: number;
}

function createBattleState(): BattleState {
  return {
    score: 0, mana: MAX_MANA, baseHp: 20, survival: 0,
    monsters: [], casts: [], effects: [],
    cooldowns: [0, 0, 0, 0, 0],
    selectedTargetId: null,
    spawnTimer: SPAWN_TIMER_DEFAULT, nextMonsterId: 1, nextCastId: 1,
    accumulator: 0, lastTime: 0,
    battleStarted: false, battleSpeed: 1,
    activeRunMapId: null, activeRunMode: null,
    nextBossAt: Infinity, bossInterval: 30,
  };
}

// ── Full Store ────────────────────────────────────────────────
export class Store {
  state = $state<GameState>('design');
  returnStateAfterDesign = $state<GameState>('ready');

  slots = $state<(SpellData | null)[]>([null, null, null, null, null]);
  slotAutoModes = $state<boolean[]>(defaultSlotAutoModes());
  autoManaReserve = $state<number>(0);
  manaBonusEnabled = $state<boolean>(true);

  currentMap = $state<MapDef>(MAPS[1]!);
  selectedRunMode = $state<string>('assist');

  unlocks = $state<Record<string, boolean>>(defaultUnlocks());
  records = $state<Records>({ assist: {}, pure: {} });
  decks = $state<(SpellData | null)[][]>([]);
  deckNames = $state<string[]>([]);

  keyBindings = $state<KeyBinding[]>(Storage.defaultKeyBindings());
  controlBindings = $state<Record<string, KeyBinding>>(Storage.defaultControlBindings());
  keyCaptureTarget = $state<KeyTarget | null>(null);

  language = $state<Language>('ko');
  tutorialSeen = $state<boolean>(false);

  designer = $state<DesignerState>(createDesignerState());
  battle = $state<BattleState>(createBattleState());

  // ── Derived ──────────────────────────────────────────────
  get effectiveManaRegen(): number {
    const total = getTotalStars(this.records, this.battle, this.state, this.battle.activeRunMapId);
    return (total >= MANA_BONUS_STAR_COUNT && this.manaBonusEnabled) ? STAR_MANA_REGEN : BASE_MANA_REGEN;
  }

  get totalStars(): number {
    return getTotalStars(this.records, this.battle, this.state, this.battle.activeRunMapId);
  }

  // ── Initialization ───────────────────────────────────────
  loadFromStorage(): void {
    this.slots = Storage.loadSlots();
    this.slotAutoModes = Storage.loadSlotAutoModes();
    this.autoManaReserve = Storage.loadAutoManaReserve();
    this.manaBonusEnabled = Storage.loadManaBonusEnabled();
    this.language = (Storage.loadLanguage() as Language) || 'ko';
    this.tutorialSeen = Storage.loadTutorialSeen();
    this.selectedRunMode = Storage.loadSelectedRunMode();
    this.unlocks = Storage.loadUnlocks();
    this.records = Storage.loadRecords();
    this.decks = Storage.loadDecks();
    this.deckNames = Storage.loadDeckNames();
    this.keyBindings = Storage.loadKeyBindings();
    this.controlBindings = Storage.loadControlBindings();
    this.currentMap = MAPS[1]!;
  }

  // ── Slot helpers ─────────────────────────────────────────
  hasSavedSpell(): boolean {
    return this.slots.some(Boolean);
  }

  hasSavedDeck(): boolean {
    return this.decks.some(deck => Array.isArray(deck) && deck.some(Boolean));
  }

  // ── Map helpers ──────────────────────────────────────────
  isMapUnlocked(id: number): boolean {
    return isMapUnlocked(id, this.unlocks, this.records);
  }

  getFirstUnlockedMap(): MapDef {
    return getFirstUnlockedMap(this.unlocks, this.records, MAPS);
  }

  getMapStars(id: number, scoreOverride?: number): number {
    return getMapStars(this.records, id, scoreOverride);
  }

  getMapProgressScore(id: number): number {
    return getMapProgressScore(this.records, id);
  }

}
