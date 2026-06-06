import { useState, useEffect } from 'react';
import { trpc } from '../trpc';
import { GameDifficulty, LevelConfig } from '../types';
import { GameBoard } from '../components/GameBoard';
import { convertPuzzleToLevelConfig } from '../utils/puzzle';
import { LEVEL_CONFIGS } from '../constants/levels';
import { ThemeId, ThemeConfig, getThemeBgClass, Theme } from '../../shared/themes';

export const GameContainer = ({
  difficulty,
  onReturnToMenu,
  refreshCurrency,
  activeTheme = 'neon',
  themeConfig,
  activeThemeStyle
}: {
  difficulty: GameDifficulty;
  onReturnToMenu: () => void;
  refreshCurrency?: (() => void) | undefined;
  activeTheme?: ThemeId;
  themeConfig?: ThemeConfig | undefined;
  activeThemeStyle?: Theme | undefined;
}) => {
  const [levelConfig, setLevelConfig] = useState<LevelConfig | null>(null);
  const [puzzleId, setPuzzleId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPuzzle = async () => {
      try {
        setLoading(true);
        type PuzzleItem = NonNullable<Awaited<ReturnType<typeof trpc.puzzle.getActive.query>>>;
        let puzzles: PuzzleItem[] = [];
        if (difficulty === 'daily') {
          const res = await trpc.puzzle.getForPost.query();
          if (res?.puzzle) puzzles = [res.puzzle];
        } else if (difficulty === 'tutorial') {
          const activeTutorial = await trpc.puzzle.getActive.query('tutorial');
          if (activeTutorial) puzzles = [activeTutorial];
        } else {
          puzzles = await trpc.puzzle.getByDifficulty.query(difficulty);
        }

        if (puzzles && puzzles.length > 0) {
          const firstPuzzle = puzzles[0];
          if (firstPuzzle) {
            setLevelConfig(convertPuzzleToLevelConfig(firstPuzzle));
            setPuzzleId(firstPuzzle.id);
          }
        } else {
          // Fallback to hardcoded
          setLevelConfig(LEVEL_CONFIGS[difficulty]);
          setPuzzleId(undefined);
        }
      } catch (e) {
        console.error('Failed to load puzzle', e);
        setLevelConfig(LEVEL_CONFIGS[difficulty]);
        setPuzzleId(undefined);
      } finally {
        setLoading(false);
      }
    };
    void fetchPuzzle();
  }, [difficulty]);

  if (loading) {
    const bgClass = getThemeBgClass(activeTheme, activeThemeStyle);
    return (
      <div className={`flex min-h-screen flex-col items-center justify-center ${bgClass}`}>
        <div className="text-white text-2xl font-bold animate-pulse">Loading puzzle...</div>
      </div>
    );
  }

  if (!levelConfig) return null;

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
    />
  );
};
