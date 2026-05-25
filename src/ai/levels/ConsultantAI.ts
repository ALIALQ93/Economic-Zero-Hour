import { Vector3 } from '@babylonjs/core';
import type { Country } from '../../map/Country';
import type { RegionId } from '../../map/maps/medium-map';
import type { TradeRouteManager } from '../../map/TradeRouteManager';
import { CUT_TRADE_MIN_INFLUENCE } from '../../map/TradeRouteManager';
import type { UnitManager } from '../../units/UnitManager';
import { INFLUENCE_ACTIONS } from '../../influence/InfluenceSystem';
import { LOAN_ADVISOR_BONUS } from '../../units/unitRoles';
import type { AiActionResult, AiOpponent } from '../types';

const STRATEGIC_TARGETS = [
  'zahiran',
  'qaseria',
  'miras',
  'portica',
  'freeport',
  'kalmera',
  'northam',
  'steelmark',
  'copanga',
  'sirania',
];

const PLAYER_FOCUS_MAX = 5;

/** مستوى 2 — المستشار: يتكيف مع نفوذ اللاعب ويضغط على مناطقه */
export class ConsultantAI implements AiOpponent {
  readonly level = 2 as const;

  private tickCounter = 0;
  private step = 0;
  private readonly playerRecent = new Set<string>();

  constructor(
    private countries: Map<string, Country>,
    private units: UnitManager,
    private tradeRoutes: TradeRouteManager,
    private getCountryPosition: (id: string) => Vector3 | null,
  ) {}

  recordPlayerAction(countryId: string): void {
    this.playerRecent.add(countryId);
    if (this.playerRecent.size > PLAYER_FOCUS_MAX) {
      const first = this.playerRecent.values().next().value;
      if (first) this.playerRecent.delete(first);
    }
  }

  onGameTick(): AiActionResult | null {
    this.tickCounter++;
    const interval = this.playerIsAhead() ? 1 : 2;
    if (this.tickCounter < interval) return null;
    this.tickCounter = 0;
    this.step++;

    const target = this.pickTarget();
    if (!target) return null;

    const action = this.pickAction(target);
    return this.executeAction(target, action);
  }

  private pickAction(target: Country): AiActionResult['actionType'] {
    if (this.step % 7 === 6) {
      const cut = this.tryCutTrade(target);
      if (cut) return 'cut_trade';
    }

    if (this.step % 4 === 3 && target.playerInfluence >= 30) {
      return 'factory';
    }

    if (target.playerInfluence > target.aiInfluence + 5) {
      return 'loan';
    }

    return this.step % 2 === 0 ? 'invest' : 'loan';
  }

  private executeAction(
    target: Country,
    action: AiActionResult['actionType'],
  ): AiActionResult | null {
    if (action === 'cut_trade') {
      const n = this.cutTradeAt(target.id);
      if (n === 0) return this.fallbackInvest(target);
      this.moveUnit('ai_analyst', target.id, -0.5);
      return {
        countryId: target.id,
        countryName: target.displayName,
        actionType: 'cut_trade',
      };
    }

    if (action === 'factory') {
      target.addAiInfluence(INFLUENCE_ACTIONS.factory);
      if (target.playerInfluence >= 35) {
        target.addPlayerInfluence(-3);
      }
      this.moveUnit('ai_analyst', target.id, -0.5);
      return {
        countryId: target.id,
        countryName: target.displayName,
        actionType: 'factory',
      };
    }

    if (action === 'loan') {
      target.addAiInfluence(LOAN_ADVISOR_BONUS);
      this.moveUnit('ai_loan_advisor', target.id, 0.5);
      return {
        countryId: target.id,
        countryName: target.displayName,
        actionType: 'loan',
      };
    }

    target.addAiInfluence(INFLUENCE_ACTIONS.invest + 1);
    this.moveUnit('ai_analyst', target.id, -0.5);
    return {
      countryId: target.id,
      countryName: target.displayName,
      actionType: 'invest',
    };
  }

  private fallbackInvest(target: Country): AiActionResult {
    target.addAiInfluence(INFLUENCE_ACTIONS.invest);
    this.moveUnit('ai_analyst', target.id, -0.5);
    return {
      countryId: target.id,
      countryName: target.displayName,
      actionType: 'invest',
    };
  }

  private tryCutTrade(target: Country): boolean {
    return this.cutTradeAt(target.id) > 0;
  }

  private cutTradeAt(countryId: string): number {
    const country = this.countries.get(countryId);
    if (!country || country.aiInfluence < CUT_TRADE_MIN_INFLUENCE) return 0;
    if (!this.tradeRoutes.canAiCutAtCountry(countryId, country.aiInfluence)) return 0;
    return this.tradeRoutes.cutRoutesAtCountry(countryId, this.countries).length;
  }

  private playerIsAhead(): boolean {
    let player = 0;
    let ai = 0;
    for (const c of this.countries.values()) {
      player += c.playerInfluence;
      ai += c.aiInfluence;
    }
    return player > ai + 40;
  }

  private getPlayerStrongRegions(): Set<RegionId> {
    const byRegion = new Map<RegionId, { player: number; count: number }>();
    for (const c of this.countries.values()) {
      const r = c.def.region;
      const entry = byRegion.get(r) ?? { player: 0, count: 0 };
      if (c.playerInfluence >= 50 && c.playerInfluence > c.aiInfluence) {
        entry.player++;
      }
      entry.count++;
      byRegion.set(r, entry);
    }
    const strong = new Set<RegionId>();
    for (const [region, { player, count }] of byRegion) {
      if (player >= 2 || (count <= 4 && player >= 1 && player >= count - 1)) {
        strong.add(region);
      }
    }
    return strong;
  }

  private scoreCountry(c: Country, strongRegions: Set<RegionId>): number {
    if (c.aiInfluence >= 75 || c.isEconomicallyDisrupted()) return -1000;

    let score = (60 - c.aiInfluence) * 0.35;
    const contest = c.playerInfluence - c.aiInfluence;

    if (c.playerInfluence >= 25 && contest > 0) {
      score += 18 + contest * 0.45;
    }

    if (this.playerRecent.has(c.id)) score += 22;

    if (strongRegions.has(c.def.region)) score += 14;

    if (STRATEGIC_TARGETS.includes(c.id)) score += 6;

    if (c.playerInfluence >= 70 && c.playerInfluence > c.aiInfluence) {
      score += 12;
    }

    return score;
  }

  private pickTarget(): Country | undefined {
    const strongRegions = this.getPlayerStrongRegions();
    const candidates = [...this.countries.values()].filter(
      (c) => c.aiInfluence < 72 && !c.isEconomicallyDisrupted(),
    );

    if (candidates.length === 0) return undefined;

    candidates.sort(
      (a, b) => this.scoreCountry(b, strongRegions) - this.scoreCountry(a, strongRegions),
    );

    const pool = candidates.filter((c) => this.scoreCountry(c, strongRegions) > 0).slice(0, 4);
    if (pool.length === 0) return candidates[0];
    return pool[Math.floor(Math.random() * pool.length)];
  }

  private moveUnit(unitId: string, countryId: string, xOffset: number): void {
    const unit = this.units.getUnit(unitId);
    const pos = this.getCountryPosition(countryId);
    if (unit && pos) {
      const dest = pos.clone();
      dest.y += 0.55;
      dest.x += xOffset;
      unit.orderMoveTo(dest, countryId);
    }
  }
}
