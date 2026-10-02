import { useState, useEffect } from 'react';
import { trpc } from '../trpc';
import { trackClientEvent } from '../utils/analytics';
import { ThemeId, Theme, GameCharacter } from '../../shared/themes';
import { TrailId } from '../../shared/trails';
import { SettingsModal } from '../components/SettingsModal';
import { TutorialModal } from '../components/TutorialModal';

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
  weeklyAwards?: {
    totalAwards: number;
    trophies: {
      firstPlace: number;
      secondPlace: number;
      thirdPlace: number;
    };
    totalShardsEarned: number;
    history: Array<{
      weekId: string;
      rank: 1 | 2 | 3;
      puzzleId: string;
      puzzleName: string;
      shardReward: number;
      difficultyScore: number;
      dateAwarded: string;
    }>;
  };
};

export const ProfileScreen = (props: {
  onReturnToMenu: () => void;
  activeTheme?: ThemeId;
  activeThemeStyle?: Theme | undefined;
  purchasedThemes?: ThemeId[];
  themes?: Theme[];
  onEquipTheme?: ((themeId: ThemeId) => Promise<unknown> | undefined) | undefined;
  activeCharacter?: string;
  purchasedCharacters?: string[];
  characters?: GameCharacter[];
  onEquipCharacter?: ((characterId: string) => Promise<unknown> | undefined) | undefined;
  activeTrail?: TrailId;
  purchasedTrails?: TrailId[];
  onEquipTrail?: ((trailId: TrailId) => Promise<unknown> | undefined) | undefined;
}) => {
  const { onReturnToMenu } = props;
  const [data, setData] = useState<ProfileStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    trackClientEvent('screen_view_profile');
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
    <div className="flex flex-col h-screen max-h-screen w-full bg-slate-950 text-white select-none overflow-hidden">
      {/* Sticky Header Bar */}
      <header className="shrink-0 z-20 flex items-center justify-between px-3 py-2.5 sm:px-4 sm:py-3 bg-slate-900/95 backdrop-blur border-b border-slate-800 shadow-md">
        <button
          onClick={onReturnToMenu}
          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-bold text-xs sm:text-sm transition-all border border-slate-700 shrink-0 cursor-pointer"
        >
          &larr; Menu
        </button>
        <h1 className="text-base sm:text-lg font-black tracking-wider text-cyan-400 uppercase text-center flex-1 mx-2 truncate">
          Player Profile
        </h1>
        <button
          onClick={() => setShowSettings(true)}
          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-bold text-xs sm:text-sm transition-all border border-slate-700 flex items-center gap-1.5 cursor-pointer shadow shrink-0"
          title="Settings"
        >
          <svg className="w-4 h-4 text-cyan-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          <span className="hidden xs:inline">Settings</span>
        </button>
      </header>

      {/* Scrollable Card Container */}
      <main className="flex-1 w-full overflow-y-auto overscroll-contain p-3 sm:p-4">
        <div className="max-w-3xl w-full mx-auto pb-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <div className="w-8 h-8 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-xs sm:text-sm font-medium">Loading player statistics...</p>
            </div>
          ) : !data ? (
            <div className="text-center py-16 text-slate-400">
              <p className="text-sm">Unable to load user profile.</p>
            </div>
          ) : (
            /* Single Unified Profile Card with Clean Spacing */
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800/95 to-slate-900 p-4 sm:p-5 border border-slate-700/80 shadow-xl space-y-4">
              {/* 1. Top Section: Username & Streak Metrics */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                <div className="min-w-0 flex-1">
                  <div className="text-lg sm:text-xl font-black text-white truncate max-w-full">
                    u/{data.username}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-2 w-full sm:w-auto shrink-0">
                  <div className="px-3 py-1.5 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-center min-w-[95px]">
                    <div className="text-[10px] text-cyan-300 uppercase tracking-wider font-semibold">Active Streak</div>
                    <div className="text-xs sm:text-sm font-black text-cyan-400">{data.currentStreak} Days</div>
                  </div>
                  <div className="px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-center min-w-[95px]">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Best Streak</div>
                    <div className="text-xs sm:text-sm font-black text-slate-200">{data.maxStreak} Days</div>
                  </div>
                </div>
              </div>

              {/* 2. Integrated Streak Protection Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div className="text-xs text-slate-300 font-medium">
                  Streak Protection: <span className="text-cyan-300 font-semibold">Automatic freezes prevent missed days from breaking your streak.</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="px-2.5 py-1 rounded-md bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 text-[11px] font-bold">
                    {data.availableFreezes} / 3 Freezes Available
                  </div>
                  <div className="px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700 text-slate-400 text-[11px] font-medium">
                    {data.freezesUsedIn30Days} Used This Month
                  </div>
                </div>
              </div>

              {/* 3. Distinct Performance Stats Section */}
              <div className="space-y-2 pt-1">
                <h2 className="text-xs sm:text-sm font-extrabold text-slate-200 uppercase tracking-wider border-b border-slate-800/60 pb-1.5">
                  Distinct Performance Stats
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                  {/* 1. Unique Puzzles Completed */}
                  <div className="flex items-center justify-between py-1 border-b border-slate-800/40">
                    <span className="text-xs sm:text-sm text-slate-300 font-medium">Unique Puzzles Completed</span>
                    <span className="text-xs sm:text-sm font-black text-white">{data.distinctStats.totalPuzzlesSolved}</span>
                  </div>

                  {/* 2. Target Blocks Completed */}
                  <div className="flex items-center justify-between py-1 border-b border-slate-800/40">
                    <span className="text-xs sm:text-sm text-slate-300 font-medium">Target Blocks Completed</span>
                    <span className="text-xs sm:text-sm font-black text-white">{data.distinctStats.totalTargetBlocksCompleted}</span>
                  </div>

                  {/* 3. Block Slides Triggered */}
                  <div className="flex items-center justify-between py-1 border-b border-slate-800/40">
                    <span className="text-xs sm:text-sm text-slate-300 font-medium">Block Slides Triggered</span>
                    <span className="text-xs sm:text-sm font-black text-white">{data.distinctStats.totalBlockPushes}</span>
                  </div>

                  {/* 4. Grid Steps Navigated */}
                  <div className="flex items-center justify-between py-1 border-b border-slate-800/40">
                    <span className="text-xs sm:text-sm text-slate-300 font-medium">Grid Steps Navigated</span>
                    <span className="text-xs sm:text-sm font-black text-white">{data.distinctStats.totalPieceMoves}</span>
                  </div>

                  {/* 5. Community Challenges */}
                  <div className="flex items-center justify-between py-1 border-b border-slate-800/40">
                    <span className="text-xs sm:text-sm text-slate-300 font-medium">Community Challenges</span>
                    <span className="text-xs sm:text-sm font-black text-white">{data.puzzlesCreated}</span>
                  </div>

                  {/* 6. Rating Stars Earned */}
                  <div className="flex items-center justify-between py-1 border-b border-slate-800/40">
                    <span className="text-xs sm:text-sm text-slate-300 font-medium">Rating Stars Earned</span>
                    <span className="text-xs sm:text-sm font-black text-yellow-400">{data.distinctStats.totalStarsEarned}</span>
                  </div>

                  {/* 7. Podium Finishes */}
                  <div className="flex items-center justify-between py-1 border-b border-slate-800/40">
                    <span className="text-xs sm:text-sm text-slate-300 font-medium truncate">
                      Podium Finishes <span className="text-[10px] sm:text-xs text-slate-400 font-normal ml-1">(1st: {data.podiums.firstPlace}, 2nd: {data.podiums.secondPlace}, 3rd: {data.podiums.thirdPlace})</span>
                    </span>
                    <span className="text-xs sm:text-sm font-black text-emerald-400 ml-2 shrink-0">
                      {data.podiums.firstPlace + data.podiums.secondPlace + data.podiums.thirdPlace}
                    </span>
                  </div>

                  {/* 8. Neon Shards */}
                  <div className="flex items-center justify-between py-1 border-b border-slate-800/40">
                    <span className="text-xs sm:text-sm text-slate-300 font-medium">Neon Shards</span>
                    <span className="text-xs sm:text-sm font-black text-cyan-400">{data.currency}</span>
                  </div>
                </div>
              </div>

              {/* 4. Weekly Creator Contest Awards & Trophies Section */}
              <div className="space-y-3 pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs sm:text-sm font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    Master Architect Weekly Awards
                  </h2>
                  {data.weeklyAwards && data.weeklyAwards.totalAwards > 0 && (
                    <span className="text-[10px] font-mono text-cyan-300 font-bold bg-cyan-950/60 px-2 py-0.5 rounded-full border border-cyan-500/40">
                      +{data.weeklyAwards.totalShardsEarned} Shards Won
                    </span>
                  )}
                </div>

                {/* Trophy Counts */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  <div className="p-2.5 sm:p-3 rounded-xl bg-slate-900/90 border border-amber-500/40 text-center">
                    <div className="text-[11px] text-amber-400 uppercase font-mono font-bold">Rank 1 Gold</div>
                    <div className="text-base sm:text-lg font-black text-white mt-0.5">
                      {data.weeklyAwards?.trophies.firstPlace || 0}
                    </div>
                  </div>

                  <div className="p-2.5 sm:p-3 rounded-xl bg-slate-900/90 border border-slate-500/40 text-center">
                    <div className="text-[11px] text-slate-300 uppercase font-mono font-bold">Rank 2 Silver</div>
                    <div className="text-base sm:text-lg font-black text-white mt-0.5">
                      {data.weeklyAwards?.trophies.secondPlace || 0}
                    </div>
                  </div>

                  <div className="p-2.5 sm:p-3 rounded-xl bg-slate-900/90 border border-amber-700/40 text-center">
                    <div className="text-[11px] text-amber-500 uppercase font-mono font-bold">Rank 3 Bronze</div>
                    <div className="text-base sm:text-lg font-black text-white mt-0.5">
                      {data.weeklyAwards?.trophies.thirdPlace || 0}
                    </div>
                  </div>
                </div>

                {/* Award History List */}
                {data.weeklyAwards && data.weeklyAwards.history.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <div className="text-[11px] font-mono text-slate-400 font-bold uppercase tracking-wider">
                      Contest Award History ({data.weeklyAwards.history.length})
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                      {data.weeklyAwards.history.map((a, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 sm:p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-2 text-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-mono font-bold text-amber-400 shrink-0">
                              Rank {a.rank}
                            </span>
                            <div className="min-w-0">
                              <span className="font-bold text-white block truncate">{a.puzzleName}</span>
                              <span className="text-[10px] text-slate-500 font-mono">
                                {a.weekId} • {a.dateAwarded}
                              </span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-[11px] font-black font-mono text-cyan-300 block">
                              +{a.shardReward} Shards
                            </span>
                            <span className="text-[9px] text-slate-500 font-mono">
                              Diff: {a.difficultyScore}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        activeTheme={props.activeTheme}
        purchasedThemes={props.purchasedThemes}
        themes={props.themes}
        onEquipTheme={props.onEquipTheme}
        activeCharacter={props.activeCharacter}
        purchasedCharacters={props.purchasedCharacters}
        characters={props.characters}
        onEquipCharacter={props.onEquipCharacter}
        activeTrail={props.activeTrail}
        purchasedTrails={props.purchasedTrails}
        onEquipTrail={props.onEquipTrail}
        onHowToPlay={() => {
          setShowSettings(false);
          setShowTutorial(true);
        }}
      />

      {/* Tutorial Guide Modal */}
      {showTutorial && (
        <TutorialModal
          onClose={() => setShowTutorial(false)}
          activeTheme={props.activeTheme}
        />
      )}
    </div>
  );
};
