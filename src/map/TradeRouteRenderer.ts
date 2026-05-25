import { Color3, MeshBuilder, Scene, Vector3, type LinesMesh } from '@babylonjs/core';
import type { Country } from './Country';
import { TRADE_ROUTES, type TradeFlow } from './tradeRoutes';

const LINE_Y = 0.45;

const COLORS: Record<TradeFlow, Color3> = {
  player: new Color3(0.25, 0.85, 0.35),
  ai: new Color3(0.9, 0.2, 0.25),
  neutral: new Color3(0.45, 0.5, 0.55),
};

const SEVERED_COLOR = new Color3(0.25, 0.25, 0.28);

function getFlowFromCountry(country: Country | undefined): TradeFlow {
  if (!country) return 'neutral';
  if (country.dominantFaction === 'player' && country.playerInfluence >= 35) return 'player';
  if (country.dominantFaction === 'ai' && country.aiInfluence >= 35) return 'ai';
  return 'neutral';
}

function resolveRouteFlow(from: Country | undefined, to: Country | undefined): TradeFlow {
  const exportFlow = getFlowFromCountry(from);
  const importFlow = getFlowFromCountry(to);

  if (exportFlow === 'player' || importFlow === 'player') {
    if (exportFlow === 'ai' || importFlow === 'ai') return 'neutral';
    return 'player';
  }
  if (exportFlow === 'ai' || importFlow === 'ai') return 'ai';
  return 'neutral';
}

export class TradeRouteRenderer {
  private lines = new Map<string, LinesMesh>();
  visible = true;

  constructor(
    private scene: Scene,
    private getPosition: (countryId: string) => Vector3 | null,
  ) {
    this.build();
  }

  private build(): void {
    for (const route of TRADE_ROUTES) {
      const from = this.getPosition(route.from);
      const to = this.getPosition(route.to);
      if (!from || !to) continue;

      const a = from.clone();
      const b = to.clone();
      a.y = LINE_Y;
      b.y = LINE_Y;

      const line = MeshBuilder.CreateLines(
        `trade_${route.id}`,
        { points: [a, b] },
        this.scene,
      );
      line.color = COLORS.neutral;
      line.isPickable = false;
      this.lines.set(route.id, line);
    }
  }

  update(countries: Map<string, Country>, severed: Set<string>): void {
    for (const route of TRADE_ROUTES) {
      const line = this.lines.get(route.id);
      if (!line) continue;

      if (severed.has(route.id)) {
        line.color = SEVERED_COLOR;
      } else {
        const from = countries.get(route.from);
        const to = countries.get(route.to);
        line.color = COLORS[resolveRouteFlow(from, to)];
      }
      line.isVisible = this.visible;
    }
  }

  setVisible(visible: boolean): void {
    this.visible = visible;
    for (const line of this.lines.values()) {
      line.isVisible = visible;
    }
  }

  toggle(): boolean {
    this.setVisible(!this.visible);
    return this.visible;
  }
}
