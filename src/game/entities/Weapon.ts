import { WeaponState } from '../../types/game';

export interface WeaponConfig {
  id: string;
  name: string;
  maxAmmo: number;
  damage: number;
  fireRate: number; // ms between shots
  projectileSpeed: number;
  projectileType: 'bullet' | 'rocket' | 'grenade';
  spread?: number; // for shotgun-like weapons
  projectileCount?: number; // for shotgun
  explosive?: boolean;
  explosionRadius?: number;
  bounces?: number;
  bounceDecay?: number; // velocity multiplier per bounce (0-1)
  explosionDelay?: number; // ms delay before explosion (for grenades)
  range?: number; // for knife
}

export const WEAPON_CONFIGS: Record<string, WeaponConfig> = {
  knife: {
    id: 'knife',
    name: 'Crypto Knife',
    maxAmmo: Infinity,
    damage: 999, // One-hit-kill
    fireRate: 800, // 0.8 second cooldown
    projectileSpeed: 0,
    projectileType: 'bullet',
    range: 60, // Short range
  },
  pistol: {
    id: 'pistol',
    name: 'Pixel Pistol',
    maxAmmo: 12,
    damage: 25,
    fireRate: 300,
    projectileSpeed: 800,
    projectileType: 'bullet',
  },
  shotgun: {
    id: 'shotgun',
    name: 'Ape Shotgun',
    maxAmmo: 6,
    damage: 15,
    fireRate: 800,
    projectileSpeed: 600,
    projectileType: 'bullet',
    spread: 30,
    projectileCount: 6,
  },
  rocket: {
    id: 'rocket',
    name: 'HODL Rocket',
    maxAmmo: 3,
    damage: 80,
    fireRate: 1500,
    projectileSpeed: 400,
    projectileType: 'rocket',
    explosive: true,
    explosionRadius: 100,
  },
  grenade: {
    id: 'grenade',
    name: 'Bouncing Doge',
    maxAmmo: 4,
    damage: 60,
    fireRate: 1000,
    projectileSpeed: 300,
    projectileType: 'grenade',
    explosive: true,
    explosionRadius: 80,
    bounces: 3,
    bounceDecay: 0.7, // Lose 30% velocity per bounce
    explosionDelay: 1500, // 3 second fuse timer
  },
};

export class Weapon {
  public config: WeaponConfig;
  public state: WeaponState;

  constructor(weaponId: string) {
    this.config = WEAPON_CONFIGS[weaponId];
    if (!this.config) {
      throw new Error(`Unknown weapon: ${weaponId}`);
    }

    this.state = {
      id: this.config.id,
      name: this.config.name,
      ammo: this.config.maxAmmo === Infinity ? Infinity : this.config.maxAmmo,
      maxAmmo: this.config.maxAmmo,
      damage: this.config.damage,
      fireRate: this.config.fireRate,
      projectileSpeed: this.config.projectileSpeed,
      lastFired: 0,
    };
  }

  public canFire(currentTime: number): boolean {
    return currentTime - this.state.lastFired >= this.state.fireRate && 
           (this.state.ammo > 0 || this.state.ammo === Infinity);
  }

  public fire(currentTime: number): boolean {
    if (!this.canFire(currentTime)) return false;

    this.state.lastFired = currentTime;
    if (this.state.ammo !== Infinity) {
      this.state.ammo--;
    }
    return true;
  }

  public isEmpty(): boolean {
    return this.state.ammo === 0;
  }
}