import type { Country } from '../../map/Country';
import type { ResourceManager } from '../../resources/ResourceManager';
import type { PlayerGeneral, SuperWeaponCheck } from '../General';

export const QUIET_COUP_COST = {
  capital: 3800,
  metals: 30,
} as const;

/** 👤 الظل السيادي — فصيل البنوك */
export class SovereignShadow implements PlayerGeneral {
  readonly id = 'sovereign_shadow' as const;
  readonly nameAr = 'الظل السيادي';
  readonly titleAr = 'نفوذ سياسي خفي لا يُرى';
  readonly superWeaponNameAr = 'الانقلاب الهادئ';

  private used = false;

  getInvestBonus(country: Country): number {
    if (country.def.region === 'south' || country.def.id === 'havaria') return 10;
    return 6;
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
    if (this.used) return { ok: false, reason: 'تم الانقلاب الهادئ مسبقاً' };
    if (!unitAtCountry) return { ok: false, reason: 'يجب أن يكون المحلل في الدولة' };
    if (country.playerInfluence < 20) {
      return { ok: false, reason: 'تحتاج 20% نفوذ خفي على الأقل' };
    }
    if (country.aiInfluence < 10) {
      return { ok: false, reason: 'لا توجد حكومة قابلة للانقلاب' };
    }
    if (!resources.canAfford(QUIET_COUP_COST)) {
      return { ok: false, reason: '3800 رأس مال + 30 معادن' };
    }
    return { ok: true };
  }

  isMapWideSuperWeapon(): boolean {
    return false;
  }

  executeSuperWeapon(
    country: Country,
    resources: ResourceManager,
    _allCountries: Map<string, Country>,
  ): boolean {
    if (!resources.spend(QUIET_COUP_COST)) return false;
    this.used = true;
    country.applyQuietCoup();
    return true;
  }

  isSuperWeaponAvailable(): boolean {
    return !this.used;
  }
}
