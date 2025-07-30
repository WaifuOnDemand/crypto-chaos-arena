import Phaser from 'phaser';
import { PlayerState, GameControls } from '../../types/game';

export class Player extends Phaser.Physics.Arcade.Sprite {
  public playerState: PlayerState;
  private controls: GameControls;
  private dashCooldownTimer: number = 0;
  private jumpCount: number = 0;
  private maxJumps: number = 2;

  constructor(scene: Phaser.Scene, x: number, y: number, playerId: string) {
    super(scene, x, y, 'player');
    
    this.playerState = {
      id: playerId,
      x,
      y,
      velocityX: 0,
      velocityY: 0,
      health: 100,
      maxHealth: 100,
      armor: 0,
      weapons: [],
      activeWeapon: -1,
      isAlive: true,
      kills: 0,
      deaths: 0,
      canJump: true,
      canDoubleJump: true,
      dashCooldown: 0,
      facing: 'right',
    };

    this.controls = {
      left: false,
      right: false,
      jump: false,
      dash: false,
      fire: false,
      switchWeapon: false,
      aim: { x: 0, y: 0 },
    };

    // Add to scene
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Configure physics body
    if (this.body) {
      (this.body as Phaser.Physics.Arcade.Body).setSize(24, 40);
      (this.body as Phaser.Physics.Arcade.Body).setOffset(4, 8);
    }
    this.setCollideWorldBounds(true);

    // Create simple rectangle sprite for now
    this.createPlayerSprite();
  }

  private createPlayerSprite(): void {
    // Create a simple colored rectangle for the player
    const graphics = this.scene.add.graphics();
    graphics.fillStyle(0x00ff00); // Green player
    graphics.fillRect(0, 0, 24, 40);
    graphics.generateTexture('player', 24, 40);
    graphics.destroy();
    
    this.setTexture('player');
  }

  public updateControls(controls: Partial<GameControls>): void {
    Object.assign(this.controls, controls);
  }

  public update(time: number, delta: number): void {
    this.updateMovement(delta);
    this.updateTimers(delta);
    this.updatePlayerState();
    
    // Emit player update event for HUD
    this.scene.game.events.emit('playerUpdate', this.playerState);
  }

  private updateMovement(delta: number): void {
    const speed = 200;
    let velocityX = 0;
    const body = this.body as Phaser.Physics.Arcade.Body;
    let velocityY = body.velocity.y;

    // Horizontal movement
    if (this.controls.left) {
      velocityX = -speed;
      this.playerState.facing = 'left';
      this.setFlipX(true);
    } else if (this.controls.right) {
      velocityX = speed;
      this.playerState.facing = 'right';
      this.setFlipX(false);
    }

    // Jumping
    if (this.controls.jump && this.jumpCount < this.maxJumps) {
      if (body.onFloor() || this.jumpCount === 0) {
        velocityY = -400;
        this.jumpCount = body.onFloor() ? 1 : 2;
      } else if (this.jumpCount === 1) {
        velocityY = -350; // Slightly weaker double jump
        this.jumpCount = 2;
      }
    }

    // Reset jump count when on ground
    if (body.onFloor()) {
      this.jumpCount = 0;
    }

    // Dashing
    if (this.controls.dash && this.dashCooldownTimer <= 0) {
      const dashForce = 300;
      if (this.controls.left) {
        velocityX = -dashForce;
      } else if (this.controls.right) {
        velocityX = dashForce;
      }
      this.dashCooldownTimer = 1000; // 1 second cooldown
    }

    this.setVelocity(velocityX, velocityY);
  }

  private updateTimers(delta: number): void {
    if (this.dashCooldownTimer > 0) {
      this.dashCooldownTimer -= delta;
      this.playerState.dashCooldown = Math.max(0, this.dashCooldownTimer);
    }
  }

  private updatePlayerState(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    this.playerState.x = this.x;
    this.playerState.y = this.y;
    this.playerState.velocityX = body.velocity.x;
    this.playerState.velocityY = body.velocity.y;
    this.playerState.canJump = body.onFloor();
    this.playerState.canDoubleJump = this.jumpCount < this.maxJumps;
  }

  public takeDamage(damage: number): boolean {
    if (!this.playerState.isAlive) return false;

    // Apply armor reduction
    let actualDamage = damage;
    if (this.playerState.armor > 0) {
      const armorAbsorption = Math.min(damage * 0.5, this.playerState.armor);
      actualDamage -= armorAbsorption;
      this.playerState.armor -= armorAbsorption;
    }

    this.playerState.health -= actualDamage;
    
    if (this.playerState.health <= 0) {
      this.playerState.health = 0;
      this.playerState.isAlive = false;
      this.playerState.deaths++;
      this.die();
      return true; // Player died
    }

    // Damage flash effect
    this.setTint(0xff0000);
    this.scene.time.delayedCall(100, () => {
      this.clearTint();
    });

    return false; // Player survived
  }

  private die(): void {
    this.setVisible(false);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.enable = false;
    
    // Respawn after 3 seconds
    this.scene.time.delayedCall(3000, () => {
      this.respawn();
    });
  }

  private respawn(): void {
    // Reset to spawn position (simplified)
    this.setPosition(100, 100);
    this.playerState.health = this.playerState.maxHealth;
    this.playerState.armor = 0;
    this.playerState.isAlive = true;
    this.setVisible(true);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.enable = true;
    this.clearTint();
  }

  public addKill(): void {
    this.playerState.kills++;
  }
}