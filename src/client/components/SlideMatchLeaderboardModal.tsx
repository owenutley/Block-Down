import { useEffect, useState, useCallback } from 'react';
import { trpc } from '../trpc';
import { SlideMatchLeaderboardData, SlideMatchLeaderboardEntry } from '../../shared/types';
import { PuzzleShape } from './PuzzleShape';
import { SplashLoader } from './SplashLoader';

export type SlideMatchLeaderboardModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const formatDate = (ts: number): string => {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

export const SlideMatchLeaderboardModal = ({
  isOpen,
  onClose,
}: SlideMatchLeaderboardModalProps) => {
  const [data, setData] = useState<SlideMatchLeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = useCallback(async () => {
    try {
      setLoading(true);
      const res = await trpc.slideMatch.getLeaderboard.query();
      if (res) {
        setData(res);
      }
    } catch (err) {
      console.error('Failed to load Slide Match leaderboard:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      void fetchLeaderboard();
    }
  }, [isOpen, fetchLeaderboard]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isOpen && e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const entries = data?.entries || [];
  const topThree = entries.slice(0, 3);
  const remainingEntries = entries.slice(3);
  const userEntry = data?.userEntry;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn select-none">
      <div className="bg-slate-950/95 border border-cyan-500/40 rounded-3xl p-4 sm:p-6 max-w-lg w-full text-white shadow-[0_0_50px_rgba(6,182,212,0.3)] flex flex-col max-h-[92vh] overflow-hidden relative animate-scaleUp">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
              <PuzzleShape shape="crown" className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black neon-text-title tracking-tight text-white flex items-center gap-2">
                <span>Speed Rush Leaderboard</span>
              </h2>
              <p className="text-[10px] sm:text-[11px] text-zinc-400 font-mono uppercase tracking-wider">
                Official Speed Rush Records • Practice excluded
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center text-base font-bold transition-all cursor-pointer"
            title="Close"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Global Total Attempt Counter Pill */}
        {data && data.totalAttempts > 0 && (
          <div className="flex items-center justify-between px-2 pt-2 text-[10px] sm:text-xs font-mono text-zinc-400 shrink-0">
            <span className="flex items-center gap-1.5 text-cyan-300">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>All-Time Rankings</span>
            </span>
            <span>{data.totalAttempts.toLocaleString()} Speed Runs Attempted</span>
          </div>
        )}

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto min-h-0 my-3 pr-1 space-y-3 custom-scrollbar">
          {loading ? (
            <div className="py-8 flex justify-center">
              <SplashLoader
                compact
                message="SYNCING SPEED RECORDS..."
              />
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center gap-3 bg-slate-900/40 rounded-2xl border border-white/5">
              <div className="w-12 h-12 rounded-2xl bg-slate-800/80 flex items-center justify-center text-zinc-500">
                <PuzzleShape shape="pocket_watch" className="w-6 h-6 text-zinc-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">No Official Records Yet</h3>
                <p className="text-xs text-zinc-400 mt-1 max-w-xs">
                  Complete your daily Speed Rush run to claim your spot on the leaderboard!
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Top 3 Podium Cards */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                {/* 2nd Place */}
                {topThree[1] ? (
                  <div className="flex flex-col items-center p-2.5 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-300/40 shadow-[0_0_15px_rgba(203,213,225,0.15)] text-center relative mt-3">
                    <span className="w-6 h-6 rounded-full bg-slate-300/20 border border-slate-300/60 text-slate-200 text-[10px] font-black flex items-center justify-center absolute -top-3 shadow-sm font-mono">
                      2
                    </span>
                    <span className="text-[11px] font-bold text-slate-200 truncate w-full mt-1.5" title={topThree[1].username}>
                      {topThree[1].username}
                    </span>
                    <span className="text-xs sm:text-sm font-black text-slate-100 font-mono mt-0.5">
                      {topThree[1].score.toLocaleString()}
                    </span>
                    <span className="text-[9px] font-mono text-cyan-300/90 bg-cyan-950/60 px-1.5 py-0.5 rounded-md mt-1 border border-cyan-500/30">
                      Stage {topThree[1].highestStage}
                    </span>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/10 opacity-30 mt-3" />
                )}

                {/* 1st Place (Elevated Hero) */}
                {topThree[0] && (
                  <div className="flex flex-col items-center p-3 rounded-2xl bg-gradient-to-b from-amber-950/60 via-slate-900/90 to-slate-950/90 border-2 border-amber-400/80 shadow-[0_0_25px_rgba(251,191,36,0.25)] text-center relative -mt-1 scale-102">
                    <div className="w-7 h-7 rounded-full bg-amber-400/30 border border-amber-300 text-amber-300 text-xs font-black flex items-center justify-center absolute -top-3.5 shadow-md">
                      <PuzzleShape shape="crown" className="w-3.5 h-3.5 text-amber-300" />
                    </div>
                    <span className="text-xs font-black text-amber-300 truncate w-full mt-2" title={topThree[0].username}>
                      {topThree[0].username}
                    </span>
                    <span className="text-sm sm:text-base font-black text-amber-200 font-mono mt-0.5">
                      {topThree[0].score.toLocaleString()}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded-md mt-1 border border-amber-500/40">
                      Stage {topThree[0].highestStage}
                    </span>
                  </div>
                )}

                {/* 3rd Place */}
                {topThree[2] ? (
                  <div className="flex flex-col items-center p-2.5 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-amber-700/50 shadow-[0_0_15px_rgba(180,83,9,0.15)] text-center relative mt-3">
                    <span className="w-6 h-6 rounded-full bg-amber-700/20 border border-amber-700/60 text-amber-400 text-[10px] font-black flex items-center justify-center absolute -top-3 shadow-sm font-mono">
                      3
                    </span>
                    <span className="text-[11px] font-bold text-amber-200 truncate w-full mt-1.5" title={topThree[2].username}>
                      {topThree[2].username}
                    </span>
                    <span className="text-xs sm:text-sm font-black text-amber-300/90 font-mono mt-0.5">
                      {topThree[2].score.toLocaleString()}
                    </span>
                    <span className="text-[9px] font-mono text-cyan-300/90 bg-cyan-950/60 px-1.5 py-0.5 rounded-md mt-1 border border-cyan-500/30">
                      Stage {topThree[2].highestStage}
                    </span>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/10 opacity-30 mt-3" />
                )}
              </div>

              {/* Ranks 4+ Table List */}
              {remainingEntries.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  {remainingEntries.map((entry: SlideMatchLeaderboardEntry) => (
                    <div
                      key={`${entry.username}-${entry.rank}`}
                      className="flex items-center justify-between p-2 sm:p-2.5 rounded-xl bg-slate-900/70 hover:bg-slate-800/80 border border-white/5 transition-colors text-xs font-mono"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-5 text-center font-bold text-zinc-500 text-[11px]">
                          #{entry.rank}
                        </span>
                        <span className="font-bold text-zinc-200 truncate max-w-[130px] sm:max-w-[180px]">
                          {entry.username}
                        </span>
                        <span className="text-[10px] text-cyan-400/80 bg-cyan-950/50 px-1.5 py-0.2 rounded border border-cyan-500/20">
                          Stg {entry.highestStage}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="font-black text-amber-300">
                          {entry.score.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-zinc-500 w-12 text-right">
                          {formatDate(entry.timestamp)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* User Standing Footer Pin */}
        <div className="shrink-0 pt-2 border-t border-slate-800">
          {userEntry ? (
            <div className="p-2.5 rounded-2xl bg-cyan-950/50 border border-cyan-500/40 flex items-center justify-between shadow-inner">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-lg bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 font-mono font-black text-xs">
                  #{userEntry.rank}
                </span>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white leading-tight">Your Personal Best</span>
                  <span className="text-[10px] font-mono text-zinc-400">Deepest: Stage {userEntry.highestStage}</span>
                </div>
              </div>
              <span className="text-sm font-black text-amber-300 font-mono">
                {userEntry.score.toLocaleString()} pts
              </span>
            </div>
          ) : (
            <div className="p-2 rounded-xl bg-slate-900/70 border border-white/5 text-center text-[11px] font-mono text-zinc-400">
              <span>Play today&apos;s Speed Rush attempt to secure your all-time rank!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
