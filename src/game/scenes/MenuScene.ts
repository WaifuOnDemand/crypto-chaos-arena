import Phaser from 'phaser';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  preload(): void {
    // Load menu assets here
    this.load.image('logo', 'data:image/svg+xml;base64,' + btoa(`
      <svg width="300" height="100" xmlns="http://www.w3.org/2000/svg">
        <rect width="300" height="100" fill="#1a1a2e"/>
        <text x="150" y="40" font-family="monospace" font-size="24" fill="#ffd700" text-anchor="middle">CRYPTO</text>
        <text x="150" y="70" font-family="monospace" font-size="24" fill="#00bfff" text-anchor="middle">CHAOS</text>
        <text x="150" y="90" font-family="monospace" font-size="12" fill="#00ff00" text-anchor="middle">SHOOTER</text>
      </svg>
    `));
  }

  create(): void {
    const { width, height } = this.cameras.main;
    
    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a2e);
    
    // Logo
    this.add.image(width / 2, height / 3, 'logo').setScale(0.8);
    
    // Menu text
    const startText = this.add.text(width / 2, height / 2 + 50, 'PRESS SPACE TO START', {
      fontSize: '24px',
      color: '#ffd700',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    const instructionsText = this.add.text(width / 2, height / 2 + 100, 
      'WASD/ARROWS: Move | SPACE: Jump | SHIFT: Dash | MOUSE: Aim/Shoot', {
      fontSize: '16px',
      color: '#00bfff',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Pulsing effect for start text
    this.tweens.add({
      targets: startText,
      alpha: 0.3,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    // Input handling
    this.input.keyboard?.once('keydown-SPACE', () => {
      this.scene.start('GameScene');
      this.scene.launch('HUDScene');
    });
  }
}