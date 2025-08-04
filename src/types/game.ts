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
  statusEffects: StatusEffect[];
  team?: 'red' | 'blue';
  score: number;
  hasFlag?: boolean;
  respawnTime?: number;
  inSafeZone?: boolean;
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
  bounceDecay?: number;
  explosive?: boolean;
  explosionRadius?: number;
  explosionDelay?: number;
  timeAlive?: number;
}

export interface GameState {
  players: Record<string, PlayerState>;
  projectiles: Record<string, ProjectileState>;
  gameMode: GameModeType;
  timeRemaining: number;
  isGameActive: boolean;
  map: MapState;
  gameModeState: GameModeState;
}

export type GameModeType = 'deathmatch' | 'team-deathmatch' | 'last-man-standing' | 'battle-royale' | 'king-of-hill' | 'capture-flag';

export interface GameModeState {
  // Battle Royale
  shrinkZone?: {
    centerX: number;
    centerY: number;
    currentRadius: number;
    targetRadius: number;
    damage: number;
    shrinkSpeed: number;
    lastShrink: number;
    phase: number;
  };
  
  // Team modes
  teams?: {
    red: string[];
    blue: string[];
  };
  teamScores?: {
    red: number;
    blue: number;
  };
  
  // King of the Hill
  controlPoint?: {
    x: number;
    y: number;
    radius: number;
    controllingTeam?: 'red' | 'blue' | null;
    controlTime: number;
    requiredTime: number;
  };
  
  // Capture the Flag
  flags?: {
    red: { x: number; y: number; carriedBy?: string; atBase: boolean };
    blue: { x: number; y: number; carriedBy?: string; atBase: boolean };
  };
  
  // General
  scoreLimit: number;
  playersAlive: number;
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

export interface StatusEffect {
  type: 'poisoned' | 'burned' | 'frozen';
  duration: number;
  intensity: number;
  lastTick: number;
}

export interface HealthPickupState {
  id: string;
  x: number;
  y: number;
  healAmount: number;
  active: boolean;
  respawnTime: number;
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