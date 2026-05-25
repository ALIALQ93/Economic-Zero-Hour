import type { Country } from './Country';
import { TRADE_ROUTES } from './tradeRoutes';

export const CUT_TRADE_COST = { capital: 600 } as const;
export const CUT_TRADE_MIN_INFLUENCE = 40;

export class TradeRouteManager {
  readonly severed = new Set<string>();

  getRoutesForCountry(countryId: string): typeof TRADE_ROUTES {
    return TRADE_ROUTES.filter(
      (r) => (r.from === countryId || r.to === countryId) && !this.severed.has(r.id),
    );
  }

  canCutAtCountry(countryId: string, playerInfluence: number): boolean {
    return playerInfluence >= CUT_TRADE_MIN_INFLUENCE && this.getRoutesForCountry(countryId).length > 0;
  }

  canAiCutAtCountry(countryId: string, aiInfluence: number): boolean {
    return aiInfluence >= CUT_TRADE_MIN_INFLUENCE && this.getRoutesForCountry(countryId).length > 0;
  }

  cutRoutesAtCountry(countryId: string, countries: Map<string, Country>): string[] {
    const cut: string[] = [];
    for (const route of this.getRoutesForCountry(countryId)) {
      this.severed.add(route.id);
      cut.push(route.id);
      this.applyCutShock(countries, route.from, route.to);
    }
    return cut;
  }

  private applyCutShock(countries: Map<string, Country>, fromId: string, toId: string): void {
    for (const id of [fromId, toId]) {
      countries.get(id)?.applyTradeShock();
    }
  }

  getSeveredCount(): number {
    return this.severed.size;
  }

  isSevered(routeId: string): boolean {
    return this.severed.has(routeId);
  }
}
