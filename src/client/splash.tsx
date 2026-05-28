import './index.css';

import { requestExpandedMode } from '@devvit/web/client';
import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { trpc } from './trpc';



import { convertPuzzleToLevelConfig } from './utils/puzzle';

const getBlockStyle = (blockType: string) => {
  switch (blockType) {
    case 'red-circle': return { bg: 'bg-black/60', border: 'border border-red-500 neon-red', emoji: '', innerBg: 'bg-red-500' };
    case 'blue-square': return { bg: 'bg-black/60', border: 'border border-blue-500 neon-blue', emoji: '', innerBg: 'bg-blue-500' };
    case 'yellow-triangle': return { bg: 'bg-black/60', border: 'border border-yellow-400 neon-yellow', emoji: '', innerBg: 'bg-yellow-400' };
    case 'purple-star': return { bg: 'bg-black/60', border: 'border border-purple-500 neon-purple', emoji: '', innerBg: 'bg-purple-500' };
    case 'green-leaf': return { bg: 'bg-black/60', border: 'border border-green-500 neon-green', emoji: '', innerBg: 'bg-green-500' };
    case 'orange-block': return { bg: 'bg-black/60', border: 'border border-orange-500 neon-orange', emoji: '', innerBg: 'bg-orange-500' };
    default: return { bg: 'bg-black/60', border: 'border border-white/50', emoji: '', innerBg: 'bg-white' };
  }
};

const getDestinationStyle = (destType: string) => {
  switch (destType) {
    case 'red-circle': return { bg: 'bg-red-900/30', border: 'border border-red-500/80 border-dashed neon-red', emoji: '' };
    case 'blue-square': return { bg: 'bg-blue-900/30', border: 'border border-blue-500/80 border-dashed neon-blue', emoji: '' };
    case 'yellow-triangle': return { bg: 'bg-yellow-900/30', border: 'border border-yellow-500/80 border-dashed neon-yellow', emoji: '' };
    case 'purple-star': return { bg: 'bg-purple-900/30', border: 'border border-purple-500/80 border-dashed neon-purple', emoji: '' };
    case 'green-leaf': return { bg: 'bg-green-900/30', border: 'border border-green-500/80 border-dashed neon-green', emoji: '' };
    case 'orange-block': return { bg: 'bg-orange-900/30', border: 'border border-orange-500/80 border-dashed neon-orange', emoji: '' };
    default: return { bg: 'bg-white/10', border: 'border border-white/50 border-dashed', emoji: '' };
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

  let newBlockPositions = [...blocks];

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

  useEffect(() => {
    const fetchSplash = async () => {
      try {
        // Fetch daily puzzle number
        const number = await trpc.puzzle.getDailyNumber.query();
        setDailyNumber(number);

        const daily = await trpc.puzzle.getCurrentDaily.query();
        if (daily?.puzzle) {
          const config = convertPuzzleToLevelConfig(daily.puzzle);
          setLevelConfig(config);

          const puzzleStats = await trpc.puzzle.getStats.query(daily.puzzle.id);
          setStats(puzzleStats);
        } else {
          const activeSplash = await trpc.puzzle.getActive.query('splash');
          if (activeSplash) {
            const config = convertPuzzleToLevelConfig(activeSplash);
            setLevelConfig(config);

            const puzzleStats = await trpc.puzzle.getStats.query(activeSplash.id);
            setStats(puzzleStats);
          }
        }
      } catch (e) {
        console.error('Failed to load daily puzzle for splash', e);
      }
    };
    fetchSplash();
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
            let emoji = '';
            let shadowStyle = '';
            let radiusStyle = 'rounded-md sm:rounded-lg md:rounded-xl';

            if (hasWall) {
              bgColor = 'bg-gray-800/80 dark:bg-black/80 backdrop-blur-sm';
              borderStyle = 'border-2 border-gray-600';
              emoji = '';
              shadowStyle = 'shadow-inner';
              radiusStyle = 'rounded-none';
            } else if (hasDestination) {
              const destStyle = getDestinationStyle(destination!.type);
              bgColor = `${destStyle.bg} animate-pulse-glow bg-opacity-40 backdrop-blur-sm`;
              borderStyle = destStyle.border;
              emoji = destStyle.emoji;
            }

            return (
              <div
                key={i}
                className={`aspect-square w-full h-full ${radiusStyle} flex items-center justify-center text-xs sm:text-lg font-bold ${bgColor} ${borderStyle} ${shadowStyle}`}
              >
                {emoji}
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

              const blockStyle = getBlockStyle(block.type);
              let content;

              if (isCorrectDestination) {
                content = (
                  <div className={`w-full h-full rounded-md sm:rounded-lg md:rounded-xl flex items-center justify-center ${blockStyle.innerBg} shadow-[0_0_25px_rgba(255,255,255,1)] border-2 border-white/50 animate-pulse-glow`}>
                  </div>
                );
              } else {
                content = (
                  <div className={`w-full h-full rounded-md sm:rounded-lg md:rounded-xl flex items-center justify-center text-xs sm:text-lg font-bold ${blockStyle.bg} ${blockStyle.border}`}>
                    <div className={`w-1/2 h-1/2 rounded-full ${blockStyle.innerBg} shadow-[0_0_10px_rgba(255,255,255,0.8)]`}></div>
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
                <div className="w-full h-full rounded-full flex items-center justify-center bg-black/60 border border-white/80 neon-white">
                  <div className="w-1/2 h-1/2 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)]"></div>
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
          Play Daily Puzzle
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
