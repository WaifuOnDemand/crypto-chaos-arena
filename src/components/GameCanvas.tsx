import { useEffect, useRef } from 'react';
import { gameManager } from '../game/GameManager';

export const GameCanvas = () => {
  const gameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (gameRef.current) {
      // Initialize the game
      gameManager.initialize(gameRef.current.id);
    }

    // Cleanup on unmount
    return () => {
      gameManager.destroy();
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        id="crypto-chaos-game"
        ref={gameRef}
        className="phaser-canvas pixel-perfect"
        style={{
          width: '1200px',
          height: '800px',
          maxWidth: '100%',
          aspectRatio: '3/2',
        }}
      />
      <div className="text-center text-muted-foreground font-mono text-sm">
        <p>🎮 WASD/Arrows: Move | Space: Jump | Shift: Dash | Mouse: Aim</p>
        <p>💀 Phase 1: Basic movement and physics are ready!</p>
      </div>
    </div>
  );
};