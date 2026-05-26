import {
  ArcRotateCamera,
  Color3,
  DirectionalLight,
  HemisphericLight,
  MeshBuilder,
  PBRMaterial,
  Scene,
  StandardMaterial,
  TransformNode,
  Vector3,
  type AbstractMesh,
  type Engine,
} from '@babylonjs/core';
import { SceneGraphics } from '../graphics/SceneGraphics';
import { Country } from './Country';
import { MEDIUM_MAP_COUNTRIES, type RegionId } from './maps/medium-map';
import { TradeRouteRenderer } from './TradeRouteRenderer';

const COUNTRY_MESH_PREFIX = 'country_';

const REGION_ZONE_STYLE: Record<RegionId, { pos: Vector3; color: Color3; w: number; d: number }> = {
  north: { pos: new Vector3(0, 0.01, 4.5), color: new Color3(0.28, 0.38, 0.52), w: 15, d: 4 },
  oil_belt: { pos: new Vector3(0, 0.01, 0), color: new Color3(0.62, 0.42, 0.12), w: 14, d: 3.5 },
  south: { pos: new Vector3(1, 0.01, -4), color: new Color3(0.22, 0.48, 0.32), w: 16, d: 4 },
  islands: { pos: new Vector3(0, 0.01, -7.2), color: new Color3(0.38, 0.5, 0.68), w: 16, d: 3 },
};

export class WorldMap {
  private countryRoots = new Map<string, TransformNode>();
  private countryTowers = new Map<string, AbstractMesh>();
  private countryRings = new Map<string, AbstractMesh>();
  private countryMaterials = new Map<string, PBRMaterial>();
  private hiddenMeshes: AbstractMesh[] = [];
  private graphics!: SceneGraphics;
  tradeRoutes!: TradeRouteRenderer;
  private animTime = 0;

  constructor(
    private engine: Engine,
    private scene: Scene,
    private countries: Map<string, Country>,
  ) {}

  build(): ArcRotateCamera {
    const camera = new ArcRotateCamera(
      'camera',
      -Math.PI / 2,
      1.05,
      26,
      new Vector3(0, 0, -1),
      this.scene,
    );
    camera.attachControl(this.engine.getRenderingCanvas(), true);
    camera.lowerRadiusLimit = 11;
    camera.upperRadiusLimit = 42;
    camera.wheelPrecision = 10;
    camera.minZ = 0.5;

    new HemisphericLight('hemi', new Vector3(0, 1, 0), this.scene);
    const sun = new DirectionalLight('sun', new Vector3(-0.45, -1, -0.35), this.scene);
    sun.position = new Vector3(12, 18, 8);

    this.graphics = new SceneGraphics(this.scene);
    this.graphics.setup();

    this.createTerrain();
    this.createRegions();
    this.createCountries();
    this.createHiddenLayer();
    this.tradeRoutes = new TradeRouteRenderer(this.scene, (id) => this.getCountryPosition(id));
    this.tradeRoutes.update(this.countries, new Set());

    return camera;
  }

  updateAnimations(deltaMs: number): void {
    this.animTime += deltaMs;
    const pulse = 0.85 + Math.sin(this.animTime * 0.003) * 0.15;

    for (const [id, mat] of this.countryMaterials) {
      const country = this.countries.get(id);
      if (!country) continue;
      const base = country.playerInfluence + country.aiInfluence;
      mat.emissiveIntensity = (0.35 + base / 250) * pulse;
    }

    for (const [id, ring] of this.countryRings) {
      const country = this.countries.get(id);
      if (!country || !ring.material) continue;
      const rm = ring.material as StandardMaterial;
      const t = country.playerInfluence / Math.max(1, country.playerInfluence + country.aiInfluence);
      rm.emissiveColor = Color3.Lerp(
        new Color3(0.75, 0.15, 0.2),
        new Color3(0.25, 0.8, 0.35),
        t,
      );
      rm.alpha = 0.35 + (country.playerInfluence + country.aiInfluence) / 200;
      ring.scaling.set(pulse, pulse, pulse);
    }

    this.tradeRoutes.updateAnimation(this.animTime);
  }

