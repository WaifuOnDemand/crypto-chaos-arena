import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award, Crown } from 'lucide-react';
import { gameDataManager, PlayerStats } from '../game/data/GameDataManager';

export const Leaderboard: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<PlayerStats[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<PlayerStats | null>(null);

  useEffect(() => {
    const data = gameDataManager.getLeaderboard();
    setLeaderboard(data);
    setCurrentPlayer(gameDataManager.getPlayerStats());
  }, []);

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1: return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2: return <Medal className="h-5 w-5 text-gray-400" />;
      case 3: return <Award className="h-5 w-5 text-orange-500" />;
      default: return <Trophy className="h-4 w-4 text-muted-foreground" />;
    }
  };

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

  const getPositionBg = (position: number, isCurrentPlayer: boolean) => {
    if (isCurrentPlayer) return 'bg-primary/10 border-primary/50';
    switch (position) {
      case 1: return 'bg-yellow-500/5 border-yellow-500/20';
      case 2: return 'bg-gray-500/5 border-gray-500/20';
      case 3: return 'bg-orange-500/5 border-orange-500/20';
      default: return 'bg-muted/30 border-transparent';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Leaderboard
        </h1>
        <p className="text-muted-foreground mt-2">
          See how you rank against other players in Crypto Chaos
        </p>
      </div>

      {/* Top 3 Podium */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {leaderboard.slice(0, 3).map((player, index) => {
          const position = index + 1;
          const isCurrentPlayer = currentPlayer?.playerId === player.playerId;
          const winRate = player.totalMatches > 0 ? (player.totalWins / player.totalMatches * 100) : 0;
          const kdr = player.totalDeaths > 0 ? (player.totalKills / player.totalDeaths) : player.totalKills;

          return (
            <Card 
              key={player.playerId} 
              className={`${getPositionBg(position, isCurrentPlayer)} border-2 ${
                position === 1 ? 'order-1 md:order-2' : 
                position === 2 ? 'order-2 md:order-1' : 
                'order-3 md:order-3'
              }`}
            >
              <CardHeader className="text-center pb-3">
                <div className="mx-auto mb-2">
                  {getRankIcon(position)}
                </div>
                <CardTitle className="text-lg">{player.playerName}</CardTitle>
                <Badge className={getRankColor(player.rank)}>
                  {player.rank}
                </Badge>
                {isCurrentPlayer && (
                  <Badge variant="outline" className="mt-1">
                    You
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">#{position}</div>
                  <div className="text-sm text-muted-foreground">Rank</div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-center">
                    <div className="font-bold">{player.totalWins}</div>
                    <div className="text-muted-foreground">Wins</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold">{winRate.toFixed(1)}%</div>
                    <div className="text-muted-foreground">Win Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold">{kdr.toFixed(2)}</div>
                    <div className="text-muted-foreground">K/D</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold">{player.level}</div>
                    <div className="text-muted-foreground">Level</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Full Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Full Rankings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {leaderboard.map((player, index) => {
              const position = index + 1;
              const isCurrentPlayer = currentPlayer?.playerId === player.playerId;
              const winRate = player.totalMatches > 0 ? (player.totalWins / player.totalMatches * 100) : 0;
              const kdr = player.totalDeaths > 0 ? (player.totalKills / player.totalDeaths) : player.totalKills;

              return (
                <div
                  key={player.playerId}
                  className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all hover:shadow-md ${getPositionBg(position, isCurrentPlayer)}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 min-w-[60px]">
                      {getRankIcon(position)}
                      <span className="font-bold text-lg">#{position}</span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center">
                        <span className="text-primary-foreground font-bold text-sm">
                          {player.playerName.slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium">{player.playerName}</div>
                        <div className="flex items-center gap-2">
                          <Badge className={`${getRankColor(player.rank)} text-xs`}>
                            {player.rank}
                          </Badge>
                          {isCurrentPlayer && (
                            <Badge variant="outline" className="text-xs">
                              You
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-6 text-center">
                    <div>
                      <div className="font-bold">{player.totalWins}</div>
                      <div className="text-xs text-muted-foreground">Wins</div>
                    </div>
                    <div>
                      <div className="font-bold">{winRate.toFixed(1)}%</div>
                      <div className="text-xs text-muted-foreground">Win Rate</div>
                    </div>
                    <div>
                      <div className="font-bold">{kdr.toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground">K/D Ratio</div>
                    </div>
                    <div>
                      <div className="font-bold">{player.level}</div>
                      <div className="text-xs text-muted-foreground">Level</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};