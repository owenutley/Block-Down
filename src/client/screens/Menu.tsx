import { useState, useEffect } from 'react';
import { trpc } from '../trpc';
import { GameDifficulty, BlockType } from '../types';
import { PuzzleShape } from '../components/PuzzleShape';
import { ThemeId, DEFAULT_THEME_CONFIGS, ThemeConfig, getBaseThemeId, getThemeBgClass, Theme } from '../../shared/themes';

const buttonBlocks: Record<'daily' | 'campaign' | 'past-puzzles' | 'shop', { type: BlockType; colorClass: string; neonClass: string; textClass: string; bgClass: string; borderClass: string }> = {
  daily: {
    type: 'blue-diamond',
    colorClass: 'border-blue-500 bg-blue-500/10',
    neonClass: 'shadow-[0_0_15px_rgba(59,130,246,0.6)] neon-blue',
    textClass: 'text-blue-500',
    bgClass: 'bg-blue-950/20',
    borderClass: 'border-blue-500/60 group-hover:border-blue-500'
  },
  campaign: {
    type: 'yellow-crescent',
    colorClass: 'border-yellow-400 bg-yellow-400/10',
    neonClass: 'shadow-[0_0_15px_rgba(250,204,21,0.6)] neon-yellow',
    textClass: 'text-yellow-400',
    bgClass: 'bg-yellow-950/20',
    borderClass: 'border-yellow-400/60 group-hover:border-yellow-400'
  },
  'past-puzzles': {
    type: 'purple-circle',
    colorClass: 'border-purple-500 bg-purple-500/10',
    neonClass: 'shadow-[0_0_15px_rgba(168,85,247,0.6)] neon-purple',
    textClass: 'text-purple-500',
    bgClass: 'bg-purple-950/20',
    borderClass: 'border-purple-500/60 group-hover:border-purple-500'
  },
  shop: {
    type: 'green-cross',
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
  onSelectMod,
  activeTheme: _activeTheme = 'neon',
  activeThemeStyle,
  themeConfig
}: {
  onSelectDifficulty: (difficulty: GameDifficulty) => void;
  onSelectCampaign?: () => void;
  onSelectPastPuzzles?: () => void;
  onSelectShop?: () => void;
  onSelectMod?: () => void;
  activeTheme?: ThemeId;
  activeThemeStyle?: Theme | undefined;
  themeConfig?: ThemeConfig | undefined;
}) => {
  const baseTheme = getBaseThemeId(_activeTheme);
  const config = themeConfig || DEFAULT_THEME_CONFIGS[baseTheme] || DEFAULT_THEME_CONFIGS.neon;
  const [isMod, setIsMod] = useState(false);
  const [checkingMod, setCheckingMod] = useState(true);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [animatingId, setAnimatingId] = useState<string | null>(null);

  useEffect(() => {
    const checkModStatus = async () => {
      try {
        const result = await trpc.admin.checkAuth.query();
        setIsMod(result.isAdmin);
      } catch (error) {
        setIsMod(false);
      } finally {
        setCheckingMod(false);
      }
    };

    void checkModStatus();
  }, []);

  const handleBtnClick = (btnId: string, action: () => void) => {
    if (animatingId) return; // Prevent double clicks
    setAnimatingId(btnId);
    setTimeout(() => {
      action();
      setAnimatingId(null);
    }, 450); // Matches transition duration
  };

  const bgClass = getThemeBgClass(_activeTheme, activeThemeStyle);

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
              <PuzzleShape shape={config[buttonBlocks[btn.id].type].shape} className="w-1/2 h-1/2 opacity-25" />
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
                shape={config[buttonBlocks[btn.id].type].shape}
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

      {/* Mod Panel Button - Top Right */}
      {!checkingMod && isMod && (
        <div className="absolute top-14 right-4 sm:top-16 sm:right-6">
          <button
            onClick={() => onSelectMod?.()}
            className="px-4 py-2 theme-btn rounded-lg font-bold text-sm flex items-center gap-2"
            title="Moderator Panel"
          >
            <span>Mod Panel</span>
          </button>
        </div>
      )}

      {/* Privacy and Data Practices link */}
      <div className="mt-4">
        <button
          onClick={() => setShowPrivacy(true)}
          className="text-xs text-zinc-500 hover:text-zinc-300 underline transition-colors cursor-pointer"
        >
          Privacy & Data Practices
        </button>
      </div>

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
              <span className="text-4xl">🔒</span>
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
                  <span>✦</span> 3. Subreddit Subscription
                </h3>
                <p className="text-xs text-zinc-400 pl-4">
                  The subscription check and button only trigger standard Reddit actions using Devvit permissions. 
                  Subscribing is completely optional and rewards you with Neon Shards in-game.
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
