import Phaser from 'phaser';
import { PlayerState } from '../../types/game';

export class HUDScene extends Phaser.Scene {
  private healthBar!: Phaser.GameObjects.Graphics;
  private armorBar!: Phaser.GameObjects.Graphics;
  private ammoText!: Phaser.GameObjects.Text;
  private killsText!: Phaser.GameObjects.Text;
  private timeText!: Phaser.GameObjects.Text;
  private weaponText!: Phaser.GameObjects.Text;
  private dashCooldownBar!: Phaser.GameObjects.Graphics;

  constructor() {
    super({ key: 'HUDScene' });
  }

  create(): void {
    const { width, height } = this.cameras.main;
    
    // Health bar background
    this.add.rectangle(120, height - 50, 200, 20, 0x333333);
    this.add.rectangle(120, height - 50, 200, 20, 0x000000).setStrokeStyle(2, 0xffd700);
    
    // Health bar
    this.healthBar = this.add.graphics();
    
    // Armor bar background (above health)
    this.add.rectangle(120, height - 80, 200, 15, 0x333333);
    this.add.rectangle(120, height - 80, 200, 15, 0x000000).setStrokeStyle(2, 0x00bfff);
    
    // Armor bar
    this.armorBar = this.add.graphics();
    
    // Dash cooldown bar
    this.add.rectangle(120, height - 110, 100, 10, 0x333333);
    this.add.rectangle(120, height - 110, 100, 10, 0x000000).setStrokeStyle(1, 0x00ff00);
    this.dashCooldownBar = this.add.graphics();
    
    // Text elements
    this.ammoText = this.add.text(width - 20, height - 50, 'AMMO: --/--', {
      fontSize: '18px',
      color: '#ffd700',
      fontFamily: 'monospace',
    }).setOrigin(1, 0.5);
    
    this.weaponText = this.add.text(width - 20, height - 80, 'WEAPON: KNIFE', {
      fontSize: '16px',
      color: '#00bfff',
      fontFamily: 'monospace',
    }).setOrigin(1, 0.5);
    
    this.killsText = this.add.text(20, 20, 'KILLS: 0', {
      fontSize: '20px',
      color: '#00ff00',
      fontFamily: 'monospace',
    });
    
    this.timeText = this.add.text(width / 2, 20, 'TIME: 5:00', {
      fontSize: '20px',
      color: '#ffd700',
      fontFamily: 'monospace',
    }).setOrigin(0.5, 0);

    // Listen for player updates
    this.game.events.on('playerUpdate', this.updateHUD, this);
    this.game.events.on('gameTimeUpdate', this.updateTime, this);
  }

  private updateHUD(playerData: PlayerState): void {
    const { width, height } = this.cameras.main;
    
    // Update health bar
    this.healthBar.clear();
    const healthPercent = playerData.health / playerData.maxHealth;
    this.healthBar.fillStyle(0xff0000);
    this.healthBar.fillRect(20, height - 60, 200 * healthPercent, 20);
    
    // Update armor bar
    this.armorBar.clear();
    if (playerData.armor > 0) {
      const armorPercent = Math.min(playerData.armor / 100, 1); // Assuming max armor is 100
      this.armorBar.fillStyle(0x00bfff);
      this.armorBar.fillRect(20, height - 90, 200 * armorPercent, 15);
    }
    
    // Update ammo
    const currentWeapon = playerData.weapons[playerData.activeWeapon];
    if (currentWeapon) {
      this.ammoText.setText(`AMMO: ${currentWeapon.ammo}/${currentWeapon.maxAmmo}`);
      this.weaponText.setText(`WEAPON: ${currentWeapon.name.toUpperCase()}`);
    } else {
      this.ammoText.setText('AMMO: --/--');
      this.weaponText.setText('WEAPON: KNIFE');
    }
    
    // Update kills
    this.killsText.setText(`KILLS: ${playerData.kills}`);
    
    // Update dash cooldown
    this.dashCooldownBar.clear();
    if (playerData.dashCooldown > 0) {
      const cooldownPercent = 1 - (playerData.dashCooldown / 1000); // 1000ms cooldown
      this.dashCooldownBar.fillStyle(0x00ff00);
      this.dashCooldownBar.fillRect(70, height - 115, 100 * cooldownPercent, 10);
    } else {
      this.dashCooldownBar.fillStyle(0x00ff00);
      this.dashCooldownBar.fillRect(70, height - 115, 100, 10);
    }
  }

  private updateTime(timeRemaining: number): void {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    this.timeText.setText(`TIME: ${minutes}:${seconds.toString().padStart(2, '0')}`);
  }
}