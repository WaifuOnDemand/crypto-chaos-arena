import Phaser from 'phaser';
import { PlayerState, GameControls, StatusEffect } from '../../types/game';
import { Weapon } from './Weapon';
import { Projectile } from './Projectile';
import { StatusEffectsManager } from './StatusEffectsManager';

export class Player extends Phaser.Physics.Arcade.Sprite {
  public playerState: PlayerState;
  private controls: GameControls;
  protected dashCooldownTimer: number = 0;
  private jumpCount: number = 0;
  private maxJumps: number = 2;
  private weapons: Weapon[] = [];
  private activeWeaponIndex: number = -1;
  private meleeWeapon: Weapon;
  private statusEffectsManager: StatusEffectsManager;
  private baseSpeed: number = 200;

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
      statusEffects: [],
    };

    // Initialize with knife
    this.meleeWeapon = new Weapon('knife');
    
    // Initialize status effects manager
    this.statusEffectsManager = new StatusEffectsManager(scene);

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
    this.updateStatusEffects(time, delta);
    this.updateMovement(delta);
    this.updateTimers(delta);
    this.updatePlayerState();
    this.handleCombat(time);
    
    // Emit player update event for HUD
    this.scene.game.events.emit('playerUpdate', this.playerState);
  }

  private updateStatusEffects(time: number, delta: number): void {
    // Update status effects and apply damage from DOT effects
    const statusModifiers = this.statusEffectsManager.updateEffects(time, delta, this);
    
    // Apply status effect damage
    if (statusModifiers.damage > 0 && this.playerState.isAlive) {
      this.takeDamage(statusModifiers.damage);
    }
    
    // Update visual effect positions
    this.statusEffectsManager.updateVisualEffectPositions(this.x, this.y);
    
    // Update player state with current status effects
    this.playerState.statusEffects = this.statusEffectsManager.getActiveEffects();
  }

  private updateMovement(delta: number): void {
    // Get speed and jump modifiers from status effects
    const statusModifiers = this.statusEffectsManager.updateEffects(Date.now(), delta, this);
    const speed = this.baseSpeed * statusModifiers.speedModifier;
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

    // Jumping (affected by status effects)
    if (this.controls.jump && this.jumpCount < this.maxJumps) {
      const jumpForce = -400 * statusModifiers.jumpModifier;
      const doubleJumpForce = -350 * statusModifiers.jumpModifier;
      
      if (body.onFloor() || this.jumpCount === 0) {
        velocityY = jumpForce;
        this.jumpCount = body.onFloor() ? 1 : 2;
      } else if (this.jumpCount === 1) {
        velocityY = doubleJumpForce;
        this.jumpCount = 2;
      }
    }

    // Reset jump count when on ground
    if (body.onFloor()) {
      this.jumpCount = 0;
    }

    // Dashing
    if (this.controls.dash && this.dashCooldownTimer <= 0) {
      const dashForce = 400;
      if (this.controls.left) {
        velocityX = -dashForce;
      } else if (this.controls.right) {
        velocityX = dashForce;
      } else {
        // Dash in facing direction if no direction pressed
        velocityX = this.playerState.facing === 'right' ? dashForce : -dashForce;
      }
      this.dashCooldownTimer = 1000; // 1 second cooldown
      
      // Apply dash impulse immediately
      body.setVelocityX(velocityX);
      return; // Skip normal velocity setting for this frame
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

  private handleCombat(time: number): void {
    if (this.controls.fire) {
      this.fire(time);
    }
    
    if (this.controls.switchWeapon) {
      this.switchWeapon();
    }
  }

  private fire(time: number): void {
    const weapon = this.getActiveWeapon();
    if (!weapon || !weapon.canFire(time)) return;

    if (weapon.config.id === 'knife') {
      this.meleeAttack();
    } else {
      this.fireProjectile(weapon, time);
    }
  }

  private meleeAttack(): void {
    if (!this.meleeWeapon.canFire(Date.now())) return;
    
    this.meleeWeapon.fire(Date.now());
    
    // Create melee attack area
    const attackRange = this.meleeWeapon.config.range!;
    const attackX = this.playerState.facing === 'right' ? this.x + attackRange/2 : this.x - attackRange/2;
    const attackY = this.y;
    
    // Emit melee attack event
    this.scene.game.events.emit('meleeAttack', {
      x: attackX,
      y: attackY,
      width: attackRange,
      height: 40,
      damage: this.meleeWeapon.state.damage,
      playerId: this.playerState.id,
    });
    
    // Visual effect
    const flash = this.scene.add.graphics();
    flash.fillStyle(0xffffff, 0.8);
    flash.fillRect(attackX - attackRange/2, attackY - 20, attackRange, 40);
    this.scene.time.delayedCall(50, () => flash.destroy());
  }

  private fireProjectile(weapon: Weapon, time: number): void {
    if (!weapon.fire(time)) return;

    const aimX = this.controls.aim.x - this.x;
    const aimY = this.controls.aim.y - this.y;
    const aimLength = Math.sqrt(aimX * aimX + aimY * aimY);
    
    if (aimLength === 0) return;
    
    const normalizedX = aimX / aimLength;
    const normalizedY = aimY / aimLength;
    
    const projectileCount = weapon.config.projectileCount || 1;
    const spread = weapon.config.spread || 0;
    
    for (let i = 0; i < projectileCount; i++) {
      let angleOffset = 0;
      if (projectileCount > 1) {
        angleOffset = (i - (projectileCount - 1) / 2) * (spread / projectileCount) * (Math.PI / 180);
      }
      
      const cos = Math.cos(angleOffset);
      const sin = Math.sin(angleOffset);
      const finalX = normalizedX * cos - normalizedY * sin;
      const finalY = normalizedX * sin + normalizedY * cos;
      
      const velocityX = finalX * weapon.config.projectileSpeed;
      const velocityY = finalY * weapon.config.projectileSpeed;
      
      // Spawn projectile slightly ahead of player
      const spawnOffsetX = this.playerState.facing === 'right' ? 20 : -20;
      const spawnX = this.x + spawnOffsetX;
      const spawnY = this.y - 5; // Slightly above center
      
      const projectileState = {
        id: `${this.playerState.id}_${time}_${i}`,
        x: spawnX,
        y: spawnY,
        velocityX,
        velocityY,
        damage: weapon.state.damage,
        playerId: this.playerState.id,
        weaponType: weapon.config.id,
        bounces: weapon.config.bounces,
        bounceDecay: weapon.config.bounceDecay,
        explosive: weapon.config.explosive,
        explosionRadius: weapon.config.explosionRadius,
        explosionDelay: weapon.config.explosionDelay,
        timeAlive: 0,
      };
      
      const projectile = new Projectile(
        this.scene,
        spawnX,
        spawnY,
        velocityX,
        velocityY,
        projectileState
      );
      
      // Add to projectiles group for collision detection
      this.scene.game.events.emit('projectileCreated', projectile);
    }
    
    // Remove weapon if empty
    if (weapon.isEmpty() && weapon.config.id !== 'knife') {
      this.removeWeapon(this.activeWeaponIndex);
    }
    
    this.updateWeaponStates();
  }

  private switchWeapon(): void {
    if (this.weapons.length === 0) return;
    
    this.activeWeaponIndex = (this.activeWeaponIndex + 1) % this.weapons.length;
    this.playerState.activeWeapon = this.activeWeaponIndex;
  }

  private getActiveWeapon(): Weapon | null {
    if (this.activeWeaponIndex >= 0 && this.activeWeaponIndex < this.weapons.length) {
      return this.weapons[this.activeWeaponIndex];
    }
    return this.meleeWeapon; // Default to knife
  }

  public addWeapon(weaponId: string): boolean {
    if (this.weapons.length >= 2) return false; // Max 2 weapons + knife
    
    const weapon = new Weapon(weaponId);
    this.weapons.push(weapon);
    
    if (this.activeWeaponIndex === -1) {
      this.activeWeaponIndex = 0;
      this.playerState.activeWeapon = 0;
    }
    
    this.updateWeaponStates();
    return true;
  }

  private removeWeapon(index: number): void {
    if (index < 0 || index >= this.weapons.length) return;
    
    this.weapons.splice(index, 1);
    
    if (this.activeWeaponIndex >= this.weapons.length) {
      this.activeWeaponIndex = this.weapons.length - 1;
    }
    
    if (this.weapons.length === 0) {
      this.activeWeaponIndex = -1;
    }
    
    this.playerState.activeWeapon = this.activeWeaponIndex;
    this.updateWeaponStates();
  }

  private updateWeaponStates(): void {
    this.playerState.weapons = this.weapons.map(w => w.state);
  }

  public addKill(): void {
    this.playerState.kills++;
  }

  public heal(amount: number): boolean {
    if (!this.playerState.isAlive || this.playerState.health >= this.playerState.maxHealth) {
      return false;
    }
    
    const oldHealth = this.playerState.health;
    this.playerState.health = Math.min(this.playerState.maxHealth, this.playerState.health + amount);
    const actualHealing = this.playerState.health - oldHealth;
    
    if (actualHealing > 0) {
      // Healing visual effect
      this.setTint(0x00ff00);
      this.scene.time.delayedCall(200, () => {
        this.clearTint();
      });
      
      // Floating heal text
      const healText = this.scene.add.text(this.x, this.y - 40, `+${Math.round(actualHealing)}`, {
        fontSize: '16px',
        color: '#00ff00',
        fontFamily: 'monospace',
      }).setOrigin(0.5);
      
      this.scene.tweens.add({
        targets: healText,
        y: healText.y - 30,
        alpha: 0,
        duration: 1000,
        onComplete: () => healText.destroy(),
      });
      
      return true;
    }
    
    return false;
  }

  public addStatusEffect(type: StatusEffect['type'], duration: number, intensity: number): void {
    this.statusEffectsManager.addStatusEffect(type, duration, intensity);
  }

  public removeStatusEffect(type: StatusEffect['type']): void {
    this.statusEffectsManager.removeStatusEffect(type);
  }

  public hasStatusEffect(type: StatusEffect['type']): boolean {
    return this.statusEffectsManager.hasEffect(type);
  }

  public clearAllStatusEffects(): void {
    this.statusEffectsManager.clearAllEffects();
    this.playerState.statusEffects = [];
  }

  public destroy(fromScene?: boolean): void {
    this.statusEffectsManager.destroy();
    super.destroy(fromScene);
  }
}