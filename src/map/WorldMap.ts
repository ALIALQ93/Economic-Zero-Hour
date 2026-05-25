import {
  ArcRotateCamera,
  Color3,
  DirectionalLight,
  HemisphericLight,
  MeshBuilder,
  Scene,
  StandardMaterial,
  Vector3,
  type AbstractMesh,
  type Engine,
} from '@babylonjs/core';
import { Country } from './Country';
import { MEDIUM_MAP_COUNTRIES } from './maps/medium-map';
import { TradeRouteRenderer } from './TradeRouteRenderer';

const COUNTRY_MESH_PREFIX = 'country_';

export class WorldMap {
  private countryMeshes = new Map<string, AbstractMesh>();
  private hiddenMeshes: AbstractMesh[] = [];
  tradeRoutes!: TradeRouteRenderer;

  constructor(
    private engine: Engine,
    private scene: Scene,
    private countries: Map<string, Country>,
  ) {}

  build(): ArcRotateCamera {
    const camera = new ArcRotateCamera(
      'camera',
      -Math.PI / 2,
      1.1,
      28,
      new Vector3(0, 0, -1),
      this.scene,
    );
    camera.attachControl(this.engine.getRenderingCanvas(), true);
    camera.lowerRadiusLimit = 12;
    camera.upperRadiusLimit = 45;
    camera.wheelPrecision = 8;

    new HemisphericLight('hemi', new Vector3(0, 1, 0), this.scene).intensity = 0.55;
    const sun = new DirectionalLight('sun', new Vector3(-0.5, -1, -0.3), this.scene);
    sun.intensity = 0.85;

    this.createTerrain();
    this.createRegions();
    this.createCountries();
    this.createHiddenLayer();
    this.tradeRoutes = new TradeRouteRenderer(this.scene, (id) => this.getCountryPosition(id));
    this.tradeRoutes.update(this.countries, new Set());

    return camera;
  }

  private createTerrain(): void {
    const ground = MeshBuilder.CreateGround('world', { width: 36, height: 22 }, this.scene);
    const mat = new StandardMaterial('groundMat', this.scene);
    mat.diffuseColor = new Color3(0.12, 0.18, 0.14);
    mat.specularColor = new Color3(0.05, 0.05, 0.05);
    ground.material = mat;
    ground.receiveShadows = true;
  }

  private createRegions(): void {
    const labels: { pos: Vector3; color: Color3 }[] = [
      { pos: new Vector3(0, 0.02, 4.5), color: new Color3(0.3, 0.4, 0.55) },
      { pos: new Vector3(0, 0.02, 0), color: new Color3(0.6, 0.45, 0.15) },
      { pos: new Vector3(0, 0.02, -4), color: new Color3(0.25, 0.45, 0.3) },
      { pos: new Vector3(0, 0.02, -7.2), color: new Color3(0.45, 0.55, 0.7) },
    ];

    for (const { pos, color } of labels) {
      const zone = MeshBuilder.CreateBox('zone', { width: 14, height: 0.05, depth: 3.5 }, this.scene);
      zone.position = pos;
      const zm = new StandardMaterial('zoneMat', this.scene);
      zm.diffuseColor = color;
      zm.alpha = 0.15;
      zone.material = zm;
    }
  }

  private createCountries(): void {
    for (const def of MEDIUM_MAP_COUNTRIES) {
      const country = this.countries.get(def.id);
      if (!country) continue;

      const mesh = MeshBuilder.CreateCylinder(
        `${COUNTRY_MESH_PREFIX}${def.id}`,
        { height: 0.6, diameter: 1.4, tessellation: 12 },
        this.scene,
      );
      mesh.position = new Vector3(...def.position);
      mesh.metadata = { countryId: def.id };

      const mat = new StandardMaterial(`mat_${def.id}`, this.scene);
      mat.diffuseColor = new Color3(...def.color);
      mat.emissiveColor = new Color3(def.color[0] * 0.15, def.color[1] * 0.15, def.color[2] * 0.15);
      mesh.material = mat;

      this.countryMeshes.set(def.id, mesh);
    }
  }

