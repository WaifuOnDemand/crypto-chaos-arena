import React, { useEffect } from 'react';
import { Settings, Trophy, Users, Play, BarChart3 } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { WalletInfo } from '@/components/wallet/WalletInfo';
import { WalletButton } from '@/components/wallet/WalletButton';
import { useWallet } from '@solana/wallet-adapter-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const menuItems = [
  { title: 'Play Game', url: '/', icon: Play },
  { title: 'Lobby', url: '/lobby', icon: Users },
  { title: 'Statistics', url: '/stats', icon: BarChart3 },
  { title: 'Leaderboard', url: '/leaderboard', icon: Trophy },
  { title: 'Settings', url: '/settings', icon: Settings },
];

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const navigate = useNavigate();
  const { connected } = useWallet();

  // Add keyboard shortcut to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab' && !event.ctrlKey && !event.altKey && !event.shiftKey) {
        event.preventDefault();
        toggleSidebar();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSidebar]);

  const isActive = (path: string) => currentPath === path;
  const isExpanded = menuItems.some((item) => isActive(item.url));
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? 'bg-primary/20 text-primary font-medium' : 'hover:bg-muted/50';

  return (
    <Sidebar
      className={state === 'collapsed' ? 'w-14' : 'w-60'}
      collapsible="icon"
    >
      <SidebarContent className="bg-background/20 backdrop-blur-md border-r border-border/50">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/60 rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">CC</span>
            </div>
            {!state || state === 'expanded' ? (
              <div>
                <h1 className="font-bold text-lg">Crypto Chaos</h1>
                <p className="text-xs text-muted-foreground">Battle Arena</p>
              </div>
            ) : null}
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Game Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="h-4 w-4" />
                      {(!state || state === 'expanded') && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {(!state || state === 'expanded') && (
          <SidebarGroup>
            <SidebarGroupLabel>Wallet</SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="space-y-4 p-4">
                <WalletButton />
                <WalletInfo />
                
                {connected && (
                  <div className="space-y-2">
                    <Button 
                      onClick={() => navigate('/lobby')} 
                      className="w-full gap-2"
                      size="sm"
                    >
                      <Users className="h-4 w-4" />
                      Join Lobby
                    </Button>
                    <Button 
                      onClick={() => navigate('/stats')} 
                      variant="outline" 
                      className="w-full gap-2"
                      size="sm"
                    >
                      <BarChart3 className="h-4 w-4" />
                      View Stats
                    </Button>
                    <Button 
                      onClick={() => navigate('/leaderboard')} 
                      variant="outline" 
                      className="w-full gap-2"
                      size="sm"
                    >
                      <Trophy className="h-4 w-4" />
                      Leaderboard
                    </Button>
                  </div>
                )}
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {(!state || state === 'expanded') && (
          <div className="mt-auto p-4 border-t border-border/50">
            <div className="text-xs text-muted-foreground">
              <p>Phase 4: Advanced UI</p>
              <p>v1.0.0</p>
              <p className="mt-2 text-xs opacity-70">Press TAB to toggle sidebar</p>
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}