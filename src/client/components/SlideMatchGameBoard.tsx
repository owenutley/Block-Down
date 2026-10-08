import { useState, useEffect, useMemo, useCallback, useRef, type TouchEvent } from 'react';
import { trpc } from '../trpc';
import {
  SlideMatchPuzzle,
  PuzzleBlock,
  PortalDirection,
  SlideMatchEndlessRecordResult,
} from '../../shared/types';
import { calculateBlockSlide, isSlideMatchSolved } from '../../shared/slideMatch';
import { generateEndlessSlideMatchPuzzle } from '../../shared/slideMatchGenerator';
import { playBlockPushSound, playWinMelody, playUndoSound, playThudSound, playGameOverSound } from '../utils/audio';
import { ThemeId, Theme, ThemeConfig, getBaseThemeId, DEFAULT_THEME_CONFIGS, ColorId } from '../../shared/themes';
import { HexagonBlock } from './HexagonBlock';
import { colorToBlockType } from '../utils/puzzle';
import { getThemeColorPalette, THEME_STYLES, getWallStyle } from './ThemeBoardRenderer';
import { computeWallNeighbors, computeWallCornerRadii } from '../utils/wallAutotiling';
import { SlideMatchInstructionsModal } from './SlideMatchInstructionsModal';
import { PuzzleShape } from './PuzzleShape';
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
  onReturnToHub: () => void;
  activeTheme?: ThemeId;
  activeThemeStyle?: Theme | undefined;
  themeConfig?: ThemeConfig | undefined;
};

