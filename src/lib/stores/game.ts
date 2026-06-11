// ============================================================
// Jesulkr — Game manager singleton (SvelteKit compatible)
// ============================================================
import * as Storage from '$lib/game/core/Storage';
import { gameState } from './gameState.svelte';
import { setLanguage, t } from '$lib/game/i18n';
import { MAPS, MAX_MANA, STAR_THRESHOLDS, TOOL_ORDER, UNLOCK_ALL_MAPS_CODE, SPAWN_TIMER_BATTLE_START, MAX_SPELL_NAME_LENGTH, CONTROL_ACTIONS } from '$lib/game/constants';
import { BattleRenderer } from '$lib/game/battle/BattleRenderer';
import { getCurrentTarget, pickMonsterAt } from '$lib/game/battle/TargetingSystem';
import { clone } from '$lib/game/utils/helpers';
import { calculateSpellStats } from '$lib/game/designer/StatsCalculator';
import { createComponentFromGridCoord, canPlaceComponent } from '$lib/game/designer/Components';
import { isToolUnlocked } from '$lib/game/utils/progression';
import type { GameState, RunMode, KeyTarget, KeyBinding } from '$lib/game/types';
import { showToast } from '$lib/game/ui/Toast';
import { renderDesigner, eraseComponent } from './DesignerRenderer';
import { saveSpell, loadSpell, clearDesign } from './SpellManager';
import { startLoop } from './GameLoop';
/** 게임의 중앙 제어 싱글톤. 모든 상태 변경과 상호작용의 진입점 */
export class GameManager {
  store = gameState;
  canvas: HTMLCanvasElement | null = null;
  renderer: BattleRenderer | null = null;
  lastTime = 0;
  accumulator = 0;
  animId: number | null = null;

  constructor() {
    // Client-side init deferred to initClient()
  }

  /** 브라우저 환경에서 localStorage 데이터를 로드하고 언어를 설정합니다 */
  initClient() {
    this.store.loadFromStorage();
    this.store.slots = [...this.store.slots];
    this.store.slotAutoModes = [...this.store.slotAutoModes];
    this.store.decks = [...this.store.decks];
    this.store.deckNames = [...this.store.deckNames];
    setLanguage(this.store.language);
  }

  // ── Getters ──────────────────────────────────────────────
  get state(): GameState { return this.store.state; }
  set state(s: GameState) { this.store.state = s; }
  get designer() { return this.store.designer; }
  get battle() { return this.store.battle; }
  get slots() { return this.store.slots; }
  get currentMap() { return this.store.currentMap; }
  get selectedRunMode() { return this.store.selectedRunMode; }
  get slotsAuto() { return this.store.slotAutoModes; }
  get keyBindings() { return this.store.keyBindings; }
  get controlBindings() { return this.store.controlBindings; }
  get unlocks() { return this.store.unlocks; }
  get records() { return this.store.records; }
  get autoManaReserve() { return this.store.autoManaReserve; }
  set autoManaReserve(v: number) { this.store.autoManaReserve = v; }
  get manaBonusEnabled() { return this.store.manaBonusEnabled; }
  set manaBonusEnabled(v: boolean) { this.store.manaBonusEnabled = v; }
  get hasSavedSpell() { return this.store.hasSavedSpell(); }
  get totalStars() { return this.store.totalStars; }
  get effectiveManaRegen() { return this.store.effectiveManaRegen; }

  /** Canvas를 초기화하고 전투 렌더링 루프를 시작합니다 */
  initCanvas(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.renderer = new BattleRenderer(canvas);
    this.startLoop();
  }

  /** requestAnimationFrame 기반 게임 루프를 시작합니다 */
  startLoop() { startLoop(this); }

