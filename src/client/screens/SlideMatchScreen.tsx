import { useState, useEffect, useCallback } from 'react';
import { trpc } from '../trpc';
import { SlideMatchGameBoard } from '../components/SlideMatchGameBoard';
import { SlideMatchInstructionsModal } from '../components/SlideMatchInstructionsModal';
import { ThemeId, ThemeConfig, Theme, getThemeBgClass } from '../../shared/themes';
import { SlideMatchEndlessStats } from '../../shared/types';
import { cn } from '../utils';

export type SlideMatchScreenProps = {
  onReturnToMenu: () => void;
  activeTheme?: ThemeId;
  activeThemeStyle?: Theme | undefined;
  themeConfig?: ThemeConfig | undefined;
  onGameStateChange?: ((isGameActive: boolean) => void) | undefined;
};

export const SlideMatchScreen = ({
  onReturnToMenu,
  activeTheme = 'neon',
  activeThemeStyle,
  themeConfig,
  onGameStateChange,
}: SlideMatchScreenProps) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SlideMatchEndlessStats>({
    highScore: 0,
    highestStage: 0,
    totalRuns: 0,
    totalPuzzlesSolved: 0,
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    onGameStateChange?.(isPlaying);
  }, [isPlaying, onGameStateChange]);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const data = await trpc.slideMatch.getEndlessStats.query();
      if (data) {
        setStats(data);
      }
    } catch (e) {
      console.error('Failed to load Slide Match stats:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchStats();
  }, [fetchStats]);

  const handleStartGame = () => {
    // If first time player, show instructions first
    if (stats.totalRuns === 0) {
      setShowInstructions(true);
    } else {
      setIsPlaying(true);
    }
  };

  const bgClass = getThemeBgClass(activeTheme, activeThemeStyle);

  if (isPlaying) {
    return (
      <SlideMatchGameBoard
        initialStage={1}
        onReturnToHub={() => {
          setIsPlaying(false);
          void fetchStats();
        }}
        activeTheme={activeTheme}
        activeThemeStyle={activeThemeStyle}
        themeConfig={themeConfig}
      />
    );
  }

  return (
    <div
      className={`h-[100dvh] w-full ${bgClass} text-white flex flex-col items-center justify-between p-3 sm:p-4 md:p-6 transition-colors duration-500 overflow-hidden select-none`}
    >
      <div className="w-full max-w-xl flex flex-col items-center flex-1 min-h-0">
        {/* Header Bar with Menu Button */}
        <div className="w-full flex justify-between items-center mb-2 pt-1 shrink-0">
          <button
            onClick={onReturnToMenu}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold theme-btn backdrop-blur-md transition-all shadow-md active:scale-95 cursor-pointer"
          >
            ← Main Menu
          </button>

          <button
            onClick={() => setShowInstructions(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800/80 hover:bg-slate-700 text-cyan-300 border border-cyan-500/40 shadow transition-all active:scale-95 cursor-pointer"
          >
            <span>📖</span>
            <span>How to Play</span>
          </button>
        </div>

        {/* Hero Title Section */}
        <div className="flex flex-col justify-center items-center my-auto shrink-0 text-center space-y-2">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-3xl sm:text-4xl shadow-[0_0_30px_rgba(6,182,212,0.4)] animate-bounce">
            ⚡
          </div>

          <h1 className="text-3xl sm:text-5xl font-black neon-text-title tracking-tight">
            Slide Match
          </h1>
          <p className="text-xs sm:text-sm font-mono text-cyan-300 tracking-wider uppercase font-bold">
            Endless 30-Second Speed Rush
          </p>
          <p className="text-xs text-gray-300 max-w-xs sm:max-w-sm leading-relaxed">
            Slide colored blocks into matching target zones. Solve each puzzle in under <strong>30 seconds</strong> before time runs out!
          </p>
        </div>

        {/* Player Stats Card */}
        <div className="w-full bg-slate-900/80 backdrop-blur-md border border-cyan-500/30 rounded-3xl p-4 sm:p-5 shadow-xl mb-4 shrink-0">
          <div className="text-[10px] sm:text-xs font-mono font-bold text-gray-400 uppercase tracking-wider mb-3 text-center">
            Your Speed Run Records
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
            <div className="p-2.5 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex flex-col">
              <span className="text-[10px] text-gray-400 font-mono uppercase">High Score</span>
              <span className="text-base sm:text-lg font-black text-amber-400 font-mono">
                {stats.highScore.toLocaleString()}
              </span>
            </div>

            <div className="p-2.5 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex flex-col">
              <span className="text-[10px] text-gray-400 font-mono uppercase">Highest Stage</span>
              <span className="text-base sm:text-lg font-black text-cyan-300 font-mono">
                {stats.highestStage}
              </span>
            </div>

            <div className="p-2.5 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex flex-col">
              <span className="text-[10px] text-gray-400 font-mono uppercase">Total Runs</span>
              <span className="text-base sm:text-lg font-black text-purple-300 font-mono">
                {stats.totalRuns}
              </span>
            </div>

            <div className="p-2.5 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex flex-col">
              <span className="text-[10px] text-gray-400 font-mono uppercase">Puzzles Solved</span>
              <span className="text-base sm:text-lg font-black text-emerald-400 font-mono">
                {stats.totalPuzzlesSolved}
              </span>
            </div>
          </div>
        </div>

        {/* Start Action Button */}
        <div className="w-full max-w-sm pb-2 shrink-0">
          <button
            onClick={handleStartGame}
            disabled={loading}
            className={cn(
              'w-full py-4 rounded-2xl font-black text-sm sm:text-base uppercase tracking-wider transition-all shadow-[0_0_30px_rgba(6,182,212,0.4)] active:scale-98 cursor-pointer flex items-center justify-center gap-2 border border-cyan-300/60 text-white',
              'bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 hover:shadow-[0_0_40px_rgba(6,182,212,0.6)]'
            )}
          >
            <span className="text-lg">⚡</span>
            <span>Start Endless Run</span>
            <span className="text-lg">&rarr;</span>
          </button>
        </div>
      </div>

      {/* Instructions Modal */}
      <SlideMatchInstructionsModal
        isOpen={showInstructions}
        onClose={() => setShowInstructions(false)}
        onStartGame={() => {
          setShowInstructions(false);
          setIsPlaying(true);
        }}
        isPreGame={stats.totalRuns === 0}
      />
    </div>
  );
};
