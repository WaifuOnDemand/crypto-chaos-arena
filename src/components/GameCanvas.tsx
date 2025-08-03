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
        <p>🎮 WASD/Arrows: Move | Space: Jump | Shift: Dash | Mouse: Aim & Fire | Q: Switch Weapon</p>
        <p>🗝️ Debug: 1-Poison | 2-Burn | 3-Freeze | F1-Physics Debug</p>
        <p>💥 Grenades bounce 3 times and explode after 3 seconds with red blinking warning!</p>
      </div>
    </div>
  );
};