import React, { useState, useEffect, useCallback } from 'react';
import { CharacterOrb } from './ThemeBoardRenderer';
import { HexagonBlock } from './HexagonBlock';
import { trpc } from '../trpc';

type Position = { x: number; y: number };

type TutorialStep = {
  title: string;
  instruction: string;
  tip: string;
  gridSize: number;
  playerStart: Position;
  blocks: { id: string; type: string; pos: Position }[];
  destinations: { color: string; pos: Position }[];
  walls: Position[];
};

const DEFAULT_STEP: TutorialStep = {
  title: 'Step 1: Push the Block',
  instruction: 'Move into the Red Block to push it into the glowing target.',
  tip: 'Swipe, use Arrow/WASD keys, or tap the D-pad below.',
  gridSize: 4,
  playerStart: { x: 0, y: 1 },
  blocks: [{ id: 'b1', type: 'red-diamond', pos: { x: 1, y: 1 } }],
  destinations: [{ color: 'red', pos: { x: 2, y: 1 } }],
  walls: [
    { x: 3, y: 0 },
    { x: 3, y: 1 },
    { x: 3, y: 2 },
    { x: 3, y: 3 },
  ],
};

const TUTORIAL_STEPS: TutorialStep[] = [
  DEFAULT_STEP,
  {
    title: 'Step 2: Sliding Momentum',
    instruction: 'Blocks slide continuously until they hit an obstacle or wall.',
    tip: 'Push the block up — watch it slide all the way to the top wall!',
    gridSize: 4,
    playerStart: { x: 1, y: 3 },
    blocks: [{ id: 'b1', type: 'blue-square', pos: { x: 1, y: 2 } }],
    destinations: [{ color: 'blue', pos: { x: 1, y: 0 } }],
    walls: [
      { x: 0, y: 0 },
      { x: 2, y: 0 },
    ],
  },
  {
    title: 'Step 3: Match All Colors',
    instruction: 'Both colored blocks must reach their matching colored targets.',
    tip: 'Solve both to complete the training and claim your Shard bonus!',
    gridSize: 4,
    playerStart: { x: 1, y: 1 },
    blocks: [
      { id: 'b1', type: 'red-diamond', pos: { x: 1, y: 2 } },
      { id: 'b2', type: 'yellow-triangle', pos: { x: 2, y: 1 } },
    ],
    destinations: [
      { color: 'red', pos: { x: 1, y: 3 } },
      { color: 'yellow', pos: { x: 3, y: 1 } },
    ],
    walls: [
      { x: 0, y: 0 },
      { x: 3, y: 0 },
    ],
  },
];

