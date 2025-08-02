import Phaser from 'phaser';
import { DestructibleTerrain } from '../entities/DestructibleTerrain';

export interface TiledMapConfig {
  mapKey: string;
  tilesetKey: string;
  tilesetImage: string;
  layers: {
    background?: string;
    indestructible: string;
    destructibleTiles: string;
    destructibleObjects?: string;
    spawns?: string;
  };
}

export class TiledMapLoader {
  private scene: Phaser.Scene;
  private map: Phaser.Tilemaps.Tilemap | null = null;
  private tileset: Phaser.Tilemaps.Tileset | null = null;
  private layers: Map<string, Phaser.Tilemaps.TilemapLayer> = new Map();
  private destructibleTerrain: DestructibleTerrain | null = null;
  private destructibleObjects: Phaser.Physics.Arcade.Group | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  public preloadMap(config: TiledMapConfig): void {
    // Load the tilemap JSON and tileset image
    this.scene.load.tilemapTiledJSON(config.mapKey, `maps/${config.mapKey}.json`);
    this.scene.load.image(config.tilesetKey, `tilesets/${config.tilesetImage}`);
  }

  public createMap(config: TiledMapConfig): void {
    // Create the tilemap
    this.map = this.scene.make.tilemap({ key: config.mapKey });
    this.tileset = this.map.addTilesetImage(config.tilesetKey, config.tilesetKey);

    if (!this.tileset) {
      console.error('Failed to load tileset');
      return;
    }

    this.createLayers(config);
    this.setupCollisions(config);
    this.createDestructibleSystems(config);
  }

  private createLayers(config: TiledMapConfig): void {
    if (!this.map || !this.tileset) return;

    // Create background layer (decorative, no collision)
    if (config.layers.background) {
      const backgroundLayer = this.map.createLayer(config.layers.background, this.tileset);
      if (backgroundLayer) {
        backgroundLayer.setDepth(-2);
        this.layers.set('background', backgroundLayer);
      }
    }

    // Create indestructible terrain layer
    const indestructibleLayer = this.map.createLayer(config.layers.indestructible, this.tileset);
    if (indestructibleLayer) {
      indestructibleLayer.setDepth(-1);
      this.layers.set('indestructible', indestructibleLayer);
    }

    // Create destructible tiles layer
    const destructibleLayer = this.map.createLayer(config.layers.destructibleTiles, this.tileset);
    if (destructibleLayer) {
      destructibleLayer.setDepth(0);
      this.layers.set('destructibleTiles', destructibleLayer);
    }

    // Handle spawn points (if they exist)
    if (config.layers.spawns) {
      this.processSpawnPoints(config.layers.spawns);
    }

    // Handle destructible objects (if they exist)
    if (config.layers.destructibleObjects) {
      this.processDestructibleObjects(config.layers.destructibleObjects);
    }
  }

  private setupCollisions(config: TiledMapConfig): void {
    if (!this.map) return;

    // Set collision on indestructible layer
    const indestructibleLayer = this.layers.get('indestructible');
    if (indestructibleLayer) {
      // Set collision on all tiles that exist (non-empty tiles)
      indestructibleLayer.setCollisionByExclusion([]);
    }

    // Initially set collision on destructible tiles
    const destructibleLayer = this.layers.get('destructibleTiles');
    if (destructibleLayer) {
      destructibleLayer.setCollisionByExclusion([]);
    }
  }

  private createDestructibleSystems(config: TiledMapConfig): void {
    if (!this.map) return;

    // Create destructible terrain system for tiles
    const destructibleLayer = this.layers.get('destructibleTiles');
    if (destructibleLayer) {
      this.destructibleTerrain = new DestructibleTerrain(
        this.scene,
        0,
        0,
        this.map.widthInPixels,
        this.map.heightInPixels
      );

      // Convert tilemap data to destructible terrain
      this.convertTilemapToDestructible(destructibleLayer);
    }

    // Create destructible objects group
    if (this.scene.physics) {
      this.destructibleObjects = this.scene.physics.add.group();
    }
  }

  private convertTilemapToDestructible(layer: Phaser.Tilemaps.TilemapLayer): void {
    if (!this.map || !this.destructibleTerrain) return;

    const tileWidth = this.map.tileWidth;
    const tileHeight = this.map.tileHeight;

    // Iterate through all tiles in the layer
    for (let y = 0; y < this.map.height; y++) {
      for (let x = 0; x < this.map.width; x++) {
        const tile = layer.getTileAt(x, y);
        if (tile) {
          // Mark this area as destructible terrain
          const worldX = x * tileWidth + tileWidth / 2;
          const worldY = y * tileHeight + tileHeight / 2;
          
          // You might want to set different health values based on tile type
          const health = this.getTileHealth(tile.index);
          this.destructibleTerrain.setChunkHealth(worldX, worldY, health);
        }
      }
    }
  }

