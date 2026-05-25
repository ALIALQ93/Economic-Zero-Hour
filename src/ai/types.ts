export type AiActionType = 'invest' | 'loan' | 'factory' | 'cut_trade';

export interface AiActionResult {
  countryId: string;
  countryName: string;
  actionType: AiActionType;
}

export type AiLevel = 1 | 2;

export interface AiOpponent {
  readonly level: AiLevel;
  onGameTick(): AiActionResult | null;
  recordPlayerAction?(countryId: string): void;
}
