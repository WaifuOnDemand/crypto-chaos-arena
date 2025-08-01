import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Projectile } from '../entities/Projectile';
import { WeaponSpawn } from '../entities/WeaponSpawn';
import { AIBot } from '../entities/AIBot';
import { DestructibleTerrain } from '../entities/DestructibleTerrain';
import { NetworkManager } from '../multiplayer/NetworkManager';
import { GameControls } from '../../types/game';

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private aiBots!: AIBot[];
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private shiftKey!: Phaser.Input.Keyboard.Key;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private destructibleTerrain!: DestructibleTerrain[];
  private projectiles!: Phaser.Physics.Arcade.Group;
  private weaponSpawns!: WeaponSpawn[];
  private networkManager!: NetworkManager;
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
    
    // Create platforms (indestructible)
    this.platforms = this.physics.add.staticGroup();
    
    // Ground (indestructible)
    this.platforms.create(width / 2, height - 16, 'ground').setScale(width / 64, 1).refreshBody();
    
    // Create destructible terrain
    this.destructibleTerrain = [];
    this.destructibleTerrain.push(new DestructibleTerrain(this, 150, height - 232, 160, 64)); // Platform 1
    this.destructibleTerrain.push(new DestructibleTerrain(this, 550, height - 332, 200, 64)); // Platform 2  
    this.destructibleTerrain.push(new DestructibleTerrain(this, 950, height - 282, 160, 64)); // Platform 3
    this.destructibleTerrain.push(new DestructibleTerrain(this, 350, height - 432, 100, 64)); // Platform 4
    
    // Create player
    this.player = new Player(this, 100, height - 100, 'player1');
    
    // Create AI bots
    this.aiBots = [];
    this.aiBots.push(new AIBot(this, 300, height - 100, 'bot1'));
    this.aiBots.push(new AIBot(this, 800, height - 100, 'bot2'));
    
    // Initialize network manager
    this.networkManager = new NetworkManager();
    this.networkManager.initialize();
    
    // Create projectiles group
    this.projectiles = this.physics.add.group();
    
    // Create weapon spawns
    this.createWeaponSpawns();
    
    // Set up collisions
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.projectiles, this.platforms, this.handleProjectileHit, undefined, this);
    this.physics.add.overlap(this.player, this.projectiles, this.handlePlayerHit, undefined, this);
    
    // Set up AI bot collisions
    this.aiBots.forEach(bot => {
      this.physics.add.collider(bot, this.platforms);
      this.physics.add.overlap(bot, this.projectiles, this.handlePlayerHit, undefined, this);
      this.physics.add.overlap(this.player, bot, this.handlePlayerCollision, undefined, this);
    });
    
    // Set up weapon pickup collisions
    this.weaponSpawns.forEach(spawn => {
      this.physics.add.overlap(this.player, spawn, this.handleWeaponPickup, undefined, this);
    });
    
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
    
    // Set up combat events
    this.setupCombatEvents();
    
    // Set up terrain destruction events
    this.setupTerrainEvents();
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

  private createWeaponSpawns(): void {
    const { width, height } = this.cameras.main;
    this.weaponSpawns = [
      new WeaponSpawn(this, 300, height - 150),
      new WeaponSpawn(this, 700, height - 250),
      new WeaponSpawn(this, 1100, height - 200),
      new WeaponSpawn(this, 500, height - 350),
    ];
    
    // Add debug key to toggle physics debug
    this.input.keyboard!.addKey('F1').on('down', () => {
      this.physics.world.debugGraphic.visible = !this.physics.world.debugGraphic.visible;
    });
  }

  private setupCombatEvents(): void {
    this.game.events.on('projectileCreated', (projectile: Projectile) => {
      this.projectiles.add(projectile);
    });

    this.game.events.on('meleeAttack', (attack: any) => {
      // Check if any players are in melee range (simplified for MVP)
      console.log('Melee attack at', attack.x, attack.y);
    });

    this.game.events.on('explosion', (explosion: any) => {
      // Handle explosion damage to player
      const distance = Phaser.Math.Distance.Between(
        this.player.x, this.player.y,
        explosion.x, explosion.y
      );
      
      if (distance <= explosion.radius && explosion.playerId !== this.player.playerState.id) {
        const damage = Math.max(0, explosion.damage * (1 - distance / explosion.radius));
        this.player.takeDamage(damage);
      }
      
      // Handle explosion damage to AI bots
      this.aiBots.forEach(bot => {
        const botDistance = Phaser.Math.Distance.Between(
          bot.x, bot.y,
          explosion.x, explosion.y
        );
        
        if (botDistance <= explosion.radius && explosion.playerId !== bot.playerState.id) {
          const damage = Math.max(0, explosion.damage * (1 - botDistance / explosion.radius));
          bot.takeDamage(damage);
        }
      });
    });
  }

  private handleProjectileHit(projectile: any, platform: any): void {
    if (projectile instanceof Projectile) {
      projectile.hit();
    }
  }

  private handlePlayerHit(player: any, projectile: any): void {
    if (projectile instanceof Projectile) {
      // Check if it's the main player or a bot
      if (player === this.player && projectile.projectileState.playerId !== this.player.playerState.id) {
        this.player.takeDamage(projectile.projectileState.damage);
        projectile.hit();
      } else if (player instanceof AIBot && projectile.projectileState.playerId !== player.playerState.id) {
        player.takeDamage(projectile.projectileState.damage);
        projectile.hit();
        
        // If player killed the bot, increment kill count
        if (!player.playerState.isAlive && projectile.projectileState.playerId === this.player.playerState.id) {
          this.player.playerState.kills++;
        }
      }
    }
  }
  
  private handlePlayerCollision(player1: any, player2: any): void {
    // Simple collision response - just separate the players
    const dx = player1.x - player2.x;
    const dy = player1.y - player2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < 40) { // Minimum separation distance
      const separation = (40 - distance) / 2;
      const angle = Math.atan2(dy, dx);
      
      player1.x += Math.cos(angle) * separation;
      player1.y += Math.sin(angle) * separation;
      player2.x -= Math.cos(angle) * separation;
      player2.y -= Math.sin(angle) * separation;
    }
  }

  private handleWeaponPickup(player: any, spawn: any): void {
    if (spawn instanceof WeaponSpawn && spawn.isAvailable()) {
      const weaponType = spawn.pickup();
      if (weaponType && this.player.addWeapon(weaponType)) {
        // Success feedback
        const pickupText = this.add.text(spawn.x, spawn.y - 30, `+${weaponType.toUpperCase()}`, {
          fontSize: '16px',
          color: '#00ff88',
          fontFamily: 'monospace',
        }).setOrigin(0.5);
        
        this.tweens.add({
          targets: pickupText,
          y: spawn.y - 60,
          alpha: 0,
          duration: 1000,
          onComplete: () => pickupText.destroy(),
        });
      }
    }
  }

  update(time: number, delta: number): void {
    // Update controls
    const controls: Partial<GameControls> = {
      left: this.cursors.left.isDown || this.wasdKeys.A.isDown,
      right: this.cursors.right.isDown || this.wasdKeys.D.isDown,
      jump: Phaser.Input.Keyboard.JustDown(this.cursors.up) || Phaser.Input.Keyboard.JustDown(this.wasdKeys.W) || Phaser.Input.Keyboard.JustDown(this.spaceKey),
      dash: Phaser.Input.Keyboard.JustDown(this.shiftKey),
      fire: this.input.activePointer.isDown,
      switchWeapon: Phaser.Input.Keyboard.JustDown(this.input.keyboard!.addKey('Q')),
      aim: {
        x: this.input.activePointer.worldX,
        y: this.input.activePointer.worldY,
      },
    };
    
    this.player.updateControls(controls);
    this.player.update(time, delta);
    
    // Update AI bots
    this.aiBots.forEach(bot => bot.update(time, delta));
    
    // Update network manager and process messages
    const networkMessages = this.networkManager.update(time);
    this.processNetworkMessages(networkMessages);
    
    // Update weapon spawns
    this.weaponSpawns.forEach(spawn => spawn.update(time, delta));
    
    // Update projectiles
    this.projectiles.children.entries.forEach(projectile => {
      if (projectile instanceof Projectile) {
        projectile.update(time, delta);
      }
    });
  }
  
  private setupTerrainEvents(): void {
    this.events.on('terrainExplosion', (explosion: any) => {
      this.destructibleTerrain.forEach(terrain => {
        terrain.destroyArea(explosion.x, explosion.y, explosion.radius, explosion.damage);
      });
    });
  }
  
  private processNetworkMessages(messages: any[]): void {
    messages.forEach(message => {
      switch (message.type) {
        case 'projectileCreate':
          // Create projectile from network data
          const projectileData = message.data;
          const networkProjectile = new Projectile(
            this, 
            projectileData.position.x, 
            projectileData.position.y,
            projectileData.velocity.x,
            projectileData.velocity.y,
            {
              id: projectileData.id,
              x: projectileData.position.x,
              y: projectileData.position.y,
              velocityX: projectileData.velocity.x,
              velocityY: projectileData.velocity.y,
              damage: projectileData.damage,
              playerId: projectileData.playerId,
              weaponType: projectileData.weaponType,
              bounces: 0,
              explosive: projectileData.weaponType === 'rocket' || projectileData.weaponType === 'grenade',
              explosionRadius: projectileData.weaponType === 'rocket' ? 100 : 50
            }
          );
          this.projectiles.add(networkProjectile);
          break;
          
        case 'playerUpdate':
          // Update AI bot positions (in a real multiplayer game, this would be other players)
          const playerData = message.data;
          const bot = this.aiBots.find(b => b.playerState.id === playerData.playerId);
          if (bot) {
            // Interpolate position for smooth movement
            this.tweens.add({
              targets: bot,
              x: playerData.position.x,
              y: playerData.position.y,
              duration: 100,
              ease: 'Linear'
            });
          }
          break;
          
        case 'terrainDestroy':
          // Handle terrain destruction from network
          const terrainData = message.data;
          this.events.emit('terrainExplosion', terrainData);
          break;
      }
    });
  }
}