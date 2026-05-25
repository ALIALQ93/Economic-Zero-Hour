import type { Country } from '../../map/Country';
import type { ResourceManager } from '../../resources/ResourceManager';
import type { PlayerGeneral, SuperWeaponCheck } from '../General';

export const SOVEREIGN_TRAP_COST = {
  capital: 4500,
  metals: 50,
} as const;

/** 🪤 صياد الديون — فصيل البنوك */
export class DebtHunter implements PlayerGeneral {
  readonly id = 'debt_hunter' as const;
  readonly nameAr = 'صياد الديون';
  readonly titleAr = 'قروض مغرية تتحول لأغلال';
  readonly superWeaponNameAr = 'الفخ السيادي';

  private used = false;

  getInvestBonus(_country: Country): number {
    return 5;
  }

  getFactoryBonus(): number {
    return 12;
  }

  getLoanBonus(): number {
    return 12;
  }

  canUseSuperWeapon(
    country: Country,
    unitAtCountry: boolean,
    resources: ResourceManager,
  ): SuperWeaponCheck {
    if (this.used) return { ok: false, reason: 'تم استخدام الفخ السيادي مسبقاً' };
    if (!unitAtCountry) return { ok: false, reason: 'يجب أن يكون المحلل في الدولة' };
    if (country.playerInfluence < 25) {
      return { ok: false, reason: 'تحتاج 25% نفوذ على الأقل' };
    }
    if (!resources.canAfford(SOVEREIGN_TRAP_COST)) {
      return { ok: false, reason: '4500 رأس مال + 50 معادن' };
    }
    return { ok: true };
  }

  executeSuperWeapon(
    country: Country,
    resources: ResourceManager,
    _allCountries: Map<string, Country>,
  ): boolean {
    if (!resources.spend(SOVEREIGN_TRAP_COST)) return false;
    this.used = true;
    country.applyDebtTrap();
    return true;
  }

  isMapWideSuperWeapon(): boolean {
    return false;
  }

  isSuperWeaponAvailable(): boolean {
    return !this.used;
  }
}
