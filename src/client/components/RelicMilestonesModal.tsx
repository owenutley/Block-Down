import { RelicProgressState, RELIC_TIERS } from '../../shared/relicProgress';
import { ThemeId } from '../../shared/themes';

export interface RelicMilestonesModalProps {
  progressState: RelicProgressState;
  activeTheme?: ThemeId;
  onClose: () => void;
}

export const RelicMilestonesModal = ({
  progressState,
  onClose,
}: RelicMilestonesModalProps) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-md max-h-[90vh] flex flex-col bg-slate-900/95 border border-white/20 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden font-sans text-white">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-gradient-to-b from-white/5 to-transparent">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm border shadow-lg bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-cyan-500/30">
              ✦
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                Chronolith Growth Chart
              </h2>
              <p className="text-xs font-mono text-zinc-400">
                {progressState.tierInfo.name} • {progressState.overallProgress}% Overall Awakened
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-all cursor-pointer text-lg font-bold"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
          {/* Current Tier Lore Banner */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-900 border border-white/10 relative overflow-hidden">
            <div className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold mb-0.5">
              Monolith State • Tier {progressState.activeTier} / 4
            </div>
            <div className="text-sm font-extrabold text-white mb-1">
              {progressState.tierInfo.subtitle}
            </div>
            <p className="text-zinc-300 leading-relaxed text-[11px]">
              {progressState.tierInfo.description}
            </p>
          </div>

          {/* Tier 4 Master Reward Banner */}
          <div
            className={`p-3 rounded-2xl border flex items-center gap-3 transition-all ${
              progressState.overallProgress >= 100
                ? 'bg-gradient-to-r from-cyan-950/80 via-indigo-950/80 to-purple-950/80 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)]'
                : 'bg-slate-800/40 border-white/10'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center shrink-0 shadow-md">
              <span className="text-lg">✦</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-white text-xs">Chronolith Theme & Sovereign Character</span>
                {progressState.overallProgress >= 100 ? (
                  <span className="text-[9px] font-mono font-black uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    Unlocked
                  </span>
                ) : (
                  <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-white/5 text-zinc-400 border border-white/10">
                    100% Reward
                  </span>
                )}
              </div>
              <p className="text-[10px] text-zinc-400 truncate mt-0.5">
                {progressState.overallProgress >= 100
                  ? 'Permanently unlocked in your shop & inventory!'
                  : 'Awaken all 6 sides to 100% to permanently unlock this mythic playable theme & character.'}
              </p>
            </div>
          </div>

          {/* Tier Milestones Roadmap */}
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-bold mb-2">
              Ascension Roadmap
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {([0, 1, 2, 3, 4] as const).map((tierIdx) => {
                const info = RELIC_TIERS[tierIdx];
                const isUnlocked = progressState.activeTier >= tierIdx;
                const isCurrent = progressState.activeTier === tierIdx;

                return (
                  <div
                    key={tierIdx}
                    className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center justify-center ${
                      isCurrent
                        ? 'border-cyan-400 bg-cyan-500/20 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                        : isUnlocked
                          ? 'border-emerald-500/50 bg-emerald-950/30 text-emerald-300'
                          : 'border-white/5 bg-white/5 text-zinc-600 opacity-60'
                    }`}
                  >
                    <span className="text-[10px] font-mono font-bold">T{tierIdx}</span>
                    <span className="text-[9px] font-black truncate max-w-full mt-0.5">{info.name.split(' ')[0]}</span>
                    <span className="text-[8px] font-mono opacity-80">{info.minProgress}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 6 Colored Faces Pillar Growth Chart */}
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-bold mb-2">
              The 6 Relic Faces (Growth Pillars)
            </div>

            <div className="space-y-2">
              {progressState.milestones.map((m) => (
                <div
                  key={m.id}
                  className="p-3 rounded-2xl bg-slate-800/60 border border-white/10 hover:border-white/20 transition-all flex flex-col gap-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-white text-xs flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full border shadow-sm"
                        style={{
                          backgroundColor: m.colorHex,
                          borderColor: '#ffffff55',
                          boxShadow: `0 0 8px ${m.colorHex}`,
                        }}
                      />
                      <span>{m.title}</span>
                    </div>
                    <span className="font-mono text-[11px] font-bold text-zinc-200">
                      {m.pointsEarned}% Awakened
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-zinc-400">
                    <span>{m.progressText}</span>
                    <span
                      className="text-[10px] font-mono px-1.5 py-0.5 rounded border"
                      style={{
                        color: m.colorHex,
                        backgroundColor: `${m.colorHex}22`,
                        borderColor: `${m.colorHex}55`,
                      }}
                    >
                      {m.unlockedVisual}
                    </span>
                  </div>

                  {/* Progress bar matching face color */}
                  <div className="w-full h-1.5 rounded-full bg-slate-950 overflow-hidden mt-0.5">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${m.pointsEarned}%`,
                        backgroundColor: m.colorHex,
                        boxShadow: `0 0 8px ${m.colorHex}`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-white/10 bg-slate-950/60 flex items-center justify-between">
          <span className="text-[11px] text-zinc-400 font-mono">
            Each side awakens with your achievements!
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs cursor-pointer active:scale-95 transition-all shadow-md"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
