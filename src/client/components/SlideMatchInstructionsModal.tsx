import { PuzzleShape } from './PuzzleShape';
import { HexagonBlock } from './HexagonBlock';
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
      <div className="bg-slate-950/90 border border-cyan-500/40 rounded-3xl p-5 sm:p-6 max-w-lg w-full text-white shadow-[0_0_50px_rgba(6,182,212,0.25)] flex flex-col gap-4 relative animate-scaleUp max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
              <svg className="w-5 h-5 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black neon-text-title tracking-tight text-white">
                How to Play Slide Match
              </h2>
              <p className="text-[11px] sm:text-xs text-cyan-300/80 font-mono uppercase tracking-wider">
                Endless 30-Second Speed Rush
              </p>
            </div>
          </div>
          {!isPreGame && (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center text-base font-bold transition-all cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Instruction Cards */}
        <div className="space-y-2.5 text-left">
          {/* Card 1: Block Physics */}
          <div className="p-3 bg-slate-900/80 rounded-2xl border border-cyan-500/30 flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center shrink-0 p-1">
              <HexagonBlock blockType="cyan-diamond" colorId="cyan" baseThemeId="neon" shape="diamond" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-black text-cyan-300">1. Frictionless Sliding Physics</h3>
              <p className="text-[11px] sm:text-xs text-gray-300 mt-0.5 leading-relaxed">
                There is <strong>no player character</strong>! You control the colored blocks directly. When slid, a block moves continuously until it hits a <strong>wall</strong>, the <strong>boundary</strong>, or <strong>another block</strong>.
              </p>
            </div>
          </div>

          {/* Card 2: Controls */}
          <div className="p-3 bg-slate-900/80 rounded-2xl border border-indigo-500/30 flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-950/60 border border-indigo-500/40 text-indigo-300 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-black text-indigo-300">2. Swipe or Tap Controls</h3>
              <p className="text-[11px] sm:text-xs text-gray-300 mt-0.5 leading-relaxed">
                • <strong>Swipe Gestures</strong>: Swipe directly on any block in the direction you want it to slide.
                <br />
                • <strong>Tap / Click</strong>: Tap a block to select it, then use the color-matching arrow pad (or Arrow Keys / WASD). Selection persists between slides.
              </p>
            </div>
          </div>

          {/* Card 3: The Objective */}
          <div className="p-3 bg-slate-900/80 rounded-2xl border border-emerald-500/30 flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <circle cx="12" cy="12" r="9" strokeDasharray="3 3" />
                <circle cx="12" cy="12" r="3" fill="currentColor" />
              </svg>
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-black text-emerald-300">3. Match Target Nodes</h3>
              <p className="text-[11px] sm:text-xs text-gray-300 mt-0.5 leading-relaxed">
                Slide every colored block onto its <strong>matching colored target circle</strong>. When all blocks illuminate on their matching targets, the puzzle is solved!
              </p>
            </div>
          </div>

          {/* Card 4: 30-Second Speed Rush */}
          <div className="p-3 bg-slate-900/80 rounded-2xl border border-amber-500/30 bg-amber-950/20 flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-950/60 border border-amber-500/40 text-amber-300 flex items-center justify-center shrink-0">
              <PuzzleShape shape="pocket_watch" className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-black text-amber-300">4. The 30-Second Countdown</h3>
              <p className="text-[11px] sm:text-xs text-gray-300 mt-0.5 leading-relaxed">
                You have <strong>30.0 seconds per puzzle</strong>! Solving resets the timer back to 30.0s and earns time bonus points. If time reaches 0.0s, the run concludes.
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
              'bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white shadow-[0_0_25px_rgba(99,102,241,0.4)] border border-cyan-300/50'
            )}
          >
            <span>{isPreGame ? 'Start Endless Run' : 'Got it, Resume!'}</span>
            <span className="text-base">&rarr;</span>
          </button>
        </div>
      </div>
    </div>
  );
};
