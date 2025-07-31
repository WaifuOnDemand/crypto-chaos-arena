import Phaser from 'phaser';
import { ProjectileState } from '../../types/game';

export class Projectile extends Phaser.Physics.Arcade.Sprite {
  public projectileState: ProjectileState;
  private lifeTimer: number = 0;
  private maxLifetime: number = 3000; // 3 seconds max lifetime
  private bouncesRemaining: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    velocityX: number,
    velocityY: number,
    projectileState: ProjectileState
  ) {
    super(scene, x, y, 'projectile');
    
    this.projectileState = projectileState;
    this.bouncesRemaining = projectileState.bounces || 0;

    // Add to scene
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Set up physics
    this.setVelocity(velocityX, velocityY);
    if (this.body) {
      (this.body as Phaser.Physics.Arcade.Body).setSize(4, 4);
      this.setCollideWorldBounds(true);
      (this.body as Phaser.Physics.Arcade.Body).onWorldBounds = true;
    }

    // Create visual based on projectile type
    this.createProjectileSprite();

    // Set up world bounds collision for bouncing projectiles
    if (this.bouncesRemaining > 0) {
      scene.physics.world.on('worldbounds', this.handleWorldBounce, this);
    }
  }

  private createProjectileSprite(): void {
    const graphics = this.scene.add.graphics();
    
    switch (this.projectileState.weaponType) {
      case 'rocket':
        graphics.fillStyle(0xff6b00); // Orange rocket
        graphics.fillRect(0, 0, 8, 3);
        graphics.generateTexture('rocket_projectile', 8, 3);
        this.setTexture('rocket_projectile');
        break;
      case 'grenade':
        graphics.fillStyle(0x4a90e2); // Blue grenade
        graphics.fillCircle(3, 3, 3);
        graphics.generateTexture('grenade_projectile', 6, 6);
        this.setTexture('grenade_projectile');
        break;
      default:
        graphics.fillStyle(0xffd700); // Gold bullet
        graphics.fillRect(0, 0, 4, 2);
        graphics.generateTexture('bullet_projectile', 4, 2);
        this.setTexture('bullet_projectile');
        break;
    }
    
    graphics.destroy();
  }

  private handleWorldBounce(event: any, body: Phaser.Physics.Arcade.Body): void {
    if (body === this.body && this.bouncesRemaining > 0) {
      this.bouncesRemaining--;
      
      // Add some randomness to bounces
      const currentVel = this.body!.velocity;
      this.setVelocity(
        currentVel.x * 0.8 + (Math.random() - 0.5) * 50,
        currentVel.y * 0.8 + (Math.random() - 0.5) * 50
      );
      
      if (this.bouncesRemaining <= 0) {
        this.explode();
      }
    }
  }

  public update(time: number, delta: number): void {
    this.lifeTimer += delta;
    
    // Update projectile state
    const body = this.body as Phaser.Physics.Arcade.Body;
    this.projectileState.x = this.x;
    this.projectileState.y = this.y;
    this.projectileState.velocityX = body.velocity.x;
    this.projectileState.velocityY = body.velocity.y;

    // Check lifetime
    if (this.lifeTimer >= this.maxLifetime) {
      this.explode();
      return;
    }

    // Rotate rockets to face direction of travel
    if (this.projectileState.weaponType === 'rocket') {
      this.rotation = Math.atan2(body.velocity.y, body.velocity.x);
    }
  }

  public explode(): void {
    if (this.projectileState.explosive) {
      // Create explosion effect
      const particles = this.scene.add.particles(this.x, this.y, 'bullet_projectile', {
        scale: { start: 0.3, end: 0 },
        speed: { min: 50, max: 150 },
        lifespan: 300,
        quantity: 8,
        tint: 0xff6b00,
      });
      
      particles.explode();
      
      // Emit explosion event for damage calculation
      this.scene.game.events.emit('explosion', {
        x: this.x,
        y: this.y,
        radius: this.projectileState.explosionRadius || 50,
        damage: this.projectileState.damage,
        playerId: this.projectileState.playerId,
      });
      
      // Screen shake
      this.scene.cameras.main.shake(200, 0.02);
    }

    this.destroy();
  }

  public hit(): void {
    if (this.projectileState.explosive) {
      this.explode();
    } else {
      this.destroy();
    }
  }
}