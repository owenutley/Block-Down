import React, { useRef, useEffect, memo, useMemo } from 'react';
import { Position, BlockData, DestinationData, BlockType, PuzzlePortal } from '../types';
import { ThemeId, ThemeConfig, ColorId, DEFAULT_THEME_CONFIGS, getBaseThemeId, Theme, BaseThemeId } from '../../shared/themes';
import { PuzzleShape } from './PuzzleShape';
import { ThemePortal } from './ThemePortal';
import { HexagonBlock } from './HexagonBlock';
import { TrailId } from '../../shared/trails';
import { colorToBlockType } from '../utils/puzzle';
import { shouldShowTrails } from '../utils/device';

interface ThemeStyles {
  bgClass: string;
  panelClass: string;
  cellClass: string;
  wallClass: string;
}

export const THEME_STYLES: Record<BaseThemeId, ThemeStyles> = {
  neon: {
    bgClass: 'bg-theme-neon',
    panelClass: 'bg-cyan-950/85 border-cyan-500/50 shadow-lg shadow-black/40',
    cellClass: 'bg-cyan-950/70 border border-cyan-400/20',
    wallClass: 'bg-slate-900 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.9)]',
  },
  winter: {
    bgClass: 'bg-theme-winter',
    panelClass: 'bg-sky-950/85 border-sky-400/50 shadow-lg shadow-black/40',
    cellClass: 'bg-sky-950/70 border border-sky-400/20',
    wallClass: 'bg-slate-900 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.9)]',
  },
  forest: {
    bgClass: 'bg-theme-forest',
    panelClass: 'bg-emerald-950/85 border-emerald-500/50 shadow-lg shadow-black/40',
    cellClass: 'bg-emerald-950/70 border border-emerald-400/20',
    wallClass: 'bg-stone-900 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.9)]',
  },
  candy: {
    bgClass: 'bg-theme-candy',
    panelClass: 'bg-pink-950/85 border-pink-400/50 shadow-lg shadow-black/40',
    cellClass: 'bg-pink-950/70 border border-pink-400/20',
    wallClass: 'bg-slate-900 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.9)]',
  },
  space: {
    bgClass: 'bg-theme-space',
    panelClass: 'bg-indigo-950/85 border-indigo-400/50 shadow-lg shadow-black/40',
    cellClass: 'bg-indigo-950/70 border border-indigo-400/20',
    wallClass: 'bg-slate-900 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.9)]',
  },
  ocean: {
    bgClass: 'bg-theme-ocean',
    panelClass: 'bg-cyan-950/85 border-cyan-400/50 shadow-lg shadow-black/40',
    cellClass: 'bg-cyan-950/70 border border-cyan-400/20',
    wallClass: 'bg-slate-900 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.9)]',
  },
  retro: {
    bgClass: 'bg-theme-retro',
    panelClass: 'bg-zinc-950 border-cyan-400/50 shadow-lg shadow-black/40',
    cellClass: 'bg-cyan-950/70 border border-cyan-400/20',
    wallClass: 'bg-zinc-900 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.9)]',
  },
  desert: {
    bgClass: 'bg-theme-desert',
    panelClass: 'bg-amber-950/85 border-amber-500/50 shadow-lg shadow-black/40',
    cellClass: 'bg-amber-950/70 border border-amber-400/20',
    wallClass: 'bg-stone-900 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.9)]',
  },
  spooky: {
    bgClass: 'bg-theme-spooky',
    panelClass: 'bg-purple-950/85 border-purple-400/50 shadow-lg shadow-black/40',
    cellClass: 'bg-purple-950/70 border border-purple-400/20',
    wallClass: 'bg-zinc-900 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.9)]',
  },
  volcanic: {
    bgClass: 'bg-theme-volcanic',
    panelClass: 'bg-red-950/85 border-red-500/50 shadow-lg shadow-black/40',
    cellClass: 'bg-red-950/70 border border-red-400/20',
    wallClass: 'bg-zinc-900 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.9)]',
  },
  vantage: {
    bgClass: 'bg-theme-vantage',
    panelClass: 'bg-stone-950/85 border-amber-500/50 shadow-lg shadow-black/40',
    cellClass: 'bg-amber-950/70 border border-amber-400/20',
    wallClass: 'bg-stone-900 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.9)]',
  },
  papercraft: {
    bgClass: 'bg-theme-papercraft',
    panelClass: 'bg-[#1c1917]/90 border-[#78350f]/60 shadow-lg shadow-black/40',
    cellClass: 'bg-[#292524]/80 border border-[#78350f]/20',
    wallClass: 'bg-[#1c1917] shadow-[inset_2px_2px_4px_rgba(0,0,0,0.9)]',
  },
  steampunk: {
    bgClass: 'bg-theme-steampunk',
    panelClass: 'bg-[#291e14]/90 border-[#d97706]/60 shadow-lg shadow-black/40',
    cellClass: 'bg-[#3d2b1d]/80 border border-[#d97706]/20',
    wallClass: 'bg-[#1c140c] shadow-[inset_2px_2px_4px_rgba(0,0,0,0.9)]',
  },
  olympus: {
    bgClass: 'bg-theme-olympus',
    panelClass: 'bg-[#0f172a]/90 border-[#fbbf24]/60 shadow-lg shadow-black/40',
    cellClass: 'bg-[#1e293b]/80 border border-[#fbbf24]/20',
    wallClass: 'bg-[#090d16] shadow-[inset_2px_2px_4px_rgba(0,0,0,0.9)]',
  },
  pirate: {
    bgClass: 'bg-theme-pirate',
    panelClass: 'bg-[#0d1f22]/90 border-[#2dd4bf]/60 shadow-lg shadow-black/40',
    cellClass: 'bg-[#132e32]/80 border border-[#2dd4bf]/20',
    wallClass: 'bg-[#081315] shadow-[inset_2px_2px_4px_rgba(0,0,0,0.9)]',
  },
  synthwave: {
    bgClass: 'bg-theme-synthwave',
    panelClass: 'bg-[#1a0b2e]/90 border-[#f43f5e]/60 shadow-lg shadow-black/40',
    cellClass: 'bg-[#271042]/80 border border-[#f43f5e]/20',
    wallClass: 'bg-[#0e061a] shadow-[inset_2px_2px_4px_rgba(0,0,0,0.9)]',
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
    destBorder: 'border border-red-500/40 bg-red-950/60',
    colorHex: '#ef4444',
    blockFill: 'fill-red-950/85',
    solidFill: 'fill-red-500',
  },
  blue: {
    text: 'text-blue-500',
    border: 'border-blue-500/80',
    shadow: 'shadow-[0_0_15px_rgba(59,130,246,0.5)] neon-blue',
    bg: 'bg-blue-950/30',
    destBorder: 'border border-blue-500/40 bg-blue-950/60',
    colorHex: '#3b82f6',
    blockFill: 'fill-blue-950/85',
    solidFill: 'fill-blue-500',
  },
  yellow: {
    text: 'text-yellow-400',
    border: 'border-yellow-400/80',
    shadow: 'shadow-[0_0_15px_rgba(250,204,21,0.5)] neon-yellow',
    bg: 'bg-yellow-950/30',
    destBorder: 'border border-yellow-500/40 bg-yellow-950/60',
    colorHex: '#eab308',
    blockFill: 'fill-yellow-950/85',
    solidFill: 'fill-yellow-400',
  },
  purple: {
    text: 'text-purple-500',
    border: 'border-purple-500/80',
    shadow: 'shadow-[0_0_15px_rgba(168,85,247,0.5)] neon-purple',
    bg: 'bg-purple-950/30',
    destBorder: 'border border-purple-500/40 bg-purple-950/60',
    colorHex: '#a855f7',
    blockFill: 'fill-purple-950/85',
    solidFill: 'fill-purple-500',
  },
  green: {
    text: 'text-green-500',
    border: 'border-green-500/80',
    shadow: 'shadow-[0_0_15px_rgba(34,197,94,0.5)] neon-green',
    bg: 'bg-green-950/30',
    destBorder: 'border border-green-500/40 bg-green-950/60',
    colorHex: '#22c55e',
    blockFill: 'fill-green-950/85',
    solidFill: 'fill-green-500',
  },
  orange: {
    text: 'text-orange-500',
    border: 'border-orange-500/80',
    shadow: 'shadow-[0_0_15px_rgba(249,115,22,0.5)] neon-orange',
    bg: 'bg-orange-950/30',
    destBorder: 'border border-orange-500/40 bg-orange-950/60',
    colorHex: '#f97316',
    blockFill: 'fill-orange-950/85',
    solidFill: 'fill-orange-500',
  },
  indigo: {
    text: 'text-indigo-500',
    border: 'border-indigo-500/80',
    shadow: 'shadow-[0_0_10px_rgba(99,102,241,0.3)]',
    bg: 'bg-indigo-950/30',
    destBorder: 'border border-indigo-500/40 bg-indigo-950/60',
    colorHex: '#6366f1',
    blockFill: 'fill-indigo-950/85',
    solidFill: 'fill-indigo-500',
  },
  cyan: {
    text: 'text-cyan-300',
    border: 'border-cyan-400/80',
    shadow: 'shadow-[0_0_10px_rgba(34,211,238,0.3)]',
    bg: 'bg-cyan-950/30',
    destBorder: 'border border-cyan-400/40 bg-cyan-950/60',
    colorHex: '#06b6d4',
    blockFill: 'fill-cyan-950/85',
    solidFill: 'fill-cyan-400',
  },
  white: {
    text: 'text-white',
    border: 'border-white/80',
    shadow: 'shadow-[0_0_10px_rgba(255,255,255,0.4)]',
    bg: 'bg-zinc-800/30',
    destBorder: 'border border-white/40 bg-zinc-800/60',
    colorHex: '#ffffff',
    blockFill: 'fill-zinc-900/90',
    solidFill: 'fill-white',
  },
  sky: {
    text: 'text-sky-300',
    border: 'border-sky-300/80',
    shadow: 'shadow-[0_0_10px_rgba(125,211,252,0.3)]',
    bg: 'bg-sky-950/30',
    destBorder: 'border border-sky-400/40 bg-sky-950/60',
    colorHex: '#38bdf8',
    blockFill: 'fill-sky-950/85',
    solidFill: 'fill-sky-400',
  },
  teal: {
    text: 'text-teal-400',
    border: 'border-teal-500/80',
    shadow: 'shadow-[0_0_10px_rgba(20,184,166,0.3)]',
    bg: 'bg-teal-950/30',
    destBorder: 'border border-teal-500/40 bg-teal-950/60',
    colorHex: '#14b8a6',
    blockFill: 'fill-teal-950/85',
    solidFill: 'fill-teal-500',
  },
  cobalt: {
    text: 'text-blue-400',
    border: 'border-blue-400/80',
    shadow: 'shadow-[0_0_10px_rgba(59,130,246,0.3)]',
    bg: 'bg-blue-950/30',
    destBorder: 'border border-blue-400/40 bg-blue-950/60',
    colorHex: '#2563eb',
    blockFill: 'fill-blue-950/85',
    solidFill: 'fill-blue-600',
  },
  emerald: {
    text: 'text-emerald-500',
    border: 'border-emerald-500/80',
    shadow: 'shadow-[0_0_10px_rgba(16,185,129,0.3)]',
    bg: 'bg-emerald-950/30',
    destBorder: 'border border-emerald-500/40 bg-emerald-950/60',
    colorHex: '#10b981',
    blockFill: 'fill-emerald-950/85',
    solidFill: 'fill-emerald-500',
  },
  amber: {
    text: 'text-amber-500',
    border: 'border-amber-500/80',
    shadow: 'shadow-[0_0_10px_rgba(245,158,11,0.3)]',
    bg: 'bg-amber-950/30',
    destBorder: 'border border-amber-500/40 bg-amber-950/60',
    colorHex: '#f59e0b',
    blockFill: 'fill-amber-950/85',
    solidFill: 'fill-amber-500',
  },
  crimson: {
    text: 'text-red-500',
    border: 'border-red-500/80',
    shadow: 'shadow-[0_0_10px_rgba(239,68,68,0.3)]',
    bg: 'bg-red-950/30',
    destBorder: 'border border-red-500/40 bg-red-950/60',
    colorHex: '#dc2626',
    blockFill: 'fill-red-950/85',
    solidFill: 'fill-red-600',
  },
  pink: {
    text: 'text-pink-400',
    border: 'border-pink-400/80',
    shadow: 'shadow-[0_0_10px_rgba(244,63,94,0.3)]',
    bg: 'bg-pink-950/30',
    destBorder: 'border border-pink-400/40 bg-pink-950/60',
    colorHex: '#ec4899',
    blockFill: 'fill-pink-950/85',
    solidFill: 'fill-pink-500',
  },
  lime: {
    text: 'text-lime-500',
    border: 'border-lime-500/80',
    shadow: 'shadow-[0_0_10px_rgba(132,204,22,0.3)]',
    bg: 'bg-lime-950/30',
    destBorder: 'border border-lime-500/40 bg-lime-950/60',
    colorHex: '#84cc16',
    blockFill: 'fill-lime-950/85',
    solidFill: 'fill-lime-500',
  },
  fuchsia: {
    text: 'text-fuchsia-400',
    border: 'border-fuchsia-400/80',
    shadow: 'shadow-[0_0_10px_rgba(232,121,249,0.3)]',
    bg: 'bg-fuchsia-950/30',
    destBorder: 'border border-fuchsia-400/40 bg-fuchsia-950/60',
    colorHex: '#d946ef',
    blockFill: 'fill-fuchsia-950/85',
    solidFill: 'fill-fuchsia-500',
  },
  rose: {
    text: 'text-rose-400',
    border: 'border-rose-400/80',
    shadow: 'shadow-[0_0_10px_rgba(251,113,133,0.3)]',
    bg: 'bg-rose-950/30',
    destBorder: 'border border-rose-400/40 bg-rose-950/60',
    colorHex: '#f43f5e',
    blockFill: 'fill-rose-950/85',
    solidFill: 'fill-rose-500',
  },
  stone: {
    text: 'text-stone-300',
    border: 'border-2 border-stone-400/90',
    shadow: 'shadow-[3px_3px_0px_rgba(0,0,0,0.7)]',
    bg: 'bg-stone-800/40',
    destBorder: 'border border-stone-400/40 bg-stone-900/60',
    colorHex: '#d6d3d1',
    blockFill: 'fill-stone-900/90',
    solidFill: 'fill-stone-400',
  },
  slate: {
    text: 'text-slate-300',
    border: 'border-2 border-slate-400/90',
    shadow: 'shadow-[3px_3px_0px_rgba(0,0,0,0.7)]',
    bg: 'bg-slate-800/40',
    destBorder: 'border border-slate-400/40 bg-slate-900/60',
    colorHex: '#cbd5e1',
    blockFill: 'fill-slate-900/90',
    solidFill: 'fill-slate-400',
  },
  gray: {
    text: 'text-gray-300',
    border: 'border-gray-400/80',
    shadow: 'shadow-[0_0_10px_rgba(209,213,219,0.3)]',
    bg: 'bg-gray-800/30',
    destBorder: 'border border-gray-400/40 bg-gray-900/60',
    colorHex: '#d1d5db',
    blockFill: 'fill-zinc-900/90',
    solidFill: 'fill-zinc-500',
  },
};

