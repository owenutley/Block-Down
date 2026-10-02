import { useState } from 'react';
import { trpc } from '../trpc';
import { WeeklyWinnerAward } from '../../shared/types';
import { showToast } from '@devvit/web/client';
import { playWinMelody } from '../utils/audio';

export const WeeklyWinnerModal = (props: {
  award: WeeklyWinnerAward;
  onClose: () => void;
  onRewardClaimed?: (newBalance: number) => void;
}) => {
  const { award, onClose, onRewardClaimed } = props;
  const [claiming, setClaiming] = useState(false);

  const handleClaim = async () => {
    try {
      setClaiming(true);
      const res = await trpc.weekly.claimReward.mutate();
      playWinMelody();
      showToast({
        text: `🎉 Claimed ${award.shardReward} Neon Shards!`,
        appearance: 'success',
      });
      if (onRewardClaimed) {
        onRewardClaimed(res.newBalance);
      }
      onClose();
    } catch (err) {
      console.error('Failed to claim weekly reward:', err);
      showToast({ text: 'Failed to claim reward', appearance: 'neutral' });
    } finally {
      setClaiming(false);
    }
  };

  const getRankBadge = () => {
    if (award.rank === 1) return { icon: '🥇', title: '1st Place Champion', color: 'from-amber-400 to-yellow-600', text: 'text-amber-300' };
    if (award.rank === 2) return { icon: '🥈', title: '2nd Place Finalist', color: 'from-slate-300 to-slate-500', text: 'text-slate-200' };
    return { icon: '🥉', title: '3rd Place Finalist', color: 'from-amber-700 to-amber-900', text: 'text-amber-400' };
  };

  const rankInfo = getRankBadge();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn select-none font-sans">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 p-6 sm:p-8 border border-amber-500/40 shadow-[0_0_50px_rgba(245,158,11,0.25)] text-center space-y-6">
        {/* Glow Header */}
        <div className="relative flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500/20 to-yellow-400/30 flex items-center justify-center text-4xl shadow-inner border border-amber-500/40 animate-bounce">
            {rankInfo.icon}
          </div>
          <span className="mt-3 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-950/70 border border-amber-500/50 text-amber-300">
            Weekly Creator Challenge
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
            {rankInfo.title}
          </h2>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Your custom puzzle stood as one of the hardest puzzles of the week!
          </p>
        </div>

        {/* Puzzle Card Summary */}
        <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-left space-y-2">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-[10px] text-cyan-400 uppercase font-mono font-bold">Winning Puzzle</div>
              <div className="text-base sm:text-lg font-black text-white truncate max-w-[220px]">
                {award.puzzleName}
              </div>
            </div>
            <div className="px-2.5 py-1 rounded-lg bg-indigo-950/70 border border-indigo-500/40 text-right shrink-0">
              <div className="text-[9px] text-indigo-300 uppercase font-mono font-bold">Difficulty</div>
              <div className="text-xs font-black text-indigo-200 font-mono">
                {award.difficultyScore} / 100
              </div>
            </div>
          </div>
          <div className="text-[11px] text-slate-400 font-mono flex items-center justify-between pt-2 border-t border-slate-700/60">
            <span>Contest: {award.weekId}</span>
            <span>Date: {award.dateAwarded}</span>
          </div>
        </div>

        {/* Prize Box */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/50 to-indigo-950/50 border border-cyan-500/40 flex items-center justify-between">
          <div className="text-left">
            <div className="text-[10px] text-cyan-300 uppercase font-mono font-bold">Podium Prize</div>
            <div className="text-xl font-black text-white">+{award.shardReward} Neon Shards</div>
          </div>
          <div className="text-3xl">💎</div>
        </div>

        {/* Action Button */}
        <button
          onClick={() => void handleClaim()}
          disabled={claiming}
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-98 text-slate-950 font-black text-sm tracking-wide uppercase transition-all shadow-[0_0_20px_rgba(245,158,11,0.4)] cursor-pointer disabled:opacity-50"
        >
          {claiming ? 'Claiming Shards...' : `🎉 Claim +${award.shardReward} Shards`}
        </button>
      </div>
    </div>
  );
};
