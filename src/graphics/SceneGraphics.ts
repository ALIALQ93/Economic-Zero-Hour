import {
  Color3,
  Color4,
  DirectionalLight,
  GlowLayer,
  HemisphericLight,
  MeshBuilder,
  Scene,
  ShadowGenerator,
  Vector3,
} from '@babylonjs/core';
import { GridMaterial } from '@babylonjs/materials/grid';
import { SkyMaterial } from '@babylonjs/materials/sky';

/** إعدادات الإضاءة، السماء، الضباب، الظلال، والتوهج */
export class SceneGraphics {
  readonly glowLayer: GlowLayer;
  readonly shadowGenerator: ShadowGenerator;

  constructor(private scene: Scene) {
    this.glowLayer = new GlowLayer('glow', scene, {
      mainTextureFixedSize: 512,
      blurKernelSize: 32,
    });
    this.glowLayer.intensity = 0.85;

    const sun = scene.getLightByName('sun') as DirectionalLight | null;
    const light =
      sun ??
      new DirectionalLight('sun', new Vector3(-0.45, -1, -0.35), scene);
    this.shadowGenerator = new ShadowGenerator(1024, light);
    this.shadowGenerator.useBlurExponentialShadowMap = true;
    this.shadowGenerator.blurKernel = 16;
    this.shadowGenerator.darkness = 0.35;
  }

  setup(): void {
    this.scene.fogMode = Scene.FOGMODE_EXP2;
    this.scene.fogDensity = 0.012;
    this.scene.fogColor = new Color3(0.05, 0.08, 0.12);

    this.setupSky();
    this.setupLights();
  }

  addShadowCaster(mesh: { receiveShadows?: boolean; getChildMeshes?: () => unknown[] }): void {
    this.shadowGenerator.addShadowCaster(mesh as Parameters<ShadowGenerator['addShadowCaster']>[0]);
  }

  addGlowMesh(mesh: { name: string }): void {
    this.glowLayer.addIncludedOnlyMesh(mesh as Parameters<GlowLayer['addIncludedOnlyMesh']>[0]);
  }

  createGroundMaterial(): GridMaterial {
    const grid = new GridMaterial('groundGrid', this.scene);
    grid.mainColor = new Color3(0.08, 0.12, 0.1);
    grid.lineColor = new Color3(0.18, 0.28, 0.22);
    grid.opacity = 0.92;
    grid.majorUnitFrequency = 4;
    grid.minorUnitVisibility = 0.35;
    grid.gridRatio = 1.2;
    grid.backFaceCulling = false;
    return grid;
  }

  private setupSky(): void {
    const sky = new SkyMaterial('skyMat', this.scene);
    sky.backFaceCulling = false;
    sky.turbidity = 8;
    sky.luminance = 0.25;
    sky.inclination = 0.35;
    sky.azimuth = 0.25;
    sky.useSunPosition = true;
    sky.sunPosition = new Vector3(-20, 80, 20);

    const skybox = MeshBuilder.CreateBox('skyBox', { size: 800 }, this.scene);
    skybox.material = sky;
    skybox.isPickable = false;
    skybox.infiniteDistance = true;
  }

  private setupLights(): void {
    const hemi = this.scene.getLightByName('hemi') as HemisphericLight | null;
    if (hemi) {
      hemi.intensity = 0.42;
      hemi.groundColor = new Color3(0.06, 0.08, 0.12);
      hemi.diffuse = new Color3(0.75, 0.82, 0.95);
    } else {
      const h = new HemisphericLight('hemi', new Vector3(0, 1, 0), this.scene);
      h.intensity = 0.42;
      h.groundColor = new Color3(0.06, 0.08, 0.12);
      h.diffuse = new Color3(0.75, 0.82, 0.95);
    }

    const sun = this.scene.getLightByName('sun') as DirectionalLight | null;
    if (sun) {
      sun.intensity = 1.05;
      sun.diffuse = new Color3(1, 0.96, 0.88);
      sun.specular = new Color3(0.4, 0.38, 0.35);
      sun.position = new Vector3(12, 18, 8);
    }

    if (!this.scene.getLightByName('fill')) {
      const fill = new DirectionalLight('fill', new Vector3(0.4, -0.6, 0.5), this.scene);
      fill.intensity = 0.22;
      fill.diffuse = new Color3(0.5, 0.65, 0.85);
    }

    this.scene.ambientColor = new Color3(0.12, 0.14, 0.18);
    this.scene.clearColor = new Color4(0.05, 0.08, 0.12, 1);
  }
}
