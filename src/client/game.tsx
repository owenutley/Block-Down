import './index.css';

import { StrictMode, useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';

type GameDifficulty = 'tutorial' | 'daily' | 'easy' | 'medium' | 'hard';
type BlockType = 'red-circle' | 'blue-square' | 'yellow-triangle' | 'purple-star' | 'green-leaf' | 'general';
type Position = { x: number; y: number };

interface BlockData {
  pos: Position;
  type: BlockType;
}

interface DestinationData {
  pos: Position;
  type: BlockType;
}

interface GameObject {
  type: 'wall' | 'block' | 'destination';
  pos: Position;
}

interface LevelConfig {
  walls: Position[];
  blocks: BlockData[];
  destinations: DestinationData[];
  startPos: Position;
}

const GRID_SIZE = 11;
const CENTER = Math.floor(GRID_SIZE / 2);

const LEVEL_CONFIGS: Record<GameDifficulty, LevelConfig> = {
  tutorial: {
    walls: [],
    blocks: [],
    destinations: [],
    startPos: { x: CENTER, y: CENTER },
  },
  daily: {
    walls: [],
    blocks: [],
    destinations: [],
    startPos: { x: CENTER, y: CENTER },
  },
  easy: {
    walls: [{ x: 9, y: 1 }],
    blocks: [
      { pos: { x: 2, y: 1 }, type: 'blue-square' },
      { pos: { x: 2, y: 6 }, type: 'red-circle' },
    ],
    destinations: [
      { pos: { x: 10, y: 6 }, type: 'red-circle' },
      { pos: { x: 8, y: 10 }, type: 'blue-square' },
    ],
    startPos: { x: CENTER, y: CENTER },
  },
  medium: {
    walls: [
      { x: 1, y: 5 },
      { x: 8, y: 6 },
      { x: 4, y: 0 },
      { x: 9, y: 1 },
      { x: 2, y: 7 },
      { x: 3, y: 2 },
      { x: 10, y: 3 },
      { x: 9, y: 9 },
    ],
    blocks: [
      { pos: { x: 4, y: 9 }, type: 'green-leaf' },
      { pos: { x: 8, y: 9 }, type: 'red-circle' },
      { pos: { x: 6, y: 9 }, type: 'blue-square' },
    ],
    destinations: [
      { pos: { x: 2, y: 5 }, type: 'green-leaf' },
      { pos: { x: 9, y: 8 }, type: 'red-circle' },
      { pos: { x: 10, y: 0 }, type: 'blue-square' },
    ],
    startPos: { x: 1, y: 1 },
  },
  hard: {
    walls: [
      { x: 7, y: 6 },
      { x: 1, y: 2 },
    ],
    blocks: [
      { pos: { x: 2, y: 5 }, type: 'yellow-triangle' },
      { pos: { x: 6, y: 8 }, type: 'general' },
      { pos: { x: 7, y: 1 }, type: 'purple-star' },
      { pos: { x: 7, y: 4 }, type: 'blue-square' },
      { pos: { x: 1, y: 9 }, type: 'red-circle' },
    ],
    destinations: [
      { pos: { x: 10, y: 7 }, type: 'yellow-triangle' },
      { pos: { x: 0, y: 7 }, type: 'blue-square' },
      { pos: { x: 2, y: 0 }, type: 'purple-star' },
      { pos: { x: 10, y: 3 }, type: 'red-circle' },
    ],
    startPos: { x: 1, y: 1 },
  },
};

const Menu = ({ onSelectDifficulty }: { onSelectDifficulty: (difficulty: GameDifficulty) => void }) => {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center gap-8 bg-white dark:bg-gray-900 px-4">
      <h1 className="text-center text-5xl font-black text-gray-900 dark:text-white">
        Block Down
      </h1>

      <div className="flex w-full max-w-sm flex-col gap-4">
        <button
          onClick={() => onSelectDifficulty('tutorial')}
          className="rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 text-lg font-bold text-white transition-all hover:from-blue-600 hover:to-blue-700 active:scale-95"
        >
          📚 Tutorial
        </button>
        <button
          onClick={() => onSelectDifficulty('daily')}
          className="rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4 text-lg font-bold text-white transition-all hover:from-purple-600 hover:to-purple-700 active:scale-95"
        >
          🎯 Daily Puzzle
        </button>
        <button
          onClick={() => onSelectDifficulty('easy')}
          className="rounded-lg bg-gradient-to-r from-green-500 to-green-600 px-6 py-4 text-lg font-bold text-white transition-all hover:from-green-600 hover:to-green-700 active:scale-95"
        >
          🟢 Easy Puzzle
        </button>
        <button
          onClick={() => onSelectDifficulty('medium')}
          className="rounded-lg bg-gradient-to-r from-yellow-500 to-yellow-600 px-6 py-4 text-lg font-bold text-white transition-all hover:from-yellow-600 hover:to-yellow-700 active:scale-95"
        >
          🟡 Medium Puzzle
        </button>
        <button
          onClick={() => onSelectDifficulty('hard')}
          className="rounded-lg bg-gradient-to-r from-red-500 to-red-600 px-6 py-4 text-lg font-bold text-white transition-all hover:from-red-600 hover:to-red-700 active:scale-95"
        >
          🔴 Hard Puzzle
        </button>
      </div>
    </div>
  );
};

