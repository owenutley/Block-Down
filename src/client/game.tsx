import './index.css';

import { StrictMode, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { DevPanel } from './dev';
import { trpc } from './trpc';

import { GameDifficulty } from './types';
import { ThemeId, DEFAULT_THEME_CONFIGS, ThemeConfig, Theme, GameCharacter } from '../shared/themes';
import { TrailId } from '../shared/trails';
import { Menu } from './screens/Menu';
import { GameContainer } from './screens/GameContainer';
import { CampaignScreen } from './screens/CampaignScreen';
import { PastPuzzlesScreen } from './screens/PastPuzzlesScreen';
import { ShopScreen } from './screens/ShopScreen';

export const App = () => {
  const isMenuEntry = typeof window !== 'undefined' && window.location.pathname.includes('menu.html');
  const [currentScreen, setCurrentScreen] = useState<{ type: 'menu' } | { type: 'game'; difficulty: GameDifficulty } | { type: 'campaign' } | { type: 'past-puzzles' } | { type: 'shop' } | { type: 'dev-panel' }>(
    isMenuEntry ? { type: 'menu' } : { type: 'game', difficulty: 'daily' }
  );

  const [currency, setCurrency] = useState<number>(0);
  const [activeTheme, setActiveTheme] = useState<ThemeId>('neon');
  const [purchasedThemes, setPurchasedThemes] = useState<ThemeId[]>(['neon']);
  const [themeConfigs, setThemeConfigs] = useState<Record<ThemeId, ThemeConfig>>(DEFAULT_THEME_CONFIGS);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [activeTrail, setActiveTrail] = useState<TrailId>('none');
  const [purchasedTrails, setPurchasedTrails] = useState<TrailId[]>(['none']);
  const [activeCharacter, setActiveCharacter] = useState<string>('neon');
  const [purchasedCharacters, setPurchasedCharacters] = useState<string[]>(['neon']);
  const [characters, setCharacters] = useState<GameCharacter[]>([]);

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
      const [res, configs, allThemes, allCharacters] = await Promise.all([
        trpc.shop.getStatus.query(),
        trpc.theme.getAllConfigs.query(),
        trpc.theme.getAllThemes.query(),
        trpc.theme.getAllCharacters.query(),
      ]);
      setActiveTheme(res.activeTheme);
      setPurchasedThemes(res.purchasedThemes);
      setActiveTrail(res.activeTrail);
      setPurchasedTrails(res.purchasedTrails);
      setActiveCharacter(res.activeCharacter || 'neon');
      setPurchasedCharacters(res.purchasedCharacters || ['neon']);
      setThemeConfigs(configs);
      setThemes(allThemes);
      setCharacters(allCharacters);
    } catch (e) {
      console.error('Failed to fetch theme status:', e);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
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

  const handleSelectDev = () => {
    setCurrentScreen({ type: 'dev-panel' });
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

  const handlePurchaseCharacter = async (characterId: string) => {
    try {
      const res = await trpc.shop.purchaseCharacter.mutate({ characterId });
      if (res.success) {
        setPurchasedCharacters(res.purchasedCharacters);
        setCurrency(res.balance);
      }
      return res;
    } catch (e) {
      console.error('Failed to purchase character:', e);
      throw e;
    }
  };

  const handleEquipCharacter = async (characterId: string) => {
    try {
      const res = await trpc.shop.setActiveCharacter.mutate({ characterId });
      if (res.success) {
        setActiveCharacter(res.activeCharacter);
      }
      return res;
    } catch (e) {
      console.error('Failed to equip character:', e);
      throw e;
    }
  };

  const handlePurchaseTrail = async (trailId: TrailId) => {
    if (trailId === 'none') return;
    try {
      const res = await trpc.shop.purchaseTrail.mutate({ trailId });
      if (res.success) {
        setPurchasedTrails(res.purchasedTrails);
        setCurrency(res.balance);
      }
      return res;
    } catch (e) {
      console.error('Failed to purchase trail:', e);
      throw e;
    }
  };

  const handleEquipTrail = async (trailId: TrailId) => {
    try {
      const res = await trpc.shop.setActiveTrail.mutate({ trailId });
      if (res.success) {
        setActiveTrail(res.activeTrail);
      }
      return res;
    } catch (e) {
      console.error('Failed to equip trail:', e);
      throw e;
    }
  };

  const activeThemeStyle = themes.find(t => t.id === activeTheme);

  return (
    <>
      {currentScreen.type !== 'dev-panel' && (
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
          onSelectDev={handleSelectDev}
          activeTheme={activeTheme}
          activeThemeStyle={activeThemeStyle}
          themeConfig={themeConfigs[activeTheme]}
        />
      ) : currentScreen.type === 'dev-panel' ? (
        <div className="relative min-h-screen">
          <button
            onClick={handleReturnToMenu}
            className="absolute top-4 left-4 z-50 px-4 py-2 bg-black/60 border border-white/20 text-white rounded-lg font-bold text-sm transition-all hover:scale-105 active:scale-95"
          >
            ← Back to Menu
          </button>
          <DevPanel themeConfigs={themeConfigs} onSaveThemeConfigs={fetchThemeStatus} themes={themes} />
        </div>
      ) : currentScreen.type === 'campaign' ? (
        <CampaignScreen
          onReturnToMenu={handleReturnToMenu}
          refreshCurrency={fetchCurrency}
          activeTheme={activeTheme}
          activeThemeStyle={activeThemeStyle}
          themeConfig={themeConfigs[activeTheme]}
          activeTrail={activeTrail}
          purchasedThemes={purchasedThemes}
          themes={themes}
          onEquipTheme={handleEquipTheme}
          activeCharacter={activeCharacter}
          purchasedCharacters={purchasedCharacters}
          onEquipCharacter={handleEquipCharacter}
          characters={characters}
        />
      ) : currentScreen.type === 'past-puzzles' ? (
        <PastPuzzlesScreen
          onReturnToMenu={handleReturnToMenu}
          refreshCurrency={fetchCurrency}
          activeTheme={activeTheme}
          activeThemeStyle={activeThemeStyle}
          themeConfig={themeConfigs[activeTheme]}
          activeTrail={activeTrail}
          purchasedThemes={purchasedThemes}
          themes={themes}
          onEquipTheme={handleEquipTheme}
          activeCharacter={activeCharacter}
          purchasedCharacters={purchasedCharacters}
          onEquipCharacter={handleEquipCharacter}
          characters={characters}
        />
      ) : currentScreen.type === 'shop' ? (
        <ShopScreen
          onReturnToMenu={handleReturnToMenu}
          activeTheme={activeTheme}
          activeThemeStyle={activeThemeStyle}
          purchasedThemes={purchasedThemes}
          currency={currency}
          onPurchaseTheme={handlePurchaseTheme}
          onEquipTheme={handleEquipTheme}
          themeConfigs={themeConfigs}
          themes={themes}
          activeTrail={activeTrail}
          purchasedTrails={purchasedTrails}
          onPurchaseTrail={handlePurchaseTrail}
          onEquipTrail={handleEquipTrail}
          activeCharacter={activeCharacter}
          purchasedCharacters={purchasedCharacters}
          onPurchaseCharacter={handlePurchaseCharacter}
          onEquipCharacter={handleEquipCharacter}
          characters={characters}
        />
      ) : (
        <GameContainer
          difficulty={currentScreen.difficulty}
          onReturnToMenu={handleReturnToMenu}
          refreshCurrency={fetchCurrency}
          activeTheme={activeTheme}
          activeThemeStyle={activeThemeStyle}
          themeConfig={themeConfigs[activeTheme]}
          activeTrail={activeTrail}
          purchasedThemes={purchasedThemes}
          themes={themes}
          onEquipTheme={handleEquipTheme}
          activeCharacter={activeCharacter}
          purchasedCharacters={purchasedCharacters}
          onEquipCharacter={handleEquipCharacter}
          characters={characters}
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