  // ── Designer ─────────────────────────────────────────────
  /** 설계 도구를 변경합니다 (예: 'circle', 'red', 'eraser'). 잠긴 도구는 첫 해금 도구로 폰백됩니다 */
  setTool(tool: string) {
    if (!isToolUnlocked(tool, this.store.unlocks, this.store.records)) {
      const first = TOOL_ORDER.find((t: string) =>
        t !== 'eraser' && isToolUnlocked(t, this.store.unlocks, this.store.records),
      ) || 'red';
      this.designer.tool = first;
    } else {
      this.designer.tool = tool;
    }
  }
  /** 회전 가능한 도구(oval, mixed2)의 방향을 토글합니다 */
  rotateTool() { this.designer.rotation = this.designer.rotation === 0 ? 1 : 0;; }
  /** 설계판 크기를 변경하고 설계판 밖 부품을 제거합니다 */
  setFrame(w: number, h: number) { this.designer.width = w; this.designer.height = h; this.trimComponents();; }

/** 마우스 위치에 현재 선택한 도구를 배치합니다. 성공 여부를 반환합니다 */
  placeComponent(e: MouseEvent): boolean {
    if (this.state !== 'design') return false;
    const coord = this.getBoardGridCoordFromPointer(e);
    if (!coord) return false;
    // Floor to get integer grid coordinates
    const gx = Math.floor(coord.gx);
    const gy = Math.floor(coord.gy);
    const comp = createComponentFromGridCoord(this.designer.tool, gx, gy, this.designer.nextId, this.designer.rotation);
    if (canPlaceComponent(comp, this.designer.components, this.designer.width, this.designer.height)) {
      this.designer.components.push(comp);
      this.designer.nextId++;
      return true;
    }
    return false;
  }


  /** 현재 설계의 통계를 반환합니다 */
  spellStats() {
    return calculateSpellStats({
      width: this.designer.width,
      height: this.designer.height,
      components: this.designer.components,
    });
  }

  /** 우클릭 또는 지우개 클릭으로 부품을 삭제합니다 */
  eraseComponent(e: MouseEvent) { eraseComponent(this, e); }

  /** 설계판 DOM을 그립니다 */
  renderDesigner() { renderDesigner(this); }

  /** 프레임 크기를 벗어난 부품을 제거합니다 */
  trimComponents() {
    const before = this.designer.components.length;
    this.designer.components = this.designer.components.filter(
      c => c.x + c.w <= this.designer.width && c.y + c.h <= this.designer.height,
    );
    if (before !== this.designer.components.length) showToast(t('trimmed.outside'));
  }

  /** 현재 설계를 지정한 슬롯에 저장합니다 */
  saveSpell(name: string, slotIndex: number) { saveSpell(this, name, slotIndex); }

  /** 지정한 슬롯의 술식을 설계판으로 불러옵니다 */
  loadSpell(slotIndex: number) { loadSpell(this, slotIndex); }

  /** 설계판의 모든 부품을 제거합니다 */
  clearDesign() { clearDesign(this); }

  // ── Battle ───────────────────────────────────────────────
  /** 전투를 시작합니다. 저장된 술식이 없으면 토스트 메시지를 출력합니다 */
  startBattle() {
    if (!this.hasSavedSpell) { showToast(t('spell.needed'), 'bad'); return; }
    if (this.battle.battleStarted && this.state !== 'gameover') this.recordRun();
    if (!this.store.isMapUnlocked(this.currentMap.id)) this.store.currentMap = this.store.getFirstUnlockedMap();
    const b = this.battle;
    b.score = 0; b.mana = MAX_MANA; b.baseHp = 20; b.survival = 0;
    b.monsters = []; b.casts = []; b.effects = [];
    b.cooldowns = [0, 0, 0, 0, 0]; b.selectedTargetId = null;
    b.spawnTimer = SPAWN_TIMER_BATTLE_START; b.nextMonsterId = 1; b.nextCastId = 1;
    b.activeRunMapId = this.currentMap.id;
    b.activeRunMode = this.selectedRunMode;
    b.bossInterval = this.currentMap.bossInterval || 30;
    b.nextBossAt = this.currentMap.repeatingBoss ? (this.currentMap.firstBossAt || 30) : Infinity;
    this.battle.battleStarted = true;
    this.state = 'battle';
    showToast(`${this.currentMap.shortName} ${t('start')}`, 'good');
  }

  /** 현재 맵으로 전투를 즉시 재시작합니다 */
  restartBattle() {
    if (!this.hasSavedSpell) { showToast(t('spell.needed'), 'bad'); return; }
    this.startBattle();
  }

