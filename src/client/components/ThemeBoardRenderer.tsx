import React, { useRef, useEffect } from 'react';
import { Position, BlockData, DestinationData, BlockType } from '../types';
import { ThemeId, ThemeConfig, ColorId, DEFAULT_THEME_CONFIGS, getBaseThemeId, Theme, BaseThemeId } from '../../shared/themes';
import { PuzzleShape } from './PuzzleShape';
import { TrailId } from '../../shared/trails';

interface ThemeStyles {
  bgClass: string;
  panelClass: string;
  cellClass: string;
  wallClass: string;
}

export const THEME_STYLES: Record<BaseThemeId, ThemeStyles> = {
  neon: {
    bgClass: 'bg-gradient-to-br from-slate-950 via-cyan-950 to-zinc-950',
    panelClass: 'bg-cyan-950/40 border-4 border-cyan-500/80 rounded-2xl shadow-[6px_6px_0px_rgba(6,182,212,0.5)]',
    cellClass: 'bg-cyan-950/20 border-2 border-cyan-800/40 shadow-[inset_3px_3px_0px_rgba(0,0,0,0.6)] rounded-xl',
    wallClass: 'bg-cyan-950/20 border-2 border-cyan-800/40 shadow-[inset_3px_3px_0px_rgba(0,0,0,0.6)] rounded-xl',
  },
  winter: {
    bgClass: 'bg-gradient-to-br from-slate-950 via-sky-950 to-slate-900',
    panelClass: 'bg-sky-950/50 border-4 border-sky-400/80 rounded-2xl shadow-[6px_6px_0px_rgba(56,189,248,0.5)]',
    cellClass: 'bg-sky-950/30 border-2 border-sky-800/50 shadow-[inset_3px_3px_0px_rgba(0,0,0,0.6)] rounded-xl',
    wallClass: 'bg-sky-950/30 border-2 border-sky-800/50 shadow-[inset_3px_3px_0px_rgba(0,0,0,0.6)] rounded-xl',
  },
  forest: {
    bgClass: 'bg-gradient-to-br from-stone-950 via-emerald-950 to-stone-900',
    panelClass: 'bg-emerald-950/50 border-4 border-emerald-500/80 rounded-2xl shadow-[6px_6px_0px_rgba(16,185,129,0.5)]',
    cellClass: 'bg-emerald-950/30 border-2 border-emerald-800/50 shadow-[inset_3px_3px_0px_rgba(0,0,0,0.6)] rounded-xl',
    wallClass: 'bg-emerald-950/30 border-2 border-emerald-800/50 shadow-[inset_3px_3px_0px_rgba(0,0,0,0.6)] rounded-xl',
  },
  candy: {
    bgClass: 'bg-gradient-to-br from-pink-950 via-purple-950 to-slate-950',
    panelClass: 'bg-pink-950/50 border-4 border-pink-400/80 rounded-2xl shadow-[6px_6px_0px_rgba(244,63,94,0.5)]',
    cellClass: 'bg-pink-950/30 border-2 border-pink-800/50 shadow-[inset_3px_3px_0px_rgba(0,0,0,0.6)] rounded-xl',
    wallClass: 'bg-pink-950/30 border-2 border-pink-800/50 shadow-[inset_3px_3px_0px_rgba(0,0,0,0.6)] rounded-xl',
  },
  space: {
    bgClass: 'bg-gradient-to-br from-indigo-950 via-slate-950 to-blue-950',
    panelClass: 'bg-indigo-950/50 border-4 border-indigo-400/80 rounded-2xl shadow-[6px_6px_0px_rgba(99,102,241,0.5)]',
    cellClass: 'bg-indigo-950/30 border-2 border-indigo-800/50 shadow-[inset_3px_3px_0px_rgba(0,0,0,0.6)] rounded-xl',
    wallClass: 'bg-indigo-950/30 border-2 border-indigo-800/50 shadow-[inset_3px_3px_0px_rgba(0,0,0,0.6)] rounded-xl',
  },
  ocean: {
    bgClass: 'bg-gradient-to-br from-blue-950 via-cyan-950 to-slate-950',
    panelClass: 'bg-sky-950/50 border-4 border-cyan-400/80 rounded-2xl shadow-[6px_6px_0px_rgba(34,211,238,0.5)]',
    cellClass: 'bg-cyan-950/30 border-2 border-cyan-800/50 shadow-[inset_3px_3px_0px_rgba(0,0,0,0.6)] rounded-xl',
    wallClass: 'bg-cyan-950/30 border-2 border-cyan-800/50 shadow-[inset_3px_3px_0px_rgba(0,0,0,0.6)] rounded-xl',
  },
  retro: {
    bgClass: 'bg-gradient-to-br from-zinc-950 via-stone-950 to-black',
    panelClass: 'bg-zinc-900 border-4 border-zinc-600/80 rounded-2xl shadow-[6px_6px_0px_rgba(0,0,0,0.8)]',
    cellClass: 'bg-zinc-950/80 border-2 border-zinc-800 shadow-[inset_3px_3px_0px_rgba(0,0,0,0.6)] rounded-xl',
    wallClass: 'bg-zinc-950/80 border-2 border-zinc-800 shadow-[inset_3px_3px_0px_rgba(0,0,0,0.6)] rounded-xl',
  },
  desert: {
    bgClass: 'bg-gradient-to-br from-amber-950 via-yellow-950 to-stone-950',
    panelClass: 'bg-amber-950/50 border-4 border-amber-500/80 rounded-2xl shadow-[6px_6px_0px_rgba(245,158,11,0.5)]',
    cellClass: 'bg-amber-950/30 border-2 border-amber-800/50 shadow-[inset_3px_3px_0px_rgba(0,0,0,0.6)] rounded-xl',
    wallClass: 'bg-amber-950/30 border-2 border-amber-800/50 shadow-[inset_3px_3px_0px_rgba(0,0,0,0.6)] rounded-xl',
  },
  spooky: {
    bgClass: 'bg-gradient-to-br from-zinc-950 via-purple-950 to-black',
    panelClass: 'bg-purple-950/50 border-4 border-purple-500/80 rounded-2xl shadow-[6px_6px_0px_rgba(168,85,247,0.5)]',
    cellClass: 'bg-purple-950/30 border-2 border-purple-800/50 shadow-[inset_3px_3px_0px_rgba(0,0,0,0.6)] rounded-xl',
    wallClass: 'bg-purple-950/30 border-2 border-purple-800/50 shadow-[inset_3px_3px_0px_rgba(0,0,0,0.6)] rounded-xl',
  },
  volcanic: {
    bgClass: 'bg-gradient-to-br from-red-950 via-amber-950 to-black',
    panelClass: 'bg-red-950/50 border-4 border-red-500/80 rounded-2xl shadow-[6px_6px_0px_rgba(239,68,68,0.5)]',
    cellClass: 'bg-red-950/30 border-2 border-red-800/50 shadow-[inset_3px_3px_0px_rgba(0,0,0,0.6)] rounded-xl',
    wallClass: 'bg-red-950/30 border-2 border-red-800/50 shadow-[inset_3px_3px_0px_rgba(0,0,0,0.6)] rounded-xl',
  },
  vantage: {
    bgClass: 'bg-gradient-to-b from-orange-950 via-amber-950 to-stone-950',
    panelClass: 'bg-stone-900 border-4 border-amber-600/80 rounded-2xl shadow-[6px_6px_0px_rgba(0,0,0,0.8)]',
    cellClass: 'bg-stone-950/80 border-2 border-stone-800 shadow-[inset_3px_3px_0px_rgba(0,0,0,0.6)] rounded-xl',
    wallClass: 'bg-stone-950/80 border-2 border-stone-800 shadow-[inset_3px_3px_0px_rgba(0,0,0,0.6)] rounded-xl',
  },
  papercraft: {
    bgClass: 'paper-cardstock',
    panelClass: 'bg-[#1c1917] border-4 border-[#78350f] rounded-2xl shadow-[6px_6px_0px_rgba(0,0,0,0.7)]',
    cellClass: 'bg-[#292524] border-2 border-[#44403c] rounded-xl shadow-[inset_2px_2px_0px_rgba(0,0,0,0.6)]',
    wallClass: 'bg-[#292524] border-2 border-[#44403c] rounded-xl shadow-[inset_2px_2px_0px_rgba(0,0,0,0.6)]',
  },
};

