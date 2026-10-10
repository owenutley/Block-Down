import { useState, useEffect, useMemo, useCallback } from 'react';
import { trpc } from '../trpc';
import { showToast } from '@devvit/web/client';
import {
  SlideMatchPuzzle,
  SlideMatchDifficulty,
  Position,
  PuzzleBlock,
  PuzzleTarget,
  PuzzlePortal,
  PortalDirection,
  SlideMatchMove,
} from '../../shared/types';
import {
  calculateBlockSlide,
  isSlideMatchSolved,
  solveSlideMatch,
} from '../../shared/slideMatch';
import { HexagonBlock } from './HexagonBlock';
import { colorToBlockType } from '../utils/puzzle';
import { DEFAULT_THEME_CONFIGS, ThemeConfig } from '../../shared/themes';
import { computeWallNeighbors, computeWallCornerRadii } from '../utils/wallAutotiling';
import { cn } from '../utils';

type ToolMode =
  | 'wall'
  | 'erase'
  | 'block-red'
  | 'block-blue'
  | 'block-yellow'
  | 'block-green'
  | 'block-orange'
  | 'block-purple'
  | 'block-gray'
  | 'target-red'
  | 'target-blue'
  | 'target-yellow'
  | 'target-green'
  | 'target-orange'
  | 'target-purple'
  | 'portal';

const COLOR_MAP: Record<string, { bg: string; border: string; text: string; label: string }> = {
  red: { bg: 'bg-red-500', border: 'border-red-500', text: 'text-red-400', label: 'Red' },
  blue: { bg: 'bg-blue-500', border: 'border-blue-500', text: 'text-blue-400', label: 'Blue' },
  yellow: { bg: 'bg-yellow-400', border: 'border-yellow-400', text: 'text-yellow-400', label: 'Yellow' },
  green: { bg: 'bg-green-500', border: 'border-green-500', text: 'text-green-400', label: 'Green' },
  orange: { bg: 'bg-orange-500', border: 'border-orange-500', text: 'text-orange-400', label: 'Orange' },
  purple: { bg: 'bg-purple-500', border: 'border-purple-500', text: 'text-purple-400', label: 'Purple' },
  gray: { bg: 'bg-zinc-600', border: 'border-zinc-500', text: 'text-zinc-400', label: 'Neutral Gray' },
};

