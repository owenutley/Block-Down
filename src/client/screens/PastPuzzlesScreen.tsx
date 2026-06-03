import { useState, useEffect } from 'react';
import { trpc } from '../trpc';
import { GameBoard } from '../components/GameBoard';
import { convertPuzzleToLevelConfig } from '../utils/puzzle';
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

export const PastPuzzlesScreen = ({
  onReturnToMenu,
  refreshCurrency,
  activeTheme = 'neon'
}: {
  onReturnToMenu: () => void;
  refreshCurrency?: (() => void) | undefined;
  activeTheme?: ThemeId;
}) => {
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

  const bgClass = getThemeBgClass('neon');

  if (loading) {
    return <div className={`flex min-h-screen items-center justify-center ${bgClass}`}><div className="text-white text-2xl font-bold animate-pulse">Loading Past Puzzles...</div></div>;
  }

  if (activePuzzleIndex !== null) {
    const puzzle = puzzles[activePuzzleIndex];
    const levelConfig = convertPuzzleToLevelConfig(puzzle);

    return (
      <GameBoard
        levelConfig={levelConfig}
        onReturnToMenu={() => setActivePuzzleIndex(null)}
        puzzleId={puzzle.id}
        refreshCurrency={refreshCurrency}
        activeTheme={activeTheme}
      />
    );
  }

  return (
    <>
      {/* Menu Button - Top Left */}
      <div className="fixed top-4 left-4 sm:left-6 z-50">
        <button
          onClick={onReturnToMenu}
          className="flex items-center justify-center bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.15)] hover:border-cyan-400/50 hover:scale-105 active:scale-95 transition-all text-white font-extrabold text-[11px] tracking-wide cursor-pointer select-none"
        >
          Menu
        </button>
      </div>

      <div className={`min-h-screen ${bgClass} text-white p-6 pb-20 transition-colors duration-500`}>
        <div className="max-w-4xl mx-auto relative pt-12">
          {/* Centered Title */}
          <div className="flex justify-center items-center mb-12">
            <h1 className="text-5xl font-black neon-text-title tracking-tight text-center">
              Past Puzzles
            </h1>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {puzzles.map((puzzle, idx) => {
              const dateStr = puzzle.id.split('daily-')[1] || puzzle.id;
              
              return (
                <button
                  key={puzzle.id}
                  onClick={() => setActivePuzzleIndex(idx)}
                  className="relative rounded-2xl flex flex-col items-center justify-center p-6 theme-btn"
                >
                  <span className="text-2xl font-black mb-2 text-white">{dateStr}</span>
                  <span className="text-white/80">{puzzle.name}</span>
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
    </>
  );
};
