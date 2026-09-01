import React, { useRef, useEffect, memo } from 'react';
import { Position, BlockData, DestinationData, BlockType, PuzzlePortal } from '../types';
import { ThemeId, ThemeConfig, ColorId, DEFAULT_THEME_CONFIGS, getBaseThemeId, Theme, BaseThemeId } from '../../shared/themes';
import { PuzzleShape } from './PuzzleShape';
import { HexagonBlock } from './HexagonBlock';
import { TrailId } from '../../shared/trails';
import { colorToBlockType } from '../utils/puzzle';

interface ThemeStyles {
  bgClass: string;
  panelClass: string;
  cellClass: string;
  wallClass: string;
}

export const THEME_STYLES: Record<BaseThemeId, ThemeStyles> = {
  neon: {
    bgClass: 'bg-theme-neon',
    panelClass: 'bg-cyan-950/85 border-cyan-500/50 shadow-[0_0_25px_rgba(6,182,212,0.3)]',
    cellClass: 'bg-cyan-950/45 backdrop-blur-[2px] border border-cyan-400/20',
    wallClass: 'bg-slate-900 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.9)]',
  },
  winter: {
    bgClass: 'bg-theme-winter',
    panelClass: 'bg-sky-950/85 border-sky-400/50 shadow-[0_0_25px_rgba(56,189,248,0.3)]',
    cellClass: 'bg-sky-950/45 backdrop-blur-[2px] border border-sky-400/20',
    wallClass: 'bg-slate-900 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.9)]',
  },
  forest: {
    bgClass: 'bg-theme-forest',
    panelClass: 'bg-emerald-950/85 border-emerald-500/50 shadow-[0_0_25px_rgba(16,185,129,0.3)]',
    cellClass: 'bg-emerald-950/45 backdrop-blur-[2px] border border-emerald-400/20',
    wallClass: 'bg-stone-900 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.9)]',
  },
  candy: {
    bgClass: 'bg-theme-candy',
    panelClass: 'bg-pink-950/85 border-pink-400/50 shadow-[0_0_25px_rgba(244,63,94,0.3)]',
    cellClass: 'bg-pink-950/45 backdrop-blur-[2px] border border-pink-400/20',
    wallClass: 'bg-slate-900 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.9)]',
  },
  space: {
    bgClass: 'bg-theme-space',
    panelClass: 'bg-indigo-950/85 border-indigo-400/50 shadow-[0_0_25px_rgba(99,102,241,0.3)]',
    cellClass: 'bg-indigo-950/45 backdrop-blur-[2px] border border-indigo-400/20',
    wallClass: 'bg-slate-900 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.9)]',
  },
  ocean: {
    bgClass: 'bg-theme-ocean',
    panelClass: 'bg-cyan-950/85 border-cyan-400/50 shadow-[0_0_25px_rgba(34,211,238,0.3)]',
    cellClass: 'bg-cyan-950/45 backdrop-blur-[2px] border border-cyan-400/20',
    wallClass: 'bg-slate-900 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.9)]',
  },
  retro: {
    bgClass: 'bg-theme-retro',
    panelClass: 'bg-zinc-950 border-cyan-400/50 shadow-[0_0_25px_rgba(34,211,238,0.3)]',
    cellClass: 'bg-cyan-950/45 backdrop-blur-[2px] border border-cyan-400/20',
    wallClass: 'bg-zinc-900 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.9)]',
  },
  desert: {
    bgClass: 'bg-theme-desert',
    panelClass: 'bg-amber-950/85 border-amber-500/50 shadow-[0_0_25px_rgba(245,158,11,0.3)]',
    cellClass: 'bg-amber-950/45 backdrop-blur-[2px] border border-amber-400/20',
    wallClass: 'bg-stone-900 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.9)]',
  },
  spooky: {
    bgClass: 'bg-theme-spooky',
    panelClass: 'bg-purple-950/85 border-purple-400/50 shadow-[0_0_25px_rgba(168,85,247,0.3)]',
    cellClass: 'bg-purple-950/45 backdrop-blur-[2px] border border-purple-400/20',
    wallClass: 'bg-zinc-900 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.9)]',
  },
  volcanic: {
    bgClass: 'bg-theme-volcanic',
    panelClass: 'bg-red-950/85 border-red-500/50 shadow-[0_0_25px_rgba(239,68,68,0.3)]',
    cellClass: 'bg-red-950/45 backdrop-blur-[2px] border border-red-400/20',
    wallClass: 'bg-zinc-900 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.9)]',
  },
  vantage: {
    bgClass: 'bg-theme-vantage',
    panelClass: 'bg-stone-950/85 border-amber-500/50 shadow-[0_0_25px_rgba(217,119,6,0.3)]',
    cellClass: 'bg-amber-950/45 backdrop-blur-[2px] border border-amber-400/20',
    wallClass: 'bg-stone-900 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.9)]',
  },
  papercraft: {
    bgClass: 'bg-theme-papercraft',
    panelClass: 'bg-[#1c1917]/90 border-[#78350f]/60 shadow-[0_0_25px_rgba(120,53,15,0.3)]',
    cellClass: 'bg-[#292524]/50 backdrop-blur-[2px] border border-[#78350f]/20',
    wallClass: 'bg-[#1c1917] shadow-[inset_2px_2px_4px_rgba(0,0,0,0.9)]',
  },
};

