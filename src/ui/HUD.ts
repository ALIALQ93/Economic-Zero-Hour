import type { Resources } from '../resources/ResourceManager';
import type { Unit } from '../units/Unit';

export class HUD {
  private capitalEl = document.getElementById('res-capital')!;
  private oilEl = document.getElementById('res-oil')!;
  private foodEl = document.getElementById('res-food')!;
  private metalsEl = document.getElementById('res-metals')!;
  private timeEl = document.getElementById('game-time')!;
  private layerBtn = document.getElementById('layer-toggle')!;
  private unitEl = document.getElementById('hud-unit')!;
  private generalEl = document.getElementById('hud-general')!;
  private tradeBtn = document.getElementById('trade-toggle')! as HTMLButtonElement;

  updateResources(res: Readonly<Resources>): void {
    this.capitalEl.textContent = `💰 ${this.fmt(res.capital)}`;
    this.oilEl.textContent = `⛽ ${res.oil}`;
    this.foodEl.textContent = `🌾 ${res.food}`;
    this.metalsEl.textContent = `💎 ${res.metals}`;
  }

  updateTime(formatted: string): void {
    this.timeEl.textContent = `⏱ ${formatted}`;
  }

  updateGeneral(name: string, abilityReady: boolean): void {
    this.generalEl.textContent = abilityReady
      ? `💼 ${name} — الاستحواذ الكامل جاهز`
      : `💼 ${name}`;
  }

  updateSelectedUnit(unit: Unit | undefined): void {
    if (!unit) {
      this.unitEl.textContent = '📍 لا وحدة';
      return;
    }
    const status = unit.busy ? 'في الطريق' : unit.atCountryId ?? '—';
    this.unitEl.textContent = `📍 ${unit.displayName}: ${status}`;
  }

  setHiddenLayerActive(active: boolean): void {
    this.layerBtn.classList.toggle('active', active);
    this.layerBtn.textContent = active ? 'طبقة علنية (Tab)' : 'طبقة خفية (Tab)';
  }

  setTradeRoutesActive(active: boolean): void {
    this.tradeBtn.classList.toggle('active', active);
    this.tradeBtn.textContent = active ? 'تجارة (T)' : 'تجارة ✕';
  }

  private fmt(n: number): string {
    return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(Math.floor(n));
  }
}
