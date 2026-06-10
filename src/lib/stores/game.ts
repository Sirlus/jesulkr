// ============================================================
// Jesulkr — Game manager singleton (SvelteKit compatible)
// ============================================================
import { Store } from '$lib/game/core/Store';
import * as Storage from '$lib/game/core/Storage';
import { setLanguage, t } from '$lib/game/i18n';
import { MAPS, MAX_MANA } from '$lib/game/constants';
import { BattleRenderer } from '$lib/game/battle/BattleRenderer';
import { getCurrentTarget, pickMonsterAt } from '$lib/game/battle/TargetingSystem';
import { clone } from '$lib/game/utils/helpers';
import { calculateSpellStats } from '$lib/game/designer/StatsCalculator';
import { createComponentFromGridCoord, canPlaceComponent } from '$lib/game/designer/Components';
import type { GameState } from '$lib/game/types';
import { showToast } from '$lib/game/ui/Toast';
import { updateHUD } from '$lib/game/ui/HUD';
import { renderSlots, updateCooldownBars } from '$lib/game/ui/SlotPanel';
import { renderDesigner, eraseComponent } from './DesignerRenderer';
import { saveSpell, loadSpell, clearDesign } from './SpellManager';
import { startLoop } from './GameLoop';

/** 게임의 중앙 제어 싱글톤. 모든 상태 변경과 상호작용의 진입점 */
export class GameManager {
  store = new Store();
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
    setLanguage(this.store.language);
  }

  // ── Getters ──────────────────────────────────────────────
  get state(): GameState { return this.store.state; }
  set state(s: GameState) { this.store.state = s; this.onStateChange(); }
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

  /** 상태 변경 시 UI 클래스 토글 및 전체 갱신 */
  onStateChange() {
    const isDesign = this.store.state === 'design';
    const dp = document.getElementById('designerPanel');
    if (dp) dp.classList.toggle('hidden', !isDesign);
    document.body.classList.toggle('mode-design', isDesign);
    document.body.classList.toggle('mode-play', !isDesign);
    this.refreshAll();
  }

  /** Canvas를 초기화하고 전투 렌더링 루프를 시작합니다 */
  initCanvas(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.renderer = new BattleRenderer(canvas);
    this.startLoop();
  }

  /** requestAnimationFrame 기반 게임 루프를 시작합니다 */
  startLoop() { startLoop(this); }

  // ── Designer ─────────────────────────────────────────────
  /** 설계 도구를 변경합니다 (예: 'circle', 'red', 'eraser') */
  setTool(tool: string) { this.designer.tool = tool; }
  /** 회전 가능한 도구(oval, mixed2)의 방향을 토글합니다 */
  rotateTool() { this.designer.rotation = this.designer.rotation === 0 ? 1 : 0; }
  /** 설계판 크기를 변경하고 설계판 밖 부품을 제거합니다 */
  setFrame(w: number, h: number) { this.designer.width = w; this.designer.height = h; this.trimComponents(); }

  /** 마우스 위치에 현재 선택한 도구를 배치합니다. 성공 여부를 반환합니다 */
  placeComponent(e: MouseEvent): boolean {
    if (this.state !== 'design') return false;
    const board = document.getElementById('designBoard'); if (!board) return false;
    const rect = board.getBoundingClientRect();
    const bw = this.designer.width * 58 + (this.designer.width - 1) * 4;
    const bh = this.designer.height * 58 + (this.designer.height - 1) * 4;
    const gx = (e.clientX - rect.left) / bw * this.designer.width;
    const gy = (e.clientY - rect.top) / bh * this.designer.height;
    const comp = createComponentFromGridCoord(this.designer.tool, gx, gy, this.designer.nextId, this.designer.rotation);
    if (canPlaceComponent(comp, this.designer.components, this.designer.width, this.designer.height)) {
      this.designer.components.push(comp);
      this.designer.nextId++;
      this.renderDesigner();
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

  /** 현재 설계의 통계를 계산하여 HUD에 표시합니다 */
  updateStatsDisplay() {
    const stats = this.spellStats();
    const el = document.getElementById('spellStats'); if (!el) return;
    const aoe = stats.aoeDamage > 0 ? `${t('scatter')} ${stats.aoeDamage}` : t('none');
    el.innerHTML = `
      <div class="statGrid">
        <div class="statCard"><span>${t('cooldown')}</span><b>${stats.castTime}t</b></div>
        <div class="statCard"><span>${t('mana')}</span><b>${stats.manaCost}</b></div>
        <div class="statCard"><span>${t('normal.damage')}</span><b>${stats.damage}</b>
          <div class="small">${stats.valid ? t('can.save') : t('cannot.save')}</div>
        </div>
        <div class="statCard"><span>${t('special.damage')}</span><b>${aoe}</b></div>
      </div>
      <div class="breakdown">${stats.breakdown.join('\n')}</div>`;
    const sb = document.getElementById('saveBtn') as HTMLButtonElement;
    if (sb) sb.disabled = !stats.valid;
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
    if (before !== this.designer.components.length) showToast('프레임 밖 부품을 제거했습니다.');
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
    b.spawnTimer = 10; b.nextMonsterId = 1; b.nextCastId = 1;
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
    if (this.state !== 'battle') { showToast(t('not.enough.mana'), 'bad'); return; }
    const spell = this.slots[index];
    if (!spell) { showToast(t('no.spell'), 'bad'); return; }
    if (this.battle.cooldowns[index] > 0) { showToast(t('cooldown'), 'bad'); return; }
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
    this.store.emit('records');
    return changed;
  }

  /** 전투 종료 후 맵/별 해금 상태를 확인하고 토스트를 출력합니다 */
  checkUnlocks() {
    if (!this.battle.activeRunMapId) return;
    const b2 = this.store.isMapUnlocked(2), b3 = this.store.isMapUnlocked(3), bs = this.totalStars;
    this.recordRun();
    const a2 = this.store.isMapUnlocked(2), a3 = this.store.isMapUnlocked(3), as = this.totalStars;
    if (!b2 && a2) showToast('Map 2 unlocked!', 'good');
    else if (!b3 && a3) showToast('Map 3 unlocked!', 'good');
    else if (bs < as) showToast(`Star earned! ${as}/9`, 'good');
  }

  /** 현재 게임 상태를 현재 언어의 라벨로 반환합니다 */
  stateLabel(): string {
    const m: Record<string, string> = {
      ready: t('ready'), design: t('designing'),
      battle: t('fighting'), paused: t('pause'), gameover: t('game.over'),
    };
    return m[this.state] || this.state;
  }

  /** 상단 HUD 수치를 갱신합니다 */
  refreshHUD() {
    if (!this.canvas) return;
    updateHUD(this.battle.score, this.battle.mana, this.battle.baseHp, this.battle.survival,
      this.effectiveManaRegen, this.stateLabel(),
      this.currentMap?.shortName || '-',
      this.selectedRunMode === 'pure' ? t('manual.mode') : t('auto.mode'));
  }

  /** 슬롯 쿨타임 바를 갱신합니다 */
  refreshCooldowns() { updateCooldownBars(this.slots, this.battle.cooldowns); }
  /** 전체 UI를 갱신합니다 (설계판, 슬롯, HUD, 시작 버튼) */
  refreshAll() { this.renderDesigner(); this.refreshSlots(); this.refreshHUD(); this.updateStartBtn(); }

  /** 슬롯 패널 UI를 갱신합니다 */
  refreshSlots() {
    renderSlots('slots', this.slots,
      (i) => (this.keyBindings[i] || Storage.defaultKeyBindings()[i]).label || String(i + 1),
      this.slotsAuto, this.selectedRunMode === 'pure', false,
      (i) => { this.slotsAuto[i] = !this.slotsAuto[i]; Storage.saveSlotAutoModes(this.slotsAuto); this.refreshSlots(); },
      (i) => { if (this.state === 'battle') this.castSlot(i); else this.loadSpell(i); });
  }

  /** 전투 시작 버튼의 활성화 상태를 갱신합니다 */
  updateStartBtn() {
    const btn = document.getElementById('startBattleBtn') as HTMLButtonElement;
    if (btn) btn.disabled = !this.hasSavedSpell;
  }

  /** 캔버스 클릭 시 몬스터를 수동 타겟팅합니다 */
  onCanvasClick(e: MouseEvent) {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * this.canvas.width / rect.width;
    const y = (e.clientY - rect.top) * this.canvas.height / rect.height;
    const picked = pickMonsterAt(this.battle.monsters, x, y);
    if (picked) { this.battle.selectedTargetId = picked.id; showToast(`Target: HP ${picked.hp}`); }
  }

  /** 게임 언어를 변경하고 localStorage에 저장합니다 */
  setLanguage(lang: 'ko' | 'en') {
    this.store.language = lang;
    setLanguage(lang);
    document.documentElement.lang = lang;
    Storage.saveLanguage(lang);
    // Hide the modal immediately so the user sees the game UI
    const modal = document.getElementById('languageModal');
    if (modal) modal.classList.add('hidden');
    this.refreshAll();
  }

  /** 전투를 일시정지하거나 재개합니다 */
  togglePause() {
    if (this.state === 'battle') { this.state = 'paused'; showToast(t('pause')); }
    else if (this.state === 'paused') { this.state = 'battle'; showToast(t('ready'), 'good'); }
  }

  /** 설계 화면과 전투 화면을 전환합니다 */
  toggleDesigner() {
    if (this.state === 'design') {
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
    document.querySelectorAll('.speedBtn').forEach(btn =>
      btn.classList.toggle('active', Number((btn as HTMLElement).dataset.speed) === this.battle.battleSpeed));
  }

  /** 지정한 슬롯의 키 라벨을 반환합니다 */
  getSlotKeyLabel(index: number): string {
    const b = this.keyBindings[index] || Storage.defaultKeyBindings()[index];
    return b.label || b.key || String(index + 1);
  }

  /** 해당 맵이 해금되었는지 확인합니다 */
  isMapUnlocked(id: number): boolean { return this.store.isMapUnlocked(id); }
  /** 해당 맵의 획득 별 개수를 반환합니다 */
  getMapStars(id: number): number { return this.store.getMapStars(id); }
}

export const game = new GameManager();
if (typeof window !== 'undefined') game.initClient();