export const COLOR_PALETTES: Record<ColorId, {
  text: string;
  border: string;
  shadow: string;
  bg: string;
  destBorder: string;
  colorHex: string;
  blockFill: string;
  solidFill: string;
}> = {
  red: {
    text: 'text-red-500',
    border: 'border-red-500/80',
    shadow: 'shadow-[0_0_15px_rgba(239,68,68,0.5)] neon-red',
    bg: 'bg-red-950/30',
    destBorder: 'border border-red-500/40 bg-red-950/35 backdrop-blur-[2px]',
    colorHex: '#ef4444',
    blockFill: 'fill-red-950/85',
    solidFill: 'fill-red-500',
  },
  blue: {
    text: 'text-blue-500',
    border: 'border-blue-500/80',
    shadow: 'shadow-[0_0_15px_rgba(59,130,246,0.5)] neon-blue',
    bg: 'bg-blue-950/30',
    destBorder: 'border border-blue-500/40 bg-blue-950/35 backdrop-blur-[2px]',
    colorHex: '#3b82f6',
    blockFill: 'fill-blue-950/85',
    solidFill: 'fill-blue-500',
  },
  yellow: {
    text: 'text-yellow-400',
    border: 'border-yellow-400/80',
    shadow: 'shadow-[0_0_15px_rgba(250,204,21,0.5)] neon-yellow',
    bg: 'bg-yellow-950/30',
    destBorder: 'border border-yellow-500/40 bg-yellow-950/35 backdrop-blur-[2px]',
    colorHex: '#eab308',
    blockFill: 'fill-yellow-950/85',
    solidFill: 'fill-yellow-400',
  },
  purple: {
    text: 'text-purple-500',
    border: 'border-purple-500/80',
    shadow: 'shadow-[0_0_15px_rgba(168,85,247,0.5)] neon-purple',
    bg: 'bg-purple-950/30',
    destBorder: 'border border-purple-500/40 bg-purple-950/35 backdrop-blur-[2px]',
    colorHex: '#a855f7',
    blockFill: 'fill-purple-950/85',
    solidFill: 'fill-purple-500',
  },
  green: {
    text: 'text-green-500',
    border: 'border-green-500/80',
    shadow: 'shadow-[0_0_15px_rgba(34,197,94,0.5)] neon-green',
    bg: 'bg-green-950/30',
    destBorder: 'border border-green-500/40 bg-green-950/35 backdrop-blur-[2px]',
    colorHex: '#22c55e',
    blockFill: 'fill-green-950/85',
    solidFill: 'fill-green-500',
  },
  orange: {
    text: 'text-orange-500',
    border: 'border-orange-500/80',
    shadow: 'shadow-[0_0_15px_rgba(249,115,22,0.5)] neon-orange',
    bg: 'bg-orange-950/30',
    destBorder: 'border border-orange-500/40 bg-orange-950/35 backdrop-blur-[2px]',
    colorHex: '#f97316',
    blockFill: 'fill-orange-950/85',
    solidFill: 'fill-orange-500',
  },
  indigo: {
    text: 'text-indigo-500',
    border: 'border-indigo-500/80',
    shadow: 'shadow-[0_0_10px_rgba(99,102,241,0.3)]',
    bg: 'bg-indigo-950/30',
    destBorder: 'border border-indigo-500/40 bg-indigo-950/35 backdrop-blur-[2px]',
    colorHex: '#6366f1',
    blockFill: 'fill-indigo-950/85',
    solidFill: 'fill-indigo-500',
  },
  cyan: {
    text: 'text-cyan-300',
    border: 'border-cyan-400/80',
    shadow: 'shadow-[0_0_10px_rgba(34,211,238,0.3)]',
    bg: 'bg-cyan-950/30',
    destBorder: 'border border-cyan-400/40 bg-cyan-950/35 backdrop-blur-[2px]',
    colorHex: '#06b6d4',
    blockFill: 'fill-cyan-950/85',
    solidFill: 'fill-cyan-400',
  },
  white: {
    text: 'text-white',
    border: 'border-white/80',
    shadow: 'shadow-[0_0_10px_rgba(255,255,255,0.4)]',
    bg: 'bg-zinc-800/30',
    destBorder: 'border border-white/40 bg-zinc-800/35 backdrop-blur-[2px]',
    colorHex: '#ffffff',
    blockFill: 'fill-zinc-900/90',
    solidFill: 'fill-white',
  },
  sky: {
    text: 'text-sky-300',
    border: 'border-sky-300/80',
    shadow: 'shadow-[0_0_10px_rgba(125,211,252,0.3)]',
    bg: 'bg-sky-950/30',
    destBorder: 'border border-sky-400/40 bg-sky-950/35 backdrop-blur-[2px]',
    colorHex: '#38bdf8',
    blockFill: 'fill-sky-950/85',
    solidFill: 'fill-sky-400',
  },
  teal: {
    text: 'text-teal-400',
    border: 'border-teal-500/80',
    shadow: 'shadow-[0_0_10px_rgba(20,184,166,0.3)]',
    bg: 'bg-teal-950/30',
    destBorder: 'border border-teal-500/40 bg-teal-950/35 backdrop-blur-[2px]',
    colorHex: '#14b8a6',
    blockFill: 'fill-teal-950/85',
    solidFill: 'fill-teal-500',
  },
  cobalt: {
    text: 'text-blue-400',
    border: 'border-blue-400/80',
    shadow: 'shadow-[0_0_10px_rgba(59,130,246,0.3)]',
    bg: 'bg-blue-950/30',
    destBorder: 'border border-blue-400/40 bg-blue-950/35 backdrop-blur-[2px]',
    colorHex: '#2563eb',
    blockFill: 'fill-blue-950/85',
    solidFill: 'fill-blue-600',
  },
  emerald: {
    text: 'text-emerald-500',
    border: 'border-emerald-500/80',
    shadow: 'shadow-[0_0_10px_rgba(16,185,129,0.3)]',
    bg: 'bg-emerald-950/30',
    destBorder: 'border border-emerald-500/40 bg-emerald-950/35 backdrop-blur-[2px]',
    colorHex: '#10b981',
    blockFill: 'fill-emerald-950/85',
    solidFill: 'fill-emerald-500',
  },
  amber: {
    text: 'text-amber-500',
    border: 'border-amber-500/80',
    shadow: 'shadow-[0_0_10px_rgba(245,158,11,0.3)]',
    bg: 'bg-amber-950/30',
    destBorder: 'border border-amber-500/40 bg-amber-950/35 backdrop-blur-[2px]',
    colorHex: '#f59e0b',
    blockFill: 'fill-amber-950/85',
    solidFill: 'fill-amber-500',
  },
  crimson: {
    text: 'text-red-500',
    border: 'border-red-500/80',
    shadow: 'shadow-[0_0_10px_rgba(239,68,68,0.3)]',
    bg: 'bg-red-950/30',
    destBorder: 'border border-red-500/40 bg-red-950/35 backdrop-blur-[2px]',
    colorHex: '#dc2626',
    blockFill: 'fill-red-950/85',
    solidFill: 'fill-red-600',
  },
  pink: {
    text: 'text-pink-400',
    border: 'border-pink-400/80',
    shadow: 'shadow-[0_0_10px_rgba(244,63,94,0.3)]',
    bg: 'bg-pink-950/30',
    destBorder: 'border border-pink-400/40 bg-pink-950/35 backdrop-blur-[2px]',
    colorHex: '#ec4899',
    blockFill: 'fill-pink-950/85',
    solidFill: 'fill-pink-500',
  },
  lime: {
    text: 'text-lime-500',
    border: 'border-lime-500/80',
    shadow: 'shadow-[0_0_10px_rgba(132,204,22,0.3)]',
    bg: 'bg-lime-950/30',
    destBorder: 'border border-lime-500/40 bg-lime-950/35 backdrop-blur-[2px]',
    colorHex: '#84cc16',
    blockFill: 'fill-lime-950/85',
    solidFill: 'fill-lime-500',
  },
  fuchsia: {
    text: 'text-fuchsia-400',
    border: 'border-fuchsia-400/80',
    shadow: 'shadow-[0_0_10px_rgba(232,121,249,0.3)]',
    bg: 'bg-fuchsia-950/30',
    destBorder: 'border border-fuchsia-400/40 bg-fuchsia-950/35 backdrop-blur-[2px]',
    colorHex: '#d946ef',
    blockFill: 'fill-fuchsia-950/85',
    solidFill: 'fill-fuchsia-500',
  },
  rose: {
    text: 'text-rose-400',
    border: 'border-rose-400/80',
    shadow: 'shadow-[0_0_10px_rgba(251,113,133,0.3)]',
    bg: 'bg-rose-950/30',
    destBorder: 'border border-rose-400/40 bg-rose-950/35 backdrop-blur-[2px]',
    colorHex: '#f43f5e',
    blockFill: 'fill-rose-950/85',
    solidFill: 'fill-rose-500',
  },
  stone: {
    text: 'text-stone-300',
    border: 'border-2 border-stone-400/90',
    shadow: 'shadow-[3px_3px_0px_rgba(0,0,0,0.7)]',
    bg: 'bg-stone-800/40',
    destBorder: 'border border-stone-400/40 bg-stone-900/35 backdrop-blur-[2px]',
    colorHex: '#d6d3d1',
    blockFill: 'fill-stone-900/90',
    solidFill: 'fill-stone-400',
  },
  slate: {
    text: 'text-slate-300',
    border: 'border-2 border-slate-400/90',
    shadow: 'shadow-[3px_3px_0px_rgba(0,0,0,0.7)]',
    bg: 'bg-slate-800/40',
    destBorder: 'border border-slate-400/40 bg-slate-900/35 backdrop-blur-[2px]',
    colorHex: '#cbd5e1',
    blockFill: 'fill-slate-900/90',
    solidFill: 'fill-slate-400',
  },
  gray: {
    text: 'text-gray-300',
    border: 'border-gray-400/80',
    shadow: 'shadow-[0_0_10px_rgba(209,213,219,0.3)]',
    bg: 'bg-gray-800/30',
    destBorder: 'border border-gray-400/40 bg-gray-900/35 backdrop-blur-[2px]',
    colorHex: '#d1d5db',
    blockFill: 'fill-zinc-900/90',
    solidFill: 'fill-zinc-500',
  }
};

export const getRadiusStyle = (themeId: ThemeId) => {
  const base = getBaseThemeId(themeId);
  switch (base) {
    case 'winter': return 'rounded-md sm:rounded-lg';
    case 'forest': return 'rounded-md sm:rounded-lg';
    case 'candy': return 'rounded-md sm:rounded-lg';
    case 'neon':
    default: return 'rounded-md sm:rounded-lg';
  }
};

export const getBlockColors = (themeConfig: ThemeConfig, themeId: ThemeId, blockType: BlockType) => {
  if (blockType === 'gray-neutral') {
    const palette = COLOR_PALETTES.gray;
    return {
      text: palette.text,
      border: `border ${palette.border} ${themeId === 'neon' ? palette.shadow : ''}`,
      shadow: themeId === 'neon' ? palette.shadow : '',
      blockFill: palette.blockFill,
      solidFill: palette.solidFill,
      colorHex: palette.colorHex,
    };
  }
  const cellConfig = themeConfig[blockType];
  const palette = (cellConfig && COLOR_PALETTES[cellConfig.color]) || COLOR_PALETTES.red;
  return {
    text: palette.text,
    border: `border ${palette.border} ${themeId === 'neon' ? palette.shadow : ''}`,
    shadow: themeId === 'neon' ? palette.shadow : '',
    blockFill: palette.blockFill,
    solidFill: palette.solidFill,
    colorHex: palette.colorHex,
  };
};

export const getDestinationStyle = (themeConfig: ThemeConfig, themeId: ThemeId, destType: BlockType) => {
  const cellConfig = themeConfig[destType as keyof ThemeConfig];
  const palette = (cellConfig && COLOR_PALETTES[cellConfig.color]) || COLOR_PALETTES.red;

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
      return 'bg-slate-900 shadow-[inset_3px_3px_0px_rgba(255,255,255,0.3),inset_-4px_-4px_0px_rgba(0,0,0,0.95),3px_4px_8px_rgba(0,0,0,0.8)]';
    case 'forest':
      return 'bg-stone-900 shadow-[inset_3px_3px_0px_rgba(255,255,255,0.28),inset_-4px_-4px_0px_rgba(0,0,0,0.95),3px_4px_8px_rgba(0,0,0,0.8)]';
    case 'candy':
      return 'bg-slate-900 shadow-[inset_3px_3px_0px_rgba(255,255,255,0.3),inset_-4px_-4px_0px_rgba(0,0,0,0.95),3px_4px_8px_rgba(0,0,0,0.8)]';
    case 'space':
      return 'bg-slate-900 shadow-[inset_3px_3px_0px_rgba(255,255,255,0.3),inset_-4px_-4px_0px_rgba(0,0,0,0.95),3px_4px_8px_rgba(0,0,0,0.8)]';
    case 'ocean':
      return 'bg-slate-900 shadow-[inset_3px_3px_0px_rgba(255,255,255,0.3),inset_-4px_-4px_0px_rgba(0,0,0,0.95),3px_4px_8px_rgba(0,0,0,0.8)]';
    case 'retro':
      return 'bg-zinc-900 shadow-[inset_3px_3px_0px_rgba(255,255,255,0.3),inset_-4px_-4px_0px_rgba(0,0,0,0.95),3px_4px_8px_rgba(0,0,0,0.8)]';
    case 'desert':
      return 'bg-stone-900 shadow-[inset_3px_3px_0px_rgba(255,255,255,0.28),inset_-4px_-4px_0px_rgba(0,0,0,0.95),3px_4px_8px_rgba(0,0,0,0.8)]';
    case 'spooky':
      return 'bg-zinc-900 shadow-[inset_3px_3px_0px_rgba(255,255,255,0.3),inset_-4px_-4px_0px_rgba(0,0,0,0.95),3px_4px_8px_rgba(0,0,0,0.8)]';
    case 'volcanic':
      return 'bg-zinc-900 shadow-[inset_3px_3px_0px_rgba(255,255,255,0.3),inset_-4px_-4px_0px_rgba(0,0,0,0.95),3px_4px_8px_rgba(0,0,0,0.8)]';
    case 'vantage':
      return 'bg-stone-900 shadow-[inset_3px_3px_0px_rgba(255,255,255,0.28),inset_-4px_-4px_0px_rgba(0,0,0,0.95),3px_4px_8px_rgba(0,0,0,0.8)]';
    case 'papercraft':
      return 'bg-[#1c1917] shadow-[inset_3px_3px_0px_rgba(255,255,255,0.25),inset_-4px_-4px_0px_rgba(0,0,0,0.95),3px_4px_8px_rgba(0,0,0,0.8)]';
    case 'neon':
    default:
      return 'bg-slate-900 shadow-[inset_3px_3px_0px_rgba(255,255,255,0.3),inset_-4px_-4px_0px_rgba(0,0,0,0.95),3px_4px_8px_rgba(0,0,0,0.8)]';
  }
};