  private createTerrain(): void {
    const ground = MeshBuilder.CreateGround(
      'world',
      { width: 38, height: 24, subdivisions: 32 },
      this.scene,
    );
    ground.material = this.graphics.createGroundMaterial();
    ground.receiveShadows = true;
    ground.isPickable = false;
  }

  private createRegions(): void {
    for (const style of Object.values(REGION_ZONE_STYLE)) {
      const zone = MeshBuilder.CreateGround(
        'zone',
        { width: style.w, height: style.d },
        this.scene,
      );
      zone.position = style.pos;
      zone.isPickable = false;

      const zm = new StandardMaterial('zoneMat', this.scene);
      zm.diffuseColor = style.color;
      zm.emissiveColor = style.color.scale(0.35);
      zm.alpha = 0.12;
      zm.disableLighting = true;
      zone.material = zm;
    }
  }

  private createCountries(): void {
    for (const def of MEDIUM_MAP_COUNTRIES) {
      const country = this.countries.get(def.id);
      if (!country) continue;

      const root = new TransformNode(`${COUNTRY_MESH_PREFIX}${def.id}`, this.scene);
      root.position = new Vector3(...def.position);
      root.metadata = { countryId: def.id };

      const base = MeshBuilder.CreateCylinder(
        `base_${def.id}`,
        { height: 0.14, diameter: 1.75, tessellation: 24 },
        this.scene,
      );
      base.parent = root;
      base.position.y = 0.05;

      const baseMat = new PBRMaterial(`baseMat_${def.id}`, this.scene);
      baseMat.albedoColor = new Color3(def.color[0] * 0.55, def.color[1] * 0.55, def.color[2] * 0.55);
      baseMat.metallic = 0.55;
      baseMat.roughness = 0.75;
      base.material = baseMat;
      base.receiveShadows = true;
      this.graphics.addShadowCaster(base);

      const tower = MeshBuilder.CreateCylinder(
        `tower_${def.id}`,
        { height: 0.72, diameterTop: 0.85, diameterBottom: 1.15, tessellation: 16 },
        this.scene,
      );
      tower.parent = root;
      tower.position.y = 0.48;
      tower.metadata = { countryId: def.id };

      const mat = new PBRMaterial(`mat_${def.id}`, this.scene);
      mat.albedoColor = new Color3(...def.color);
      mat.metallic = 0.4;
      mat.roughness = 0.48;
      mat.emissiveColor = new Color3(def.color[0] * 0.2, def.color[1] * 0.2, def.color[2] * 0.2);
      mat.emissiveIntensity = 0.45;
      tower.material = mat;
      tower.receiveShadows = true;
      this.graphics.addShadowCaster(tower);
      this.graphics.addGlowMesh(tower);

      const ring = MeshBuilder.CreateTorus(
        `ring_${def.id}`,
        { diameter: 1.7, thickness: 0.045, tessellation: 36 },
        this.scene,
      );
      ring.parent = root;
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.1;
      ring.isPickable = false;
      const ringMat = new StandardMaterial(`ringMat_${def.id}`, this.scene);
      ringMat.emissiveColor = new Color3(0.4, 0.4, 0.45);
      ringMat.alpha = 0.4;
      ringMat.disableLighting = true;
      ring.material = ringMat;
      this.graphics.addGlowMesh(ring);

      this.countryRoots.set(def.id, root);
      this.countryTowers.set(def.id, tower);
      this.countryRings.set(def.id, ring);
      this.countryMaterials.set(def.id, mat);
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
      const from = this.countryRoots.get(fromId);
      const to = this.countryRoots.get(toId);
      if (!from || !to) continue;

      const a = from.position.clone();
      const b = to.position.clone();
      a.y = 0.55;
      b.y = 0.55;

      const line = MeshBuilder.CreateDashedLines(
        `hidden_${fromId}_${toId}`,
        { points: [a, b], dashSize: 0.35, gapSize: 0.2 },
        this.scene,
      );
      line.color = new Color3(0.95, 0.25, 0.45);
      line.isVisible = false;
      line.isPickable = false;
      this.hiddenMeshes.push(line);
    }
  }

