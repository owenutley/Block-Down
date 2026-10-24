import { useState, useEffect } from 'react';
import { HexagonBlock } from './HexagonBlock';
import { cn } from '../utils';

const DEFAULT_STATUS_MESSAGES = [
  'CALIBRATING GRID SECTOR...',
  'CALCULATING OPTIMAL PAR...',
  'CHARGING NEON PORTALS...',
  'ALIGNING ICE TRAJECTORY...',
  'SYNCHRONIZING DAILY ROUTE...',
];

export type SplashLoaderProps = {
  message?: string;
  statusMessages?: string[];
  fullScreen?: boolean;
  compact?: boolean;
  className?: string;
  subText?: string;
  themeClass?: string;
};

export const SplashLoader = ({
  message,
  statusMessages,
  fullScreen = false,
  compact = false,
  className,
  subText,
  themeClass,
}: SplashLoaderProps = {}) => {
  const activeMessages = statusMessages && statusMessages.length > 0
    ? statusMessages
    : message
      ? [message]
      : DEFAULT_STATUS_MESSAGES;

  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    if (activeMessages.length <= 1) return;
    const timer = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % activeMessages.length);
    }, 1800);
    return () => clearInterval(timer);
  }, [activeMessages.length]);

  const currentMessage = message || activeMessages[msgIndex % activeMessages.length];

  const content = (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 sm:gap-3.5 select-none animate-fadeIn',
        className
      )}
    >
      {/* Mini 3x3 Quantum Slide Circuit Board */}
      <div
        className={cn(
          'relative p-2.5 rounded-2xl bg-slate-950/90 border border-cyan-500/40 shadow-[0_0_25px_rgba(6,182,212,0.25)] backdrop-blur-md',
          compact && 'scale-[0.85] -my-2'
        )}
      >
        {/* Subtle grid mesh background */}
        <div className="relative grid grid-cols-3 grid-rows-3 gap-1.5 w-[168px] h-[168px] sm:w-[186px] sm:h-[186px]">
          {/* Cell (0,0): Start Zone with faint entry arrow */}
          <div className="relative aspect-square rounded-xl bg-cyan-950/40 border border-cyan-500/20 flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-cyan-500/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </div>

          {/* Cell (1,0): Ice Floor Cell */}
          <div className="relative aspect-square rounded-xl bg-cyan-950/30 border border-cyan-500/15" />

          {/* Cell (2,0): 3D Wall Obstacle with cyber bevel */}
          <div className="relative aspect-square rounded-xl bg-slate-900 border border-slate-700/60 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.85)] flex items-center justify-center">
            <div className="w-5 h-5 rounded-lg border border-slate-600/40 bg-slate-800/80" />
          </div>

          {/* Cell (0,1): Ice Floor Cell */}
          <div className="relative aspect-square rounded-xl bg-cyan-950/30 border border-cyan-500/15" />

          {/* Cell (1,1): Purple Portal (Entrance) */}
          <div className="relative aspect-square rounded-xl bg-purple-950/40 border border-purple-500/40 flex items-center justify-center overflow-hidden">
            <div className="absolute inset-1 rounded-full border-2 border-dashed border-purple-400 animate-spin" style={{ animationDuration: '4s' }} />
            <svg className="w-4 h-4 text-purple-300 relative z-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>

          {/* Cell (2,1): Ice Floor Cell */}
          <div className="relative aspect-square rounded-xl bg-cyan-950/30 border border-cyan-500/15" />

          {/* Cell (0,2): Cyan Portal (Exit) */}
          <div className="relative aspect-square rounded-xl bg-cyan-950/40 border border-cyan-400/40 flex items-center justify-center overflow-hidden">
            <div className="absolute inset-1 rounded-full border-2 border-dashed border-cyan-400 animate-spin" style={{ animationDuration: '4s', animationDirection: 'reverse' }} />
            <svg className="w-4 h-4 text-cyan-300 relative z-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </div>

          {/* Cell (1,2): Ice Floor Cell */}
          <div className="relative aspect-square rounded-xl bg-cyan-950/30 border border-cyan-500/15" />

          {/* Cell (2,2): Emerald Target Slot */}
          <div className="relative aspect-square rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-center p-1.5 overflow-visible">
            <div className="w-full h-full rounded-full border-2 border-dashed border-emerald-400/70 flex items-center justify-center animate-pulse">
              <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            </div>
            {/* Docking ripple ring */}
            <div className="absolute inset-0 rounded-full border-2 border-emerald-400 pointer-events-none animate-splash-target-ring" />
          </div>

          {/* Animated Quantum Sliding Block Layer */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="animate-splash-quantum w-[50px] h-[50px] sm:w-[56px] sm:h-[56px]">
              <HexagonBlock
                blockType="blue-diamond"
                shape="diamond"
                className="w-full h-full filter drop-shadow-[0_0_12px_rgba(6,182,212,0.85)]"
              />
            </div>
          </div>
        </div>

        {/* Ambient Corner Bracket Accents */}
        <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-cyan-400 pointer-events-none" />
        <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-cyan-400 pointer-events-none" />
        <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-cyan-400 pointer-events-none" />
        <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-cyan-400 pointer-events-none" />
      </div>

      {/* Cyber Status Readout */}
      <div className="flex flex-col items-center gap-1.5 max-w-[280px]">
        <div className="flex items-center gap-2 text-cyan-400">
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
          <span className="font-mono text-[11px] font-bold tracking-widest text-cyan-300 drop-shadow-sm transition-all duration-300 text-center">
            {currentMessage}
          </span>
        </div>

        {subText && (
          <span className="font-mono text-[10px] text-zinc-400 tracking-wider text-center">
            {subText}
          </span>
        )}

        {/* Mini glowing progress bar */}
        <div className="w-36 h-1 rounded-full bg-slate-900 border border-white/10 overflow-hidden relative">
          <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400 rounded-full animate-splash-progress w-full" />
        </div>
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div
        className={cn(
          'fixed inset-0 z-[150] flex flex-col items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md',
          themeClass
        )}
      >
        {content}
      </div>
    );
  }

  return content;
};
