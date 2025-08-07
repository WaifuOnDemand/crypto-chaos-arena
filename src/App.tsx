import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppSidebar } from "./components/AppSidebar";
import { SolanaWalletProvider } from "./components/wallet/WalletProvider";
import Index from "./pages/Index";
import { GameLobby } from "./pages/GameLobby";
import { PlayerStatistics } from "./pages/PlayerStatistics";
import { Leaderboard } from "./pages/Leaderboard";
import { GameSettings } from "./pages/GameSettings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [sidebarVisible, setSidebarVisible] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SolanaWalletProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <div className="min-h-screen w-full bg-background relative">
              <AppSidebar 
                isVisible={sidebarVisible} 
                onToggle={() => setSidebarVisible(!sidebarVisible)} 
              />
              
              <main className="min-h-screen w-full">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/lobby" element={<GameLobby />} />
                  <Route path="/stats" element={<PlayerStatistics />} />
                  <Route path="/leaderboard" element={<Leaderboard />} />
                  <Route path="/settings" element={<GameSettings />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
            </div>
          </BrowserRouter>
        </SolanaWalletProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
