import { useRef, useCallback, memo, type PointerEvent } from 'react';

export type DevConstellationSliderProps = {
  currentNode: number;
  totalNodes: number;
  realNode: number;
  isSimulated: boolean;
  onNodeChange: (node: number) => void;
  onReset: () => void;
  onClose?: () => void;
};

export const DevConstellationSlider = memo(({
  currentNode,
  totalNodes,
  realNode,
  isSimulated,
  onNodeChange,
  onReset,
  onClose,
}: DevConstellationSliderProps) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef<boolean>(false);

  // Calculate node based on clientY relative to track top/bottom
  // Top = Node 1, Bottom = totalNodes (sliding down adds nodes)
  const resolveNodeFromY = useCallback((clientY: number) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    if (rect.height <= 0) return;

    const ratio = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
    const targetNode = Math.round(1 + ratio * (totalNodes - 1));
    const clamped = Math.max(1, Math.min(totalNodes, targetNode));
    onNodeChange(clamped);
  }, [totalNodes, onNodeChange]);

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    isDraggingRef.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    resolveNodeFromY(e.clientY);
  };

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    resolveNodeFromY(e.clientY);
  };

  const handlePointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  // Percentage from top (0% at Node 1, 100% at totalNodes)
  const percent = totalNodes > 1
    ? Math.max(0, Math.min(100, ((currentNode - 1) / (totalNodes - 1)) * 100))
    : 100;

  return (
    <div className="flex flex-col items-center gap-1.5 p-2 rounded-2xl bg-slate-950/90 backdrop-blur-xl border border-amber-500/40 shadow-[0_4px_30px_rgba(0,0,0,0.8),0_0_20px_rgba(245,158,11,0.25)] select-none animate-fadeIn">
      {/* Header with Close */}
      <div className="w-full flex items-center justify-between gap-1 pb-1 border-b border-amber-500/20">
        <span className="text-[9px] font-mono font-bold text-amber-400 uppercase tracking-widest pl-0.5">
          Dev
        </span>
        {onClose && (
          <button
            onClick={onClose}
            className="w-4 h-4 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer text-xs leading-none"
            title="Hide Dev Slider"
            aria-label="Close"
          >
            &times;
          </button>
        )}
      </div>

      {/* Node Counter Pill */}
      <div className="flex flex-col items-center py-0.5">
        <span className="text-[11px] font-mono font-black text-amber-200 tracking-tight">
          {currentNode}
          <span className="text-[9px] font-medium text-amber-400/70">/{totalNodes}</span>
        </span>
        <span className="text-[8px] font-mono text-slate-400 uppercase -mt-0.5">
          {currentNode >= totalNodes ? 'Awakened' : 'Star'}
        </span>
      </div>

      {/* Vertical Slider Track Container */}
      <div
        ref={trackRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="relative h-36 sm:h-44 w-7 flex items-center justify-center cursor-pointer touch-none py-2"
        title="Slide down to add nodes until completion"
      >
        {/* Track Bar Background */}
        <div className="w-2 h-full bg-slate-900 rounded-full border border-amber-500/30 overflow-hidden relative shadow-inner">
          {/* Active Fill from Top to Thumb */}
          <div
            className="w-full bg-gradient-to-b from-amber-600 via-amber-400 to-amber-200 transition-all duration-75 shadow-[0_0_8px_rgba(245,158,11,0.8)]"
            style={{ height: `${percent}%` }}
          />
        </div>

        {/* Milestone Indicator Ticks */}
        <div className="absolute left-0 right-0 top-2 bottom-2 pointer-events-none flex flex-col justify-between items-center opacity-30">
          <div className="w-3.5 h-[1px] bg-amber-200" />
          <div className="w-2.5 h-[1px] bg-amber-200" />
          <div className="w-2.5 h-[1px] bg-amber-200" />
          <div className="w-3.5 h-[1px] bg-amber-200" />
        </div>

        {/* Draggable Thumb */}
        <div
          className="absolute left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 border-2 border-slate-950 shadow-[0_0_12px_rgba(245,158,11,0.9)] flex items-center justify-center transition-transform hover:scale-110 active:scale-95 cursor-grab active:cursor-grabbing pointer-events-none"
          style={{ top: `calc(8px + (100% - 16px) * ${percent / 100} - 12px)` }}
        >
          <span className="text-[10px] text-slate-950 font-black leading-none select-none">
            ✦
          </span>
        </div>
      </div>

      {/* Reset Button */}
      <button
        onClick={onReset}
        disabled={!isSimulated}
        className={`w-full py-1 px-1.5 rounded-lg border text-[10px] font-mono font-bold transition-all flex flex-col items-center gap-0.5 cursor-pointer ${
          isSimulated
            ? 'bg-amber-500/20 hover:bg-amber-500/30 border-amber-400 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.25)] active:scale-95'
            : 'bg-slate-900/40 border-slate-800 text-slate-600 cursor-not-allowed opacity-50'
        }`}
        title={isSimulated ? `Reset to real progress (Node ${realNode})` : 'Already at real progress'}
      >
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <span className="text-[9px] uppercase tracking-wider font-semibold">Reset</span>
      </button>
    </div>
  );
});
