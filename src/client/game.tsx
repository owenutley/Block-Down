import './index.css';

import { StrictMode, useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { trpc } from './trpc';
import { Admin } from './admin';

type GameDifficulty = 'tutorial' | 'daily' | 'easy' | 'medium' | 'hard';
type BlockType = 'red-circle' | 'blue-square' | 'yellow-triangle' | 'purple-star' | 'green-leaf' | 'orange-block';
type Position = { x: number; y: number };

interface BlockData {
  pos: Position;
  type: BlockType;
}

interface DestinationData {
  pos: Position;
  type: BlockType;
}



interface LevelConfig {
  walls: Position[];
  blocks: BlockData[];
  destinations: DestinationData[];
  startPos: Position;
  gridSize: number;
}

const LEVEL_CONFIGS: Record<GameDifficulty, LevelConfig> = {
  tutorial: {
    walls: [{ x: 8, y: 7 }],
    blocks: [
      { pos: { x: 3, y: 3 }, type: 'yellow-triangle' },
      { pos: { x: 2, y: 7 }, type: 'green-leaf' },
      { pos: { x: 2, y: 2 }, type: 'red-circle' },
    ],
    destinations: [
      { pos: { x: 10, y: 3 }, type: 'yellow-triangle' },
      { pos: { x: 7, y: 0 }, type: 'green-leaf' },
      { pos: { x: 0, y: 6 }, type: 'red-circle' },
    ],
    startPos: { x: 1, y: 1 },
    gridSize: 11,
  },
  daily: {
    walls: [],
    blocks: [],
    destinations: [],
    startPos: { x: 5, y: 5 },
    gridSize: 11,
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
    startPos: { x: 5, y: 5 },
    gridSize: 11,
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
    gridSize: 11,
  },
  hard: {
    walls: [
      { x: 0, y: 5 },
      { x: 1, y: 5 },
      { x: 1, y: 7 },
      { x: 2, y: 2 },
      { x: 4, y: 6 },
      { x: 5, y: 2 },
      { x: 5, y: 8 },
      { x: 6, y: 1 },
      { x: 7, y: 8 },
    ],
    blocks: [
      { pos: { x: 7, y: 3 }, type: 'red-circle' },
      { pos: { x: 4, y: 2 }, type: 'blue-square' },
      { pos: { x: 5, y: 4 }, type: 'yellow-triangle' },
      { pos: { x: 3, y: 4 }, type: 'purple-star' },
      { pos: { x: 1, y: 2 }, type: 'green-leaf' },
      { pos: { x: 7, y: 1 }, type: 'orange-block' },
    ],
    destinations: [
      { pos: { x: 4, y: 8 }, type: 'red-circle' },
      { pos: { x: 0, y: 3 }, type: 'blue-square' },
      { pos: { x: 6, y: 8 }, type: 'yellow-triangle' },
      { pos: { x: 2, y: 5 }, type: 'purple-star' },
      { pos: { x: 6, y: 3 }, type: 'green-leaf' },
      { pos: { x: 8, y: 8 }, type: 'orange-block' },
    ],
    startPos: { x: 7, y: 0 },
    gridSize: 9,
  },
};

type PuzzleDifficulty = 'tutorial' | 'easy' | 'medium' | 'hard';

const Menu = ({ onSelectDifficulty, onSelectCampaign, onSelectAdmin }: { onSelectDifficulty: (difficulty: GameDifficulty) => void; onSelectCampaign?: () => void; onSelectAdmin?: () => void }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const result = await trpc.admin.checkAuth.query();
        setIsAdmin(result.isAdmin);
      } catch (error) {
        setIsAdmin(false);
      } finally {
        setCheckingAdmin(false);
      }
    };

    checkAdminStatus();
  }, []);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center gap-8 bg-mesh-gradient px-4">
      <h1 className="text-center text-6xl font-black neon-text-title tracking-tight">
        Block Down
      </h1>

      <div className="flex w-full max-w-sm flex-col gap-4">
        {[
          { id: 'tutorial', label: 'Tutorial', color: 'border-blue-500 neon-blue text-blue-300' },
          { id: 'daily', label: 'Daily Puzzle', color: 'border-purple-500 neon-purple text-purple-300' },
          { id: 'campaign', label: 'Campaign Mode', color: 'border-cyan-500 neon-cyan text-cyan-300' },
        ].map(btn => (
          <button
            key={btn.id}
            onClick={() => btn.id === 'campaign' ? onSelectCampaign?.() : onSelectDifficulty(btn.id as GameDifficulty)}
            className={`rounded-2xl bg-black/60 border ${btn.color} px-6 py-4 text-xl font-bold transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-3`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Admin Button - Top Right */}
      {!checkingAdmin && isAdmin && (
        <div className="absolute top-6 right-6">
          <button
            onClick={() => onSelectAdmin?.()}
            className="px-4 py-2 bg-black/60 border border-orange-500 neon-orange text-orange-300 rounded-lg font-bold text-sm transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
            title="Admin Panel"
          >
            <span>🔑</span>
            <span>Admin</span>
          </button>
        </div>
      )}

    </div>
  );
};

const GameBoard = ({ 
  levelConfig, 
  difficulty, 
  onReturnToMenu,
  onWin,
  hasNextLevel,
  onNextLevel
}: { 
  levelConfig: LevelConfig; 
  difficulty?: GameDifficulty; 
  onReturnToMenu: () => void;
  onWin?: () => void;
  hasNextLevel?: boolean;
  onNextLevel?: () => void;
}) => {
  const [playerPos, setPlayerPos] = useState<Position>(levelConfig.startPos);
  const [blockPositions, setBlockPositions] = useState<BlockData[]>(levelConfig.blocks);
  const [history, setHistory] = useState<{ playerPos: Position; blockPositions: BlockData[] }[]>([]);
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
        onWin?.();
      }, 2000);

      return () => clearTimeout(timer);
    } else {
      setIsPuzzleSolved(false);
      setIsWon(false);
    }
  }, [blockPositions, levelConfig]);

  const difficultyLabels: Record<GameDifficulty, string> = {
    tutorial: 'Tutorial',
    daily: 'Daily Puzzle',
    easy: 'Easy Puzzles',
    medium: 'Medium Puzzle',
    hard: 'Hard Puzzles',
  };

  const positionKey = (pos: Position) => `${pos.x},${pos.y}`;
  const wallSet = new Set(levelConfig.walls.map(positionKey));
  const blockMap = new Map(blockPositions.map((block, idx) => [positionKey(block.pos), idx]));
  const destinationMap = new Map(levelConfig.destinations.map((dest) => [positionKey(dest.pos), dest]));

  const canOccupy = (pos: Position, includeBlocks: boolean = true) => {
    if (pos.x < 0 || pos.x >= levelConfig.gridSize || pos.y < 0 || pos.y >= levelConfig.gridSize) {
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

    let newBlockPositions = blockPositions;

    const blockIdx = blockMap.get(positionKey(newPos));
    if (blockIdx !== undefined) {
      const block = blockPositions[blockIdx];
      if (!block) return;
      const oldBlockPos = block.pos;
      const blockNewPos = pushBlock(oldBlockPos, direction);

      // Only allow movement if the block actually moved
      if (blockNewPos.x === oldBlockPos.x && blockNewPos.y === oldBlockPos.y) {
        return;
      }

      newBlockPositions = [...blockPositions];
      newBlockPositions[blockIdx] = { ...block, pos: blockNewPos };
    }

    setHistory(prev => [...prev, { playerPos, blockPositions }]);
    setBlockPositions(newBlockPositions);
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
    const touch = e.touches[0];
    if (touch) {
      touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartPos.current) return;

    const touch = e.changedTouches[0];
    if (!touch) return;

    const touchEnd = { x: touch.clientX, y: touch.clientY };
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

  const handleUndo = () => {
    if (history.length === 0 || isWon) return;
    const lastState = history[history.length - 1];
    if (!lastState) return;
    setHistory(prev => prev.slice(0, -1));
    setPlayerPos(lastState.playerPos);
    setBlockPositions(lastState.blockPositions);
  };

  const handleUndoFive = () => {
    if (history.length === 0 || isWon) return;
    const stepsToUndo = Math.min(5, history.length);
    const targetState = history[history.length - stepsToUndo];
    if (!targetState) return;
    setHistory(prev => prev.slice(0, -stepsToUndo));
    setPlayerPos(targetState.playerPos);
    setBlockPositions(targetState.blockPositions);
  };

  const handleReset = () => {
    setPlayerPos(levelConfig.startPos);
    setBlockPositions(levelConfig.blocks);
    setHistory([]);
    setIsPuzzleSolved(false);
    setIsWon(false);
  };

  const getBlockStyle = (blockType: BlockType) => {
    switch (blockType) {
      case 'red-circle':
        return { bg: 'bg-black/60', border: 'border border-red-500 neon-red', emoji: '', innerBg: 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]' };
      case 'blue-square':
        return { bg: 'bg-black/60', border: 'border border-blue-500 neon-blue', emoji: '', innerBg: 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]' };
      case 'yellow-triangle':
        return { bg: 'bg-black/60', border: 'border border-yellow-400 neon-yellow', emoji: '', innerBg: 'bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.8)]' };
      case 'purple-star':
        return { bg: 'bg-black/60', border: 'border border-purple-500 neon-purple', emoji: '', innerBg: 'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.8)]' };
      case 'green-leaf':
        return { bg: 'bg-black/60', border: 'border border-green-500 neon-green', emoji: '', innerBg: 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]' };
      case 'orange-block':
        return { bg: 'bg-black/60', border: 'border border-orange-500 neon-orange', emoji: '', innerBg: 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.8)]' };
      default:
        return { bg: 'bg-black/60', border: 'border border-white/50', emoji: '', innerBg: 'bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]' };
    }
  };

  const getDestinationStyle = (destType: BlockType) => {
    switch (destType) {
      case 'red-circle':
        return { bg: 'bg-red-900/30', border: 'border border-red-500/80 border-dashed neon-red', emoji: '' };
      case 'blue-square':
        return { bg: 'bg-blue-900/30', border: 'border border-blue-500/80 border-dashed neon-blue', emoji: '' };
      case 'yellow-triangle':
        return { bg: 'bg-yellow-900/30', border: 'border border-yellow-500/80 border-dashed neon-yellow', emoji: '' };
      case 'purple-star':
        return { bg: 'bg-purple-900/30', border: 'border border-purple-500/80 border-dashed neon-purple', emoji: '' };
      case 'green-leaf':
        return { bg: 'bg-green-900/30', border: 'border border-green-500/80 border-dashed neon-green', emoji: '' };
      case 'orange-block':
        return { bg: 'bg-orange-900/30', border: 'border border-orange-500/80 border-dashed neon-orange', emoji: '' };
      default:
        return { bg: 'bg-white/10', border: 'border border-white/50 border-dashed', emoji: '' };
    }
  };

  if (isWon) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-mesh-gradient px-4">
        <div className="text-center glass-panel p-8 rounded-3xl animate-float">
          <h1 className="text-5xl font-black text-white mb-2 drop-shadow-md">You Won!</h1>
          <p className="text-xl text-white/90 mb-8 font-medium">
            All blocks are in their correct positions!
          </p>
          <div className="flex flex-col gap-4 w-full">
            <button
              onClick={handleReset}
              className="rounded-xl bg-black/60 border border-green-500 neon-green text-green-300 px-6 py-4 text-xl font-bold transition-all transform hover:scale-105 active:scale-95"
            >
              Play Again
            </button>
            {hasNextLevel && (
              <button
                onClick={onNextLevel}
                className="rounded-xl bg-black/60 border border-cyan-500 neon-cyan text-cyan-300 px-6 py-4 text-xl font-bold transition-all transform hover:scale-105 active:scale-95"
              >
                Continue to Next Level
              </button>
            )}
            <button
              onClick={onReturnToMenu}
              className="rounded-xl bg-black/60 border border-purple-500 neon-purple text-purple-300 px-6 py-4 text-xl font-bold transition-all transform hover:scale-105 active:scale-95"
            >
              Return to {difficulty ? 'Menu' : 'Campaign'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const totalBlocks = levelConfig.destinations.length;
  const blocksInPlace = levelConfig.destinations.filter(destination =>
    blockPositions.some(block =>
      block.pos.x === destination.pos.x &&
      block.pos.y === destination.pos.y &&
      block.type === destination.type
    )
  ).length;
  const progressPercent = totalBlocks > 0 ? (blocksInPlace / totalBlocks) * 100 : 0;

  return (
    <div className="flex min-h-screen flex-col bg-mesh-gradient px-2 sm:px-4 py-4 sm:py-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-3xl font-black text-white drop-shadow-md">{difficulty ? difficultyLabels[difficulty] : 'Campaign'}</h1>
        <div className="flex gap-2 sm:gap-3">
          <button
            onClick={handleUndo}
            disabled={history.length === 0 || isWon}
            className={`rounded-xl px-4 py-2 text-sm sm:text-base font-bold transition-all ${history.length === 0 || isWon ? 'bg-black/60 border border-white/10 text-white/30 cursor-not-allowed' : 'bg-black/60 border border-cyan-400 neon-cyan text-cyan-300 hover:scale-105 active:scale-95'}`}
          >
            Undo
          </button>
          <button
            onClick={handleUndoFive}
            disabled={history.length === 0 || isWon}
            className={`rounded-xl px-4 py-2 text-sm sm:text-base font-bold transition-all ${history.length === 0 || isWon ? 'bg-black/60 border border-white/10 text-white/30 cursor-not-allowed' : 'bg-black/60 border border-blue-400 neon-blue text-blue-300 hover:scale-105 active:scale-95'}`}
          >
            Undo 5
          </button>
          <button
            onClick={handleReset}
            className="rounded-xl bg-black/60 border border-red-500 neon-red text-red-300 px-4 py-2 text-sm sm:text-base font-bold transition-all hover:scale-105 active:scale-95"
          >
            Reset
          </button>
          <button
            onClick={onReturnToMenu}
            className="rounded-xl bg-black/60 border border-purple-500 neon-purple text-purple-300 px-4 py-2 text-sm sm:text-base font-bold transition-all hover:scale-105 active:scale-95"
          >
            Menu
          </button>
        </div>
      </div>

      {totalBlocks > 0 && (
        <div className="w-full max-w-2xl mx-auto mb-4 sm:mb-6">
          <div className="flex justify-between text-white/90 text-sm font-bold mb-2 px-1">
            <span>Progress</span>
            <span>{blocksInPlace} / {totalBlocks}</span>
          </div>
          <div className="h-3 w-full bg-black/40 rounded-full overflow-hidden border border-white/10 shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-500 ease-out shadow-[0_0_10px_rgba(34,211,238,0.5)]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      <div
        className="flex-1 flex items-center justify-center w-full overflow-hidden touch-none"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="glass-panel p-1 sm:p-2 relative rounded-2xl sm:rounded-3xl"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${levelConfig.gridSize}, 1fr)`,
            gap: '1px',
            maxWidth: '100vw',
            maxHeight: '100vh',
            width: 'fit-content',
            aspectRatio: '1'
          }}
        >
          {Array.from({ length: levelConfig.gridSize * levelConfig.gridSize }).map((_, i) => {
            const x = i % levelConfig.gridSize;
            const y = Math.floor(i / levelConfig.gridSize);
            const key = positionKey({ x, y });

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
                className={`aspect-square w-6 h-6 sm:w-8 sm:h-8 md:w-9 md:h-9 lg:w-10 lg:h-10 ${radiusStyle} flex items-center justify-center text-lg sm:text-2xl font-bold transition-all ${bgColor} ${borderStyle} ${shadowStyle}`}
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
              pointerEvents: 'none'
            }}
          >
            {blockPositions.map((block, idx) => {
              const destination = destinationMap.get(positionKey(block.pos));
              const isOnDestination = destination !== undefined;
              const isCorrectDestination = isOnDestination && destination!.type === block.type;

              const blockStyle = getBlockStyle(block.type);
              let content;

              if (isCorrectDestination) {
                const parts = blockStyle.innerBg.split(' ');
                const bgColorClass = parts[0];
                const shadowClass = parts[1] ? parts[1].replace('10px', '25px').replace('0.8)]', '1)]') : '';
                
                content = (
                  <div className={`w-full h-full rounded-md sm:rounded-lg md:rounded-xl flex items-center justify-center ${bgColorClass} ${shadowClass} border-2 border-white/50 animate-pulse-glow`}>
                  </div>
                );
              } else {
                content = (
                  <div className={`w-full h-full rounded-md sm:rounded-lg md:rounded-xl flex items-center justify-center text-lg sm:text-2xl font-bold ${blockStyle.bg} ${blockStyle.border}`}>
                    <div className={`w-1/2 h-1/2 rounded-full ${blockStyle.innerBg}`}></div>
                  </div>
                );
              }

              return (
                <div
                  key={`block-${idx}`}
                  className={`absolute animate-slide aspect-square w-6 h-6 sm:w-8 sm:h-8 md:w-9 md:h-9 lg:w-10 lg:h-10`}
                  style={{
                    transform: `translate(calc(${block.pos.x} * (var(--cell-size) + 1px)), calc(${block.pos.y} * (var(--cell-size) + 1px)))`,
                  }}
                >
                  {content}
                </div>
              );
            })}

            {(() => {
              const borderStyle = 'border border-white/80 neon-white';
              return (
                <div
                  className={`absolute animate-slide aspect-square w-6 h-6 sm:w-8 sm:h-8 md:w-9 md:h-9 lg:w-10 lg:h-10`}
                  style={{
                    transform: `translate(calc(${playerPos.x} * (var(--cell-size) + 1px)), calc(${playerPos.y} * (var(--cell-size) + 1px)))`,
                  }}
                >
                  <div className={`w-full h-full rounded-full flex items-center justify-center bg-black/60 ${borderStyle}`}>
                    <div className="w-1/2 h-1/2 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)]"></div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};

const colorToBlockType = (color: string): BlockType => {
  switch (color.toLowerCase()) {
    case 'red': return 'red-circle';
    case 'blue': return 'blue-square';
    case 'yellow': return 'yellow-triangle';
    case 'purple': return 'purple-star';
    case 'green': return 'green-leaf';
    case 'orange': return 'orange-block';
    default: return 'red-circle';
  }
};

const convertPuzzleToLevelConfig = (puzzle: any): LevelConfig => {
  return {
    gridSize: Math.max(puzzle.width, puzzle.height),
    startPos: puzzle.player,
    walls: puzzle.walls || [],
    blocks: (puzzle.blocks || []).map((b: any) => ({
      pos: { x: b.x, y: b.y },
      type: colorToBlockType(b.color)
    })),
    destinations: (puzzle.targets || []).map((t: any) => ({
      pos: { x: t.x, y: t.y },
      type: colorToBlockType(t.color)
    }))
  };
};

const GameContainer = ({ difficulty, onReturnToMenu }: { difficulty: GameDifficulty; onReturnToMenu: () => void }) => {
  const [levelConfig, setLevelConfig] = useState<LevelConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPuzzle = async () => {
      try {
        setLoading(true);
        let puzzles = [];
        if (difficulty === 'daily') {
          const daily = await trpc.puzzle.getCurrentDaily.query();
          if (daily?.puzzle) puzzles = [daily.puzzle];
        } else {
          puzzles = await trpc.puzzle.getByDifficulty.query(difficulty as any);
        }

        if (puzzles && puzzles.length > 0) {
          setLevelConfig(convertPuzzleToLevelConfig(puzzles[0]));
        } else {
          // Fallback to hardcoded
          setLevelConfig(LEVEL_CONFIGS[difficulty]);
        }
      } catch (e) {
        console.error('Failed to load puzzle', e);
        setLevelConfig(LEVEL_CONFIGS[difficulty]);
      } finally {
        setLoading(false);
      }
    };
    fetchPuzzle();
  }, [difficulty]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-mesh-gradient">
        <div className="text-white text-2xl font-bold animate-pulse">Loading puzzle...</div>
      </div>
    );
  }

  if (!levelConfig) return null;

  return <GameBoard levelConfig={levelConfig} difficulty={difficulty} onReturnToMenu={onReturnToMenu} />;
};

const CampaignScreen = ({ onReturnToMenu }: { onReturnToMenu: () => void }) => {
  const [loading, setLoading] = useState(true);
  const [campaignData, setCampaignData] = useState<{ puzzles: any[], completedIds: string[] } | null>(null);
  const [activePuzzleIndex, setActivePuzzleIndex] = useState<number | null>(null);

  const fetchCampaign = async () => {
    try {
      setLoading(true);
      const data = await trpc.campaign.get.query();
      setCampaignData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaign();
  }, []);

  const handleWin = async () => {
    if (activePuzzleIndex === null || !campaignData) return;
    const puzzle = campaignData.puzzles[activePuzzleIndex];
    if (puzzle && !campaignData.completedIds.includes(puzzle.id)) {
      try {
        await trpc.campaign.markCompleted.mutate(puzzle.id);
        // Refresh silently to update locks
        const data = await trpc.campaign.get.query();
        setCampaignData(data);
      } catch (e) {
        console.error('Failed to mark completed', e);
      }
    }
  };

  const handleNextLevel = () => {
    if (activePuzzleIndex === null || !campaignData) return;
    if (activePuzzleIndex + 1 < campaignData.puzzles.length) {
      setActivePuzzleIndex(activePuzzleIndex + 1);
    }
  };

  if (loading || !campaignData) {
    return <div className="flex min-h-screen items-center justify-center bg-mesh-gradient"><div className="text-white text-2xl font-bold animate-pulse">Loading Campaign...</div></div>;
  }

  if (activePuzzleIndex !== null) {
    const puzzle = campaignData.puzzles[activePuzzleIndex];
    const levelConfig = convertPuzzleToLevelConfig(puzzle);
    const hasNextLevel = activePuzzleIndex + 1 < campaignData.puzzles.length;

    return (
      <GameBoard
        levelConfig={levelConfig}
        difficulty={undefined}
        onReturnToMenu={() => setActivePuzzleIndex(null)}
        onWin={handleWin}
        hasNextLevel={hasNextLevel}
        onNextLevel={handleNextLevel}
      />
    );
  }

  return (
    <div className="min-h-screen bg-mesh-gradient text-white p-6 pb-20">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-12 pt-8">
          <h1 className="text-5xl font-black neon-text-title tracking-tight">Campaign</h1>
          <button onClick={onReturnToMenu} className="px-6 py-3 bg-black/60 border border-purple-500 neon-purple text-purple-300 rounded-xl font-bold transition hover:scale-105">
            Back to Menu
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
          {campaignData.puzzles.map((puzzle, idx) => {
            const isFirst = idx === 0;
            const prevPuzzle = campaignData.puzzles[idx - 1];
            const isUnlocked = isFirst || (prevPuzzle && campaignData.completedIds.includes(prevPuzzle.id));
            const isCompleted = campaignData.completedIds.includes(puzzle.id);

            return (
              <button
                key={puzzle.id}
                disabled={!isUnlocked}
                onClick={() => setActivePuzzleIndex(idx)}
                className={`relative aspect-square rounded-2xl flex flex-col items-center justify-center p-4 border-2 transition-all ${
                  isUnlocked 
                    ? isCompleted 
                      ? 'bg-green-900/40 border-green-500 neon-green hover:scale-105' 
                      : 'bg-blue-900/40 border-blue-400 neon-blue hover:scale-105'
                    : 'bg-gray-900/60 border-gray-700 opacity-60 cursor-not-allowed'
                }`}
              >
                <span className="text-3xl font-black mb-2 opacity-80">{idx + 1}</span>
                {isCompleted && <span className="absolute top-2 right-2 text-green-400 text-lg">✓</span>}
                {!isUnlocked && <span className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl text-4xl">🔒</span>}
              </button>
            );
          })}
        </div>
        
        {campaignData.puzzles.length === 0 && (
          <div className="text-center text-gray-400 py-12 text-xl">
            No campaign levels available yet. Add Easy/Medium/Hard puzzles in Admin!
          </div>
        )}
      </div>
    </div>
  );
};

export const App = () => {
  const [currentScreen, setCurrentScreen] = useState<{ type: 'menu' } | { type: 'game'; difficulty: GameDifficulty } | { type: 'campaign' } | { type: 'admin' }>({ type: 'menu' });

  const handleSelectDifficulty = (difficulty: GameDifficulty) => {
    setCurrentScreen({ type: 'game', difficulty });
  };

  const handleReturnToMenu = () => {
    setCurrentScreen({ type: 'menu' });
  };

  const handleSelectAdmin = () => {
    setCurrentScreen({ type: 'admin' });
  };

  return (
    <>
      {currentScreen.type === 'menu' ? (
        <Menu onSelectDifficulty={handleSelectDifficulty} onSelectCampaign={() => setCurrentScreen({ type: 'campaign' })} onSelectAdmin={handleSelectAdmin} />
      ) : currentScreen.type === 'admin' ? (
        <div className="relative min-h-screen">
          <button
            onClick={handleReturnToMenu}
            className="absolute top-4 left-4 z-50 px-4 py-2 bg-black/60 border border-white/20 text-white rounded-lg font-bold text-sm transition-all hover:scale-105 active:scale-95"
          >
            ← Back to Menu
          </button>
          <Admin />
        </div>
      ) : currentScreen.type === 'campaign' ? (
        <CampaignScreen onReturnToMenu={handleReturnToMenu} />
      ) : (
        <GameContainer difficulty={currentScreen.difficulty} onReturnToMenu={handleReturnToMenu} />
      )}
    </>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
