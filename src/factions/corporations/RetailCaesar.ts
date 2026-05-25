import type { Country } from '../../map/Country';
import type { ResourceManager } from '../../resources/ResourceManager';
import type { PlayerGeneral, SuperWeaponCheck } from '../General';

export const MARKET_FLOOD_COST = {
  capital: 4000,
  food: 60,
} as const;

/** 🛒 قيصر التجزئة */
export class RetailCaesar implements PlayerGeneral {
  readonly id = 'retail_caesar' as const;
  readonly nameAr = 'قيصر التجزئة';
  readonly titleAr = 'إغراق الأسواق ببضاعة رخيصة';
  readonly superWeaponNameAr = 'الإغراق الكامل';

  private used = false;

  getInvestBonus(_country: Country): number {
    return 6;
  }

  getFactoryBonus(): number {
    return 14;
  }

  getLoanBonus(): number {
    return 10;
  }

  canUseSuperWeapon(
    country: Country,
    unitAtCountry: boolean,
    resources: ResourceManager,
  ): SuperWeaponCheck {
    if (this.used) return { ok: false, reason: 'تم استخدام الإغراق مسبقاً' };
    if (!unitAtCountry) return { ok: false, reason: 'يجب أن يكون المحلل في الدولة' };
    if (country.playerInfluence < 30) {
      return { ok: false, reason: 'تحتاج 30% نفوذ على الأقل' };
    }
    if (!resources.canAfford(MARKET_FLOOD_COST)) {
      return { ok: false, reason: '4000 رأس مال + 60 غذاء' };
    }
    return { ok: true };
  }

  executeSuperWeapon(
    country: Country,
    resources: ResourceManager,
    _allCountries: Map<string, Country>,
  ): boolean {
    if (!resources.spend(MARKET_FLOOD_COST)) return false;
    this.used = true;
    country.applyMarketFlood();
    return true;
  }

  isMapWideSuperWeapon(): boolean {
    return false;
  }

  isSuperWeaponAvailable(): boolean {
    return !this.used;
  }
}
