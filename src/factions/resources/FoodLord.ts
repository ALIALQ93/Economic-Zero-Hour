import type { Country } from '../../map/Country';
import type { ResourceManager } from '../../resources/ResourceManager';
import type { PlayerGeneral, SuperWeaponCheck } from '../General';

export const MANAGED_FAMINE_COST = {
  capital: 3500,
  food: 50,
} as const;

/** 🌾 سيد الغذاء — فصيل الموارد */
export class FoodLord implements PlayerGeneral {
  readonly id = 'food_lord' as const;
  readonly nameAr = 'سيد الغذاء';
  readonly titleAr = 'الحصار الغذائي الصامت';
  readonly superWeaponNameAr = 'المجاعة المُدارة';

  private used = false;

  getInvestBonus(country: Country): number {
    return country.def.region === 'south' ? 9 : 5;
  }

  getFactoryBonus(): number {
    return 10;
  }

  getLoanBonus(): number {
    return 10;
  }

  canUseSuperWeapon(
    country: Country,
    unitAtCountry: boolean,
    resources: ResourceManager,
  ): SuperWeaponCheck {
    if (this.used) return { ok: false, reason: 'تمت المجاعة المُدارة مسبقاً' };
    if (!unitAtCountry) return { ok: false, reason: 'يجب أن يكون المحلل في القارة الجنوبية' };
    if (country.def.region !== 'south') {
      return { ok: false, reason: 'يجب التواجد في القارة الجنوبية' };
    }
    if (country.playerInfluence < 25) {
      return { ok: false, reason: 'تحتاج 25% نفوذ في الدولة' };
    }
    if (!resources.canAfford(MANAGED_FAMINE_COST)) {
      return { ok: false, reason: '3500 رأس مال + 50 غذاء' };
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
    if (!resources.spend(MANAGED_FAMINE_COST)) return false;
    this.used = true;

    for (const c of allCountries.values()) {
      if (c.def.region === 'south') {
        c.applyFoodEmbargoWave();
      } else {
        c.addPlayerInfluence(-2);
        c.addAiInfluence(3);
      }
    }
    resources.addBonus({ food: 120 });
    return true;
  }

  isSuperWeaponAvailable(): boolean {
    return !this.used;
  }
}
