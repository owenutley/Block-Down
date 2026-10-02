import { useState, useEffect } from 'react';
import { trpc } from '../trpc';
import { GameDifficulty } from '../types';
import { PuzzleShape } from '../components/PuzzleShape';
import { HexagonBlock } from '../components/HexagonBlock';
import { ThemeId, DEFAULT_THEME_CONFIGS, ThemeConfig, getBaseThemeId, getThemeBgClass, Theme } from '../../shared/themes';
import { TutorialModal } from '../components/TutorialModal';

const buttonBlocks: Record<'play' | 'daily' | 'weekly' | 'campaign' | 'community' | 'puzzle-maker' | 'shop' | 'profile', { type: keyof ThemeConfig; colorClass: string; neonClass: string; textClass: string; bgClass: string; borderClass: string }> = {
  play: {
    type: 'blue-diamond',
    colorClass: 'border-cyan-500 bg-cyan-500/10',
    neonClass: 'shadow-[0_0_15px_rgba(6,182,212,0.6)] neon-blue',
    textClass: 'text-cyan-400',
    bgClass: 'bg-cyan-950/30',
    borderClass: 'border-cyan-500/60 group-hover:border-cyan-400'
  },
  daily: {
    type: 'blue-diamond',
    colorClass: 'border-blue-500 bg-blue-500/10',
    neonClass: 'shadow-[0_0_15px_rgba(59,130,246,0.6)] neon-blue',
    textClass: 'text-blue-400',
    bgClass: 'bg-blue-950/30',
    borderClass: 'border-blue-500/60 group-hover:border-blue-400'
  },
  weekly: {
    type: 'green-cross',
    colorClass: 'border-emerald-500 bg-emerald-500/10',
    neonClass: 'shadow-[0_0_15px_rgba(16,185,129,0.6)] neon-green',
    textClass: 'text-emerald-400',
    bgClass: 'bg-emerald-950/30',
    borderClass: 'border-emerald-500/60 group-hover:border-emerald-400'
  },
  campaign: {
    type: 'yellow-crescent',
    colorClass: 'border-yellow-400 bg-yellow-400/10',
    neonClass: 'shadow-[0_0_15px_rgba(250,204,21,0.6)] neon-yellow',
    textClass: 'text-yellow-400',
    bgClass: 'bg-yellow-950/30',
    borderClass: 'border-yellow-500/60 group-hover:border-yellow-400'
  },
  community: {
    type: 'red-heart',
    colorClass: 'border-red-500 bg-red-500/10',
    neonClass: 'shadow-[0_0_15px_rgba(239,68,68,0.6)] neon-red',
    textClass: 'text-red-400',
    bgClass: 'bg-red-950/30',
    borderClass: 'border-red-500/60 group-hover:border-red-400'
  },
  'puzzle-maker': {
    type: 'purple-circle',
    colorClass: 'border-purple-500 bg-purple-500/10',
    neonClass: 'shadow-[0_0_15px_rgba(168,85,247,0.6)] neon-purple',
    textClass: 'text-purple-400',
    bgClass: 'bg-purple-950/30',
    borderClass: 'border-purple-500/60 group-hover:border-purple-400'
  },
  shop: {
    type: 'green-cross',
    colorClass: 'border-green-500 bg-green-500/10',
    neonClass: 'shadow-[0_0_15px_rgba(34,197,94,0.6)] neon-green',
    textClass: 'text-green-400',
    bgClass: 'bg-green-950/30',
    borderClass: 'border-green-500/60 group-hover:border-green-400'
  },
  profile: {
    type: 'orange-square',
    colorClass: 'border-orange-500 bg-orange-500/10',
    neonClass: 'shadow-[0_0_15px_rgba(249,115,22,0.6)] neon-orange',
    textClass: 'text-orange-400',
    bgClass: 'bg-orange-950/30',
    borderClass: 'border-orange-500/60 group-hover:border-orange-400'
  }
};

export interface MenuProps {
  onSelectDifficulty: (difficulty: GameDifficulty) => void;
  onSelectWeekly?: () => void;
  onSelectCampaign?: () => void;
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
    <div className={`relative flex min-h-screen flex-col items-center justify-center gap-4 sm:gap-5 ${bgClass} px-4 py-6 transition-colors duration-500`}>
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
          {view === 'main' ? 'Tactile Hexagonal Puzzle Arcade' : 'Select Game Mode'}
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
                Daily, Weekly, Campaign & Community
              </div>
            </div>

