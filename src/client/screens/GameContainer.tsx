import { useState, useEffect } from 'react';
import { trpc } from '../trpc';
import { GameDifficulty, LevelConfig } from '../types';
import { GameBoard } from '../components/GameBoard';
import { convertPuzzleToLevelConfig } from '../utils/puzzle';
import { LEVEL_CONFIGS } from '../constants/levels';
import { ThemeId, ThemeConfig, getThemeBgClass, Theme, GameCharacter } from '../../shared/themes';
import { TrailId } from '../../shared/trails';

export const GameContainer = ({
  difficulty,
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
}: {
  difficulty: GameDifficulty;
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
}) => {
  const [levelConfig, setLevelConfig] = useState<LevelConfig | null>(null);
  const [puzzleId, setPuzzleId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  // States for Daily Puzzle Navigation
  const [dailyNumber, setDailyNumber] = useState<number | null>(null);
  const [maxDailyNumber, setMaxDailyNumber] = useState<number>(1);

  // States for standard difficulty puzzle list navigation
  const [puzzlesList, setPuzzlesList] = useState<NonNullable<Awaited<ReturnType<typeof trpc.puzzle.getActive.query>>>[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(0);

  const fetchPuzzle = async (targetDailyNumber?: number) => {
    try {
      setLoading(true);
      if (difficulty === 'daily') {
        const queryInput = targetDailyNumber !== undefined ? { dailyNumber: targetDailyNumber, isPlayMode: true } : { isPlayMode: true };
        const res = await trpc.puzzle.getForPost.query(queryInput);
        if (res) {
          setDailyNumber(res.number);
          setMaxDailyNumber(res.maxDailyNumber);
          if (res.puzzle) {
            setLevelConfig(convertPuzzleToLevelConfig(res.puzzle));
            setPuzzleId(res.puzzle.id);
          }
        }
      } else if (difficulty === 'tutorial') {
        const activeTutorial = await trpc.puzzle.getActive.query('tutorial');
        if (activeTutorial) {
          setLevelConfig(convertPuzzleToLevelConfig(activeTutorial));
          setPuzzleId(activeTutorial.id);
        } else {
          setLevelConfig(LEVEL_CONFIGS[difficulty]);
          setPuzzleId(undefined);
        }
      } else {
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
          setLevelConfig(LEVEL_CONFIGS[difficulty]);
          setPuzzleId(undefined);
        }
      }
    } catch (e) {
      console.error('Failed to load puzzle', e);
      setLevelConfig(LEVEL_CONFIGS[difficulty]);
      setPuzzleId(undefined);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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

  if (loading) {
    const bgClass = getThemeBgClass(activeTheme, activeThemeStyle);
    return (
      <div className={`flex min-h-screen flex-col items-center justify-center ${bgClass}`}>
        <div className="text-white text-2xl font-bold animate-pulse">Loading puzzle...</div>
      </div>
    );
  }

  if (!levelConfig) return null;

  let hasPrevLevel = false;
  let hasNextLevel = false;
  let onPrevLevel: (() => void) | undefined = undefined;
  let onNextLevel: (() => void) | undefined = undefined;

  if (difficulty === 'daily' && dailyNumber !== null) {
    hasPrevLevel = dailyNumber > 1;
    hasNextLevel = dailyNumber < maxDailyNumber;
    onPrevLevel = () => {
      void fetchPuzzle(dailyNumber - 1);
    };
    onNextLevel = () => {
      void fetchPuzzle(dailyNumber + 1);
    };
  } else if (difficulty !== 'daily' && difficulty !== 'tutorial' && puzzlesList.length > 1) {
    hasPrevLevel = activeIndex > 0;
    hasNextLevel = activeIndex < puzzlesList.length - 1;
    onPrevLevel = () => loadListPuzzle(activeIndex - 1);
    onNextLevel = () => loadListPuzzle(activeIndex + 1);
  }

  return (
    <GameBoard
      levelConfig={levelConfig}
      difficulty={difficulty}
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
