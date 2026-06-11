import React from 'react';
import { Position, BlockData, DestinationData, BlockType } from '../types';
import { ThemeId, ThemeConfig, ColorId, DEFAULT_THEME_CONFIGS, getBaseThemeId, Theme } from '../../shared/themes';
import { PuzzleShape } from './PuzzleShape';
import { TrailId } from '../../shared/trails';

interface ThemeStyles {
  bgClass: string;
  panelClass: string;
  cellClass: string;
  wallClass: string;
}

export const THEME_STYLES: Record<
  'neon' | 'winter' | 'forest' | 'candy' | 'space' | 'ocean' | 'retro' | 'desert' | 'spooky' | 'volcanic',
  ThemeStyles
> = {
  neon: {
    bgClass: 'bg-mesh-gradient',
    panelClass: 'glass-panel border border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.15)]',
    cellClass: 'glass-cell border border-white/5',
    wallClass: 'wall-cell',
  },
  winter: {
    bgClass: 'bg-gradient-to-br from-slate-950 via-sky-950 to-slate-900',
    panelClass: 'bg-sky-950/20 border border-sky-400/30 rounded-3xl backdrop-blur-md shadow-[0_0_30px_rgba(56,189,248,0.2)]',
    cellClass: 'bg-sky-950/10 border border-sky-800/10 rounded-lg',
    wallClass: 'bg-slate-800 border-2 border-slate-600 rounded-lg shadow-[inset_0_4px_6px_rgba(0,0,0,0.6)]',
  },
  forest: {
    bgClass: 'bg-gradient-to-br from-stone-900 via-emerald-950 to-stone-950',
    panelClass: 'bg-emerald-950/20 border border-emerald-500/30 rounded-3xl backdrop-blur-md shadow-[0_0_30px_rgba(16,185,129,0.15)]',
    cellClass: 'bg-emerald-950/10 border border-emerald-800/10 rounded-lg',
    wallClass: 'bg-stone-800 border-2 border-amber-905/60 rounded-lg shadow-[inset_0_4px_6px_rgba(0,0,0,0.7)]',
  },
  candy: {
    bgClass: 'bg-gradient-to-br from-pink-950 via-purple-950 to-slate-950',
    panelClass: 'bg-pink-950/20 border border-pink-500/30 rounded-3xl backdrop-blur-md shadow-[0_0_30px_rgba(244,63,94,0.15)]',
    cellClass: 'bg-pink-950/10 border border-pink-800/10 rounded-xl',
    wallClass: 'bg-fuchsia-900/80 border-2 border-fuchsia-700 rounded-xl shadow-[inset_0_4px_6px_rgba(0,0,0,0.5)]',
  },
  space: {
    bgClass: 'bg-gradient-to-br from-indigo-950 via-slate-950 to-blue-950',
    panelClass: 'bg-indigo-950/20 border border-indigo-500/30 rounded-3xl backdrop-blur-md shadow-[0_0_30px_rgba(99,102,241,0.15)]',
    cellClass: 'bg-zinc-950/40 border border-zinc-800/10 rounded-lg',
    wallClass: 'bg-zinc-800 border-2 border-zinc-500 rounded-lg shadow-[inset_0_4px_6px_rgba(255,255,255,0.1)]',
  },
  ocean: {
    bgClass: 'bg-gradient-to-br from-blue-950 via-cyan-950 to-slate-950',
    panelClass: 'bg-sky-950/20 border border-cyan-400/35 rounded-3xl backdrop-blur-md shadow-[0_0_30px_rgba(34,211,238,0.25)]',
    cellClass: 'bg-cyan-950/10 border border-cyan-800/10 rounded-lg',
    wallClass: 'bg-cyan-900/70 border-2 border-cyan-600 rounded-lg shadow-[inset_0_4px_6px_rgba(0,0,0,0.6)]',
  },
  retro: {
    bgClass: 'bg-gradient-to-br from-zinc-900 via-stone-950 to-black',
    panelClass: 'bg-zinc-900/40 border border-zinc-700/60 rounded-3xl backdrop-blur-md shadow-[0_0_35px_rgba(255,255,255,0.05)]',
    cellClass: 'bg-zinc-950/30 border border-zinc-800/10 rounded-md',
    wallClass: 'bg-zinc-800 border-2 border-zinc-600 rounded-md shadow-[inset_0_4px_6px_rgba(0,0,0,0.85)]',
  },
  desert: {
    bgClass: 'bg-gradient-to-br from-amber-950 via-yellow-950 to-stone-950',
    panelClass: 'bg-amber-950/20 border border-amber-500/30 rounded-3xl backdrop-blur-md shadow-[0_0_30px_rgba(245,158,11,0.15)]',
    cellClass: 'bg-amber-950/10 border border-amber-800/10 rounded-lg',
    wallClass: 'bg-stone-900 border-2 border-rose-950 rounded-lg shadow-[inset_0_4px_6px_rgba(0,0,0,0.9)]',
  },
  spooky: {
    bgClass: 'bg-gradient-to-br from-zinc-950 via-purple-950 to-black',
    panelClass: 'bg-purple-950/25 border border-purple-500/40 rounded-3xl backdrop-blur-md shadow-[0_0_30px_rgba(168,85,247,0.2)]',
    cellClass: 'bg-purple-950/10 border border-purple-800/10 rounded-xl',
    wallClass: 'bg-zinc-900 border-2 border-purple-900 rounded-xl shadow-[inset_0_4px_6px_rgba(0,0,0,0.8)]',
  },
  volcanic: {
    bgClass: 'bg-gradient-to-br from-red-950 via-amber-950 to-black',
    panelClass: 'bg-red-950/25 border border-red-500/40 rounded-3xl backdrop-blur-md shadow-[0_0_30px_rgba(239,68,68,0.2)]',
    cellClass: 'bg-red-950/10 border border-red-800/10 rounded-lg',
    wallClass: 'bg-stone-900 border-2 border-red-950 rounded-lg shadow-[inset_0_4px_6px_rgba(0,0,0,0.9)]',
  },
};

