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
    wallClass: 'bg-slate-800 shadow-[inset_0_4px_6px_rgba(0,0,0,0.6)]',
  },
  forest: {
    bgClass: 'bg-gradient-to-br from-stone-900 via-emerald-950 to-stone-950',
    panelClass: 'bg-emerald-950/20 border border-emerald-500/30 rounded-3xl backdrop-blur-md shadow-[0_0_30px_rgba(16,185,129,0.15)]',
    cellClass: 'bg-emerald-950/10 border border-emerald-800/10 rounded-lg',
    wallClass: 'bg-stone-800 shadow-[inset_0_4px_6px_rgba(0,0,0,0.7)]',
  },
  candy: {
    bgClass: 'bg-gradient-to-br from-pink-950 via-purple-950 to-slate-950',
    panelClass: 'bg-pink-950/20 border border-pink-500/30 rounded-3xl backdrop-blur-md shadow-[0_0_30px_rgba(244,63,94,0.15)]',
    cellClass: 'bg-pink-950/10 border border-pink-800/10 rounded-xl',
    wallClass: 'candy-wall-cell',
  },
  space: {
    bgClass: 'bg-gradient-to-br from-indigo-950 via-slate-950 to-blue-950',
    panelClass: 'bg-indigo-950/20 border border-indigo-500/30 rounded-3xl backdrop-blur-md shadow-[0_0_30px_rgba(99,102,241,0.15)]',
    cellClass: 'bg-zinc-950/40 border border-zinc-800/10 rounded-lg',
    wallClass: 'bg-zinc-800 shadow-[inset_0_4px_6px_rgba(255,255,255,0.1)]',
  },
  ocean: {
    bgClass: 'bg-gradient-to-br from-blue-950 via-cyan-950 to-slate-950',
    panelClass: 'bg-sky-950/20 border border-cyan-400/35 rounded-3xl backdrop-blur-md shadow-[0_0_30px_rgba(34,211,238,0.25)]',
    cellClass: 'bg-cyan-950/10 border border-cyan-800/10 rounded-lg',
    wallClass: 'bg-cyan-900/70 shadow-[inset_0_4px_6px_rgba(0,0,0,0.6)]',
  },
  retro: {
    bgClass: 'bg-gradient-to-br from-zinc-900 via-stone-950 to-black',
    panelClass: 'bg-zinc-900/40 border border-zinc-700/60 rounded-3xl backdrop-blur-md shadow-[0_0_35px_rgba(255,255,255,0.05)]',
    cellClass: 'bg-zinc-950/30 border border-zinc-800/10 rounded-md',
    wallClass: 'bg-zinc-800 shadow-[inset_0_4px_6px_rgba(0,0,0,0.85)]',
  },
  desert: {
    bgClass: 'bg-gradient-to-br from-amber-950 via-yellow-950 to-stone-950',
    panelClass: 'bg-amber-950/20 border border-amber-500/30 rounded-3xl backdrop-blur-md shadow-[0_0_30px_rgba(245,158,11,0.15)]',
    cellClass: 'bg-amber-950/10 border border-amber-800/10 rounded-lg',
    wallClass: 'bg-stone-900 shadow-[inset_0_4px_6px_rgba(0,0,0,0.9)]',
  },
  spooky: {
    bgClass: 'bg-gradient-to-br from-zinc-950 via-purple-950 to-black',
    panelClass: 'bg-purple-950/25 border border-purple-500/40 rounded-3xl backdrop-blur-md shadow-[0_0_30px_rgba(168,85,247,0.2)]',
    cellClass: 'bg-purple-950/10 border border-purple-800/10 rounded-xl',
    wallClass: 'bg-zinc-900 shadow-[inset_0_4px_6px_rgba(0,0,0,0.8)]',
  },
  volcanic: {
    bgClass: 'bg-gradient-to-br from-red-950 via-amber-950 to-black',
    panelClass: 'bg-red-950/25 border border-red-500/40 rounded-3xl backdrop-blur-md shadow-[0_0_30px_rgba(239,68,68,0.2)]',
    cellClass: 'bg-red-950/10 border border-red-800/10 rounded-lg',
    wallClass: 'bg-stone-900 shadow-[inset_0_4px_6px_rgba(0,0,0,0.9)]',
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
    text: 'text-amber-600',
    border: 'border-amber-600/80',
    shadow: 'shadow-[0_0_10px_rgba(217,119,6,0.3)]',
    bg: 'bg-amber-950/20',
    destBorder: 'border border-dashed border-amber-600/50',
    colorHex: '#d97706'
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
          bgColor = styles.wallClass;
          borderStyle = '';
          radiusStyle = 'rounded-none';
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
            {hasWall ? (
              (() => {
                switch (baseThemeId) {
                  case 'neon':
                    return (
                      <svg className="w-full h-full p-1.5 text-cyan-500/20" viewBox="0 0 40 40">
                        <path d="M 0,20 L 40,20 M 20,0 L 20,40 M 10,10 L 30,30 M 10,30 L 30,10" stroke="currentColor" strokeWidth="1" strokeDasharray="3" />
                        <rect x="12" y="12" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" />
                        <circle cx="20" cy="20" r="2" fill="currentColor" />
                      </svg>
                    );
                  case 'winter':
                    return (
                      <svg className="w-full h-full p-1.5 text-sky-200/40" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M 8,8 L 15,8 M 8,8 L 8,15" strokeLinecap="round" opacity="0.6" />
                        <path d="M 6,34 L 14,26 L 10,18" strokeLinecap="round" />
                        <path d="M 34,6 L 26,14 L 28,24 L 18,27" strokeLinecap="round" />
                        <path d="M 26,14 L 18,12" strokeLinecap="round" />
                        <rect x="5" y="5" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.25" />
                      </svg>
                    );
                  case 'forest':
                    return (
                      <svg className="w-1/2 h-1/2 text-amber-900/40" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="20" cy="20" r="16" strokeDasharray="3 2"/>
                        <circle cx="20" cy="20" r="12" />
                        <circle cx="20" cy="20" r="8" strokeDasharray="4 2"/>
                        <circle cx="20" cy="20" r="4" />
                      </svg>
                    );
                  case 'candy':
                    return (
                      <svg className="w-full h-full text-white" viewBox="0 0 40 40">
                        <path d="M 0,12 L 12,0 L 40,28 L 28,40 Z" fill="currentColor" opacity="0.12" />
                        <path d="M 0,22 L 22,0 L 40,18 L 18,40 Z" fill="currentColor" opacity="0.05" />
                      </svg>
                    );
                  case 'space':
                    return (
                      <svg className="w-full h-full p-1 text-zinc-500/45" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="4" y="4" width="32" height="32" />
                        <circle cx="8" cy="8" r="1.5" fill="currentColor"/>
                        <circle cx="32" cy="8" r="1.5" fill="currentColor"/>
                        <circle cx="8" cy="32" r="1.5" fill="currentColor"/>
                        <circle cx="32" cy="32" r="1.5" fill="currentColor"/>
                        <path d="M10 20h20M20 10v20" strokeWidth="1" strokeDasharray="3 3"/>
                      </svg>
                    );
                  case 'ocean':
                    return (
                      <svg className="w-3/5 h-3/5 text-cyan-400/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M2 10 Q 7 6, 12 10 T 22 10 M2 15 Q 7 11, 12 15 T 22 15"/>
                      </svg>
                    );
                  case 'retro':
                    return (
                      <svg className="w-full h-full p-1 text-zinc-700/80" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1">
                        <path d="M0 5h16M0 10h16M5 0v5M11 0v5M8 5v5M3 10v6M13 10v6" stroke="currentColor"/>
                      </svg>
                    );
                  case 'desert':
                    return (
                      <svg className="w-full h-full p-1.5 text-amber-900/35" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M5 5 L15 12 L22 8 L35 15 M15 12 L12 28 L28 35 M22 8 L25 22" />
                      </svg>
                    );
                  case 'spooky':
                    return (
                      <svg className="w-full h-full p-1.5 text-purple-500/35" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M0 0 L40 40 M40 0 L0 40 M0 20 H40 M20 0 V40 M10 10 Q20 15 30 10 Q35 20 30 30 Q20 25 10 30 Q5 20 10 10 Z M15 15 Q20 18 25 15 Q28 20 25 25 Q20 22 15 25 Q12 20 15 15 Z"/>
                      </svg>
                    );
                  case 'volcanic':
                    return (
                      <svg className="w-full h-full p-1 text-red-500/40 animate-pulse" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M10,0 L18,12 L30,8 L40,24 M18,12 L15,28 L28,40 M30,8 L25,22 L15,28" stroke="currentColor" />
                        <path d="M11,0 L19,12 L31,8 L40,23 M19,12 L16,28 L29,40 M31,8 L26,22" stroke="#f97316" strokeWidth="1" />
                      </svg>
                    );
                  default:
                    return null;
                }
              })()
            ) : hasDestination && destStyle && (
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

          if (isCorrectDestination) {
            content = (
              <div className="w-full h-full relative flex items-center justify-center">
                <svg className={`w-full h-full absolute inset-0 ${isAnimated ? 'animate-pulse-glow' : ''} ${colors.text}`} viewBox="0 0 100 100" fill="none">
                  <polygon
                    points="50,5 89,27 89,73 50,95 11,73 11,27"
                    className={blockBgCorrect}
                    stroke="currentColor"
                    strokeWidth="4.5"
                  />
                </svg>
                <div className={`relative z-10 w-1/2 h-1/2 ${colors.text} flex items-center justify-center`}>
                  <PuzzleShape shape={config[block.type].shape} className="w-full h-full drop-shadow-[0_0_8px_currentColor]" />
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
                  <PuzzleShape shape={config[block.type].shape} className="w-full h-full opacity-60" />
                </div>
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
          const charId = activeCharacter || 'neon';

          if (charId === 'winter') {
            playerElement = (
              <div className="w-full h-full rounded-full flex items-center justify-center bg-white border-2 border-sky-300 shadow-[0_0_12px_rgba(255,255,255,0.9)] relative overflow-hidden">
                <svg className="w-4/5 h-4/5" viewBox="0 0 32 32" fill="none">
                  {/* Rosy Cheeks */}
                  <circle cx="8" cy="18" r="2.5" fill="#fda4af" opacity="0.75" />
                  <circle cx="24" cy="18" r="2.5" fill="#fda4af" opacity="0.75" />
                  {/* Coal Eyes */}
                  <circle cx="10" cy="13" r="2" fill="#1e293b" />
                  <circle cx="22" cy="13" r="2" fill="#1e293b" />
                  {/* Carrot Nose */}
                  <polygon points="14,15 25,17 14,19" fill="#f97316" />
                  {/* Coal Smile */}
                  <path d="M 10 21 Q 16 26 22 21" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
            );
          } else if (charId === 'forest') {
            playerElement = (
              <div className="w-full h-full rounded-full flex items-center justify-center bg-amber-100 border-2 border-emerald-600 shadow-[0_0_12px_rgba(16,185,129,0.5)] relative overflow-hidden">
                <div className="absolute inset-0 flex flex-col">
                  {/* Acorn Cap */}
                  <div className="h-[40%] bg-amber-800 border-b border-amber-955 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-200 via-amber-950 to-black"></div>
                    <div className="w-1.5 h-2 bg-amber-950 rounded-t-sm absolute -top-0.5"></div>
                  </div>
                  {/* Acorn Face */}
                  <div className="h-[60%] flex items-center justify-center relative bg-amber-100">
                    <svg className="w-4/5 h-4/5" viewBox="0 0 32 20" fill="none">
                      {/* Eyes */}
                      <circle cx="10" cy="7" r="1.5" fill="#451a03" />
                      <circle cx="22" cy="7" r="1.5" fill="#451a03" />
                      {/* Blush cheeks */}
                      <circle cx="6" cy="10" r="1.5" fill="#fca5a5" opacity="0.6" />
                      <circle cx="26" cy="10" r="1.5" fill="#fca5a5" opacity="0.6" />
                      {/* Smile */}
                      <path d="M 13 11 Q 16 14 19 11" stroke="#451a03" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                    </svg>
                  </div>
                </div>
              </div>
            );
          } else if (charId === 'candy') {
            playerElement = (
              <div className="w-full h-full relative flex flex-col items-center justify-start pt-1">
                {/* Stick */}
                <div className="w-[10%] h-[35%] bg-slate-200 rounded-b-full absolute bottom-0.5 left-1/2 -translate-x-1/2 shadow-[0_1px_3px_rgba(0,0,0,0.2)]"></div>
                {/* Candy Head */}
                <div className="w-[78%] h-[78%] rounded-full relative overflow-hidden bg-gradient-to-br from-pink-400 via-rose-500 to-purple-600 border-[1.5px] border-pink-200 shadow-[0_0_12px_rgba(244,63,94,0.6)] flex items-center justify-center z-10">
                  {/* Rotating Swirls */}
                  <svg className="absolute inset-0 w-full h-full animate-[spin_6s_linear_infinite] origin-center" viewBox="0 0 100 100">
                    <path d="M50,50 C60,40 70,40 80,45" fill="none" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" opacity="0.8" />
                    <path d="M50,50 C60,60 60,70 55,80" fill="none" stroke="#fef08a" strokeWidth="6" strokeLinecap="round" opacity="0.8" />
                    <path d="M50,50 C40,60 30,60 20,55" fill="none" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" opacity="0.8" />
                    <path d="M50,50 C40,40 40,30 45,20" fill="none" stroke="#fef08a" strokeWidth="6" strokeLinecap="round" opacity="0.8" />
                  </svg>
                  {/* Stable Face on Top */}
                  <svg className="absolute inset-0 w-full h-full z-20" viewBox="0 0 100 100">
                    {/* Eyes */}
                    <ellipse cx="38" cy="45" rx="3.5" ry="4.5" fill="#312e81" />
                    <ellipse cx="62" cy="45" rx="3.5" ry="4.5" fill="#312e81" />
                    <circle cx="36.5" cy="43.5" r="1.2" fill="#ffffff" />
                    <circle cx="60.5" cy="43.5" r="1.2" fill="#ffffff" />
                    {/* Cheeks */}
                    <circle cx="31" cy="54" r="4.5" fill="#fecdd3" opacity="0.8" />
                    <circle cx="69" cy="54" r="4.5" fill="#fecdd3" opacity="0.8" />
                    {/* Smile */}
                    <path d="M45,52 Q50,58 55,52" fill="none" stroke="#312e81" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                </div>
              </div>
            );
          } else if (charId === 'space') {
            playerElement = (
              <div className="w-full h-full rounded-full flex items-center justify-center bg-slate-100 border-2 border-slate-300 shadow-[0_0_12px_rgba(255,255,255,0.6)] relative overflow-hidden p-1">
                {/* Dark visor */}
                <div className="w-5/6 h-2/3 bg-slate-950 rounded-xl border border-indigo-400/50 relative overflow-hidden flex items-center justify-center">
                  <div className="absolute -inset-1 bg-gradient-to-tr from-cyan-500/20 via-transparent to-purple-500/20"></div>
                  <div className="w-3/4 h-1 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(34,211,238,1)] animate-pulse"></div>
                  <div className="absolute top-1 right-2 w-1.5 h-1 bg-white/40 rounded-full"></div>
                </div>
                {/* Side controls */}
                <div className="absolute left-0 w-1 h-3 bg-slate-400 rounded-r-full"></div>
                <div className="absolute right-0 w-1 h-3 bg-slate-400 rounded-l-full"></div>
              </div>
            );
          } else if (charId === 'ocean') {
            playerElement = (
              <div className="w-full h-full rounded-full flex items-center justify-center bg-yellow-400 border-2 border-yellow-600 shadow-[0_0_15px_rgba(234,179,8,0.7)] relative overflow-hidden p-1">
                {/* Porthole */}
                <div className="w-1/2 h-1/2 bg-sky-200 border-2 border-yellow-600 rounded-full flex items-center justify-center relative overflow-hidden shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]">
                  <div className="w-full h-1/2 bg-sky-400 absolute bottom-0"></div>
                  <div className="absolute top-0.5 right-0.5 w-1 h-1 bg-white rounded-full"></div>
                </div>
                {/* Periscope */}
                <div className="absolute top-0 w-1.5 h-2 bg-yellow-500 border-x border-t border-yellow-600 -mt-0.5 flex flex-col items-center">
                  <div className="w-3 h-1 bg-yellow-600 rounded-sm -mt-0.5"></div>
                </div>
                {/* Propeller shadow */}
                <div className="absolute bottom-1 w-4 h-1 bg-yellow-600/75 rounded-full animate-pulse"></div>
              </div>
            );
          } else if (charId === 'retro') {
            playerElement = (
              <div className="w-full h-full rounded-lg flex items-center justify-center bg-purple-950/90 border-2 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.7)] relative overflow-hidden p-1.5">
                <svg className="w-full h-full text-purple-400" viewBox="0 0 11 8" fill="currentColor">
                  {/* Space Invader path */}
                  <path d="M3 0h1v1H3V0zm5 0h1v1H8V0zM4 1h3v1H4V1zM2 2h7v1H2V2zM1 3h9v1H1V3zm0 1h2v1H1V4zm3 0h3v1H4V4zm5 0h2v1H9V4zM0 5h11v1H0V5zm0 1h1v1H0V6zm2 0h7v1H2V6zm8 0h1v1h-1V6zm-7 1h1v1H3V7zm5 0h1v1H8V7z" />
                </svg>
              </div>
            );
          } else if (charId === 'desert') {
            playerElement = (
              <div className="w-full h-full rounded-full flex items-center justify-center bg-emerald-600 border-2 border-emerald-800 shadow-[0_0_12px_rgba(16,185,129,0.5)] relative overflow-hidden">
                <svg className="w-full h-full absolute inset-0" viewBox="0 0 32 32">
                  {/* Spikes */}
                  <line x1="6" y1="12" x2="10" y2="10" stroke="#fef08a" strokeWidth="1" />
                  <line x1="26" y1="12" x2="22" y2="10" stroke="#fef08a" strokeWidth="1" />
                  <line x1="10" y1="24" x2="6" y2="22" stroke="#fef08a" strokeWidth="1" />
                  <line x1="22" y1="24" x2="26" y2="22" stroke="#fef08a" strokeWidth="1" />
                  <line x1="16" y1="6" x2="16" y2="10" stroke="#fef08a" strokeWidth="1" />
                  {/* Face */}
                  <circle cx="12" cy="16" r="1.5" fill="#022c22" />
                  <circle cx="20" cy="16" r="1.5" fill="#022c22" />
                  <path d="M 14 19 Q 16 21 18 19" stroke="#022c22" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                </svg>
                {/* Flower */}
                <div className="absolute -top-0.5 w-3.5 h-3 bg-pink-500 rounded-full flex items-center justify-center shadow-md animate-pulse">
                  <div className="w-1.5 h-1.5 bg-yellow-300 rounded-full"></div>
                </div>
              </div>
            );
          } else if (charId === 'spooky') {
            playerElement = (
              <div className="w-full h-full rounded-full flex items-center justify-center bg-orange-600 border-2 border-orange-800 shadow-[0_0_15px_rgba(249,115,22,0.8)] relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-orange-400 via-orange-600 to-orange-950 opacity-20"></div>
                <div className="absolute -top-1 w-2 h-3 bg-emerald-800 rounded-t-sm border border-emerald-955"></div>
                <svg className="w-3/4 h-3/4 absolute inset-0 m-auto" viewBox="0 0 32 32">
                  <polygon points="8,10 13,10 10.5,14" fill="#facc15" />
                  <polygon points="19,10 24,10 21.5,14" fill="#facc15" />
                  <polygon points="15,14 17,14 16,16" fill="#facc15" />
                  <path d="M 7,19 L 10,21 L 13,19 L 16,22 L 19,19 L 22,21 L 25,19 L 23,23 L 20,22 L 16,24 L 12,22 L 9,23 Z" fill="#facc15" />
                </svg>
              </div>
            );
          } else if (charId === 'volcanic') {
            playerElement = (
              <div className="w-full h-full rounded-full flex items-center justify-center bg-stone-950 border-2 border-red-600 shadow-[0_0_20px_rgba(239,68,68,0.9)] relative overflow-hidden animate-pulse">
                <div className="absolute inset-0 bg-gradient-to-tr from-red-600 via-orange-500 to-yellow-500 opacity-60"></div>
                <svg className="w-full h-full absolute inset-0" viewBox="0 0 32 32">
                  <path d="M 0 0 L 12 0 L 8 8 L 0 6 Z" fill="#1c1917" />
                  <path d="M 14 0 L 32 0 L 30 10 L 18 6 Z" fill="#1c1917" />
                  <path d="M 0 8 L 10 10 L 6 20 L 0 16 Z" fill="#1c1917" />
                  <path d="M 24 12 L 32 8 L 32 24 L 22 22 L 18 16 Z" fill="#1c1917" />
                  <path d="M 0 22 L 8 22 L 10 32 L 0 32 Z" fill="#1c1917" />
                  <path d="M 12 24 L 24 26 L 16 32 L 8 32 Z" fill="#1c1917" />
                  <path d="M 26 24 L 32 26 L 32 32 L 20 32 Z" fill="#1c1917" />
                </svg>
                <div className="w-1/3 h-1/3 bg-yellow-400 rounded-full shadow-[0_0_12px_rgba(250,204,21,1)] animate-ping absolute opacity-50"></div>
                <div className="w-1/4 h-1/4 bg-amber-500 rounded-full shadow-[0_0_8px_rgba(245,158,11,1)] absolute"></div>
              </div>
            );
          } else {
            // neon / default original white glowing sphere
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
