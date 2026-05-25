import type { Country } from '../map/Country';
import type { ResourceManager } from '../resources/ResourceManager';

export type GeneralId =
  | 'smart_investor'
  | 'tech_king'
  | 'retail_caesar'
  | 'debt_hunter'
  | 'market_mover'
  | 'oil_prince'
  | 'sovereign_shadow'
  | 'food_lord'
  | 'metal_king';

export interface SuperWeaponCheck {
  ok: boolean;
  reason?: string;
}

export interface PlayerGeneral {
  readonly id: GeneralId;
  readonly nameAr: string;
  readonly titleAr: string;
  readonly superWeaponNameAr: string;

  getInvestBonus(country: Country): number;
  getFactoryBonus(): number;
  getLoanBonus(): number;
  canUseSuperWeapon(
    country: Country,
    unitAtCountry: boolean,
    resources: ResourceManager,
  ): SuperWeaponCheck;
  executeSuperWeapon(
    country: Country,
    resources: ResourceManager,
    allCountries: Map<string, Country>,
  ): boolean;
  isMapWideSuperWeapon(): boolean;
  isSuperWeaponAvailable(): boolean;
}
