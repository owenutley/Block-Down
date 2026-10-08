import { useState, useEffect } from 'react';
import { trpc } from '../trpc';
import { GameDifficulty } from '../types';
import { HexagonBlock } from '../components/HexagonBlock';
import { ThemeId, DEFAULT_THEME_CONFIGS, ThemeConfig, getBaseThemeId, getThemeBgClass, Theme } from '../../shared/themes';
import { TutorialModal } from '../components/TutorialModal';

const buttonBlocks: Record<
  'play' | 'daily' | 'weekly' | 'campaign' | 'community' | 'slide-match' | 'puzzle-maker' | 'shop' | 'profile',
  { type: keyof ThemeConfig; colorClass: string; neonClass: string; textClass: string; bgClass: string; borderClass: string }
> = {
  play: {
    type: 'blue-diamond',
    colorClass: 'border-cyan-500 bg-cyan-500/10',
    neonClass: 'shadow-[0_0_15px_rgba(6,182,212,0.6)] neon-blue',
    textClass: 'text-cyan-400',
    bgClass: 'bg-cyan-950/30',
    borderClass: 'border-cyan-500/60 group-hover:border-cyan-400',
  },
  'slide-match': {
    type: 'purple-circle',
    colorClass: 'border-fuchsia-500 bg-fuchsia-500/10',
    neonClass: 'shadow-[0_0_15px_rgba(217,70,239,0.6)] neon-purple',
    textClass: 'text-fuchsia-400',
    bgClass: 'bg-fuchsia-950/30',
    borderClass: 'border-fuchsia-500/60 group-hover:border-fuchsia-400',
  },
  daily: {
    type: 'blue-diamond',
    colorClass: 'border-blue-500 bg-blue-500/10',
    neonClass: 'shadow-[0_0_15px_rgba(59,130,246,0.6)] neon-blue',
    textClass: 'text-blue-400',
    bgClass: 'bg-blue-950/30',
    borderClass: 'border-blue-500/60 group-hover:border-blue-400',
  },
  weekly: {
    type: 'green-cross',
    colorClass: 'border-emerald-500 bg-emerald-500/10',
    neonClass: 'shadow-[0_0_15px_rgba(16,185,129,0.6)] neon-green',
    textClass: 'text-emerald-400',
    bgClass: 'bg-emerald-950/30',
    borderClass: 'border-emerald-500/60 group-hover:border-emerald-400',
  },
  campaign: {
    type: 'yellow-crescent',
    colorClass: 'border-yellow-400 bg-yellow-400/10',
    neonClass: 'shadow-[0_0_15px_rgba(250,204,21,0.6)] neon-yellow',
    textClass: 'text-yellow-400',
    bgClass: 'bg-yellow-950/30',
    borderClass: 'border-yellow-500/60 group-hover:border-yellow-400',
  },
  community: {
    type: 'red-heart',
    colorClass: 'border-red-500 bg-red-500/10',
    neonClass: 'shadow-[0_0_15px_rgba(239,68,68,0.6)] neon-red',
    textClass: 'text-red-400',
    bgClass: 'bg-red-950/30',
    borderClass: 'border-red-500/60 group-hover:border-red-400',
  },
  'puzzle-maker': {
    type: 'purple-circle',
    colorClass: 'border-purple-500 bg-purple-500/10',
    neonClass: 'shadow-[0_0_15px_rgba(168,85,247,0.6)] neon-purple',
    textClass: 'text-purple-400',
    bgClass: 'bg-purple-950/30',
    borderClass: 'border-purple-500/60 group-hover:border-purple-400',
  },
  shop: {
    type: 'green-cross',
    colorClass: 'border-green-500 bg-green-500/10',
    neonClass: 'shadow-[0_0_15px_rgba(34,197,94,0.6)] neon-green',
    textClass: 'text-green-400',
    bgClass: 'bg-green-950/30',
    borderClass: 'border-green-500/60 group-hover:border-green-400',
  },
  profile: {
    type: 'orange-square',
    colorClass: 'border-orange-500 bg-orange-500/10',
    neonClass: 'shadow-[0_0_15px_rgba(249,115,22,0.6)] neon-orange',
    textClass: 'text-orange-400',
    bgClass: 'bg-orange-950/30',
    borderClass: 'border-orange-500/60 group-hover:border-orange-400',
  },
};

