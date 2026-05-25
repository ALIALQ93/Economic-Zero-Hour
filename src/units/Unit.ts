import { Vector3 } from '@babylonjs/core';
import type { UnitRole } from './unitRoles';

export type FactionId = 'player' | 'ai';

export interface UnitDef {
  id: string;
  nameAr: string;
  faction: FactionId;
  speed: number;
  role: UnitRole;
}

export class Unit {
  position: Vector3;
  target: Vector3 | null = null;
  targetCountryId: string | null = null;
  atCountryId: string | null = null;
  selected = false;
  busy = false;

  constructor(
    public readonly def: UnitDef,
    startPosition: Vector3,
    startCountryId: string,
  ) {
    this.position = startPosition.clone();
    this.atCountryId = startCountryId;
  }

  get id(): string {
    return this.def.id;
  }

  get faction(): FactionId {
    return this.def.faction;
  }

  get displayName(): string {
    return this.def.nameAr;
  }

  get role(): UnitRole {
    return this.def.role;
  }

  orderMoveTo(targetPos: Vector3, countryId: string): void {
    this.target = targetPos.clone();
    this.targetCountryId = countryId;
    this.busy = true;
    this.selected = this.def.faction === 'player';
  }

  update(deltaMs: number): boolean {
    if (!this.target || !this.busy) return false;

    const dt = deltaMs / 1000;
    const dir = this.target.subtract(this.position);
    const dist = dir.length();

    if (dist < 0.08) {
      this.position.copyFrom(this.target);
      this.atCountryId = this.targetCountryId;
      this.target = null;
      this.targetCountryId = null;
      this.busy = false;
      return true;
    }

    dir.normalize();
    const step = this.def.speed * dt;
    this.position.addInPlace(dir.scale(Math.min(step, dist)));
    return false;
  }
}