  /** 지정한 슬롯의 술식을 수동 발사합니다 */
  castSlot(index: number) {
    if (this.state !== 'battle') { showToast(t('battle.only'), 'bad'); return; }
    const spell = this.slots[index];
    if (!spell) { showToast(t('no.spell'), 'bad'); return; }
    if (this.battle.cooldowns[index] > 0) { showToast(t('cooldown.active'), 'bad'); return; }
    if (this.battle.mana < spell.manaCost) { showToast(t('not.enough.mana'), 'bad'); return; }
    const target = getCurrentTarget(this.battle.monsters, this.battle.selectedTargetId);
    if (!target) { showToast(t('no.target'), 'bad'); return; }
    this.battle.mana -= spell.manaCost;
    this.battle.cooldowns[index] = spell.castTime;
    this.battle.casts.push({
      id: this.battle.nextCastId++,
      spell: clone(spell),
      targetId: target.id,
      slotIndex: index,
      remainingTicks: 4,
      totalTicks: 4,
    });
  }


  /** 현재 전투 런의 기록을 저장합니다 */
  recordRun() {
    if (!this.battle.battleStarted) return false;
    const id = String(this.battle.activeRunMapId || '');
    if (!id || !MAPS[Number(id)]) return false;
    const mode = this.battle.activeRunMode === 'pure' ? 'pure' : 'assist';
    const rec = Storage.getMapRecord(this.records, Number(id), mode);
    const next = {
      score: Math.max(rec.score || 0, this.battle.score || 0),
      time: Math.max(rec.time || 0, this.battle.survival || 0),
    };
    const changed = (next.score !== rec.score) || (next.time !== rec.time);
    Storage.setMapRecord(this.records, Number(id), mode, next);
    if (changed) Storage.saveRecords(this.records);
    return changed;
  }

  /** 전투 종료 후 맵/별 해금 상태를 확인하고 토스트를 출력합니다 */
  checkUnlocks() {
    if (!this.battle.activeRunMapId) return;
    const b2 = this.store.isMapUnlocked(2), b3 = this.store.isMapUnlocked(3), bs = this.totalStars;
    const beforeRegen = this.effectiveManaRegen;
    this.recordRun();
    const a2 = this.store.isMapUnlocked(2), a3 = this.store.isMapUnlocked(3), as = this.totalStars;
    const afterRegen = this.effectiveManaRegen;
    if (!b2 && a2) showToast(t('map2.unlocked'), 'good');
    else if (!b3 && a3) showToast(t('map3.unlocked'), 'good');
    else if (bs < as) showToast(t('star.earned', as), 'good');
    if (beforeRegen < afterRegen) showToast(t('mana.bonus.activated', afterRegen), 'good');
  }

  /** 현재 게임 상태를 현재 언어의 라벨로 반환합니다 */
  stateLabel(): string {
    const m: Record<string, string> = {
      ready: t('ready'), design: t('designing'),
      battle: t('fighting'), paused: t('pause'), gameover: t('game.over'),
    };
    return m[this.state] || this.state;
  }

  /** 캔버스 클릭 시 몬스터를 수동 타겟팅합니다 */
  onCanvasClick(e: MouseEvent) {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * this.canvas.width / rect.width;
    const y = (e.clientY - rect.top) * this.canvas.height / rect.height;
    const picked = pickMonsterAt(this.battle.monsters, x, y);
    if (picked) { this.battle.selectedTargetId = picked.id; showToast(t('target.hp', picked.hp)); }
  }

  /** 게임 언어를 변경하고 localStorage에 저장합니다 */
  setLanguage(lang: 'ko' | 'en') {
    this.store.language = lang;
    setLanguage(lang);
    document.documentElement.lang = lang;
    Storage.saveLanguage(lang);
  }

  /** 전투를 일시정지하거나 재개합니다 */
  togglePause() {
    if (this.state === 'battle') { this.state = 'paused'; showToast(t('pause')); }
    else if (this.state === 'paused') { this.state = 'battle'; showToast(t('ready'), 'good'); }
  }

/** 설계 화면과 전투 화면을 전환합니다 */
  toggleDesigner() {
    if (this.state === 'design') {
      // Prevent entering battle if no saved spell - show toast and stay in design mode
      if (!this.hasSavedSpell) {
        showToast(t('spell.needed'), 'bad');
        return;
      }
      const fb: GameState = this.battle.battleStarted ? 'battle' : 'ready';
      this.state = this.store.returnStateAfterDesign && this.store.returnStateAfterDesign !== 'design'
        ? this.store.returnStateAfterDesign : fb;
    } else {
      this.store.returnStateAfterDesign = this.state;
      this.state = 'design';
    }
  }