export const SlideMatchGameBoard = ({
  initialStage = 1,
  onReturnToHub,
  activeTheme = 'neon',
  activeThemeStyle,
  themeConfig,
}: SlideMatchGameBoardProps) => {
  const [stage, setStage] = useState<number>(initialStage);
  const [currentPuzzle, setCurrentPuzzle] = useState<SlideMatchPuzzle>(() => generateEndlessSlideMatchPuzzle(initialStage));
  const [blocks, setBlocks] = useState<PuzzleBlock[]>(() => currentPuzzle.blocks.map((b) => ({ ...b })));
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [slideHistory, setSlideHistory] = useState<PuzzleBlock[][]>([]);
  const [slideCount, setSlideCount] = useState(0);

  // Score & Endless Run State
  const [score, setScore] = useState<number>(0);
  const [timeRemaining, setTimeRemaining] = useState<number>(STAGE_TIME_LIMIT_SEC);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isStageTransitioning, setIsStageTransitioning] = useState<boolean>(false);
  const [lastStageScoreBonus, setLastStageScoreBonus] = useState<number | null>(null);
  const [showInstructions, setShowInstructions] = useState<boolean>(false);
  const [runRecordResult, setRunRecordResult] = useState<SlideMatchEndlessRecordResult | null>(null);

  // Touch gesture tracker
  const touchStartPos = useRef<{ x: number; y: number; blockId: string } | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(Date.now());
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

  // Main 30s Countdown Timer Loop
  useEffect(() => {
    if (isGameOver || isStageTransitioning || showInstructions) {
      lastTimeRef.current = Date.now();
      return;
    }

    lastTimeRef.current = Date.now();

    const tick = () => {
      const now = Date.now();
      const deltaSec = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      setTimeRemaining((prev) => {
        const nextTime = Math.max(0, prev - deltaSec);
        if (nextTime <= 0) {
          setIsGameOver(true);
          return 0;
        }
        return nextTime;
      });

      animationFrameRef.current = requestAnimationFrame(tick);
    };

    animationFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isGameOver, isStageTransitioning, showInstructions]);

  // Handle Game Over: record run
  useEffect(() => {
    if (isGameOver && !hasRecordedRunRef.current) {
      hasRecordedRunRef.current = true;
      playGameOverSound();

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
  }, [isGameOver, score, stage]);

  // Reset blocks to current puzzle's start position (timer continues)
  const handleResetPuzzle = useCallback(() => {
    if (isGameOver || isStageTransitioning) return;
    playUndoSound();
    setBlocks(currentPuzzle.blocks.map((b) => ({ ...b })));
    setSelectedBlockId(null);
    setSlideHistory([]);
    setSlideCount(0);
  }, [currentPuzzle, isGameOver, isStageTransitioning]);

  // Undo last slide within the current stage
  const handleUndo = useCallback(() => {
    if (isGameOver || isStageTransitioning || slideHistory.length === 0) return;
    playUndoSound();
    const prevBlocks = slideHistory[slideHistory.length - 1];
    if (prevBlocks) {
      setBlocks(prevBlocks);
      setSlideHistory((prev) => prev.slice(0, -1));
      setSlideCount((c) => Math.max(0, c - 1));
      setSelectedBlockId(null);
    }
  }, [isGameOver, isStageTransitioning, slideHistory]);

  // Start Next Stage
  const advanceToNextStage = useCallback(() => {
    const nextStageNum = stage + 1;
    const nextPuzzle = generateEndlessSlideMatchPuzzle(nextStageNum);

    setStage(nextStageNum);
    setCurrentPuzzle(nextPuzzle);
    setBlocks(nextPuzzle.blocks.map((b) => ({ ...b })));
    setSelectedBlockId(null);
    setSlideHistory([]);
    setSlideCount(0);
    setTimeRemaining(STAGE_TIME_LIMIT_SEC);
    setIsStageTransitioning(false);
    setLastStageScoreBonus(null);
  }, [stage]);

  // Slide Execution
  const executeSlide = useCallback(
    (blockId: string, dir: PortalDirection) => {
      if (isGameOver || isStageTransitioning) return;

      const result = calculateBlockSlide(
        blockId,
        dir,
        currentPuzzle.width,
        currentPuzzle.height,
        wallSet,
        blocks,
        portals
      );

      if (!result.moved) {
        playThudSound();
        return;
      }

      playBlockPushSound();

      const nextBlocks = blocks.map((b) =>
        b.id === blockId ? { ...b, x: result.finalPos.x, y: result.finalPos.y } : b
      );

      setSlideHistory((prev) => [...prev, blocks]);
      setBlocks(nextBlocks);
      setSlideCount((c) => c + 1);

      // Check win condition
      if (isSlideMatchSolved(nextBlocks, targets)) {
        setIsStageTransitioning(true);
        playWinMelody();

        // Calculate score bonus:
        // Base stage points + Time Remaining bonus (e.g. 25.4s left * 40 = 1016 pts)
        const timeBonus = Math.round(timeRemaining * 40);
        const stageBase = stage * 100;
        const totalBonus = stageBase + timeBonus;

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
      blocks,
      portals,
      targets,
      timeRemaining,
      stage,
      advanceToNextStage,
    ]
  );

  // Restart Fresh Run
  const handleRestartRun = useCallback(() => {
    hasRecordedRunRef.current = false;
    setStage(1);
    const freshPuzzle = generateEndlessSlideMatchPuzzle(1);
    setCurrentPuzzle(freshPuzzle);
    setBlocks(freshPuzzle.blocks.map((b) => ({ ...b })));
    setSelectedBlockId(null);
    setSlideHistory([]);
    setSlideCount(0);
    setScore(0);
    setTimeRemaining(STAGE_TIME_LIMIT_SEC);
    setIsGameOver(false);
    setIsStageTransitioning(false);
    setLastStageScoreBonus(null);
    setRunRecordResult(null);
  }, []);

  // Keyboard navigation for selected block
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isGameOver || isStageTransitioning || showInstructions) return;

      if (e.key === 'r' || e.key === 'R') {
        handleResetPuzzle();
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
  }, [executeSlide, handleResetPuzzle, selectedBlockId, isGameOver, isStageTransitioning, showInstructions]);

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
  const maxDim = Math.max(gridWidth, gridHeight);

  // Responsive board calculation
  const boardPixelSize = maxDim <= 5 ? 320 : maxDim <= 6 ? 340 : 360;

  return (
    <div
      className={`h-[100dvh] w-full ${styles.bgClass} text-white flex flex-col items-center justify-between p-2 sm:p-4 transition-colors duration-500 overflow-hidden select-none`}
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
            <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
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

        {/* 30.0s Live Countdown Bar & Counter */}
        <div className="w-full bg-slate-950/80 backdrop-blur-md rounded-2xl p-2.5 border border-white/10 shadow-inner flex flex-col gap-1.5 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-mono font-bold">
            <span className="flex items-center gap-1.5 text-zinc-400 text-[11px] uppercase tracking-wider">
              <PuzzleShape shape="pocket_watch" className="w-3.5 h-3.5 text-cyan-400" />
              <span>Speed Clock</span>
              {lastStageScoreBonus !== null && (
                <span className="text-emerald-400 font-bold animate-bounce">+{lastStageScoreBonus} pts!</span>
              )}
            </span>
            <span
              className={cn(
                'text-sm font-black transition-colors font-mono',
                isUrgent ? 'text-red-400 animate-ping font-extrabold' : timeRemaining < 12 ? 'text-amber-400' : 'text-cyan-300'
              )}
            >
              {timeRemaining.toFixed(1)}s
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden relative border border-slate-800">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-75',
                isUrgent
                  ? 'bg-gradient-to-r from-red-600 to-rose-400 shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-pulse'
                  : timeRemaining < 12
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                  : 'bg-gradient-to-r from-cyan-500 to-emerald-400 shadow-[0_0_8px_rgba(6,182,212,0.5)]'
              )}
              style={{ width: `${timerRatio * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Board Container */}
      <div className="flex-1 flex flex-col items-center justify-center my-auto relative z-10">
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

        <div
          className={cn(
            'relative rounded-2xl p-2 sm:p-3 border shadow-2xl transition-all',
            styles.panelClass,
            isUrgent && 'border-red-500/50 shadow-[0_0_25px_rgba(239,68,68,0.3)]'
          )}
          style={{
            width: `${boardPixelSize}px`,
            height: `${boardPixelSize}px`,
          }}
        >
          {/* Grid Cells */}
          <div
            className="grid gap-[3px] w-full h-full"
            style={{
              gridTemplateColumns: `repeat(${gridWidth}, 1fr)`,
              gridTemplateRows: `repeat(${gridHeight}, 1fr)`,
            }}
          >
            {Array.from({ length: gridHeight }).map((_, y) =>
              Array.from({ length: gridWidth }).map((_, x) => {
                const isWall = wallSet.has(`${x},${y}`);
                const target = targets.find((t) => t.x === x && t.y === y);

                const wallNeighbors = isWall ? computeWallNeighbors(x, y, wallSet) : undefined;
                const cornerRadii = computeWallCornerRadii(isWall, wallNeighbors, '6px');
                const targetColorId = target ? toColorId(target.color) : 'blue';
                const palette = getThemeColorPalette(baseThemeId, targetColorId);

                return (
                  <div
                    key={`${x},${y}`}
                    className={cn(
                      'relative rounded-lg flex items-center justify-center overflow-hidden transition-all',
                      isWall ? (getWallStyle(baseThemeId) || styles.wallClass) : styles.cellClass
                    )}
                    style={isWall ? { borderRadius: cornerRadii } : undefined}
                  >
                    {/* Target Circle Marker */}
                    {target && !isWall && (
                      <div
                        className="w-4/5 h-4/5 rounded-full border-2 border-dashed flex items-center justify-center animate-pulse"
                        style={{
                          borderColor: palette.border,
                          backgroundColor: `${palette.colorHex}25`,
                        }}
                      >
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{
                            backgroundColor: palette.colorHex,
                          }}
                        />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Interactive Colored Blocks */}
          {blocks.map((block) => {
            const isSelected = selectedBlockId === block.id;
            const blockColorId = toColorId(block.color);
            const blockType = colorToBlockType(blockColorId);
            const blockConfig = blockType in config ? config[blockType as keyof ThemeConfig] : undefined;
            const isBlockOnTarget = targets.some(
              (t) => t.x === block.x && t.y === block.y && toColorId(t.color) === blockColorId
            );
            const blockPalette = getThemeColorPalette(baseThemeId, blockColorId);

            const leftPx = block.x * ((boardPixelSize - 24) / gridWidth) + 12;
            const topPx = block.y * ((boardPixelSize - 24) / gridHeight) + 12;

            return (
              <div
                key={block.id}
                onTouchStart={(e) => handleTouchStart(e, block.id)}
                onTouchEnd={handleTouchEnd}
                onClick={() => setSelectedBlockId((prev) => (prev === block.id ? null : block.id))}
                className={cn(
                  'absolute flex items-center justify-center transition-all duration-200 cursor-pointer touch-none active:scale-95',
                  isSelected && 'scale-110 z-30'
                )}
                style={{
                  left: `${leftPx}px`,
                  top: `${topPx}px`,
                  width: `${(boardPixelSize - 24) / gridWidth}px`,
                  height: `${(boardPixelSize - 24) / gridHeight}px`,
                  filter: isSelected ? `drop-shadow(0 0 12px ${blockPalette.colorHex})` : undefined,
                }}
              >
                <HexagonBlock
                  blockType={blockType}
                  colorId={blockColorId}
                  baseThemeId={baseThemeId}
                  isSolved={isBlockOnTarget}
                  shape={blockConfig?.shape || 'diamond'}
                />
              </div>
            );
          })}
        </div>
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
                    onClick={() => executeSlide(selectedBlock.id, 'Left')}
                    className="w-12 h-11 sm:w-13 sm:h-12 rounded-2xl flex items-center justify-center transition-all duration-150 active:scale-90 cursor-pointer border backdrop-blur-md"
                    style={{
                      borderColor: selectedPalette.colorHex,
                      backgroundColor: `${selectedPalette.colorHex}22`,
                      boxShadow: `0 0 16px ${selectedPalette.colorHex}45`,
                      color: selectedPalette.colorHex,
                    }}
                    title="Slide Left"
                  >
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                  </button>

                  {/* Up & Down Arrows */}
                  <div className="flex flex-col gap-1.5">
                    <button
                      onClick={() => executeSlide(selectedBlock.id, 'Up')}
                      className="w-12 h-10 sm:w-13 sm:h-10 rounded-xl flex items-center justify-center transition-all duration-150 active:scale-90 cursor-pointer border backdrop-blur-md"
                      style={{
                        borderColor: selectedPalette.colorHex,
                        backgroundColor: `${selectedPalette.colorHex}22`,
                        boxShadow: `0 0 16px ${selectedPalette.colorHex}45`,
                        color: selectedPalette.colorHex,
                      }}
                      title="Slide Up"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 19V5M5 12l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => executeSlide(selectedBlock.id, 'Down')}
                      className="w-12 h-10 sm:w-13 sm:h-10 rounded-xl flex items-center justify-center transition-all duration-150 active:scale-90 cursor-pointer border backdrop-blur-md"
                      style={{
                        borderColor: selectedPalette.colorHex,
                        backgroundColor: `${selectedPalette.colorHex}22`,
                        boxShadow: `0 0 16px ${selectedPalette.colorHex}45`,
                        color: selectedPalette.colorHex,
                      }}
                      title="Slide Down"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 5v14M19 12l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>

                  {/* Right Arrow */}
                  <button
                    onClick={() => executeSlide(selectedBlock.id, 'Right')}
                    className="w-12 h-11 sm:w-13 sm:h-12 rounded-2xl flex items-center justify-center transition-all duration-150 active:scale-90 cursor-pointer border backdrop-blur-md"
                    style={{
                      borderColor: selectedPalette.colorHex,
                      backgroundColor: `${selectedPalette.colorHex}22`,
                      boxShadow: `0 0 16px ${selectedPalette.colorHex}45`,
                      color: selectedPalette.colorHex,
                    }}
                    title="Slide Right"
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
              Swipe directly on blocks or tap arrows to slide. Solve in &lt;30s!
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
                Endless Run Concluded
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
                  {runRecordResult.shardsEarned > 0 && (
                    <div className="flex items-center justify-between border-t border-slate-800 pt-2">
                      <span className="text-xs text-cyan-300 font-mono">Shards Rewarded</span>
                      <span className="text-sm font-black text-emerald-400 font-mono flex items-center gap-1">
                        <span>+{runRecordResult.shardsEarned}</span>
                        <PuzzleShape shape="gem" className="w-3.5 h-3.5 text-cyan-300" />
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Action Buttons */}
            <div className="w-full flex flex-col gap-2 pt-0.5">
              <button
                onClick={handleRestartRun}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 active:scale-98 text-white font-black text-sm uppercase tracking-wider transition-all shadow-[0_0_25px_rgba(99,102,241,0.4)] border border-cyan-300/50 cursor-pointer"
              >
                Play Again
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
