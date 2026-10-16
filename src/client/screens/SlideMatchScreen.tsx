import { useState, useEffect, useCallback, useMemo } from 'react';
import { trpc } from '../trpc';
import { SlideMatchGameBoard } from '../components/SlideMatchGameBoard';
import { SlideMatchInstructionsModal } from '../components/SlideMatchInstructionsModal';
import { SlideMatchLeaderboardModal } from '../components/SlideMatchLeaderboardModal';
import { HexagonBlock } from '../components/HexagonBlock';
import { PuzzleShape } from '../components/PuzzleShape';
import { ShardIcon } from '../components/ShardIcon';
import { ThemeId, ThemeConfig, Theme, getThemeBgClass, getBaseThemeId } from '../../shared/themes';
import { SlideMatchEndlessStats, SlideMatchGameMode } from '../../shared/types';
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
  const [activeMode, setActiveMode] = useState<SlideMatchGameMode>('speed-rush');
  const [isPlaying, setIsPlaying] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  useEffect(() => {
    onGameStateChange?.(isPlaying);
  }, [isPlaying, onGameStateChange]);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const data = await trpc.slideMatch.getEndlessStats.query();
      if (data) {
        setStats(data);
        // If player already claimed their daily run, auto-switch to Free Play practice
        if (data.dailyRewardAvailable === false) {
          setActiveMode('free-play');
        }
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

  // Calculate live time remaining until 00:00 UTC daily reset
  const resetCountdown = useMemo(() => {
    const now = new Date();
    const nextMidnightUtc = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0)
    );
    const diffMs = Math.max(0, nextMidnightUtc.getTime() - now.getTime());
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  }, []);

  const baseThemeId = getBaseThemeId(activeTheme);
  const bgClass = getThemeBgClass(activeTheme, activeThemeStyle);
  const isSpeedRushLocked = stats.dailyRewardAvailable === false;

  if (isPlaying) {
    return (
      <SlideMatchGameBoard
        initialStage={1}
        mode={activeMode}
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
      className={`h-[100dvh] w-full ${bgClass} text-white flex flex-col items-center justify-between p-2.5 sm:p-4 md:p-6 transition-colors duration-500 overflow-hidden select-none font-sans`}
    >
      {/* Background Ambient Glow FX */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 bg-fuchsia-500/15 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-80 h-80 bg-cyan-500/15 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-xl flex flex-col items-center flex-1 min-h-0 relative z-10 justify-between">
        {/* Header Bar with Menu, Leaderboard & How to Play */}
        <div className="w-full flex justify-between items-center mb-1 sm:mb-2 pt-0.5 sm:pt-1 shrink-0">
          <button
            onClick={onReturnToMenu}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold theme-btn backdrop-blur-md transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <span>&larr;</span>
            <span>Main Menu</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowLeaderboard(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-400/40 shadow transition-all active:scale-95 cursor-pointer"
              title="Official Speed Rush Leaderboard"
            >
              <PuzzleShape shape="crown" className="w-3.5 h-3.5 text-amber-400" />
              <span>Leaderboard</span>
            </button>

            <button
              onClick={() => setShowInstructions(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900/80 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40 shadow transition-all active:scale-95 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4M12 8h.01" />
              </svg>
              <span className="hidden xs:inline">How to Play</span>
            </button>
          </div>
        </div>

        {/* Mode Selector Tab Switcher */}
        <div className="w-full max-w-xs flex p-1 rounded-2xl bg-slate-950/85 border border-white/10 shadow-inner my-1 shrink-0">
          <button
            onClick={() => setActiveMode('speed-rush')}
            className={cn(
              'flex-1 py-1.5 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer',
              activeMode === 'speed-rush'
                ? 'bg-gradient-to-r from-cyan-500/30 via-indigo-500/30 to-purple-500/30 text-white border border-cyan-400/50 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                : 'text-zinc-400 hover:text-white'
            )}
          >
            <span>Speed Rush</span>
            {isSpeedRushLocked ? (
              <svg className="w-3 h-3 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            ) : (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveMode('free-play')}
            className={cn(
              'flex-1 py-1.5 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer',
              activeMode === 'free-play'
                ? 'bg-gradient-to-r from-emerald-500/30 to-cyan-500/30 text-white border border-emerald-400/50 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                : 'text-zinc-400 hover:text-white'
            )}
          >
            <span>Free Play</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/40">
              Practice
            </span>
          </button>
        </div>

        {/* Hero Title Section with Signature Hexagon Emblem Cluster */}
        <div className="flex flex-col justify-center items-center my-1 sm:my-auto shrink-0 text-center space-y-1.5 sm:space-y-2">
          <div className="relative flex items-center justify-center p-1 sm:p-2">
            {/* Ambient Radial Energy Aura */}
            <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500/20 via-cyan-500/25 to-blue-500/20 rounded-full blur-2xl" />
            <div className="relative z-10 flex items-center justify-center gap-1.5 sm:gap-3">
              {/* Left Purple Piece */}
              <div className="w-9 h-9 sm:w-12 sm:h-12 flex items-center justify-center -rotate-12 transition-transform hover:scale-105 filter drop-shadow-[0_0_12px_rgba(217,70,239,0.5)]">
                <HexagonBlock blockType="purple-circle" colorId="purple" baseThemeId={baseThemeId} shape="circle" isCircular={true} />
              </div>
              {/* Center Cyan Piece (Hero Elevation) */}
              <div className="w-12 h-12 sm:w-15 sm:h-15 flex items-center justify-center scale-110 z-20 filter drop-shadow-[0_0_20px_rgba(6,182,212,0.8)] animate-pulse">
                <HexagonBlock blockType="blue-diamond" colorId="cyan" baseThemeId={baseThemeId} shape="diamond" isCircular={true} />
              </div>
              {/* Right Blue Piece */}
              <div className="w-9 h-9 sm:w-12 sm:h-12 flex items-center justify-center rotate-12 transition-transform hover:scale-105 filter drop-shadow-[0_0_12px_rgba(59,130,246,0.5)]">
                <HexagonBlock blockType="blue-diamond" colorId="blue" baseThemeId={baseThemeId} shape="diamond" isCircular={true} />
              </div>
            </div>
          </div>

          <div>
            <h1 className="text-2xl sm:text-4xl font-black neon-text-title tracking-tight drop-shadow-md">
              Slide Match
            </h1>
            <p className="text-[11px] sm:text-xs font-mono tracking-widest uppercase font-bold mt-0.5 text-fuchsia-400">
              {activeMode === 'speed-rush' ? 'Endless 30-Second Speed Rush' : 'Untimed Practice & Training'}
            </p>
          </div>
        </div>

        {/* Dynamic Mode Card */}
        {activeMode === 'speed-rush' ? (
          /* Speed Rush Player Stats Card */
          <div className="w-full bg-slate-950/70 backdrop-blur-xl border border-white/10 rounded-2xl sm:rounded-3xl p-2.5 sm:p-4 shadow-[0_0_35px_rgba(0,0,0,0.5)] mb-2 shrink-0">
            <div className="text-[9px] sm:text-xs font-mono font-bold text-zinc-400 uppercase tracking-widest mb-1.5 sm:mb-2 text-center">
              Your Speed Run Records
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2.5 text-center">
              <div className="p-1.5 sm:p-2.5 rounded-xl bg-slate-900/90 border border-amber-500/30 shadow-inner flex flex-col items-center transition-all hover:border-amber-400/60">
                <span className="text-[9px] sm:text-[10px] text-zinc-400 font-mono uppercase flex items-center gap-1">
                  <PuzzleShape shape="crown" className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-400" />
                  <span>High Score</span>
                </span>
                <span className="text-xs sm:text-base font-black text-amber-300 font-mono mt-0.5">
                  {stats.highScore.toLocaleString()}
                </span>
              </div>

              <div className="p-1.5 sm:p-2.5 rounded-xl bg-slate-900/90 border border-cyan-500/30 shadow-inner flex flex-col items-center transition-all hover:border-cyan-400/60">
                <span className="text-[9px] sm:text-[10px] text-zinc-400 font-mono uppercase flex items-center gap-1">
                  <PuzzleShape shape="pocket_watch" className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-cyan-400" />
                  <span>Deepest Stage</span>
                </span>
                <span className="text-xs sm:text-base font-black text-cyan-300 font-mono mt-0.5">
                  Stage {stats.highestStage}
                </span>
              </div>

              <div className="p-1.5 sm:p-2.5 rounded-xl bg-slate-900/90 border border-purple-500/30 shadow-inner flex flex-col items-center transition-all hover:border-purple-400/60">
                <span className="text-[9px] sm:text-[10px] text-zinc-400 font-mono uppercase flex items-center gap-1">
                  <PuzzleShape shape="diamond" className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-purple-400" />
                  <span>Total Runs</span>
                </span>
                <span className="text-xs sm:text-base font-black text-purple-300 font-mono mt-0.5">
                  {stats.totalRuns}
                </span>
              </div>

              <div className="p-1.5 sm:p-2.5 rounded-xl bg-slate-900/90 border border-emerald-500/30 shadow-inner flex flex-col items-center transition-all hover:border-emerald-400/60">
                <span className="text-[9px] sm:text-[10px] text-zinc-400 font-mono uppercase flex items-center gap-1">
                  <PuzzleShape shape="gem" className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-400" />
                  <span>Puzzles Solved</span>
                </span>
                <span className="text-xs sm:text-base font-black text-emerald-300 font-mono mt-0.5">
                  {stats.totalPuzzlesSolved}
                </span>
              </div>
            </div>

            {/* Daily Light Whisp Payout Status Banner */}
            <div className="mt-2 pt-1.5 border-t border-slate-800/80 flex items-center justify-between px-1">
              <div className="flex items-center gap-1 text-[10px] sm:text-[11px] font-mono">
                <ShardIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-cyan-300" />
                <span className="text-zinc-300 font-bold">Daily Attempt:</span>
              </div>
              {!isSpeedRushLocked ? (
                <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 shadow-[0_0_10px_rgba(16,185,129,0.3)] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Available Today (+15 Light Whisps)
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-mono font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 flex items-center gap-1">
                  <svg className="w-3 h-3 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <span>Completed • Resets in {resetCountdown}</span>
                </span>
              )}
            </div>
          </div>
        ) : (
          /* Free Play Practice Info Card */
          <div className="w-full bg-slate-950/70 backdrop-blur-xl border border-emerald-500/20 rounded-2xl sm:rounded-3xl p-3 sm:p-4 shadow-[0_0_35px_rgba(0,0,0,0.5)] mb-2 shrink-0 flex flex-col gap-1.5 sm:gap-2 text-center">
            <div className="flex items-center justify-center gap-2 text-xs font-mono font-bold text-emerald-300 uppercase tracking-widest">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Pressure-Free Training Ground</span>
            </div>

            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-md mx-auto">
              Take your time to analyze block sliding trajectories and practice pathfinding strategies. There is no clock, no game over, and unlimited undos.
            </p>

            <div className="flex items-center justify-center gap-2 pt-0.5 text-[10px] sm:text-[11px] font-mono text-zinc-400">
              <span className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-700">
                0 Light Whisps Collected
              </span>
              <span>•</span>
              <span className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-700">
                Leaderboard Excluded
              </span>
            </div>
          </div>
        )}

        {/* Start Action Button */}
        <div className="w-full max-w-sm pb-1 shrink-0 flex flex-col gap-1.5 sm:gap-2">
          {activeMode === 'speed-rush' ? (
            isSpeedRushLocked ? (
              <div className="flex flex-col gap-1.5 sm:gap-2 w-full">
                <button
                  disabled={true}
                  className="w-full py-2.5 sm:py-3.5 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider bg-slate-900/90 text-zinc-500 border border-zinc-800 cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <span>Daily Run Completed • Resets in {resetCountdown}</span>
                </button>
                <button
                  onClick={() => setActiveMode('free-play')}
                  className="w-full py-2.5 sm:py-3 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-400/50 transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                >
                  <span>Practice in Free Play</span>
                  <span>&rarr;</span>
                </button>
              </div>
            ) : (
              <button
                onClick={handleStartGame}
                disabled={loading}
                className={cn(
                  'w-full py-3 sm:py-3.5 rounded-2xl font-black text-sm sm:text-base uppercase tracking-wider transition-all shadow-[0_0_30px_rgba(99,102,241,0.4)] active:scale-98 cursor-pointer flex items-center justify-center gap-2 border border-cyan-300/50 text-white group',
                  'bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 hover:shadow-[0_0_40px_rgba(6,182,212,0.6)]'
                )}
              >
                <span>Start Speed Rush</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-400/25 border border-amber-400/50 text-amber-300 text-xs font-black tracking-normal shadow-sm group-hover:bg-amber-400/40 transition-colors">
                  <ShardIcon className="w-3 h-3 text-cyan-300" />
                  <span>+15</span>
                </span>
              </button>
            )
          ) : (
            <button
              onClick={handleStartGame}
              disabled={loading}
              className={cn(
                'w-full py-3 sm:py-3.5 rounded-2xl font-black text-sm sm:text-base uppercase tracking-wider transition-all shadow-[0_0_30px_rgba(16,185,129,0.3)] active:scale-98 cursor-pointer flex items-center justify-center gap-2 border border-emerald-400/50 text-white group',
                'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 hover:shadow-[0_0_40px_rgba(16,185,129,0.5)]'
              )}
            >
              <span>Start Free Play</span>
              <span className="text-base sm:text-lg group-hover:translate-x-1 transition-transform">&rarr;</span>
            </button>
          )}
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

      {/* Leaderboard Modal */}
      <SlideMatchLeaderboardModal
        isOpen={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
      />
    </div>
  );
};
