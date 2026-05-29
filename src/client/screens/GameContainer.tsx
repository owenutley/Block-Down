import { useState, useEffect } from 'react';
import { trpc } from '../trpc';
import { GameDifficulty, LevelConfig } from '../types';
import { GameBoard } from '../components/GameBoard';
import { convertPuzzleToLevelConfig } from '../utils/puzzle';
import { LEVEL_CONFIGS } from '../constants/levels';

export const GameContainer = ({ difficulty, onReturnToMenu, refreshCurrency }: { difficulty: GameDifficulty; onReturnToMenu: () => void; refreshCurrency?: (() => void) | undefined }) => {
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
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-mesh-gradient">
        <div className="text-white text-2xl font-bold animate-pulse">Loading puzzle...</div>
      </div>
    );
  }

  if (!levelConfig) return null;

  return <GameBoard levelConfig={levelConfig} difficulty={difficulty} onReturnToMenu={onReturnToMenu} puzzleId={puzzleId} refreshCurrency={refreshCurrency} />;
};
