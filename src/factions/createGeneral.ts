import type { GeneralId, PlayerGeneral } from './General';
import { SmartInvestor } from './corporations/SmartInvestor';
import { TechKing } from './corporations/TechKing';
import { RetailCaesar } from './corporations/RetailCaesar';
import { DebtHunter } from './banks/DebtHunter';
import { MarketMover } from './banks/MarketMover';
import { OilPrince } from './resources/OilPrince';
import { FoodLord } from './resources/FoodLord';
import { MetalKing } from './resources/MetalKing';
import { SovereignShadow } from './banks/SovereignShadow';

export function createGeneral(id: GeneralId): PlayerGeneral {
  switch (id) {
    case 'tech_king':
      return new TechKing();
    case 'retail_caesar':
      return new RetailCaesar();
    case 'debt_hunter':
      return new DebtHunter();
    case 'market_mover':
      return new MarketMover();
    case 'oil_prince':
      return new OilPrince();
    case 'food_lord':
      return new FoodLord();
    case 'metal_king':
      return new MetalKing();
    case 'sovereign_shadow':
      return new SovereignShadow();
    case 'smart_investor':
    default:
      return new SmartInvestor();
  }
}
