import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { GameControls } from '../../types/game';

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private shiftKey!: Phaser.Input.Keyboard.Key;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private gameTime: number = 300; // 5 minutes in seconds
  private gameTimer!: Phaser.Time.TimerEvent;

  constructor() {
    super({ key: 'GameScene' });
  }

  preload(): void {
    // Create simple colored rectangles for platforms
    this.load.image('ground', 'data:image/svg+xml;base64,' + btoa(`
      <svg width="64" height="32" xmlns="http://www.w3.org/2000/svg">
        <rect width="64" height="32" fill="#666666"/>
        <rect width="64" height="4" fill="#888888"/>
      </svg>
    `));
  }

  create(): void {
    const { width, height } = this.cameras.main;
    
    // Create background
    this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a2e);
    
    // Create platforms
    this.platforms = this.physics.add.staticGroup();
    
    // Ground
    this.platforms.create(width / 2, height - 16, 'ground').setScale(width / 64, 1).refreshBody();
    
    // Some platforms
    this.platforms.create(200, height - 200, 'ground').setScale(3, 1).refreshBody();
    this.platforms.create(600, height - 300, 'ground').setScale(4, 1).refreshBody();
    this.platforms.create(1000, height - 250, 'ground').setScale(3, 1).refreshBody();
    this.platforms.create(400, height - 400, 'ground').setScale(2, 1).refreshBody();
    
    // Create player
    this.player = new Player(this, 100, height - 100, 'player1');
    
    // Set up collisions
    this.physics.add.collider(this.player, this.platforms);
    
    // Set up controls
    this.setupControls();
    
    // Set up camera
    this.cameras.main.startFollow(this.player);
    this.cameras.main.setLerp(0.1, 0.1);
    this.cameras.main.setDeadzone(200, 100);
    
    // Start game timer
    this.startGameTimer();
    
    // Add some visual effects
    this.addParticles();
  }

  private setupControls(): void {
    // Arrow keys
    this.cursors = this.input.keyboard!.createCursorKeys();
    
    // WASD keys
    this.wasdKeys = this.input.keyboard!.addKeys('W,A,S,D') as any;
    
    // Space and Shift
    this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.shiftKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
  }

  private startGameTimer(): void {
    this.gameTimer = this.time.addEvent({
      delay: 1000,
      callback: () => {
        this.gameTime--;
        this.game.events.emit('gameTimeUpdate', this.gameTime);
        
        if (this.gameTime <= 0) {
          this.endGame();
        }
      },
      loop: true
    });
  }

  private endGame(): void {
    this.gameTimer.destroy();
    
    // Show game over screen
    const { width, height } = this.cameras.main;
    const gameOverBg = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.8);
    const gameOverText = this.add.text(width / 2, height / 2, 'GAME OVER', {
      fontSize: '48px',
      color: '#ff0000',
      fontFamily: 'monospace',
    }).setOrigin(0.5);
    
    const finalScore = this.add.text(width / 2, height / 2 + 60, `FINAL KILLS: ${this.player.playerState.kills}`, {
      fontSize: '24px',
      color: '#ffd700',
      fontFamily: 'monospace',
    }).setOrigin(0.5);
    
    const restartText = this.add.text(width / 2, height / 2 + 120, 'PRESS R TO RESTART', {
      fontSize: '20px',
      color: '#00bfff',
      fontFamily: 'monospace',
    }).setOrigin(0.5);
    
    this.input.keyboard!.once('keydown-R', () => {
      this.scene.restart();
      this.scene.launch('HUDScene');
    });
  }

  private addParticles(): void {
    // Add some ambient particles for atmosphere
    const particles = this.add.particles(0, 0, 'ground', {
      scale: { start: 0.1, end: 0 },
      speed: { min: 10, max: 50 },
      lifespan: 2000,
      quantity: 1,
      frequency: 500,
      emitZone: { 
        type: 'edge', 
        source: new Phaser.Geom.Rectangle(0, 0, this.cameras.main.width, 50),
        quantity: 1 
      }
    });
    particles.setAlpha(0.3);
  }

  update(time: number, delta: number): void {
    // Update controls
    const controls: Partial<GameControls> = {
      left: this.cursors.left.isDown || this.wasdKeys.A.isDown,
      right: this.cursors.right.isDown || this.wasdKeys.D.isDown,
      jump: Phaser.Input.Keyboard.JustDown(this.cursors.up) || Phaser.Input.Keyboard.JustDown(this.wasdKeys.W) || Phaser.Input.Keyboard.JustDown(this.spaceKey),
      dash: Phaser.Input.Keyboard.JustDown(this.shiftKey),
      fire: this.input.activePointer.isDown,
      aim: {
        x: this.input.activePointer.worldX,
        y: this.input.activePointer.worldY,
      },
    };
    
    this.player.updateControls(controls);
    this.player.update(time, delta);
  }
}