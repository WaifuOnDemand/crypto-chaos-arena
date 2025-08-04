import { GameModeType, GameModeState, PlayerState } from '../../types/game';

export interface GameModeConfig {
  id: GameModeType;
  name: string;
  description: string;
  maxPlayers: number;
  duration: number; // in seconds
  scoreLimit: number;
  enabledFeatures: {
    teams: boolean;
    respawn: boolean;
    shrinkZone: boolean;
    objectives: boolean;
  };
}

export const GAME_MODE_CONFIGS: Record<GameModeType, GameModeConfig> = {
  'deathmatch': {
    id: 'deathmatch',
    name: 'Deathmatch',
    description: 'Classic free-for-all combat. Highest kill count wins!',
    maxPlayers: 8,
    duration: 300, // 5 minutes
    scoreLimit: 25,
    enabledFeatures: {
      teams: false,
      respawn: true,
      shrinkZone: false,
      objectives: false,
    },
  },
  'team-deathmatch': {
    id: 'team-deathmatch',
    name: 'Team Deathmatch',
    description: 'Red vs Blue team combat. First team to score limit wins!',
    maxPlayers: 8,
    duration: 480, // 8 minutes
    scoreLimit: 50,
    enabledFeatures: {
      teams: true,
      respawn: true,
      shrinkZone: false,
      objectives: false,
    },
  },
  'last-man-standing': {
    id: 'last-man-standing',
    name: 'Last Man Standing',
    description: 'Survive until the end. One life, winner takes all!',
    maxPlayers: 6,
    duration: 480, // 8 minutes
    scoreLimit: 1,
    enabledFeatures: {
      teams: false,
      respawn: false,
      shrinkZone: false,
      objectives: false,
    },
  },
  'battle-royale': {
    id: 'battle-royale',
    name: 'Battle Royale',
    description: 'Shrinking zone forces players together. Last one standing wins!',
    maxPlayers: 12,
    duration: 600, // 10 minutes
    scoreLimit: 1,
    enabledFeatures: {
      teams: false,
      respawn: false,
      shrinkZone: true,
      objectives: false,
    },
  },
  'king-of-hill': {
    id: 'king-of-hill',
    name: 'King of the Hill',
    description: 'Control the central point to earn points. First team to 100 wins!',
    maxPlayers: 8,
    duration: 600, // 10 minutes
    scoreLimit: 100,
    enabledFeatures: {
      teams: true,
      respawn: true,
      shrinkZone: false,
      objectives: true,
    },
  },
  'capture-flag': {
    id: 'capture-flag',
    name: 'Capture the Flag',
    description: 'Capture the enemy flag and return it to your base!',
    maxPlayers: 8,
    duration: 720, // 12 minutes
    scoreLimit: 3,
    enabledFeatures: {
      teams: true,
      respawn: true,
      shrinkZone: false,
      objectives: true,
    },
  },
};

export class GameModeManager {
  private currentMode: GameModeType = 'deathmatch';
  private gameState: GameModeState = { scoreLimit: 25, playersAlive: 0 };
  private mapWidth: number = 1200;
  private mapHeight: number = 800;

  constructor(mapWidth: number, mapHeight: number) {
    this.mapWidth = mapWidth;
    this.mapHeight = mapHeight;
  }

  public initializeGameMode(mode: GameModeType, players: Record<string, PlayerState>): GameModeState {
    this.currentMode = mode;
    const config = GAME_MODE_CONFIGS[mode];
    
    this.gameState = {
      scoreLimit: config.scoreLimit,
      playersAlive: Object.keys(players).length,
    };

    // Initialize mode-specific features
    if (config.enabledFeatures.teams) {
      this.initializeTeams(players);
    }

    if (config.enabledFeatures.shrinkZone && mode === 'battle-royale') {
      this.initializeBattleRoyale();
    }

    if (config.enabledFeatures.objectives) {
      if (mode === 'king-of-hill') {
        this.initializeKingOfHill();
      } else if (mode === 'capture-flag') {
        this.initializeCaptureFlag();
      }
    }

    return this.gameState;
  }

  private initializeTeams(players: Record<string, PlayerState>): void {
    const playerIds = Object.keys(players);
    const redTeam: string[] = [];
    const blueTeam: string[] = [];

    // Assign players to teams alternately
    playerIds.forEach((playerId, index) => {
      if (index % 2 === 0) {
        redTeam.push(playerId);
        players[playerId].team = 'red';
      } else {
        blueTeam.push(playerId);
        players[playerId].team = 'blue';
      }
    });

    this.gameState.teams = { red: redTeam, blue: blueTeam };
    this.gameState.teamScores = { red: 0, blue: 0 };
  }

  private initializeBattleRoyale(): void {
    this.gameState.shrinkZone = {
      centerX: this.mapWidth / 2,
      centerY: this.mapHeight / 2,
      currentRadius: Math.min(this.mapWidth, this.mapHeight) * 0.6,
      targetRadius: Math.min(this.mapWidth, this.mapHeight) * 0.4,
      damage: 5,
      shrinkSpeed: 1,
      lastShrink: Date.now(),
      phase: 1,
    };
  }

