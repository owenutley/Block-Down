import { useMemo } from 'react';
import { DIFFICULTY_TIERS, DailyDifficultyTier, DailyTierKey, getTierMeta } from '../../shared/difficultyTiers';
import { DailyTierInfo } from '../../shared/types';
import { ShardIcon } from './ShardIcon';
import { cn } from '../utils';

export type DailyTierSelectorProps = {
  selectedTier: DailyTierKey | string;
  onSelectTier: (tier: DailyTierKey, level: DailyDifficultyTier) => void;
  tiersData?: DailyTierInfo[] | { [key: string]: DailyTierInfo } | null | undefined;
  compact?: boolean;
  className?: string;
};

export const DailyTierSelector = ({
  selectedTier,
  onSelectTier,
  tiersData,
  compact = false,
  className,
}: DailyTierSelectorProps) => {
  const currentMeta = useMemo(() => getTierMeta(selectedTier), [selectedTier]);

  const tiersArray = useMemo(() => {
    if (Array.isArray(tiersData) && tiersData.length > 0) {
      return tiersData;
    }
    // If dictionary or null, return simulated array from DIFFICULTY_TIERS
    return DIFFICULTY_TIERS.map((meta) => {
      let isCompleted = false;
      let par: number | undefined;
      let blocksCount = meta.targetBlocks;

      if (tiersData && typeof tiersData === 'object') {
        const dict = tiersData as Record<string, DailyTierInfo>;
        const match = dict[meta.key] || (meta.key === 'medium' ? dict['standard'] : undefined);
        if (match) {
          isCompleted = match.completed;
          par = match.par;
          blocksCount = match.blocksCount;
        }
      }

      return {
        tier: meta.key,
        tierLevel: meta.tier,
        puzzleId: `tier-${meta.tier}`,
        name: meta.name,
        par,
        blocksCount,
        completed: isCompleted,
        shardsReward: meta.shardsReward,
      } as DailyTierInfo;
    });
  }, [tiersData]);

  return (
    <div className={cn('flex flex-col items-center gap-1 w-full max-w-lg select-none', className)}>
      {/* 6-Pill Horizontal Strip */}
      <div className="flex items-center justify-between gap-1 w-full p-1 rounded-2xl bg-black/60 border border-white/10 backdrop-blur-md shadow-inner">
        {DIFFICULTY_TIERS.map((meta) => {
          const isSelected = currentMeta.tier === meta.tier;
          const info = tiersArray.find((t) => t.tierLevel === meta.tier || t.tier === meta.key);
          const isCompleted = info?.completed ?? false;

          return (
            <button
              key={meta.tier}
              type="button"
              onClick={() => onSelectTier(meta.key, meta.tier)}
              className={cn(
                'relative flex-1 flex flex-col items-center justify-center py-1 sm:py-1.5 px-1 rounded-xl transition-all duration-200 cursor-pointer group',
                isSelected
                  ? 'border shadow-md'
                  : 'bg-transparent border border-transparent hover:bg-white/5 text-zinc-400 hover:text-white',
                isSelected && meta.badgeBg,
                isSelected && meta.badgeBorder,
                isSelected && meta.badgeGlow
              )}
              style={{
                borderColor: isSelected ? meta.colorHex : undefined,
              }}
              title={`${meta.name} (Level ${meta.tier}) · ${meta.shardsReward} Shards`}
            >
              {/* Solved Checkmark Indicator */}
              {isCompleted && (
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 text-black shadow-sm">
                  <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
              )}

              {/* Tier Label */}
              <span
                className={cn(
                  'text-[10px] sm:text-xs font-black uppercase tracking-tight leading-tight',
                  isSelected ? meta.badgeText : 'text-zinc-400 group-hover:text-zinc-200'
                )}
              >
                <span className="hidden sm:inline">{meta.name}</span>
                <span className="inline sm:hidden">{meta.shortName}</span>
              </span>

              {/* Shard Bounty Tag */}
              {!compact && (
                <span
                  className={cn(
                    'flex items-center gap-0.5 text-[9px] font-mono font-bold mt-0.5',
                    isSelected ? 'text-amber-300' : 'text-zinc-500 group-hover:text-amber-400/80'
                  )}
                >
                  <ShardIcon className="w-2.5 h-2.5 text-amber-300 shrink-0" />
                  <span>+{meta.shardsReward}</span>
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

