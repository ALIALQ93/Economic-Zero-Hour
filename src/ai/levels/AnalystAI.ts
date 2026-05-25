import { Vector3 } from '@babylonjs/core';
import type { Country } from '../../map/Country';
import type { UnitManager } from '../../units/UnitManager';
import { INFLUENCE_ACTIONS } from '../../influence/InfluenceSystem';
import { LOAN_ADVISOR_BONUS } from '../../units/unitRoles';
import type { AiActionResult, AiOpponent } from '../types';

/** مستوى 1 — المحلل: أهداف ثابتة، استثمار/قرض بالتناوب */
const AI_TARGETS = ['zahiran', 'qaseria', 'miras', 'portica', 'freeport', 'kalmera'];

export class AnalystAI implements AiOpponent {
  readonly level = 1 as const;

  private tickCounter = 0;
  private readonly ticksBetweenActions = 2;
  private useLoan = false;

  constructor(
    private countries: Map<string, Country>,
    private units: UnitManager,
    private getCountryPosition: (id: string) => Vector3 | null,
  ) {}

  onGameTick(): AiActionResult | null {
    this.tickCounter++;
    if (this.tickCounter < this.ticksBetweenActions) return null;
    this.tickCounter = 0;

    const target = this.pickTarget();
    if (!target) return null;

    this.useLoan = !this.useLoan;

    if (this.useLoan) {
      target.addAiInfluence(LOAN_ADVISOR_BONUS - 2);
      this.moveUnit('ai_loan_advisor', target.id, 0.5);
      return { countryId: target.id, countryName: target.displayName, actionType: 'loan' };
    }

    target.addAiInfluence(INFLUENCE_ACTIONS.invest);
    this.moveUnit('ai_analyst', target.id, -0.5);
    return { countryId: target.id, countryName: target.displayName, actionType: 'invest' };
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

  private pickTarget(): Country | undefined {
    const candidates = AI_TARGETS.map((id) => this.countries.get(id)).filter(
      (c): c is Country => !!c && c.aiInfluence < 60 && !c.isEconomicallyDisrupted(),
    );

    if (candidates.length === 0) return undefined;

    candidates.sort((a, b) => a.aiInfluence - b.aiInfluence);
    const pool = candidates.slice(0, 3);
    return pool[Math.floor(Math.random() * pool.length)];
  }
}
