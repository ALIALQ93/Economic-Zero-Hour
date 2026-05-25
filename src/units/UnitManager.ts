import { Vector3 } from '@babylonjs/core';
import { createAiAnalyst, createPlayerAnalyst } from './FinancialAnalyst';
import { createAiLoanAdvisor, createPlayerLoanAdvisor } from './LoanAdvisor';
import type { Unit } from './Unit';
import type { ResourceManager } from '../resources/ResourceManager';
import { RECRUIT_LOAN_ADVISOR_COST } from './unitRoles';

const PLAYER_HQ = 'northam';
const AI_HQ = 'zahiran';

export class UnitManager {
  readonly units: Unit[] = [];
  selectedUnitId: string | null = null;
  playerLoanAdvisorHired = false;
  private getCountryPosition: (id: string) => Vector3 | null = () => null;

  setCountryPositionResolver(fn: (id: string) => Vector3 | null): void {
    this.getCountryPosition = fn;
  }

  spawnStartingUnits(): void {
    const playerPos = this.getCountryPosition(PLAYER_HQ);
    const aiPos = this.getCountryPosition(AI_HQ);

    if (playerPos) {
      const start = playerPos.clone();
      start.x -= 0.9;
      start.y += 0.55;
      const u = createPlayerAnalyst(start, PLAYER_HQ);
      u.selected = true;
      this.selectedUnitId = u.id;
      this.units.push(u);
    }

    if (aiPos) {
      const analystStart = aiPos.clone();
      analystStart.x -= 0.9;
      analystStart.y += 0.55;
      this.units.push(createAiAnalyst(analystStart, AI_HQ));

      const loanStart = aiPos.clone();
      loanStart.x += 0.9;
      loanStart.y += 0.55;
      this.units.push(createAiLoanAdvisor(loanStart, AI_HQ));
    }
  }

  hasPlayerLoanAdvisor(): boolean {
    return this.units.some((u) => u.id === 'player_loan_advisor');
  }

  recruitLoanAdvisor(resources: ResourceManager): Unit | null {
    if (this.playerLoanAdvisorHired || this.hasPlayerLoanAdvisor()) return null;
    if (!resources.spend(RECRUIT_LOAN_ADVISOR_COST)) return null;

    const pos = this.getCountryPosition(PLAYER_HQ);
    if (!pos) return null;

    const start = pos.clone();
    start.x += 0.9;
    start.y += 0.55;
    const advisor = createPlayerLoanAdvisor(start, PLAYER_HQ);
    this.units.push(advisor);
    this.playerLoanAdvisorHired = true;
    return advisor;
  }

  getUnit(id: string): Unit | undefined {
    return this.units.find((u) => u.id === id);
  }

  getPlayerUnits(): Unit[] {
    return this.units.filter((u) => u.faction === 'player');
  }

  getSelectedUnit(): Unit | undefined {
    if (!this.selectedUnitId) return undefined;
    return this.getUnit(this.selectedUnitId);
  }

  selectUnit(id: string | null): Unit | undefined {
    for (const u of this.units) {
      u.selected = u.id === id && u.faction === 'player';
    }
    this.selectedUnitId = id;
    return this.getSelectedUnit();
  }

  orderPlayerToCountry(countryId: string): boolean {
    const unit = this.getSelectedUnit();
    if (!unit || unit.busy) return false;

    const pos = this.getCountryPosition(countryId);
    if (!pos) return false;

    const dest = pos.clone();
    dest.y += 0.55;
    if (unit.role === 'loan_advisor') dest.x += 0.5;
    else dest.x -= 0.5;

    unit.orderMoveTo(dest, countryId);
    return true;
  }

  update(deltaMs: number): Unit[] {
    const arrived: Unit[] = [];
    for (const unit of this.units) {
      if (unit.update(deltaMs)) {
        arrived.push(unit);
      }
    }
    return arrived;
  }
}