export const THEME_COLOR_PALETTES: Partial<Record<BaseThemeId, Partial<Record<ColorId, typeof COLOR_PALETTES[ColorId]>>>> = {
  winter: {
    red: {
      text: 'text-rose-400',
      border: 'border-rose-400/80',
      shadow: 'shadow-[0_0_12px_rgba(244,63,94,0.4)]',
      bg: 'bg-rose-950/30',
      destBorder: 'border border-rose-400/40 bg-rose-950/60',
      colorHex: '#f43f5e',
      blockFill: 'fill-rose-950/85',
      solidFill: 'fill-rose-500',
    },
    blue: {
      text: 'text-sky-300',
      border: 'border-sky-400/80',
      shadow: 'shadow-[0_0_12px_rgba(56,189,248,0.4)]',
      bg: 'bg-sky-950/30',
      destBorder: 'border border-sky-400/40 bg-sky-950/60',
      colorHex: '#38bdf8',
      blockFill: 'fill-sky-950/85',
      solidFill: 'fill-sky-400',
    },
    yellow: {
      text: 'text-yellow-200',
      border: 'border-yellow-200/80',
      shadow: 'shadow-[0_0_12px_rgba(254,240,138,0.4)]',
      bg: 'bg-yellow-950/30',
      destBorder: 'border border-yellow-200/40 bg-yellow-950/60',
      colorHex: '#fef08a',
      blockFill: 'fill-yellow-950/85',
      solidFill: 'fill-yellow-200',
    },
    purple: {
      text: 'text-purple-300',
      border: 'border-purple-300/80',
      shadow: 'shadow-[0_0_12px_rgba(192,132,252,0.4)]',
      bg: 'bg-purple-950/30',
      destBorder: 'border border-purple-300/40 bg-purple-950/60',
      colorHex: '#c084fc',
      blockFill: 'fill-purple-950/85',
      solidFill: 'fill-purple-400',
    },
    green: {
      text: 'text-teal-300',
      border: 'border-teal-400/80',
      shadow: 'shadow-[0_0_12px_rgba(20,184,166,0.4)]',
      bg: 'bg-teal-950/30',
      destBorder: 'border border-teal-400/40 bg-teal-950/60',
      colorHex: '#14b8a6',
      blockFill: 'fill-teal-950/85',
      solidFill: 'fill-teal-400',
    },
    orange: {
      text: 'text-orange-300',
      border: 'border-orange-300/80',
      shadow: 'shadow-[0_0_12px_rgba(251,146,60,0.4)]',
      bg: 'bg-orange-950/30',
      destBorder: 'border border-orange-300/40 bg-orange-950/60',
      colorHex: '#fb923c',
      blockFill: 'fill-orange-950/85',
      solidFill: 'fill-orange-400',
    },
  },
  forest: {
    red: {
      text: 'text-red-500',
      border: 'border-red-600/80',
      shadow: 'shadow-[0_0_10px_rgba(220,38,38,0.3)]',
      bg: 'bg-red-950/40',
      destBorder: 'border border-red-600/40 bg-red-950/60',
      colorHex: '#dc2626',
      blockFill: 'fill-red-950/90',
      solidFill: 'fill-red-600',
    },
    blue: {
      text: 'text-cyan-400',
      border: 'border-cyan-600/80',
      shadow: 'shadow-[0_0_10px_rgba(8,145,178,0.3)]',
      bg: 'bg-cyan-950/40',
      destBorder: 'border border-cyan-600/40 bg-cyan-950/60',
      colorHex: '#0891b2',
      blockFill: 'fill-cyan-950/90',
      solidFill: 'fill-cyan-600',
    },
    yellow: {
      text: 'text-amber-400',
      border: 'border-amber-500/80',
      shadow: 'shadow-[0_0_10px_rgba(234,179,8,0.3)]',
      bg: 'bg-amber-950/40',
      destBorder: 'border border-amber-500/40 bg-amber-950/60',
      colorHex: '#eab308',
      blockFill: 'fill-amber-950/90',
      solidFill: 'fill-amber-500',
    },
    purple: {
      text: 'text-purple-400',
      border: 'border-purple-700/80',
      shadow: 'shadow-[0_0_10px_rgba(126,34,206,0.3)]',
      bg: 'bg-purple-950/40',
      destBorder: 'border border-purple-600/40 bg-purple-950/60',
      colorHex: '#7e22ce',
      blockFill: 'fill-purple-950/90',
      solidFill: 'fill-purple-700',
    },
    green: {
      text: 'text-emerald-500',
      border: 'border-emerald-600/80',
      shadow: 'shadow-[0_0_10px_rgba(22,163,74,0.3)]',
      bg: 'bg-emerald-950/40',
      destBorder: 'border border-emerald-500/40 bg-emerald-950/60',
      colorHex: '#16a34a',
      blockFill: 'fill-emerald-950/90',
      solidFill: 'fill-emerald-600',
    },
    orange: {
      text: 'text-amber-600',
      border: 'border-amber-700/80',
      shadow: 'shadow-[0_0_10px_rgba(194,65,12,0.3)]',
      bg: 'bg-stone-900/40',
      destBorder: 'border border-amber-600/40 bg-stone-950/60',
      colorHex: '#c2410c',
      blockFill: 'fill-stone-950/90',
      solidFill: 'fill-amber-700',
    },
  },
  candy: {
    red: {
      text: 'text-rose-400',
      border: 'border-rose-400/80',
      shadow: 'shadow-[0_0_12px_rgba(255,51,102,0.4)]',
      bg: 'bg-pink-950/30',
      destBorder: 'border border-rose-400/40 bg-pink-950/60',
      colorHex: '#ff3366',
      blockFill: 'fill-pink-950/85',
      solidFill: 'fill-rose-400',
    },
    blue: {
      text: 'text-sky-300',
      border: 'border-sky-400/80',
      shadow: 'shadow-[0_0_12px_rgba(56,189,248,0.4)]',
      bg: 'bg-blue-950/30',
      destBorder: 'border border-sky-400/40 bg-blue-950/60',
      colorHex: '#38bdf8',
      blockFill: 'fill-blue-950/85',
      solidFill: 'fill-sky-400',
    },
    yellow: {
      text: 'text-yellow-300',
      border: 'border-yellow-300/80',
      shadow: 'shadow-[0_0_12px_rgba(250,204,21,0.4)]',
      bg: 'bg-yellow-950/30',
      destBorder: 'border border-yellow-300/40 bg-yellow-950/60',
      colorHex: '#facc15',
      blockFill: 'fill-yellow-950/85',
      solidFill: 'fill-yellow-300',
    },
    purple: {
      text: 'text-purple-300',
      border: 'border-purple-300/80',
      shadow: 'shadow-[0_0_12px_rgba(192,132,252,0.4)]',
      bg: 'bg-purple-950/30',
      destBorder: 'border border-purple-300/40 bg-purple-950/60',
      colorHex: '#c084fc',
      blockFill: 'fill-purple-950/85',
      solidFill: 'fill-purple-300',
    },
    green: {
      text: 'text-lime-400',
      border: 'border-lime-400/80',
      shadow: 'shadow-[0_0_12px_rgba(132,204,22,0.5)]',
      bg: 'bg-lime-950/30',
      destBorder: 'border border-lime-400/40 bg-lime-950/60',
      colorHex: '#84cc16',
      blockFill: 'fill-lime-950/85',
      solidFill: 'fill-lime-400',
    },
    orange: {
      text: 'text-orange-300',
      border: 'border-orange-300/80',
      shadow: 'shadow-[0_0_12px_rgba(255,153,51,0.4)]',
      bg: 'bg-orange-950/30',
      destBorder: 'border border-orange-300/40 bg-orange-950/60',
      colorHex: '#ff9933',
      blockFill: 'fill-orange-950/85',
      solidFill: 'fill-orange-300',
    },
  },
  space: {
    red: {
      text: 'text-rose-500',
      border: 'border-rose-500/80',
      shadow: 'shadow-[0_0_15px_rgba(225,29,72,0.5)]',
      bg: 'bg-rose-950/30',
      destBorder: 'border border-rose-500/40 bg-rose-950/60',
      colorHex: '#e11d48',
      blockFill: 'fill-rose-950/85',
      solidFill: 'fill-rose-500',
    },
    blue: {
      text: 'text-indigo-400',
      border: 'border-indigo-400/80',
      shadow: 'shadow-[0_0_15px_rgba(99,102,241,0.5)]',
      bg: 'bg-indigo-950/30',
      destBorder: 'border border-indigo-400/40 bg-indigo-950/60',
      colorHex: '#6366f1',
      blockFill: 'fill-indigo-950/85',
      solidFill: 'fill-indigo-500',
    },
    yellow: {
      text: 'text-yellow-400',
      border: 'border-yellow-400/80',
      shadow: 'shadow-[0_0_15px_rgba(250,204,21,0.5)]',
      bg: 'bg-yellow-950/30',
      destBorder: 'border border-yellow-400/40 bg-yellow-950/60',
      colorHex: '#facc15',
      blockFill: 'fill-yellow-950/85',
      solidFill: 'fill-yellow-400',
    },
    purple: {
      text: 'text-purple-400',
      border: 'border-purple-500/80',
      shadow: 'shadow-[0_0_15px_rgba(147,51,234,0.5)]',
      bg: 'bg-purple-950/30',
      destBorder: 'border border-purple-500/40 bg-purple-950/60',
      colorHex: '#9333ea',
      blockFill: 'fill-purple-950/85',
      solidFill: 'fill-purple-500',
    },
    green: {
      text: 'text-emerald-400',
      border: 'border-emerald-400/80',
      shadow: 'shadow-[0_0_15px_rgba(34,197,94,0.5)]',
      bg: 'bg-emerald-950/30',
      destBorder: 'border border-emerald-400/40 bg-emerald-950/60',
      colorHex: '#22c55e',
      blockFill: 'fill-emerald-950/85',
      solidFill: 'fill-emerald-400',
    },
    orange: {
      text: 'text-amber-500',
      border: 'border-amber-500/80',
      shadow: 'shadow-[0_0_15px_rgba(255,120,0,0.5)]',
      bg: 'bg-orange-950/30',
      destBorder: 'border border-amber-500/40 bg-orange-950/60',
      colorHex: '#ff7800',
      blockFill: 'fill-orange-950/85',
      solidFill: 'fill-amber-500',
    },
  },
  ocean: {
    red: {
      text: 'text-rose-400',
      border: 'border-rose-400/80',
      shadow: 'shadow-[0_0_12px_rgba(244,63,94,0.4)]',
      bg: 'bg-rose-950/30',
      destBorder: 'border border-rose-400/40 bg-rose-950/60',
      colorHex: '#f43f5e',
      blockFill: 'fill-rose-950/85',
      solidFill: 'fill-rose-500',
    },
    blue: {
      text: 'text-sky-400',
      border: 'border-sky-500/80',
      shadow: 'shadow-[0_0_12px_rgba(2,132,199,0.4)]',
      bg: 'bg-sky-950/30',
      destBorder: 'border border-sky-500/40 bg-sky-950/60',
      colorHex: '#0284c7',
      blockFill: 'fill-sky-950/85',
      solidFill: 'fill-sky-500',
    },
    yellow: {
      text: 'text-amber-400',
      border: 'border-amber-400/80',
      shadow: 'shadow-[0_0_12px_rgba(234,179,8,0.4)]',
      bg: 'bg-amber-950/30',
      destBorder: 'border border-amber-400/40 bg-amber-950/60',
      colorHex: '#eab308',
      blockFill: 'fill-amber-950/85',
      solidFill: 'fill-amber-400',
    },
    purple: {
      text: 'text-purple-400',
      border: 'border-purple-400/80',
      shadow: 'shadow-[0_0_12px_rgba(139,92,246,0.4)]',
      bg: 'bg-purple-950/30',
      destBorder: 'border border-purple-400/40 bg-purple-950/60',
      colorHex: '#8b5cf6',
      blockFill: 'fill-purple-950/85',
      solidFill: 'fill-purple-400',
    },
    green: {
      text: 'text-teal-400',
      border: 'border-teal-500/80',
      shadow: 'shadow-[0_0_12px_rgba(13,148,136,0.4)]',
      bg: 'bg-teal-950/30',
      destBorder: 'border border-teal-500/40 bg-teal-950/60',
      colorHex: '#0d9488',
      blockFill: 'fill-teal-950/85',
      solidFill: 'fill-teal-500',
    },
    orange: {
      text: 'text-orange-500',
      border: 'border-orange-500/80',
      shadow: 'shadow-[0_0_12px_rgba(234,88,12,0.4)]',
      bg: 'bg-orange-950/30',
      destBorder: 'border border-orange-500/40 bg-orange-950/60',
      colorHex: '#ea580c',
      blockFill: 'fill-orange-950/85',
      solidFill: 'fill-orange-500',
    },
  },
  retro: {
    red: {
      text: 'text-rose-500',
      border: 'border-rose-500/80',
      shadow: 'shadow-[0_0_15px_rgba(255,0,85,0.6)]',
      bg: 'bg-rose-950/30',
      destBorder: 'border border-rose-500/40 bg-rose-950/60',
      colorHex: '#ff0055',
      blockFill: 'fill-rose-950/85',
      solidFill: 'fill-rose-500',
    },
    blue: {
      text: 'text-cyan-400',
      border: 'border-cyan-400/80',
      shadow: 'shadow-[0_0_15px_rgba(0,170,255,0.6)]',
      bg: 'bg-cyan-950/30',
      destBorder: 'border border-cyan-400/40 bg-cyan-950/60',
      colorHex: '#00aaff',
      blockFill: 'fill-cyan-950/85',
      solidFill: 'fill-cyan-400',
    },
    yellow: {
      text: 'text-yellow-300',
      border: 'border-yellow-300/80',
      shadow: 'shadow-[0_0_15px_rgba(255,255,0,0.6)]',
      bg: 'bg-yellow-950/30',
      destBorder: 'border border-yellow-300/40 bg-yellow-950/60',
      colorHex: '#ffff00',
      blockFill: 'fill-yellow-950/85',
      solidFill: 'fill-yellow-300',
    },
    purple: {
      text: 'text-purple-400',
      border: 'border-purple-400/80',
      shadow: 'shadow-[0_0_15px_rgba(170,0,255,0.6)]',
      bg: 'bg-purple-950/30',
      destBorder: 'border border-purple-400/40 bg-purple-950/60',
      colorHex: '#aa00ff',
      blockFill: 'fill-purple-950/85',
      solidFill: 'fill-purple-400',
    },
    green: {
      text: 'text-emerald-400',
      border: 'border-emerald-400/80',
      shadow: 'shadow-[0_0_15px_rgba(0,255,68,0.6)]',
      bg: 'bg-emerald-950/30',
      destBorder: 'border border-emerald-400/40 bg-emerald-950/60',
      colorHex: '#00ff44',
      blockFill: 'fill-emerald-950/85',
      solidFill: 'fill-emerald-400',
    },
    orange: {
      text: 'text-amber-400',
      border: 'border-amber-400/80',
      shadow: 'shadow-[0_0_15px_rgba(255,136,0,0.6)]',
      bg: 'bg-orange-950/30',
      destBorder: 'border border-amber-400/40 bg-orange-950/60',
      colorHex: '#ff8800',
      blockFill: 'fill-orange-950/85',
      solidFill: 'fill-amber-400',
    },
  },
  desert: {
    red: {
      text: 'text-red-600',
      border: 'border-red-700/80',
      shadow: 'shadow-[0_0_10px_rgba(185,28,28,0.3)]',
      bg: 'bg-stone-900/40',
      destBorder: 'border border-red-600/40 bg-stone-950/60',
      colorHex: '#b91c1c',
      blockFill: 'fill-stone-950/90',
      solidFill: 'fill-red-700',
    },
    blue: {
      text: 'text-cyan-400',
      border: 'border-cyan-500/80',
      shadow: 'shadow-[0_0_10px_rgba(6,182,212,0.3)]',
      bg: 'bg-cyan-950/40',
      destBorder: 'border border-cyan-500/40 bg-cyan-950/60',
      colorHex: '#06b6d4',
      blockFill: 'fill-cyan-950/90',
      solidFill: 'fill-cyan-500',
    },
    yellow: {
      text: 'text-amber-400',
      border: 'border-amber-500/80',
      shadow: 'shadow-[0_0_10px_rgba(234,179,8,0.3)]',
      bg: 'bg-amber-950/40',
      destBorder: 'border border-amber-500/40 bg-amber-950/60',
      colorHex: '#eab308',
      blockFill: 'fill-amber-950/90',
      solidFill: 'fill-amber-500',
    },
    purple: {
      text: 'text-purple-400',
      border: 'border-purple-700/80',
      shadow: 'shadow-[0_0_10px_rgba(107,33,168,0.3)]',
      bg: 'bg-purple-950/40',
      destBorder: 'border border-purple-600/40 bg-purple-950/60',
      colorHex: '#6b21a8',
      blockFill: 'fill-purple-950/90',
      solidFill: 'fill-purple-700',
    },
    green: {
      text: 'text-emerald-600',
      border: 'border-emerald-700/80',
      shadow: 'shadow-[0_0_10px_rgba(21,128,61,0.3)]',
      bg: 'bg-stone-900/40',
      destBorder: 'border border-emerald-600/40 bg-stone-950/60',
      colorHex: '#15803d',
      blockFill: 'fill-stone-950/90',
      solidFill: 'fill-emerald-700',
    },
    orange: {
      text: 'text-amber-600',
      border: 'border-amber-600/80',
      shadow: 'shadow-[0_0_10px_rgba(217,119,6,0.3)]',
      bg: 'bg-stone-900/40',
      destBorder: 'border border-amber-600/40 bg-stone-950/60',
      colorHex: '#d97706',
      blockFill: 'fill-stone-950/90',
      solidFill: 'fill-amber-600',
    },
  },
  spooky: {
    red: {
      text: 'text-rose-700',
      border: 'border-rose-800/80',
      shadow: 'shadow-[0_0_12px_rgba(159,18,57,0.4)]',
      bg: 'bg-rose-950/40',
      destBorder: 'border border-rose-700/40 bg-rose-950/60',
      colorHex: '#9f1239',
      blockFill: 'fill-rose-950/90',
      solidFill: 'fill-rose-800',
    },
    blue: {
      text: 'text-indigo-400',
      border: 'border-indigo-700/80',
      shadow: 'shadow-[0_0_12px_rgba(55,48,163,0.4)]',
      bg: 'bg-indigo-950/40',
      destBorder: 'border border-indigo-600/40 bg-indigo-950/60',
      colorHex: '#3730a3',
      blockFill: 'fill-indigo-950/90',
      solidFill: 'fill-indigo-700',
    },
    yellow: {
      text: 'text-amber-400',
      border: 'border-amber-500/80',
      shadow: 'shadow-[0_0_12px_rgba(245,158,11,0.4)]',
      bg: 'bg-amber-950/40',
      destBorder: 'border border-amber-500/40 bg-amber-950/60',
      colorHex: '#f59e0b',
      blockFill: 'fill-amber-950/90',
      solidFill: 'fill-amber-500',
    },
    purple: {
      text: 'text-purple-400',
      border: 'border-purple-800/80',
      shadow: 'shadow-[0_0_12px_rgba(88,28,135,0.4)]',
      bg: 'bg-purple-950/40',
      destBorder: 'border border-purple-700/40 bg-purple-950/60',
      colorHex: '#581c87',
      blockFill: 'fill-purple-950/90',
      solidFill: 'fill-purple-800',
    },
    green: {
      text: 'text-emerald-400',
      border: 'border-emerald-500/80',
      shadow: 'shadow-[0_0_12px_rgba(16,185,129,0.4)]',
      bg: 'bg-emerald-950/40',
      destBorder: 'border border-emerald-500/40 bg-emerald-950/60',
      colorHex: '#10b981',
      blockFill: 'fill-emerald-950/90',
      solidFill: 'fill-emerald-500',
    },
    orange: {
      text: 'text-orange-500',
      border: 'border-orange-500/80',
      shadow: 'shadow-[0_0_12px_rgba(234,88,12,0.4)]',
      bg: 'bg-orange-950/40',
      destBorder: 'border border-orange-500/40 bg-orange-950/60',
      colorHex: '#ea580c',
      blockFill: 'fill-orange-950/90',
      solidFill: 'fill-orange-500',
    },
  },
  volcanic: {
    red: {
      text: 'text-red-500',
      border: 'border-red-600/80',
      shadow: 'shadow-[0_0_15px_rgba(220,38,38,0.5)]',
      bg: 'bg-red-950/40',
      destBorder: 'border border-red-500/40 bg-red-950/60',
      colorHex: '#dc2626',
      blockFill: 'fill-red-950/90',
      solidFill: 'fill-red-600',
    },
    blue: {
      text: 'text-blue-500',
      border: 'border-blue-600/80',
      shadow: 'shadow-[0_0_15px_rgba(29,78,216,0.5)]',
      bg: 'bg-blue-950/40',
      destBorder: 'border border-blue-500/40 bg-blue-950/60',
      colorHex: '#1d4ed8',
      blockFill: 'fill-blue-950/90',
      solidFill: 'fill-blue-600',
    },
    yellow: {
      text: 'text-amber-400',
      border: 'border-amber-500/80',
      shadow: 'shadow-[0_0_15px_rgba(245,158,11,0.5)]',
      bg: 'bg-amber-950/40',
      destBorder: 'border border-amber-500/40 bg-amber-950/60',
      colorHex: '#f59e0b',
      blockFill: 'fill-amber-950/90',
      solidFill: 'fill-amber-500',
    },
    purple: {
      text: 'text-purple-400',
      border: 'border-purple-800/80',
      shadow: 'shadow-[0_0_15px_rgba(76,29,149,0.5)]',
      bg: 'bg-purple-950/40',
      destBorder: 'border border-purple-600/40 bg-purple-950/60',
      colorHex: '#4c1d95',
      blockFill: 'fill-purple-950/90',
      solidFill: 'fill-purple-800',
    },
    green: {
      text: 'text-lime-500',
      border: 'border-lime-600/80',
      shadow: 'shadow-[0_0_15px_rgba(101,163,13,0.5)]',
      bg: 'bg-zinc-900/40',
      destBorder: 'border border-lime-500/40 bg-zinc-950/60',
      colorHex: '#65a30d',
      blockFill: 'fill-zinc-950/90',
      solidFill: 'fill-lime-600',
    },
    orange: {
      text: 'text-orange-500',
      border: 'border-orange-600/80',
      shadow: 'shadow-[0_0_15px_rgba(234,88,12,0.5)]',
      bg: 'bg-orange-950/40',
      destBorder: 'border border-orange-500/40 bg-orange-950/60',
      colorHex: '#ea580c',
      blockFill: 'fill-orange-950/90',
      solidFill: 'fill-orange-600',
    },
  },
  vantage: {
    red: {
      text: 'text-rose-500',
      border: 'border-rose-500/80',
      shadow: 'shadow-[0_0_10px_rgba(225,29,72,0.3)]',
      bg: 'bg-stone-900/40',
      destBorder: 'border border-rose-500/40 bg-stone-950/60',
      colorHex: '#e11d48',
      blockFill: 'fill-stone-950/90',
      solidFill: 'fill-rose-500',
    },
    blue: {
      text: 'text-blue-400',
      border: 'border-blue-500/80',
      shadow: 'shadow-[0_0_10px_rgba(37,99,235,0.3)]',
      bg: 'bg-blue-950/40',
      destBorder: 'border border-blue-500/40 bg-blue-950/60',
      colorHex: '#2563eb',
      blockFill: 'fill-blue-950/90',
      solidFill: 'fill-blue-500',
    },
    yellow: {
      text: 'text-amber-400',
      border: 'border-amber-400/80',
      shadow: 'shadow-[0_0_10px_rgba(251,191,36,0.3)]',
      bg: 'bg-amber-950/40',
      destBorder: 'border border-amber-400/40 bg-amber-950/60',
      colorHex: '#fbbf24',
      blockFill: 'fill-amber-950/90',
      solidFill: 'fill-amber-400',
    },
    purple: {
      text: 'text-purple-400',
      border: 'border-purple-600/80',
      shadow: 'shadow-[0_0_10px_rgba(126,34,206,0.3)]',
      bg: 'bg-purple-950/40',
      destBorder: 'border border-purple-500/40 bg-purple-950/60',
      colorHex: '#7e22ce',
      blockFill: 'fill-purple-950/90',
      solidFill: 'fill-purple-600',
    },
    green: {
      text: 'text-emerald-500',
      border: 'border-emerald-600/80',
      shadow: 'shadow-[0_0_10px_rgba(22,163,74,0.3)]',
      bg: 'bg-stone-900/40',
      destBorder: 'border border-emerald-500/40 bg-stone-950/60',
      colorHex: '#16a34a',
      blockFill: 'fill-stone-950/90',
      solidFill: 'fill-emerald-600',
    },
    orange: {
      text: 'text-orange-500',
      border: 'border-orange-500/80',
      shadow: 'shadow-[0_0_10px_rgba(249,115,22,0.3)]',
      bg: 'bg-stone-900/40',
      destBorder: 'border border-orange-500/40 bg-stone-950/60',
      colorHex: '#f97316',
      blockFill: 'fill-stone-950/90',
      solidFill: 'fill-orange-500',
    },
  },
  papercraft: {
    red: {
      text: 'text-rose-700',
      border: 'border-rose-800/80',
      shadow: 'shadow-[0_0_8px_rgba(159,18,57,0.25)]',
      bg: 'bg-[#1c1917]/60',
      destBorder: 'border border-rose-700/40 bg-[#1c1917]/80',
      colorHex: '#9f1239',
      blockFill: 'fill-[#1c1917]/90',
      solidFill: 'fill-rose-800',
    },
    blue: {
      text: 'text-blue-700',
      border: 'border-blue-800/80',
      shadow: 'shadow-[0_0_8px_rgba(30,64,175,0.25)]',
      bg: 'bg-[#1c1917]/60',
      destBorder: 'border border-blue-700/40 bg-[#1c1917]/80',
      colorHex: '#1e40af',
      blockFill: 'fill-[#1c1917]/90',
      solidFill: 'fill-blue-800',
    },
    yellow: {
      text: 'text-amber-600',
      border: 'border-amber-700/80',
      shadow: 'shadow-[0_0_8px_rgba(217,119,6,0.25)]',
      bg: 'bg-[#1c1917]/60',
      destBorder: 'border border-amber-600/40 bg-[#1c1917]/80',
      colorHex: '#d97706',
      blockFill: 'fill-[#1c1917]/90',
      solidFill: 'fill-amber-700',
    },
    purple: {
      text: 'text-purple-700',
      border: 'border-purple-800/80',
      shadow: 'shadow-[0_0_8px_rgba(107,33,168,0.25)]',
      bg: 'bg-[#1c1917]/60',
      destBorder: 'border border-purple-700/40 bg-[#1c1917]/80',
      colorHex: '#6b21a8',
      blockFill: 'fill-[#1c1917]/90',
      solidFill: 'fill-purple-800',
    },
    green: {
      text: 'text-emerald-700',
      border: 'border-emerald-800/80',
      shadow: 'shadow-[0_0_8px_rgba(22,101,52,0.25)]',
      bg: 'bg-[#1c1917]/60',
      destBorder: 'border border-emerald-700/40 bg-[#1c1917]/80',
      colorHex: '#166534',
      blockFill: 'fill-[#1c1917]/90',
      solidFill: 'fill-emerald-800',
    },
    orange: {
      text: 'text-amber-700',
      border: 'border-amber-800/80',
      shadow: 'shadow-[0_0_8px_rgba(194,65,12,0.25)]',
      bg: 'bg-[#1c1917]/60',
      destBorder: 'border border-amber-700/40 bg-[#1c1917]/80',
      colorHex: '#c2410c',
      blockFill: 'fill-[#1c1917]/90',
      solidFill: 'fill-amber-800',
    },
  },
  steampunk: {
    red: {
      text: 'text-red-500',
      border: 'border-red-600/80',
      shadow: 'shadow-[0_0_12px_rgba(220,38,38,0.4)]',
      bg: 'bg-[#291e14]/60',
      destBorder: 'border border-red-500/40 bg-[#1c140c]/80',
      colorHex: '#dc2626',
      blockFill: 'fill-[#1c140c]/90',
      solidFill: 'fill-red-600',
    },
    blue: {
      text: 'text-sky-500',
      border: 'border-sky-600/80',
      shadow: 'shadow-[0_0_12px_rgba(2,132,199,0.35)]',
      bg: 'bg-[#1c140c]/60',
      destBorder: 'border border-sky-500/40 bg-[#1c140c]/80',
      colorHex: '#0284c7',
      blockFill: 'fill-[#1c140c]/90',
      solidFill: 'fill-sky-600',
    },
    yellow: {
      text: 'text-yellow-400',
      border: 'border-yellow-400/80',
      shadow: 'shadow-[0_0_12px_rgba(250,204,21,0.45)]',
      bg: 'bg-[#291e14]/60',
      destBorder: 'border border-yellow-400/40 bg-[#1c140c]/80',
      colorHex: '#facc15',
      blockFill: 'fill-[#1c140c]/90',
      solidFill: 'fill-yellow-400',
    },
    purple: {
      text: 'text-purple-400',
      border: 'border-purple-600/80',
      shadow: 'shadow-[0_0_12px_rgba(126,34,206,0.35)]',
      bg: 'bg-[#1c140c]/60',
      destBorder: 'border border-purple-500/40 bg-[#1c140c]/80',
      colorHex: '#7e22ce',
      blockFill: 'fill-[#1c140c]/90',
      solidFill: 'fill-purple-600',
    },
    green: {
      text: 'text-teal-400',
      border: 'border-teal-600/80',
      shadow: 'shadow-[0_0_12px_rgba(13,148,136,0.35)]',
      bg: 'bg-[#1c140c]/60',
      destBorder: 'border border-teal-500/40 bg-[#1c140c]/80',
      colorHex: '#0d9488',
      blockFill: 'fill-[#1c140c]/90',
      solidFill: 'fill-teal-600',
    },
    orange: {
      text: 'text-orange-500',
      border: 'border-orange-500/80',
      shadow: 'shadow-[0_0_12px_rgba(249,115,22,0.4)]',
      bg: 'bg-[#291e14]/60',
      destBorder: 'border border-orange-500/40 bg-[#1c140c]/80',
      colorHex: '#f97316',
      blockFill: 'fill-[#1c140c]/90',
      solidFill: 'fill-orange-500',
    },
  },
  olympus: {
    red: {
      text: 'text-rose-500',
      border: 'border-rose-500/80',
      shadow: 'shadow-[0_0_12px_rgba(225,29,72,0.4)]',
      bg: 'bg-[#0f172a]/60',
      destBorder: 'border border-rose-500/40 bg-[#090d16]/80',
      colorHex: '#e11d48',
      blockFill: 'fill-[#090d16]/90',
      solidFill: 'fill-rose-500',
    },
    blue: {
      text: 'text-sky-400',
      border: 'border-sky-400/80',
      shadow: 'shadow-[0_0_12px_rgba(56,189,248,0.4)]',
      bg: 'bg-[#0f172a]/60',
      destBorder: 'border border-sky-400/40 bg-[#090d16]/80',
      colorHex: '#38bdf8',
      blockFill: 'fill-[#090d16]/90',
      solidFill: 'fill-sky-400',
    },
    yellow: {
      text: 'text-yellow-300',
      border: 'border-yellow-300/80',
      shadow: 'shadow-[0_0_14px_rgba(253,224,71,0.5)]',
      bg: 'bg-[#0f172a]/60',
      destBorder: 'border border-yellow-300/40 bg-[#090d16]/80',
      colorHex: '#fde047',
      blockFill: 'fill-[#090d16]/90',
      solidFill: 'fill-yellow-300',
    },
    purple: {
      text: 'text-purple-400',
      border: 'border-purple-500/80',
      shadow: 'shadow-[0_0_12px_rgba(168,85,247,0.4)]',
      bg: 'bg-[#0f172a]/60',
      destBorder: 'border border-purple-400/40 bg-[#090d16]/80',
      colorHex: '#a855f7',
      blockFill: 'fill-[#090d16]/90',
      solidFill: 'fill-purple-400',
    },
    green: {
      text: 'text-emerald-400',
      border: 'border-emerald-500/80',
      shadow: 'shadow-[0_0_12px_rgba(16,185,129,0.4)]',
      bg: 'bg-[#0f172a]/60',
      destBorder: 'border border-emerald-400/40 bg-[#090d16]/80',
      colorHex: '#10b981',
      blockFill: 'fill-[#090d16]/90',
      solidFill: 'fill-emerald-400',
    },
    orange: {
      text: 'text-orange-500',
      border: 'border-orange-600/80',
      shadow: 'shadow-[0_0_12px_rgba(234,88,12,0.4)]',
      bg: 'bg-[#0f172a]/60',
      destBorder: 'border border-orange-500/40 bg-[#090d16]/80',
      colorHex: '#ea580c',
      blockFill: 'fill-[#090d16]/90',
      solidFill: 'fill-orange-600',
    },
  },
  pirate: {
    red: {
      text: 'text-rose-600',
      border: 'border-rose-700/80',
      shadow: 'shadow-[0_0_12px_rgba(220,38,38,0.4)]',
      bg: 'bg-[#0d1f22]/60',
      destBorder: 'border border-rose-600/40 bg-[#081315]/80',
      colorHex: '#dc2626',
      blockFill: 'fill-[#081315]/90',
      solidFill: 'fill-rose-600',
    },
    blue: {
      text: 'text-sky-400',
      border: 'border-sky-500/80',
      shadow: 'shadow-[0_0_12px_rgba(2,132,199,0.45)]',
      bg: 'bg-[#0d1f22]/60',
      destBorder: 'border border-sky-400/40 bg-[#081315]/80',
      colorHex: '#0284c7',
      blockFill: 'fill-[#081315]/90',
      solidFill: 'fill-sky-500',
    },
    yellow: {
      text: 'text-amber-400',
      border: 'border-amber-400/80',
      shadow: 'shadow-[0_0_14px_rgba(234,179,8,0.45)]',
      bg: 'bg-[#0d1f22]/60',
      destBorder: 'border border-amber-400/40 bg-[#081315]/80',
      colorHex: '#eab308',
      blockFill: 'fill-[#081315]/90',
      solidFill: 'fill-amber-400',
    },
    purple: {
      text: 'text-purple-400',
      border: 'border-purple-600/80',
      shadow: 'shadow-[0_0_12px_rgba(139,92,246,0.4)]',
      bg: 'bg-[#0d1f22]/60',
      destBorder: 'border border-purple-500/40 bg-[#081315]/80',
      colorHex: '#8b5cf6',
      blockFill: 'fill-[#081315]/90',
      solidFill: 'fill-purple-500',
    },
    green: {
      text: 'text-emerald-400',
      border: 'border-emerald-500/80',
      shadow: 'shadow-[0_0_12px_rgba(16,185,129,0.45)]',
      bg: 'bg-[#0d1f22]/60',
      destBorder: 'border border-emerald-400/40 bg-[#081315]/80',
      colorHex: '#10b981',
      blockFill: 'fill-[#081315]/90',
      solidFill: 'fill-emerald-500',
    },
    orange: {
      text: 'text-amber-600',
      border: 'border-amber-700/80',
      shadow: 'shadow-[0_0_12px_rgba(217,119,6,0.35)]',
      bg: 'bg-[#0d1f22]/60',
      destBorder: 'border border-amber-600/40 bg-[#081315]/80',
      colorHex: '#d97706',
      blockFill: 'fill-[#081315]/90',
      solidFill: 'fill-amber-600',
    },
  },
  synthwave: {
    red: {
      text: 'text-rose-400',
      border: 'border-rose-500/80',
      shadow: 'shadow-[0_0_15px_rgba(244,63,94,0.5)]',
      bg: 'bg-[#1a0b2e]/60',
      destBorder: 'border border-rose-400/40 bg-[#0e061a]/80',
      colorHex: '#f43f5e',
      blockFill: 'fill-[#0e061a]/90',
      solidFill: 'fill-rose-500',
    },
    blue: {
      text: 'text-cyan-400',
      border: 'border-cyan-400/80',
      shadow: 'shadow-[0_0_15px_rgba(6,182,212,0.5)]',
      bg: 'bg-[#1a0b2e]/60',
      destBorder: 'border border-cyan-400/40 bg-[#0e061a]/80',
      colorHex: '#06b6d4',
      blockFill: 'fill-[#0e061a]/90',
      solidFill: 'fill-cyan-400',
    },
    yellow: {
      text: 'text-yellow-300',
      border: 'border-yellow-300/80',
      shadow: 'shadow-[0_0_15px_rgba(250,204,21,0.5)]',
      bg: 'bg-[#1a0b2e]/60',
      destBorder: 'border border-yellow-300/40 bg-[#0e061a]/80',
      colorHex: '#facc15',
      blockFill: 'fill-[#0e061a]/90',
      solidFill: 'fill-yellow-300',
    },
    purple: {
      text: 'text-fuchsia-400',
      border: 'border-fuchsia-500/80',
      shadow: 'shadow-[0_0_15px_rgba(217,70,239,0.5)]',
      bg: 'bg-[#1a0b2e]/60',
      destBorder: 'border border-fuchsia-400/40 bg-[#0e061a]/80',
      colorHex: '#c026d3',
      blockFill: 'fill-[#0e061a]/90',
      solidFill: 'fill-fuchsia-500',
    },
    green: {
      text: 'text-lime-400',
      border: 'border-lime-400/80',
      shadow: 'shadow-[0_0_15px_rgba(132,204,22,0.5)]',
      bg: 'bg-[#1a0b2e]/60',
      destBorder: 'border border-lime-400/40 bg-[#0e061a]/80',
      colorHex: '#84cc16',
      blockFill: 'fill-[#0e061a]/90',
      solidFill: 'fill-lime-400',
    },
    orange: {
      text: 'text-orange-500',
      border: 'border-orange-500/80',
      shadow: 'shadow-[0_0_15px_rgba(249,115,22,0.5)]',
      bg: 'bg-[#1a0b2e]/60',
      destBorder: 'border border-orange-500/40 bg-[#0e061a]/80',
      colorHex: '#ff7800',
      blockFill: 'fill-[#0e061a]/90',
      solidFill: 'fill-orange-500',
    },
  },
};

