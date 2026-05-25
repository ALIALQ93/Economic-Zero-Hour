import type { Country } from '../map/Country';
import { getInfluenceLabel, getInfluenceLevel } from '../influence/InfluenceSystem';
import type { Unit } from '../units/Unit';
import { getRoleLabel } from '../units/unitRoles';

export interface PanelGeneralFlags {
  oilPrince?: boolean;
  foodLord?: boolean;
  metalKing?: boolean;
}

export class CountryPanel {
  private panel = document.getElementById('country-panel')!;
  private nameEl = document.getElementById('panel-country-name')!;
  private regionEl = document.getElementById('panel-region')!;
  private playerBarEl = document.getElementById('panel-player-bar')!;
  private aiBarEl = document.getElementById('panel-ai-bar')!;
  private playerPctEl = document.getElementById('panel-player-pct')!;
  private aiPctEl = document.getElementById('panel-ai-pct')!;
  private unitStatusEl = document.getElementById('panel-unit-status')!;
  private resourceEl = document.getElementById('panel-resource')!;
  private weaknessEl = document.getElementById('panel-weakness')!;
  private statusTagEl = document.getElementById('panel-status-tag')!;

  private currentCountryId: string | null = null;

  constructor() {
    document.getElementById('panel-close')!.addEventListener('click', () => this.hide());
  }

  show(country: Country, selectedUnit?: Unit, flags: PanelGeneralFlags = {}): void {
    this.currentCountryId = country.id;
    this.panel.classList.remove('hidden');
    this.refresh(country, selectedUnit, flags);
  }

  hide(): void {
    this.currentCountryId = null;
    this.panel.classList.add('hidden');
  }

  refresh(country: Country, selectedUnit?: Unit, flags: PanelGeneralFlags = {}): void {
    if (this.currentCountryId !== country.id) return;

    const level = getInfluenceLevel(country.playerInfluence);
    this.nameEl.textContent = country.displayName;
    this.regionEl.textContent = country.def.regionAr;
    this.playerBarEl.style.width = `${country.playerInfluence}%`;
    this.aiBarEl.style.width = `${country.aiInfluence}%`;
    this.playerPctEl.textContent = `أنت ${Math.round(country.playerInfluence)}% — ${getInfluenceLabel(level)}`;
    this.aiPctEl.textContent = `الخصم ${Math.round(country.aiInfluence)}%`;
    this.resourceEl.textContent = `📦 ${country.def.resource}`;
    this.weaknessEl.textContent = `⚠ ${country.def.weakness}`;

    if (country.digitallyParalyzed) {
      this.statusTagEl.textContent = '🔒 شلل رقمي — الخصم معطّل';
      this.statusTagEl.className = 'status-tag paralysis';
    } else if (country.marketFlooded) {
      this.statusTagEl.textContent = '🛒 إغراق سوقي — الاقتصاد المحلي منهار';
      this.statusTagEl.className = 'status-tag flood';
    } else if (country.debtTrapped) {
      this.statusTagEl.textContent = '🪤 فخ ديون — تدفق +40💰 كل 5ث';
      this.statusTagEl.className = 'status-tag debt';
    } else if (country.marketCrashHit) {
      this.statusTagEl.textContent = '📉 ضربة الانهيار الكبير';
      this.statusTagEl.className = 'status-tag crash';
    } else if (country.tradeShocked) {
      this.statusTagEl.textContent = '✂️ صدمة تجارية — عدم استقرار';
      this.statusTagEl.className = 'status-tag shock';
    } else if (country.oilShockHit) {
      this.statusTagEl.textContent = '🛢️ صدمة نفطية عالمية';
      this.statusTagEl.className = 'status-tag oil';
    } else if (country.quietCoup) {
      this.statusTagEl.textContent = '👤 انقلاب هادئ — الحكومة تابعة';
      this.statusTagEl.className = 'status-tag shadow';
    } else if (country.foodEmbargo) {
      this.statusTagEl.textContent = '🌾 مجاعة مُدارة — الجنوب يجوع';
      this.statusTagEl.className = 'status-tag food';
    } else if (country.metalBanHit) {
      this.statusTagEl.textContent = '💎 حظر كامل — الصناعة متجمدة';
      this.statusTagEl.className = 'status-tag metal';
    } else if (
      flags.oilPrince &&
      country.def.region === 'oil_belt' &&
      country.playerInfluence >= 40 &&
      country.playerInfluence > country.aiInfluence
    ) {
      this.statusTagEl.textContent = '🛢️ حقل نفط خاضع — +10⛽/تكة';
      this.statusTagEl.className = 'status-tag oil';
    } else if (
      flags.foodLord &&
      country.def.region === 'south' &&
      country.playerInfluence >= 40 &&
      country.playerInfluence > country.aiInfluence
    ) {
      this.statusTagEl.textContent = '🌾 أرض زراعية خاضعة — +8🌾/تكة';
      this.statusTagEl.className = 'status-tag food';
    } else if (
      flags.metalKing &&
      country.def.region === 'north' &&
      country.playerInfluence >= 40 &&
      country.playerInfluence > country.aiInfluence
    ) {
      this.statusTagEl.textContent = '💎 منجم خاضع — +7💎/تكة';
      this.statusTagEl.className = 'status-tag metal';
    } else {
      this.statusTagEl.textContent = '';
      this.statusTagEl.className = 'status-tag';
    }

    if (selectedUnit) {
      const role = getRoleLabel(selectedUnit.role);
      if (selectedUnit.atCountryId === country.id) {
        this.unitStatusEl.textContent = `✓ ${role} هنا — انقر الدولة للقائمة`;
        this.unitStatusEl.className = 'unit-status ready';
      } else if (selectedUnit.busy) {
        this.unitStatusEl.textContent = `⟳ ${role} في الطريق...`;
        this.unitStatusEl.className = 'unit-status moving';
      } else {
        this.unitStatusEl.textContent = `أرسل ${role} — أو استخدم قائمة الأوامر`;
        this.unitStatusEl.className = 'unit-status';
      }
    }
  }

  isOpen(): boolean {
    return !this.panel.classList.contains('hidden');
  }
}
