import {
  Color3,
  MeshBuilder,
  PBRMaterial,
  Scene,
  StandardMaterial,
  type AbstractMesh,
} from '@babylonjs/core';
import type { Unit } from '../units/Unit';

const UNIT_MESH_PREFIX = 'unit_';

export class UnitRenderer {
  private meshes = new Map<string, AbstractMesh>();
  private materials = new Map<string, PBRMaterial>();
  private selectionRing: AbstractMesh | null = null;
  private animTime = 0;

  constructor(private scene: Scene) {}

  sync(units: Unit[], deltaMs = 0): void {
    this.animTime += deltaMs;

    for (const unit of units) {
      let mesh = this.meshes.get(unit.id);
      if (!mesh) {
        mesh = this.createUnitMesh(unit);
        this.meshes.set(unit.id, mesh);
      }

      const yBob = unit.busy ? Math.sin(this.animTime * 0.008) * 0.04 : 0;
      mesh.position.copyFrom(unit.position);
      mesh.position.y += yBob;

      const mat = this.materials.get(unit.id);
      if (mat && unit.selected) {
        const pulse = 0.9 + Math.sin(this.animTime * 0.006) * 0.1;
        mat.emissiveIntensity = 1.2 * pulse;
      } else if (mat) {
        mat.emissiveIntensity = unit.faction === 'player' ? 0.75 : 0.65;
      }

      this.updateSelectionRing(unit);
    }
  }

  private createUnitMesh(unit: Unit): AbstractMesh {
    const isLoan = unit.role === 'loan_advisor';
    const mesh = isLoan
      ? MeshBuilder.CreateBox(
          `${UNIT_MESH_PREFIX}${unit.id}`,
          { width: 0.52, height: 0.75, depth: 0.52 },
          this.scene,
        )
      : MeshBuilder.CreatePolyhedron(
          `${UNIT_MESH_PREFIX}${unit.id}`,
          { type: 1, size: 0.38 },
          this.scene,
        );
    mesh.metadata = { unitId: unit.id };

    const mat = new PBRMaterial(`unitMat_${unit.id}`, this.scene);
    mat.metallic = isLoan ? 0.65 : 0.25;
    mat.roughness = isLoan ? 0.35 : 0.4;

    if (unit.faction === 'player') {
      if (isLoan) {
        mat.albedoColor = new Color3(0.82, 0.65, 0.18);
        mat.emissiveColor = new Color3(0.45, 0.35, 0.08);
      } else {
        mat.albedoColor = new Color3(0.18, 0.52, 0.88);
        mat.emissiveColor = new Color3(0.12, 0.32, 0.55);
      }
    } else if (isLoan) {
      mat.albedoColor = new Color3(0.72, 0.22, 0.32);
      mat.emissiveColor = new Color3(0.4, 0.1, 0.15);
    } else {
      mat.albedoColor = new Color3(0.88, 0.18, 0.22);
      mat.emissiveColor = new Color3(0.5, 0.08, 0.12);
    }
    mat.emissiveIntensity = 0.7;
    mesh.material = mat;
    this.materials.set(unit.id, mat);
    return mesh;
  }

  private updateSelectionRing(unit: Unit): void {
    if (!unit.selected) {
      if (this.selectionRing) this.selectionRing.isVisible = false;
      return;
    }

    if (!this.selectionRing) {
      this.selectionRing = MeshBuilder.CreateTorus(
        'selection_ring',
        { diameter: 1.15, thickness: 0.07, tessellation: 32 },
        this.scene,
      );
      this.selectionRing.isPickable = false;
      const rm = new StandardMaterial('ringMat', this.scene);
      rm.diffuseColor = new Color3(0.9, 0.75, 0.2);
      rm.emissiveColor = new Color3(0.65, 0.5, 0.12);
      rm.disableLighting = true;
      this.selectionRing.material = rm;
    }

    const pulse = 1 + Math.sin(this.animTime * 0.007) * 0.08;
    this.selectionRing.isVisible = true;
    this.selectionRing.position.copyFrom(unit.position);
    this.selectionRing.position.y = 0.14;
    this.selectionRing.scaling.set(pulse, pulse, pulse);
  }

  getUnitIdFromMesh(mesh: AbstractMesh): string | null {
    let current: AbstractMesh | null = mesh;
    while (current) {
      if (current.name.startsWith(UNIT_MESH_PREFIX)) {
        return current.metadata?.unitId ?? current.name.replace(UNIT_MESH_PREFIX, '');
      }
      current = current.parent as AbstractMesh | null;
    }
    return null;
  }
}
