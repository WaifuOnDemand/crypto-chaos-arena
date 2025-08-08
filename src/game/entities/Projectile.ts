import Phaser from 'phaser';
import { ProjectileState } from '../../types/game';

export class Projectile extends Phaser.Physics.Arcade.Sprite {
  public projectileState: ProjectileState;
  private lifeTimer: number = 0;
  private maxLifetime: number = 5000; // 5 seconds max lifetime
  private bouncesRemaining: number;
  private explosionTimer?: Phaser.Time.TimerEvent;
  private isBeeping: boolean = false;
  private initialVelocityX: number = 0;
  private initialVelocityY: number = 0;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    projectileState: ProjectileState
  ) {
    super(scene, x, y, 'projectile');
    
    this.projectileState = projectileState;
    this.projectileState.timeAlive = 0;
    this.bouncesRemaining = projectileState.bounces || 0;

    // Add to scene
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Set up physics (velocity will be set later via setInitialVelocity)
    if (this.body) {
      (this.body as Phaser.Physics.Arcade.Body).setSize(4, 4);
      this.setCollideWorldBounds(true);
      (this.body as Phaser.Physics.Arcade.Body).onWorldBounds = true;
      
      // Set gravity for projectiles
      if (projectileState.weaponType === 'grenade') {
        (this.body as Phaser.Physics.Arcade.Body).setGravityY(400); // Normal gravity for grenades
        (this.body as Phaser.Physics.Arcade.Body).setBounce(0.8, 0.8); // Improved bounce for grenades
      } else if (projectileState.weaponType === 'rocket') {
        // Rockets: Completely unaffected by gravity
        (this.body as Phaser.Physics.Arcade.Body).setGravityY(-800); // Completely cancel world gravity
        (this.body as Phaser.Physics.Arcade.Body).setDrag(0, 0); // No air resistance
        (this.body as Phaser.Physics.Arcade.Body).setMaxVelocity(800, 800); // Prevent excessive speeds
      } else {
        // Bullets: Completely unaffected by gravity
        (this.body as Phaser.Physics.Arcade.Body).setGravityY(-800); // Completely cancel world gravity
        (this.body as Phaser.Physics.Arcade.Body).setDrag(0, 0); // No air resistance
        (this.body as Phaser.Physics.Arcade.Body).setMaxVelocity(1000, 1000); // Allow high speeds for bullets
      }
    }

    // Create visual based on projectile type
    this.createProjectileSprite();

    // Set up world bounds collision for bouncing projectiles
    if (this.bouncesRemaining > 0) {
      scene.physics.world.on('worldbounds', this.handleWorldBounce, this);
    }
    
    // Set up explosion timer for grenades
    if (projectileState.weaponType === 'grenade' && projectileState.explosionDelay) {
      this.startGrenadeTimer();
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
        graphics.fillCircle(6, 6, 6);
        graphics.generateTexture('grenade_projectile', 8, 8);
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

  public setInitialVelocity(velocityX: number, velocityY: number): void {
    this.setVelocity(velocityX, velocityY);
  }

  private startGrenadeTimer(): void {
    if (!this.projectileState.explosionDelay) return;
    
    // Start explosion timer
    this.explosionTimer = this.scene.time.delayedCall(this.projectileState.explosionDelay, () => {
      this.explode();
    });
    
    // Start beeping sound/visual at 1 second remaining
    const beepStartTime = Math.max(0, this.projectileState.explosionDelay - 1000);
    this.scene.time.delayedCall(beepStartTime, () => {
      this.startBeeping();
    });
  }
  
  private startBeeping(): void {
    this.isBeeping = true;
    
    // Create rapid blinking effect for last second
    this.scene.tweens.add({
      targets: this,
      alpha: 0.3,
      duration: 200,
      yoyo: true,
      repeat: -1,
      ease: 'Power2'
    });
    
    // Add red tint for danger
    this.setTint(0xff0000);
  }

  private handleWorldBounce(event: any, body: Phaser.Physics.Arcade.Body): void {
    if (body === this.body && this.bouncesRemaining > 0) {
      this.bouncesRemaining--;
      
      // Apply bounce decay
      const decay = this.projectileState.bounceDecay || 0.8;
      const currentVel = this.body!.velocity;
      
      // Add some randomness to bounces and apply decay
      this.setVelocity(
        currentVel.x * decay + (Math.random() - 0.5) * 30,
        Math.abs(currentVel.y) * decay + (Math.random() - 0.5) * 30 // Ensure upward bounce
      );
      
      // Create bounce particles
      this.scene.add.particles(this.x, this.y, 'grenade_projectile', {
        scale: { start: 0.2, end: 0 },
        speed: { min: 20, max: 60 },
        lifespan: 400,
        quantity: 3,
        tint: 0x888888,
      });
      
      // If no more bounces and it's a grenade, it stays on ground until timer expires
      if (this.bouncesRemaining <= 0 && this.projectileState.weaponType === 'grenade') {
        // Make it stop moving horizontally but can still roll slightly
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setVelocityX(body.velocity.x * 0.1);
        body.setDrag(100, 0); // Add friction
      }
    }
  }

  public update(time: number, delta: number): void {
    this.lifeTimer += delta;
    this.projectileState.timeAlive = this.lifeTimer;
    
    // Update projectile state
    const body = this.body as Phaser.Physics.Arcade.Body;
    this.projectileState.x = this.x;
    this.projectileState.y = this.y;
    this.projectileState.velocityX = body.velocity.x;
    this.projectileState.velocityY = body.velocity.y;

    // Check lifetime (but don't auto-explode grenades with timers)
    if (this.lifeTimer >= this.maxLifetime) {
      if (this.projectileState.weaponType !== 'grenade' || !this.projectileState.explosionDelay) {
        this.explode();
        return;
      }
    }

    // Rotate rockets to face direction of travel
    if (this.projectileState.weaponType === 'rocket') {
      this.rotation = Math.atan2(body.velocity.y, body.velocity.x);
    }
    
    // Slight rotation for grenades when moving
    if (this.projectileState.weaponType === 'grenade' && !this.isBeeping) {
      this.rotation += delta * 0.005 * Math.abs(body.velocity.x + body.velocity.y) * 0.01;
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
    // Grenades don't explode on impact - they use their timer
    if (this.projectileState.weaponType === 'grenade' && this.projectileState.explosionDelay) {
      // Just bounce or roll, don't explode
      return;
    }
    
    if (this.projectileState.explosive) {
      // Create explosion effect
      this.scene.game.events.emit('explosion', {
        x: this.x,
        y: this.y,
        radius: this.projectileState.explosionRadius || 100,
        damage: this.projectileState.damage,
        playerId: this.projectileState.playerId
      });
      
      // Destroy terrain in explosion radius
      this.scene.events.emit('terrainExplosion', {
        x: this.x,
        y: this.y,
        radius: this.projectileState.explosionRadius || 100,
        damage: this.projectileState.damage * 2 // More damage to terrain
      });
      
      this.explode();
    } else {
      this.destroy();
    }
  }

  public destroy(fromScene?: boolean): void {
    // Clean up timer if it exists
    if (this.explosionTimer) {
      this.explosionTimer.destroy();
    }
    
    super.destroy(fromScene);
  }
}