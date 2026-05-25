import type { Country } from '../../map/Country';
import type { ResourceManager } from '../../resources/ResourceManager';
import type { PlayerGeneral, SuperWeaponCheck } from '../General';

export const BIG_CRASH_COST = {
  capital: 5000,
  metals: 100,
} as const;

/** 📉 محرك الأسواق — فصيل البنوك */
export class MarketMover implements PlayerGeneral {
  readonly id = 'market_mover' as const;
  readonly nameAr = 'محرك الأسواق';
  readonly titleAr = 'ذعر مالي وانهيار عملات';
  readonly superWeaponNameAr = 'الانهيار الكبير';

  private used = false;

  getInvestBonus(country: Country): number {
    if (country.def.id === 'northam' || country.def.region === 'islands') return 9;
    return 6;
  }

  getFactoryBonus(): number {
    return 12;
  }

  getLoanBonus(): number {
    return 11;
  }

  canUseSuperWeapon(
    country: Country,
    unitAtCountry: boolean,
    resources: ResourceManager,
  ): SuperWeaponCheck {
    if (this.used) return { ok: false, reason: 'تم الانهيار الكبير مسبقاً' };
    if (!unitAtCountry) return { ok: false, reason: 'يجب أن يكون المحلل في دولة' };
    if (country.playerInfluence < 30) {
      return { ok: false, reason: 'تحتاج 30% نفوذ في دولة واحدة على الأقل' };
    }
    if (!resources.canAfford(BIG_CRASH_COST)) {
      return { ok: false, reason: '5000 رأس مال + 100 معادن' };
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
    if (!resources.spend(BIG_CRASH_COST)) return false;
    this.used = true;

    for (const c of allCountries.values()) {
      c.applyMarketCrashWave();
    }
    resources.addBonus({ capital: 2500 });
    return true;
  }

  isSuperWeaponAvailable(): boolean {
    return !this.used;
  }
}
