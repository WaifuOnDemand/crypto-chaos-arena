# Environmental Hazards System

This document explains how to integrate and configure environmental hazards in your game maps using the EnvironmentalManager and EnvironmentalHazard classes.

## Overview

Environmental hazards add dynamic gameplay elements to maps, including damage zones, movement modifiers, teleporters, and interactive platforms. The system supports both predefined hazards and dynamic hazard creation.

## Hazard Types

### Damage Hazards
- **Lava Pools**: Continuous damage zones with visual effects
- **Spike Traps**: High damage zones with cooldown periods

### Movement Modifiers
- **Wind Zones**: Apply directional forces to players and projectiles
- **Gravity Wells**: Pull entities toward the center point

### Interactive Elements
- **Teleporters**: Instant transport between linked locations
- **Moving Platforms**: Solid platforms that move along defined paths

## Basic Integration

### 1. Initialize Environmental Manager

```typescript
// In your GameScene.ts
import { EnvironmentalManager } from '../entities/EnvironmentalManager';

export class GameScene extends Phaser.Scene {
  private environmentalManager!: EnvironmentalManager;

  create() {
    // Initialize the manager
    this.environmentalManager = new EnvironmentalManager(this);
    
    // Initialize with map dimensions
    this.environmentalManager.initialize(mapWidth, mapHeight);
  }
}
```

### 2. Setup Collisions

```typescript
// After creating players, AI bots, and projectiles
this.environmentalManager.setupCollisions(
  this.player,
  this.aiBots,
  this.projectiles
);
```

### 3. Update Loop

```typescript
update(time: number, delta: number) {
  this.environmentalManager.update(time, delta);
  // ... other updates
}
```

## Configuration

### Hazard Configuration Interface

```typescript
interface HazardConfig {
  id: string;                    // Unique identifier
  type: HazardType;             // Type of hazard
  x: number;                    // X position
  y: number;                    // Y position
  width: number;                // Width of hazard area
  height: number;               // Height of hazard area
  active: boolean;              // Whether hazard is currently active
  
  // Optional properties (depending on hazard type)
  damage?: number;              // Damage per interaction
  force?: number;               // Force strength for movement hazards
  direction?: { x: number; y: number }; // Direction for wind zones
  cooldown?: number;            // Cooldown between activations (ms)
  linkedHazardId?: string;      // For teleporter pairs
  movementPattern?: {           // For moving platforms
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    speed: number;
    loop: boolean;
  };
}
```

## Creating Custom Hazards

### Method 1: Programmatically

```typescript
// Create a custom lava pool
const lavaConfig: HazardConfig = {
  id: 'custom_lava',
  type: 'lava',
  x: 300,
  y: 400,
  width: 100,
  height: 50,
  damage: 20,
  active: true,
  cooldown: 1000
};

const hazard = this.environmentalManager.createHazard(lavaConfig);
```

### Method 2: From Tiled Map Objects

```typescript
// In your map loading code
const mapObjects = map.getObjectLayer('Hazards');
if (mapObjects) {
  mapObjects.objects.forEach(obj => {
    const config: HazardConfig = {
      id: obj.name || `hazard_${obj.id}`,
      type: obj.properties.type as HazardType,
      x: obj.x,
      y: obj.y,
      width: obj.width,
      height: obj.height,
      active: obj.properties.active !== false,
      damage: obj.properties.damage || 10,
      force: obj.properties.force,
      direction: obj.properties.direction ? 
        JSON.parse(obj.properties.direction) : undefined,
      cooldown: obj.properties.cooldown || 1000
    };
    
    this.environmentalManager.createHazard(config);
  });
}
```

## Tiled Map Integration

### Setting up Hazards in Tiled

1. **Create Object Layer**: Add an object layer named "Hazards" to your map
2. **Add Objects**: Place rectangle objects where you want hazards
3. **Set Properties**: Add custom properties to each object:

#### Required Properties
- `type` (string): Hazard type ("lava", "spikes", "wind", "gravity-well", "teleporter", "moving-platform")

#### Optional Properties
- `damage` (number): Damage amount (default: 10)
- `force` (number): Force strength for movement hazards
- `direction` (string): JSON string for direction vector, e.g., `{"x": 1, "y": 0}`
- `cooldown` (number): Cooldown in milliseconds (default: 1000)
- `active` (boolean): Whether hazard starts active (default: true)
- `linkedHazardId` (string): ID of linked teleporter
- `movementPattern` (string): JSON string for moving platform pattern

