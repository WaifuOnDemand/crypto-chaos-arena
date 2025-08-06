import Phaser from 'phaser';
import { Player } from './Player';
import { AIBot } from './AIBot';
import { Projectile } from './Projectile';

export type HazardType = 'lava' | 'spikes' | 'wind' | 'gravity-well' | 'teleporter' | 'moving-platform';

export interface HazardConfig {
  id: string;
  type: HazardType;
  x: number;
  y: number;
  width: number;
  height: number;
  damage?: number;
  force?: number;
  direction?: { x: number; y: number };
  active: boolean;
  cooldown?: number;
  linkedHazardId?: string; // For teleporters
  movementPattern?: {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    speed: number;
    loop: boolean;
  };
}

export class EnvironmentalHazard extends Phaser.Physics.Arcade.Sprite {
  public config: HazardConfig;
  private lastActivation: number = 0;
  private particleEmitter?: Phaser.GameObjects.Particles.ParticleEmitter;
  private warningGraphics?: Phaser.GameObjects.Graphics;
  private movementTween?: Phaser.Tweens.Tween;
  private affectedEntities: Set<string> = new Set();

  constructor(scene: Phaser.Scene, config: HazardConfig) {
    super(scene, config.x, config.y, 'hazard');
    
    this.config = config;
    
    // Add to scene
    scene.add.existing(this);
    scene.physics.add.existing(this, true); // Static body for most hazards
    
    // Configure physics body
    if (this.body) {
      (this.body as Phaser.Physics.Arcade.StaticBody).setSize(config.width, config.height);
    }
    
    this.createHazardVisual();
    this.setupHazardBehavior();
  }

  private createHazardVisual(): void {
    const graphics = this.scene.add.graphics();
    
    switch (this.config.type) {
      case 'lava':
        // Orange-red lava pool
        graphics.fillStyle(0xff4500, 0.8);
        graphics.fillRect(-this.config.width/2, -this.config.height/2, this.config.width, this.config.height);
        // Add bubbling effect
        graphics.fillStyle(0xff6500, 0.6);
        for (let i = 0; i < 5; i++) {
          const x = -this.config.width/2 + Math.random() * this.config.width;
          const y = -this.config.height/2 + Math.random() * this.config.height;
          graphics.fillCircle(x, y, 4 + Math.random() * 4);
        }
        break;
        
      case 'spikes':
        // Gray spikes
        graphics.fillStyle(0x666666);
        graphics.fillRect(-this.config.width/2, -this.config.height/2, this.config.width, this.config.height);
        // Add spike pattern
        graphics.fillStyle(0x444444);
        const spikeCount = Math.floor(this.config.width / 16);
        for (let i = 0; i < spikeCount; i++) {
          const x = -this.config.width/2 + (i * 16) + 8;
          graphics.fillTriangle(x - 6, this.config.height/2, x + 6, this.config.height/2, x, -this.config.height/2);
        }
        break;
        
      case 'wind':
        // Semi-transparent wind zone with particles
        graphics.fillStyle(0x87ceeb, 0.3);
        graphics.fillRect(-this.config.width/2, -this.config.height/2, this.config.width, this.config.height);
        // Add wind direction indicators
        graphics.lineStyle(2, 0x87ceeb, 0.8);
        const arrowCount = 3;
        for (let i = 0; i < arrowCount; i++) {
          const startX = -this.config.width/4 + (i * this.config.width/4);
          const startY = 0;
          const endX = startX + (this.config.direction?.x || 1) * 20;
          const endY = startY + (this.config.direction?.y || 0) * 20;
          graphics.beginPath();
          graphics.moveTo(startX, startY);
          graphics.lineTo(endX, endY);
          graphics.strokePath();
        }
        break;
        
      case 'gravity-well':
        // Purple swirling gravity well
        graphics.fillStyle(0x8a2be2, 0.6);
        graphics.fillCircle(0, 0, this.config.width/2);
        graphics.fillStyle(0x9932cc, 0.4);
        graphics.fillCircle(0, 0, this.config.width/3);
        graphics.fillStyle(0xba55d3, 0.3);
        graphics.fillCircle(0, 0, this.config.width/4);
        break;
        
      case 'teleporter':
        // Blue teleporter pad
        graphics.fillStyle(0x00bfff, 0.8);
        graphics.fillCircle(0, 0, this.config.width/2);
        graphics.lineStyle(3, 0x0099cc);
        graphics.strokeCircle(0, 0, this.config.width/2);
        // Add inner rings
        graphics.strokeCircle(0, 0, this.config.width/3);
        graphics.strokeCircle(0, 0, this.config.width/6);
        break;
        
      case 'moving-platform':
        // Green moving platform
        graphics.fillStyle(0x32cd32);
        graphics.fillRect(-this.config.width/2, -this.config.height/2, this.config.width, this.config.height);
        graphics.lineStyle(2, 0x228b22);
        graphics.strokeRect(-this.config.width/2, -this.config.height/2, this.config.width, this.config.height);
        break;
    }
    
    graphics.generateTexture(`hazard_${this.config.type}_${this.config.id}`, this.config.width, this.config.height);
    graphics.destroy();
    
    this.setTexture(`hazard_${this.config.type}_${this.config.id}`);
  }

