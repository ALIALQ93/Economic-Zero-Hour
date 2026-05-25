import type { Country } from '../../map/Country';
import type { ResourceManager } from '../../resources/ResourceManager';
import type { PlayerGeneral, SuperWeaponCheck } from '../General';

export const FULL_ACQUISITION_COST = {
  capital: 5000,
  metals: 80,
} as const;

/** 💼 المستثمر الذكي */
export class SmartInvestor implements PlayerGeneral {
  readonly id = 'smart_investor' as const;
  readonly nameAr = 'المستثمر الذكي';
  readonly titleAr = 'الاستحواذ التدريجي الصبور';
  readonly superWeaponNameAr = 'الاستحواذ الكامل';

  private used = false;

  getInvestBonus(_country: Country): number {
    return 7;
  }

  getFactoryBonus(): number {
    return 12;
  }

  getLoanBonus(): number {
    return 10;
  }

  canUseSuperWeapon(
    country: Country,
    unitAtCountry: boolean,
    resources: ResourceManager,
  ): SuperWeaponCheck {
    if (this.used) return { ok: false, reason: 'تم استخدام السلاح مسبقاً' };
    if (!unitAtCountry) return { ok: false, reason: 'يجب أن يكون المحلل في الدولة' };
    if (country.playerInfluence < 25) {
      return { ok: false, reason: 'تحتاج 25% نفوذ على الأقل' };
    }
    if (!resources.canAfford(FULL_ACQUISITION_COST)) {
      return { ok: false, reason: '5000 رأس مال + 80 معادن' };
    }
    return { ok: true };
  }

  executeSuperWeapon(
    country: Country,
    resources: ResourceManager,
    _allCountries: Map<string, Country>,
  ): boolean {
    if (!resources.spend(FULL_ACQUISITION_COST)) return false;
    this.used = true;
    country.setFullPlayerControl();
    return true;
  }

  isMapWideSuperWeapon(): boolean {
    return false;
  }

  isSuperWeaponAvailable(): boolean {
    return !this.used;
  }
}
