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
import { PuzzleMakerScreen } from './screens/PuzzleMakerScreen';
import { ShopScreen } from './screens/ShopScreen';
import { CommunityScreen } from './screens/CommunityScreen';
import { Puzzle } from '../shared/types';

export const App = () => {
  const getInitialScreen = () => {
    if (typeof window === 'undefined') return { type: 'game' as const, difficulty: 'daily' as const };
    const fullUrl = (window.location.href + window.location.pathname + window.location.search + window.location.hash).toLowerCase();
    if (fullUrl.includes('campaign')) return { type: 'campaign' as const };
    if (fullUrl.includes('community')) return { type: 'community' as const };
    if (fullUrl.includes('puzzle-maker') || fullUrl.includes('puzzlemaker')) return { type: 'puzzle-maker' as const };
    if (fullUrl.includes('shop')) return { type: 'shop' as const };
    if (fullUrl.includes('menu')) return { type: 'menu' as const };
    return { type: 'game' as const, difficulty: 'daily' as const };
  };

  const [currentScreen, setCurrentScreen] = useState<
    | { type: 'menu' }
    | { type: 'game'; difficulty: GameDifficulty }
    | { type: 'custom-game'; puzzle: Puzzle }
    | { type: 'campaign' }
    | { type: 'community' }
    | { type: 'puzzle-maker' }
    | { type: 'shop' }
    | { type: 'dev-panel' }
  >(getInitialScreen);

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

  const [streak, setStreak] = useState<number>(0);
  const [isSubGameActive, setIsSubGameActive] = useState<boolean>(false);

  const fetchCurrency = async () => {
    try {
      const [res, streakRes] = await Promise.all([
        trpc.currency.get.query(),
        trpc.progress.getStreak.query(),
      ]);
      setCurrency(res.currency);
      setStreak(streakRes.currentStreak);
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
    setIsSubGameActive(false);
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

  const activeThemeStyle = themes.find((t) => t.id === activeTheme);

  return (
    <>
      {currentScreen.type === 'menu' ? (
        <Menu
          onSelectDifficulty={handleSelectDifficulty}
          onSelectCampaign={() => setCurrentScreen({ type: 'campaign' })}
          onSelectCommunity={() => setCurrentScreen({ type: 'community' })}
          onSelectPuzzleMaker={() => setCurrentScreen({ type: 'puzzle-maker' })}
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
          streak={streak}
          currency={currency}
          onGameStateChange={setIsSubGameActive}
        />
      ) : currentScreen.type === 'puzzle-maker' ? (
        <PuzzleMakerScreen
          onReturnToMenu={handleReturnToMenu}
          activeTheme={activeTheme}
          activeThemeStyle={activeThemeStyle}
          themeConfig={themeConfigs[activeTheme]}
          themeConfigs={themeConfigs}
          themes={themes}
          purchasedThemes={purchasedThemes}
          activeCharacter={activeCharacter}
          purchasedCharacters={purchasedCharacters}
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
      ) : currentScreen.type === 'community' ? (
        <CommunityScreen
          onReturnToMenu={handleReturnToMenu}
          onSelectPuzzle={(puzzle) => setCurrentScreen({ type: 'custom-game', puzzle })}
          onOpenPuzzleMaker={() => setCurrentScreen({ type: 'puzzle-maker' })}
          activeTheme={activeTheme}
          activeThemeStyle={activeThemeStyle}
          themeConfig={themeConfigs[activeTheme]}
        />
      ) : currentScreen.type === 'custom-game' ? (
        <GameContainer
          difficulty="custom"
          customPuzzle={currentScreen.puzzle}
          onReturnToMenu={() => setCurrentScreen({ type: 'community' })}
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
          streak={streak}
          currency={currency}
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
          streak={streak}
          currency={currency}
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
