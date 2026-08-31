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
            ? 'filter drop-shadow-[0_0_8px_currentColor]'
            : isNeutral
            ? 'filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.85)]'
            : 'filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]'
        } ${isAnimated && isSolved ? 'animate-pulse-glow' : ''}`}
        viewBox="0 -2 100 108"
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
                <stop offset="0%" stopColor={effectiveColorHex} stopOpacity="0.45" />
                <stop offset="50%" stopColor={darkBgFill} stopOpacity="0.9" />
                <stop offset="100%" stopColor={darkBgFill} stopOpacity="0.98" />
              </>
            )}
          </linearGradient>

          {/* Solved Center Radial Glow Overlay */}
          <radialGradient id={`hexSolvedGlow-${gradientId}`} cx="50%" cy="40%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
            <stop offset="60%" stopColor={effectiveColorHex} stopOpacity="0.5" />
            <stop offset="100%" stopColor={effectiveColorHex} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* ---------------- 3D EXTRUDED SIDE WALLS (DEPTH BASE) ---------------- */}
        {/* Bottom-Left 3D Side Wall */}
        <polygon
          points="11,69 50,90 50,97 11,76"
          fill="#000000"
          fillOpacity={isSolved ? 0.7 : 0.6}
        />
        {/* Bottom-Right 3D Side Wall */}
        <polygon
          points="50,90 89,69 89,76 50,97"
          fill="#000000"
          fillOpacity={isSolved ? 0.85 : 0.8}
        />
        {/* Right 3D Side Wall */}
        <polygon
          points="89,25 89,69 89,76 89,32"
          fill="#000000"
          fillOpacity={isSolved ? 0.65 : 0.7}
        />

        {/* ---------------- OUTER HEXAGON BASE ---------------- */}
        <polygon
          points="50,4 89,25 89,69 50,90 11,69 11,25"
          fill={isSolved ? effectiveColorHex : darkBgFill}
          fillOpacity={isSolved ? 0.95 : 0.9}
        />

        {/* ---------------- 6 BEVELED EDGE FACETS (CHAMFER RIM) ---------------- */}
        {/* Facet 0: Top-Left Bevel (Highlight) */}
        <polygon
          points="11,25 50,4 50,13 19,30"
          fill="#ffffff"
          fillOpacity={isSolved ? 0.6 : isNeutral ? 0.45 : 0.32}
        />
        {/* Facet 1: Top-Right Bevel (Light Accent) */}
        <polygon
          points="50,4 89,25 81,30 50,13"
          fill="#ffffff"
          fillOpacity={isSolved ? 0.45 : isNeutral ? 0.3 : 0.2}
        />
        {/* Facet 2: Right Bevel (Shadow) */}
        <polygon
          points="89,25 89,69 81,64 81,30"
          fill="#000000"
          fillOpacity={isSolved ? 0.2 : 0.4}
        />
        {/* Facet 3: Bottom Bevel (Deep Shadow) */}
        <polygon
          points="89,69 50,90 50,81 81,64"
          fill="#000000"
          fillOpacity={isSolved ? 0.3 : 0.58}
        />
        {/* Facet 4: Bottom-Left Bevel (Medium Shadow) */}
        <polygon
          points="50,90 11,69 19,64 50,81"
          fill="#000000"
          fillOpacity={isSolved ? 0.25 : 0.48}
        />
        {/* Facet 5: Left Bevel (Soft Light) */}
        <polygon
          points="11,69 11,25 19,30 19,64"
          fill="#ffffff"
          fillOpacity={isSolved ? 0.35 : isNeutral ? 0.25 : 0.16}
        />

        {/* ---------------- INNER TOP FACE (NO INNER STROKE) ---------------- */}
        <polygon
          points="50,13 81,30 81,64 50,81 19,64 19,30"
          fill={`url(#hexTopGrad-${gradientId})`}
        />

        {/* Solved Center Radial Glow Overlay */}
        {isSolved && (
          <polygon
            points="50,13 81,30 81,64 50,81 19,64 19,30"
            fill={`url(#hexSolvedGlow-${gradientId})`}
          />
        )}

        {/* ---------------- SPECULAR LIGHT CURVE / GLOSS SHEEN ---------------- */}
        <path
          d="M 23,30 L 48,16 L 75,31"
          stroke="#ffffff"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeOpacity={isSolved ? '0.85' : '0.4'}
        />

        {/* Single Outer Chamfer Edge Border Line */}
        <polygon
          points="50,4 89,25 89,69 50,90 11,69 11,25"
          fill="none"
          stroke={isSolved ? '#ffffff' : 'currentColor'}
          strokeWidth={isSolved ? '2.5' : '2'}
          strokeOpacity={isSolved ? '0.95' : '0.8'}
        />
      </svg>

      {/* ---------------- PUZZLE SHAPE ICON ---------------- */}
      {shape && !isNeutral && (
        <div
          className={`absolute top-[45.4%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-[46%] h-[46%] flex items-center justify-center pointer-events-none ${
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
