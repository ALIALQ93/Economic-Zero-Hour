import { Vector3 } from '@babylonjs/core';
import type { Country } from '../map/Country';
import type { TradeRouteManager } from '../map/TradeRouteManager';
import type { UnitManager } from '../units/UnitManager';
import { AnalystAI } from './levels/AnalystAI';
import { ConsultantAI } from './levels/ConsultantAI';
import type { AiActionResult, AiLevel, AiOpponent } from './types';

export type { AiActionResult, AiLevel } from './types';

const LEVEL_LABELS: Record<AiLevel, string> = {
  1: 'المحلل',
  2: 'المستشار',
};

export class AIController {
  private readonly opponent: AiOpponent;

  constructor(
    level: AiLevel,
    countries: Map<string, Country>,
    units: UnitManager,
    tradeRoutes: TradeRouteManager,
    getCountryPosition: (id: string) => Vector3 | null,
  ) {
    this.opponent =
      level === 2
        ? new ConsultantAI(countries, units, tradeRoutes, getCountryPosition)
        : new AnalystAI(countries, units, getCountryPosition);
  }

  get level(): AiLevel {
    return this.opponent.level;
  }

  get levelLabelAr(): string {
    return LEVEL_LABELS[this.opponent.level];
  }

  onGameTick(): AiActionResult | null {
    return this.opponent.onGameTick();
  }

  recordPlayerAction(countryId: string): void {
    this.opponent.recordPlayerAction?.(countryId);
  }
}
