/* eslint-disable @typescript-eslint/no-explicit-any */
import './index.css';

import { requestExpandedMode } from '@devvit/web/client';
import { StrictMode, useEffect, useState, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { trpc } from './trpc';
import { trackClientEvent } from './utils/analytics';
import { convertPuzzleToLevelConfig, getNextPosWithPortalsDetails, dirToVector } from './utils/puzzle';
import { ThemeBoardRenderer } from './components/ThemeBoardRenderer';
import { PuzzleShape } from './components/PuzzleShape';
import { THEMES, DEFAULT_THEME_CONFIGS, getThemeBgClass, getBaseThemeId } from '../shared/themes';
import { LEVEL_CONFIGS } from './constants/levels';
import { cn } from './utils';

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

/**
 * Segmented Navigation Tab Component with Clear Active Highlighting
 */
const SplashTabs = ({
  activeTab,
  onSelectTab,
}: {
  activeTab: 'daily' | 'menu';
  onSelectTab: (tab: 'daily' | 'menu') => void;
}) => (
  <div className="flex items-center bg-slate-900/90 border border-white/15 rounded-full p-1 shadow-lg backdrop-blur-md shrink-0">
    <button
      onClick={() => onSelectTab('daily')}
      className={cn(
        'px-3.5 sm:px-4 py-1.5 rounded-full text-xs transition-all cursor-pointer flex items-center justify-center select-none font-sans',
        activeTab === 'daily'
          ? 'bg-cyan-500/25 text-white border border-cyan-400 font-black shadow-[0_0_12px_rgba(6,182,212,0.4)]'
          : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent font-semibold'
      )}
    >
      <span>Daily Puzzle</span>
    </button>
    <div className="w-[1px] h-3.5 bg-white/20 mx-0.5" />
    <button
      onClick={() => onSelectTab('menu')}
      className={cn(
        'px-3.5 sm:px-4 py-1.5 rounded-full text-xs transition-all cursor-pointer flex items-center justify-center select-none font-sans',
        activeTab === 'menu'
          ? 'bg-cyan-500/25 text-white border border-cyan-400 font-black shadow-[0_0_12px_rgba(6,182,212,0.4)]'
          : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent font-semibold'
      )}
    >
      <span>Menu</span>
    </button>
  </div>
);

/**
 * Splash Menu View: Inline game directory and Full Menu launcher
 */
const SplashMenuView = () => {
  return (
    <div className="flex-1 w-full max-w-xl mx-auto flex flex-col justify-center items-center gap-2 px-2 py-1 select-none animate-fade-in font-sans">
      {/* Hero Action Button: Open Full Game Menu */}
      <button
        onClick={(e) => requestExpandedMode(e.nativeEvent, 'menu')}
        className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 active:scale-98 text-white font-black text-xs sm:text-sm uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(99,102,241,0.35)] border border-cyan-400/50 flex items-center justify-between group cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center font-bold text-xs">
            &rarr;
          </div>
          <span className="text-left font-black tracking-wide">Open Full Game Menu</span>
        </div>
        <span className="text-[10px] sm:text-xs font-bold font-mono text-cyan-200 bg-white/10 px-2 py-0.5 rounded-md">
          Expanded View &rarr;
        </span>
      </button>

      {/* Grid of Quick Navigation Cards (No Emojis) */}
      <div className="grid grid-cols-2 gap-2 w-full">
        {/* 1. Daily Puzzle */}
        <button
          onClick={(e) => requestExpandedMode(e.nativeEvent, 'game')}
          className="p-2 sm:p-2.5 rounded-xl bg-slate-900/85 hover:bg-slate-800 border border-blue-500/30 hover:border-blue-400 text-left transition-all active:scale-98 group cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-400 group-hover:text-blue-300">Daily Puzzle</span>
            <span className="text-[10px] text-slate-500 font-mono">Today</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5 truncate">Featured daily challenge</p>
        </button>

        {/* 2. Weekly Challenge */}
        <button
          onClick={(e) => requestExpandedMode(e.nativeEvent, 'weekly')}
          className="p-2 sm:p-2.5 rounded-xl bg-slate-900/85 hover:bg-slate-800 border border-amber-500/30 hover:border-amber-400 text-left transition-all active:scale-98 group cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 group-hover:text-amber-300">Weekly Challenge</span>
            <span className="text-[10px] text-amber-500/80 font-mono font-bold">500 Shards</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5 truncate">Master architect circuit</p>
        </button>

        {/* 3. Campaign */}
        <button
          onClick={(e) => requestExpandedMode(e.nativeEvent, 'campaign')}
          className="p-2 sm:p-2.5 rounded-xl bg-slate-900/85 hover:bg-slate-800 border border-yellow-500/30 hover:border-yellow-400 text-left transition-all active:scale-98 group cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-yellow-400 group-hover:text-yellow-300">Campaign Mode</span>
            <span className="text-[10px] text-slate-500 font-mono">Stages</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5 truncate">Tiered difficulty levels</p>
        </button>

        {/* 4. Community Stages */}
        <button
          onClick={(e) => requestExpandedMode(e.nativeEvent, 'community')}
          className="p-2 sm:p-2.5 rounded-xl bg-slate-900/85 hover:bg-slate-800 border border-red-500/30 hover:border-red-400 text-left transition-all active:scale-98 group cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-red-400 group-hover:text-red-300">Community</span>
            <span className="text-[10px] text-slate-500 font-mono">Custom</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5 truncate">Player-crafted puzzles</p>
        </button>

        {/* 5. Puzzle Maker */}
        <button
          onClick={(e) => requestExpandedMode(e.nativeEvent, 'puzzle-maker')}
          className="p-2 sm:p-2.5 rounded-xl bg-slate-900/85 hover:bg-slate-800 border border-purple-500/30 hover:border-purple-400 text-left transition-all active:scale-98 group cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-400 group-hover:text-purple-300">Puzzle Maker</span>
            <span className="text-[10px] text-slate-500 font-mono">Editor</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5 truncate">Build & publish levels</p>
        </button>

        {/* 6. Cosmetic Shop */}
        <button
          onClick={(e) => requestExpandedMode(e.nativeEvent, 'shop')}
          className="p-2 sm:p-2.5 rounded-xl bg-slate-900/85 hover:bg-slate-800 border border-emerald-500/30 hover:border-emerald-400 text-left transition-all active:scale-98 group cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 group-hover:text-emerald-300">Shop</span>
            <span className="text-[10px] text-emerald-400 font-mono">Cosmetics</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5 truncate">Themes, bots & trails</p>
        </button>

        {/* 7. Player Profile (span across 2 columns) */}
        <button
          onClick={(e) => requestExpandedMode(e.nativeEvent, 'profile')}
          className="col-span-2 p-2 sm:p-2.5 rounded-xl bg-slate-900/85 hover:bg-slate-800 border border-orange-500/30 hover:border-orange-400 text-left transition-all active:scale-98 group cursor-pointer flex items-center justify-between"
        >
          <div>
            <span className="text-xs font-bold text-orange-400 group-hover:text-orange-300">User Profile & Stats</span>
            <p className="text-[10px] text-slate-400 mt-0.5">Streaks, trophies, and distinct performance metrics</p>
          </div>
          <div className="text-xs text-slate-500 font-mono pr-1">&rarr;</div>
        </button>
      </div>
    </div>
  );
};

