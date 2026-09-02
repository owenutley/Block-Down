import { ThemeId, getThemeBgClass, Theme, ThemeConfig } from '../../shared/themes';

export const PuzzleMakerScreen = ({
  onReturnToMenu,
  activeTheme = 'neon',
  activeThemeStyle,
}: {
  onReturnToMenu: () => void;
  activeTheme?: ThemeId;
  activeThemeStyle?: Theme | undefined;
  themeConfig?: ThemeConfig | undefined;
}) => {
  const bgClass = getThemeBgClass(activeTheme, activeThemeStyle);

  return (
    <div className={`relative flex min-h-screen flex-col items-center justify-center gap-6 ${bgClass} px-4 py-8 select-none transition-colors duration-500`}>
      {/* Return to Menu Button */}
      <button
        onClick={onReturnToMenu}
        className="absolute top-4 left-4 z-50 px-4 py-2 bg-black/60 backdrop-blur-md border border-cyan-500/30 text-white rounded-xl font-bold text-xs sm:text-sm transition-all hover:scale-105 active:scale-95 shadow-md cursor-pointer flex items-center gap-2"
      >
        <span>← Back to Menu</span>
      </button>

      {/* Main Glass Panel */}
      <div className="glass-panel max-w-md w-full p-8 rounded-3xl border border-cyan-500/30 text-white relative animate-float shadow-[0_0_50px_rgba(6,182,212,0.25)] flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-3xl mb-4 shadow-[0_0_20px_rgba(168,85,247,0.4)]">
          🎨
        </div>

        <h1 className="text-3xl sm:text-4xl font-black neon-text-title tracking-tight mb-2">
          Puzzle Maker
        </h1>

        <div className="inline-block px-4 py-1 rounded-full bg-purple-500/20 border border-purple-400/40 text-purple-300 text-xs font-mono font-bold uppercase tracking-widest my-3 shadow-[0_0_12px_rgba(168,85,247,0.3)]">
          Coming Soon
        </div>

        <p className="text-sm text-zinc-400 max-w-xs mt-2 leading-relaxed">
          Create and share your own custom Block Down levels with the community! Stay tuned for updates.
        </p>

        <button
          onClick={onReturnToMenu}
          className="w-full mt-8 rounded-2xl theme-btn py-3 text-base font-bold transition-all hover:scale-102 active:scale-98 shadow-lg cursor-pointer"
        >
          Return to Menu
        </button>
      </div>
    </div>
  );
};
