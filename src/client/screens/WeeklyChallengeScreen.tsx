import { useState, useEffect } from 'react';
import { trpc } from '../trpc';
import { WeeklyChallengeData, WeeklyLeaderboardEntry } from '../../shared/types';
import { cn } from '../utils';
import { trackClientEvent } from '../utils/analytics';

export const WeeklyChallengeScreen = (props: {
  onReturnToMenu: () => void;
  onPlayPuzzle: (puzzleId: string) => void;
  onOpenPuzzleMaker: () => void;
  currency: number;
}) => {
  const { onReturnToMenu, onPlayPuzzle, onOpenPuzzleMaker, currency } = props;
  const [data, setData] = useState<WeeklyChallengeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'rules'>('leaderboard');
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await trpc.weekly.getCurrentChallenge.query();
      setData(res);
    } catch (err) {
      console.error('Failed to load weekly challenge:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    trackClientEvent('screen_view_campaign'); // Track screen view
    void fetchData();
  }, []);

  // Real-time countdown timer
  useEffect(() => {
    if (!data) return;

    const targetTime = data.isCreationOpen ? data.creationDeadline : data.endTime;

    const updateTimer = () => {
      const now = Date.now();
      const diff = Math.max(0, targetTime - now);

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [data]);

  return (
    <div className="flex flex-col h-full min-h-0 w-full bg-slate-950 text-white select-none overflow-hidden font-sans">
      {/* Header Bar */}
      <header className="sticky top-0 z-20 flex items-center justify-between px-2.5 py-2 sm:px-4 sm:py-2.5 bg-slate-900/90 backdrop-blur border-b border-slate-800 shadow-md shrink-0">
        <button
          onClick={onReturnToMenu}
          className="px-2.5 py-1 sm:px-3 sm:py-1 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-semibold text-xs sm:text-sm transition-all border border-slate-700 shrink-0 cursor-pointer"
        >
          &larr; Menu
        </button>
        <h1 className="text-xs sm:text-base md:text-lg font-black tracking-tight sm:tracking-wider text-amber-400 uppercase text-center flex-1 mx-1 sm:mx-2 truncate flex items-center justify-center gap-1 sm:gap-1.5">
          <span>👑</span>
          <span className="hidden sm:inline truncate">Weekly Creator Challenge</span>
          <span className="sm:hidden truncate">Weekly Challenge</span>
        </h1>
        <div className="px-2.5 py-1 sm:px-3 sm:py-1 rounded-full bg-slate-800/80 border border-slate-700 flex items-center gap-1 sm:gap-1.5 shrink-0 text-xs sm:text-sm font-mono font-bold text-cyan-300">
          <span>💎</span>
          <span>{currency.toLocaleString()}</span>
        </div>
      </header>

      {/* Scrollable Container */}
      <main className="flex-1 w-full overflow-y-auto overscroll-contain p-3 sm:p-5">
        <div className="max-w-4xl w-full mx-auto space-y-4 pb-12">
          {/* Phase & Countdown Banner */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 p-3.5 sm:p-5 border border-indigo-500/30 shadow-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={cn(
                      'px-2 py-0.5 sm:px-2.5 rounded-full text-[9px] sm:text-xs font-black uppercase font-mono tracking-wider border',
                      data?.isCreationOpen
                        ? 'bg-amber-950/80 text-amber-300 border-amber-500/50'
                        : 'bg-cyan-950/80 text-cyan-300 border-cyan-500/50'
                    )}
                  >
                    {data?.isCreationOpen ? '🔨 Phase 1: Creation' : '⚔️ Phase 2: Solving Battle'}
                  </span>
                  <span className="text-[11px] sm:text-xs text-slate-400 font-mono">
                    {data?.weekId || 'Active Week'}
                  </span>
                </div>
                <h2 className="text-sm sm:text-lg md:text-xl font-black text-white mt-1 leading-snug">
                  {data?.isCreationOpen
                    ? 'Publish Your Level to Contest'
                    : 'Play & Solve to Lower Competitor Difficulty'}
                </h2>
                <p className="text-[11px] sm:text-xs text-slate-300 mt-0.5 max-w-xl leading-relaxed">
                  {data?.isCreationOpen
                    ? 'First puzzle published by Tuesday 7:00 PM MST qualifies. Build the hardest puzzle to win 500 Shards!'
                    : 'Submissions locked! Play and solve community puzzles to lower their difficulty before Saturday 7:00 PM MST.'}
                </p>
              </div>

              {/* Countdown Clock */}
              <div className="px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-slate-950/80 border border-slate-700/80 text-center shrink-0 w-full sm:w-auto sm:min-w-[150px]">
                <div className="text-[8px] sm:text-[9px] text-slate-400 uppercase font-mono font-bold tracking-wider">
                  {data?.isCreationOpen ? 'Creation Cutoff In' : 'Finalizes Saturday 7PM MST In'}
                </div>
                <div className="text-sm sm:text-lg font-black font-mono text-amber-300">
                  {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
                </div>
              </div>
            </div>

            {/* Creation Shortcut if Open */}
            {data?.isCreationOpen && (
              <div className="pt-2 border-t border-slate-800/80 flex justify-end">
                <button
                  onClick={onOpenPuzzleMaker}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow cursor-pointer active:scale-95 text-center"
                >
                  + Design & Publish Puzzle
                </button>
              </div>
            )}
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 border-b border-slate-800 pb-2">
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={cn(
                'px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-1.5',
                activeTab === 'leaderboard'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              )}
            >
              <span>🏆</span>
              <span className="hidden xs:inline">Leaderboard</span>
              <span className="xs:hidden">Board</span> ({data?.totalEntries || 0})
            </button>
            <button
              onClick={() => setActiveTab('rules')}
              className={cn(
                'px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-1.5',
                activeTab === 'rules'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              )}
            >
              <span>📘</span>
              <span className="hidden sm:inline">Challenge Rules & Shard Rewards</span>
              <span className="sm:hidden">Rules & Rewards</span>
            </button>
          </div>

          {/* Tab Contents */}
          {loading ? (
            <div className="py-16 text-center text-slate-400 font-mono animate-pulse">
              Loading weekly contest data...
            </div>
          ) : activeTab === 'leaderboard' ? (
            /* Leaderboard Tab */
            <div className="space-y-3">
              {data?.leaderboard.length === 0 ? (
                <div className="p-10 rounded-2xl border-2 border-dashed border-slate-800 text-center text-slate-400 space-y-3">
                  <div className="text-3xl">🎨</div>
                  <div className="text-sm font-bold text-white">No qualifying puzzles submitted yet this week!</div>
                  <p className="text-xs max-w-sm mx-auto">
                    Be the first to publish a custom 9x9 puzzle challenge in the Puzzle Maker during the creation window.
                  </p>
                  {data?.isCreationOpen && (
                    <button
                      onClick={onOpenPuzzleMaker}
                      className="mt-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase cursor-pointer"
                    >
                      Open Puzzle Maker
                    </button>
                  )}
                </div>
              ) : (
                data?.leaderboard.map((entry: WeeklyLeaderboardEntry) => {
                  const isFirst = entry.rank === 1;
                  const isSecond = entry.rank === 2;
                  const isThird = entry.rank === 3;

                  return (
                    <div
                      key={entry.puzzleId}
                      className={cn(
                        'p-3.5 sm:p-4 rounded-2xl border transition-all space-y-3 relative overflow-hidden',
                        isFirst
                          ? 'bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.15)]'
                          : isSecond
                          ? 'bg-gradient-to-r from-slate-900 via-slate-900 to-slate-900 border-slate-600/60 shadow'
                          : isThird
                          ? 'bg-gradient-to-r from-amber-950/20 via-slate-900 to-slate-900 border-amber-800/40 shadow'
                          : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                      )}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                          {/* Rank Badge */}
                          <div
                            className={cn(
                              'w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center font-black font-mono text-xs sm:text-sm shrink-0 border',
                              isFirst
                                ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-[0_0_10px_rgba(251,191,36,0.6)]'
                                : isSecond
                                ? 'bg-slate-300 text-slate-950 border-slate-200'
                                : isThird
                                ? 'bg-amber-700 text-white border-amber-600'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            )}
                          >
                            #{entry.rank}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                              <h3 className="text-xs sm:text-base font-extrabold text-white truncate max-w-[160px] xs:max-w-[200px] sm:max-w-none">
                                {entry.puzzleName}
                              </h3>
                              {entry.potentialReward > 0 && (
                                <span className="px-1.5 py-0.5 sm:px-2 rounded-full text-[9px] sm:text-[10px] font-black uppercase font-mono bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 shrink-0">
                                  💎 {entry.potentialReward} Shards
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] sm:text-xs text-slate-400 font-mono">
                              Created by <span className="text-cyan-400 font-bold">u/{entry.author}</span>
                            </div>
                          </div>
                        </div>

                        {/* Difficulty Score Gauge & Action */}
                        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/60">
                          <div className="text-left sm:text-right">
                            <div className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-mono font-bold">
                              Difficulty Rating
                            </div>
                            <div className="text-sm sm:text-lg font-black font-mono text-amber-400">
                              {entry.difficultyScore.toFixed(1)}{' '}
                              <span className="text-[9px] sm:text-[10px] text-slate-500 font-normal">/ 100</span>
                            </div>
                          </div>

                          <button
                            onClick={() => onPlayPuzzle(entry.puzzleId)}
                            className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-extrabold text-xs uppercase tracking-wider transition-all shadow cursor-pointer flex items-center gap-1.5"
                          >
                            <span>⚔️</span> Play Level
                          </button>
                        </div>
                      </div>

                      {/* Stats Metrics Row */}
                      <div className="grid grid-cols-3 gap-1.5 sm:gap-2 pt-2 border-t border-slate-800/80 text-[10px] sm:text-[11px] font-mono">
                        <div className="text-slate-400 truncate">
                          Solve Rate: <span className="text-white font-bold">{entry.solveRate}%</span>{' '}
                          <span className="text-slate-500">({entry.solves}/{entry.attempts})</span>
                        </div>
                        <div className="text-slate-400 text-center truncate">
                          Creator Par: <span className="text-white font-bold">{entry.par} pushes</span>
                        </div>
                        <div className="text-slate-400 text-right truncate">
                          Blocks: <span className="text-white font-bold">{entry.blocksCount}</span>
                          {entry.portalsCount > 0 && <span> • Portals: {entry.portalsCount}</span>}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            /* Rules & Guide Tab */
            <div className="space-y-4 text-left">
              {/* Rewards Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                <h3 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
                  <span>🏆</span> Weekly Shard Rewards
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Every week on **Saturday at 7:00 PM MST (02:00 UTC Sunday)**, the leaderboard is finalized and Neon Shards are awarded to the creators of the 3 hardest community puzzles:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-3.5 sm:p-4 rounded-xl bg-amber-950/40 border border-amber-500/40 text-center space-y-1">
                    <div className="text-2xl">🥇</div>
                    <div className="text-xs font-bold text-amber-300 uppercase font-mono">1st Place</div>
                    <div className="text-base sm:text-lg font-black text-white">500 Shards</div>
                    <div className="text-[10px] text-slate-400">Gold Creator Trophy</div>
                  </div>

                  <div className="p-3.5 sm:p-4 rounded-xl bg-slate-800/60 border border-slate-600/40 text-center space-y-1">
                    <div className="text-2xl">🥈</div>
                    <div className="text-xs font-bold text-slate-300 uppercase font-mono">2nd Place</div>
                    <div className="text-base sm:text-lg font-black text-white">250 Shards</div>
                    <div className="text-[10px] text-slate-400">Silver Creator Trophy</div>
                  </div>

                  <div className="p-3.5 sm:p-4 rounded-xl bg-amber-950/20 border border-amber-800/40 text-center space-y-1">
                    <div className="text-2xl">🥉</div>
                    <div className="text-xs font-bold text-amber-400 uppercase font-mono">3rd Place</div>
                    <div className="text-base sm:text-lg font-black text-white">100 Shards</div>
                    <div className="text-[10px] text-slate-400">Bronze Creator Trophy</div>
                  </div>
                </div>
              </div>

              {/* Two-Phase Timeline */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                <h3 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
                  <span>⏱️</span> Weekly Cycle & Cutoff Rules
                </h3>
                <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
                  <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
                    <span className="font-bold text-amber-400 font-mono block">
                      🔨 1. Creation Window (Saturday 7:00 PM MST &rarr; Tuesday 7:00 PM MST)
                    </span>
                    <span>
                      Your first custom puzzle published in the Puzzle Maker during these 3 days automatically qualifies. Levels created after Tuesday 7:00 PM MST publish as standard community levels and do not enter the active week's contest.
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
                    <span className="font-bold text-cyan-400 font-mono block">
                      ⚔️ 2. Solving Battle Phase (Tuesday 7:00 PM MST &rarr; Saturday 7:00 PM MST)
                    </span>
                    <span>
                      Contest entries are locked for 4 days. The community plays, solves, and tests all entered levels. Every time a player solves a level, its difficulty rating drops!
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
                    <span className="font-bold text-emerald-400 font-mono block">
                      🏅 3. Minimum 1 Play to Qualify
                    </span>
                    <span>
                      Puzzles must have at least 1 attempt from the community to be eligible for podium standing and shard rewards.
                    </span>
                  </div>
                </div>
              </div>

              {/* Dynamic Difficulty Explanation */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
                <h3 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
                  <span>🧠</span> How Dynamic Difficulty Works
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Difficulty is computed dynamically based on the **Failure Rate**, **Average Pushes Required**, **Solve Duration**, and **Par Complexity**.
                </p>
                <p className="text-xs text-slate-300 leading-relaxed">
                  💡 **Pro Tip**: To drop a rival creator's difficulty score and bump your own level higher up the leaderboard, play their puzzle and solve it in as few pushes as possible!
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
