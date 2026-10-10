import React, { useId, memo } from 'react';
import { BlockType } from '../types';
import { BaseThemeId, ColorId, ShapeId } from '../../shared/themes';
import { PuzzleShape } from './PuzzleShape';
import { COLOR_PALETTES, getThemeColorPalette } from './ThemeBoardRenderer';

export interface HexagonBlockProps {
  blockType?: BlockType | string;
  colorId?: ColorId;
  colorHex?: string;
  shape?: ShapeId;
  isSolved?: boolean;
  isAnimated?: boolean;
  baseThemeId?: BaseThemeId;
  isCircular?: boolean;
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

export const HexagonBlock: React.FC<HexagonBlockProps> = memo(({
  blockType,
  colorId,
  colorHex: customHex,
  shape,
  isSolved = false,
  isAnimated = false,
  baseThemeId = 'neon',
  isCircular = false,
  colors,
  className = 'w-full h-full',
}) => {
  const gradientId = useId();

  // Extract color prefix from blockType e.g. "blue-diamond" -> "blue", or use explicit colorId
  const targetColorId = colorId || (blockType && blockType !== 'gray-neutral' ? (blockType.split('-')[0] as ColorId) : undefined);
  const themePalette = targetColorId ? getThemeColorPalette(baseThemeId, targetColorId) : undefined;
  const isNeutral = (blockType === 'gray-neutral' || colorId === 'gray') && !targetColorId;

  // Resolve color palette
  const effectiveColorHex =
    customHex ||
    colors?.colorHex ||
    themePalette?.colorHex ||
    (targetColorId && COLOR_PALETTES[targetColorId]?.colorHex) ||
    (!isNeutral ? COLOR_PALETTES.blue.colorHex : '#d1d5db');

  const textColorClass = colors?.text || themePalette?.text || (targetColorId ? COLOR_PALETTES[targetColorId]?.text : 'text-gray-300');

  // Base background fill for dark/neon themes vs light/solved states
  const darkBgFill =
    baseThemeId === 'winter'
      ? '#0f172a'
      : baseThemeId === 'forest'
        ? '#1c1917'
        : baseThemeId === 'candy'
          ? '#2e0219'
          : baseThemeId === 'papercraft'
            ? '#1c1917'
            : baseThemeId === 'steampunk'
              ? '#1c140c'
              : baseThemeId === 'olympus'
                ? '#090d16'
                : baseThemeId === 'pirate'
                  ? '#081315'
                  : baseThemeId === 'synthwave'
                    ? '#0e061a'
                    : baseThemeId === 'relic'
                      ? '#18130e'
                      : baseThemeId === 'chronolith'
                        ? '#040711'
                        : '#09090b';

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg
        className={`w-full h-full absolute inset-0 ${textColorClass} ${isSolved
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
                <stop offset="0%" stopColor={effectiveColorHex} stopOpacity="0.65" />
                <stop offset="45%" stopColor={effectiveColorHex} stopOpacity="0.2" />
                <stop offset="100%" stopColor={darkBgFill} stopOpacity="0.95" />
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
        {isCircular ? (
          <ellipse
            cx="50"
            cy="54"
            rx="42"
            ry="42"
            fill="#000000"
            fillOpacity={isSolved ? 0.75 : 0.65}
          />
        ) : (
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
        )}

        {/* ---------------- OUTER BASE (CIRCULAR OR ROUNDED SQUIRCLE) ---------------- */}
        {isCircular ? (
          <circle
            cx="50"
            cy="48"
            r="42"
            fill={isSolved ? effectiveColorHex : darkBgFill}
            fillOpacity={isSolved ? 0.95 : 0.92}
            stroke={isNeutral ? '#475569' : effectiveColorHex}
            strokeWidth={isSolved ? '3' : '2'}
            strokeOpacity={isNeutral ? 0.4 : (isSolved ? 0.95 : 0.75)}
          />
        ) : (
          <rect
            x="8"
            y="6"
            width="84"
            height="84"
            rx="18"
            ry="18"
            fill={isSolved ? effectiveColorHex : darkBgFill}
            fillOpacity={isSolved ? 0.95 : 0.92}
            stroke={isNeutral ? '#475569' : effectiveColorHex}
            strokeWidth={isSolved ? '3' : '2'}
            strokeOpacity={isNeutral ? 0.4 : (isSolved ? 0.95 : 0.75)}
          />
        )}

        {/* ---------------- BEVELED EDGE HIGHLIGHTS & SHADOWS ---------------- */}
        {isSolved && (
          isCircular ? (
            <circle
              cx="50"
              cy="48"
              r="41"
              fill="none"
              stroke="#ffffff"
              strokeWidth="3"
              strokeOpacity={0.6}
            />
          ) : (
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
          )
        )}

        {/* ---------------- INNER TOP FACE ---------------- */}
        {isCircular ? (
          <circle
            cx="50"
            cy="48"
            r="36"
            fill={`url(#hexTopGrad-${gradientId})`}
          />
        ) : (
          <rect
            x="14"
            y="12"
            width="72"
            height="72"
            rx="14"
            ry="14"
            fill={`url(#hexTopGrad-${gradientId})`}
          />
        )}

        {/* Solved Center Radial Glow Overlay */}
        {isSolved && (
          isCircular ? (
            <circle
              cx="50"
              cy="48"
              r="36"
              fill={`url(#hexSolvedGlow-${gradientId})`}
            />
          ) : (
            <rect
              x="14"
              y="12"
              width="72"
              height="72"
              rx="14"
              ry="14"
              fill={`url(#hexSolvedGlow-${gradientId})`}
            />
          )
        )}

        {/* ---------------- SPECULAR GLOSS HIGHLIGHT ---------------- */}
        {isCircular ? (
          <path
            d="M 26,26 A 34 34 0 0 1 74,26"
            fill="none"
            stroke="#ffffff"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeOpacity={isSolved ? '0.85' : '0.45'}
          />
        ) : (
          <path
            d="M 24,18 L 76,18"
            stroke="#ffffff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeOpacity={isSolved ? '0.85' : '0.45'}
          />
        )}

        {/* ---------------- CHRONOLITH STEPPED ACCENTS ---------------- */}
        {baseThemeId === 'chronolith' && !isNeutral && (
          isCircular ? (
            <g stroke={effectiveColorHex} strokeWidth="1.2" strokeLinecap="round" strokeOpacity={isSolved ? 0.9 : 0.6}>
              <circle cx="50" cy="48" r="36" fill="none" stroke={effectiveColorHex} strokeWidth="1" strokeDasharray="3 3" strokeOpacity="0.5" />
              <polygon points="50,16 78,48 50,80 22,48" fill="none" stroke={effectiveColorHex} strokeWidth="0.8" strokeOpacity="0.35" strokeDasharray="3 2" />
            </g>
          ) : (
            <g stroke={effectiveColorHex} strokeWidth="1.2" strokeLinecap="round" strokeOpacity={isSolved ? 0.9 : 0.6}>
              {/* Top-Left Corner Stepped Chevrons */}
              <path d="M 18,26 L 18,18 L 26,18" fill="none" />
              <path d="M 22,30 L 22,22 L 30,22" fill="none" opacity="0.6" />
              {/* Top-Right Corner Stepped Chevrons */}
              <path d="M 82,26 L 82,18 L 74,18" fill="none" />
              <path d="M 78,30 L 78,22 L 70,22" fill="none" opacity="0.6" />
              {/* Bottom-Left Corner Stepped Chevrons */}
              <path d="M 18,70 L 18,78 L 26,78" fill="none" />
              <path d="M 22,66 L 22,74 L 30,74" fill="none" opacity="0.6" />
              {/* Bottom-Right Corner Stepped Chevrons */}
              <path d="M 82,70 L 82,78 L 74,78" fill="none" />
              <path d="M 78,66 L 78,74 L 70,74" fill="none" opacity="0.6" />
              {/* Prismatic Inset Diamond Setting */}
              <polygon points="50,20 78,48 50,76 22,48" fill="none" stroke={effectiveColorHex} strokeWidth="0.8" strokeOpacity="0.3" strokeDasharray="3 2" />
            </g>
          )
        )}

        {/* Outer Border Line (Solved State Only) */}
        {isSolved && (
          isCircular ? (
            <circle
              cx="50"
              cy="48"
              r="42"
              fill="none"
              stroke="#ffffff"
              strokeWidth="2.5"
              strokeOpacity="0.95"
            />
          ) : (
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
          )
        )}
      </svg>

      {/* ---------------- PUZZLE SHAPE ICON ---------------- */}
      {shape && !isNeutral && (
        <div
          className={`absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 ${baseThemeId === 'chronolith' ? 'w-[52%] h-[52%]' : 'w-[46%] h-[46%]'} flex items-center justify-center pointer-events-none ${isSolved
              ? 'text-white filter drop-shadow-[0_0_8px_#ffffff]'
              : `${textColorClass} filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.7)]`
            }`}
        >
          <PuzzleShape
            shape={shape}
            className="w-full h-full"
            isCompleted={isSolved}
          />
        </div>
      )}
    </div>
  );
});