  private setupHazardBehavior(): void {
    switch (this.config.type) {
      case 'lava':
        this.setupLavaParticles();
        break;
        
      case 'spikes':
        this.setupSpikeTrap();
        break;
        
      case 'wind':
        this.setupWindParticles();
        break;
        
      case 'gravity-well':
        this.setupGravityWellParticles();
        break;
        
      case 'teleporter':
        this.setupTeleporterEffect();
        break;
        
      case 'moving-platform':
        this.setupMovingPlatform();
        break;
    }
  }

  private setupLavaParticles(): void {
    // Create bubbling particle effect
    this.particleEmitter = this.scene.add.particles(this.x, this.y, 'hazard_lava_' + this.config.id, {
      scale: { start: 0.1, end: 0.3 },
      speed: { min: 10, max: 30 },
      lifespan: 1000,
      quantity: 2,
      frequency: 200,
      tint: [0xff4500, 0xff6500, 0xffa500],
      emitZone: { 
        type: 'random', 
        source: new Phaser.Geom.Rectangle(-this.config.width/2, -this.config.height/2, this.config.width, this.config.height)
      }
    });
  }

  private setupSpikeTrap(): void {
    // Spikes activate when stepped on
    this.warningGraphics = this.scene.add.graphics();
    this.warningGraphics.setPosition(this.x, this.y);
    this.warningGraphics.setVisible(false);
  }

  private setupWindParticles(): void {
    // Create wind particle effect
    this.particleEmitter = this.scene.add.particles(this.x, this.y, 'hazard_wind_' + this.config.id, {
      scale: { start: 0.05, end: 0.15 },
      speed: { min: 50, max: 100 },
      lifespan: 800,
      quantity: 3,
      frequency: 100,
      alpha: { start: 0.6, end: 0 },
      tint: 0x87ceeb,
      emitZone: { 
        type: 'random', 
        source: new Phaser.Geom.Rectangle(-this.config.width/2, -this.config.height/2, this.config.width, this.config.height)
      },
      moveToX: this.x + (this.config.direction?.x || 1) * 100,
      moveToY: this.y + (this.config.direction?.y || 0) * 100
    });
  }

  private setupGravityWellParticles(): void {
    // Create swirling particle effect
    this.particleEmitter = this.scene.add.particles(this.x, this.y, 'hazard_gravity-well_' + this.config.id, {
      scale: { start: 0.1, end: 0 },
      speed: { min: 20, max: 40 },
      lifespan: 1500,
      quantity: 3,
      frequency: 150,
      tint: [0x8a2be2, 0x9932cc, 0xba55d3],
      emitZone: { 
        type: 'edge', 
        source: new Phaser.Geom.Circle(0, 0, this.config.width/2),
        quantity: 1
      }
    });
  }

