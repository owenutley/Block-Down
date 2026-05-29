/* eslint-disable @typescript-eslint/no-explicit-any */
import './index.css';

import { requestExpandedMode } from '@devvit/web/client';
import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { trpc } from './trpc';
import { convertPuzzleToLevelConfig } from './utils/puzzle';
import { PuzzleShape } from './components/PuzzleShape';

const getBlockColors = (blockType: string) => {
  switch (blockType) {
    case 'red-circle':
      return { text: 'text-red-500', border: 'border border-red-500/80 neon-red', shadow: 'shadow-[0_0_15px_rgba(239,68,68,0.5)]' };
    case 'blue-square':
      return { text: 'text-blue-500', border: 'border border-blue-500/80 neon-blue', shadow: 'shadow-[0_0_15px_rgba(59,130,246,0.5)]' };
    case 'yellow-triangle':
      return { text: 'text-yellow-400', border: 'border border-yellow-400/80 neon-yellow', shadow: 'shadow-[0_0_15px_rgba(250,204,21,0.5)]' };
    case 'purple-star':
      return { text: 'text-purple-500', border: 'border border-purple-500/80 neon-purple', shadow: 'shadow-[0_0_15px_rgba(168,85,247,0.5)]' };
    case 'green-leaf':
      return { text: 'text-green-500', border: 'border border-green-500/80 neon-green', shadow: 'shadow-[0_0_15px_rgba(34,197,94,0.5)]' };
    case 'orange-block':
      return { text: 'text-orange-500', border: 'border border-orange-500/80 neon-orange', shadow: 'shadow-[0_0_15px_rgba(249,115,22,0.5)]' };
    default:
      return { text: 'text-white', border: 'border border-white/50', shadow: '' };
  }
};

const getDestinationStyle = (destType: string) => {
  switch (destType) {
    case 'red-circle':
      return { bg: 'bg-red-950/20', border: 'border border-red-500/50 border-dashed neon-red', text: 'text-red-500', emoji: '' };
    case 'blue-square':
      return { bg: 'bg-blue-950/20', border: 'border border-blue-500/50 border-dashed neon-blue', text: 'text-blue-500', emoji: '' };
    case 'yellow-triangle':
      return { bg: 'bg-yellow-950/20', border: 'border border-yellow-500/50 border-dashed neon-yellow', text: 'text-yellow-400', emoji: '' };
    case 'purple-star':
      return { bg: 'bg-purple-950/20', border: 'border border-purple-500/50 border-dashed neon-purple', text: 'text-purple-500', emoji: '' };
    case 'green-leaf':
      return { bg: 'bg-green-950/20', border: 'border border-green-500/50 border-dashed neon-green', text: 'text-green-500', emoji: '' };
    case 'orange-block':
      return { bg: 'bg-orange-950/20', border: 'border border-orange-500/50 border-dashed neon-orange', text: 'text-orange-500', emoji: '' };
    default:
      return { bg: 'bg-white/10', border: 'border border-white/30 border-dashed', text: 'text-white', emoji: '' };
  }
};

const positionKey = (x: number, y: number) => `${x},${y}`;

