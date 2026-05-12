import './index.css';

import { requestExpandedMode } from '@devvit/web/client';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

const SPLASH_GRID = 9;

// A static, visually appealing mock level for the splash screen
const walls = [{ x: 2, y: 2 }, { x: 6, y: 7 }, { x: 7, y: 1 }];
const blocks = [
  { pos: { x: 2, y: 4 }, type: 'red-circle' as const },
  { pos: { x: 5, y: 3 }, type: 'blue-square' as const }
];
const destinations = [
  { pos: { x: 2, y: 7 }, type: 'red-circle' as const },
  { pos: { x: 6, y: 2 }, type: 'blue-square' as const }
];
const playerPos = { x: 4, y: 4 };

const getBlockStyle = (blockType: string) => {
  switch (blockType) {
    case 'red-circle': return { bg: 'bg-black/60', border: 'border border-red-500 neon-red', emoji: '' };
    case 'blue-square': return { bg: 'bg-black/60', border: 'border border-blue-500 neon-blue', emoji: '' };
    case 'orange-block': return { bg: 'bg-black/60', border: 'border border-orange-500 neon-orange', emoji: '' };
    default: return { bg: 'bg-black/60', border: 'border border-white/50', emoji: '' };
  }
};

const getDestinationStyle = (destType: string) => {
  switch (destType) {
    case 'red-circle': return { bg: 'bg-red-900/30', border: 'border border-red-500/80 border-dashed neon-red', emoji: '' };
    case 'blue-square': return { bg: 'bg-blue-900/30', border: 'border border-blue-500/80 border-dashed neon-blue', emoji: '' };
    case 'orange-block': return { bg: 'bg-orange-900/30', border: 'border border-orange-500/80 border-dashed neon-orange', emoji: '' };
    default: return { bg: 'bg-white/10', border: 'border border-white/50 border-dashed', emoji: '' };
  }
};

const positionKey = (x: number, y: number) => `${x},${y}`;
const wallSet = new Set(walls.map(w => positionKey(w.x, w.y)));
const destinationMap = new Map(destinations.map(d => [positionKey(d.pos.x, d.pos.y), d]));

export const Splash = () => {
  return (
    <div className="relative flex h-[100dvh] w-full overflow-hidden flex-col items-center justify-between gap-4 bg-mesh-gradient px-4 py-6 sm:py-8">
      
      {/* Header Section */}
      <div className="flex flex-col items-center shrink-0">
        <h1 className="text-center text-4xl sm:text-5xl font-black text-white drop-shadow-lg tracking-tight">
          Block Down
        </h1>
        <p className="text-center text-sm sm:text-base text-white/90 font-medium max-w-sm drop-shadow-sm mt-2">
          Slide blocks into their matching targets in this satisfying puzzle game!
        </p>
      </div>

      {/* Game Preview Section */}
      <div className="flex-1 w-full min-h-0 flex items-center justify-center pointer-events-none select-none">
        <div 
          className="glass-panel p-1 sm:p-2 relative rounded-2xl sm:rounded-3xl shadow-2xl"
          style={{ 
            display: 'grid', 
            gridTemplateColumns: `repeat(${SPLASH_GRID}, 1fr)`, 
            gap: '1px',
            height: '100%',
            maxHeight: '400px',
            aspectRatio: '1'
          }}
        >
          {Array.from({ length: SPLASH_GRID * SPLASH_GRID }).map((_, i) => {
            const x = i % SPLASH_GRID;
            const y = Math.floor(i / SPLASH_GRID);
            const key = positionKey(x, y);

            const hasWall = wallSet.has(key);
            const destination = destinationMap.get(key);
            const hasDestination = destination !== undefined;

            let bgColor = 'glass-cell';
            let borderStyle = '';
            let emoji = '';
            let shadowStyle = '';

            if (hasWall) {
              bgColor = 'bg-gray-800/80 dark:bg-black/80 backdrop-blur-sm';
              borderStyle = 'border border-gray-700';
              emoji = '';
              shadowStyle = 'shadow-inner';
            } else if (hasDestination) {
              const destStyle = getDestinationStyle(destination!.type);
              bgColor = `${destStyle.bg} animate-pulse-glow bg-opacity-40 backdrop-blur-sm`;
              borderStyle = destStyle.border;
              emoji = destStyle.emoji;
            }

            return (
              <div
                key={i}
                className={`aspect-square w-full h-full rounded-xl flex items-center justify-center text-xs sm:text-lg font-bold ${bgColor} ${borderStyle} ${shadowStyle}`}
              >
                {emoji}
              </div>
            );
          })}

          {/* Absolute layer for blocks and player (scaled to relative container sizes using percentages) */}
          <div
            className="absolute"
            style={{
              top: 'var(--grid-padding)',
              left: 'var(--grid-padding)',
              right: 'var(--grid-padding)',
              bottom: 'var(--grid-padding)',
            }}
          >
            {blocks.map((block, idx) => {
              const blockStyle = getBlockStyle(block.type);
              return (
                <div 
                  key={`block-${idx}`}
                  className={`absolute aspect-square`}
                  style={{
                    width: `calc(100% / ${SPLASH_GRID} - 1px)`,
                    height: `calc(100% / ${SPLASH_GRID} - 1px)`,
                    transform: `translate(calc(${block.pos.x} * 100% + ${block.pos.x} * 1px), calc(${block.pos.y} * 100% + ${block.pos.y} * 1px))`,
                  }}
                >
                  <div className={`w-full h-full rounded-xl flex items-center justify-center text-xs sm:text-lg font-bold ${blockStyle.bg} ${blockStyle.border}`}>
                    {blockStyle.emoji}
                  </div>
                </div>
              );
            })}

            {/* Player */}
            <div 
              className="absolute aspect-square"
              style={{
                width: `calc(100% / ${SPLASH_GRID} - 1px)`,
                height: `calc(100% / ${SPLASH_GRID} - 1px)`,
                transform: `translate(calc(${playerPos.x} * 100% + ${playerPos.x} * 1px), calc(${playerPos.y} * 100% + ${playerPos.y} * 1px))`,
              }}
            >
              <div className="w-full h-full rounded-full flex items-center justify-center text-xs sm:text-lg font-bold bg-black/60 border border-cyan-400 neon-cyan">
                🐘
              </div>
            </div>
          </div>
        </div>
      </div>

      <button
        className="flex h-12 w-full max-w-xs cursor-pointer items-center justify-center rounded-2xl bg-black/60 border border-cyan-400 neon-cyan px-6 text-lg font-bold text-cyan-300 transition-transform hover:scale-105 active:scale-95 shadow-lg"
        onClick={(e) => requestExpandedMode(e.nativeEvent, 'game')}
      >
        Play Game
      </button>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Splash />
  </StrictMode>
);
