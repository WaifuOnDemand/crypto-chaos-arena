import { PlayerState } from '../../types/game';

export interface PlayerStats {
  playerId: string;
  playerName: string;
  totalKills: number;
  totalDeaths: number;
  totalWins: number;
  totalMatches: number;
  bestKillStreak: number;
  damageDealt: number;
  accuracy: number;
  favoriteWeapon: string;
  timePlayedMs: number;
  rank: string;
  xp: number;
  level: number;
}

export interface MatchResult {
  matchId: string;
  gameMode: string;
  duration: number;
  playerStats: Record<string, {
    kills: number;
    deaths: number;
    damage: number;
    accuracy: number;
    placement: number;
  }>;
  winner: string;
  timestamp: number;
}

export interface GameSettings {
  graphics: {
    quality: 'low' | 'medium' | 'high';
    showParticles: boolean;
    showDamageNumbers: boolean;
    screenShake: boolean;
  };
  audio: {
    masterVolume: number;
    sfxVolume: number;
    musicVolume: number;
    muted: boolean;
  };
  controls: {
    mouseSensitivity: number;
    keyBindings: Record<string, string>;
    invertY: boolean;
  };
  gameplay: {
    showKillFeed: boolean;
    showCrosshair: boolean;
    autoPickupWeapons: boolean;
    showPlayerNames: boolean;
  };
}

export class GameDataManager {
  private playerStats: PlayerStats;
  private matchHistory: MatchResult[] = [];
  private settings: GameSettings;
  private currentMatch: MatchResult | null = null;
  
  constructor() {
    this.playerStats = this.getDefaultPlayerStats();
    this.settings = this.getDefaultSettings();
    this.loadData();
  }
  
  private getDefaultPlayerStats(): PlayerStats {
    return {
      playerId: 'player1',
      playerName: 'CryptoWarrior',
      totalKills: 0,
      totalDeaths: 0,
      totalWins: 0,
      totalMatches: 0,
      bestKillStreak: 0,
      damageDealt: 0,
      accuracy: 0,
      favoriteWeapon: 'pistol',
      timePlayedMs: 0,
      rank: 'Bronze',
      xp: 0,
      level: 1
    };
  }
  
  private getDefaultSettings(): GameSettings {
    return {
      graphics: {
        quality: 'medium',
        showParticles: true,
        showDamageNumbers: true,
        screenShake: true
      },
      audio: {
        masterVolume: 0.7,
        sfxVolume: 0.8,
        musicVolume: 0.5,
        muted: false
      },
      controls: {
        mouseSensitivity: 1.0,
        keyBindings: {
          moveLeft: 'A',
          moveRight: 'D',
          jump: 'Space',
          dash: 'Shift',
          fire: 'Mouse1',
          switchWeapon: 'Q'
        },
        invertY: false
      },
      gameplay: {
        showKillFeed: true,
        showCrosshair: true,
        autoPickupWeapons: false,
        showPlayerNames: true
      }
    };
  }
  
  private loadData(): void {
    try {
      const savedStats = localStorage.getItem('cryptoChaos_playerStats');
      if (savedStats) {
        this.playerStats = { ...this.playerStats, ...JSON.parse(savedStats) };
      }
      
      const savedSettings = localStorage.getItem('cryptoChaos_settings');
      if (savedSettings) {
        this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
      }
      
      const savedHistory = localStorage.getItem('cryptoChaos_matchHistory');
      if (savedHistory) {
        this.matchHistory = JSON.parse(savedHistory);
      }
    } catch (error) {
      console.error('Failed to load game data:', error);
    }
  }
  
  private saveData(): void {
    try {
      localStorage.setItem('cryptoChaos_playerStats', JSON.stringify(this.playerStats));
      localStorage.setItem('cryptoChaos_settings', JSON.stringify(this.settings));
      localStorage.setItem('cryptoChaos_matchHistory', JSON.stringify(this.matchHistory));
    } catch (error) {
      console.error('Failed to save game data:', error);
    }
  }
  
  public getPlayerStats(): PlayerStats {
    return { ...this.playerStats };
  }
  
  public getSettings(): GameSettings {
    return { ...this.settings };
  }
  
  public updateSettings(newSettings: Partial<GameSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.saveData();
  }
  
  public startMatch(gameMode: string): void {
    this.currentMatch = {
      matchId: `match_${Date.now()}`,
      gameMode,
      duration: 0,
      playerStats: {},
      winner: '',
      timestamp: Date.now()
    };
  }
  