const TutorialStepStage = ({
  step,
  onStepSolved,
}: {
  step: TutorialStep;
  onStepSolved: () => void;
}) => {
  const [playerPos, setPlayerPos] = useState<Position>(step.playerStart);
  const [blocks, setBlocks] = useState(step.blocks);
  const [isStepSolved, setIsStepSolved] = useState(false);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);

  const resetStep = useCallback(() => {
    setPlayerPos(step.playerStart);
    setBlocks(step.blocks.map(b => ({ ...b, pos: { ...b.pos } })));
    setIsStepSolved(false);
  }, [step]);

  // Movement physics for tutorial
  const move = useCallback((dx: number, dy: number) => {
    if (isStepSolved) return;

    const { gridSize, walls } = step;
    const isWall = (x: number, y: number) =>
      walls.some((w: Position) => w.x === x && w.y === y) ||
      x < 0 || x >= gridSize || y < 0 || y >= gridSize;

    const targetPos = { x: playerPos.x + dx, y: playerPos.y + dy };
    if (isWall(targetPos.x, targetPos.y)) return;

    // Check if moving into a block
    const blockIndex = blocks.findIndex(b => b.pos.x === targetPos.x && b.pos.y === targetPos.y);

    if (blockIndex === -1) {
      // Just moving player
      setPlayerPos(targetPos);
    } else {
      // Pushing block: slide block until it hits a wall or another block
      const pushedBlock = blocks[blockIndex];
      if (!pushedBlock) return;
      let currX = pushedBlock.pos.x;
      let currY = pushedBlock.pos.y;

      while (true) {
        const nextX = currX + dx;
        const nextY = currY + dy;
        const hitWall = isWall(nextX, nextY);
        const hitOtherBlock = blocks.some((b, i) => i !== blockIndex && b.pos.x === nextX && b.pos.y === nextY);

        if (hitWall || hitOtherBlock) {
          break;
        }
        currX = nextX;
        currY = nextY;
      }

      // If the block could move at least 1 cell, move block and advance player
      if (currX !== pushedBlock.pos.x || currY !== pushedBlock.pos.y) {
        const nextBlocks = blocks.map((b, i) =>
          i === blockIndex ? { ...b, pos: { x: currX, y: currY } } : b
        );
        setBlocks(nextBlocks);
        setPlayerPos(targetPos);

        const allSolved = step.destinations.every(dest =>
          nextBlocks.some(b => b.pos.x === dest.pos.x && b.pos.y === dest.pos.y)
        );

        if (allSolved) {
          setIsStepSolved(true);
          setTimeout(() => {
            onStepSolved();
          }, 600);
        }
      }
    }
  }, [blocks, isStepSolved, onStepSolved, playerPos, step]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          move(0, -1);
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          move(0, 1);
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          move(-1, 0);
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          move(1, 0);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [move]);

  // Touch swipe support
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (touch) {
      setTouchStart({ x: touch.clientX, y: touch.clientY });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;
    const touch = e.changedTouches[0];
    if (!touch) return;

    const dx = touch.clientX - touchStart.x;
    const dy = touch.clientY - touchStart.y;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    if (Math.max(absX, absY) > 25) {
      if (absX > absY) {
        move(dx > 0 ? 1 : -1, 0);
      } else {
        move(0, dy > 0 ? 1 : -1);
      }
    }
    setTouchStart(null);
  };

  return (
    <>
      {/* Step Header */}
      <div className="mb-2">
        <h2 className="text-lg sm:text-xl font-black text-cyan-300 tracking-tight">
          {step.title}
        </h2>
        <p className="text-xs text-zinc-200 mt-0.5 leading-snug">
          {step.instruction}
        </p>
      </div>

      {/* Interactive Grid Canvas */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="relative p-2 rounded-2xl bg-slate-950/80 border border-cyan-500/30 shadow-inner my-2 flex items-center justify-center"
      >
        <div
          className="grid gap-1"
          style={{
            gridTemplateColumns: `repeat(${step.gridSize}, 1fr)`,
            width: 'min(240px, 60vw)',
            height: 'min(240px, 60vw)',
          }}
        >
          {Array.from({ length: step.gridSize * step.gridSize }).map((_, i) => {
            const x = i % step.gridSize;
            const y = Math.floor(i / step.gridSize);
            const isWallCell = step.walls.some((w: Position) => w.x === x && w.y === y);
            const destCell = step.destinations.find(d => d.pos.x === x && d.pos.y === y);
            const blockCell = blocks.find(b => b.pos.x === x && b.pos.y === y);
            const isPlayerCell = playerPos.x === x && playerPos.y === y;

            return (
              <div
                key={`${x}-${y}`}
                className={`relative aspect-square rounded-lg flex items-center justify-center text-xs transition-all ${
                  isWallCell
                    ? 'bg-slate-900 shadow-[inset_1px_1px_3px_rgba(0,0,0,0.8)]'
                    : destCell
                    ? destCell.color === 'red'
                      ? 'bg-red-950/60 border-2 border-dashed border-red-500/80 shadow-[0_0_10px_rgba(239,68,68,0.3)]'
                      : destCell.color === 'blue'
                      ? 'bg-blue-950/60 border-2 border-dashed border-blue-500/80 shadow-[0_0_10px_rgba(59,130,246,0.3)]'
                      : 'bg-yellow-950/60 border-2 border-dashed border-yellow-500/80 shadow-[0_0_10px_rgba(234,179,8,0.3)]'
                    : 'bg-slate-900/60 border border-white/5'
                }`}
              >
                {/* Destination icon */}
                {destCell && !blockCell && (
                  <div className="w-2.5 h-2.5 rounded-full bg-white/30 animate-ping" />
                )}

                {/* Block Component */}
                {blockCell && (
                  <div className="w-full h-full p-0.5 z-10 transition-transform">
                    <HexagonBlock
                      blockType={blockCell.type}
                      isSolved={step.destinations.some(
                        d => d.pos.x === blockCell.pos.x && d.pos.y === blockCell.pos.y
                      )}
                    />
                  </div>
                )}

                {/* Player Orb */}
                {isPlayerCell && (
                  <div className="w-full h-full p-1 z-20 transition-all pointer-events-none">
                    <CharacterOrb id="neon" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Hint Tip */}
      <p className="text-[11px] text-cyan-400/90 font-medium mb-3">
        {step.tip}
      </p>

      {/* D-Pad Buttons for Touch / Mouse Users */}
      <div className="flex flex-col items-center gap-1 mb-2">
        <button
          onClick={() => move(0, -1)}
          className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 active:scale-90 border border-white/20 flex items-center justify-center text-sm font-bold transition-all cursor-pointer shadow"
          aria-label="Up"
        >
          ▲
        </button>
        <div className="flex items-center gap-1">
          <button
            onClick={() => move(-1, 0)}
            className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 active:scale-90 border border-white/20 flex items-center justify-center text-sm font-bold transition-all cursor-pointer shadow"
            aria-label="Left"
          >
            ◄
          </button>
          <button
            onClick={resetStep}
            className="w-10 h-10 rounded-xl bg-red-500/20 hover:bg-red-500/30 active:scale-90 border border-red-500/40 flex items-center justify-center text-xs font-bold text-red-300 transition-all cursor-pointer shadow"
            title="Reset Step"
            aria-label="Reset"
          >
            ↺
          </button>
          <button
            onClick={() => move(1, 0)}
            className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 active:scale-90 border border-white/20 flex items-center justify-center text-sm font-bold transition-all cursor-pointer shadow"
            aria-label="Right"
          >
            ►
          </button>
        </div>
        <button
          onClick={() => move(0, 1)}
          className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 active:scale-90 border border-white/20 flex items-center justify-center text-sm font-bold transition-all cursor-pointer shadow"
          aria-label="Down"
        >
          ▼
        </button>
      </div>
    </>
  );
};

export const MiniTutorialModal = ({
  onComplete,
  onSkip,
}: {
  onComplete: () => void;
  onSkip: () => void;
}) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const currentStep = TUTORIAL_STEPS[stepIndex] ?? DEFAULT_STEP;

  const handleStepSolved = () => {
    if (stepIndex < TUTORIAL_STEPS.length - 1) {
      setStepIndex(prev => prev + 1);
    } else {
      setIsFinished(true);
    }
  };

  const handleClaim = async () => {
    try {
      await trpc.currency.completeTutorial.mutate();
    } catch {
      // Graceful fallback
    }
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/85 backdrop-blur-md px-3 sm:px-4 py-4 pointer-events-auto select-none overflow-y-auto">
      <div className="glass-panel max-w-sm sm:max-w-md w-full p-5 sm:p-7 rounded-3xl border border-cyan-500/40 text-white relative shadow-[0_0_50px_rgba(6,182,212,0.25)] flex flex-col items-center text-center my-auto">
        {/* Top Bar: Step Indicator & Skip Button */}
        <div className="w-full flex items-center justify-between mb-3 text-xs">
          <div className="flex items-center gap-1.5">
            {TUTORIAL_STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === stepIndex
                    ? 'w-6 bg-cyan-400 shadow-[0_0_8px_#22d3ee]'
                    : i < stepIndex
                    ? 'w-2 bg-emerald-400'
                    : 'w-2 bg-white/20'
                }`}
              />
            ))}
          </div>

          <button
            onClick={onSkip}
            className="text-xs text-white/50 hover:text-white transition-colors cursor-pointer px-2 py-1 rounded-md hover:bg-white/10"
          >
            Skip Tutorial ✕
          </button>
        </div>

        {/* Victory Screen when finished */}
        {isFinished ? (
          <div className="flex flex-col items-center animate-fade-in py-2">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(245,158,11,0.4)] mb-4 animate-bounce-subtle">
              🏆
            </div>

            <h2 className="text-2xl font-black text-amber-300 tracking-tight neon-text-title mb-1">
              Tutorial Complete!
            </h2>
            <p className="text-xs text-zinc-300 mb-4 max-w-xs">
              You know the mechanics! Push blocks onto matching color targets and slide your way to victory.
            </p>

            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm font-extrabold mb-6 shadow-inner">
              <span>💎</span>
              <span>+50 Shards Bonus Reward</span>
            </div>

            <button
              onClick={handleClaim}
              className="w-full rounded-2xl theme-btn py-3.5 text-base font-extrabold transition-all hover:scale-102 active:scale-98 shadow-lg cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Claim & Play Now</span>
              <span>→</span>
            </button>
          </div>
        ) : (
          <TutorialStepStage
            key={stepIndex}
            step={currentStep}
            onStepSolved={handleStepSolved}
          />
        )}
      </div>
    </div>
  );
};
