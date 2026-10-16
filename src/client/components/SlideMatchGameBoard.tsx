import { useState, useEffect, useMemo, useCallback, useRef, type TouchEvent, type CSSProperties } from 'react';
import { trpc } from '../trpc';
import { showToast } from '@devvit/web/client';
import {
  SlideMatchPuzzle,
  PuzzleBlock,
  PortalDirection,
  SlideMatchEndlessRecordResult,
  SlideMatchGameMode,
} from '../../shared/types';
import { calculateBlockSlide, isSlideMatchSolved, solveSlideMatch } from '../../shared/slideMatch';
import { generateEndlessSlideMatchPuzzle } from '../../shared/slideMatchGenerator';
import { playBlockPushSound, playWinMelody, playUndoSound, playThudSound, playGameOverSound } from '../utils/audio';
import { ThemeId, Theme, ThemeConfig, getBaseThemeId, DEFAULT_THEME_CONFIGS, ColorId } from '../../shared/themes';
import { HexagonBlock } from './HexagonBlock';
import { colorToBlockType } from '../utils/puzzle';
import { getThemeColorPalette, THEME_STYLES, getWallStyle, getDestinationStyle } from './ThemeBoardRenderer';
import { computeWallNeighbors, computeWallCornerRadii } from '../utils/wallAutotiling';
import { SlideMatchInstructionsModal } from './SlideMatchInstructionsModal';
import { PuzzleShape } from './PuzzleShape';
import { ShardIcon } from './ShardIcon';
import { cn } from '../utils';

const toColorId = (color: string): ColorId => {
  const lower = color.toLowerCase();
  if (
    lower === 'red' ||
    lower === 'blue' ||
    lower === 'yellow' ||
    lower === 'green' ||
    lower === 'orange' ||
    lower === 'purple' ||
    lower === 'cyan'
  ) {
    return lower as ColorId;
  }
  return 'blue';
};

const STAGE_TIME_LIMIT_SEC = 30.0;

export type SlideMatchGameBoardProps = {
  initialStage?: number;
  mode?: SlideMatchGameMode;
  onReturnToHub: () => void;
  activeTheme?: ThemeId;
  activeThemeStyle?: Theme | undefined;
  themeConfig?: ThemeConfig | undefined;
};

