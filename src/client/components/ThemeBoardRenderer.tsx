import React from 'react';
import { Position, BlockData, DestinationData, BlockType } from '../types';
import { ThemeId } from '../../shared/themes';
import { PuzzleShape } from './PuzzleShape';

interface ThemeStyles {
  bgClass: string;
  panelClass: string;
  cellClass: string;
  wallClass: string;
}

export const THEME_STYLES: Record<ThemeId, ThemeStyles> = {
  neon: {
    bgClass: 'bg-mesh-gradient',
    panelClass: 'glass-panel border border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.15)]',
    cellClass: 'glass-cell border border-white/5',
    wallClass: 'wall-cell',
  },
  arcade: {
    bgClass: 'bg-zinc-950 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,3px_100%]',
    panelClass: 'bg-zinc-900 border-4 border-yellow-500 rounded-none shadow-[6px_6px_0_#000]',
    cellClass: 'bg-black border border-zinc-800 rounded-none',
    wallClass: 'bg-red-700 border-2 border-red-900 rounded-none shadow-[inset_-2px_-2px_0_#451a03,inset_2px_2px_0_#fdba74]',
  },
  cosmic: {
    bgClass: 'bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950',
    panelClass: 'bg-purple-950/20 border border-purple-500/35 rounded-3xl backdrop-blur-md shadow-[0_0_30px_rgba(168,85,247,0.25)]',
    cellClass: 'bg-purple-950/10 border border-purple-800/10 rounded-full',
    wallClass: 'bg-indigo-950 border-2 border-indigo-700 rounded-2xl shadow-[0_0_12px_rgba(99,102,241,0.3),inset_0_0_8px_rgba(99,102,241,0.2)]',
  },
  zen: {
    bgClass: 'bg-gradient-to-br from-stone-800 via-stone-900 to-emerald-950',
    panelClass: 'bg-stone-900/90 border-8 border-stone-800 rounded-xl shadow-2xl',
    cellClass: 'bg-stone-950/40 border border-stone-900/30 rounded-lg',
    wallClass: 'bg-amber-950 border-2 border-amber-900 rounded-lg shadow-[inset_0_4px_6px_rgba(0,0,0,0.6)]',
  },
};

export const getRadiusStyle = (themeId: ThemeId) => {
  switch (themeId) {
    case 'arcade': return 'rounded-none';
    case 'cosmic': return 'rounded-full';
    case 'zen': return 'rounded-xl';
    case 'neon':
    default: return 'rounded-md sm:rounded-lg md:rounded-xl';
  }
};

