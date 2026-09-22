/* eslint-disable @typescript-eslint/no-explicit-any */
import './index.css';

import { requestExpandedMode } from '@devvit/web/client';
import { StrictMode, useEffect, useState, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { trpc } from './trpc';
import { convertPuzzleToLevelConfig, getNextPosWithPortalsDetails, dirToVector } from './utils/puzzle';
import { ThemeBoardRenderer } from './components/ThemeBoardRenderer';
import { PuzzleShape } from './components/PuzzleShape';
import { THEMES, DEFAULT_THEME_CONFIGS, getThemeBgClass, getBaseThemeId } from '../shared/themes';

const positionKey = (x: number, y: number) => `${x},${y}`;

const getNextState = (
  player: { x: number; y: number },
  blocks: any[],
  dir: { x: number; y: number },
  levelConfig: any
) => {
  if (!dir || (dir.x === 0 && dir.y === 0)) {
    return { player, blocks, action: 'none' as const, blockTrajectory: null };
  }

  const wallSet = new Set<string>(levelConfig.walls.map((w: any) => positionKey(w.x, w.y)));
  const blockMap = new Map(blocks.map((block, idx) => [positionKey(block.pos.x, block.pos.y), idx]));
  const portals = levelConfig.portals || [];

  const canOccupy = (pos: { x: number; y: number }, includeBlocks = true) => {
    if (pos.x < 0 || pos.x >= levelConfig.gridSize || pos.y < 0 || pos.y >= levelConfig.gridSize) {
      return false;
    }
    if (wallSet.has(positionKey(pos.x, pos.y))) {
      return false;
    }
    if (includeBlocks && blockMap.has(positionKey(pos.x, pos.y))) {
      return false;
    }
    return true;
  };

  // 1. Check if character is standing on a portal and moving into it
  const portalOnCurrentCell = portals.find(
    (p: any) => p.x === player.x && p.y === player.y
  );

  if (portalOnCurrentCell) {
    const portalVec = dirToVector(portalOnCurrentCell.dir);
    if (portalVec.x === -dir.x && portalVec.y === -dir.y) {
      const exitPortal = portals.find(
        (p: any) => p.color.toLowerCase() === portalOnCurrentCell.color.toLowerCase() && p.id !== portalOnCurrentCell.id
      );

      if (exitPortal) {
        const exitPos = { x: exitPortal.x, y: exitPortal.y };
        const isExitWallOrBound =
          exitPos.x < 0 || exitPos.x >= levelConfig.gridSize ||
          exitPos.y < 0 || exitPos.y >= levelConfig.gridSize ||
          wallSet.has(positionKey(exitPos.x, exitPos.y));

        if (!isExitWallOrBound) {
          const blockIdxAtExit = blockMap.get(positionKey(exitPos.x, exitPos.y));
          const newBlockPositions = [...blocks];
          let blockTrajectory = null;

          if (blockIdxAtExit !== undefined) {
            const block = blocks[blockIdxAtExit];
            if (block) {
              const exitDir = dirToVector(exitPortal.dir);
              const trajectory = getNextPosWithPortalsDetails(
                block.pos,
                exitDir,
                levelConfig.gridSize,
                wallSet,
                blocks.map((b: any) => b.pos),
                portals
              );
              const blockNewPos = trajectory.finalPos;

              if (blockNewPos.x !== block.pos.x || blockNewPos.y !== block.pos.y) {
                newBlockPositions[blockIdxAtExit] = { ...block, pos: blockNewPos, noTransition: false };
                blockTrajectory = { blockIdx: blockIdxAtExit, block, trajectory, blockNewPos };
              } else {
                return { player, blocks, action: 'none' as const, blockTrajectory: null };
              }
            }
          }

          return { player: exitPos, blocks: newBlockPositions, action: 'teleport' as const, blockTrajectory };
        }
      }
    }
  }

  // 2. Normal step
  const newPos = { x: player.x + dir.x, y: player.y + dir.y };
  if (!canOccupy(newPos, false)) {
    return { player, blocks, action: 'none' as const, blockTrajectory: null };
  }

  const newBlockPositions = [...blocks];
  let blockTrajectory = null;

  const blockIdx = blockMap.get(positionKey(newPos.x, newPos.y));
  if (blockIdx !== undefined) {
    const block = blocks[blockIdx];
    if (!block) return { player, blocks, action: 'none' as const, blockTrajectory: null };
    const oldBlockPos = block.pos;
    const trajectory = getNextPosWithPortalsDetails(
      oldBlockPos,
      dir,
      levelConfig.gridSize,
      wallSet,
      blocks.map((b: any) => b.pos),
      portals
    );
    const blockNewPos = trajectory.finalPos;

    if (blockNewPos.x === oldBlockPos.x && blockNewPos.y === oldBlockPos.y) {
      return { player, blocks, action: 'none' as const, blockTrajectory: null };
    }

    newBlockPositions[blockIdx] = { ...block, pos: blockNewPos, noTransition: false };
    blockTrajectory = { blockIdx, block, trajectory, blockNewPos };
  }

  return { player: newPos, blocks: newBlockPositions, action: 'move' as const, blockTrajectory };
};

export const Splash = () => {
  const [levelConfig, setLevelConfig] = useState<any>(null);
  const [playerPos, setPlayerPos] = useState<any>(null);
  const [blockPositions, setBlockPositions] = useState<any[]>([]);
  const [dailyNumber, setDailyNumber] = useState<number | null>(null);
  const [currency, setCurrency] = useState<number | null>(null);

  const [lastAction, setLastAction] = useState<'move' | 'teleport' | 'reset'>('reset');
  const prevPlayerPos = useRef<any>(null);
  const prevBlockPositions = useRef<any[]>([]);
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [totalCompletions, setTotalCompletions] = useState<number>(0);
  const [totalStarts, setTotalStarts] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [topLeader, setTopLeader] = useState<{ username: string; moveCount: number; solveTime: number } | null>(null);
  const [isCurrentDaily, setIsCurrentDaily] = useState<boolean>(false);
  const [hasClaimedDailyStartBonus, setHasClaimedDailyStartBonus] = useState<boolean>(false);
  const loadedNumberRef = useRef<number | null>(null);

  const calculateTimeUntilMidnightUTC = () => {
    const now = new Date();
    const nextMidnight = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + 1,
      0, 0, 0, 0
    ));
    const diffMs = Math.max(0, nextMidnight.getTime() - now.getTime());
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const [timeUntilNextDaily, setTimeUntilNextDaily] = useState<string>(calculateTimeUntilMidnightUTC());

  useEffect(() => {
    const updateTimer = () => {
      if (!document.hidden) {
        setTimeUntilNextDaily(calculateTimeUntilMidnightUTC());
      }
    };

    const intervalId = setInterval(updateTimer, 1000);
    document.addEventListener('visibilitychange', updateTimer);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', updateTimer);
    };
  }, []);

  const dailyNumVal = dailyNumber || 1;
  const themeIndex = (dailyNumVal - 1) % THEMES.length;
  const activeTheme = levelConfig?.theme || THEMES[themeIndex]?.id || 'neon';
  const baseTheme = getBaseThemeId(activeTheme);
  const activeThemeStyle = THEMES.find((t) => t.id === activeTheme) || THEMES[themeIndex];
  const themeConfig = DEFAULT_THEME_CONFIGS[baseTheme] || DEFAULT_THEME_CONFIGS.neon;
  const activeCharacter = levelConfig?.character || levelConfig?.theme || THEMES[themeIndex]?.id || 'neon';
  const isLowSolveRate = totalStarts > 0 && totalCompletions / totalStarts < 0.5;
  const statColorClass = isLowSolveRate ? 'text-red-400' : 'text-emerald-400';

  useEffect(() => {
    document.documentElement.classList.add('splash-mode');
    document.body.classList.add('splash-mode');
  }, []);

  useEffect(() => {
    const fetchSplash = async () => {
      if (selectedNumber !== null && loadedNumberRef.current === selectedNumber) {
        return;
      }

      try {
        const queryInput = selectedNumber !== null ? { dailyNumber: selectedNumber } : undefined;

        // Fetch puzzle and currency in parallel to cut load latency in half
        const [postPuzzle, currencyRes] = await Promise.all([
          trpc.puzzle.getForPost.query(queryInput),
          currency === null ? trpc.currency.get.query().catch(() => null) : Promise.resolve(null),
        ]);

        if (currencyRes) {
          setCurrency(currencyRes.currency);
        }

        if (postPuzzle) {
          loadedNumberRef.current = postPuzzle.number;
          setDailyNumber(postPuzzle.number);
          if (selectedNumber === null) {
            setSelectedNumber(postPuzzle.number);
          }
          setIsCompleted(postPuzzle.isCompleted);
          setTotalCompletions(postPuzzle.totalCompletions);
          setTotalStarts(postPuzzle.totalAttempts || postPuzzle.totalCompletions || 0);
          if (postPuzzle.streak?.currentStreak !== undefined) {
            setStreak(postPuzzle.streak.currentStreak);
          }
          if (postPuzzle.topLeader) {
            setTopLeader(postPuzzle.topLeader);
          }
          if (postPuzzle.isCurrentDaily !== undefined) {
            setIsCurrentDaily(postPuzzle.isCurrentDaily);
          }
          if (postPuzzle.hasClaimedDailyStartBonus !== undefined) {
            setHasClaimedDailyStartBonus(postPuzzle.hasClaimedDailyStartBonus);
          }
          if (postPuzzle.puzzle) {
            const config = convertPuzzleToLevelConfig(postPuzzle.puzzle);
            setLevelConfig(config);
          }
        }
      } catch (e) {
        console.error('Failed to load puzzle for splash', e);
      }
    };
    void fetchSplash();
  }, [selectedNumber, currency]);

  useEffect(() => {
    if (!levelConfig) return;

    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    prevPlayerPos.current = levelConfig.startPos;
    prevBlockPositions.current = levelConfig.blocks;
    setLastAction('reset');
    setPlayerPos(levelConfig.startPos);
    setBlockPositions(levelConfig.blocks);

    const splashLimit = typeof levelConfig.splashMovesCount === 'number' && levelConfig.splashMovesCount >= 0
      ? levelConfig.splashMovesCount
      : 10;
    const movesToPlay = levelConfig.moves.slice(0, splashLimit);
    let currentIndex = 0;

    let currentPlayerPos = { ...levelConfig.startPos };
    let currentBlockPositions = levelConfig.blocks.map((b: any) => ({ ...b, pos: { ...b.pos } }));

    const parseMoveDirection = (move: any): { x: number; y: number } => {
      if (!move) return { x: 0, y: 0 };
      if (typeof move === 'object' && typeof move.x === 'number' && typeof move.y === 'number') {
        return move;
      }
      if (typeof move === 'string') {
        switch (move.toLowerCase()) {
          case 'up': case 'u': return { x: 0, y: -1 };
          case 'down': case 'd': return { x: 0, y: 1 };
          case 'left': case 'l': return { x: -1, y: 0 };
          case 'right': case 'r': return { x: 1, y: 0 };
        }
      }
      return { x: 0, y: 0 };
    };

    const scheduleNextMove = (delay: number) => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (document.hidden) {
          return;
        }
        playNextMove();
      }, delay);
    };

    const playNextMove = () => {
      if (currentIndex < movesToPlay.length) {
        const nextMove = movesToPlay[currentIndex];
        if (nextMove) {
          const dirVec = parseMoveDirection(nextMove);
          const nextState = getNextState(currentPlayerPos, currentBlockPositions, dirVec, levelConfig);

          if (nextState.action !== 'none') {
            prevPlayerPos.current = currentPlayerPos;
            prevBlockPositions.current = currentBlockPositions;

            currentPlayerPos = nextState.player;
            currentBlockPositions = nextState.blocks;
            setLastAction(nextState.action);
            setPlayerPos(currentPlayerPos);

            const trajectory = nextState.blockTrajectory?.trajectory;
            if (
              nextState.blockTrajectory &&
              trajectory?.entryPortal &&
              trajectory?.exitPortal
            ) {
              const { blockIdx, block } = nextState.blockTrajectory;
              const entryPortal = trajectory.entryPortal;
              const exitPortal = trajectory.exitPortal;
              const entryCell = { x: entryPortal.x, y: entryPortal.y };
              const exitCell = { x: exitPortal.x, y: exitPortal.y };

              const stage1Blocks = [...nextState.blocks];
              stage1Blocks[blockIdx] = { ...block, pos: entryCell, noTransition: false };
              setBlockPositions(stage1Blocks);

              const dist1 = Math.abs(block.pos.x - entryCell.x) + Math.abs(block.pos.y - entryCell.y);
              const stage1Duration = Math.max(100, dist1 * 70);

              setTimeout(() => {
                prevBlockPositions.current = prevBlockPositions.current.map((b: any, idx: number) => idx === blockIdx ? { ...b, pos: exitCell } : b);
                const stage2Blocks = [...nextState.blocks];
                stage2Blocks[blockIdx] = { ...block, pos: exitCell, noTransition: true };
                setBlockPositions(stage2Blocks);

                setTimeout(() => {
                  setBlockPositions(nextState.blocks);
                }, 50);
              }, stage1Duration);
            } else {
              setBlockPositions(currentBlockPositions);
            }
          }
        }
        currentIndex++;
        scheduleNextMove(750);
      } else {
        scheduleNextMove(2000);
        setTimeout(() => {
          currentPlayerPos = { ...levelConfig.startPos };
          currentBlockPositions = levelConfig.blocks.map((b: any) => ({ ...b, pos: { ...b.pos } }));
          prevPlayerPos.current = levelConfig.startPos;
          prevBlockPositions.current = levelConfig.blocks;
          setLastAction('reset');
          setPlayerPos(currentPlayerPos);
          setBlockPositions(currentBlockPositions);
          currentIndex = 0;
        }, 1800);
      }
    };

    const handleVisibilityChange = () => {
      if (!document.hidden && currentIndex < movesToPlay.length) {
        scheduleNextMove(300);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Initial load grace period (800ms) before first move
    scheduleNextMove(800);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [levelConfig]);
  return (
    <div className={`relative flex h-[100dvh] w-full overflow-hidden flex-col items-center justify-between gap-1 sm:gap-2 ${getThemeBgClass(activeTheme, activeThemeStyle)} px-4 py-3 sm:py-4 select-none`}>

      {/* Top Navigation Row */}
      <div className="w-full max-w-sm sm:max-w-md flex flex-row items-center justify-center gap-2 sm:gap-3 z-30 shrink-0 pt-0.5 sm:pt-1">
        <button
          onClick={(e) => requestExpandedMode(e.nativeEvent, 'campaign')}
          className="flex-1 min-w-0 flex items-center justify-center bg-slate-900/90 py-1.5 px-2 rounded-full border border-amber-400/40 shadow hover:border-amber-400/80 hover:scale-105 active:scale-95 transition-all text-amber-300 font-extrabold text-[11px] sm:text-xs tracking-wide cursor-pointer select-none"
        >
          <span className="truncate">Campaign</span>
        </button>

        <button
          onClick={(e) => requestExpandedMode(e.nativeEvent, 'puzzle-maker')}
          className="flex-1 min-w-0 flex items-center justify-center bg-slate-900/90 py-1.5 px-2 rounded-full border border-purple-400/40 shadow hover:border-purple-400/80 hover:scale-105 active:scale-95 transition-all text-purple-300 font-extrabold text-[11px] sm:text-xs tracking-wide cursor-pointer select-none"
        >
          <span className="truncate">Puzzle Maker</span>
        </button>

        <button
          onClick={(e) => requestExpandedMode(e.nativeEvent, 'shop')}
          className="flex-1 min-w-0 flex items-center justify-center bg-slate-900/90 py-1.5 px-2 rounded-full border border-emerald-400/40 shadow hover:border-emerald-400/80 hover:scale-105 active:scale-95 transition-all text-emerald-300 font-extrabold text-[11px] sm:text-xs tracking-wide cursor-pointer select-none"
        >
          <span className="truncate">Shop</span>
        </button>
      </div>

      {/* Dynamic Urgency & Streak Retention Bar */}
      <div className="w-full max-w-sm sm:max-w-md flex flex-row items-center justify-between gap-2 px-1 z-20 shrink-0 text-[10px] sm:text-[11px] font-bold">
        {/* Streak Indicator */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/85 border border-amber-500/40 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.2)]">
          <PuzzleShape shape="fire" className="w-3.5 h-3.5 text-orange-500 animate-pulse" />
          <span>
            {streak > 0
              ? isCompleted
                ? `${streak}-Day Streak • Kept burning!`
                : `${streak}-Day Streak!`
              : 'Start Your Streak!'}
          </span>
          {streak > 0 && isCompleted && (
            <svg className="w-3 h-3 text-emerald-400 inline-block ml-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>

        {/* Live Daily Countdown */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/85 border border-cyan-500/40 text-cyan-300 font-mono shadow-[0_0_12px_rgba(6,182,212,0.2)]">
          <PuzzleShape shape="pocket_watch" className="w-3.5 h-3.5 text-cyan-400" />
          <span>Next in {timeUntilNextDaily}</span>
        </div>
      </div>

      {/* Header Section (Title, Solve Status & Social Proof Leader) */}
      <div className="flex flex-col items-center shrink-0 gap-0.5 sm:gap-1 z-20">
        {dailyNumber !== null && dailyNumber > 0 && (
          <h1 className="text-center text-xl sm:text-2xl md:text-3xl font-black neon-text-title tracking-tight animate-fade-in leading-none">
            Puzzle #{dailyNumber}
          </h1>
        )}

        {/* Solve Status & Social Proof Leaderboard: Stacked on small width, single row on larger width */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-center justify-center gap-1 sm:gap-3 mt-0.5 animate-fade-in shrink-0 select-none max-w-full px-2">
          {/* Completion status & solve count */}
          <div className="flex flex-row items-center justify-center gap-2 shrink-0">
            {isCompleted && (
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] sm:text-xs font-black uppercase tracking-wider shadow-[0_0_8px_rgba(16,185,129,0.2)] animate-bounce-subtle">
                <svg className="w-3 h-3 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span>Solved</span>
              </span>
            )}
            <span className="text-[10px] sm:text-[11px] text-white/80 font-bold uppercase tracking-wide font-mono flex items-center gap-1">
              <span className={statColorClass}>{totalCompletions}</span>
              <span className={statColorClass}>/</span>
              <span className={statColorClass}>{totalStarts}</span>
              <span>Solved</span>
              {totalStarts > 0 && (
                <span className={`${statColorClass} font-normal`}>
                  ({Math.round((totalCompletions / totalStarts) * 100)}%)
                </span>
              )}
            </span>
          </div>

          {/* Bullet separator for desktop single-row view */}
          <span className="hidden sm:inline text-white/30 text-xs select-none">•</span>

          {/* Social Proof Leaderboard Teaser */}
          <div className="flex items-center justify-center gap-1 text-[10px] sm:text-[11px] shrink-0">
            {topLeader ? (
              <div className="flex items-center gap-1.5 bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 rounded-md font-mono text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.15)]">
                <PuzzleShape shape="crown" className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-extrabold text-amber-200">u/{topLeader.username}</span>
                <span className="text-amber-400/80">({topLeader.moveCount} moves • {topLeader.solveTime}s)</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 bg-slate-900/60 border border-white/10 px-2.5 py-0.5 rounded-md font-mono text-slate-400 text-[10px]">
                <PuzzleShape shape="crown" className="w-3 h-3 text-slate-400/60" />
                <span>No solutions yet — claim #1 spot!</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Game Preview Section */}
      <div className="flex-1 w-full min-h-0 flex items-center justify-center select-none px-2 overflow-visible">
        <div className="flex items-center justify-center w-full h-full max-w-full max-h-full">
          {/* Center board preview */}
          <div className="pointer-events-none shrink-0 flex justify-center items-center max-w-full max-h-full">
            {!levelConfig ? (
              <div className="flex flex-col items-center justify-center gap-3 text-cyan-400">
                <div className="w-8 h-8 border-3 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-[11px] font-mono font-bold tracking-wider text-zinc-400 uppercase">Loading Challenge...</span>
              </div>
            ) : (
              playerPos && blockPositions && (
                <ThemeBoardRenderer
                  gridSize={levelConfig.gridSize}
                  walls={levelConfig.walls}
                  destinations={levelConfig.destinations}
                  blocks={blockPositions}
                  portals={levelConfig.portals}
                  playerPos={playerPos}
                  activeTheme={activeTheme}
                  themeConfig={themeConfig}
                  isAnimated={true}
                  cellSize="var(--splash-cell-size)"
                  prevBlocks={prevBlockPositions.current}
                  prevPlayerPos={prevPlayerPos.current}
                  activeThemeStyle={activeThemeStyle}
                  lastAction={lastAction}
                  activeCharacter={activeCharacter}
                  showTrails={false}
                />
              )
            )}
          </div>
        </div>
      </div>

      {/* Bottom Action Button */}
      <div className="flex justify-center items-center shrink-0 w-full mb-1 sm:mb-2 z-20">
        <button
          className="relative flex h-11 sm:h-12 w-full max-w-xs cursor-pointer items-center justify-center gap-2.5 rounded-2xl theme-btn theme-btn-shimmer px-6 text-base sm:text-lg font-black shadow-lg hover:scale-102 active:scale-98 transition-all group"
          onClick={(e) => requestExpandedMode(e.nativeEvent, 'game')}
        >
          <span>Play This Puzzle</span>
          {isCurrentDaily && !hasClaimedDailyStartBonus && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-400/25 border border-amber-400/50 text-amber-300 text-xs font-black tracking-normal shadow-sm group-hover:bg-amber-400/40 transition-colors">
              <PuzzleShape shape="gem" className="w-3 h-3 text-cyan-300" />
              <span>+10</span>
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Splash />
  </StrictMode>
);
