import type { Country } from '../../map/Country';
import type { ResourceManager } from '../../resources/ResourceManager';
import type { PlayerGeneral, SuperWeaponCheck } from '../General';

export const DIGITAL_PARALYSIS_COST = {
  capital: 3500,
  metals: 40,
} as const;

/** 💻 ملك التكنولوجيا */
export class TechKing implements PlayerGeneral {
  readonly id = 'tech_king' as const;
  readonly nameAr = 'ملك التكنولوجيا';
  readonly titleAr = 'السيطرة عبر البيانات والمنصات';
  readonly superWeaponNameAr = 'الشلل الرقمي';

  private used = false;

  getInvestBonus(country: Country): number {
    return country.def.region === 'north' ? 9 : 5;
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
    if (this.used) return { ok: false, reason: 'تم استخدام الشلل الرقمي مسبقاً' };
    if (!unitAtCountry) return { ok: false, reason: 'يجب أن يكون المحلل في الدولة' };
    if (country.playerInfluence < 20) {
      return { ok: false, reason: 'تحتاج 20% نفوذ على الأقل' };
    }
    if (!resources.canAfford(DIGITAL_PARALYSIS_COST)) {
      return { ok: false, reason: '3500 رأس مال + 40 معادن' };
    }
    return { ok: true };
  }

  executeSuperWeapon(
    country: Country,
    resources: ResourceManager,
    _allCountries: Map<string, Country>,
  ): boolean {
    if (!resources.spend(DIGITAL_PARALYSIS_COST)) return false;
    this.used = true;
    country.applyDigitalParalysis();
    return true;
  }

  isMapWideSuperWeapon(): boolean {
    return false;
  }

  isSuperWeaponAvailable(): boolean {
    return !this.used;
  }
}
