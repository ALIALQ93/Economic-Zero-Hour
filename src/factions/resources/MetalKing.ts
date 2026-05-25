import type { Country } from '../../map/Country';
import type { ResourceManager } from '../../resources/ResourceManager';
import type { PlayerGeneral, SuperWeaponCheck } from '../General';

export const TOTAL_EMBARGO_COST = {
  capital: 4200,
  metals: 75,
} as const;

/** 💎 ملك المعادن — فصيل الموارد */
export class MetalKing implements PlayerGeneral {
  readonly id = 'metal_king' as const;
  readonly nameAr = 'ملك المعادن';
  readonly titleAr = 'احتكار مستقبل الصناعة';
  readonly superWeaponNameAr = 'الحظر الكامل';

  private used = false;

  getInvestBonus(country: Country): number {
    return country.def.region === 'north' ? 9 : 5;
  }

  getFactoryBonus(): number {
    return 13;
  }

  getLoanBonus(): number {
    return 9;
  }

  canUseSuperWeapon(
    country: Country,
    unitAtCountry: boolean,
    resources: ResourceManager,
  ): SuperWeaponCheck {
    if (this.used) return { ok: false, reason: 'تم الحظر الكامل مسبقاً' };
    if (!unitAtCountry) return { ok: false, reason: 'يجب أن يكون المحلل في الشمال الصناعي' };
    if (country.def.region !== 'north') {
      return { ok: false, reason: 'يجب التواجد في دولة من الشمال الصناعي' };
    }
    if (country.playerInfluence < 25) {
      return { ok: false, reason: 'تحتاج 25% نفوذ في الدولة' };
    }
    if (!resources.canAfford(TOTAL_EMBARGO_COST)) {
      return { ok: false, reason: '4200 رأس مال + 75 معادن' };
    }
    return { ok: true };
  }

  isMapWideSuperWeapon(): boolean {
    return true;
  }

  executeSuperWeapon(
    _country: Country,
    resources: ResourceManager,
    allCountries: Map<string, Country>,
  ): boolean {
    if (!resources.spend(TOTAL_EMBARGO_COST)) return false;
    this.used = true;

    for (const c of allCountries.values()) {
      c.applyMetalBanWave();
    }
    resources.addBonus({ metals: 200 });
    return true;
  }

  isSuperWeaponAvailable(): boolean {
    return !this.used;
  }
}
