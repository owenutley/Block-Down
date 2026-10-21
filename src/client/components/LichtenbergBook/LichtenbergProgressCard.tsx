import { memo, useState } from 'react';
import {
  BookProgressState,
  TOTAL_BOOK_NODES,
  DEFAULT_BOOK_ACTIVITIES,
  BookPointActivity,
} from '../../../shared/lichtenbergProgress';

export type LichtenbergProgressCardProps = {
  progress: BookProgressState;
  forceFullDisplay?: boolean;
  pointActivities?: BookPointActivity[];
};

export const LichtenbergProgressCard = memo(({
  progress,
  forceFullDisplay = false,
  pointActivities,
}: LichtenbergProgressCardProps) => {
  const [showTasksModal, setShowTasksModal] = useState(false);

  const displayNodeCount = forceFullDisplay ? TOTAL_BOOK_NODES : progress.unlockedNodeCount;
  const isFullyAwakened = displayNodeCount >= TOTAL_BOOK_NODES;

  const activities = pointActivities || progress.activities || DEFAULT_BOOK_ACTIVITIES;
  const completedCount = activities.filter((a) => a.isCompleted).length;
  const hasUnclaimed = completedCount < activities.length;

  return (
    <>
      {/* Sleek Minimalist Glass Micro-HUD */}
      <div className="w-full max-w-sm sm:max-w-md mx-auto flex items-center justify-between gap-2.5 bg-slate-950/75 backdrop-blur-md border border-amber-500/25 rounded-xl px-2.5 py-1.5 shadow-[0_2px_15px_rgba(0,0,0,0.5)] select-none">
        {/* Star Counter */}
        <div className="flex items-center gap-1.5 shrink-0">
          <svg className="w-3.5 h-3.5 text-amber-400 shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8 5.8 21.3l2.4-7.4L2 9.4h7.6L12 2z" />
          </svg>
          <span className="text-[11px] font-mono font-bold text-amber-200 whitespace-nowrap">
            {isFullyAwakened ? 'Awakened (34/34)' : `Star ${displayNodeCount}/${TOTAL_BOOK_NODES}`}
          </span>
        </div>

        {/* Slim Progress Bar */}
        <div
          className="flex-1 min-w-[60px] bg-slate-900 rounded-full h-1.5 overflow-hidden border border-amber-900/40 p-0.2"
          title={isFullyAwakened ? 'All stars radiant!' : `${progress.pointsInCurrentNode}/${progress.pointsNeededForNextNode} pts to next star`}
        >
          <div
            className="bg-gradient-to-r from-amber-600 via-amber-400 to-amber-200 h-full rounded-full transition-all duration-500 shadow-[0_0_6px_rgba(245,158,11,0.6)]"
            style={{ width: `${isFullyAwakened ? 100 : Math.max(5, progress.percentToNextNode)}%` }}
          />
        </div>

        {/* Ways to Earn Interactive Popover Trigger */}
        <button
          onClick={() => setShowTasksModal(true)}
          className={`shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold border transition-all cursor-pointer active:scale-95 ${
            hasUnclaimed
              ? 'bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/40 text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.15)]'
              : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700 text-slate-400'
          }`}
          title="View daily point activities and rewards"
        >
          <span className={hasUnclaimed ? 'text-amber-400' : 'text-emerald-400 font-bold'}>
            {hasUnclaimed ? '✦' : '✓'}
          </span>
          <span>Earn</span>
          <span className={`text-[9px] px-1 py-0.2 rounded font-bold ${
            hasUnclaimed ? 'bg-amber-400/20 text-amber-200' : 'bg-slate-700 text-slate-400'
          }`}>
            {completedCount}/{activities.length}
          </span>
        </button>
      </div>

      {/* Floating Modal Popover for Ways to Earn */}
      {showTasksModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn"
          onClick={() => setShowTasksModal(false)}
        >
          <div
            className="w-full max-w-xs sm:max-w-sm bg-slate-900 border border-amber-500/40 rounded-2xl p-4 shadow-[0_0_50px_rgba(0,0,0,0.9),0_0_25px_rgba(245,158,11,0.2)] text-left flex flex-col gap-3 select-none"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-2 border-b border-amber-500/20">
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8 5.8 21.3l2.4-7.4L2 9.4h7.6L12 2z" />
                </svg>
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-200 font-mono">
                  Ways to Earn Stars
                </h3>
              </div>
              <button
                onClick={() => setShowTasksModal(false)}
                className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center text-xs transition-colors cursor-pointer"
                aria-label="Close"
              >
                &times;
              </button>
            </div>

            {/* Completion Counter Banner */}
            <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] font-mono">
              <span className="text-slate-400">Activity Progress:</span>
              <span className="font-bold text-amber-300">
                {completedCount} / {activities.length} completed
              </span>
            </div>

            {/* Task List */}
            <div className="flex flex-col gap-1.5">
              {activities.map((act) => {
                const isDone = act.isCompleted;
                return (
                  <div
                    key={act.id}
                    className={`flex items-center justify-between p-2 rounded-xl border transition-all ${
                      isDone
                        ? 'bg-slate-950/50 border-slate-800/80 text-slate-500 opacity-60'
                        : 'bg-amber-500/10 border-amber-500/30 text-amber-100 hover:bg-amber-500/15'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`text-xs font-bold shrink-0 ${isDone ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {isDone ? '✓' : '✦'}
                      </span>
                      <div className="flex flex-col min-w-0">
                        <span className={`text-xs font-semibold ${isDone ? 'line-through text-slate-500' : 'text-slate-100'}`}>
                          {act.label}
                        </span>
                        <span className="text-[10px] text-slate-400 truncate">
                          {act.description}
                        </span>
                      </div>
                    </div>

                    <span className={`font-mono text-xs font-bold shrink-0 ml-2 ${isDone ? 'text-slate-600' : 'text-amber-300'}`}>
                      +{act.points}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Footer Button */}
            <button
              onClick={() => setShowTasksModal(false)}
              className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-98 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer mt-1 shadow-[0_0_12px_rgba(245,158,11,0.3)]"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
});
