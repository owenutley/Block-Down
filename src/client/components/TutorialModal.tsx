import { useState, useEffect, useRef } from 'react';
import { trpc } from '../trpc';
import { TutorialPage, Position, BlockData, DestinationData } from '../types';
import { ThemeBoardRenderer } from './ThemeBoardRenderer';
import { colorToBlockType, dirToVector, getNextPosWithPortalsDetails } from '../utils/puzzle';

const DEFAULT_SLIDES: TutorialPage[] = [
  {
    id: 'tut-basics',
    order: 0,
    title: 'How to Play: The Basics',
    subtitle: 'Core Objective',
    description: 'You control the white glowing Core. Navigate around the grid to push colorful block shapes into their matching dashed target slots.',
    puzzle: {
      width: 5,
      height: 5,
      player: { x: 1, y: 2 },
      walls: [
        { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 },
        { x: 0, y: 4 }, { x: 1, y: 4 }, { x: 2, y: 4 }, { x: 3, y: 4 }, { x: 4, y: 4 },
      ],
      blocks: [{ id: 'b1', color: 'blue', x: 2, y: 2 }],
      targets: [{ id: 't1', color: 'blue', x: 4, y: 2 }],
      solutionMoves: ['Right'],
    },
  },
  {
    id: 'tut-ice-physics',
    order: 1,
    title: 'Ice-Slide Physics',
    subtitle: 'Inertia Movement',
    description: 'When you push a block, it slides with ice-like momentum and will not stop until it collides with a wall or another block! Plan stopping barriers before executing your push.',
    puzzle: {
      width: 6,
      height: 5,
      player: { x: 1, y: 1 },
      walls: [
        { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 }, { x: 5, y: 0 },
        { x: 0, y: 4 }, { x: 1, y: 4 }, { x: 2, y: 4 }, { x: 3, y: 4 }, { x: 4, y: 4 }, { x: 5, y: 4 },
        { x: 5, y: 1 }, { x: 5, y: 3 },
      ],
      blocks: [{ id: 'b1', color: 'red', x: 2, y: 1 }],
      targets: [{ id: 't1', color: 'red', x: 4, y: 2 }],
      solutionMoves: ['Right', 'Down'],
    },
  },
  {
    id: 'tut-stars-rewards',
    order: 2,
    title: 'Star Ratings & Rewards',
    subtitle: 'Mastery & Economy',
    description: 'Every puzzle has an optimal Par push target. Fewer pushes earn higher star ratings and bonus Neon Shards (✦)! Use shards in the Shop to equip custom themes and character skins.',
  },
  {
    id: 'tut-daily-streaks',
    order: 3,
    title: 'Daily Streaks & Community',
    subtitle: 'Daily Routines',
    description: 'Play the Daily Puzzle every day to build your Daily Streak. Reach 3-day, 7-day, and 30-day streak milestones for massive shard payouts! Share your daily score card in post comments.',
  },
];

