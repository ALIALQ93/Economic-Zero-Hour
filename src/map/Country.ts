import type { CountryDef } from './maps/medium-map';

export class Country {
  playerInfluence = 0;
  aiInfluence = 0;
  digitallyParalyzed = false;
  marketFlooded = false;
  debtTrapped = false;
  marketCrashHit = false;
  tradeShocked = false;
  oilShockHit = false;
  quietCoup = false;
  foodEmbargo = false;
  metalBanHit = false;

  constructor(public readonly def: CountryDef) {}

  addPlayerInfluence(amount: number): number {
    this.playerInfluence = this.clamp(this.playerInfluence + amount);
    return this.playerInfluence;
  }

  addAiInfluence(amount: number): number {
    this.aiInfluence = this.clamp(this.aiInfluence + amount);
    return this.aiInfluence;
  }

  setFullPlayerControl(): void {
    this.playerInfluence = 100;
    this.aiInfluence = 0;
  }

  applyDigitalParalysis(): void {
    this.digitallyParalyzed = true;
    this.aiInfluence = this.clamp(this.aiInfluence - 25);
    this.addPlayerInfluence(15);
  }

  applyMarketFlood(): void {
    this.marketFlooded = true;
    this.aiInfluence = this.clamp(this.aiInfluence - 20);
    this.addPlayerInfluence(12);
  }

  applyDebtTrap(): void {
    this.debtTrapped = true;
    this.addPlayerInfluence(20);
    this.aiInfluence = this.clamp(this.aiInfluence - 10);
  }

  /** موجة الانهيار الكبير — تضر الجميع ثم تعوض اللاعب */
  applyMarketCrashWave(): void {
    this.marketCrashHit = true;
    if (this.dominantFaction === 'player' && this.playerInfluence >= 40) {
      this.addAiInfluence(-15);
      this.addPlayerInfluence(3);
    } else if (this.dominantFaction === 'ai') {
      this.addAiInfluence(-12);
      this.addPlayerInfluence(-8);
    } else {
      this.addPlayerInfluence(-5);
      this.addAiInfluence(-5);
    }
  }

  applyTradeShock(): void {
    this.tradeShocked = true;
    if (this.dominantFaction === 'ai') {
      this.addPlayerInfluence(-6);
    } else {
      this.addAiInfluence(4);
    }
  }

  applyOilShockWave(): void {
    this.oilShockHit = true;
    if (this.def.region === 'oil_belt') {
      if (this.dominantFaction === 'player') {
        this.addPlayerInfluence(8);
        this.addAiInfluence(-18);
      } else {
        this.addAiInfluence(-10);
        this.addPlayerInfluence(-5);
      }
    } else {
      this.addPlayerInfluence(-4);
      this.addAiInfluence(6);
    }
  }

  applyQuietCoup(): void {
    this.quietCoup = true;
    this.playerInfluence = 85;
    this.aiInfluence = 5;
  }

  applyFoodEmbargoWave(): void {
    this.foodEmbargo = true;
    this.addAiInfluence(-15);
    this.addPlayerInfluence(10);
  }

  applyMetalBanWave(): void {
    this.metalBanHit = true;
    if (this.def.region === 'north') {
      if (this.dominantFaction === 'player') {
        this.addPlayerInfluence(6);
        this.addAiInfluence(-20);
      } else if (this.dominantFaction === 'ai') {
        this.addAiInfluence(-14);
        this.addPlayerInfluence(-6);
      } else {
        this.addPlayerInfluence(-4);
        this.addAiInfluence(-4);
      }
    } else if (this.def.region === 'islands') {
      this.addAiInfluence(-10);
      this.addPlayerInfluence(-4);
    } else if (this.def.id === 'copanga') {
      this.addAiInfluence(-12);
      this.addPlayerInfluence(5);
    } else {
      this.addPlayerInfluence(-3);
      this.addAiInfluence(5);
    }
  }

  isEconomicallyDisrupted(): boolean {
    return (
      this.digitallyParalyzed ||
      this.marketFlooded ||
      this.debtTrapped ||
      this.marketCrashHit ||
      this.oilShockHit ||
      this.foodEmbargo ||
      this.metalBanHit
    );
  }

  get netPlayerInfluence(): number {
    return Math.max(0, this.playerInfluence - this.aiInfluence * 0.5);
  }

  get dominantFaction(): 'player' | 'ai' | 'neutral' {
    if (this.playerInfluence > this.aiInfluence + 10) return 'player';
    if (this.aiInfluence > this.playerInfluence + 10) return 'ai';
    return 'neutral';
  }

  private clamp(v: number): number {
    return Math.min(100, Math.max(0, v));
  }

  get id(): string {
    return this.def.id;
  }

  get displayName(): string {
    return this.def.nameAr;
  }
}
