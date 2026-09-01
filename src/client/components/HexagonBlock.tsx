import React, { useId } from 'react';
import { BlockType } from '../types';
import { BaseThemeId, ColorId, ShapeId } from '../../shared/themes';
import { PuzzleShape } from './PuzzleShape';
import { COLOR_PALETTES } from './ThemeBoardRenderer';

export interface HexagonBlockProps {
  blockType?: BlockType | string;
  colorId?: ColorId;
  colorHex?: string;
  shape?: ShapeId | string;
  isSolved?: boolean;
  isAnimated?: boolean;
  baseThemeId?: BaseThemeId;
  colors?: {
    text: string;
    border: string;
    shadow: string;
    blockFill: string;
    solidFill: string;
    colorHex?: string;
  };
  className?: string;
}

export const HexagonBlock: React.FC<HexagonBlockProps> = ({
  blockType = 'gray-neutral',
  colorId,
  colorHex: customHex,
  shape,
  isSolved = false,
  isAnimated = false,
  baseThemeId = 'neon',
  colors,
  className = 'w-full h-full',
}) => {
  const gradientId = useId();

  // Extract color prefix from blockType e.g. "blue-diamond" -> "blue"
  const typePrefixColor = blockType ? (blockType.split('-')[0] as ColorId) : undefined;
  const typePrefixHex = typePrefixColor && COLOR_PALETTES[typePrefixColor]?.colorHex;

  // Resolve color palette
  const effectiveColorHex =
    customHex ||
    colors?.colorHex ||
    (colorId && COLOR_PALETTES[colorId]?.colorHex) ||
    typePrefixHex ||
    (blockType !== 'gray-neutral' ? COLOR_PALETTES.blue.colorHex : '#d1d5db');

  const textColorClass = colors?.text || (colorId ? COLOR_PALETTES[colorId]?.text : 'text-gray-300');
  const isNeutral = blockType === 'gray-neutral';

  // Base background fill for dark/neon themes vs light/solved states
  const darkBgFill =
    baseThemeId === 'winter'
      ? '#0f172a'
      : baseThemeId === 'forest'
      ? '#1c1917'
      : baseThemeId === 'candy'
      ? '#2e0219'
      : '#09090b';

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg
        className={`w-full h-full absolute inset-0 ${textColorClass} ${
          isSolved
            ? 'filter drop-shadow-[0_0_10px_currentColor]'
            : isNeutral
            ? 'filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.85)]'
            : 'filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]'
        } ${isAnimated && isSolved ? 'animate-pulse-glow' : ''}`}
        viewBox="0 0 100 108"
        fill="none"
      >
        <defs>
          {/* Inner Face Linear Gradient */}
          <linearGradient id={`hexTopGrad-${gradientId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            {isSolved ? (
              <>
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
                <stop offset="40%" stopColor={effectiveColorHex} stopOpacity="0.9" />
                <stop offset="100%" stopColor={effectiveColorHex} stopOpacity="0.75" />
              </>
            ) : isNeutral ? (
              <>
                <stop offset="0%" stopColor="#64748b" stopOpacity="0.9" />
                <stop offset="50%" stopColor="#334155" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#1e293b" stopOpacity="0.95" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor={effectiveColorHex} stopOpacity="0.5" />
                <stop offset="50%" stopColor={darkBgFill} stopOpacity="0.9" />
                <stop offset="100%" stopColor={darkBgFill} stopOpacity="0.98" />
              </>
            )}
          </linearGradient>

          {/* Solved Center Radial Glow Overlay */}
          <radialGradient id={`hexSolvedGlow-${gradientId}`} cx="50%" cy="40%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
            <stop offset="60%" stopColor={effectiveColorHex} stopOpacity="0.5" />
            <stop offset="100%" stopColor={effectiveColorHex} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* ---------------- 3D EXTRUDED SIDE WALLS (DEPTH BASE) ---------------- */}
        <rect
          x="8"
          y="12"
          width="84"
          height="84"
          rx="18"
          ry="18"
          fill="#000000"
          fillOpacity={isSolved ? 0.75 : 0.65}
        />

        {/* ---------------- OUTER ROUNDED SQUIRCLE BASE ---------------- */}
        <rect
          x="8"
          y="6"
          width="84"
          height="84"
          rx="18"
          ry="18"
          fill={isSolved ? effectiveColorHex : darkBgFill}
          fillOpacity={isSolved ? 0.95 : 0.9}
        />

        {/* ---------------- BEVELED EDGE HIGHLIGHTS & SHADOWS ---------------- */}
        {isSolved && (
          <rect
            x="9"
            y="7"
            width="82"
            height="82"
            rx="17"
            ry="17"
            fill="none"
            stroke="#ffffff"
            strokeWidth="3"
            strokeOpacity={0.6}
          />
        )}

        {/* ---------------- INNER TOP FACE ---------------- */}
        <rect
          x="14"
          y="12"
          width="72"
          height="72"
          rx="14"
          ry="14"
          fill={`url(#hexTopGrad-${gradientId})`}
        />

        {/* Solved Center Radial Glow Overlay */}
        {isSolved && (
          <rect
            x="14"
            y="12"
            width="72"
            height="72"
            rx="14"
            ry="14"
            fill={`url(#hexSolvedGlow-${gradientId})`}
          />
        )}

        {/* ---------------- SPECULAR GLOSS HIGHLIGHT ---------------- */}
        <path
          d="M 24,18 L 76,18"
          stroke="#ffffff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeOpacity={isSolved ? '0.85' : '0.45'}
        />

        {/* Outer Border Line (Solved State Only) */}
        {isSolved && (
          <rect
            x="8"
            y="6"
            width="84"
            height="84"
            rx="18"
            ry="18"
            fill="none"
            stroke="#ffffff"
            strokeWidth="2.5"
            strokeOpacity="0.95"
          />
        )}
      </svg>

      {/* ---------------- PUZZLE SHAPE ICON ---------------- */}
      {shape && !isNeutral && (
        <div
          className={`absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-[46%] h-[46%] flex items-center justify-center pointer-events-none ${
            isSolved
              ? 'text-white filter drop-shadow-[0_0_8px_#ffffff]'
              : `${textColorClass} filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.7)]`
          }`}
        >
          <PuzzleShape
            shape={shape as ShapeId}
            className="w-full h-full"
            isCompleted={isSolved}
          />
        </div>
      )}
    </div>
  );
};