export const getThemeColorPalette = (baseThemeId: BaseThemeId | string, colorId: ColorId) => {
  const base = getBaseThemeId(baseThemeId);
  const themeOverride = THEME_COLOR_PALETTES[base]?.[colorId];
  if (themeOverride) {
    return themeOverride;
  }
  return COLOR_PALETTES[colorId] || COLOR_PALETTES.blue;
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
  const baseThemeId = getBaseThemeId(themeId);
  if (blockType === 'gray-neutral') {
    const palette = COLOR_PALETTES.gray;
    return {
      text: palette.text,
      border: `border ${palette.border} ${baseThemeId === 'neon' ? palette.shadow : ''}`,
      shadow: baseThemeId === 'neon' ? palette.shadow : '',
      blockFill: palette.blockFill,
      solidFill: palette.solidFill,
      colorHex: palette.colorHex,
    };
  }
  const cellConfig = themeConfig[blockType];
  const colorId = cellConfig?.color || (blockType.split('-')[0] as ColorId) || 'red';
  const palette = getThemeColorPalette(baseThemeId, colorId);
  return {
    text: palette.text,
    border: `border ${palette.border} ${baseThemeId === 'neon' ? palette.shadow : ''}`,
    shadow: baseThemeId === 'neon' ? palette.shadow : '',
    blockFill: palette.blockFill,
    solidFill: palette.solidFill,
    colorHex: palette.colorHex,
  };
};

