import { useState } from 'react';
import { StoryDialogue } from '../../shared/story';

export type StoryDialogueModalProps = {
  dialogue: StoryDialogue | null;
  onClose: () => void;
};

export const StoryDialogueModal = ({ dialogue, onClose }: StoryDialogueModalProps) => {
  const [lineIndex, setLineIndex] = useState(0);

  if (!dialogue) return null;

  const currentLine = dialogue.lines[lineIndex];
  const isLastLine = lineIndex >= dialogue.lines.length - 1;

  const handleNext = () => {
    if (isLastLine) {
      onClose();
    } else {
      setLineIndex((prev) => prev + 1);
    }
  };

  const getSpeakerColor = (speaker: string) => {
    switch (speaker) {
      case 'ECHO-7':
        return 'text-cyan-400 border-cyan-500/40 bg-cyan-950/80';
      case 'Frost Bot':
        return 'text-sky-300 border-sky-500/40 bg-sky-950/80';
      case 'Forest Bot':
        return 'text-emerald-400 border-emerald-500/40 bg-emerald-950/80';
      default:
        return 'text-amber-400 border-amber-500/40 bg-amber-950/80';
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="relative w-full max-w-lg bg-zinc-950 border-2 border-cyan-500/60 rounded-3xl p-5 sm:p-6 shadow-[0_0_40px_rgba(6,182,212,0.35)] overflow-hidden flex flex-col gap-4 text-left">
        {/* Retro CRT Scanline Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent pointer-events-none opacity-40" />

        {/* Header Terminal Tag */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
            <span className="text-[10px] font-mono font-bold tracking-widest text-cyan-300 uppercase">
              {dialogue.title}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-[11px] font-mono font-bold text-zinc-400 hover:text-white px-2 py-0.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
          >
            SKIP [ESC]
          </button>
        </div>

        {/* Speaker Badge & Body */}
        {currentLine && (
          <div className="flex flex-col gap-3 min-h-[90px] justify-center">
            <div className="flex items-center gap-2">
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-black border uppercase tracking-wider ${getSpeakerColor(
                  currentLine.speaker
                )}`}
              >
                {currentLine.speaker}
              </span>
            </div>
            <p className="text-sm sm:text-base font-medium text-zinc-100 leading-relaxed font-sans">
              &ldquo;{currentLine.text}&rdquo;
            </p>
          </div>
        )}

        {/* Bottom Navigation */}
        <div className="flex items-center justify-between pt-2 border-t border-white/10 mt-1">
          <div className="flex items-center gap-1.5">
            {dialogue.lines.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === lineIndex ? 'w-6 bg-cyan-400' : 'w-2 bg-white/20'
                }`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs sm:text-sm tracking-wide shadow-[0_0_15px_rgba(6,182,212,0.6)] hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
          >
            <span>{isLastLine ? 'ENTER CHAMBER' : 'NEXT'}</span>
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
