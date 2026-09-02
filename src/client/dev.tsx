import React, { useEffect, useState, useMemo } from 'react';
import { trpc } from './trpc';
import { showToast } from '@devvit/web/client';
import { Puzzle, PuzzleDifficulty } from '../shared/types';
import { cn } from './utils';
import { playWinMelody } from './utils/audio';
import { dirToVector, getNextPosWithPortalsDetails } from './utils/puzzle';
import { THEMES, CHARACTERS } from '../shared/themes';

import { TutorialPage } from '../shared/types';

type DevTab = 'daily' | 'easy' | 'medium' | 'hard' | 'howto' | 'currency' | 'posts' | 'devs' | 'skins';

const MONTH_NAMES: Record<string, string> = {
  '01': 'January',
  '02': 'February',
  '03': 'March',
  '04': 'April',
  '05': 'May',
  '06': 'June',
  '07': 'July',
  '08': 'August',
  '09': 'September',
  '10': 'October',
  '11': 'November',
  '12': 'December',
};

const getBlockColorClass = (colorName: string) => {
  const c = colorName.toLowerCase();
  if (c === 'red') return 'bg-red-500 text-white';
  if (c === 'blue') return 'bg-blue-500 text-white';
  if (c === 'yellow') return 'bg-yellow-400 text-black';
  if (c === 'purple') return 'bg-purple-500 text-white';
  if (c === 'green') return 'bg-green-500 text-white';
  if (c === 'orange') return 'bg-orange-500 text-white';
  return 'bg-gray-400 text-black';
};

const getTargetColorClass = (colorName: string) => {
  const c = colorName.toLowerCase();
  if (c === 'red') return 'border-2 border-dashed border-red-500 bg-red-500/20';
  if (c === 'blue') return 'border-2 border-dashed border-blue-500 bg-blue-500/20';
  if (c === 'yellow') return 'border-2 border-dashed border-yellow-400 bg-yellow-400/20';
  if (c === 'purple') return 'border-2 border-dashed border-purple-500 bg-purple-500/20';
  if (c === 'green') return 'border-2 border-dashed border-green-500 bg-green-500/20';
  if (c === 'orange') return 'border-2 border-dashed border-orange-500 bg-orange-500/20';
  return 'border-2 border-dashed border-white bg-white/20';
};

const PuzzlePreview = ({ puzzle }: { puzzle: Puzzle }) => {
  const wallSet = new Set(puzzle.walls.map((w) => `${w.x},${w.y}`));
  const targetMap = new Map(puzzle.targets.map((t) => [`${t.x},${t.y}`, t]));
  const blockMap = new Map(puzzle.blocks.map((b) => [`${b.x},${b.y}`, b]));

  const maxDim = Math.max(puzzle.width, puzzle.height);
  const containerSize = 90; // total target size in px
  const cellSize = Math.max(6, Math.floor((containerSize - maxDim * 0.5) / maxDim));

  const playerSize = Math.max(3, Math.floor(cellSize * 0.6));
  const blockSize = Math.max(3, Math.floor(cellSize * 0.6));
  const targetSize = Math.max(3, Math.floor(cellSize * 0.5));

  const getCellStyles = (x: number, y: number) => {
    const key = `${x},${y}`;
    if (wallSet.has(key)) return 'bg-gray-700';
    return 'bg-gray-900/60';
  };

  const renderCellContent = (x: number, y: number) => {
    const key = `${x},${y}`;
    if (puzzle.player.x === x && puzzle.player.y === y) {
      return (
        <div
          className="rounded-full bg-white shadow-[0_0_2px_rgba(255,255,255,0.8)]"
          style={{ width: `${playerSize}px`, height: `${playerSize}px` }}
        />
      );
    }
    const block = blockMap.get(key);
    if (block) {
      const color = block.color.toLowerCase();
      let colorClass = 'bg-white';
      if (color === 'red') colorClass = 'bg-red-500';
      else if (color === 'blue') colorClass = 'bg-blue-500';
      else if (color === 'yellow') colorClass = 'bg-yellow-400';
      else if (color === 'purple') colorClass = 'bg-purple-500';
      else if (color === 'green') colorClass = 'bg-green-500';
      else if (color === 'orange') colorClass = 'bg-orange-500';
      else if (color === 'gray' || color === 'grey') colorClass = 'bg-gray-400';
      return (
        <div
          className={`rounded-sm ${colorClass}`}
          style={{ width: `${blockSize}px`, height: `${blockSize}px` }}
        />
      );
    }
    const target = targetMap.get(key);
    if (target) {
      const color = target.color.toLowerCase();
      let borderClass = 'border border-dashed border-white';
      if (color === 'red') borderClass = 'border border-dashed border-red-500 bg-red-500/20';
      else if (color === 'blue') borderClass = 'border border-dashed border-blue-500 bg-blue-500/20';
      else if (color === 'yellow') borderClass = 'border border-dashed border-yellow-400 bg-yellow-400/20';
      else if (color === 'purple') borderClass = 'border border-dashed border-purple-500 bg-purple-500/20';
      else if (color === 'green') borderClass = 'border border-dashed border-green-500 bg-green-500/20';
      else if (color === 'orange') borderClass = 'border border-dashed border-orange-500 bg-orange-500/20';
      return (
        <div
          className={`rounded-sm ${borderClass}`}
          style={{ width: `${targetSize}px`, height: `${targetSize}px` }}
        />
      );
    }
    return null;
  };

  return (
    <div
      className="grid bg-black/60 p-1 rounded-lg border border-gray-700 shrink-0"
      style={{
        gridTemplateColumns: `repeat(${puzzle.width}, 1fr)`,
        gap: '1px',
        width: `${cellSize * puzzle.width + (puzzle.width - 1) + 10}px`,
        height: `${cellSize * puzzle.height + (puzzle.height - 1) + 10}px`,
      }}
    >
      {Array.from({ length: puzzle.width * puzzle.height }).map((_, i) => {
        const x = i % puzzle.width;
        const y = Math.floor(i / puzzle.width);
        return (
          <div
            key={i}
            className={`flex items-center justify-center rounded-sm ${getCellStyles(x, y)}`}
            style={{ width: `${cellSize}px`, height: `${cellSize}px` }}
          >
            {renderCellContent(x, y)}
          </div>
        );
      })}
    </div>
  );
};

