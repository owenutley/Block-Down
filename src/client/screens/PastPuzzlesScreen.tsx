import { useState, useEffect } from 'react';
import { trpc } from '../trpc';
import { GameBoard } from '../components/GameBoard';
import { convertPuzzleToLevelConfig } from '../utils/puzzle';

export const PastPuzzlesScreen = ({ onReturnToMenu }: { onReturnToMenu: () => void }) => {
  const [loading, setLoading] = useState(true);
  const [puzzles, setPuzzles] = useState<any[]>([]);
  const [activePuzzleIndex, setActivePuzzleIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchPastPuzzles = async () => {
      try {
        setLoading(true);
        const past = await trpc.puzzle.getPastDailyPuzzles.query();
        setPuzzles(past || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchPastPuzzles();
  }, []);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-mesh-gradient"><div className="text-white text-2xl font-bold animate-pulse">Loading Past Puzzles...</div></div>;
  }

  if (activePuzzleIndex !== null) {
    const puzzle = puzzles[activePuzzleIndex];
    const levelConfig = convertPuzzleToLevelConfig(puzzle);

    return (
      <GameBoard
        levelConfig={levelConfig}
        difficulty={undefined}
        onReturnToMenu={() => setActivePuzzleIndex(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-mesh-gradient text-white p-6 pb-20">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-12 pt-8">
          <h1 className="text-5xl font-black neon-text-title tracking-tight">Past Puzzles</h1>
          <button onClick={onReturnToMenu} className="px-6 py-3 bg-black/60 border border-pink-500 neon-pink text-pink-300 rounded-xl font-bold transition hover:scale-105">
            Back to Menu
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {puzzles.map((puzzle, idx) => {
            const dateStr = puzzle.id.split('daily-')[1] || puzzle.id;
            
            return (
              <button
                key={puzzle.id}
                onClick={() => setActivePuzzleIndex(idx)}
                className="relative rounded-2xl flex flex-col items-center justify-center p-6 border-2 transition-all bg-black/60 border-pink-500 neon-pink hover:scale-105"
              >
                <span className="text-2xl font-black mb-2 text-pink-300">{dateStr}</span>
                <span className="text-white/60">{puzzle.name}</span>
              </button>
            );
          })}
        </div>
        
        {puzzles.length === 0 && (
          <div className="text-center text-gray-400 py-12 text-xl">
            No past daily puzzles available yet. Check back tomorrow!
          </div>
        )}
      </div>
    </div>
  );
};