  setHiddenLayerVisible(visible: boolean): void {
    for (const mesh of this.hiddenMeshes) {
      mesh.isVisible = visible;
    }
    for (const id of this.countryRoots.keys()) {
      const country = this.countries.get(id);
      const mat = this.countryMaterials.get(id);
      if (!country || !mat) continue;
      if (visible && (country.playerInfluence > 0 || country.aiInfluence > 0)) {
        const glow = (country.playerInfluence + country.aiInfluence) / 100;
        const r = country.aiInfluence > country.playerInfluence ? 0.95 * glow : 0.25 * glow;
        const g = country.playerInfluence >= country.aiInfluence ? 0.75 * glow : 0.2 * glow;
        mat.emissiveColor = new Color3(r, g, 0.3 * glow);
        mat.emissiveIntensity = 1.1;
      } else {
        this.applyCountryEmissive(country, mat);
      }
    }
  }

  getCountryPosition(countryId: string): Vector3 | null {
    const root = this.countryRoots.get(countryId);
    return root ? root.position.clone() : null;
  }

  updateCountryVisuals(severedRoutes: Set<string> = new Set()): void {
    for (const [id, root] of this.countryRoots) {
      const country = this.countries.get(id);
      const mat = this.countryMaterials.get(id);
      const tower = this.countryTowers.get(id);
      if (!country || !mat || !tower) continue;

      const total = country.playerInfluence + country.aiInfluence;
      const scale = 1 + total / 200;
      root.scaling.set(scale, 1, scale);
      tower.scaling.y = 1 + total / 180;
      this.applyCountryEmissive(country, mat);
    }
    this.tradeRoutes.update(this.countries, severedRoutes);
  }

  private applyCountryEmissive(country: Country, mat: PBRMaterial): void {
    const def = country.def;
    let emissive: Color3;
    let intensity = 0.55;

    if (country.digitallyParalyzed) {
      emissive = new Color3(0.2, 0.75, 0.95);
      intensity = 1;
    } else if (country.marketFlooded) {
      emissive = new Color3(0.95, 0.55, 0.15);
      intensity = 0.95;
    } else if (country.debtTrapped) {
      emissive = new Color3(0.55, 0.35, 0.75);
      intensity = 0.9;
    } else if (country.marketCrashHit) {
      emissive = new Color3(0.85, 0.2, 0.25);
      intensity = 1;
    } else if (country.oilShockHit) {
      emissive = new Color3(0.75, 0.5, 0.1);
      intensity = 0.9;
    } else if (country.quietCoup) {
      emissive = new Color3(0.45, 0.2, 0.65);
      intensity = 0.85;
    } else if (country.foodEmbargo) {
      emissive = new Color3(0.55, 0.35, 0.12);
      intensity = 0.85;
    } else if (country.metalBanHit) {
      emissive = new Color3(0.5, 0.55, 0.85);
      intensity = 0.9;
    } else if (country.tradeShocked) {
      emissive = new Color3(0.7, 0.45, 0.2);
      intensity = 0.8;
    } else if (country.dominantFaction === 'player') {
      emissive = new Color3(0.45, 0.7, 0.22);
      intensity = 0.7;
    } else if (country.dominantFaction === 'ai') {
      emissive = new Color3(0.8, 0.15, 0.22);
      intensity = 0.75;
    } else {
      emissive = new Color3(def.color[0] * 0.25, def.color[1] * 0.25, def.color[2] * 0.25);
      intensity = 0.4;
    }

    mat.emissiveColor = emissive;
    mat.emissiveIntensity = intensity;
  }

  toggleTradeRoutes(): boolean {
    return this.tradeRoutes.toggle();
  }

  getCountryIdFromMesh(mesh: AbstractMesh): string | null {
    let current: AbstractMesh | null = mesh;
    while (current) {
      const id = current.metadata?.countryId as string | undefined;
      if (id) return id;
      if (current.name.startsWith(COUNTRY_MESH_PREFIX)) {
        return current.name.replace(COUNTRY_MESH_PREFIX, '');
      }
      current = current.parent as AbstractMesh | null;
    }
    return null;
  }

  getCountryMeshes(): AbstractMesh[] {
    return [...this.countryTowers.values()];
  }
}
