import Phaser from 'phaser';
import { WEAPON_CONFIGS } from './Weapon';

export class WeaponSpawn extends Phaser.GameObjects.Container {
  private weaponType: string;
  private isActive: boolean = true;
  private respawnTimer: number = 0;
  private respawnDelay: number = 10000; // 10 seconds
  private glowEffect!: Phaser.GameObjects.Graphics;
  private weaponSprite!: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, x: number, y: number, weaponType?: string) {
    super(scene, x, y);
    
    // Random weapon if not specified
    const availableWeapons = Object.keys(WEAPON_CONFIGS).filter(w => w !== 'knife');
    this.weaponType = weaponType || availableWeapons[Math.floor(Math.random() * availableWeapons.length)];
    
    scene.add.existing(this);
    this.createVisuals();
    this.setSize(32, 32);
    
    // Enable physics for pickup detection
    scene.physics.add.existing(this, true); // Static body
  }

  private createVisuals(): void {
    // Create glow effect
    this.glowEffect = this.scene.add.graphics();
    this.glowEffect.fillStyle(0x00ff88, 0.3);
    this.glowEffect.fillCircle(0, 0, 20);
    this.add(this.glowEffect);

    // Create weapon sprite
    this.weaponSprite = this.scene.add.graphics();
    this.drawWeaponSprite();
    this.add(this.weaponSprite);

    // Add floating animation
    this.scene.tweens.add({
      targets: this,
      y: this.y - 5,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Add glow pulse
    this.scene.tweens.add({
      targets: this.glowEffect,
      alpha: 0.1,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private drawWeaponSprite(): void {
    this.weaponSprite.clear();
    
    switch (this.weaponType) {
      case 'pistol':
        this.weaponSprite.fillStyle(0x888888);
        this.weaponSprite.fillRect(-8, -3, 16, 6);
        this.weaponSprite.fillStyle(0xaaaaaa);
        this.weaponSprite.fillRect(6, -1, 4, 2);
        break;
      case 'shotgun':
        this.weaponSprite.fillStyle(0x8b4513);
        this.weaponSprite.fillRect(-10, -2, 20, 4);
        this.weaponSprite.fillStyle(0x654321);
        this.weaponSprite.fillRect(-6, -4, 4, 8);
        break;
      case 'rocket':
        this.weaponSprite.fillStyle(0x2d5016);
        this.weaponSprite.fillRect(-12, -4, 24, 8);
        this.weaponSprite.fillStyle(0xff6b00);
        this.weaponSprite.fillRect(8, -2, 6, 4);
        break;
      case 'grenade':
        this.weaponSprite.fillStyle(0x4a90e2);
        this.weaponSprite.fillRect(-6, -6, 12, 12);
        this.weaponSprite.fillStyle(0x357abd);
        this.weaponSprite.fillRect(-2, -8, 4, 4);
        break;
      default:
        this.weaponSprite.fillStyle(0xffd700);
        this.weaponSprite.fillRect(-8, -4, 16, 8);
        break;
    }
  }

  public update(time: number, delta: number): void {
    if (!this.isActive) {
      this.respawnTimer += delta;
      if (this.respawnTimer >= this.respawnDelay) {
        this.respawn();
      }
    }
  }

  public pickup(): string | null {
    if (!this.isActive) return null;
    
    this.isActive = false;
    this.respawnTimer = 0;
    this.setVisible(false);
    
    return this.weaponType;
  }

  private respawn(): void {
    // Randomize weapon type on respawn
    const availableWeapons = Object.keys(WEAPON_CONFIGS).filter(w => w !== 'knife');
    this.weaponType = availableWeapons[Math.floor(Math.random() * availableWeapons.length)];
    
    this.drawWeaponSprite();
    this.isActive = true;
    this.setVisible(true);
    
    // Respawn effect
    const spawnEffect = this.scene.add.particles(this.x, this.y, 'bullet_projectile', {
      scale: { start: 0.2, end: 0 },
      speed: { min: 30, max: 80 },
      lifespan: 500,
      quantity: 10,
      tint: 0x00ff88,
    });
    spawnEffect.explode();
  }

  public getWeaponType(): string {
    return this.weaponType;
  }

  public isAvailable(): boolean {
    return this.isActive;
  }
}