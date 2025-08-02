# Tiled Map Integration Guide

This system allows you to create maps in Tiled and load them into your Phaser game with support for multiple layers including destructible terrain.

## Map Structure

### Required Layers in Tiled:

1. **Background** (optional) - Decorative background elements
2. **Walls/Indestructible** - Permanent terrain that cannot be destroyed
3. **DestructibleTerrain** - Tiles that can be destroyed by explosions
4. **DestructibleObjects** (optional) - Object layer with destructible props
5. **Spawns** (optional) - Object layer with spawn points

### Tile Layers

Use tile layers for terrain:
- **Background**: Decorative tiles (clouds, distant buildings, etc.)
- **Indestructible**: Permanent walls and structures
- **DestructibleTerrain**: Breakable walls, cover, etc.

### Object Layers

Use object layers for dynamic elements:

#### Spawns Layer Objects:
- **playerSpawn**: Where players spawn
  - Properties: none
- **weaponSpawn**: Where weapons appear
  - Properties: `weaponType` (string): "pistol", "rifle", "shotgun", etc.

#### DestructibleObjects Layer Objects:
- **destructibleBox**: Breakable crates
  - Properties: 
    - `health` (number): How much damage it takes to destroy
    - `reward` (string): What drops when destroyed
- **destructibleBarrel**: Explosive barrels
  - Properties:
    - `health` (number)
    - `explosionRadius` (number)
    - `explosionDamage` (number)

## Tiled Export Settings

1. Export as JSON format
2. Save to `public/maps/[mapname].json`
3. Save tilesets to `public/tilesets/[tilesetname].png`

## Map Configuration

```typescript
const mapConfig: TiledMapConfig = {
  mapKey: 'your_map_name',
  tilesetKey: 'your_tileset',
  tilesetImage: 'your_tileset.png',
  layers: {
    background: 'Background',
    indestructible: 'Walls',
    destructibleTiles: 'DestructibleTerrain',
    destructibleObjects: 'DestructibleObjects',
    spawns: 'Spawns'
  }
};
```

## Usage in GameScene

```typescript
import { MapManager } from '../maps/MapManager';

export class GameScene extends Phaser.Scene {
  private mapLoader: TiledMapLoader | null = null;

  preload() {
    // Preload the map
    MapManager.getInstance().preloadMap(this, 'arena_1');
  }

  create() {
    // Create the map
    this.mapLoader = MapManager.getInstance().createMap(this, 'arena_1');
    
    if (this.mapLoader) {
      // Set up collisions with indestructible layer
      const indestructibleLayer = this.mapLoader.getIndestructibleLayer();
      if (indestructibleLayer) {
        this.physics.add.collider(this.players, indestructibleLayer);
      }

      // Set up collisions with destructible layer
      const destructibleLayer = this.mapLoader.getDestructibleLayer();
      if (destructibleLayer) {
        this.physics.add.collider(this.players, destructibleLayer);
      }

      // Handle destructible objects
      const destructibleObjects = this.mapLoader.getDestructibleObjects();
      if (destructibleObjects) {
        this.physics.add.overlap(this.projectiles, destructibleObjects, 
          (projectile, object) => this.handleDestructibleObjectHit(projectile, object));
      }
    }

    // Listen for spawn points
    this.events.on('playerSpawnFound', (spawn) => {
      this.playerSpawns.push(spawn);
    });

    this.events.on('weaponSpawnFound', (spawn) => {
      this.createWeaponSpawn(spawn.x, spawn.y, spawn.weaponType);
    });
  }

  private handleExplosion(x: number, y: number, radius: number, damage: number) {
    // Destroy terrain
    if (this.mapLoader) {
      this.mapLoader.destroyTerrain(x, y, radius, damage);
    }

    // Damage destructible objects
    const destructibleObjects = this.mapLoader?.getDestructibleObjects();
    if (destructibleObjects) {
      destructibleObjects.children.entries.forEach((object: any) => {
        const distance = Phaser.Math.Distance.Between(x, y, object.x, object.y);
        if (distance <= radius) {
          this.damageDestructibleObject(object, damage);
        }
      });
    }
  }
}
```

## Creating Maps in Tiled

1. Create a new map with your desired dimensions
2. Add your tileset image
3. Create the required layers:
   - Tile layers for terrain
   - Object layers for spawns and destructible objects
4. For object layers, create rectangles and set their `type` property
5. Add custom properties as needed
6. Export as JSON to your maps folder

## Tips

- Use different tile indices for different destructible terrain types (weak/strong)
- Place weapon spawns strategically around the map
- Ensure indestructible walls provide good map flow
- Test destruction radius to ensure good gameplay
- Use object properties to customize destructible object behavior