export const SlideMatchDevPanel = () => {
  const [selectedDifficulty, setSelectedDifficulty] = useState<SlideMatchDifficulty>('easy');
  const [puzzles, setPuzzles] = useState<SlideMatchPuzzle[]>([]);
  const [loading, setLoading] = useState(true);

  // Editor State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [stageName, setStageName] = useState('New Stage');
  const [gridWidth, setGridWidth] = useState(7);
  const [gridHeight, setGridHeight] = useState(7);
  const [walls, setWalls] = useState<Position[]>([]);
  const [blocks, setBlocks] = useState<PuzzleBlock[]>([]);
  const [targets, setTargets] = useState<PuzzleTarget[]>([]);
  const [portals, setPortals] = useState<PuzzlePortal[]>([]);
  const [activeTool, setActiveTool] = useState<ToolMode>('wall');
  const [portalColor, setPortalColor] = useState('cyan');
  const [portalDir, setPortalDir] = useState<PortalDirection>('Left');
  const [customPar, setCustomPar] = useState<number | ''>('');

  // Playtest & Solver State
  const [isPlaytesting, setIsPlaytesting] = useState(false);
  const [playtestBlocks, setPlaytestBlocks] = useState<PuzzleBlock[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [slideHistory, setSlideHistory] = useState<PuzzleBlock[][]>([]);
  const [slideCount, setSlideCount] = useState(0);
  const [solutionMoves, setSolutionMoves] = useState<SlideMatchMove[] | null>(null);
  const [playbackIndex, setPlaybackIndex] = useState<number | null>(null);

  const loadAllPuzzles = async () => {
    try {
      setLoading(true);
      const data = await trpc.slideMatch.getAll.query();
      setPuzzles(data);
    } catch (err) {
      console.error('Failed to load slide match puzzles:', err);
      showToast({ text: 'Failed to load Slide Match stages', appearance: 'neutral' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAllPuzzles();
  }, []);

  const filteredPuzzles = useMemo(() => {
    return puzzles.filter((p) => p.difficulty === selectedDifficulty);
  }, [puzzles, selectedDifficulty]);

  const currentPuzzleData = useMemo(() => ({
    width: gridWidth,
    height: gridHeight,
    walls,
    blocks,
    targets,
    portals,
  }), [gridWidth, gridHeight, walls, blocks, targets, portals]);

  const solverResult = useMemo(() => {
    if (blocks.length === 0 || targets.length === 0) return null;
    return solveSlideMatch(currentPuzzleData);
  }, [currentPuzzleData, blocks, targets]);

  const resetEditor = () => {
    setEditingId(null);
    setStageName('New Stage');
    setGridWidth(7);
    setGridHeight(7);
    setWalls([]);
    setBlocks([]);
    setTargets([]);
    setPortals([]);
    setCustomPar('');
    setIsPlaytesting(false);
    setSelectedBlockId(null);
    setSlideHistory([]);
    setSlideCount(0);
    setSolutionMoves(null);
    setPlaybackIndex(null);
  };

  const handleEdit = (p: SlideMatchPuzzle) => {
    setEditingId(p.id);
    setStageName(p.name || p.title || 'Stage');
    const diff = (p.difficulty?.toLowerCase() || 'easy') as SlideMatchDifficulty;
    setSelectedDifficulty(diff === 'medium' || diff === 'hard' ? diff : 'easy');
    setGridWidth(p.width);
    setGridHeight(p.height);
    setWalls(p.walls || []);
    setBlocks(p.blocks || []);
    setTargets(p.targets || []);
    setPortals(p.portals || []);
    setCustomPar(p.par || '');
    setIsPlaytesting(false);
    setSelectedBlockId(null);
  };

  const handleCellClick = (x: number, y: number) => {
    if (isPlaytesting) return;

    if (activeTool === 'erase') {
      setWalls((prev) => prev.filter((w) => w.x !== x || w.y !== y));
      setBlocks((prev) => prev.filter((b) => b.x !== x || b.y !== y));
      setTargets((prev) => prev.filter((t) => t.x !== x || t.y !== y));
      setPortals((prev) => prev.filter((p) => p.x !== x || p.y !== y));
      return;
    }

    if (activeTool === 'wall') {
      const exists = walls.some((w) => w.x === x && w.y === y);
      if (exists) {
        setWalls((prev) => prev.filter((w) => w.x !== x || w.y !== y));
      } else {
        setBlocks((prev) => prev.filter((b) => b.x !== x || b.y !== y));
        setTargets((prev) => prev.filter((t) => t.x !== x || t.y !== y));
        setPortals((prev) => prev.filter((p) => p.x !== x || p.y !== y));
        setWalls((prev) => [...prev, { x, y }]);
      }
      return;
    }

    if (activeTool.startsWith('block-')) {
      const color = activeTool.replace('block-', '');
      setWalls((prev) => prev.filter((w) => w.x !== x || w.y !== y));
      setBlocks((prev) => {
        const without = prev.filter((b) => b.x !== x || b.y !== y);
        const newBlock: PuzzleBlock = {
          id: `b_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          color,
          x,
          y,
        };
        return [...without, newBlock];
      });
      return;
    }

    if (activeTool.startsWith('target-')) {
      const color = activeTool.replace('target-', '');
      setWalls((prev) => prev.filter((w) => w.x !== x || w.y !== y));
      setTargets((prev) => {
        const without = prev.filter((t) => t.x !== x || t.y !== y);
        const newTarget: PuzzleTarget = {
          id: `t_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          color,
          x,
          y,
        };
        return [...without, newTarget];
      });
      return;
    }

    if (activeTool === 'portal') {
      setWalls((prev) => prev.filter((w) => w.x !== x || w.y !== y));
      setPortals((prev) => {
        const without = prev.filter((p) => p.x !== x || p.y !== y);
        const newPortal: PuzzlePortal = {
          id: `p_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          color: portalColor,
          x,
          y,
          dir: portalDir,
        };
        return [...without, newPortal];
      });
    }
  };

  // Playtest move handler
  const executeSlide = useCallback(
    (blockId: string, dir: PortalDirection) => {
      const wallSet = new Set(walls.map((w) => `${w.x},${w.y}`));
      const result = calculateBlockSlide(
        blockId,
        dir,
        gridWidth,
        gridHeight,
        wallSet,
        playtestBlocks,
        portals
      );

      if (result.moved) {
        setSlideHistory((prev) => [...prev, playtestBlocks]);
        setPlaytestBlocks((prev) =>
          prev.map((b) => (b.id === blockId ? { ...b, x: result.finalPos.x, y: result.finalPos.y } : b))
        );
        setSlideCount((c) => c + 1);

        const nextBlocks = playtestBlocks.map((b) =>
          b.id === blockId ? { ...b, x: result.finalPos.x, y: result.finalPos.y } : b
        );
        if (isSlideMatchSolved(nextBlocks, targets)) {
          showToast({ text: '🎉 Stage Solved!', appearance: 'success' });
        }
      }
    },
    [walls, gridWidth, gridHeight, playtestBlocks, portals, targets]
  );

  const startPlaytest = () => {
    if (blocks.length === 0) {
      showToast({ text: 'Place at least one block to playtest', appearance: 'neutral' });
      return;
    }
    setPlaytestBlocks(blocks.map((b) => ({ ...b })));
    setSlideHistory([]);
    setSlideCount(0);
    setSelectedBlockId(null);
    setIsPlaytesting(true);
  };

  const stopPlaytest = () => {
    setIsPlaytesting(false);
    setSelectedBlockId(null);
    setPlaybackIndex(null);
  };

  const handleUndo = () => {
    if (slideHistory.length === 0) return;
    const prevBlocks = slideHistory[slideHistory.length - 1];
    if (prevBlocks) {
      setPlaytestBlocks(prevBlocks);
      setSlideHistory((prev) => prev.slice(0, -1));
      setSlideCount((c) => Math.max(0, c - 1));
    }
  };

  // Automated solution playback
  useEffect(() => {
    if (playbackIndex === null || !solutionMoves) return;
    if (playbackIndex >= solutionMoves.length) {
      setPlaybackIndex(null);
      return;
    }

    const move = solutionMoves[playbackIndex];
    if (move) {
      const timer = setTimeout(() => {
        executeSlide(move.blockId, move.dir);
        setPlaybackIndex((idx) => (idx !== null ? idx + 1 : null));
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [playbackIndex, solutionMoves, executeSlide]);

  const handlePlaySolution = () => {
    if (!solverResult?.solvable || solverResult.solutionMoves.length === 0) {
      showToast({ text: 'No solution found to play', appearance: 'neutral' });
      return;
    }
    setPlaytestBlocks(blocks.map((b) => ({ ...b })));
    setSlideHistory([]);
    setSlideCount(0);
    setIsPlaytesting(true);
    setSolutionMoves(solverResult.solutionMoves);
    setPlaybackIndex(0);
  };

  const handleSaveStage = async () => {
    if (!stageName.trim()) {
      showToast({ text: 'Please enter a stage name', appearance: 'neutral' });
      return;
    }
    if (blocks.length === 0) {
      showToast({ text: 'Stage must have at least 1 block', appearance: 'neutral' });
      return;
    }
    if (targets.length === 0) {
      showToast({ text: 'Stage must have at least 1 target', appearance: 'neutral' });
      return;
    }

    const finalId = editingId || `sm-${selectedDifficulty}-${Date.now().toString(36)}`;
    const finalPar =
      typeof customPar === 'number' && customPar > 0
        ? customPar
        : solverResult?.solvable
        ? solverResult.minSlides
        : 2;

    const stagePayload: SlideMatchPuzzle = {
      id: finalId,
      name: stageName,
      difficulty: selectedDifficulty,
      width: gridWidth,
      height: gridHeight,
      walls,
      blocks,
      targets,
      portals,
      par: finalPar,
      solutionMoves: solverResult?.solutionMoves || [],
      createdAt: Date.now(),
    };

    try {
      await trpc.slideMatch.saveStage.mutate({
        ...stagePayload,
        name: stagePayload.name || 'Stage',
      });
      showToast({ text: editingId ? 'Stage updated!' : 'Stage created successfully!', appearance: 'success' });
      resetEditor();
      await loadAllPuzzles();
    } catch (err) {
      console.error(err);
      showToast({ text: 'Failed to save stage', appearance: 'neutral' });
    }
  };

  const handleDeleteStage = async (id: string) => {
    if (!confirm('Are you sure you want to delete this stage?')) return;
    try {
      await trpc.slideMatch.deleteStage.mutate({ id });
      showToast({ text: 'Stage deleted', appearance: 'success' });
      if (editingId === id) resetEditor();
      await loadAllPuzzles();
    } catch (err) {
      console.error(err);
      showToast({ text: 'Failed to delete stage', appearance: 'neutral' });
    }
  };

  const currentDisplayBlocks = isPlaytesting ? playtestBlocks : blocks;
  const isCurrentlySolved = isPlaytesting && isSlideMatchSolved(playtestBlocks, targets);
  const activeSelectedBlock = currentDisplayBlocks.find((b) => b.id === selectedBlockId);
  const [postingEndless, setPostingEndless] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [selectedPostStageId, setSelectedPostStageId] = useState<string>('current');
  const [scheduledWeeklyStage, setScheduledWeeklyStage] = useState<{
    stageId: string | null;
    stage: SlideMatchPuzzle | null;
  }>({ stageId: null, stage: null });
  const [queuingWeekly, setQueuingWeekly] = useState(false);

  const loadScheduledWeeklyStage = async () => {
    try {
      const data = await trpc.slideMatch.getScheduledWeeklyStage.query();
      setScheduledWeeklyStage(data);
    } catch (err) {
      console.warn('Failed to load scheduled weekly stage:', err);
    }
  };

  useEffect(() => {
    void loadScheduledWeeklyStage();
  }, []);

  const handleQueueWeekly = async (stageIdToQueue: string | null) => {
    try {
      setQueuingWeekly(true);
      let targetStageId: string | null = stageIdToQueue;

      if (stageIdToQueue === 'current') {
        if (blocks.length > 0 && targets.length > 0) {
          const finalId = editingId || `sm-${selectedDifficulty}-${Date.now().toString(36)}`;
          const finalPar =
            typeof customPar === 'number' && customPar > 0
              ? customPar
              : solverResult?.solvable
              ? solverResult.minSlides
              : 2;

          const stagePayload: SlideMatchPuzzle = {
            id: finalId,
            name: stageName || 'Featured Stage',
            difficulty: selectedDifficulty,
            width: gridWidth,
            height: gridHeight,
            walls,
            blocks,
            targets,
            portals,
            par: finalPar,
            solutionMoves: solverResult?.solutionMoves || [],
            createdAt: Date.now(),
          };

          await trpc.slideMatch.saveStage.mutate({
            ...stagePayload,
            name: stagePayload.name || 'Featured Stage',
          });
          targetStageId = finalId;
          await loadAllPuzzles();
        } else if (editingId) {
          targetStageId = editingId;
        } else {
          showToast({ text: 'Please create or select a stage to queue', appearance: 'neutral' });
          return;
        }
      }

      await trpc.slideMatch.setScheduledWeeklyStage.mutate({
        stageId: targetStageId,
      });

      await loadScheduledWeeklyStage();

      if (targetStageId) {
        const found = puzzles.find((p) => p.id === targetStageId);
        showToast({
          text: `📅 Queued "${found?.name || stageName}" for next Thursday's weekly post!`,
          appearance: 'success',
        });
        setShowPostModal(false);
      } else {
        showToast({ text: 'Weekly publish queue reset to default demo', appearance: 'neutral' });
      }
    } catch (err) {
      console.error('Failed to queue weekly stage:', err);
      showToast({ text: 'Failed to update weekly queue', appearance: 'neutral' });
    } finally {
      setQueuingWeekly(false);
    }
  };

  const handlePostStage = async (stageIdToPost?: string) => {
    try {
      setPostingEndless(true);
      let targetStageId: string | undefined = undefined;

      if (stageIdToPost && stageIdToPost !== 'default') {
        if (stageIdToPost === 'current') {
          // If editing a stage or creating one, ensure it is saved
          if (blocks.length > 0 && targets.length > 0) {
            const finalId = editingId || `sm-${selectedDifficulty}-${Date.now().toString(36)}`;
            const finalPar =
              typeof customPar === 'number' && customPar > 0
                ? customPar
                : solverResult?.solvable
                ? solverResult.minSlides
                : 2;

            const stagePayload: SlideMatchPuzzle = {
              id: finalId,
              name: stageName || 'Featured Stage',
              difficulty: selectedDifficulty,
              width: gridWidth,
              height: gridHeight,
              walls,
              blocks,
              targets,
              portals,
              par: finalPar,
              solutionMoves: solverResult?.solutionMoves || [],
              createdAt: Date.now(),
            };

            await trpc.slideMatch.saveStage.mutate({
              ...stagePayload,
              name: stagePayload.name || 'Featured Stage',
            });
            targetStageId = finalId;
            await loadAllPuzzles();
          } else if (editingId) {
            targetStageId = editingId;
          }
        } else {
          targetStageId = stageIdToPost;
        }
      }

      const res = await trpc.dev.createSlideMatchPost.mutate({
        stageId: targetStageId,
      });

      if (res?.postId) {
        showToast({
          text: targetStageId
            ? `🚀 Post created featuring stage "${puzzles.find((p) => p.id === targetStageId)?.name || stageName}"!`
            : '🚀 Slide Match post created!',
          appearance: 'success',
        });
        setShowPostModal(false);
      } else {
        showToast({ text: 'Slide Match post created successfully!', appearance: 'success' });
        setShowPostModal(false);
      }
    } catch (err) {
      console.error('Failed to create Slide Match post:', err);
      showToast({ text: 'Failed to create Slide Match post', appearance: 'neutral' });
    } finally {
      setPostingEndless(false);
    }
  };

  return (
    <div className="space-y-6 text-left font-sans">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-cyan-950/60 to-blue-950/60 border border-cyan-500/40 rounded-2xl p-4 sm:p-6 shadow-xl flex flex-wrap justify-between items-center gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚡</span>
            <h2 className="text-2xl font-black text-white">Slide Match Endless Runner Architect</h2>
          </div>
          <p className="text-xs sm:text-sm text-cyan-300/80">
            Endless speed rush mode with procedural generation, scheduled weekly posts, and custom stage launcher.
          </p>

          {/* Scheduled Weekly Status Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-900/90 border border-indigo-500/40 text-xs font-mono">
            <span className="text-indigo-400 font-bold">📅 Next Thursday Weekly Post:</span>
            {scheduledWeeklyStage.stage ? (
              <span className="text-white font-bold flex items-center gap-1.5">
                <span className="text-cyan-300 font-black">{scheduledWeeklyStage.stage.name}</span>
                <span className="text-[10px] text-gray-400">({scheduledWeeklyStage.stage.width}×{scheduledWeeklyStage.stage.height})</span>
                <button
                  type="button"
                  onClick={() => void handleQueueWeekly(null)}
                  disabled={queuingWeekly}
                  title="Clear weekly queue"
                  className="text-gray-400 hover:text-red-400 ml-1 text-xs cursor-pointer disabled:opacity-50"
                >
                  ✕
                </button>
              </span>
            ) : (
              <span className="text-gray-400 italic">Default Demo Board</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowPostModal(true)}
            disabled={postingEndless}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 active:scale-95 text-white font-black text-xs uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)] border border-cyan-400/50 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
          >
            <span>🚀</span>
            <span>{postingEndless ? 'Posting...' : 'Post to Reddit...'}</span>
          </button>
          {(['easy', 'medium', 'hard'] as const).map((diff) => (
            <button
              key={diff}
              onClick={() => setSelectedDifficulty(diff)}
              className={cn(
                'px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border',
                selectedDifficulty === diff
                  ? diff === 'easy'
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                    : diff === 'medium'
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                    : 'bg-purple-500/20 text-purple-400 border-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                  : 'bg-gray-800 text-gray-400 border-gray-700 hover:text-white'
              )}
            >
              {diff}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Left Stage Editor / Playtest, Right Stage List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Board & Toolbar */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-gray-800/90 border border-gray-700 rounded-2xl p-5 shadow-xl space-y-4">
            {/* Stage Info Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-700 pb-3">
              <div className="flex items-center gap-3 flex-1 min-w-[200px]">
                <input
                  type="text"
                  value={stageName}
                  onChange={(e) => setStageName(e.target.value)}
                  placeholder="Stage Name"
                  className="bg-gray-900 border border-gray-700 rounded-xl px-3 py-1.5 text-white font-bold text-sm focus:outline-none focus:border-cyan-500 w-full max-w-xs"
                />
                {editingId && (
                  <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded-md border border-cyan-800">
                    Editing: {editingId}
                  </span>
                )}
              </div>

              {/* Grid Dimensions */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 font-mono">Size:</span>
                <select
                  value={gridWidth}
                  disabled={isPlaytesting}
                  onChange={(e) => {
                    const size = parseInt(e.target.value, 10);
                    setGridWidth(size);
                    setGridHeight(size);
                  }}
                  className="bg-gray-900 border border-gray-700 rounded-lg px-2.5 py-1 text-white text-xs font-mono focus:outline-none"
                >
                  {[5, 6, 7, 8, 9, 10, 11, 12].map((s) => (
                    <option key={s} value={s}>
                      {s} × {s}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={resetEditor}
                  className="px-2.5 py-1 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs font-bold text-gray-300 transition-colors"
                >
                  Clear Board
                </button>
              </div>
            </div>

            {/* Toolbar (When not playtesting) */}
            {!isPlaytesting ? (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider w-full sm:w-auto">
                    Tool:
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveTool('wall')}
                    className={cn(
                      'px-3 py-1.5 rounded-xl text-xs font-bold transition-all border',
                      activeTool === 'wall'
                        ? 'bg-zinc-700 text-white border-zinc-400 shadow-[0_0_8px_rgba(255,255,255,0.2)]'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                    )}
                  >
                    🧱 Wall
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTool('erase')}
                    className={cn(
                      'px-3 py-1.5 rounded-xl text-xs font-bold transition-all border',
                      activeTool === 'erase'
                        ? 'bg-red-950 text-red-300 border-red-500 shadow-[0_0_8px_rgba(239,68,68,0.2)]'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-red-400'
                    )}
                  >
                    🧹 Erase
                  </button>

                  <div className="h-4 w-px bg-gray-700 mx-1 hidden sm:block" />

                  {/* Colored Blocks */}
                  {(['red', 'blue', 'yellow', 'green', 'orange', 'purple', 'gray'] as const).map((c) => (
                    <button
                      key={`block-${c}`}
                      type="button"
                      onClick={() => setActiveTool(`block-${c}` as ToolMode)}
                      className={cn(
                        'px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5',
                        activeTool === `block-${c}`
                          ? 'bg-zinc-800 text-white border-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.3)]'
                          : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                      )}
                    >
                      <span className={`w-3 h-3 rounded-sm ${COLOR_MAP[c]?.bg}`} />
                      <span>{c === 'gray' ? 'Neutral' : c.charAt(0).toUpperCase() + c.slice(1)}</span>
                    </button>
                  ))}
                </div>

                {/* Targets & Portals row */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-700/60">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider w-full sm:w-auto">
                    Targets:
                  </span>
                  {(['red', 'blue', 'yellow', 'green', 'orange', 'purple'] as const).map((c) => (
                    <button
                      key={`target-${c}`}
                      type="button"
                      onClick={() => setActiveTool(`target-${c}` as ToolMode)}
                      className={cn(
                        'px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5',
                        activeTool === `target-${c}`
                          ? 'bg-zinc-800 text-white border-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.3)]'
                          : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                      )}
                    >
                      <span className={`w-3 h-3 rounded-sm border-2 border-dashed ${COLOR_MAP[c]?.border}`} />
                      <span>🎯 {c.charAt(0).toUpperCase() + c.slice(1)}</span>
                    </button>
                  ))}

                  <div className="h-4 w-px bg-gray-700 mx-1 hidden sm:block" />

                  <button
                    type="button"
                    onClick={() => setActiveTool('portal')}
                    className={cn(
                      'px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5',
                      activeTool === 'portal'
                        ? 'bg-cyan-950 text-cyan-300 border-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.3)]'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                    )}
                  >
                    🌀 Portal
                  </button>

                  {activeTool === 'portal' && (
                    <div className="flex items-center gap-2 bg-gray-900 px-3 py-1 rounded-xl border border-gray-700 text-xs">
                      <select
                        value={portalColor}
                        onChange={(e) => setPortalColor(e.target.value)}
                        className="bg-transparent text-cyan-300 font-bold focus:outline-none"
                      >
                        <option value="cyan">Cyan</option>
                        <option value="purple">Purple</option>
                        <option value="green">Green</option>
                        <option value="yellow">Yellow</option>
                      </select>
                      <select
                        value={portalDir}
                        onChange={(e) => setPortalDir(e.target.value as PortalDirection)}
                        className="bg-transparent text-gray-300 font-bold focus:outline-none"
                      >
                        <option value="Left">Face Left</option>
                        <option value="Right">Face Right</option>
                        <option value="Up">Face Up</option>
                        <option value="Down">Face Down</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Playtest HUD Bar */
              <div className="flex items-center justify-between bg-zinc-900/90 border border-amber-500/40 rounded-xl p-3 shadow-inner">
                <div className="flex items-center gap-3">
                  <span className="text-xs uppercase font-mono font-bold text-amber-400">🎮 Playtest Mode</span>
                  <span className="text-sm font-bold text-white">Slides: {slideCount}</span>
                  {solverResult?.solvable && (
                    <span className="text-xs font-mono text-zinc-400">Par: {solverResult.minSlides}</span>
                  )}
                  {isCurrentlySolved && (
                    <span className="text-xs font-bold bg-green-500/20 text-green-400 border border-green-500/40 px-2 py-0.5 rounded-full">
                      Solved!
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleUndo}
                    disabled={slideHistory.length === 0}
                    className="px-3 py-1 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 rounded-lg text-xs font-bold text-gray-300 transition-colors"
                  >
                    ↩ Undo
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPlaytestBlocks(blocks.map((b) => ({ ...b })));
                      setSlideHistory([]);
                      setSlideCount(0);
                      setSelectedBlockId(null);
                    }}
                    className="px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs font-bold text-gray-300 transition-colors"
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    onClick={stopPlaytest}
                    className="px-3 py-1 bg-red-900/60 hover:bg-red-800 text-red-300 border border-red-700/60 rounded-lg text-xs font-bold transition-colors"
                  >
                    Exit Playtest
                  </button>
                </div>
              </div>
            )}

            {/* Interactive Grid Canvas */}
            <div className="flex justify-center p-4 bg-zinc-950 rounded-3xl border border-cyan-500/30 relative overflow-hidden shadow-2xl">
              <div
                className="grid gap-1 relative select-none p-2 bg-cyan-950/85 border-cyan-500/50 rounded-2xl shadow-lg"
                style={{
                  gridTemplateColumns: `repeat(${gridWidth}, minmax(0, 1fr))`,
                  width: '100%',
                  maxWidth: `${gridWidth * 54}px`,
                  aspectRatio: `${gridWidth} / ${gridHeight}`,
                }}
              >
                {Array.from({ length: gridWidth * gridHeight }).map((_, idx) => {
                  const x = idx % gridWidth;
                  const y = Math.floor(idx / gridWidth);
                  const isWall = walls.some((w) => w.x === x && w.y === y);
                  const block = currentDisplayBlocks.find((b) => b.x === x && b.y === y);
                  const target = targets.find((t) => t.x === x && t.y === y);
                  const portal = portals.find((p) => p.x === x && p.y === y);
                  const isSelected = isPlaytesting && block && block.id === selectedBlockId;

                  const wallSet = new Set(walls.map((w) => `${w.x},${w.y}`));
                  const wallNeighbors = isWall ? computeWallNeighbors(x, y, wallSet) : undefined;
                  const cellBorderRadius = computeWallCornerRadii(isWall, wallNeighbors, '0.5rem');

                  return (
                    <div
                      key={`${x}-${y}`}
                      onClick={() => {
                        if (isPlaytesting) {
                          if (block) {
                            setSelectedBlockId(block.id === selectedBlockId ? null : block.id);
                          }
                        } else {
                          handleCellClick(x, y);
                        }
                      }}
                      className={cn(
                        'relative aspect-square flex items-center justify-center transition-all cursor-pointer z-0',
                        isWall
                          ? 'bg-slate-900 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.9)]'
                          : 'bg-cyan-950/70 border border-cyan-400/20 shadow-[inset_0_1px_2px_rgba(255,255,255,0.1)]'
                      )}
                      style={{
                        borderRadius: cellBorderRadius,
                      }}
                    >
                      {/* Wall Autotiling & 3D Bevel Lighting */}
                      {isWall && (
                        <>
                          {wallNeighbors?.right && (
                            <div className="absolute top-0 bottom-0 -right-[1px] w-[1px] pointer-events-none z-1 bg-slate-900" />
                          )}
                          {wallNeighbors?.bottom && (
                            <div className="absolute left-0 right-0 -bottom-[1px] h-[1px] pointer-events-none z-1 bg-slate-900" />
                          )}
                          {wallNeighbors?.right && wallNeighbors?.bottom && wallNeighbors?.bottomRight && (
                            <div className="absolute -right-[1px] -bottom-[1px] w-[1px] h-[1px] pointer-events-none z-1 bg-slate-900" />
                          )}

                          <div
                            className="absolute inset-0 pointer-events-none overflow-hidden z-0"
                            style={{ borderRadius: cellBorderRadius }}
                          >
                            {!wallNeighbors?.top && (
                              <div className="absolute top-0 inset-x-0 h-[30%] bg-gradient-to-b from-white/35 to-transparent pointer-events-none" />
                            )}
                            {!wallNeighbors?.left && (
                              <div className="absolute left-0 inset-y-0 w-[30%] bg-gradient-to-r from-white/35 to-transparent pointer-events-none" />
                            )}
                            {!wallNeighbors?.bottom && (
                              <div className="absolute bottom-0 inset-x-0 h-[35%] bg-gradient-to-t from-black/90 to-transparent pointer-events-none" />
                            )}
                            {!wallNeighbors?.right && (
                              <div className="absolute right-0 inset-y-0 w-[35%] bg-gradient-to-l from-black/90 to-transparent pointer-events-none" />
                            )}
                          </div>
                        </>
                      )}

                      {/* Target Pad with Authentic Corner Reticles */}
                      {target && (
                        <div
                          className={cn(
                            'absolute inset-1 rounded-lg border-2 border-dashed flex items-center justify-center bg-white/5',
                            COLOR_MAP[target.color.toLowerCase()]?.border || 'border-white'
                          )}
                        >
                          <div
                            className={cn(
                              'w-2 h-2 rounded-full opacity-40',
                              COLOR_MAP[target.color.toLowerCase()]?.bg || 'bg-white'
                            )}
                          />
                        </div>
                      )}

                      {/* Portal */}
                      {portal && (
                        <div className="absolute inset-1 flex items-center justify-center">
                          <span className="text-sm font-bold animate-pulse text-cyan-400">
                            🌀
                            <span className="text-[9px] font-mono block -mt-1 uppercase text-zinc-400">
                              {portal.dir[0]}
                            </span>
                          </span>
                        </div>
                      )}

                      {/* Block */}
                      {block && (
                        <div
                          className={cn(
                            'relative z-10 w-full h-full p-0.5 flex items-center justify-center transition-transform',
                            isSelected
                              ? 'scale-105 filter drop-shadow-[0_0_10px_rgba(255,255,255,0.9)] animate-pulse'
                              : 'hover:scale-102'
                          )}
                        >
                          <HexagonBlock
                            blockType={colorToBlockType(block.color)}
                            shape={DEFAULT_THEME_CONFIGS.neon[colorToBlockType(block.color) as keyof ThemeConfig]?.shape}
                            isSolved={false}
                            isAnimated={true}
                            baseThemeId="neon"
                            isCircular={true}
                            className="w-full h-full"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Floating Direction Arrows Overlay (when block is selected in Playtest) */}
                {isPlaytesting && activeSelectedBlock && (
                  <div className="absolute inset-0 pointer-events-none z-20">
                    {(() => {
                      const colorKey = activeSelectedBlock.color.toLowerCase();
                      const colorHexMap: Record<string, string> = {
                        red: '#ef4444',
                        blue: '#3b82f6',
                        yellow: '#eab308',
                        green: '#22c55e',
                        orange: '#f97316',
                        purple: '#a855f7',
                        gray: '#71717a',
                      };
                      const blockColorHex = colorHexMap[colorKey] || '#38bdf8';

                      const dirConfig = {
                        Up: { dx: 0, dy: -0.66, rot: 0, label: 'Slide Up' },
                        Down: { dx: 0, dy: 0.66, rot: 180, label: 'Slide Down' },
                        Left: { dx: -0.66, dy: 0, rot: 270, label: 'Slide Left' },
                        Right: { dx: 0.66, dy: 0, rot: 90, label: 'Slide Right' },
                      };

                      const wallSet = new Set(walls.map((w) => `${w.x},${w.y}`));
                      const validDirections = (['Up', 'Down', 'Left', 'Right'] as const).filter((dir) => {
                        const result = calculateBlockSlide(
                          activeSelectedBlock.id,
                          dir,
                          gridWidth,
                          gridHeight,
                          wallSet,
                          playtestBlocks,
                          portals
                        );
                        return result.moved;
                      });

                      return validDirections.map((dir) => {
                        const offset = dirConfig[dir];
                        const cellWidthPct = 100 / gridWidth;
                        const cellHeightPct = 100 / gridHeight;

                        const rawX = (activeSelectedBlock.x + 0.5 + offset.dx) * cellWidthPct;
                        const rawY = (activeSelectedBlock.y + 0.5 + offset.dy) * cellHeightPct;

                        const clampedX = Math.max(cellWidthPct * 0.35, Math.min(100 - cellWidthPct * 0.35, rawX));
                        const clampedY = Math.max(cellHeightPct * 0.35, Math.min(100 - cellHeightPct * 0.35, rawY));

                        return (
                          <button
                            key={dir}
                            type="button"
                            aria-label={offset.label}
                            onClick={(e) => {
                              e.stopPropagation();
                              executeSlide(activeSelectedBlock.id, dir);
                            }}
                            style={{
                              left: `${clampedX}%`,
                              top: `${clampedY}%`,
                              transform: 'translate(-50%, -50%)',
                              background: `linear-gradient(135deg, ${blockColorHex}, ${blockColorHex}dd)`,
                              boxShadow: `0 0 16px ${blockColorHex}ee, 0 4px 10px rgba(0,0,0,0.6), inset 0 1px 2px rgba(255,255,255,0.7)`,
                            }}
                            className="absolute pointer-events-auto w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-white flex items-center justify-center cursor-pointer transition-transform duration-150 hover:scale-115 active:scale-90 shadow-xl"
                          >
                            <svg
                              className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              style={{ transform: `rotate(${offset.rot}deg)` }}
                            >
                              <path d="m18 15-6-6-6 6" />
                            </svg>
                          </button>
                        );
                      });
                    })()}
                  </div>
                )}
              </div>
            </div>

            {/* Solver & Par HUD */}
            <div className="bg-gray-900 border border-gray-700/80 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold uppercase text-gray-400">Solver Status:</span>
                  {solverResult?.solvable ? (
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded-full">
                      ✓ Solvable ({solverResult.minSlides} Slides)
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-amber-400 bg-amber-950/80 border border-amber-800 px-2 py-0.5 rounded-full">
                      ⚠️ {blocks.length === 0 ? 'Empty Board' : 'Unsolvable / Exploring'}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-500 font-mono">
                  {solverResult?.solvable
                    ? `Optimal sequence: ${solverResult.solutionMoves.map((m) => `${m.dir}`).join(' → ')}`
                    : 'Place matching targets and blocks to test solvability'}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePlaySolution}
                  disabled={!solverResult?.solvable}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
                >
                  💡 Solution Playback
                </button>
                {!isPlaytesting ? (
                  <button
                    type="button"
                    onClick={startPlaytest}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
                  >
                    🎮 Playtest Stage
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopPlaytest}
                    className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
                  >
                    ⏹ Stop Playtest
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSaveStage}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold shadow-[0_0_12px_rgba(6,182,212,0.4)] transition-all cursor-pointer"
                >
                  💾 {editingId ? 'Update Stage' : 'Save Stage'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Stage List & CRUD */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-gray-800/90 border border-gray-700 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-700 pb-3">
              <h3 className="font-bold text-white text-base capitalize">
                {selectedDifficulty} Stages ({filteredPuzzles.length})
              </h3>
              <span className="text-[10px] font-mono text-gray-400">Total in Tier</span>
            </div>

            {loading ? (
              <div className="text-center py-8 text-gray-400 text-xs font-mono animate-pulse">
                Loading stages...
              </div>
            ) : filteredPuzzles.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-700 rounded-xl text-gray-400 text-xs">
                No {selectedDifficulty} stages yet. Create one!
              </div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1 styled-scrollbar">
                {filteredPuzzles.map((p, idx) => (
                  <div
                    key={p.id}
                    className={cn(
                      'p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3',
                      editingId === p.id
                        ? 'bg-cyan-950/60 border-cyan-500/80 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                        : 'bg-gray-900 border-gray-700/60 hover:border-gray-600'
                    )}
                  >
                    <div className="flex flex-col min-w-0 text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-cyan-400">#{idx + 1}</span>
                        <span className="text-sm font-bold text-white truncate">{p.name}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[10px] font-mono text-gray-400">
                        <span>{p.width}×{p.height}</span>
                        <span>•</span>
                        <span>Par: {p.par || '?'}</span>
                        <span>•</span>
                        <span>{p.blocks?.length || 0} Blocks</span>
                        {p.portals && p.portals.length > 0 && <span>• 🌀 {p.portals.length}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => void handleQueueWeekly(p.id)}
                        disabled={queuingWeekly}
                        title={scheduledWeeklyStage.stageId === p.id ? "Queued for next Thursday weekly post" : "Queue this stage for next Thursday's weekly post"}
                        className={cn(
                          "px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 disabled:opacity-50",
                          scheduledWeeklyStage.stageId === p.id
                            ? "bg-indigo-600 text-white border border-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.5)]"
                            : "bg-gray-800 hover:bg-indigo-950 text-indigo-300 hover:text-white border border-indigo-500/30"
                        )}
                      >
                        <span>{scheduledWeeklyStage.stageId === p.id ? "✓ Queued" : "📅 Queue"}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => void handlePostStage(p.id)}
                        disabled={postingEndless}
                        title="Create an immediate Reddit post featuring this stage"
                        className="px-2 py-1 bg-cyan-950/80 hover:bg-cyan-800/80 text-cyan-300 hover:text-white border border-cyan-500/40 rounded-lg text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                      >
                        Post
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEdit(p)}
                        className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-cyan-300 border border-cyan-800/40 rounded-lg text-xs font-bold transition-all"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDeleteStage(p.id)}
                        className="px-2 py-1 bg-gray-800 hover:bg-red-950 text-gray-400 hover:text-red-400 border border-gray-700 rounded-lg text-xs font-bold transition-all"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Choose Stage to Post Modal */}
      {showPostModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-cyan-500/50 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-5 animate-fadeIn text-left">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🚀</span>
                <h3 className="text-lg font-bold text-white">Publish Slide Match Post</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPostModal(false)}
                className="text-gray-400 hover:text-white text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-gray-300">
                Choose which puzzle will be showcased and simulated on the Reddit post splash screen:
              </p>

              <div className="space-y-2">
                <label className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider block">
                  Select Puzzle / Stage:
                </label>
                <select
                  value={selectedPostStageId}
                  onChange={(e) => setSelectedPostStageId(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white font-bold text-sm focus:outline-none focus:border-cyan-500"
                >
                  <option value="current">
                    Current Active Stage ({stageName || 'New Stage'})
                  </option>
                  <option value="default">Default 4×4 Demo Stage</option>
                  <optgroup label="Saved Easy Stages">
                    {puzzles
                      .filter((p) => p.difficulty === 'easy')
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.width}×{p.height}, {p.blocks.length} blocks)
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="Saved Medium Stages">
                    {puzzles
                      .filter((p) => p.difficulty === 'medium')
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.width}×{p.height}, {p.blocks.length} blocks)
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="Saved Hard Stages">
                    {puzzles
                      .filter((p) => p.difficulty === 'hard')
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.width}×{p.height}, {p.blocks.length} blocks)
                        </option>
                      ))}
                  </optgroup>
                </select>
              </div>

              {selectedPostStageId === 'current' && (
                <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-[11px] text-cyan-300">
                  ℹ️ Selecting the current active stage will auto-save any unsaved board edits before posting or queueing.
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-2 pt-3 border-t border-gray-800 flex-wrap">
              <button
                type="button"
                onClick={() => setShowPostModal(false)}
                className="px-3.5 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void handleQueueWeekly(selectedPostStageId)}
                  disabled={queuingWeekly}
                  className="px-4 py-2 bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-500/50 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1"
                >
                  <span>📅</span>
                  <span>{queuingWeekly ? 'Queueing...' : 'Queue for Next Thursday'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => void handlePostStage(selectedPostStageId)}
                  disabled={postingEndless}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)] cursor-pointer disabled:opacity-50 flex items-center gap-1"
                >
                  <span>🚀</span>
                  <span>{postingEndless ? 'Posting...' : 'Post Now'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
