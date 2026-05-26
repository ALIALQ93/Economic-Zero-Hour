import { Color3, MeshBuilder, Scene, Vector3, type LinesMesh } from '@babylonjs/core';
import type { Country } from './Country';
import { TRADE_ROUTES, type TradeFlow } from './tradeRoutes';

const LINE_Y = 0.5;

const COLORS: Record<TradeFlow, Color3> = {
  player: new Color3(0.2, 0.92, 0.42),
  ai: new Color3(0.95, 0.22, 0.28),
  neutral: new Color3(0.5, 0.58, 0.65),
};

const SEVERED_COLOR = new Color3(0.22, 0.22, 0.26);

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

function arcPoints(from: Vector3, to: Vector3, segments = 14): Vector3[] {
  const a = from.clone();
  const b = to.clone();
  a.y = LINE_Y;
  b.y = LINE_Y;
  const mid = Vector3.Center(a, b);
  mid.y += Vector3.Distance(a, b) * 0.12;

  const points: Vector3[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const u = 1 - t;
    points.push(
      a.scale(u * u).add(mid.scale(2 * u * t)).add(b.scale(t * t)),
    );
  }
  return points;
}

export class TradeRouteRenderer {
  private lines = new Map<string, LinesMesh>();
  private flowByRoute = new Map<string, TradeFlow>();
  private severedRoutes = new Set<string>();
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

      const line = MeshBuilder.CreateLines(
        `trade_${route.id}`,
        { points: arcPoints(from, to) },
        this.scene,
      );
      line.color = COLORS.neutral;
      line.isPickable = false;
      this.lines.set(route.id, line);
      this.flowByRoute.set(route.id, 'neutral');
    }
  }

  update(countries: Map<string, Country>, severed: Set<string>): void {
    for (const route of TRADE_ROUTES) {
      const line = this.lines.get(route.id);
      if (!line) continue;

      if (severed.has(route.id)) {
        line.color = SEVERED_COLOR;
        this.severedRoutes.add(route.id);
        this.flowByRoute.set(route.id, 'neutral');
      } else {
        this.severedRoutes.delete(route.id);
        const from = countries.get(route.from);
        const to = countries.get(route.to);
        const flow = resolveRouteFlow(from, to);
        this.flowByRoute.set(route.id, flow);
        line.color = COLORS[flow];
      }
      line.isVisible = this.visible;
    }
  }

  updateAnimation(timeMs: number): void {
    if (!this.visible) return;
    const pulse = 0.75 + Math.sin(timeMs * 0.004) * 0.25;

    for (const [routeId, line] of this.lines) {
      const flow = this.flowByRoute.get(routeId) ?? 'neutral';
      if (this.severedRoutes.has(routeId)) continue;
      line.color = COLORS[flow].scale(pulse);
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