export const getDestinationStyle = (themeConfig: ThemeConfig, themeId: ThemeId, destType: BlockType) => {
  const cellConfig = themeConfig[destType as keyof ThemeConfig];
  const colorId = cellConfig?.color || (destType.split('-')[0] as ColorId) || 'red';
  const baseThemeId = getBaseThemeId(themeId);
  const palette = getThemeColorPalette(baseThemeId, colorId);

  let border = palette.destBorder;
  if (baseThemeId !== 'neon') {
    // Strip neon-XYZ and shadow-[...] classes on non-neon themes
    border = border.replace(/\bneon-\w+\b/g, '')
      .replace(/\bshadow-\[.*?\]\b/g, '')
      .trim();
  }
  return { border, colorHex: palette.colorHex, bg: palette.bg, text: palette.text };
};

const positionKey = (pos: Position) => `${pos.x},${pos.y}`;

const getWallStyle = (themeId: string): string => {
  const base = getBaseThemeId(themeId);
  switch (base) {
    case 'winter':
      return 'bg-slate-900';
    case 'forest':
      return 'bg-stone-900';
    case 'candy':
      return 'bg-slate-900';
    case 'space':
      return 'bg-slate-900';
    case 'ocean':
      return 'bg-slate-900';
    case 'retro':
      return 'bg-zinc-900';
    case 'desert':
      return 'bg-stone-900';
    case 'spooky':
      return 'bg-zinc-900';
    case 'volcanic':
      return 'bg-zinc-900';
    case 'vantage':
      return 'bg-stone-900';
    case 'papercraft':
      return 'bg-[#1c1917]';
    case 'steampunk':
      return 'bg-[#1c140c]';
    case 'olympus':
      return 'bg-[#090d16]';
    case 'pirate':
      return 'bg-[#081315]';
    case 'synthwave':
      return 'bg-[#0e061a]';
    case 'neon':
    default:
      return 'bg-slate-900';
  }
};
type GridCellProps = {
  hasWall: boolean;
  destination?: DestinationData | undefined;
  styles: ThemeStyles;
  config: ThemeConfig;
  activeTheme: ThemeId;
  activeCharacter?: string | undefined;
  trailsEnabled: boolean;
  cellTrail?: { colorHex: string; delayMs: number } | undefined;
};

