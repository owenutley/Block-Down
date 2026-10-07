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
import { THEMES, DEFAULT_THEME_CONFIGS, getThemeBgClass, getBaseThemeId, ThemeId } from '../shared/themes';
import { LEVEL_CONFIGS } from './constants/levels';
import { SlideMatchInstructionsModal } from './components/SlideMatchInstructionsModal';

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

import { RelicBlock } from './components/RelicBlock';
import { RelicMilestonesModal } from './components/RelicMilestonesModal';
import { RelicModTesterDrawer } from './components/RelicModTesterDrawer';
import { calculateRelicProgress, RelicProgressState, PlayerProgressionRawData } from '../shared/relicProgress';

/**
 * Main Application Splash View: Pure showcase of The Chronolith Living Relic
 * Rendered specifically on the pinned/main application post (titled 'block-down')
 */
const MainAppSplash = ({
  activeTheme = 'neon',
  streak = 0,
}: {
  activeTheme?: ThemeId;
  streak?: number;
}) => {
  const [showMilestonesModal, setShowMilestonesModal] = useState(false);
  const [showModDrawer, setShowModDrawer] = useState(false);
  const [isMod, setIsMod] = useState(false);

  const [realUserData, setRealUserData] = useState<PlayerProgressionRawData>({
    dailyStreak: streak,
    dailyPuzzlesSolved: 0,
    campaignSolvedCount: 0,
    purchasedItemsCount: 0,
    weeklyAwardsCount: 0,
    puzzlesCreatedCount: 0,
  });

  const [relicState, setRelicState] = useState<RelicProgressState>(() =>
    calculateRelicProgress(realUserData)
  );

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const [profileStats, slideCampaign, shopStatus, authStatus] = await Promise.all([
          trpc.profile.getStats.query().catch(() => null),
          trpc.slideMatch.getCampaign.query().catch(() => null),
          trpc.shop.getStatus.query().catch(() => null),
          trpc.dev.checkAuth.query().catch(() => null),
        ]);

        if (authStatus?.isModerator) {
          setIsMod(true);
        }

        const campaignSolved = profileStats?.distinctStats?.totalPuzzlesSolved || 0;
        const slideSolved = slideCampaign?.completedIds?.length || 0;
        const slideStars = slideCampaign?.stars
          ? Object.values(slideCampaign.stars).reduce((sum, s) => sum + (typeof s === 'number' ? s : 0), 0)
          : 0;
        const userStreak = profileStats?.currentStreak ?? streak;
        const totalSolved = profileStats?.distinctStats?.totalPuzzlesSolved || 0;
        const weeklyTrophies = profileStats?.weeklyAwards?.totalAwards || 0;
        const userCreatedCount = profileStats?.puzzlesCreated || 0;

        const purchasedThemesCount = shopStatus?.purchasedThemes?.length || 1;
        const purchasedTrailsCount = shopStatus?.purchasedTrails?.length || 1;
        const purchasedCharactersCount = shopStatus?.purchasedCharacters?.length || 1;
        const purchasedItemsCount =
          Math.max(0, purchasedThemesCount - 1) +
          Math.max(0, purchasedTrailsCount - 1) +
          Math.max(0, purchasedCharactersCount - 1);

        const rawData: PlayerProgressionRawData = {
          dailyStreak: userStreak,
          dailyPuzzlesSolved: totalSolved,
          totalDailyPuzzlesCount: profileStats?.totalDailyPuzzles || 1,
          campaignSolvedCount: campaignSolved,
          purchasedItemsCount,
          weeklyAwardsCount: weeklyTrophies,
          puzzlesCreatedCount: userCreatedCount,
          totalPuzzlesSolved: totalSolved,
          slideMatchSolvedCount: slideSolved,
          slideMatchStars: slideStars,
          purchasedThemesCount,
          purchasedTrailsCount,
          purchasedCharactersCount,
        };

        setRealUserData(rawData);
        setRelicState(calculateRelicProgress(rawData));
      } catch (err) {
        console.error('Failed to load relic state for main app splash:', err);
      }
    };

    void fetchUserData();
  }, [streak]);

  const activeThemeStyle = THEMES.find((t) => t.id === activeTheme);

  return (
    <div className={`relative flex h-[100dvh] w-full overflow-hidden flex-col items-center justify-between ${getThemeBgClass(activeTheme, activeThemeStyle)} px-4 py-4 select-none font-sans text-white`}>
      {/* Background Ambient Glow FX */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      {/* Moderator Live Relic Tester Trigger Button */}
      {isMod && (
        <button
          onClick={() => setShowModDrawer((prev) => !prev)}
          className="absolute top-3 right-3 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-300 text-xs font-mono font-bold shadow-lg backdrop-blur-md cursor-pointer transition-all hover:scale-105 active:scale-95"
          title="Open Moderator Completion Simulator"
        >
          <span>⚙️</span>
          <span className="hidden sm:inline">Mod Relic Tester</span>
          <span className="sm:hidden">Tester</span>
        </button>
      )}

      {/* Top Header: Title */}
      <div className="relative z-20 flex flex-col items-center text-center mt-1">
        <h1 className="text-3xl sm:text-4xl font-black neon-text-title tracking-tight drop-shadow-md">
          Block Down
        </h1>
        <p className="text-[11px] sm:text-xs text-zinc-400 font-mono tracking-widest uppercase mt-0.5">
          The Living Chronolith
        </p>
      </div>

      {/* Centerpiece: The Chronolith 3D Living Relic Block */}
      <div className="relative z-10 flex flex-col items-center justify-center my-auto scale-95 sm:scale-105 transition-transform animate-fadeIn">
        <RelicBlock
          progressState={relicState}
          activeTheme={activeTheme}
          onInspectMilestones={() => setShowMilestonesModal(true)}
          size={240}
        />
      </div>

      {/* Bottom Action Section: Open Menu Button */}
      <div className="relative z-20 flex flex-col items-center gap-2 w-full max-w-xs mb-2">
        <button
          onClick={(e) => requestExpandedMode(e.nativeEvent, 'menu')}
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 active:scale-98 text-white font-black text-sm uppercase tracking-wider transition-all shadow-[0_0_25px_rgba(99,102,241,0.4)] border border-cyan-400/60 flex items-center justify-between group cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <span className="text-lg leading-none font-bold">≡</span>
            <span className="text-left font-black tracking-wide">Open Game Menu</span>
          </div>
          <span className="text-xs font-mono font-bold text-cyan-200 bg-white/10 px-2.5 py-1 rounded-lg group-hover:translate-x-0.5 transition-transform">
            Play &rarr;
          </span>
        </button>
      </div>

      {/* Milestones Inspector Modal */}
      {showMilestonesModal && (
        <RelicMilestonesModal
          progressState={relicState}
          activeTheme={activeTheme}
          onClose={() => setShowMilestonesModal(false)}
        />
      )}

      {/* Moderator Relic Simulator Side Drawer */}
      {isMod && showModDrawer && (
        <RelicModTesterDrawer
          currentProgressState={relicState}
          realData={realUserData}
          onApplyProgressState={(simState) => setRelicState(simState)}
          onResetToReal={() => setRelicState(calculateRelicProgress(realUserData))}
          onClose={() => setShowModDrawer(false)}
        />
      )}
    </div>
  );
};

