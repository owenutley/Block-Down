import { useState } from 'react';
import { calculateRelicProgress, RelicProgressState, PlayerProgressionRawData, RELIC_TIERS, RelicTier } from '../../shared/relicProgress';

export interface RelicModTesterDrawerProps {
  currentProgressState: RelicProgressState;
  realData: PlayerProgressionRawData;
  onApplyProgressState: (state: RelicProgressState) => void;
  onResetToReal: () => void;
  onClose: () => void;
}

export const RelicModTesterDrawer = ({
  currentProgressState,
  realData,
  onApplyProgressState,
  onResetToReal,
  onClose,
}: RelicModTesterDrawerProps) => {
  const [sliderPct, setSliderPct] = useState<number>(currentProgressState.overallProgress);
  const [activeTab, setActiveTab] = useState<'quick' | 'fine'>('fine');

  const [customStats, setCustomStats] = useState<PlayerProgressionRawData>({
    dailyStreak: realData.dailyStreak ?? 0,
    dailyPuzzlesSolved: realData.dailyPuzzlesSolved ?? realData.totalPuzzlesSolved ?? 0,
    campaignSolvedCount: realData.campaignSolvedCount ?? 0,
    purchasedItemsCount: realData.purchasedItemsCount ?? 0,
    weeklyAwardsCount: realData.weeklyAwardsCount ?? 0,
    puzzlesCreatedCount: realData.puzzlesCreatedCount ?? 0,
  });

  // Apply quick proportional percentage (0% to 100%) to all 6 faces simultaneously
  const handleQuickSliderChange = (pct: number) => {
    setSliderPct(pct);
    const factor = pct / 100;
    const simulatedData: PlayerProgressionRawData = {
      dailyStreak: Math.round(30 * factor),
      dailyPuzzlesSolved: Math.round(20 * factor),
      campaignSolvedCount: Math.round(20 * factor),
      purchasedItemsCount: Math.round(6 * factor),
      weeklyAwardsCount: Math.round(5 * factor),
      puzzlesCreatedCount: Math.round(20 * factor),
    };
    setCustomStats(simulatedData);
    const newState = calculateRelicProgress(simulatedData);
    onApplyProgressState(newState);
  };

  const handleTierJump = (tier: RelicTier) => {
    const targetPercentages: Record<RelicTier, number> = {
      0: 0,
      1: 25,
      2: 50,
      3: 75,
      4: 100,
    };
    handleQuickSliderChange(targetPercentages[tier]);
  };

  const handleCustomFieldChange = (field: keyof PlayerProgressionRawData, value: number) => {
    const updated = { ...customStats, [field]: value };
    setCustomStats(updated);
    const calculated = calculateRelicProgress(updated);
    setSliderPct(calculated.overallProgress);
    onApplyProgressState(calculated);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-slate-950/95 backdrop-blur-2xl border-l border-cyan-500/30 shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col justify-between p-4 text-white animate-slideInRight select-none">
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚙️</span>
            <div>
              <h2 className="text-sm font-black tracking-wider text-amber-400 uppercase">
                Chronolith Growth Tester
              </h2>
              <p className="text-[10px] font-mono text-zinc-400">6-Face Appearance Simulator</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Current State Summary Pill */}
        <div className="my-3 p-3 rounded-xl bg-slate-900/90 border border-cyan-500/30 flex items-center justify-between shadow-inner">
          <div>
            <div className="text-[10px] font-mono uppercase text-zinc-400">Overall Monolith Tier</div>
            <div className="text-sm font-black text-cyan-300">
              Tier {currentProgressState.activeTier}: {currentProgressState.tierInfo.name}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-mono uppercase text-zinc-400">Total Awakened</div>
            <div className="text-lg font-black font-mono text-white">
              {currentProgressState.overallProgress}%
            </div>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex rounded-lg bg-slate-900 p-1 mb-3 border border-white/10 text-xs font-mono">
          <button
            onClick={() => setActiveTab('fine')}
            className={`flex-1 py-1.5 rounded-md font-bold transition-all cursor-pointer ${
              activeTab === 'fine' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            6 Face Sliders
          </button>
          <button
            onClick={() => setActiveTab('quick')}
            className={`flex-1 py-1.5 rounded-md font-bold transition-all cursor-pointer ${
              activeTab === 'quick' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Quick 0-100%
          </button>
        </div>

        {/* TAB 1: 6 Individual Face Sliders */}
        {activeTab === 'fine' && (
          <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
            {/* 🔴 RED FACE: Daily Streak */}
            <div className="p-2.5 rounded-xl bg-red-950/20 border border-red-500/30 space-y-1">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-red-400 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  🔴 Red: Daily Streak
                </span>
                <span className="text-red-300 font-bold font-mono">
                  {customStats.dailyStreak}/30 days ({currentProgressState.faces.red.progressPercent}%)
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={30}
                value={customStats.dailyStreak}
                onChange={(e) => handleCustomFieldChange('dailyStreak', Number(e.target.value))}
                className="w-full accent-red-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="text-[9px] font-mono text-zinc-400">
                Stage: {currentProgressState.faces.red.stageDescription}
              </div>
            </div>

            {/* 🔵 BLUE FACE: Daily Puzzles Solved */}
            <div className="p-2.5 rounded-xl bg-blue-950/20 border border-blue-500/30 space-y-1">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-blue-400 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  🔵 Blue: Daily Puzzles (1/2 Goal)
                </span>
                <span className="text-blue-300 font-bold font-mono">
                  {customStats.dailyPuzzlesSolved}/{currentProgressState.faces.blue.targetValue} ({currentProgressState.faces.blue.progressPercent}%)
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={Math.max(10, currentProgressState.faces.blue.targetValue)}
                value={customStats.dailyPuzzlesSolved}
                onChange={(e) => handleCustomFieldChange('dailyPuzzlesSolved', Number(e.target.value))}
                className="w-full accent-blue-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="text-[9px] font-mono text-zinc-400">
                Stage: {currentProgressState.faces.blue.stageDescription}
              </div>
            </div>

            {/* 🟡 YELLOW FACE: Campaign Mastery */}
            <div className="p-2.5 rounded-xl bg-yellow-950/20 border border-yellow-500/30 space-y-1">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-yellow-400 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-yellow-500" />
                  🟡 Yellow: Campaign
                </span>
                <span className="text-yellow-300 font-bold font-mono">
                  {customStats.campaignSolvedCount}/20 ({currentProgressState.faces.yellow.progressPercent}%)
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={20}
                value={customStats.campaignSolvedCount}
                onChange={(e) => handleCustomFieldChange('campaignSolvedCount', Number(e.target.value))}
                className="w-full accent-yellow-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="text-[9px] font-mono text-zinc-400">
                Stage: {currentProgressState.faces.yellow.stageDescription}
              </div>
            </div>

            {/* 🟢 GREEN FACE: Shop / Purchased Items */}
            <div className="p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-1">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  🟢 Green: Shop Items
                </span>
                <span className="text-emerald-300 font-bold font-mono">
                  {customStats.purchasedItemsCount}/6 ({currentProgressState.faces.green.progressPercent}%)
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={6}
                value={customStats.purchasedItemsCount}
                onChange={(e) => handleCustomFieldChange('purchasedItemsCount', Number(e.target.value))}
                className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="text-[9px] font-mono text-zinc-400">
                Stage: {currentProgressState.faces.green.stageDescription}
              </div>
            </div>

            {/* 🟠 ORANGE FACE: Weekly Accomplishments */}
            <div className="p-2.5 rounded-xl bg-orange-950/20 border border-orange-500/30 space-y-1">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-orange-400 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-orange-500" />
                  🟠 Orange: Weekly Awards
                </span>
                <span className="text-orange-300 font-bold font-mono">
                  {customStats.weeklyAwardsCount}/5 ({currentProgressState.faces.orange.progressPercent}%)
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={5}
                value={customStats.weeklyAwardsCount}
                onChange={(e) => handleCustomFieldChange('weeklyAwardsCount', Number(e.target.value))}
                className="w-full accent-orange-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="text-[9px] font-mono text-zinc-400">
                Stage: {currentProgressState.faces.orange.stageDescription}
              </div>
            </div>

            {/* 🟣 PURPLE FACE: Building Puzzles */}
            <div className="p-2.5 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-1">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-purple-400 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-500" />
                  🟣 Purple: Puzzle Maker
                </span>
                <span className="text-purple-300 font-bold font-mono">
                  {customStats.puzzlesCreatedCount}/20 ({currentProgressState.faces.purple.progressPercent}%)
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={20}
                value={customStats.puzzlesCreatedCount}
                onChange={(e) => handleCustomFieldChange('puzzlesCreatedCount', Number(e.target.value))}
                className="w-full accent-purple-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="text-[9px] font-mono text-zinc-400">
                Stage: {currentProgressState.faces.purple.stageDescription}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Quick Master Slider & Tier Presets */}
        {activeTab === 'quick' && (
          <div className="space-y-4">
            <div className="space-y-2 p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-zinc-300 font-bold">Synchronous 6-Face Slider</span>
                <span className="text-amber-300 font-bold text-sm">{sliderPct}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={sliderPct}
                onChange={(e) => handleQuickSliderChange(Number(e.target.value))}
                className="w-full accent-cyan-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[9px] font-mono text-zinc-500">
                <span>0% (Raw Slate)</span>
                <span>50%</span>
                <span>100% (Ascended)</span>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-mono uppercase text-zinc-400 block mb-1.5">
                Jump to Tier Presets
              </label>
              <div className="grid grid-cols-1 gap-1.5">
                {([0, 1, 2, 3, 4] as RelicTier[]).map((t) => {
                  const info = RELIC_TIERS[t];
                  const isCurrent = currentProgressState.activeTier === t;
                  return (
                    <button
                      key={t}
                      onClick={() => handleTierJump(t)}
                      className={`w-full py-1.5 px-3 rounded-lg border text-left text-xs font-mono transition-all flex items-center justify-between cursor-pointer ${
                        isCurrent
                          ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-sm'
                          : 'bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10'
                      }`}
                    >
                      <span className="font-bold">
                        Tier {t}: {info.name}
                      </span>
                      <span className="text-[10px] text-zinc-400">{info.subtitle}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Action Buttons */}
      <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
        <button
          onClick={() => {
            setCustomStats({ ...realData });
            const realState = calculateRelicProgress(realData);
            setSliderPct(realState.overallProgress);
            onResetToReal();
          }}
          className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-98 text-xs font-mono text-zinc-300 hover:text-white border border-white/10 transition-all cursor-pointer flex items-center justify-center gap-1.5"
        >
          <span>↺</span>
          <span>Reset to Live User Data</span>
        </button>
      </div>
    </div>
  );
};
