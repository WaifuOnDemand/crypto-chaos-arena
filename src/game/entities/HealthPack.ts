import Phaser from 'phaser';
import { HealthPickupState } from '../../types/game';

export class HealthPack extends Phaser.Physics.Arcade.Sprite {
  public pickupState: HealthPickupState;
  private respawnTimer: number = 0;
  private floatTween?: Phaser.Tweens.Tween;
  private pulseTween?: Phaser.Tweens.Tween;
  private glow?: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, x: number, y: number, healAmount: number = 50) {
    super(scene, x, y, 'healthpack');
    
    this.pickupState = {
      id: `healthpack_${x}_${y}_${Date.now()}`,
      x,
      y,
      healAmount,
      active: true,
      respawnTime: 15000, // 15 seconds respawn time
    };

    // Add to scene
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Configure physics body
    if (this.body) {
      const body = this.body as Phaser.Physics.Arcade.Body;
      body.setSize(20, 20);
      body.immovable = true;
    }

    this.createVisuals();
    this.startAnimations();
  }

  private createVisuals(): void {
    // Create glow effect
    this.glow = this.scene.add.graphics();
    this.glow.fillStyle(0x00ff00, 0.3);
    this.glow.fillCircle(this.x, this.y, 25);
    
    // Create health pack sprite (simple cross for now)
    const graphics = this.scene.add.graphics();
    graphics.fillStyle(0x00ff00); // Green color
    graphics.fillRect(0, 0, 20, 20);
    graphics.fillStyle(0xffffff); // White cross
    graphics.fillRect(8, 4, 4, 12); // Vertical bar
    graphics.fillRect(4, 8, 12, 4); // Horizontal bar
    graphics.generateTexture('healthpack', 20, 20);
    graphics.destroy();
    
    this.setTexture('healthpack');
  }

  private startAnimations(): void {
    // Floating animation
    this.floatTween = this.scene.tweens.add({
      targets: this,
      y: this.y - 5,
      duration: 1500,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });

    // Pulsing glow effect
    if (this.glow) {
      this.pulseTween = this.scene.tweens.add({
        targets: this.glow,
        alpha: 0.6,
        duration: 1000,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
      });
    }
  }

  public update(time: number, delta: number): void {
    if (!this.pickupState.active) {
      this.respawnTimer -= delta;
      
      if (this.respawnTimer <= 0) {
        this.respawn();
      }
    }

    // Update glow position to follow the health pack
    if (this.glow) {
      this.glow.x = this.x - 25;
      this.glow.y = this.y - 25;
    }
  }

  public pickup(): number {
    if (!this.pickupState.active) return 0;
    
    this.pickupState.active = false;
    this.respawnTimer = this.pickupState.respawnTime;
    
    // Hide the health pack
    this.setVisible(false);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.enable = false;
    
    if (this.glow) {
      this.glow.setVisible(false);
    }
    
    // Stop animations
    if (this.floatTween) this.floatTween.pause();
    if (this.pulseTween) this.pulseTween.pause();
    
    // Pickup effect
    const emitter = this.scene.add.particles(this.x, this.y, 'healthpack', {
      scale: { start: 0.3, end: 0 },
      speed: { min: 50, max: 100 },
      lifespan: 500,
      quantity: 8,
      tint: 0x00ff00,
    });
    
    // Destroy the emitter after 1 second
    this.scene.time.addEvent({
      delay: 1000,
      callback: () => {
        emitter.stop();
        emitter.destroy();
      },
      callbackScope: this,
    });
    
    return this.pickupState.healAmount;
}

  private respawn(): void {
    this.pickupState.active = true;
    this.setVisible(true);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.enable = true;
    
    if (this.glow) {
      this.glow.setVisible(true);
    }
    
    // Resume animations
    if (this.floatTween) this.floatTween.resume();
    if (this.pulseTween) this.pulseTween.resume();
    
    // Respawn effect
    this.scene.add.particles(this.x, this.y, 'healthpack', {
      scale: { start: 0, end: 0.5 },
      speed: { min: 20, max: 40 },
      lifespan: 800,
      quantity: 12,
      tint: 0x00ff00,
    });
  }

  public isAvailable(): boolean {
    return this.pickupState.active;
  }

  public destroy(fromScene?: boolean): void {
    if (this.floatTween) this.floatTween.destroy();
    if (this.pulseTween) this.pulseTween.destroy();
    if (this.glow) this.glow.destroy();
    super.destroy(fromScene);
  }
}