export const COLOR_PALETTES: Record<ColorId, {
  text: string;
  border: string;
  shadow: string;
  bg: string;
  destBorder: string;
}> = {
  red: {
    text: 'text-red-500',
    border: 'border-red-500/80',
    shadow: 'shadow-[0_0_15px_rgba(239,68,68,0.5)] neon-red',
    bg: 'bg-red-950/20',
    destBorder: 'border border-red-500/50 border-dashed neon-red'
  },
  blue: {
    text: 'text-blue-500',
    border: 'border-blue-500/80',
    shadow: 'shadow-[0_0_15px_rgba(59,130,246,0.5)] neon-blue',
    bg: 'bg-blue-950/20',
    destBorder: 'border border-blue-500/50 border-dashed neon-blue'
  },
  yellow: {
    text: 'text-yellow-400',
    border: 'border-yellow-400/80',
    shadow: 'shadow-[0_0_15px_rgba(250,204,21,0.5)] neon-yellow',
    bg: 'bg-yellow-950/20',
    destBorder: 'border border-yellow-500/50 border-dashed neon-yellow'
  },
  purple: {
    text: 'text-purple-500',
    border: 'border-purple-500/80',
    shadow: 'shadow-[0_0_15px_rgba(168,85,247,0.5)] neon-purple',
    bg: 'bg-purple-950/20',
    destBorder: 'border border-purple-500/50 border-dashed neon-purple'
  },
  green: {
    text: 'text-green-500',
    border: 'border-green-500/80',
    shadow: 'shadow-[0_0_15px_rgba(34,197,94,0.5)] neon-green',
    bg: 'bg-green-950/20',
    destBorder: 'border border-green-500/50 border-dashed neon-green'
  },
  orange: {
    text: 'text-orange-500',
    border: 'border-orange-500/80',
    shadow: 'shadow-[0_0_15px_rgba(249,115,22,0.5)] neon-orange',
    bg: 'bg-orange-950/20',
    destBorder: 'border border-orange-500/50 border-dashed neon-orange'
  },
  indigo: {
    text: 'text-indigo-500',
    border: 'border-indigo-500/80',
    shadow: 'shadow-[0_0_10px_rgba(99,102,241,0.3)]',
    bg: 'bg-indigo-950/20',
    destBorder: 'border border-dashed border-indigo-500/50'
  },
  cyan: {
    text: 'text-cyan-300',
    border: 'border-cyan-400/80',
    shadow: 'shadow-[0_0_10px_rgba(34,211,238,0.3)]',
    bg: 'bg-cyan-950/20',
    destBorder: 'border border-dashed border-cyan-500/50'
  },
  white: {
    text: 'text-white',
    border: 'border-white/80',
    shadow: 'shadow-[0_0_10px_rgba(255,255,255,0.4)]',
    bg: 'bg-zinc-800/20',
    destBorder: 'border border-dashed border-white/50'
  },
  sky: {
    text: 'text-sky-300',
    border: 'border-sky-300/80',
    shadow: 'shadow-[0_0_10px_rgba(125,211,252,0.3)]',
    bg: 'bg-sky-950/20',
    destBorder: 'border border-dashed border-sky-400/50'
  },
  teal: {
    text: 'text-teal-400',
    border: 'border-teal-500/80',
    shadow: 'shadow-[0_0_10px_rgba(20,184,166,0.3)]',
    bg: 'bg-teal-950/20',
    destBorder: 'border border-dashed border-teal-500/50'
  },
  cobalt: {
    text: 'text-blue-400',
    border: 'border-blue-400/80',
    shadow: 'shadow-[0_0_10px_rgba(59,130,246,0.3)]',
    bg: 'bg-blue-950/20',
    destBorder: 'border border-dashed border-blue-500/50'
  },
  emerald: {
    text: 'text-emerald-500',
    border: 'border-emerald-500/80',
    shadow: 'shadow-[0_0_10px_rgba(16,185,129,0.3)]',
    bg: 'bg-emerald-950/20',
    destBorder: 'border border-dashed border-emerald-500/50'
  },
  amber: {
    text: 'text-amber-600',
    border: 'border-amber-600/80',
    shadow: 'shadow-[0_0_10px_rgba(217,119,6,0.3)]',
    bg: 'bg-amber-950/20',
    destBorder: 'border border-dashed border-amber-600/50'
  },
  crimson: {
    text: 'text-red-500',
    border: 'border-red-500/80',
    shadow: 'shadow-[0_0_10px_rgba(239,68,68,0.3)]',
    bg: 'bg-red-950/20',
    destBorder: 'border border-dashed border-red-500/50'
  },
  pink: {
    text: 'text-pink-400',
    border: 'border-pink-400/80',
    shadow: 'shadow-[0_0_10px_rgba(244,63,94,0.3)]',
    bg: 'bg-pink-950/20',
    destBorder: 'border border-dashed border-pink-400/50'
  },
  lime: {
    text: 'text-lime-500',
    border: 'border-lime-500/80',
    shadow: 'shadow-[0_0_10px_rgba(132,204,22,0.3)]',
    bg: 'bg-lime-950/20',
    destBorder: 'border border-dashed border-lime-500/50'
  },
  fuchsia: {
    text: 'text-fuchsia-400',
    border: 'border-fuchsia-400/80',
    shadow: 'shadow-[0_0_10px_rgba(232,121,249,0.3)]',
    bg: 'bg-fuchsia-950/20',
    destBorder: 'border border-dashed border-fuchsia-400/50'
  },
  rose: {
    text: 'text-rose-400',
    border: 'border-rose-400/80',
    shadow: 'shadow-[0_0_10px_rgba(251,113,133,0.3)]',
    bg: 'bg-rose-950/20',
    destBorder: 'border border-dashed border-rose-400/50'
  }
};

