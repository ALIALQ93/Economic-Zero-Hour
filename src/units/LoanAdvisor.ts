import { Vector3 } from '@babylonjs/core';
import { Unit, type UnitDef } from './Unit';

const PLAYER_LOAN_ADVISOR: UnitDef = {
  id: 'player_loan_advisor',
  nameAr: 'مستشار القرض',
  faction: 'player',
  speed: 5,
  role: 'loan_advisor',
};

const AI_LOAN_ADVISOR: UnitDef = {
  id: 'ai_loan_advisor',
  nameAr: 'مستشار قرض الخصم',
  faction: 'ai',
  speed: 4.5,
  role: 'loan_advisor',
};

export function createPlayerLoanAdvisor(position: Vector3, countryId: string): Unit {
  return new Unit(PLAYER_LOAN_ADVISOR, position, countryId);
}

export function createAiLoanAdvisor(position: Vector3, countryId: string): Unit {
  return new Unit(AI_LOAN_ADVISOR, position, countryId);
}