  /** 전투 속도를 1/2/4/8배로 설정합니다 */
  setBattleSpeed(speed: number) {
    this.battle.battleSpeed = [1, 2, 4, 8].includes(speed) ? speed : 1;
  }

  /** 지정한 슬롯의 키 라벨을 반환합니다 */
  getSlotKeyLabel(index: number): string {
    const b = this.keyBindings[index] || Storage.defaultKeyBindings()[index];
    return b.label || b.key || String(index + 1);
  }

  /** 지정한 조작 액션의 키 라벨을 반환합니다 */
  getControlKeyLabel(action: string): string {
    const b = this.controlBindings[action] || Storage.defaultControlBindings()[action];
    return b?.label || b?.key || '';
  }

  /** 해당 맵이 해금되었는지 확인합니다 */
  isMapUnlocked(id: number): boolean { return this.store.isMapUnlocked(id); }
  /** 해당 도구가 해금되었는지 확인합니다 */
  isToolUnlocked(tool: string): boolean { return isToolUnlocked(tool, this.unlocks, this.records); }
  /** 해당 맵의 획득 별 개수를 반환합니다 */
  getMapStars(id: number): number { return this.store.getMapStars(id); }

  /** 모든 저장 데이터를 삭제하고 초기 상태로 복원합니다 */
  clearAllData() {
    this.battle.battleStarted = false;
    this.battle.activeRunMapId = null;
    this.battle.activeRunMode = null;
    Storage.clearAllStorage();
    this.store.loadFromStorage();
    this.state = 'design';
    showToast(t('data.cleared'), 'good');
  }

  // ── Phase 3.5: v1.5 State & Logic Migration ──────────────

  /** 마나 보너스 ON/OFF를 토글합니다 (별 5개 이상 필요) */
  toggleManaBonus() {
    if (this.store.totalStars < 5) {
      showToast(t('mana.bonus.require.stars'), 'bad');
      return;
    }
    this.store.manaBonusEnabled = !this.store.manaBonusEnabled;
    Storage.saveManaBonusEnabled(this.store.manaBonusEnabled);
    showToast(t('mana.bonus.toggled', this.store.manaBonusEnabled ? 'ON' : 'OFF'), this.store.manaBonusEnabled ? 'good' : 'bad');
  }

  /** 설계 미리보기 좌표를 설정합니다 (placement ghost 용) */
  setDesignerPreview(x: number, y: number) {
    this.designer.previewX = x;
    this.designer.previewY = y;
  }

  /** 설계 미리보기 좌표를 초기화합니다 */
  clearDesignerPreview() {
    this.designer.previewX = null;
    this.designer.previewY = null;
  }

  /** 테스트용 치트 코드: 1111 입력 시 모든 맵과 별 9개 해금 */
  tryUnlockAllMaps(code: string): boolean {
    if (code.trim() !== UNLOCK_ALL_MAPS_CODE) {
      showToast(t('wrong.password'), 'bad');
      return false;
    }
    this.store.unlocks = { '1': true, '2': true, '3': true };
    for (const id of [1, 2, 3]) {
      const thresholds = STAR_THRESHOLDS[id] || [];
      const threeStarScore = thresholds[2] || 0;
      const rec = Storage.getMapRecord(this.store.records, id, 'assist');
      Storage.setMapRecord(this.store.records, id, 'assist', {
        score: Math.max(rec.score || 0, threeStarScore),
        time: Math.max(rec.time || 0, 1),
      });
    }
    Storage.saveUnlocks(this.store.unlocks);
    Storage.saveRecords(this.store.records);
    showToast(t('test.mode.unlocked'), 'good');
    return true;
  }

  /** 현재 5개 슬롯을 지정한 덱 인덱스에 저장합니다 */
  saveDeck(index: number) {
    if (index < 0 || index >= 10) return;
    this.store.decks[index] = clone(this.store.slots);
    Storage.saveDecks(this.store.decks);
    const name = this.store.deckNames[index] || `덱 ${index + 1}`;
    showToast(t('deck.saved', name), 'good');
  }

