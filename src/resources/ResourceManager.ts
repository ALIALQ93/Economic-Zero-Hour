export interface Resources {
  capital: number;
  oil: number;
  food: number;
  metals: number;
}

export const INITIAL_RESOURCES: Resources = {
  capital: 10000,
  oil: 200,
  food: 150,
  metals: 100,
};

export const TICK_INCOME: Resources = {
  capital: 120,
  oil: 15,
  food: 10,
  metals: 8,
};

export const ACTION_COSTS = {
  invest: { capital: 500 },
  loan: { capital: 800 },
  factory: { capital: 1200, metals: 50 },
} as const;

export class ResourceManager {
  constructor(private resources: Resources = { ...INITIAL_RESOURCES }) {}

  get(): Readonly<Resources> {
    return this.resources;
  }

  tick(): void {
    this.resources.capital += TICK_INCOME.capital;
    this.resources.oil += TICK_INCOME.oil;
    this.resources.food += TICK_INCOME.food;
    this.resources.metals += TICK_INCOME.metals;
  }

  canAfford(cost: Partial<Resources>): boolean {
    return (
      (cost.capital ?? 0) <= this.resources.capital &&
      (cost.oil ?? 0) <= this.resources.oil &&
      (cost.food ?? 0) <= this.resources.food &&
      (cost.metals ?? 0) <= this.resources.metals
    );
  }

  spend(cost: Partial<Resources>): boolean {
    if (!this.canAfford(cost)) return false;
    this.resources.capital -= cost.capital ?? 0;
    this.resources.oil -= cost.oil ?? 0;
    this.resources.food -= cost.food ?? 0;
    this.resources.metals -= cost.metals ?? 0;
    return true;
  }

  addBonus(bonus: Partial<Resources>): void {
    this.resources.capital = Math.max(0, this.resources.capital + (bonus.capital ?? 0));
    this.resources.oil = Math.max(0, this.resources.oil + (bonus.oil ?? 0));
    this.resources.food = Math.max(0, this.resources.food + (bonus.food ?? 0));
    this.resources.metals = Math.max(0, this.resources.metals + (bonus.metals ?? 0));
  }
}
