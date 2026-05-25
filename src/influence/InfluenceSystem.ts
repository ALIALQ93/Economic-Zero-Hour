export enum InfluenceLevel {
  OUTSIDER = 'outsider',
  PARTNER = 'partner',
  DOMINANT = 'dominant',
  CONTROLLED = 'controlled',
}

export function getInfluenceLevel(pct: number): InfluenceLevel {
  if (pct >= 75) return InfluenceLevel.CONTROLLED;
  if (pct >= 50) return InfluenceLevel.DOMINANT;
  if (pct >= 25) return InfluenceLevel.PARTNER;
  return InfluenceLevel.OUTSIDER;
}

export function getInfluenceLabel(level: InfluenceLevel): string {
  const labels: Record<InfluenceLevel, string> = {
    [InfluenceLevel.OUTSIDER]: 'دخيل',
    [InfluenceLevel.PARTNER]: 'شريك',
    [InfluenceLevel.DOMINANT]: 'مهيمن',
    [InfluenceLevel.CONTROLLED]: 'سيطرة كاملة',
  };
  return labels[level];
}

export const INFLUENCE_ACTIONS = {
  invest: 5,
  loan: 8,
  factory: 12,
} as const;

export type InfluenceAction = keyof typeof INFLUENCE_ACTIONS;
