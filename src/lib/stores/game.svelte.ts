// ============================================================
// GameReactiveState — Svelte 5 $state / $derived 기반 반응형 상태
// GameManager와 병렬로 동작하며, Phase 4에서 UI 컴포넌트로 연결
// ============================================================
import { Store } from '$lib/game/core/Store';
import { setLanguage, t } from '$lib/game/i18n';
import { getTotalStars } from '$lib/game/utils/progression';
import { MANA_BONUS_STAR_COUNT, STAR_MANA_REGEN, BASE_MANA_REGEN } from '$lib/game/constants';

class GameReactiveState {
  // ── Core store ────────────────────────────────────────────
  store = new Store();

  // ── UI state ──────────────────────────────────────────────
  ui = $state({
    state: 'design' as string,
    score: 0,
    mana: 20,
    baseHp: 20,
    survival: 0,
    mapName: '-',
    modeLabel: '',
    toastText: '',
    toastType: '' as '' | 'good' | 'bad',
    toastVisible: false,
    designerVisible: false,
    designerWidth: 2,
    designerHeight: 2,
    designerRotation: 0,
    hasSavedSpell: false,
    spellStats: null as ReturnType<typeof this.computeSpellStats> | null,
    slotCooldowns: [0, 0, 0, 0, 0] as number[],
    manaRegen: BASE_MANA_REGEN,
    battleSpeed: 1,
    isPaused: false,
    isGameOver: false,
    isDesignMode: false,
  });

  // ── Reactive sync with store ──────────────────────────────
  syncFromStore() {
    const s = this.store;
    const b = s.battle;
    const d = s.designer;
    this.ui.state = s.state;
    this.ui.score = b.score;
    this.ui.mana = b.mana;
    this.ui.baseHp = b.baseHp;
    this.ui.survival = b.survival;
    this.ui.mapName = s.currentMap?.shortName || '-';
    this.ui.modeLabel = s.selectedRunMode === 'pure' ? t('manual.mode') : t('auto.mode');
    this.ui.designerVisible = s.state === 'design';
    this.ui.designerWidth = d.width;
    this.ui.designerHeight = d.height;
    this.ui.designerRotation = d.rotation;
    this.ui.hasSavedSpell = s.slots.some(Boolean);
    this.ui.slotCooldowns = [...b.cooldowns];
    this.ui.manaRegen = s.effectiveManaRegen;
    this.ui.battleSpeed = b.battleSpeed;
    this.ui.isPaused = s.state === 'paused';
    this.ui.isGameOver = s.state === 'gameover';
    this.ui.isDesignMode = s.state === 'design';
    this.computeSpellStats = null as any; // placeholder
  }

  // ── Derived values ────────────────────────────────────────
  stateLabel = $derived(this._stateLabel());
  totalStars = $derived(
    getTotalStars(this.store.records, this.store.battle, this.store.state as any, this.store.battle.activeRunMapId, true),
  );
  manaBonusActive = $derived(this.totalStars >= MANA_BONUS_STAR_COUNT);

  private _stateLabel(): string {
    const m: Record<string, string> = {
      ready: t('ready'), design: t('designing'),
      battle: t('fighting'), paused: t('pause'), gameover: t('game.over'),
    };
    return m[this.store.state] || this.store.state;
  }

  // ── Toast ─────────────────────────────────────────────────
  private toastTimer: ReturnType<typeof setTimeout> | null = null;
  showToast(text: string, type: 'good' | 'bad' = 'good') {
    this.ui.toastText = text;
    this.ui.toastType = type;
    this.ui.toastVisible = true;
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.ui.toastVisible = false;
      this.ui.toastText = '';
    }, 1400);
  }

  // ── Body class effect ─────────────────────────────────────
  applyBodyClass() {
    $effect(() => {
      const isDesign = this.store.state === 'design';
      document.body.classList.toggle('mode-design', isDesign);
      document.body.classList.toggle('mode-play', !isDesign);
    });
  }
}

export const gameRx = new GameReactiveState();

// Initialize client-side data
if (typeof window !== 'undefined') {
  gameRx.store.loadFromStorage();
  setLanguage(gameRx.store.language);
  gameRx.syncFromStore();
}
