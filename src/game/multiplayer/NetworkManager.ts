import { PlayerState, ProjectileState, GameState } from '../../types/game';

export interface NetworkMessage {
  type: 'playerUpdate' | 'projectileCreate' | 'terrainDestroy' | 'weaponPickup' | 'playerDamage';
  timestamp: number;
  data: any;
}

export interface PlayerUpdateData {
  playerId: string;
  position: { x: number; y: number };
  velocity: { x: number; y: number };
  health: number;
  facing: 'left' | 'right';
  weaponState: any;
}

export interface ProjectileCreateData {
  id: string;
  playerId: string;
  position: { x: number; y: number };
  velocity: { x: number; y: number };
  weaponType: string;
  damage: number;
}

export interface TerrainDestroyData {
  position: { x: number; y: number };
  radius: number;
  damage: number;
}

export class NetworkManager {
  private isHost: boolean = false;
  private connectedPlayers: Map<string, PlayerState> = new Map();
  private messageQueue: NetworkMessage[] = [];
  private lastUpdateTime: number = 0;
  private updateInterval: number = 1000 / 60; // 60 FPS
  
  constructor() {
    // For Phase 3, we'll simulate multiplayer with AI bots
    this.isHost = true;
  }
  
  public initialize(): void {
    console.log('NetworkManager initialized in host mode');
    
    // Add some AI bots for testing
    this.addAIBot('bot1', { x: 300, y: 400 });
    this.addAIBot('bot2', { x: 800, y: 400 });
  }
  
  private addAIBot(botId: string, position: { x: number; y: number }): void {
    const botState: PlayerState = {
      id: botId,
      x: position.x,
      y: position.y,
      velocityX: 0,
      velocityY: 0,
      health: 100,
      maxHealth: 100,
      armor: 0,
      weapons: [],
      activeWeapon: 0,
      isAlive: true,
      kills: 0,
      deaths: 0,
      canJump: true,
      canDoubleJump: true,
      dashCooldown: 0,
      facing: 'right'
    };
    
    this.connectedPlayers.set(botId, botState);
  }
  
  public sendPlayerUpdate(playerData: PlayerUpdateData): void {
    const message: NetworkMessage = {
      type: 'playerUpdate',
      timestamp: Date.now(),
      data: playerData
    };
    
    this.queueMessage(message);
  }
  
  public sendProjectileCreate(projectileData: ProjectileCreateData): void {
    const message: NetworkMessage = {
      type: 'projectileCreate',
      timestamp: Date.now(),
      data: projectileData
    };
    
    this.queueMessage(message);
  }
  
  public sendTerrainDestroy(terrainData: TerrainDestroyData): void {
    const message: NetworkMessage = {
      type: 'terrainDestroy',
      timestamp: Date.now(),
      data: terrainData
    };
    
    this.queueMessage(message);
  }
  
  private queueMessage(message: NetworkMessage): void {
    this.messageQueue.push(message);
  }
  
  public update(currentTime: number): NetworkMessage[] {
    if (currentTime - this.lastUpdateTime >= this.updateInterval) {
      this.lastUpdateTime = currentTime;
      
      // Process AI bot behavior
      this.updateAIBots(currentTime);
      
      // Return queued messages
      const messages = [...this.messageQueue];
      this.messageQueue = [];
      return messages;
    }
    
    return [];
  }
  
  private updateAIBots(currentTime: number): void {
    this.connectedPlayers.forEach((botState, botId) => {
      if (!botState.isAlive) return;
      
      // Simple AI: Move randomly and occasionally shoot
      if (Math.random() < 0.02) { // 2% chance per frame to change direction
        botState.velocityX = (Math.random() - 0.5) * 200;
        botState.facing = botState.velocityX > 0 ? 'right' : 'left';
        
        // Send bot update
        this.sendPlayerUpdate({
          playerId: botId,
          position: { x: botState.x, y: botState.y },
          velocity: { x: botState.velocityX, y: botState.velocityY },
          health: botState.health,
          facing: botState.facing,
          weaponState: null
        });
      }
      
      // Occasionally shoot
      if (Math.random() < 0.005) { // 0.5% chance per frame to shoot
        this.sendProjectileCreate({
          id: `bot_projectile_${Date.now()}`,
          playerId: botId,
          position: { x: botState.x, y: botState.y },
          velocity: { 
            x: (botState.facing === 'right' ? 1 : -1) * 300,
            y: Math.random() * 100 - 50 
          },
          weaponType: 'pistol',
          damage: 25
        });
      }
    });
  }
  
  public getConnectedPlayers(): Map<string, PlayerState> {
    return this.connectedPlayers;
  }
  
  public updatePlayerState(playerId: string, updates: Partial<PlayerState>): void {
    const player = this.connectedPlayers.get(playerId);
    if (player) {
      Object.assign(player, updates);
    }
  }
  
  public removePlayer(playerId: string): void {
    this.connectedPlayers.delete(playerId);
  }
  
  public isHostPlayer(): boolean {
    return this.isHost;
  }
}