export const TutorialModal = ({ onClose }: { onClose: () => void }) => {
  const [slide, setSlide] = useState(0);
  const [pages, setPages] = useState<TutorialPage[]>(DEFAULT_SLIDES);

  // Puzzle interactive states for current slide
  const [playerPos, setPlayerPos] = useState<Position>({ x: 0, y: 0 });
  const [blockPositions, setBlockPositions] = useState<BlockData[]>([]);
  const prevBlocksRef = useRef<BlockData[]>([]);
  const prevPlayerRef = useRef<Position>({ x: 0, y: 0 });
  const [lastAction, setLastAction] = useState<'move' | 'teleport' | 'reset' | 'load'>('load');

  const demoTimerRef = useRef<NodeJS.Timeout | null>(null);

  const clearDemoTimer = () => {
    if (demoTimerRef.current) {
      clearTimeout(demoTimerRef.current);
      demoTimerRef.current = null;
    }
  };

  useEffect(() => {
    trpc.howto.getAll.query()
      .then((res) => {
        if (res && res.length > 0) {
          setPages(res);
        }
      })
      .catch(() => {});
  }, []);

  const current = pages[slide] || pages[0] || DEFAULT_SLIDES[0]!;

  // Auto-playing looping demo effect
  useEffect(() => {
    clearDemoTimer();

    if (!current.puzzle || !current.puzzle.solutionMoves || current.puzzle.solutionMoves.length === 0) {
      return;
    }

    const p = current.puzzle;
    const moves = p.solutionMoves;

    let step = 0;
    let curPlayer = { ...p.player };
    let curBlocks: BlockData[] = p.blocks.map((b) => ({
      id: b.id,
      type: colorToBlockType(b.color),
      pos: { x: b.x, y: b.y },
    }));

    const runStep = () => {
      if (step === 0) {
        // Reset to initial positions
        curPlayer = { ...p.player };
        curBlocks = p.blocks.map((b) => ({
          id: b.id,
          type: colorToBlockType(b.color),
          pos: { x: b.x, y: b.y },
        }));
        setPlayerPos(curPlayer);
        setBlockPositions(curBlocks);
        prevPlayerRef.current = curPlayer;
        prevBlocksRef.current = curBlocks;
        setLastAction('reset');

        step++;
        demoTimerRef.current = setTimeout(runStep, 600);
        return;
      }

      if (step > moves.length) {
        // Pause briefly after puzzle is solved, then loop back
        step = 0;
        demoTimerRef.current = setTimeout(runStep, 1050);
        return;
      }

      const moveStr = moves[step - 1]!;
      const dirVec = dirToVector(moveStr as any);

      // Check player portal entry
      const portalOnCurrentCell = (p.portals || []).find(pt => pt.x === curPlayer.x && pt.y === curPlayer.y);
      let targetPlayerPos = { x: curPlayer.x + dirVec.x, y: curPlayer.y + dirVec.y };

      if (portalOnCurrentCell) {
        const pVec = dirToVector(portalOnCurrentCell.dir as any);
        if (pVec.x === -dirVec.x && pVec.y === -dirVec.y) {
          const exitPortal = (p.portals || []).find(
            pt => pt.color.toLowerCase() === portalOnCurrentCell.color.toLowerCase() && pt.id !== portalOnCurrentCell.id
          );
          if (exitPortal) {
            targetPlayerPos = { x: exitPortal.x, y: exitPortal.y };
          }
        }
      }

      const wallSet = new Set((p.walls || []).map((w) => `${w.x},${w.y}`));
      const blockMap = new Map(curBlocks.map((b, idx) => [`${b.pos.x},${b.pos.y}`, idx]));

      const blockIdx = blockMap.get(`${targetPlayerPos.x},${targetPlayerPos.y}`);

      if (blockIdx !== undefined) {
        const block = curBlocks[blockIdx];
        if (block) {
          const trajectory = getNextPosWithPortalsDetails(
            block.pos,
            dirVec,
            p.width,
            wallSet,
            curBlocks.map((b) => b.pos),
            (p.portals || []).map((pt) => ({ ...pt, color: pt.color as any }))
          );
          const finalPos = trajectory.finalPos;

          if (trajectory.entryPortal && trajectory.exitPortal) {
            const entryCell = { x: trajectory.entryPortal.x, y: trajectory.entryPortal.y };
            const exitCell = { x: trajectory.exitPortal.x, y: trajectory.exitPortal.y };

            const dist1 = Math.abs(block.pos.x - entryCell.x) + Math.abs(block.pos.y - entryCell.y);
            const stage1Duration = Math.max(135, dist1 * 70);

            // Stage 1: Slide block to entry portal
            const stage1Blocks = [...curBlocks];
            stage1Blocks[blockIdx] = { ...block, pos: entryCell, noTransition: false };

            prevPlayerRef.current = curPlayer;
            prevBlocksRef.current = curBlocks;
            curPlayer = targetPlayerPos;
            curBlocks = stage1Blocks;

            setPlayerPos(curPlayer);
            setBlockPositions(curBlocks);
            setLastAction('move');

            demoTimerRef.current = setTimeout(() => {
              // Teleport Snap to exit portal
              const snapBlocks = [...curBlocks];
              snapBlocks[blockIdx] = { ...block, pos: exitCell, noTransition: true };
              prevBlocksRef.current = snapBlocks;
              curBlocks = snapBlocks;

              setBlockPositions(curBlocks);
              setLastAction('teleport');

              demoTimerRef.current = setTimeout(() => {
                // Stage 2: Slide from exit portal to final destination
                const dist2 = Math.abs(exitCell.x - finalPos.x) + Math.abs(exitCell.y - finalPos.y);
                const stage2Duration = Math.max(135, dist2 * 70);

                const finalBlocks = [...curBlocks];
                finalBlocks[blockIdx] = { ...block, pos: finalPos, noTransition: false };
                prevBlocksRef.current = snapBlocks;
                curBlocks = finalBlocks;

                setBlockPositions(curBlocks);
                setLastAction('move');

                step++;
                demoTimerRef.current = setTimeout(runStep, stage2Duration + 180);
              }, 65);
            }, stage1Duration);

            return;
          } else {
            // Normal slide without portals
            const nextBlocks = [...curBlocks];
            nextBlocks[blockIdx] = { ...block, pos: finalPos, noTransition: false };

            prevPlayerRef.current = curPlayer;
            prevBlocksRef.current = curBlocks;
            curPlayer = targetPlayerPos;
            curBlocks = nextBlocks;

            setPlayerPos(curPlayer);
            setBlockPositions(curBlocks);
            setLastAction('move');
          }
        }
      } else {
        prevPlayerRef.current = curPlayer;
        curPlayer = targetPlayerPos;
        setPlayerPos(curPlayer);
        setLastAction('move');
      }

      step++;
      demoTimerRef.current = setTimeout(runStep, 485);
    };

    runStep();

    return () => {
      clearDemoTimer();
    };
  }, [slide, current]);

  const destinations: DestinationData[] = (current.puzzle?.targets || []).map((t) => ({
    id: t.id,
    type: colorToBlockType(t.color),
    pos: { x: t.x, y: t.y },
  }));

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/85 backdrop-blur-md px-4 pointer-events-auto">
      <div className="glass-panel max-w-lg w-full p-6 rounded-3xl border border-cyan-500/40 text-white relative animate-float shadow-[0_0_50px_rgba(6,182,212,0.25)] flex flex-col max-h-[90vh] overflow-y-auto no-scrollbar">
        <button
          onClick={() => {
            clearDemoTimer();
            onClose();
          }}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white text-2xl font-black cursor-pointer bg-white/5 hover:bg-white/10 rounded-full w-8 h-8 flex items-center justify-center transition-all z-10"
        >
          ×
        </button>

        {/* Header without emoji icon */}
        <div className="text-center mb-3 pt-2">
          <h2 className="text-2xl font-black neon-text-title tracking-tight">{current.title}</h2>
          {current.subtitle && (
            <p className="text-xs text-cyan-400/80 font-mono uppercase tracking-widest mt-0.5">{current.subtitle}</p>
          )}
        </div>

        {/* Content Body */}
        <div className="space-y-4 my-2 text-center">
          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-md mx-auto">
            {current.description}
          </p>

          {/* Interactive Tutorial Looping Demo Board */}
          {current.puzzle && (
            <div className="flex flex-col items-center gap-3 py-2 bg-black/40 rounded-2xl border border-white/10 p-3">
              <div className="pointer-events-none shrink-0 flex justify-center items-center">
                <ThemeBoardRenderer
                  gridSize={current.puzzle.width}
                  walls={current.puzzle.walls}
                  destinations={destinations}
                  blocks={blockPositions}
                  portals={(current.puzzle.portals || []).map((pt) => ({ ...pt, color: pt.color as any }))}
                  playerPos={playerPos}
                  activeTheme="neon"
                  cellSize="34px"
                  gridPadding="6px"
                  isAnimated={true}
                  prevBlocks={prevBlocksRef.current}
                  prevPlayerPos={prevPlayerRef.current}
                  lastAction={lastAction}
                  showTrails={false}
                />
              </div>
            </div>
          )}
        </div>

        {/* Slide Navigation Dots */}
        <div className="flex items-center justify-center gap-2 my-3">
          {pages.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setSlide(idx)}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                slide === idx ? 'w-6 bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]' : 'w-2 bg-white/20 hover:bg-white/40'
              }`}
            />
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2.5 mt-1">
          {slide > 0 && (
            <button
              onClick={() => setSlide((prev) => prev - 1)}
              className="flex-1 rounded-2xl bg-white/10 hover:bg-white/15 py-2.5 text-sm font-bold transition-all text-zinc-300 hover:text-white cursor-pointer"
            >
              Back
            </button>
          )}
          {slide < pages.length - 1 ? (
            <button
              onClick={() => setSlide((prev) => prev + 1)}
              className="flex-1 rounded-2xl theme-btn py-2.5 text-sm font-bold transition-all hover:scale-102 active:scale-98 shadow-lg cursor-pointer"
            >
              Next
            </button>
          ) : (
            <button
              onClick={() => {
                clearDemoTimer();
                onClose();
              }}
              className="flex-1 rounded-2xl theme-btn py-2.5 text-sm font-bold transition-all hover:scale-102 active:scale-98 shadow-lg cursor-pointer"
            >
              Got It! Let&apos;s Play
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