  /** 지정한 덱 인덱스의 술식을 현재 슬롯으로 불러옵니다 */
  loadDeck(index: number) {
    if (index < 0 || index >= 10) return;
    const deck = this.store.decks[index] || [null, null, null, null, null];
    if (!deck.some(Boolean)) {
      showToast(t('deck.empty'), 'bad');
      return;
    }
    this.store.slots = deck.map(spell => spell ? Storage.normalizeSpell(spell) : null);
    Storage.saveSlots(this.store.slots);
    const name = this.store.deckNames[index] || `덱 ${index + 1}`;
    showToast(t('deck.loaded', name), 'good');
  }

  /** 덱 이름을 변경합니다 (최대 18자) */
  renameDeck(index: number, name: string) {
    if (index < 0 || index >= 10) return;
    const trimmed = (name || '').trim().slice(0, MAX_SPELL_NAME_LENGTH) || `덱 ${index + 1}`;
    this.store.deckNames[index] = trimmed;
    Storage.saveDeckNames(this.store.deckNames);
    showToast(t('deck.name.saved'), 'good');
  }

  // ── Phase 5: Feature helpers ─────────────────────────────

  /** 현재 맵을 변경합니다 */
  setCurrentMap(mapId: number) {
    const map = MAPS[mapId];
    if (map) this.store.currentMap = map;
  }

  /** 런 모드를 변경하고 저장합니다 */
  setRunMode(mode: RunMode) {
    this.store.selectedRunMode = mode;
    Storage.saveSelectedRunMode(mode);
  }

  /** 현재 5개 슬롯을 지정한 덱 인덱스에 저장합니다 (saveDeck alias) */
  saveCurrentSlotsToDeck(index: number) { this.saveDeck(index); }

  /** 지정한 덱 인덱스의 술식을 현재 슬롯으로 불러옵니다 (loadDeck alias) */
  loadDeckToSlots(index: number) { this.loadDeck(index); }

  /** 덱 이름을 저장합니다 (renameDeck alias) */
  saveDeckName(index: number, name: string) { this.renameDeck(index, name); }

  /** 맵 정보를 반환합니다 */
  getMap(mapId: number) { return MAPS[mapId]; }

  /** 맵 잠금 해금 조건 텍스트 키를 반환합니다 */
  getUnlockText(mapId: number): string {
    return `unlock.map${mapId}`;
  }

  /** 별 개수만큼 ★ 문자열을 반환합니다 */
  renderStars(count: number): string {
    return '★'.repeat(count) + '☆'.repeat(Math.max(0, 3 - count));
  }

  /** KeyboardEvent를 KeyBinding으로 변환합니다 */
  eventToBinding(e: KeyboardEvent): KeyBinding | null {
    if (!e.code) return null;
    let label = e.key;
    if (e.code.startsWith('Key')) label = e.code.slice(3);
    else if (e.code.startsWith('Digit')) label = e.code.slice(5);
    else if (e.code === 'Space') label = 'SPC';
    else if (e.code === 'Enter') label = '↵';
    else if (e.code === 'Escape') label = 'ESC';
    else if (e.code === 'ArrowUp') label = '↑';
    else if (e.code === 'ArrowDown') label = '↓';
    else if (e.code === 'ArrowLeft') label = '←';
    else if (e.code === 'ArrowRight') label = '→';
    return { code: e.code, key: e.key, label: label.toUpperCase() };
  }

  /** 지정한 바인딩이 다른 타겟과 중복되는지 검사합니다 */
  findBindingConflict(target: KeyTarget, binding: KeyBinding): string | null {
    if (target.type === 'slot') {
      for (let i = 0; i < 5; i++) {
        if (i === target.index) continue;
        const b = this.keyBindings[i];
        if (b && b.code === binding.code) return this.getSlotKeyLabel(i);
      }
    }
    for (const [id, b] of Object.entries(this.controlBindings)) {
      if (target.type === 'control' && target.id === id) continue;
      if (b && b.code === binding.code) {
        const action = CONTROL_ACTIONS.find(a => a.id === id);
        return action?.name || id;
      }
    }
    if (target.type === 'control') {
      for (let i = 0; i < 5; i++) {
        const b = this.keyBindings[i];
        if (b && b.code === binding.code) return this.getSlotKeyLabel(i);
      }
    }
    return null;
  }

