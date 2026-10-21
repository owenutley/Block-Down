import { useState, useEffect } from 'react';
import { trpc } from '../../trpc';
import { showToast } from '@devvit/web/client';
import { LichtenbergBookCanvas } from './LichtenbergBookCanvas';
import { LichtenbergProgressCard } from './LichtenbergProgressCard';
import {
  TOTAL_BOOK_NODES,
  MAX_BOOK_POINTS,
  NODE_CUMULATIVE_THRESHOLDS,
  calculateBookProgressState,
  BookProgressState,
  DAILY_PUZZLE_BOOK_POINTS,
  SLIDE_MATCH_BOOK_POINTS,
  DAILY_STREAK_BOOK_POINTS,
  SURVEY_VOTE_BOOK_POINTS,
  PUZZLE_CREATED_BOOK_POINTS,
} from '../../../shared/lichtenbergProgress';

export const LichtenbergDevPanel = () => {
  const [realPoints, setRealPoints] = useState<number>(0);
  const [activePoints, setActivePoints] = useState<number>(0);
  const [forceFullDisplay, setForceFullDisplay] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  const fetchProgress = async () => {
    try {
      setLoading(true);
      const data = await trpc.book.getProgress.query();
      if (data) {
        setRealPoints(data.totalPoints);
        setActivePoints(data.totalPoints);
      }
    } catch (err) {
      console.error('Failed to load book progress in dev panel:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchProgress();
  }, []);

  const currentState: BookProgressState = calculateBookProgressState(activePoints);

  const handleSliderChange = (points: number) => {
    const clamped = Math.max(0, Math.min(MAX_BOOK_POINTS, points));
    setActivePoints(clamped);
  };

  const handleJumpToNode = (nodeIndex: number) => {
    const clamped = Math.max(1, Math.min(TOTAL_BOOK_NODES, nodeIndex));
    const targetPoints = NODE_CUMULATIVE_THRESHOLDS[clamped] ?? 0;
    setActivePoints(targetPoints);
  };

  const handleAdjustPoints = (delta: number) => {
    const next = Math.max(0, Math.min(MAX_BOOK_POINTS, activePoints + delta));
    setActivePoints(next);
  };

  const handleSaveToDatabase = async () => {
    try {
      setSaving(true);
      await trpc.book.devSetPoints.mutate({ points: activePoints });
      setRealPoints(activePoints);
      showToast({ text: `Saved ${activePoints} points to database!` });
    } catch (err) {
      console.error('Failed to save book points:', err);
      showToast({ text: 'Error saving points to database' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400 font-mono text-sm">
        Loading Bronze Constellation progress...
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full text-left font-sans">
      {/* Left Column: Visual Preview Canvas & Progress Card */}
      <div className="lg:col-span-6 flex flex-col items-center gap-5 bg-slate-950/80 rounded-2xl p-6 border border-amber-500/30 shadow-[0_0_30px_rgba(217,119,6,0.15)]">
        <div className="w-full flex items-center justify-between pb-3 border-b border-amber-500/20">
          <div>
            <span className="text-xs uppercase tracking-wider text-amber-400 font-bold font-mono">
              Visual Canvas Preview
            </span>
            <h3 className="text-lg font-bold text-white mt-0.5">Celestial Steed</h3>
          </div>

          {/* Toggle Full Display Button */}
          <button
            onClick={() => setForceFullDisplay(!forceFullDisplay)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono border transition-all cursor-pointer ${
              forceFullDisplay
                ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                : 'bg-slate-900 text-amber-300 border-amber-500/40 hover:bg-slate-800'
            }`}
          >
            {forceFullDisplay ? `Full Preview: ACTIVE (${TOTAL_BOOK_NODES}/${TOTAL_BOOK_NODES})` : `Preview Full Constellation (${TOTAL_BOOK_NODES} Nodes)`}
          </button>
        </div>

        {/* SVG Canvas */}
        <div className="w-full max-w-[400px] aspect-[400/280] flex items-center justify-center">
          <LichtenbergBookCanvas
            unlockedNodeCount={currentState.unlockedNodeCount}
            totalPoints={activePoints}
            forceFullDisplay={forceFullDisplay}
          />
        </div>

        {/* HUD Progress Card */}
        <div className="w-full">
          <LichtenbergProgressCard
            progress={currentState}
            forceFullDisplay={forceFullDisplay}
          />
        </div>
      </div>

      {/* Right Column: Node Scrubber & Testing Controls */}
      <div className="lg:col-span-6 space-y-6">
        {/* Scrubber Card */}
        <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-xl space-y-5">
          <div className="flex items-center justify-between">
            <h4 className="text-base font-bold text-white">Node & Points Scrubber</h4>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
              Node {currentState.unlockedNodeCount} / {TOTAL_BOOK_NODES}
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <label htmlFor="dev-pts-slider">Simulated Points:</label>
              <span className="font-mono text-amber-400 font-bold">{activePoints} / {MAX_BOOK_POINTS} pts</span>
            </div>
            <input
              id="dev-pts-slider"
              type="range"
              min={0}
              max={MAX_BOOK_POINTS}
              step={1}
              value={activePoints}
              onChange={(e) => handleSliderChange(parseInt(e.target.value, 10))}
              className="w-full accent-amber-400 cursor-pointer h-2 bg-slate-800 rounded-lg appearance-none"
            />
            <div className="flex justify-between text-[11px] text-slate-500 font-mono">
              <span>0 (Node 1)</span>
              <span>{NODE_CUMULATIVE_THRESHOLDS[17]} (Node 17)</span>
              <span>{MAX_BOOK_POINTS} (Node {TOTAL_BOOK_NODES})</span>
            </div>
          </div>

          {/* Quick Node Milestone Jumps */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-400">Jump to Node Milestone:</span>
            <div className="grid grid-cols-4 gap-2">
              {[1, 10, 20, 34].map((node) => (
                <button
                  key={node}
                  onClick={() => handleJumpToNode(node)}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                    currentState.unlockedNodeCount === node
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                  }`}
                >
                  Node {node}
                </button>
              ))}
            </div>
          </div>

          {/* Simulate Activity Points Earning */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <span className="text-xs font-semibold text-slate-400">Simulate Gameplay Point Grants:</span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                onClick={() => handleAdjustPoints(DAILY_PUZZLE_BOOK_POINTS)}
                className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-medium text-amber-300 text-left transition-colors cursor-pointer"
              >
                +20 Daily Puzzle
              </button>
              <button
                onClick={() => handleAdjustPoints(SLIDE_MATCH_BOOK_POINTS)}
                className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-medium text-amber-300 text-left transition-colors cursor-pointer"
              >
                +10 Slide Match
              </button>
              <button
                onClick={() => handleAdjustPoints(DAILY_STREAK_BOOK_POINTS)}
                className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-medium text-amber-300 text-left transition-colors cursor-pointer"
              >
                +5 Daily Streak
              </button>
              <button
                onClick={() => handleAdjustPoints(SURVEY_VOTE_BOOK_POINTS)}
                className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-medium text-amber-300 text-left transition-colors cursor-pointer"
              >
                +15 Survey Vote
              </button>
              <button
                onClick={() => handleAdjustPoints(PUZZLE_CREATED_BOOK_POINTS)}
                className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-medium text-amber-300 text-left transition-colors cursor-pointer col-span-2 sm:col-span-2"
              >
                +30 Created Puzzle
              </button>
            </div>
          </div>
        </div>

        {/* Database Persistence Card */}
        <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4">
          <h4 className="text-base font-bold text-white">Database Synchronization</h4>
          <p className="text-xs text-slate-400">
            Real saved points in Redis database: <strong className="text-amber-300 font-mono">{realPoints} pts</strong>.
            You can permanently overwrite your developer account points to test live player progression.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <button
              onClick={handleSaveToDatabase}
              disabled={saving}
              className="flex-1 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-slate-950 font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.3)]"
            >
              {saving ? 'Saving...' : `Save ${activePoints} Pts to Database`}
            </button>

            <button
              onClick={() => setActivePoints(realPoints)}
              className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-medium text-xs transition-colors cursor-pointer"
            >
              Reset to Saved ({realPoints} pts)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
