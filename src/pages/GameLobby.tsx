import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Clock, Zap, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface GameMode {
  id: string;
  name: string;
  description: string;
  maxPlayers: number;
  duration: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  icon: React.ReactNode;
}

const gameModes: GameMode[] = [
  {
    id: 'deathmatch',
    name: 'Deathmatch',
    description: 'Classic free-for-all combat. Highest kill count wins!',
    maxPlayers: 8,
    duration: '5 minutes',
    difficulty: 'Easy',
    icon: <Target className="h-5 w-5" />
  },
  {
    id: 'lastManStanding',
    name: 'Last Man Standing',
    description: 'Survive until the end. One life, winner takes all!',
    maxPlayers: 6,
    duration: '8 minutes',
    difficulty: 'Hard',
    icon: <Users className="h-5 w-5" />
  },
  {
    id: 'blitzkrieg',
    name: 'Blitzkrieg',
    description: 'Fast-paced action with rapid weapon spawns and destruction!',
    maxPlayers: 4,
    duration: '3 minutes',
    difficulty: 'Medium',
    icon: <Zap className="h-5 w-5" />
  }
];

const currentPlayers = [
  { id: '1', name: 'CryptoWarrior', rank: 'Gold', ping: 45 },
  { id: '2', name: 'BlockBot_Alpha', rank: 'Silver', ping: 12 },
  { id: '3', name: 'BlockBot_Beta', rank: 'Bronze', ping: 8 }
];

export const GameLobby: React.FC = () => {
  const [selectedMode, setSelectedMode] = useState<string>('deathmatch');
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();

  const handleStartGame = () => {
    setIsSearching(true);
    // Simulate matchmaking delay
    setTimeout(() => {
      setIsSearching(false);
      navigate('/');
    }, 2000);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-500/20 text-green-700 dark:text-green-300';
      case 'Medium': return 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300';
      case 'Hard': return 'bg-red-500/20 text-red-700 dark:text-red-300';
      default: return 'bg-gray-500/20 text-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Game Lobby
        </h1>
        <p className="text-muted-foreground mt-2">
          Choose your game mode and battle other players in the crypto chaos arena!
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Game Modes */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-semibold mb-4">Select Game Mode</h2>
          <div className="grid gap-4">
            {gameModes.map((mode) => (
              <Card 
                key={mode.id}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  selectedMode === mode.id 
                    ? 'ring-2 ring-primary bg-primary/5' 
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => setSelectedMode(mode.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {mode.icon}
                      <CardTitle className="text-lg">{mode.name}</CardTitle>
                    </div>
                    <Badge className={getDifficultyColor(mode.difficulty)}>
                      {mode.difficulty}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-3">{mode.description}</p>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {mode.maxPlayers} players
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {mode.duration}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Current Lobby */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Current Lobby</h2>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Players ({currentPlayers.length}/8)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {currentPlayers.map((player, index) => (
                <div key={player.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-xs font-bold text-primary-foreground">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{player.name}</p>
                      <p className="text-xs text-muted-foreground">{player.rank}</p>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {player.ping}ms
                  </div>
                </div>
              ))}
              
              <div className="pt-4 border-t">
                <Button 
                  onClick={handleStartGame}
                  disabled={isSearching}
                  className="w-full"
                  size="lg"
                >
                  {isSearching ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Searching...
                    </>
                  ) : (
                    'Start Game'
                  )}
                </Button>
                
                <div className="mt-3 p-3 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground text-center">
                    Selected: <span className="font-medium text-foreground">
                      {gameModes.find(m => m.id === selectedMode)?.name}
                    </span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};