export const Splash = () => {
  const [activeTab, setActiveTab] = useState<'daily' | 'menu'>('daily');
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
      trackClientEvent('screen_view_daily');
      if (selectedNumber !== null && loadedNumberRef.current === selectedNumber) {
        return;
      }

      try {
        const queryInput = selectedNumber !== null ? { dailyNumber: selectedNumber } : undefined;

        // Fetch puzzle and currency with a 6-second timeout safeguard so stalled proxies never freeze the splash page
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Splash fetch timeout')), 6000)
        );

        const fetchPromise = Promise.all([
          trpc.puzzle.getForPost.query(queryInput),
          currency === null ? trpc.currency.get.query().catch(() => null) : Promise.resolve(null),
        ]);

        const [postPuzzle, currencyRes] = await Promise.race([
          fetchPromise,
          timeoutPromise,
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
            const converted = convertPuzzleToLevelConfig(postPuzzle.puzzle);
            setLevelConfig(converted);
            setPlayerPos(converted.startPos);
            setBlockPositions(converted.blocks);
            prevPlayerPos.current = converted.startPos;
            prevBlockPositions.current = converted.blocks;
            return;
          }
        }
      } catch (e) {
        console.error('Failed to load puzzle for splash, using fallback level:', e);
      }

      // Safe static fallback
      const fallback = LEVEL_CONFIGS.daily;
      setLevelConfig(fallback);
      setPlayerPos(fallback.startPos);
      setBlockPositions(fallback.blocks);
      prevPlayerPos.current = fallback.startPos;
      prevBlockPositions.current = fallback.blocks;
    };

    void fetchSplash();
  }, [selectedNumber]);

  // Solver playback simulation loop
  useEffect(() => {
    if (!levelConfig) return;

    let currentIndex = 0;
    let timeoutId: any = null;

    const splashLimit = typeof levelConfig.splashMovesCount === 'number' && levelConfig.splashMovesCount >= 0
      ? levelConfig.splashMovesCount
      : 3;
    const movesToPlay = (levelConfig.moves || []).slice(0, splashLimit);

    if (movesToPlay.length === 0) return;

    const scheduleNextMove = (delay: number) => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (document.hidden) return;

        if (currentIndex >= movesToPlay.length) {
          setLastAction('reset');
          setPlayerPos(levelConfig.startPos);
          setBlockPositions(levelConfig.blocks);
          prevPlayerPos.current = levelConfig.startPos;
          prevBlockPositions.current = levelConfig.blocks;
          currentIndex = 0;
          scheduleNextMove(2500); // Pause before replaying
          return;
        }

        const move = movesToPlay[currentIndex];
        const dir = dirToVector(move);

        setPlayerPos((currentP: any) => {
          setBlockPositions((currentB: any) => {
            const next = getNextState(currentP, currentB, dir, levelConfig);
            prevPlayerPos.current = currentP;
            prevBlockPositions.current = currentB;
            if (next.action !== 'none') {
              setLastAction(next.action);
            }
            return next.blocks;
          });
          return getNextState(currentP, blockPositions, dir, levelConfig).player;
        });

        currentIndex++;
        scheduleNextMove(650);
      }, delay);
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

      {/* Header Section with Highlighted Tabs */}
      <div className="w-full flex flex-col items-center gap-1.5 shrink-0 z-20">
        {/* Mobile Header Row */}
        <div className="sm:hidden w-full max-w-sm flex flex-col items-center gap-1.5 z-30 shrink-0 pt-0.5">
          {/* Top Segmented Tabs */}
          <SplashTabs activeTab={activeTab} onSelectTab={setActiveTab} />

          {activeTab === 'daily' && (
            <>
              {/* Dynamic Urgency & Streak Retention Bar */}
              <div className="w-full flex flex-row items-center justify-between gap-2 px-1 z-20 shrink-0 text-[10px] font-bold">
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

              {/* Title & Stats */}
              <div className="flex flex-col items-center shrink-0 gap-0.5 z-20">
                {dailyNumber !== null && dailyNumber > 0 && (
                  <h1 className="text-center text-xl font-black neon-text-title tracking-tight animate-fade-in leading-none">
                    Puzzle #{dailyNumber}
                  </h1>
                )}

                <div className="flex flex-row items-center justify-center gap-2 mt-0.5 animate-fade-in shrink-0 select-none max-w-full px-2">
                  {isCompleted && (
                    <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-black uppercase tracking-wider shadow-[0_0_8px_rgba(16,185,129,0.2)] animate-bounce-subtle">
                      <svg className="w-3 h-3 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Solved</span>
                    </span>
                  )}
                  <span className="text-[10px] text-white/80 font-bold uppercase tracking-wide font-mono flex items-center gap-1">
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

                {/* Social Proof Leaderboard */}
                <div className="flex items-center justify-center gap-1 text-[10px] shrink-0 mt-0.5">
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
            </>
          )}
        </div>

        {/* Desktop / Tablet Header */}
        <div className="hidden sm:flex flex-col items-center gap-2.5 w-full max-w-2xl px-2 z-20 shrink-0">
          <div className="w-full flex items-center justify-between gap-3 pt-1">
            {/* Streak Indicator */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/85 border border-amber-500/40 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.2)] text-xs font-bold shrink-0">
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

            {/* Segmented Splash Tabs */}
            <SplashTabs activeTab={activeTab} onSelectTab={setActiveTab} />

            {/* Live Daily Countdown */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/85 border border-cyan-500/40 text-cyan-300 font-mono shadow-[0_0_12px_rgba(6,182,212,0.2)] text-xs font-bold shrink-0">
              <PuzzleShape shape="pocket_watch" className="w-3.5 h-3.5 text-cyan-400" />
              <span>Next in {timeUntilNextDaily}</span>
            </div>
          </div>

          {activeTab === 'daily' && (
            <div className="flex items-center justify-center gap-2 sm:gap-2.5 animate-fade-in shrink-0 select-none w-full max-w-2xl px-2 py-1 whitespace-nowrap overflow-visible">
              {/* Left: Top Leader */}
              <div className="flex items-center gap-1 text-[11px] sm:text-xs shrink-0">
                {topLeader ? (
                  <div className="flex items-center gap-1.5 bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 rounded-md font-mono text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.15)]">
                    <PuzzleShape shape="crown" className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="font-extrabold text-amber-200 truncate max-w-[90px] sm:max-w-[130px]">u/{topLeader.username}</span>
                    <span className="text-amber-400/80 shrink-0">({topLeader.moveCount}m • {topLeader.solveTime}s)</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 bg-slate-900/60 border border-white/10 px-2.5 py-0.5 rounded-md font-mono text-slate-400 text-[11px]">
                    <PuzzleShape shape="crown" className="w-3 h-3 text-slate-400/60 shrink-0" />
                    <span>Claim #1 spot!</span>
                  </div>
                )}
              </div>

              {dailyNumber !== null && dailyNumber > 0 && (
                <span className="text-white/30 text-xs select-none shrink-0">•</span>
              )}

              {dailyNumber !== null && dailyNumber > 0 && (
                <h1 className="text-base sm:text-lg md:text-xl font-black neon-text-title tracking-tight leading-none shrink-0">
                  Puzzle #{dailyNumber}
                </h1>
              )}

              <span className="text-white/30 text-xs select-none shrink-0">•</span>

              {/* Right: Solve Status */}
              <div className="flex items-center gap-1.5 shrink-0 text-[11px] sm:text-xs">
                {isCompleted && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-black uppercase tracking-wider shadow-[0_0_8px_rgba(16,185,129,0.2)] animate-bounce-subtle shrink-0">
                    <svg className="w-2.5 h-2.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Solved</span>
                  </span>
                )}
                <span className="text-white/80 font-bold uppercase tracking-wide font-mono flex items-center gap-1 shrink-0">
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
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area: Daily Board Preview vs Splash Menu */}
      {activeTab === 'menu' ? (
        <SplashMenuView />
      ) : (
        <>
          {/* Game Preview Section */}
          <div className="flex-1 w-full min-h-0 flex items-center justify-center select-none px-2 overflow-visible">
            <div className="flex items-center justify-center w-full h-full max-w-full max-h-full">
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
              <span>{isCompleted ? 'Play Again' : 'Play This Puzzle'}</span>
              {isCurrentDaily && !hasClaimedDailyStartBonus && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-400/25 border border-amber-400/50 text-amber-300 text-xs font-black tracking-normal shadow-sm group-hover:bg-amber-400/40 transition-colors">
                  <PuzzleShape shape="gem" className="w-3 h-3 text-cyan-300" />
                  <span>+10</span>
                </span>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Splash />
  </StrictMode>
);