  public updateMatchStats(playerId: string, stats: Partial<MatchResult['playerStats'][string]>): void {
    if (!this.currentMatch) return;
    
    if (!this.currentMatch.playerStats[playerId]) {
      this.currentMatch.playerStats[playerId] = {
        kills: 0,
        deaths: 0,
        damage: 0,
        accuracy: 0,
        placement: 0
      };
    }
    
    Object.assign(this.currentMatch.playerStats[playerId], stats);
  }
  
  public endMatch(winner: string, duration: number): void {
    if (!this.currentMatch) return;
    
    this.currentMatch.winner = winner;
    this.currentMatch.duration = duration;
    
    // Update player stats
    const playerMatchStats = this.currentMatch.playerStats[this.playerStats.playerId];
    if (playerMatchStats) {
      this.playerStats.totalKills += playerMatchStats.kills;
      this.playerStats.totalDeaths += playerMatchStats.deaths;
      this.playerStats.damageDealt += playerMatchStats.damage;
      this.playerStats.totalMatches++;
      
      if (winner === this.playerStats.playerId) {
        this.playerStats.totalWins++;
      }
      
      // Update accuracy
      this.updateAccuracy();
      
      // Update XP and level
      this.updateXPAndLevel(playerMatchStats);
      
      // Update rank
      this.updateRank();
    }
    
    // Save match to history
    this.matchHistory.unshift(this.currentMatch);
    if (this.matchHistory.length > 50) {
      this.matchHistory = this.matchHistory.slice(0, 50); // Keep last 50 matches
    }
    
    this.currentMatch = null;
    this.saveData();
  }
  
  private updateAccuracy(): void {
    // Simplified accuracy calculation
    const totalShots = Math.max(1, this.playerStats.totalKills * 3); // Assume 3 shots per kill on average
    this.playerStats.accuracy = Math.min(100, (this.playerStats.totalKills / totalShots) * 100);
  }
  
  private updateXPAndLevel(matchStats: MatchResult['playerStats'][string]): void {
    const xpGained = matchStats.kills * 10 + matchStats.damage * 0.1 + (matchStats.placement === 1 ? 50 : 0);
    this.playerStats.xp += xpGained;
    
    // Level up calculation
    const xpForNextLevel = this.playerStats.level * 100;
    if (this.playerStats.xp >= xpForNextLevel) {
      this.playerStats.level++;
      this.playerStats.xp -= xpForNextLevel;
    }
  }
  
  private updateRank(): void {
    const winRate = this.playerStats.totalMatches > 0 ? this.playerStats.totalWins / this.playerStats.totalMatches : 0;
    const kdr = this.playerStats.totalDeaths > 0 ? this.playerStats.totalKills / this.playerStats.totalDeaths : this.playerStats.totalKills;
    
    const rankScore = winRate * 100 + kdr * 20 + this.playerStats.level * 5;
    
    if (rankScore >= 200) this.playerStats.rank = 'Diamond';
    else if (rankScore >= 150) this.playerStats.rank = 'Platinum';
    else if (rankScore >= 100) this.playerStats.rank = 'Gold';
    else if (rankScore >= 60) this.playerStats.rank = 'Silver';
    else this.playerStats.rank = 'Bronze';
  }
  
  public getMatchHistory(): MatchResult[] {
    return [...this.matchHistory];
  }
  
  public getLeaderboard(): PlayerStats[] {
    // In a real game, this would fetch from a server
    // For now, return mock data with current player
    const mockPlayers: PlayerStats[] = [
      {
        ...this.playerStats,
        playerName: 'CryptoKing',
        totalKills: 150,
        totalDeaths: 45,
        totalWins: 25,
        totalMatches: 30,
        rank: 'Diamond',
        level: 15
      },
      {
        ...this.playerStats,
        playerName: 'BlockchainBeast',
        totalKills: 120,
        totalDeaths: 60,
        totalWins: 18,
        totalMatches: 25,
        rank: 'Platinum',
        level: 12
      },
      this.playerStats,
      {
        ...this.playerStats,
        playerName: 'SatoshiSlayer',
        totalKills: 90,
        totalDeaths: 70,
        totalWins: 12,
        totalMatches: 20,
        rank: 'Gold',
        level: 8
      }
    ];
    
    return mockPlayers.sort((a, b) => {
      const aScore = a.totalWins * 10 + a.totalKills - a.totalDeaths;
      const bScore = b.totalWins * 10 + b.totalKills - b.totalDeaths;
      return bScore - aScore;
    });
  }
}

export const gameDataManager = new GameDataManager();