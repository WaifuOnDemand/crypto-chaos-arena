import React, { useEffect, useState } from 'react';
import { Settings, Trophy, Users, Play, BarChart3, Wallet, LogOut, X } from 'lucide-react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

interface AppSidebarProps {
  isVisible: boolean;
  onToggle: () => void;
}

const menuItems = [
  { title: 'Play Game', url: '/', icon: Play },
  { title: 'Lobby', url: '/lobby', icon: Users },
  { title: 'Statistics', url: '/stats', icon: BarChart3 },
  { title: 'Leaderboard', url: '/leaderboard', icon: Trophy },
  { title: 'Settings', url: '/settings', icon: Settings },
];

export function AppSidebar({ isVisible, onToggle }: AppSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { connected, publicKey, disconnect } = useWallet();
  const { connection } = useConnection();
  const [balance, setBalance] = useState<number | null>(null);

  const currentPath = location.pathname;

  // Fetch SOL balance
  useEffect(() => {
    const fetchBalance = async () => {
      if (connected && publicKey && connection) {
        try {
          const balance = await connection.getBalance(publicKey);
          setBalance(balance / 1e9); // Convert lamports to SOL
        } catch (error) {
          console.error('Failed to fetch balance:', error);
          setBalance(null);
        }
      } else {
        setBalance(null);
      }
    };

    fetchBalance();
    const interval = setInterval(fetchBalance, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [connected, publicKey, connection]);

  // Keyboard shortcut to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab' && !event.ctrlKey && !event.altKey && !event.shiftKey) {
        event.preventDefault();
        onToggle();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onToggle]);

  const isActive = (path: string) => currentPath === path;

  if (!isVisible) return null;

  return (
    <div className="fixed top-0 left-0 h-full w-80 bg-background/10 backdrop-blur-lg border-r border-border/30 z-50 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary via-primary/80 to-primary/60 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-primary-foreground font-bold text-lg">CC</span>
            </div>
            <div>
              <h1 className="font-bold text-xl text-foreground">Crypto Chaos</h1>
              <p className="text-sm text-muted-foreground">Battle Arena</p>
            </div>
          </div>
          <button
            onClick={onToggle}
            className="p-2 rounded-lg hover:bg-muted/20 transition-colors"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Game Menu */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
            Game Menu
          </h2>
          <nav className="space-y-2">
            {menuItems.map((item) => (
              <NavLink
                key={item.title}
                to={item.url}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-primary/20 text-primary border border-primary/30 shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/10'
                  }`
                }
              >
                <item.icon className="h-5 w-5" />
                <span className="font-medium">{item.title}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Wallet Section */}
        <div className="p-6 border-t border-border/30">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
            Wallet
          </h2>
          
          {!connected ? (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/10 border border-border/30">
                <p className="text-sm text-muted-foreground mb-3">Connect your Solana wallet to play</p>
                <WalletMultiButton className="w-full" />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Wallet Info Card */}
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-foreground">Wallet Connected</span>
                  </div>
                  <button
                    onClick={disconnect}
                    className="p-1.5 rounded-md hover:bg-muted/20 transition-colors"
                  >
                    <LogOut className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
                
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Public Key</p>
                    <p className="text-sm font-mono text-foreground">
                      {publicKey?.toString().slice(0, 8)}...{publicKey?.toString().slice(-8)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Balance</p>
                    <p className="text-sm font-semibold text-foreground">
                      {balance !== null ? `${balance.toFixed(4)} SOL` : 'Loading...'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="space-y-2">
                <button
                  onClick={() => navigate('/lobby')}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors"
                >
                  <Users className="h-4 w-4" />
                  <span className="font-medium">Join Lobby</span>
                </button>
                <button
                  onClick={() => navigate('/stats')}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-muted/10 hover:bg-muted/20 text-foreground rounded-lg transition-colors"
                >
                  <BarChart3 className="h-4 w-4" />
                  <span className="font-medium">View Stats</span>
                </button>
                <button
                  onClick={() => navigate('/leaderboard')}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-muted/10 hover:bg-muted/20 text-foreground rounded-lg transition-colors"
                >
                  <Trophy className="h-4 w-4" />
                  <span className="font-medium">Leaderboard</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-border/30">
        <div className="text-xs text-muted-foreground space-y-1">
          <p className="font-medium">Phase 4: Advanced UI</p>
          <p>v1.0.0</p>
          <p className="mt-2 opacity-70">Press TAB to toggle sidebar</p>
        </div>
      </div>
    </div>
  );
}