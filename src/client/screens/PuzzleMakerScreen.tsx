import React, { useState, useEffect, useRef } from 'react';
import { showToast, navigateTo, canRunAsUser } from '@devvit/web/client';
import { trpc } from '../trpc';
import { ThemeId, getThemeBgClass, Theme, ThemeConfig, DEFAULT_THEME_CONFIGS, THEMES, CHARACTERS, GameCharacter } from '../../shared/themes';
import { ThemeBoardRenderer, getBlockColors } from '../components/ThemeBoardRenderer';
import { Position, BlockData, DestinationData, PuzzlePortal } from '../types';
import { colorToBlockType, dirToVector, getNextPosWithPortalsDetails, simulateSolutionPushes } from '../utils/puzzle';
import { trackClientEvent } from '../utils/analytics';
import { WeeklyPublishStatus } from '../../shared/types';
import { cn } from '../utils';

/**
 * PuzzleMakerScreen - 9x9 Visual Puzzle Creator Screen
 * Allows players to design, playtest, and export custom Block Down levels with theme & character switching.
 */
const GRID_SIZE = 9; // Fixed 9x9 Grid layout

export const PuzzleMakerScreen = ({
  onReturnToMenu,
  activeTheme = 'neon',
  activeThemeStyle,
  themeConfig,
  themeConfigs,
  themes = THEMES,
  purchasedThemes = ['neon'],
  activeCharacter = 'neon',
  purchasedCharacters = ['neon'],
  characters = CHARACTERS,
}: {
  onReturnToMenu: () => void;
  activeTheme?: ThemeId;
  activeThemeStyle?: Theme | undefined;
  themeConfig?: ThemeConfig | undefined;
  themeConfigs?: Record<ThemeId, ThemeConfig> | undefined;
  themes?: Theme[] | undefined;
  purchasedThemes?: ThemeId[] | undefined;
  activeCharacter?: string;
  purchasedCharacters?: string[] | undefined;
  characters?: GameCharacter[] | undefined;
}) => {
  // Theme & Character Switching State
  const [selectedTheme, setSelectedTheme] = useState<ThemeId>(activeTheme);
  const [selectedCharacter, setSelectedCharacter] = useState<string>(activeCharacter);
  const [showStyleMenu, setShowStyleMenu] = useState(false);

  useEffect(() => {
    setSelectedTheme(activeTheme);
  }, [activeTheme]);

  useEffect(() => {
    setSelectedCharacter(activeCharacter);
  }, [activeCharacter]);

  const allThemesList = themes && themes.length > 0 ? themes : THEMES;
  // Filter to only themes owned/unlocked by the player or free starting themes
  const availableThemes = allThemesList.filter(
    (t) => (purchasedThemes && purchasedThemes.includes(t.id)) || t.cost === 0 || t.id === activeTheme
  );
  const currentThemeStyle = availableThemes.find((t) => t.id === selectedTheme) || activeThemeStyle;
  const currentConfig = (themeConfigs && (themeConfigs as Record<string, ThemeConfig>)[selectedTheme]) || DEFAULT_THEME_CONFIGS[selectedTheme as keyof typeof DEFAULT_THEME_CONFIGS] || themeConfig || DEFAULT_THEME_CONFIGS.neon;
  const bgClass = getThemeBgClass(selectedTheme, currentThemeStyle);

  const allCharactersList = characters && characters.length > 0 ? characters : CHARACTERS;
  // Filter to only characters owned/unlocked by the player or free starting characters
  const availableCharacters = allCharactersList.filter(
    (c) => (purchasedCharacters && purchasedCharacters.includes(c.id)) || c.cost === 0 || c.id === activeCharacter
  );

  // Visual Editor Layout States
  const [player, setPlayer] = useState<Position>({ x: 1, y: 1 });
  const [walls, setWalls] = useState<Position[]>([
    { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 }, { x: 5, y: 0 }, { x: 6, y: 0 }, { x: 7, y: 0 }, { x: 8, y: 0 },
    { x: 0, y: 8 }, { x: 1, y: 8 }, { x: 2, y: 8 }, { x: 3, y: 8 }, { x: 4, y: 8 }, { x: 5, y: 8 }, { x: 6, y: 8 }, { x: 7, y: 8 }, { x: 8, y: 8 },
    { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 0, y: 3 }, { x: 0, y: 4 }, { x: 0, y: 5 }, { x: 0, y: 6 }, { x: 0, y: 7 },
    { x: 8, y: 1 }, { x: 8, y: 2 }, { x: 8, y: 3 }, { x: 8, y: 4 }, { x: 8, y: 5 }, { x: 8, y: 6 }, { x: 8, y: 7 },
  ]);
  const [blocks, setBlocks] = useState<{ id: string; color: string; x: number; y: number }[]>([
    { id: 'b1', color: 'red', x: 3, y: 3 },
  ]);
  const [targets, setTargets] = useState<{ id: string; color: string; x: number; y: number }[]>([
    { id: 't1', color: 'red', x: 7, y: 3 },
  ]);
  const [portals, setPortals] = useState<
    { id: string; color: string; x: number; y: number; dir: 'Up' | 'Down' | 'Left' | 'Right' }[]
  >([]);

  // Tool & Color States
  const [selectedTool, setSelectedTool] = useState<'wall' | 'player' | 'block' | 'target' | 'portal' | 'eraser'>('wall');
  const [selectedColor, setSelectedColor] = useState<string>('red');

  const isColorTool = selectedTool === 'block' || selectedTool === 'target' || selectedTool === 'portal';

  const handleSelectTool = (t: 'wall' | 'player' | 'block' | 'target' | 'portal' | 'eraser') => {
    setSelectedTool(t);
    if ((t === 'target' || t === 'portal') && (selectedColor === 'gray' || selectedColor === 'grey')) {
      setSelectedColor('red');
    }
  };

  // Playtest States
  const [isPlaytesting, setIsPlaytesting] = useState(false);
  const [ptPlayer, setPtPlayer] = useState<Position>({ x: 1, y: 1 });
  const [ptBlocks, setPtBlocks] = useState<{ id: string; color: string; x: number; y: number }[]>([]);
  const [ptMoves, setPtMoves] = useState<string[]>([]);
  const [ptSolved, setPtSolved] = useState(false);

  const prevBlocksRef = useRef<BlockData[]>([]);
  const prevPlayerRef = useRef<Position>({ x: 1, y: 1 });
  const [lastAction, setLastAction] = useState<'move' | 'teleport' | 'reset' | 'load'>('load');
  const [weeklyStatus, setWeeklyStatus] = useState<WeeklyPublishStatus | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState<boolean>(true);
  const [showStatusModal, setShowStatusModal] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  const fetchWeeklyStatus = async () => {
    try {
      setIsLoadingStatus(true);
      const status = await trpc.weekly.canPublishWeekly.query();
      setWeeklyStatus(status);
    } catch (e) {
      console.error('Failed to fetch weekly status in Maker:', e);
      // Fallback: Default to allowing building and fallback timer
      setWeeklyStatus({
        canPublish: true,
        resetsAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
        currentWeekId: 'current',
        nextWeekId: 'next',
      });
    } finally {
      setIsLoadingStatus(false);
    }
  };

  useEffect(() => {
    trackClientEvent('screen_view_puzzle_maker');
    void fetchWeeklyStatus();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowStatusModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const formatCountdown = (resetsAt: number): string => {
    const diff = Math.max(0, resetsAt - currentTime);
    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    }
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    }
    return `${minutes}m ${seconds}s`;
  };

  const formatResetDate = (resetsAt: number): { utc: string; local: string } => {
    const date = new Date(resetsAt);
    const utcDay = date.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' });
    const utcHours = String(date.getUTCHours()).padStart(2, '0');
    const utcMinutes = String(date.getUTCMinutes()).padStart(2, '0');

    const localFormatted = date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });

    return {
      utc: `${utcDay} at ${utcHours}:${utcMinutes} UTC`,
      local: localFormatted,
    };
  };

  // Cell Click Handler for Builder Mode
  const handleCellClick = (x: number, y: number) => {
    if (isPlaytesting) return;

    if (selectedTool === 'player') {
      setPlayer({ x, y });
      setWalls((prev) => prev.filter((w) => !(w.x === x && w.y === y)));
    } else if (selectedTool === 'wall') {
      const exists = walls.some((w) => w.x === x && w.y === y);
      if (exists) {
        setWalls(walls.filter((w) => !(w.x === x && w.y === y)));
      } else {
        setWalls([...walls, { x, y }]);
        setBlocks(blocks.filter((b) => !(b.x === x && b.y === y)));
        setTargets(targets.filter((t) => !(t.x === x && t.y === y)));
        setPortals(portals.filter((p) => !(p.x === x && p.y === y)));
      }
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
      if (selectedColor === 'gray' || selectedColor === 'grey') return;
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
      if (selectedColor === 'gray' || selectedColor === 'grey') return;
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
      setWalls(walls.filter((w) => !(w.x === x && w.y === y)));
      setBlocks(blocks.filter((b) => !(b.x === x && b.y === y)));
      setTargets(targets.filter((t) => !(t.x === x && t.y === y)));
      setPortals(portals.filter((p) => !(p.x === x && p.y === y)));
    }
  };

  // Playtest Controls
  const startPlaytest = () => {
    trackClientEvent('maker_puzzle_playtested');
    setIsPlaytesting(true);
    setPtPlayer({ ...player });
    setPtBlocks(blocks.map((b) => ({ ...b })));
    setPtMoves([]);
    setPtSolved(false);
    prevPlayerRef.current = { ...player };
    prevBlocksRef.current = blocks.map((b) => ({
      id: b.id,
      type: colorToBlockType(b.color),
      pos: { x: b.x, y: b.y },
    }));
    setLastAction('reset');
  };

  const stopPlaytest = () => {
    setIsPlaytesting(false);
    setPtSolved(false);
    setLastAction('load');
  };

  const executeMove = (dir: 'Up' | 'Down' | 'Left' | 'Right') => {
    if (!isPlaytesting || ptSolved) return;

    const dirVector = dirToVector(dir);
    const wallSet = new Set(walls.map((w) => `${w.x},${w.y}`));

    let newPlayer = { ...ptPlayer };
    const newBlocks = ptBlocks.map((b) => ({ ...b }));
    let moved = false;

    // 1. Check if player stands on portal and moves into entrance
    const portalOnCurrentCell = portals.find((p) => p.x === ptPlayer.x && p.y === ptPlayer.y);

    if (portalOnCurrentCell) {
      const portalVec = dirToVector(portalOnCurrentCell.dir);
      if (portalVec.x === -dirVector.x && portalVec.y === -dirVector.y) {
        const exitPortal = portals.find(
          (p) => p.color.toLowerCase() === portalOnCurrentCell.color.toLowerCase() && p.id !== portalOnCurrentCell.id
        );

        if (exitPortal) {
          const exitPos = { x: exitPortal.x, y: exitPortal.y };
          const isExitWallOrBound =
            exitPos.x < 0 || exitPos.x >= GRID_SIZE ||
            exitPos.y < 0 || exitPos.y >= GRID_SIZE ||
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
                  GRID_SIZE,
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
                  return;
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

      if (nextX < 0 || nextX >= GRID_SIZE || nextY < 0 || nextY >= GRID_SIZE) return;
      if (wallSet.has(`${nextX},${nextY}`)) return;

      const blockIdx = newBlocks.findIndex((b) => b.x === nextX && b.y === nextY);
      if (blockIdx !== -1) {
        const block = newBlocks[blockIdx];
        if (block) {
          const trajectory = getNextPosWithPortalsDetails(
            { x: block.x, y: block.y },
            dirVector,
            GRID_SIZE,
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
      prevPlayerRef.current = ptPlayer;
      prevBlocksRef.current = ptBlocks.map((b) => ({
        id: b.id,
        type: colorToBlockType(b.color),
        pos: { x: b.x, y: b.y },
      }));

      setPtPlayer(newPlayer);
      setPtBlocks(newBlocks);
      setLastAction('move');
      setPtMoves((prev) => [...prev, dir]);

      if (targets.length > 0) {
        const win = targets.every((t) => newBlocks.some((b) => b.x === t.x && b.y === t.y && b.color === t.color));
        if (win) {
          setPtSolved(true);
          showToast({ text: 'Puzzle Solved & Verified! Click "Post to Reddit" below to publish.', appearance: 'success' });
        }
      }
    }
  };

  // Keyboard Event Listener for Playtesting
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
  }, [isPlaytesting, ptPlayer, ptBlocks, ptSolved, walls, portals]);

  const [isPosting, setIsPosting] = useState(false);
  const [publishedPostUrl, setPublishedPostUrl] = useState<string | null>(null);

  // Trigger Solve & Post Verification Mode
  const handleSolveAndPostClick = () => {
    if (blocks.length === 0) {
      showToast({ text: 'Please place at least one block before solving & posting!', appearance: 'neutral' });
      return;
    }
    if (targets.length === 0) {
      showToast({ text: 'Please place at least one target slot before solving & posting!', appearance: 'neutral' });
      return;
    }

    startPlaytest();
    showToast({ text: 'Solve your puzzle to verify it and post to Reddit!', appearance: 'neutral' });
  };

  // Post Verified Custom Puzzle to Reddit handler
  const handlePostPuzzleWithMoves = async (solutionMoves: string[], event?: React.MouseEvent) => {
    if (isPosting) return;

    setIsPosting(true);
    try {
      if (event?.nativeEvent) {
        const permitted = await canRunAsUser(event.nativeEvent);
        if (!permitted) {
          showToast({
            text: 'Permission to post on your behalf was not granted.',
            appearance: 'neutral',
          });
          return;
        }
      }
      const calculatedPar = simulateSolutionPushes({
        gridSize: GRID_SIZE,
        startPos: player,
        walls,
        blocks: blocks.map((b) => ({ id: b.id, type: colorToBlockType(b.color), pos: { x: b.x, y: b.y } })),
        destinations: targets.map((t) => ({ id: t.id, type: colorToBlockType(t.color), pos: { x: t.x, y: t.y } })),
        portals,
        moves: solutionMoves,
      });

      const res = await trpc.puzzle.publishCustomPuzzle.mutate({
        name: 'Custom Challenge',
        startPos: player,
        walls,
        blocks,
        targets,
        portals,
        solutionMoves,
        par: calculatedPar,
        theme: selectedTheme,
        character: selectedCharacter,
      });

      if (res?.success) {
        showToast({ text: 'Solution Verified & Entered for Next Week\'s Competition!', appearance: 'success' });
        void fetchWeeklyStatus();
        if (res.postUrl) {
          setPublishedPostUrl(res.postUrl);
        }
      } else {
        showToast({ text: 'Failed to post puzzle to Reddit.', appearance: 'neutral' });
      }
    } catch (err: unknown) {
      console.error('Failed to post custom puzzle:', err);
      const msg = err instanceof Error ? err.message : 'Error posting puzzle to Reddit.';
      showToast({ text: msg, appearance: 'neutral' });
    } finally {
      setIsPosting(false);
    }
  };

  const activeBlocksRender: BlockData[] = (isPlaytesting ? ptBlocks : blocks).map((b) => ({
    id: b.id,
    type: colorToBlockType(b.color),
    pos: { x: b.x, y: b.y },
  }));

  const activeDestinationsRender: DestinationData[] = targets.map((t) => ({
    id: t.id,
    type: colorToBlockType(t.color),
    pos: { x: t.x, y: t.y },
  }));

  const activePortalsRender: PuzzlePortal[] = portals.map((p) => ({
    id: p.id,
    color: p.color,
    x: p.x,
    y: p.y,
    dir: p.dir,
  }));

  return (
    <div className={`relative flex h-[100dvh] w-full flex-col items-center justify-between gap-1.5 sm:gap-3 ${bgClass} p-2.5 sm:p-4 select-none overflow-hidden transition-colors duration-500`}>
      {/* Navbar Header */}
      <div className="w-full max-w-5xl flex items-center justify-between z-30 pt-0.5 gap-2 shrink-0">
        <button
          onClick={onReturnToMenu}
          className="px-3 py-1 sm:px-3.5 sm:py-1.5 bg-black/60 backdrop-blur-md border border-cyan-500/30 text-white rounded-xl font-bold text-[11px] sm:text-sm transition-all hover:scale-105 active:scale-95 shadow-md cursor-pointer flex items-center gap-1.5 shrink-0"
        >
          <span>← Back to Menu</span>
        </button>

        {/* Right Header Controls: Status Pill & Style Menu */}
        <div className="flex items-center gap-2">
          {weeklyStatus && (
            <button
              type="button"
              onClick={() => setShowStatusModal(true)}
              className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl border backdrop-blur-md text-[10px] sm:text-xs font-mono font-bold tracking-tight transition-all hover:scale-105 active:scale-95 shadow-md cursor-pointer flex items-center gap-1.5 ${
                weeklyStatus.canPublish
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 hover:border-emerald-400'
                  : 'bg-amber-950/60 border-amber-500/40 text-amber-300 hover:border-amber-400'
              }`}
              title="Click to view weekly posting eligibility and reset countdown"
            >
              {weeklyStatus.canPublish ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Post: 1/1 Ready</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5 text-amber-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <span>Post: 0/1 ({formatCountdown(weeklyStatus.resetsAt)})</span>
                </>
              )}
            </button>
          )}

          {/* Style Dropdown Menu Button */}
          <div className="relative z-40">
          <button
            type="button"
            onClick={() => setShowStyleMenu(!showStyleMenu)}
            className="px-3 py-1 sm:px-3.5 sm:py-1.5 bg-black/60 backdrop-blur-md border border-cyan-500/40 text-white rounded-xl font-bold text-[11px] sm:text-sm transition-all hover:scale-105 active:scale-95 shadow-md cursor-pointer flex items-center gap-1.5"
          >
            <span>Style</span>
            <span className="text-[10px] text-cyan-300">▼</span>
          </button>

          {showStyleMenu && (
            <div className="absolute right-0 mt-2 w-64 glass-panel p-4 rounded-2xl border border-cyan-500/40 shadow-2xl text-white space-y-3 z-50 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-cyan-400">
                  Style Settings
                </span>
                <button
                  type="button"
                  onClick={() => setShowStyleMenu(false)}
                  className="text-zinc-400 hover:text-white text-xs font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Board Theme Selection */}
              <div>
                <label className="block text-[11px] font-mono font-bold text-zinc-300 mb-1">
                  Theme:
                </label>
                <select
                  value={selectedTheme}
                  onChange={(e) => setSelectedTheme(e.target.value as ThemeId)}
                  className="w-full bg-slate-900 border border-white/20 rounded-xl px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
                >
                  {availableThemes.map((t) => (
                    <option key={t.id} value={t.id} className="bg-slate-900 text-white">
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Bot Avatar Selection */}
              <div>
                <label className="block text-[11px] font-mono font-bold text-zinc-300 mb-1">
                  Bot Avatar:
                </label>
                <select
                  value={selectedCharacter}
                  onChange={(e) => setSelectedCharacter(e.target.value)}
                  className="w-full bg-slate-900 border border-white/20 rounded-xl px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-purple-400 cursor-pointer"
                >
                  {availableCharacters.map((c) => (
                    <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>

      {/* MOBILE LAYOUT (< 520px): Original Compact 2-Card Stacked View */}
      <div className="block min-[520px]:hidden w-full flex-1 min-h-0 overflow-hidden space-y-2">
        {/* Mobile Top Controls Card */}
        <div className="glass-panel p-2.5 sm:p-3 rounded-3xl border border-cyan-500/30 text-white shadow-xl shadow-black/50 space-y-2">
          {/* Tool Selection Buttons */}
          <div>
            <label className="block text-[10px] sm:text-xs font-bold uppercase tracking-wider text-cyan-400 mb-1">
              Placement Tool
            </label>
            <div className="grid grid-cols-3 gap-1">
              {(['wall', 'player', 'block', 'target', 'portal', 'eraser'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  disabled={isPlaytesting}
                  onClick={() => handleSelectTool(t)}
                  className={`py-1 px-1 rounded-xl text-[10px] sm:text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer border ${
                    selectedTool === t
                      ? 'bg-cyan-500 text-black border-white shadow-[0_0_10px_rgba(34,211,238,0.5)] scale-102'
                      : 'bg-black/40 text-zinc-300 border-white/10 hover:bg-white/10 disabled:opacity-40'
                  }`}
                >
                  {t === 'wall' && 'Wall'}
                  {t === 'player' && 'Bot'}
                  {t === 'block' && 'Block'}
                  {t === 'target' && 'Target'}
                  {t === 'portal' && 'Portal'}
                  {t === 'eraser' && 'Eraser'}
                </button>
              ))}
            </div>
          </div>

          {/* Tool Color Palette (Always visible during puzzle building) */}
          <div>
            <label
              className={cn(
                'block text-[10px] font-bold uppercase tracking-wider text-cyan-400 mb-1 transition-opacity',
                !isColorTool && 'opacity-30 text-slate-500'
              )}
            >
              Color Theme Palette
            </label>
            <div
              className={cn(
                'flex gap-2 flex-wrap items-center bg-black/40 p-1.5 rounded-2xl border border-white/10 min-h-[38px] transition-all',
                !isColorTool && 'invisible pointer-events-none'
              )}
            >
              {(selectedTool === 'target' || selectedTool === 'portal'
                ? ['red', 'blue', 'yellow', 'purple', 'green', 'orange']
                : ['red', 'blue', 'yellow', 'purple', 'green', 'orange', 'gray']
              ).map((c) => {
                const themeColorInfo = getBlockColors(currentConfig, selectedTheme, colorToBlockType(c));
                const isSelected = selectedColor === c;

                return (
                  <button
                    key={c}
                    type="button"
                    disabled={isPlaytesting}
                    onClick={() => {
                      setSelectedColor(c);
                      if (selectedTool === 'wall' || selectedTool === 'player' || selectedTool === 'eraser') {
                        handleSelectTool('block');
                      }
                    }}
                    className={`w-6 h-6 rounded-full border-2 transition-all cursor-pointer relative flex items-center justify-center ${
                      isSelected
                        ? 'border-white scale-110 shadow-[0_0_10px_#fff]'
                        : 'border-transparent opacity-70 hover:opacity-100 hover:scale-105'
                    }`}
                    style={{
                      backgroundColor: themeColorInfo.colorHex,
                      boxShadow: isSelected ? `0 0 10px ${themeColorInfo.colorHex}` : undefined,
                    }}
                    title={c}
                  >
                    <div
                      className={`w-3 h-3 rounded-full ${themeColorInfo.solidFill} opacity-90 border border-white/30`}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Bar */}
          <div className="pt-1 flex gap-1.5">
            <button
              onClick={handleSolveAndPostClick}
              disabled={isPosting}
              className="flex-1 py-2 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 disabled:opacity-50 text-white font-extrabold text-xs transition-all hover:scale-102 active:scale-98 cursor-pointer border border-purple-400/50 flex items-center justify-center gap-1"
            >
              {isPosting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Posting...</span>
                </>
              ) : (
                <span>Solve & Post</span>
              )}
            </button>
            <button
              onClick={() => {
                setWalls([]);
                setBlocks([]);
                setTargets([]);
                setPortals([]);
                setPlayer({ x: 1, y: 1 });
                showToast({ text: 'Board cleared!', appearance: 'neutral' });
              }}
              disabled={isPosting}
              className="py-2 px-2.5 rounded-xl bg-red-950/60 hover:bg-red-900/80 border border-red-500/40 text-red-300 font-bold text-xs transition-all cursor-pointer disabled:opacity-40"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Mobile Board Canvas */}
        <div className="flex flex-col items-center justify-center max-h-full overflow-hidden">
          <div className="glass-panel p-2 rounded-3xl border border-cyan-500/30 shadow-xl shadow-black/50 flex flex-col items-center justify-center w-fit max-w-full mx-auto max-h-full">
            <div className="relative flex items-center justify-center">
              <ThemeBoardRenderer
                gridSize={GRID_SIZE}
                walls={walls}
                destinations={activeDestinationsRender}
                blocks={activeBlocksRender}
                portals={activePortalsRender}
                playerPos={isPlaytesting ? ptPlayer : player}
                activeTheme={selectedTheme}
                activeCharacter={selectedCharacter}
                themeConfig={currentConfig}
                activeThemeStyle={currentThemeStyle}
                cellSize="clamp(25px, 5.0vh, 50px)"
                gridPadding="6px"
                isAnimated={isPlaytesting}
                prevBlocks={prevBlocksRef.current}
                prevPlayerPos={prevPlayerRef.current}
                lastAction={lastAction}
                showTrails={false}
              />

              {!isPlaytesting && (
                <div
                  className="absolute inset-[6px] grid gap-[1px] pointer-events-auto"
                  style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}
                >
                  {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
                    const x = i % GRID_SIZE;
                    const y = Math.floor(i / GRID_SIZE);

                    return (
                      <div
                        key={i}
                        onClick={() => handleCellClick(x, y)}
                        className="w-full h-full cursor-pointer hover:bg-white/10 rounded transition-colors"
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* DESKTOP / TABLET LAYOUT (>= 520px): Requested 3-Card Structured Layout */}
      <div className="hidden min-[520px]:flex w-full max-w-5xl flex-col gap-3 sm:gap-4 z-20 flex-1 min-h-0 overflow-hidden justify-between">
        
        {/* Card 1 (Top Row): Object Tools (Block, Target, Portal) & Color Theme Palette */}
        <div className="glass-panel p-3 sm:p-4 rounded-3xl border border-cyan-500/30 text-white shadow-xl shadow-black/50 shrink-0">
          <div className="flex flex-row items-center justify-between gap-3">
            
            {/* Tools: Block, Target, Portal */}
            <div className="flex-1">
              <label className="block text-[11px] sm:text-xs font-bold uppercase tracking-wider text-cyan-400 mb-1.5">
                Object Placement Tools
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['block', 'target', 'portal'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    disabled={isPlaytesting}
                    onClick={() => handleSelectTool(t)}
                    className={`py-2 px-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer border ${
                      selectedTool === t
                        ? 'bg-cyan-500 text-black border-white shadow-[0_0_12px_rgba(34,211,238,0.5)] scale-102'
                        : 'bg-black/40 text-zinc-300 border-white/10 hover:bg-white/10 disabled:opacity-40'
                    }`}
                  >
                    {t === 'block' && 'Block'}
                    {t === 'target' && 'Target'}
                    {t === 'portal' && 'Portal'}
                  </button>
                ))}
              </div>
            </div>

            {/* Tool Color Theme Palette */}
            <div className="flex flex-col justify-center">
              <label
                className={cn(
                  'block text-[11px] sm:text-xs font-bold uppercase tracking-wider text-cyan-400 mb-1.5 transition-opacity',
                  !isColorTool && 'opacity-30 text-slate-500'
                )}
              >
                Color Theme Palette
              </label>
              <div
                className={cn(
                  'flex gap-2 items-center bg-black/40 p-2 rounded-2xl border border-white/10 min-h-[46px] transition-all',
                  !isColorTool && 'invisible pointer-events-none'
                )}
              >
                {(selectedTool === 'target' || selectedTool === 'portal'
                  ? ['red', 'blue', 'yellow', 'purple', 'green', 'orange']
                  : ['red', 'blue', 'yellow', 'purple', 'green', 'orange', 'gray']
                ).map((c) => {
                  const themeColorInfo = getBlockColors(currentConfig, selectedTheme, colorToBlockType(c));
                  const isSelected = selectedColor === c;

                  return (
                    <button
                      key={c}
                      type="button"
                      disabled={isPlaytesting}
                      onClick={() => setSelectedColor(c)}
                      className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 transition-all cursor-pointer relative flex items-center justify-center ${
                        isSelected
                          ? 'border-white scale-110 shadow-[0_0_10px_#fff]'
                          : 'border-transparent opacity-70 hover:opacity-100 hover:scale-105'
                      }`}
                      style={{
                        backgroundColor: themeColorInfo.colorHex,
                        boxShadow: isSelected ? `0 0 10px ${themeColorInfo.colorHex}` : undefined,
                      }}
                      title={c}
                    >
                      <div
                        className={`w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full ${themeColorInfo.solidFill} opacity-90 border border-white/30`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        </div>

        {/* Second Row: 2 Side-by-Side Cards (Card 2: Bot, Wall, Eraser + Actions; Card 3: Board Canvas) */}
        <div className="grid grid-cols-12 gap-3 sm:gap-5 flex-1 min-h-0 items-center overflow-hidden">
          
          {/* Card 2 (Bottom Row Left): Bot, Wall, Eraser, Clear, Solve & Post (Stacked with Refined Padding & Spacing) */}
          <div className="col-span-5 flex flex-col max-h-full overflow-y-auto no-scrollbar justify-center">
            <div className="glass-panel p-3.5 sm:p-4 rounded-3xl border border-cyan-500/30 text-white shadow-xl shadow-black/50 space-y-3">
              <label className="block text-[11px] sm:text-xs font-bold uppercase tracking-wider text-cyan-400 mb-0.5">
                Tools & Actions
              </label>

              <div className="flex flex-col gap-2.5 sm:gap-3">
                {/* 1. Bot */}
                <button
                  type="button"
                  disabled={isPlaytesting}
                  onClick={() => handleSelectTool('player')}
                  className={`w-full py-2 sm:py-2.5 px-3 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer border flex items-center justify-center ${
                    selectedTool === 'player'
                      ? 'bg-cyan-500 text-black border-white shadow-[0_0_12px_rgba(34,211,238,0.5)] scale-102'
                      : 'bg-black/40 text-zinc-300 border-white/10 hover:bg-white/10 disabled:opacity-40'
                  }`}
                >
                  <span>Bot</span>
                </button>

                {/* 2. Wall */}
                <button
                  type="button"
                  disabled={isPlaytesting}
                  onClick={() => handleSelectTool('wall')}
                  className={`w-full py-2 sm:py-2.5 px-3 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer border flex items-center justify-center ${
                    selectedTool === 'wall'
                      ? 'bg-cyan-500 text-black border-white shadow-[0_0_12px_rgba(34,211,238,0.5)] scale-102'
                      : 'bg-black/40 text-zinc-300 border-white/10 hover:bg-white/10 disabled:opacity-40'
                  }`}
                >
                  <span>Wall</span>
                </button>

                {/* 3. Eraser */}
                <button
                  type="button"
                  disabled={isPlaytesting}
                  onClick={() => handleSelectTool('eraser')}
                  className={`w-full py-2 sm:py-2.5 px-3 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer border flex items-center justify-center ${
                    selectedTool === 'eraser'
                      ? 'bg-cyan-500 text-black border-white shadow-[0_0_12px_rgba(34,211,238,0.5)] scale-102'
                      : 'bg-black/40 text-zinc-300 border-white/10 hover:bg-white/10 disabled:opacity-40'
                  }`}
                >
                  <span>Eraser</span>
                </button>


                {/* 5. Clear */}
                <button
                  type="button"
                  onClick={() => {
                    setWalls([]);
                    setBlocks([]);
                    setTargets([]);
                    setPortals([]);
                    setPlayer({ x: 1, y: 1 });
                    showToast({ text: 'Board cleared!', appearance: 'neutral' });
                  }}
                  disabled={isPosting}
                  className="w-full py-2 sm:py-2.5 px-3 rounded-xl bg-red-950/60 hover:bg-red-900/80 border border-red-500/40 text-red-300 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer disabled:opacity-40 flex items-center justify-center"
                >
                  <span>Clear</span>
                </button>

                {/* 5. Solve & Post */}
                <button
                  type="button"
                  onClick={handleSolveAndPostClick}
                  disabled={isPosting}
                  className="w-full py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 disabled:opacity-50 text-white font-extrabold text-xs uppercase tracking-wider transition-all hover:scale-102 active:scale-98 cursor-pointer border border-purple-400/50 flex items-center justify-center gap-1.5 shadow-md mt-0.5"
                >
                  {isPosting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Posting...</span>
                    </>
                  ) : (
                    <span>Solve & Post</span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Card 3 (Bottom Row Right): 9x9 Interactive Board Canvas */}
          <div className="col-span-7 flex flex-col items-center justify-center max-h-full overflow-hidden">
            <div className="glass-panel p-2.5 sm:p-3 rounded-3xl border border-cyan-500/30 shadow-xl shadow-black/50 flex flex-col items-center justify-center w-fit max-w-full mx-auto max-h-full">
              <div className="relative flex items-center justify-center">
                <ThemeBoardRenderer
                  gridSize={GRID_SIZE}
                  walls={walls}
                  destinations={activeDestinationsRender}
                  blocks={activeBlocksRender}
                  portals={activePortalsRender}
                  playerPos={isPlaytesting ? ptPlayer : player}
                  activeTheme={selectedTheme}
                  activeCharacter={selectedCharacter}
                  themeConfig={currentConfig}
                  activeThemeStyle={currentThemeStyle}
                  cellSize="clamp(25px, 5.9vh, 58px)"
                  gridPadding="6px"
                  isAnimated={isPlaytesting}
                  prevBlocks={prevBlocksRef.current}
                  prevPlayerPos={prevPlayerRef.current}
                  lastAction={lastAction}
                  showTrails={false}
                />

                {!isPlaytesting && (
                  <div
                    className="absolute inset-[6px] grid gap-[1px] pointer-events-auto"
                    style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}
                  >
                    {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
                      const x = i % GRID_SIZE;
                      const y = Math.floor(i / GRID_SIZE);

                      return (
                        <div
                          key={i}
                          onClick={() => handleCellClick(x, y)}
                          className="w-full h-full cursor-pointer hover:bg-white/10 rounded transition-colors"
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Solve to Verify Modal Pop Up Overlay */}
      {isPlaytesting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 pointer-events-auto overflow-y-auto">
          <div className="glass-panel max-w-md min-[780px]:max-w-[540px] w-full p-4 sm:p-5 rounded-3xl border border-purple-500/40 text-white relative shadow-2xl shadow-black/60 flex flex-col items-center space-y-3 max-h-[94vh] overflow-y-auto">
            
            {/* Header Title: Solve to Verify */}
            <div className="text-center">
              <h3 className="text-xl sm:text-2xl font-black neon-text-title tracking-tight">
                Solve to Verify
              </h3>
            </div>

            {/* 9x9 Interactive Board Canvas */}
            <div className="relative flex items-center justify-center">
              <ThemeBoardRenderer
                gridSize={GRID_SIZE}
                walls={walls}
                destinations={activeDestinationsRender}
                blocks={activeBlocksRender}
                portals={activePortalsRender}
                playerPos={ptPlayer}
                activeTheme={selectedTheme}
                activeCharacter={selectedCharacter}
                themeConfig={currentConfig}
                activeThemeStyle={currentThemeStyle}
                cellSize="clamp(26px, 5.8vh, 54px)"
                gridPadding="6px"
                isAnimated={true}
                prevBlocks={prevBlocksRef.current}
                prevPlayerPos={prevPlayerRef.current}
                lastAction={lastAction}
                showTrails={false}
              />
            </div>

            {/* If Solved: Solution Verified Banner & Post Button */}
            {ptSolved ? (
              <div className="w-full space-y-2.5 pt-1">
                <div className="text-center bg-emerald-950/80 border border-emerald-500/60 p-2.5 rounded-2xl animate-pulse">
                  <div className="text-xs font-black text-emerald-300 uppercase tracking-wider">
                    ✓ Solution Verified ({ptMoves.length} Moves)
                  </div>
                </div>

                {weeklyStatus && !weeklyStatus.canPublish ? (
                  <div className="text-center bg-amber-950/80 border border-amber-500/60 p-2.5 rounded-2xl text-[11px] text-amber-200 leading-tight space-y-1.5">
                    <div className="font-bold uppercase tracking-wider text-amber-300 flex items-center justify-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-amber-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      Weekly Entry Limit (0/1 Available)
                    </div>
                    <p className="text-amber-300/80">
                      You have already submitted an entry for next week's competition ({weeklyStatus.nextWeekId}). You can still design and playtest puzzles freely!
                    </p>
                    <div className="pt-0.5 flex items-center justify-center gap-2">
                      <span className="text-[10px] font-mono text-amber-400">
                        Resets in: {formatCountdown(weeklyStatus.resetsAt)}
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowStatusModal(true)}
                        className="text-[10px] underline text-cyan-300 hover:text-white cursor-pointer font-bold"
                      >
                        View Schedule
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={(e) => handlePostPuzzleWithMoves(ptMoves, e)}
                    disabled={isPosting}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 disabled:opacity-50 text-white font-extrabold text-xs uppercase tracking-wider transition-all hover:scale-102 active:scale-98 shadow-[0_0_20px_rgba(168,85,247,0.5)] cursor-pointer border border-purple-400/50 flex items-center justify-center gap-2"
                  >
                    {isPosting ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Posting to Reddit & Entering Contest...</span>
                      </>
                    ) : (
                      <span>Post to Reddit & Enter Next Week's Contest</span>
                    )}
                  </button>
                )}
              </div>
            ) : (
              /* D-Pad Controls */
              <div className="flex flex-col items-center gap-1 py-1">
                <button
                  type="button"
                  onClick={() => executeMove('Up')}
                  disabled={isPosting}
                  className="w-12 h-9 bg-white/10 hover:bg-white/20 active:bg-cyan-500 active:text-black disabled:opacity-50 text-white font-bold rounded-t-lg flex items-center justify-center border border-white/20 shadow cursor-pointer text-xs"
                >
                  ▲
                </button>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => executeMove('Left')}
                    disabled={isPosting}
                    className="w-12 h-9 bg-white/10 hover:bg-white/20 active:bg-cyan-500 active:text-black disabled:opacity-50 text-white font-bold rounded-l-lg flex items-center justify-center border border-white/20 shadow cursor-pointer text-xs"
                  >
                    ◀
                  </button>
                  <button
                    type="button"
                    onClick={() => executeMove('Down')}
                    disabled={isPosting}
                    className="w-12 h-9 bg-white/10 hover:bg-white/20 active:bg-cyan-500 active:text-black disabled:opacity-50 text-white font-bold flex items-center justify-center border border-white/20 shadow cursor-pointer text-xs"
                  >
                    ▼
                  </button>
                  <button
                    type="button"
                    onClick={() => executeMove('Right')}
                    disabled={isPosting}
                    className="w-12 h-9 bg-white/10 hover:bg-white/20 active:bg-cyan-500 active:text-black disabled:opacity-50 text-white font-bold rounded-r-lg flex items-center justify-center border border-white/20 shadow cursor-pointer text-xs"
                  >
                    ▶
                  </button>
                </div>
              </div>
            )}

            {/* Retry & Back to Editor Action Buttons */}
            <div className="flex gap-2 w-full pt-1">
              <button
                onClick={startPlaytest}
                disabled={isPosting}
                className="flex-1 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer border border-white/10"
              >
                Retry
              </button>
              <button
                onClick={stopPlaytest}
                disabled={isPosting}
                className="flex-1 py-2 rounded-xl bg-gray-700 hover:bg-gray-600 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer border border-white/10"
              >
                Back to Editor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Published Post Modal Overlay */}
      {publishedPostUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="glass-panel max-w-md w-full p-6 rounded-3xl border border-purple-500/40 text-white text-center space-y-4 shadow-2xl shadow-black/60 animate-float">
            <div className="w-14 h-14 rounded-full bg-purple-500/20 border border-purple-400/40 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(168,85,247,0.5)]">
              <svg className="w-7 h-7 text-purple-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            
            <h3 className="text-2xl font-black neon-text-title tracking-tight">
              Puzzle Published!
            </h3>

            <p className="text-xs text-zinc-300 font-mono leading-relaxed">
              Your custom challenge puzzle has been posted to Reddit and entered into next week's Weekly Creator Competition!
            </p>

            <div className="flex flex-col gap-2.5 pt-2">
              <button
                onClick={() => {
                  navigateTo(publishedPostUrl);
                }}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg hover:scale-102 active:scale-98 transition-all cursor-pointer"
              >
                View Post on Reddit ↗
              </button>
              <button
                onClick={() => setPublishedPostUrl(null)}
                className="w-full py-2 rounded-xl bg-white/10 hover:bg-white/20 text-zinc-300 font-bold text-xs transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Weekly Submission Eligibility & Reset Schedule Modal */}
      {showStatusModal && (
        <div
          onClick={() => setShowStatusModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn select-none"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/95 p-5 sm:p-6 shadow-2xl shadow-purple-950/50 text-white overflow-hidden animate-float"
          >
            {/* Decorative Ambient Background Glows */}
            <div
              className={`absolute -top-20 -left-20 w-44 h-44 rounded-full blur-3xl pointer-events-none opacity-30 ${
                weeklyStatus?.canPublish ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
            <div className="absolute -bottom-20 -right-20 w-44 h-44 rounded-full blur-3xl pointer-events-none opacity-20 bg-purple-500" />

            {/* Modal Header: Status Pill & Close Button */}
            <div className="relative flex items-center justify-between mb-4">
              {isLoadingStatus ? (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-white/10 text-[11px] font-bold text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  <span>Checking Eligibility...</span>
                </div>
              ) : weeklyStatus?.canPublish ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-extrabold text-emerald-400 tracking-wider uppercase">
                  <svg className="w-3.5 h-3.5 text-emerald-400 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>1 / 1 Post Available</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-[11px] font-extrabold text-amber-400 tracking-wider uppercase">
                  <svg className="w-3.5 h-3.5 text-amber-400 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  <span>Weekly Limit Reached (0 / 1)</span>
                </div>
              )}

              <button
                type="button"
                onClick={() => setShowStatusModal(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-all cursor-pointer"
                title="Close"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Status Hero Illustration & Title */}
            <div className="relative mb-5 text-center">
              <div
                className={`mx-auto w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center border shadow-xl mb-3 ${
                  weeklyStatus?.canPublish
                    ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400 shadow-emerald-900/30'
                    : 'bg-amber-950/60 border-amber-500/40 text-amber-400 shadow-amber-900/30'
                }`}
              >
                {weeklyStatus?.canPublish ? (
                  <svg className="w-7 h-7 sm:w-8 sm:h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                ) : (
                  <svg className="w-7 h-7 sm:w-8 sm:h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                )}
              </div>

              <h3 className="text-lg sm:text-xl font-black tracking-tight text-white mb-1.5">
                {isLoadingStatus
                  ? 'Checking Submission Eligibility...'
                  : weeklyStatus?.canPublish
                  ? 'You Are Eligible to Post!'
                  : 'Weekly Limit Reached (1/1 Used)'}
              </h3>

              <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                {isLoadingStatus
                  ? 'Checking with Reddit to verify your weekly creator status...'
                  : weeklyStatus?.canPublish
                  ? "You have 1 Reddit post available this week. Once you design, playtest, and verify your puzzle solution, you can publish it directly to Reddit to enter next week's Community Showcase competition!"
                  : "You've already submitted a custom puzzle for next week's competition. Each creator can publish 1 contest entry per weekly cycle."}
              </p>
            </div>

            {/* Reset Countdown Highlight Card */}
            {weeklyStatus && (
              <div className="relative mb-4 p-3.5 sm:p-4 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    Weekly Limit Resets In
                  </span>
                  <span className="text-xs font-mono font-bold text-cyan-400">
                    {formatCountdown(weeklyStatus.resetsAt)}
                  </span>
                </div>

                <div className="text-sm sm:text-base font-black font-mono tracking-tight text-white mb-0.5">
                  {formatResetDate(weeklyStatus.resetsAt).utc}
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  {formatResetDate(weeklyStatus.resetsAt).local} (Local Time)
                </div>
              </div>
            )}

            {/* Creator Freedom Tip Box */}
            <div className="relative mb-5 p-3 rounded-xl bg-purple-950/30 border border-purple-500/20 text-[11px] text-purple-200/90 leading-tight flex items-start gap-2.5">
              <svg className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div>
                <span className="font-bold text-purple-300">Unlimited Creation: </span>
                You can build, test portals, and verify solutions in the Maker freely at any time, even while your Reddit post is on cooldown.
              </div>
            </div>

            {/* Action Button */}
            <button
              type="button"
              onClick={() => setShowStatusModal(false)}
              className={`w-full py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-lg cursor-pointer active:scale-98 ${
                weeklyStatus?.canPublish
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-emerald-500/20'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-500/20'
              }`}
            >
              {weeklyStatus?.canPublish ? 'Start Building & Designing' : 'Got It, Let’s Build'}
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
