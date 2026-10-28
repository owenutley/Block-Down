import { useState, useEffect } from 'react';
import { trpc } from '../trpc';
import { GameDifficulty, LevelConfig } from '../types';
import { GameBoard } from '../components/GameBoard';
import { convertPuzzleToLevelConfig } from '../utils/puzzle';
import { trackClientEvent } from '../utils/analytics';
import { LEVEL_CONFIGS } from '../constants/levels';
import { SplashLoader } from '../components/SplashLoader';
import { ThemeId, ThemeConfig, getThemeBgClass, Theme, GameCharacter } from '../../shared/themes';
import { TrailId } from '../../shared/trails';

import { Puzzle, DailyTier, DailyTierInfo } from '../../shared/types';

export const GameContainer = ({
  difficulty,
  customPuzzle,
  onReturnToMenu,
  refreshCurrency,
  activeTheme = 'neon',
  themeConfig,
  activeThemeStyle,
  activeTrail = 'none',
  purchasedThemes,
  themes,
  onEquipTheme,
  activeCharacter = 'neon',
  purchasedCharacters = ['neon'],
  onEquipCharacter,
  characters = [],
  purchasedTrails,
  onEquipTrail,
  streak = 0,
  currency = 0,
}: {
  difficulty: GameDifficulty | 'custom';
  customPuzzle?: Puzzle | undefined;
  onReturnToMenu: () => void;
  refreshCurrency?: (() => void) | undefined;
  activeTheme?: ThemeId;
  themeConfig?: ThemeConfig | undefined;
  activeThemeStyle?: Theme | undefined;
  activeTrail?: TrailId;
  purchasedThemes?: ThemeId[] | undefined;
  themes?: Theme[] | undefined;
  onEquipTheme?: ((themeId: ThemeId) => Promise<unknown> | undefined) | undefined;
  activeCharacter?: string;
  purchasedCharacters?: string[];
  onEquipCharacter?: ((characterId: string) => Promise<unknown> | undefined) | undefined;
  characters?: GameCharacter[];
  purchasedTrails?: TrailId[] | undefined;
  onEquipTrail?: ((trailId: TrailId) => Promise<unknown> | undefined) | undefined;
  streak?: number;
  currency?: number;
}) => {
  const [levelConfig, setLevelConfig] = useState<LevelConfig | null>(null);
  const [puzzleId, setPuzzleId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  // States for Daily Puzzle Navigation
  const [dailyNumber, setDailyNumber] = useState<number | null>(null);
  const [_maxDailyNumber, setMaxDailyNumber] = useState<number>(1);
  const getInitialDailyTier = (): DailyTier => {
    try {
      const stored = localStorage.getItem('block_down_selected_tier');
      if (stored === 'easy' || stored === 'standard') return stored;
    } catch {
      // ignore
    }
    return 'standard';
  };

  const [dailyTier, setDailyTier] = useState<DailyTier>(getInitialDailyTier);
  const [tiersData, setTiersData] = useState<{ easy: DailyTierInfo; standard: DailyTierInfo } | null>(null);
  const [easyPuzzle, setEasyPuzzle] = useState<Puzzle | null>(null);
  const [standardPuzzle, setStandardPuzzle] = useState<Puzzle | null>(null);

  // States for standard difficulty puzzle list navigation
  const [puzzlesList, setPuzzlesList] = useState<NonNullable<Awaited<ReturnType<typeof trpc.puzzle.getActive.query>>>[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(0);

  const fetchPuzzle = async (targetDailyNumber?: number, targetTier?: DailyTier) => {
    try {
      setLoading(true);
      if (customPuzzle) {
        setLevelConfig(convertPuzzleToLevelConfig(customPuzzle));
        setPuzzleId(customPuzzle.id);
      } else if (difficulty === 'daily') {
        let requestedTier = targetTier;
        if (!requestedTier) {
          try {
            const stored = localStorage.getItem('block_down_selected_tier');
            if (stored === 'easy' || stored === 'standard') {
              requestedTier = stored;
              localStorage.removeItem('block_down_selected_tier');
            }
          } catch {
            // ignore
          }
        }
        const effectiveQueryTier = requestedTier || dailyTier;
        const queryInput = {
          isPlayMode: true,
          ...(targetDailyNumber !== undefined ? { dailyNumber: targetDailyNumber } : {}),
          tier: effectiveQueryTier,
        };
        
        // Timeout safeguard so network/proxy stalls don't cause perpetual loading
        const timeoutPromise = new Promise<null>((_, reject) =>
          setTimeout(() => reject(new Error('Daily puzzle fetch timeout')), 7000)
        );
        const res = (await Promise.race([
          trpc.puzzle.getForPost.query(queryInput),
          timeoutPromise,
        ])) as Awaited<ReturnType<typeof trpc.puzzle.getForPost.query>>;

        if (res) {
          setDailyNumber(res.number);
          setMaxDailyNumber(res.maxDailyNumber);
          const activeTier = effectiveQueryTier || res.tier || 'standard';
          setDailyTier(activeTier);
          if (res.tiers) {
            setTiersData(res.tiers);
          }
          if (res.easyPuzzle) {
            setEasyPuzzle(res.easyPuzzle);
          }
          if (res.standardPuzzle) {
            setStandardPuzzle(res.standardPuzzle);
          }
          const activePuzzle = activeTier === 'easy' ? (res.easyPuzzle || res.puzzle) : (res.standardPuzzle || res.puzzle);
          if (activePuzzle) {
            setLevelConfig(convertPuzzleToLevelConfig(activePuzzle));
            setPuzzleId(activePuzzle.id);
          } else {
            setLevelConfig(LEVEL_CONFIGS.easy);
            setPuzzleId(undefined);
          }
        } else {
          setLevelConfig(LEVEL_CONFIGS.easy);
          setPuzzleId(undefined);
        }
      } else if (difficulty === 'tutorial') {
        const activeTutorial = await trpc.puzzle.getActive.query('tutorial');
        if (activeTutorial) {
          setLevelConfig(convertPuzzleToLevelConfig(activeTutorial));
          setPuzzleId(activeTutorial.id);
        } else {
          setLevelConfig(LEVEL_CONFIGS.tutorial);
          setPuzzleId(undefined);
        }
      } else if (difficulty !== 'custom') {
        const list = await trpc.puzzle.getByDifficulty.query(difficulty);
        if (list && list.length > 0) {
          setPuzzlesList(list);
          setActiveIndex(0);
          const firstPuzzle = list[0];
          if (firstPuzzle) {
            setLevelConfig(convertPuzzleToLevelConfig(firstPuzzle));
            setPuzzleId(firstPuzzle.id);
          }
        } else {
          setLevelConfig(LEVEL_CONFIGS[difficulty] && LEVEL_CONFIGS[difficulty].blocks.length > 0 ? LEVEL_CONFIGS[difficulty] : LEVEL_CONFIGS.easy);
          setPuzzleId(undefined);
        }
      }
    } catch (e) {
      console.error('Failed to load puzzle', e);
      const fallbackConfig = difficulty === 'custom'
        ? LEVEL_CONFIGS.easy
        : (LEVEL_CONFIGS[difficulty] && LEVEL_CONFIGS[difficulty].blocks.length > 0 ? LEVEL_CONFIGS[difficulty] : LEVEL_CONFIGS.easy);
      setLevelConfig(fallbackConfig);
      setPuzzleId(undefined);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (difficulty === 'daily') {
      trackClientEvent('screen_view_daily');
    } else if (difficulty === 'custom') {
      trackClientEvent('screen_view_puzzle_maker');
    } else {
      trackClientEvent('screen_view_campaign');
    }
    void fetchPuzzle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficulty]);

  const loadListPuzzle = (index: number) => {
    if (index >= 0 && index < puzzlesList.length) {
      setActiveIndex(index);
      const puzzle = puzzlesList[index];
      if (puzzle) {
        setLevelConfig(convertPuzzleToLevelConfig(puzzle));
        setPuzzleId(puzzle.id);
      }
    }
  };

  const handleSwitchDailyTier = (newTier: DailyTier) => {
    setDailyTier(newTier);
    const targetPuzzle = newTier === 'easy' ? easyPuzzle : standardPuzzle;
    if (targetPuzzle) {
      setLevelConfig(convertPuzzleToLevelConfig(targetPuzzle));
      setPuzzleId(targetPuzzle.id);
    } else {
      void fetchPuzzle(dailyNumber ?? undefined, newTier);
    }
    void trpc.puzzle.setSelectedTier.mutate({ tier: newTier }).catch(() => {});
  };

  const handlePlayMainDaily = () => {
    handleSwitchDailyTier('standard');
  };

  if (loading) {
    const bgClass = getThemeBgClass(activeTheme, activeThemeStyle);
    return (
      <div className={`flex min-h-screen flex-col items-center justify-center ${bgClass} px-4 select-none`}>
        <SplashLoader
          statusMessages={[
            'INITIALIZING EXPANDED GRID...',
            'SYNCHRONIZING LEVEL STATE...',
            'CHARGING NEON PORTALS...',
            'CALCULATING OPTIMAL PAR...',
          ]}
        />
      </div>
    );
  }

  if (!levelConfig) return null;

  let hasPrevLevel = false;
  let hasNextLevel = false;
  let onPrevLevel: (() => void) | undefined = undefined;
  let onNextLevel: (() => void) | undefined = undefined;

  if (difficulty === 'daily') {
    hasPrevLevel = false;
    hasNextLevel = false;
    onPrevLevel = undefined;
    onNextLevel = undefined;
  } else if (difficulty !== 'tutorial' && difficulty !== 'custom' && puzzlesList.length > 1) {
    hasPrevLevel = activeIndex > 0;
    hasNextLevel = activeIndex < puzzlesList.length - 1;
    onPrevLevel = () => loadListPuzzle(activeIndex - 1);
    onNextLevel = () => loadListPuzzle(activeIndex + 1);
  }

  return (
    <GameBoard
      levelConfig={levelConfig}
      {...(difficulty !== 'custom' ? { difficulty } : {})}
      isCampaign={difficulty !== 'daily' && difficulty !== 'custom'}
      onReturnToMenu={onReturnToMenu}
      puzzleId={puzzleId}
      refreshCurrency={refreshCurrency}
      activeTheme={activeTheme}
      themeConfig={themeConfig}
      activeThemeStyle={activeThemeStyle}
      activeTrail={activeTrail}
      purchasedThemes={purchasedThemes}
      themes={themes}
      onEquipTheme={onEquipTheme}
      activeCharacter={activeCharacter}
      purchasedCharacters={purchasedCharacters}
      onEquipCharacter={onEquipCharacter}
      characters={characters}
      purchasedTrails={purchasedTrails}
      onEquipTrail={onEquipTrail}
      streak={streak}
      currency={currency}
      dailyTier={difficulty === 'daily' ? dailyTier : undefined}
      tiersData={difficulty === 'daily' ? tiersData : undefined}
      onSwitchDailyTier={difficulty === 'daily' ? handleSwitchDailyTier : undefined}
      onPlayMainDaily={difficulty === 'daily' ? handlePlayMainDaily : undefined}
      hasPrevLevel={hasPrevLevel}
      hasNextLevel={hasNextLevel}
      onPrevLevel={onPrevLevel}
      onNextLevel={onNextLevel}
      puzzleNumber={
        difficulty === 'daily'
          ? (dailyNumber ?? undefined)
          : difficulty === 'tutorial'
          ? 1
          : (activeIndex + 1)
      }
    />
  );
};