  private getTileHealth(tileIndex: number): number {
    // Map different tile types to different health values
    // You can customize this based on your tileset
    switch (tileIndex) {
      case 1: return 50;  // Weak material
      case 2: return 100; // Medium material
      case 3: return 150; // Strong material
      default: return 100;
    }
  }

  private processSpawnPoints(layerName: string): void {
    if (!this.map) return;

    const spawnLayer = this.map.getObjectLayer(layerName);
    if (!spawnLayer) return;

    spawnLayer.objects.forEach((obj: any) => {
      if (obj.type === 'playerSpawn') {
        this.scene.events.emit('playerSpawnFound', { x: obj.x, y: obj.y });
      } else if (obj.type === 'weaponSpawn') {
        this.scene.events.emit('weaponSpawnFound', { 
          x: obj.x, 
          y: obj.y, 
          weaponType: obj.properties?.weaponType || 'pistol' 
        });
      }
    });
  }

  private processDestructibleObjects(layerName: string): void {
    if (!this.map || !this.destructibleObjects) return;

    const objectLayer = this.map.getObjectLayer(layerName);
    if (!objectLayer) return;

    objectLayer.objects.forEach((obj: any) => {
      if (obj.type === 'destructibleBox' || obj.type === 'destructibleBarrel') {
        this.createDestructibleObject(obj);
      }
    });
  }

  private createDestructibleObject(obj: any): void {
    if (!this.destructibleObjects) return;

    // Create a physics sprite for the destructible object
    const sprite = this.scene.physics.add.sprite(obj.x, obj.y, 'destructible-objects');
    
    // Set properties based on object type
    const health = obj.properties?.health || 100;
    const reward = obj.properties?.reward || null;
    
    // Add custom properties
    (sprite as any).health = health;
    (sprite as any).maxHealth = health;
    (sprite as any).reward = reward;
    (sprite as any).objectType = obj.type;

    // Add to destructible objects group
    this.destructibleObjects.add(sprite);

    // Set appropriate frame based on object type
    if (obj.type === 'destructibleBox') {
      sprite.setFrame(0);
    } else if (obj.type === 'destructibleBarrel') {
      sprite.setFrame(1);
    }
  }

  public destroyTerrain(x: number, y: number, radius: number, damage: number): void {
    if (!this.destructibleTerrain || !this.map) return;

    // Destroy terrain chunks
    this.destructibleTerrain.destroyArea(x, y, radius, damage);

    // Remove tiles from the destructible layer
    const destructibleLayer = this.layers.get('destructibleTiles');
    if (destructibleLayer) {
      this.removeTilesInRadius(destructibleLayer, x, y, radius);
    }
  }

  private removeTilesInRadius(layer: Phaser.Tilemaps.TilemapLayer, centerX: number, centerY: number, radius: number): void {
    if (!this.map) return;

    const tileWidth = this.map.tileWidth;
    const tileHeight = this.map.tileHeight;

    // Calculate tile bounds
    const startTileX = Math.floor((centerX - radius) / tileWidth);
    const endTileX = Math.ceil((centerX + radius) / tileWidth);
    const startTileY = Math.floor((centerY - radius) / tileHeight);
    const endTileY = Math.ceil((centerY + radius) / tileHeight);

    // Remove tiles within the radius
    for (let tileY = startTileY; tileY <= endTileY; tileY++) {
      for (let tileX = startTileX; tileX <= endTileX; tileX++) {
        const tileWorldX = tileX * tileWidth + tileWidth / 2;
        const tileWorldY = tileY * tileHeight + tileHeight / 2;
        const distance = Phaser.Math.Distance.Between(centerX, centerY, tileWorldX, tileWorldY);

        if (distance <= radius) {
          layer.removeTileAt(tileX, tileY);
        }
      }
    }
  }

  public getIndestructibleLayer(): Phaser.Tilemaps.TilemapLayer | null {
    return this.layers.get('indestructible') || null;
  }

  public getDestructibleLayer(): Phaser.Tilemaps.TilemapLayer | null {
    return this.layers.get('destructibleTiles') || null;
  }

  public getDestructibleObjects(): Phaser.Physics.Arcade.Group | null {
    return this.destructibleObjects;
  }

  public getDestructibleTerrain(): DestructibleTerrain | null {
    return this.destructibleTerrain;
  }

  public getMap(): Phaser.Tilemaps.Tilemap | null {
    return this.map;
  }

  public destroy(): void {
    this.layers.clear();
    if (this.destructibleTerrain) {
      this.destructibleTerrain.destroy();
    }
    if (this.destructibleObjects) {
      this.destructibleObjects.destroy(true);
    }
  }
}