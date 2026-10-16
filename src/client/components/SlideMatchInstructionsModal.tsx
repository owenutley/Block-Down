import { cn } from '../utils';

export type SlideMatchInstructionsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onStartGame?: () => void;
  isPreGame?: boolean;
};

export const SlideMatchInstructionsModal = ({
  isOpen,
  onClose,
  onStartGame,
  isPreGame = false,
}: SlideMatchInstructionsModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn select-none">
      <div className="bg-slate-950/95 border border-cyan-500/30 rounded-3xl p-5 sm:p-6 max-w-sm sm:max-w-md w-full text-white shadow-[0_0_50px_rgba(6,182,212,0.25)] flex flex-col gap-4 relative animate-scaleUp">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
              <svg className="w-4 h-4 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black neon-text-title tracking-tight text-white">
                How to Play
              </h2>
              <p className="text-[10px] sm:text-xs text-cyan-300/80 font-mono uppercase tracking-wider">
                Quick Guide
              </p>
            </div>
          </div>
          {!isPreGame && (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center text-base font-bold transition-all cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* 2 Simple Cards: Controls & Goal */}
        <div className="space-y-3 text-left">
          {/* Controls */}
          <div className="p-3.5 bg-slate-900/90 rounded-2xl border border-indigo-500/30 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-950/70 border border-indigo-500/40 text-indigo-300 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-black text-indigo-300 uppercase tracking-wide font-mono">
                Controls
              </h3>
              <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                Swipe any block in the direction you want it to slide, or tap a block to use the on-screen arrows.
              </p>
            </div>
          </div>

          {/* Goal */}
          <div className="p-3.5 bg-slate-900/90 rounded-2xl border border-emerald-500/30 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <circle cx="12" cy="12" r="9" strokeDasharray="3 3" />
                <circle cx="12" cy="12" r="3" fill="currentColor" />
              </svg>
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-black text-emerald-300 uppercase tracking-wide font-mono">
                Goal
              </h3>
              <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                Slide every block onto its matching colored target node to solve the stage.
              </p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-1">
          <button
            onClick={() => {
              onClose();
              if (isPreGame && onStartGame) {
                onStartGame();
              }
            }}
            className={cn(
              'w-full py-3 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider transition-all shadow-lg active:scale-98 cursor-pointer flex items-center justify-center gap-2',
              'bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white shadow-[0_0_25px_rgba(99,102,241,0.4)] border border-cyan-300/50'
            )}
          >
            <span>{isPreGame ? 'Play Now!' : 'Got it!'}</span>
            <span className="text-base">&rarr;</span>
          </button>
        </div>
      </div>
    </div>
  );
};
