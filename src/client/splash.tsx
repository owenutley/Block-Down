/* eslint-disable @typescript-eslint/no-explicit-any */
import './index.css';

import { requestExpandedMode } from '@devvit/web/client';
import { StrictMode, useEffect, useState, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { trpc } from './trpc';
import { convertPuzzleToLevelConfig, getNextPosWithPortals } from './utils/puzzle';
import { ThemeBoardRenderer } from './components/ThemeBoardRenderer';
import { THEMES, DEFAULT_THEME_CONFIGS, getThemeBgClass, getBaseThemeId } from '../shared/themes';
import { PuzzleShape } from './components/PuzzleShape';

const positionKey = (x: number, y: number) => `${x},${y}`;

const getNextState = (
  player: { x: number; y: number },
  blocks: any[],
  dir: { x: number; y: number },
  levelConfig: any
) => {
  if (!dir || (dir.x === 0 && dir.y === 0)) return { player, blocks };

  const newPos = { x: player.x + dir.x, y: player.y + dir.y };
  const wallSet = new Set<string>(levelConfig.walls.map((w: any) => positionKey(w.x, w.y)));
  const blockMap = new Map(blocks.map((block, idx) => [positionKey(block.pos.x, block.pos.y), idx]));

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

  const pushBlock = (blockPos: { x: number; y: number }, pushDir: { x: number; y: number }) => {
    return getNextPosWithPortals(
      blockPos,
      pushDir,
      levelConfig.gridSize,
      wallSet,
      blocks.map((b: any) => b.pos),
      levelConfig.portals || []
    );
  };

  if (!canOccupy(newPos, false)) {
    return { player, blocks };
  }

  const newBlockPositions = [...blocks];

  const blockIdx = blockMap.get(positionKey(newPos.x, newPos.y));
  if (blockIdx !== undefined) {
    const block = blocks[blockIdx];
    if (!block) return { player, blocks };
    const oldBlockPos = block.pos;
    const blockNewPos = pushBlock(oldBlockPos, dir);

    if (blockNewPos.x === oldBlockPos.x && blockNewPos.y === oldBlockPos.y) {
      return { player, blocks };
    }

    newBlockPositions[blockIdx] = { ...block, pos: blockNewPos };
  }

  return { player: newPos, blocks: newBlockPositions };
};

export const Splash = () => {
  const [levelConfig, setLevelConfig] = useState<any>(null);
  const [playerPos, setPlayerPos] = useState<any>(null);
  const [blockPositions, setBlockPositions] = useState<any[]>([]);
  const [dailyNumber, setDailyNumber] = useState<number | null>(null);
  const [currency, setCurrency] = useState<number | null>(null);
  const [streak, setStreak] = useState<number>(0);

  const [lastAction, setLastAction] = useState<'move' | 'reset'>('reset');
  const prevPlayerPos = useRef<any>(null);
  const prevBlockPositions = useRef<any[]>([]);
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [totalCompletions, setTotalCompletions] = useState<number>(0);
  const loadedNumberRef = useRef<number | null>(null);

  const dailyNumVal = dailyNumber || 1;
  const themeIndex = (dailyNumVal - 1) % THEMES.length;
  const activeTheme = THEMES[themeIndex]?.id || 'neon';
  const baseTheme = getBaseThemeId(activeTheme);
  const activeThemeStyle = THEMES[themeIndex];
  const themeConfig = DEFAULT_THEME_CONFIGS[baseTheme] || DEFAULT_THEME_CONFIGS.neon;
  const activeCharacter = THEMES[themeIndex]?.id || 'neon';

  useEffect(() => {
    prevPlayerPos.current = playerPos;
    prevBlockPositions.current = blockPositions;
  }, [playerPos, blockPositions]);

  useEffect(() => {
    const fetchSplash = async () => {
      if (selectedNumber !== null && loadedNumberRef.current === selectedNumber) {
        return;
      }

      try {
        if (currency === null) {
          try {
            const res = await trpc.currency.get.query();
            setCurrency(res.currency);
          } catch (err) {
            console.error('Failed to fetch currency:', err);
          }
        }

        const queryInput = selectedNumber !== null ? { dailyNumber: selectedNumber } : undefined;
        const postPuzzle = await trpc.puzzle.getForPost.query(queryInput);
        if (postPuzzle) {
          loadedNumberRef.current = postPuzzle.number;
          setDailyNumber(postPuzzle.number);
          if (selectedNumber === null) {
            setSelectedNumber(postPuzzle.number);
          }
          setIsCompleted(postPuzzle.isCompleted);
          setTotalCompletions(postPuzzle.totalCompletions);
          if (postPuzzle.streak) {
            setStreak(postPuzzle.streak.currentStreak);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNumber]);

  useEffect(() => {
    if (!levelConfig) return;

    setLastAction('reset');
    setPlayerPos(levelConfig.startPos);
    setBlockPositions(levelConfig.blocks);

    if (!levelConfig.moves || levelConfig.moves.length === 0) return;

    const movesToPlay = levelConfig.moves.slice(0, 10);
    let currentIndex = 0;
    let intervalId: any;
    let restartTimeoutId: any;

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

    const playNextMove = () => {
      if (currentIndex < movesToPlay.length) {
        const nextMove = movesToPlay[currentIndex];
        if (nextMove) {
          const dirVec = parseMoveDirection(nextMove);
          const nextState = getNextState(currentPlayerPos, currentBlockPositions, dirVec, levelConfig);
          currentPlayerPos = nextState.player;
          currentBlockPositions = nextState.blocks;
          setLastAction('move');
          setPlayerPos(currentPlayerPos);
          setBlockPositions(currentBlockPositions);
        }
        currentIndex++;
      } else {
        clearInterval(intervalId);
        restartTimeoutId = setTimeout(() => {
          currentPlayerPos = { ...levelConfig.startPos };
          currentBlockPositions = levelConfig.blocks.map((b: any) => ({ ...b, pos: { ...b.pos } }));
          setLastAction('reset');
          setPlayerPos(currentPlayerPos);
          setBlockPositions(currentBlockPositions);
          currentIndex = 0;
          intervalId = setInterval(playNextMove, 800);
        }, 2500);
      }
    };

    intervalId = setInterval(playNextMove, 800);

    return () => {
      clearInterval(intervalId);
      clearTimeout(restartTimeoutId);
    };
  }, [levelConfig]);
  return (
    <div className={`relative flex h-[100dvh] w-full overflow-hidden flex-col items-center justify-between gap-2 sm:gap-4 ${getThemeBgClass(activeTheme, activeThemeStyle)} px-4 py-4 sm:py-6`}>

      <div className="absolute top-4 left-4 z-50 pointer-events-none">
        <button
          onClick={(e) => requestExpandedMode(e.nativeEvent, 'menu')}
          className="pointer-events-auto flex items-center bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.15)] hover:border-cyan-400/50 hover:scale-105 active:scale-95 transition-all text-white font-extrabold text-[11px] tracking-wide cursor-pointer select-none"
        >
          Menu
        </button>
      </div>

      <div className="absolute top-4 right-4 z-50 pointer-events-none flex items-center gap-1.5">
        {streak > 0 && (
          <div className="pointer-events-auto flex items-center gap-1.5 bg-red-950/85 backdrop-blur-md px-2.5 py-1 rounded-full border border-red-500/60 shadow-[0_0_12px_rgba(239,68,68,0.35)] select-none" title={`${streak} Day Streak!`}>
            <div className="w-3.5 h-3.5 bg-red-500/20 border border-red-400/40 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.6)] flex items-center justify-center text-red-400 p-0.5 shrink-0">
              <PuzzleShape shape="fire" className="w-full h-full" />
            </div>
            <span className="text-red-300 font-black text-[10px] tracking-wide font-mono">
              {streak}
            </span>
          </div>
        )}
        {currency !== null && (
          <div className="pointer-events-auto flex items-center gap-1 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.15)] hover:border-cyan-400/50 transition-all select-none">
            <span className="text-cyan-400 text-[13px] font-black animate-pulse drop-shadow-[0_0_3px_rgba(34,211,238,0.8)]">✦</span>
            <span className="text-white font-extrabold text-[11px] tracking-wide font-mono">
              {currency}
            </span>
          </div>
        )}
      </div>

      {/* Header Section */}
      <div className="flex flex-col items-center shrink-0 gap-0.5 sm:gap-1.5">
        {dailyNumber !== null ? (
          <h1 className="text-center text-3xl sm:text-4xl lg:text-5xl font-black neon-text-title tracking-tight animate-fade-in">
            Puzzle #{dailyNumber}
          </h1>
        ) : (
          <h1 className="text-center text-3xl sm:text-4xl lg:text-5xl font-black neon-text-title tracking-tight animate-pulse">
            Puzzle
          </h1>
        )}

        {/* Completion badge and player count */}
        {dailyNumber !== null && (
          <div className="flex flex-row items-center justify-center gap-2 mt-0.5 sm:mt-1 animate-fade-in">
            {isCompleted && (
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] sm:text-xs font-black uppercase tracking-wider shadow-[0_0_8px_rgba(16,185,129,0.2)] animate-bounce-subtle">
                ✓ Solved
              </span>
            )}
            <span className="text-[10px] sm:text-[11px] text-white/60 font-bold uppercase tracking-wide">
              {totalCompletions} {totalCompletions === 1 ? 'Player Has' : 'Players Have'} Solved
            </span>
          </div>
        )}
      </div>

      {/* Game Preview Section */}
      <div className="flex-1 w-full min-h-0 flex items-center justify-center select-none px-2">
        <div className="flex items-center justify-center w-full">
          {/* Center board preview */}
          <div className="pointer-events-none shrink-0 flex justify-center">
            {levelConfig && playerPos && blockPositions && (
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
              />
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-center items-center shrink-0 w-full mb-2">
        <button
          className="flex h-12 w-full max-w-xs cursor-pointer items-center justify-center rounded-2xl theme-btn px-6 text-lg font-bold shadow-lg hover:scale-102 active:scale-98 transition-all"
          onClick={(e) => requestExpandedMode(e.nativeEvent, 'game')}
        >
          Play This Puzzle
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
