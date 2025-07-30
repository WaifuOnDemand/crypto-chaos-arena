import { useState } from 'react';
import { GameUI } from '../components/GameUI';
import { GameCanvas } from '../components/GameCanvas';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';

const Index = () => {
  const [gameMode, setGameMode] = useState<'menu' | 'game' | 'controls'>('menu');

  const handleStartGame = () => {
    setGameMode('game');
  };

  const handleShowControls = () => {
    setGameMode('controls');
  };

  const handleBackToMenu = () => {
    setGameMode('menu');
  };

  if (gameMode === 'controls') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="game-card p-8 max-w-2xl w-full">
          <h2 className="text-3xl font-bold mb-6 text-center text-primary font-mono">
            🎮 GAME CONTROLS
          </h2>
          
          <div className="space-y-4 text-muted-foreground font-mono">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-bold text-accent mb-2">Movement:</h3>
                <ul className="space-y-1">
                  <li>• WASD or Arrow Keys: Move</li>
                  <li>• Space/W/Up: Jump</li>
                  <li>• Space (in air): Double Jump</li>
                  <li>• Shift: Directional Dash</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-bold text-secondary mb-2">Combat (Coming Soon):</h3>
                <ul className="space-y-1">
                  <li>• Mouse: Aim</li>
                  <li>• Left Click: Fire weapon</li>
                  <li>• Q: Switch weapon</li>
                  <li>• E: Knife attack</li>
                </ul>
              </div>
            </div>
            
            <div className="border-t border-border pt-4">
              <h3 className="font-bold text-primary mb-2">Game Features (Phase 1):</h3>
              <ul className="space-y-1">
                <li>• Physics-based movement with gravity</li>
                <li>• Double-jump and dash mechanics</li>
                <li>• Camera following and smooth movement</li>
                <li>• Platform collision system</li>
                <li>• Crypto-themed visual design</li>
              </ul>
            </div>
          </div>
          
          <div className="flex justify-center mt-8">
            <Button variant="game" onClick={handleBackToMenu}>
              ← Back to Menu
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (gameMode === 'game') {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-primary font-mono">
              CRYPTO CHAOS SHOOTER - MVP DEMO
            </h1>
            <Button variant="outline" onClick={handleBackToMenu}>
              ← Back to Menu
            </Button>
          </div>
          
          <GameCanvas />
        </div>
      </div>
    );
  }

  return <GameUI onStartGame={handleStartGame} onShowControls={handleShowControls} />;
};

export default Index;
