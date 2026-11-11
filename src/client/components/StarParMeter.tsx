import { calculateStars } from '../utils/puzzle';
import { cn } from '../utils';

export type StarParMeterProps = {
  pushCount: number;
  par: number;
  className?: string;
  compact?: boolean;
};

export const StarParMeter = ({
  pushCount,
  par,
  className,
  compact = false,
}: StarParMeterProps) => {
  const currentStars = calculateStars(pushCount, par);

  let starConfig: {
    tier: string;
    title: string;
    textColor: string;
    starColor: string;
    bonus: string;
  };

  switch (currentStars) {
    case 3:
      starConfig = {
        tier: 'Gold',
        title: 'Gold: Par Master (+3 Whisps)',
        textColor: 'text-emerald-400',
        starColor: 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.75)]',
        bonus: '+3',
      };
      break;
    case 2:
      starConfig = {
        tier: 'Silver',
        title: 'Silver: Great Efficiency (+2 Whisps)',
        textColor: 'text-cyan-300',
        starColor: 'text-slate-200 drop-shadow-[0_0_6px_rgba(203,213,225,0.5)]',
        bonus: '+2',
      };
      break;
    case 1:
    default:
      starConfig = {
        tier: 'Bronze',
        title: 'Bronze: Cleared (+1 Whisp)',
        textColor: 'text-amber-600',
        starColor: 'text-amber-600',
        bonus: '+1',
      };
      break;
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-mono select-none',
        className
      )}
      title={starConfig.title}
    >
      {/* 3-Star Visual Array */}
      <div className="flex items-center gap-0.5">
        {[1, 2, 3].map((starIdx) => {
          const isIlluminated = currentStars >= starIdx;
          return (
            <svg
              key={starIdx}
              className={cn(
                'w-3.5 h-3.5 transition-all duration-300 transform',
                isIlluminated ? starConfig.starColor : 'text-zinc-700 opacity-40 scale-90'
              )}
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          );
        })}
      </div>

      {/* Pushes / Par Ratio */}
      <div className="flex items-center gap-1">
        <span className={cn('font-black font-mono', starConfig.textColor)}>
          {pushCount}
        </span>
        <span className="text-zinc-500 font-normal">/</span>
        <span className="text-zinc-400 font-semibold">{par}</span>
      </div>

      {/* Tier Label (Desktop / Non-compact) */}
      {!compact && (
        <span
          className={cn(
            'hidden min-[500px]:inline-block px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider border',
            currentStars === 3
              ? 'bg-amber-500/15 border-amber-400/40 text-amber-300 shadow-[0_0_6px_rgba(245,158,11,0.2)]'
              : currentStars === 2
              ? 'bg-cyan-500/15 border-cyan-400/40 text-cyan-300'
              : 'bg-zinc-800/60 border-zinc-700 text-zinc-400'
          )}
        >
          {starConfig.tier}
        </span>
      )}
    </div>
  );
};
