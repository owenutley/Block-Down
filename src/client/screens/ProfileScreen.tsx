import { useState, useEffect } from 'react';
import { trpc } from '../trpc';
import { ThemeId, Theme } from '../../shared/themes';

type ProfileStatsData = {
  username: string;
  currentStreak: number;
  maxStreak: number;
  freezesUsedIn30Days: number;
  availableFreezes: number;
  distinctStats: {
    totalPuzzlesSolved: number;
    totalTargetBlocksCompleted: number;
    totalBlockPushes: number;
    totalPieceMoves: number;
    totalStarsEarned: number;
  };
  puzzlesCreated: number;
  podiums: {
    firstPlace: number;
    secondPlace: number;
    thirdPlace: number;
  };
  currency: number;
  streakHistory: Array<{
    date: string;
    status: 'solved' | 'frozen' | 'missed';
  }>;
};

export const ProfileScreen = (props: {
  onReturnToMenu: () => void;
  activeTheme?: ThemeId;
  activeThemeStyle?: Theme | undefined;
}) => {
  const { onReturnToMenu } = props;
  const [data, setData] = useState<ProfileStatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await trpc.profile.getStats.query();
        setData(res);
      } catch (err) {
        console.error('Failed to load profile stats:', err);
      } finally {
        setLoading(false);
      }
    };
    void fetchProfile();
  }, []);

  return (
    <div className="flex flex-col min-h-screen w-full bg-slate-950 text-white select-none overflow-y-auto">
      {/* Sticky Header Bar */}
      <div className="sticky top-0 z-20 flex items-center justify-between px-3 py-2 sm:px-4 sm:py-2.5 bg-slate-900/90 backdrop-blur border-b border-slate-800 shadow-md">
        <button
          onClick={onReturnToMenu}
          className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-semibold text-xs sm:text-sm transition-all border border-slate-700 shrink-0"
        >
          &larr; Menu
        </button>
        <h1 className="text-base sm:text-lg font-black tracking-wider text-cyan-400 uppercase text-center flex-1 mx-2 truncate">
          Player Profile
        </h1>
        <div className="w-16 shrink-0" /> {/* Symmetric spacer */}
      </div>

      <div className="flex-1 max-w-3xl w-full mx-auto p-2.5 sm:p-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <div className="w-7 h-7 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs sm:text-sm font-medium">Loading player statistics...</p>
          </div>
        ) : !data ? (
          <div className="text-center py-10 text-slate-400">
            <p className="text-sm">Unable to load user profile.</p>
          </div>
        ) : (
          /* Single Unified Profile Card with Compact Spacing */
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800/95 to-slate-900 p-3 sm:p-4 border border-slate-700/80 shadow-xl space-y-3 sm:space-y-3.5">
            {/* 1. Top Section: Username & Streak Metrics */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
              <div className="min-w-0 flex-1">
                <div className="text-base xs:text-lg sm:text-xl font-black text-white truncate max-w-full">
                  u/{data.username}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-2 w-full sm:w-auto shrink-0">
                <div className="px-2.5 py-1 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-center min-w-[90px]">
                  <div className="text-[10px] text-cyan-300 uppercase tracking-wider font-semibold">Active Streak</div>
                  <div className="text-xs sm:text-sm font-black text-cyan-400">{data.currentStreak} Days</div>
                </div>
                <div className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-center min-w-[90px]">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Best Streak</div>
                  <div className="text-xs sm:text-sm font-black text-slate-200">{data.maxStreak} Days</div>
                </div>
              </div>
            </div>

            {/* 2. Integrated Streak Protection Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-slate-800/80 pb-2.5">
              <div className="text-xs text-slate-300 font-medium">
                Streak Protection: <span className="text-cyan-300 font-semibold">Automatic freezes prevent missed days from breaking your streak.</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <div className="px-2 py-0.5 rounded-md bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 text-[11px] font-bold">
                  {data.availableFreezes} / 3 Freezes Available
                </div>
                <div className="px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700 text-slate-400 text-[11px] font-medium">
                  {data.freezesUsedIn30Days} Used This Month
                </div>
              </div>
            </div>

            {/* 3. Distinct Performance Stats Section */}
            <div className="space-y-1.5 pt-0.5">
              <h2 className="text-xs sm:text-sm font-extrabold text-slate-200 uppercase tracking-wider border-b border-slate-800/60 pb-1.5">
                Distinct Performance Stats
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
                {/* 1. Unique Puzzles Completed */}
                <div className="flex items-center justify-between py-0.5 border-b border-slate-800/40">
                  <span className="text-xs sm:text-sm text-slate-300 font-medium">Unique Puzzles Completed</span>
                  <span className="text-xs sm:text-sm font-black text-white">{data.distinctStats.totalPuzzlesSolved}</span>
                </div>

                {/* 2. Target Blocks Completed */}
                <div className="flex items-center justify-between py-0.5 border-b border-slate-800/40">
                  <span className="text-xs sm:text-sm text-slate-300 font-medium">Target Blocks Completed</span>
                  <span className="text-xs sm:text-sm font-black text-white">{data.distinctStats.totalTargetBlocksCompleted}</span>
                </div>

                {/* 3. Block Slides Triggered */}
                <div className="flex items-center justify-between py-0.5 border-b border-slate-800/40">
                  <span className="text-xs sm:text-sm text-slate-300 font-medium">Block Slides Triggered</span>
                  <span className="text-xs sm:text-sm font-black text-white">{data.distinctStats.totalBlockPushes}</span>
                </div>

                {/* 4. Grid Steps Navigated */}
                <div className="flex items-center justify-between py-0.5 border-b border-slate-800/40">
                  <span className="text-xs sm:text-sm text-slate-300 font-medium">Grid Steps Navigated</span>
                  <span className="text-xs sm:text-sm font-black text-white">{data.distinctStats.totalPieceMoves}</span>
                </div>

                {/* 5. Community Challenges */}
                <div className="flex items-center justify-between py-0.5 border-b border-slate-800/40">
                  <span className="text-xs sm:text-sm text-slate-300 font-medium">Community Challenges</span>
                  <span className="text-xs sm:text-sm font-black text-white">{data.puzzlesCreated}</span>
                </div>

                {/* 6. Rating Stars Earned */}
                <div className="flex items-center justify-between py-0.5 border-b border-slate-800/40">
                  <span className="text-xs sm:text-sm text-slate-300 font-medium">Rating Stars Earned</span>
                  <span className="text-xs sm:text-sm font-black text-yellow-400">{data.distinctStats.totalStarsEarned}</span>
                </div>

                {/* 7. Podium Finishes */}
                <div className="flex items-center justify-between py-0.5 border-b border-slate-800/40">
                  <span className="text-xs sm:text-sm text-slate-300 font-medium truncate">
                    Podium Finishes <span className="text-[10px] sm:text-xs text-slate-400 font-normal ml-1">(1st: {data.podiums.firstPlace}, 2nd: {data.podiums.secondPlace}, 3rd: {data.podiums.thirdPlace})</span>
                  </span>
                  <span className="text-xs sm:text-sm font-black text-emerald-400 ml-2 shrink-0">
                    {data.podiums.firstPlace + data.podiums.secondPlace + data.podiums.thirdPlace}
                  </span>
                </div>

                {/* 8. Neon Shards */}
                <div className="flex items-center justify-between py-0.5 border-b border-slate-800/40">
                  <span className="text-xs sm:text-sm text-slate-300 font-medium">Neon Shards</span>
                  <span className="text-xs sm:text-sm font-black text-cyan-400">{data.currency}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
