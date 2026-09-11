import { useState, useEffect } from 'react';
import { trpc } from '../trpc';
import { Puzzle } from '../../shared/types';
import { THEMES, getThemeBgClass, Theme, ThemeConfig } from '../../shared/themes';

export interface CommunityScreenProps {
  onReturnToMenu: () => void;
  onSelectPuzzle: (puzzle: Puzzle) => void;
  onOpenPuzzleMaker: () => void;
  activeTheme?: string;
  activeThemeStyle?: Theme | undefined;
  themeConfig?: ThemeConfig | undefined;
}

type CommunityItem = {
  puzzle: Puzzle;
  isCompleted: boolean;
  totalCompletions: number;
};

export const CommunityScreen = ({
  onReturnToMenu,
  onSelectPuzzle,
  onOpenPuzzleMaker,
  activeTheme = 'neon',
  activeThemeStyle,
}: CommunityScreenProps) => {
  const [stages, setStages] = useState<CommunityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'unsolved' | 'solved'>('all');

  const fetchCommunityStages = async () => {
    try {
      setLoading(true);
      const res = await trpc.puzzle.getCommunityPuzzles.query();
      if (res) {
        setStages(res);
      }
    } catch (e) {
      console.error('Failed to load community puzzles', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchCommunityStages();
  }, []);

  const bgClass = getThemeBgClass(activeTheme, activeThemeStyle);

  // Filter and search logic
  const filteredStages = stages.filter((item) => {
    const matchesSearch =
      searchQuery.trim() === '' ||
      item.puzzle.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.puzzle.author && item.puzzle.author.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterTab === 'solved') return item.isCompleted;
    if (filterTab === 'unsolved') return !item.isCompleted;
    return true;
  });

  return (
    <div className={`relative flex min-h-screen flex-col items-center gap-4 ${bgClass} px-3 sm:px-6 py-4 sm:py-6 select-none overflow-y-auto`}>
      {/* Top Header */}
      <div className="w-full max-w-5xl flex items-center justify-between z-20 shrink-0 gap-2">
        <button
          onClick={onReturnToMenu}
          className="px-3.5 py-1.5 bg-black/60 backdrop-blur-md border border-cyan-500/30 text-white rounded-xl font-bold text-xs sm:text-sm transition-all hover:scale-105 active:scale-95 shadow-md cursor-pointer flex items-center gap-1.5"
        >
          <span>← Back to Menu</span>
        </button>

        <div className="flex flex-col items-center text-center">
          <h1 className="text-xl sm:text-3xl font-black neon-text-title tracking-tight drop-shadow-md">
            COMMUNITY STAGES
          </h1>
          <span className="text-[10px] sm:text-xs text-cyan-400 font-mono uppercase tracking-widest">
            Player-Created Challenges
          </span>
        </div>

        <button
          onClick={onOpenPuzzleMaker}
          className="px-3 py-1.5 bg-purple-950/80 hover:bg-purple-900 border border-purple-400/50 text-purple-300 rounded-xl font-extrabold text-xs transition-all hover:scale-105 active:scale-95 shadow-md cursor-pointer flex items-center gap-1"
        >
          <span className="text-purple-400 font-black">🎨</span>
          <span className="hidden sm:inline">Build Stage</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="w-full max-w-5xl glass-panel p-3 rounded-2xl border border-cyan-500/30 shadow-xl z-20 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search stage or creator..."
            className="w-full bg-slate-900/90 border border-white/20 rounded-xl px-3 py-1.5 pl-8 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400"
          />
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 text-xs">🔍</span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto justify-center">
          {(['all', 'unsolved', 'solved'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterTab(tab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer border ${
                filterTab === tab
                  ? 'bg-cyan-500 text-black border-white shadow-[0_0_10px_rgba(34,211,238,0.5)]'
                  : 'bg-black/40 text-zinc-300 border-white/10 hover:bg-white/10'
              }`}
            >
              {tab === 'all' && `All (${stages.length})`}
              {tab === 'unsolved' && `Unsolved (${stages.filter((s) => !s.isCompleted).length})`}
              {tab === 'solved' && `Solved (${stages.filter((s) => s.isCompleted).length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Stage Grid Container */}
      <div className="w-full max-w-5xl flex-1 z-20 pb-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-cyan-400">
            <div className="w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-mono font-bold tracking-wider text-zinc-400 uppercase">
              Loading Community Stages...
            </span>
          </div>
        ) : filteredStages.length === 0 ? (
          <div className="glass-panel p-8 rounded-3xl border border-white/10 text-center flex flex-col items-center justify-center gap-3 max-w-md mx-auto my-12">
            <span className="text-4xl">🎨</span>
            <h3 className="text-lg font-bold text-white">No Community Stages Found</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              {searchQuery || filterTab !== 'all'
                ? 'No stages match your current search or filter settings.'
                : 'Be the first creator to build and publish a custom stage in the Puzzle Maker!'}
            </p>
            <button
              onClick={onOpenPuzzleMaker}
              className="mt-2 px-5 py-2.5 rounded-2xl theme-btn text-xs font-black uppercase tracking-wider transition-all hover:scale-105 active:scale-95 shadow-md cursor-pointer"
            >
              Open Puzzle Maker
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStages.map(({ puzzle, isCompleted, totalCompletions }) => {
              const puzzleTheme = THEMES.find((t) => t.id === puzzle.theme) || THEMES[0];
              const blockCount = puzzle.blocks?.length || 0;
              const targetCount = puzzle.targets?.length || 0;
              const portalCount = puzzle.portals?.length || 0;

              return (
                <div
                  key={puzzle.id}
                  className="glass-panel p-4 rounded-2xl border border-cyan-500/30 hover:border-cyan-400/80 transition-all duration-300 text-white flex flex-col justify-between gap-3 shadow-lg hover:shadow-cyan-500/20 group relative overflow-hidden"
                >
                  {/* Top Bar: Title & Solved Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col">
                      <h3 className="font-extrabold text-base text-white group-hover:text-cyan-300 transition-colors line-clamp-1">
                        {puzzle.name}
                      </h3>
                      <span className="text-[11px] font-mono text-zinc-400">
                        {puzzle.author || 'Anonymous'}
                      </span>
                    </div>

                    {isCompleted && (
                      <span className="shrink-0 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-black uppercase tracking-wider shadow-[0_0_8px_rgba(16,185,129,0.2)]">
                        ✓ Solved
                      </span>
                    )}
                  </div>

                  {/* Mid Info Chips */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
                    {/* Theme Badge */}
                    <span className="px-2 py-0.5 rounded-md bg-white/10 border border-white/20 text-cyan-300 font-bold">
                      {puzzleTheme?.name || 'Neon Cyber'}
                    </span>

                    {/* Stats Badges */}
                    <span className="px-2 py-0.5 rounded-md bg-black/40 border border-white/10 text-zinc-300">
                      {puzzle.width || 9}x{puzzle.height || 9}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-black/40 border border-white/10 text-zinc-300">
                      📦 {blockCount} {blockCount === 1 ? 'Block' : 'Blocks'}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-black/40 border border-white/10 text-zinc-300">
                      🎯 {targetCount} {targetCount === 1 ? 'Target' : 'Targets'}
                    </span>
                    {portalCount > 0 && (
                      <span className="px-2 py-0.5 rounded-md bg-purple-950/60 border border-purple-500/40 text-purple-300">
                        🌀 {portalCount} {portalCount === 1 ? 'Portal' : 'Portals'}
                      </span>
                    )}
                  </div>

                  {/* Footer: Solve count & Play Button */}
                  <div className="flex items-center justify-between border-t border-white/10 pt-2.5 mt-1">
                    <span className="text-[11px] font-mono font-bold text-zinc-400">
                      ⭐ {totalCompletions} {totalCompletions === 1 ? 'Player' : 'Players'} Solved
                    </span>

                    <button
                      onClick={() => onSelectPuzzle(puzzle)}
                      className="px-4 py-1.5 rounded-xl theme-btn font-extrabold text-xs uppercase tracking-wider transition-all hover:scale-105 active:scale-95 shadow-md cursor-pointer flex items-center gap-1"
                    >
                      <span>Play Stage</span>
                      <span className="text-cyan-300">→</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
