import type { Country } from '../map/Country';
import type { RegionId } from '../map/maps/medium-map';
import { MEDIUM_MAP_COUNTRIES } from '../map/maps/medium-map';
import { REGIONS, INFLUENCE_TO_CONTROL } from '../map/regions';

export type GameOutcome =
  | 'playing'
  | 'win_partial'
  | 'win_absolute'
  | 'loss_bankruptcy'
  | 'loss_dominated';

export interface RegionStatus {
  id: RegionId;
  nameAr: string;
  total: number;
  controlled: number;
  progressPct: number;
  fullyControlled: boolean;
}

export interface GameStatus {
  outcome: GameOutcome;
  regions: RegionStatus[];
  controlledCountries: number;
  message: string;
}

function isPlayerControlled(country: Country): boolean {
  return (
    country.playerInfluence >= INFLUENCE_TO_CONTROL &&
    country.playerInfluence > country.aiInfluence
  );
}

function isAiControlled(country: Country): boolean {
  return (
    country.aiInfluence >= INFLUENCE_TO_CONTROL &&
    country.aiInfluence > country.playerInfluence
  );
}

export class WinConditionChecker {
  evaluate(countries: Map<string, Country>, capital: number): GameStatus {
    const regions = this.buildRegionStatus(countries);
    const controlledCountries = [...countries.values()].filter(isPlayerControlled).length;
    const aiControlledRegions = regions.filter((r) => {
      const defs = MEDIUM_MAP_COUNTRIES.filter((c) => c.region === r.id);
      return defs.every((d) => {
        const c = countries.get(d.id);
        return c && isAiControlled(c);
      });
    }).length;

    const fullyControlledRegions = regions.filter((r) => r.fullyControlled).length;

    if (capital <= 0) {
      return {
        outcome: 'loss_bankruptcy',
        regions,
        controlledCountries,
        message: 'الإفلاس — نفد رأس المال وانهار إمبراطوريتك.',
      };
    }

    if (aiControlledRegions >= 2) {
      return {
        outcome: 'loss_dominated',
        regions,
        controlledCountries,
        message: 'الخصم سيطر على منطقتين — أصبحت دخيلاً في العالم.',
      };
    }

    if (fullyControlledRegions >= 2 || controlledCountries >= 6) {
      return {
        outcome: 'win_absolute',
        regions,
        controlledCountries,
        message: 'فوز مطلق — الاحتكار الإقليمي تحقق.',
      };
    }

    if (fullyControlledRegions >= 1) {
      const region = regions.find((r) => r.fullyControlled)!;
      return {
        outcome: 'win_partial',
        regions,
        controlledCountries,
        message: `فوز جزئي — السيطرة الكاملة على ${region.nameAr}.`,
      };
    }

    return {
      outcome: 'playing',
      regions,
      controlledCountries,
      message: '',
    };
  }

  private buildRegionStatus(countries: Map<string, Country>): RegionStatus[] {
    return REGIONS.map((region) => {
      const defs = MEDIUM_MAP_COUNTRIES.filter((c) => c.region === region.id);
      const controlled = defs.filter((d) => {
        const c = countries.get(d.id);
        return c && isPlayerControlled(c);
      }).length;
      const progressPct = defs.length > 0 ? Math.round((controlled / defs.length) * 100) : 0;

      return {
        id: region.id,
        nameAr: region.nameAr,
        total: defs.length,
        controlled,
        progressPct,
        fullyControlled: controlled === defs.length && defs.length > 0,
      };
    });
  }
}