  private createHiddenLayer(): void {
    const pairs: [string, string][] = [
      ['northam', 'zahiran'],
      ['zahiran', 'qaseria'],
      ['copanga', 'sirania'],
      ['kalmera', 'portica'],
    ];

    for (const [fromId, toId] of pairs) {
      const from = this.countryMeshes.get(fromId);
      const to = this.countryMeshes.get(toId);
      if (!from || !to) continue;

      const line = MeshBuilder.CreateLines(
        `hidden_${fromId}_${toId}`,
        { points: [from.position.clone(), to.position.clone()] },
        this.scene,
      );
      line.color = new Color3(0.9, 0.2, 0.35);
      line.isVisible = false;
      line.isPickable = false;
      this.hiddenMeshes.push(line);
    }
  }

  setHiddenLayerVisible(visible: boolean): void {
    for (const mesh of this.hiddenMeshes) {
      mesh.isVisible = visible;
    }
    for (const [id, mesh] of this.countryMeshes) {
      const country = this.countries.get(id);
      if (!country || !mesh.material) continue;
      const mat = mesh.material as StandardMaterial;
      if (visible && (country.playerInfluence > 0 || country.aiInfluence > 0)) {
        const glow = (country.playerInfluence + country.aiInfluence) / 100;
        const r = country.aiInfluence > country.playerInfluence ? 0.9 * glow : 0.2 * glow;
        const g = country.playerInfluence >= country.aiInfluence ? 0.7 * glow : 0.15 * glow;
        mat.emissiveColor = new Color3(r, g, 0.25 * glow);
      } else {
        this.applyCountryEmissive(country, mat);
      }
    }
  }

  getCountryPosition(countryId: string): Vector3 | null {
    const mesh = this.countryMeshes.get(countryId);
    return mesh ? mesh.position.clone() : null;
  }

  updateCountryVisuals(severedRoutes: Set<string> = new Set()): void {
    for (const [id, mesh] of this.countryMeshes) {
      const country = this.countries.get(id);
      if (!country || !mesh.material) continue;
      const mat = mesh.material as StandardMaterial;
      const total = country.playerInfluence + country.aiInfluence;
      const scale = 1 + total / 200;
      mesh.scaling.set(scale, 1 + total / 150, scale);
      this.applyCountryEmissive(country, mat);
    }
    this.tradeRoutes.update(this.countries, severedRoutes);
  }

  private applyCountryEmissive(country: Country, mat: StandardMaterial): void {
    const def = country.def;
    if (country.digitallyParalyzed) {
      mat.emissiveColor = new Color3(0.2, 0.75, 0.95);
    } else if (country.marketFlooded) {
      mat.emissiveColor = new Color3(0.95, 0.55, 0.15);
    } else if (country.debtTrapped) {
      mat.emissiveColor = new Color3(0.55, 0.35, 0.75);
    } else if (country.marketCrashHit) {
      mat.emissiveColor = new Color3(0.85, 0.2, 0.25);
    } else if (country.oilShockHit) {
      mat.emissiveColor = new Color3(0.75, 0.5, 0.1);
    } else if (country.quietCoup) {
      mat.emissiveColor = new Color3(0.45, 0.2, 0.65);
    } else if (country.foodEmbargo) {
      mat.emissiveColor = new Color3(0.55, 0.35, 0.12);
    } else if (country.metalBanHit) {
      mat.emissiveColor = new Color3(0.5, 0.55, 0.85);
    } else if (country.tradeShocked) {
      mat.emissiveColor = new Color3(0.7, 0.45, 0.2);
    } else if (country.dominantFaction === 'player') {
      mat.emissiveColor = new Color3(0.5, 0.65, 0.25);
    } else if (country.dominantFaction === 'ai') {
      mat.emissiveColor = new Color3(0.75, 0.15, 0.2);
    } else {
      mat.emissiveColor = new Color3(def.color[0] * 0.2, def.color[1] * 0.2, def.color[2] * 0.2);
    }
  }

  toggleTradeRoutes(): boolean {
    return this.tradeRoutes.toggle();
  }

  getCountryIdFromMesh(mesh: AbstractMesh): string | null {
    let current: AbstractMesh | null = mesh;
    while (current) {
      if (current.name.startsWith(COUNTRY_MESH_PREFIX)) {
        return current.metadata?.countryId ?? current.name.replace(COUNTRY_MESH_PREFIX, '');
      }
      current = current.parent as AbstractMesh | null;
    }
    return null;
  }

  getCountryMeshes(): AbstractMesh[] {
    return [...this.countryMeshes.values()];
  }
}
