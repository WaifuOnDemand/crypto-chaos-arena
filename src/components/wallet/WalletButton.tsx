import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wallet, LogOut } from 'lucide-react';

export const WalletButton = () => {
  const { wallet, disconnect, connected, publicKey } = useWallet();

  if (connected && publicKey) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="flex items-center gap-2">
          <Wallet className="h-4 w-4" />
          {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}
        </Badge>
        <Button
          variant="outline"
          size="sm"
          onClick={disconnect}
          className="flex items-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <div className="wallet-adapter-button-trigger">
      <WalletMultiButton />
    </div>
  );
};