  private initializeKingOfHill(): void {
    this.gameState.controlPoint = {
      x: this.mapWidth / 2,
      y: this.mapHeight / 2,
      radius: 80,
      controllingTeam: null,
      controlTime: 0,
      requiredTime: 3000, // 3 seconds to gain control
    };
  }

  private initializeCaptureFlag(): void {
    this.gameState.flags = {
      red: { x: 100, y: this.mapHeight / 2, atBase: true },
      blue: { x: this.mapWidth - 100, y: this.mapHeight / 2, atBase: true },
    };
  }

  public updateGameMode(
    players: Record<string, PlayerState>,
    deltaTime: number,
    currentTime: number
  ): { 
    gameState: GameModeState; 
    events: Array<{ type: string; data: any }> 
  } {
    const events: Array<{ type: string; data: any }> = [];

    // Update Battle Royale shrinking zone
    if (this.currentMode === 'battle-royale' && this.gameState.shrinkZone) {
      const shrinkEvents = this.updateBattleRoyale(players, deltaTime, currentTime);
      events.push(...shrinkEvents);
    }

    // Update King of the Hill
    if (this.currentMode === 'king-of-hill' && this.gameState.controlPoint) {
      const hillEvents = this.updateKingOfHill(players, deltaTime);
      events.push(...hillEvents);
    }

    // Update Capture the Flag
    if (this.currentMode === 'capture-flag' && this.gameState.flags) {
      const flagEvents = this.updateCaptureFlag(players);
      events.push(...flagEvents);
    }

    // Check win conditions
    const winEvent = this.checkWinConditions(players);
    if (winEvent) {
      events.push(winEvent);
    }

    return { gameState: this.gameState, events };
  }

  private updateBattleRoyale(
    players: Record<string, PlayerState>,
    deltaTime: number,
    currentTime: number
  ): Array<{ type: string; data: any }> {
    const events: Array<{ type: string; data: any }> = [];
    const zone = this.gameState.shrinkZone!;

    // Shrink zone gradually
    if (zone.currentRadius > zone.targetRadius) {
      zone.currentRadius -= zone.shrinkSpeed * (deltaTime / 1000);
      if (zone.currentRadius <= zone.targetRadius) {
        zone.currentRadius = zone.targetRadius;
        // Start next phase
        zone.phase++;
        zone.targetRadius = Math.max(zone.targetRadius * 0.7, 50);
        zone.damage += 2;
        zone.lastShrink = currentTime;
        
        events.push({
          type: 'zonePhaseChange',
          data: { phase: zone.phase, newRadius: zone.targetRadius }
        });
      }
    }

    // Damage players outside the zone
    Object.values(players).forEach(player => {
      if (!player.isAlive) return;

      const distance = Math.sqrt(
        Math.pow(player.x - zone.centerX, 2) + 
        Math.pow(player.y - zone.centerY, 2)
      );

      player.inSafeZone = distance <= zone.currentRadius;

      if (!player.inSafeZone && currentTime - zone.lastShrink > 1000) {
        player.health -= zone.damage;
        events.push({
          type: 'zoneDamage',
          data: { playerId: player.id, damage: zone.damage }
        });
      }
    });

    return events;
  }

  private updateKingOfHill(
    players: Record<string, PlayerState>,
    deltaTime: number
  ): Array<{ type: string; data: any }> {
    const events: Array<{ type: string; data: any }> = [];
    const point = this.gameState.controlPoint!;
    
    // Find players in control point
    const playersInPoint: { red: number; blue: number } = { red: 0, blue: 0 };
    
    Object.values(players).forEach(player => {
      if (!player.isAlive) return;
      
      const distance = Math.sqrt(
        Math.pow(player.x - point.x, 2) + 
        Math.pow(player.y - point.y, 2)
      );
      
      if (distance <= point.radius && player.team) {
        playersInPoint[player.team]++;
      }
    });

    // Determine controlling team
    let newControllingTeam: 'red' | 'blue' | null = null;
    if (playersInPoint.red > 0 && playersInPoint.blue === 0) {
      newControllingTeam = 'red';
    } else if (playersInPoint.blue > 0 && playersInPoint.red === 0) {
      newControllingTeam = 'blue';
    }

    // Update control
    if (newControllingTeam === point.controllingTeam) {
      point.controlTime += deltaTime;
      
      // Award points over time
      if (point.controlTime >= point.requiredTime) {
        if (point.controllingTeam && this.gameState.teamScores) {
          this.gameState.teamScores[point.controllingTeam]++;
          point.controlTime = 0;
          
          events.push({
            type: 'hillControlled',
            data: { team: point.controllingTeam, score: this.gameState.teamScores[point.controllingTeam] }
          });
        }
      }
    } else {
      point.controllingTeam = newControllingTeam;
      point.controlTime = 0;
      
      if (newControllingTeam) {
        events.push({
          type: 'hillCaptured',
          data: { team: newControllingTeam }
        });
      }
    }

    return events;
  }