export const COLOR_PALETTES: Record<ColorId, {
  text: string;
  border: string;
  shadow: string;
  bg: string;
  destBorder: string;
  colorHex: string;
}> = {
  red: {
    text: 'text-red-500',
    border: 'border-red-500/80',
    shadow: 'shadow-[0_0_15px_rgba(239,68,68,0.5)] neon-red',
    bg: 'bg-red-950/20',
    destBorder: 'border border-red-500/50 border-dashed neon-red',
    colorHex: '#ef4444'
  },
  blue: {
    text: 'text-blue-500',
    border: 'border-blue-500/80',
    shadow: 'shadow-[0_0_15px_rgba(59,130,246,0.5)] neon-blue',
    bg: 'bg-blue-950/20',
    destBorder: 'border border-blue-500/50 border-dashed neon-blue',
    colorHex: '#3b82f6'
  },
  yellow: {
    text: 'text-yellow-400',
    border: 'border-yellow-400/80',
    shadow: 'shadow-[0_0_15px_rgba(250,204,21,0.5)] neon-yellow',
    bg: 'bg-yellow-950/20',
    destBorder: 'border border-yellow-500/50 border-dashed neon-yellow',
    colorHex: '#eab308'
  },
  purple: {
    text: 'text-purple-500',
    border: 'border-purple-500/80',
    shadow: 'shadow-[0_0_15px_rgba(168,85,247,0.5)] neon-purple',
    bg: 'bg-purple-950/20',
    destBorder: 'border border-purple-500/50 border-dashed neon-purple',
    colorHex: '#a855f7'
  },
  green: {
    text: 'text-green-500',
    border: 'border-green-500/80',
    shadow: 'shadow-[0_0_15px_rgba(34,197,94,0.5)] neon-green',
    bg: 'bg-green-950/20',
    destBorder: 'border border-green-500/50 border-dashed neon-green',
    colorHex: '#22c55e'
  },
  orange: {
    text: 'text-orange-500',
    border: 'border-orange-500/80',
    shadow: 'shadow-[0_0_15px_rgba(249,115,22,0.5)] neon-orange',
    bg: 'bg-orange-950/20',
    destBorder: 'border border-orange-500/50 border-dashed neon-orange',
    colorHex: '#f97316'
  },
  indigo: {
    text: 'text-indigo-500',
    border: 'border-indigo-500/80',
    shadow: 'shadow-[0_0_10px_rgba(99,102,241,0.3)]',
    bg: 'bg-indigo-950/20',
    destBorder: 'border border-dashed border-indigo-500/50',
    colorHex: '#6366f1'
  },
  cyan: {
    text: 'text-cyan-300',
    border: 'border-cyan-400/80',
    shadow: 'shadow-[0_0_10px_rgba(34,211,238,0.3)]',
    bg: 'bg-cyan-950/20',
    destBorder: 'border border-dashed border-cyan-500/50',
    colorHex: '#06b6d4'
  },
  white: {
    text: 'text-white',
    border: 'border-white/80',
    shadow: 'shadow-[0_0_10px_rgba(255,255,255,0.4)]',
    bg: 'bg-zinc-800/20',
    destBorder: 'border border-dashed border-white/50',
    colorHex: '#ffffff'
  },
  sky: {
    text: 'text-sky-300',
    border: 'border-sky-300/80',
    shadow: 'shadow-[0_0_10px_rgba(125,211,252,0.3)]',
    bg: 'bg-sky-950/20',
    destBorder: 'border border-dashed border-sky-400/50',
    colorHex: '#38bdf8'
  },
  teal: {
    text: 'text-teal-400',
    border: 'border-teal-500/80',
    shadow: 'shadow-[0_0_10px_rgba(20,184,166,0.3)]',
    bg: 'bg-teal-950/20',
    destBorder: 'border border-dashed border-teal-500/50',
    colorHex: '#14b8a6'
  },
  cobalt: {
    text: 'text-blue-400',
    border: 'border-blue-400/80',
    shadow: 'shadow-[0_0_10px_rgba(59,130,246,0.3)]',
    bg: 'bg-blue-950/20',
    destBorder: 'border border-dashed border-blue-500/50',
    colorHex: '#2563eb'
  },
  emerald: {
    text: 'text-emerald-500',
    border: 'border-emerald-500/80',
    shadow: 'shadow-[0_0_10px_rgba(16,185,129,0.3)]',
    bg: 'bg-emerald-950/20',
    destBorder: 'border border-dashed border-emerald-500/50',
    colorHex: '#10b981'
  },
  amber: {
    text: 'text-amber-500',
    border: 'border-amber-500/80',
    shadow: 'shadow-[0_0_10px_rgba(245,158,11,0.3)]',
    bg: 'bg-amber-950/20',
    destBorder: 'border border-dashed border-amber-500/50',
    colorHex: '#f59e0b'
  },
  crimson: {
    text: 'text-red-500',
    border: 'border-red-500/80',
    shadow: 'shadow-[0_0_10px_rgba(239,68,68,0.3)]',
    bg: 'bg-red-950/20',
    destBorder: 'border border-dashed border-red-500/50',
    colorHex: '#dc2626'
  },
  pink: {
    text: 'text-pink-400',
    border: 'border-pink-400/80',
    shadow: 'shadow-[0_0_10px_rgba(244,63,94,0.3)]',
    bg: 'bg-pink-950/20',
    destBorder: 'border border-dashed border-pink-400/50',
    colorHex: '#ec4899'
  },
  lime: {
    text: 'text-lime-500',
    border: 'border-lime-500/80',
    shadow: 'shadow-[0_0_10px_rgba(132,204,22,0.3)]',
    bg: 'bg-lime-950/20',
    destBorder: 'border border-dashed border-lime-500/50',
    colorHex: '#84cc16'
  },
  fuchsia: {
    text: 'text-fuchsia-400',
    border: 'border-fuchsia-400/80',
    shadow: 'shadow-[0_0_10px_rgba(232,121,249,0.3)]',
    bg: 'bg-fuchsia-950/20',
    destBorder: 'border border-dashed border-fuchsia-400/50',
    colorHex: '#d946ef'
  },
  rose: {
    text: 'text-rose-400',
    border: 'border-rose-400/80',
    shadow: 'shadow-[0_0_10px_rgba(251,113,133,0.3)]',
    bg: 'bg-rose-950/20',
    destBorder: 'border border-dashed border-rose-400/50',
    colorHex: '#f43f5e'
  },
  stone: {
    text: 'text-stone-300',
    border: 'border-2 border-stone-400/90',
    shadow: 'shadow-[3px_3px_0px_rgba(0,0,0,0.7)]',
    bg: 'bg-stone-800/40',
    destBorder: 'border-2 border-stone-400/60 border-dashed',
    colorHex: '#d6d3d1'
  },
  slate: {
    text: 'text-slate-300',
    border: 'border-2 border-slate-400/90',
    shadow: 'shadow-[3px_3px_0px_rgba(0,0,0,0.7)]',
    bg: 'bg-slate-800/40',
    destBorder: 'border-2 border-slate-400/60 border-dashed',
    colorHex: '#cbd5e1'
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

const getWallStyle = (themeId: string): string => {
  const base = getBaseThemeId(themeId);
  switch (base) {
    case 'winter':
      return 'bg-sky-400 border-2 border-sky-200/80 shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),0_4px_12px_rgba(56,189,248,0.5)]';
    case 'forest':
      return 'bg-emerald-500 border-2 border-emerald-300/80 shadow-[inset_0_2px_4px_rgba(255,255,255,0.35),0_4px_12px_rgba(16,185,129,0.5)]';
    case 'candy':
      return 'bg-pink-500 border-2 border-pink-200/80 shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),0_4px_12px_rgba(244,63,94,0.5)]';
    case 'space':
      return 'bg-indigo-500 border-2 border-indigo-300/80 shadow-[inset_0_2px_4px_rgba(255,255,255,0.35),0_4px_12px_rgba(129,140,248,0.5)]';
    case 'ocean':
      return 'bg-cyan-500 border-2 border-cyan-200/80 shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),0_4px_12px_rgba(34,211,238,0.5)]';
    case 'retro':
      return 'bg-fuchsia-500 border-2 border-fuchsia-300/80 shadow-[inset_0_2px_4px_rgba(255,255,255,0.35),0_4px_12px_rgba(232,121,249,0.5)]';
    case 'desert':
      return 'bg-amber-400 border-2 border-amber-200/80 shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),0_4px_12px_rgba(251,191,36,0.5)]';
    case 'spooky':
      return 'bg-purple-600 border-2 border-purple-300/80 shadow-[inset_0_2px_4px_rgba(255,255,255,0.35),0_4px_12px_rgba(168,85,247,0.5)]';
    case 'volcanic':
      return 'bg-red-600 border-2 border-red-400/80 shadow-[inset_0_2px_4px_rgba(255,255,255,0.35),0_4px_12px_rgba(239,68,68,0.6)]';
    case 'vantage':
      return 'bg-amber-600 border-2 border-amber-300/80 shadow-[inset_0_2px_4px_rgba(255,255,255,0.35),0_4px_12px_rgba(245,158,11,0.5)]';
    case 'papercraft':
      return 'bg-[#b45309] border-2 border-[#fef3c7]/60 shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),0_4px_12px_rgba(0,0,0,0.5)]';
    case 'neon':
    default:
      return 'bg-cyan-500 border-2 border-cyan-200/80 shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),0_4px_12px_rgba(6,182,212,0.5)]';
  }
};

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
  activeCharacter,
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
  activeCharacter?: string;
}) => {
  const recentlyMatchedRef = useRef<Map<string, number>>(new Map());
  const blockAnimStateRef = useRef<Map<number, { lastPos: Position; targetPos: Position; startTime: number; duration: number }>>(new Map());
  const playerAnimStateRef = useRef<{ lastPos: Position; targetPos: Position; startTime: number; duration: number }>({
    lastPos: playerPos,
    targetPos: playerPos,
    startTime: 0,
    duration: 0,
  });

  useEffect(() => {
    if (lastAction === 'reset' || lastAction === 'load' || lastAction === 'undo') {
      recentlyMatchedRef.current.clear();
      blockAnimStateRef.current.clear();
      playerAnimStateRef.current = {
        lastPos: playerPos,
        targetPos: playerPos,
        startTime: 0,
        duration: 0,
      };
    }
  }, [lastAction, playerPos]);

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
        let customStyle: React.CSSProperties = {};

        const destStyle = hasDestination ? getDestinationStyle(config, activeTheme, destination.type) : null;

        if (hasWall) {
          bgColor = getWallStyle(activeCharacter || activeTheme);
          borderStyle = '';
          radiusStyle = 'rounded-xl';
        } else if (hasDestination && destStyle) {
          bgColor = 'backdrop-blur-sm';
          borderStyle = `border border-current/15 ${destStyle.text}`;
          
          const palette = COLOR_PALETTES[config[destination.type].color] || COLOR_PALETTES.red;
          const colorHex = palette.colorHex || '#ef4444';
          
          customStyle = {
            background: `radial-gradient(circle, ${colorHex}18 0%, ${colorHex}03 65%, transparent 100%)`
          };
        }

        return (
          <div
            key={i}
            className={`aspect-square ${radiusStyle} flex items-center justify-center text-lg sm:text-2xl font-bold transition-all relative ${bgColor} ${borderStyle}`}
            style={{ 
              width: 'var(--cell-size)', 
              height: 'var(--cell-size)',
              ...customStyle
            }}
          >
            {!hasWall && hasDestination && destStyle && (
              <div className="absolute inset-0 w-full h-full flex items-center justify-center pointer-events-none">
                {/* Corner Reticles */}
                <svg className={`absolute inset-0 w-full h-full ${destStyle.text} opacity-35`} viewBox="0 0 100 100" fill="none">
                  <path d="M 8 16 V 8 H 16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M 92 16 V 8 H 84" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M 8 84 V 92 H 16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M 92 84 V 92 H 84" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>

                {/* Pulsing Hologram Container */}
                <div className="absolute inset-0 w-full h-full flex items-center justify-center animate-pulse-glow">
                  {/* Dashed Hexagon Silhouette */}
                  <svg className={`absolute inset-0 w-full h-full ${destStyle.text}`} viewBox="0 0 100 100" fill="none">
                    <polygon
                      points="50,5 89,27 89,73 50,95 11,73 11,27"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeDasharray="6 4"
                      className="opacity-30"
                    />
                  </svg>
                  
                  {/* Inner Watermark Shape */}
                  <div className={`w-1/2 h-1/2 ${destStyle.text} opacity-45 flex items-center justify-center`}>
                    <PuzzleShape shape={config[destination.type].shape} className="w-full h-full" />
                  </div>
                </div>
              </div>
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
          const blockBgCorrect = baseThemeId === 'winter' ? 'fill-sky-950/35' : baseThemeId === 'forest' ? 'fill-stone-950/35' : baseThemeId === 'candy' ? 'fill-pink-950/30' : 'fill-black/40';
          const blockBgIncorrect = baseThemeId === 'winter' ? 'fill-slate-900/85' : baseThemeId === 'forest' ? 'fill-stone-900/85' : baseThemeId === 'candy' ? 'fill-fuchsia-950/80' : 'fill-black/75';

          // eslint-disable-next-line react-hooks/purity
          const now = Date.now();
          let anim = blockAnimStateRef.current.get(idx);

          if (!anim) {
            const prevBlock = prevBlocks?.[idx];
            const startPos = prevBlock ? prevBlock.pos : block.pos;
            anim = { lastPos: startPos, targetPos: block.pos, startTime: 0, duration: 0 };
            blockAnimStateRef.current.set(idx, anim);
          } else if (anim.targetPos.x !== block.pos.x || anim.targetPos.y !== block.pos.y) {
            const prevBlock = prevBlocks?.[idx];
            const startPos = prevBlock ? prevBlock.pos : anim.targetPos;
            const dx = block.pos.x - startPos.x;
            const dy = block.pos.y - startPos.y;
            const distance = Math.abs(dx) + Math.abs(dy);
            const isInstant = lastAction === 'reset' || lastAction === 'undo' || lastAction === 'load';
            const duration = isInstant || !isAnimated || distance === 0 ? 0 : distance * 120;

            anim = {
              lastPos: startPos,
              targetPos: block.pos,
              startTime: now,
              duration,
            };
            blockAnimStateRef.current.set(idx, anim);
          }

          const timeElapsed = now - anim.startTime;
          const isMidSlide = anim.duration > 0 && timeElapsed < anim.duration + 50;
          const shouldAnimate = isAnimated && isMidSlide;
          const duration = anim.duration;

          if (isCorrectDestination) {
            const destKey = `${block.type}-${destination!.pos.x},${destination!.pos.y}`;
            const wasCorrect = anim.lastPos.x === destination!.pos.x && anim.lastPos.y === destination!.pos.y;
            const isFreshMove = shouldAnimate && !wasCorrect;

            let matchTime = recentlyMatchedRef.current.get(destKey);
            if (isFreshMove) {
              // eslint-disable-next-line react-hooks/purity
              matchTime = Date.now();
              recentlyMatchedRef.current.set(destKey, matchTime);
            }

            // eslint-disable-next-line react-hooks/purity
            const timeSinceMatch = matchTime ? Date.now() - matchTime : Infinity;
            const isFreshLand = timeSinceMatch < 1000;
            const delayMs = Math.max(0, duration - 30);

            content = (
              <div
                className={`w-full h-full relative flex items-center justify-center ${isFreshLand ? 'animate-endzone-pop' : ''}`}
                style={isFreshLand ? { animationDelay: `${delayMs}ms` } : undefined}
              >
                {/* Expanding Shockwave Circle Ring on Fresh Land */}
                {isFreshLand && (
                  <svg
                    className={`absolute -inset-4 w-[calc(100%+2rem)] h-[calc(100%+2rem)] ${colors.text} pointer-events-none animate-endzone-ring z-0`}
                    style={{ animationDelay: `${delayMs}ms` }}
                    viewBox="0 0 100 100"
                    fill="none"
                  >
                    <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="4" />
                  </svg>
                )}

                {/* Block Hexagon Tile */}
                <svg className={`w-full h-full absolute inset-0 ${isAnimated ? 'animate-pulse-glow' : ''} ${colors.text} drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]`} viewBox="0 0 100 100" fill="none">
                  <polygon
                    points="50,5 89,27 89,73 50,95 11,73 11,27"
                    className={blockBgCorrect}
                    stroke="currentColor"
                    strokeWidth="4.5"
                  />
                </svg>

                {/* Shape inside */}
                <div className={`relative z-10 w-1/2 h-1/2 ${colors.text} flex items-center justify-center`}>
                  <PuzzleShape shape={config[block.type].shape} className="w-full h-full drop-shadow-[2px_2px_0px_rgba(0,0,0,0.8)]" />
                </div>
              </div>
            );
          } else {
            content = (
              <div className="w-full h-full relative flex items-center justify-center">
                <svg className={`w-full h-full absolute inset-0 ${colors.text}`} viewBox="0 0 100 100" fill="none">
                  <polygon
                    points="50,5 89,27 89,73 50,95 11,73 11,27"
                    className={blockBgIncorrect}
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeOpacity="0.6"
                  />
                </svg>
                <div className="relative z-10 w-1/2 h-1/2 text-zinc-400 flex items-center justify-center">
                  <PuzzleShape shape={config[block.type].shape} className="w-full h-full opacity-60 drop-shadow-[1px_1px_0px_rgba(0,0,0,0.6)]" />
                </div>
              </div>
            );
          }

          return (
            <div
              key={`block-${idx}`}
              className="absolute aspect-square filter drop-shadow-[3px_3px_0px_rgba(0,0,0,0.65)]"
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
          const charId = activeCharacter || 'neon';

          const renderCharacterOrb = (id: string) => {
            switch (id) {
              case 'winter':
                return (
                  <div className="w-full h-full rounded-full flex items-center justify-center bg-slate-950/80 border-2 border-sky-300 shadow-[0_0_15px_rgba(56,189,248,0.8)] relative overflow-hidden animate-pulse">
                    <div className="w-1/3 h-1/3 bg-sky-200 rounded-full shadow-[0_0_12px_rgba(186,230,253,1)] flex items-center justify-center text-sky-950 p-0.5 z-10">
                      <PuzzleShape shape="snowflake" className="w-full h-full" />
                    </div>
                    <div className="absolute inset-0.5 border border-dashed border-sky-300/40 rounded-full animate-[spin_8s_linear_infinite]"></div>
                  </div>
                );
              case 'forest':
                return (
                  <div className="w-full h-full rounded-full flex items-center justify-center bg-stone-950/80 border-2 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.8)] relative overflow-hidden animate-pulse">
                    <div className="w-1/3 h-1/3 bg-emerald-300 rounded-full shadow-[0_0_12px_rgba(110,231,183,1)] flex items-center justify-center text-emerald-950 p-0.5 z-10">
                      <PuzzleShape shape="leaf" className="w-full h-full" />
                    </div>
                    <div className="absolute inset-0.5 border border-dashed border-emerald-400/40 rounded-full animate-[spin_8s_linear_infinite]"></div>
                  </div>
                );
              case 'candy':
                return (
                  <div className="w-full h-full rounded-full flex items-center justify-center bg-pink-950/80 border-2 border-pink-300 shadow-[0_0_15px_rgba(244,63,94,0.8)] relative overflow-hidden animate-pulse">
                    <div className="w-1/3 h-1/3 bg-pink-300 rounded-full shadow-[0_0_12px_rgba(244,114,182,1)] flex items-center justify-center text-pink-950 p-0.5 z-10">
                      <PuzzleShape shape="lollipop" className="w-full h-full" />
                    </div>
                    <div className="absolute inset-0.5 border border-dashed border-pink-300/40 rounded-full animate-[spin_8s_linear_infinite]"></div>
                  </div>
                );
              case 'space':
                return (
                  <div className="w-full h-full rounded-full flex items-center justify-center bg-indigo-950/80 border-2 border-indigo-400 shadow-[0_0_15px_rgba(129,140,248,0.8)] relative overflow-hidden animate-pulse">
                    <div className="w-1/3 h-1/3 bg-cyan-300 rounded-full shadow-[0_0_12px_rgba(103,232,249,1)] flex items-center justify-center text-indigo-950 p-0.5 z-10">
                      <PuzzleShape shape="star" className="w-full h-full" />
                    </div>
                    <div className="absolute inset-0.5 border border-dashed border-indigo-300/40 rounded-full animate-[spin_8s_linear_infinite]"></div>
                  </div>
                );
              case 'ocean':
                return (
                  <div className="w-full h-full rounded-full flex items-center justify-center bg-cyan-950/80 border-2 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.8)] relative overflow-hidden animate-pulse">
                    <div className="w-1/3 h-1/3 bg-cyan-200 rounded-full shadow-[0_0_12px_rgba(165,243,252,1)] flex items-center justify-center text-cyan-950 p-0.5 z-10">
                      <PuzzleShape shape="anchor" className="w-full h-full" />
                    </div>
                    <div className="absolute inset-0.5 border border-dashed border-cyan-300/40 rounded-full animate-[spin_8s_linear_infinite]"></div>
                  </div>
                );
              case 'retro':
                return (
                  <div className="w-full h-full rounded-full flex items-center justify-center bg-zinc-950/90 border-2 border-purple-400 shadow-[0_0_15px_rgba(192,132,252,0.8)] relative overflow-hidden animate-pulse">
                    <div className="w-1/3 h-1/3 bg-fuchsia-300 rounded-full shadow-[0_0_12px_rgba(232,121,249,1)] flex items-center justify-center text-purple-950 p-0.5 z-10">
                      <PuzzleShape shape="ghost" className="w-full h-full" />
                    </div>
                    <div className="absolute inset-0.5 border border-dashed border-purple-300/40 rounded-full animate-[spin_8s_linear_infinite]"></div>
                  </div>
                );
              case 'desert':
                return (
                  <div className="w-full h-full rounded-full flex items-center justify-center bg-amber-950/80 border-2 border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.8)] relative overflow-hidden animate-pulse">
                    <div className="w-1/3 h-1/3 bg-yellow-300 rounded-full shadow-[0_0_12px_rgba(253,224,71,1)] flex items-center justify-center text-amber-950 p-0.5 z-10">
                      <PuzzleShape shape="sun" className="w-full h-full" />
                    </div>
                    <div className="absolute inset-0.5 border border-dashed border-amber-300/40 rounded-full animate-[spin_8s_linear_infinite]"></div>
                  </div>
                );
              case 'spooky':
                return (
                  <div className="w-full h-full rounded-full flex items-center justify-center bg-purple-950/90 border-2 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.8)] relative overflow-hidden animate-pulse">
                    <div className="w-1/3 h-1/3 bg-orange-400 rounded-full shadow-[0_0_12px_rgba(251,146,60,1)] flex items-center justify-center text-purple-950 p-0.5 z-10">
                      <PuzzleShape shape="pumpkin" className="w-full h-full" />
                    </div>
                    <div className="absolute inset-0.5 border border-dashed border-orange-400/50 rounded-full animate-[spin_8s_linear_infinite]"></div>
                  </div>
                );
              case 'volcanic':
                return (
                  <div className="w-full h-full rounded-full flex items-center justify-center bg-stone-950 border-2 border-red-500 shadow-[0_0_18px_rgba(239,68,68,0.9)] relative overflow-hidden animate-pulse">
                    <div className="w-1/3 h-1/3 bg-amber-400 rounded-full shadow-[0_0_12px_rgba(245,158,11,1)] flex items-center justify-center text-red-950 p-0.5 z-10">
                      <PuzzleShape shape="fire" className="w-full h-full" />
                    </div>
                    <div className="absolute inset-0.5 border border-dashed border-amber-500/60 rounded-full animate-[spin_8s_linear_infinite]"></div>
                  </div>
                );
              case 'vantage':
                return (
                  <div className="w-full h-full rounded-full flex items-center justify-center bg-stone-900 border-2 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.7)] relative overflow-hidden animate-pulse">
                    <div className="w-1/3 h-1/3 bg-amber-300 rounded-full shadow-[0_0_12px_rgba(252,211,77,1)] flex items-center justify-center text-stone-900 p-0.5 z-10">
                      <PuzzleShape shape="mountain" className="w-full h-full" />
                    </div>
                    <div className="absolute inset-0.5 border border-dashed border-amber-400/40 rounded-full animate-[spin_8s_linear_infinite]"></div>
                  </div>
                );
              case 'papercraft':
                return (
                  <div className="w-full h-full rounded-full flex items-center justify-center bg-[#1c1917] border-2 border-[#b45309] shadow-[0_0_12px_rgba(180,83,9,0.7)] relative overflow-hidden animate-pulse">
                    <div className="w-1/3 h-1/3 bg-[#fef3c7] rounded-full shadow-[0_0_10px_rgba(254,243,199,0.9)] flex items-center justify-center text-[#78350f] p-0.5 z-10">
                      <PuzzleShape shape="heart" className="w-full h-full" />
                    </div>
                    <div className="absolute inset-0.5 border border-dashed border-[#f59e0b]/40 rounded-full animate-[spin_8s_linear_infinite]"></div>
                  </div>
                );
              case 'neon':
              default:
                return (
                  <div className="w-full h-full rounded-full flex items-center justify-center bg-black/75 border-2 border-white shadow-[0_0_15px_rgba(255,255,255,0.7)] relative overflow-hidden animate-pulse">
                    <div className="w-1/3 h-1/3 bg-white rounded-full shadow-[0_0_12px_rgba(255,255,255,1)]"></div>
                    <div className="absolute inset-0.5 border border-dashed border-white/25 rounded-full animate-[spin_8s_linear_infinite]"></div>
                  </div>
                );
            }
          };

          const playerElement = renderCharacterOrb(charId);

          // eslint-disable-next-line react-hooks/purity
          const nowPlayer = Date.now();
          let pAnim = playerAnimStateRef.current;

          if (pAnim.targetPos.x !== playerPos.x || pAnim.targetPos.y !== playerPos.y) {
            const startPos = prevPlayerPos || pAnim.targetPos;
            const dx = playerPos.x - startPos.x;
            const dy = playerPos.y - startPos.y;
            const distance = Math.abs(dx) + Math.abs(dy);
            const isInstant = lastAction === 'reset' || lastAction === 'undo' || lastAction === 'load';
            const duration = isInstant || !isAnimated || distance === 0 ? 0 : distance * 120;

            pAnim = {
              lastPos: startPos,
              targetPos: playerPos,
              startTime: nowPlayer,
              duration,
            };
            playerAnimStateRef.current = pAnim;
          }

          const pElapsed = nowPlayer - pAnim.startTime;
          const isPlayerMoving = pAnim.duration > 0 && pElapsed < pAnim.duration + 50;
          const shouldAnimate = isAnimated && isPlayerMoving;
          const duration = pAnim.duration;

          return (
            <div
              className="absolute aspect-square filter drop-shadow-[3px_3px_0px_rgba(0,0,0,0.65)]"
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
