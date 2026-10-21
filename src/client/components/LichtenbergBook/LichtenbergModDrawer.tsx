import { useState } from 'react';
import {
  TOTAL_BOOK_NODES,
  MAX_BOOK_POINTS,
  NODE_CUMULATIVE_THRESHOLDS,
  calculateBookProgressState,
  BookPointActivity,
  BookPointActivityId,
} from '../../../shared/lichtenbergProgress';

export type LichtenbergModDrawerProps = {
  realPoints: number;
  activePoints: number;
  forceFullDisplay: boolean;
  activities?: BookPointActivity[];
  onToggleForceFull: (enabled: boolean) => void;
  onApplySimulatedPoints: (points: number) => void;
  onToggleActivity?: (id: BookPointActivityId, isCompleted: boolean) => void;
  onResetToReal: () => void;
  onSaveDbPoints?: (points: number) => Promise<void>;
  onClose: () => void;
};

export const LichtenbergModDrawer = ({
  realPoints,
  activePoints,
  forceFullDisplay,
  activities,
  onToggleForceFull,
  onApplySimulatedPoints,
  onToggleActivity,
  onResetToReal,
  onSaveDbPoints,
  onClose,
}: LichtenbergModDrawerProps) => {
  const [sliderPoints, setSliderPoints] = useState<number>(activePoints);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const currentState = calculateBookProgressState(sliderPoints, activities);

  const handleSliderChange = (newPts: number) => {
    const safe = Math.max(0, Math.min(MAX_BOOK_POINTS, newPts));
    setSliderPoints(safe);
    onApplySimulatedPoints(safe);
  };

  const handleJumpToNode = (targetNode: number) => {
    const clamped = Math.max(1, Math.min(TOTAL_BOOK_NODES, targetNode));
    const targetPoints = NODE_CUMULATIVE_THRESHOLDS[clamped] ?? 0;
    handleSliderChange(targetPoints);
  };

  const handleSaveToDatabase = async () => {
    if (!onSaveDbPoints) return;
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await onSaveDbPoints(sliderPoints);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-slate-950/95 backdrop-blur-2xl border-l border-amber-500/30 shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col justify-between p-4 text-white animate-slideInRight select-none overflow-y-auto">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-amber-500/20">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            <div>
              <h2 className="text-sm font-bold tracking-wider text-amber-300 uppercase">
                Bronze Constellation Dev Inspector
              </h2>
              <p className="text-[11px] font-mono text-slate-400">Node illumination & state tester</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Quick Full Display Toggle Banner */}
        <div className="my-3 p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40 flex items-center justify-between shadow-inner">
          <div className="space-y-0.5">
            <div className="text-xs font-semibold text-amber-200">Full Constellation Display Mode</div>
            <div className="text-[11px] text-amber-400/80">Illuminates all {TOTAL_BOOK_NODES} nodes instantly</div>
          </div>
          <button
            onClick={() => onToggleForceFull(!forceFullDisplay)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
              forceFullDisplay
                ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.6)]'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            {forceFullDisplay ? `ON (All ${TOTAL_BOOK_NODES} Nodes)` : 'OFF (Real Nodes)'}
          </button>
        </div>

        {/* Current State Summary */}
        <div className="p-3 rounded-xl bg-slate-900/90 border border-amber-500/20 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 uppercase font-mono">Simulated Node</span>
            <span className="text-sm font-bold text-amber-300">
              Node {currentState.unlockedNodeCount} / {TOTAL_BOOK_NODES}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 uppercase font-mono">Points</span>
            <span className="text-sm font-mono text-amber-200">
              {sliderPoints} / {MAX_BOOK_POINTS} pts ({currentState.completionPercent}%)
            </span>
          </div>
        </div>

        {/* Points Slider */}
        <div className="my-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <label htmlFor="points-slider" className="text-slate-300 font-medium">Scrub Resonance Points:</label>
            <span className="font-mono text-amber-400">{sliderPoints} pts</span>
          </div>
          <input
            id="points-slider"
            type="range"
            min={0}
            max={MAX_BOOK_POINTS}
            step={1}
            value={sliderPoints}
            onChange={(e) => handleSliderChange(parseInt(e.target.value, 10))}
            className="w-full accent-amber-400 cursor-pointer h-2 bg-slate-800 rounded-lg appearance-none"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>Node 1 (0 pts)</span>
            <span>Node 17 ({NODE_CUMULATIVE_THRESHOLDS[17]} pts)</span>
            <span>Node {TOTAL_BOOK_NODES} ({MAX_BOOK_POINTS} pts)</span>
          </div>
        </div>

        {/* Quick Jump Buttons */}
        <div className="space-y-1.5">
          <span className="text-xs text-slate-400">Quick Milestone Jump:</span>
          <div className="grid grid-cols-4 gap-1.5">
            {[1, 10, 20, 34].map((nodeNum) => (
              <button
                key={nodeNum}
                onClick={() => handleJumpToNode(nodeNum)}
                className={`py-1.5 px-2 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                  currentState.unlockedNodeCount === nodeNum
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                Node {nodeNum}
              </button>
            ))}
          </div>
        </div>

        {/* Activity Completion Simulation Controls */}
        {activities && activities.length > 0 && onToggleActivity && (
          <div className="my-4 space-y-2">
            <span className="text-xs text-slate-400 font-medium">Simulate Ways to Earn Completion:</span>
            <div className="space-y-1.5 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
              {activities.map((act) => (
                <label
                  key={act.id}
                  className="flex items-center justify-between text-xs cursor-pointer hover:bg-slate-800/60 p-1 rounded transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={act.isCompleted}
                      onChange={(e) => onToggleActivity(act.id, e.target.checked)}
                      className="accent-amber-400 rounded cursor-pointer"
                    />
                    <span className={act.isCompleted ? 'text-slate-500 line-through' : 'text-slate-200'}>
                      {act.label}
                    </span>
                  </div>
                  <span className={act.isCompleted ? 'text-slate-600 font-mono text-[11px]' : 'text-amber-400 font-mono text-[11px]'}>
                    +{act.points} pts
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="pt-4 border-t border-slate-800/80 space-y-2">
        {onSaveDbPoints && (
          <button
            onClick={handleSaveToDatabase}
            disabled={isSaving}
            className="w-full py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-slate-950 font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(245,158,11,0.3)]"
          >
            {isSaving ? (
              <span>Saving...</span>
            ) : saveSuccess ? (
              <span>Saved to Database!</span>
            ) : (
              <span>Save {sliderPoints} Pts to Database</span>
            )}
          </button>
        )}

        <button
          onClick={() => {
            setSliderPoints(realPoints);
            onResetToReal();
          }}
          className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-medium text-xs transition-colors cursor-pointer"
        >
          Reset to Real Saved Progress ({realPoints} pts)
        </button>
      </div>
    </div>
  );
};
