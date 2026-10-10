import { useState, useEffect, useCallback } from 'react';
import { trpc } from '../trpc';
import { SlideMatchGameBoard } from '../components/SlideMatchGameBoard';
import { SlideMatchInstructionsModal } from '../components/SlideMatchInstructionsModal';
import { HexagonBlock } from '../components/HexagonBlock';
import { PuzzleShape } from '../components/PuzzleShape';
import { ShardIcon } from '../components/ShardIcon';
import { ThemeId, ThemeConfig, Theme, getThemeBgClass, getBaseThemeId } from '../../shared/themes';
import { SlideMatchEndlessStats } from '../../shared/types';
import { trackClientEvent } from '../utils/analytics';
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
    trackClientEvent('screen_view_slidematch');
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

  const baseThemeId = getBaseThemeId(activeTheme);
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
      className={`h-[100dvh] w-full ${bgClass} text-white flex flex-col items-center justify-between p-3 sm:p-4 md:p-6 transition-colors duration-500 overflow-hidden select-none font-sans`}
    >
      {/* Background Ambient Glow FX */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 bg-fuchsia-500/15 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-80 h-80 bg-cyan-500/15 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-xl flex flex-col items-center flex-1 min-h-0 relative z-10">
        {/* Header Bar with Menu Button */}
        <div className="w-full flex justify-between items-center mb-2 pt-1 shrink-0">
          <button
            onClick={onReturnToMenu}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold theme-btn backdrop-blur-md transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <span>&larr;</span>
            <span>Main Menu</span>
          </button>

          <button
            onClick={() => setShowInstructions(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-900/80 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40 shadow transition-all active:scale-95 cursor-pointer"
          >
            <svg className="w-3.5 h-3.5 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" />
            </svg>
            <span>How to Play</span>
          </button>
        </div>

        {/* Hero Title Section with Signature Hexagon Emblem Cluster */}
        <div className="flex flex-col justify-center items-center my-auto shrink-0 text-center space-y-3">
          <div className="relative flex items-center justify-center p-3">
            {/* Ambient Radial Energy Aura */}
            <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500/20 via-cyan-500/25 to-blue-500/20 rounded-full blur-2xl" />
            <div className="relative z-10 flex items-center justify-center gap-2 sm:gap-3">
              {/* Left Purple Piece */}
              <div className="w-11 h-11 sm:w-13 sm:h-13 flex items-center justify-center -rotate-12 transition-transform hover:scale-105 filter drop-shadow-[0_0_12px_rgba(217,70,239,0.5)]">
                <HexagonBlock blockType="purple-circle" colorId="purple" baseThemeId={baseThemeId} shape="circle" isCircular={true} />
              </div>
              {/* Center Cyan Piece (Hero Elevation) */}
              <div className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center scale-110 z-20 filter drop-shadow-[0_0_20px_rgba(6,182,212,0.8)] animate-pulse">
                <HexagonBlock blockType="blue-diamond" colorId="cyan" baseThemeId={baseThemeId} shape="diamond" isCircular={true} />
              </div>
              {/* Right Blue Piece */}
              <div className="w-11 h-11 sm:w-13 sm:h-13 flex items-center justify-center rotate-12 transition-transform hover:scale-105 filter drop-shadow-[0_0_12px_rgba(59,130,246,0.5)]">
                <HexagonBlock blockType="blue-diamond" colorId="blue" baseThemeId={baseThemeId} shape="diamond" isCircular={true} />
              </div>
            </div>
          </div>

          <div>
            <h1 className="text-3xl sm:text-5xl font-black neon-text-title tracking-tight drop-shadow-md">
              Slide Match
            </h1>
            <p className="text-xs sm:text-sm font-mono text-fuchsia-400 tracking-widest uppercase font-bold mt-0.5">
              Endless 30-Second Speed Rush
            </p>
          </div>

          {/* Quick Feature Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-0.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 border border-cyan-500/30 text-[10px] sm:text-xs font-mono font-bold text-cyan-300 shadow-sm">
              <PuzzleShape shape="pocket_watch" className="w-3 h-3 text-cyan-400" />
              <span>30s Clock</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 border border-fuchsia-500/30 text-[10px] sm:text-xs font-mono font-bold text-fuchsia-300 shadow-sm">
              <PuzzleShape shape="diamond" className="w-3 h-3 text-fuchsia-400" />
              <span>Endless Stages</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 border border-amber-500/30 text-[10px] sm:text-xs font-mono font-bold text-amber-300 shadow-sm">
              <ShardIcon className="w-3 h-3 text-cyan-300" />
              <span>Daily Shards</span>
            </span>
          </div>
        </div>

        {/* Player Stats Card (Glassmorphic Dashboard) */}
        <div className="w-full bg-slate-950/70 backdrop-blur-xl border border-white/10 rounded-3xl p-3.5 sm:p-5 shadow-[0_0_35px_rgba(0,0,0,0.5)] mb-3 shrink-0">
          <div className="text-[10px] sm:text-xs font-mono font-bold text-zinc-400 uppercase tracking-widest mb-2.5 text-center">
            Your Speed Run Records
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
            <div className="p-2.5 rounded-2xl bg-slate-900/90 border border-amber-500/30 shadow-inner flex flex-col items-center transition-all hover:border-amber-400/60">
              <span className="text-[10px] text-zinc-400 font-mono uppercase flex items-center gap-1">
                <PuzzleShape shape="crown" className="w-3 h-3 text-amber-400" />
                <span>High Score</span>
              </span>
              <span className="text-sm sm:text-base font-black text-amber-300 font-mono mt-0.5">
                {stats.highScore.toLocaleString()}
              </span>
            </div>

            <div className="p-2.5 rounded-2xl bg-slate-900/90 border border-cyan-500/30 shadow-inner flex flex-col items-center transition-all hover:border-cyan-400/60">
              <span className="text-[10px] text-zinc-400 font-mono uppercase flex items-center gap-1">
                <PuzzleShape shape="pocket_watch" className="w-3 h-3 text-cyan-400" />
                <span>Deepest Stage</span>
              </span>
              <span className="text-sm sm:text-base font-black text-cyan-300 font-mono mt-0.5">
                Stage {stats.highestStage}
              </span>
            </div>

            <div className="p-2.5 rounded-2xl bg-slate-900/90 border border-purple-500/30 shadow-inner flex flex-col items-center transition-all hover:border-purple-400/60">
              <span className="text-[10px] text-zinc-400 font-mono uppercase flex items-center gap-1">
                <PuzzleShape shape="diamond" className="w-3 h-3 text-purple-400" />
                <span>Total Runs</span>
              </span>
              <span className="text-sm sm:text-base font-black text-purple-300 font-mono mt-0.5">
                {stats.totalRuns}
              </span>
            </div>

            <div className="p-2.5 rounded-2xl bg-slate-900/90 border border-emerald-500/30 shadow-inner flex flex-col items-center transition-all hover:border-emerald-400/60">
              <span className="text-[10px] text-zinc-400 font-mono uppercase flex items-center gap-1">
                <PuzzleShape shape="gem" className="w-3 h-3 text-emerald-400" />
                <span>Puzzles Solved</span>
              </span>
              <span className="text-sm sm:text-base font-black text-emerald-300 font-mono mt-0.5">
                {stats.totalPuzzlesSolved}
              </span>
            </div>
          </div>

          {/* Daily Shard Payout Status Banner */}
          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5 text-[11px] font-mono">
              <ShardIcon className="w-3.5 h-3.5 text-cyan-300" />
              <span className="text-zinc-300 font-bold">Daily Shard Payout:</span>
            </div>
            {stats.dailyRewardAvailable !== false ? (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 shadow-[0_0_10px_rgba(16,185,129,0.3)] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Available Today (+15 Shards)
              </span>
            ) : (
              <span
                className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold text-zinc-400 bg-slate-900/90 border border-zinc-700/80"
                title="Resets daily at 00:00 UTC with the Daily Puzzle"
              >
                Claimed (Resets 00:00 UTC)
              </span>
            )}
          </div>
        </div>

        {/* Start Action Button */}
        <div className="w-full max-w-sm pb-1 shrink-0">
          <button
            onClick={handleStartGame}
            disabled={loading}
            className={cn(
              'w-full py-3.5 sm:py-4 rounded-2xl font-black text-sm sm:text-base uppercase tracking-wider transition-all shadow-[0_0_30px_rgba(99,102,241,0.4)] active:scale-98 cursor-pointer flex items-center justify-center gap-2.5 border border-cyan-300/50 text-white group',
              'bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 hover:shadow-[0_0_40px_rgba(6,182,212,0.6)]'
            )}
          >
            <span>Start Endless Run</span>
            {stats.dailyRewardAvailable !== false ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-400/25 border border-amber-400/50 text-amber-300 text-xs font-black tracking-normal shadow-sm group-hover:bg-amber-400/40 transition-colors">
                <ShardIcon className="w-3 h-3 text-cyan-300" />
                <span>+15</span>
              </span>
            ) : (
              <span className="text-base sm:text-lg group-hover:translate-x-1 transition-transform">&rarr;</span>
            )}
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
