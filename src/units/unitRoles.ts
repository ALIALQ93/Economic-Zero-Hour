import type { InfluenceAction } from '../influence/InfluenceSystem';

export type UnitRole = 'analyst' | 'loan_advisor';

export const ACTIONS_BY_ROLE: Record<UnitRole, InfluenceAction[]> = {
  analyst: ['invest', 'factory'],
  loan_advisor: ['loan'],
};

export const RECRUIT_LOAN_ADVISOR_COST = {
  capital: 2000,
  metals: 30,
} as const;

export const LOAN_ADVISOR_BONUS = 10;

export function unitCanPerform(role: UnitRole, action: InfluenceAction): boolean {
  return ACTIONS_BY_ROLE[role].includes(action);
}

export function getRoleLabel(role: UnitRole): string {
  return role === 'analyst' ? 'محلل' : 'مستشار قرض';
}