const SlideMatchSplash = ({ activeTheme }: { activeTheme: ThemeId }) => {
  const [showInstructions, setShowInstructions] = useState(false);
  const activeThemeStyle = THEMES.find((t) => t.id === activeTheme);
  const bgClass = getThemeBgClass(activeTheme, activeThemeStyle);

  return (
    <div
      className={`relative flex h-[100dvh] w-full overflow-hidden flex-col items-center justify-between ${bgClass} px-4 py-4 select-none font-sans text-white`}
    >
      {/* Background Ambient Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 bg-cyan-500/15 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl" />
      </div>

      {/* Top Header */}
      <div className="relative z-20 flex flex-col items-center text-center mt-1">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 font-mono text-[10px] sm:text-xs uppercase font-bold tracking-wider mb-1 shadow-sm">
          <span>⚡</span>
          <span>Endless Speed Runner</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black neon-text-title tracking-tight drop-shadow-md">
          Slide Match
        </h1>
        <p className="text-[11px] sm:text-xs text-zinc-400 font-mono tracking-widest uppercase mt-0.5">
          30-Second Speed Rush
        </p>
      </div>

      {/* Visual Animated Preview Card */}
      <div className="relative z-10 flex flex-col items-center justify-center my-auto p-4 bg-slate-900/80 backdrop-blur-md rounded-3xl border border-cyan-500/40 shadow-[0_0_35px_rgba(6,182,212,0.25)] max-w-xs w-full text-center space-y-3">
        <div className="flex items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-2xl animate-pulse">
            🧊
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/50 flex items-center justify-center text-2xl animate-bounce">
            ⚡
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-400/50 flex items-center justify-center text-2xl animate-pulse">
            🎯
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-sm font-black text-white uppercase tracking-wide">
            How far can you slide?
          </div>
          <p className="text-[11px] text-gray-300 leading-relaxed font-sans">
            Solve procedural sliding block puzzles before the <strong>30-second clock</strong> expires. Earn Shards for every stage cleared!
          </p>
        </div>
      </div>

      {/* Bottom Action Section */}
      <div className="relative z-20 flex flex-col items-center gap-2 w-full max-w-xs mb-2">
        <button
          onClick={(e) => requestExpandedMode(e.nativeEvent, 'slide-match')}
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 active:scale-98 text-white font-black text-sm uppercase tracking-wider transition-all shadow-[0_0_25px_rgba(99,102,241,0.4)] border border-cyan-400/60 flex items-center justify-between group cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <span className="text-lg leading-none font-bold">⚡</span>
            <span className="text-left font-black tracking-wide">Play Speed Runner</span>
          </div>
          <span className="text-xs font-mono font-bold text-cyan-200 bg-white/10 px-2.5 py-1 rounded-lg group-hover:translate-x-0.5 transition-transform">
            Start &rarr;
          </span>
        </button>

        <button
          onClick={() => setShowInstructions(true)}
          className="text-xs text-cyan-300/80 hover:text-cyan-200 underline font-mono cursor-pointer pt-1"
        >
          How to Move &amp; Play &rarr;
        </button>
      </div>

      {/* Instructions Modal */}
      <SlideMatchInstructionsModal
        isOpen={showInstructions}
        onClose={() => setShowInstructions(false)}
      />
    </div>
  );
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
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [totalCompletions, setTotalCompletions] = useState<number>(0);
  const [totalStarts, setTotalStarts] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [topLeader, setTopLeader] = useState<{ username: string; moveCount: number; solveTime: number } | null>(null);
  const [isCurrentDaily, setIsCurrentDaily] = useState<boolean>(false);
  const [hasClaimedDailyStartBonus, setHasClaimedDailyStartBonus] = useState<boolean>(false);
  const [isMainAppPost, setIsMainAppPost] = useState<boolean>(false);
  const [isSlideMatchPost, setIsSlideMatchPost] = useState<boolean>(false);
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

      try {
        // Fetch puzzle and currency with a 6-second timeout safeguard so stalled proxies never freeze the splash page
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Splash fetch timeout')), 6000)
        );

        const fetchPromise = Promise.all([
          trpc.puzzle.getForPost.query(),
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
          if (postPuzzle.isMainAppPost !== undefined) {
            setIsMainAppPost(postPuzzle.isMainAppPost);
          }
          if (postPuzzle.isSlideMatchPost !== undefined) {
            setIsSlideMatchPost(postPuzzle.isSlideMatchPost);
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
  }, []);

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
  }, [levelConfig]);  // If viewing the Main Application Splash Post (titled 'block-down')
  if (isMainAppPost) {
    return <MainAppSplash activeTheme={activeTheme} streak={streak} />;
  }

  // If viewing the Slide Match Endless Runner Splash Post
  if (isSlideMatchPost) {
    return <SlideMatchSplash activeTheme={activeTheme} />;
  }

  return (
    <div className={`relative flex h-[100dvh] w-full overflow-hidden flex-col items-center justify-between gap-1 sm:gap-2 ${getThemeBgClass(activeTheme, activeThemeStyle)} px-4 py-3 sm:py-4 select-none`}>
      {/* Header Section */}
      <div className="w-full flex flex-col items-center gap-1.5 shrink-0 z-20">
        {/* Mobile Header Row */}
        <div className="sm:hidden w-full max-w-sm flex flex-col items-center gap-1.5 z-30 shrink-0 pt-0.5">
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
            <h1 className="text-center text-xl font-black neon-text-title tracking-tight animate-fade-in leading-none truncate max-w-[280px]">
              {dailyNumber !== null && dailyNumber > 0 ? `Puzzle #${dailyNumber}` : (levelConfig?.name || 'Custom Puzzle')}
            </h1>

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

            {/* Live Daily Countdown */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/85 border border-cyan-500/40 text-cyan-300 font-mono shadow-[0_0_12px_rgba(6,182,212,0.2)] text-xs font-bold shrink-0">
              <PuzzleShape shape="pocket_watch" className="w-3.5 h-3.5 text-cyan-400" />
              <span>Next in {timeUntilNextDaily}</span>
            </div>
          </div>

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
                  <PuzzleShape shape="crown" className="w-3.5 h-3.5 text-slate-400/60 shrink-0" />
                  <span>Claim #1 spot!</span>
                </div>
              )}
            </div>

            <span className="text-white/30 text-xs select-none shrink-0">•</span>

            <h1 className="text-base sm:text-lg md:text-xl font-black neon-text-title tracking-tight leading-none shrink-0 truncate max-w-xs">
              {dailyNumber !== null && dailyNumber > 0 ? `Puzzle #${dailyNumber}` : (levelConfig?.name || 'Custom Puzzle')}
            </h1>

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
        </div>
      </div>

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
    </div>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Splash />
  </StrictMode>
);