#### Example Tiled Object Properties
```
Object: "Wind Zone"
Properties:
  - type: "wind"
  - force: 200
  - direction: {"x": 1, "y": -0.5}
  - active: true

Object: "Teleporter A"
Properties:
  - type: "teleporter"
  - linkedHazardId: "teleporter_b"
  - cooldown: 3000

Object: "Moving Platform"
Properties:
  - type: "moving-platform"
  - movementPattern: {"startX": 100, "startY": 200, "endX": 300, "endY": 200, "speed": 50, "loop": true}
```

## Hazard Management

### Runtime Control

```typescript
// Activate/deactivate hazards
this.environmentalManager.activateHazard('hazard_id');
this.environmentalManager.deactivateHazard('hazard_id');

// Remove hazards
this.environmentalManager.removeHazard('hazard_id');

// Get hazards
const hazard = this.environmentalManager.getHazardById('hazard_id');
const lavaHazards = this.environmentalManager.getHazardsByType('lava');
```

### Event Handling

Hazards automatically handle interactions with:
- **Players**: Damage, movement effects, teleportation
- **AI Bots**: Same effects as players
- **Projectiles**: Wind/gravity effects, teleportation, collision with platforms

## Visual Effects

Each hazard type has built-in visual effects:
- **Lava**: Orange glow effect and bubbling particles
- **Spikes**: Gray/metallic appearance with danger indicators
- **Wind**: Swirling particle effects showing direction
- **Gravity Wells**: Purple gravitational distortion effect
- **Teleporters**: Blue energy portal with pulsing animation
- **Moving Platforms**: Solid platforms with motion trails

## Performance Considerations

- **Limit Active Hazards**: Keep the number of active hazards reasonable (< 50)
- **Use Cooldowns**: Prevent spam interactions with appropriate cooldown timers
- **Optimize Particles**: Particle effects are created/destroyed as needed
- **Collision Groups**: Hazards use efficient overlap detection rather than collision

## Cleanup

The EnvironmentalManager automatically handles cleanup:

```typescript
destroy() {
  this.environmentalManager.destroy();
}
```

This removes all hazards, destroys particle effects, and cleans up collision handlers.

## Example Complete Integration

```typescript
export class GameScene extends Phaser.Scene {
  private environmentalManager!: EnvironmentalManager;

  create() {
    // Load map first
    const map = this.make.tilemap({ key: 'level1' });
    
    // Initialize environmental manager
    this.environmentalManager = new EnvironmentalManager(this);
    this.environmentalManager.initialize(map.widthInPixels, map.heightInPixels);
    
    // Load hazards from Tiled map
    const hazardLayer = map.getObjectLayer('Hazards');
    if (hazardLayer) {
      this.loadHazardsFromTiled(hazardLayer);
    }
    
    // Create game entities
    this.createPlayer();
    this.createAIBots();
    this.createProjectileGroup();
    
    // Setup all collisions
    this.environmentalManager.setupCollisions(
      this.player,
      this.aiBots,
      this.projectiles
    );
  }

  private loadHazardsFromTiled(hazardLayer: Phaser.Tilemaps.ObjectLayer) {
    hazardLayer.objects.forEach(obj => {
      const config: HazardConfig = {
        id: obj.name || `hazard_${obj.id}`,
        type: obj.properties.type,
        x: obj.x,
        y: obj.y,
        width: obj.width,
        height: obj.height,
        active: obj.properties.active !== false,
        damage: obj.properties.damage,
        force: obj.properties.force,
        direction: obj.properties.direction ? 
          JSON.parse(obj.properties.direction) : undefined,
        cooldown: obj.properties.cooldown,
        linkedHazardId: obj.properties.linkedHazardId,
        movementPattern: obj.properties.movementPattern ? 
          JSON.parse(obj.properties.movementPattern) : undefined
      };
      
      this.environmentalManager.createHazard(config);
    });
  }

  update(time: number, delta: number) {
    this.environmentalManager.update(time, delta);
    // ... other updates
  }

  destroy() {
    this.environmentalManager.destroy();
  }
}
```
