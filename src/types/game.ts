// Game types and interfaces

export interface GameConfig {
  width: number;
  height: number;
  physics: {
    gravity: number;
    jumpForce: number;
    dashForce: number;
    dashCooldown: number;
  };
  player: {
    maxHealth: number;
    speed: number;
    size: { width: number; height: number };
  };
}

export interface PlayerState {
  id: string;
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  health: number;
  maxHealth: number;
  armor: number;
  weapons: WeaponState[];
  activeWeapon: number;
  isAlive: boolean;
  kills: number;
  deaths: number;
  canJump: boolean;
  canDoubleJump: boolean;
  dashCooldown: number;
  facing: 'left' | 'right';
}

export interface WeaponState {
  id: string;
  name: string;
  ammo: number;
  maxAmmo: number;
  damage: number;
  fireRate: number;
  projectileSpeed: number;
  lastFired: number;
}

export interface ProjectileState {
  id: string;
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  damage: number;
  playerId: string;
  weaponType: string;
  bounces?: number;
  explosive?: boolean;
  explosionRadius?: number;
}

export interface GameState {
  players: Record<string, PlayerState>;
  projectiles: Record<string, ProjectileState>;
  gameMode: 'deathmatch' | 'team-deathmatch' | 'last-man-standing';
  timeRemaining: number;
  isGameActive: boolean;
  map: MapState;
}

export interface MapState {
  name: string;
  width: number;
  height: number;
  spawnPoints: Array<{ x: number; y: number }>;
  weaponSpawns: Array<{ x: number; y: number; weaponType?: string }>;
  healthPickups: Array<{ x: number; y: number; active: boolean }>;
  destructibleTiles: boolean[][];
}

export interface GameControls {
  left: boolean;
  right: boolean;
  jump: boolean;
  dash: boolean;
  fire: boolean;
  switchWeapon: boolean;
  aim: { x: number; y: number };
}