const getNextState = (
  player: { x: number; y: number },
  blocks: any[],
  directionStr: string,
  levelConfig: any
) => {
  let dir = { x: 0, y: 0 };
  switch (directionStr.toLowerCase()) {
    case 'up': dir = { x: 0, y: -1 }; break;
    case 'down': dir = { x: 0, y: 1 }; break;
    case 'left': dir = { x: -1, y: 0 }; break;
    case 'right': dir = { x: 1, y: 0 }; break;
    default: return { player, blocks };
  }

  const newPos = { x: player.x + dir.x, y: player.y + dir.y };

  const wallSet = new Set(levelConfig.walls.map((w: any) => positionKey(w.x, w.y)));
  const blockMap = new Map(blocks.map((block, idx) => [positionKey(block.pos.x, block.pos.y), idx]));

  const canOccupy = (pos: { x: number; y: number }, includeBlocks: boolean = true) => {
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
    let currentPos = { ...blockPos };
    let nextPos = { x: currentPos.x + pushDir.x, y: currentPos.y + pushDir.y };

    while (canOccupy(nextPos, false) && !wallSet.has(positionKey(nextPos.x, nextPos.y))) {
      const blockAtNext = blockMap.has(positionKey(nextPos.x, nextPos.y));
      if (blockAtNext) {
        break;
      }
      currentPos = nextPos;
      nextPos = { x: currentPos.x + pushDir.x, y: currentPos.y + pushDir.y };
    }

    return currentPos;
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
  const [stats, setStats] = useState<any>(null);
  const [dailyNumber, setDailyNumber] = useState<number | null>(null);
  const [currency, setCurrency] = useState<number | null>(null);

  useEffect(() => {
    const fetchSplash = async () => {
      try {
        // Fetch currency
        try {
          const res = await trpc.currency.get.query();
          setCurrency(res.currency);
        } catch (err) {
          console.error('Failed to fetch currency:', err);
        }

        // Fetch puzzle and daily number for current post
        const postPuzzle = await trpc.puzzle.getForPost.query();
        if (postPuzzle?.puzzle) {
          setDailyNumber(postPuzzle.number);
          const config = convertPuzzleToLevelConfig(postPuzzle.puzzle);
          setLevelConfig(config);

          const puzzleStats = await trpc.puzzle.getStats.query(postPuzzle.puzzle.id);
          setStats(puzzleStats);
        }
      } catch (e) {
        console.error('Failed to load puzzle for splash', e);
      }
    };
    void fetchSplash();
  }, []);

  useEffect(() => {
    if (!levelConfig) return;

    setPlayerPos(levelConfig.startPos);
    setBlockPositions(levelConfig.blocks);

    if (!levelConfig.moves || levelConfig.moves.length === 0) return;

    const movesToPlay = levelConfig.moves.slice(0, 10);
    let currentIndex = 0;
    let intervalId: any;
    let restartTimeoutId: any;

    let currentPlayerPos = { ...levelConfig.startPos };
    let currentBlockPositions = levelConfig.blocks.map((b: any) => ({ ...b, pos: { ...b.pos } }));

    const playNextMove = () => {
      if (currentIndex < movesToPlay.length) {
        const nextMove = movesToPlay[currentIndex];
        if (nextMove) {
          const nextState = getNextState(currentPlayerPos, currentBlockPositions, nextMove, levelConfig);
          currentPlayerPos = nextState.player;
          currentBlockPositions = nextState.blocks;
          setPlayerPos(currentPlayerPos);
          setBlockPositions(currentBlockPositions);
        }
        currentIndex++;
      } else {
        clearInterval(intervalId);
        restartTimeoutId = setTimeout(() => {
          currentPlayerPos = { ...levelConfig.startPos };
          currentBlockPositions = levelConfig.blocks.map((b: any) => ({ ...b, pos: { ...b.pos } }));
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

  const wallSet = levelConfig ? new Set(levelConfig.walls.map((w: any) => positionKey(w.x, w.y))) : new Set();
  const destinationMap = levelConfig ? new Map(levelConfig.destinations.map((d: any) => [positionKey(d.pos.x, d.pos.y), d])) : new Map();
  const gridSize = levelConfig ? levelConfig.gridSize : 9;

  return (
    <div className="relative flex h-[100dvh] w-full overflow-hidden flex-col items-center justify-between gap-4 bg-mesh-gradient px-4 py-6 sm:py-8">

      {currency !== null && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-1.5 bg-black/50 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)] hover:border-cyan-400/50 transition-all select-none">
            <span className="text-cyan-400 text-base font-black animate-pulse drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]">✦</span>
            <span className="text-white font-extrabold text-[13px] tracking-wide font-mono">
              {currency} <span className="text-cyan-300 font-bold uppercase text-[9px] tracking-widest ml-1">SHARDS</span>
            </span>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col items-center shrink-0">
        <h1 className="text-center text-4xl sm:text-5xl font-black neon-text-title tracking-tight">
          Block Down
        </h1>
        {dailyNumber !== null && (
          <p className="text-center text-sm sm:text-base font-semibold text-white/70 mt-1">
            Daily Puzzle #{dailyNumber}
          </p>
        )}
        {levelConfig && (
          <div className="flex gap-2 mt-3 bg-black/45 border border-white/5 py-1.5 px-4 rounded-full text-xs font-semibold text-white/85 shadow-md backdrop-blur-sm">
            <span>🏆 {stats?.totalCompletions || 0} Solves</span>
          </div>
        )}
      </div>

      {/* Game Preview Section */}
      <div className="flex-1 w-full min-h-0 flex items-center justify-center pointer-events-none select-none">
        <div
          className="glass-panel p-1 sm:p-2 relative rounded-2xl sm:rounded-3xl shadow-2xl"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
            gap: '1px',
            height: '100%',
            maxHeight: '400px',
            aspectRatio: '1'
          }}
        >
          {Array.from({ length: gridSize * gridSize }).map((_, i) => {
            const x = i % gridSize;
            const y = Math.floor(i / gridSize);
            const key = positionKey(x, y);

            const hasWall = wallSet.has(key);
            const destination = destinationMap.get(key);
            const hasDestination = destination !== undefined;

            let bgColor = 'glass-cell';
            let borderStyle = '';
            let shadowStyle = '';
            let radiusStyle = 'rounded-md sm:rounded-lg md:rounded-xl';

            const destStyle = hasDestination ? getDestinationStyle(destination.type) : null;

            if (hasWall) {
              bgColor = 'wall-cell';
              borderStyle = '';
              shadowStyle = '';
              radiusStyle = 'rounded-none';
            } else if (hasDestination && destStyle) {
              bgColor = `${destStyle.bg} animate-pulse-glow bg-opacity-40 backdrop-blur-sm`;
              borderStyle = `${destStyle.border} ${destStyle.text}`;
            }

            return (
              <div
                key={i}
                className={`aspect-square w-full h-full ${radiusStyle} flex items-center justify-center text-xs sm:text-lg font-bold ${bgColor} ${borderStyle} ${shadowStyle}`}
              >
                {hasDestination && (
                  <PuzzleShape type={destination.type} className="w-1/2 h-1/2 opacity-35" />
                )}
              </div>
            );
          })}

          <div
            className="absolute"
            style={{
              top: 'var(--grid-padding)',
              left: 'var(--grid-padding)',
              right: 'var(--grid-padding)',
              bottom: 'var(--grid-padding)',
            }}
          >
            {blockPositions.map((block, idx) => {
              const destination = destinationMap.get(positionKey(block.pos.x, block.pos.y));
              const isOnDestination = destination !== undefined;
              const isCorrectDestination = isOnDestination && destination!.type === block.type;

              const colors = getBlockColors(block.type);
              let content;

              if (isCorrectDestination) {
                content = (
                  <div className={`w-full h-full rounded-md sm:rounded-lg md:rounded-xl flex items-center justify-center bg-black/40 ${colors.border} ${colors.text} border-2 border-white shadow-[0_0_25px_rgba(255,255,255,0.9)] animate-pulse-glow`}>
                    <PuzzleShape type={block.type} className="w-1/2 h-1/2 text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.9)]" />
                  </div>
                );
              } else {
                content = (
                  <div className={`w-full h-full rounded-md sm:rounded-lg md:rounded-xl flex items-center justify-center bg-black/75 ${colors.border} ${colors.shadow} ${colors.text} backdrop-blur-sm`}>
                    <PuzzleShape type={block.type} className="w-1/2 h-1/2" />
                  </div>
                );
              }

              return (
                <div
                  key={`block-${idx}`}
                  className="absolute animate-slide aspect-square"
                  style={{
                    width: `calc(100% / ${gridSize} - 1px)`,
                    height: `calc(100% / ${gridSize} - 1px)`,
                    transform: `translate(calc(${block.pos.x} * 100% + ${block.pos.x} * 1px), calc(${block.pos.y} * 100% + ${block.pos.y} * 1px))`,
                  }}
                >
                  {content}
                </div>
              );
            })}

            {playerPos && (
              <div
                className="absolute animate-slide aspect-square"
                style={{
                  width: `calc(100% / ${gridSize} - 1px)`,
                  height: `calc(100% / ${gridSize} - 1px)`,
                  transform: `translate(calc(${playerPos.x} * 100% + ${playerPos.x} * 1px), calc(${playerPos.y} * 100% + ${playerPos.y} * 1px))`,
                }}
              >
                <div className="w-full h-full rounded-full flex items-center justify-center bg-black/75 border-2 border-white shadow-[0_0_15px_rgba(255,255,255,0.7)] relative overflow-hidden animate-pulse">
                  {/* Inner glowing core */}
                  <div className="w-1/3 h-1/3 bg-white rounded-full shadow-[0_0_12px_rgba(255,255,255,1)]"></div>
                  {/* Outer ring */}
                  <div className="absolute inset-0.5 border border-dashed border-white/25 rounded-full animate-[spin_8s_linear_infinite]"></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs sm:max-w-md justify-center items-center shrink-0">
        <button
          className="flex h-12 w-full max-w-xs cursor-pointer items-center justify-center rounded-2xl theme-btn px-6 text-lg font-bold shadow-lg"
          onClick={(e) => requestExpandedMode(e.nativeEvent, 'game')}
        >
          Play This Puzzle
        </button>
        <button
          className="flex h-12 w-full max-w-xs cursor-pointer items-center justify-center rounded-2xl theme-btn px-6 text-lg font-bold shadow-lg"
          onClick={(e) => requestExpandedMode(e.nativeEvent, 'menu')}
        >
          Other Puzzles
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
