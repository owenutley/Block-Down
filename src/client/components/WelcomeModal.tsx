export const WelcomeModal = ({
  onPlayNow,
  onHowToPlay,
}: {
  onPlayNow: () => void;
  onHowToPlay: () => void;
}) => {
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/85 backdrop-blur-md px-3 sm:px-4 py-4 pointer-events-auto overflow-y-auto">
      <div className="glass-panel max-w-md w-full p-6 sm:p-8 rounded-3xl border border-cyan-500/40 text-white relative animate-float shadow-[0_0_50px_rgba(6,182,212,0.25)] flex flex-col items-center text-center my-auto">
        <div className="mb-4">
          <h1 className="text-3xl sm:text-4xl font-black neon-text-title tracking-tight drop-shadow-md">
            BLOCK DOWN
          </h1>
          <p className="text-xs text-cyan-400 font-mono uppercase tracking-widest mt-1">
            Slide, Push & Conquer
          </p>
        </div>

        <p className="text-sm text-zinc-200 font-medium mb-6 leading-relaxed max-w-xs">
          Welcome to Block Down! Push all blocks onto their matching target zones to solve the puzzle.
        </p>

        {/* Action Buttons: How to play & Play Now */}
        <div className="flex flex-col gap-3 w-full">
          <button
            onClick={onPlayNow}
            className="w-full rounded-2xl theme-btn py-3.5 text-base font-extrabold transition-all hover:scale-102 active:scale-98 shadow-lg cursor-pointer"
          >
            Play Now
          </button>

          <button
            onClick={onHowToPlay}
            className="w-full rounded-2xl bg-white/10 hover:bg-white/15 border border-white/20 py-3 text-sm font-bold transition-all text-zinc-200 hover:text-white cursor-pointer"
          >
            How to play
          </button>
        </div>
      </div>
    </div>
  );
};
