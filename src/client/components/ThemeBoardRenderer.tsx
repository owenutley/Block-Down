import React, { useRef, useEffect, memo } from 'react';
import { Position, BlockData, DestinationData, BlockType, PuzzlePortal } from '../types';
import { ThemeId, ThemeConfig, ColorId, DEFAULT_THEME_CONFIGS, getBaseThemeId, Theme, BaseThemeId } from '../../shared/themes';
import { PuzzleShape } from './PuzzleShape';
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
    panelClass: 'bg-slate-950/95 border-cyan-500/80 shadow-[0_0_35px_rgba(6,182,212,0.35),8px_8px_0px_rgba(6,182,212,0.5)]',
    cellClass: 'bg-slate-950/90 border-2 border-cyan-500/25 shadow-[inset_2px_2px_6px_rgba(0,0,0,0.9)]',
    wallClass: 'bg-slate-900 border-2 border-slate-500/90 shadow-[inset_3px_3px_0px_rgba(255,255,255,0.3),inset_-4px_-4px_0px_rgba(0,0,0,0.95),3px_4px_8px_rgba(0,0,0,0.8)]',
  },
  winter: {
    bgClass: 'bg-theme-winter',
    panelClass: 'bg-slate-950/95 border-sky-400/80 shadow-[8px_8px_0px_rgba(56,189,248,0.5)]',
    cellClass: 'bg-slate-950/90 border-2 border-sky-900/40 shadow-[inset_3px_3px_0px_rgba(0,0,0,0.8)]',
    wallClass: 'bg-slate-900 border-2 border-slate-500/90 shadow-[inset_3px_3px_0px_rgba(255,255,255,0.3),inset_-4px_-4px_0px_rgba(0,0,0,0.95),3px_4px_8px_rgba(0,0,0,0.8)]',
  },
  forest: {
    bgClass: 'bg-theme-forest',
    panelClass: 'bg-stone-950/95 border-emerald-500/80 shadow-[8px_8px_0px_rgba(16,185,129,0.5)]',
    cellClass: 'bg-stone-950/90 border-2 border-emerald-900/40 shadow-[inset_3px_3px_0px_rgba(0,0,0,0.8)]',
    wallClass: 'bg-stone-900 border-2 border-stone-500/90 shadow-[inset_3px_3px_0px_rgba(255,255,255,0.28),inset_-4px_-4px_0px_rgba(0,0,0,0.95),3px_4px_8px_rgba(0,0,0,0.8)]',
  },
  candy: {
    bgClass: 'bg-theme-candy',
    panelClass: 'bg-slate-950/95 border-pink-400/80 shadow-[8px_8px_0px_rgba(244,63,94,0.5)]',
    cellClass: 'bg-slate-950/90 border-2 border-pink-900/40 shadow-[inset_3px_3px_0px_rgba(0,0,0,0.8)]',
    wallClass: 'bg-slate-900 border-2 border-slate-500/90 shadow-[inset_3px_3px_0px_rgba(255,255,255,0.3),inset_-4px_-4px_0px_rgba(0,0,0,0.95),3px_4px_8px_rgba(0,0,0,0.8)]',
  },
  space: {
    bgClass: 'bg-theme-space',
    panelClass: 'bg-slate-950/95 border-indigo-400/80 shadow-[8px_8px_0px_rgba(99,102,241,0.5)]',
    cellClass: 'bg-slate-950/90 border-2 border-indigo-900/40 shadow-[inset_3px_3px_0px_rgba(0,0,0,0.8)]',
    wallClass: 'bg-slate-900 border-2 border-slate-500/90 shadow-[inset_3px_3px_0px_rgba(255,255,255,0.3),inset_-4px_-4px_0px_rgba(0,0,0,0.95),3px_4px_8px_rgba(0,0,0,0.8)]',
  },
  ocean: {
    bgClass: 'bg-theme-ocean',
    panelClass: 'bg-slate-950/95 border-cyan-400/80 shadow-[8px_8px_0px_rgba(34,211,238,0.5)]',
    cellClass: 'bg-slate-950/90 border-2 border-cyan-900/40 shadow-[inset_3px_3px_0px_rgba(0,0,0,0.8)]',
    wallClass: 'bg-slate-900 border-2 border-slate-500/90 shadow-[inset_3px_3px_0px_rgba(255,255,255,0.3),inset_-4px_-4px_0px_rgba(0,0,0,0.95),3px_4px_8px_rgba(0,0,0,0.8)]',
  },
  retro: {
    bgClass: 'bg-theme-retro',
    panelClass: 'bg-black border-zinc-600/80 shadow-[8px_8px_0px_rgba(0,0,0,0.8)]',
    cellClass: 'bg-zinc-950/95 border-2 border-zinc-800 shadow-[inset_3px_3px_0px_rgba(0,0,0,0.8)]',
    wallClass: 'bg-zinc-900 border-2 border-zinc-500/90 shadow-[inset_3px_3px_0px_rgba(255,255,255,0.3),inset_-4px_-4px_0px_rgba(0,0,0,0.95),3px_4px_8px_rgba(0,0,0,0.8)]',
  },
  desert: {
    bgClass: 'bg-theme-desert',
    panelClass: 'bg-stone-950/95 border-amber-500/80 shadow-[8px_8px_0px_rgba(245,158,11,0.5)]',
    cellClass: 'bg-stone-950/90 border-2 border-amber-900/40 shadow-[inset_3px_3px_0px_rgba(0,0,0,0.8)]',
    wallClass: 'bg-stone-900 border-2 border-stone-500/90 shadow-[inset_3px_3px_0px_rgba(255,255,255,0.28),inset_-4px_-4px_0px_rgba(0,0,0,0.95),3px_4px_8px_rgba(0,0,0,0.8)]',
  },
  spooky: {
    bgClass: 'bg-theme-spooky',
    panelClass: 'bg-slate-950/95 border-purple-500/80 shadow-[8px_8px_0px_rgba(168,85,247,0.5)]',
    cellClass: 'bg-slate-950/90 border-2 border-purple-900/40 shadow-[inset_3px_3px_0px_rgba(0,0,0,0.8)]',
    wallClass: 'bg-zinc-900 border-2 border-zinc-500/90 shadow-[inset_3px_3px_0px_rgba(255,255,255,0.3),inset_-4px_-4px_0px_rgba(0,0,0,0.95),3px_4px_8px_rgba(0,0,0,0.8)]',
  },
  volcanic: {
    bgClass: 'bg-theme-volcanic',
    panelClass: 'bg-stone-950/95 border-red-500/80 shadow-[8px_8px_0px_rgba(239,68,68,0.5)]',
    cellClass: 'bg-stone-950/90 border-2 border-red-900/40 shadow-[inset_3px_3px_0px_rgba(0,0,0,0.8)]',
    wallClass: 'bg-zinc-900 border-2 border-zinc-500/90 shadow-[inset_3px_3px_0px_rgba(255,255,255,0.3),inset_-4px_-4px_0px_rgba(0,0,0,0.95),3px_4px_8px_rgba(0,0,0,0.8)]',
  },
  vantage: {
    bgClass: 'bg-theme-vantage',
    panelClass: 'bg-black border-amber-600/80 shadow-[8px_8px_0px_rgba(0,0,0,0.8)]',
    cellClass: 'bg-stone-950/95 border-2 border-stone-800 shadow-[inset_3px_3px_0px_rgba(0,0,0,0.8)]',
    wallClass: 'bg-stone-900 border-2 border-stone-500/90 shadow-[inset_3px_3px_0px_rgba(255,255,255,0.28),inset_-4px_-4px_0px_rgba(0,0,0,0.95),3px_4px_8px_rgba(0,0,0,0.8)]',
  },
  papercraft: {
    bgClass: 'bg-theme-papercraft',
    panelClass: 'bg-[#0c0a09] border-[#78350f] shadow-[8px_8px_0px_rgba(0,0,0,0.7)]',
    cellClass: 'bg-[#141210] border-2 border-[#3c3734] shadow-[inset_2px_2px_0px_rgba(0,0,0,0.8)]',
    wallClass: 'bg-[#1c1917] border-2 border-[#57534e]/95 shadow-[inset_3px_3px_0px_rgba(255,255,255,0.25),inset_-4px_-4px_0px_rgba(0,0,0,0.95),3px_4px_8px_rgba(0,0,0,0.8)]',
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
    bg: 'bg-red-950/20',
    destBorder: 'border border-red-500/50 border-dashed neon-red',
    colorHex: '#ef4444',
    blockFill: 'fill-red-950/85',
    solidFill: 'fill-red-500',
  },
  blue: {
    text: 'text-blue-500',
    border: 'border-blue-500/80',
    shadow: 'shadow-[0_0_15px_rgba(59,130,246,0.5)] neon-blue',
    bg: 'bg-blue-950/20',
    destBorder: 'border border-blue-500/50 border-dashed neon-blue',
    colorHex: '#3b82f6',
    blockFill: 'fill-blue-950/85',
    solidFill: 'fill-blue-500',
  },
  yellow: {
    text: 'text-yellow-400',
    border: 'border-yellow-400/80',
    shadow: 'shadow-[0_0_15px_rgba(250,204,21,0.5)] neon-yellow',
    bg: 'bg-yellow-950/20',
    destBorder: 'border border-yellow-500/50 border-dashed neon-yellow',
    colorHex: '#eab308',
    blockFill: 'fill-yellow-950/85',
    solidFill: 'fill-yellow-400',
  },
  purple: {
    text: 'text-purple-500',
    border: 'border-purple-500/80',
    shadow: 'shadow-[0_0_15px_rgba(168,85,247,0.5)] neon-purple',
    bg: 'bg-purple-950/20',
    destBorder: 'border border-purple-500/50 border-dashed neon-purple',
    colorHex: '#a855f7',
    blockFill: 'fill-purple-950/85',
    solidFill: 'fill-purple-500',
  },
  green: {
    text: 'text-green-500',
    border: 'border-green-500/80',
    shadow: 'shadow-[0_0_15px_rgba(34,197,94,0.5)] neon-green',
    bg: 'bg-green-950/20',
    destBorder: 'border border-green-500/50 border-dashed neon-green',
    colorHex: '#22c55e',
    blockFill: 'fill-green-950/85',
    solidFill: 'fill-green-500',
  },
  orange: {
    text: 'text-orange-500',
    border: 'border-orange-500/80',
    shadow: 'shadow-[0_0_15px_rgba(249,115,22,0.5)] neon-orange',
    bg: 'bg-orange-950/20',
    destBorder: 'border border-orange-500/50 border-dashed neon-orange',
    colorHex: '#f97316',
    blockFill: 'fill-orange-950/85',
    solidFill: 'fill-orange-500',
  },
  indigo: {
    text: 'text-indigo-500',
    border: 'border-indigo-500/80',
    shadow: 'shadow-[0_0_10px_rgba(99,102,241,0.3)]',
    bg: 'bg-indigo-950/20',
    destBorder: 'border border-dashed border-indigo-500/50',
    colorHex: '#6366f1',
    blockFill: 'fill-indigo-950/85',
    solidFill: 'fill-indigo-500',
  },
  cyan: {
    text: 'text-cyan-300',
    border: 'border-cyan-400/80',
    shadow: 'shadow-[0_0_10px_rgba(34,211,238,0.3)]',
    bg: 'bg-cyan-950/20',
    destBorder: 'border border-dashed border-cyan-500/50',
    colorHex: '#06b6d4',
    blockFill: 'fill-cyan-950/85',
    solidFill: 'fill-cyan-400',
  },
  white: {
    text: 'text-white',
    border: 'border-white/80',
    shadow: 'shadow-[0_0_10px_rgba(255,255,255,0.4)]',
    bg: 'bg-zinc-800/20',
    destBorder: 'border border-dashed border-white/50',
    colorHex: '#ffffff',
    blockFill: 'fill-zinc-900/90',
    solidFill: 'fill-white',
  },
  sky: {
    text: 'text-sky-300',
    border: 'border-sky-300/80',
    shadow: 'shadow-[0_0_10px_rgba(125,211,252,0.3)]',
    bg: 'bg-sky-950/20',
    destBorder: 'border border-dashed border-sky-400/50',
    colorHex: '#38bdf8',
    blockFill: 'fill-sky-950/85',
    solidFill: 'fill-sky-400',
  },
  teal: {
    text: 'text-teal-400',
    border: 'border-teal-500/80',
    shadow: 'shadow-[0_0_10px_rgba(20,184,166,0.3)]',
    bg: 'bg-teal-950/20',
    destBorder: 'border border-dashed border-teal-500/50',
    colorHex: '#14b8a6',
    blockFill: 'fill-teal-950/85',
    solidFill: 'fill-teal-500',
  },
  cobalt: {
    text: 'text-blue-400',
    border: 'border-blue-400/80',
    shadow: 'shadow-[0_0_10px_rgba(59,130,246,0.3)]',
    bg: 'bg-blue-950/20',
    destBorder: 'border border-dashed border-blue-500/50',
    colorHex: '#2563eb',
    blockFill: 'fill-blue-950/85',
    solidFill: 'fill-blue-600',
  },
  emerald: {
    text: 'text-emerald-500',
    border: 'border-emerald-500/80',
    shadow: 'shadow-[0_0_10px_rgba(16,185,129,0.3)]',
    bg: 'bg-emerald-950/20',
    destBorder: 'border border-dashed border-emerald-500/50',
    colorHex: '#10b981',
    blockFill: 'fill-emerald-950/85',
    solidFill: 'fill-emerald-500',
  },
  amber: {
    text: 'text-amber-500',
    border: 'border-amber-500/80',
    shadow: 'shadow-[0_0_10px_rgba(245,158,11,0.3)]',
    bg: 'bg-amber-950/20',
    destBorder: 'border border-dashed border-amber-500/50',
    colorHex: '#f59e0b',
    blockFill: 'fill-amber-950/85',
    solidFill: 'fill-amber-500',
  },
  crimson: {
    text: 'text-red-500',
    border: 'border-red-500/80',
    shadow: 'shadow-[0_0_10px_rgba(239,68,68,0.3)]',
    bg: 'bg-red-950/20',
    destBorder: 'border border-dashed border-red-500/50',
    colorHex: '#dc2626',
    blockFill: 'fill-red-950/85',
    solidFill: 'fill-red-600',
  },
  pink: {
    text: 'text-pink-400',
    border: 'border-pink-400/80',
    shadow: 'shadow-[0_0_10px_rgba(244,63,94,0.3)]',
    bg: 'bg-pink-950/20',
    destBorder: 'border border-dashed border-pink-400/50',
    colorHex: '#ec4899',
    blockFill: 'fill-pink-950/85',
    solidFill: 'fill-pink-500',
  },
  lime: {
    text: 'text-lime-500',
    border: 'border-lime-500/80',
    shadow: 'shadow-[0_0_10px_rgba(132,204,22,0.3)]',
    bg: 'bg-lime-950/20',
    destBorder: 'border border-dashed border-lime-500/50',
    colorHex: '#84cc16',
    blockFill: 'fill-lime-950/85',
    solidFill: 'fill-lime-500',
  },
  fuchsia: {
    text: 'text-fuchsia-400',
    border: 'border-fuchsia-400/80',
    shadow: 'shadow-[0_0_10px_rgba(232,121,249,0.3)]',
    bg: 'bg-fuchsia-950/20',
    destBorder: 'border border-dashed border-fuchsia-400/50',
    colorHex: '#d946ef',
    blockFill: 'fill-fuchsia-950/85',
    solidFill: 'fill-fuchsia-500',
  },
  rose: {
    text: 'text-rose-400',
    border: 'border-rose-400/80',
    shadow: 'shadow-[0_0_10px_rgba(251,113,133,0.3)]',
    bg: 'bg-rose-950/20',
    destBorder: 'border border-dashed border-rose-400/50',
    colorHex: '#f43f5e',
    blockFill: 'fill-rose-950/85',
    solidFill: 'fill-rose-500',
  },
  stone: {
    text: 'text-stone-300',
    border: 'border-2 border-stone-400/90',
    shadow: 'shadow-[3px_3px_0px_rgba(0,0,0,0.7)]',
    bg: 'bg-stone-800/40',
    destBorder: 'border-2 border-stone-400/60 border-dashed',
    colorHex: '#d6d3d1',
    blockFill: 'fill-stone-900/90',
    solidFill: 'fill-stone-400',
  },
  slate: {
    text: 'text-slate-300',
    border: 'border-2 border-slate-400/90',
    shadow: 'shadow-[3px_3px_0px_rgba(0,0,0,0.7)]',
    bg: 'bg-slate-800/40',
    destBorder: 'border-2 border-slate-400/60 border-dashed',
    colorHex: '#cbd5e1',
    blockFill: 'fill-slate-900/90',
    solidFill: 'fill-slate-400',
  },
  gray: {
    text: 'text-gray-300',
    border: 'border-gray-400/80',
    shadow: 'shadow-[0_0_10px_rgba(209,213,219,0.3)]',
    bg: 'bg-gray-800/30',
    destBorder: 'border border-dashed border-gray-400/50',
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
      return 'bg-slate-900 border-2 border-slate-500/90 shadow-[inset_3px_3px_0px_rgba(255,255,255,0.3),inset_-4px_-4px_0px_rgba(0,0,0,0.95),3px_4px_8px_rgba(0,0,0,0.8)]';
    case 'forest':
      return 'bg-stone-900 border-2 border-stone-500/90 shadow-[inset_3px_3px_0px_rgba(255,255,255,0.28),inset_-4px_-4px_0px_rgba(0,0,0,0.95),3px_4px_8px_rgba(0,0,0,0.8)]';
    case 'candy':
      return 'bg-slate-900 border-2 border-slate-500/90 shadow-[inset_3px_3px_0px_rgba(255,255,255,0.3),inset_-4px_-4px_0px_rgba(0,0,0,0.95),3px_4px_8px_rgba(0,0,0,0.8)]';
    case 'space':
      return 'bg-slate-900 border-2 border-slate-500/90 shadow-[inset_3px_3px_0px_rgba(255,255,255,0.3),inset_-4px_-4px_0px_rgba(0,0,0,0.95),3px_4px_8px_rgba(0,0,0,0.8)]';
    case 'ocean':
      return 'bg-slate-900 border-2 border-slate-500/90 shadow-[inset_3px_3px_0px_rgba(255,255,255,0.3),inset_-4px_-4px_0px_rgba(0,0,0,0.95),3px_4px_8px_rgba(0,0,0,0.8)]';
    case 'retro':
      return 'bg-zinc-900 border-2 border-zinc-500/90 shadow-[inset_3px_3px_0px_rgba(255,255,255,0.3),inset_-4px_-4px_0px_rgba(0,0,0,0.95),3px_4px_8px_rgba(0,0,0,0.8)]';
    case 'desert':
      return 'bg-stone-900 border-2 border-stone-500/90 shadow-[inset_3px_3px_0px_rgba(255,255,255,0.28),inset_-4px_-4px_0px_rgba(0,0,0,0.95),3px_4px_8px_rgba(0,0,0,0.8)]';
    case 'spooky':
      return 'bg-zinc-900 border-2 border-zinc-500/90 shadow-[inset_3px_3px_0px_rgba(255,255,255,0.3),inset_-4px_-4px_0px_rgba(0,0,0,0.95),3px_4px_8px_rgba(0,0,0,0.8)]';
    case 'volcanic':
      return 'bg-zinc-900 border-2 border-zinc-500/90 shadow-[inset_3px_3px_0px_rgba(255,255,255,0.3),inset_-4px_-4px_0px_rgba(0,0,0,0.95),3px_4px_8px_rgba(0,0,0,0.8)]';
    case 'vantage':
      return 'bg-stone-900 border-2 border-stone-500/90 shadow-[inset_3px_3px_0px_rgba(255,255,255,0.28),inset_-4px_-4px_0px_rgba(0,0,0,0.95),3px_4px_8px_rgba(0,0,0,0.8)]';
    case 'papercraft':
      return 'bg-[#1c1917] border-2 border-[#57534e]/95 shadow-[inset_3px_3px_0px_rgba(255,255,255,0.25),inset_-4px_-4px_0px_rgba(0,0,0,0.95),3px_4px_8px_rgba(0,0,0,0.8)]';
    case 'neon':
    default:
      return 'bg-slate-900 border-2 border-slate-500/90 shadow-[inset_3px_3px_0px_rgba(255,255,255,0.3),inset_-4px_-4px_0px_rgba(0,0,0,0.95),3px_4px_8px_rgba(0,0,0,0.8)]';
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
          bgColor = `${destStyle.bg} backdrop-blur-sm bg-black/60 shadow-[inset_0_0_12px_rgba(0,0,0,0.8)]`;
          borderStyle = destStyle.border;
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
              <div className="absolute inset-0 w-full h-full flex items-center justify-center pointer-events-none">
                {/* Corner Reticles */}
                <svg className={`absolute inset-0 w-full h-full ${destStyle.text} opacity-70 drop-shadow-[0_0_3px_currentColor]`} viewBox="0 0 100 100" fill="none">
                  <path d="M 8 16 V 8 H 16" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
                  <path d="M 92 16 V 8 H 84" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
                  <path d="M 8 84 V 92 H 16" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
                  <path d="M 92 84 V 92 H 84" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
                </svg>

                {/* Pulsing Hologram Container */}
                <div className="absolute inset-0 w-full h-full flex items-center justify-center animate-pulse-glow">
                  {/* Dashed Hexagon Silhouette */}
                  <svg className={`absolute inset-0 w-full h-full ${destStyle.text}`} viewBox="0 0 100 100" fill="none">
                    <polygon
                      points="50,5 89,27 89,73 50,95 11,73 11,27"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeDasharray="6 4"
                      className="opacity-45"
                    />
                  </svg>

                  {/* Inner Watermark Shape */}
                  <div className={`w-1/2 h-1/2 ${destStyle.text} opacity-80 flex items-center justify-center drop-shadow-[0_0_6px_currentColor]`}>
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
                <svg className={`w-full h-full absolute inset-0 ${isAnimated ? 'animate-pulse-glow' : ''} ${colors.text} filter drop-shadow-[0_0_16px_currentColor]`} viewBox="0 0 100 100" fill="none">
                  <polygon
                    points="50,5 89,27 89,73 50,95 11,73 11,27"
                    className={colors.solidFill || 'fill-current'}
                    stroke="#ffffff"
                    strokeWidth="4"
                    strokeOpacity="0.95"
                  />
                </svg>

                {/* Shape inside - Glowing White */}
                {config[block.type as keyof ThemeConfig] && (
                  <div className="relative z-10 w-1/2 h-1/2 text-white flex items-center justify-center filter drop-shadow-[0_0_8px_rgba(255,255,255,1)]">
                    <PuzzleShape shape={config[block.type as keyof ThemeConfig].shape} className="w-full h-full drop-shadow-[0_0_6px_#ffffff]" isCompleted={true} />
                  </div>
                )}
              </div>
            );
          } else {
            const polygonFill = baseThemeId === 'neon' ? (colors.blockFill || 'fill-cyan-950/85') : blockBgIncorrect;
            content = (
              <div className="w-full h-full relative flex items-center justify-center">
                <svg className={`w-full h-full absolute inset-0 ${colors.text} drop-shadow-[0_0_8px_rgba(0,0,0,0.8)]`} viewBox="0 0 100 100" fill="none">
                  <polygon
                    points="50,5 89,27 89,73 50,95 11,73 11,27"
                    className={polygonFill}
                    stroke="currentColor"
                    strokeWidth="3.5"
                    strokeOpacity="1"
                  />
                </svg>
                {block.type !== 'gray-neutral' && config[block.type as keyof ThemeConfig]?.shape && (
                  <div className={`relative z-10 w-1/2 h-1/2 ${colors.text} flex items-center justify-center`}>
                    <PuzzleShape shape={config[block.type as keyof ThemeConfig].shape} className="w-full h-full opacity-90 drop-shadow-[0_0_4px_currentColor]" />
                  </div>
                )}
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
                transition: (shouldAnimate && !block.noTransition) ? `transform ${duration}ms cubic-bezier(0.25, 1, 0.5, 1)` : 'none',
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
});

ThemeBoardRenderer.displayName = 'ThemeBoardRenderer';
