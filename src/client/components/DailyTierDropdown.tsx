import { useState, useRef, useEffect, useMemo } from 'react';
import { DIFFICULTY_TIERS, DailyDifficultyTier, DailyTierKey, getTierMeta } from '../../shared/difficultyTiers';
import { DailyTierInfo } from '../../shared/types';
import { ShardIcon } from './ShardIcon';
import { cn } from '../utils';

export type DailyTierDropdownProps = {
  selectedTier: DailyTierKey | string;
  onSelectTier: (tier: DailyTierKey, level: DailyDifficultyTier) => void;
  tiersData?: DailyTierInfo[] | { [key: string]: DailyTierInfo } | null | undefined;
  className?: string;
};

export const DailyTierDropdown = ({
  selectedTier,
  onSelectTier,
  tiersData,
  className,
}: DailyTierDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentMeta = useMemo(() => getTierMeta(selectedTier), [selectedTier]);

  const tiersArray = useMemo(() => {
    if (Array.isArray(tiersData) && tiersData.length > 0) {
      return tiersData;
    }
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

  // Click outside listener to dismiss popover
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className={cn('relative inline-block select-none', className)}>
      {/* Trigger Pill */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          'h-7 sm:h-8 px-2 sm:px-2.5 rounded-xl border backdrop-blur-md shadow-sm transition-all flex items-center gap-1.5 cursor-pointer text-xs font-mono font-bold',
          currentMeta.badgeBg,
          currentMeta.badgeBorder,
          isOpen ? 'ring-1 ring-white/30 brightness-110' : 'hover:brightness-110'
        )}
        title={`Change Difficulty Tier (Currently ${currentMeta.name})`}
      >
        <span
          className="w-2 h-2 rounded-full shrink-0 shadow-sm"
          style={{ backgroundColor: currentMeta.colorHex }}
        />
        <span className={cn('tracking-tight uppercase font-black text-[10px] sm:text-[11px]', currentMeta.badgeText)}>
          <span className="hidden min-[480px]:inline">Lv {currentMeta.tier} · {currentMeta.name}</span>
          <span className="inline min-[480px]:hidden">{currentMeta.shortName}</span>
        </span>
        <svg
          className={cn('w-3 h-3 text-zinc-400 transition-transform duration-200 shrink-0', isOpen && 'rotate-180')}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {/* Floating Glassmorphic Popover Drawer */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 z-50 w-56 sm:w-64 p-1.5 rounded-2xl bg-zinc-950/95 border border-white/20 backdrop-blur-xl shadow-2xl shadow-black/90 animate-fade-in flex flex-col gap-1">
          <div className="px-2 py-1 text-[9px] font-mono font-bold uppercase tracking-wider text-zinc-400 border-b border-white/10 flex items-center justify-between">
            <span>Select Daily Tier</span>
            <span className="text-[8px] text-zinc-500 font-normal">6 Difficulties</span>
          </div>

          <div className="flex flex-col gap-0.5">
            {DIFFICULTY_TIERS.map((meta) => {
              const isSelected = currentMeta.tier === meta.tier;
              const info = tiersArray.find((t) => t.tierLevel === meta.tier || t.tier === meta.key);
              const isCompleted = info?.completed ?? false;

              return (
                <button
                  key={meta.tier}
                  type="button"
                  onClick={() => {
                    onSelectTier(meta.key, meta.tier);
                    setIsOpen(false);
                  }}
                  className={cn(
                    'flex items-center justify-between px-2.5 py-1.5 rounded-xl transition-all cursor-pointer text-left',
                    isSelected
                      ? 'bg-white/10 border border-white/20 shadow-sm'
                      : 'hover:bg-white/5 border border-transparent'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: meta.colorHex }}
                    />
                    <div className="flex flex-col">
                      <span className={cn('text-[11px] font-black uppercase tracking-tight', meta.badgeText)}>
                        {meta.name}
                      </span>
                      <span className="text-[9px] text-zinc-400 font-mono">
                        Level {meta.tier}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Shard Reward Tag */}
                    <span className="flex items-center gap-0.5 text-[9px] font-mono font-bold text-amber-300">
                      <ShardIcon className="w-2.5 h-2.5 text-amber-300 shrink-0" />
                      <span>+{meta.shardsReward}</span>
                    </span>

                    {/* Solved Checkmark */}
                    {isCompleted && (
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-black shadow-sm">
                        <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

