import { useState, useEffect } from 'react';
import { trpc } from '../trpc';
import { GameDifficulty, LevelConfig } from '../types';
import { GameBoard } from '../components/GameBoard';
import { convertPuzzleToLevelConfig } from '../utils/puzzle';
import { LEVEL_CONFIGS } from '../constants/levels';
import { ThemeId } from '../../shared/themes';

const getThemeBgClass = (themeId: ThemeId) => {
  switch (themeId) {
    case 'arcade':
      return 'bg-zinc-950 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,3px_100%]';
    case 'cosmic':
      return 'bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950';
    case 'zen':
      return 'bg-gradient-to-br from-stone-800 via-stone-900 to-emerald-950';
    case 'neon':
    default:
      return 'bg-mesh-gradient';
  }
};

export const GameContainer = ({
  difficulty,
  onReturnToMenu,
  refreshCurrency,
  activeTheme = 'neon'
}: {
  difficulty: GameDifficulty;
  onReturnToMenu: () => void;
  refreshCurrency?: (() => void) | undefined;
  activeTheme?: ThemeId;
}) => {
  const [levelConfig, setLevelConfig] = useState<LevelConfig | null>(null);
  const [puzzleId, setPuzzleId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPuzzle = async () => {
      try {
        setLoading(true);
        let puzzles: any[] = [];
        if (difficulty === 'daily') {
          const res = await trpc.puzzle.getForPost.query();
          if (res?.puzzle) puzzles = [res.puzzle];
        } else if (difficulty === 'tutorial') {
          const activeTutorial = await trpc.puzzle.getActive.query('tutorial');
          if (activeTutorial) puzzles = [activeTutorial];
        } else {
          puzzles = await trpc.puzzle.getByDifficulty.query(difficulty as any);
        }

        if (puzzles && puzzles.length > 0) {
          setLevelConfig(convertPuzzleToLevelConfig(puzzles[0]));
          setPuzzleId(puzzles[0].id);
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
    fetchPuzzle();
  }, [difficulty]);

  if (loading) {
    const bgClass = getThemeBgClass(activeTheme);
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
    />
  );
};