export const SlideMatchGameBoard = ({
  initialStage = 1,
  mode = 'speed-rush',
  onReturnToHub,
  activeTheme = 'neon',
  activeThemeStyle,
  themeConfig,
}: SlideMatchGameBoardProps) => {
  const [currentMode, setCurrentMode] = useState<SlideMatchGameMode>(mode);
  const [stage, setStage] = useState<number>(initialStage);
  const [currentPuzzle, setCurrentPuzzle] = useState<SlideMatchPuzzle>(() => generateEndlessSlideMatchPuzzle(initialStage));
  const [blocks, setBlocks] = useState<PuzzleBlock[]>(() => currentPuzzle.blocks.map((b) => ({ ...b })));
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [slideHistory, setSlideHistory] = useState<PuzzleBlock[][]>([]);
  const [slideCount, setSlideCount] = useState(0);

  useEffect(() => {
    setCurrentMode(mode);
  }, [mode]);

  // Moderator & Debug State
  const [isModerator, setIsModerator] = useState<boolean>(false);
  const [isTimeFrozen, setIsTimeFrozen] = useState<boolean>(false);
  const [isAutoSolving, setIsAutoSolving] = useState<boolean>(false);
  const autoSolveTimeoutRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Score & Endless Run State
  const [score, setScore] = useState<number>(0);
  const [timeRemaining, setTimeRemaining] = useState<number>(STAGE_TIME_LIMIT_SEC);
  const timeRemainingRef = useRef<number>(STAGE_TIME_LIMIT_SEC);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isStageTransitioning, setIsStageTransitioning] = useState<boolean>(false);
  const [lastStageScoreBonus, setLastStageScoreBonus] = useState<number | null>(null);
  const [showInstructions, setShowInstructions] = useState<boolean>(false);
  const [runRecordResult, setRunRecordResult] = useState<SlideMatchEndlessRecordResult | null>(null);

  // Sync ref with current blocks for sequential collision detection during auto-solving
  const blocksRef = useRef<PuzzleBlock[]>(blocks);
  useEffect(() => {
    blocksRef.current = blocks;
  }, [blocks]);

  // Check moderator status on mount
  useEffect(() => {
    trpc.dev.checkAuth
      .query()
      .then((res) => setIsModerator(res.isModerator))
      .catch((err: unknown) => console.error('Failed to check moderator status:', err));
  }, []);

  // Clear auto solve timers
  const clearAutoSolveTimeouts = useCallback(() => {
    autoSolveTimeoutRef.current.forEach((t) => clearTimeout(t));
    autoSolveTimeoutRef.current = [];
    setIsAutoSolving(false);
  }, []);

  useEffect(() => {
    return () => {
      clearAutoSolveTimeouts();
    };
  }, [clearAutoSolveTimeouts]);

  // Touch gesture tracker
  const touchStartPos = useRef<{ x: number; y: number; blockId: string } | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const hasRecordedRunRef = useRef<boolean>(false);

  const baseThemeId = getBaseThemeId(activeTheme);
  const defaultStyles = THEME_STYLES[baseThemeId] || THEME_STYLES.neon;
  const styles = {
    bgClass: activeThemeStyle?.bgGradient || defaultStyles.bgClass,
    panelClass: activeThemeStyle?.panelClass || defaultStyles.panelClass,
    cellClass: activeThemeStyle?.cellClass || defaultStyles.cellClass,
    wallClass: activeThemeStyle?.wallClass || defaultStyles.wallClass,
  };
  const config = themeConfig || DEFAULT_THEME_CONFIGS[baseThemeId] || DEFAULT_THEME_CONFIGS.neon;

  const walls = useMemo(() => currentPuzzle.walls || [], [currentPuzzle.walls]);
  const targets = useMemo(() => currentPuzzle.targets || [], [currentPuzzle.targets]);
  const portals = useMemo(() => currentPuzzle.portals || [], [currentPuzzle.portals]);
  const wallSet = useMemo(() => new Set(walls.map((w) => `${w.x},${w.y}`)), [walls]);

  // Check available sliding directions for the currently selected block
  const availableDirections = useMemo(() => {
    if (!selectedBlockId) {
      return { Up: false, Down: false, Left: false, Right: false };
    }
    return {
      Up: calculateBlockSlide(selectedBlockId, 'Up', currentPuzzle.width, currentPuzzle.height, wallSet, blocks, portals).moved,
      Down: calculateBlockSlide(selectedBlockId, 'Down', currentPuzzle.width, currentPuzzle.height, wallSet, blocks, portals).moved,
      Left: calculateBlockSlide(selectedBlockId, 'Left', currentPuzzle.width, currentPuzzle.height, wallSet, blocks, portals).moved,
      Right: calculateBlockSlide(selectedBlockId, 'Right', currentPuzzle.width, currentPuzzle.height, wallSet, blocks, portals).moved,
    };
  }, [selectedBlockId, currentPuzzle.width, currentPuzzle.height, wallSet, blocks, portals]);

  // Main 30s Countdown Timer Loop for Speed Rush (mobile-optimized with throttled state & visibility listener)
  useEffect(() => {
    if (
      currentMode === 'free-play' ||
      isGameOver ||
      isStageTransitioning ||
      showInstructions ||
      isTimeFrozen ||
      isAutoSolving
    ) {
      lastTimeRef.current = Date.now();
      return;
    }

    lastTimeRef.current = Date.now();
    let prevDisplayedTenths = Math.round(timeRemainingRef.current * 10);

    const tick = () => {
      const now = Date.now();
      const deltaSec = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      const nextTime = Math.max(0, timeRemainingRef.current - deltaSec);
      timeRemainingRef.current = nextTime;

      // Only trigger a React component render when the 0.1s digit changes or at zero
      const currentDisplayedTenths = Math.round(nextTime * 10);
      if (currentDisplayedTenths !== prevDisplayedTenths || nextTime <= 0) {
        prevDisplayedTenths = currentDisplayedTenths;
        setTimeRemaining(nextTime);
      }

      if (nextTime <= 0) {
        setIsGameOver(true);
        return;
      }

      animationFrameRef.current = requestAnimationFrame(tick);
    };

    animationFrameRef.current = requestAnimationFrame(tick);

    // Safeguard against mobile tab pause / screen lock
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (animationFrameRef.current !== null) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
      } else {
        lastTimeRef.current = Date.now();
        if (animationFrameRef.current === null) {
          animationFrameRef.current = requestAnimationFrame(tick);
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [currentMode, isGameOver, isStageTransitioning, showInstructions, isTimeFrozen, isAutoSolving]);

  // Handle Game Over: record run ONLY in Speed Rush
  useEffect(() => {
    if (isGameOver && !hasRecordedRunRef.current) {
      hasRecordedRunRef.current = true;
      playGameOverSound();

      if (currentMode === 'speed-rush') {
        const cleared = Math.max(0, stage - 1);
        trpc.slideMatch.recordEndlessRun
          .mutate({ score, stagesCleared: cleared })
          .then((res) => {
            setRunRecordResult(res);
          })
          .catch((err) => {
            console.error('Failed to record endless run:', err);
          });
      }
    }
  }, [isGameOver, score, stage, currentMode]);

  // Reset blocks to current puzzle's start position (timer continues)
  const handleResetPuzzle = useCallback(() => {
    if (isGameOver || isStageTransitioning || isAutoSolving) return;
    clearAutoSolveTimeouts();
    playUndoSound();
    const freshBlocks = currentPuzzle.blocks.map((b) => ({ ...b }));
    blocksRef.current = freshBlocks;
    setBlocks(freshBlocks);
    setSelectedBlockId(null);
    setSlideHistory([]);
    setSlideCount(0);
  }, [currentPuzzle, isGameOver, isStageTransitioning, isAutoSolving, clearAutoSolveTimeouts]);

  // Undo last slide within the current stage
  const handleUndo = useCallback(() => {
    if (isGameOver || isStageTransitioning || isAutoSolving || slideHistory.length === 0) return;
    playUndoSound();
    const prevBlocks = slideHistory[slideHistory.length - 1];
    if (prevBlocks) {
      blocksRef.current = prevBlocks;
      setBlocks(prevBlocks);
      setSlideHistory((prev) => prev.slice(0, -1));
      setSlideCount((c) => Math.max(0, c - 1));
      setSelectedBlockId(null);
    }
  }, [isGameOver, isStageTransitioning, isAutoSolving, slideHistory]);

  // Start Next Stage
  const advanceToNextStage = useCallback(() => {
    clearAutoSolveTimeouts();
    const nextStageNum = stage + 1;
    const nextPuzzle = generateEndlessSlideMatchPuzzle(nextStageNum);
    const nextBlocks = nextPuzzle.blocks.map((b) => ({ ...b }));

    blocksRef.current = nextBlocks;
    setStage(nextStageNum);
    setCurrentPuzzle(nextPuzzle);
    setBlocks(nextBlocks);
    setSelectedBlockId(null);
    setSlideHistory([]);
    setSlideCount(0);
    timeRemainingRef.current = STAGE_TIME_LIMIT_SEC;
    setTimeRemaining(STAGE_TIME_LIMIT_SEC);
    setIsStageTransitioning(false);
    setLastStageScoreBonus(null);
  }, [stage, clearAutoSolveTimeouts]);

  // Slide Execution
  const executeSlide = useCallback(
    (blockId: string, dir: PortalDirection) => {
      if (isGameOver || isStageTransitioning) return;

      const currentBlocks = blocksRef.current;
      const result = calculateBlockSlide(
        blockId,
        dir,
        currentPuzzle.width,
        currentPuzzle.height,
        wallSet,
        currentBlocks,
        portals
      );

      if (!result.moved) {
        playThudSound();
        return;
      }

      playBlockPushSound();

      const nextBlocks = currentBlocks.map((b) =>
        b.id === blockId ? { ...b, x: result.finalPos.x, y: result.finalPos.y } : b
      );

      blocksRef.current = nextBlocks;
      setSlideHistory((prev) => [...prev, currentBlocks]);
      setBlocks(nextBlocks);
      setSlideCount((c) => c + 1);

      // Check win condition
      if (isSlideMatchSolved(nextBlocks, targets)) {
        setIsStageTransitioning(true);
        playWinMelody();

        // Calculate score bonus:
        let totalBonus = 0;
        if (currentMode === 'free-play') {
          // Free Play: pure stage milestone, no timer bonus
          totalBonus = stage * 100;
        } else {
          // Speed Rush: stage base + remaining time bonus
          const timeBonus = Math.round(timeRemainingRef.current * 40);
          const stageBase = stage * 100;
          totalBonus = stageBase + timeBonus;
        }

        setLastStageScoreBonus(totalBonus);
        setScore((prev) => prev + totalBonus);

        // Flash stage cleared banner, then transition to next puzzle after short fanfare
        setTimeout(() => {
          advanceToNextStage();
        }, 900);
      }
    },
    [
      isGameOver,
      isStageTransitioning,
      currentPuzzle.width,
      currentPuzzle.height,
      wallSet,
      portals,
      targets,
      stage,
      currentMode,
      advanceToNextStage,
    ]
  );

  // Moderator Auto-Solve Action
  const handleAutoSolve = useCallback(() => {
    if (isGameOver || isStageTransitioning || isAutoSolving) return;

    clearAutoSolveTimeouts();

    // 1. Try solving from current block configuration
    let solveRes = solveSlideMatch({
      width: currentPuzzle.width,
      height: currentPuzzle.height,
      walls: currentPuzzle.walls,
      blocks: blocksRef.current,
      targets: currentPuzzle.targets,
      portals: currentPuzzle.portals || [],
    });

    // 2. If unsolvable from current state, reset to puzzle start and solve
    if (!solveRes.solvable || solveRes.solutionMoves.length === 0) {
      solveRes = solveSlideMatch({
        width: currentPuzzle.width,
        height: currentPuzzle.height,
        walls: currentPuzzle.walls,
        blocks: currentPuzzle.blocks,
        targets: currentPuzzle.targets,
        portals: currentPuzzle.portals || [],
      });

      if (solveRes.solvable && solveRes.solutionMoves.length > 0) {
        const freshBlocks = currentPuzzle.blocks.map((b) => ({ ...b }));
        blocksRef.current = freshBlocks;
        setBlocks(freshBlocks);
        setSelectedBlockId(null);
        setSlideHistory([]);
      }
    }

    if (!solveRes.solvable || solveRes.solutionMoves.length === 0) {
      showToast({ text: 'No solution path found for this puzzle.', appearance: 'neutral' });
      return;
    }

    setIsAutoSolving(true);
    const moves = solveRes.solutionMoves;

    moves.forEach((move, idx) => {
      const timeout = setTimeout(() => {
        setSelectedBlockId(move.blockId);
        executeSlide(move.blockId, move.dir);
        if (idx === moves.length - 1) {
          setIsAutoSolving(false);
        }
      }, (idx + 1) * 220);
      autoSolveTimeoutRef.current.push(timeout);
    });
  }, [
    isGameOver,
    isStageTransitioning,
    isAutoSolving,
    currentPuzzle,
    clearAutoSolveTimeouts,
    executeSlide,
  ]);

  // Transition to Free Play Practice after Speed Rush Game Over
  const handleSwitchToPractice = useCallback(() => {
    clearAutoSolveTimeouts();
    hasRecordedRunRef.current = false;
    setStage(1);
    const freshPuzzle = generateEndlessSlideMatchPuzzle(1);
    const freshBlocks = freshPuzzle.blocks.map((b) => ({ ...b }));
    blocksRef.current = freshBlocks;
    setCurrentPuzzle(freshPuzzle);
    setBlocks(freshBlocks);
    setSelectedBlockId(null);
    setSlideHistory([]);
    setSlideCount(0);
    setScore(0);
    timeRemainingRef.current = STAGE_TIME_LIMIT_SEC;
    setTimeRemaining(STAGE_TIME_LIMIT_SEC);
    setIsGameOver(false);
    setIsStageTransitioning(false);
    setLastStageScoreBonus(null);
    setRunRecordResult(null);
    setIsTimeFrozen(false);
    setCurrentMode('free-play');
  }, [clearAutoSolveTimeouts]);

  // Keyboard navigation for selected block & mod shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isGameOver || isStageTransitioning || showInstructions || isAutoSolving) return;

      if (e.key === 'r' || e.key === 'R') {
        handleResetPuzzle();
        return;
      }

      // Moderator shortcut: 'P' to auto-solve, 'F' to freeze time
      if (isModerator && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        handleAutoSolve();
        return;
      }

      if (isModerator && (e.key === 'f' || e.key === 'F')) {
        e.preventDefault();
        setIsTimeFrozen((prev) => !prev);
        return;
      }

      // No block moves if no block is currently selected
      if (!selectedBlockId) return;
      const activeId = selectedBlockId;

      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        executeSlide(activeId, 'Up');
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        executeSlide(activeId, 'Down');
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        executeSlide(activeId, 'Left');
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        executeSlide(activeId, 'Right');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    executeSlide,
    handleResetPuzzle,
    handleAutoSolve,
    selectedBlockId,
    isGameOver,
    isStageTransitioning,
    showInstructions,
    isAutoSolving,
    isModerator,
  ]);

  // Touch Swipe Handlers
  const handleTouchStart = (e: TouchEvent, blockId: string) => {
    if (e.touches.length === 0) return;
    const touch = e.touches[0];
    if (touch) {
      touchStartPos.current = { x: touch.clientX, y: touch.clientY, blockId };
    }
  };

  const handleTouchEnd = (e: TouchEvent) => {
    if (!touchStartPos.current || e.changedTouches.length === 0) {
      touchStartPos.current = null;
      return;
    }
    const touch = e.changedTouches[0];
    if (!touch) {
      touchStartPos.current = null;
      return;
    }

    const deltaX = touch.clientX - touchStartPos.current.x;
    const deltaY = touch.clientY - touchStartPos.current.y;
    const blockId = touchStartPos.current.blockId;
    touchStartPos.current = null;

    const threshold = 20;
    if (Math.abs(deltaX) < threshold && Math.abs(deltaY) < threshold) {
      // Tap toggle selection
      setSelectedBlockId((prev) => (prev === blockId ? null : blockId));
      return;
    }

    // Direct swipe: retain selection on this block
    setSelectedBlockId(blockId);
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX > 0) executeSlide(blockId, 'Right');
      else executeSlide(blockId, 'Left');
    } else {
      if (deltaY > 0) executeSlide(blockId, 'Down');
      else executeSlide(blockId, 'Up');
    }
  };

  const timerRatio = Math.max(0, Math.min(1, timeRemaining / STAGE_TIME_LIMIT_SEC));
  const isUrgent = timeRemaining < 6.0;

  // Grid sizing calculations
  const gridWidth = currentPuzzle.width;
  const gridHeight = currentPuzzle.height;

  return (
    <div
      className={`h-[100dvh] w-full ${styles.bgClass} text-white flex flex-col items-center justify-between p-2 sm:p-4 transition-colors duration-500 overflow-hidden select-none touch-none overscroll-none`}
    >
      {/* Top HUD: Return / Title / Stage / Score / How-to */}
      <div className="w-full max-w-md flex flex-col gap-2 pt-1 z-10 shrink-0">
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={onReturnToHub}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold theme-btn backdrop-blur-md transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <span>&larr;</span>
            <span>Hub</span>
          </button>

          {/* Stage & Score Banner */}
          <div className="flex items-center gap-1.5 bg-slate-950/70 backdrop-blur-md px-2.5 py-1 rounded-2xl border border-white/15 shadow-sm">
            <span className={cn(
              'px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider',
              currentMode === 'free-play'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                : 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40'
            )}>
              Stage {stage}
            </span>
            <span className="text-[11px] sm:text-xs font-mono font-bold text-amber-300">
              {score.toLocaleString()} pts
            </span>
            <span className="text-[9px] sm:text-[10px] font-mono text-zinc-400">
              ({slideCount} slides)
            </span>
          </div>

          <button
            onClick={() => setShowInstructions(true)}
            className="w-8 h-8 rounded-full bg-slate-900/80 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40 flex items-center justify-center text-xs font-bold transition-all shadow cursor-pointer"
            title="How to Play"
          >
            <svg className="w-4 h-4 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" />
            </svg>
          </button>
        </div>

        {/* Dynamic Mode Status: Free Play Practice Banner vs 30s Countdown Bar */}
        {currentMode === 'free-play' ? (
          <div className="w-full bg-slate-950/80 backdrop-blur-md rounded-2xl p-2.5 border border-emerald-500/30 shadow-inner flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-300 font-bold uppercase tracking-wider">Free Play Practice</span>
              {lastStageScoreBonus !== null && (
                <span className="text-emerald-400 font-bold animate-bounce">+{lastStageScoreBonus} pts!</span>
              )}
            </div>
            <span className="text-[10px] sm:text-[11px] text-zinc-400">Untimed • 0 Light Whisps</span>
          </div>
        ) : (
          /* 30.0s Live Countdown Bar & Counter */
          <div className="w-full bg-slate-950/80 backdrop-blur-md rounded-2xl p-2.5 border border-white/10 shadow-inner flex flex-col gap-1.5 relative overflow-hidden">
            <div className="flex items-center justify-between text-xs font-mono font-bold">
              <span className="flex items-center gap-1.5 text-zinc-400 text-[11px] uppercase tracking-wider">
                <PuzzleShape shape="pocket_watch" className="w-3.5 h-3.5 text-cyan-400" />
                <span>Speed Clock</span>
                {isTimeFrozen && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-cyan-500/30 text-cyan-300 border border-cyan-400/50 shadow-[0_0_8px_rgba(6,182,212,0.4)] animate-pulse">
                    Frozen
                  </span>
                )}
                {lastStageScoreBonus !== null && (
                  <span className="text-emerald-400 font-bold animate-bounce">+{lastStageScoreBonus} pts!</span>
                )}
              </span>
              <span
                className={cn(
                  'text-sm font-black transition-colors font-mono',
                  isTimeFrozen
                    ? 'text-cyan-300 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]'
                    : isUrgent
                    ? 'text-red-400 font-extrabold'
                    : timeRemaining < 12
                    ? 'text-amber-400'
                    : 'text-cyan-300'
                )}
              >
                {timeRemaining.toFixed(1)}s
              </span>
            </div>

            {/* Hardware-Accelerated Progress Bar */}
            <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden relative border border-slate-800">
              <div
                className={cn(
                  'h-full w-full rounded-full transition-transform duration-100 ease-linear origin-left',
                  isTimeFrozen
                    ? 'bg-gradient-to-r from-cyan-400 to-blue-500 shadow-[0_0_12px_rgba(6,182,212,0.9)]'
                    : isUrgent
                    ? 'bg-gradient-to-r from-red-600 to-rose-400 shadow-[0_0_10px_rgba(239,68,68,0.8)]'
                    : timeRemaining < 12
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                    : 'bg-gradient-to-r from-cyan-500 to-emerald-400 shadow-[0_0_8px_rgba(6,182,212,0.5)]'
                )}
                style={{ transform: `scaleX(${timerRatio})` }}
              />
            </div>
          </div>
        )}

        {/* Moderator Debug Control Bar */}
        {isModerator && (
          <div className="w-full flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-slate-950/85 backdrop-blur-md border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.15)] animate-fadeIn">
            <div className="flex items-center gap-1.5 text-amber-400 font-mono text-[10px] font-bold uppercase tracking-wider">
              <svg className="w-3.5 h-3.5 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>Mod Tools</span>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Solve for Me Button */}
              <button
                onClick={handleAutoSolve}
                disabled={isAutoSolving || isGameOver || isStageTransitioning}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border shadow-sm cursor-pointer active:scale-95 disabled:opacity-40 disabled:pointer-events-none',
                  isAutoSolving
                    ? 'bg-purple-600/60 border-purple-400 text-purple-200 animate-pulse'
                    : 'bg-purple-500/20 hover:bg-purple-500/35 border-purple-500/50 text-purple-300 hover:text-white'
                )}
                title="Automatically solve this stage (Shortcut: P)"
              >
                <svg className="w-3.5 h-3.5 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>{isAutoSolving ? 'Solving...' : 'Solve For Me'}</span>
              </button>

              {/* Freeze Time Button */}
              <button
                onClick={() => setIsTimeFrozen((prev) => !prev)}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border shadow-sm cursor-pointer active:scale-95',
                  isTimeFrozen
                    ? 'bg-cyan-500/40 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                    : 'bg-cyan-500/20 hover:bg-cyan-500/35 border-cyan-500/50 text-cyan-300 hover:text-white'
                )}
                title={isTimeFrozen ? 'Resume countdown timer (Shortcut: F)' : 'Freeze countdown timer (Shortcut: F)'}
              >
                {isTimeFrozen ? (
                  <svg className="w-3.5 h-3.5 text-cyan-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <rect x="6" y="4" width="4" height="16" rx="1" />
                    <rect x="14" y="4" width="4" height="16" rx="1" />
                  </svg>
                )}
                <span>{isTimeFrozen ? 'Resume Time' : 'Freeze Time'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Board Container */}
      <div className="flex-1 flex flex-col items-center justify-center my-auto relative z-10 w-full">
        {/* Stage Clear Pop-in Notice */}
        {isStageTransitioning && (
          <div className="absolute z-30 bg-black/85 backdrop-blur-md rounded-2xl px-6 py-3 border border-emerald-400/80 shadow-[0_0_30px_rgba(16,185,129,0.6)] animate-scaleUp text-center flex flex-col items-center gap-1">
            <svg className="w-7 h-7 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-lg font-black text-emerald-300 tracking-wide uppercase">Stage Cleared!</span>
            <span className="text-xs font-mono font-bold text-white">+{lastStageScoreBonus} Points</span>
          </div>
        )}

        {(() => {
          const inlineStyles: CSSProperties & Record<string, string | number> = {
            display: 'grid',
            gridTemplateColumns: `repeat(${gridWidth}, 1fr)`,
            gap: '1px',
            maxWidth: 'min(calc(100vw - 1.5rem), 90vh)',
            maxHeight: 'calc(100vh - 110px)',
            width: 'fit-content',
            aspectRatio: `${gridWidth} / ${gridHeight}`,
            '--grid-size': String(Math.max(gridWidth, gridHeight)),
          };

          return (
            <div
              className={cn(
                `p-1 sm:p-2 relative ${styles.panelClass} transition-all shadow-2xl`,
                isUrgent && 'border-red-500/80 shadow-[0_0_25px_rgba(239,68,68,0.4)]'
              )}
              style={{
                ...inlineStyles,
                borderRadius: 'calc(var(--cell-size) * 0.35)',
                borderWidth: 'calc(var(--cell-size) * 0.12)',
                borderStyle: 'solid',
              }}
            >
              {/* Floor Cells, Walls & Targets */}
              {Array.from({ length: gridHeight * gridWidth }).map((_, i) => {
                const x = i % gridWidth;
                const y = Math.floor(i / gridWidth);
                const key = `${x},${y}`;
                const isWall = wallSet.has(key);
                const target = targets.find((t) => t.x === x && t.y === y);
                const wallNeighbors = isWall ? computeWallNeighbors(x, y, wallSet) : undefined;
                const radiusVal = 'calc(var(--cell-size) * 0.16)';
                const cellBorderRadius = computeWallCornerRadii(isWall, wallNeighbors, radiusVal);
                const targetColorId = target ? toColorId(target.color) : 'blue';
                const targetBlockType = colorToBlockType(targetColorId);
                const destStyle = target ? getDestinationStyle(config, activeTheme, targetBlockType) : null;
                const wallStyleClass = getWallStyle(baseThemeId) || styles.wallClass;

                return (
                  <div
                    key={key}
                    className={cn(
                      'relative aspect-square flex items-center justify-center transition-all z-0',
                      isWall
                        ? wallStyleClass
                        : `${styles.cellClass} shadow-[inset_0_1px_2px_rgba(255,255,255,0.1)]`
                    )}
                    style={{
                      width: 'var(--cell-size)',
                      height: 'var(--cell-size)',
                      borderRadius: isWall ? cellBorderRadius : 'calc(var(--cell-size) * 0.14)',
                    }}
                  >
                    {/* Wall Autotiling, Seam Bridges, and 3D Bevel Lighting */}
                    {isWall && (
                      <>
                        {/* Seamless gap bridges between adjacent walls */}
                        {wallNeighbors?.right && (
                          <div className={cn('absolute top-0 bottom-0 -right-[1px] w-[1px] pointer-events-none z-1', wallStyleClass)} />
                        )}
                        {wallNeighbors?.bottom && (
                          <div className={cn('absolute left-0 right-0 -bottom-[1px] h-[1px] pointer-events-none z-1', wallStyleClass)} />
                        )}
                        {wallNeighbors?.right && wallNeighbors?.bottom && wallNeighbors?.bottomRight && (
                          <div className={cn('absolute -right-[1px] -bottom-[1px] w-[1px] h-[1px] pointer-events-none z-1', wallStyleClass)} />
                        )}

                        {/* Continuous Perimeter 3D Bevel Lighting (only on exposed exterior faces) */}
                        <div
                          className="absolute inset-0 pointer-events-none overflow-hidden z-1"
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

                    {/* Thematic Circular Destination Target Zone Matching Circular Blocks */}
                    {!isWall && target && destStyle && (
                      <div className="absolute inset-0 w-full h-full flex items-center justify-center pointer-events-none p-1">
                        <div
                          className="w-[84%] h-[84%] rounded-full border-2 border-dashed flex items-center justify-center transition-all animate-pulse"
                          style={{
                            borderColor: destStyle.colorHex,
                            backgroundColor: `${destStyle.colorHex}22`,
                            boxShadow: `inset 0 0 10px ${destStyle.colorHex}30, 0 0 8px ${destStyle.colorHex}25`,
                          }}
                        >
                          {/* Inner Concentric Target Ring */}
                          <div
                            className="w-1/2 h-1/2 rounded-full border border-dotted opacity-60 flex items-center justify-center"
                            style={{ borderColor: destStyle.colorHex }}
                          >
                            {/* Center Target Core Dot */}
                            <div
                              className="w-2.5 h-2.5 rounded-full shadow-[0_0_6px_currentColor]"
                              style={{ backgroundColor: destStyle.colorHex, color: destStyle.colorHex }}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Sliding Round Pieces Layer */}
              <div
                className="absolute overflow-visible z-10"
                style={{
                  top: 'var(--grid-padding)',
                  left: 'var(--grid-padding)',
                  right: 'var(--grid-padding)',
                  bottom: 'var(--grid-padding)',
                  pointerEvents: 'none',
                  width: 'calc(100% - 2 * var(--grid-padding))',
                  height: 'calc(100% - 2 * var(--grid-padding))',
                }}
              >
                {blocks.map((block) => {
                  const isSelected = selectedBlockId === block.id;
                  const blockColorId = toColorId(block.color);
                  const blockType = colorToBlockType(blockColorId);
                  const blockConfig = blockType in config ? config[blockType as keyof ThemeConfig] : undefined;
                  const isBlockOnTarget = targets.some(
                    (t) => t.x === block.x && t.y === block.y && toColorId(t.color) === blockColorId
                  );
                  const blockPalette = getThemeColorPalette(baseThemeId, blockColorId);

                  return (
                    <div
                      key={block.id}
                      onTouchStart={(e) => handleTouchStart(e, block.id)}
                      onTouchEnd={handleTouchEnd}
                      onClick={() => setSelectedBlockId((prev) => (prev === block.id ? null : block.id))}
                      className={cn(
                        'absolute aspect-square pointer-events-auto flex items-center justify-center transition-transform duration-200 cursor-pointer touch-none',
                        isSelected && 'z-30'
                      )}
                      style={{
                        width: 'var(--cell-size)',
                        height: 'var(--cell-size)',
                        transform: `translate3d(calc(${block.x} * (var(--cell-size) + 1px)), calc(${block.y} * (var(--cell-size) + 1px)), 0px)`,
                        filter: isSelected
                          ? `drop-shadow(0 0 14px ${blockPalette.colorHex}) drop-shadow(0 0 4px ${blockPalette.colorHex})`
                          : undefined,
                      }}
                    >
                      <HexagonBlock
                        blockType={blockType}
                        colorId={blockColorId}
                        baseThemeId={baseThemeId}
                        isSolved={isBlockOnTarget}
                        isCircular={true}
                        shape={blockConfig?.shape || 'diamond'}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </div>

      {/* Directional Pad / Quick Actions Footer */}
      {(() => {
        const selectedBlock = blocks.find((b) => b.id === selectedBlockId);
        const selectedColorId = selectedBlock ? toColorId(selectedBlock.color) : null;
        const selectedPalette = selectedColorId ? getThemeColorPalette(baseThemeId, selectedColorId) : null;

        return (
          <div className="w-full max-w-md flex flex-col items-center gap-2 pb-2 shrink-0 z-10">
            {/* Dynamic Controls Bar */}
            <div className="w-full flex items-center justify-between px-2 sm:px-4 min-h-[96px]">
              {selectedBlock && selectedPalette ? (
                /* Color-matched Stylized Directional Arrows */
                <div className="flex items-center gap-2.5 animate-fade-in">
                  {/* Left Arrow */}
                  <button
                    onClick={() => availableDirections.Left && executeSlide(selectedBlock.id, 'Left')}
                    disabled={!availableDirections.Left}
                    className={cn(
                      'w-12 h-11 sm:w-13 sm:h-12 rounded-2xl flex items-center justify-center transition-all duration-150 border backdrop-blur-md',
                      availableDirections.Left
                        ? 'cursor-pointer active:scale-90 hover:scale-105'
                        : 'cursor-not-allowed border-slate-800 bg-slate-900/40 text-zinc-600 opacity-40 shadow-none'
                    )}
                    style={
                      availableDirections.Left
                        ? {
                            borderColor: selectedPalette.colorHex,
                            backgroundColor: `${selectedPalette.colorHex}22`,
                            boxShadow: `0 0 16px ${selectedPalette.colorHex}45`,
                            color: selectedPalette.colorHex,
                          }
                        : undefined
                    }
                    title={availableDirections.Left ? 'Slide Left' : 'Blocked'}
                  >
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                  </button>

                  {/* Up & Down Arrows */}
                  <div className="flex flex-col gap-1.5">
                    <button
                      onClick={() => availableDirections.Up && executeSlide(selectedBlock.id, 'Up')}
                      disabled={!availableDirections.Up}
                      className={cn(
                        'w-12 h-10 sm:w-13 sm:h-10 rounded-xl flex items-center justify-center transition-all duration-150 border backdrop-blur-md',
                        availableDirections.Up
                          ? 'cursor-pointer active:scale-90 hover:scale-105'
                          : 'cursor-not-allowed border-slate-800 bg-slate-900/40 text-zinc-600 opacity-40 shadow-none'
                      )}
                      style={
                        availableDirections.Up
                          ? {
                              borderColor: selectedPalette.colorHex,
                              backgroundColor: `${selectedPalette.colorHex}22`,
                              boxShadow: `0 0 16px ${selectedPalette.colorHex}45`,
                              color: selectedPalette.colorHex,
                            }
                          : undefined
                      }
                      title={availableDirections.Up ? 'Slide Up' : 'Blocked'}
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 19V5M5 12l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => availableDirections.Down && executeSlide(selectedBlock.id, 'Down')}
                      disabled={!availableDirections.Down}
                      className={cn(
                        'w-12 h-10 sm:w-13 sm:h-10 rounded-xl flex items-center justify-center transition-all duration-150 border backdrop-blur-md',
                        availableDirections.Down
                          ? 'cursor-pointer active:scale-90 hover:scale-105'
                          : 'cursor-not-allowed border-slate-800 bg-slate-900/40 text-zinc-600 opacity-40 shadow-none'
                      )}
                      style={
                        availableDirections.Down
                          ? {
                              borderColor: selectedPalette.colorHex,
                              backgroundColor: `${selectedPalette.colorHex}22`,
                              boxShadow: `0 0 16px ${selectedPalette.colorHex}45`,
                              color: selectedPalette.colorHex,
                            }
                          : undefined
                      }
                      title={availableDirections.Down ? 'Slide Down' : 'Blocked'}
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 5v14M19 12l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>

                  {/* Right Arrow */}
                  <button
                    onClick={() => availableDirections.Right && executeSlide(selectedBlock.id, 'Right')}
                    disabled={!availableDirections.Right}
                    className={cn(
                      'w-12 h-11 sm:w-13 sm:h-12 rounded-2xl flex items-center justify-center transition-all duration-150 border backdrop-blur-md',
                      availableDirections.Right
                        ? 'cursor-pointer active:scale-90 hover:scale-105'
                        : 'cursor-not-allowed border-slate-800 bg-slate-900/40 text-zinc-600 opacity-40 shadow-none'
                    )}
                    style={
                      availableDirections.Right
                        ? {
                            borderColor: selectedPalette.colorHex,
                            backgroundColor: `${selectedPalette.colorHex}22`,
                            boxShadow: `0 0 16px ${selectedPalette.colorHex}45`,
                            color: selectedPalette.colorHex,
                          }
                        : undefined
                    }
                    title={availableDirections.Right ? 'Slide Right' : 'Blocked'}
                  >
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              ) : (
                /* Guidance Bar when no block is selected */
                <div className="flex-1 flex items-center justify-center py-4 px-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 text-zinc-400 text-xs font-mono font-bold tracking-wide mr-3 animate-pulse">
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                    </svg>
                    <span>Tap a block to slide</span>
                  </span>
                </div>
              )}

              {/* Undo & Reset actions */}
              <div className="flex flex-col gap-1.5 shrink-0 ml-auto pl-2">
                <button
                  onClick={handleUndo}
                  disabled={slideHistory.length === 0}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-gray-300 hover:text-white text-xs font-bold border border-slate-700/60 transition-all active:scale-95 cursor-pointer disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1.5 shadow-sm"
                  title="Undo last slide"
                >
                  <svg className="w-3.5 h-3.5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a5 5 0 0 1 5 5v2M3 10l5-5M3 10l5 5" />
                  </svg>
                  <span>Undo</span>
                </button>
                <button
                  onClick={handleResetPuzzle}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-gray-300 hover:text-white text-xs font-bold border border-slate-700/60 transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 shadow-sm"
                  title="Reset current stage (clock keeps running)"
                >
                  <svg className="w-3.5 h-3.5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Reset</span>
                </button>
              </div>
            </div>

            <p className="text-[10px] text-gray-400 font-mono text-center">
              {currentMode === 'free-play'
                ? 'Swipe directly on blocks or tap arrows to slide. Untimed practice.'
                : 'Swipe directly on blocks or tap arrows to slide. Solve in <30s!'}
            </p>
          </div>
        );
      })()}

      {/* Instructions Modal */}
      <SlideMatchInstructionsModal
        isOpen={showInstructions}
        onClose={() => setShowInstructions(false)}
      />

      {/* Game Over Modal */}
      {isGameOver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn select-none">
          <div className="bg-slate-950/90 border border-cyan-500/40 rounded-3xl p-5 sm:p-6 max-w-sm w-full text-white shadow-[0_0_50px_rgba(6,182,212,0.25)] flex flex-col items-center text-center gap-3.5 animate-scaleUp">
            <div className="w-14 h-14 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.3)]">
              <PuzzleShape shape="pocket_watch" className="w-7 h-7 text-red-400" />
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-black neon-text-title tracking-tight text-white uppercase">
                Time&apos;s Up!
              </h2>
              <p className="text-[11px] sm:text-xs text-zinc-400 font-mono tracking-wider uppercase mt-0.5">
                Speed Rush Run Concluded
              </p>
            </div>

            {/* Score & Stage Summary Card */}
            <div className="w-full bg-slate-900/80 border border-white/10 rounded-2xl p-3.5 flex flex-col gap-2 shadow-inner">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-zinc-400 uppercase font-mono">Final Score</span>
                <span className="text-lg font-black text-amber-300 font-mono">
                  {score.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-zinc-400 uppercase font-mono">Stages Cleared</span>
                <span className="text-sm font-black text-cyan-300 font-mono">
                  Stage {Math.max(0, stage - 1)}
                </span>
              </div>
              {runRecordResult && (
                <>
                  {runRecordResult.isNewHighScore && (
                    <div className="py-1 px-2.5 rounded-lg bg-amber-500/20 border border-amber-400/50 text-amber-300 font-bold text-xs animate-bounce flex items-center justify-center gap-1.5 shadow-sm">
                      <PuzzleShape shape="crown" className="w-3.5 h-3.5 text-amber-400" />
                      <span>NEW HIGH SCORE!</span>
                    </div>
                  )}
                  {runRecordResult.shardsEarned > 0 ? (
                    <div className="flex items-center justify-between border-t border-slate-800 pt-2">
                      <span className="text-xs text-cyan-300 font-mono">Daily Light Whisps</span>
                      <span className="text-sm font-black text-emerald-400 font-mono flex items-center gap-1">
                        <span>+{runRecordResult.shardsEarned}</span>
                        <ShardIcon className="w-3.5 h-3.5 text-cyan-300" />
                      </span>
                    </div>
                  ) : runRecordResult.dailyRewardAlreadyClaimed ? (
                    <div className="border-t border-slate-800 pt-2 text-[10px] font-mono text-zinc-400 text-center">
                      <span>Daily Light Whisp payout collected • Resets at 00:00 UTC</span>
                    </div>
                  ) : null}
                </>
              )}
            </div>

            {/* Action Buttons */}
            <div className="w-full flex flex-col gap-2 pt-0.5">
              <button
                onClick={handleSwitchToPractice}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 active:scale-98 text-white font-black text-sm uppercase tracking-wider transition-all shadow-[0_0_25px_rgba(16,185,129,0.3)] border border-emerald-300/50 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Practice in Free Play</span>
                <span>&rarr;</span>
              </button>
              <button
                onClick={onReturnToHub}
                className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white font-bold text-xs uppercase tracking-wider border border-white/10 transition-all cursor-pointer"
              >
                Return to Hub
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