export const ThemeBoardRenderer = memo(({
  gridSize,
  walls,
  destinations,
  blocks,
  portals = [],
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
  shakeLevel = 'none',
}: {
  gridSize: number;
  walls: Position[];
  destinations: DestinationData[];
  blocks: BlockData[];
  portals?: PuzzlePortal[];
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
  lastAction?: 'push' | 'undo' | 'reset' | 'load' | 'move' | 'teleport';
  activeCharacter?: string;
  shakeLevel?: ('none' | 'sm' | 'md') | undefined;
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
    } else if (lastAction === 'teleport') {
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
    maxWidth: 'min(calc(100vw - 1.5rem), 90vh)',
    maxHeight: 'calc(100vh - 110px)',
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

  const shakeClass = shakeLevel === 'md' ? 'animate-shake-md' : shakeLevel === 'sm' ? 'animate-shake-sm' : '';

  return (
    <div
      className={`p-1 sm:p-2 relative ${styles.panelClass} ${shakeClass}`}
      style={{
        ...inlineStyles,
        borderRadius: 'calc(var(--cell-size) * 0.35)',
        borderWidth: 'calc(var(--cell-size) * 0.12)',
        borderStyle: 'solid',
      }}
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
        const customStyle: React.CSSProperties = {};

        const destTypeKey = destination ? (destination.type as keyof ThemeConfig) : undefined;
        const destStyle = hasDestination && destTypeKey ? getDestinationStyle(config, activeTheme, destination.type) : null;

        if (hasWall) {
          bgColor = getWallStyle(activeCharacter || activeTheme);
          borderStyle = '';
        } else if (hasDestination && destStyle) {
          bgColor = `${destStyle.bg} backdrop-blur-[2px] bg-black/50 shadow-[inset_0_0_10px_rgba(0,0,0,0.6)]`;
          borderStyle = destStyle.border;
        } else {
          bgColor = `${styles.cellClass} shadow-[inset_0_1px_2px_rgba(255,255,255,0.1)]`;
          borderStyle = '';
        }

        return (
          <div
            key={i}
            className={`aspect-square flex items-center justify-center text-lg sm:text-2xl font-bold transition-all relative ${bgColor} ${borderStyle}`}
            style={{
              width: 'var(--cell-size)',
              height: 'var(--cell-size)',
              borderRadius: 'calc(var(--cell-size) * 0.16)',
              ...customStyle
            }}
          >
            {hasWall && (
              <div
                className="absolute inset-0 pointer-events-none overflow-hidden z-0"
                style={{ borderRadius: 'calc(var(--cell-size) * 0.16)' }}
              >
                {/* Top-Left 3D Light Ramp */}
                <div className="absolute top-0 inset-x-0 h-[30%] bg-gradient-to-b from-white/35 to-transparent" />
                <div className="absolute left-0 inset-y-0 w-[30%] bg-gradient-to-r from-white/35 to-transparent" />

                {/* Bottom-Right 3D Shadow Ramp */}
                <div className="absolute bottom-0 inset-x-0 h-[35%] bg-gradient-to-t from-black/90 to-transparent" />
                <div className="absolute right-0 inset-y-0 w-[35%] bg-gradient-to-l from-black/90 to-transparent" />

                {/* Outer Chamfer Edge */}
                <div
                  className="absolute inset-[1px] border-t-2 border-l-2 border-white/45 border-b-[3px] border-r-[3px] border-black/85"
                  style={{ borderRadius: 'calc(var(--cell-size) * 0.14)' }}
                />
              </div>
            )}
            {!hasWall && hasDestination && destStyle && destTypeKey && config[destTypeKey] && (
              <div className="absolute inset-0 w-full h-full flex items-center justify-center pointer-events-none p-1">
                {/* Solid Low-Opacity Inner Target Box */}
                <div
                  className={`w-full h-full ${destStyle.bg} border ${destStyle.border} rounded-xl opacity-90 flex items-center justify-center shadow-[inset_0_0_12px_rgba(0,0,0,0.6)] backdrop-blur-[2px]`}
                >
                  {/* Subtle Corner Reticles */}
                  <svg className={`absolute inset-1 w-[calc(100%-0.5rem)] h-[calc(100%-0.5rem)] ${destStyle.text} opacity-60`} viewBox="0 0 100 100" fill="none">
                    <path d="M 8 16 V 8 H 16" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    <path d="M 92 16 V 8 H 84" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    <path d="M 8 84 V 92 H 16" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    <path d="M 92 84 V 92 H 84" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>

                  {/* Inner Watermark Shape */}
                  <div className={`w-1/2 h-1/2 ${destStyle.text} opacity-75 flex items-center justify-center drop-shadow-[0_0_6px_currentColor]`}>
                    <PuzzleShape shape={config[destTypeKey].shape} className="w-full h-full" />
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
        {portals.map((portal) => {
          const blockType = colorToBlockType(portal.color) as keyof ThemeConfig;
          const activeColor = config[blockType]?.color || (portal.color as ColorId);
          const palette = COLOR_PALETTES[activeColor as ColorId] || COLOR_PALETTES.blue;

          let portalPositionClass = 'top-0 inset-x-0 mx-auto w-[88%] h-[50%] rounded-full';

          switch (portal.dir) {
            case 'Up':
              portalPositionClass = 'bottom-0 inset-x-0 mx-auto w-[88%] h-[50%] rounded-full';
              break;
            case 'Down':
              portalPositionClass = 'top-0 inset-x-0 mx-auto w-[88%] h-[50%] rounded-full';
              break;
            case 'Left':
              portalPositionClass = 'right-0 inset-y-0 my-auto w-[50%] h-[88%] rounded-full';
              break;
            case 'Right':
              portalPositionClass = 'left-0 inset-y-0 my-auto w-[50%] h-[88%] rounded-full';
              break;
          }

          return (
            <div
              key={portal.id}
              className="absolute aspect-square pointer-events-none z-10 p-0.5"
              style={{
                width: 'var(--cell-size)',
                height: 'var(--cell-size)',
                transform: `translate(calc(${portal.x} * (var(--cell-size) + 1px)), calc(${portal.y} * (var(--cell-size) + 1px)))`,
              }}
            >
              {/* Animated Wall-Attached 50% Unit Swirl Portal */}
              <div
                className={`absolute ${portalPositionClass} border-2 border-white flex items-center justify-center overflow-hidden shadow-[0_0_15px_rgba(255,255,255,0.9),0_0_20px_currentColor] ${palette.text}`}
                style={{ backgroundColor: `${palette.colorHex}44` }}
              >
                {/* Primary Swirling Spiral Layer */}
                <div className="absolute inset-0 flex items-center justify-center animate-[spin_3s_linear_infinite] pointer-events-none">
                  <svg className="w-[calc(var(--cell-size)*0.72)] h-[calc(var(--cell-size)*0.72)] shrink-0 opacity-90" viewBox="0 0 100 100" fill="none">
                    <path
                      d="M 50 50 Q 75 25 85 50 T 50 85 T 15 50 T 50 15 T 70 30 T 65 65 T 35 65 T 35 35 T 60 40"
                      stroke="currentColor"
                      strokeWidth="4"
                      strokeLinecap="round"
                      className="opacity-95"
                    />
                    <path
                      d="M 50 50 Q 25 75 15 50 T 50 15 T 85 50 T 50 85 T 30 70 T 35 35 T 65 35 T 65 65 T 40 60"
                      stroke="#ffffff"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      className="opacity-75"
                    />
                  </svg>
                </div>

                {/* Secondary Counter-Rotating Ring Layer */}
                <div className="absolute inset-0 flex items-center justify-center animate-[spin_2s_linear_infinite_reverse] pointer-events-none">
                  <svg className="w-[calc(var(--cell-size)*0.48)] h-[calc(var(--cell-size)*0.48)] shrink-0 opacity-75" viewBox="0 0 100 100" fill="none">
                    <ellipse cx="50" cy="50" rx="32" ry="18" stroke="#ffffff" strokeWidth="2" strokeDasharray="8 6" />
                  </svg>
                </div>

                {/* Glowing White Core Eye */}
                <div
                  className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-white relative z-10 shadow-[0_0_10px_#ffffff,0_0_15px_currentColor] animate-pulse"
                />
              </div>
            </div>
          );
        })}

        {blocks.map((block, idx) => {
          const destination = destinationMap.get(positionKey(block.pos));
          const isOnDestination = destination !== undefined;
          const isCorrectDestination = isOnDestination && destination!.type === block.type;

          const colors = getBlockColors(config, baseThemeId, block.type);
          let content;

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

                {/* 3D Hexagon Pushable Block */}
                <HexagonBlock
                  blockType={block.type}
                  shape={config[block.type as keyof ThemeConfig]?.shape}
                  isSolved={true}
                  isAnimated={isAnimated}
                  baseThemeId={baseThemeId}
                  colors={colors}
                  className="w-full h-full"
                />
              </div>
            );
          } else {
            content = (
              <div className="w-full h-full relative flex items-center justify-center">
                <HexagonBlock
                  blockType={block.type}
                  shape={config[block.type as keyof ThemeConfig]?.shape}
                  isSolved={false}
                  isAnimated={isAnimated}
                  baseThemeId={baseThemeId}
                  colors={colors}
                  className="w-full h-full"
                />
              </div>
            );
          }

          const isInstantAction = lastAction === 'reset' || lastAction === 'undo' || lastAction === 'load' || lastAction === 'teleport';
          const slideDuration = duration > 0 ? duration : 240;
          const transitionStyle = isInstantAction || !isAnimated ? 'none' : `transform ${slideDuration}ms cubic-bezier(0.25, 1, 0.5, 1)`;

          return (
            <div
              key={`block-${idx}`}
              className="absolute aspect-square filter drop-shadow-[3px_3px_0px_rgba(0,0,0,0.65)]"
              style={{
                width: 'var(--cell-size)',
                height: 'var(--cell-size)',
                transform: `translate(calc(${block.pos.x} * (var(--cell-size) + 1px)), calc(${block.pos.y} * (var(--cell-size) + 1px)))`,
                transition: transitionStyle,
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
                  <div className="w-full h-full relative flex items-center justify-center filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)]">
                    <svg className="w-full h-full p-0.5" viewBox="0 0 100 100" fill="none">
                      <defs>
                        <linearGradient id="frostHeadGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#38bdf8" />
                          <stop offset="40%" stopColor="#0284c7" />
                          <stop offset="80%" stopColor="#0c4a6e" />
                          <stop offset="100%" stopColor="#0f172a" />
                        </linearGradient>
                        <linearGradient id="frostBevelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
                          <stop offset="60%" stopColor="#bae6fd" stopOpacity="0.5" />
                          <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.1" />
                        </linearGradient>
                        <linearGradient id="frostVisorGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#0284c7" />
                          <stop offset="50%" stopColor="#38bdf8" />
                          <stop offset="100%" stopColor="#e0f2fe" />
                        </linearGradient>
                        <radialGradient id="frostGlow" cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor="#ffffff" />
                          <stop offset="50%" stopColor="#7dd3fc" />
                          <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
                        </radialGradient>
                        <filter id="skyGlow" x="-20%" y="-20%" width="140%" height="140%">
                          <feGaussianBlur stdDeviation="2.5" result="blur" />
                          <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                      </defs>

                      <circle cx="50" cy="52" r="42" fill="#38bdf8" fillOpacity="0.18" className="animate-pulse" />
                      <ellipse cx="50" cy="90" rx="30" ry="6" fill="#000000" fillOpacity="0.5" />

                      {/* Icicle Antenna Stem */}
                      <polygon points="48,24 52,24 50,7" fill="url(#frostHeadGrad)" stroke="#bae6fd" strokeWidth="1" />
                      <circle cx="50" cy="7" r="4.5" fill="url(#frostGlow)" />
                      <circle cx="50" cy="7" r="2.5" fill="#ffffff" className="animate-pulse" />

                      {/* Icicle Side Ears */}
                      <polygon points="16,46 6,53 16,60" fill="url(#frostHeadGrad)" stroke="#7dd3fc" strokeWidth="1.5" />
                      <polygon points="84,46 94,53 84,60" fill="url(#frostHeadGrad)" stroke="#7dd3fc" strokeWidth="1.5" />
                      <circle cx="10" cy="53" r="2" fill="#e0f2fe" />
                      <circle cx="90" cy="53" r="2" fill="#e0f2fe" />

                      {/* Robot Head Chassis */}
                      <rect x="16" y="24" width="68" height="58" rx="18" fill="url(#frostHeadGrad)" stroke="#38bdf8" strokeWidth="2" />
                      <rect x="18" y="26" width="64" height="54" rx="16" fill="none" stroke="url(#frostBevelGrad)" strokeWidth="2" />

                      {/* Frost Glass Visor */}
                      <rect x="23" y="38" width="54" height="26" rx="10" fill="#03283e" stroke="#0284c7" strokeWidth="2" />
                      <rect x="24" y="39" width="52" height="24" rx="9" fill="url(#frostVisorGrad)" fillOpacity="0.3" />

                      {/* Eyes with Snowflake Icon inside */}
                      <g filter="url(#skyGlow)">
                        <rect x="29" y="44" width="16" height="14" rx="5" fill="#7dd3fc" />
                        <rect x="55" y="44" width="16" height="14" rx="5" fill="#7dd3fc" />
                        <circle cx="37" cy="51" r="3" fill="#ffffff" />
                        <circle cx="63" cy="51" r="3" fill="#ffffff" />
                      </g>

                      {/* Frost Vent Mouth */}
                      <rect x="36" y="69" width="28" height="7" rx="3.5" fill="#03283e" stroke="#38bdf8" strokeWidth="1" />
                      <line x1="42" y1="72.5" x2="58" y2="72.5" stroke="#7dd3fc" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2" />
                    </svg>
                  </div>
                );
              case 'forest':
                return (
                  <div className="w-full h-full relative flex items-center justify-center filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)]">
                    <svg className="w-full h-full p-0.5" viewBox="0 0 100 100" fill="none">
                      <defs>
                        <linearGradient id="forestHeadGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#10b981" />
                          <stop offset="35%" stopColor="#059669" />
                          <stop offset="75%" stopColor="#065f46" />
                          <stop offset="100%" stopColor="#022c22" />
                        </linearGradient>
                        <linearGradient id="forestBevelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#a7f3d0" stopOpacity="0.8" />
                          <stop offset="50%" stopColor="#34d399" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="#059669" stopOpacity="0.1" />
                        </linearGradient>
                        <linearGradient id="forestVisorGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#047857" />
                          <stop offset="50%" stopColor="#10b981" />
                          <stop offset="100%" stopColor="#6ee7b7" />
                        </linearGradient>
                        <radialGradient id="leafGlow" cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor="#ffffff" />
                          <stop offset="50%" stopColor="#34d399" />
                          <stop offset="100%" stopColor="#059669" stopOpacity="0" />
                        </radialGradient>
                        <filter id="emeraldGlow" x="-20%" y="-20%" width="140%" height="140%">
                          <feGaussianBlur stdDeviation="2.5" result="blur" />
                          <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                      </defs>

                      <circle cx="50" cy="52" r="42" fill="#10b981" fillOpacity="0.18" className="animate-pulse" />
                      <ellipse cx="50" cy="90" rx="30" ry="6" fill="#000000" fillOpacity="0.5" />

                      {/* Vine Antenna */}
                      <path d="M 50 24 Q 45 15 50 8" stroke="#059669" strokeWidth="3" strokeLinecap="round" />
                      <circle cx="50" cy="8" r="4" fill="url(#leafGlow)" />
                      <circle cx="50" cy="8" r="2.5" fill="#a7f3d0" className="animate-pulse" />

                      {/* Wooden Ring Side Ears */}
                      <circle cx="12" cy="53" r="8" fill="url(#forestHeadGrad)" stroke="#34d399" strokeWidth="1.5" />
                      <circle cx="88" cy="53" r="8" fill="url(#forestHeadGrad)" stroke="#34d399" strokeWidth="1.5" />
                      <circle cx="12" cy="53" r="3" fill="#6ee7b7" />
                      <circle cx="88" cy="53" r="3" fill="#6ee7b7" />

                      {/* Head Chassis */}
                      <rect x="16" y="24" width="68" height="58" rx="18" fill="url(#forestHeadGrad)" stroke="#059669" strokeWidth="2" />
                      <rect x="18" y="26" width="64" height="54" rx="16" fill="none" stroke="url(#forestBevelGrad)" strokeWidth="2" />

                      {/* Leaf Bio Visor */}
                      <rect x="23" y="38" width="54" height="26" rx="10" fill="#012017" stroke="#047857" strokeWidth="2" />
                      <rect x="24" y="39" width="52" height="24" rx="9" fill="url(#forestVisorGrad)" fillOpacity="0.28" />

                      <g filter="url(#emeraldGlow)">
                        <rect x="29" y="44" width="16" height="14" rx="5" fill="#34d399" />
                        <rect x="55" y="44" width="16" height="14" rx="5" fill="#34d399" />
                        <circle cx="37" cy="51" r="3.5" fill="#ffffff" />
                        <circle cx="63" cy="51" r="3.5" fill="#ffffff" />
                      </g>

                      {/* Bark Speaker Plate */}
                      <rect x="36" y="69" width="28" height="7" rx="3.5" fill="#012017" stroke="#10b981" strokeWidth="1" />
                      <line x1="42" y1="72.5" x2="58" y2="72.5" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 2" />
                    </svg>
                  </div>
                );
              case 'candy':
                return (
                  <div className="w-full h-full relative flex items-center justify-center filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)]">
                    <svg className="w-full h-full p-0.5" viewBox="0 0 100 100" fill="none">
                      <defs>
                        <linearGradient id="candyHeadGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#f43f5e" />
                          <stop offset="35%" stopColor="#db2777" />
                          <stop offset="75%" stopColor="#9d174d" />
                          <stop offset="100%" stopColor="#500724" />
                        </linearGradient>
                        <linearGradient id="candyBevelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#fbcfe8" stopOpacity="0.9" />
                          <stop offset="50%" stopColor="#f472b6" stopOpacity="0.5" />
                          <stop offset="100%" stopColor="#db2777" stopOpacity="0.1" />
                        </linearGradient>
                        <linearGradient id="candyVisorGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#be185d" />
                          <stop offset="50%" stopColor="#f43f5e" />
                          <stop offset="100%" stopColor="#fef08a" />
                        </linearGradient>
                        <radialGradient id="sugarGlow" cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor="#ffffff" />
                          <stop offset="50%" stopColor="#f472b6" />
                          <stop offset="100%" stopColor="#db2777" stopOpacity="0" />
                        </radialGradient>
                        <filter id="pinkGlow" x="-20%" y="-20%" width="140%" height="140%">
                          <feGaussianBlur stdDeviation="2.5" result="blur" />
                          <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                      </defs>

                      <circle cx="50" cy="52" r="42" fill="#f43f5e" fillOpacity="0.18" className="animate-pulse" />
                      <ellipse cx="50" cy="90" rx="30" ry="6" fill="#000000" fillOpacity="0.5" />

                      {/* Lollipop Swirl Antenna */}
                      <line x1="50" y1="24" x2="50" y2="12" stroke="#fbcfe8" strokeWidth="2.5" />
                      <circle cx="50" cy="9" r="5" fill="url(#sugarGlow)" />
                      <circle cx="50" cy="9" r="3" fill="#ffffff" className="animate-pulse" />

                      {/* Gummy Side Ears */}
                      <rect x="9" y="45" width="9" height="16" rx="4.5" fill="#f472b6" stroke="#fbcfe8" strokeWidth="1.5" />
                      <rect x="82" y="45" width="9" height="16" rx="4.5" fill="#f472b6" stroke="#fbcfe8" strokeWidth="1.5" />
                      <circle cx="13.5" cy="53" r="2.5" fill="#ffffff" />
                      <circle cx="86.5" cy="53" r="2.5" fill="#ffffff" />

                      {/* Head Chassis */}
                      <rect x="16" y="24" width="68" height="58" rx="18" fill="url(#candyHeadGrad)" stroke="#f43f5e" strokeWidth="2" />
                      <rect x="18" y="26" width="64" height="54" rx="16" fill="none" stroke="url(#candyBevelGrad)" strokeWidth="2" />

                      {/* Magenta Sugar Visor */}
                      <rect x="23" y="38" width="54" height="26" rx="10" fill="#3b0219" stroke="#db2777" strokeWidth="2" />
                      <rect x="24" y="39" width="52" height="24" rx="9" fill="url(#candyVisorGrad)" fillOpacity="0.3" />

                      <g filter="url(#pinkGlow)">
                        <rect x="29" y="44" width="16" height="14" rx="5" fill="#f472b6" />
                        <rect x="55" y="44" width="16" height="14" rx="5" fill="#f472b6" />
                        <circle cx="37" cy="51" r="3.5" fill="#ffffff" />
                        <circle cx="63" cy="51" r="3.5" fill="#ffffff" />
                      </g>

                      {/* Candy Smile Grill */}
                      <rect x="36" y="69" width="28" height="7" rx="3.5" fill="#3b0219" stroke="#f472b6" strokeWidth="1" />
                      <line x1="42" y1="72.5" x2="58" y2="72.5" stroke="#fbcfe8" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 2" />
                    </svg>
                  </div>
                );
              case 'space':
                return (
                  <div className="w-full h-full relative flex items-center justify-center filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)]">
                    <svg className="w-full h-full p-0.5" viewBox="0 0 100 100" fill="none">
                      <defs>
                        <linearGradient id="spaceHeadGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#6366f1" />
                          <stop offset="35%" stopColor="#4f46e5" />
                          <stop offset="75%" stopColor="#312e81" />
                          <stop offset="100%" stopColor="#1e1b4b" />
                        </linearGradient>
                        <linearGradient id="spaceBevelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#c7d2fe" stopOpacity="0.9" />
                          <stop offset="50%" stopColor="#818cf8" stopOpacity="0.5" />
                          <stop offset="100%" stopColor="#4338ca" stopOpacity="0.1" />
                        </linearGradient>
                        <linearGradient id="spaceVisorGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#3730a3" />
                          <stop offset="50%" stopColor="#6366f1" />
                          <stop offset="100%" stopColor="#67e8f9" />
                        </linearGradient>
                        <radialGradient id="starGlow" cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor="#ffffff" />
                          <stop offset="50%" stopColor="#67e8f9" />
                          <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                        </radialGradient>
                        <filter id="indigoGlow" x="-20%" y="-20%" width="140%" height="140%">
                          <feGaussianBlur stdDeviation="2.5" result="blur" />
                          <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                      </defs>

                      <circle cx="50" cy="52" r="42" fill="#6366f1" fillOpacity="0.18" className="animate-pulse" />
                      <ellipse cx="50" cy="90" rx="30" ry="6" fill="#000000" fillOpacity="0.5" />

                      {/* Satellite Dish Antenna */}
                      <path d="M 44 14 Q 50 8 56 14" stroke="#c7d2fe" strokeWidth="2" fill="none" />
                      <line x1="50" y1="24" x2="50" y2="11" stroke="#818cf8" strokeWidth="1.5" />
                      <circle cx="50" cy="8" r="4" fill="url(#starGlow)" />
                      <circle cx="50" cy="8" r="2" fill="#ffffff" className="animate-pulse" />

                      {/* Thruster Side Ears */}
                      <rect x="9" y="44" width="9" height="18" rx="3" fill="url(#spaceHeadGrad)" stroke="#818cf8" strokeWidth="1.5" />
                      <rect x="82" y="44" width="9" height="18" rx="3" fill="url(#spaceHeadGrad)" stroke="#818cf8" strokeWidth="1.5" />
                      <circle cx="13.5" cy="53" r="2.5" fill="#67e8f9" />
                      <circle cx="86.5" cy="53" r="2.5" fill="#67e8f9" />

                      {/* Head Chassis */}
                      <rect x="16" y="24" width="68" height="58" rx="18" fill="url(#spaceHeadGrad)" stroke="#6366f1" strokeWidth="2" />
                      <rect x="18" y="26" width="64" height="54" rx="16" fill="none" stroke="url(#spaceBevelGrad)" strokeWidth="2" />

                      {/* Cosmic Helmet Glass Visor */}
                      <rect x="23" y="38" width="54" height="26" rx="10" fill="#0f0e38" stroke="#4f46e5" strokeWidth="2" />
                      <rect x="24" y="39" width="52" height="24" rx="9" fill="url(#spaceVisorGrad)" fillOpacity="0.3" />

                      <g filter="url(#indigoGlow)">
                        <rect x="29" y="44" width="16" height="14" rx="5" fill="#67e8f9" />
                        <rect x="55" y="44" width="16" height="14" rx="5" fill="#67e8f9" />
                        <circle cx="37" cy="51" r="3.5" fill="#ffffff" />
                        <circle cx="63" cy="51" r="3.5" fill="#ffffff" />
                      </g>

                      {/* Comm Grill */}
                      <rect x="36" y="69" width="28" height="7" rx="3.5" fill="#0f0e38" stroke="#818cf8" strokeWidth="1" />
                      <line x1="42" y1="72.5" x2="58" y2="72.5" stroke="#67e8f9" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 2" />
                    </svg>
                  </div>
                );
              case 'ocean':
                return (
                  <div className="w-full h-full relative flex items-center justify-center filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)]">
                    <svg className="w-full h-full p-0.5" viewBox="0 0 100 100" fill="none">
                      <defs>
                        <linearGradient id="oceanHeadGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#22d3ee" />
                          <stop offset="35%" stopColor="#0284c7" />
                          <stop offset="75%" stopColor="#075985" />
                          <stop offset="100%" stopColor="#0c4a6e" />
                        </linearGradient>
                        <linearGradient id="oceanBevelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#a5f3fc" stopOpacity="0.9" />
                          <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.5" />
                          <stop offset="100%" stopColor="#0284c7" stopOpacity="0.1" />
                        </linearGradient>
                        <linearGradient id="oceanVisorGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#0369a1" />
                          <stop offset="50%" stopColor="#06b6d4" />
                          <stop offset="100%" stopColor="#a5f3fc" />
                        </linearGradient>
                        <radialGradient id="aquaGlow" cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor="#ffffff" />
                          <stop offset="50%" stopColor="#a5f3fc" />
                          <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
                        </radialGradient>
                        <filter id="cyanOceanGlow" x="-20%" y="-20%" width="140%" height="140%">
                          <feGaussianBlur stdDeviation="2.5" result="blur" />
                          <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                      </defs>

                      <circle cx="50" cy="52" r="42" fill="#06b6d4" fillOpacity="0.18" className="animate-pulse" />
                      <ellipse cx="50" cy="90" rx="30" ry="6" fill="#000000" fillOpacity="0.5" />

                      {/* Periscope Antenna */}
                      <path d="M 48 24 V 11 H 55" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                      <circle cx="55" cy="11" r="4" fill="url(#aquaGlow)" />
                      <circle cx="55" cy="11" r="2" fill="#ffffff" className="animate-pulse" />

                      {/* Anchor Bolt Ears */}
                      <circle cx="12" cy="53" r="7" fill="url(#oceanHeadGrad)" stroke="#38bdf8" strokeWidth="1.5" />
                      <circle cx="88" cy="53" r="7" fill="url(#oceanHeadGrad)" stroke="#38bdf8" strokeWidth="1.5" />
                      <circle cx="12" cy="53" r="2.5" fill="#a5f3fc" />
                      <circle cx="88" cy="53" r="2.5" fill="#a5f3fc" />

                      {/* Submarine Head Chassis */}
                      <rect x="16" y="24" width="68" height="58" rx="18" fill="url(#oceanHeadGrad)" stroke="#0284c7" strokeWidth="2" />
                      <rect x="18" y="26" width="64" height="54" rx="16" fill="none" stroke="url(#oceanBevelGrad)" strokeWidth="2" />

                      {/* Diver Port Visor */}
                      <rect x="23" y="38" width="54" height="26" rx="10" fill="#042f4e" stroke="#0284c7" strokeWidth="2" />
                      <rect x="24" y="39" width="52" height="24" rx="9" fill="url(#oceanVisorGrad)" fillOpacity="0.3" />

                      <g filter="url(#cyanOceanGlow)">
                        <rect x="29" y="44" width="16" height="14" rx="5" fill="#38bdf8" />
                        <rect x="55" y="44" width="16" height="14" rx="5" fill="#38bdf8" />
                        <circle cx="37" cy="51" r="3.5" fill="#ffffff" />
                        <circle cx="63" cy="51" r="3.5" fill="#ffffff" />
                      </g>

                      {/* Regulator Grill */}
                      <rect x="36" y="69" width="28" height="7" rx="3.5" fill="#042f4e" stroke="#38bdf8" strokeWidth="1" />
                      <line x1="42" y1="72.5" x2="58" y2="72.5" stroke="#a5f3fc" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 2" />
                    </svg>
                  </div>
                );
              case 'retro':
                return (
                  <div className="w-full h-full relative flex items-center justify-center filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)]">
                    <svg className="w-full h-full p-0.5" viewBox="0 0 100 100" fill="none">
                      <defs>
                        <linearGradient id="retroHeadGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#c084fc" />
                          <stop offset="35%" stopColor="#9333ea" />
                          <stop offset="75%" stopColor="#581c87" />
                          <stop offset="100%" stopColor="#3b0764" />
                        </linearGradient>
                        <linearGradient id="retroBevelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#f5d0fe" stopOpacity="0.9" />
                          <stop offset="50%" stopColor="#e879f9" stopOpacity="0.5" />
                          <stop offset="100%" stopColor="#a855f7" stopOpacity="0.1" />
                        </linearGradient>
                        <linearGradient id="retroVisorGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#7e22ce" />
                          <stop offset="50%" stopColor="#d946ef" />
                          <stop offset="100%" stopColor="#fef08a" />
                        </linearGradient>
                        <radialGradient id="pixelGlow" cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor="#ffffff" />
                          <stop offset="50%" stopColor="#e879f9" />
                          <stop offset="100%" stopColor="#9333ea" stopOpacity="0" />
                        </radialGradient>
                        <filter id="fuchsiaGlow" x="-20%" y="-20%" width="140%" height="140%">
                          <feGaussianBlur stdDeviation="2.5" result="blur" />
                          <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                      </defs>

                      <circle cx="50" cy="52" r="42" fill="#d946ef" fillOpacity="0.18" className="animate-pulse" />
                      <ellipse cx="50" cy="90" rx="30" ry="6" fill="#000000" fillOpacity="0.5" />

                      {/* Arcade Joystick Antenna */}
                      <line x1="50" y1="24" x2="50" y2="11" stroke="#e879f9" strokeWidth="2.5" />
                      <circle cx="50" cy="8" r="5" fill="url(#pixelGlow)" />
                      <circle cx="50" cy="8" r="3" fill="#fef08a" className="animate-pulse" />

                      {/* D-Pad Ear Buttons */}
                      <rect x="9" y="44" width="9" height="18" rx="2" fill="url(#retroHeadGrad)" stroke="#e879f9" strokeWidth="1.5" />
                      <rect x="82" y="44" width="9" height="18" rx="2" fill="url(#retroHeadGrad)" stroke="#e879f9" strokeWidth="1.5" />
                      <circle cx="13.5" cy="53" r="2.5" fill="#fef08a" />
                      <circle cx="86.5" cy="53" r="2.5" fill="#fef08a" />

                      {/* Head Chassis */}
                      <rect x="16" y="24" width="68" height="58" rx="14" fill="url(#retroHeadGrad)" stroke="#9333ea" strokeWidth="2" />
                      <rect x="18" y="26" width="64" height="54" rx="12" fill="none" stroke="url(#retroBevelGrad)" strokeWidth="2" />

                      {/* CRT Visor Screen */}
                      <rect x="23" y="38" width="54" height="26" rx="8" fill="#1d0438" stroke="#7e22ce" strokeWidth="2" />
                      <rect x="24" y="39" width="52" height="24" rx="7" fill="url(#retroVisorGrad)" fillOpacity="0.3" />

                      <g filter="url(#fuchsiaGlow)">
                        <rect x="29" y="44" width="16" height="14" rx="3" fill="#e879f9" />
                        <rect x="55" y="44" width="16" height="14" rx="3" fill="#e879f9" />
                        <rect x="34" y="49" width="6" height="5" fill="#ffffff" />
                        <rect x="60" y="49" width="6" height="5" fill="#ffffff" />
                      </g>

                      {/* Pixel Speaker */}
                      <rect x="36" y="69" width="28" height="7" rx="2" fill="#1d0438" stroke="#e879f9" strokeWidth="1" />
                      <line x1="42" y1="72.5" x2="58" y2="72.5" stroke="#fef08a" strokeWidth="1.5" strokeLinecap="square" strokeDasharray="3 2" />
                    </svg>
                  </div>
                );
              case 'desert':
                return (
                  <div className="w-full h-full relative flex items-center justify-center filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)]">
                    <svg className="w-full h-full p-0.5" viewBox="0 0 100 100" fill="none">
                      <defs>
                        <linearGradient id="desertHeadGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#f59e0b" />
                          <stop offset="35%" stopColor="#d97706" />
                          <stop offset="75%" stopColor="#b45309" />
                          <stop offset="100%" stopColor="#451a03" />
                        </linearGradient>
                        <linearGradient id="desertBevelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#fef08a" stopOpacity="0.9" />
                          <stop offset="50%" stopColor="#fbbf24" stopOpacity="0.5" />
                          <stop offset="100%" stopColor="#d97706" stopOpacity="0.1" />
                        </linearGradient>
                        <linearGradient id="desertVisorGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#92400e" />
                          <stop offset="50%" stopColor="#f59e0b" />
                          <stop offset="100%" stopColor="#fef08a" />
                        </linearGradient>
                        <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor="#ffffff" />
                          <stop offset="50%" stopColor="#fef08a" />
                          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                        </radialGradient>
                        <filter id="amberGlow" x="-20%" y="-20%" width="140%" height="140%">
                          <feGaussianBlur stdDeviation="2.5" result="blur" />
                          <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                      </defs>

                      <circle cx="50" cy="52" r="42" fill="#f59e0b" fillOpacity="0.18" className="animate-pulse" />
                      <ellipse cx="50" cy="90" rx="30" ry="6" fill="#000000" fillOpacity="0.5" />

                      {/* Solar Crown Rays */}
                      <path d="M 40 24 L 50 6 L 60 24" stroke="#fef08a" strokeWidth="2" strokeLinejoin="round" fill="none" />
                      <circle cx="50" cy="7" r="4" fill="url(#sunGlow)" />
                      <circle cx="50" cy="7" r="2.5" fill="#ffffff" className="animate-pulse" />

                      {/* Pyramid Side Fins */}
                      <polygon points="16,45 6,53 16,61" fill="url(#desertHeadGrad)" stroke="#fbbf24" strokeWidth="1.5" />
                      <polygon points="84,45 94,53 84,61" fill="url(#desertHeadGrad)" stroke="#fbbf24" strokeWidth="1.5" />
                      <circle cx="10" cy="53" r="2" fill="#fef08a" />
                      <circle cx="90" cy="53" r="2" fill="#fef08a" />

                      {/* Chassis */}
                      <rect x="16" y="24" width="68" height="58" rx="18" fill="url(#desertHeadGrad)" stroke="#d97706" strokeWidth="2" />
                      <rect x="18" y="26" width="64" height="54" rx="16" fill="none" stroke="url(#desertBevelGrad)" strokeWidth="2" />

                      {/* Solar Reflective Visor */}
                      <rect x="23" y="38" width="54" height="26" rx="10" fill="#2d1102" stroke="#b45309" strokeWidth="2" />
                      <rect x="24" y="39" width="52" height="24" rx="9" fill="url(#desertVisorGrad)" fillOpacity="0.3" />

                      <g filter="url(#amberGlow)">
                        <rect x="29" y="44" width="16" height="14" rx="5" fill="#fbbf24" />
                        <rect x="55" y="44" width="16" height="14" rx="5" fill="#fbbf24" />
                        <circle cx="37" cy="51" r="3.5" fill="#ffffff" />
                        <circle cx="63" cy="51" r="3.5" fill="#ffffff" />
                      </g>

                      {/* Solar Panel Vent */}
                      <rect x="36" y="69" width="28" height="7" rx="3.5" fill="#2d1102" stroke="#f59e0b" strokeWidth="1" />
                      <line x1="42" y1="72.5" x2="58" y2="72.5" stroke="#fef08a" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 2" />
                    </svg>
                  </div>
                );
              case 'spooky':
                return (
                  <div className="w-full h-full relative flex items-center justify-center filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)]">
                    <svg className="w-full h-full p-0.5" viewBox="0 0 100 100" fill="none">
                      <defs>
                        <linearGradient id="spookyHeadGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#7e22ce" />
                          <stop offset="35%" stopColor="#6b21a8" />
                          <stop offset="75%" stopColor="#3b0764" />
                          <stop offset="100%" stopColor="#1e0436" />
                        </linearGradient>
                        <linearGradient id="spookyBevelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#e9d5ff" stopOpacity="0.8" />
                          <stop offset="50%" stopColor="#f97316" stopOpacity="0.5" />
                          <stop offset="100%" stopColor="#a855f7" stopOpacity="0.1" />
                        </linearGradient>
                        <linearGradient id="spookyVisorGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#c2410c" />
                          <stop offset="50%" stopColor="#ea580c" />
                          <stop offset="100%" stopColor="#a3e635" />
                        </linearGradient>
                        <radialGradient id="pumpkinGlow" cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor="#ffffff" />
                          <stop offset="50%" stopColor="#fdba74" />
                          <stop offset="100%" stopColor="#ea580c" stopOpacity="0" />
                        </radialGradient>
                        <filter id="orangeGlow" x="-20%" y="-20%" width="140%" height="140%">
                          <feGaussianBlur stdDeviation="2.5" result="blur" />
                          <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                      </defs>

                      <circle cx="50" cy="52" r="42" fill="#a855f7" fillOpacity="0.18" className="animate-pulse" />
                      <ellipse cx="50" cy="90" rx="30" ry="6" fill="#000000" fillOpacity="0.5" />

                      {/* Pumpkin Stem Antenna */}
                      <path d="M 50 24 Q 53 15 48 8" stroke="#a3e635" strokeWidth="3" strokeLinecap="round" />
                      <circle cx="48" cy="8" r="4" fill="url(#pumpkinGlow)" />
                      <circle cx="48" cy="8" r="2" fill="#ffffff" className="animate-pulse" />

                      {/* Bat-Wing Side Ears */}
                      <path d="M 16 46 Q 6 42 10 58 Q 16 54 16 54 Z" fill="url(#spookyHeadGrad)" stroke="#f97316" strokeWidth="1.5" />
                      <path d="M 84 46 Q 94 42 90 58 Q 84 54 84 54 Z" fill="url(#spookyHeadGrad)" stroke="#f97316" strokeWidth="1.5" />

                      {/* Head Chassis */}
                      <rect x="16" y="24" width="68" height="58" rx="18" fill="url(#spookyHeadGrad)" stroke="#9333ea" strokeWidth="2" />
                      <rect x="18" y="26" width="64" height="54" rx="16" fill="none" stroke="url(#spookyBevelGrad)" strokeWidth="2" />

                      {/* Eerie Orange Visor */}
                      <rect x="23" y="38" width="54" height="26" rx="10" fill="#1b032d" stroke="#c2410c" strokeWidth="2" />
                      <rect x="24" y="39" width="52" height="24" rx="9" fill="url(#spookyVisorGrad)" fillOpacity="0.3" />

                      <g filter="url(#orangeGlow)">
                        <polygon points="29,54 37,44 45,54" fill="#f97316" />
                        <polygon points="55,54 63,44 71,54" fill="#f97316" />
                        <circle cx="37" cy="51" r="2" fill="#ffffff" />
                        <circle cx="63" cy="51" r="2" fill="#ffffff" />
                      </g>

                      {/* Pumpkin Grin Mouth */}
                      <rect x="36" y="69" width="28" height="7" rx="3.5" fill="#1b032d" stroke="#f97316" strokeWidth="1" />
                      <path d="M 40 72.5 L 44 75 L 48 72.5 L 52 75 L 56 72.5 L 60 75" stroke="#f97316" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                    </svg>
                  </div>
                );
              case 'volcanic':
                return (
                  <div className="w-full h-full relative flex items-center justify-center filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)]">
                    <svg className="w-full h-full p-0.5" viewBox="0 0 100 100" fill="none">
                      <defs>
                        <linearGradient id="volcanicHeadGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#dc2626" />
                          <stop offset="35%" stopColor="#991b1b" />
                          <stop offset="75%" stopColor="#450a0a" />
                          <stop offset="100%" stopColor="#180303" />
                        </linearGradient>
                        <linearGradient id="volcanicBevelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#fca5a5" stopOpacity="0.9" />
                          <stop offset="50%" stopColor="#ef4444" stopOpacity="0.5" />
                          <stop offset="100%" stopColor="#991b1b" stopOpacity="0.1" />
                        </linearGradient>
                        <linearGradient id="volcanicVisorGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#7f1d1d" />
                          <stop offset="50%" stopColor="#dc2626" />
                          <stop offset="100%" stopColor="#fbbf24" />
                        </linearGradient>
                        <radialGradient id="magmaGlow" cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor="#ffffff" />
                          <stop offset="50%" stopColor="#f87171" />
                          <stop offset="100%" stopColor="#dc2626" stopOpacity="0" />
                        </radialGradient>
                        <filter id="redGlow" x="-20%" y="-20%" width="140%" height="140%">
                          <feGaussianBlur stdDeviation="2.5" result="blur" />
                          <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                      </defs>

                      <circle cx="50" cy="52" r="42" fill="#ef4444" fillOpacity="0.18" className="animate-pulse" />
                      <ellipse cx="50" cy="90" rx="30" ry="6" fill="#000000" fillOpacity="0.5" />

                      {/* Exhaust Pipes Antenna */}
                      <rect x="44" y="10" width="4" height="15" rx="1" fill="url(#volcanicHeadGrad)" stroke="#ef4444" strokeWidth="1" />
                      <rect x="52" y="10" width="4" height="15" rx="1" fill="url(#volcanicHeadGrad)" stroke="#ef4444" strokeWidth="1" />
                      <circle cx="46" cy="9" r="3.5" fill="url(#magmaGlow)" />
                      <circle cx="54" cy="9" r="3.5" fill="url(#magmaGlow)" />
                      <circle cx="46" cy="9" r="1.5" fill="#ffffff" className="animate-pulse" />
                      <circle cx="54" cy="9" r="1.5" fill="#ffffff" className="animate-pulse" />

                      {/* Heat Vents Side Ears */}
                      <rect x="9" y="44" width="9" height="18" rx="3" fill="url(#volcanicHeadGrad)" stroke="#ef4444" strokeWidth="1.5" />
                      <rect x="82" y="44" width="9" height="18" rx="3" fill="url(#volcanicHeadGrad)" stroke="#ef4444" strokeWidth="1.5" />
                      <circle cx="13.5" cy="53" r="2.5" fill="#fbbf24" />
                      <circle cx="86.5" cy="53" r="2.5" fill="#fbbf24" />

                      {/* Obsidian Head Chassis */}
                      <rect x="16" y="24" width="68" height="58" rx="18" fill="url(#volcanicHeadGrad)" stroke="#b91c1c" strokeWidth="2" />
                      <rect x="18" y="26" width="64" height="54" rx="16" fill="none" stroke="url(#volcanicBevelGrad)" strokeWidth="2" />

                      {/* Molten Magma Visor */}
                      <rect x="23" y="38" width="54" height="26" rx="10" fill="#2b0404" stroke="#991b1b" strokeWidth="2" />
                      <rect x="24" y="39" width="52" height="24" rx="9" fill="url(#volcanicVisorGrad)" fillOpacity="0.3" />

                      <g filter="url(#redGlow)">
                        <rect x="29" y="44" width="16" height="14" rx="5" fill="#f87171" />
                        <rect x="55" y="44" width="16" height="14" rx="5" fill="#f87171" />
                        <circle cx="37" cy="51" r="3.5" fill="#ffffff" />
                        <circle cx="63" cy="51" r="3.5" fill="#ffffff" />
                      </g>

                      {/* Lava Furnace Grill */}
                      <rect x="36" y="69" width="28" height="7" rx="3.5" fill="#2b0404" stroke="#ef4444" strokeWidth="1" />
                      <line x1="42" y1="72.5" x2="58" y2="72.5" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 2" />
                    </svg>
                  </div>
                );
              case 'vantage':
                return (
                  <div className="w-full h-full relative flex items-center justify-center filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)]">
                    <svg className="w-full h-full p-0.5" viewBox="0 0 100 100" fill="none">
                      <defs>
                        <linearGradient id="vantageHeadGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#78350f" />
                          <stop offset="35%" stopColor="#57534e" />
                          <stop offset="75%" stopColor="#292524" />
                          <stop offset="100%" stopColor="#1c1917" />
                        </linearGradient>
                        <linearGradient id="vantageBevelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#fde68a" stopOpacity="0.9" />
                          <stop offset="50%" stopColor="#d97706" stopOpacity="0.5" />
                          <stop offset="100%" stopColor="#78350f" stopOpacity="0.1" />
                        </linearGradient>
                        <linearGradient id="vantageVisorGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#92400e" />
                          <stop offset="50%" stopColor="#d97706" />
                          <stop offset="100%" stopColor="#10b981" />
                        </linearGradient>
                        <radialGradient id="alpineGlow" cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor="#ffffff" />
                          <stop offset="50%" stopColor="#fcd34d" />
                          <stop offset="100%" stopColor="#d97706" stopOpacity="0" />
                        </radialGradient>
                        <filter id="duskGlow" x="-20%" y="-20%" width="140%" height="140%">
                          <feGaussianBlur stdDeviation="2.5" result="blur" />
                          <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                      </defs>

                      <circle cx="50" cy="52" r="42" fill="#d97706" fillOpacity="0.18" className="animate-pulse" />
                      <ellipse cx="50" cy="90" rx="30" ry="6" fill="#000000" fillOpacity="0.5" />

                      {/* Compass Needle Antenna */}
                      <polygon points="50,6 53,24 47,24" fill="#f59e0b" stroke="#fcd34d" strokeWidth="1" />
                      <circle cx="50" cy="6" r="3.5" fill="url(#alpineGlow)" />
                      <circle cx="50" cy="6" r="1.5" fill="#ffffff" className="animate-pulse" />

                      {/* Pine Lugs Side Ears */}
                      <rect x="9" y="44" width="9" height="18" rx="3" fill="url(#vantageHeadGrad)" stroke="#d97706" strokeWidth="1.5" />
                      <rect x="82" y="44" width="9" height="18" rx="3" fill="url(#vantageHeadGrad)" stroke="#d97706" strokeWidth="1.5" />
                      <circle cx="13.5" cy="53" r="2.5" fill="#10b981" />
                      <circle cx="86.5" cy="53" r="2.5" fill="#10b981" />

                      {/* Rugged Chassis */}
                      <rect x="16" y="24" width="68" height="58" rx="18" fill="url(#vantageHeadGrad)" stroke="#78350f" strokeWidth="2" />
                      <rect x="18" y="26" width="64" height="54" rx="16" fill="none" stroke="url(#vantageBevelGrad)" strokeWidth="2" />

                      {/* Sunset Amber Visor */}
                      <rect x="23" y="38" width="54" height="26" rx="10" fill="#1c1917" stroke="#b45309" strokeWidth="2" />
                      <rect x="24" y="39" width="52" height="24" rx="9" fill="url(#vantageVisorGrad)" fillOpacity="0.3" />

                      <g filter="url(#duskGlow)">
                        <rect x="29" y="44" width="16" height="14" rx="5" fill="#fbbf24" />
                        <rect x="55" y="44" width="16" height="14" rx="5" fill="#fbbf24" />
                        <circle cx="37" cy="51" r="3.5" fill="#ffffff" />
                        <circle cx="63" cy="51" r="3.5" fill="#ffffff" />
                      </g>

                      {/* Tactical Vent Grill */}
                      <rect x="36" y="69" width="28" height="7" rx="3.5" fill="#1c1917" stroke="#d97706" strokeWidth="1" />
                      <line x1="42" y1="72.5" x2="58" y2="72.5" stroke="#fde68a" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 2" />
                    </svg>
                  </div>
                );
              case 'papercraft':
                return (
                  <div className="w-full h-full relative flex items-center justify-center filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)]">
                    <svg className="w-full h-full p-0.5" viewBox="0 0 100 100" fill="none">
                      <defs>
                        <linearGradient id="paperHeadGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#b45309" />
                          <stop offset="35%" stopColor="#78350f" />
                          <stop offset="75%" stopColor="#44403c" />
                          <stop offset="100%" stopColor="#1c1917" />
                        </linearGradient>
                        <linearGradient id="paperBevelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#fef3c7" stopOpacity="0.9" />
                          <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.5" />
                          <stop offset="100%" stopColor="#b45309" stopOpacity="0.1" />
                        </linearGradient>
                        <linearGradient id="paperVisorGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#78350f" />
                          <stop offset="50%" stopColor="#d97706" />
                          <stop offset="100%" stopColor="#fef3c7" />
                        </linearGradient>
                        <radialGradient id="paperGlow" cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor="#ffffff" />
                          <stop offset="50%" stopColor="#fef3c7" />
                          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                        </radialGradient>
                        <filter id="warmPaperGlow" x="-20%" y="-20%" width="140%" height="140%">
                          <feGaussianBlur stdDeviation="2.5" result="blur" />
                          <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                      </defs>

                      <circle cx="50" cy="52" r="42" fill="#f59e0b" fillOpacity="0.18" className="animate-pulse" />
                      <ellipse cx="50" cy="90" rx="30" ry="6" fill="#000000" fillOpacity="0.5" />

                      {/* Origami Crane Antenna */}
                      <path d="M 50 24 L 45 10 L 50 4 L 55 10 Z" fill="url(#paperHeadGrad)" stroke="#fef3c7" strokeWidth="1" />
                      <circle cx="50" cy="4" r="3.5" fill="url(#paperGlow)" />
                      <circle cx="50" cy="4" r="1.5" fill="#ffffff" className="animate-pulse" />

                      {/* Cardboard Fold Tabs Side Ears */}
                      <rect x="9" y="44" width="9" height="18" rx="2" fill="url(#paperHeadGrad)" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3 2" />
                      <rect x="82" y="44" width="9" height="18" rx="2" fill="url(#paperHeadGrad)" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3 2" />
                      <circle cx="13.5" cy="53" r="2.5" fill="#fef3c7" />
                      <circle cx="86.5" cy="53" r="2.5" fill="#fef3c7" />

                      {/* Cardstock Head Chassis */}
                      <rect x="16" y="24" width="68" height="58" rx="18" fill="url(#paperHeadGrad)" stroke="#78350f" strokeWidth="2" />
                      <rect x="18" y="26" width="64" height="54" rx="16" fill="none" stroke="url(#paperBevelGrad)" strokeWidth="2" strokeDasharray="4 2" />

                      {/* Stitched Visor Cutout */}
                      <rect x="23" y="38" width="54" height="26" rx="10" fill="#292524" stroke="#b45309" strokeWidth="2" />
                      <rect x="24" y="39" width="52" height="24" rx="9" fill="url(#paperVisorGrad)" fillOpacity="0.3" />

                      <g filter="url(#warmPaperGlow)">
                        <rect x="29" y="44" width="16" height="14" rx="5" fill="#fef3c7" />
                        <rect x="55" y="44" width="16" height="14" rx="5" fill="#fef3c7" />
                        <circle cx="37" cy="51" r="3.5" fill="#78350f" />
                        <circle cx="63" cy="51" r="3.5" fill="#78350f" />
                      </g>

                      {/* Paper Tape Mouth */}
                      <rect x="36" y="69" width="28" height="7" rx="3.5" fill="#292524" stroke="#f59e0b" strokeWidth="1" />
                      <line x1="42" y1="72.5" x2="58" y2="72.5" stroke="#fef3c7" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 2" />
                    </svg>
                  </div>
                );
              case 'neon':
              default:
                return (
                  <div className="w-full h-full relative flex items-center justify-center filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)]">
                    <svg className="w-full h-full p-0.5" viewBox="0 0 100 100" fill="none">
                      <defs>
                        {/* Metallic Head 3D Gradient */}
                        <linearGradient id="botHeadGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#475569" />
                          <stop offset="35%" stopColor="#334155" />
                          <stop offset="70%" stopColor="#1e293b" />
                          <stop offset="100%" stopColor="#0f172a" />
                        </linearGradient>

                        {/* Bevel Highlight Gradient */}
                        <linearGradient id="botBevelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#94a3b8" stopOpacity="0.8" />
                          <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.5" />
                          <stop offset="100%" stopColor="#0284c7" stopOpacity="0.1" />
                        </linearGradient>

                        {/* Visor Glow Gradient */}
                        <linearGradient id="botVisorGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#06b6d4" />
                          <stop offset="50%" stopColor="#38bdf8" />
                          <stop offset="100%" stopColor="#22d3ee" />
                        </linearGradient>

                        {/* Antenna Glow */}
                        <radialGradient id="antennaGlow" cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor="#ffffff" />
                          <stop offset="50%" stopColor="#38bdf8" />
                          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                        </radialGradient>

                        {/* Visor Inner Light */}
                        <filter id="cyanGlow" x="-20%" y="-20%" width="140%" height="140%">
                          <feGaussianBlur stdDeviation="2.5" result="blur" />
                          <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                      </defs>

                      {/* Outer Aura / Pulse Halo */}
                      <circle cx="50" cy="52" r="42" fill="#06b6d4" fillOpacity="0.15" className="animate-pulse" />

                      {/* 3D Drop Shadow Base */}
                      <ellipse cx="50" cy="90" rx="30" ry="6" fill="#000000" fillOpacity="0.5" />

                      {/* Antenna Stem */}
                      <rect x="48" y="10" width="4" height="15" rx="2" fill="url(#botHeadGrad)" stroke="#64748b" strokeWidth="1" />
                      <line x1="50" y1="12" x2="50" y2="23" stroke="#38bdf8" strokeWidth="1" strokeDasharray="2 2" />

                      {/* Antenna Orb (Glowing) */}
                      <circle cx="50" cy="9" r="5" fill="url(#antennaGlow)" />
                      <circle cx="50" cy="9" r="3" fill="#ffffff" className="animate-pulse" />

                      {/* Ear Bolts / Side Jacks (3D Chamfered) */}
                      <rect x="10" y="44" width="8" height="18" rx="3" fill="url(#botHeadGrad)" stroke="#475569" strokeWidth="1.5" />
                      <rect x="82" y="44" width="8" height="18" rx="3" fill="url(#botHeadGrad)" stroke="#475569" strokeWidth="1.5" />
                      <circle cx="14" cy="53" r="2" fill="#38bdf8" />
                      <circle cx="86" cy="53" r="2" fill="#38bdf8" />

                      {/* Main Robot Head Base (Rounded 3D Cube) */}
                      <rect x="16" y="24" width="68" height="58" rx="18" fill="url(#botHeadGrad)" stroke="#64748b" strokeWidth="2" />

                      {/* Outer 3D Rim / Top Specular Highlight */}
                      <rect x="18" y="26" width="64" height="54" rx="16" fill="none" stroke="url(#botBevelGrad)" strokeWidth="2" />

                      {/* Sleek Visor Plate (Inset 3D Glass) */}
                      <rect x="23" y="38" width="54" height="26" rx="10" fill="#090d16" stroke="#1e293b" strokeWidth="2" />
                      <rect x="24" y="39" width="52" height="24" rx="9" fill="url(#botVisorGrad)" fillOpacity="0.25" />

                      {/* 3D Glowing Cyber Visor Eyes */}
                      <g filter="url(#cyanGlow)">
                        {/* Dual Cyber Eye Lenses */}
                        <rect x="29" y="44" width="16" height="14" rx="5" fill="#38bdf8" />
                        <rect x="55" y="44" width="16" height="14" rx="5" fill="#38bdf8" />

                        {/* Bright Pupil Cores */}
                        <circle cx="37" cy="51" r="3.5" fill="#ffffff" />
                        <circle cx="63" cy="51" r="3.5" fill="#ffffff" />

                        {/* Visor Glint Reflection */}
                        <path d="M 27 41 L 45 41 L 39 44 L 27 44 Z" fill="#ffffff" fillOpacity="0.6" />
                      </g>

                      {/* Metallic Mouth Grid / Speaker Plate */}
                      <rect x="36" y="69" width="28" height="7" rx="3.5" fill="#0f172a" stroke="#334155" strokeWidth="1" />
                      <line x1="42" y1="72.5" x2="58" y2="72.5" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 2" />

                      {/* Top Head Highlight Spark */}
                      <ellipse cx="34" cy="30" rx="10" ry="3" fill="#ffffff" fillOpacity="0.3" transform="rotate(-10 34 30)" />
                    </svg>
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
            const isInstant = lastAction === 'reset' || lastAction === 'undo' || lastAction === 'load' || lastAction === 'teleport' || distance > 1;
            const duration = isInstant || !isAnimated || distance === 0 ? 0 : distance * 120;

            pAnim = {
              lastPos: startPos,
              targetPos: playerPos,
              startTime: nowPlayer,
              duration,
            };
            playerAnimStateRef.current = pAnim;
          }

          const isInstantPlayer = lastAction === 'reset' || lastAction === 'undo' || lastAction === 'load' || lastAction === 'teleport';
          const playerDuration = pAnim.duration > 0 ? pAnim.duration : 140;
          const playerTransitionStyle = isInstantPlayer || !isAnimated ? 'none' : `transform ${playerDuration}ms cubic-bezier(0.25, 1, 0.5, 1)`;

          return (
            <div
              className="absolute aspect-square filter drop-shadow-[3px_3px_0px_rgba(0,0,0,0.65)]"
              style={{
                width: 'var(--cell-size)',
                height: 'var(--cell-size)',
                transform: `translate(calc(${playerPos.x} * (var(--cell-size) + 1px)), calc(${playerPos.y} * (var(--cell-size) + 1px)))`,
                transition: playerTransitionStyle,
              }}
            >
              {playerElement}
            </div>
          );
        })()}
      </div>
    </div>
  );
});

ThemeBoardRenderer.displayName = 'ThemeBoardRenderer';
ThemeBoardRenderer.displayName = 'ThemeBoardRenderer';
