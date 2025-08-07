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
    <div className="w-full h-full flex flex-col items-center justify-center">
      <div
        id="crypto-chaos-game"
        ref={gameRef}
        className="phaser-canvas pixel-perfect"
        style={{
          width: '100vw',
          height: '100vh',
          maxWidth: '100%',
          maxHeight: '100%',
        }}
      />
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center text-muted-foreground font-mono text-xs bg-background/80 backdrop-blur-sm rounded-lg p-2">
        <p>🎮 WASD/Arrows: Move | Space: Jump | Shift: Dash | Mouse: Aim & Fire | Q: Switch Weapon</p>
        <p>🗝️ Debug: 1-Poison | 2-Burn | 3-Freeze | F1-Physics Debug | TAB: Toggle Sidebar</p>
        <p>💥 Grenades bounce 3 times and explode after 3 seconds with red blinking warning!</p>
      </div>
    </div>
  );
};