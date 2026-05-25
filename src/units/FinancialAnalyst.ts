import { Vector3 } from '@babylonjs/core';
import { Unit, type UnitDef } from './Unit';

const PLAYER_ANALYST: UnitDef = {
  id: 'player_analyst',
  nameAr: 'المحلل المالي',
  faction: 'player',
  speed: 6,
  role: 'analyst',
};

const AI_ANALYST: UnitDef = {
  id: 'ai_analyst',
  nameAr: 'محلل الخصم',
  faction: 'ai',
  speed: 5,
  role: 'analyst',
};

export function createPlayerAnalyst(position: Vector3, countryId: string): Unit {
  return new Unit(PLAYER_ANALYST, position, countryId);
}

export function createAiAnalyst(position: Vector3, countryId: string): Unit {
  return new Unit(AI_ANALYST, position, countryId);
}
