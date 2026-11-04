import { useMemo } from 'react';
import { DailyDifficultyTier, getTierMeta } from '../../shared/difficultyTiers';
import { cn } from '../utils';

export type DifficultyBadgeProps = {
  tier?: DailyDifficultyTier | number | string | undefined;
  size?: 'sm' | 'md' | 'lg';
  showPips?: boolean;
  showName?: boolean;
  showMetrics?: boolean;
  par?: number | undefined;
  blocksCount?: number | undefined;
  className?: string;
};

export const DifficultyBadge = ({
  tier = 3,
  size = 'md',
  showPips = true,
  showName = true,
  showMetrics = false,
  par,
  blocksCount,
  className,
}: DifficultyBadgeProps) => {
  const meta = useMemo(() => getTierMeta(tier), [tier]);

  const pips = [1, 2, 3, 4, 5, 6] as const;

  const isSmall = size === 'sm';
  const isLarge = size === 'lg';

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 sm:gap-2 rounded-xl border px-2 sm:px-2.5 py-1 backdrop-blur-md select-none',
        meta.badgeBg,
        meta.badgeBorder,
        meta.badgeGlow,
        isSmall ? 'text-[10px] py-0.5 px-2' : isLarge ? 'text-sm py-1.5 px-3' : 'text-xs',
        className
      )}
    >
      {/* 6-Pip Difficulty Scale */}
      {showPips && (
        <div className="flex items-center gap-0.5 sm:gap-1 shrink-0" aria-label={`Difficulty Level ${meta.tier} of 6`}>
          {pips.map((pip) => {
            const isActive = pip <= meta.tier;
            return (
              <span
                key={pip}
                className={cn(
                  'h-1.5 sm:h-2 rounded-full transition-all duration-300',
                  isSmall ? 'w-1 h-1' : isLarge ? 'w-2 h-2.5' : 'w-1.5 h-1.5 sm:w-2',
                  isActive
                    ? 'shadow-sm'
                    : 'bg-white/15 border border-white/5 opacity-40'
                )}
                style={{
                  backgroundColor: isActive ? meta.colorHex : undefined,
                  boxShadow: isActive ? `0 0 6px ${meta.colorHex}` : undefined,
                }}
              />
            );
          })}
        </div>
      )}

      {/* Difficulty Name */}
      {showName && (
        <span
          className={cn(
            'font-black font-mono uppercase tracking-wider',
            meta.badgeText,
            isSmall ? 'text-[9px]' : isLarge ? 'text-xs' : 'text-[10px] sm:text-xs'
          )}
        >
          {meta.name}
        </span>
      )}

      {/* Optional Metrics (Blocks, Par) */}
      {showMetrics && (par !== undefined || blocksCount !== undefined) && (
        <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-white/70 font-mono font-medium pl-1 border-l border-white/15">
          {blocksCount !== undefined && <span>{blocksCount}B</span>}
          {blocksCount !== undefined && par !== undefined && <span>·</span>}
          {par !== undefined && <span>Par {par}</span>}
        </div>
      )}
    </div>
  );
};

