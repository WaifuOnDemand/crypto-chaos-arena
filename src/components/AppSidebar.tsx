import React from 'react';
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

const menuItems = [
  { title: 'Play Game', url: '/', icon: Play },
  { title: 'Lobby', url: '/lobby', icon: Users },
  { title: 'Statistics', url: '/stats', icon: BarChart3 },
  { title: 'Leaderboard', url: '/leaderboard', icon: Trophy },
  { title: 'Settings', url: '/settings', icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;
  const isExpanded = menuItems.some((item) => isActive(item.url));
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? 'bg-primary/20 text-primary font-medium' : 'hover:bg-muted/50';

  return (
    <Sidebar
      className={state === 'collapsed' ? 'w-14' : 'w-60'}
      collapsible="icon"
    >
      <SidebarContent className="bg-background/95 backdrop-blur-sm">
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
          <div className="mt-auto p-4 border-t">
            <div className="text-xs text-muted-foreground">
              <p>Phase 4: Advanced UI</p>
              <p>v1.0.0</p>
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}