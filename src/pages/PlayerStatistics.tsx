import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Trophy, Target, Zap, Clock, TrendingUp, Award } from 'lucide-react';
import { gameDataManager, PlayerStats, MatchResult } from '../game/data/GameDataManager';

export const PlayerStatistics: React.FC = () => {
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [matchHistory, setMatchHistory] = useState<MatchResult[]>([]);

  useEffect(() => {
    setStats(gameDataManager.getPlayerStats());
    setMatchHistory(gameDataManager.getMatchHistory());
  }, []);

  if (!stats) {
    return <div>Loading...</div>;
  }

  const winRate = stats.totalMatches > 0 ? (stats.totalWins / stats.totalMatches * 100) : 0;
  const kdr = stats.totalDeaths > 0 ? (stats.totalKills / stats.totalDeaths) : stats.totalKills;
  const xpProgress = stats.level > 0 ? (stats.xp / (stats.level * 100) * 100) : 0;

  const getRankColor = (rank: string) => {
    switch (rank) {
      case 'Diamond': return 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-300';
      case 'Platinum': return 'bg-gray-500/20 text-gray-700 dark:text-gray-300';
      case 'Gold': return 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300';
      case 'Silver': return 'bg-gray-400/20 text-gray-600 dark:text-gray-400';
      case 'Bronze': return 'bg-orange-500/20 text-orange-700 dark:text-orange-300';
      default: return 'bg-gray-500/20 text-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Player Statistics
        </h1>
        <p className="text-muted-foreground mt-2">
          Track your progress and performance in Crypto Chaos
        </p>
      </div>

      {/* Player Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center mb-2">
              <Award className="h-8 w-8 text-primary-foreground" />
            </div>
            <CardTitle>{stats.playerName}</CardTitle>
            <Badge className={getRankColor(stats.rank)}>
              {stats.rank} Rank
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Level</span>
                <span className="font-bold">{stats.level}</span>
              </div>
              <Progress value={xpProgress} className="h-2" />
              <div className="text-center text-xs text-muted-foreground">
                {stats.xp} / {stats.level * 100} XP
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Combat Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">K/D Ratio</span>
              <span className="font-bold text-lg">{kdr.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Win Rate</span>
              <span className="font-bold text-lg">{winRate.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Accuracy</span>
              <span className="font-bold text-lg">{stats.accuracy.toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Kills</span>
              <span className="font-bold">{stats.totalKills}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Best Streak</span>
              <span className="font-bold">{stats.bestKillStreak}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Damage Dealt</span>
              <span className="font-bold">{Math.round(stats.damageDealt)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Match Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 rounded-lg bg-muted/30">
                <div className="text-2xl font-bold text-green-600">{stats.totalWins}</div>
                <div className="text-sm text-muted-foreground">Wins</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/30">
                <div className="text-2xl font-bold text-red-600">{stats.totalMatches - stats.totalWins}</div>
                <div className="text-sm text-muted-foreground">Losses</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/30">
                <div className="text-2xl font-bold text-blue-600">{stats.totalKills}</div>
                <div className="text-sm text-muted-foreground">Total Kills</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/30">
                <div className="text-2xl font-bold text-orange-600">{stats.totalDeaths}</div>
                <div className="text-sm text-muted-foreground">Total Deaths</div>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Favorite Weapon</span>
                <span className="font-medium capitalize">{stats.favoriteWeapon}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Time Played</span>
                <span className="font-medium">{Math.round(stats.timePlayedMs / 60000)} minutes</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Matches
            </CardTitle>
          </CardHeader>
          <CardContent>
            {matchHistory.length > 0 ? (
              <div className="space-y-3">
                {matchHistory.slice(0, 5).map((match) => (
                  <div key={match.matchId} className="p-3 rounded-lg bg-muted/30">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-medium capitalize">{match.gameMode}</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(match.timestamp).toLocaleDateString()}
                        </div>
                      </div>
                      <Badge 
                        variant={match.winner === stats.playerId ? "default" : "secondary"}
                        className={match.winner === stats.playerId ? "bg-green-500/20 text-green-700" : ""}
                      >
                        {match.winner === stats.playerId ? 'Win' : 'Loss'}
                      </Badge>
                    </div>
                    
                    {match.playerStats[stats.playerId] && (
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div className="text-center">
                          <div className="font-bold">{match.playerStats[stats.playerId].kills}</div>
                          <div className="text-muted-foreground">Kills</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold">{match.playerStats[stats.playerId].deaths}</div>
                          <div className="text-muted-foreground">Deaths</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold">{Math.round(match.playerStats[stats.playerId].damage)}</div>
                          <div className="text-muted-foreground">Damage</div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No matches played yet</p>
                <p className="text-sm">Start playing to see your match history!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};