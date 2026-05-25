import { Country } from '../map/Country';
import { MEDIUM_MAP_COUNTRIES } from '../map/maps/medium-map';
import { ResourceManager } from '../resources/ResourceManager';
import type { InfluenceAction } from '../influence/InfluenceSystem';
import { ACTION_COSTS } from '../resources/ResourceManager';
import { INFLUENCE_ACTIONS } from '../influence/InfluenceSystem';
import { UnitManager } from '../units/UnitManager';
import { createGeneral } from '../factions/createGeneral';
import type { GeneralId, PlayerGeneral } from '../factions/General';
import { WinConditionChecker, type GameOutcome, type GameStatus } from '../game/WinConditionChecker';
import { unitCanPerform } from '../units/unitRoles';
import type { Unit } from '../units/Unit';
import { TradeRouteManager, CUT_TRADE_COST } from '../map/TradeRouteManager';

export const DEBT_TRAP_TICK_BONUS = 40;
export const OIL_BELT_TICK_BONUS = 10;
export const FOOD_SOUTH_TICK_BONUS = 8;
export const METAL_NORTH_TICK_BONUS = 7;
export const REGION_TICK_MIN_INFLUENCE = 40;

export class GameState {
  readonly resources = new ResourceManager();
  readonly countries = new Map<string, Country>();
  readonly units = new UnitManager();
  readonly general: PlayerGeneral;
  readonly winChecker = new WinConditionChecker();
  readonly tradeRoutes = new TradeRouteManager();

  selectedCountryId: string | null = null;
  hiddenLayer = false;
  gameOutcome: GameOutcome = 'playing';
  actionsCount = 0;

  constructor(generalId: GeneralId) {
    this.general = createGeneral(generalId);

    for (const def of MEDIUM_MAP_COUNTRIES) {
      this.countries.set(def.id, new Country(def));
    }
    this.countries.get('northam')?.addPlayerInfluence(15);
    this.countries.get('zahiran')?.addAiInfluence(10);
  }

  get isGameOver(): boolean {
    return this.gameOutcome !== 'playing';
  }

  getCountry(id: string): Country | undefined {
    return this.countries.get(id);
  }

  selectCountry(id: string | null): void {
    this.selectedCountryId = id;
  }

  canPerformAction(unit: Unit, action: InfluenceAction): boolean {
    return unitCanPerform(unit.role, action);
  }

  getInfluenceGain(unit: Unit, action: InfluenceAction, country: Country): number {
    if (action === 'invest') return this.general.getInvestBonus(country);
    if (action === 'factory') return this.general.getFactoryBonus();
    if (action === 'loan' && unit.role === 'loan_advisor') {
      return this.general.getLoanBonus();
    }
    return INFLUENCE_ACTIONS[action];
  }

  applyInfluenceAction(countryId: string, action: InfluenceAction): boolean {
    const country = this.countries.get(countryId);
    const unit = this.units.getSelectedUnit();
    if (!country || !unit || this.isGameOver) return false;
    if (unit.atCountryId !== countryId) return false;
    if (!this.canPerformAction(unit, action)) return false;

    const cost = ACTION_COSTS[action];
    if (!this.resources.spend(cost)) return false;

    country.addPlayerInfluence(this.getInfluenceGain(unit, action, country));
    this.actionsCount++;
    this.updateOutcome();
    return true;
  }

  cutTradeAtCountry(countryId: string): { ok: boolean; count: number } {
    const country = this.countries.get(countryId);
    const unit = this.units.getSelectedUnit();
    if (!country || !unit || this.isGameOver) return { ok: false, count: 0 };
    if (unit.atCountryId !== countryId) return { ok: false, count: 0 };

    if (!this.tradeRoutes.canCutAtCountry(countryId, country.playerInfluence)) {
      return { ok: false, count: 0 };
    }
    if (!this.resources.spend(CUT_TRADE_COST)) return { ok: false, count: 0 };

    const cut = this.tradeRoutes.cutRoutesAtCountry(countryId, this.countries);
    if (cut.length > 0) {
      this.actionsCount++;
    }
    return { ok: cut.length > 0, count: cut.length };
  }

  getTradeSeverancePenalty(): { oil: number; food: number } {
    const n = this.tradeRoutes.getSeveredCount();
    if (n < 4) return { oil: 0, food: 0 };
    return { oil: Math.min(8, n - 3), food: Math.min(5, n - 3) };
  }

  getDebtTrapBonus(): number {
    let n = 0;
    for (const c of this.countries.values()) {
      if (c.debtTrapped) n++;
    }
    return n * DEBT_TRAP_TICK_BONUS;
  }

  getOilBeltTickBonus(): number {
    if (this.general.id !== 'oil_prince') return 0;
    let oil = 0;
    for (const c of this.countries.values()) {
      if (
        c.def.region === 'oil_belt' &&
        c.playerInfluence >= REGION_TICK_MIN_INFLUENCE &&
        c.playerInfluence > c.aiInfluence
      ) {
        oil += OIL_BELT_TICK_BONUS;
      }
    }
    return oil;
  }

  getFoodSouthTickBonus(): number {
    if (this.general.id !== 'food_lord') return 0;
    let food = 0;
    for (const c of this.countries.values()) {
      if (
        c.def.region === 'south' &&
        c.playerInfluence >= REGION_TICK_MIN_INFLUENCE &&
        c.playerInfluence > c.aiInfluence
      ) {
        food += FOOD_SOUTH_TICK_BONUS;
      }
    }
    return food;
  }

  getMetalNorthTickBonus(): number {
    if (this.general.id !== 'metal_king') return 0;
    let metals = 0;
    for (const c of this.countries.values()) {
      if (
        c.def.region === 'north' &&
        c.playerInfluence >= REGION_TICK_MIN_INFLUENCE &&
        c.playerInfluence > c.aiInfluence
      ) {
        metals += METAL_NORTH_TICK_BONUS;
      }
    }
    return metals;
  }

  recruitLoanAdvisor(): Unit | null {
    if (this.isGameOver) return null;
    return this.units.recruitLoanAdvisor(this.resources);
  }

  applySuperWeapon(countryId: string): boolean {
    const country = this.countries.get(countryId);
    const unit = this.units.getSelectedUnit();
    if (!country || !unit || this.isGameOver) return false;
    if (unit.role !== 'analyst') return false;

    const check = this.general.canUseSuperWeapon(
      country,
      unit.atCountryId === countryId,
      this.resources,
    );
    if (!check.ok) return false;

    const ok = this.general.executeSuperWeapon(country, this.resources, this.countries);
    if (ok) {
      this.actionsCount++;
      this.updateOutcome();
    }
    return ok;
  }

  getGameStatus(): GameStatus {
    return this.winChecker.evaluate(this.countries, this.resources.get().capital);
  }

  private updateOutcome(): void {
    const status = this.getGameStatus();
    if (status.outcome !== 'playing') {
      this.gameOutcome = status.outcome;
    }
  }

  checkPassiveLoss(): void {
    if (this.isGameOver) return;
    this.updateOutcome();
  }

  toggleHiddenLayer(): boolean {
    this.hiddenLayer = !this.hiddenLayer;
    return this.hiddenLayer;
  }
}
