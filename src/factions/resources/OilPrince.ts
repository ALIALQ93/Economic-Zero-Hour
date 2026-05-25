import type { Country } from '../../map/Country';
import type { ResourceManager } from '../../resources/ResourceManager';
import type { PlayerGeneral, SuperWeaponCheck } from '../General';

export const OIL_SHOCK_COST = {
  capital: 4000,
  oil: 80,
} as const;

/** 🛢️ أمير النفط — فصيل الموارد */
export class OilPrince implements PlayerGeneral {
  readonly id = 'oil_prince' as const;
  readonly nameAr = 'أمير النفط';
  readonly titleAr = 'التحكم في شرايين الطاقة';
  readonly superWeaponNameAr = 'الصدمة النفطية';

  private used = false;

  getInvestBonus(country: Country): number {
    return country.def.region === 'oil_belt' ? 9 : 5;
  }

  getFactoryBonus(): number {
    return 11;
  }

  getLoanBonus(): number {
    return 10;
  }

  canUseSuperWeapon(
    country: Country,
    unitAtCountry: boolean,
    resources: ResourceManager,
  ): SuperWeaponCheck {
    if (this.used) return { ok: false, reason: 'تمت الصدمة النفطية مسبقاً' };
    if (!unitAtCountry) return { ok: false, reason: 'يجب أن يكون المحلل في الحزام النفطي' };
    if (country.def.region !== 'oil_belt') {
      return { ok: false, reason: 'يجب التواجد في دولة من الحزام النفطي' };
    }
    if (country.playerInfluence < 25) {
      return { ok: false, reason: 'تحتاج 25% نفوذ في الدولة' };
    }
    if (!resources.canAfford(OIL_SHOCK_COST)) {
      return { ok: false, reason: '4000 رأس مال + 80 نفط' };
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
    if (!resources.spend(OIL_SHOCK_COST)) return false;
    this.used = true;

    for (const c of allCountries.values()) {
      c.applyOilShockWave();
    }
    resources.addBonus({ oil: 250 });
    return true;
  }

  isSuperWeaponAvailable(): boolean {
    return !this.used;
  }
}