            {/* Right: Target Zone */}
            <div className={`w-10 h-10 rounded-xl border-2 border-dashed flex items-center justify-center shrink-0 transition-all ${buttonBlocks.play.bgClass} ${buttonBlocks.play.textClass} border-dashed opacity-40 group-hover:opacity-80`}>
              <PuzzleShape shape={config[buttonBlocks.play.type].shape} className="w-1/2 h-1/2 opacity-30" />
            </div>

            {/* Sliding Block */}
            <div
              className="absolute w-10 h-10 flex items-center justify-center duration-[450ms]"
              style={{
                left: animatingId === 'play' ? 'calc(100% - 3.5rem)' : '1rem',
                transitionProperty: 'left',
                transitionTimingFunction: 'cubic-bezier(0.25, 1, 0.5, 1)'
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
            <div className={`w-10 h-10 rounded-xl border-2 border-dashed flex items-center justify-center shrink-0 transition-all ${buttonBlocks['puzzle-maker'].bgClass} ${buttonBlocks['puzzle-maker'].textClass} border-dashed opacity-30 group-hover:opacity-60`}>
              <PuzzleShape shape={config[buttonBlocks['puzzle-maker'].type].shape} className="w-1/2 h-1/2 opacity-25" />
            </div>
            <div
              className="absolute w-10 h-10 flex items-center justify-center duration-[450ms]"
              style={{
                left: animatingId === 'puzzle-maker' ? 'calc(100% - 3.5rem)' : '1rem',
                transitionProperty: 'left',
                transitionTimingFunction: 'cubic-bezier(0.25, 1, 0.5, 1)'
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
            <div className={`w-10 h-10 rounded-xl border-2 border-dashed flex items-center justify-center shrink-0 transition-all ${buttonBlocks.shop.bgClass} ${buttonBlocks.shop.textClass} border-dashed opacity-30 group-hover:opacity-60`}>
              <PuzzleShape shape={config[buttonBlocks.shop.type].shape} className="w-1/2 h-1/2 opacity-25" />
            </div>
            <div
              className="absolute w-10 h-10 flex items-center justify-center duration-[450ms]"
              style={{
                left: animatingId === 'shop' ? 'calc(100% - 3.5rem)' : '1rem',
                transitionProperty: 'left',
                transitionTimingFunction: 'cubic-bezier(0.25, 1, 0.5, 1)'
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
            <div className={`w-10 h-10 rounded-xl border-2 border-dashed flex items-center justify-center shrink-0 transition-all ${buttonBlocks.profile.bgClass} ${buttonBlocks.profile.textClass} border-dashed opacity-30 group-hover:opacity-60`}>
              <PuzzleShape shape={config[buttonBlocks.profile.type].shape} className="w-1/2 h-1/2 opacity-25" />
            </div>
            <div
              className="absolute w-10 h-10 flex items-center justify-center duration-[450ms]"
              style={{
                left: animatingId === 'profile' ? 'calc(100% - 3.5rem)' : '1rem',
                transitionProperty: 'left',
                transitionTimingFunction: 'cubic-bezier(0.25, 1, 0.5, 1)'
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
            { id: 'weekly', label: 'Weekly Challenge', sub: '500 Shard Contest' },
            { id: 'campaign', label: 'Campaign', sub: 'Progression Tiers' },
            { id: 'community', label: 'Community Stages', sub: 'Player-Crafted Levels' },
          ] as const).map(btn => (
            <button
              key={btn.id}
              disabled={animatingId !== null}
              onClick={() => {
                const action = () => {
                  if (btn.id === 'weekly') onSelectWeekly?.();
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
              <div className={`w-10 h-10 rounded-xl border-2 border-dashed flex items-center justify-center shrink-0 transition-all ${buttonBlocks[btn.id].bgClass} ${buttonBlocks[btn.id].textClass} border-dashed opacity-30 group-hover:opacity-60`}>
                <PuzzleShape shape={config[buttonBlocks[btn.id].type].shape} className="w-1/2 h-1/2 opacity-25" />
              </div>

              {/* Sliding Block */}
              <div
                className="absolute w-10 h-10 flex items-center justify-center duration-[450ms]"
                style={{
                  left: animatingId === btn.id ? 'calc(100% - 3.5rem)' : '1rem',
                  transitionProperty: 'left',
                  transitionTimingFunction: 'cubic-bezier(0.25, 1, 0.5, 1)'
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
        <button
          onClick={() => setShowTutorial(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl theme-btn font-extrabold text-sm text-cyan-300 border-cyan-500/40 hover:border-cyan-400 hover:scale-102 active:scale-98 shadow-md cursor-pointer transition-all"
        >
          <span>How to Play</span>
        </button>

        <button
          onClick={() => setShowPrivacy(true)}
          className="text-xs text-zinc-500 hover:text-zinc-300 underline transition-colors cursor-pointer"
        >
          Privacy & Data Practices
        </button>
      </div>

      {/* Modals */}
      {showTutorial && <TutorialModal onClose={() => setShowTutorial(false)} />}

      {showPrivacy && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md px-4 pointer-events-auto">
          <div className="glass-panel max-w-lg w-full p-6 rounded-3xl border border-cyan-500/30 text-white relative animate-float shadow-[0_0_50px_rgba(6,182,212,0.25)] text-left">
            <button
              onClick={() => setShowPrivacy(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white text-2xl font-black cursor-pointer bg-white/5 hover:bg-white/10 rounded-full w-8 h-8 flex items-center justify-center transition-all"
            >
              ×
            </button>
            <div className="text-center mb-5">
              <div className="inline-block px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-xs font-mono font-bold uppercase tracking-widest">
                Privacy Disclosure
              </div>
              <h2 className="text-2xl font-black neon-text-title tracking-tight mt-2">Privacy & Data Practices</h2>
              <p className="text-xs text-zinc-400 font-mono uppercase tracking-widest mt-1">Transparency Disclosure</p>
            </div>

            <div className="max-h-[350px] overflow-y-auto space-y-4 pr-1 text-sm text-zinc-300 leading-relaxed font-sans scrollbar-thin">
              <div>
                <h3 className="font-extrabold text-white text-sm flex items-center gap-1.5 mb-1 text-cyan-400">
                  <span>✦</span> 1. Data Storage & Hosting
                </h3>
                <p className="text-xs text-zinc-400 pl-4">
                  All game progression data is stored directly on Reddit's official serverless Redis platform.
                  We <strong>do not</strong> host or transmit any user data to third-party databases, external servers, or tracking networks.
                </p>
              </div>

              <div>
                <h3 className="font-extrabold text-white text-sm flex items-center gap-1.5 mb-1 text-cyan-400">
                  <span>✦</span> 2. Collected Data Fields
                </h3>
                <ul className="list-disc list-inside text-xs text-zinc-400 pl-4 space-y-0.5">
                  <li><strong>Reddit Username:</strong> Associated with game progress and custom record listings.</li>
                  <li><strong>Game Progress:</strong> Saved campaign level index and daily puzzle completions.</li>
                  <li><strong>Scores & Stats:</strong> Move counts, push counts, and solve times for leaderboard qualification.</li>
                  <li><strong>Theme Inventory:</strong> Purchases and equipping status of cosmetic shop themes.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-extrabold text-white text-sm flex items-center gap-1.5 mb-1 text-cyan-400">
                  <span>✦</span> 3. Player Score & Post Comments
                </h3>
                <p className="text-xs text-zinc-400 pl-4">
                  Posting score comments and sharing custom puzzle challenges triggers standard Reddit actions on your behalf only when explicitly authorized by you using Devvit permissions.
                </p>
              </div>

              <div>
                <h3 className="font-extrabold text-white text-sm flex items-center gap-1.5 mb-1 text-cyan-400">
                  <span>✦</span> 4. Security & Breaches
                </h3>
                <p className="text-xs text-zinc-400 pl-4">
                  As our database is hosted within Reddit's ecosystem, we rely on Reddit's infrastructure security.
                  If a developer compromise or security issue is discovered, we will notify Reddit and users immediately.
                </p>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => setShowPrivacy(false)}
                className="w-full rounded-2xl theme-btn py-3 text-base font-bold transition-all hover:scale-102 active:scale-98 shadow-lg cursor-pointer"
              >
                Accept & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
