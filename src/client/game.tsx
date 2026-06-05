import './index.css';

import { StrictMode, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Admin } from './admin';
import { trpc } from './trpc';

import { GameDifficulty } from './types';
import { ThemeId } from '../shared/themes';
import { Menu } from './screens/Menu';
import { GameContainer } from './screens/GameContainer';
import { CampaignScreen } from './screens/CampaignScreen';
import { PastPuzzlesScreen } from './screens/PastPuzzlesScreen';
import { ShopScreen } from './screens/ShopScreen';

export const App = () => {
  const isMenuEntry = typeof window !== 'undefined' && window.location.pathname.includes('menu.html');
  const [currentScreen, setCurrentScreen] = useState<{ type: 'menu' } | { type: 'game'; difficulty: GameDifficulty } | { type: 'campaign' } | { type: 'past-puzzles' } | { type: 'shop' } | { type: 'mod-panel' }>(
    isMenuEntry ? { type: 'menu' } : { type: 'game', difficulty: 'daily' }
  );

  const [currency, setCurrency] = useState<number>(0);
  const [activeTheme, setActiveTheme] = useState<ThemeId>('neon');
  const [purchasedThemes, setPurchasedThemes] = useState<ThemeId[]>(['neon']);

  const fetchCurrency = async () => {
    try {
      const res = await trpc.currency.get.query();
      setCurrency(res.currency);
    } catch (e) {
      console.error('Failed to fetch currency:', e);
    }
  };

  const fetchThemeStatus = async () => {
    try {
      const res = await trpc.shop.getStatus.query();
      setActiveTheme(res.activeTheme);
      setPurchasedThemes(res.purchasedThemes);
    } catch (e) {
      console.error('Failed to fetch theme status:', e);
    }
  };

  useEffect(() => {
    void fetchCurrency();
    void fetchThemeStatus();
  }, []);

  const handleSelectDifficulty = (difficulty: GameDifficulty) => {
    setCurrentScreen({ type: 'game', difficulty });
  };

  const handleReturnToMenu = () => {
    setCurrentScreen({ type: 'menu' });
    void fetchCurrency();
    void fetchThemeStatus();
  };

  const handleSelectMod = () => {
    setCurrentScreen({ type: 'mod-panel' });
  };

  const handlePurchaseTheme = async (themeId: ThemeId) => {
    try {
      const res = await trpc.shop.purchase.mutate({ themeId });
      if (res.success) {
        setPurchasedThemes(res.purchasedThemes);
        setCurrency(res.balance);
      }
      return res;
    } catch (e) {
      console.error('Failed to purchase theme:', e);
      throw e;
    }
  };

  const handleEquipTheme = async (themeId: ThemeId) => {
    try {
      const res = await trpc.shop.setActive.mutate({ themeId });
      if (res.success) {
        setActiveTheme(res.activeTheme);
      }
      return res;
    } catch (e) {
      console.error('Failed to equip theme:', e);
      throw e;
    }
  };

  return (
    <>
      {currentScreen.type !== 'mod-panel' && (
        <div className="fixed top-4 right-4 sm:right-6 z-50 pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-1 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.15)] hover:border-cyan-400/50 transition-all select-none">
            <span className="text-cyan-400 text-[13px] font-black animate-pulse drop-shadow-[0_0_3px_rgba(34,211,238,0.8)]">✦</span>
            <span className="text-white font-extrabold text-[11px] tracking-wide font-mono">
              {currency}
            </span>
          </div>
        </div>
      )}

      {currentScreen.type === 'menu' ? (
        <Menu
          onSelectDifficulty={handleSelectDifficulty}
          onSelectCampaign={() => setCurrentScreen({ type: 'campaign' })}
          onSelectPastPuzzles={() => setCurrentScreen({ type: 'past-puzzles' })}
          onSelectShop={() => setCurrentScreen({ type: 'shop' })}
          onSelectMod={handleSelectMod}
          activeTheme={activeTheme}
        />
      ) : currentScreen.type === 'mod-panel' ? (
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
        <CampaignScreen onReturnToMenu={handleReturnToMenu} refreshCurrency={fetchCurrency} activeTheme={activeTheme} />
      ) : currentScreen.type === 'past-puzzles' ? (
        <PastPuzzlesScreen onReturnToMenu={handleReturnToMenu} refreshCurrency={fetchCurrency} activeTheme={activeTheme} />
      ) : currentScreen.type === 'shop' ? (
        <ShopScreen
          onReturnToMenu={handleReturnToMenu}
          refreshCurrency={fetchCurrency}
          activeTheme={activeTheme}
          purchasedThemes={purchasedThemes}
          currency={currency}
          onPurchaseTheme={handlePurchaseTheme}
          onEquipTheme={handleEquipTheme}
        />
      ) : (
        <GameContainer
          difficulty={currentScreen.difficulty}
          onReturnToMenu={handleReturnToMenu}
          refreshCurrency={fetchCurrency}
          activeTheme={activeTheme}
        />
      )}
    </>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