  private updateCaptureFlag(players: Record<string, PlayerState>): Array<{ type: string; data: any }> {
    const events: Array<{ type: string; data: any }> = [];
    const flags = this.gameState.flags!;

    Object.values(players).forEach(player => {
      if (!player.isAlive || !player.team) return;

      const enemyTeam = player.team === 'red' ? 'blue' : 'red';
      const enemyFlag = flags[enemyTeam];
      const homeFlag = flags[player.team];

      // Check if player can pick up enemy flag
      if (!enemyFlag.carriedBy && enemyFlag.atBase) {
        const flagDistance = Math.sqrt(
          Math.pow(player.x - enemyFlag.x, 2) + 
          Math.pow(player.y - enemyFlag.y, 2)
        );

        if (flagDistance <= 30) {
          enemyFlag.carriedBy = player.id;
          enemyFlag.atBase = false;
          player.hasFlag = true;
          
          events.push({
            type: 'flagPickup',
            data: { playerId: player.id, team: player.team, flagTeam: enemyTeam }
          });
        }
      }

      // Check if player can score with flag
      if (player.hasFlag && homeFlag.atBase) {
        const homeDistance = Math.sqrt(
          Math.pow(player.x - homeFlag.x, 2) + 
          Math.pow(player.y - homeFlag.y, 2)
        );

        if (homeDistance <= 30) {
          // Score!
          if (this.gameState.teamScores) {
            this.gameState.teamScores[player.team]++;
          }
          
          // Reset flags
          enemyFlag.carriedBy = undefined;
          enemyFlag.atBase = true;
          enemyFlag.x = enemyTeam === 'red' ? 100 : this.mapWidth - 100;
          enemyFlag.y = this.mapHeight / 2;
          player.hasFlag = false;
          
          events.push({
            type: 'flagScore',
            data: { 
              playerId: player.id, 
              team: player.team, 
              score: this.gameState.teamScores![player.team] 
            }
          });
        }
      }

      // Update flag position if carried
      if (enemyFlag.carriedBy === player.id) {
        enemyFlag.x = player.x;
        enemyFlag.y = player.y - 20; // Above player
      }
    });

    return events;
  }

  private checkWinConditions(players: Record<string, PlayerState>): { type: string; data: any } | null {
    const config = GAME_MODE_CONFIGS[this.currentMode];
    const alivePlayers = Object.values(players).filter(p => p.isAlive);
    
    // Update alive count
    this.gameState.playersAlive = alivePlayers.length;

    switch (this.currentMode) {
      case 'last-man-standing':
      case 'battle-royale':
        if (alivePlayers.length <= 1) {
          return {
            type: 'gameWin',
            data: { 
              winner: alivePlayers[0]?.id || null,
              gameMode: this.currentMode 
            }
          };
        }
        break;

      case 'deathmatch':
        const topPlayer = Object.values(players)
          .sort((a, b) => b.kills - a.kills)[0];
        if (topPlayer && topPlayer.kills >= config.scoreLimit) {
          return {
            type: 'gameWin',
            data: { 
              winner: topPlayer.id,
              gameMode: this.currentMode,
              score: topPlayer.kills
            }
          };
        }
        break;

      case 'team-deathmatch':
      case 'king-of-hill':
      case 'capture-flag':
        if (this.gameState.teamScores) {
          const redScore = this.gameState.teamScores.red;
          const blueScore = this.gameState.teamScores.blue;
          
          if (redScore >= config.scoreLimit) {
            return {
              type: 'gameWin',
              data: { 
                winner: 'red',
                gameMode: this.currentMode,
                score: redScore
              }
            };
          } else if (blueScore >= config.scoreLimit) {
            return {
              type: 'gameWin',
              data: { 
                winner: 'blue',
                gameMode: this.currentMode,
                score: blueScore
              }
            };
          }
        }
        break;
    }

    return null;
  }

  public handlePlayerDeath(playerId: string, players: Record<string, PlayerState>): void {
    const player = players[playerId];
    if (!player) return;

    // Drop flag if carrying one
    if (player.hasFlag && this.gameState.flags) {
      const enemyTeam = player.team === 'red' ? 'blue' : 'red';
      const flag = this.gameState.flags[enemyTeam];
      
      flag.carriedBy = undefined;
      flag.atBase = false;
      // Flag stays where player died
    }

    // Handle respawn for modes that allow it
    const config = GAME_MODE_CONFIGS[this.currentMode];
    if (config.enabledFeatures.respawn) {
      player.respawnTime = Date.now() + 3000; // 3 second respawn
    }
  }

  public getGameModeState(): GameModeState {
    return this.gameState;
  }

  public getCurrentMode(): GameModeType {
    return this.currentMode;
  }
}