const GameBoard = ({ difficulty, onReturnToMenu, onReset }: { difficulty: GameDifficulty; onReturnToMenu: () => void; onReset: () => void }) => {
  const levelConfig = LEVEL_CONFIGS[difficulty];
  const [playerPos, setPlayerPos] = useState<Position>(levelConfig.startPos);
  const [blockPositions, setBlockPositions] = useState<BlockData[]>(levelConfig.blocks);
  const [isPuzzleSolved, setIsPuzzleSolved] = useState(false);
  const [isWon, setIsWon] = useState(false);
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);

  // Check win condition whenever blocks change
  useEffect(() => {
    if (levelConfig.destinations.length === 0) return;

    const allBlocksInPlace = levelConfig.destinations.every((destination) => {
      return blockPositions.some(
        (block) =>
          block.pos.x === destination.pos.x &&
          block.pos.y === destination.pos.y &&
          block.type === destination.type
      );
    });

    if (allBlocksInPlace) {
      setIsPuzzleSolved(true);
      const timer = setTimeout(() => {
        setIsWon(true);
      }, 2000);

      return () => clearTimeout(timer);
    } else {
      setIsPuzzleSolved(false);
      setIsWon(false);
    }
  }, [blockPositions, levelConfig]);

  const difficultyLabels: Record<GameDifficulty, string> = {
    tutorial: '📚 Tutorial',
    daily: '🎯 Daily Puzzle',
    easy: '🟢 Easy Puzzles',
    medium: '🟡 Medium Puzzle',
    hard: '🔴 Hard Puzzles',
  };

  const positionKey = (pos: Position) => `${pos.x},${pos.y}`;
  const wallSet = new Set(levelConfig.walls.map(positionKey));
  const blockMap = new Map(blockPositions.map((block, idx) => [positionKey(block.pos), idx]));
  const destinationMap = new Map(levelConfig.destinations.map((dest, idx) => [positionKey(dest.pos), dest]));

  const canOccupy = (pos: Position, includeBlocks: boolean = true) => {
    if (pos.x < 0 || pos.x >= GRID_SIZE || pos.y < 0 || pos.y >= GRID_SIZE) {
      return false;
    }
    if (wallSet.has(positionKey(pos))) {
      return false;
    }
    if (includeBlocks && blockMap.has(positionKey(pos))) {
      return false;
    }
    return true;
  };

  const pushBlock = (blockPos: Position, direction: Position): Position => {
    let currentPos = { ...blockPos };
    let nextPos = { x: currentPos.x + direction.x, y: currentPos.y + direction.y };

    while (canOccupy(nextPos, false) && !wallSet.has(positionKey(nextPos))) {
      const blockAtNext = blockMap.has(positionKey(nextPos));
      if (blockAtNext) {
        break;
      }
      currentPos = nextPos;
      nextPos = { x: currentPos.x + direction.x, y: currentPos.y + direction.y };
    }

    return currentPos;
  };

  const movePlayer = (direction: Position) => {
    if (isPuzzleSolved) return;

    const newPos = { x: playerPos.x + direction.x, y: playerPos.y + direction.y };

    if (!canOccupy(newPos, false)) {
      return;
    }

    const blockIdx = blockMap.get(positionKey(newPos));
    if (blockIdx !== undefined) {
      const oldBlockPos = blockPositions[blockIdx].pos;
      const blockNewPos = pushBlock(oldBlockPos, direction);
      
      // Only allow movement if the block actually moved
      if (blockNewPos.x === oldBlockPos.x && blockNewPos.y === oldBlockPos.y) {
        return;
      }
      
      const newBlocks = [...blockPositions];
      newBlocks[blockIdx] = { ...newBlocks[blockIdx], pos: blockNewPos };
      setBlockPositions(newBlocks);
    }

    setPlayerPos(newPos);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          movePlayer({ x: 0, y: -1 });
          break;
        case 'ArrowDown':
          e.preventDefault();
          movePlayer({ x: 0, y: 1 });
          break;
        case 'ArrowLeft':
          e.preventDefault();
          movePlayer({ x: -1, y: 0 });
          break;
        case 'ArrowRight':
          e.preventDefault();
          movePlayer({ x: 1, y: 0 });
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playerPos, blockPositions]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartPos.current) return;

    const touchEnd = { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
    const dx = touchEnd.x - touchStartPos.current.x;
    const dy = touchEnd.y - touchStartPos.current.y;
    const threshold = 30;

    if (Math.abs(dx) > Math.abs(dy)) {
      if (Math.abs(dx) > threshold) {
        movePlayer({ x: dx > 0 ? 1 : -1, y: 0 });
      }
    } else {
      if (Math.abs(dy) > threshold) {
        movePlayer({ x: 0, y: dy > 0 ? 1 : -1 });
      }
    }

    touchStartPos.current = null;
  };

  const handleReset = () => {
    setPlayerPos(levelConfig.startPos);
    setBlockPositions(levelConfig.blocks);
    setIsPuzzleSolved(false);
    setIsWon(false);
  };

  if (isWon) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-white dark:bg-gray-900 px-4">
        <div className="text-center">
          <div className="text-8xl mb-4">🎉</div>
          <h1 className="text-5xl font-black text-gray-900 dark:text-white mb-2">You Won!</h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            All blocks are in their correct positions!
          </p>
        </div>

        <div className="flex flex-col gap-4 w-full max-w-sm">
          <button
            onClick={handleReset}
            className="rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 text-lg font-bold text-white transition-all hover:from-blue-600 hover:to-blue-700 active:scale-95"
          >
            Play Again
          </button>
          <button
            onClick={onReturnToMenu}
            className="rounded-lg bg-gradient-to-r from-gray-500 to-gray-600 px-6 py-4 text-lg font-bold text-white transition-all hover:from-gray-600 hover:to-gray-700 active:scale-95"
          >
            Return to Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-gray-900 px-2 sm:px-4 py-4 sm:py-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{difficultyLabels[difficulty]}</h1>
        <div className="flex gap-2 sm:gap-3">
          <button
            onClick={handleReset}
            className="rounded-lg bg-blue-500 px-3 sm:px-4 py-2 text-sm sm:text-base font-semibold text-white transition-all hover:bg-blue-600 active:scale-95"
          >
            Reset
          </button>
          <button
            onClick={onReturnToMenu}
            className="rounded-lg bg-gray-500 px-3 sm:px-4 py-2 text-sm sm:text-base font-semibold text-white transition-all hover:bg-gray-600 active:scale-95"
          >
            Menu
          </button>
        </div>
      </div>

      <div
        className="flex-1 flex items-center justify-center w-full overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div 
          className="border-4 border-gray-900 dark:border-white bg-gray-100 dark:bg-gray-800 p-1 sm:p-2"
          style={{ 
            display: 'grid', 
            gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`, 
            gap: '1px',
            maxWidth: '100vw',
            maxHeight: '100vh',
            width: 'fit-content',
            aspectRatio: '1'
          }}
        >
          {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
            const x = i % GRID_SIZE;
            const y = Math.floor(i / GRID_SIZE);
            const key = positionKey({ x, y });

            const isPlayer = playerPos.x === x && playerPos.y === y;
            const blockIdx = blockMap.get(key);
            const hasBlock = blockIdx !== undefined;
            const hasWall = wallSet.has(key);
            const destination = destinationMap.get(key);
            const hasDestination = destination !== undefined;

            let bgColor = 'bg-white dark:bg-gray-700';
            let borderStyle = 'border-gray-300 dark:border-gray-600';
            let emoji = '';
            let shadowStyle = '';

            const getBlockStyle = (blockType: BlockType) => {
              switch (blockType) {
                case 'red-circle':
                  return { bg: 'bg-red-500 dark:bg-red-600', border: 'border-2 border-red-700 dark:border-red-800', emoji: '🔴' };
                case 'blue-square':
                  return { bg: 'bg-blue-500 dark:bg-blue-600', border: 'border-2 border-blue-700 dark:border-blue-800', emoji: '🟦' };
                case 'yellow-triangle':
                  return { bg: 'bg-yellow-500 dark:bg-yellow-600', border: 'border-2 border-yellow-700 dark:border-yellow-800', emoji: '🔺' };
                case 'purple-star':
                  return { bg: 'bg-purple-500 dark:bg-purple-600', border: 'border-2 border-purple-700 dark:border-purple-800', emoji: '⭐' };
                case 'green-leaf':
                  return { bg: 'bg-green-500 dark:bg-green-600', border: 'border-2 border-green-700 dark:border-green-800', emoji: '🍃' };
                default:
                  return { bg: 'bg-amber-500 dark:bg-amber-600', border: 'border-2 border-amber-700 dark:border-amber-800', emoji: '📦' };
              }
            };

            const getDestinationStyle = (destType: BlockType) => {
              switch (destType) {
                case 'red-circle':
                  return { bg: 'bg-red-200 dark:bg-red-900', border: 'border-2 border-red-400 dark:border-red-600 border-dashed', emoji: '🎯' };
                case 'blue-square':
                  return { bg: 'bg-blue-200 dark:bg-blue-900', border: 'border-2 border-blue-400 dark:border-blue-600 border-dashed', emoji: '🎯' };
                case 'yellow-triangle':
                  return { bg: 'bg-yellow-200 dark:bg-yellow-900', border: 'border-2 border-yellow-400 dark:border-yellow-600 border-dashed', emoji: '🎯' };
                case 'purple-star':
                  return { bg: 'bg-purple-200 dark:bg-purple-900', border: 'border-2 border-purple-400 dark:border-purple-600 border-dashed', emoji: '🎯' };
                case 'green-leaf':
                  return { bg: 'bg-green-200 dark:bg-green-900', border: 'border-2 border-green-400 dark:border-green-600 border-dashed', emoji: '🎯' };
                default:
                  return { bg: 'bg-pink-200 dark:bg-pink-900', border: 'border-2 border-pink-400 dark:border-pink-600 border-dashed', emoji: '🎯' };
              }
            };

            if (hasWall) {
              bgColor = 'bg-gray-700 dark:bg-gray-900';
              borderStyle = 'border-gray-900 dark:border-black';
              emoji = '🧱';
              shadowStyle = 'shadow-md';
            } else if (hasBlock) {
              const blockStyle = getBlockStyle(blockPositions[blockIdx].type);
              bgColor = blockStyle.bg;
              borderStyle = blockStyle.border;
              emoji = blockStyle.emoji;
              shadowStyle = 'shadow-lg';
            }

            if (isPlayer) {
              bgColor = 'bg-gradient-to-br from-blue-400 to-blue-600 dark:from-blue-500 dark:to-blue-700';
              borderStyle = 'border-2 border-blue-800 dark:border-blue-900';
              emoji = '🧑';
              shadowStyle = 'shadow-lg';
            }

            if (hasDestination && !isPlayer && !hasBlock) {
              const destStyle = getDestinationStyle(destination!.type);
              bgColor = destStyle.bg;
              borderStyle = destStyle.border;
              emoji = destStyle.emoji;
              shadowStyle = '';
            } else if (hasDestination && hasBlock) {
              const blockStyle = getBlockStyle(blockPositions[blockIdx].type);
              const destStyle = getDestinationStyle(destination!.type);
              // Show block on destination with checkmark
              bgColor = blockStyle.bg;
              borderStyle = destStyle.border;
              emoji = '✨';
              shadowStyle = 'shadow-lg';
            } else if (hasDestination && isPlayer) {
              const destStyle = getDestinationStyle(destination!.type);
              bgColor = 'bg-gradient-to-br from-blue-400 to-blue-600 dark:from-blue-500 dark:to-blue-700';
              borderStyle = destStyle.border;
              emoji = '🧑';
              shadowStyle = 'shadow-lg';
            }

            return (
              <div
                key={i}
                className={`aspect-square w-7 h-7 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 rounded-md border flex items-center justify-center text-lg sm:text-2xl font-bold transition-all ${bgColor} ${borderStyle} ${shadowStyle}`}
              >
                {emoji}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const App = () => {
  const [currentScreen, setCurrentScreen] = useState<{ type: 'menu' } | { type: 'game'; difficulty: GameDifficulty }>({ type: 'menu' });

  const handleSelectDifficulty = (difficulty: GameDifficulty) => {
    setCurrentScreen({ type: 'game', difficulty });
  };

  const handleReturnToMenu = () => {
    setCurrentScreen({ type: 'menu' });
  };

  return (
    <>
      {currentScreen.type === 'menu' ? (
        <Menu onSelectDifficulty={handleSelectDifficulty} />
      ) : (
        <GameBoard difficulty={currentScreen.difficulty} onReturnToMenu={handleReturnToMenu} onReset={() => {}} />
      )}
    </>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
