import {
  Color3,
  MeshBuilder,
  Scene,
  StandardMaterial,
  type AbstractMesh,
} from '@babylonjs/core';
import type { Unit } from '../units/Unit';

const UNIT_MESH_PREFIX = 'unit_';

export class UnitRenderer {
  private meshes = new Map<string, AbstractMesh>();
  private selectionRing: AbstractMesh | null = null;

  constructor(private scene: Scene) {}

  sync(units: Unit[]): void {
    for (const unit of units) {
      let mesh = this.meshes.get(unit.id);
      if (!mesh) {
        mesh = this.createUnitMesh(unit);
        this.meshes.set(unit.id, mesh);
      }
      mesh.position.copyFrom(unit.position);
      this.updateSelectionRing(unit);
    }
  }

  private createUnitMesh(unit: Unit): AbstractMesh {
    const isLoan = unit.role === 'loan_advisor';
    const mesh = isLoan
      ? MeshBuilder.CreateBox(
          `${UNIT_MESH_PREFIX}${unit.id}`,
          { width: 0.5, height: 0.7, depth: 0.5 },
          this.scene,
        )
      : MeshBuilder.CreatePolyhedron(
          `${UNIT_MESH_PREFIX}${unit.id}`,
          { type: 1, size: 0.35 },
          this.scene,
        );
    mesh.metadata = { unitId: unit.id };

    const mat = new StandardMaterial(`unitMat_${unit.id}`, this.scene);
    if (unit.faction === 'player') {
      if (isLoan) {
        mat.diffuseColor = new Color3(0.75, 0.6, 0.15);
        mat.emissiveColor = new Color3(0.35, 0.28, 0.08);
      } else {
        mat.diffuseColor = new Color3(0.2, 0.55, 0.85);
        mat.emissiveColor = new Color3(0.1, 0.25, 0.45);
      }
    } else if (isLoan) {
      mat.diffuseColor = new Color3(0.7, 0.25, 0.35);
      mat.emissiveColor = new Color3(0.35, 0.1, 0.15);
    } else {
      mat.diffuseColor = new Color3(0.85, 0.2, 0.25);
      mat.emissiveColor = new Color3(0.45, 0.08, 0.1);
    }
    mesh.material = mat;
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
        { diameter: 1.1, thickness: 0.06, tessellation: 24 },
        this.scene,
      );
      this.selectionRing.isPickable = false;
      const rm = new StandardMaterial('ringMat', this.scene);
      rm.diffuseColor = new Color3(0.85, 0.7, 0.2);
      rm.emissiveColor = new Color3(0.5, 0.4, 0.1);
      this.selectionRing.material = rm;
    }

    this.selectionRing.isVisible = true;
    this.selectionRing.position.copyFrom(unit.position);
    this.selectionRing.position.y = 0.12;
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
