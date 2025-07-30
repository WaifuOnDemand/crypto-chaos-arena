import { Button } from './ui/button';
import { Card } from './ui/card';

interface GameUIProps {
  onStartGame: () => void;
  onShowControls: () => void;
}

export const GameUI = ({ onStartGame, onShowControls }: GameUIProps) => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Title Section */}
        <div className="text-center mb-8">
          <h1 className="text-6xl font-bold mb-4 font-mono bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            CRYPTO CHAOS
          </h1>
          <h2 className="text-3xl font-bold mb-2 text-secondary font-mono">
            SHOOTER
          </h2>
          <p className="text-xl text-muted-foreground font-mono">
            Fast-paced 2D multiplayer mayhem with NFT-powered chaos
          </p>
        </div>

        {/* Game Features */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card className="game-card p-6 text-center">
            <div className="text-3xl mb-2">🔫</div>
            <h3 className="font-bold text-primary mb-2">20+ Weapons</h3>
            <p className="text-sm text-muted-foreground">
              Quirky physics-based weapons inspired by Enter the Gungeon
            </p>
          </Card>
          
          <Card className="game-card p-6 text-center">
            <div className="text-3xl mb-2">💥</div>
            <h3 className="font-bold text-secondary mb-2">Destructible Maps</h3>
            <p className="text-sm text-muted-foreground">
              BroForce-style destruction with persistent terrain damage
            </p>
          </Card>
          
          <Card className="game-card p-6 text-center">
            <div className="text-3xl mb-2">🪙</div>
            <h3 className="font-bold text-accent mb-2">NFT Skins</h3>
            <p className="text-sm text-muted-foreground">
              Solana-powered character and weapon customization
            </p>
          </Card>
        </div>

        {/* MVP Status */}
        <Card className="game-card p-6 mb-8">
          <h3 className="font-bold text-primary mb-4 text-center">🚧 MVP DEVELOPMENT STATUS</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-bold text-accent mb-2">✅ Phase 1 Complete:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Phaser 3 + TypeScript setup</li>
                <li>• Basic player movement (WASD/Arrows)</li>
                <li>• Jump & double-jump mechanics</li>
                <li>• Directional dash with cooldown</li>
                <li>• Physics-based collision system</li>
                <li>• Crypto-themed design system</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-secondary mb-2">🔄 Coming Next:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Combat system & weapons</li>
                <li>• Destructible environments</li>
                <li>• Multiplayer networking</li>
                <li>• Game modes & timers</li>
                <li>• Crypto-themed maps</li>
                <li>• Solana blockchain integration</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            variant="crypto" 
            size="lg" 
            onClick={onStartGame}
            className="text-lg px-8 py-4"
          >
            🎮 PLAY MVP DEMO
          </Button>
          <Button 
            variant="neon" 
            size="lg" 
            onClick={onShowControls}
            className="text-lg px-8 py-4"
          >
            📖 CONTROLS
          </Button>
        </div>

        {/* Development Note */}
        <div className="text-center mt-8 text-muted-foreground text-sm font-mono">
          <p>🧪 This is the Phase 1 MVP - Core movement and physics demo</p>
          <p>⚡ Built with Phaser 3, React, TypeScript & Tailwind CSS</p>
        </div>
      </div>
    </div>
  );
};