export const getRadiusStyle = (themeId: ThemeId) => {
  switch (themeId) {
    case 'winter': return 'rounded-lg';
    case 'forest': return 'rounded-xl';
    case 'candy': return 'rounded-2xl';
    case 'neon':
    default: return 'rounded-md sm:rounded-lg md:rounded-xl';
  }
};

export const getBlockColors = (themeConfig: ThemeConfig, themeId: ThemeId, blockType: BlockType) => {
  const cellConfig = themeConfig[blockType];
  const palette = COLOR_PALETTES[cellConfig.color] || COLOR_PALETTES.red;
  return {
    text: palette.text,
    border: `border ${palette.border} ${themeId === 'neon' ? palette.shadow : ''}`,
    shadow: themeId === 'neon' ? palette.shadow : ''
  };
};

export const getDestinationStyle = (themeConfig: ThemeConfig, themeId: ThemeId, destType: BlockType) => {
  const cellConfig = themeConfig[destType];
  const palette = COLOR_PALETTES[cellConfig.color] || COLOR_PALETTES.red;
  
  const baseThemeId = getBaseThemeId(themeId);
  let border = palette.destBorder;
  if (baseThemeId !== 'neon') {
    // Strip neon-XYZ and shadow-[...] classes on non-neon themes
    border = border.replace(/\bneon-\w+\b/g, '')
                   .replace(/\bshadow-\[.*?\]\b/g, '')
                   .trim();
  }
  
  return {
    bg: palette.bg,
    border: border,
    text: palette.text
  };
};

