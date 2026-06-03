import { useState, useEffect } from 'react';
import { trpc } from '../trpc';
import { GameDifficulty, BlockType } from '../types';
import { PuzzleShape } from '../components/PuzzleShape';
import { ThemeId } from '../../shared/themes';

const buttonBlocks: Record<'daily' | 'campaign' | 'past-puzzles' | 'shop', { type: BlockType; colorClass: string; neonClass: string; textClass: string; bgClass: string; borderClass: string }> = {
  daily: {
    type: 'blue-square',
    colorClass: 'border-blue-500 bg-blue-500/10',
    neonClass: 'shadow-[0_0_15px_rgba(59,130,246,0.6)] neon-blue',
    textClass: 'text-blue-500',
    bgClass: 'bg-blue-950/20',
    borderClass: 'border-blue-500/60 group-hover:border-blue-500'
  },
  campaign: {
    type: 'yellow-triangle',
    colorClass: 'border-yellow-400 bg-yellow-400/10',
    neonClass: 'shadow-[0_0_15px_rgba(250,204,21,0.6)] neon-yellow',
    textClass: 'text-yellow-400',
    bgClass: 'bg-yellow-950/20',
    borderClass: 'border-yellow-400/60 group-hover:border-yellow-400'
  },
  'past-puzzles': {
    type: 'purple-star',
    colorClass: 'border-purple-500 bg-purple-500/10',
    neonClass: 'shadow-[0_0_15px_rgba(168,85,247,0.6)] neon-purple',
    textClass: 'text-purple-500',
    bgClass: 'bg-purple-950/20',
    borderClass: 'border-purple-500/60 group-hover:border-purple-500'
  },
  shop: {
    type: 'green-leaf',
    colorClass: 'border-green-500 bg-green-500/10',
    neonClass: 'shadow-[0_0_15px_rgba(34,197,94,0.6)] neon-green',
    textClass: 'text-green-500',
    bgClass: 'bg-green-950/20',
    borderClass: 'border-green-500/60 group-hover:border-green-500'
  }
};

export const Menu = ({
  onSelectDifficulty,
  onSelectCampaign,
  onSelectPastPuzzles,
  onSelectShop,
  onSelectAdmin,
  activeTheme: _activeTheme = 'neon'
}: {
  onSelectDifficulty: (difficulty: GameDifficulty) => void;
  onSelectCampaign?: () => void;
  onSelectPastPuzzles?: () => void;
  onSelectShop?: () => void;
  onSelectAdmin?: () => void;
  activeTheme?: ThemeId;
}) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [animatingId, setAnimatingId] = useState<string | null>(null);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const result = await trpc.admin.checkAuth.query();
        setIsAdmin(result.isAdmin);
      } catch (error) {
        setIsAdmin(false);
      } finally {
        setCheckingAdmin(false);
      }
    };

    checkAdminStatus();
  }, []);

  const handleBtnClick = (btnId: string, action: () => void) => {
    if (animatingId) return; // Prevent double clicks
    setAnimatingId(btnId);
    setTimeout(() => {
      action();
      setAnimatingId(null);
    }, 450); // Matches transition duration
  };

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

  const bgClass = getThemeBgClass('neon');

  return (
    <div className={`relative flex min-h-screen flex-col items-center justify-center gap-8 ${bgClass} px-4 transition-colors duration-500`}>
      <h1 className="text-center text-6xl font-black neon-text-title tracking-tight mb-4">
        Block Down
      </h1>

      <div className="flex w-full max-w-sm flex-col gap-5">
        {([
          { id: 'daily', label: 'Daily Puzzle' },
          { id: 'campaign', label: 'Campaign' },
          { id: 'past-puzzles', label: 'Past Puzzles' },
          { id: 'shop', label: 'Shop' },
        ] as const).map(btn => (
          <button
            key={btn.id}
            disabled={animatingId !== null}
            onClick={() => {
              const action = () => {
                if (btn.id === 'campaign') onSelectCampaign?.();
                else if (btn.id === 'past-puzzles') onSelectPastPuzzles?.();
                else if (btn.id === 'shop') onSelectShop?.();
                else onSelectDifficulty(btn.id as GameDifficulty);
              };
              handleBtnClick(btn.id, action);
            }}
            className="relative flex items-center justify-between w-full h-16 px-4 rounded-2xl hover:bg-white/5 active:bg-white/10 transition-all select-none group cursor-pointer focus:outline-none"
          >
            {/* Left: Start Slot (Dashed slot representing empty space) */}
            <div className="w-10 h-10 rounded-xl border border-dashed border-white/10 flex items-center justify-center shrink-0" />

            {/* Center/Left: Label Text (themed style, fits the theme without matching the title gradient) */}
            <span className="flex-1 text-left pl-6 text-xl font-extrabold tracking-wide text-zinc-300 group-hover:text-white transition-colors">
              {btn.label}
            </span>

            {/* Right: Target Zone (Dashed color border matching the block type) */}
            <div className={`w-10 h-10 rounded-xl border-2 border-dashed flex items-center justify-center shrink-0 transition-all ${buttonBlocks[btn.id].bgClass} ${buttonBlocks[btn.id].textClass} border-dashed opacity-30 group-hover:opacity-60`}>
              <PuzzleShape type={buttonBlocks[btn.id].type} className="w-1/2 h-1/2 opacity-25" />
            </div>

            {/* Sliding Block: Absolutely positioned, starts at left-4 and moves to right slot on click */}
            <div
              className={`absolute w-10 h-10 rounded-xl flex items-center justify-center border bg-zinc-950/90 backdrop-blur-sm duration-[450ms] ${
                animatingId === btn.id
                  ? `left-[calc(100%-3.5rem)] ${buttonBlocks[btn.id].colorClass} ${buttonBlocks[btn.id].neonClass} ${buttonBlocks[btn.id].textClass}`
                  : `left-4 ${buttonBlocks[btn.id].borderClass}`
              }`}
              style={{
                transitionProperty: 'left, border-color, color, box-shadow, background-color',
                transitionTimingFunction: 'cubic-bezier(0.25, 1, 0.5, 1)'
              }}
            >
              <PuzzleShape
                type={buttonBlocks[btn.id].type}
                className={`w-1/2 h-1/2 transition-colors duration-[450ms] ${
                  animatingId === btn.id
                    ? ''
                    : 'text-zinc-400 group-hover:text-zinc-200'
                }`}
              />
            </div>
          </button>
        ))}
      </div>

      {/* Admin Button - Top Right */}
      {!checkingAdmin && isAdmin && (
        <div className="absolute top-14 right-4 sm:top-16 sm:right-6">
          <button
            onClick={() => onSelectAdmin?.()}
            className="px-4 py-2 theme-btn rounded-lg font-bold text-sm flex items-center gap-2"
            title="Admin Panel"
          >
            <span>Admin</span>
          </button>
        </div>
      )}

    </div>
  );
};
