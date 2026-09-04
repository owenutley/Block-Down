import { useState, useEffect, useRef } from 'react';
import { showToast, navigateTo } from '@devvit/web/client';
import { trpc } from '../trpc';
import { ThemeId, getThemeBgClass, Theme, ThemeConfig, DEFAULT_THEME_CONFIGS, THEMES, CHARACTERS, GameCharacter } from '../../shared/themes';
import { ThemeBoardRenderer, getBlockColors } from '../components/ThemeBoardRenderer';
import { Position, BlockData, DestinationData, PuzzlePortal } from '../types';
import { colorToBlockType, dirToVector, getNextPosWithPortalsDetails } from '../utils/puzzle';

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
  const currentConfig = (themeConfigs && (themeConfigs as Record<string, ThemeConfig>)[selectedTheme]) || DEFAULT_THEME_CONFIGS[selectedTheme] || themeConfig || DEFAULT_THEME_CONFIGS.neon;
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

  // Playtest States
  const [isPlaytesting, setIsPlaytesting] = useState(false);
  const [ptPlayer, setPtPlayer] = useState<Position>({ x: 1, y: 1 });
  const [ptBlocks, setPtBlocks] = useState<{ id: string; color: string; x: number; y: number }[]>([]);
  const [ptMoves, setPtMoves] = useState<string[]>([]);
  const [ptSolved, setPtSolved] = useState(false);

  const prevBlocksRef = useRef<BlockData[]>([]);
  const prevPlayerRef = useRef<Position>({ x: 1, y: 1 });
  const [lastAction, setLastAction] = useState<'move' | 'teleport' | 'reset' | 'load'>('load');

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
      setWalls(walls.filter((w) => !(w.x === x && w.y === y)));
      setBlocks(blocks.filter((b) => !(b.x === x && b.y === y)));
      setTargets(targets.filter((t) => !(t.x === x && t.y === y)));
      setPortals(portals.filter((p) => !(p.x === x && p.y === y)));
    }
  };

  // Playtest Controls
  const startPlaytest = () => {
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
    let newBlocks = ptBlocks.map((b) => ({ ...b }));
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
          showToast({ text: '🎉 Puzzle Solved & Verified! Click "Post to Reddit" below to publish.', appearance: 'success' });
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
  const handlePostPuzzleWithMoves = async (solutionMoves: string[]) => {
    if (isPosting) return;

    setIsPosting(true);
    try {
      const res = await trpc.puzzle.publishCustomPuzzle.mutate({
        name: 'Custom Challenge',
        startPos: player,
        walls,
        blocks,
        targets,
        portals,
        solutionMoves,
        par: solutionMoves.length > 0 ? solutionMoves.length : 10,
        theme: selectedTheme,
        character: selectedCharacter,
      });

      if (res?.success) {
        showToast({ text: '🎉 Solution Verified & Posted to Reddit!', appearance: 'success' });
        if (res.postUrl) {
          setPublishedPostUrl(res.postUrl);
        }
      } else {
        showToast({ text: 'Failed to post puzzle to Reddit.', appearance: 'neutral' });
      }
    } catch (err) {
      console.error('Failed to post custom puzzle:', err);
      showToast({ text: 'Error posting puzzle to Reddit.', appearance: 'neutral' });
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
    color: p.color as any,
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
          className="px-3 py-1 sm:px-3.5 sm:py-1.5 bg-black/60 backdrop-blur-md border border-cyan-500/30 text-white rounded-xl font-bold text-[11px] sm:text-sm transition-all hover:scale-105 active:scale-95 shadow-md cursor-pointer flex items-center gap-1.5"
        >
          <span>← Back to Menu</span>
        </button>

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
                  onClick={() => setSelectedTool(t)}
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

          {/* Tool Color Palette */}
          {(selectedTool === 'block' || selectedTool === 'target' || selectedTool === 'portal') && (
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-cyan-400 mb-1">
                Color Theme Palette
              </label>
              <div className="flex gap-2 flex-wrap items-center bg-black/40 p-1.5 rounded-2xl border border-white/10">
                {['red', 'blue', 'yellow', 'purple', 'green', 'orange', 'gray'].map((c) => {
                  const themeColorInfo = getBlockColors(currentConfig, selectedTheme, colorToBlockType(c));
                  const isSelected = selectedColor === c;

                  return (
                    <button
                      key={c}
                      type="button"
                      disabled={isPlaytesting}
                      onClick={() => setSelectedColor(c)}
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
          )}

          {/* Action Bar */}
          <div className="pt-1 flex gap-2">
            <button
              onClick={handleSolveAndPostClick}
              disabled={isPosting}
              className="flex-1 py-2 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 disabled:opacity-50 text-white font-extrabold text-xs transition-all hover:scale-102 active:scale-98 cursor-pointer border border-purple-400/50 flex items-center justify-center gap-1.5"
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
              className="py-2 px-3 rounded-xl bg-red-950/60 hover:bg-red-900/80 border border-red-500/40 text-red-300 font-bold text-xs transition-all cursor-pointer disabled:opacity-40"
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
                    onClick={() => setSelectedTool(t)}
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
              <label className="block text-[11px] sm:text-xs font-bold uppercase tracking-wider text-cyan-400 mb-1.5">
                Color Theme Palette
              </label>
              <div className="flex gap-2 items-center bg-black/40 p-2 rounded-2xl border border-white/10">
                {['red', 'blue', 'yellow', 'purple', 'green', 'orange', 'gray'].map((c) => {
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
          
          {/* Card 2 (Bottom Row Left): Bot, Wall, Eraser & Action Buttons */}
          <div className="col-span-5 flex flex-col max-h-full overflow-y-auto no-scrollbar justify-center">
            <div className="glass-panel p-3.5 sm:p-4 rounded-3xl border border-cyan-500/30 text-white shadow-xl shadow-black/50 space-y-3.5">
              
              <div>
                <label className="block text-[11px] sm:text-xs font-bold uppercase tracking-wider text-cyan-400 mb-1.5">
                  Structure & Bot Tools
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['player', 'wall', 'eraser'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      disabled={isPlaytesting}
                      onClick={() => setSelectedTool(t)}
                      className={`py-2 px-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer border ${
                        selectedTool === t
                          ? 'bg-cyan-500 text-black border-white shadow-[0_0_12px_rgba(34,211,238,0.5)] scale-102'
                          : 'bg-black/40 text-zinc-300 border-white/10 hover:bg-white/10 disabled:opacity-40'
                      }`}
                    >
                      {t === 'player' && 'Bot'}
                      {t === 'wall' && 'Wall'}
                      {t === 'eraser' && 'Eraser'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons: Solve & Post + Clear */}
              <div className="pt-1.5 flex gap-2">
                <button
                  onClick={handleSolveAndPostClick}
                  disabled={isPosting}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 disabled:opacity-50 text-white font-extrabold text-xs uppercase tracking-wider transition-all hover:scale-102 active:scale-98 cursor-pointer border border-purple-400/50 flex items-center justify-center gap-1.5 shadow-md"
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
                  className="py-3 px-4 rounded-xl bg-red-950/60 hover:bg-red-900/80 border border-red-500/40 text-red-300 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer disabled:opacity-40"
                >
                  Clear
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

                <button
                  onClick={() => handlePostPuzzleWithMoves(ptMoves)}
                  disabled={isPosting}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 disabled:opacity-50 text-white font-extrabold text-xs uppercase tracking-wider transition-all hover:scale-102 active:scale-98 shadow-[0_0_20px_rgba(168,85,247,0.5)] cursor-pointer border border-purple-400/50 flex items-center justify-center gap-2"
                >
                  {isPosting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Posting to Reddit...</span>
                    </>
                  ) : (
                    <span>Post to Reddit</span>
                  )}
                </button>
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
            <div className="w-14 h-14 rounded-full bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-3xl mx-auto shadow-[0_0_20px_rgba(168,85,247,0.5)]">
              🚀
            </div>
            
            <h3 className="text-2xl font-black neon-text-title tracking-tight">
              Puzzle Published!
            </h3>

            <p className="text-xs text-zinc-300 font-mono leading-relaxed">
              Your custom challenge puzzle has been posted directly to Reddit for the community to play!
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
    </div>
  );
};
