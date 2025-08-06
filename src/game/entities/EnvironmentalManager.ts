import Phaser from 'phaser';
import { EnvironmentalHazard, HazardConfig } from './EnvironmentalHazard';
import { Player } from './Player';
import { AIBot } from './AIBot';
import { Projectile } from './Projectile';

export class EnvironmentalManager {
  private scene: Phaser.Scene;
  private hazards: EnvironmentalHazard[] = [];
  private playerColliders: Phaser.Physics.Arcade.Collider[] = [];
  private projectileColliders: Phaser.Physics.Arcade.Collider[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  public initialize(mapWidth: number, mapHeight: number): void {
    this.createPredefinedHazards(mapWidth, mapHeight);
  }

  private createPredefinedHazards(mapWidth: number, mapHeight: number): void {
    const hazardConfigs: HazardConfig[] = [
      // Lava pools
      {
        id: 'lava_1',
        type: 'lava',
        x: 200,
        y: mapHeight - 80,
        width: 120,
        height: 40,
        damage: 15,
        active: true,
        cooldown: 1000
      },
      {
        id: 'lava_2',
        type: 'lava',
        x: 800,
        y: mapHeight - 80,
        width: 100,
        height: 40,
        damage: 15,
        active: true,
        cooldown: 1000
      },

      // Spike traps
      {
        id: 'spikes_1',
        type: 'spikes',
        x: 400,
        y: mapHeight - 50,
        width: 80,
        height: 20,
        damage: 25,
        active: true,
        cooldown: 2000
      },
      {
        id: 'spikes_2',
        type: 'spikes',
        x: 1000,
        y: mapHeight - 50,
        width: 80,
        height: 20,
        damage: 25,
        active: true,
        cooldown: 2000
      },

      // Wind zones
      {
        id: 'wind_1',
        type: 'wind',
        x: 600,
        y: mapHeight - 200,
        width: 150,
        height: 100,
        force: 200,
        direction: { x: 1, y: -0.5 },
        active: true
      },
      {
        id: 'wind_2',
        type: 'wind',
        x: 300,
        y: mapHeight - 350,
        width: 120,
        height: 80,
        force: 180,
        direction: { x: -1, y: 0 },
        active: true
      },

      // Gravity wells
      {
        id: 'gravity_1',
        type: 'gravity-well',
        x: 750,
        y: mapHeight - 300,
        width: 100,
        height: 100,
        force: 150,
        active: true
      },

      // Teleporter pair
      {
        id: 'teleporter_1',
        type: 'teleporter',
        x: 150,
        y: mapHeight - 150,
        width: 60,
        height: 60,
        active: true,
        linkedHazardId: 'teleporter_2',
        cooldown: 3000
      },
      {
        id: 'teleporter_2',
        type: 'teleporter',
        x: 1100,
        y: mapHeight - 350,
        width: 60,
        height: 60,
        active: true,
        linkedHazardId: 'teleporter_1',
        cooldown: 3000
      },

      // Moving platforms
      {
        id: 'platform_1',
        type: 'moving-platform',
        x: 500,
        y: mapHeight - 250,
        width: 120,
        height: 20,
        active: true,
        movementPattern: {
          startX: 450,
          startY: mapHeight - 250,
          endX: 650,
          endY: mapHeight - 250,
          speed: 50,
          loop: true
        }
      },
      {
        id: 'platform_2',
        type: 'moving-platform',
        x: 900,
        y: mapHeight - 400,
        width: 100,
        height: 20,
        active: true,
        movementPattern: {
          startX: 900,
          startY: mapHeight - 400,
          endX: 900,
          endY: mapHeight - 300,
          speed: 30,
          loop: true
        }
      }
    ];

    // Create hazards
    hazardConfigs.forEach(config => {
      this.createHazard(config);
    });
  }

  public createHazard(config: HazardConfig): EnvironmentalHazard {
    const hazard = new EnvironmentalHazard(this.scene, config);
    this.hazards.push(hazard);
    return hazard;
  }

  public setupCollisions(player: Player, aiBots: AIBot[], projectiles: Phaser.Physics.Arcade.Group): void {
    this.hazards.forEach(hazard => {
      // Player collision
      const playerCollider = this.scene.physics.add.overlap(
        player,
        hazard,
        (player, hazard) => {
          (hazard as EnvironmentalHazard).handlePlayerInteraction(player as Player);
        }
      );
      this.playerColliders.push(playerCollider);

      // AI bot collisions
      aiBots.forEach(bot => {
        const botCollider = this.scene.physics.add.overlap(
          bot,
          hazard,
          (bot, hazard) => {
            (hazard as EnvironmentalHazard).handlePlayerInteraction(bot as AIBot);
          }
        );
        this.playerColliders.push(botCollider);
      });

      // Projectile interactions (for wind, gravity wells, teleporters)
      if (['wind', 'gravity-well', 'teleporter'].includes(hazard.config.type)) {
        const projectileCollider = this.scene.physics.add.overlap(
          projectiles,
          hazard,
          (projectile, hazard) => {
            (hazard as EnvironmentalHazard).handleProjectileInteraction(projectile as Projectile);
          }
        );
        this.projectileColliders.push(projectileCollider);
      }

      // Moving platform collisions (solid platforms)
      if (hazard.config.type === 'moving-platform') {
        const platformCollider = this.scene.physics.add.collider(player, hazard);
        this.playerColliders.push(platformCollider);

        aiBots.forEach(bot => {
          const botPlatformCollider = this.scene.physics.add.collider(bot, hazard);
          this.playerColliders.push(botPlatformCollider);
        });

        const projectilePlatformCollider = this.scene.physics.add.collider(projectiles, hazard);
        this.projectileColliders.push(projectilePlatformCollider);
      }
    });

    // Store reference for cleanup
    (this.scene as any).environmentalHazards = this.hazards;
  }

  public update(time: number, delta: number): void {
    this.hazards.forEach(hazard => {
      hazard.update(time, delta);
    });
  }

  public getHazardById(id: string): EnvironmentalHazard | undefined {
    return this.hazards.find(hazard => hazard.config.id === id);
  }

  public getHazardsByType(type: string): EnvironmentalHazard[] {
    return this.hazards.filter(hazard => hazard.config.type === type);
  }

  public activateHazard(id: string): void {
    const hazard = this.getHazardById(id);
    if (hazard) {
      hazard.config.active = true;
    }
  }

  public deactivateHazard(id: string): void {
    const hazard = this.getHazardById(id);
    if (hazard) {
      hazard.config.active = false;
    }
  }

  public removeHazard(id: string): void {
    const index = this.hazards.findIndex(hazard => hazard.config.id === id);
    if (index !== -1) {
      this.hazards[index].destroy();
      this.hazards.splice(index, 1);
    }
  }

  public destroy(): void {
    // Clean up colliders
    this.playerColliders.forEach(collider => collider.destroy());
    this.projectileColliders.forEach(collider => collider.destroy());
    
    // Clean up hazards
    this.hazards.forEach(hazard => hazard.destroy());
    this.hazards = [];
    this.playerColliders = [];
    this.projectileColliders = [];
  }
}