  /** 키 바인딩을 설정하고 저장합니다 */
  setBinding(target: KeyTarget, binding: KeyBinding) {
    if (target.type === 'slot') {
      this.store.keyBindings[target.index] = binding;
      Storage.saveKeyBindings(this.store.keyBindings);
    } else {
      this.store.controlBindings[target.id] = binding;
      Storage.saveControlBindings(this.store.controlBindings);
    }
  }

  /** 바인딩 대상의 이름을 반환합니다 */
  bindingNameForTarget(target: KeyTarget): string {
    if (target.type === 'slot') return t('slot.number', target.index + 1);
    const action = CONTROL_ACTIONS.find(a => a.id === target.id);
    return action?.name || target.id;
  }

  /** 모든 키 바인딩을 기본값으로 초기화하고 저장합니다 */
  resetKeyBindings() {
    this.store.keyBindings = Storage.defaultKeyBindings();
    this.store.controlBindings = Storage.defaultControlBindings();
    Storage.saveKeyBindings(this.store.keyBindings);
    Storage.saveControlBindings(this.store.controlBindings);
    showToast(t('reset.all.keys'), 'good');
  }

  /** 자동 마나 보존 값을 저장합니다 */
  saveAutoManaReserve() {
    Storage.saveAutoManaReserve(this.store.autoManaReserve);
  }

/** 마우스 포인터 위치를 설계판 그리드 좌표로 변환합니다 */
  getBoardGridCoordFromPointer(e: { clientX: number; clientY: number }): { gx: number; gy: number } | null {
    const board = document.getElementById('designBoard');
    if (!board) return null;
    const rect = board.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;
    // Map using the rendered board size so any CSS scale (mobile) is accounted
    // for: each cell occupies rect.width / width (and rect.height / height).
    const cellW = rect.width / this.designer.width;
    const cellH = rect.height / this.designer.height;
    const gx = (e.clientX - rect.left) / cellW;
    const gy = (e.clientY - rect.top) / cellH;
    return { gx, gy };
  }

  // ── Drag placement state ─────────────────────────────────
  placingDrag = false;
  erasingDrag = false;
  lastDragPlaceKey: string | null = null;

/** 설계판 마우스 다운: 배치/삭제 및 드래그 상태 시작 */
onDesignBoardMouseDown(e: MouseEvent) {
  if (this.state !== 'design') return;
  if (e.button === 2) {
    this.erasingDrag = true;
    this.eraseComponent(e);
  } else if (e.button === 0 && this.designer.tool !== 'eraser') {
    this.placingDrag = true;
    this.placeComponent(e);
  } else if (e.button === 0 && this.designer.tool === 'eraser') {
    this.erasingDrag = true;
    this.eraseComponent(e);
  }
}

  /** 설계판 마우스 이동: 드래그 연속 배치/삭제 */
  onDesignBoardMouseMove(e: MouseEvent) {
    if (this.state !== 'design') return;
    if (this.erasingDrag && this.designer.tool === 'eraser') {
      this.eraseComponent(e);
    } else if (this.placingDrag && this.designer.tool !== 'eraser') {
      const coord = this.getBoardGridCoordFromPointer(e);
      if (!coord) return;
      const gx = Math.floor(coord.gx);
      const gy = Math.floor(coord.gy);
      const comp = createComponentFromGridCoord(this.designer.tool, gx, gy, this.designer.nextId, this.designer.rotation);
      const key = `${comp.type}:${comp.x},${comp.y}:${comp.w}x${comp.h}:${comp.rotation}`;
      if (this.lastDragPlaceKey === key) return;
      this.lastDragPlaceKey = key;
      if (canPlaceComponent(comp, this.designer.components, this.designer.width, this.designer.height)) {
        this.designer.components.push(comp);
        this.designer.nextId++;
      }
    }
  }

  /** 드래그를 종료합니다 */
  endDrag() {
    this.placingDrag = false;
    this.erasingDrag = false;
    this.lastDragPlaceKey = null;
  }
}

export const game = new GameManager();
if (typeof window !== 'undefined') game.initClient();