export const getBlockColors = (themeId: ThemeId, blockType: BlockType) => {
  switch (themeId) {
    case 'arcade': {
      switch (blockType) {
        case 'red-circle':
          return { text: 'text-red-500', border: 'border-2 border-red-500 rounded-none shadow-[2px_2px_0_#000]', shadow: '' };
        case 'blue-square':
          return { text: 'text-blue-500', border: 'border-2 border-blue-500 rounded-none shadow-[2px_2px_0_#000]', shadow: '' };
        case 'yellow-triangle':
          return { text: 'text-yellow-400', border: 'border-2 border-yellow-400 rounded-none shadow-[2px_2px_0_#000]', shadow: '' };
        case 'purple-star':
          return { text: 'text-purple-500', border: 'border-2 border-purple-500 rounded-none shadow-[2px_2px_0_#000]', shadow: '' };
        case 'green-leaf':
          return { text: 'text-green-500', border: 'border-2 border-green-500 rounded-none shadow-[2px_2px_0_#000]', shadow: '' };
        case 'orange-block':
          return { text: 'text-orange-500', border: 'border-2 border-orange-500 rounded-none shadow-[2px_2px_0_#000]', shadow: '' };
        default:
          return { text: 'text-white', border: 'border-2 border-black rounded-none', shadow: '' };
      }
    }
    case 'cosmic': {
      switch (blockType) {
        case 'red-circle':
          return { text: 'text-rose-400', border: 'border border-rose-500/80 rounded-full shadow-[0_0_15px_rgba(244,63,94,0.5)]', shadow: '' };
        case 'blue-square':
          return { text: 'text-cyan-400', border: 'border border-cyan-500/80 rounded-full shadow-[0_0_15px_rgba(34,211,238,0.5)]', shadow: '' };
        case 'yellow-triangle':
          return { text: 'text-amber-300', border: 'border border-amber-400/80 rounded-full shadow-[0_0_15px_rgba(251,191,36,0.5)]', shadow: '' };
        case 'purple-star':
          return { text: 'text-fuchsia-400', border: 'border border-fuchsia-500/80 rounded-full shadow-[0_0_15px_rgba(232,121,249,0.5)]', shadow: '' };
        case 'green-leaf':
          return { text: 'text-emerald-400', border: 'border border-emerald-500/80 rounded-full shadow-[0_0_15px_rgba(52,211,153,0.5)]', shadow: '' };
        case 'orange-block':
          return { text: 'text-orange-400', border: 'border border-orange-500/80 rounded-full shadow-[0_0_15px_rgba(251,146,60,0.5)]', shadow: '' };
        default:
          return { text: 'text-white', border: 'border border-white/50 rounded-full', shadow: '' };
      }
    }
    case 'zen': {
      switch (blockType) {
        case 'red-circle':
          return { text: 'text-red-700', border: 'border-2 border-red-700 bg-stone-900/10 rounded-xl shadow-sm', shadow: '' };
        case 'blue-square':
          return { text: 'text-blue-700', border: 'border-2 border-blue-700 bg-stone-900/10 rounded-xl shadow-sm', shadow: '' };
        case 'yellow-triangle':
          return { text: 'text-yellow-600', border: 'border-2 border-yellow-600 bg-stone-900/10 rounded-xl shadow-sm', shadow: '' };
        case 'purple-star':
          return { text: 'text-purple-700', border: 'border-2 border-purple-700 bg-stone-900/10 rounded-xl shadow-sm', shadow: '' };
        case 'green-leaf':
          return { text: 'text-emerald-700', border: 'border-2 border-emerald-700 bg-stone-900/10 rounded-xl shadow-sm', shadow: '' };
        case 'orange-block':
          return { text: 'text-amber-800', border: 'border-2 border-amber-800 bg-stone-900/10 rounded-xl shadow-sm', shadow: '' };
        default:
          return { text: 'text-stone-500', border: 'border-2 border-stone-850 rounded-xl', shadow: '' };
      }
    }
    case 'neon':
    default: {
      switch (blockType) {
        case 'red-circle':
          return { text: 'text-red-500', border: 'border border-red-500/80 neon-red', shadow: 'shadow-[0_0_15px_rgba(239,68,68,0.5)]' };
        case 'blue-square':
          return { text: 'text-blue-500', border: 'border border-blue-500/80 neon-blue', shadow: 'shadow-[0_0_15px_rgba(59,130,246,0.5)]' };
        case 'yellow-triangle':
          return { text: 'text-yellow-400', border: 'border border-yellow-400/80 neon-yellow', shadow: 'shadow-[0_0_15px_rgba(250,204,21,0.5)]' };
        case 'purple-star':
          return { text: 'text-purple-500', border: 'border border-purple-500/80 neon-purple', shadow: 'shadow-[0_0_15px_rgba(168,85,247,0.5)]' };
        case 'green-leaf':
          return { text: 'text-green-500', border: 'border border-green-500/80 neon-green', shadow: 'shadow-[0_0_15px_rgba(34,197,94,0.5)]' };
        case 'orange-block':
          return { text: 'text-orange-500', border: 'border border-orange-500/80 neon-orange', shadow: 'shadow-[0_0_15px_rgba(249,115,22,0.5)]' };
        default:
          return { text: 'text-white', border: 'border border-white/50', shadow: '' };
      }
    }
  }
};