  private setupTeleporterEffect(): void {
    // Create pulsing teleporter effect
    this.scene.tweens.add({
      targets: this,
      alpha: { from: 0.6, to: 1 },
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  private setupMovingPlatform(): void {
    if (!this.config.movementPattern) return;
    
    // Make this a kinematic body for moving platforms
    if (this.body) {
      this.scene.physics.world.remove(this.body);
    }
    this.scene.physics.add.existing(this, false); // Kinematic body
    
    const pattern = this.config.movementPattern;
    this.movementTween = this.scene.tweens.add({
      targets: this,
      x: { from: pattern.startX, to: pattern.endX },
      y: { from: pattern.startY, to: pattern.endY },
      duration: (Phaser.Math.Distance.Between(pattern.startX, pattern.startY, pattern.endX, pattern.endY) / pattern.speed) * 1000,
      yoyo: true,
      repeat: pattern.loop ? -1 : 0,
      ease: 'Linear'
    });
  }

  public handlePlayerInteraction(player: Player | AIBot): void {
    const now = Date.now();
    
    if (!this.config.active || (this.config.cooldown && now - this.lastActivation < this.config.cooldown)) {
      return;
    }

    switch (this.config.type) {
      case 'lava':
        this.handleLavaContact(player);
        break;
        
      case 'spikes':
        this.handleSpikeContact(player);
        break;
        
      case 'wind':
        this.handleWindEffect(player);
        break;
        
      case 'gravity-well':
        this.handleGravityEffect(player);
        break;
        
      case 'teleporter':
        this.handleTeleport(player);
        break;
        
      case 'moving-platform':
        // Moving platforms are handled by physics collision
        break;
    }
  }

  public handleProjectileInteraction(projectile: Projectile): void {
    switch (this.config.type) {
      case 'wind':
        this.handleProjectileWind(projectile);
        break;
        
      case 'gravity-well':
        this.handleProjectileGravity(projectile);
        break;
        
      case 'teleporter':
        this.handleProjectileTeleport(projectile);
        break;
    }
  }

  private handleLavaContact(player: Player | AIBot): void {
    if (this.affectedEntities.has(player.playerState.id)) return;
    
    const damage = this.config.damage || 15;
    player.takeDamage(damage);
    player.addStatusEffect('burned', 3000, 3); // 3 seconds of burning
    
    this.affectedEntities.add(player.playerState.id);
    this.scene.time.delayedCall(1000, () => {
      this.affectedEntities.delete(player.playerState.id);
    });
    
    this.lastActivation = Date.now();
  }

  private handleSpikeContact(player: Player | AIBot): void {
    const damage = this.config.damage || 25;
    player.takeDamage(damage);
    
    // Show warning effect
    if (this.warningGraphics) {
      this.warningGraphics.clear();
      this.warningGraphics.fillStyle(0xff0000, 0.6);
      this.warningGraphics.fillRect(-this.config.width/2, -this.config.height/2, this.config.width, this.config.height);
      this.warningGraphics.setVisible(true);
      
      this.scene.time.delayedCall(500, () => {
        this.warningGraphics?.setVisible(false);
      });
    }
    
    this.lastActivation = Date.now();
  }

  private handleWindEffect(player: Player | AIBot): void {
    const force = this.config.force || 200;
    const body = player.body as Phaser.Physics.Arcade.Body;
    
    if (this.config.direction) {
      body.setVelocity(
        body.velocity.x + this.config.direction.x * force * 0.016,
        body.velocity.y + this.config.direction.y * force * 0.016
      );
    }
  }

  private handleGravityEffect(player: Player | AIBot): void {
    const force = this.config.force || 150;
    const dx = this.x - player.x;
    const dy = this.y - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 0) {
      const normalizedX = dx / distance;
      const normalizedY = dy / distance;
      const body = player.body as Phaser.Physics.Arcade.Body;
      
      body.setVelocity(
        body.velocity.x + normalizedX * force * 0.016,
        body.velocity.y + normalizedY * force * 0.016
      );
    }
  }

  private handleTeleport(player: Player | AIBot): void {
    if (!this.config.linkedHazardId) return;
    
    // Find the linked teleporter
    const linkedTeleporter = (this.scene as any).environmentalHazards?.find(
      (h: EnvironmentalHazard) => h.config.id === this.config.linkedHazardId
    );
    
    if (linkedTeleporter) {
      player.setPosition(linkedTeleporter.x, linkedTeleporter.y - 20);
      
      // Teleport effect
      const effect = this.scene.add.graphics();
      effect.fillStyle(0x00bfff, 0.8);
      effect.fillCircle(player.x, player.y, 30);
      this.scene.tweens.add({
        targets: effect,
        scaleX: 2,
        scaleY: 2,
        alpha: 0,
        duration: 500,
        onComplete: () => effect.destroy()
      });
      
      this.lastActivation = Date.now();
    }
  }

  private handleProjectileWind(projectile: Projectile): void {
    const force = this.config.force || 100;
    if (this.config.direction && projectile.body) {
      const body = projectile.body as Phaser.Physics.Arcade.Body;
      body.setVelocity(
        body.velocity.x + this.config.direction.x * force * 0.016,
        body.velocity.y + this.config.direction.y * force * 0.016
      );
    }
  }

  private handleProjectileGravity(projectile: Projectile): void {
    const force = this.config.force || 75;
    const dx = this.x - projectile.x;
    const dy = this.y - projectile.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 0 && projectile.body) {
      const normalizedX = dx / distance;
      const normalizedY = dy / distance;
      const body = projectile.body as Phaser.Physics.Arcade.Body;
      
      body.setVelocity(
        body.velocity.x + normalizedX * force * 0.016,
        body.velocity.y + normalizedY * force * 0.016
      );
    }
  }

  private handleProjectileTeleport(projectile: Projectile): void {
    if (!this.config.linkedHazardId) return;
    
    const linkedTeleporter = (this.scene as any).environmentalHazards?.find(
      (h: EnvironmentalHazard) => h.config.id === this.config.linkedHazardId
    );
    
    if (linkedTeleporter) {
      projectile.setPosition(linkedTeleporter.x, linkedTeleporter.y);
    }
  }

  public update(time: number, delta: number): void {
    // Update particle emitter position for moving platforms
    if (this.config.type === 'moving-platform' && this.particleEmitter) {
      this.particleEmitter.setPosition(this.x, this.y);
    }
  }

  public destroy(fromScene?: boolean): void {
    if (this.particleEmitter) {
      this.particleEmitter.destroy();
    }
    if (this.warningGraphics) {
      this.warningGraphics.destroy();
    }
    if (this.movementTween) {
      this.movementTween.destroy();
    }
    super.destroy(fromScene);
  }
}