import './index.css';

import { StrictMode, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Admin } from './admin';
import { trpc } from './trpc';

import { GameDifficulty } from './types';
import { Menu } from './screens/Menu';
import { GameContainer } from './screens/GameContainer';
import { CampaignScreen } from './screens/CampaignScreen';
import { PastPuzzlesScreen } from './screens/PastPuzzlesScreen';

export const App = () => {
  const isMenuEntry = typeof window !== 'undefined' && window.location.pathname.includes('menu.html');
  const [currentScreen, setCurrentScreen] = useState<{ type: 'menu' } | { type: 'game'; difficulty: GameDifficulty } | { type: 'campaign' } | { type: 'past-puzzles' } | { type: 'admin' }>(
    isMenuEntry ? { type: 'menu' } : { type: 'game', difficulty: 'daily' }
  );

  const [currency, setCurrency] = useState<number>(0);

  const fetchCurrency = async () => {
    try {
      const res = await trpc.currency.get.query();
      setCurrency(res.currency);
    } catch (e) {
      console.error('Failed to fetch currency:', e);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchCurrency();
  }, []);

  const handleSelectDifficulty = (difficulty: GameDifficulty) => {
    setCurrentScreen({ type: 'game', difficulty });
  };

  const handleReturnToMenu = () => {
    setCurrentScreen({ type: 'menu' });
  };

  const handleSelectAdmin = () => {
    setCurrentScreen({ type: 'admin' });
  };

  return (
    <>
      {currentScreen.type !== 'admin' && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-1.5 bg-black/50 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)] hover:border-cyan-400/50 transition-all select-none">
            <span className="text-cyan-400 text-base font-black animate-pulse drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]">✦</span>
            <span className="text-white font-extrabold text-[13px] tracking-wide font-mono">
              {currency} <span className="text-cyan-300 font-bold uppercase text-[9px] tracking-widest ml-1">SHARDS</span>
            </span>
          </div>
        </div>
      )}

      {currentScreen.type === 'menu' ? (
        <Menu 
          onSelectDifficulty={handleSelectDifficulty} 
          onSelectCampaign={() => setCurrentScreen({ type: 'campaign' })} 
          onSelectPastPuzzles={() => setCurrentScreen({ type: 'past-puzzles' })}
          onSelectAdmin={handleSelectAdmin} 
        />
      ) : currentScreen.type === 'admin' ? (
        <div className="relative min-h-screen">
          <button
            onClick={handleReturnToMenu}
            className="absolute top-4 left-4 z-50 px-4 py-2 bg-black/60 border border-white/20 text-white rounded-lg font-bold text-sm transition-all hover:scale-105 active:scale-95"
          >
            ← Back to Menu
          </button>
          <Admin />
        </div>
      ) : currentScreen.type === 'campaign' ? (
        <CampaignScreen onReturnToMenu={handleReturnToMenu} refreshCurrency={fetchCurrency} />
      ) : currentScreen.type === 'past-puzzles' ? (
        <PastPuzzlesScreen onReturnToMenu={handleReturnToMenu} refreshCurrency={fetchCurrency} />
      ) : (
        <GameContainer difficulty={currentScreen.difficulty} onReturnToMenu={handleReturnToMenu} refreshCurrency={fetchCurrency} />
      )}
    </>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