const GridCell = memo(({
  hasWall,
  destination,
  styles,
  config,
  activeTheme,
  activeCharacter,
  trailsEnabled,
  cellTrail,
}: GridCellProps) => {
  let bgColor = styles.cellClass;
  let borderStyle = '';

  const destTypeKey = destination ? (destination.type as keyof ThemeConfig) : undefined;
  const destStyle = destination && destTypeKey ? getDestinationStyle(config, activeTheme, destination.type) : null;

  if (hasWall) {
    bgColor = getWallStyle(activeCharacter || activeTheme);
    borderStyle = '';
  } else if (destination && destStyle) {
    bgColor = `${destStyle.bg} bg-black/60 shadow-[inset_0_0_10px_rgba(0,0,0,0.6)]`;
    borderStyle = destStyle.border;
  } else {
    bgColor = `${styles.cellClass} shadow-[inset_0_1px_2px_rgba(255,255,255,0.1)]`;
    borderStyle = '';
  }

  return (
    <div
      className={`aspect-square flex items-center justify-center text-lg sm:text-2xl font-bold transition-all relative ${bgColor} ${borderStyle}`}
      style={{
        width: 'var(--cell-size)',
        height: 'var(--cell-size)',
        borderRadius: 'calc(var(--cell-size) * 0.16)',
      }}
    >
      {/* Colored Trail Component Inside Grid Cell Underneath Main Block */}
      {trailsEnabled && cellTrail && !hasWall && (
        <div
          className="absolute inset-[6%] pointer-events-none z-0 animate-trail-stagger"
          style={{
            backgroundColor: cellTrail.colorHex,
            opacity: 0.45,
            borderRadius: 'calc(var(--cell-size) * 0.14)',
            boxShadow: `0 0 calc(var(--cell-size) * 0.15) ${cellTrail.colorHex}`,
            animationDelay: `${cellTrail.delayMs}ms`,
          }}
        />
      )}
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
        </div>
      )}
      {!hasWall && destination && destStyle && destTypeKey && config[destTypeKey] && (
        <div className="absolute inset-0 w-full h-full flex items-center justify-center pointer-events-none p-1">
          {/* Solid Low-Opacity Inner Target Box */}
          <div
            className={`w-full h-full ${destStyle.bg} border ${destStyle.border} opacity-90 flex items-center justify-center shadow-[inset_0_0_12px_rgba(0,0,0,0.6)]`}
            style={{ borderRadius: 'calc(var(--cell-size) * 0.14)' }}
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
});
GridCell.displayName = 'GridCell';

export const ThemeOrb = memo(({ id, className = 'w-full h-full' }: { id: string; className?: string }) => {
  switch (id) {
    case 'winter':
      return (
        <div className={`relative flex items-center justify-center ${className}`}>
          <div className="w-full h-full rounded-2xl bg-gradient-to-br from-sky-300 via-blue-500 to-sky-900 p-0.5 border border-sky-200/50 shadow-[0_0_10px_rgba(56,189,248,0.4)] flex items-center justify-center">
            <div className="w-3/4 h-3/4 rounded-xl bg-sky-950/70 backdrop-blur-sm border border-sky-400/40 flex items-center justify-center">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-sky-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M4.93 19.07l14.14-14.14" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </div>
      );
    case 'forest':
      return (
        <div className={`relative flex items-center justify-center ${className}`}>
          <div className="w-full h-full rounded-2xl bg-gradient-to-br from-emerald-300 via-green-600 to-teal-950 p-0.5 border border-emerald-300/50 shadow-[0_0_10px_rgba(16,185,129,0.4)] flex items-center justify-center">
            <div className="w-3/4 h-3/4 rounded-xl bg-emerald-950/70 backdrop-blur-sm border border-emerald-400/40 flex items-center justify-center">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-300" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L4 12h3l-4 8h18l-4-8h3L12 2z" />
              </svg>
            </div>
          </div>
        </div>
      );
    case 'candy':
      return (
        <div className={`relative flex items-center justify-center ${className}`}>
          <div className="w-full h-full rounded-2xl bg-gradient-to-br from-rose-300 via-pink-500 to-purple-900 p-0.5 border border-pink-200/50 shadow-[0_0_10px_rgba(244,63,94,0.4)] flex items-center justify-center">
            <div className="w-3/4 h-3/4 rounded-xl bg-pink-950/70 backdrop-blur-sm border border-pink-400/40 flex items-center justify-center">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-pink-300" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </div>
          </div>
        </div>
      );
    case 'space':
      return (
        <div className={`relative flex items-center justify-center ${className}`}>
          <div className="w-full h-full rounded-2xl bg-gradient-to-br from-indigo-300 via-purple-600 to-indigo-950 p-0.5 border border-indigo-300/50 shadow-[0_0_10px_rgba(99,102,241,0.4)] flex items-center justify-center">
            <div className="w-3/4 h-3/4 rounded-xl bg-indigo-950/70 backdrop-blur-sm border border-indigo-400/40 flex items-center justify-center">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-300" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8l-6.2 4.5 2.4-7.4L2 9.4h7.6z" />
              </svg>
            </div>
          </div>
        </div>
      );
    case 'ocean':
      return (
        <div className={`relative flex items-center justify-center ${className}`}>
          <div className="w-full h-full rounded-2xl bg-gradient-to-br from-cyan-300 via-teal-500 to-blue-950 p-0.5 border border-cyan-200/50 shadow-[0_0_10px_rgba(6,182,212,0.4)] flex items-center justify-center">
            <div className="w-3/4 h-3/4 rounded-xl bg-cyan-950/70 backdrop-blur-sm border border-cyan-400/40 flex items-center justify-center">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-300" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
              </svg>
            </div>
          </div>
        </div>
      );
    case 'retro':
      return (
        <div className={`relative flex items-center justify-center ${className}`}>
          <div className="w-full h-full rounded-2xl bg-gradient-to-br from-fuchsia-400 via-purple-600 to-amber-500 p-0.5 border border-fuchsia-300/50 shadow-[0_0_10px_rgba(217,70,239,0.4)] flex items-center justify-center">
            <div className="w-3/4 h-3/4 rounded-xl bg-purple-950/70 backdrop-blur-sm border border-fuchsia-400/40 flex items-center justify-center">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-fuchsia-300" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 7H8v3H6v-3H3v-2h3V8h2v3h3v2zm4.5 2c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm3-3c-.83 0-1.5-.67-1.5-1.5S17.67 9 18.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
              </svg>
            </div>
          </div>
        </div>
      );
    case 'desert':
      return (
        <div className={`relative flex items-center justify-center ${className}`}>
          <div className="w-full h-full rounded-2xl bg-gradient-to-br from-amber-300 via-orange-500 to-yellow-950 p-0.5 border border-amber-200/50 shadow-[0_0_10px_rgba(245,158,11,0.4)] flex items-center justify-center">
            <div className="w-3/4 h-3/4 rounded-xl bg-amber-950/70 backdrop-blur-sm border border-amber-400/40 flex items-center justify-center">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="5" />
                <path d="M12 2v3m0 14v3M2 12h3m14 0h3m-3.5-6.5l-2.1 2.1m-8.8 8.8l-2.1 2.1m0-13l2.1 2.1m8.8 8.8l2.1 2.1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </div>
      );
    case 'spooky':
      return (
        <div className={`relative flex items-center justify-center ${className}`}>
          <div className="w-full h-full rounded-2xl bg-gradient-to-br from-orange-400 via-purple-700 to-zinc-950 p-0.5 border border-orange-300/50 shadow-[0_0_10px_rgba(249,115,22,0.4)] flex items-center justify-center">
            <div className="w-3/4 h-3/4 rounded-xl bg-purple-950/70 backdrop-blur-sm border border-orange-400/40 flex items-center justify-center">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2a1 1 0 011 1v1.07A8 8 0 0120 12c0 4.42-3.58 8-8 8s-8-3.58-8-8a8 8 0 017-7.93V3a1 1 0 011-1zm-3 8a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm6 0a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm-5.5 6a5 5 0 005 0h-5z" />
              </svg>
            </div>
          </div>
        </div>
      );
    case 'volcanic':
      return (
        <div className={`relative flex items-center justify-center ${className}`}>
          <div className="w-full h-full rounded-2xl bg-gradient-to-br from-red-500 via-amber-600 to-red-950 p-0.5 border border-red-300/50 shadow-[0_0_10px_rgba(239,68,68,0.4)] flex items-center justify-center">
            <div className="w-3/4 h-3/4 rounded-xl bg-red-950/70 backdrop-blur-sm border border-red-400/40 flex items-center justify-center">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.69L7.5 11h9L12 2.69zM4.5 13L2 21h20l-2.5-8h-15z" />
              </svg>
            </div>
          </div>
        </div>
      );
    case 'vantage':
      return (
        <div className={`relative flex items-center justify-center ${className}`}>
          <div className="w-full h-full rounded-2xl bg-gradient-to-br from-amber-400 via-yellow-600 to-stone-950 p-0.5 border border-amber-300/50 shadow-[0_0_10px_rgba(217,119,6,0.4)] flex items-center justify-center">
            <div className="w-3/4 h-3/4 rounded-xl bg-stone-950/70 backdrop-blur-sm border border-amber-500/40 flex items-center justify-center">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14 6l-3.8 5 2.55 3.4L11 16l-5-7L1 18h22L14 6z" />
              </svg>
            </div>
          </div>
        </div>
      );
    case 'papercraft':
      return (
        <div className={`relative flex items-center justify-center ${className}`}>
          <div className="w-full h-full rounded-2xl bg-gradient-to-br from-amber-700 via-yellow-800 to-stone-900 p-0.5 border border-amber-600/50 shadow-[0_0_10px_rgba(180,83,9,0.4)] flex items-center justify-center">
            <div className="w-3/4 h-3/4 rounded-xl bg-stone-900/70 backdrop-blur-sm border border-amber-600/40 flex items-center justify-center">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="4" y="4" width="16" height="16" rx="2" strokeDasharray="4 2" />
              </svg>
            </div>
          </div>
        </div>
      );
    case 'steampunk':
      return (
        <div className={`relative flex items-center justify-center ${className}`}>
          <div className="w-full h-full rounded-2xl bg-gradient-to-br from-amber-500 via-yellow-700 to-stone-900 p-0.5 border border-amber-400/50 shadow-[0_0_10px_rgba(217,119,6,0.4)] flex items-center justify-center">
            <div className="w-3/4 h-3/4 rounded-xl bg-stone-950/70 backdrop-blur-sm border border-amber-500/40 flex items-center justify-center">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2v2m0 16v2M2 12h2m16 0h2m-3.5-6.5l-1.4 1.4m-8.2 8.2l-1.4 1.4m0-11l1.4 1.4m8.2 8.2l1.4 1.4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </div>
      );
    case 'olympus':
      return (
        <div className={`relative flex items-center justify-center ${className}`}>
          <div className="w-full h-full rounded-2xl bg-gradient-to-br from-amber-300 via-sky-500 to-indigo-950 p-0.5 border border-amber-300/60 shadow-[0_0_10px_rgba(251,191,36,0.4)] flex items-center justify-center">
            <div className="w-3/4 h-3/4 rounded-xl bg-indigo-950/70 backdrop-blur-sm border border-amber-400/40 flex items-center justify-center">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="13,2 4,13 11,13 8,22 20,9 13,9" />
              </svg>
            </div>
          </div>
        </div>
      );
    case 'pirate':
      return (
        <div className={`relative flex items-center justify-center ${className}`}>
          <div className="w-full h-full rounded-2xl bg-gradient-to-br from-teal-400 via-cyan-700 to-slate-950 p-0.5 border border-teal-300/50 shadow-[0_0_10px_rgba(45,212,191,0.4)] flex items-center justify-center">
            <div className="w-3/4 h-3/4 rounded-xl bg-slate-950/70 backdrop-blur-sm border border-teal-400/40 flex items-center justify-center">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-teal-300" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" strokeWidth="2" />
                <circle cx="12" cy="12" r="1.5" />
                <line x1="12" y1="3" x2="12" y2="21" stroke="currentColor" strokeWidth="2" />
                <line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="2" />
              </svg>
            </div>
          </div>
        </div>
      );
    case 'synthwave':
      return (
        <div className={`relative flex items-center justify-center ${className}`}>
          <div className="w-full h-full rounded-2xl bg-gradient-to-br from-fuchsia-500 via-rose-600 to-purple-950 p-0.5 border border-pink-400/60 shadow-[0_0_10px_rgba(244,63,94,0.4)] flex items-center justify-center">
            <div className="w-3/4 h-3/4 rounded-xl bg-purple-950/70 backdrop-blur-sm border border-pink-400/40 flex items-center justify-center">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-pink-400" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="12,3 22,20 2,20" fill="none" stroke="currentColor" strokeWidth="2" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </div>
          </div>
        </div>
      );
    case 'neon':
    default:
      return (
        <div className={`relative flex items-center justify-center ${className}`}>
          <div className="w-full h-full rounded-2xl bg-gradient-to-br from-cyan-400 via-sky-500 to-indigo-900 p-0.5 border border-cyan-300/50 shadow-[0_0_10px_rgba(34,211,238,0.4)] flex items-center justify-center">
            <div className="w-3/4 h-3/4 rounded-xl bg-cyan-950/70 backdrop-blur-sm border border-cyan-400/40 flex items-center justify-center">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-300" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
          </div>
        </div>
      );
  }
});
ThemeOrb.displayName = 'ThemeOrb';

export const CharacterOrb = memo(({ id, className = 'w-full h-full' }: { id: string; className?: string }) => {
  switch (id) {
    case 'ocean':
      return (
        <div className={`relative flex items-center justify-center filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)] ${className}`}>
          <svg className="w-full h-full p-0.5" viewBox="0 0 100 100" fill="none">
            <defs>
              <linearGradient id="oceanHeadGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="40%" stopColor="#0891b2" />
                <stop offset="80%" stopColor="#164e63" />
                <stop offset="100%" stopColor="#083344" />
              </linearGradient>
              <linearGradient id="oceanVisorGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#22d3ee" />
                <stop offset="50%" stopColor="#67e8f9" />
                <stop offset="100%" stopColor="#a5f3fc" />
              </linearGradient>
              <radialGradient id="oceanLureGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="50%" stopColor="#22d3ee" />
                <stop offset="100%" stopColor="#0891b2" stopOpacity="0" />
              </radialGradient>
              <filter id="oceanGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Aquatic Pulse Halo */}
            <circle cx="50" cy="52" r="42" fill="#06b6d4" fillOpacity="0.18" className="animate-pulse" />
            <ellipse cx="50" cy="90" rx="30" ry="6" fill="#000000" fillOpacity="0.5" />

            {/* Octopus Side Tentacles */}
            <path d="M 22 55 Q 10 65 6 78 Q 12 82 20 70 Q 24 62 26 56 Z" fill="url(#oceanHeadGrad)" stroke="#22d3ee" strokeWidth="1" />
            <path d="M 78 55 Q 90 65 94 78 Q 88 82 80 70 Q 76 62 74 56 Z" fill="url(#oceanHeadGrad)" stroke="#22d3ee" strokeWidth="1" />
            <path d="M 16 45 Q 4 52 2 64 Q 8 66 16 58 Z" fill="url(#oceanHeadGrad)" stroke="#0891b2" strokeWidth="1" />
            <path d="M 84 45 Q 96 52 98 64 Q 92 66 84 58 Z" fill="url(#oceanHeadGrad)" stroke="#0891b2" strokeWidth="1" />
            <circle cx="10" cy="72" r="1.5" fill="#67e8f9" />
            <circle cx="90" cy="72" r="1.5" fill="#67e8f9" />

            {/* Angler Lure Antenna Stem & Bulb */}
            <path d="M 50 25 Q 50 12 36 10 Q 32 10 34 16" fill="none" stroke="#22d3ee" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="34" cy="16" r="5" fill="url(#oceanLureGlow)" />
            <circle cx="34" cy="16" r="2.5" fill="#ffffff" className="animate-pulse" />

            {/* Sea Creature Oval Skull */}
            <ellipse cx="50" cy="50" rx="32" ry="28" fill="url(#oceanHeadGrad)" stroke="#22d3ee" strokeWidth="2" />

            {/* Sonar Visor Glass */}
            <ellipse cx="50" cy="48" rx="22" ry="13" fill="#042f2e" stroke="#0d9488" strokeWidth="1.5" />
            <ellipse cx="50" cy="48" rx="20" ry="11" fill="url(#oceanVisorGrad)" fillOpacity="0.25" />

            {/* Sonar Optic Eyes */}
            <g filter="url(#oceanGlow)">
              <circle cx="38" cy="48" r="6" fill="#22d3ee" />
              <circle cx="62" cy="48" r="6" fill="#22d3ee" />
              <circle cx="38" cy="48" r="3" fill="#ffffff" />
              <circle cx="62" cy="48" r="3" fill="#ffffff" />
              <circle cx="38" cy="48" r="1.2" fill="#042f2e" />
              <circle cx="62" cy="48" r="1.2" fill="#042f2e" />
            </g>

            {/* Gill Slits Mouth */}
            <line x1="42" y1="66" x2="58" y2="66" stroke="#22d3ee" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="44" y1="70" x2="56" y2="70" stroke="#0891b2" strokeWidth="1" strokeLinecap="round" />
          </svg>
        </div>
      );
    case 'forest':
      return (
        <div className={`relative flex items-center justify-center filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)] ${className}`}>
          <svg className="w-full h-full p-0.5" viewBox="0 0 100 100" fill="none">
            <defs>
              <linearGradient id="forestBarkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="35%" stopColor="#059669" />
                <stop offset="75%" stopColor="#065f46" />
                <stop offset="100%" stopColor="#022c22" />
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
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Mossy Nature Halo */}
            <circle cx="50" cy="52" r="42" fill="#10b981" fillOpacity="0.18" className="animate-pulse" />
            <ellipse cx="50" cy="90" rx="30" ry="6" fill="#000000" fillOpacity="0.5" />

            {/* Branch Antlers */}
            <path d="M 36 28 C 30 18 20 14 14 10 C 18 18 24 22 30 28" fill="url(#forestBarkGrad)" stroke="#34d399" strokeWidth="1.5" />
            <path d="M 64 28 C 70 18 80 14 86 10 C 82 18 76 22 70 28" fill="url(#forestBarkGrad)" stroke="#34d399" strokeWidth="1.5" />
            <path d="M 28 20 Q 22 14 18 16 Q 22 22 28 24" fill="url(#forestBarkGrad)" stroke="#10b981" strokeWidth="1" />
            <path d="M 72 20 Q 78 14 82 16 Q 78 22 72 24" fill="url(#forestBarkGrad)" stroke="#10b981" strokeWidth="1" />

            {/* Antler Leaf Buds */}
            <path d="M 14 10 Q 10 4 14 2 Q 18 4 14 10 Z" fill="#34d399" filter="url(#emeraldGlow)" />
            <path d="M 86 10 Q 82 4 86 2 Q 90 4 86 10 Z" fill="#34d399" filter="url(#emeraldGlow)" />

            {/* Organic Bark Shield Skull */}
            <path d="M 22 32 C 32 24 68 24 78 32 C 86 46 82 72 50 84 C 18 72 14 46 22 32 Z" fill="url(#forestBarkGrad)" stroke="#34d399" strokeWidth="2" />

            {/* Leaf Visor Plate */}
            <path d="M 28 42 Q 50 36 72 42 Q 76 56 50 64 Q 24 56 28 42 Z" fill="#022c22" stroke="#059669" strokeWidth="1.5" />
            <path d="M 30 43 Q 50 38 70 43 Q 74 54 50 62 Q 26 54 30 43 Z" fill="url(#forestVisorGrad)" fillOpacity="0.3" />

            {/* Glowing Woodland Eyes */}
            <g filter="url(#emeraldGlow)">
              <polygon points="36,46 44,50 36,54 32,50" fill="#6ee7b7" />
              <polygon points="64,46 68,50 64,54 56,50" fill="#6ee7b7" />
              <circle cx="38" cy="50" r="2" fill="#ffffff" />
              <circle cx="62" cy="50" r="2" fill="#ffffff" />
            </g>

            {/* Vine Mouth Line */}
            <path d="M 40 70 Q 50 74 60 70" fill="none" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
      );
    case 'winter':
      return (
        <div className={`relative flex items-center justify-center filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)] ${className}`}>
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

            {/* Frost Aura */}
            <circle cx="50" cy="52" r="42" fill="#38bdf8" fillOpacity="0.18" className="animate-pulse" />
            <ellipse cx="50" cy="90" rx="30" ry="6" fill="#000000" fillOpacity="0.5" />

            {/* Jagged Icicle Horns */}
            <polygon points="34,26 40,26 30,4" fill="url(#frostHeadGrad)" stroke="#bae6fd" strokeWidth="1.5" />
            <polygon points="60,26 66,26 70,4" fill="url(#frostHeadGrad)" stroke="#bae6fd" strokeWidth="1.5" />
            <polygon points="46,24 54,24 50,8" fill="url(#frostHeadGrad)" stroke="#ffffff" strokeWidth="1" />

            {/* Icicle Tips Glow */}
            <circle cx="30" cy="4" r="2.5" fill="#ffffff" filter="url(#skyGlow)" />
            <circle cx="70" cy="4" r="2.5" fill="#ffffff" filter="url(#skyGlow)" />
            <circle cx="50" cy="8" r="3" fill="#ffffff" className="animate-pulse" />

            {/* Crystalline Diamond Head Chassis */}
            <polygon points="50,22 84,36 78,76 50,86 22,76 16,36" fill="url(#frostHeadGrad)" stroke="#38bdf8" strokeWidth="2" />
            <polygon points="50,24 80,37 75,73 50,82 25,73 20,37" fill="none" stroke="url(#frostBevelGrad)" strokeWidth="1.5" />

            {/* Frost Visor Plate */}
            <polygon points="28,40 72,40 68,62 32,62" fill="#03283e" stroke="#0284c7" strokeWidth="2" />
            <polygon points="30,41 70,41 66,61 34,61" fill="url(#frostVisorGrad)" fillOpacity="0.3" />

            {/* Snowflake Pupil Eyes */}
            <g filter="url(#skyGlow)">
              <rect x="33" y="45" width="14" height="12" rx="4" fill="#7dd3fc" />
              <rect x="53" y="45" width="14" height="12" rx="4" fill="#7dd3fc" />
              <circle cx="40" cy="51" r="3" fill="#ffffff" />
              <circle cx="60" cy="51" r="3" fill="#ffffff" />
            </g>

            {/* Frost Vent Mouth */}
            <rect x="36" y="69" width="28" height="7" rx="3.5" fill="#03283e" stroke="#38bdf8" strokeWidth="1" />
            <line x1="42" y1="72.5" x2="58" y2="72.5" stroke="#7dd3fc" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2" />
          </svg>
        </div>
      );
    case 'desert':
      return (
        <div className={`relative flex items-center justify-center filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)] ${className}`}>
          <svg className="w-full h-full p-0.5" viewBox="0 0 100 100" fill="none">
            <defs>
              <linearGradient id="desertGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="40%" stopColor="#d97706" />
                <stop offset="80%" stopColor="#78350f" />
                <stop offset="100%" stopColor="#451a03" />
              </linearGradient>
              <linearGradient id="desertNemesGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#1e3a8a" />
                <stop offset="30%" stopColor="#fbbf24" />
                <stop offset="70%" stopColor="#1e3a8a" />
                <stop offset="100%" stopColor="#fbbf24" />
              </linearGradient>
              <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="50%" stopColor="#fef08a" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
              </radialGradient>
              <filter id="amberGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Sun Aura */}
            <circle cx="50" cy="52" r="42" fill="#f59e0b" fillOpacity="0.18" className="animate-pulse" />
            <ellipse cx="50" cy="90" rx="30" ry="6" fill="#000000" fillOpacity="0.5" />

            {/* Cobra Hood Side Wings */}
            <path d="M 24 38 Q 6 42 10 68 Q 20 62 26 52 Z" fill="url(#desertGoldGrad)" stroke="#fef08a" strokeWidth="1" />
            <path d="M 76 38 Q 94 42 90 68 Q 80 62 74 52 Z" fill="url(#desertGoldGrad)" stroke="#fef08a" strokeWidth="1" />

            {/* Sunburst Crown Antenna */}
            <circle cx="50" cy="11" r="7" fill="url(#sunGlow)" />
            <circle cx="50" cy="11" r="4" fill="#fef08a" />
            <line x1="50" y1="2" x2="50" y2="5" stroke="#fbbf24" strokeWidth="1.5" />
            <line x1="41" y1="11" x2="44" y2="11" stroke="#fbbf24" strokeWidth="1.5" />
            <line x1="56" y1="11" x2="59" y2="11" stroke="#fbbf24" strokeWidth="1.5" />
            <line x1="44" y1="5" x2="46" y2="7" stroke="#fbbf24" strokeWidth="1.5" />
            <line x1="56" y1="5" x2="54" y2="7" stroke="#fbbf24" strokeWidth="1.5" />

            {/* Pharaoh Nemes Headpiece */}
            <path d="M 22 30 Q 50 18 78 30 L 82 62 Q 50 86 18 62 Z" fill="url(#desertGoldGrad)" stroke="#fbbf24" strokeWidth="2" />
            <path d="M 26 30 Q 50 22 74 30 L 76 56 Q 50 76 24 56 Z" fill="url(#desertNemesGrad)" fillOpacity="0.4" />

            {/* Scarab Core Solar Visor */}
            <rect x="25" y="38" width="50" height="22" rx="8" fill="#451a03" stroke="#d97706" strokeWidth="1.5" />
            <g filter="url(#amberGlow)">
              <polygon points="34,44 44,49 34,54" fill="#fef08a" />
              <polygon points="66,44 56,49 66,54" fill="#fef08a" />
              <circle cx="50" cy="49" r="4.5" fill="#fbbf24" />
              <circle cx="50" cy="49" r="2" fill="#ffffff" />
            </g>

            {/* Golden Chin Guard */}
            <rect x="42" y="68" width="16" height="12" rx="3" fill="url(#desertGoldGrad)" stroke="#fbbf24" strokeWidth="1" />
            <line x1="45" y1="71" x2="55" y2="71" stroke="#fef08a" strokeWidth="1" />
            <line x1="45" y1="75" x2="55" y2="75" stroke="#fef08a" strokeWidth="1" />
          </svg>
        </div>
      );
    case 'space':
      return (
        <div className={`relative flex items-center justify-center filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)] ${className}`}>
          <svg className="w-full h-full p-0.5" viewBox="0 0 100 100" fill="none">
            <defs>
              <linearGradient id="spaceAlienGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="40%" stopColor="#4f46e5" />
                <stop offset="80%" stopColor="#312e81" />
                <stop offset="100%" stopColor="#1e1b4b" />
              </linearGradient>
              <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#c084fc" />
                <stop offset="50%" stopColor="#818cf8" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#38bdf8" />
              </linearGradient>
              <radialGradient id="starlightGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="50%" stopColor="#a5b4fc" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
              </radialGradient>
              <filter id="cosmicGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Cosmic Halo */}
            <circle cx="50" cy="52" r="42" fill="#6366f1" fillOpacity="0.18" className="animate-pulse" />
            <ellipse cx="50" cy="90" rx="30" ry="6" fill="#000000" fillOpacity="0.5" />

            {/* Satellite Thruster Ears */}
            <rect x="8" y="44" width="8" height="16" rx="3" fill="url(#spaceAlienGrad)" stroke="#a5b4fc" strokeWidth="1" />
            <rect x="84" y="44" width="8" height="16" rx="3" fill="url(#spaceAlienGrad)" stroke="#a5b4fc" strokeWidth="1" />
            <circle cx="12" cy="52" r="2" fill="#818cf8" className="animate-pulse" />
            <circle cx="88" cy="52" r="2" fill="#818cf8" className="animate-pulse" />

            {/* Back Planetary Ring */}
            <ellipse cx="50" cy="50" rx="44" ry="12" fill="none" stroke="url(#ringGrad)" strokeWidth="3" strokeDasharray="30 10" transform="rotate(-15 50 50)" />

            {/* Alien Head Oval Skull */}
            <ellipse cx="50" cy="48" rx="28" ry="32" fill="url(#spaceAlienGrad)" stroke="#818cf8" strokeWidth="2" />

            {/* Front Planetary Ring Overlay */}
            <path d="M 12 58 A 44 12 0 0 0 88 42" fill="none" stroke="url(#ringGrad)" strokeWidth="3" transform="rotate(-15 50 50)" />

            {/* Triple Star Optic Visor */}
            <ellipse cx="50" cy="46" rx="20" ry="14" fill="#0f172a" stroke="#4f46e5" strokeWidth="1.5" />

            <g filter="url(#cosmicGlow)">
              {/* Central Eye */}
              <circle cx="50" cy="42" r="4.5" fill="#a5b4fc" />
              <circle cx="50" cy="42" r="2" fill="#ffffff" />
              {/* Left Eye */}
              <circle cx="38" cy="50" r="4" fill="#818cf8" />
              <circle cx="38" cy="50" r="1.8" fill="#ffffff" />
              {/* Right Eye */}
              <circle cx="62" cy="50" r="4" fill="#818cf8" />
              <circle cx="62" cy="50" r="1.8" fill="#ffffff" />
            </g>

            {/* Starlight Forehead Gem */}
            <polygon points="50,22 53,26 50,30 47,26" fill="#ffffff" filter="url(#cosmicGlow)" />
          </svg>
        </div>
      );
    case 'candy':
      return (
        <div className={`relative flex items-center justify-center filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)] ${className}`}>
          <svg className="w-full h-full p-0.5" viewBox="0 0 100 100" fill="none">
            <defs>
              <linearGradient id="sugarHeadGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ec4899" />
                <stop offset="40%" stopColor="#db2777" />
                <stop offset="80%" stopColor="#9d174d" />
                <stop offset="100%" stopColor="#831843" />
              </linearGradient>
              <radialGradient id="lollipopSwirl" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="40%" stopColor="#f472b6" />
                <stop offset="80%" stopColor="#db2777" />
                <stop offset="100%" stopColor="#9d174d" />
              </radialGradient>
              <filter id="pinkGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Sugar Aura */}
            <circle cx="50" cy="52" r="42" fill="#ec4899" fillOpacity="0.18" className="animate-pulse" />
            <ellipse cx="50" cy="90" rx="30" ry="6" fill="#000000" fillOpacity="0.5" />

            {/* Swirl Lollipop Antenna */}
            <rect x="48" y="10" width="4" height="16" fill="#ffffff" rx="1" />
            <circle cx="50" cy="10" r="8" fill="url(#lollipopSwirl)" stroke="#fbcfe8" strokeWidth="1" />
            <path d="M 50 4 Q 54 8 50 12 Q 46 16 50 18" fill="none" stroke="#ffffff" strokeWidth="1.2" />

            {/* Gummy Bear Ears */}
            <circle cx="24" cy="30" r="11" fill="url(#sugarHeadGrad)" stroke="#f472b6" strokeWidth="1.5" />
            <circle cx="76" cy="30" r="11" fill="url(#sugarHeadGrad)" stroke="#f472b6" strokeWidth="1.5" />
            <circle cx="24" cy="30" r="6" fill="#fbcfe8" fillOpacity="0.6" />
            <circle cx="76" cy="30" r="6" fill="#fbcfe8" fillOpacity="0.6" />

            {/* Gummy Bear Head Silhouette */}
            <circle cx="50" cy="52" r="30" fill="url(#sugarHeadGrad)" stroke="#f472b6" strokeWidth="2" />

            {/* Wrapped Candy Side Bolts */}
            <polygon points="12,52 20,46 20,58" fill="#f472b6" />
            <polygon points="88,52 80,46 80,58" fill="#f472b6" />

            {/* Sugar Drop Visor */}
            <rect x="27" y="42" width="46" height="20" rx="9" fill="#500724" stroke="#db2777" strokeWidth="1.5" />

            {/* Glowing Candy Drop Eyes */}
            <g filter="url(#pinkGlow)">
              <circle cx="38" cy="52" r="5" fill="#fbcfe8" />
              <circle cx="62" cy="52" r="5" fill="#fbcfe8" />
              <circle cx="38" cy="52" r="2.5" fill="#ffffff" />
              <circle cx="62" cy="52" r="2.5" fill="#ffffff" />
            </g>

            {/* Sprinkle Accents */}
            <rect x="34" y="38" width="5" height="2" rx="1" fill="#fef08a" transform="rotate(20 34 38)" />
            <rect x="62" y="38" width="5" height="2" rx="1" fill="#6ee7b7" transform="rotate(-20 62 38)" />
          </svg>
        </div>
      );
    case 'retro':
      return (
        <div className={`relative flex items-center justify-center filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)] ${className}`}>
          <svg className="w-full h-full p-0.5" viewBox="0 0 100 100" fill="none">
            <defs>
              <linearGradient id="arcadeHeroGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="30%" stopColor="#4f46e5" />
                <stop offset="70%" stopColor="#312e81" />
                <stop offset="100%" stopColor="#1e1b4b" />
              </linearGradient>
              <linearGradient id="arcadeGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#b45309" />
              </linearGradient>
              <linearGradient id="arcadeVisorGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0891b2" />
                <stop offset="50%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#67e8f9" />
              </linearGradient>
              <filter id="arcadeHeroGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Pixel Hero Pulse Halo */}
            <circle cx="50" cy="52" r="42" fill="#6366f1" fillOpacity="0.18" className="animate-pulse" />
            <ellipse cx="50" cy="90" rx="30" ry="6" fill="#000000" fillOpacity="0.5" />

            {/* Golden Hero Wings on Helmet */}
            <polygon points="26,24 14,14 20,28" fill="url(#arcadeGoldGrad)" stroke="#fef08a" strokeWidth="1" />
            <polygon points="74,24 86,14 80,28" fill="url(#arcadeGoldGrad)" stroke="#fef08a" strokeWidth="1" />

            {/* Heroic Stepped Pixel Crown Fin */}
            <polygon points="50,4 56,16 54,26 46,26 44,16" fill="url(#arcadeGoldGrad)" stroke="#fef08a" strokeWidth="1" />
            <rect x="48" y="8" width="4" height="4" fill="#ffffff" className="animate-pulse" />

            {/* Left Ear Guard: Red & Blue Arcade Push-Buttons */}
            <rect x="8" y="42" width="10" height="22" rx="3" fill="#1e1b4b" stroke="#6366f1" strokeWidth="1.5" />
            <circle cx="13" cy="48" r="3" fill="#ef4444" stroke="#fca5a5" strokeWidth="0.8" />
            <circle cx="13" cy="58" r="3" fill="#3b82f6" stroke="#93c5fd" strokeWidth="0.8" />

            {/* Right Ear Guard: Arcade Joystick Control */}
            <rect x="82" y="42" width="10" height="22" rx="3" fill="#1e1b4b" stroke="#6366f1" strokeWidth="1.5" />
            <line x1="87" y1="50" x2="87" y2="57" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
            <circle cx="87" cy="48" r="3.5" fill="#e11d48" stroke="#fecdd3" strokeWidth="0.8" />

            {/* Arcade Knight Helmet Chassis */}
            <polygon points="20,26 80,26 84,62 50,84 16,62" fill="url(#arcadeHeroGrad)" stroke="#818cf8" strokeWidth="2" />
            <polygon points="23,28 77,28 80,60 50,80 20,60" fill="none" stroke="#c7d2fe" strokeWidth="1.2" strokeOpacity="0.4" />

            {/* CRT Power Visor Plate */}
            <polygon points="25,38 75,38 71,58 50,64 29,58" fill="#030712" stroke="#38bdf8" strokeWidth="1.5" />
            <polygon points="26,39 74,39 70,57 50,63 30,57" fill="url(#arcadeVisorGrad)" fillOpacity="0.25" />

            {/* CRT Scanline Raster Lines */}
            <line x1="27" y1="44" x2="73" y2="44" stroke="#38bdf8" strokeWidth="0.8" strokeOpacity="0.35" />
            <line x1="28" y1="50" x2="72" y2="50" stroke="#38bdf8" strokeWidth="0.8" strokeOpacity="0.35" />
            <line x1="30" y1="56" x2="70" y2="56" stroke="#38bdf8" strokeWidth="0.8" strokeOpacity="0.35" />

            {/* Determined Heroic Brows */}
            <polygon points="31,43 45,45 45,43 31,41" fill="#fef08a" />
            <polygon points="69,43 55,45 55,43 69,41" fill="#fef08a" />

            {/* Glowing 8-Bit Hero Eyes */}
            <g filter="url(#arcadeHeroGlow)">
              <polygon points="33,45 44,45 42,53 35,53" fill="#22d3ee" />
              <polygon points="67,45 56,45 58,53 65,53" fill="#22d3ee" />
              <circle cx="38" cy="48" r="1.8" fill="#ffffff" />
              <circle cx="62" cy="48" r="1.8" fill="#ffffff" />
            </g>

            {/* Golden 1UP Power Chevron */}
            <polygon points="46,70 50,66 54,70 50,73" fill="url(#arcadeGoldGrad)" stroke="#fef08a" strokeWidth="0.8" />

            {/* Hero Chin Speaker Vent */}
            <line x1="42" y1="76" x2="58" y2="76" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
      );
    case 'spooky':
      return (
        <div className={`relative flex items-center justify-center filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)] ${className}`}>
          <svg className="w-full h-full p-0.5" viewBox="0 0 100 100" fill="none">
            <defs>
              <linearGradient id="spookyPumpkinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f97316" />
                <stop offset="40%" stopColor="#ea580c" />
                <stop offset="80%" stopColor="#9a3412" />
                <stop offset="100%" stopColor="#431407" />
              </linearGradient>
              <radialGradient id="jackGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="50%" stopColor="#f97316" />
                <stop offset="100%" stopColor="#ea580c" stopOpacity="0" />
              </radialGradient>
              <filter id="pumpkinGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Eerie Ghost Aura */}
            <circle cx="50" cy="52" r="42" fill="#ea580c" fillOpacity="0.2" className="animate-pulse" />
            <ellipse cx="50" cy="90" rx="30" ry="6" fill="#000000" fillOpacity="0.5" />

            {/* Bat Wing Side Ears */}
            <path d="M 20 40 Q 6 30 2 44 Q 10 48 14 56 Z" fill="#431407" stroke="#f97316" strokeWidth="1" />
            <path d="M 80 40 Q 94 30 98 44 Q 90 48 86 56 Z" fill="#431407" stroke="#f97316" strokeWidth="1" />

            {/* Twisted Vine Stem Antenna */}
            <path d="M 50 24 Q 52 14 44 10 Q 40 8 46 6" fill="none" stroke="#84cc16" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 44 10 Q 38 4 42 2" fill="none" stroke="#65a30d" strokeWidth="1.5" />

            {/* Pumpkin Head Silhouette */}
            <ellipse cx="50" cy="52" rx="32" ry="28" fill="url(#spookyPumpkinGrad)" stroke="#fb923c" strokeWidth="2" />
            {/* Rib lines */}
            <path d="M 36 26 A 28 28 0 0 0 36 78" fill="none" stroke="#9a3412" strokeWidth="1.2" />
            <path d="M 64 26 A 28 28 0 0 1 64 78" fill="none" stroke="#9a3412" strokeWidth="1.2" />

            {/* Carved Jack-o-Lantern Visor & Eyes */}
            <g filter="url(#pumpkinGlow)">
              {/* Triangular Eye Sockets */}
              <polygon points="32,42 42,42 37,52" fill="#fef08a" />
              <polygon points="68,42 58,42 63,52" fill="#fef08a" />

              {/* Jagged Smile Mouth */}
              <polygon points="32,62 38,66 44,62 50,68 56,62 62,66 68,62 64,72 50,76 36,72" fill="#fef08a" />
            </g>
          </svg>
        </div>
      );
    case 'volcanic':
      return (
        <div className={`relative flex items-center justify-center filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)] ${className}`}>
          <svg className="w-full h-full p-0.5" viewBox="0 0 100 100" fill="none">
            <defs>
              <linearGradient id="volcanicLavaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#dc2626" />
                <stop offset="40%" stopColor="#991b1b" />
                <stop offset="80%" stopColor="#450a0a" />
                <stop offset="100%" stopColor="#18181b" />
              </linearGradient>
              <radialGradient id="magmaGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="50%" stopColor="#ef4444" />
                <stop offset="100%" stopColor="#991b1b" stopOpacity="0" />
              </radialGradient>
              <filter id="lavaGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Fiery Ember Aura */}
            <circle cx="50" cy="52" r="42" fill="#ef4444" fillOpacity="0.2" className="animate-pulse" />
            <ellipse cx="50" cy="90" rx="30" ry="6" fill="#000000" fillOpacity="0.5" />

            {/* Sweeping Dragon Lava Horns */}
            <path d="M 28 28 C 18 18 10 10 4 4 C 12 12 20 22 26 32 Z" fill="url(#volcanicLavaGrad)" stroke="#f87171" strokeWidth="1.5" />
            <path d="M 72 28 C 82 18 90 10 96 4 C 88 12 80 22 74 32 Z" fill="url(#volcanicLavaGrad)" stroke="#f87171" strokeWidth="1.5" />

            {/* Volcanic Exhaust Vents */}
            <rect x="12" y="44" width="8" height="16" rx="2" fill="#18181b" stroke="#ef4444" strokeWidth="1" />
            <rect x="80" y="44" width="8" height="16" rx="2" fill="#18181b" stroke="#ef4444" strokeWidth="1" />
            <line x1="14" y1="48" x2="18" y2="48" stroke="#fef08a" strokeWidth="1" />
            <line x1="82" y1="48" x2="86" y2="48" stroke="#fef08a" strokeWidth="1" />

            {/* Obsidian Rock Head Chassis */}
            <polygon points="50,22 80,34 76,74 50,86 24,74 20,34" fill="url(#volcanicLavaGrad)" stroke="#ef4444" strokeWidth="2" />

            {/* Molten Core Visor Plate */}
            <polygon points="28,40 72,40 66,62 34,62" fill="#18181b" stroke="#dc2626" strokeWidth="1.5" />

            {/* Glowing Fiery Ember Eyes */}
            <g filter="url(#lavaGlow)">
              <polygon points="32,44 44,48 32,54" fill="#fef08a" />
              <polygon points="68,44 56,48 68,54" fill="#fef08a" />
              <circle cx="38" cy="48" r="2.5" fill="#dc2626" />
              <circle cx="62" cy="48" r="2.5" fill="#dc2626" />
            </g>

            {/* Lava Fissure Mouth */}
            <path d="M 38 68 L 44 72 L 50 68 L 56 72 L 62 68" fill="none" stroke="#fef08a" strokeWidth="1.5" filter="url(#lavaGlow)" />
          </svg>
        </div>
      );
    case 'vantage':
      return (
        <div className={`relative flex items-center justify-center filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)] ${className}`}>
          <svg className="w-full h-full p-0.5" viewBox="0 0 100 100" fill="none">
            <defs>
              <linearGradient id="vantageGraniteGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="40%" stopColor="#b45309" />
                <stop offset="80%" stopColor="#78350f" />
                <stop offset="100%" stopColor="#1c1917" />
              </linearGradient>
              <linearGradient id="amberVisorGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="50%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#fef08a" />
              </linearGradient>
              <filter id="amberPeakGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Sunset Peak Aura */}
            <circle cx="50" cy="52" r="42" fill="#f59e0b" fillOpacity="0.18" className="animate-pulse" />
            <ellipse cx="50" cy="90" rx="30" ry="6" fill="#000000" fillOpacity="0.5" />

            {/* Spiraled Alpine Ram Horns */}
            <path d="M 28 32 Q 10 24 8 40 Q 8 54 20 50 Z" fill="url(#vantageGraniteGrad)" stroke="#fbbf24" strokeWidth="1.5" />
            <path d="M 72 32 Q 90 24 92 40 Q 92 54 80 50 Z" fill="url(#vantageGraniteGrad)" stroke="#fbbf24" strokeWidth="1.5" />

            {/* Mountain Crest Antenna */}
            <polygon points="50,6 44,22 56,22" fill="url(#vantageGraniteGrad)" stroke="#f59e0b" strokeWidth="1" />
            <polygon points="50,10 47,20 53,20" fill="#fef08a" filter="url(#amberPeakGlow)" />

            {/* Granite Head Chassis */}
            <path d="M 26 26 L 74 26 L 78 64 L 50 82 L 22 64 Z" fill="url(#vantageGraniteGrad)" stroke="#fbbf24" strokeWidth="2" />

            {/* Compass Rose Visor Plate */}
            <rect x="28" y="36" width="44" height="22" rx="6" fill="#1c1917" stroke="#b45309" strokeWidth="1.5" />

            {/* Compass Optic Eyes */}
            <g filter="url(#amberPeakGlow)">
              <circle cx="38" cy="47" r="5" fill="#fbbf24" />
              <circle cx="62" cy="47" r="5" fill="#fbbf24" />
              <circle cx="38" cy="47" r="2" fill="#ffffff" />
              <circle cx="62" cy="47" r="2" fill="#ffffff" />
              {/* Crosshair compass lines */}
              <line x1="38" y1="40" x2="38" y2="54" stroke="#78350f" strokeWidth="1" />
              <line x1="62" y1="40" x2="62" y2="54" stroke="#78350f" strokeWidth="1" />
            </g>

            {/* Alpine Grille Mouth */}
            <line x1="40" y1="68" x2="60" y2="68" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
      );
    case 'papercraft':
      return (
        <div className={`relative flex items-center justify-center filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)] ${className}`}>
          <svg className="w-full h-full p-0.5" viewBox="0 0 100 100" fill="none">
            <defs>
              <linearGradient id="origamiFoxGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="40%" stopColor="#d97706" />
                <stop offset="80%" stopColor="#78350f" />
                <stop offset="100%" stopColor="#292524" />
              </linearGradient>
              <filter id="warmPaperGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Cardstock Glow */}
            <circle cx="50" cy="52" r="42" fill="#f59e0b" fillOpacity="0.18" className="animate-pulse" />
            <ellipse cx="50" cy="90" rx="30" ry="6" fill="#000000" fillOpacity="0.5" />

            {/* Folded Paper Plane Antenna Stem */}
            <polygon points="50,6 42,22 58,22" fill="#fef3c7" stroke="#d97706" strokeWidth="1" />
            <line x1="50" y1="6" x2="50" y2="22" stroke="#b45309" strokeWidth="1" />

            {/* Triangular Origami Fox Ears */}
            <polygon points="20,34 10,8 36,24" fill="url(#origamiFoxGrad)" stroke="#f59e0b" strokeWidth="1.5" />
            <polygon points="80,34 90,8 64,24" fill="url(#origamiFoxGrad)" stroke="#f59e0b" strokeWidth="1.5" />
            <polygon points="20,34 14,14 32,24" fill="#fef3c7" fillOpacity="0.4" />
            <polygon points="80,34 86,14 68,24" fill="#fef3c7" fillOpacity="0.4" />

            {/* Faceted Folded Paper Fox Head */}
            <polygon points="50,24 82,38 50,84 18,38" fill="url(#origamiFoxGrad)" stroke="#f59e0b" strokeWidth="2" />
            {/* Center Fold Crease */}
            <line x1="50" y1="24" x2="50" y2="84" stroke="#fef3c7" strokeWidth="1.2" strokeDasharray="3 2" />

            {/* Stitched Visor Cutout */}
            <polygon points="28,40 72,40 64,58 36,58" fill="#292524" stroke="#b45309" strokeWidth="1.5" />

            {/* Warm Paper-Glow Eyes */}
            <g filter="url(#warmPaperGlow)">
              <rect x="33" y="44" width="12" height="10" rx="3" fill="#fef3c7" />
              <rect x="55" y="44" width="12" height="10" rx="3" fill="#fef3c7" />
              <circle cx="39" cy="49" r="2.5" fill="#78350f" />
              <circle cx="61" cy="49" r="2.5" fill="#78350f" />
            </g>

            {/* Paper Tape Nose & Mouth */}
            <polygon points="46,70 54,70 50,76" fill="#78350f" />
          </svg>
        </div>
      );
    case 'steampunk':
      return (
        <div className={`relative flex items-center justify-center filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)] ${className}`}>
          <svg className="w-full h-full p-0.5" viewBox="0 0 100 100" fill="none">
            <defs>
              <linearGradient id="brassHeadGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="35%" stopColor="#d97706" />
                <stop offset="70%" stopColor="#78350f" />
                <stop offset="100%" stopColor="#291e14" />
              </linearGradient>
              <linearGradient id="copperPipeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#fb923c" />
                <stop offset="50%" stopColor="#ea580c" />
                <stop offset="100%" stopColor="#9a3412" />
              </linearGradient>
              <filter id="amberSteamGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Amber Steam Aura */}
            <circle cx="50" cy="52" r="42" fill="#d97706" fillOpacity="0.18" className="animate-pulse" />
            <ellipse cx="50" cy="90" rx="30" ry="6" fill="#000000" fillOpacity="0.5" />

            {/* Brass Chimney Exhaust */}
            <rect x="44" y="8" width="12" height="16" rx="2" fill="url(#copperPipeGrad)" stroke="#d97706" strokeWidth="1" />
            <ellipse cx="50" cy="8" rx="7" ry="2.5" fill="#f59e0b" stroke="#78350f" strokeWidth="1" />
            <circle cx="50" cy="4" r="3" fill="#fef3c7" fillOpacity="0.5" className="animate-pulse" />

            {/* Spinning Cog Ears */}
            <g transform="translate(6, 42)">
              <circle cx="8" cy="10" r="7" fill="url(#brassHeadGrad)" stroke="#f59e0b" strokeWidth="1.2" />
              <circle cx="8" cy="10" r="2.5" fill="#291e14" />
              <line x1="8" y1="1" x2="8" y2="19" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
              <line x1="0" y1="10" x2="16" y2="10" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
              <line x1="2.5" y1="4.5" x2="13.5" y2="15.5" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
              <line x1="2.5" y1="15.5" x2="13.5" y2="4.5" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
            </g>
            <g transform="translate(74, 42)">
              <circle cx="8" cy="10" r="7" fill="url(#brassHeadGrad)" stroke="#f59e0b" strokeWidth="1.2" />
              <circle cx="8" cy="10" r="2.5" fill="#291e14" />
              <line x1="8" y1="1" x2="8" y2="19" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
              <line x1="0" y1="10" x2="16" y2="10" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
              <line x1="2.5" y1="4.5" x2="13.5" y2="15.5" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
              <line x1="2.5" y1="15.5" x2="13.5" y2="4.5" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
            </g>

            {/* Riveted Brass Head Chassis */}
            <rect x="20" y="24" width="60" height="58" rx="14" fill="url(#brassHeadGrad)" stroke="#f59e0b" strokeWidth="2" />
            <circle cx="26" cy="30" r="1.5" fill="#fef3c7" stroke="#78350f" strokeWidth="0.8" />
            <circle cx="74" cy="30" r="1.5" fill="#fef3c7" stroke="#78350f" strokeWidth="0.8" />
            <circle cx="26" cy="76" r="1.5" fill="#fef3c7" stroke="#78350f" strokeWidth="0.8" />
            <circle cx="74" cy="76" r="1.5" fill="#fef3c7" stroke="#78350f" strokeWidth="0.8" />

            {/* Pressure Gauge Visor Housing */}
            <rect x="25" y="38" width="50" height="24" rx="12" fill="#1c140c" stroke="#d97706" strokeWidth="1.5" />

            {/* Left Gauge: Steam Pressure Meter */}
            <g filter="url(#amberSteamGlow)">
              <circle cx="38" cy="50" r="8" fill="#451a03" stroke="#f59e0b" strokeWidth="1.2" />
              <path d="M 33 54 A 6 6 0 1 1 43 54" fill="none" stroke="#fef08a" strokeWidth="0.8" strokeDasharray="1.2 1" />
              <line x1="38" y1="50" x2="41" y2="45" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="38" cy="50" r="1.5" fill="#fef08a" />
            </g>

            {/* Right Gauge: Clockwork Cog Indicator */}
            <g filter="url(#amberSteamGlow)">
              <circle cx="62" cy="50" r="8" fill="#451a03" stroke="#f59e0b" strokeWidth="1.2" />
              <circle cx="62" cy="50" r="5" fill="none" stroke="#fef08a" strokeWidth="1" strokeDasharray="2 1.5" />
              <circle cx="62" cy="50" r="2.5" fill="#fbbf24" />
              <circle cx="62" cy="50" r="1" fill="#ffffff" />
            </g>

            {/* Brass Grille Slit Mouth */}
            <rect x="36" y="68" width="28" height="8" rx="2" fill="#1c140c" stroke="#d97706" strokeWidth="1" />
            <line x1="41" y1="72" x2="59" y2="72" stroke="#f59e0b" strokeWidth="1.2" strokeLinecap="round" strokeDasharray="2 2" />
          </svg>
        </div>
      );
    case 'olympus':
      return (
        <div className={`relative flex items-center justify-center filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)] ${className}`}>
          <svg className="w-full h-full p-0.5" viewBox="0 0 100 100" fill="none">
            <defs>
              <linearGradient id="zeusMarbleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="40%" stopColor="#f1f5f9" />
                <stop offset="80%" stopColor="#cbd5e1" />
                <stop offset="100%" stopColor="#64748b" />
              </linearGradient>
              <linearGradient id="zeusGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="40%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#b45309" />
              </linearGradient>
              <radialGradient id="stormVisorGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="50%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
              </radialGradient>
              <filter id="lightningGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Celestial Storm Aura */}
            <circle cx="50" cy="52" r="42" fill="#38bdf8" fillOpacity="0.18" className="animate-pulse" />
            <ellipse cx="50" cy="90" rx="30" ry="6" fill="#000000" fillOpacity="0.5" />

            {/* Jagged Lightning Bolt Crest Horns */}
            <polygon points="28,26 8,6 18,18 4,24 24,34" fill="url(#zeusGoldGrad)" stroke="#fbbf24" strokeWidth="1" />
            <polygon points="72,26 92,6 82,18 96,24 76,34" fill="url(#zeusGoldGrad)" stroke="#fbbf24" strokeWidth="1" />

            {/* Golden Laurel Leaf Helm Trim */}
            <circle cx="50" cy="18" r="4" fill="url(#zeusGoldGrad)" stroke="#fbbf24" strokeWidth="1" />
            <ellipse cx="44" cy="19" rx="4" ry="2" transform="rotate(-30 44 19)" fill="#fbbf24" />
            <ellipse cx="56" cy="19" rx="4" ry="2" transform="rotate(30 56 19)" fill="#fbbf24" />

            {/* Corinthian Marble Helm Dome */}
            <path d="M 22 40 C 22 20 78 20 78 40 L 80 66 C 75 78 50 86 50 86 C 50 86 25 78 20 66 Z" fill="url(#zeusMarbleGrad)" stroke="#f59e0b" strokeWidth="2" />

            {/* Forehead Golden Sun Crest */}
            <polygon points="50,22 53,28 50,32 47,28" fill="#fef08a" filter="url(#lightningGlow)" />

            {/* Crackling Storm Visor Slot */}
            <path d="M 27 44 L 73 44 L 68 58 L 50 64 L 32 58 Z" fill="#090d16" stroke="#fbbf24" strokeWidth="1.5" />

            {/* Electric Blue Storm Eyes */}
            <g filter="url(#lightningGlow)">
              <polygon points="36,48 44,52 38,56" fill="#38bdf8" />
              <polygon points="64,48 56,52 62,56" fill="#38bdf8" />
              <circle cx="39" cy="52" r="1.5" fill="#ffffff" />
              <circle cx="61" cy="52" r="1.5" fill="#ffffff" />
              <path d="M 44 52 L 48 50 L 52 54 L 56 52" stroke="#ffffff" strokeWidth="1.2" fill="none" />
            </g>

            {/* Greek Meander / Plated Hoplite Chin Bar */}
            <rect x="42" y="70" width="16" height="8" rx="2" fill="url(#zeusGoldGrad)" stroke="#f59e0b" strokeWidth="1" />
            <line x1="45" y1="74" x2="55" y2="74" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </div>
      );
    case 'pirate':
      return (
        <div className={`relative flex items-center justify-center filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)] ${className}`}>
          <svg className="w-full h-full p-0.5" viewBox="0 0 100 100" fill="none">
            <defs>
              <linearGradient id="pirateHatGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1e293b" />
                <stop offset="50%" stopColor="#0f172a" />
                <stop offset="100%" stopColor="#020617" />
              </linearGradient>
              <linearGradient id="boneSkullGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f8fafc" />
                <stop offset="60%" stopColor="#e2e8f0" />
                <stop offset="100%" stopColor="#94a3b8" />
              </linearGradient>
              <filter id="spectralTealGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Spectral Sea Fog Aura */}
            <circle cx="50" cy="52" r="42" fill="#2dd4bf" fillOpacity="0.18" className="animate-pulse" />
            <ellipse cx="50" cy="90" rx="30" ry="6" fill="#000000" fillOpacity="0.5" />

            {/* Gold Hoop Earring */}
            <circle cx="82" cy="56" r="6" fill="none" stroke="#fbbf24" strokeWidth="2.5" />

            {/* Buccaneer Captain Tricorn / Bicorne Hat */}
            <path d="M 12 36 C 24 16 76 16 88 36 C 88 36 78 24 50 24 C 22 24 12 36 12 36 Z" fill="url(#pirateHatGrad)" stroke="#f59e0b" strokeWidth="2" />
            <path d="M 22 36 C 30 22 70 22 78 36" stroke="#f59e0b" strokeWidth="1.5" fill="none" />

            {/* Hat Skull & Crossbones Emblem */}
            <circle cx="50" cy="27" r="3.5" fill="#f8fafc" />
            <line x1="45" y1="25" x2="55" y2="29" stroke="#f8fafc" strokeWidth="1" strokeLinecap="round" />
            <line x1="45" y1="29" x2="55" y2="25" stroke="#f8fafc" strokeWidth="1" strokeLinecap="round" />

            {/* Skull Head Chassis */}
            <path d="M 24 38 C 24 28 76 28 76 38 L 76 56 C 76 68 66 74 62 76 L 62 82 L 38 82 L 38 76 C 34 74 24 68 24 56 Z" fill="url(#boneSkullGrad)" stroke="#475569" strokeWidth="2" />

            {/* Left Eye: Nautical Brass Spyglass / Monocle */}
            <circle cx="38" cy="52" r="8" fill="#1e293b" stroke="#f59e0b" strokeWidth="2" />
            <line x1="38" y1="45" x2="38" y2="59" stroke="#fbbf24" strokeWidth="1" />
            <line x1="31" y1="52" x2="45" y2="52" stroke="#fbbf24" strokeWidth="1" />
            <circle cx="38" cy="52" r="3" fill="#0284c7" />
            <circle cx="38" cy="52" r="1.2" fill="#ffffff" />

            {/* Right Eye: Glowing Spectral Teal Phantom Eye Socket */}
            <g filter="url(#spectralTealGlow)">
              <circle cx="62" cy="52" r="7" fill="#042f2e" stroke="#2dd4bf" strokeWidth="1.5" />
              <circle cx="62" cy="52" r="4.5" fill="#2dd4bf" />
              <circle cx="62" cy="52" r="2" fill="#ffffff" className="animate-pulse" />
            </g>

            {/* Inverted Triangle Nose Socket */}
            <polygon points="50,60 47,64 53,64" fill="#334155" />

            {/* Grinning Skull Teeth with Gold Tooth */}
            <rect x="40" y="72" width="20" height="8" rx="2" fill="#0f172a" stroke="#475569" strokeWidth="1" />
            <rect x="42" y="73" width="3.5" height="6" fill="#f8fafc" rx="0.5" />
            <rect x="46.5" y="73" width="3.5" height="6" fill="#fbbf24" rx="0.5" />
            <rect x="51" y="73" width="3.5" height="6" fill="#f8fafc" rx="0.5" />
            <rect x="55.5" y="73" width="3.5" height="6" fill="#f8fafc" rx="0.5" />
          </svg>
        </div>
      );
    case 'synthwave':
      return (
        <div className={`relative flex items-center justify-center filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)] ${className}`}>
          <svg className="w-full h-full p-0.5" viewBox="0 0 100 100" fill="none">
            <defs>
              <linearGradient id="synthHelmGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#2e1065" />
                <stop offset="40%" stopColor="#1e1b4b" />
                <stop offset="80%" stopColor="#0f172a" />
                <stop offset="100%" stopColor="#020617" />
              </linearGradient>
              <linearGradient id="synthSunsetVisorGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#f43f5e" />
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
              <filter id="neonPinkGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Outrun Neon Aura */}
            <circle cx="50" cy="52" r="42" fill="#f43f5e" fillOpacity="0.22" className="animate-pulse" />
            <ellipse cx="50" cy="90" rx="30" ry="6" fill="#000000" fillOpacity="0.5" />

            {/* Aerodynamic Chrome Spoiler Fin */}
            <polygon points="50,6 45,22 55,22" fill="#06b6d4" stroke="#22d3ee" strokeWidth="1" />
            <line x1="50" y1="8" x2="50" y2="22" stroke="#ffffff" strokeWidth="1.2" />

            {/* Cassette Tape Spool Ear Guards */}
            <g transform="translate(6, 42)">
              <rect x="0" y="0" width="12" height="18" rx="3" fill="#1e1b4b" stroke="#f43f5e" strokeWidth="1.5" />
              <circle cx="6" cy="9" r="4" fill="none" stroke="#06b6d4" strokeWidth="1.2" />
              <circle cx="6" cy="9" r="1.5" fill="#f43f5e" />
            </g>
            <g transform="translate(82, 42)">
              <rect x="0" y="0" width="12" height="18" rx="3" fill="#1e1b4b" stroke="#f43f5e" strokeWidth="1.5" />
              <circle cx="6" cy="9" r="4" fill="none" stroke="#06b6d4" strokeWidth="1.2" />
              <circle cx="6" cy="9" r="1.5" fill="#f43f5e" />
            </g>

            {/* Cyber Helmet Shell */}
            <path d="M 20 28 C 20 18 80 18 80 28 L 84 64 C 84 76 68 84 50 84 C 32 84 16 76 16 64 Z" fill="url(#synthHelmGrad)" stroke="#f43f5e" strokeWidth="2" />
            <line x1="26" y1="28" x2="74" y2="28" stroke="#06b6d4" strokeWidth="1" />

            {/* 80s Mirrored Sunset Aviator Visor */}
            <g filter="url(#neonPinkGlow)">
              <path d="M 22 40 L 78 40 L 74 60 C 65 65 54 62 50 58 C 46 62 35 65 26 60 Z" fill="url(#synthSunsetVisorGrad)" stroke="#ffffff" strokeWidth="1.5" />
              <line x1="26" y1="44" x2="74" y2="44" stroke="#ffffff" strokeWidth="1.5" opacity="0.8" />
              <line x1="28" y1="48" x2="72" y2="48" stroke="#ffffff" strokeWidth="0.8" opacity="0.6" />
              <line x1="30" y1="52" x2="70" y2="52" stroke="#ffffff" strokeWidth="0.6" opacity="0.4" />
            </g>

            {/* Synthwave Equalizer Mouth Grille */}
            <rect x="34" y="68" width="32" height="9" rx="2" fill="#090d16" stroke="#06b6d4" strokeWidth="1" />
            <g filter="url(#neonPinkGlow)">
              <line x1="38" y1="74" x2="38" y2="72" stroke="#f43f5e" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="42" y1="75" x2="42" y2="70" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="46" y1="75" x2="46" y2="71" stroke="#22d3ee" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="50" y1="75" x2="50" y2="69" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="54" y1="75" x2="54" y2="71" stroke="#22d3ee" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="58" y1="75" x2="58" y2="70" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="62" y1="74" x2="62" y2="72" stroke="#f43f5e" strokeWidth="1.5" strokeLinecap="round" />
            </g>
          </svg>
        </div>
      );
    case 'neon':
    default:
      return (
        <div className={`relative flex items-center justify-center filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)] ${className}`}>
          <svg className="w-full h-full p-0.5" viewBox="0 0 100 100" fill="none">
            <defs>
              <linearGradient id="neonMechaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="35%" stopColor="#0891b2" />
                <stop offset="70%" stopColor="#1e293b" />
                <stop offset="100%" stopColor="#0f172a" />
              </linearGradient>
              <linearGradient id="neonBevelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#0284c7" stopOpacity="0.1" />
              </linearGradient>
              <linearGradient id="neonVisorGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="50%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#22d3ee" />
              </linearGradient>
              <radialGradient id="antennaGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="50%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
              </radialGradient>
              <filter id="cyanGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Outer Cyan Pulse Halo */}
            <circle cx="50" cy="52" r="42" fill="#06b6d4" fillOpacity="0.18" className="animate-pulse" />
            <ellipse cx="50" cy="90" rx="30" ry="6" fill="#000000" fillOpacity="0.5" />

            {/* Twin Laser Antennas */}
            <line x1="38" y1="24" x2="32" y2="8" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
            <line x1="62" y1="24" x2="68" y2="8" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
            <circle cx="32" cy="8" r="3" fill="url(#antennaGlow)" />
            <circle cx="68" cy="8" r="3" fill="url(#antennaGlow)" />
            <circle cx="32" cy="8" r="1.5" fill="#ffffff" className="animate-pulse" />
            <circle cx="68" cy="8" r="1.5" fill="#ffffff" className="animate-pulse" />

            {/* Ear Jacks */}
            <rect x="10" y="44" width="8" height="18" rx="3" fill="url(#neonMechaGrad)" stroke="#475569" strokeWidth="1.5" />
            <rect x="82" y="44" width="8" height="18" rx="3" fill="url(#neonMechaGrad)" stroke="#475569" strokeWidth="1.5" />
            <circle cx="14" cy="53" r="2" fill="#38bdf8" />
            <circle cx="86" cy="53" r="2" fill="#38bdf8" />

            {/* Angular 3D Mecha Helmet Base */}
            <rect x="16" y="24" width="68" height="58" rx="18" fill="url(#neonMechaGrad)" stroke="#38bdf8" strokeWidth="2" />
            <rect x="18" y="26" width="64" height="54" rx="16" fill="none" stroke="url(#neonBevelGrad)" strokeWidth="2" />

            {/* Visor Glass Plate */}
            <rect x="23" y="38" width="54" height="26" rx="10" fill="#090d16" stroke="#1e293b" strokeWidth="2" />
            <rect x="24" y="39" width="52" height="24" rx="9" fill="url(#neonVisorGrad)" fillOpacity="0.25" />

            {/* Glowing Cyber Lenses */}
            <g filter="url(#cyanGlow)">
              <rect x="29" y="44" width="16" height="14" rx="5" fill="#38bdf8" />
              <rect x="55" y="44" width="16" height="14" rx="5" fill="#38bdf8" />
              <circle cx="37" cy="51" r="3.5" fill="#ffffff" />
              <circle cx="63" cy="51" r="3.5" fill="#ffffff" />
              <path d="M 27 41 L 45 41 L 39 44 L 27 44 Z" fill="#ffffff" fillOpacity="0.6" />
            </g>

            {/* Speaker Plate Mouth */}
            <rect x="36" y="69" width="28" height="7" rx="3.5" fill="#0f172a" stroke="#334155" strokeWidth="1" />
            <line x1="42" y1="72.5" x2="58" y2="72.5" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 2" />
          </svg>
        </div>
      );
  }
});
CharacterOrb.displayName = 'CharacterOrb';


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
  showTrails,
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
  showTrails?: boolean;
}) => {
  const trailsEnabled = shouldShowTrails(showTrails);

  const getSlideDuration = (distance: number): number => {
    if (distance <= 0) return 0;
    if (distance === 1) return 190;
    if (distance === 2) return 270;
    if (distance === 3) return 340;
    if (distance === 4) return 390;
    if (distance === 5) return 430;
    return 430 + (distance - 5) * 35;
  };

  const recentlyMatchedRef = useRef<Map<string, number>>(new Map());
  const blockAnimStateRef = useRef<Map<number, { lastPos: Position; targetPos: Position; startTime: number; duration: number }>>(new Map());
  const playerAnimStateRef = useRef<{ lastPos: Position; targetPos: Position; startTime: number; duration: number }>({
    lastPos: playerPos,
    targetPos: playerPos,
    startTime: 0,
    duration: 0,
  });

  const [activeTrails, setActiveTrails] = React.useState<{
    id: string;
    x: number;
    y: number;
    colorHex: string;
    createdAt: number;
    delayMs: number;
  }[]>([]);

  const processedMovesRef = useRef<{ blockMoveKeys: Map<number, string> }>({
    blockMoveKeys: new Map(),
  });

  useEffect(() => {
    if (lastAction === 'reset' || lastAction === 'load' || lastAction === 'undo' || lastAction === 'teleport') {
      recentlyMatchedRef.current.clear();
      blockAnimStateRef.current.clear();
      playerAnimStateRef.current = {
        lastPos: playerPos,
        targetPos: playerPos,
        startTime: 0,
        duration: 0,
      };
      processedMovesRef.current.blockMoveKeys.clear();
      setActiveTrails([]);
    }
  }, [lastAction, playerPos]);

  // Path calculation & activeTrails state generation hook
  useEffect(() => {
    // Skip generating trails if disabled for device/view or on reset, load, undo, teleport portal jumps
    if (!trailsEnabled || lastAction === 'reset' || lastAction === 'load' || lastAction === 'undo' || lastAction === 'teleport') {
      if (activeTrails.length > 0) setActiveTrails([]);
      return;
    }

    const newSegments: typeof activeTrails = [];
    const now = Date.now();
    const currentBaseThemeId = getBaseThemeId(activeTheme);
    const themeConf = themeConfig || DEFAULT_THEME_CONFIGS[currentBaseThemeId] || DEFAULT_THEME_CONFIGS.neon;

    // Calculate straight-line slide coordinates for moved blocks
    if (prevBlocks && prevBlocks.length === blocks.length) {
      blocks.forEach((block, idx) => {
        const prevBlock = prevBlocks[idx];
        if (prevBlock && (prevBlock.pos.x !== block.pos.x || prevBlock.pos.y !== block.pos.y)) {
          // Skip trail creation for instant teleport snaps between entry and exit portals
          if (block.noTransition) {
            return;
          }

          const moveKey = `b:${idx}:${prevBlock.pos.x},${prevBlock.pos.y}->${block.pos.x},${block.pos.y}`;
          const prevKey = processedMovesRef.current.blockMoveKeys.get(idx);

          if (prevKey !== moveKey) {
            processedMovesRef.current.blockMoveKeys.set(idx, moveKey);

            const dx = block.pos.x - prevBlock.pos.x;
            const dy = block.pos.y - prevBlock.pos.y;

            // Straight linear slide along row or column
            if ((dx === 0 || dy === 0) && (dx !== 0 || dy !== 0)) {
              const distance = Math.max(Math.abs(dx), Math.abs(dy));
              const stepX = dx === 0 ? 0 : dx > 0 ? 1 : -1;
              const stepY = dy === 0 ? 0 : dy > 0 ? 1 : -1;
              const colors = getBlockColors(themeConf, currentBaseThemeId, block.type);
              const blockColorHex = colors.colorHex || '#ef4444';
              const slideDuration = getSlideDuration(distance);

              // Store intermediate grid coordinates along slide path with accelerated staggered animation delays
              for (let step = 0; step < distance; step++) {
                const x = prevBlock.pos.x + step * stepX;
                const y = prevBlock.pos.y + step * stepY;
                const stepDelay = Math.round(Math.pow(step / distance, 0.85) * slideDuration);
                newSegments.push({
                  id: `trail-${idx}-${x}-${y}-${now}-${Math.random()}`,
                  x,
                  y,
                  colorHex: blockColorHex,
                  createdAt: now,
                  delayMs: stepDelay,
                });
              }
            }
          }
        }
      });
    }

    if (newSegments.length > 0) {
      setActiveTrails(prev => [...prev, ...newSegments]);
    }
  }, [blocks, prevBlocks, lastAction, activeTheme, themeConfig, trailsEnabled]);

  // Trail cleanup logic (clears trails after all staggered step animations complete or when player moves)
  useEffect(() => {
    if (activeTrails.length === 0) return;
    const maxDelay = Math.max(...activeTrails.map((t) => t.delayMs), 0);
    const timer = setTimeout(() => {
      setActiveTrails([]);
    }, maxDelay + 650);
    return () => clearTimeout(timer);
  }, [activeTrails]);

  const baseThemeId = getBaseThemeId(activeTheme);
  const defaultStyles = THEME_STYLES[baseThemeId] || THEME_STYLES.neon;
  const styles = {
    bgClass: activeThemeStyle?.bgGradient || defaultStyles.bgClass,
    panelClass: activeThemeStyle?.panelClass || defaultStyles.panelClass,
    cellClass: activeThemeStyle?.cellClass || defaultStyles.cellClass,
    wallClass: activeThemeStyle?.wallClass || defaultStyles.wallClass,
  };
  const config = themeConfig || DEFAULT_THEME_CONFIGS[baseThemeId] || DEFAULT_THEME_CONFIGS.neon;
  const wallSet = useMemo(() => new Set(walls.map(w => positionKey(w))), [walls]);
  const destinationMap = useMemo(() => new Map(destinations.map(d => [positionKey(d.pos), d])), [destinations]);

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
        const cellTrail = trailsEnabled ? activeTrails.find((t) => t.x === x && t.y === y) : undefined;

        return (
          <GridCell
            key={key}
            hasWall={hasWall}
            destination={destination}
            styles={styles}
            config={config}
            activeTheme={activeTheme}
            activeCharacter={activeCharacter}
            trailsEnabled={trailsEnabled}
            cellTrail={cellTrail}
          />
        );
      })}

      <div
        className="absolute overflow-visible"
        style={{
          top: 'var(--grid-padding)',
          left: 'var(--grid-padding)',
          right: 'var(--grid-padding)',
          bottom: 'var(--grid-padding)',
          pointerEvents: 'none',
          width: 'calc(100% - 2 * var(--grid-padding))',
          height: 'calc(100% - 2 * var(--grid-padding))',
          overflow: 'visible',
        }}
      >
        {portals.map((portal) => {
          const blockType = colorToBlockType(portal.color) as keyof ThemeConfig;
          const activeColor = config[blockType]?.color || (portal.color as ColorId);
          const palette = getThemeColorPalette(baseThemeId, activeColor as ColorId);

          return (
            <div
              key={portal.id}
              className="absolute aspect-square pointer-events-none z-10 overflow-visible"
              style={{
                width: 'var(--cell-size)',
                height: 'var(--cell-size)',
                transform: `translate3d(calc(${portal.x} * (var(--cell-size) + 1px)), calc(${portal.y} * (var(--cell-size) + 1px)), 0px)`,
              }}
            >
              <ThemePortal
                themeId={baseThemeId}
                dir={portal.dir}
                colorHex={palette.colorHex}
                colorClass={palette.text}
                portalColor={portal.color}
              />
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
            const startPos = anim.targetPos;
            const dx = block.pos.x - startPos.x;
            const dy = block.pos.y - startPos.y;
            const distance = Math.abs(dx) + Math.abs(dy);
            const isInstant = lastAction === 'reset' || lastAction === 'undo' || lastAction === 'load' || block.noTransition;
            const duration = isInstant || !isAnimated || distance === 0 ? 0 : getSlideDuration(distance);

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

          const isInstantAction = lastAction === 'reset' || lastAction === 'undo' || lastAction === 'load' || lastAction === 'teleport' || block.noTransition;
          const slideDuration = duration > 0 ? duration : getSlideDuration(Math.abs(block.pos.x - (prevBlocks?.[idx]?.pos.x ?? block.pos.x)) + Math.abs(block.pos.y - (prevBlocks?.[idx]?.pos.y ?? block.pos.y)));
          const transitionStyle = isInstantAction || !isAnimated ? 'none' : `transform ${slideDuration}ms cubic-bezier(0.2, 0.9, 0.3, 1)`;

          return (
            <div
              key={`block-${idx}`}
              className="absolute aspect-square filter drop-shadow-[3px_3px_0px_rgba(0,0,0,0.65)]"
              style={{
                width: 'var(--cell-size)',
                height: 'var(--cell-size)',
                transform: `translate3d(calc(${block.pos.x} * (var(--cell-size) + 1px)), calc(${block.pos.y} * (var(--cell-size) + 1px)), 0px)`,
                transition: transitionStyle,
                willChange: 'transform',
              }}
            >
              {content}
            </div>
          );
        })}

{(() => {
          const charId = activeCharacter || 'neon';
          const playerElement = <CharacterOrb id={charId} />;

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
                transform: `translate3d(calc(${playerPos.x} * (var(--cell-size) + 1px)), calc(${playerPos.y} * (var(--cell-size) + 1px)), 0px)`,
                transition: playerTransitionStyle,
                willChange: 'transform',
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
