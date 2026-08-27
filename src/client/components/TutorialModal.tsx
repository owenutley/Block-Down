import { useState } from 'react';
import { PuzzleShape } from './PuzzleShape';

export const TutorialModal = ({ onClose }: { onClose: () => void }) => {
  const [slide, setSlide] = useState(0);

  const slides = [
    {
      title: 'How to Play: The Basics',
      icon: '🎯',
      subtitle: 'Core Objective',
      content: (
        <div className="space-y-4">
          <p className="text-sm text-zinc-300 leading-relaxed">
            You control the white glowing <strong className="text-white">Core</strong>. Navigate around the grid to push colorful block shapes into their matching dashed <strong className="text-cyan-400">target zones</strong>.
          </p>
          <div className="flex items-center justify-center gap-6 py-4 bg-black/40 rounded-2xl border border-white/10">
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-xl bg-blue-950/40 border border-blue-500/60 shadow-[0_0_15px_rgba(59,130,246,0.5)] flex items-center justify-center text-blue-400">
                <PuzzleShape shape="diamond" className="w-6 h-6" />
              </div>
              <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Slide Block</span>
            </div>
            <span className="text-2xl text-cyan-400 font-black animate-pulse">➔</span>
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-xl border-2 border-dashed border-blue-500/60 bg-blue-950/20 flex items-center justify-center text-blue-400/60">
                <PuzzleShape shape="diamond" className="w-5 h-5 opacity-40" />
              </div>
              <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Target Slot</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Ice-Slide Physics',
      icon: '🧊',
      subtitle: 'Inertia Movement',
      content: (
        <div className="space-y-4">
          <p className="text-sm text-zinc-300 leading-relaxed">
            When you push a block, it slides with <strong className="text-cyan-300">ice-like momentum</strong> in that direction and will <strong className="text-white">not stop</strong> until it collides with a wall or another block!
          </p>
          <div className="p-4 bg-black/40 rounded-2xl border border-white/10 space-y-2 text-xs text-zinc-300">
            <div className="flex items-center gap-2">
              <span className="text-emerald-400 font-bold">✓</span>
              <span>Use walls and other blocks as stopping barriers.</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-emerald-400 font-bold">✓</span>
              <span>Plan stopping points before executing your push!</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-emerald-400 font-bold">✓</span>
              <span>Use the <strong>Undo</strong> button to rewind mistakes freely.</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Star Ratings & Rewards',
      icon: '⭐',
      subtitle: 'Mastery & Economy',
      content: (
        <div className="space-y-4">
          <p className="text-sm text-zinc-300 leading-relaxed">
            Every puzzle has an optimal <strong className="text-yellow-400">Par</strong> push target. Fewer pushes earn higher star ratings and bonus <strong className="text-cyan-400">Neon Shards (✦)</strong>!
          </p>
          <div className="grid grid-cols-3 gap-2 py-2">
            <div className="bg-black/40 border border-white/10 rounded-xl p-3 text-center flex flex-col items-center justify-between">
              <span className="text-xl">⭐</span>
              <span className="text-xs font-black text-white mt-1">1 Star</span>
              <span className="text-[10px] text-zinc-400 mt-1">Clear Level</span>
            </div>
            <div className="bg-black/40 border border-yellow-500/30 rounded-xl p-3 text-center flex flex-col items-center justify-between shadow-[0_0_10px_rgba(234,179,8,0.1)]">
              <span className="text-xl">⭐⭐</span>
              <span className="text-xs font-black text-yellow-400 mt-1">2 Stars</span>
              <span className="text-[10px] text-yellow-300/80 mt-1">+15 Shards</span>
            </div>
            <div className="bg-black/40 border border-yellow-400/50 rounded-xl p-3 text-center flex flex-col items-center justify-between shadow-[0_0_15px_rgba(234,179,8,0.2)]">
              <span className="text-xl">⭐⭐⭐</span>
              <span className="text-xs font-black text-yellow-300 mt-1">Par Master</span>
              <span className="text-[10px] text-yellow-200 mt-1">+25 Shards</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Daily Streaks & Community',
      icon: '🔥',
      subtitle: 'Daily Routines',
      content: (
        <div className="space-y-4">
          <p className="text-sm text-zinc-300 leading-relaxed">
            Play the <strong className="text-cyan-400">Daily Puzzle</strong> every day to build your <strong className="text-orange-400">Daily Streak</strong>. Reach 3-day, 7-day, and 30-day streak milestones for massive shard payouts!
          </p>
          <div className="p-4 bg-gradient-to-r from-orange-950/40 via-black/40 to-cyan-950/40 rounded-2xl border border-orange-500/30 text-xs text-zinc-300 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-red-300 flex items-center gap-1.5">
                <div className="w-4 h-4 bg-red-500/20 border border-red-400/40 rounded-full shadow-[0_0_6px_rgba(239,68,68,0.6)] flex items-center justify-center text-red-400 p-0.5 shrink-0 inline-flex">
                  <PuzzleShape shape="fire" className="w-full h-full" />
                </div>
                <span>Daily Streaks</span>
              </span>
              <span className="text-white font-mono font-bold">+50 to +1,000 ✦</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                <span>🏆</span> Reddit Share Card
              </span>
              <span className="text-zinc-400">Share your score in comments</span>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const current = slides[slide] || slides[0]!;

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/85 backdrop-blur-md px-4 pointer-events-auto">
      <div className="glass-panel max-w-md w-full p-6 rounded-3xl border border-cyan-500/40 text-white relative animate-float shadow-[0_0_50px_rgba(6,182,212,0.25)] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white text-2xl font-black cursor-pointer bg-white/5 hover:bg-white/10 rounded-full w-8 h-8 flex items-center justify-center transition-all z-10"
        >
          ×
        </button>

        <div className="text-center mb-4">
          <span className="text-4xl">{current.icon}</span>
          <h2 className="text-2xl font-black neon-text-title tracking-tight mt-1">{current.title}</h2>
          <p className="text-xs text-cyan-400/80 font-mono uppercase tracking-widest mt-0.5">{current.subtitle}</p>
        </div>

        <div className="min-h-[190px] flex flex-col justify-center">
          {current.content}
        </div>

        {/* Slide navigation dots */}
        <div className="flex items-center justify-center gap-2 my-4">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setSlide(idx)}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                slide === idx ? 'w-6 bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]' : 'w-2 bg-white/20 hover:bg-white/40'
              }`}
            />
          ))}
        </div>

        {/* Bottom Action Buttons */}
        <div className="flex gap-2.5">
          {slide > 0 && (
            <button
              onClick={() => setSlide(prev => prev - 1)}
              className="flex-1 rounded-2xl bg-white/10 hover:bg-white/15 py-3 text-sm font-bold transition-all text-zinc-300 hover:text-white cursor-pointer"
            >
              Back
            </button>
          )}
          {slide < slides.length - 1 ? (
            <button
              onClick={() => setSlide(prev => prev + 1)}
              className="flex-1 rounded-2xl theme-btn py-3 text-sm font-bold transition-all hover:scale-102 active:scale-98 shadow-lg cursor-pointer"
            >
              Next
            </button>
          ) : (
            <button
              onClick={onClose}
              className="flex-1 rounded-2xl theme-btn py-3 text-sm font-bold transition-all hover:scale-102 active:scale-98 shadow-lg cursor-pointer"
            >
              Got It! Let&apos;s Play
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
