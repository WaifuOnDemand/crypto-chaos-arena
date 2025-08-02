import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useEffect, useState } from 'react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wallet, Globe } from 'lucide-react';

export const WalletInfo = () => {
  const { connection } = useConnection();
  const { publicKey, connected } = useWallet();
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    if (!connection || !publicKey) {
      setBalance(null);
      return;
    }

    const getBalance = async () => {
      try {
        const balance = await connection.getBalance(publicKey);
        setBalance(balance / LAMPORTS_PER_SOL);
      } catch (error) {
        console.error('Error getting balance:', error);
        setBalance(null);
      }
    };

    getBalance();
    
    // Update balance every 30 seconds
    const interval = setInterval(getBalance, 30000);
    return () => clearInterval(interval);
  }, [connection, publicKey]);

  if (!connected || !publicKey) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Wallet Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Badge variant="secondary">Not Connected</Badge>
          <p className="text-sm text-muted-foreground mt-2">
            Connect your Solana wallet to start playing Crypto Chaos!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Wallet Connected
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <label className="text-sm font-medium">Public Key</label>
          <p className="text-sm font-mono bg-muted p-2 rounded break-all">
            {publicKey.toString()}
          </p>
        </div>
        
        <div>
          <label className="text-sm font-medium">Balance</label>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Globe className="h-3 w-3" />
              {balance !== null ? `${balance.toFixed(4)} SOL` : 'Loading...'}
            </Badge>
          </div>
        </div>

        <div className="pt-2">
          <Badge variant="default">Connected to Devnet</Badge>
        </div>
      </CardContent>
    </Card>
  );
};