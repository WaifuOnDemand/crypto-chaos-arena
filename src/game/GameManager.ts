import Phaser from 'phaser';
import { GameScene } from './scenes/GameScene';
import { MenuScene } from './scenes/MenuScene';
import { HUDScene } from './scenes/HUDScene';
import { GameConfig } from '../types/game';

export class GameManager {
  private game: Phaser.Game | null = null;
  private config: GameConfig;

  constructor() {
    this.config = {
      width: 1200,
      height: 800,
      physics: {
        gravity: 800,
        jumpForce: -400,
        dashForce: 300,
        dashCooldown: 1000, // 1 second
      },
      player: {
        maxHealth: 100,
        speed: 200,
        size: { width: 32, height: 48 },
      },
    };
  }

  public initialize(parentElement: string): void {
    const gameConfig: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: this.config.width,
      height: this.config.height,
      parent: parentElement,
      backgroundColor: '#1a1a2e',
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: this.config.physics.gravity },
          debug: process.env.NODE_ENV === 'development',
        },
      },
      scene: [MenuScene, GameScene, HUDScene],
      render: {
        pixelArt: true,
        antialias: false,
      },
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
    };

    this.game = new Phaser.Game(gameConfig);
  }

  public destroy(): void {
    if (this.game) {
      this.game.destroy(true);
      this.game = null;
    }
  }

  public getConfig(): GameConfig {
    return this.config;
  }

  public getGame(): Phaser.Game | null {
    return this.game;
  }
}

export const gameManager = new GameManager();