export const getDestinationStyle = (themeId: ThemeId, destType: BlockType) => {
  switch (themeId) {
    case 'arcade': {
      switch (destType) {
        case 'red-circle':
          return { bg: 'bg-red-950/20', border: 'border-2 border-dashed border-red-500 rounded-none', text: 'text-red-500' };
        case 'blue-square':
          return { bg: 'bg-blue-950/20', border: 'border-2 border-dashed border-blue-500 rounded-none', text: 'text-blue-500' };
        case 'yellow-triangle':
          return { bg: 'bg-yellow-950/20', border: 'border-2 border-dashed border-yellow-400 rounded-none', text: 'text-yellow-400' };
        case 'purple-star':
          return { bg: 'bg-purple-950/20', border: 'border-2 border-dashed border-purple-500 rounded-none', text: 'text-purple-500' };
        case 'green-leaf':
          return { bg: 'bg-green-950/20', border: 'border-2 border-dashed border-green-500 rounded-none', text: 'text-green-500' };
        case 'orange-block':
          return { bg: 'bg-orange-950/20', border: 'border-2 border-dashed border-orange-500 rounded-none', text: 'text-orange-500' };
        default:
          return { bg: 'bg-white/10', border: 'border-2 border-dashed border-white rounded-none', text: 'text-white' };
      }
    }
    case 'cosmic': {
      switch (destType) {
        case 'red-circle':
          return { bg: 'bg-rose-950/15', border: 'border border-dashed border-rose-400 rounded-full shadow-[0_0_8px_rgba(244,63,94,0.3)]', text: 'text-rose-400' };
        case 'blue-square':
          return { bg: 'bg-cyan-950/15', border: 'border border-dashed border-cyan-400 rounded-full shadow-[0_0_8px_rgba(34,211,238,0.3)]', text: 'text-cyan-400' };
        case 'yellow-triangle':
          return { bg: 'bg-amber-950/15', border: 'border border-dashed border-amber-300 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.3)]', text: 'text-amber-300' };
        case 'purple-star':
          return { bg: 'bg-fuchsia-950/15', border: 'border border-dashed border-fuchsia-400 rounded-full shadow-[0_0_8px_rgba(232,121,249,0.3)]', text: 'text-fuchsia-400' };
        case 'green-leaf':
          return { bg: 'bg-emerald-950/15', border: 'border border-dashed border-emerald-400 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.3)]', text: 'text-emerald-400' };
        case 'orange-block':
          return { bg: 'bg-orange-950/15', border: 'border border-dashed border-orange-400 rounded-full shadow-[0_0_8px_rgba(251,146,60,0.3)]', text: 'text-orange-400' };
        default:
          return { bg: 'bg-white/10', border: 'border border-dashed border-white/30 rounded-full', text: 'text-white' };
      }
    }
    case 'zen': {
      switch (destType) {
        case 'red-circle':
          return { bg: 'bg-stone-900/10', border: 'border-2 border-dotted border-stone-600/50 rounded-xl', text: 'text-stone-600' };
        case 'blue-square':
          return { bg: 'bg-stone-900/10', border: 'border-2 border-dotted border-stone-600/50 rounded-xl', text: 'text-stone-600' };
        case 'yellow-triangle':
          return { bg: 'bg-stone-900/10', border: 'border-2 border-dotted border-stone-600/50 rounded-xl', text: 'text-stone-600' };
        case 'purple-star':
          return { bg: 'bg-stone-900/10', border: 'border-2 border-dotted border-stone-600/50 rounded-xl', text: 'text-stone-600' };
        case 'green-leaf':
          return { bg: 'bg-stone-900/10', border: 'border-2 border-dotted border-stone-600/50 rounded-xl', text: 'text-stone-600' };
        case 'orange-block':
          return { bg: 'bg-stone-900/10', border: 'border-2 border-dotted border-stone-600/50 rounded-xl', text: 'text-stone-600' };
        default:
          return { bg: 'bg-stone-900/5', border: 'border-2 border-dotted border-stone-600/30 rounded-xl', text: 'text-stone-600' };
      }
    }
    case 'neon':
    default: {
      switch (destType) {
        case 'red-circle':
          return { bg: 'bg-red-950/20', border: 'border border-red-500/50 border-dashed neon-red', text: 'text-red-500' };
        case 'blue-square':
          return { bg: 'bg-blue-950/20', border: 'border border-blue-500/50 border-dashed neon-blue', text: 'text-blue-500' };
        case 'yellow-triangle':
          return { bg: 'bg-yellow-950/20', border: 'border border-yellow-500/50 border-dashed neon-yellow', text: 'text-yellow-400' };
        case 'purple-star':
          return { bg: 'bg-purple-950/20', border: 'border border-purple-500/50 border-dashed neon-purple', text: 'text-purple-500' };
        case 'green-leaf':
          return { bg: 'bg-green-950/20', border: 'border border-green-500/50 border-dashed neon-green', text: 'text-green-500' };
        case 'orange-block':
          return { bg: 'bg-orange-950/20', border: 'border border-orange-500/50 border-dashed neon-orange', text: 'text-orange-500' };
        default:
          return { bg: 'bg-white/10', border: 'border border-white/30 border-dashed', text: 'text-white' };
      }
    }
  }
};

const positionKey = (pos: Position) => `${pos.x},${pos.y}`;

