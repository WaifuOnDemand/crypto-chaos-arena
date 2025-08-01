import React from 'react';
import { GameCanvas } from "../components/GameCanvas";
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { Users, Trophy, BarChart3 } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Crypto Chaos
        </h1>
        <p className="text-xl text-muted-foreground">
          Battle Arena - Phase 4: Advanced UI & Statistics
        </p>
        
        <div className="flex gap-4 justify-center flex-wrap">
          <Button onClick={() => navigate('/lobby')} className="gap-2">
            <Users className="h-4 w-4" />
            Join Lobby
          </Button>
          <Button onClick={() => navigate('/stats')} variant="outline" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            View Stats
          </Button>
          <Button onClick={() => navigate('/leaderboard')} variant="outline" className="gap-2">
            <Trophy className="h-4 w-4" />
            Leaderboard
          </Button>
        </div>
      </div>

      <div className="flex justify-center">
        <GameCanvas />
      </div>
    </div>
  );
};

export default Index;