const PuzzleDetailCard = ({
  puzzle,
  onEdit,
  onDelete,
  onClone,
  confirmDeleteId,
  setConfirmDeleteId,
}: {
  puzzle: Puzzle;
  onEdit: () => void;
  onDelete: () => void;
  onClone: (puzzle: Puzzle, target: PuzzleDifficulty) => void;
  confirmDeleteId: string | null;
  setConfirmDeleteId: (id: string | null) => void;
}) => {
  const [stats, setStats] = useState<{ totalAttempts: number; totalCompletions: number } | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    let isMounted = true;
    if (!puzzle.id) return;

    trpc.puzzle
      .getStats.query(puzzle.id)
      .then((res) => {
        if (!isMounted) return;
        if (res) {
          setStats({
            totalAttempts: res.totalAttempts || 0,
            totalCompletions: res.totalCompletions || 0,
          });
        } else {
          setStats({ totalAttempts: 0, totalCompletions: 0 });
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Failed to load puzzle stats in Dev Panel:', err);
        setStats({ totalAttempts: 0, totalCompletions: 0 });
      })
      .finally(() => {
        if (isMounted) {
          setLoadingStats(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [puzzle.id]);

  const difficulties: PuzzleDifficulty[] = ['daily', 'easy', 'medium', 'hard'];

  return (
    <div className="flex flex-col gap-4 text-left">
      <div className="flex items-center justify-between gap-4 border-b border-gray-700/60 pb-3">
        <h4 className="font-extrabold text-white text-base truncate" title={puzzle.name}>
          {puzzle.name}
        </h4>
        <span className="bg-gray-900 border border-gray-700 text-gray-400 text-[10px] px-2 py-0.5 rounded font-mono uppercase">
          {puzzle.difficulty}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center bg-black/35 p-3 rounded-xl border border-gray-700/50">
        <PuzzlePreview puzzle={puzzle} />
        <div className="flex-1 text-[11px] text-gray-400 space-y-1 w-full font-mono">
          <div className="truncate">
            <span className="text-gray-500">ID:</span> {puzzle.id}
          </div>
          <div>
            <span className="text-gray-500">Grid:</span> {puzzle.width}x{puzzle.height}
          </div>
          <div>
            <span className="text-gray-500">Blocks:</span> {puzzle.blocks.length}
          </div>
          <div>
            <span className="text-gray-500">Targets:</span> {puzzle.targets.length}
          </div>
          {puzzle.playerMoves && (
            <div>
              <span className="text-gray-500">Moves:</span> {puzzle.playerMoves.length}
            </div>
          )}
        </div>
      </div>

      <div className="bg-gray-900/80 border border-gray-700/80 rounded-xl p-3 text-xs space-y-2">
        <div className="flex justify-between items-center text-gray-300 font-bold border-b border-gray-800 pb-1.5">
          <span>Player Statistics</span>
          <span className="text-[10px] text-gray-500 font-mono">Distinct Users</span>
        </div>
        {loadingStats ? (
          <div className="text-gray-500 text-[11px] font-mono animate-pulse py-1">Loading statistics...</div>
        ) : (
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="bg-black/40 p-2 rounded border border-gray-800">
              <div className="text-gray-400 text-[10px]">Distinct Started</div>
              <div className="text-blue-400 font-bold text-sm font-mono mt-0.5">
                {stats?.totalAttempts ?? 0}
              </div>
            </div>
            <div className="bg-black/40 p-2 rounded border border-gray-800">
              <div className="text-gray-400 text-[10px]">Distinct Completed</div>
              <div className="text-green-400 font-bold text-sm font-mono mt-0.5">
                {stats?.totalCompletions ?? 0}
              </div>
            </div>
            {(stats?.totalAttempts ?? 0) > 0 && (
              <div className="col-span-2 bg-black/40 px-2 py-1.5 rounded border border-gray-800 flex justify-between items-center font-mono text-[10px]">
                <span className="text-gray-400">Completion Rate</span>
                <span className="text-amber-300 font-bold">
                  {Math.round(((stats?.totalCompletions ?? 0) / (stats?.totalAttempts || 1)) * 100)}%
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 mt-1">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onEdit}
            className="w-full bg-gray-800 hover:bg-gray-700 text-white text-xs font-bold py-2 rounded transition-colors border border-gray-700 text-center cursor-pointer"
          >
            Edit
          </button>

          <div className="relative w-full">
            <select
              onChange={(e) => {
                if (e.target.value) {
                  onClone(puzzle, e.target.value as PuzzleDifficulty);
                  e.target.value = '';
                }
              }}
              className="w-full bg-gray-800 hover:bg-gray-700 text-white text-xs font-bold py-2 pl-2 pr-6 rounded transition-colors border border-gray-700 appearance-none text-center cursor-pointer font-sans"
              defaultValue=""
            >
              <option value="" disabled hidden>
                Clone to
              </option>
              {difficulties.map((d) => (
                <option key={d} value={d} className="bg-gray-900 text-white text-left capitalize">
                  {d}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-gray-400 text-[10px]">
              ▼
            </div>
          </div>
        </div>

        {confirmDeleteId === puzzle.id ? (
          <div className="flex gap-2 bg-red-950/20 border border-red-900/40 rounded-xl p-2 items-center justify-between">
            <span className="text-red-400 font-bold text-[11px]">Confirm delete?</span>
            <div className="flex gap-1.5 shrink-0">
              <button
                onClick={onDelete}
                className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-3 py-1 rounded transition-colors text-center cursor-pointer"
              >
                Yes
              </button>
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="bg-gray-700 hover:bg-gray-600 text-white text-xs font-bold px-3 py-1 rounded transition-colors text-center cursor-pointer"
              >
                No
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDeleteId(puzzle.id)}
            className="w-full bg-red-900/25 hover:bg-red-900/45 text-red-400 text-xs font-bold py-2 rounded transition-colors border border-red-900/35 text-center cursor-pointer"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
};

const DailyPuzzlesAccordion = ({
  puzzles,
  selectedPuzzleId,
  setSelectedPuzzleId,
  handleEdit,
  handleDeletePuzzle,
  handleClone,
  confirmDeleteId,
  setConfirmDeleteId,
}: {
  puzzles: Puzzle[];
  selectedPuzzleId: string | null;
  setSelectedPuzzleId: (id: string | null) => void;
  handleEdit: (puzzle: Puzzle) => void;
  handleDeletePuzzle: (id: string) => void;
  handleClone: (puzzle: Puzzle, target: PuzzleDifficulty) => void;
  confirmDeleteId: string | null;
  setConfirmDeleteId: (id: string | null) => void;
}) => {
  // Group daily puzzles by Year -> Month -> Puzzles
  const grouped = useMemo(() => {
    const map: Record<string, Record<string, Puzzle[]>> = {};

    puzzles.forEach((puzzle) => {
      let dateStr = '';
      if (puzzle.id.startsWith('daily-')) {
        dateStr = puzzle.id.replace('daily-', '');
      } else if (puzzle.id.match(/^\d{4}-\d{2}-\d{2}$/)) {
        dateStr = puzzle.id;
      } else {
        const d = new Date(puzzle.createdAt || Date.now());
        dateStr = d.toISOString().split('T')[0] || '';
      }

      const parts = dateStr.split('-');
      const year = parts[0] || 'Unknown';
      const month = parts[1] || '01';

      if (!map[year]) map[year] = {};
      if (!map[year][month]) map[year][month] = [];
      map[year][month].push(puzzle);
    });

    return map;
  }, [puzzles]);

  const years = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  // Expand latest year by default
  const [expandedYears, setExpandedYears] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    if (years.length > 0 && years[0]) {
      initial[years[0]] = true;
    }
    return initial;
  });

  // Expand latest month by default
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    if (years.length > 0 && years[0]) {
      const latestYearMonths = Object.keys(grouped[years[0]] || {}).sort((a, b) => b.localeCompare(a));
      if (latestYearMonths.length > 0 && latestYearMonths[0]) {
        initial[`${years[0]}-${latestYearMonths[0]}`] = true;
      }
    }
    return initial;
  });

  // Auto expand latest year/month if data updates
  useEffect(() => {
    if (years.length > 0 && years[0] && Object.keys(expandedYears).length === 0) {
      setExpandedYears({ [years[0]]: true });
      const latestMonths = Object.keys(grouped[years[0]] || {}).sort((a, b) => b.localeCompare(a));
      if (latestMonths.length > 0 && latestMonths[0]) {
        setExpandedMonths({ [`${years[0]}-${latestMonths[0]}`]: true });
      }
    }
  }, [years, grouped, expandedYears]);

  const toggleYear = (year: string) => {
    setExpandedYears((prev) => ({ ...prev, [year]: !prev[year] }));
  };

  const toggleMonth = (yearMonthKey: string) => {
    setExpandedMonths((prev) => ({ ...prev, [yearMonthKey]: !prev[yearMonthKey] }));
  };

  if (puzzles.length === 0) {
    return (
      <div className="text-gray-400 text-center py-12 border-2 border-dashed border-gray-700 rounded-2xl text-sm font-sans">
        No daily puzzles found. Create one!
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 overflow-y-auto max-h-[600px] pr-1 font-sans">
      {years.map((year) => {
        const yearMonthsMap = grouped[year] || {};
        const months = Object.keys(yearMonthsMap).sort((a, b) => b.localeCompare(a));
        const totalYearPuzzles = months.reduce((acc, m) => acc + (yearMonthsMap[m]?.length || 0), 0);
        const isYearOpen = !!expandedYears[year];

        return (
          <div key={year} className="bg-gray-900 border border-gray-700/80 rounded-2xl overflow-hidden shadow-md">
            {/* Level 1: Year Dropdown Header */}
            <div
              onClick={() => toggleYear(year)}
              className="flex items-center justify-between p-4 bg-gray-800/90 hover:bg-gray-700/80 cursor-pointer transition-colors border-b border-gray-700/60 select-none"
            >
              <div className="flex items-center gap-3">
                <span className="text-base font-black text-white font-mono">📅 {year}</span>
                <span className="bg-blue-950/70 text-blue-300 border border-blue-800/50 text-[11px] font-bold font-mono px-2.5 py-0.5 rounded-full">
                  {totalYearPuzzles} {totalYearPuzzles === 1 ? 'Puzzle' : 'Puzzles'}
                </span>
              </div>
              <span className="text-gray-400 text-xs font-bold font-mono">
                {isYearOpen ? '▲ Collapse Year' : '▼ Expand Year'}
              </span>
            </div>

            {/* Level 2: Expanded Month Dropdowns */}
            {isYearOpen && (
              <div className="p-3 space-y-2.5 bg-black/30">
                {months.map((month) => {
                  const monthPuzzles = yearMonthsMap[month] || [];
                  const monthKey = `${year}-${month}`;
                  const isMonthOpen = !!expandedMonths[monthKey];
                  const monthName = MONTH_NAMES[month] ? `${MONTH_NAMES[month]} (${month})` : `Month ${month}`;

                  return (
                    <div key={monthKey} className="border border-gray-700/60 rounded-xl overflow-hidden bg-gray-900/90">
                      {/* Level 2: Month Header */}
                      <div
                        onClick={() => toggleMonth(monthKey)}
                        className="flex items-center justify-between px-3.5 py-2.5 bg-gray-800/60 hover:bg-gray-700/60 cursor-pointer transition-colors border-b border-gray-700/40 select-none"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-xs font-extrabold text-cyan-300 font-mono">📁 {monthName}</span>
                          <span className="bg-cyan-950/60 text-cyan-300 border border-cyan-800/40 text-[10px] font-bold font-mono px-2 py-0.5 rounded-full">
                            {monthPuzzles.length} {monthPuzzles.length === 1 ? 'Puzzle' : 'Puzzles'}
                          </span>
                        </div>
                        <span className="text-gray-400 text-[11px] font-mono">
                          {isMonthOpen ? '▲ Hide Days' : '▼ Show Days'}
                        </span>
                      </div>

                      {/* Level 3: Days List inside Month */}
                      {isMonthOpen && (
                        <div className="p-2 space-y-2 bg-black/40">
                          {monthPuzzles.map((puzzle) => {
                            const isSelected = selectedPuzzleId === puzzle.id;
                            const dateStr = puzzle.id.startsWith('daily-') ? puzzle.id.replace('daily-', '') : puzzle.id;
                            const parts = dateStr.split('-');
                            const dayNum = parts[2] || dateStr;

                            return (
                              <div key={puzzle.id} className="flex flex-col">
                                <div
                                  onClick={() => setSelectedPuzzleId(isSelected ? null : puzzle.id)}
                                  className={cn(
                                    'flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all hover:bg-gray-800/90',
                                    isSelected
                                      ? 'border-blue-500 bg-blue-950/30 shadow-[0_0_10px_rgba(59,130,246,0.25)]'
                                      : 'border-gray-800 bg-gray-950/80'
                                  )}
                                >
                                  <div className="flex items-center gap-3 min-w-0 pr-2 text-left">
                                    <span className="bg-gray-800 text-cyan-300 text-[10px] font-mono font-bold px-2 py-1 rounded-lg border border-gray-700 shrink-0">
                                      Day {dayNum}
                                    </span>
                                    <div className="flex flex-col min-w-0">
                                      <span className="font-bold text-white text-xs truncate">{puzzle.name}</span>
                                      <span className="text-[9px] text-gray-500 font-mono truncate">{puzzle.id}</span>
                                    </div>
                                  </div>
                                  <span className="text-gray-400 text-xs shrink-0">{isSelected ? '▲' : '▼'}</span>
                                </div>

                                {/* Mobile Detail Card */}
                                {isSelected && (
                                  <div className="block lg:hidden mt-2 p-4 bg-gray-900 border border-blue-500/40 rounded-xl">
                                    <PuzzleDetailCard
                                      puzzle={puzzle}
                                      onEdit={() => handleEdit(puzzle)}
                                      onDelete={() => handleDeletePuzzle(puzzle.id)}
                                      onClone={(p, d) => void handleClone(p, d)}
                                      confirmDeleteId={confirmDeleteId}
                                      setConfirmDeleteId={setConfirmDeleteId}
                                    />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

const CurrencyManagerPanel = ({
  username,
  moderatorShards,
  shardAmount,
  setShardAmount,
  adjustingShards,
  onAdjustShards,
  onRefreshCurrency,
}: {
  username: string | null;
  moderatorShards: number;
  shardAmount: number;
  setShardAmount: (amount: number) => void;
  adjustingShards: boolean;
  onAdjustShards: (amount: number, isAddition: boolean) => Promise<void>;
  onRefreshCurrency: () => Promise<void>;
}) => {
  const handleQuickAdd = (amount: number) => {
    void onAdjustShards(amount, true);
  };

  const handleQuickRemove = (amount: number) => {
    void onAdjustShards(amount, false);
  };

  const handleResetToZero = () => {
    if (moderatorShards > 0) {
      void onAdjustShards(moderatorShards, false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full text-left font-sans">
      {/* Current Balance Card */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-gray-800/90 rounded-2xl p-6 border border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.15)] relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <div>
              <span className="text-xs uppercase tracking-wider text-cyan-400 font-bold font-mono">
                Developer Account
              </span>
              <h3 className="text-2xl font-black text-white mt-0.5">u/{username || 'Developer'}</h3>
            </div>
            <button
              onClick={() => void onRefreshCurrency()}
              className="p-2 bg-gray-900 hover:bg-gray-700 text-gray-300 rounded-lg border border-gray-700 text-xs transition-colors cursor-pointer"
              title="Refresh Balance"
            >
              🔄
            </button>
          </div>

          <div className="bg-black/50 border border-cyan-500/20 rounded-xl p-5 mb-4">
            <div className="text-xs text-gray-400 uppercase tracking-wide font-mono font-semibold mb-1">
              Current Neon Shards Balance
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-cyan-300 font-mono tracking-tight">
                {moderatorShards.toLocaleString()}
              </span>
              <span className="text-cyan-400 font-bold text-sm">Shards 💎</span>
            </div>
          </div>

          <p className="text-xs text-gray-400 leading-relaxed">
            Neon Shards are used in-game to unlock themes, trail effects, and cosmetic shop items. As an authorized developer, you can grant or deduct shards instantly for testing.
          </p>
        </div>

        {/* Quick Presets Card */}
        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 shadow-xl">
          <h4 className="text-lg font-bold text-white mb-2">⚡ Quick Action Presets</h4>
          <p className="text-xs text-gray-400 mb-4">One-click shard balance adjustments:</p>

          <div className="space-y-3">
            <div>
              <span className="text-[11px] font-semibold text-green-400 block mb-1.5">Add Shards</span>
              <div className="grid grid-cols-4 gap-2">
                {[100, 500, 1000, 5000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handleQuickAdd(amt)}
                    disabled={adjustingShards}
                    className="bg-green-950/60 hover:bg-green-900 border border-green-700/50 text-green-300 font-mono font-bold py-2 rounded-xl text-xs transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    +{amt >= 1000 ? `${amt / 1000}k` : amt}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-red-400 block mb-1.5">Deduct Shards</span>
              <div className="grid grid-cols-3 gap-2">
                {[100, 500, 1000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handleQuickRemove(amt)}
                    disabled={adjustingShards}
                    className="bg-red-950/60 hover:bg-red-900 border border-red-700/50 text-red-300 font-mono font-bold py-2 rounded-xl text-xs transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    -{amt >= 1000 ? `${amt / 1000}k` : amt}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-gray-700/60">
              <button
                type="button"
                onClick={handleResetToZero}
                disabled={adjustingShards || moderatorShards === 0}
                className="w-full bg-gray-900 hover:bg-gray-700 border border-gray-700 text-gray-400 font-mono font-bold py-2 rounded-xl text-xs transition-all cursor-pointer disabled:opacity-40"
              >
                Reset Balance to 0
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Adjustment Form Card */}
      <div className="lg:col-span-7 bg-gray-800 rounded-2xl p-6 border border-gray-700 shadow-xl w-full">
        <h3 className="text-xl font-black text-white mb-2">Custom Currency Adjustment</h3>
        <p className="text-xs text-gray-400 mb-6">
          Specify an exact amount of Neon Shards to deposit into or withdraw from your developer account.
        </p>

        <div className="bg-gray-900/70 border border-gray-700/80 rounded-xl p-5 space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-300 mb-2 uppercase tracking-wide font-mono">
              Shard Amount
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                value={shardAmount === 0 ? '' : shardAmount}
                onChange={(e) => setShardAmount(Math.max(0, Number(e.target.value)))}
                placeholder="Enter amount (e.g. 2500)"
                className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 text-white text-base font-mono focus:outline-none focus:border-cyan-500 transition-colors"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500 font-mono">
                SHARDS
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => void onAdjustShards(shardAmount, true)}
              disabled={adjustingShards || shardAmount <= 0}
              className="bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all shadow-[0_0_12px_rgba(22,163,74,0.3)] active:scale-95 text-sm cursor-pointer"
            >
              {adjustingShards ? 'Processing...' : '➕ Give Shards'}
            </button>
            <button
              type="button"
              onClick={() => void onAdjustShards(shardAmount, false)}
              disabled={adjustingShards || shardAmount <= 0}
              className="bg-red-600 hover:bg-red-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all shadow-[0_0_12px_rgba(220,38,38,0.3)] active:scale-95 text-sm cursor-pointer"
            >
              {adjustingShards ? 'Processing...' : '➖ Remove Shards'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const PostMappingPanel = ({
  allPuzzles,
  selectedDailyPostPuzzleId,
  setSelectedDailyPostPuzzleId,
  creatingDailyPost,
  handleCreateDailyPost,
  targetMappingDate,
  setTargetMappingDate,
  loadPostMapping,
  loadingMapping,
  mappingPostId,
  mappedPuzzleId,
  mappedNumber,
  selectedNewPuzzleId,
  setSelectedNewPuzzleId,
  newDailyNumber,
  setNewDailyNumber,
  savingMapping,
  handleSavePostMapping,
  syncingPosts,
  handleSyncPosts,
}: {
  allPuzzles: Puzzle[];
  selectedDailyPostPuzzleId: string;
  setSelectedDailyPostPuzzleId: (v: string) => void;
  creatingDailyPost: boolean;
  handleCreateDailyPost: () => Promise<void>;
  targetMappingDate: string;
  setTargetMappingDate: (v: string) => void;
  loadPostMapping: (date: string) => Promise<void>;
  loadingMapping: boolean;
  mappingPostId: string | null;
  mappedPuzzleId: string | null;
  mappedNumber: number | null;
  selectedNewPuzzleId: string;
  setSelectedNewPuzzleId: (v: string) => void;
  newDailyNumber: number | undefined;
  setNewDailyNumber: (v: number | undefined) => void;
  savingMapping: boolean;
  handleSavePostMapping: () => Promise<void>;
  syncingPosts: boolean;
  handleSyncPosts: () => Promise<void>;
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full text-left font-sans">
      {/* Daily Post Publisher */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 shadow-xl">
          <h3 className="text-xl font-black text-white mb-2">Publish Daily Post</h3>
          <p className="text-xs text-gray-400 mb-4 leading-relaxed">
            Select any puzzle from your database and instantly publish it as a new daily post on Reddit.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">Select Puzzle to Post</label>
              <select
                value={selectedDailyPostPuzzleId}
                onChange={(e) => setSelectedDailyPostPuzzleId(e.target.value)}
                className="w-full bg-gray-950 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
              >
                <option value="">Choose a puzzle</option>
                {allPuzzles.map((puzzle) => (
                  <option key={puzzle.id} value={puzzle.id}>
                    {puzzle.name} ({puzzle.id})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleCreateDailyPost}
              disabled={creatingDailyPost || !selectedDailyPostPuzzleId}
              className="w-full bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all shadow-[0_0_12px_rgba(22,163,74,0.3)] active:scale-95 text-sm cursor-pointer"
            >
              {creatingDailyPost ? 'Publishing...' : '🚀 Create & Publish Post'}
            </button>
          </div>
        </div>

        {/* Sync Posts Action Card */}
        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 shadow-xl">
          <h4 className="text-lg font-bold text-white mb-2">🔄 Sync Daily Posts</h4>
          <p className="text-xs text-gray-400 mb-4 leading-relaxed">
            Run automatic synchronization to update date mappings and puzzle assignments for active daily posts.
          </p>
          <button
            type="button"
            onClick={handleSyncPosts}
            disabled={syncingPosts}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 text-white font-bold py-2.5 rounded-xl text-sm transition-all shadow-[0_0_12px_rgba(37,99,235,0.3)] cursor-pointer"
          >
            {syncingPosts ? 'Syncing...' : 'Sync Posts Now'}
          </button>
        </div>
      </div>

      {/* Date-to-Post Mapping Manager */}
      <div className="lg:col-span-7 bg-gray-800 rounded-2xl p-6 border border-gray-700 shadow-xl w-full">
        <h3 className="text-xl font-black text-white mb-2">Modify Date-to-Post Mapping</h3>
        <p className="text-xs text-gray-400 mb-6">
          Look up a specific post date and reassign which puzzle or daily issue number is mapped to it.
        </p>

        <div className="bg-gray-900/70 border border-gray-700/80 rounded-xl p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Target Date</label>
            <div className="flex gap-2">
              <input
                type="date"
                value={targetMappingDate}
                onChange={(e) => setTargetMappingDate(e.target.value)}
                className="flex-1 bg-gray-950 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => void loadPostMapping(targetMappingDate)}
                disabled={loadingMapping || !targetMappingDate}
                className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer"
              >
                {loadingMapping ? 'Loading...' : 'Load Date'}
              </button>
            </div>
          </div>

          {mappingPostId !== null && (
            <div className="bg-black/40 border border-gray-700 rounded-xl p-3 text-xs text-gray-300 space-y-1 font-mono">
              <div>
                <span className="text-gray-500 font-sans">Reddit Post ID:</span> {mappingPostId || 'None'}
              </div>
              <div>
                <span className="text-gray-500 font-sans">Currently Mapped:</span> {mappedPuzzleId || 'None'}
              </div>
              <div>
                <span className="text-gray-500 font-sans">Daily Issue Number:</span>{' '}
                {mappedNumber !== null ? `#${mappedNumber}` : 'None'}
              </div>
            </div>
          )}

          {mappingPostId === null && !loadingMapping && (
            <div className="bg-red-950/30 border border-red-900/40 rounded-xl p-3 text-xs text-red-300">
              No Reddit post exists for date <span className="font-mono">{targetMappingDate}</span>.
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Select New Puzzle</label>
            <select
              value={selectedNewPuzzleId}
              onChange={(e) => setSelectedNewPuzzleId(e.target.value)}
              disabled={!mappingPostId}
              className="w-full bg-gray-950 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
            >
              <option value="">Choose a puzzle</option>
              {allPuzzles.map((puzzle) => (
                <option key={puzzle.id} value={puzzle.id}>
                  {puzzle.name} ({puzzle.id})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Daily Puzzle Number</label>
            <input
              type="number"
              value={newDailyNumber === undefined ? '' : newDailyNumber}
              onChange={(e) => setNewDailyNumber(e.target.value !== '' ? Number(e.target.value) : undefined)}
              disabled={!mappingPostId}
              placeholder="e.g. 1"
              className="w-full bg-gray-950 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50 font-mono"
            />
          </div>

          <button
            type="button"
            onClick={handleSavePostMapping}
            disabled={savingMapping || !targetMappingDate || !selectedNewPuzzleId || !mappingPostId}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all shadow-[0_0_12px_rgba(37,99,235,0.3)] text-sm cursor-pointer"
          >
            {savingMapping ? 'Saving...' : 'Update Post Mapping'}
          </button>
        </div>
      </div>
    </div>
  );
};

const DevAccountsPanel = ({
  devAccounts,
  newDevUsername,
  setNewDevUsername,
  addingDev,
  setAddingDev,
  confirmDeleteDev,
  setConfirmDeleteDev,
  fetchDevAccounts,
}: {
  devAccounts: string[];
  newDevUsername: string;
  setNewDevUsername: (v: string) => void;
  addingDev: boolean;
  setAddingDev: (v: boolean) => void;
  confirmDeleteDev: string | null;
  setConfirmDeleteDev: (v: string | null) => void;
  fetchDevAccounts: () => Promise<void>;
}) => {
  const handleAddDev = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetUser = newDevUsername.trim();
    if (!targetUser) return;
    setAddingDev(true);
    try {
      await trpc.dev.addDevAccount.mutate({ username: targetUser });
      showToast({ text: `Successfully added ${targetUser} as developer!`, appearance: 'success' });
      setNewDevUsername('');
      await fetchDevAccounts();
    } catch (err) {
      console.error(err);
      showToast({ text: 'Failed to add developer account', appearance: 'neutral' });
    } finally {
      setAddingDev(false);
    }
  };

  const handleRemoveDev = async (username: string) => {
    try {
      await trpc.dev.removeDevAccount.mutate({ username });
      showToast({ text: `Successfully revoked access for ${username}!`, appearance: 'success' });
      setConfirmDeleteDev(null);
      await fetchDevAccounts();
    } catch (err) {
      console.error(err);
      showToast({ text: 'Failed to revoke developer access', appearance: 'neutral' });
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start w-full text-left font-sans">
      <div className="md:col-span-5 space-y-6">
        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 shadow-xl">
          <h3 className="text-xl font-black text-white mb-2">Authorize Developer</h3>
          <p className="text-xs text-gray-400 mb-4 font-sans leading-relaxed">
            Grant developer permissions to another Reddit username. Authorized developers can manage puzzles, posts, and adjust shards.
          </p>
          <form onSubmit={handleAddDev} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Reddit Username</label>
              <input
                type="text"
                value={newDevUsername}
                onChange={(e) => setNewDevUsername(e.target.value)}
                placeholder="e.g. spez"
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                required
              />
            </div>
            <button
              type="submit"
              disabled={addingDev || !newDevUsername.trim()}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-xl text-sm transition-all shadow-[0_0_12px_rgba(37,99,235,0.3)] active:scale-95 cursor-pointer"
            >
              {addingDev ? 'Authorizing...' : 'Add Developer'}
            </button>
          </form>
        </div>
      </div>

      <div className="md:col-span-7 bg-gray-800 rounded-2xl p-6 border border-gray-700 shadow-xl w-full">
        <h3 className="text-xl font-black text-white mb-2">Developer Access List</h3>
        <p className="text-xs text-gray-400 mb-4">
          All Reddit accounts with developer access. Primary owners have permanent access.
        </p>

        <div className="space-y-3">
          <div className="bg-gray-900/60 border border-blue-500/30 p-4 rounded-xl flex items-center justify-between gap-3 text-left">
            <div>
              <h4 className="font-extrabold text-white text-sm">u/Fit-Worldliness-1588</h4>
              <p className="text-[10px] text-gray-400 mt-0.5">Primary App Creator & System Admin</p>
            </div>
            <span className="text-[10px] bg-blue-950/60 text-blue-300 border border-blue-900/40 px-2 py-1 rounded font-extrabold uppercase tracking-wider">
              Primary Owner
            </span>
          </div>

          <div className="bg-gray-900/60 border border-blue-500/30 p-4 rounded-xl flex items-center justify-between gap-3 text-left">
            <div>
              <h4 className="font-extrabold text-white text-sm">u/owenutley</h4>
              <p className="text-[10px] text-gray-400 mt-0.5">Primary App Creator & System Admin</p>
            </div>
            <span className="text-[10px] bg-blue-950/60 text-blue-300 border border-blue-900/40 px-2 py-1 rounded font-extrabold uppercase tracking-wider">
              Primary Owner
            </span>
          </div>

          {devAccounts.length === 0 ? (
            <div className="text-sm text-gray-500 text-center py-8 border border-dashed border-gray-700 rounded-xl">
              No additional developers authorized yet.
            </div>
          ) : (
            devAccounts.map((username) => (
              <div key={username} className="bg-gray-900/60 border border-gray-700 p-4 rounded-xl flex flex-col gap-3 text-left">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h4 className="font-extrabold text-white text-sm">u/{username}</h4>
                    <p className="text-[10px] text-gray-400 mt-0.5 font-sans">Authorized Developer Account</p>
                  </div>
                  {confirmDeleteDev === username ? (
                    <div className="flex gap-1.5 shrink-0">
                      <button
                        onClick={() => handleRemoveDev(username)}
                        className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-3 py-1 rounded transition-colors text-center cursor-pointer"
                      >
                        Confirm Revoke
                      </button>
                      <button
                        onClick={() => setConfirmDeleteDev(null)}
                        className="bg-gray-700 hover:bg-gray-600 text-white text-xs font-bold px-3 py-1 rounded transition-colors text-center cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteDev(username)}
                      className="bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-900/30 font-bold px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer shrink-0"
                    >
                      Revoke Access
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const SkinsManagerPanel = ({
  userThemes,
  userCharacters,
  earnedTiers,
  onToggleTheme,
  onToggleCharacter,
  onToggleTier,
  onRefresh,
}: {
  userThemes: string[];
  userCharacters: string[];
  earnedTiers: { easy: boolean; medium: boolean; hard: boolean };
  onToggleTheme: (themeId: string, currentUnlocked: boolean) => Promise<void>;
  onToggleCharacter: (charId: string, currentUnlocked: boolean) => Promise<void>;
  onToggleTier: (tier: 'easy' | 'medium' | 'hard', currentEarned: boolean) => Promise<void>;
  onRefresh: () => Promise<void>;
}) => {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleThemeClick = async (themeId: string, currentUnlocked: boolean) => {
    setLoadingId(`theme-${themeId}`);
    try {
      await onToggleTheme(themeId, currentUnlocked);
      await onRefresh();
    } finally {
      setLoadingId(null);
    }
  };

  const handleCharClick = async (charId: string, currentUnlocked: boolean) => {
    setLoadingId(`char-${charId}`);
    try {
      await onToggleCharacter(charId, currentUnlocked);
      await onRefresh();
    } finally {
      setLoadingId(null);
    }
  };

  const handleTierClick = async (tier: 'easy' | 'medium' | 'hard', currentEarned: boolean) => {
    setLoadingId(`tier-${tier}`);
    try {
      await onToggleTier(tier, currentEarned);
      await onRefresh();
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Campaign Tier Earned Status */}
      <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 shadow-xl text-left">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-xl font-bold text-white">Campaign Tier Earned Status</h3>
          <button
            type="button"
            onClick={() => void onRefresh()}
            className="text-xs px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg cursor-pointer font-mono"
          >
            Refresh Status
          </button>
        </div>
        <p className="text-xs text-gray-400 mb-4">
          Toggle permanent campaign completion tier rewards on or off to test earning themes/characters.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {(['easy', 'medium', 'hard'] as const).map((tier) => {
            const isEarned = earnedTiers[tier];
            const isLoading = loadingId === `tier-${tier}`;
            return (
              <div
                key={tier}
                className="flex items-center justify-between p-4 bg-gray-900/80 border border-gray-700 rounded-xl"
              >
                <div>
                  <div className="text-xs font-mono font-bold uppercase text-cyan-400">{tier} Campaign</div>
                  <div className="text-sm font-extrabold text-white">
                    {isEarned ? 'Earned' : 'Not Earned'}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => void handleTierClick(tier, isEarned)}
                  disabled={isLoading}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    isEarned
                      ? 'bg-green-900/60 text-green-300 border border-green-500 hover:bg-green-800/60'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {isLoading ? '...' : isEarned ? 'Revoke Tier' : 'Grant Tier'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Themes Manager */}
      <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 shadow-xl text-left">
        <h3 className="text-xl font-bold text-white mb-2">Themes Unlocked Status</h3>
        <p className="text-xs text-gray-400 mb-4">
          Click any theme toggle to lock or unlock it instantly for testing.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {THEMES.map((theme) => {
            const isUnlocked = userThemes.includes(theme.id);
            const isLoading = loadingId === `theme-${theme.id}`;

            return (
              <div
                key={theme.id}
                className="flex items-center justify-between p-3.5 bg-gray-900/80 border border-gray-700 rounded-xl"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-white">{theme.name}</span>
                    {theme.earnRequirement && (
                      <span className="text-[9px] font-mono bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30">
                        {theme.earnRequirement}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 font-mono">ID: {theme.id}</div>
                </div>

                <button
                  type="button"
                  onClick={() => void handleThemeClick(theme.id, isUnlocked)}
                  disabled={isLoading}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    isUnlocked
                      ? 'bg-green-600 text-white hover:bg-green-500'
                      : 'bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-white'
                  }`}
                >
                  {isLoading ? '...' : isUnlocked ? 'Unlocked ON' : 'Locked OFF'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Characters Manager */}
      <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 shadow-xl text-left">
        <h3 className="text-xl font-bold text-white mb-2">Characters Unlocked Status</h3>
        <p className="text-xs text-gray-400 mb-4">
          Click any character toggle to lock or unlock it instantly for testing.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {CHARACTERS.map((char) => {
            const isUnlocked = userCharacters.includes(char.id);
            const isLoading = loadingId === `char-${char.id}`;

            return (
              <div
                key={char.id}
                className="flex items-center justify-between p-3.5 bg-gray-900/80 border border-gray-700 rounded-xl"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-white">{char.name}</span>
                    {char.earnRequirement && (
                      <span className="text-[9px] font-mono bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30">
                        {char.earnRequirement}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 font-mono">ID: {char.id}</div>
                </div>

                <button
                  type="button"
                  onClick={() => void handleCharClick(char.id, isUnlocked)}
                  disabled={isLoading}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    isUnlocked
                      ? 'bg-blue-600 text-white hover:bg-blue-500'
                      : 'bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-white'
                  }`}
                >
                  {isLoading ? '...' : isUnlocked ? 'Unlocked ON' : 'Locked OFF'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const HowToManagerPanel = () => {
  const [pages, setPages] = useState<TutorialPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Form states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pageIdInput, setPageIdInput] = useState('');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [icon, setIcon] = useState('🎯');
  const [description, setDescription] = useState('');
  const [hasPuzzle, setHasPuzzle] = useState(false);

  // Puzzle visual builder states
  const [width, setWidth] = useState(5);
  const [height, setHeight] = useState(5);
  const [player, setPlayer] = useState<{ x: number; y: number }>({ x: 1, y: 1 });
  const [walls, setWalls] = useState<{ x: number; y: number }[]>([]);
  const [blocks, setBlocks] = useState<{ id: string; color: string; x: number; y: number }[]>([]);
  const [targets, setTargets] = useState<{ id: string; color: string; x: number; y: number }[]>([]);
  const [portals, setPortals] = useState<{ id: string; color: string; x: number; y: number; dir: 'Up' | 'Down' | 'Left' | 'Right' }[]>([]);
  const [solutionMoves, setSolutionMoves] = useState<string[]>([]);
  const [selectedTool, setSelectedTool] = useState<'wall' | 'player' | 'block' | 'target' | 'portal' | 'eraser'>('wall');
  const [selectedColor, setSelectedColor] = useState('blue');
  const [selectedPortalDir, setSelectedPortalDir] = useState<'Up' | 'Down' | 'Left' | 'Right'>('Up');

  // Playtest solution recorder states
  const [isPlaytesting, setIsPlaytesting] = useState(false);
  const [ptPlayer, setPtPlayer] = useState<{ x: number; y: number }>({ x: 1, y: 1 });
  const [ptBlocks, setPtBlocks] = useState<{ id: string; color: string; x: number; y: number }[]>([]);
  const [ptMoves, setPtMoves] = useState<string[]>([]);
  const [ptSolved, setPtSolved] = useState(false);

  const fetchPages = async () => {
    setLoading(true);
    try {
      const res = await trpc.howto.getAll.query();
      setPages(res || []);
    } catch (e) {
      console.error('Failed to load tutorial pages:', e);
      showToast({ text: 'Failed to load tutorial pages', appearance: 'neutral' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchPages();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setPageIdInput(`tut-${Date.now()}`);
    setTitle('');
    setSubtitle('');
    setIcon('🎯');
    setDescription('');
    setHasPuzzle(false);
    setWidth(5);
    setHeight(5);
    setPlayer({ x: 1, y: 1 });
    setWalls([]);
    setBlocks([]);
    setTargets([]);
    setPortals([]);
    setSolutionMoves([]);
    setIsPlaytesting(false);
  };

  const handleEdit = (page: TutorialPage) => {
    setEditingId(page.id);
    setPageIdInput(page.id);
    setTitle(page.title);
    setSubtitle(page.subtitle || '');
    setIcon(page.icon || '🎯');
    setDescription(page.description);
    if (page.puzzle) {
      setHasPuzzle(true);
      setWidth(page.puzzle.width);
      setHeight(page.puzzle.height);
      setPlayer(page.puzzle.player);
      setWalls(page.puzzle.walls);
      setBlocks(page.puzzle.blocks);
      setTargets(page.puzzle.targets);
      setPortals((page.puzzle.portals || []).map((pt) => ({ ...pt, dir: pt.dir as any })));
      setSolutionMoves(page.puzzle.solutionMoves || []);
    } else {
      setHasPuzzle(false);
    }
    setIsPlaytesting(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      showToast({ text: 'Title and description are required', appearance: 'neutral' });
      return;
    }

    const payload: TutorialPage = {
      id: editingId || pageIdInput || `tut-${Date.now()}`,
      order: pages.length,
      title: title.trim(),
      subtitle: subtitle.trim() || undefined,
      icon: icon.trim() || '🎯',
      description: description.trim(),
      puzzle: hasPuzzle ? {
        width,
        height,
        player,
        walls,
        blocks,
        targets,
        portals: (portals || []).map((p, idx) => ({
          id: p.id || `p-${p.x}-${p.y}-${idx}`,
          color: p.color || 'blue',
          x: Number(p.x),
          y: Number(p.y),
          dir: (['Up', 'Down', 'Left', 'Right'].includes(p.dir) ? p.dir : 'Up') as 'Up' | 'Down' | 'Left' | 'Right',
        })),
        solutionMoves,
      } : undefined,
    };

    try {
      const updated = await trpc.howto.save.mutate(payload);
      setPages(updated);
      showToast({ text: 'Tutorial page saved successfully!', appearance: 'success' });
      resetForm();
    } catch (err) {
      console.error(err);
      showToast({ text: 'Failed to save tutorial page', appearance: 'neutral' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const updated = await trpc.howto.delete.mutate({ id });
      setPages(updated);
      setConfirmDeleteId(null);
      if (editingId === id) resetForm();
      showToast({ text: 'Tutorial page deleted', appearance: 'success' });
    } catch (err) {
      console.error(err);
      showToast({ text: 'Failed to delete tutorial page', appearance: 'neutral' });
    }
  };

  const handleMovePage = async (index: number, direction: 'up' | 'down') => {
    const newPages = [...pages];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newPages.length) return;

    const temp = newPages[index]!;
    newPages[index] = newPages[targetIdx]!;
    newPages[targetIdx] = temp;

    const pageIds = newPages.map((p) => p.id);
    try {
      const updated = await trpc.howto.reorder.mutate({ pageIds });
      setPages(updated);
      showToast({ text: 'Tutorial order updated', appearance: 'success' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleCellClick = (x: number, y: number) => {
    if (selectedTool === 'player') {
      setPlayer({ x, y });
    } else if (selectedTool === 'wall') {
      setWalls((prev) =>
        prev.some((w) => w.x === x && w.y === y)
          ? prev.filter((w) => !(w.x === x && w.y === y))
          : [...prev, { x, y }]
      );
    } else if (selectedTool === 'block') {
      const existingIdx = blocks.findIndex((b) => b.x === x && b.y === y);
      if (existingIdx !== -1) {
        if (blocks[existingIdx]?.color === selectedColor) {
          setBlocks(blocks.filter((_, idx) => idx !== existingIdx));
        } else {
          const updated = [...blocks];
          const item = updated[existingIdx];
          if (item) item.color = selectedColor;
          setBlocks(updated);
        }
      } else {
        setBlocks([...blocks, { id: `b_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, color: selectedColor, x, y }]);
        setWalls(walls.filter((w) => w.x !== x || w.y !== y));
      }
    } else if (selectedTool === 'target') {
      const existingIdx = targets.findIndex((t) => t.x === x && t.y === y);
      if (existingIdx !== -1) {
        if (targets[existingIdx]?.color === selectedColor) {
          setTargets(targets.filter((_, idx) => idx !== existingIdx));
        } else {
          const updated = [...targets];
          const item = updated[existingIdx];
          if (item) item.color = selectedColor;
          setTargets(updated);
        }
      } else {
        setTargets([...targets, { id: `t_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, color: selectedColor, x, y }]);
        setWalls(walls.filter((w) => w.x !== x || w.y !== y));
      }
    } else if (selectedTool === 'portal') {
      const existingIdx = portals.findIndex((p) => p.x === x && p.y === y);
      const directions: ('Up' | 'Down' | 'Left' | 'Right')[] = ['Up', 'Right', 'Down', 'Left'];
      if (existingIdx !== -1) {
        const item = portals[existingIdx];
        if (item) {
          const currentDirIdx = directions.indexOf(item.dir);
          const nextDir = directions[(currentDirIdx + 1) % directions.length];
          if (nextDir === 'Up') {
            setPortals(portals.filter((_, idx) => idx !== existingIdx));
          } else {
            const updated = [...portals];
            const targetItem = updated[existingIdx];
            if (targetItem && nextDir) targetItem.dir = nextDir;
            setPortals(updated);
          }
        }
      } else {
        setPortals([...portals, { id: `p_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, color: selectedColor, x, y, dir: 'Up' }]);
        setWalls(walls.filter((w) => w.x !== x || w.y !== y));
      }
    } else if (selectedTool === 'eraser') {
      setWalls((prev) => prev.filter((w) => !(w.x === x && w.y === y)));
      setBlocks((prev) => prev.filter((b) => !(b.x === x && b.y === y)));
      setTargets((prev) => prev.filter((t) => !(t.x === x && t.y === y)));
      setPortals((prev) => prev.filter((p) => !(p.x === x && p.y === y)));
    }
  };

  const startPlaytest = () => {
    setIsPlaytesting(true);
    setPtPlayer({ ...player });
    setPtBlocks(blocks.map((b) => ({ ...b })));
    setPtMoves([]);
    setPtSolved(false);
  };

  const executeMove = (dir: 'Up' | 'Down' | 'Left' | 'Right') => {
    if (ptSolved) return;

    const dirVector = dirToVector(dir);
    const wallSet = new Set(walls.map((w) => `${w.x},${w.y}`));

    let newPlayer = { ...ptPlayer };
    let newBlocks = ptBlocks.map((b) => ({ ...b }));
    let moved = false;

    // 1. Check if character is standing on a portal and moving into it
    const portalOnCurrentCell = portals.find(
      (p) => p.x === ptPlayer.x && p.y === ptPlayer.y
    );

    if (portalOnCurrentCell) {
      const portalVec = dirToVector(portalOnCurrentCell.dir);
      if (portalVec.x === -dirVector.x && portalVec.y === -dirVector.y) {
        const exitPortal = portals.find(
          (p) => p.color.toLowerCase() === portalOnCurrentCell.color.toLowerCase() && p.id !== portalOnCurrentCell.id
        );

        if (exitPortal) {
          const exitPos = { x: exitPortal.x, y: exitPortal.y };
          const isExitWallOrBound =
            exitPos.x < 0 || exitPos.x >= width ||
            exitPos.y < 0 || exitPos.y >= height ||
            wallSet.has(`${exitPos.x},${exitPos.y}`);

          if (!isExitWallOrBound) {
            const blockIdxAtExit = newBlocks.findIndex((b) => b.x === exitPos.x && b.y === exitPos.y);

            if (blockIdxAtExit !== -1) {
              const block = newBlocks[blockIdxAtExit];
              if (block) {
                const exitDir = dirToVector(exitPortal.dir);
                const trajectory = getNextPosWithPortalsDetails(
                  { x: block.x, y: block.y },
                  exitDir,
                  width,
                  wallSet,
                  newBlocks.map((b) => ({ x: b.x, y: b.y })),
                  portals
                );
                const blockNewPos = trajectory.finalPos;

                if (blockNewPos.x !== block.x || blockNewPos.y !== block.y) {
                  newBlocks[blockIdxAtExit] = { ...block, x: blockNewPos.x, y: blockNewPos.y };
                  newPlayer = exitPos;
                  moved = true;
                } else {
                  return; // Block at exit portal could not move
                }
              }
            } else {
              newPlayer = exitPos;
              moved = true;
            }
          }
        }
      }
    }

    // 2. Normal step if portal teleport didn't happen
    if (!moved) {
      const nextX = ptPlayer.x + dirVector.x;
      const nextY = ptPlayer.y + dirVector.y;

      if (nextX < 0 || nextX >= width || nextY < 0 || nextY >= height) return;
      if (wallSet.has(`${nextX},${nextY}`)) return;

      const blockIdx = newBlocks.findIndex((b) => b.x === nextX && b.y === nextY);
      if (blockIdx !== -1) {
        const block = newBlocks[blockIdx];
        if (block) {
          const trajectory = getNextPosWithPortalsDetails(
            { x: block.x, y: block.y },
            dirVector,
            width,
            wallSet,
            newBlocks.map((b) => ({ x: b.x, y: b.y })),
            portals
          );
          const blockNewPos = trajectory.finalPos;
          if (blockNewPos.x !== block.x || blockNewPos.y !== block.y) {
            newBlocks[blockIdx] = { ...block, x: blockNewPos.x, y: blockNewPos.y };
            newPlayer = { x: nextX, y: nextY };
            moved = true;
          }
        }
      } else {
        newPlayer = { x: nextX, y: nextY };
        moved = true;
      }
    }

    if (moved) {
      setPtPlayer(newPlayer);
      setPtBlocks(newBlocks);
      const updatedMoves = [...ptMoves, dir];
      setPtMoves(updatedMoves);

      if (targets.length > 0) {
        const win = targets.every((t) => newBlocks.some((b) => b.x === t.x && b.y === t.y && b.color === t.color));
        if (win) setPtSolved(true);
      }
    }
  };

  useEffect(() => {
    if (!isPlaytesting) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'w', 'W'].includes(e.key)) {
        e.preventDefault();
        executeMove('Up');
      } else if (['ArrowDown', 's', 'S'].includes(e.key)) {
        e.preventDefault();
        executeMove('Down');
      } else if (['ArrowLeft', 'a', 'A'].includes(e.key)) {
        e.preventDefault();
        executeMove('Left');
      } else if (['ArrowRight', 'd', 'D'].includes(e.key)) {
        e.preventDefault();
        executeMove('Right');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaytesting, ptPlayer, ptBlocks, ptSolved, width, height, walls, targets]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full text-left font-sans">
      <div className="lg:col-span-6 bg-gray-800 rounded-2xl p-6 border border-gray-700 shadow-xl space-y-5">
        <div className="flex justify-between items-center border-b border-gray-700 pb-3">
          <h3 className="text-xl font-black text-white">
            {editingId ? 'Edit Tutorial Page' : 'Create Tutorial Page'}
          </h3>
          {editingId && (
            <button
              onClick={resetForm}
              className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1 rounded-lg transition-colors cursor-pointer"
            >
              Cancel Edit
            </button>
          )}
        </div>

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-400 font-bold mb-1">Header Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. How to Play: The Basics"
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-white font-sans text-xs focus:border-cyan-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-gray-400 font-bold mb-1">Subtitle / Category</label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="e.g. Core Objective"
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-white font-sans text-xs focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-400 font-bold mb-1">Page ID / Slug</label>
            <input
              type="text"
              value={pageIdInput}
              onChange={(e) => setPageIdInput(e.target.value)}
              disabled={!!editingId}
              placeholder="tut-basics"
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-white font-mono text-xs focus:border-cyan-500 focus:outline-none disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-gray-400 font-bold mb-1">Main Description Text *</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain the tutorial concept clearly to players..."
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-white font-sans text-xs focus:border-cyan-500 focus:outline-none leading-relaxed"
              required
            />
          </div>

          <div className="bg-gray-900/60 p-3 rounded-xl border border-gray-700 flex items-center justify-between">
            <div>
              <span className="font-bold text-white block">Include Interactive Puzzle</span>
              <span className="text-[10px] text-gray-400">Embeds playable mini-board & demo solution</span>
            </div>
            <button
              type="button"
              onClick={() => setHasPuzzle(!hasPuzzle)}
              className={`w-12 h-6 rounded-full transition-all relative cursor-pointer ${hasPuzzle ? 'bg-cyan-500' : 'bg-gray-700'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${hasPuzzle ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          {hasPuzzle && (
            <div className="bg-gray-900/90 border border-gray-700 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                <span className="font-bold text-cyan-300">Visual Puzzle Layout Builder</span>
                <div className="flex gap-2 items-center">
                  <span className="text-gray-400 font-mono">Size:</span>
                  <input
                    type="number"
                    min="4"
                    max="8"
                    value={width}
                    onChange={(e) => {
                      const v = Math.min(8, Math.max(4, Number(e.target.value)));
                      setWidth(v);
                      setHeight(v);
                    }}
                    className="w-12 bg-gray-800 border border-gray-700 rounded text-center text-white py-0.5"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex gap-1.5 flex-wrap">
                  {(['wall', 'player', 'block', 'target', 'portal', 'eraser'] as const).map((tool) => (
                    <button
                      key={tool}
                      type="button"
                      onClick={() => setSelectedTool(tool)}
                      className={`px-2.5 py-1 rounded font-bold uppercase tracking-wider text-[10px] cursor-pointer ${
                        selectedTool === tool ? 'bg-cyan-500 text-black shadow' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      {tool}
                    </button>
                  ))}
                </div>

                {(selectedTool === 'block' || selectedTool === 'target' || selectedTool === 'portal') && (
                  <div className="flex gap-1.5 items-center flex-wrap pt-1">
                    <span className="text-gray-400 font-mono text-[10px]">Color:</span>
                    {['blue', 'red', 'yellow', 'purple', 'green', 'orange', 'gray'].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setSelectedColor(c)}
                        className={`w-5 h-5 rounded-full border cursor-pointer ${selectedColor === c ? 'border-white scale-110 shadow' : 'border-transparent'}`}
                        style={{ backgroundColor: c === 'gray' ? '#9ca3af' : c }}
                      />
                    ))}

                    {selectedTool === 'portal' && (
                      <span className="text-[10px] text-cyan-300 font-mono ml-2">
                        💡 Click cell to place. Click again to rotate (▲ → ▶ → ▼ → ◀ → Delete)
                      </span>
                    )}
                  </div>
                )}
              </div>

              {isPlaytesting && (
                <div className="bg-amber-950/60 border border-amber-500/50 rounded-lg p-2 text-center text-amber-300 font-bold text-xs">
                  🎮 Live Playtest Mode: Use D-Pad or Arrow Keys to move!
                </div>
              )}

              <div
                className={`grid gap-1 bg-black/60 p-2 border rounded-lg max-w-[280px] mx-auto select-none transition-all ${
                  isPlaytesting ? 'border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 'border-gray-800'
                }`}
                style={{ gridTemplateColumns: `repeat(${width}, 1fr)` }}
              >
                {Array.from({ length: width * height }).map((_, i) => {
                  const x = i % width;
                  const y = Math.floor(i / width);

                  const curPl = isPlaytesting ? ptPlayer : player;
                  const curBlks = isPlaytesting ? ptBlocks : blocks;

                  const isWall = walls.some((w) => w.x === x && w.y === y);
                  const isPl = curPl.x === x && curPl.y === y;
                  const blk = curBlks.find((b) => b.x === x && b.y === y);
                  const tgt = targets.find((t) => t.x === x && t.y === y);
                  const ptl = portals.find((p) => p.x === x && p.y === y);

                  let cellBg = 'bg-gray-900/80 hover:bg-gray-800';
                  if (isWall) cellBg = 'bg-gray-700';

                  return (
                    <div
                      key={i}
                      onClick={() => !isPlaytesting && handleCellClick(x, y)}
                      className={`aspect-square flex items-center justify-center rounded cursor-pointer transition-colors relative ${cellBg}`}
                    >
                      {ptl && (
                        (() => {
                          const arrow = ptl.dir === 'Up' ? '▲' : ptl.dir === 'Down' ? '▼' : ptl.dir === 'Left' ? '◀' : '▶';
                          let edgePos = 'bottom-0 inset-x-0 h-2 border-t';
                          if (ptl.dir === 'Down') edgePos = 'top-0 inset-x-0 h-2 border-b';
                          else if (ptl.dir === 'Left') edgePos = 'right-0 inset-y-0 w-2 border-l';
                          else if (ptl.dir === 'Right') edgePos = 'left-0 inset-y-0 w-2 border-r';

                          return (
                            <div
                              className={`absolute ${edgePos} flex items-center justify-center text-[6px] font-black text-white border-white/80 ${getBlockColorClass(
                                ptl.color
                              )} z-0`}
                            >
                              {arrow}
                            </div>
                          );
                        })()
                      )}
                      {isPl && <div className="relative z-10 w-3.5 h-3.5 rounded-full bg-white shadow-[0_0_6px_#fff]" />}
                      {!isPl && blk && <div className="relative z-10 w-3.5 h-3.5 rounded shadow" style={{ backgroundColor: blk.color === 'gray' ? '#9ca3af' : blk.color }} />}
                      {!isPl && !blk && tgt && <div className="relative z-10 w-3 h-3 rounded border border-dashed" style={{ borderColor: tgt.color === 'gray' ? '#9ca3af' : tgt.color }} />}
                    </div>
                  );
                })}
              </div>

              <div className="bg-gray-800/80 p-3 rounded-lg border border-gray-700 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-white">Solution Moves ({solutionMoves.length})</span>
                  <button
                    type="button"
                    onClick={startPlaytest}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] px-2.5 py-1 rounded cursor-pointer"
                  >
                    {isPlaytesting ? 'Restart Playtest' : '▶ Playtest & Record Solution'}
                  </button>
                </div>

                {isPlaytesting && (
                  <div className="space-y-2 pt-2 border-t border-gray-700">
                    <div className="flex justify-center gap-1">
                      {(['Up', 'Left', 'Down', 'Right'] as const).map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => executeMove(d)}
                          className="bg-gray-700 hover:bg-gray-600 text-white font-bold px-2 py-1 rounded text-xs cursor-pointer"
                        >
                          {d === 'Up' ? '▲' : d === 'Down' ? '▼' : d === 'Left' ? '◀' : '▶'}
                        </button>
                      ))}
                    </div>
                    {ptSolved && (
                      <div className="text-center text-emerald-400 font-bold text-[11px] animate-bounce">
                        ✓ Solved! Recorded {ptMoves.length} moves.
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setSolutionMoves(ptMoves);
                        setIsPlaytesting(false);
                        showToast({ text: `Recorded ${ptMoves.length} solution moves`, appearance: 'success' });
                      }}
                      className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-1 rounded text-xs cursor-pointer"
                    >
                      Save Recorded Moves ({ptMoves.length})
                    </button>
                  </div>
                )}

                {solutionMoves.length > 0 && !isPlaytesting && (
                  <div className="text-[10px] font-mono text-cyan-300 truncate">
                    Moves: {solutionMoves.join(', ')}
                  </div>
                )}
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full theme-btn py-3 rounded-xl font-bold text-sm text-white shadow-lg cursor-pointer hover:scale-102 active:scale-98 transition-all"
          >
            {editingId ? 'Update Tutorial Page' : 'Save New Tutorial Page'}
          </button>
        </form>
      </div>

      <div className="lg:col-span-6 space-y-4">
        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 shadow-xl space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-black text-white">Tutorial Pages ({pages.length})</h3>
              <p className="text-xs text-gray-400">Order of slides shown in How to Play guide</p>
            </div>
            <button
              onClick={resetForm}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow"
            >
              + New Page
            </button>
          </div>

          {loading ? (
            <div className="text-center text-gray-400 py-12 animate-pulse font-mono text-sm">
              Loading tutorial slides...
            </div>
          ) : pages.length === 0 ? (
            <div className="text-center text-gray-400 py-12 border-2 border-dashed border-gray-700 rounded-xl text-xs font-sans">
              No tutorial pages found. Create one!
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {pages.map((page, idx) => (
                <div
                  key={page.id}
                  className="bg-gray-900/80 border border-gray-700/80 p-4 rounded-xl space-y-2 hover:border-gray-600 transition-colors"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <div className="min-w-0">
                        <h4 className="font-extrabold text-white text-sm truncate">{page.title}</h4>
                        {page.subtitle && (
                          <span className="text-[10px] text-cyan-400 font-mono font-bold block uppercase">{page.subtitle}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleMovePage(idx, 'up')}
                        disabled={idx === 0}
                        className="w-7 h-7 bg-gray-800 hover:bg-gray-700 disabled:opacity-30 text-white rounded font-bold text-xs cursor-pointer"
                      >
                        ▲
                      </button>
                      <button
                        onClick={() => handleMovePage(idx, 'down')}
                        disabled={idx === pages.length - 1}
                        className="w-7 h-7 bg-gray-800 hover:bg-gray-700 disabled:opacity-30 text-white rounded font-bold text-xs cursor-pointer"
                      >
                        ▼
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed font-sans">
                    {page.description}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-800/80 text-xs">
                    <span className="text-[10px] font-mono text-gray-500">
                      {page.puzzle ? `🧩 Mini-puzzle (${page.puzzle.width}x${page.puzzle.height})` : '📝 Text-only slide'}
                    </span>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(page)}
                        className="bg-gray-800 hover:bg-gray-700 text-white text-xs font-bold px-3 py-1 rounded cursor-pointer border border-gray-700"
                      >
                        Edit
                      </button>

                      {confirmDeleteId === page.id ? (
                        <button
                          onClick={() => handleDelete(page.id)}
                          className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded cursor-pointer"
                        >
                          Confirm
                        </button>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(page.id)}
                          className="bg-red-950/40 text-red-400 hover:bg-red-900/60 border border-red-900/40 text-xs font-bold px-3 py-1 rounded cursor-pointer"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export function DevPanel(_props?: {
  themeConfigs?: Record<string, any>;
  onSaveThemeConfigs?: () => Promise<void> | void;
  themes?: any[];
}) {
  const [activeTab, setActiveTab] = useState<DevTab>('easy');
  const [isDeveloper, setIsDeveloper] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Dev Accounts states
  const [devAccounts, setDevAccounts] = useState<string[]>([]);
  const [newDevUsername, setNewDevUsername] = useState('');
  const [addingDev, setAddingDev] = useState(false);
  const [confirmDeleteDev, setConfirmDeleteDev] = useState<string | null>(null);

  const fetchDevAccounts = async () => {
    try {
      const res = await trpc.dev.getDevAccounts.query();
      setDevAccounts(res);
    } catch (e) {
      console.error('Failed to fetch dev accounts:', e);
    }
  };

  // States for puzzle list
  const [puzzles, setPuzzles] = useState<Puzzle[]>([]);
  const [allPuzzles, setAllPuzzles] = useState<Puzzle[]>([]);
  const [selectedDailyPostPuzzleId, setSelectedDailyPostPuzzleId] = useState('');
  const [creatingDailyPost, setCreatingDailyPost] = useState(false);
  const [loadingPuzzles, setLoadingPuzzles] = useState(false);
  const [selectedPuzzleId, setSelectedPuzzleId] = useState<string | null>(null);

  // Form states
  const [puzzleName, setPuzzleName] = useState('');
  const [puzzleJson, setPuzzleJson] = useState('');
  const [dailyDate, setDailyDate] = useState(new Date().toISOString().split('T')[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [resetCounterValue, setResetCounterValue] = useState<number | undefined>(undefined);

  // Visual Editor states
  const [editMode, setEditMode] = useState<'visual' | 'json'>('visual');
  const [gridWidth, setGridWidth] = useState(9);
  const [gridHeight, setGridHeight] = useState(9);
  const [editorPlayer, setEditorPlayer] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [editorWalls, setEditorWalls] = useState<{ x: number; y: number }[]>([]);
  const [editorBlocks, setEditorBlocks] = useState<{ id: string; color: string; x: number; y: number }[]>([]);
  const [editorTargets, setEditorTargets] = useState<{ id: string; color: string; x: number; y: number }[]>([]);
  const [editorPortals, setEditorPortals] = useState<
    { id: string; color: string; x: number; y: number; dir: 'Up' | 'Down' | 'Left' | 'Right' }[]
  >([]);
  const [editorMoves, setEditorMoves] = useState<string[]>([]);
  const [selectedTool, setSelectedTool] = useState<'wall' | 'player' | 'block' | 'target' | 'portal' | 'eraser'>(
    'wall'
  );
  const [selectedColor, setSelectedColor] = useState<string>('red');

  // Playtest states
  const [playtestActive, setPlaytestActive] = useState(false);
  const [playtestPlayer, setPlaytestPlayer] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [playtestBlocks, setPlaytestBlocks] = useState<{ id: string; color: string; x: number; y: number }[]>([]);
  const [playtestMoves, setPlaytestMoves] = useState<string[]>([]);
  const [playtestSolved, setPlaytestSolved] = useState(false);

  // Reactive playtest win detection
  useEffect(() => {
    if (!playtestActive || playtestSolved || editorTargets.length === 0) return;
    const won = editorTargets.every((dest) =>
      playtestBlocks.some((b) => b.x === dest.x && b.y === dest.y && b.color === dest.color)
    );
    if (won) {
      setPlaytestSolved(true);
      playWinMelody();
    }
  }, [playtestBlocks, editorTargets, playtestActive, playtestSolved]);

  const [targetMappingDate, setTargetMappingDate] = useState<string>(
    new Date().toISOString().split('T')[0] || ''
  );
  const [mappingPostId, setMappingPostId] = useState<string | null>(null);
  const [mappedPuzzleId, setMappedPuzzleId] = useState<string | null>(null);
  const [mappedNumber, setMappedNumber] = useState<number | null>(null);
  const [selectedNewPuzzleId, setSelectedNewPuzzleId] = useState('');
  const [newDailyNumber, setNewDailyNumber] = useState<number | undefined>(undefined);
  const [loadingMapping, setLoadingMapping] = useState(false);
  const [savingMapping, setSavingMapping] = useState(false);
  const [syncingPosts, setSyncingPosts] = useState(false);

  // Shard Adjustment states
  const [moderatorShards, setModeratorShards] = useState<number>(0);
  const [shardAmount, setShardAmount] = useState<number>(0);
  const [adjustingShards, setAdjustingShards] = useState(false);

  // Cosmetics Management States
  const [devUserThemes, setDevUserThemes] = useState<string[]>(['neon']);
  const [devUserCharacters, setDevUserCharacters] = useState<string[]>(['neon']);
  const [devEarnedTiers, setDevEarnedTiers] = useState<{ easy: boolean; medium: boolean; hard: boolean }>({
    easy: false,
    medium: false,
    hard: false,
  });

  const fetchCosmeticStatus = async () => {
    try {
      const [shopStatus, tierStatus] = await Promise.all([
        trpc.shop.getStatus.query(),
        trpc.dev.getTierEarnedStatus.query(),
      ]);
      setDevUserThemes(shopStatus.purchasedThemes);
      setDevUserCharacters(shopStatus.purchasedCharacters);
      setDevEarnedTiers(tierStatus);
    } catch (err) {
      console.error('Failed to fetch cosmetic status:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'skins' && isDeveloper) {
      void fetchCosmeticStatus();
    }
  }, [activeTab, isDeveloper]);

  const handleToggleDevTheme = async (themeId: string, currentUnlocked: boolean) => {
    try {
      await trpc.dev.toggleCosmetic.mutate({
        type: 'theme',
        id: themeId,
        unlocked: !currentUnlocked,
      });
      showToast({
        text: `${themeId} theme ${!currentUnlocked ? 'UNLOCKED' : 'LOCKED'}`,
        appearance: 'success',
      });
    } catch (err) {
      showToast({ text: 'Failed to toggle theme', appearance: 'neutral' });
    }
  };

  const handleToggleDevCharacter = async (charId: string, currentUnlocked: boolean) => {
    try {
      await trpc.dev.toggleCosmetic.mutate({
        type: 'character',
        id: charId,
        unlocked: !currentUnlocked,
      });
      showToast({
        text: `${charId} character ${!currentUnlocked ? 'UNLOCKED' : 'LOCKED'}`,
        appearance: 'success',
      });
    } catch (err) {
      showToast({ text: 'Failed to toggle character', appearance: 'neutral' });
    }
  };

  const handleToggleDevTier = async (tier: 'easy' | 'medium' | 'hard', currentEarned: boolean) => {
    try {
      await trpc.dev.toggleTierEarned.mutate({
        tier,
        earned: !currentEarned,
      });
      showToast({
        text: `${tier} campaign tier status ${!currentEarned ? 'GRANTED' : 'REVOKED'}`,
        appearance: 'success',
      });
    } catch (err) {
      showToast({ text: 'Failed to toggle tier status', appearance: 'neutral' });
    }
  };

  const fetchCurrencyBalance = async () => {
    try {
      const res = await trpc.currency.get.query();
      setModeratorShards(res.currency);
    } catch (err) {
      console.error('Failed to fetch currency balance:', err);
    }
  };

  // Check developer status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const result = await trpc.dev.checkAuth.query();
        setIsDeveloper(result.isDev);
        setUsername(result.username || null);
        if (result.isDev) {
          const currencyRes = await trpc.currency.get.query();
          setModeratorShards(currencyRes.currency);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsDeveloper(false);
      } finally {
        setLoading(false);
      }
    };

    void checkAuth();
  }, []);

  useEffect(() => {
    if (activeTab === 'devs' && isDeveloper) {
      void fetchDevAccounts();
    }
  }, [activeTab, isDeveloper]);

  const loadPostMapping = async (dateToLoad: string) => {
    if (!dateToLoad) return;
    setLoadingMapping(true);
    try {
      const res = await trpc.dev.getPostMappingByDate.query({ date: dateToLoad });
      setMappingPostId(res.postId);
      setMappedPuzzleId(res.puzzleId);
      setMappedNumber(res.number);
      setSelectedNewPuzzleId(res.puzzleId || '');
      setNewDailyNumber(res.number || undefined);
    } catch (err) {
      console.error(err);
      showToast({ text: 'Failed to load mapping for date', appearance: 'neutral' });
    } finally {
      setLoadingMapping(false);
    }
  };

  useEffect(() => {
    if (isDeveloper) {
      const todayStr = new Date().toISOString().split('T')[0];
      if (todayStr) {
        void loadPostMapping(todayStr);
      }
    }
  }, [isDeveloper]);

  const handleSavePostMapping = async () => {
    if (!targetMappingDate || !selectedNewPuzzleId) {
      showToast({ text: 'Date and Selected Puzzle are required', appearance: 'neutral' });
      return;
    }
    setSavingMapping(true);
    try {
      await trpc.dev.setPostMappingByDate.mutate({
        date: targetMappingDate,
        puzzleId: selectedNewPuzzleId,
        number: newDailyNumber !== undefined ? Number(newDailyNumber) : undefined,
      });
      showToast({ text: 'Post mapping updated successfully!', appearance: 'success' });
      void loadPostMapping(targetMappingDate);
    } catch (err) {
      console.error(err);
      showToast({ text: 'Failed to save post mapping', appearance: 'neutral' });
    } finally {
      setSavingMapping(false);
    }
  };

  const handleSyncPosts = async () => {
    setSyncingPosts(true);
    try {
      const res = await trpc.dev.syncDailyPosts.mutate();
      showToast({ text: `Successfully synced ${res.syncedCount} daily posts!`, appearance: 'success' });
      if (targetMappingDate) {
        void loadPostMapping(targetMappingDate);
      }
    } catch (err) {
      console.error(err);
      showToast({ text: 'Failed to sync daily posts', appearance: 'neutral' });
    } finally {
      setSyncingPosts(false);
    }
  };

  // Fetch puzzles when puzzle difficulty tab changes
  useEffect(() => {
    if (isDeveloper) {
      if (activeTab === 'daily' || activeTab === 'easy' || activeTab === 'medium' || activeTab === 'hard') {
        void loadPuzzles();
        void loadAllPuzzles();
        resetForm();
        setSelectedPuzzleId(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, isDeveloper]);

  const loadAllPuzzles = async () => {
    try {
      const data = await trpc.dev.getAllPuzzles.query();
      setAllPuzzles(data);
    } catch (error) {
      console.error('Failed to load all puzzles for daily post selection', error);
      showToast({ text: 'Failed to load puzzle list', appearance: 'neutral' });
    }
  };

  const handleCreateDailyPost = async () => {
    if (!selectedDailyPostPuzzleId) {
      showToast({ text: 'Select a puzzle to publish', appearance: 'neutral' });
      return;
    }

    setCreatingDailyPost(true);
    try {
      let dateParam: string | undefined = undefined;
      if (selectedDailyPostPuzzleId.startsWith('daily-')) {
        const datePart = selectedDailyPostPuzzleId.replace('daily-', '');
        if (datePart.match(/^\d{4}-\d{2}-\d{2}$/)) {
          dateParam = datePart;
        }
      }

      await trpc.dev.createDailyPost.mutate({
        puzzleId: selectedDailyPostPuzzleId,
        date: dateParam,
      });
      showToast({ text: 'Daily post created successfully!', appearance: 'success' });
    } catch (error) {
      console.error(error);
      showToast({ text: 'Failed to create daily post', appearance: 'neutral' });
    } finally {
      setCreatingDailyPost(false);
    }
  };

  // Visual state -> JSON String synchronization
  useEffect(() => {
    if (editMode === 'visual') {
      const obj = {
        width: gridWidth,
        height: gridHeight,
        player: editorPlayer,
        walls: editorWalls,
        blocks: editorBlocks,
        targets: editorTargets,
        portals: editorPortals,
        playerMoves: editorMoves,
      };
      setPuzzleJson(JSON.stringify(obj, null, 2));
    }
  }, [gridWidth, gridHeight, editorPlayer, editorWalls, editorBlocks, editorTargets, editorPortals, editorMoves, editMode]);

  // JSON String -> Visual state synchronization
  useEffect(() => {
    if (editMode === 'json') return;
    try {
      if (!puzzleJson.trim()) return;
      const parsed = JSON.parse(puzzleJson);
      if (parsed && typeof parsed === 'object') {
        if (typeof parsed.width === 'number') setGridWidth(parsed.width);
        if (typeof parsed.height === 'number') setGridHeight(parsed.height);
        if (parsed.player && typeof parsed.player.x === 'number' && typeof parsed.player.y === 'number') {
          setEditorPlayer(parsed.player);
        }
        if (Array.isArray(parsed.walls)) setEditorWalls(parsed.walls);
        if (Array.isArray(parsed.blocks)) setEditorBlocks(parsed.blocks);
        if (Array.isArray(parsed.targets)) setEditorTargets(parsed.targets);
        if (Array.isArray(parsed.portals)) setEditorPortals(parsed.portals);
        if (Array.isArray(parsed.playerMoves)) setEditorMoves(parsed.playerMoves);
      }
    } catch (e) {
      // Don't log syntax errors while user is typing invalid JSON
    }
  }, [puzzleJson, editMode]);

  const handleAdjustShards = async (amount: number, isAddition: boolean) => {
    if (amount <= 0) {
      showToast({ text: 'Please enter a valid positive number', appearance: 'neutral' });
      return;
    }
    setAdjustingShards(true);
    try {
      const amountToAdjust = isAddition ? amount : -amount;
      const res = await trpc.dev.adjustCurrency.mutate({ amount: amountToAdjust });
      if (res.success) {
        setModeratorShards(res.currency);
        setShardAmount(0);
        showToast({
          text: `Successfully ${isAddition ? 'added' : 'removed'} ${amount} shards!`,
          appearance: 'success',
        });
      }
    } catch (err) {
      console.error(err);
      showToast({ text: 'Failed to adjust shards balance', appearance: 'neutral' });
    } finally {
      setAdjustingShards(false);
    }
  };

  const loadPuzzles = async () => {
    if (activeTab !== 'daily' && activeTab !== 'easy' && activeTab !== 'medium' && activeTab !== 'hard') return;
    setLoadingPuzzles(true);
    try {
      const data = await trpc.puzzle.getByDifficulty.query(activeTab);
      setPuzzles(data);
    } catch (error) {
      showToast({ text: 'Failed to load puzzles', appearance: 'neutral' });
    } finally {
      setLoadingPuzzles(false);
    }
  };

  const resetForm = () => {
    setPuzzleName('');
    setPuzzleJson('');
    setEditingId(null);
    setGridWidth(9);
    setGridHeight(9);
    setEditorPlayer({ x: 0, y: 0 });
    setEditorWalls([]);
    setEditorBlocks([]);
    setEditorTargets([]);
    setEditorPortals([]);
    setEditorMoves([]);
    setResetCounterValue(undefined);
  };

  const handleEdit = (puzzle: Puzzle) => {
    setEditingId(puzzle.id);
    setPuzzleName(puzzle.name);
    const { id, name, difficulty, createdAt, ...cleanJson } = puzzle;
    setPuzzleJson(JSON.stringify(cleanJson, null, 2));

    if (puzzle.difficulty === 'daily') {
      const dateStr = puzzle.id.replace('daily-', '');
      if (dateStr && dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        setDailyDate(dateStr);
      }
    }
  };

  const handleClone = async (puzzle: Puzzle, targetDifficulty: PuzzleDifficulty) => {
    try {
      let newId = `${targetDifficulty}-${Date.now()}`;
      if (targetDifficulty === 'daily') {
        const todayStr = new Date().toISOString().split('T')[0];
        newId = `daily-${todayStr}`;
      }

      const clonedPuzzle: Puzzle = {
        ...puzzle,
        id: newId,
        difficulty: targetDifficulty,
        name: `${puzzle.name} (Copy)`,
        createdAt: Date.now(),
      };

      await trpc.dev.createPuzzle.mutate(clonedPuzzle);

      if (targetDifficulty === 'daily') {
        const todayStr = new Date().toISOString().split('T')[0];
        if (todayStr) {
          await trpc.dev.assignDaily.mutate({
            puzzleId: clonedPuzzle.id,
            date: todayStr,
          });
        }
      }

      showToast({ text: `Cloned puzzle to ${targetDifficulty}!`, appearance: 'success' });

      if (activeTab === targetDifficulty) {
        await loadPuzzles();
      }
    } catch (error) {
      console.error(error);
      showToast({ text: 'Failed to clone puzzle', appearance: 'neutral' });
    }
  };

  const handleDeletePuzzle = async (id: string) => {
    try {
      await trpc.dev.deletePuzzle.mutate(id);
      showToast({ text: 'Puzzle deleted', appearance: 'success' });
      setConfirmDeleteId(null);
      if (selectedPuzzleId === id) setSelectedPuzzleId(null);
      await loadPuzzles();
    } catch (error) {
      showToast({ text: 'Failed to delete puzzle', appearance: 'neutral' });
    }
  };

  const handleCellClick = (x: number, y: number) => {
    if (selectedTool === 'wall') {
      const exists = editorWalls.some((w) => w.x === x && w.y === y);
      if (exists) {
        setEditorWalls(editorWalls.filter((w) => w.x !== x || w.y !== y));
      } else {
        setEditorWalls([...editorWalls, { x, y }]);
        setEditorBlocks(editorBlocks.filter((b) => b.x !== x || b.y !== y));
        setEditorTargets(editorTargets.filter((t) => t.x !== x || t.y !== y));
        setEditorPortals(editorPortals.filter((p) => p.x !== x || p.y !== y));
      }
    } else if (selectedTool === 'player') {
      setEditorPlayer({ x, y });
      setEditorWalls(editorWalls.filter((w) => w.x !== x || w.y !== y));
    } else if (selectedTool === 'block') {
      const existingIdx = editorBlocks.findIndex((b) => b.x === x && b.y === y);
      if (existingIdx !== -1) {
        if (editorBlocks[existingIdx]?.color === selectedColor) {
          setEditorBlocks(editorBlocks.filter((_, idx) => idx !== existingIdx));
        } else {
          const updated = [...editorBlocks];
          const item = updated[existingIdx];
          if (item) item.color = selectedColor;
          setEditorBlocks(updated);
        }
      } else {
        setEditorBlocks([...editorBlocks, { id: `b_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, color: selectedColor, x, y }]);
        setEditorWalls(editorWalls.filter((w) => w.x !== x || w.y !== y));
      }
    } else if (selectedTool === 'target') {
      const existingIdx = editorTargets.findIndex((t) => t.x === x && t.y === y);
      if (existingIdx !== -1) {
        if (editorTargets[existingIdx]?.color === selectedColor) {
          setEditorTargets(editorTargets.filter((_, idx) => idx !== existingIdx));
        } else {
          const updated = [...editorTargets];
          const item = updated[existingIdx];
          if (item) item.color = selectedColor;
          setEditorTargets(updated);
        }
      } else {
        setEditorTargets([...editorTargets, { id: `t_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, color: selectedColor, x, y }]);
        setEditorWalls(editorWalls.filter((w) => w.x !== x || w.y !== y));
      }
    } else if (selectedTool === 'portal') {
      const existingIdx = editorPortals.findIndex((p) => p.x === x && p.y === y);
      const directions: ('Up' | 'Down' | 'Left' | 'Right')[] = ['Up', 'Right', 'Down', 'Left'];
      if (existingIdx !== -1) {
        const item = editorPortals[existingIdx];
        if (item) {
          const currentDirIdx = directions.indexOf(item.dir);
          const nextDir = directions[(currentDirIdx + 1) % directions.length];
          if (nextDir === 'Up') {
            setEditorPortals(editorPortals.filter((_, idx) => idx !== existingIdx));
          } else {
            const updated = [...editorPortals];
            const targetItem = updated[existingIdx];
            if (targetItem && nextDir) targetItem.dir = nextDir;
            setEditorPortals(updated);
          }
        }
      } else {
        setEditorPortals([...editorPortals, { id: `p_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, color: selectedColor, x, y, dir: 'Up' }]);
        setEditorWalls(editorWalls.filter((w) => w.x !== x || w.y !== y));
      }
    } else if (selectedTool === 'eraser') {
      setEditorWalls(editorWalls.filter((w) => w.x !== x || w.y !== y));
      setEditorBlocks(editorBlocks.filter((b) => b.x !== x || b.y !== y));
      setEditorTargets(editorTargets.filter((t) => t.x !== x || t.y !== y));
      setEditorPortals(editorPortals.filter((p) => p.x !== x || p.y !== y));
    }
  };

  const startPlaytest = () => {
    setPlaytestPlayer({ ...editorPlayer });
    setPlaytestBlocks(editorBlocks.map((b) => ({ ...b })));
    setPlaytestMoves([]);
    setPlaytestSolved(false);
    setPlaytestActive(true);
  };

  const executePlaytestMove = (dir: 'Up' | 'Down' | 'Left' | 'Right') => {
    if (playtestSolved) return;

    const dirVector = dirToVector(dir);
    const gridSize = Math.max(gridWidth, gridHeight);
    const wallSet = new Set(editorWalls.map((w) => `${w.x},${w.y}`));

    let newPlayer = { ...playtestPlayer };
    let newBlocks = playtestBlocks.map((b) => ({ ...b }));
    let moved = false;

    // 1. Check if character is standing on a portal and moving into it
    const portalOnCurrentCell = editorPortals.find(
      (p) => p.x === playtestPlayer.x && p.y === playtestPlayer.y
    );

    if (portalOnCurrentCell) {
      const portalVec = dirToVector(portalOnCurrentCell.dir);
      if (portalVec.x === -dirVector.x && portalVec.y === -dirVector.y) {
        const exitPortal = editorPortals.find(
          (p) => p.color.toLowerCase() === portalOnCurrentCell.color.toLowerCase() && p.id !== portalOnCurrentCell.id
        );

        if (exitPortal) {
          const exitPos = { x: exitPortal.x, y: exitPortal.y };
          const isExitWallOrBound =
            exitPos.x < 0 || exitPos.x >= gridWidth ||
            exitPos.y < 0 || exitPos.y >= gridHeight ||
            wallSet.has(`${exitPos.x},${exitPos.y}`);

          if (!isExitWallOrBound) {
            const blockIdxAtExit = newBlocks.findIndex((b) => b.x === exitPos.x && b.y === exitPos.y);

            if (blockIdxAtExit !== -1) {
              const block = newBlocks[blockIdxAtExit];
              if (block) {
                const exitDir = dirToVector(exitPortal.dir);
                const trajectory = getNextPosWithPortalsDetails(
                  { x: block.x, y: block.y },
                  exitDir,
                  gridSize,
                  wallSet,
                  newBlocks.map((b) => ({ x: b.x, y: b.y })),
                  editorPortals
                );
                const blockNewPos = trajectory.finalPos;

                if (blockNewPos.x !== block.x || blockNewPos.y !== block.y) {
                  newBlocks[blockIdxAtExit] = { ...block, x: blockNewPos.x, y: blockNewPos.y };
                  newPlayer = exitPos;
                  moved = true;
                } else {
                  return; // Block at exit portal could not move
                }
              }
            } else {
              newPlayer = exitPos;
              moved = true;
            }
          }
        }
      }
    }

    // 2. Normal step if portal teleport didn't happen
    if (!moved) {
      const nextX = playtestPlayer.x + dirVector.x;
      const nextY = playtestPlayer.y + dirVector.y;

      if (nextX < 0 || nextX >= gridWidth || nextY < 0 || nextY >= gridHeight) return;
      if (wallSet.has(`${nextX},${nextY}`)) return;

      const blockIdx = newBlocks.findIndex((b) => b.x === nextX && b.y === nextY);
      if (blockIdx !== -1) {
        const block = newBlocks[blockIdx];
        if (!block) return;

        const trajectory = getNextPosWithPortalsDetails(
          { x: block.x, y: block.y },
          dirVector,
          gridSize,
          wallSet,
          newBlocks.map((b) => ({ x: b.x, y: b.y })),
          editorPortals
        );
        const blockNewPos = trajectory.finalPos;

        if (blockNewPos.x === block.x && blockNewPos.y === block.y) {
          return; // Block could not move
        }

        newBlocks[blockIdx] = { ...block, x: blockNewPos.x, y: blockNewPos.y };
        newPlayer = { x: nextX, y: nextY };
        moved = true;
      } else {
        newPlayer = { x: nextX, y: nextY };
        moved = true;
      }
    }

    if (moved) {
      setPlaytestBlocks(newBlocks);
      setPlaytestPlayer(newPlayer);
      setPlaytestMoves([...playtestMoves, dir]);
    }
  };

  useEffect(() => {
    if (!playtestActive || playtestSolved) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          executePlaytestMove('Up');
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          executePlaytestMove('Down');
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          executePlaytestMove('Left');
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          executePlaytestMove('Right');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playtestActive, playtestSolved, executePlaytestMove]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!puzzleName.trim() || !puzzleJson.trim()) {
      showToast({ text: 'Puzzle Name and Content are required', appearance: 'neutral' });
      return;
    }

    try {
      const parsedContent = JSON.parse(puzzleJson);
      let finalId = editingId;
      if (!finalId) {
        if (activeTab === 'daily') {
          finalId = `daily-${dailyDate}`;
        } else {
          finalId = `${activeTab}-${Date.now()}`;
        }
      }

      // if (activeTab === 'daily' && resetCounterValue !== undefined) {
      //   await trpc.dev.setDailyPuzzleCounter.mutate({ number: Number(resetCounterValue) });
      // }

      const puzzle: Puzzle = {
        ...parsedContent,
        id: finalId,
        name: puzzleName,
        difficulty: activeTab === 'daily' || activeTab === 'easy' || activeTab === 'medium' || activeTab === 'hard' ? activeTab : 'easy',
        createdAt: Date.now(),
      };

      await trpc.dev.createPuzzle.mutate(puzzle);

      if (activeTab === 'daily' && !editingId) {
        await trpc.dev.assignDaily.mutate({
          puzzleId: puzzle.id,
          date: dailyDate,
        });
      }

      showToast({
        text: editingId ? 'Puzzle updated!' : 'Puzzle created successfully!',
        appearance: 'success',
      });

      resetForm();
      await loadPuzzles();
      await loadAllPuzzles();
    } catch (error) {
      console.error(error);
      showToast({ text: 'Invalid JSON format or save error', appearance: 'neutral' });
    }
  };

  if (loading) {
    return <div className="text-gray-400 p-8 text-center animate-pulse font-mono">Verifying Developer Access...</div>;
  }

  if (!isDeveloper) {
    return (
      <div className="bg-gray-800 rounded-2xl p-8 border border-red-500/40 max-w-md mx-auto my-12 text-center text-white font-sans">
        <h2 className="text-2xl font-bold mb-2 text-red-400">Access Restricted</h2>
        <p className="text-gray-400 text-sm mb-4">
          Your Reddit account <span className="font-mono text-white">u/{username || 'Unknown'}</span> is not authorized for Developer Tools.
        </p>
      </div>
    );
  }

  const puzzleDifficulties: ('daily' | 'easy' | 'medium' | 'hard')[] = ['daily', 'easy', 'medium', 'hard'];

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 pt-12 text-left">
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div>
              <h1 className="text-4xl font-black mb-1 bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-400 bg-clip-text text-transparent">
                Developer Space
              </h1>
              <p className="text-gray-400 text-sm font-mono">
                System Management & Board Architect • <span className="text-cyan-400 font-bold">u/{username}</span>
              </p>
            </div>
            <div className="bg-gray-800 border border-gray-700/80 rounded-xl px-4 py-2 text-xs font-mono flex items-center gap-3">
              <span className="text-gray-400">Moderator Shards:</span>
              <span className="text-cyan-300 font-extrabold text-sm">{moderatorShards.toLocaleString()} 💎</span>
            </div>
          </div>
        </div>

        {/* Top Navigation Tabs */}
        <div className="flex gap-2 mb-8 border-b border-gray-700/80 overflow-x-auto pb-2 scrollbar-none">
          {puzzleDifficulties.map((diff) => (
            <button
              key={diff}
              onClick={() => setActiveTab(diff)}
              className={cn(
                'px-5 py-2.5 rounded-xl font-bold text-sm transition-all capitalize whitespace-nowrap cursor-pointer flex items-center gap-2 border',
                activeTab === diff
                  ? 'bg-blue-600/30 text-blue-300 border-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.3)]'
                  : 'bg-gray-800/60 text-gray-400 border-gray-700/60 hover:text-gray-200 hover:bg-gray-800'
              )}
            >
              {diff === 'daily' && '📅'}
              {diff === 'easy' && '🟢'}
              {diff === 'medium' && '🟡'}
              {diff === 'hard' && '🔴'}
              <span>{diff} Puzzles</span>
            </button>
          ))}

          <button
            onClick={() => setActiveTab('howto')}
            className={cn(
              'px-5 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 border',
              activeTab === 'howto'
                ? 'bg-amber-600/30 text-amber-300 border-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                : 'bg-gray-800/60 text-gray-400 border-gray-700/60 hover:text-gray-200 hover:bg-gray-800'
            )}
          >
            📘 How To
          </button>

          <button
            onClick={() => setActiveTab('currency')}
            className={cn(
              'px-5 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 border',
              activeTab === 'currency'
                ? 'bg-cyan-600/30 text-cyan-300 border-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                : 'bg-gray-800/60 text-gray-400 border-gray-700/60 hover:text-gray-200 hover:bg-gray-800'
            )}
          >
            💎 Currency
          </button>

          <button
            onClick={() => setActiveTab('posts')}
            className={cn(
              'px-5 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 border',
              activeTab === 'posts'
                ? 'bg-purple-600/30 text-purple-300 border-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                : 'bg-gray-800/60 text-gray-400 border-gray-700/60 hover:text-gray-200 hover:bg-gray-800'
            )}
          >
            📌 Post Mapping
          </button>

          <button
            onClick={() => setActiveTab('devs')}
            className={cn(
              'px-5 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 border',
              activeTab === 'devs'
                ? 'bg-amber-600/30 text-amber-300 border-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                : 'bg-gray-800/60 text-gray-400 border-gray-700/60 hover:text-gray-200 hover:bg-gray-800'
            )}
          >
            Dev Accounts
          </button>

          <button
            onClick={() => setActiveTab('skins')}
            className={cn(
              'px-5 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 border',
              activeTab === 'skins'
                ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                : 'bg-gray-800/60 text-gray-400 border-gray-700/60 hover:text-gray-200 hover:bg-gray-800'
            )}
          >
            Skins & Earned Rewards
          </button>
        </div>

        {/* Tab Contents */}
        {activeTab === 'howto' ? (
          <HowToManagerPanel />
        ) : activeTab === 'currency' ? (
          <CurrencyManagerPanel
            username={username}
            moderatorShards={moderatorShards}
            shardAmount={shardAmount}
            setShardAmount={setShardAmount}
            adjustingShards={adjustingShards}
            onAdjustShards={handleAdjustShards}
            onRefreshCurrency={fetchCurrencyBalance}
          />
        ) : activeTab === 'posts' ? (
          <PostMappingPanel
            allPuzzles={allPuzzles}
            selectedDailyPostPuzzleId={selectedDailyPostPuzzleId}
            setSelectedDailyPostPuzzleId={setSelectedDailyPostPuzzleId}
            creatingDailyPost={creatingDailyPost}
            handleCreateDailyPost={handleCreateDailyPost}
            targetMappingDate={targetMappingDate}
            setTargetMappingDate={setTargetMappingDate}
            loadPostMapping={loadPostMapping}
            loadingMapping={loadingMapping}
            mappingPostId={mappingPostId}
            mappedPuzzleId={mappedPuzzleId}
            mappedNumber={mappedNumber}
            selectedNewPuzzleId={selectedNewPuzzleId}
            setSelectedNewPuzzleId={setSelectedNewPuzzleId}
            newDailyNumber={newDailyNumber}
            setNewDailyNumber={setNewDailyNumber}
            savingMapping={savingMapping}
            handleSavePostMapping={handleSavePostMapping}
            syncingPosts={syncingPosts}
            handleSyncPosts={handleSyncPosts}
          />
        ) : activeTab === 'devs' ? (
          <DevAccountsPanel
            devAccounts={devAccounts}
            newDevUsername={newDevUsername}
            setNewDevUsername={setNewDevUsername}
            addingDev={addingDev}
            setAddingDev={setAddingDev}
            confirmDeleteDev={confirmDeleteDev}
            setConfirmDeleteDev={setConfirmDeleteDev}
            fetchDevAccounts={fetchDevAccounts}
          />
        ) : activeTab === 'skins' ? (
          <SkinsManagerPanel
            userThemes={devUserThemes}
            userCharacters={devUserCharacters}
            earnedTiers={devEarnedTiers}
            onToggleTheme={handleToggleDevTheme}
            onToggleCharacter={handleToggleDevCharacter}
            onToggleTier={handleToggleDevTier}
            onRefresh={fetchCosmeticStatus}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Create / Edit Form */}
            <div className="lg:col-span-1">
              <div className="bg-gray-800 rounded-2xl p-6 sticky top-6 border border-gray-700 shadow-xl text-left font-sans">
                {playtestActive ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h2 className="text-xl font-bold text-yellow-400 animate-pulse">Playtesting</h2>
                      <span className="bg-blue-900 text-blue-200 px-3 py-1 rounded text-sm font-bold font-mono">
                        Moves: {playtestMoves.length}
                      </span>
                    </div>

                    <div
                      className="grid gap-1 bg-gray-950 p-2 border border-gray-800 rounded-lg overflow-auto max-w-full touch-none select-none"
                      style={{
                        gridTemplateColumns: `repeat(${gridWidth}, 1fr)`,
                        aspectRatio: '1',
                        width: '100%',
                        maxHeight: '400px',
                      }}
                    >
                      {Array.from({ length: gridWidth * gridHeight }).map((_, i) => {
                        const x = i % gridWidth;
                        const y = Math.floor(i / gridWidth);
                        const isWall = editorWalls.some((w) => w.x === x && w.y === y);
                        const isPlayer = playtestPlayer.x === x && playtestPlayer.y === y;
                        const block = playtestBlocks.find((b) => b.x === x && b.y === y);
                        const target = editorTargets.find((t) => t.x === x && t.y === y);
                        const portal = editorPortals.find((p) => p.x === x && p.y === y);

                        let cellBg = 'bg-gray-900/60';
                        if (isWall) {
                          cellBg = 'bg-gray-700';
                        }

                        return (
                          <div
                            key={i}
                            className={`relative aspect-square flex items-center justify-center rounded-sm ${cellBg}`}
                          >
                            {portal && (
                              (() => {
                                const arrow =
                                  portal.dir === 'Up' ? '▲' : portal.dir === 'Down' ? '▼' : portal.dir === 'Left' ? '◀' : '▶';
                                let edgePos = 'bottom-0 inset-x-0 h-2 border-t';
                                if (portal.dir === 'Down') edgePos = 'top-0 inset-x-0 h-2 border-b';
                                else if (portal.dir === 'Left') edgePos = 'right-0 inset-y-0 w-2 border-l';
                                else if (portal.dir === 'Right') edgePos = 'left-0 inset-y-0 w-2 border-r';

                                return (
                                  <div
                                    className={`absolute ${edgePos} flex items-center justify-center text-[6px] font-black text-white border-white/80 ${getBlockColorClass(
                                      portal.color
                                    )} z-0`}
                                  >
                                    {arrow}
                                  </div>
                                );
                              })()
                            )}
                            {isPlayer && (
                              <div className="relative z-10 w-5 h-5 rounded-full bg-white border border-black flex items-center justify-center text-[10px] text-black font-bold">
                                P
                              </div>
                            )}
                            {!isPlayer && block && (
                              <div className={`relative z-10 w-5 h-5 rounded ${getBlockColorClass(block.color)}`} />
                            )}
                            {!isPlayer && !block && target && (
                              <div className={`relative z-10 w-4 h-4 rounded ${getTargetColorClass(target.color)}`} />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <p className="text-xs text-center text-gray-400">
                      💡 Use buttons below to playtest and record optimal moves
                    </p>

                    {/* D-Pad controls */}
                    <div className="flex flex-col items-center gap-1 my-2 select-none">
                      <button
                        type="button"
                        onClick={() => executePlaytestMove('Up')}
                        disabled={playtestSolved}
                        className="w-12 h-10 bg-gray-700 hover:bg-gray-600 active:bg-blue-600 disabled:opacity-50 text-white font-bold rounded-t-lg flex items-center justify-center border border-gray-600 shadow cursor-pointer"
                      >
                        ▲
                      </button>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => executePlaytestMove('Left')}
                          disabled={playtestSolved}
                          className="w-12 h-10 bg-gray-700 hover:bg-gray-600 active:bg-blue-600 disabled:opacity-50 text-white font-bold rounded-l-lg flex items-center justify-center border border-gray-600 shadow cursor-pointer"
                        >
                          ◀
                        </button>
                        <button
                          type="button"
                          onClick={() => executePlaytestMove('Down')}
                          disabled={playtestSolved}
                          className="w-12 h-10 bg-gray-700 hover:bg-gray-600 active:bg-blue-600 disabled:opacity-50 text-white font-bold rounded-b-lg flex items-center justify-center border border-gray-600 shadow cursor-pointer"
                        >
                          ▼
                        </button>
                        <button
                          type="button"
                          onClick={() => executePlaytestMove('Right')}
                          disabled={playtestSolved}
                          className="w-12 h-10 bg-gray-700 hover:bg-gray-600 active:bg-blue-600 disabled:opacity-50 text-white font-bold rounded-r-lg flex items-center justify-center border border-gray-600 shadow cursor-pointer"
                        >
                          ▶
                        </button>
                      </div>
                    </div>

                    {playtestSolved && (
                      <div className="bg-green-950/80 border border-green-700 rounded-lg p-3 text-center text-green-300 font-bold">
                        🎉 Level Solved in {playtestMoves.length} moves!
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditorMoves(playtestMoves);
                          setPlaytestActive(false);
                          showToast({ text: `Recorded ${playtestMoves.length} moves for level.`, appearance: 'success' });
                        }}
                        className="flex-1 bg-green-600 hover:bg-green-500 font-bold py-2 rounded text-sm transition-colors text-white cursor-pointer"
                      >
                        Use Moves
                      </button>
                      <button
                        type="button"
                        onClick={() => setPlaytestActive(false)}
                        className="flex-1 bg-gray-700 hover:bg-gray-600 font-bold py-2 rounded text-sm transition-colors text-white cursor-pointer"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h2 className="text-2xl font-bold mb-4 capitalize">
                      {editingId ? 'Edit Puzzle' : `Create ${activeTab} Puzzle`}
                    </h2>

                    {/* Mode Selector */}
                    <div className="flex gap-2 mb-4 bg-gray-900 p-1 rounded-xl border border-gray-700">
                      <button
                        type="button"
                        onClick={() => setEditMode('visual')}
                        className={cn(
                          'flex-1 py-1.5 rounded-lg font-bold text-xs transition-colors cursor-pointer',
                          editMode === 'visual' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'
                        )}
                      >
                        🎨 Visual Creator
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditMode('json')}
                        className={cn(
                          'flex-1 py-1.5 rounded-lg font-bold text-xs transition-colors cursor-pointer',
                          editMode === 'json' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'
                        )}
                      >
                        📝 Raw JSON
                      </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                      {editingId && (
                        <div className="bg-blue-900/30 border border-blue-500/50 rounded-xl p-3 text-sm text-blue-200 mb-4 flex justify-between items-center">
                          <div>
                            Editing: <span className="font-mono font-bold">{editingId}</span>
                          </div>
                          <button
                            type="button"
                            onClick={resetForm}
                            className="text-blue-400 underline hover:text-blue-300 font-semibold cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
                          Puzzle Name <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={puzzleName}
                          onChange={(e) => setPuzzleName(e.target.value)}
                          placeholder="e.g., Level 1"
                          className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors text-sm"
                          required
                        />
                      </div>

                      {activeTab === 'daily' && !editingId && (
                        <div className="flex gap-4">
                          <div className="flex-1 text-left">
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
                              Date <span className="text-red-400">*</span>
                            </label>
                            <input
                              type="date"
                              value={dailyDate}
                              onChange={(e) => setDailyDate(e.target.value)}
                              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors text-sm"
                              required
                            />
                          </div>
                          <div className="w-1/3 text-left">
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
                              Counter
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={resetCounterValue === undefined ? '' : resetCounterValue}
                              onChange={(e) =>
                                setResetCounterValue(e.target.value !== '' ? Number(e.target.value) : undefined)
                              }
                              placeholder="Issue #"
                              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors font-mono text-sm"
                            />
                          </div>
                        </div>
                      )}

                      {editMode === 'visual' ? (
                        <div className="space-y-4">
                          {/* Grid dimension controls */}
                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
                              Grid Dimensions
                            </label>
                            <div className="flex gap-4">
                              <div className="flex-1">
                                <span className="text-[10px] text-gray-400 block mb-1">Width: {gridWidth}</span>
                                <div className="flex border border-gray-700 rounded-xl overflow-hidden">
                                  <button
                                    type="button"
                                    onClick={() => setGridWidth((w) => Math.max(3, w - 1))}
                                    className="flex-1 bg-gray-700 hover:bg-gray-600 font-bold py-1 text-xs cursor-pointer"
                                  >
                                    -
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setGridWidth((w) => Math.min(15, w + 1))}
                                    className="flex-1 bg-gray-700 hover:bg-gray-600 font-bold py-1 text-xs cursor-pointer"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                              <div className="flex-1">
                                <span className="text-[10px] text-gray-400 block mb-1">Height: {gridHeight}</span>
                                <div className="flex border border-gray-700 rounded-xl overflow-hidden">
                                  <button
                                    type="button"
                                    onClick={() => setGridHeight((h) => Math.max(3, h - 1))}
                                    className="flex-1 bg-gray-700 hover:bg-gray-600 font-bold py-1 text-xs cursor-pointer"
                                  >
                                    -
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setGridHeight((h) => Math.min(15, h + 1))}
                                    className="flex-1 bg-gray-700 hover:bg-gray-600 font-bold py-1 text-xs cursor-pointer"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Drawing Tools */}
                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                              Toolbox
                            </label>
                            <div className="grid grid-cols-3 gap-1.5 mb-3">
                              {(['wall', 'player', 'block', 'target', 'portal', 'eraser'] as const).map((tool) => (
                                <button
                                  key={tool}
                                  type="button"
                                  onClick={() => setSelectedTool(tool)}
                                  className={cn(
                                    'py-1.5 rounded-lg font-bold text-[10px] sm:text-xs capitalize transition-all border cursor-pointer',
                                    selectedTool === tool
                                      ? 'bg-blue-600 text-white border-blue-400 shadow'
                                      : 'bg-gray-700/80 text-gray-300 border-transparent hover:bg-gray-600'
                                  )}
                                >
                                  {tool === 'wall' && '🧱 Wall'}
                                  {tool === 'player' && '👤 Player'}
                                  {tool === 'block' && '📦 Block'}
                                  {tool === 'target' && '🎯 Target'}
                                  {tool === 'portal' && '🌀 Portal'}
                                  {tool === 'eraser' && '🧹 Eraser'}
                                </button>
                              ))}
                            </div>

                            {(selectedTool === 'block' || selectedTool === 'target' || selectedTool === 'portal') && (
                              <div className="mb-3">
                                <span className="text-[10px] text-gray-400 block mb-1.5">Tool Color:</span>
                                <div className="flex gap-1.5 flex-wrap">
                                  {(selectedTool === 'block'
                                    ? ['red', 'blue', 'yellow', 'purple', 'green', 'orange', 'gray']
                                    : ['red', 'blue', 'yellow', 'purple', 'green', 'orange']
                                  ).map((color) => (
                                    <button
                                      key={color}
                                      type="button"
                                      onClick={() => setSelectedColor(color)}
                                      className={cn(
                                        'w-6 h-6 rounded-full border-2 capitalize text-[9px] font-bold text-black flex items-center justify-center transition-all cursor-pointer',
                                        selectedColor === color
                                          ? 'border-white scale-110 shadow-md'
                                          : 'border-transparent opacity-75 hover:opacity-100',
                                        getBlockColorClass(color).split(' ')[0]
                                      )}
                                      title={color}
                                    >
                                      {color.charAt(0).toUpperCase()}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            {selectedTool === 'portal' && (
                              <div className="text-[10px] text-gray-300 font-mono mb-3 flex gap-2 flex-wrap bg-gray-900/80 p-2 rounded-xl border border-gray-800">
                                <span className="text-gray-400 font-sans font-semibold">Portal Pairs:</span>
                                {['red', 'blue', 'yellow', 'purple', 'green', 'orange'].map((c) => {
                                  const count = editorPortals.filter((p) => p.color.toLowerCase() === c).length;
                                  if (count === 0) return null;
                                  const isPaired = count % 2 === 0;
                                  return (
                                    <span
                                      key={c}
                                      className={isPaired ? 'text-green-400 font-bold' : 'text-amber-400 font-bold animate-pulse'}
                                    >
                                      {c.charAt(0).toUpperCase() + c.slice(1)}: {count} {isPaired ? '✓' : '⚠️'}
                                    </span>
                                  );
                                })}
                                {editorPortals.length === 0 && <span className="text-gray-500 italic">No portals placed</span>}
                              </div>
                            )}
                          </div>

                          {/* Canvas Grid */}
                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                              Canvas (Click cell to place / toggle)
                            </label>
                            <div
                              className="grid gap-0.5 bg-gray-950 p-1.5 border border-gray-800 rounded-xl overflow-auto max-w-full"
                              style={{
                                gridTemplateColumns: `repeat(${gridWidth}, 1fr)`,
                                aspectRatio: '1',
                                width: '100%',
                                maxHeight: '320px',
                              }}
                            >
                              {Array.from({ length: gridWidth * gridHeight }).map((_, i) => {
                                const x = i % gridWidth;
                                const y = Math.floor(i / gridWidth);

                                const isWall = editorWalls.some((w) => w.x === x && w.y === y);
                                const isPlayer = editorPlayer.x === x && editorPlayer.y === y;
                                const block = editorBlocks.find((b) => b.x === x && b.y === y);
                                const target = editorTargets.find((t) => t.x === x && t.y === y);
                                const portal = editorPortals.find((p) => p.x === x && p.y === y);

                                let bgClass = 'bg-gray-900 hover:bg-gray-800 cursor-pointer';
                                if (isWall) {
                                  bgClass = 'bg-gray-700';
                                }

                                return (
                                  <div
                                    key={i}
                                    onClick={() => handleCellClick(x, y)}
                                    className={`relative aspect-square flex items-center justify-center transition-colors rounded-sm ${bgClass}`}
                                  >
                                    {portal && (
                                      (() => {
                                        const arrow =
                                          portal.dir === 'Up' ? '▲' : portal.dir === 'Down' ? '▼' : portal.dir === 'Left' ? '◀' : '▶';
                                        let edgePos = 'bottom-0 inset-x-0 h-2 border-t';
                                        if (portal.dir === 'Down') edgePos = 'top-0 inset-x-0 h-2 border-b';
                                        else if (portal.dir === 'Left') edgePos = 'right-0 inset-y-0 w-2 border-l';
                                        else if (portal.dir === 'Right') edgePos = 'left-0 inset-y-0 w-2 border-r';

                                        return (
                                          <div
                                            className={`absolute ${edgePos} flex items-center justify-center text-[6px] font-black text-white border-white/80 ${getBlockColorClass(
                                              portal.color
                                            )} z-0`}
                                          >
                                            {arrow}
                                          </div>
                                        );
                                      })()
                                    )}
                                    {isPlayer && (
                                      <div className="relative z-10 w-4 h-4 rounded-full bg-white border border-black flex items-center justify-center text-[8px] font-black text-black">
                                        P
                                      </div>
                                    )}
                                    {!isPlayer && block && (
                                      <div className={`relative z-10 w-4 h-4 rounded-sm ${getBlockColorClass(block.color)}`} />
                                    )}
                                    {!isPlayer && !block && target && (
                                      <div className={`relative z-10 w-3.5 h-3.5 rounded-sm ${getTargetColorClass(target.color)}`} />
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Playtest Button */}
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={startPlaytest}
                              className="flex-1 bg-amber-600 hover:bg-amber-500 font-bold py-2.5 rounded-xl text-xs transition-all shadow-[0_0_12px_rgba(217,119,6,0.3)] text-white cursor-pointer"
                            >
                              🎮 Playtest Level
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
                            Puzzle JSON <span className="text-red-400">*</span>
                          </label>
                          <textarea
                            value={puzzleJson}
                            onChange={(e) => setPuzzleJson(e.target.value)}
                            placeholder='{"width": 9, "height": 9, "player": {"x": 3, "y": 0}, "walls": [], "blocks": [], "targets": []}'
                            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-white font-mono text-xs h-64 focus:outline-none focus:border-blue-500 transition-colors"
                            required
                          />
                        </div>
                      )}

                      <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(37,99,235,0.4)] cursor-pointer text-sm"
                      >
                        {editingId ? 'Update Puzzle' : 'Create Puzzle'}
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>

            {/* Right Column: Filtered Puzzle List */}
            <div className="lg:col-span-2">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[500px]">
                {/* Left Part: Puzzle List / Accordion */}
                <div className="lg:col-span-7 bg-gray-800 rounded-2xl p-6 border border-gray-700 shadow-xl flex flex-col h-fit text-left">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold capitalize">
                      {activeTab} Puzzles
                    </h2>
                    <span className="bg-gray-700 text-gray-300 px-3 py-1 rounded-full text-xs font-bold font-mono">
                      {puzzles.length} Total
                    </span>
                  </div>

                  {loadingPuzzles ? (
                    <div className="text-gray-400 text-center py-12 animate-pulse font-mono text-sm">
                      Loading puzzles...
                    </div>
                  ) : activeTab === 'daily' ? (
                    <DailyPuzzlesAccordion
                      puzzles={puzzles}
                      selectedPuzzleId={selectedPuzzleId}
                      setSelectedPuzzleId={setSelectedPuzzleId}
                      handleEdit={handleEdit}
                      handleDeletePuzzle={handleDeletePuzzle}
                      handleClone={handleClone}
                      confirmDeleteId={confirmDeleteId}
                      setConfirmDeleteId={setConfirmDeleteId}
                    />
                  ) : puzzles.length === 0 ? (
                    <div className="text-gray-400 text-center py-12 border-2 border-dashed border-gray-700 rounded-2xl text-sm font-sans">
                      No puzzles found for <span className="capitalize font-bold text-white">{activeTab}</span>. Create one!
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 overflow-y-auto max-h-[600px] pr-1">
                      {puzzles.map((puzzle) => {
                        const isSelected = selectedPuzzleId === puzzle.id;
                        const dateStr = puzzle.id.startsWith('daily-') ? puzzle.id.replace('daily-', '') : null;

                        return (
                          <div key={puzzle.id} className="flex flex-col">
                            <div
                              onClick={() => setSelectedPuzzleId(isSelected ? null : puzzle.id)}
                              className={cn(
                                'flex items-center justify-between p-4 bg-gray-900 border rounded-xl cursor-pointer transition-all hover:bg-gray-800',
                                isSelected
                                  ? 'border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)] bg-gray-800'
                                  : 'border-gray-700/60'
                              )}
                            >
                              <div className="flex flex-col min-w-0 pr-4 text-left">
                                <span className="font-bold text-white text-sm sm:text-base truncate">{puzzle.name}</span>
                                <span className="text-[9px] text-gray-500 font-mono truncate">{puzzle.id}</span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {dateStr && (
                                  <span className="bg-blue-950/50 text-blue-300 border border-blue-700/50 text-[10px] px-2 py-0.5 rounded-full font-bold font-mono">
                                    📅 {dateStr}
                                  </span>
                                )}
                                <span className="text-gray-400 text-xs transition-transform duration-200">
                                  {isSelected ? '▲' : '▼'}
                                </span>
                              </div>
                            </div>

                            {/* Mobile View Detail */}
                            {isSelected && (
                              <div className="block lg:hidden mt-2 p-4 bg-gray-900 border border-blue-500/40 rounded-xl">
                                <PuzzleDetailCard
                                  puzzle={puzzle}
                                  onEdit={() => handleEdit(puzzle)}
                                  onDelete={() => handleDeletePuzzle(puzzle.id)}
                                  onClone={(p, d) => void handleClone(p, d)}
                                  confirmDeleteId={confirmDeleteId}
                                  setConfirmDeleteId={setConfirmDeleteId}
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Desktop Sidebar Details */}
                <div className="hidden lg:block lg:col-span-5 h-fit sticky top-6">
                  {(() => {
                    const selectedPuzzle = puzzles.find((p) => p.id === selectedPuzzleId);
                    if (selectedPuzzle) {
                      return (
                        <div className="bg-gray-800 rounded-2xl p-6 border border-blue-500/40 shadow-xl">
                          <PuzzleDetailCard
                            puzzle={selectedPuzzle}
                            onEdit={() => handleEdit(selectedPuzzle)}
                            onDelete={() => handleDeletePuzzle(selectedPuzzle.id)}
                            onClone={(p, d) => void handleClone(p, d)}
                            confirmDeleteId={confirmDeleteId}
                            setConfirmDeleteId={setConfirmDeleteId}
                          />
                        </div>
                      );
                    }
                    return (
                      <div className="bg-gray-800/40 rounded-2xl p-6 border border-gray-700 border-dashed text-gray-500 text-center py-12 text-sm font-sans">
                        Select a puzzle from the list to view details
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
