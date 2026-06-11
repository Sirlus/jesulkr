// ============================================================
// Battle — Canvas renderer
// ============================================================
import type { Monster, CastProjectile, VisualEffect, GameState } from '../types';
import { LANES } from '../constants';

export class BattleRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private staticCanvas: HTMLCanvasElement;
  private staticCtx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.staticCanvas = document.createElement('canvas');
    this.staticCanvas.width = canvas.width;
    this.staticCanvas.height = canvas.height;
    this.staticCtx = this.staticCanvas.getContext('2d')!;
    this.renderStaticLayer();
  }

  private renderStaticLayer(): void {
    const w = this.staticCanvas.width;
    const h = this.staticCanvas.height;
    const ctx = this.staticCtx;
    const laneW = w / LANES;

    // Background
    ctx.fillStyle = '#07101e';
    ctx.fillRect(0, 0, w, h);

    // Lanes
    ctx.strokeStyle = 'rgba(81,168,255,.22)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 10]);
    for (let i = 0; i <= LANES; i++) {
      const x = i * laneW;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    // Base zone
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(255,70,92,.12)';
    ctx.fillRect(0, h - 38, w, 38);
    ctx.strokeStyle = 'rgba(255,70,92,.65)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, h - 38);
    ctx.lineTo(w, h - 38);
    ctx.stroke();
  }

  render(
    monsters: Monster[],
    casts: CastProjectile[],
    effects: VisualEffect[],
    state: GameState,
    selectedTargetId: number | null,
    stateLabel: string,
    pauseMsg: string,
  ): void {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const ctx = this.ctx;

    ctx.clearRect(0, 0, w, h);

    // Draw pre-rendered static layer (background, lanes, base zone)
    ctx.drawImage(this.staticCanvas, 0, 0);

    ctx.save();

    // Projectiles
    for (const cast of casts) {
      const progress = 1 - cast.remainingTicks / Math.max(1, cast.totalTicks);
      const target = monsters.find(m => m.id === cast.targetId);
      const sx = w / 2, sy = h - 22;
      const tx = target ? target.x : sx;
      const ty = target ? target.y : h * 0.35;
      const mx = sx + (tx - sx) * progress;
      const my = sy + (ty - sy) * progress;

      ctx.strokeStyle = 'rgba(81,168,255,.75)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(mx, my);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(255,70,92,.9)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(mx, my, 10 + 10 * progress, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = 'rgba(234,244,255,.9)';
      ctx.font = '700 12px system-ui';
      ctx.fillText(cast.spell.name, mx + 14, my - 10);
    }

    // Monsters
    for (const m of monsters) {
      const selected = m.id === selectedTargetId;
      const r = m.boss ? 38 : (selected ? 27 : 23);
      ctx.fillStyle = selected ? 'rgba(255,215,109,.22)' : m.boss ? 'rgba(255,70,92,.16)' : 'rgba(81,168,255,.12)';
      ctx.beginPath();
      ctx.arc(m.x, m.y, r + 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(13,26,45,.96)';
      ctx.strokeStyle = selected ? '#ffd76d' : m.boss ? '#ff465c' : '#51a8ff';
      ctx.lineWidth = selected ? 4 : 2;
      ctx.beginPath();
      ctx.arc(m.x, m.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#eaf4ff';
      ctx.font = '900 18px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(Math.max(0, m.hp)), m.x, m.y);

      ctx.fillStyle = 'rgba(255,70,92,.75)';
      const hpW = (m.boss ? 74 : 42) * Math.max(0, m.hp / m.maxHp);
      ctx.fillRect(m.x - (m.boss ? 37 : 21), m.y + r + 8, hpW, 5);
    }

    // Effects
    for (const ef of effects) {
      const p = ef.t / ef.life;
      ctx.globalAlpha = Math.max(0, 1 - p);
      if (ef.type === 'hit') {
        ctx.strokeStyle = '#ff465c'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(ef.x, ef.y, 18 + 28 * p, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = '#ffb7bf'; ctx.font = '900 20px system-ui'; ctx.textAlign = 'center';
        ctx.fillText(ef.text, ef.x, ef.y - 34 - 10 * p);
      } else if (ef.type === 'kill') {
        ctx.strokeStyle = '#70ffc0'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(ef.x, ef.y, 20 + 40 * p, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = '#d8ffef'; ctx.font = '800 16px system-ui'; ctx.textAlign = 'center';
        ctx.fillText(ef.text, ef.x, ef.y - 24 - 14 * p);
      } else if (ef.type === 'aoe') {
        ctx.strokeStyle = 'rgba(125,172,255,.9)'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(ef.x, ef.y, 80 + 260 * p, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = '#cfe1ff'; ctx.font = '900 24px system-ui'; ctx.textAlign = 'center';
        ctx.fillText(ef.text, ef.x, ef.y - 10 - 20 * p);
      } else {
        ctx.fillStyle = '#ff99a5'; ctx.font = '800 16px system-ui'; ctx.textAlign = 'center';
        ctx.fillText(ef.text, ef.x, ef.y - 10 - 18 * p);
      }
      ctx.globalAlpha = 1;
    }

    // State overlay
    if (state !== 'battle') {
      ctx.fillStyle = 'rgba(3,8,16,.58)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#eaf4ff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '900 34px system-ui';
      ctx.fillText(stateLabel, w / 2, h / 2 - 12);
      ctx.font = '500 15px system-ui';
      ctx.fillStyle = 'rgba(234,244,255,.75)';
      ctx.fillText(pauseMsg, w / 2, h / 2 + 28);
    }

    ctx.restore();
  }
}
