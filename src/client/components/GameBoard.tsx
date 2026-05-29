/* eslint-disable react-hooks/refs */
import React, { useState, useEffect, useRef } from 'react';
import { LevelConfig, GameDifficulty, Position, BlockData, BlockType } from '../types';
import { playSlideSound, playThudSound, playMatchSound, playWinMelody, getMuted, setMuted } from '../utils/audio';
import { trpc } from '../trpc';
import { PuzzleShape } from './PuzzleShape';

export const GameBoard = ({
  levelConfig,
  difficulty,
  onReturnToMenu,
  onWin,
  hasNextLevel,
  onNextLevel,
  puzzleId,
  refreshCurrency
}: {
  levelConfig: LevelConfig;
  difficulty?: GameDifficulty;
  onReturnToMenu: () => void;
  onWin?: () => void;
  hasNextLevel?: boolean;
  onNextLevel?: () => void;
  puzzleId?: string | undefined;
  refreshCurrency?: (() => void) | undefined;
}) => {
  const [playerPos, setPlayerPos] = useState<Position>(levelConfig.startPos);
  const [blockPositions, setBlockPositions] = useState<BlockData[]>(levelConfig.blocks);
  const [history, setHistory] = useState<{ playerPos: Position; blockPositions: BlockData[] }[]>([]);
  const [isPuzzleSolved, setIsPuzzleSolved] = useState(false);
  const [isWon, setIsWon] = useState(false);
  const [muted, setMutedState] = useState(getMuted());
  const [stats, setStats] = useState<{ totalAttempts: number; totalCompletions: number; averageScore: number; bestScore: number } | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [rewardedAmount, setRewardedAmount] = useState<number | null>(null);

  useEffect(() => {
    if (isWon && puzzleId) {
      trpc.puzzle.getStats.query(puzzleId)
        .then(setStats)
        .catch(err => console.error('Failed to load stats:', err));
    }
  }, [isWon, puzzleId]);

  // Record unique attempt on mount
  useEffect(() => {
    if (puzzleId) {
      trpc.puzzle.recordAttempt.mutate({ puzzleId })
        .catch(err => console.error('Failed to record attempt:', err));
    }
  }, [puzzleId]);

  const touchStartPos = useRef<{ x: number; y: number } | null>(null);

  const prevPlayerPos = useRef<Position>(levelConfig.startPos);
  const prevBlockPositions = useRef<BlockData[]>(levelConfig.blocks);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const focusGame = () => {
      window.focus();
      if (containerRef.current) {
        containerRef.current.focus();
      }
    };

    focusGame();
    // Use timeout and animation frame to ensure it runs after DOM has completely rendered
    const timer = setTimeout(focusGame, 100);
    const animFrame = requestAnimationFrame(focusGame);

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(animFrame);
    };
  }, []);

  useEffect(() => {
    prevPlayerPos.current = playerPos;
    prevBlockPositions.current = blockPositions;
  }, [playerPos, blockPositions]);

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
      if (!isPuzzleSolved) {
        setIsPuzzleSolved(true);
        playWinMelody();
        if (puzzleId) {
          trpc.puzzle.recordCompletion.mutate({
            puzzleId,
            score: history.length,
          })
          .then((res) => {
            if (res.rewardedAmount && res.rewardedAmount > 0) {
              setRewardedAmount(res.rewardedAmount);
            }
            refreshCurrency?.();
          })
          .catch(err => console.error('Failed to record completion:', err));
        }
      }
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
      playThudSound();
      return;
    }

    let newBlockPositions = blockPositions;
    let didBlockMatch = false;

    const blockIdx = blockMap.get(positionKey(newPos));
    if (blockIdx !== undefined) {
      const block = blockPositions[blockIdx];
      if (!block) return;
      const oldBlockPos = block.pos;
      const blockNewPos = pushBlock(oldBlockPos, direction);

      // Only allow movement if the block actually moved
      if (blockNewPos.x === oldBlockPos.x && blockNewPos.y === oldBlockPos.y) {
        playThudSound();
        return;
      }

      const destAtNew = destinationMap.get(positionKey(blockNewPos));
      if (destAtNew && destAtNew.type === block.type) {
        didBlockMatch = true;
      }

      newBlockPositions = [...blockPositions];
      newBlockPositions[blockIdx] = { ...block, pos: blockNewPos };
    }

    if (didBlockMatch) {
      playMatchSound();
    } else {
      playSlideSound();
    }

    setHistory(prev => [...prev, { playerPos, blockPositions }]);
    setBlockPositions(newBlockPositions);
    setPlayerPos(newPos);
  };

  const keysDown = useRef(new Set<string>());
  const lastMoveTime = useRef<number>(0);
  const moveInterval = 120; // ms per tile movement

  useEffect(() => {
    let animationFrameId: number;

    const gameLoop = (timestamp: number) => {
      if (timestamp - lastMoveTime.current >= moveInterval) {
        let moved = false;

        if (keysDown.current.has('ArrowUp')) {
          movePlayer({ x: 0, y: -1 });
          moved = true;
        } else if (keysDown.current.has('ArrowDown')) {
          movePlayer({ x: 0, y: 1 });
          moved = true;
        } else if (keysDown.current.has('ArrowLeft')) {
          movePlayer({ x: -1, y: 0 });
          moved = true;
        } else if (keysDown.current.has('ArrowRight')) {
          movePlayer({ x: 1, y: 0 });
          moved = true;
        }

        if (moved) {
          lastMoveTime.current = timestamp;
        }
      }
      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);

    return () => cancelAnimationFrame(animationFrameId);
  }, [playerPos, blockPositions]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        if (!keysDown.current.has(e.key)) {
          keysDown.current.add(e.key);
          lastMoveTime.current = performance.now();

          switch (e.key) {
            case 'ArrowUp': movePlayer({ x: 0, y: -1 }); break;
            case 'ArrowDown': movePlayer({ x: 0, y: 1 }); break;
            case 'ArrowLeft': movePlayer({ x: -1, y: 0 }); break;
            case 'ArrowRight': movePlayer({ x: 1, y: 0 }); break;
          }
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        keysDown.current.delete(e.key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
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

  const getBlockColors = (blockType: BlockType) => {
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

  const getDestinationStyle = (destType: BlockType) => {
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

  if (isWon) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-mesh-gradient px-4">
        <div className="text-center glass-panel p-8 rounded-3xl animate-float">
          <h1 className="text-5xl font-black text-white mb-2 drop-shadow-md animate-float">You Won!</h1>
          <p className="text-xl text-cyan-400 mb-6 font-black tracking-wide">
            Solved in {history.length} moves!
          </p>
          {rewardedAmount !== null && rewardedAmount > 0 && (
            <div className="mb-6 animate-pulse text-base font-extrabold text-cyan-300 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)] bg-cyan-950/40 border border-cyan-500/30 rounded-2xl py-2 px-4 inline-flex items-center gap-1.5 justify-center">
              <span className="text-cyan-400 text-lg">✦</span>
              <span>+{rewardedAmount} Neon Shards!</span>
            </div>
          )}
          {stats && (
            <div className="grid grid-cols-3 gap-4 border-t border-b border-white/10 py-4 my-6 font-mono text-sm text-white/85 bg-black/20 rounded-xl px-2">
              <div>
                <div className="text-[9px] text-white/50 uppercase tracking-wider mb-1">World Record</div>
                <div className="text-lg font-black text-yellow-400">{stats.bestScore > 0 ? `${stats.bestScore}m` : '-'}</div>
              </div>
              <div>
                <div className="text-[9px] text-white/50 uppercase tracking-wider mb-1">World Avg</div>
                <div className="text-lg font-black text-cyan-400">{stats.averageScore > 0 ? `${Math.round(stats.averageScore)}m` : '-'}</div>
              </div>
              <div>
                <div className="text-[9px] text-white/50 uppercase tracking-wider mb-1">Total Clears</div>
                <div className="text-lg font-black text-green-400">{stats.totalCompletions}</div>
              </div>
            </div>
          )}
          <div className="flex flex-col gap-4 w-full">
            <button
              onClick={handleReset}
              className="rounded-xl theme-btn px-6 py-4 text-xl font-bold"
            >
              Play Again
            </button>
            {hasNextLevel && (
              <button
                onClick={onNextLevel}
                className="rounded-xl theme-btn px-6 py-4 text-xl font-bold"
              >
                Continue to Next Level
              </button>
            )}
            <button
              onClick={onReturnToMenu}
              className="rounded-xl theme-btn px-6 py-4 text-xl font-bold"
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
    <div
      ref={containerRef}
      tabIndex={-1}
      className="flex min-h-screen flex-col bg-mesh-gradient px-2 sm:px-4 py-2 sm:py-6 outline-none"
    >
      {difficulty === 'daily' && (
        <div className="w-full flex justify-center mb-2 shrink-0">
          <button
            onClick={onReturnToMenu}
            className="w-full max-w-xs bg-black/60 hover:bg-blue-600/30 text-white font-bold py-1.5 px-4 rounded-xl transition-all border-2 border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.4)] text-center text-xs tracking-wide uppercase hover:scale-102 active:scale-98 cursor-pointer"
          >
            🎮 Play Other Puzzles
          </button>
        </div>
      )}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mb-2 sm:mb-6">
        <h1 className="text-lg sm:text-3xl font-black text-white drop-shadow-md">{difficulty ? difficultyLabels[difficulty] : 'Campaign'}</h1>
        <div className="flex gap-1.5 sm:gap-3 w-full sm:w-auto justify-end sm:justify-start">
          <button
            onClick={handleUndo}
            disabled={history.length === 0 || isWon}
            className="flex-1 sm:flex-none rounded-lg px-2 py-1.5 sm:px-4 sm:py-2 text-[11px] sm:text-base font-bold theme-btn text-center"
          >
            ↩ Undo
          </button>
          <button
            onClick={handleUndoFive}
            disabled={history.length === 0 || isWon}
            className="flex-1 sm:flex-none rounded-lg px-2 py-1.5 sm:px-4 sm:py-2 text-[11px] sm:text-base font-bold theme-btn text-center"
          >
            ⏪ Undo 5
          </button>
          <button
            onClick={handleReset}
            className="flex-1 sm:flex-none rounded-lg px-2 py-1.5 sm:px-4 sm:py-2 text-[11px] sm:text-base font-bold theme-btn text-center"
          >
            🔄 Reset
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="rounded-lg px-2.5 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base font-bold theme-btn text-center flex items-center justify-center cursor-pointer"
            title="Settings"
          >
            ⚙️
          </button>
          {difficulty !== 'daily' && (
            <button
              onClick={onReturnToMenu}
              className="flex-1 sm:flex-none rounded-lg px-2 py-1.5 sm:px-4 sm:py-2 text-[11px] sm:text-base font-bold theme-btn text-center"
            >
              🏠 Menu
            </button>
          )}
        </div>
      </div>

      {totalBlocks > 0 && (
        <div className="w-full max-w-2xl mx-auto mb-2 sm:mb-6">
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
          className="glass-panel p-1 sm:p-2 relative rounded-2xl sm:rounded-3xl animate-fade-in"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${levelConfig.gridSize}, 1fr)`,
            gap: '1px',
            maxWidth: '100vw',
            maxHeight: '100vh',
            width: 'fit-content',
            aspectRatio: '1',
            '--grid-size': levelConfig.gridSize,
          } as React.CSSProperties}
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
                className={`aspect-square ${radiusStyle} flex items-center justify-center text-lg sm:text-2xl font-bold transition-all ${bgColor} ${borderStyle} ${shadowStyle}`}
                style={{ width: 'var(--cell-size)', height: 'var(--cell-size)' }}
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
              pointerEvents: 'none'
            }}
          >
            {blockPositions.map((block, idx) => {
              const destination = destinationMap.get(positionKey(block.pos));
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

              const prevPos = prevBlockPositions.current[idx]?.pos || block.pos;
              const dist = Math.abs(block.pos.x - prevPos.x) + Math.abs(block.pos.y - prevPos.y);
              const duration = dist === 0 ? 0.15 : Math.max(0.15, dist * 0.08);

              return (
                <div
                  key={`block-${idx}`}
                  className="absolute animate-slide aspect-square"
                  style={{
                    width: 'var(--cell-size)',
                    height: 'var(--cell-size)',
                    transitionDuration: `${duration}s`,
                    transform: `translate(calc(${block.pos.x} * (var(--cell-size) + 1px)), calc(${block.pos.y} * (var(--cell-size) + 1px)))`,
                  }}
                >
                  {content}
                </div>
              );
            })}

            {(() => {
              const prevPos = prevPlayerPos.current;
              const dist = Math.abs(playerPos.x - prevPos.x) + Math.abs(playerPos.y - prevPos.y);
              const duration = dist === 0 ? 0.15 : Math.max(0.15, dist * 0.08);

              return (
                <div
                  className="absolute animate-slide aspect-square"
                  style={{
                    width: 'var(--cell-size)',
                    height: 'var(--cell-size)',
                    transitionDuration: `${duration}s`,
                    transform: `translate(calc(${playerPos.x} * (var(--cell-size) + 1px)), calc(${playerPos.y} * (var(--cell-size) + 1px)))`,
                  }}
                >
                  <div className="w-full h-full rounded-full flex items-center justify-center bg-black/75 border-2 border-white shadow-[0_0_15px_rgba(255,255,255,0.7)] relative overflow-hidden animate-pulse">
                    {/* Inner glowing core */}
                    <div className="w-1/3 h-1/3 bg-white rounded-full shadow-[0_0_12px_rgba(255,255,255,1)]"></div>
                    {/* Outer ring */}
                    <div className="absolute inset-0.5 border border-dashed border-white/25 rounded-full animate-[spin_8s_linear_infinite]"></div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass-panel p-6 rounded-3xl w-full max-w-sm animate-float border border-white/10 text-center">
            <h2 className="text-2xl font-black text-white mb-6 tracking-wide">Settings</h2>

            <div className="space-y-4 mb-8">
              {/* Sound Toggle */}
              <div className="flex items-center justify-between bg-black/40 border border-white/5 p-4 rounded-2xl">
                <span className="text-white font-bold text-sm">Sound Effects</span>
                <button
                  onClick={() => {
                    const newMuted = !muted;
                    setMuted(newMuted);
                    setMutedState(newMuted);
                  }}
                  className="px-4 py-2 rounded-xl font-bold text-xs theme-btn cursor-pointer"
                >
                  {muted ? '🔇 Muted' : '🔊 Sound On'}
                </button>
              </div>
            </div>

            <button
              onClick={() => setShowSettings(false)}
              className="w-full rounded-xl theme-btn py-3 text-sm font-bold uppercase tracking-wider cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
