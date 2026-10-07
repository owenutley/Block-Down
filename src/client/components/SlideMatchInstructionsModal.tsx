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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn select-none">
      <div className="bg-slate-900 border border-cyan-500/40 rounded-3xl p-5 sm:p-7 max-w-lg w-full text-white shadow-[0_0_40px_rgba(6,182,212,0.25)] flex flex-col gap-4 relative animate-scaleUp max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">⚡</span>
            <div>
              <h2 className="text-xl sm:text-2xl font-black neon-text-title tracking-tight text-white">
                How to Play Slide Match
              </h2>
              <p className="text-[11px] sm:text-xs text-cyan-300/80 font-mono">
                Endless 30-Second Speed Rush
              </p>
            </div>
          </div>
          {!isPreGame && (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-gray-400 hover:text-white flex items-center justify-center text-sm font-bold transition-all cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Instruction Cards */}
        <div className="space-y-3 text-left">
          {/* Card 1: Block Physics */}
          <div className="p-3.5 bg-slate-800/80 rounded-2xl border border-slate-700/60 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 flex items-center justify-center text-lg font-bold shrink-0">
              🧊
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-black text-cyan-200">1. Frictionless Sliding Physics</h3>
              <p className="text-[11px] sm:text-xs text-gray-300 mt-0.5 leading-relaxed">
                There is <strong>no player character</strong>! You control the colored blocks directly. When slid, a block moves continuously in that direction until it hits a <strong>wall</strong>, the <strong>board boundary</strong>, or <strong>another block</strong>.
              </p>
            </div>
          </div>

          {/* Card 2: Controls */}
          <div className="p-3.5 bg-slate-800/80 rounded-2xl border border-slate-700/60 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/40 text-indigo-300 flex items-center justify-center text-lg font-bold shrink-0">
              👆
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-black text-indigo-200">2. Swipe or Tap Controls</h3>
              <p className="text-[11px] sm:text-xs text-gray-300 mt-0.5 leading-relaxed">
                • <strong>Swipe Gestures</strong>: Swipe directly on any block in the direction you want it to slide.
                <br />
                • <strong>Tap / Click</strong>: Tap a block to highlight it, then tap the directional arrows (or press Arrow Keys / WASD).
              </p>
            </div>
          </div>

          {/* Card 3: The Objective */}
          <div className="p-3.5 bg-slate-800/80 rounded-2xl border border-slate-700/60 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center justify-center text-lg font-bold shrink-0">
              🎯
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-black text-emerald-200">3. Match Target Nodes</h3>
              <p className="text-[11px] sm:text-xs text-gray-300 mt-0.5 leading-relaxed">
                Slide every colored block onto its <strong>matching colored target circle</strong>. When all colored blocks rest on their matching targets, the puzzle is cleared!
              </p>
            </div>
          </div>

          {/* Card 4: 30-Second Speed Rush */}
          <div className="p-3.5 bg-slate-800/80 rounded-2xl border border-amber-500/40 bg-amber-950/20 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 flex items-center justify-center text-lg font-bold shrink-0">
              ⏱️
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-black text-amber-200">4. The 30-Second Countdown</h3>
              <p className="text-[11px] sm:text-xs text-gray-300 mt-0.5 leading-relaxed">
                You have <strong>30.0 seconds per puzzle</strong>! Solving a puzzle resets the timer back to 30.0s and advances to the next stage. If time reaches 0.0s, the run ends!
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Button */}
        <div className="pt-2">
          <button
            onClick={() => {
              onClose();
              if (isPreGame && onStartGame) {
                onStartGame();
              }
            }}
            className={cn(
              'w-full py-3.5 rounded-2xl font-black text-sm uppercase tracking-wider transition-all shadow-lg active:scale-98 cursor-pointer flex items-center justify-center gap-2',
              isPreGame
                ? 'bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white shadow-[0_0_25px_rgba(6,182,212,0.4)] border border-cyan-300/50'
                : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.3)]'
            )}
          >
            <span>{isPreGame ? '🚀 Start Endless Run' : 'Got it, Resume!'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