export interface MenuProps {
  onSelectDifficulty: (difficulty: GameDifficulty) => void;
  onSelectWeekly?: () => void;
  onSelectCampaign?: () => void;
  onSelectSlideMatch?: () => void;
  onSelectCommunity?: () => void;
  onSelectPuzzleMaker?: () => void;
  onSelectShop?: () => void;
  onSelectProfile?: () => void;
  onSelectDev?: () => void;
  activeTheme?: ThemeId;
  activeThemeStyle?: Theme | undefined;
  themeConfig?: ThemeConfig | undefined;
  currency?: number;
  streak?: number;
}

export const Menu = ({
  onSelectDifficulty,
  onSelectWeekly,
  onSelectCampaign,
  onSelectSlideMatch,
  onSelectCommunity,
  onSelectPuzzleMaker,
  onSelectShop,
  onSelectProfile,
  onSelectDev,
  activeTheme: _activeTheme = 'neon',
  activeThemeStyle,
  themeConfig,
  currency = 0,
  streak = 0,
}: MenuProps) => {
  const baseTheme = getBaseThemeId(_activeTheme);
  const config = themeConfig || DEFAULT_THEME_CONFIGS[baseTheme] || DEFAULT_THEME_CONFIGS.neon;
  const [view, setView] = useState<'main' | 'play'>('main');
  const [isMod, setIsMod] = useState(false);
  const [checkingDev, setCheckingDev] = useState(true);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [animatingId, setAnimatingId] = useState<string | null>(null);

  useEffect(() => {
    const checkDevStatus = async () => {
      try {
        const result = await trpc.dev.checkAuth.query();
        setIsMod(result.isModerator);
      } catch {
        setIsMod(false);
      } finally {
        setCheckingDev(false);
      }
    };

    void checkDevStatus();
  }, []);

  const handleBtnClick = (btnId: string, action: () => void) => {
    if (animatingId) return;
    setAnimatingId(btnId);
    setTimeout(() => {
      action();
      setAnimatingId(null);
    }, 450);
  };

  const bgClass = getThemeBgClass(_activeTheme, activeThemeStyle);

  return (
    <div className={`relative flex min-h-screen flex-col items-center justify-center gap-4 sm:gap-5 ${bgClass} px-4 py-6 transition-colors duration-500 font-sans select-none text-white`}>
      {/* Dev Panel Button - Top Right */}
      {!checkingDev && isMod && (
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20">
          <button
            onClick={() => onSelectDev?.()}
            className="px-3.5 py-1.5 theme-btn rounded-xl font-bold text-xs uppercase tracking-wider text-zinc-300 border border-white/20 hover:border-white/40 shadow-md cursor-pointer transition-all"
            title="Dev Panel"
          >
            Dev Panel
          </button>
        </div>
      )}

      {/* Header Section */}
      <div className="text-center mb-1">
        <h1 className="text-4xl sm:text-5xl font-black neon-text-title tracking-tight">
          Block Down
        </h1>
        <p className="text-xs text-zinc-400 font-mono tracking-widest uppercase mt-1">
          {view === 'main' ? 'Puzzle Arcade' : 'Select Game Mode'}
        </p>
      </div>

      {view === 'main' ? (
        /* MAIN MENU VIEW */
        <div className="flex w-full max-w-sm flex-col gap-3 animate-fadeIn">
          {/* PLAY NOW BUTTON */}
          <button
            disabled={animatingId !== null}
            onClick={() => handleBtnClick('play', () => setView('play'))}
            className="relative flex items-center justify-between w-full h-16 px-4 rounded-2xl border border-cyan-500/50 bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-black/60 hover:border-cyan-400 hover:shadow-[0_0_25px_rgba(6,182,212,0.35)] active:scale-[0.99] transition-all select-none group cursor-pointer focus:outline-none"
          >
            {/* Left: Start Slot */}
            <div className="w-10 h-10 rounded-xl border border-dashed border-cyan-500/30 flex items-center justify-center shrink-0" />

            {/* Center: Label Text */}
            <div className="flex-1 text-left pl-5">
              <div className="text-xl font-black tracking-wide text-white group-hover:text-cyan-300 transition-colors">
                Play Now
              </div>
              <div className="text-[11px] font-mono text-cyan-400/90 leading-tight">
                Daily, Slide Match, Weekly, Campaign & Community
              </div>
            </div>

            {/* Right: Target Zone */}
            <div className={`w-10 h-10 rounded-xl border-2 border-dashed flex items-center justify-center shrink-0 transition-all ${buttonBlocks.play.bgClass} ${buttonBlocks.play.textClass} border-dashed opacity-40 group-hover:opacity-80`} />

            {/* Sliding Block */}
            <div
              className="absolute w-10 h-10 flex items-center justify-center duration-[450ms]"
              style={{
                left: animatingId === 'play' ? 'calc(100% - 3.5rem)' : '1rem',
                transitionProperty: 'left',
                transitionTimingFunction: 'cubic-bezier(0.25, 1, 0.5, 1)',
              }}
            >
              <HexagonBlock
                blockType={buttonBlocks.play.type}
                shape={config[buttonBlocks.play.type].shape}
                isSolved={animatingId === 'play'}
                colors={{
                  text: buttonBlocks.play.textClass,
                  border: buttonBlocks.play.borderClass,
                  shadow: buttonBlocks.play.neonClass,
                  blockFill: buttonBlocks.play.bgClass,
                  solidFill: buttonBlocks.play.textClass,
                }}
                className="w-full h-full"
              />
            </div>
          </button>

          {/* PUZZLE MAKER BUTTON */}
          <button
            disabled={animatingId !== null}
            onClick={() => handleBtnClick('puzzle-maker', () => onSelectPuzzleMaker?.())}
            className="relative flex items-center justify-between w-full h-14 px-4 rounded-2xl border border-purple-500/30 bg-purple-950/20 hover:border-purple-400 hover:bg-purple-950/30 active:scale-[0.99] transition-all select-none group cursor-pointer focus:outline-none"
          >
            <div className="w-10 h-10 rounded-xl border border-dashed border-white/10 flex items-center justify-center shrink-0" />
            <div className="flex-1 text-left pl-5">
              <span className="text-lg font-extrabold tracking-wide text-zinc-300 group-hover:text-white transition-colors">
                Puzzle Maker
              </span>
            </div>
            <div className={`w-10 h-10 rounded-xl border-2 border-dashed flex items-center justify-center shrink-0 transition-all ${buttonBlocks['puzzle-maker'].bgClass} ${buttonBlocks['puzzle-maker'].textClass} border-dashed opacity-30 group-hover:opacity-60`} />
            <div
              className="absolute w-10 h-10 flex items-center justify-center duration-[450ms]"
              style={{
                left: animatingId === 'puzzle-maker' ? 'calc(100% - 3.5rem)' : '1rem',
                transitionProperty: 'left',
                transitionTimingFunction: 'cubic-bezier(0.25, 1, 0.5, 1)',
              }}
            >
              <HexagonBlock
                blockType={buttonBlocks['puzzle-maker'].type}
                shape={config[buttonBlocks['puzzle-maker'].type].shape}
                isSolved={animatingId === 'puzzle-maker'}
                colors={{
                  text: buttonBlocks['puzzle-maker'].textClass,
                  border: buttonBlocks['puzzle-maker'].borderClass,
                  shadow: buttonBlocks['puzzle-maker'].neonClass,
                  blockFill: buttonBlocks['puzzle-maker'].bgClass,
                  solidFill: buttonBlocks['puzzle-maker'].textClass,
                }}
                className="w-full h-full"
              />
            </div>
          </button>

          {/* SHOP BUTTON */}
          <button
            disabled={animatingId !== null}
            onClick={() => handleBtnClick('shop', () => onSelectShop?.())}
            className="relative flex items-center justify-between w-full h-14 px-4 rounded-2xl border border-green-500/30 bg-green-950/20 hover:border-green-400 hover:bg-green-950/30 active:scale-[0.99] transition-all select-none group cursor-pointer focus:outline-none"
          >
            <div className="w-10 h-10 rounded-xl border border-dashed border-white/10 flex items-center justify-center shrink-0" />
            <div className="flex-1 text-left pl-5 flex items-center justify-between pr-2">
              <span className="text-lg font-extrabold tracking-wide text-zinc-300 group-hover:text-white transition-colors">
                Shop
              </span>
              {currency > 0 && (
                <span className="text-xs font-mono font-semibold text-green-400 bg-green-950/60 px-2 py-0.5 rounded border border-green-500/30">
                  {currency.toLocaleString()} Shards
                </span>
              )}
            </div>
            <div className={`w-10 h-10 rounded-xl border-2 border-dashed flex items-center justify-center shrink-0 transition-all ${buttonBlocks.shop.bgClass} ${buttonBlocks.shop.textClass} border-dashed opacity-30 group-hover:opacity-60`} />
            <div
              className="absolute w-10 h-10 flex items-center justify-center duration-[450ms]"
              style={{
                left: animatingId === 'shop' ? 'calc(100% - 3.5rem)' : '1rem',
                transitionProperty: 'left',
                transitionTimingFunction: 'cubic-bezier(0.25, 1, 0.5, 1)',
              }}
            >
              <HexagonBlock
                blockType={buttonBlocks.shop.type}
                shape={config[buttonBlocks.shop.type].shape}
                isSolved={animatingId === 'shop'}
                colors={{
                  text: buttonBlocks.shop.textClass,
                  border: buttonBlocks.shop.borderClass,
                  shadow: buttonBlocks.shop.neonClass,
                  blockFill: buttonBlocks.shop.bgClass,
                  solidFill: buttonBlocks.shop.textClass,
                }}
                className="w-full h-full"
              />
            </div>
          </button>

          {/* USER PROFILE BUTTON */}
          <button
            disabled={animatingId !== null}
            onClick={() => handleBtnClick('profile', () => onSelectProfile?.())}
            className="relative flex items-center justify-between w-full h-14 px-4 rounded-2xl border border-orange-500/30 bg-orange-950/20 hover:border-orange-400 hover:bg-orange-950/30 active:scale-[0.99] transition-all select-none group cursor-pointer focus:outline-none"
          >
            <div className="w-10 h-10 rounded-xl border border-dashed border-white/10 flex items-center justify-center shrink-0" />
            <div className="flex-1 text-left pl-5">
              <span className="text-lg font-extrabold tracking-wide text-zinc-300 group-hover:text-white transition-colors">
                User Profile
              </span>
            </div>
            <div className={`w-10 h-10 rounded-xl border-2 border-dashed flex items-center justify-center shrink-0 transition-all ${buttonBlocks.profile.bgClass} ${buttonBlocks.profile.textClass} border-dashed opacity-30 group-hover:opacity-60`} />
            <div
              className="absolute w-10 h-10 flex items-center justify-center duration-[450ms]"
              style={{
                left: animatingId === 'profile' ? 'calc(100% - 3.5rem)' : '1rem',
                transitionProperty: 'left',
                transitionTimingFunction: 'cubic-bezier(0.25, 1, 0.5, 1)',
              }}
            >
              <HexagonBlock
                blockType={buttonBlocks.profile.type}
                shape={config[buttonBlocks.profile.type].shape}
                isSolved={animatingId === 'profile'}
                colors={{
                  text: buttonBlocks.profile.textClass,
                  border: buttonBlocks.profile.borderClass,
                  shadow: buttonBlocks.profile.neonClass,
                  blockFill: buttonBlocks.profile.bgClass,
                  solidFill: buttonBlocks.profile.textClass,
                }}
                className="w-full h-full"
              />
            </div>
          </button>
        </div>
      ) : (
        /* PLAY SUB-MENU VIEW */
        <div className="flex w-full max-w-sm flex-col gap-2.5 animate-fadeIn">
          {/* Back to Main Menu Bar */}
          <button
            onClick={() => setView('main')}
            className="flex items-center gap-2 self-start px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white text-xs font-bold border border-white/10 transition-all cursor-pointer mb-1"
          >
            <span>← Back to Menu</span>
          </button>

          {([
            { id: 'daily', label: 'Daily Puzzle', sub: streak > 0 ? `Streak: ${streak} Days` : 'Featured Challenge' },
            { id: 'slide-match', label: 'Slide Match', sub: '30s Speed Runner' },
            { id: 'weekly', label: 'Weekly Challenge', sub: '500 Shard Contest' },
            { id: 'campaign', label: 'Campaign', sub: 'Progression Tiers' },
            { id: 'community', label: 'Community Stages', sub: 'Player-Crafted Levels' },
          ] as const).map((btn) => (
            <button
              key={btn.id}
              disabled={animatingId !== null}
              onClick={() => {
                const action = () => {
                  if (btn.id === 'slide-match') onSelectSlideMatch?.();
                  else if (btn.id === 'weekly') onSelectWeekly?.();
                  else if (btn.id === 'campaign') onSelectCampaign?.();
                  else if (btn.id === 'community') onSelectCommunity?.();
                  else onSelectDifficulty('daily');
                };
                handleBtnClick(btn.id, action);
              }}
              className={`relative flex items-center justify-between w-full h-14 px-4 rounded-2xl border ${buttonBlocks[btn.id].borderClass} ${buttonBlocks[btn.id].bgClass} hover:bg-white/5 active:bg-white/10 transition-all select-none group cursor-pointer focus:outline-none`}
            >
              {/* Left: Start Slot */}
              <div className="w-10 h-10 rounded-xl border border-dashed border-white/10 flex items-center justify-center shrink-0" />

              {/* Center: Label Text */}
              <div className="flex-1 text-left pl-5 min-w-0">
                <div className="text-base font-extrabold tracking-wide text-zinc-200 group-hover:text-white transition-colors truncate">
                  {btn.label}
                </div>
                <div className={`text-[10px] font-mono ${buttonBlocks[btn.id].textClass} opacity-80 group-hover:opacity-100 truncate`}>
                  {btn.sub}
                </div>
              </div>

              {/* Right: Target Zone */}
              <div className={`w-10 h-10 rounded-xl border-2 border-dashed flex items-center justify-center shrink-0 transition-all ${buttonBlocks[btn.id].bgClass} ${buttonBlocks[btn.id].textClass} border-dashed opacity-30 group-hover:opacity-60`} />

              {/* Sliding Block */}
              <div
                className="absolute w-10 h-10 flex items-center justify-center duration-[450ms]"
                style={{
                  left: animatingId === btn.id ? 'calc(100% - 3.5rem)' : '1rem',
                  transitionProperty: 'left',
                  transitionTimingFunction: 'cubic-bezier(0.25, 1, 0.5, 1)',
                }}
              >
                <HexagonBlock
                  blockType={buttonBlocks[btn.id].type}
                  shape={config[buttonBlocks[btn.id].type].shape}
                  isSolved={animatingId === btn.id}
                  colors={{
                    text: buttonBlocks[btn.id].textClass,
                    border: buttonBlocks[btn.id].borderClass,
                    shadow: buttonBlocks[btn.id].neonClass,
                    blockFill: buttonBlocks[btn.id].bgClass,
                    solidFill: buttonBlocks[btn.id].textClass,
                  }}
                  className="w-full h-full"
                />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* FOOTER UTILITY BUTTONS */}
      <div className="flex flex-col items-center gap-2 mt-2">
        <div className="flex items-center gap-3 text-xs font-mono text-zinc-500">
          <button
            onClick={() => setShowTutorial(true)}
            className="hover:text-zinc-300 transition-colors cursor-pointer"
          >
            How to Play
          </button>
          <span>•</span>
          <button
            onClick={() => setShowPrivacy(true)}
            className="hover:text-zinc-300 transition-colors cursor-pointer"
          >
            Privacy Policy
          </button>
        </div>
      </div>

      {/* TUTORIAL MODAL */}
      {showTutorial && <TutorialModal onClose={() => setShowTutorial(false)} />}

      {/* PRIVACY MODAL */}
      {showPrivacy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-sans">
          <div className="relative w-full max-w-md p-6 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl text-left">
            <h2 className="text-xl font-black text-white mb-2">Privacy Policy</h2>
            <div className="text-xs text-zinc-400 space-y-2 mb-6">
              <p>
                Block Down operates strictly within the Reddit Devvit platform ecosystem. We only store game gameplay telemetry, leaderboard statistics, puzzle progression, and cosmetic inventory tied to your Reddit account.
              </p>
              <p>
                No personally identifiable information is collected or shared with third parties.
              </p>
            </div>
            <button
              onClick={() => setShowPrivacy(false)}
              className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