const positionKey = (pos: Position) => `${pos.x},${pos.y}`;

export const ThemeBoardRenderer = ({
  gridSize,
  walls,
  destinations,
  blocks,
  playerPos,
  activeTheme,
  themeConfig,
  cellSize = 'var(--cell-size)',
  gridPadding = 'var(--grid-padding)',
  isAnimated = true,
  prevBlocks,
  prevPlayerPos,
  activeThemeStyle,
  lastAction = 'load',
}: {
  gridSize: number;
  walls: Position[];
  destinations: DestinationData[];
  blocks: BlockData[];
  playerPos: Position;
  activeTheme: ThemeId;
  themeConfig?: ThemeConfig | undefined;
  cellSize?: string;
  gridPadding?: string;
  isAnimated?: boolean;
  prevBlocks?: BlockData[];
  prevPlayerPos?: Position;
  activeThemeStyle?: Theme | undefined;
  activeTrail?: TrailId;
  isPreview?: boolean;
  lastAction?: 'push' | 'undo' | 'reset' | 'load' | 'move';
}) => {
  const baseThemeId = getBaseThemeId(activeTheme);
  const defaultStyles = THEME_STYLES[baseThemeId] || THEME_STYLES.neon;
  const styles = {
    bgClass: activeThemeStyle?.bgGradient || defaultStyles.bgClass,
    panelClass: activeThemeStyle?.panelClass || defaultStyles.panelClass,
    cellClass: activeThemeStyle?.cellClass || defaultStyles.cellClass,
    wallClass: activeThemeStyle?.wallClass || defaultStyles.wallClass,
  };
  const config = themeConfig || DEFAULT_THEME_CONFIGS[baseThemeId] || DEFAULT_THEME_CONFIGS.neon;
  const wallSet = new Set(walls.map(w => positionKey(w)));
  const destinationMap = new Map(destinations.map(d => [positionKey(d.pos), d]));

  const inlineStyles: React.CSSProperties & Record<string, string | number> = {
    display: 'grid',
    gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
    gap: '1px',
    maxWidth: '100vw',
    maxHeight: '100vh',
    width: 'fit-content',
    aspectRatio: '1',
    '--grid-size': String(gridSize),
  };

  if (cellSize !== 'var(--cell-size)') {
    inlineStyles['--cell-size'] = cellSize;
  }
  if (gridPadding !== 'var(--grid-padding)') {
    inlineStyles['--grid-padding'] = gridPadding;
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
        let radiusStyle = getRadiusStyle(baseThemeId);

        const destStyle = hasDestination ? getDestinationStyle(config, activeTheme, destination.type) : null;

        if (hasWall) {
          bgColor = styles.wallClass;
          borderStyle = '';
          if (baseThemeId === 'neon') {
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
              <PuzzleShape shape={config[destination.type].shape} className="w-1/2 h-1/2 opacity-35" />
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

          const colors = getBlockColors(config, baseThemeId, block.type);
          let content;
          const radiusStyle = getRadiusStyle(baseThemeId);
          const blockBgCorrect = baseThemeId === 'winter' ? 'bg-sky-950/35' : baseThemeId === 'forest' ? 'bg-stone-950/35' : baseThemeId === 'candy' ? 'bg-pink-950/30' : 'bg-black/40';
          const blockBgIncorrect = baseThemeId === 'winter' ? 'bg-slate-900/85' : baseThemeId === 'forest' ? 'bg-stone-900/85' : baseThemeId === 'candy' ? 'bg-fuchsia-950/80' : 'bg-black/75';

          if (isCorrectDestination) {
            const borderClass = colors.border.replace(/\bborder\b/, 'border-2');
            content = (
              <div className={`w-full h-full ${radiusStyle} flex items-center justify-center ${blockBgCorrect} ${borderClass} ${colors.text} ${isAnimated ? 'animate-pulse-glow' : ''}`}>
                <PuzzleShape shape={config[block.type].shape} className="w-1/2 h-1/2 drop-shadow-[0_0_8px_currentColor]" />
              </div>
            );
          } else {
            const borderClass = colors.border
              .replace(/neon-\w+/, '')
              .replace(/shadow-\[.*?\]/, '')
              .trim();
            content = (
              <div className={`w-full h-full ${radiusStyle} flex items-center justify-center ${blockBgIncorrect} ${borderClass} backdrop-blur-sm`}>
                <PuzzleShape shape={config[block.type].shape} className="w-1/2 h-1/2 text-zinc-600" />
              </div>
            );
          }

          const prevBlock = prevBlocks?.[idx];
          const prevPos = prevBlock ? prevBlock.pos : block.pos;
          const dx = block.pos.x - prevPos.x;
          const dy = block.pos.y - prevPos.y;
          const distance = Math.abs(dx) + Math.abs(dy);

          const shouldAnimate = isAnimated && (lastAction === 'push' || lastAction === 'move') && distance > 0;
          const speedPerCell = 120; // ms per cell
          const duration = shouldAnimate ? distance * speedPerCell : 0;

          return (
            <div
              key={`block-${idx}`}
              className="absolute aspect-square"
              style={{
                width: 'var(--cell-size)',
                height: 'var(--cell-size)',
                transform: `translate(calc(${block.pos.x} * (var(--cell-size) + 1px)), calc(${block.pos.y} * (var(--cell-size) + 1px)))`,
                transition: shouldAnimate ? `transform ${duration}ms cubic-bezier(0.25, 1, 0.5, 1)` : 'none',
              }}
            >
              {content}
            </div>
          );
        })}

        {(() => {
          let playerElement = null;

          if (baseThemeId === 'winter') {
            playerElement = (
              <div className="w-full h-full rounded-full flex items-center justify-center bg-sky-950/80 border-2 border-sky-400 shadow-[0_0_20px_rgba(34,211,238,0.7)] relative overflow-hidden animate-pulse">
                <div className="w-1/3 h-1/3 bg-white rounded-full shadow-[0_0_12px_rgba(255,255,255,1)]"></div>
                <div className="absolute inset-0.5 border border-dashed border-cyan-300/40 rounded-full animate-[spin_12s_linear_infinite]"></div>
              </div>
            );
          } else if (baseThemeId === 'forest') {
            playerElement = (
              <div className="w-full h-full rounded-full flex items-center justify-center bg-stone-900/80 border-2 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)] relative overflow-hidden">
                <div className="w-1/3 h-1/3 bg-yellow-500 rounded-full shadow-[0_0_8px_rgba(234,88,12,0.8)]"></div>
                <div className="absolute inset-0.5 border border-dashed border-emerald-500/30 rounded-full animate-[spin_15s_linear_infinite]"></div>
              </div>
            );
          } else if (baseThemeId === 'candy') {
            playerElement = (
              <div className="w-full h-full rounded-full flex items-center justify-center bg-pink-950/80 border-2 border-pink-400 shadow-[0_0_20px_rgba(244,63,94,0.6)] relative overflow-hidden">
                <div className="w-1/3 h-1/3 bg-yellow-300 rounded-full shadow-[0_0_8px_rgba(250,204,21,1)]"></div>
                <div className="absolute inset-0.5 border border-dotted border-pink-300/50 rounded-full animate-[spin_8s_linear_infinite]"></div>
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
          const dx = playerPos.x - prevPos.x;
          const dy = playerPos.y - prevPos.y;
          const distance = Math.abs(dx) + Math.abs(dy);

          const shouldAnimate = isAnimated && (lastAction === 'push' || lastAction === 'move') && distance > 0;
          const speedPerCell = 120; // ms per cell
          const duration = shouldAnimate ? distance * speedPerCell : 0;

          return (
            <div
              className="absolute aspect-square"
              style={{
                width: 'var(--cell-size)',
                height: 'var(--cell-size)',
                transform: `translate(calc(${playerPos.x} * (var(--cell-size) + 1px)), calc(${playerPos.y} * (var(--cell-size) + 1px)))`,
                transition: shouldAnimate ? `transform ${duration}ms cubic-bezier(0.25, 1, 0.5, 1)` : 'none',
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
