import { TiledMapLoader, TiledMapConfig } from './TiledMapLoader';

export interface MapDefinition {
  id: string;
  name: string;
  description: string;
  config: TiledMapConfig;
  maxPlayers: number;
  gameMode: string;
}

export class MapManager {
  private static instance: MapManager;
  private availableMaps: Map<string, MapDefinition> = new Map();
  private currentLoader: TiledMapLoader | null = null;

  private constructor() {
    this.initializeMaps();
  }

  public static getInstance(): MapManager {
    if (!MapManager.instance) {
      MapManager.instance = new MapManager();
    }
    return MapManager.instance;
  }

  private initializeMaps(): void {
    // Define available maps
    const maps: MapDefinition[] = [
      {
        id: 'arena_1',
        name: 'Crypto Arena',
        description: 'A classic arena with destructible cover and weapon spawns',
        config: {
          mapKey: 'arena_1',
          tilesetKey: 'tileset_main',
          tilesetImage: 'tileset_main.png',
          layers: {
            background: 'Background',
            indestructible: 'Walls',
            destructibleTiles: 'DestructibleTerrain',
            destructibleObjects: 'DestructibleObjects',
            spawns: 'Spawns'
          }
        },
        maxPlayers: 8,
        gameMode: 'deathmatch'
      },
      {
        id: 'urban_warfare',
        name: 'Urban Warfare',
        description: 'City environment with buildings and destructible objects',
        config: {
          mapKey: 'urban_warfare',
          tilesetKey: 'tileset_urban',
          tilesetImage: 'tileset_urban.png',
          layers: {
            background: 'Sky',
            indestructible: 'Buildings',
            destructibleTiles: 'DestructibleWalls',
            destructibleObjects: 'Cars_and_Props',
            spawns: 'SpawnPoints'
          }
        },
        maxPlayers: 12,
        gameMode: 'team_deathmatch'
      },
      {
        id: 'mining_facility',
        name: 'Mining Facility',
        description: 'Underground mining complex with narrow corridors',
        config: {
          mapKey: 'mining_facility',
          tilesetKey: 'tileset_industrial',
          tilesetImage: 'tileset_industrial.png',
          layers: {
            indestructible: 'SolidRock',
            destructibleTiles: 'MinableRock',
            destructibleObjects: 'Equipment',
            spawns: 'Elevators'
          }
        },
        maxPlayers: 6,
        gameMode: 'king_of_the_hill'
      }
    ];

    maps.forEach(map => {
      this.availableMaps.set(map.id, map);
    });
  }

  public getAvailableMaps(): MapDefinition[] {
    return Array.from(this.availableMaps.values());
  }

  public getMap(mapId: string): MapDefinition | undefined {
    return this.availableMaps.get(mapId);
  }

  public preloadMap(scene: Phaser.Scene, mapId: string): void {
    const mapDef = this.availableMaps.get(mapId);
    if (!mapDef) {
      console.error(`Map ${mapId} not found`);
      return;
    }

    // Create loader and preload assets
    this.currentLoader = new TiledMapLoader(scene);
    this.currentLoader.preloadMap(mapDef.config);

    // Preload additional assets
    this.preloadMapAssets(scene, mapDef);
  }

  private preloadMapAssets(scene: Phaser.Scene, mapDef: MapDefinition): void {
    // Load destructible objects spritesheet
    scene.load.spritesheet('destructible-objects', 'sprites/destructible_objects.png', {
      frameWidth: 32,
      frameHeight: 32
    });

    // Load particle textures
    scene.load.image('debris', 'particles/debris.png');
    scene.load.image('dust', 'particles/dust.png');
    scene.load.image('explosion', 'particles/explosion.png');

    // Map-specific assets
    switch (mapDef.id) {
      case 'urban_warfare':
        scene.load.image('car_debris', 'particles/car_debris.png');
        scene.load.image('glass_shards', 'particles/glass_shards.png');
        break;
      case 'mining_facility':
        scene.load.image('rock_chunks', 'particles/rock_chunks.png');
        scene.load.image('sparks', 'particles/sparks.png');
        break;
    }
  }

  public createMap(scene: Phaser.Scene, mapId: string): TiledMapLoader | null {
    const mapDef = this.availableMaps.get(mapId);
    if (!mapDef || !this.currentLoader) {
      console.error(`Cannot create map ${mapId}`);
      return null;
    }

    this.currentLoader.createMap(mapDef.config);
    return this.currentLoader;
  }

  public getCurrentLoader(): TiledMapLoader | null {
    return this.currentLoader;
  }

  public cleanup(): void {
    if (this.currentLoader) {
      this.currentLoader.destroy();
      this.currentLoader = null;
    }
  }

  // Helper method to get spawn points for a specific map
  public getPlayerSpawns(mapId: string): { x: number; y: number }[] {
    // Default spawn points if no Tiled spawn points are found
    const defaultSpawns = [
      { x: 100, y: 400 },
      { x: 1100, y: 400 },
      { x: 600, y: 200 },
      { x: 300, y: 600 }
    ];

    // In a real implementation, this would be extracted from the loaded map
    return defaultSpawns;
  }

  public getWeaponSpawns(mapId: string): { x: number; y: number; weaponType: string }[] {
    // Default weapon spawns
    const defaultWeaponSpawns = [
      { x: 200, y: 300, weaponType: 'rifle' },
      { x: 400, y: 500, weaponType: 'shotgun' },
      { x: 800, y: 300, weaponType: 'grenade_launcher' },
      { x: 1000, y: 500, weaponType: 'rocket_launcher' }
    ];

    return defaultWeaponSpawns;
  }
}