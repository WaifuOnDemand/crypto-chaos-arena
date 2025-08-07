import React from 'react';
import { GameCanvas } from "../components/GameCanvas";
import { useWallet } from '@solana/wallet-adapter-react';

const Index = () => {
  const { connected } = useWallet();

  return (
    <div className="h-screen w-full">
      {!connected && (
        <div className="flex items-center justify-center h-full">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Crypto Chaos
            </h1>
            <p className="text-xl text-muted-foreground">
              Battle Arena - Connect your Solana wallet to play!
            </p>
            <div className="text-sm text-muted-foreground">
              Please connect your Solana wallet using the sidebar (Press TAB to toggle)
            </div>
          </div>
        </div>
      )}
      
      {connected && (
        <div className="h-full w-full flex items-center justify-center">
          <GameCanvas />
        </div>
      )}
    </div>
  );
};

export default Index;