export const ThemeBoardRenderer = ({
  gridSize,
  walls,
  destinations,
  blocks,
  playerPos,
  activeTheme,
  cellSize = 'var(--cell-size)',
  gridPadding = 'var(--grid-padding)',
  isAnimated = true,
  prevBlocks,
  prevPlayerPos,
}: {
  gridSize: number;
  walls: Position[];
  destinations: DestinationData[];
  blocks: BlockData[];
  playerPos: Position;
  activeTheme: ThemeId;
  cellSize?: string;
  gridPadding?: string;
  isAnimated?: boolean;
  prevBlocks?: BlockData[];
  prevPlayerPos?: Position;
}) => {
  const styles = THEME_STYLES[activeTheme] || THEME_STYLES.neon;
  const wallSet = new Set(walls.map(w => positionKey(w)));
  const destinationMap = new Map(destinations.map(d => [positionKey(d.pos), d]));

  const inlineStyles: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
    gap: '1px',
    maxWidth: '100vw',
    maxHeight: '100vh',
    width: 'fit-content',
    aspectRatio: '1',
    '--grid-size': String(gridSize),
  } as React.CSSProperties;

  if (cellSize !== 'var(--cell-size)') {
    (inlineStyles as any)['--cell-size'] = cellSize;
  }
  if (gridPadding !== 'var(--grid-padding)') {
    (inlineStyles as any)['--grid-padding'] = gridPadding;
  }

  return (
    <div
      className={`p-1 sm:p-2 relative ${isAnimated ? 'animate-fade-in' : ''} ${styles.panelClass}`}
      style={inlineStyles}
    >
      {Array.from({ length: gridSize * gridSize }).map((_, i) => {
        const x = i % gridSize;
        const y = Math.floor(i / gridSize);
        const key = `${x},${y}`;

        const hasWall = wallSet.has(key);
        const destination = destinationMap.get(key);
        const hasDestination = destination !== undefined;

        let bgColor = styles.cellClass;
        let borderStyle = '';
        let radiusStyle = getRadiusStyle(activeTheme);

        const destStyle = hasDestination ? getDestinationStyle(activeTheme, destination.type) : null;

        if (hasWall) {
          bgColor = styles.wallClass;
          borderStyle = '';
          if (activeTheme === 'cosmic') {
            radiusStyle = 'rounded-xl';
          } else if (activeTheme === 'zen') {
            radiusStyle = 'rounded-lg';
          } else if (activeTheme === 'neon') {
            radiusStyle = 'rounded-none';
          }
        } else if (hasDestination && destStyle) {
          bgColor = `${destStyle.bg} animate-pulse-glow bg-opacity-40 backdrop-blur-sm`;
          borderStyle = `${destStyle.border} ${destStyle.text}`;
        }

        return (
          <div
            key={i}
            className={`aspect-square ${radiusStyle} flex items-center justify-center text-lg sm:text-2xl font-bold transition-all ${bgColor} ${borderStyle}`}
            style={{ width: 'var(--cell-size)', height: 'var(--cell-size)' }}
          >
            {hasDestination && (
              <PuzzleShape type={destination.type} className="w-1/2 h-1/2 opacity-35" />
            )}
          </div>
        );
      })}

      <div
        className="absolute"
        style={{
          top: 'var(--grid-padding)',
          left: 'var(--grid-padding)',
          right: 'var(--grid-padding)',
          bottom: 'var(--grid-padding)',
          pointerEvents: 'none',
          width: 'calc(100% - 2 * var(--grid-padding))',
          height: 'calc(100% - 2 * var(--grid-padding))',
        }}
      >
        {blocks.map((block, idx) => {
          const destination = destinationMap.get(positionKey(block.pos));
          const isOnDestination = destination !== undefined;
          const isCorrectDestination = isOnDestination && destination!.type === block.type;

          const colors = getBlockColors(activeTheme, block.type);
          let content;
          const radiusStyle = getRadiusStyle(activeTheme);
          const blockBgCorrect = activeTheme === 'arcade' ? 'bg-black' : activeTheme === 'cosmic' ? 'bg-slate-950/50' : activeTheme === 'zen' ? 'bg-stone-900/60' : 'bg-black/40';
          const blockBgIncorrect = activeTheme === 'arcade' ? 'bg-zinc-950' : activeTheme === 'cosmic' ? 'bg-slate-950/85' : activeTheme === 'zen' ? 'bg-stone-900/90' : 'bg-black/75';

          if (isCorrectDestination) {
            const borderClass = colors.border.replace(/\bborder\b/, 'border-2');
            content = (
              <div className={`w-full h-full ${radiusStyle} flex items-center justify-center ${blockBgCorrect} ${borderClass} ${colors.text} ${isAnimated ? 'animate-pulse-glow' : ''}`}>
                <PuzzleShape type={block.type} className="w-1/2 h-1/2 drop-shadow-[0_0_8px_currentColor]" />
              </div>
            );
          } else {
            const borderClass = colors.border
              .replace(/neon-\w+/, '')
              .replace(/shadow-\[.*?\]/, '')
              .trim();
            content = (
              <div className={`w-full h-full ${radiusStyle} flex items-center justify-center ${blockBgIncorrect} ${borderClass} backdrop-blur-sm`}>
                <PuzzleShape type={block.type} className="w-1/2 h-1/2 text-zinc-600" />
              </div>
            );
          }

          const prevPos = prevBlocks?.[idx]?.pos || block.pos;
          const dist = Math.abs(block.pos.x - prevPos.x) + Math.abs(block.pos.y - prevPos.y);
          const duration = dist === 0 ? 0.15 : Math.max(0.15, dist * 0.08);

          return (
            <div
              key={`block-${idx}`}
              className={`absolute aspect-square ${isAnimated ? 'animate-slide' : ''}`}
              style={{
                width: 'var(--cell-size)',
                height: 'var(--cell-size)',
                transitionDuration: isAnimated ? `${duration}s` : '0s',
                transform: `translate(calc(${block.pos.x} * (var(--cell-size) + 1px)), calc(${block.pos.y} * (var(--cell-size) + 1px)))`,
              }}
            >
              {content}
            </div>
          );
        })}

        {(() => {
          let playerElement = null;

          if (activeTheme === 'arcade') {
            playerElement = (
              <div className="w-full h-full rounded-none flex items-center justify-center bg-yellow-400 border-2 border-black shadow-[2px_2px_0_#000] relative overflow-hidden">
                <div className="flex gap-0.5 sm:gap-1">
                  <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-black rounded-full"></div>
                  <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-black rounded-full"></div>
                </div>
              </div>
            );
          } else if (activeTheme === 'cosmic') {
            playerElement = (
              <div className="w-full h-full rounded-full flex items-center justify-center bg-black border-2 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.8)] relative overflow-hidden animate-pulse">
                <div className="w-1/3 h-1/3 bg-purple-400 rounded-full shadow-[0_0_12px_rgba(168,85,247,1)]"></div>
                <div className="absolute inset-0.5 border border-dashed border-purple-400/40 rounded-full animate-[spin_10s_linear_infinite]"></div>
              </div>
            );
          } else if (activeTheme === 'zen') {
            playerElement = (
              <div className="w-full h-full rounded-xl flex items-center justify-center bg-stone-400 border-2 border-stone-200 shadow-md relative overflow-hidden">
                <div className="w-1/3 h-1/3 bg-emerald-500 rounded-full"></div>
              </div>
            );
          } else {
            playerElement = (
              <div className="w-full h-full rounded-full flex items-center justify-center bg-black/75 border-2 border-white shadow-[0_0_15px_rgba(255,255,255,0.7)] relative overflow-hidden animate-pulse">
                <div className="w-1/3 h-1/3 bg-white rounded-full shadow-[0_0_12px_rgba(255,255,255,1)]"></div>
                <div className="absolute inset-0.5 border border-dashed border-white/25 rounded-full animate-[spin_8s_linear_infinite]"></div>
              </div>
            );
          }

          const prevPos = prevPlayerPos || playerPos;
          const dist = Math.abs(playerPos.x - prevPos.x) + Math.abs(playerPos.y - prevPos.y);
          const duration = dist === 0 ? 0.15 : Math.max(0.15, dist * 0.08);

          return (
            <div
              className={`absolute aspect-square ${isAnimated ? 'animate-slide' : ''}`}
              style={{
                width: 'var(--cell-size)',
                height: 'var(--cell-size)',
                transitionDuration: isAnimated ? `${duration}s` : '0s',
                transform: `translate(calc(${playerPos.x} * (var(--cell-size) + 1px)), calc(${playerPos.y} * (var(--cell-size) + 1px)))`,
              }}
            >
              {playerElement}
            </div>
          );
        })()}
      </div>
    </div>
  );
};
