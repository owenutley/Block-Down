/* eslint-disable @typescript-eslint/no-explicit-any */
import './index.css';

import { safeRequestExpandedMode } from './utils/navigation';
import { StrictMode, useEffect, useState, useRef, useMemo, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { trpc } from './trpc';
import { trackClientEvent } from './utils/analytics';
import { convertPuzzleToLevelConfig, getNextPosWithPortalsDetails, dirToVector, colorToBlockType } from './utils/puzzle';
import { ThemeBoardRenderer, THEME_STYLES, getWallStyle, getDestinationStyle } from './components/ThemeBoardRenderer';
import { computeWallNeighbors, computeWallCornerRadii } from './utils/wallAutotiling';
import { HexagonBlock } from './components/HexagonBlock';
import { LichtenbergBookCanvas } from './components/LichtenbergBook/LichtenbergBookCanvas';
import { LichtenbergProgressCard } from './components/LichtenbergBook/LichtenbergProgressCard';
import { DevConstellationSlider } from './components/LichtenbergBook/DevConstellationSlider';
import {
  calculateBookProgressState,
  BookProgressState,
  BookPointActivity,
  DEFAULT_BOOK_ACTIVITIES,
  NODE_CUMULATIVE_THRESHOLDS,
  TOTAL_BOOK_NODES,
} from '../shared/lichtenbergProgress';
import { THEMES, DEFAULT_THEME_CONFIGS, getThemeBgClass, getBaseThemeId, ThemeId, ThemeConfig, BaseThemeId } from '../shared/themes';
import { LEVEL_CONFIGS } from './constants/levels';
import { SlideMatchInstructionsModal } from './components/SlideMatchInstructionsModal';
import { SurveySplash } from './components/SurveySplash';
import { ShardIcon } from './components/ShardIcon';
import { SlideMatchPuzzle, DailyTier, DailyTierInfo } from '../shared/types';
import { calculateBlockSlide, solveSlideMatch } from '../shared/slideMatch';
import { SplashLoader } from './components/SplashLoader';
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

const buttonBlocks: Record<
  'daily' | 'slide-match' | 'weekly' | 'campaign' | 'community' | 'shop' | 'puzzle-maker' | 'profile',
  { type: keyof ThemeConfig; colorClass: string; neonClass: string; textClass: string; bgClass: string; borderClass: string }
> = {
  daily: {
    type: 'blue-diamond',
    colorClass: 'border-blue-500 bg-blue-500/10',
    neonClass: 'shadow-[0_0_15px_rgba(59,130,246,0.6)] neon-blue',
    textClass: 'text-blue-400',
    bgClass: 'bg-blue-950/30',
    borderClass: 'border-blue-500/60 hover:border-blue-400',
  },
  'slide-match': {
    type: 'purple-circle',
    colorClass: 'border-fuchsia-500 bg-fuchsia-500/10',
    neonClass: 'shadow-[0_0_15px_rgba(217,70,239,0.6)] neon-purple',
    textClass: 'text-fuchsia-400',
    bgClass: 'bg-fuchsia-950/30',
    borderClass: 'border-fuchsia-500/60 hover:border-fuchsia-400',
  },
  weekly: {
    type: 'green-cross',
    colorClass: 'border-emerald-500 bg-emerald-500/10',
    neonClass: 'shadow-[0_0_15px_rgba(16,185,129,0.6)] neon-green',
    textClass: 'text-emerald-400',
    bgClass: 'bg-emerald-950/30',
    borderClass: 'border-emerald-500/60 hover:border-emerald-400',
  },
  campaign: {
    type: 'yellow-crescent',
    colorClass: 'border-yellow-400 bg-yellow-400/10',
    neonClass: 'shadow-[0_0_15px_rgba(250,204,21,0.6)] neon-yellow',
    textClass: 'text-yellow-400',
    bgClass: 'bg-yellow-950/30',
    borderClass: 'border-yellow-500/60 hover:border-yellow-400',
  },
  community: {
    type: 'red-heart',
    colorClass: 'border-red-500 bg-red-500/10',
    neonClass: 'shadow-[0_0_15px_rgba(239,68,68,0.6)] neon-red',
    textClass: 'text-red-400',
    bgClass: 'bg-red-950/30',
    borderClass: 'border-red-500/60 hover:border-red-400',
  },
  shop: {
    type: 'green-cross',
    colorClass: 'border-green-500 bg-green-500/10',
    neonClass: 'shadow-[0_0_15px_rgba(34,197,94,0.6)] neon-green',
    textClass: 'text-green-400',
    bgClass: 'bg-green-950/30',
    borderClass: 'border-green-500/60 hover:border-green-400',
  },
  'puzzle-maker': {
    type: 'purple-circle',
    colorClass: 'border-purple-500 bg-purple-500/10',
    neonClass: 'shadow-[0_0_15px_rgba(168,85,247,0.6)] neon-purple',
    textClass: 'text-purple-400',
    bgClass: 'bg-purple-950/30',
    borderClass: 'border-purple-500/60 hover:border-purple-400',
  },
  profile: {
    type: 'orange-square',
    colorClass: 'border-orange-500 bg-orange-500/10',
    neonClass: 'shadow-[0_0_15px_rgba(249,115,22,0.6)] neon-orange',
    textClass: 'text-orange-400',
    bgClass: 'bg-orange-950/30',
    borderClass: 'border-orange-500/60 hover:border-orange-400',
  },
};

/**
 * Main Application Splash View: Pure showcase of The Lichtenberg Codex of Fractured Light
 * Rendered specifically on the pinned/main application post (titled 'block-down')
 */
const MainAppSplash = ({
  activeTheme = 'neon',
  streak: _streak = 0,
  onLaunch,
}: {
  activeTheme?: ThemeId;
  streak?: number;
  onLaunch?: (target: string | null) => void;
}) => {
  const [showDevSlider, setShowDevSlider] = useState(true);
  const [isMod, setIsMod] = useState(false);
  const [forceFullDisplay, setForceFullDisplay] = useState(false);
  const [simulatedPoints, setSimulatedPoints] = useState<number | null>(null);
  const [simulatedActivities, setSimulatedActivities] = useState<BookPointActivity[] | null>(null);

  const [bookProgress, setBookProgress] = useState<BookProgressState>(() =>
    calculateBookProgressState(0)
  );


  useEffect(() => {
    let isSubscribed = true;
    const load = async () => {
      try {
        const [progressData, authStatus] = await Promise.all([
          trpc.book.getProgress.query().catch(() => null),
          trpc.dev.checkAuth.query().catch(() => null),
        ]);

        if (!isSubscribed) return;
        if (authStatus?.isModerator) {
          setIsMod(true);
        }
        if (progressData) {
          setBookProgress(progressData);
        }
      } catch (err) {
        console.error('Failed to load book progress:', err);
      }
    };
    void load();

    return () => {
      isSubscribed = false;
    };
  }, []);

  const activeThemeStyle = THEMES.find((t) => t.id === activeTheme);

  const activeActivities = simulatedActivities ?? bookProgress.activities ?? DEFAULT_BOOK_ACTIVITIES.map((a) => ({ ...a }));

  // Active state (either simulated via dev drawer or real from DB)
  const effectivePoints = simulatedPoints !== null ? simulatedPoints : bookProgress.totalPoints;
  const activeState = (simulatedPoints !== null || simulatedActivities !== null)
    ? calculateBookProgressState(effectivePoints, activeActivities)
    : bookProgress;

  return (
    <div className={`relative flex h-[100dvh] max-h-[100dvh] w-full overflow-hidden flex-col items-center justify-between ${getThemeBgClass(activeTheme, activeThemeStyle)} px-3 sm:px-4 py-2 sm:py-3 select-none font-sans text-white`}>
      {/* Background Ambient Glow FX */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-80 h-80 bg-amber-700/10 rounded-full blur-3xl" />
      </div>

      {/* Top Header Bar & Dev / Mod Controls */}
      <div className="relative z-20 w-full flex items-center justify-between max-w-md shrink-0 pt-0.5">
        <div className="flex flex-col text-left">
          <h1 className="text-lg sm:text-xl font-black neon-text-title tracking-tight drop-shadow-md">
            Block Down
          </h1>
          <p className="text-[10px] text-amber-300/80 font-mono tracking-widest uppercase">
            Bronze Constellation
          </p>
        </div>

        {/* Developer / Moderator Toggles */}
        {isMod && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setForceFullDisplay((prev) => !prev)}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-mono font-bold transition-all cursor-pointer shadow-md backdrop-blur-md ${
                forceFullDisplay
                  ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                  : 'bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/40 text-amber-300'
              }`}
              title="Toggle Full 50-Node Book Display"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span>{forceFullDisplay ? 'Exit Full' : 'Preview Full'}</span>
            </button>

            <button
              onClick={() => setShowDevSlider((prev) => !prev)}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-mono font-bold transition-all cursor-pointer shadow-md backdrop-blur-md ${
                showDevSlider
                  ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                  : 'bg-slate-800/80 hover:bg-slate-700 border-slate-600 text-slate-300'
              }`}
              title="Toggle Dev Node Slider on right of screen"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              <span>{showDevSlider ? 'Hide Slider' : 'Dev Slider'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Centerpiece: The Celestial Constellation Book Canvas (Flexes to fill remaining space perfectly) */}
      <div className="relative z-10 flex-1 min-h-0 w-full flex items-center justify-center my-auto animate-fadeIn px-1">
        <LichtenbergBookCanvas
          unlockedNodeCount={activeState.unlockedNodeCount}
          totalPoints={effectivePoints}
          forceFullDisplay={forceFullDisplay}
          className="w-full h-full max-h-[340px] sm:max-h-[380px] max-w-[460px] aspect-[400/280]"
        />
      </div>

      {/* Bottom Section: HUD Progress Card & Open Game Menu */}
      <div className="relative z-20 flex flex-col items-center gap-1.5 w-full max-w-md shrink-0">
        <LichtenbergProgressCard
          progress={activeState}
          forceFullDisplay={forceFullDisplay}
        />

        <button
          onClick={(e) => {
            onLaunch?.('Game Menu');
            const ok = safeRequestExpandedMode(e, 'menu');
            if (!ok) onLaunch?.(null);
          }}
          className="w-full py-2.5 sm:py-3 px-5 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 active:scale-98 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(245,158,11,0.35)] border border-amber-300/80 flex items-center justify-between group cursor-pointer"
        >
          <span className="text-left font-black tracking-wide text-slate-950">Open Game Menu</span>
          <span className="text-[11px] font-mono font-bold text-slate-950 bg-amber-300/70 px-2 py-0.5 rounded-md group-hover:translate-x-0.5 transition-transform">
            Play &rarr;
          </span>
        </button>
      </div>

      {/* Dev / Moderator Vertical Slide Bar (Docked off to the right) */}
      {isMod && showDevSlider && (
        <div className="absolute right-1 sm:right-3 top-1/2 -translate-y-1/2 z-40">
          <DevConstellationSlider
            currentNode={activeState.unlockedNodeCount}
            totalNodes={TOTAL_BOOK_NODES}
            realNode={bookProgress.unlockedNodeCount}
            isSimulated={simulatedPoints !== null}
            onNodeChange={(node) => {
              const targetPoints = NODE_CUMULATIVE_THRESHOLDS[node] ?? 0;
              setSimulatedPoints(targetPoints);
            }}
            onReset={() => {
              setSimulatedPoints(null);
              setSimulatedActivities(null);
            }}
            onClose={() => setShowDevSlider(false)}
          />
        </div>
      )}
    </div>
  );
};

/**
 * Splash Menu View: Interactive game mode hub matching Menu.tsx styling (No Chronolith)
 */
const SplashMenu = ({
  activeTheme = 'neon',
  topSlot,
  currency = 0,
  onLaunch,
}: {
  activeTheme?: ThemeId;
  topSlot?: ReactNode;
  currency?: number | null;
  onLaunch?: (target: string | null) => void;
}) => {
  const activeThemeStyle = THEMES.find((t) => t.id === activeTheme);
  const baseTheme = getBaseThemeId(activeTheme);
  const config = DEFAULT_THEME_CONFIGS[baseTheme] || DEFAULT_THEME_CONFIGS.neon;

  const modeButtons = [
    {
      id: 'slide-match' as const,
      label: 'Slide Match',
      sub: '30s Speed Runner',
      dest: 'slide-match',
    },
    {
      id: 'weekly' as const,
      label: 'Weekly Challenge',
      sub: '500 Light Whisp Contest',
      dest: 'weekly',
    },
    {
      id: 'campaign' as const,
      label: 'Campaign Mode',
      sub: 'Progression Tiers',
      dest: 'campaign',
    },
    {
      id: 'community' as const,
      label: 'Community Stages',
      sub: 'Player Levels',
      dest: 'community',
    },
  ];

  return (
    <div
      className={`relative flex h-[100dvh] w-full overflow-hidden flex-col items-center justify-between ${getThemeBgClass(
        activeTheme,
        activeThemeStyle
      )} px-4 py-2 sm:py-3 select-none font-sans text-white`}
    >
      {/* Background Ambient Glow FX */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      {/* Top Header & Tab Navigation */}
      <div className="relative z-20 flex flex-col items-center text-center mt-0.5 sm:mt-1 w-full max-w-sm gap-1 shrink-0">
        {topSlot}
        <h1 className="text-xl sm:text-2xl font-black neon-text-title tracking-tight drop-shadow-md">
          Block Down
        </h1>
        <p className="text-[10px] sm:text-xs text-zinc-400 font-mono tracking-widest uppercase -mt-0.5">
          Select Game Mode
        </p>
      </div>

      {/* Mode Selection Cards */}
      <div className="relative z-10 flex flex-col items-center justify-center gap-2 w-full max-w-sm my-auto animate-fadeIn">
        {modeButtons.map((btn) => {
          const blockInfo = buttonBlocks[btn.id];
          return (
            <button
              key={btn.id}
              onClick={(e) => {
                onLaunch?.(btn.label);
                const ok = safeRequestExpandedMode(e, btn.dest);
                if (!ok) onLaunch?.(null);
              }}
              className={`relative flex items-center justify-between w-full h-12 px-3.5 rounded-2xl border ${blockInfo.borderClass} ${blockInfo.bgClass} hover:bg-white/5 active:bg-white/10 transition-all select-none group cursor-pointer focus:outline-none`}
            >
              <div className="w-8 h-8 rounded-xl border border-dashed border-white/15 flex items-center justify-center shrink-0">
                <HexagonBlock
                  blockType={blockInfo.type}
                  shape={config[blockInfo.type]?.shape || 'diamond'}
                  className="w-full h-full p-0.5"
                />
              </div>

              <div className="flex-1 text-left pl-3.5 min-w-0">
                <div className="text-sm font-extrabold tracking-wide text-zinc-200 group-hover:text-white transition-colors truncate">
                  {btn.label}
                </div>
                <div className={`text-[10px] font-mono ${blockInfo.textClass} opacity-80 group-hover:opacity-100 truncate`}>
                  {btn.sub}
                </div>
              </div>

              <span className="text-xs font-mono font-bold text-zinc-400 group-hover:text-white group-hover:translate-x-0.5 transition-all">
                &rarr;
              </span>
            </button>
          );
        })}

        {/* Quick Toolbar Row: Shop / Maker / Profile */}
        <div className="w-full grid grid-cols-3 gap-2 pt-0.5">
          <button
            onClick={(e) => {
              onLaunch?.('Shop');
              const ok = safeRequestExpandedMode(e, 'shop');
              if (!ok) onLaunch?.(null);
            }}
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-emerald-500/30 hover:border-emerald-400 flex flex-col items-center gap-0.5 text-center group cursor-pointer transition-all active:scale-95"
          >
            <span className="text-[11px] font-extrabold text-zinc-200 group-hover:text-white">Shop</span>
            {currency !== null && currency > 0 ? (
              <span className="text-[9px] font-mono font-bold text-emerald-400 truncate">
                {currency.toLocaleString()}
              </span>
            ) : (
              <span className="text-[9px] font-mono text-zinc-400">Items</span>
            )}
          </button>
          <button
            onClick={(e) => {
              onLaunch?.('Puzzle Maker');
              const ok = safeRequestExpandedMode(e, 'puzzle-maker');
              if (!ok) onLaunch?.(null);
            }}
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-purple-500/30 hover:border-purple-400 flex flex-col items-center gap-0.5 text-center group cursor-pointer transition-all active:scale-95"
          >
            <span className="text-[11px] font-extrabold text-zinc-200 group-hover:text-white">Maker</span>
            <span className="text-[9px] font-mono text-purple-300/80">Create</span>
          </button>
          <button
            onClick={(e) => {
              onLaunch?.('User Profile');
              const ok = safeRequestExpandedMode(e, 'profile');
              if (!ok) onLaunch?.(null);
            }}
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-orange-500/30 hover:border-orange-400 flex flex-col items-center gap-0.5 text-center group cursor-pointer transition-all active:scale-95"
          >
            <span className="text-[11px] font-extrabold text-zinc-200 group-hover:text-white">Profile</span>
            <span className="text-[9px] font-mono text-orange-300/80">Stats</span>
          </button>
        </div>
      </div>

      {/* Bottom Action Section */}
      <div className="relative z-20 flex flex-col items-center gap-2 w-full max-w-sm mb-1 sm:mb-2 shrink-0">
        <button
          onClick={(e) => {
            onLaunch?.('Game Menu');
            const ok = safeRequestExpandedMode(e, 'menu');
            if (!ok) onLaunch?.(null);
          }}
          className="w-full py-3 px-6 rounded-2xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 active:scale-98 text-white font-black text-xs sm:text-sm uppercase tracking-wider transition-all shadow-[0_0_25px_rgba(99,102,241,0.4)] border border-cyan-400/60 flex items-center justify-between group cursor-pointer"
        >
          <span className="text-left font-black tracking-wide">Open Full Game Menu</span>
          <span className="text-[11px] font-mono font-bold text-cyan-200 bg-white/10 px-2 py-0.5 rounded-lg group-hover:translate-x-0.5 transition-transform">
            Expand &rarr;
          </span>
        </button>
      </div>
    </div>
  );
};

const DEFAULT_DEMO_PUZZLE: SlideMatchPuzzle = {
  id: 'demo-4x4',
  name: 'Demo Stage',
  difficulty: 'easy',
  width: 4,
  height: 4,
  walls: [
    { x: 3, y: 0 },
    { x: 0, y: 3 },
  ],
  blocks: [
    { id: 'b_blue', color: 'blue', x: 0, y: 1 },
    { id: 'b_purple', color: 'purple', x: 1, y: 3 },
  ],
  targets: [
    { id: 't_blue', color: 'blue', x: 3, y: 1 },
    { id: 't_purple', color: 'purple', x: 1, y: 0 },
  ],
  portals: [],
  par: 2,
};

const SlideMatchDemoBoard = ({
  activeTheme = 'neon',
  baseThemeId = 'neon',
  themeConfig,
  puzzle,
}: {
  activeTheme?: ThemeId;
  baseThemeId?: BaseThemeId;
  themeConfig?: ThemeConfig;
  puzzle?: SlideMatchPuzzle | null;
}) => {
  const activePuzzle = puzzle || DEFAULT_DEMO_PUZZLE;
  const gridWidth = activePuzzle.width || 4;
  const gridHeight = activePuzzle.height || 4;
  const maxDim = Math.max(gridWidth, gridHeight);

  const [currentBlocks, setCurrentBlocks] = useState<Array<{ id: string; color: string; x: number; y: number }>>(
    () => activePuzzle.blocks.map((b) => ({ id: b.id, color: b.color, x: b.x, y: b.y }))
  );
  const [isSolved, setIsSolved] = useState(false);

  const wallSet = useMemo(() => new Set((activePuzzle.walls || []).map((w) => `${w.x},${w.y}`)), [activePuzzle]);
  const targets = useMemo(() => activePuzzle.targets || [], [activePuzzle]);

  // Determine solution moves: either stored in puzzle or solved on the fly
  const solutionMoves = useMemo(() => {
    if (activePuzzle.solutionMoves && activePuzzle.solutionMoves.length > 0) {
      return activePuzzle.solutionMoves;
    }
    const res = solveSlideMatch(activePuzzle);
    return res.solvable ? res.solutionMoves : [];
  }, [activePuzzle]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let isCancelled = false;

    const runSimulation = () => {
      if (isCancelled) return;

      // Reset to initial block positions
      const initialBlocks = activePuzzle.blocks.map((b) => ({ id: b.id, color: b.color, x: b.x, y: b.y }));
      setCurrentBlocks(initialBlocks);
      setIsSolved(false);

      if (solutionMoves.length === 0) {
        return;
      }

      let simulatedBlocks = [...initialBlocks];

      const playMove = (moveIndex: number) => {
        if (isCancelled) return;
        if (moveIndex >= solutionMoves.length) {
          setIsSolved(true);
          // Hold celebration for 2.2s then restart
          timer = setTimeout(() => {
            runSimulation();
          }, 2200);
          return;
        }

        const move = solutionMoves[moveIndex];
        if (!move) return;

        timer = setTimeout(() => {
          if (isCancelled) return;
          const slideRes = calculateBlockSlide(
            move.blockId,
            move.dir,
            gridWidth,
            gridHeight,
            wallSet,
            simulatedBlocks,
            activePuzzle.portals || []
          );

          if (slideRes.moved) {
            simulatedBlocks = simulatedBlocks.map((b) =>
              b.id === move.blockId ? { ...b, x: slideRes.finalPos.x, y: slideRes.finalPos.y } : b
            );
            setCurrentBlocks([...simulatedBlocks]);
          }

          playMove(moveIndex + 1);
        }, moveIndex === 0 ? 800 : 900);
      };

      playMove(0);
    };

    runSimulation();

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [activePuzzle, solutionMoves, gridWidth, gridHeight, wallSet]);

  const config = themeConfig || DEFAULT_THEME_CONFIGS[baseThemeId] || DEFAULT_THEME_CONFIGS.neon;
  const styles = THEME_STYLES[baseThemeId] || THEME_STYLES.neon;
  const wallStyleClass = getWallStyle(baseThemeId) || styles.wallClass;

  const boardStyle: Record<string, string | number> = {
    '--demo-cell-size': `clamp(2.1rem, calc((min(100dvh - 210px, 84vw) - 28px) / ${maxDim + 0.2}), 4.85rem)`,
    '--grid-padding': '0.5rem',
    display: 'grid',
    gridTemplateColumns: `repeat(${gridWidth}, 1fr)`,
    gap: '1px',
    width: 'fit-content',
    borderRadius: 'calc(var(--demo-cell-size) * 0.35)',
    borderWidth: 'calc(var(--demo-cell-size) * 0.12)',
    borderStyle: 'solid',
    padding: 'var(--grid-padding)',
  };

  return (
    <div className="relative flex flex-col items-center justify-center my-auto w-full py-1">
      {/* Thematic Flexible Game Board */}
      <div
        className={cn(`relative ${styles.panelClass} transition-all shadow-2xl`)}
        style={boardStyle}
      >
        {/* Floor Cells, Autotiled Walls & Destination Targets */}
        {Array.from({ length: gridWidth * gridHeight }).map((_, i) => {
          const x = i % gridWidth;
          const y = Math.floor(i / gridWidth);
          const key = `${x},${y}`;
          const isWall = wallSet.has(key);
          const target = targets.find((t) => t.x === x && t.y === y);
          const wallNeighbors = isWall ? computeWallNeighbors(x, y, wallSet) : undefined;
          const radiusVal = 'calc(var(--demo-cell-size) * 0.16)';
          const cellBorderRadius = computeWallCornerRadii(isWall, wallNeighbors, radiusVal);
          const targetColorId = target ? target.color : 'blue';
          const targetBlockType = colorToBlockType(targetColorId);
          const destStyle = target ? getDestinationStyle(config, activeTheme, targetBlockType) : null;

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
                width: 'var(--demo-cell-size)',
                height: 'var(--demo-cell-size)',
                borderRadius: isWall ? cellBorderRadius : 'calc(var(--demo-cell-size) * 0.14)',
              }}
            >
              {/* 3D Wall Autotiling, Seam Bridges & Perimeter Bevel Lighting */}
              {isWall && (
                <>
                  {wallNeighbors?.right && (
                    <div className={cn('absolute top-0 bottom-0 -right-[1px] w-[1px] pointer-events-none z-1', wallStyleClass)} />
                  )}
                  {wallNeighbors?.bottom && (
                    <div className={cn('absolute left-0 right-0 -bottom-[1px] h-[1px] pointer-events-none z-1', wallStyleClass)} />
                  )}
                  {wallNeighbors?.right && wallNeighbors?.bottom && wallNeighbors?.bottomRight && (
                    <div className={cn('absolute -right-[1px] -bottom-[1px] w-[1px] h-[1px] pointer-events-none z-1', wallStyleClass)} />
                  )}
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
                      boxShadow: isSolved
                        ? `inset 0 0 14px ${destStyle.colorHex}55, 0 0 12px ${destStyle.colorHex}40`
                        : `inset 0 0 8px ${destStyle.colorHex}30, 0 0 6px ${destStyle.colorHex}25`,
                    }}
                  >
                    <div
                      className="w-1/2 h-1/2 rounded-full border border-dotted opacity-60 flex items-center justify-center"
                      style={{ borderColor: destStyle.colorHex }}
                    >
                      <div
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: destStyle.colorHex }}
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
          className="absolute overflow-visible z-10 pointer-events-none"
          style={{
            top: 'var(--grid-padding)',
            left: 'var(--grid-padding)',
            right: 'var(--grid-padding)',
            bottom: 'var(--grid-padding)',
            width: 'calc(100% - 2 * var(--grid-padding))',
            height: 'calc(100% - 2 * var(--grid-padding))',
          }}
        >
          {currentBlocks.map((block) => {
            const blockType = colorToBlockType(block.color);
            const blockConfig = blockType in config ? config[blockType as keyof ThemeConfig] : undefined;
            const isBlockOnTarget = targets.some((t) => t.x === block.x && t.y === block.y && t.color === block.color);

            return (
              <div
                key={block.id}
                className="absolute aspect-square flex items-center justify-center transition-transform duration-300 ease-out"
                style={{
                  width: 'var(--demo-cell-size)',
                  height: 'var(--demo-cell-size)',
                  transform: `translate3d(calc(${block.x} * (var(--demo-cell-size) + 1px)), calc(${block.y} * (var(--demo-cell-size) + 1px)), 0px)`,
                }}
              >
                <HexagonBlock
                  blockType={blockType}
                  colorId={block.color as any}
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
    </div>
  );
};

const SlideMatchSplash = ({
  activeTheme,
  onLaunch,
}: {
  activeTheme: ThemeId;
  onLaunch?: (target: string | null) => void;
}) => {
  const [showInstructions, setShowInstructions] = useState(false);
  const [featuredStage, setFeaturedStage] = useState<SlideMatchPuzzle | null>(null);
  const [stats, setStats] = useState<{
    highScore: number;
    highestStage: number;
    dailyRewardAvailable: boolean;
  } | null>(null);

  const activeThemeStyle = THEMES.find((t) => t.id === activeTheme);
  const baseThemeId = getBaseThemeId(activeTheme);
  const config = DEFAULT_THEME_CONFIGS[baseThemeId] || DEFAULT_THEME_CONFIGS.neon;
  const bgClass = getThemeBgClass(activeTheme, activeThemeStyle);

  useEffect(() => {
    trpc.slideMatch.getPostStage
      .query()
      .then((res) => {
        if (res) {
          setFeaturedStage(res);
        }
      })
      .catch((err) => console.warn('Could not fetch Slide Match post stage:', err));

    trpc.slideMatch.getEndlessStats
      .query()
      .then((res) => {
        if (res) {
          setStats({
            highScore: res.highScore,
            highestStage: res.highestStage,
            dailyRewardAvailable: res.dailyRewardAvailable ?? false,
          });
        }
      })
      .catch((err) => console.warn('Could not fetch Slide Match stats:', err));
  }, []);

  return (
    <div
      className={`relative flex h-[100dvh] w-full overflow-hidden flex-col items-center justify-between ${bgClass} px-4 py-3 select-none font-sans text-white`}
    >
      {/* Background Ambient Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 bg-fuchsia-500/15 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-80 h-80 bg-cyan-500/15 rounded-full blur-3xl" />
      </div>

      {/* Top Header */}
      <div className="relative z-20 flex flex-col items-center text-center mt-1 sm:mt-2">
        <h1 className="text-3xl sm:text-4xl font-black neon-text-title tracking-tight drop-shadow-md">
          Slide Match
        </h1>
        <p className="text-[11px] sm:text-xs text-zinc-400 font-mono tracking-widest uppercase mt-0.5">
          {featuredStage?.name ? `Featured: ${featuredStage.name}` : 'Endless Speed Runner'}
        </p>
      </div>

      {/* Interactive Simulation Board Showcase (Direct, No Dark Card Wrapper) */}
      <div className="relative z-10 flex flex-col items-center justify-center my-auto">
        <SlideMatchDemoBoard
          activeTheme={activeTheme}
          baseThemeId={baseThemeId}
          themeConfig={config}
          puzzle={featuredStage}
        />
      </div>

      {/* Bottom Action Section */}
      <div className="relative z-20 flex flex-col items-center gap-2 w-full max-w-xs mb-2">
        <button
          onClick={(e) => {
            onLaunch?.('Slide Match');
            const ok = safeRequestExpandedMode(e, 'slide-match');
            if (!ok) onLaunch?.(null);
          }}
          className="relative flex h-11 sm:h-12 w-full max-w-xs cursor-pointer items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 active:scale-98 text-white font-black text-sm sm:text-base uppercase tracking-wider transition-all shadow-[0_0_25px_rgba(99,102,241,0.4)] hover:shadow-[0_0_35px_rgba(6,182,212,0.6)] border border-cyan-400/60 group"
        >
          <span>Play Speed Runner</span>
          {stats?.dailyRewardAvailable && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-400/25 border border-amber-400/50 text-amber-300 text-xs font-black tracking-normal shadow-sm group-hover:bg-amber-400/40 transition-colors">
              <ShardIcon className="w-3.5 h-3.5 text-cyan-300" />
              <span>+15</span>
            </span>
          )}
        </button>

        <button
          onClick={() => setShowInstructions(true)}
          className="text-xs text-cyan-300/80 hover:text-cyan-200 underline font-mono cursor-pointer pt-0.5 flex items-center gap-1"
        >
          <span>How to Move &amp; Play</span>
          <span>&rarr;</span>
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
  const [launchingTarget, setLaunchingTarget] = useState<string | null>(null);
  const [levelConfig, setLevelConfig] = useState<any>(null);
  const [playerPos, setPlayerPos] = useState<any>(null);
  const [blockPositions, setBlockPositions] = useState<any[]>([]);
  const [dailyNumber, setDailyNumber] = useState<number | null>(null);
  const [currency, setCurrency] = useState<number | null>(null);

  const [selectedTier, setSelectedTier] = useState<DailyTier>('standard');
  const [tiersData, setTiersData] = useState<{ easy: DailyTierInfo; standard: DailyTierInfo } | null>(null);
  const [easyLevelConfig, setEasyLevelConfig] = useState<any>(null);
  const [standardLevelConfig, setStandardLevelConfig] = useState<any>(null);

  const [lastAction, setLastAction] = useState<'move' | 'teleport' | 'reset'>('reset');
  const prevPlayerPos = useRef<any>(null);
  const prevBlockPositions = useRef<any[]>([]);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [totalCompletions, setTotalCompletions] = useState<number>(0);
  const [totalStarts, setTotalStarts] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [isCurrentDaily, setIsCurrentDaily] = useState<boolean>(false);
  const [hasClaimedDailyStartBonus, setHasClaimedDailyStartBonus] = useState<boolean>(false);
  const [isMainAppPost, setIsMainAppPost] = useState<boolean>(false);
  const [isSlideMatchPost, setIsSlideMatchPost] = useState<boolean>(false);
  const [isSurveyPost, setIsSurveyPost] = useState<boolean>(false);
  const [surveyId, setSurveyId] = useState<string | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<'puzzle' | 'menu'>('puzzle');
  const loadedNumberRef = useRef<number | null>(null);

  const dailyNumVal = dailyNumber || 1;
  const themeIndex = (dailyNumVal - 1) % THEMES.length;
  const activeTheme = levelConfig?.theme || THEMES[themeIndex]?.id || 'neon';
  const baseTheme = getBaseThemeId(activeTheme);
  const activeThemeStyle = THEMES.find((t) => t.id === activeTheme) || THEMES[themeIndex];
  const themeConfig = DEFAULT_THEME_CONFIGS[baseTheme] || DEFAULT_THEME_CONFIGS.neon;
  const activeCharacter = levelConfig?.character || levelConfig?.theme || THEMES[themeIndex]?.id || 'neon';
  const isLowSolveRate = totalStarts > 0 && totalCompletions / totalStarts < 0.5;
  const statColorClass = isLowSolveRate ? 'text-red-400' : 'text-emerald-400';

  const handleSwitchTier = (tier: DailyTier) => {
    if (tier === selectedTier) return;
    setSelectedTier(tier);
    const targetConfig = tier === 'easy' ? (easyLevelConfig || levelConfig) : (standardLevelConfig || levelConfig);
    if (targetConfig) {
      setLevelConfig(targetConfig);
      setPlayerPos(targetConfig.startPos);
      setBlockPositions(targetConfig.blocks);
      prevPlayerPos.current = targetConfig.startPos;
      prevBlockPositions.current = targetConfig.blocks;
      setLastAction('reset');
    }
    void trpc.puzzle.setSelectedTier.mutate({ tier }).catch(() => {});
  };

  useEffect(() => {
    document.documentElement.classList.add('splash-mode');
    document.body.classList.add('splash-mode');
  }, []);

  // Safeguard: auto-clear launching loading overlay after 3.5s if expanded transition does not unload inline view
  useEffect(() => {
    if (!launchingTarget) return;
    const timer = setTimeout(() => {
      setLaunchingTarget(null);
    }, 3500);
    return () => clearTimeout(timer);
  }, [launchingTarget]);

  // When returning to inline presentation (expanded modal closed), dismiss any residual loader
  useEffect(() => {
    const handleFocus = () => {
      setLaunchingTarget(null);
    };
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
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
          if (postPuzzle.tier) {
            setSelectedTier(postPuzzle.tier);
          }
          if (postPuzzle.tiers) {
            setTiersData(postPuzzle.tiers);
          }
          if (postPuzzle.easyPuzzle) {
            const easyConverted = convertPuzzleToLevelConfig(postPuzzle.easyPuzzle);
            setEasyLevelConfig(easyConverted);
          }
          if (postPuzzle.standardPuzzle) {
            const stdConverted = convertPuzzleToLevelConfig(postPuzzle.standardPuzzle);
            setStandardLevelConfig(stdConverted);
          }
          if (postPuzzle.streak?.currentStreak !== undefined) {
            setStreak(postPuzzle.streak.currentStreak);
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
          if (postPuzzle.isSurveyPost !== undefined) {
            setIsSurveyPost(postPuzzle.isSurveyPost);
          }
          if (postPuzzle.surveyId) {
            setSurveyId(postPuzzle.surveyId);
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
  }, [levelConfig]);

  const isDaily = (dailyNumber !== null && dailyNumber > 0) || Boolean(tiersData);

  const tabBar = !levelConfig ? (
    <div className="w-full max-w-xs flex items-center justify-center p-1 bg-slate-950/85 backdrop-blur-md rounded-2xl border border-white/15 shadow-[0_0_15px_rgba(0,0,0,0.4)] shrink-0 z-30">
      <div className="flex-1 py-1.5 px-2 rounded-xl text-xs font-black flex items-center justify-center text-emerald-400/50 bg-emerald-950/20 animate-pulse">
        <span>Warm-Up</span>
      </div>
      <div className="flex-1 py-1.5 px-2 rounded-xl text-xs font-black flex items-center justify-center text-cyan-300/90 bg-gradient-to-r from-cyan-600/40 to-indigo-600/40 animate-pulse">
        <span>Daily</span>
      </div>
      <div className="flex-1 py-1.5 px-2 rounded-xl text-xs font-black flex items-center justify-center text-zinc-600">
        <span>Menu</span>
      </div>
    </div>
  ) : (
    <div className="w-full max-w-xs flex items-center justify-center p-1 bg-slate-950/85 backdrop-blur-md rounded-2xl border border-white/15 shadow-[0_0_15px_rgba(0,0,0,0.4)] shrink-0 z-30">
      {isDaily && tiersData ? (
        <>
          <button
            onClick={() => {
              setActiveTab('puzzle');
              handleSwitchTier('easy');
            }}
            className={cn(
              'flex-1 py-1.5 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 cursor-pointer',
              activeTab === 'puzzle' && selectedTier === 'easy'
                ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md border border-emerald-400/50'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            )}
          >
            <span>Warm-Up</span>
            {tiersData.easy.completed && (
              <svg className="w-3 h-3 text-emerald-300 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
          <button
            onClick={() => {
              setActiveTab('puzzle');
              handleSwitchTier('standard');
            }}
            className={cn(
              'flex-1 py-1.5 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 cursor-pointer',
              activeTab === 'puzzle' && selectedTier === 'standard'
                ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-md border border-cyan-400/50'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            )}
          >
            <span>Daily</span>
            {tiersData.standard.completed && (
              <svg className="w-3 h-3 text-cyan-300 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
          <button
            onClick={() => setActiveTab('menu')}
            className={cn(
              'flex-1 py-1.5 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center cursor-pointer',
              activeTab === 'menu'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md border border-purple-400/50'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            )}
          >
            <span>Menu</span>
          </button>
        </>
      ) : (
        <>
          <button
            onClick={() => setActiveTab('puzzle')}
            className={cn(
              'flex-1 py-1.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 cursor-pointer',
              activeTab === 'puzzle'
                ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-md border border-cyan-400/50'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            )}
          >
            <span>{dailyNumber !== null && dailyNumber > 0 ? 'Daily' : 'Challenge'}</span>
            {isCompleted && (
              <svg className="w-3 h-3 text-emerald-300 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
          <button
            onClick={() => setActiveTab('menu')}
            className={cn(
              'flex-1 py-1.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center cursor-pointer',
              activeTab === 'menu'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md border border-purple-400/50'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            )}
          >
            <span>Menu</span>
          </button>
        </>
      )}
    </div>
  );

  // 0. If viewing a Community Survey / Poll Post -> Interactive Survey Splash Card
  if (isSurveyPost) {
    return <SurveySplash activeTheme={activeTheme} surveyId={surveyId} />;
  }

  // 1. If viewing the Slide Match Dedicated Speed Runner Post -> Slide Match Animated Showcase
  if (isSlideMatchPost) {
    return (
      <>
        {launchingTarget && (
          <SplashLoader
            fullScreen
            message={`LAUNCHING ${launchingTarget.toUpperCase()}...`}
            subText="ENTERING SPEED ARENA"
            onDismiss={() => setLaunchingTarget(null)}
          />
        )}
        <SlideMatchSplash activeTheme={activeTheme} onLaunch={setLaunchingTarget} />
      </>
    );
  }

  // 2. If viewing the Main Application Splash Post (first/pinned post titled 'block-down') -> The Chronolith Showcase
  if (isMainAppPost) {
    return (
      <>
        {launchingTarget && (
          <SplashLoader
            fullScreen
            message={`OPENING ${launchingTarget.toUpperCase()}...`}
            subText="ENTERING EXPANDED MATRIX"
            onDismiss={() => setLaunchingTarget(null)}
          />
        )}
        <MainAppSplash activeTheme={activeTheme} streak={streak} onLaunch={setLaunchingTarget} />
      </>
    );
  }

  // 3. If viewing the Splash Menu tab (Game Mode Hub without Chronolith)
  if (activeTab === 'menu') {
    return (
      <>
        {launchingTarget && (
          <SplashLoader
            fullScreen
            message={`LAUNCHING ${launchingTarget.toUpperCase()}...`}
            subText="ENTERING EXPANDED MATRIX"
            onDismiss={() => setLaunchingTarget(null)}
          />
        )}
        <SplashMenu
          activeTheme={activeTheme}
          topSlot={tabBar}
          currency={currency}
          onLaunch={setLaunchingTarget}
        />
      </>
    );
  }

  return (
    <div className={`relative flex h-[100dvh] w-full overflow-hidden flex-col items-center justify-between gap-1 sm:gap-1.5 ${getThemeBgClass(activeTheme, activeThemeStyle)} px-4 py-2 sm:py-3 select-none`}>
      {launchingTarget && (
        <SplashLoader
          fullScreen
          message={`LAUNCHING ${launchingTarget.toUpperCase()}...`}
          subText="ENTERING QUANTUM ARENA"
          onDismiss={() => setLaunchingTarget(null)}
        />
      )}
      {/* Top Tab Navigation */}
      <div className="w-full flex flex-col items-center shrink-0 z-30 pt-0.5">
        {tabBar}
      </div>

      {/* Header Section */}
      <div className="w-full flex flex-col items-center gap-1 shrink-0 z-20 pt-0.5 min-h-[46px] sm:min-h-[50px] justify-center">
        {!levelConfig ? (
          <div className="flex flex-col items-center gap-1.5 py-0.5">
            <div className="h-6 w-44 rounded-lg bg-cyan-950/60 border border-cyan-500/30 animate-pulse flex items-center justify-center">
              <span className="text-[10px] font-mono font-bold tracking-widest text-cyan-400/80 uppercase">DECODING SECTOR...</span>
            </div>
            <div className="h-3 w-28 rounded-full bg-white/5 animate-pulse" />
          </div>
        ) : (
          <>
            <h1 className="text-center text-xl sm:text-2xl font-black neon-text-title tracking-tight animate-fade-in leading-none truncate max-w-[340px] sm:max-w-md">
              {dailyNumber !== null && dailyNumber > 0
                ? selectedTier === 'easy'
                  ? `Puzzle #${dailyNumber} Warm-Up`
                  : `Puzzle #${dailyNumber}`
                : (levelConfig?.name || 'Custom Puzzle')}
            </h1>
            {(!dailyNumber || dailyNumber <= 0) && levelConfig?.author && levelConfig.author !== 'system' && levelConfig.author !== 'admin' && (
              <span className="text-[11px] sm:text-xs text-zinc-400 font-mono font-medium -mt-0.5">
                by {levelConfig.author}
              </span>
            )}

            <div className="flex flex-row items-center justify-center gap-2 animate-fade-in shrink-0 select-none max-w-full px-2">
              {(tiersData ? (selectedTier === 'easy' ? tiersData.easy.completed : tiersData.standard.completed) : isCompleted) && (
                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] sm:text-xs font-black uppercase tracking-wider shadow-[0_0_8px_rgba(16,185,129,0.2)]">
                  <svg className="w-3 h-3 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Solved</span>
                </span>
              )}
              <span className="text-[11px] sm:text-xs text-white/80 font-bold uppercase tracking-wide font-mono flex items-center gap-1">
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
          </>
        )}
      </div>

      {/* Game Preview Section */}
      <div className="flex-1 w-full min-h-0 flex items-center justify-center select-none px-2 overflow-visible">
        <div className="flex items-center justify-center w-full h-full max-w-full max-h-full">
          {!levelConfig ? (
            <SplashLoader />
          ) : (
            <div className="pointer-events-none shrink-0 flex justify-center items-center max-w-full max-h-full animate-fade-in">
              {playerPos && blockPositions && (
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
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Action Button */}
      <div className="flex justify-center items-center shrink-0 w-full mb-1 sm:mb-2 z-20">
        {!levelConfig ? (
          <div className="relative flex h-11 sm:h-12 w-full max-w-xs items-center justify-center gap-2 rounded-2xl bg-cyan-950/50 border border-cyan-500/30 text-cyan-400/60 font-black text-sm uppercase tracking-wider overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/15 to-transparent animate-splash-progress w-full" />
            <span className="font-mono text-xs tracking-widest text-cyan-300/80">CONNECTING TO GRID...</span>
          </div>
        ) : (
          <button
            className="relative flex h-11 sm:h-12 w-full max-w-xs cursor-pointer items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 active:scale-98 text-white font-black text-sm sm:text-base uppercase tracking-wider transition-all shadow-[0_0_25px_rgba(99,102,241,0.4)] hover:shadow-[0_0_35px_rgba(6,182,212,0.6)] border border-cyan-400/60 group"
            onClick={(e) => {
              setLaunchingTarget(selectedTier === 'easy' ? 'Warm-Up Grid' : 'Daily Puzzle');
              try {
                localStorage.setItem('block_down_selected_tier', selectedTier);
              } catch {
                // ignore
              }
              void trpc.puzzle.setSelectedTier.mutate({ tier: selectedTier }).catch(() => {});
              const ok = safeRequestExpandedMode(e, 'game');
              if (!ok) {
                setLaunchingTarget(null);
              }
            }}
          >
            <span>{selectedTier === 'easy' ? 'Start Warm-Up' : 'Start Puzzle'}</span>
            {isCurrentDaily && !hasClaimedDailyStartBonus && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-400/25 border border-amber-400/50 text-amber-300 text-xs font-black tracking-normal shadow-sm group-hover:bg-amber-400/40 transition-colors">
                <ShardIcon className="w-3.5 h-3.5 text-cyan-300" />
                <span>+10</span>
              </span>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Splash />
  </StrictMode>
);
