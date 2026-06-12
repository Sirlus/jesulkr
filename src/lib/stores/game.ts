// ============================================================
// Jesulkr — Game manager singleton (SvelteKit compatible)
// ============================================================
import * as Storage from '$lib/game/core/Storage';
import { gameState } from './gameState.svelte';
import { t } from '$lib/game/i18n';
import { MAPS, STAR_THRESHOLDS, UNLOCK_ALL_MAPS_CODE, MAX_SPELL_NAME_LENGTH } from '$lib/game/constants';
import { BattleRenderer } from '$lib/game/battle/BattleRenderer';
import { clone } from '$lib/game/utils/helpers';
import { isToolUnlocked } from '$lib/game/utils/progression';
import type { GameState, RunMode, KeyTarget, KeyBinding, Language } from '$lib/game/types';
import { showToast } from '$lib/game/ui/Toast';
import { saveSpell, loadSpell, clearDesign } from './SpellManager';
import { startLoop } from './GameLoop';
import * as BattleController from '$lib/game/controllers/BattleController';
import * as DesignerController from '$lib/game/controllers/DesignerController';
import * as InputController from '$lib/game/controllers/InputController';
import * as StorageController from '$lib/game/controllers/StorageController';
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
    StorageController.initClient(this);
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
    DesignerController.setTool(this, tool);
  }
  /** 회전 가능한 도구(oval, mixed2)의 방향을 토글합니다 */
  rotateTool() { DesignerController.rotateTool(this); }
  /** 추출기 색상을 red → blue → green 순으로 순환시킵니다 (v2) */
  cycleExtractorColor() { DesignerController.cycleExtractorColor(this); }
  /** 설계판 크기를 변경하고 설계판 밖 부품을 제거합니다 */
  setFrame(w: number, h: number) { DesignerController.setFrame(this, w, h); }

  /** 마우스 위치에 현재 선택한 도구를 배치합니다. 성공 여부를 반환합니다 */
  placeComponent(e: MouseEvent): boolean {
    return DesignerController.placeComponent(this, e);
  }

  /** 현재 설계의 통계를 반환합니다 */
  spellStats() {
    return DesignerController.spellStats(this);
  }

  /** 우클릭 또는 지우개 클릭으로 부품을 삭제합니다 */
  eraseComponent(e: MouseEvent) { DesignerController.eraseComponent(this, e); }

  /** 설계판 DOM을 그립니다 */
  renderDesigner() { DesignerController.renderDesigner(this); }

  /** 프레임 크기를 벗어난 부품을 제거합니다 */
  trimComponents() { DesignerController.trimComponents(this); }

  /** 현재 설계를 지정한 슬롯에 저장합니다 */
  saveSpell(name: string, slotIndex: number) { saveSpell(this, name, slotIndex); }

  /** 지정한 슬롯의 술식을 설계판으로 불러옵니다 */
  loadSpell(slotIndex: number) { loadSpell(this, slotIndex); }

  /** 설계판의 모든 부품을 제거합니다 */
  clearDesign() { clearDesign(this); }

  // ── Battle ───────────────────────────────────────────────
  /** 전투를 시작합니다. 저장된 술식이 없으면 토스트 메시지를 출력합니다 */
  startBattle() { BattleController.startBattle(this); }

  /** 현재 맵으로 전투를 즉시 재시작합니다 */
  restartBattle() { BattleController.restartBattle(this); }

  /** 지정한 슬롯의 술식을 수동 발사합니다 */
  castSlot(index: number) { BattleController.castSlot(this, index); }

  /** 현재 전투 런의 기록을 저장합니다 */
  recordRun() { return BattleController.recordRun(this); }

  /** 전투 종료 후 맵/별 해금 상태를 확인하고 토스트를 출력합니다 */
  checkUnlocks() { BattleController.checkUnlocks(this); }

  /** 현재 게임 상태를 현재 언어의 라벨로 반환합니다 */
  stateLabel(): string { return BattleController.stateLabel(this); }

  /** 캔버스 클릭 시 몬스터를 수동 타겟팅합니다 */
  onCanvasClick(e: MouseEvent) { BattleController.onCanvasClick(this, e); }

  /** 게임 언어를 변경하고 localStorage에 저장합니다 */
  setLanguage(lang: Language) { StorageController.setLanguage(this, lang); }

  /** 전투를 일시정지하거나 재개합니다 */
  togglePause() { BattleController.togglePause(this); }

  /** 설계 화면과 전투 화면을 전환합니다 */
  toggleDesigner() {
    BattleController.toggleDesigner(this);
  }

  /** 전투 속도를 1/2/4/8배로 설정합니다 */
  setBattleSpeed(speed: number) { BattleController.setBattleSpeed(this, speed); }

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
  clearAllData() { StorageController.clearAllData(this); }

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
    DesignerController.setDesignerPreview(this, x, y);
  }

  /** 설계 미리보기 좌표를 초기화합니다 */
  clearDesignerPreview() {
    DesignerController.clearDesignerPreview(this);
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
  eventToBinding(e: KeyboardEvent): KeyBinding | null { return InputController.eventToBinding(e); }

  /** 지정한 바인딩이 다른 타겟과 중복되는지 검사합니다 */
  findBindingConflict(target: KeyTarget, binding: KeyBinding): string | null {
    return InputController.findBindingConflict(this, target, binding);
  }

  /** 키 바인딩을 설정하고 저장합니다 */
  setBinding(target: KeyTarget, binding: KeyBinding) { InputController.setBinding(this, target, binding); }

  /** 바인딩 대상의 이름을 반환합니다 */
  bindingNameForTarget(target: KeyTarget): string { return InputController.bindingNameForTarget(this, target); }

  /** 모든 키 바인딩을 기본값으로 초기화하고 저장합니다 */
  resetKeyBindings() { InputController.resetKeyBindings(this); }

  /** 자동 마나 보존 값을 저장합니다 */
  saveAutoManaReserve() { StorageController.saveAutoManaReserve(this); }

  /** 마우스 포인터 위치를 설계판 그리드 좌표로 변환합니다 */
  getBoardGridCoordFromPointer(e: { clientX: number; clientY: number }): { gx: number; gy: number } | null {
    return DesignerController.getBoardGridCoordFromPointer(this, e);
  }

  // ── Drag placement state ─────────────────────────────────
  placingDrag = false;
  erasingDrag = false;
  lastDragPlaceKey: string | null = null;

  /** 설계판 마우스 다운: 배치/삭제 및 드래그 상태 시작 */
  onDesignBoardMouseDown(e: MouseEvent) { InputController.onDesignBoardMouseDown(this, e); }

  /** 설계판 마우스 이동: 드래그 연속 배치/삭제 */
  onDesignBoardMouseMove(e: MouseEvent) {
    InputController.onDesignBoardMouseMove(this, e);
  }

  /** 드래그를 종료합니다 */
  endDrag() { InputController.endDrag(this); }
}

export const game = new GameManager();
if (typeof window !== 'undefined') game.initClient();
