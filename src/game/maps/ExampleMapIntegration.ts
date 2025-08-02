import Phaser from 'phaser';
import { MapManager } from './MapManager';
import { TiledMapLoader } from './TiledMapLoader';

/**
 * Example of how to integrate Tiled maps into your GameScene
 * This is a reference implementation showing the key integration points
 */
export class ExampleMapIntegration {
  private scene: Phaser.Scene;
  private mapLoader: TiledMapLoader | null = null;
  private mapManager: MapManager;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.mapManager = MapManager.getInstance();
  }

  /**
   * Call this in your scene's preload() method
   */
  public preloadMap(mapId: string): void {
    this.mapManager.preloadMap(this.scene, mapId);
  }

  /**
   * Call this in your scene's create() method
   */
  public createMap(mapId: string): void {
    this.mapLoader = this.mapManager.createMap(this.scene, mapId);
    
    if (!this.mapLoader) {
      console.error('Failed to create map:', mapId);
      return;
    }

    this.setupCollisions();
    this.setupEventListeners();
  }

  /**
   * Set up physics collisions between game objects and map layers
   */
  private setupCollisions(): void {
    if (!this.mapLoader) return;

    // Get the layers from the map loader
    const indestructibleLayer = this.mapLoader.getIndestructibleLayer();
    const destructibleLayer = this.mapLoader.getDestructibleLayer();
    const destructibleObjects = this.mapLoader.getDestructibleObjects();

    // Example: Set up player collisions (you'll need to adapt this to your player/physics groups)
    // this.scene.physics.add.collider(this.players, indestructibleLayer);
    // this.scene.physics.add.collider(this.players, destructibleLayer);
    
    // Example: Set up projectile interactions
    // this.scene.physics.add.overlap(this.projectiles, destructibleObjects, 
    //   (projectile, object) => this.handleProjectileHitObject(projectile, object));
  }

  /**
   * Set up event listeners for map-generated events
   */
  private setupEventListeners(): void {
    // Listen for spawn points found in the map
    this.scene.events.on('playerSpawnFound', (spawn: { x: number; y: number }) => {
      console.log('Player spawn found at:', spawn.x, spawn.y);
      // Add to your spawn points array
    });

    this.scene.events.on('weaponSpawnFound', (spawn: { x: number; y: number; weaponType: string }) => {
      console.log('Weapon spawn found:', spawn.weaponType, 'at', spawn.x, spawn.y);
      // Create weapon spawn in your game
    });
  }

  /**
   * Handle explosion effects on the map
   */
  public handleExplosion(x: number, y: number, radius: number, damage: number): void {
    if (!this.mapLoader) return;

    // Destroy terrain at explosion location
    this.mapLoader.destroyTerrain(x, y, radius, damage);

    // Damage destructible objects in range
    const destructibleObjects = this.mapLoader.getDestructibleObjects();
    if (destructibleObjects) {
      destructibleObjects.children.entries.forEach((gameObject: any) => {
        const distance = Phaser.Math.Distance.Between(x, y, gameObject.x, gameObject.y);
        if (distance <= radius) {
          this.damageDestructibleObject(gameObject, damage * (1 - distance / radius));
        }
      });
    }
  }

  /**
   * Damage a destructible object
   */
  private damageDestructibleObject(object: any, damage: number): void {
    object.health -= damage;
    
    if (object.health <= 0) {
      this.destroyObject(object);
    } else {
      // Visual feedback for damage (change tint, play sound, etc.)
      object.setTint(0xff6666);
      this.scene.time.delayedCall(100, () => {
        object.clearTint();
      });
    }
  }

  /**
   * Destroy a destructible object
   */
  private destroyObject(object: any): void {
    // Create destruction effects
    this.createObjectDestructionEffect(object.x, object.y, object.objectType);
    
    // Drop reward if specified
    if (object.reward) {
      this.spawnReward(object.x, object.y, object.reward);
    }
    
    // Special handling for explosive objects
    if (object.objectType === 'destructibleBarrel') {
      // Create secondary explosion
      const explosionRadius = object.explosionRadius || 100;
      const explosionDamage = object.explosionDamage || 50;
      this.handleExplosion(object.x, object.y, explosionRadius, explosionDamage);
    }
    
    // Remove the object
    object.destroy();
  }

  /**
   * Create visual effects for object destruction
   */
  private createObjectDestructionEffect(x: number, y: number, objectType: string): void {
    // Create particles based on object type
    let particleTexture = 'debris';
    let particleConfig = {
      scale: { start: 0.3, end: 0 },
      speed: { min: 50, max: 150 },
      lifespan: 1000,
      quantity: 8,
      angle: { min: 0, max: 360 },
      alpha: { start: 0.8, end: 0 }
    };

    if (objectType === 'destructibleBarrel') {
      particleTexture = 'explosion';
      particleConfig = {
        ...particleConfig,
        quantity: 15,
        speed: { min: 100, max: 300 },
        scale: { start: 0.5, end: 0 }
      };
    }

    const particles = this.scene.add.particles(x, y, particleTexture, particleConfig);
    
    // Auto-destroy particles
    this.scene.time.delayedCall(1000, () => {
      particles.destroy();
    });

    // Screen shake for explosions
    if (objectType === 'destructibleBarrel') {
      this.scene.cameras.main.shake(300, 0.01);
    }
  }

  /**
   * Spawn rewards when objects are destroyed
   */
  private spawnReward(x: number, y: number, rewardType: string): void {
    console.log('Spawning reward:', rewardType, 'at', x, y);
    // Implement reward spawning logic
    // This could be health packs, ammo, weapons, etc.
  }

  /**
   * Get available spawn points from the current map
   */
  public getPlayerSpawns(): { x: number; y: number }[] {
    // This would return spawn points found in the map
    // For now, return the default spawns from MapManager
    return this.mapManager.getPlayerSpawns('current_map');
  }

  /**
   * Get weapon spawn points from the current map
   */
  public getWeaponSpawns(): { x: number; y: number; weaponType: string }[] {
    return this.mapManager.getWeaponSpawns('current_map');
  }

  /**
   * Clean up when changing maps or destroying the scene
   */
  public cleanup(): void {
    this.mapManager.cleanup();
    this.mapLoader = null;
  }
}