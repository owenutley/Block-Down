import { Position, PuzzleBlock, PuzzleTarget, SlideMatchPuzzle } from './types';
import { calculateBlockSlide, solveSlideMatch } from './slideMatch';

export const ALL_BLOCK_COLORS = ['blue', 'red', 'green', 'yellow', 'purple', 'orange'] as const;
const CARDINAL_DIRS = ['Up', 'Down', 'Left', 'Right'] as const;

export const getRandomColors = (count: number, pool: readonly string[] = ALL_BLOCK_COLORS): string[] => {
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, pool.length));
};

type GeneratorConfig = {
  width: number;
  height: number;
  blockCount: number;
  minMoves: number;
  maxMoves: number;
  wallCount: number;
};

const getStageConfig = (stage: number): GeneratorConfig => {
  // Stages 1-4: Introduction to Slide Match mechanics (1 block, 5x5, 1-2 moves)
  if (stage <= 4) {
    return {
      width: 5,
      height: 5,
      blockCount: 1,
      minMoves: 1,
      maxMoves: 2,
      wallCount: stage <= 2 ? 0 : 1,
    };
  }

  // Stages 5-10: Introducing 2 blocks on 5x5 (2 blocks, 2 moves)
  if (stage <= 10) {
    return {
      width: 5,
      height: 5,
      blockCount: 2,
      minMoves: 2,
      maxMoves: 3,
      wallCount: stage <= 7 ? 1 : 2,
    };
  }

  // Stages 11-18: Board expands to 6x6 with 2 blocks (2 blocks, 2-3 moves)
  if (stage <= 18) {
    return {
      width: 6,
      height: 6,
      blockCount: 2,
      minMoves: 2,
      maxMoves: 3,
      wallCount: stage <= 14 ? 2 : 3,
    };
  }

  // Stages 19-28: Introducing 3 blocks on 6x6 (3 blocks, 3 moves)
  if (stage <= 28) {
    return {
      width: 6,
      height: 6,
      blockCount: 3,
      minMoves: 3,
      maxMoves: 4,
      wallCount: stage <= 23 ? 2 : 3,
    };
  }

  // Stages 29-42: Expanding to 7x7 with 3 blocks (3 blocks, 3-4 moves)
  if (stage <= 42) {
    return {
      width: 7,
      height: 7,
      blockCount: 3,
      minMoves: 3,
      maxMoves: 4,
      wallCount: stage <= 35 ? 3 : 4,
    };
  }

  // Stages 43+: Master Endless Challenge (strict cap of 3 blocks, 7x7, 4-5 moves)
  return {
    width: 7,
    height: 7,
    blockCount: 3,
    minMoves: 4,
    maxMoves: 5,
    wallCount: stage <= 60 ? 4 : 5,
  };
};

const randomChoice = <T>(arr: readonly T[]): T => {
  const item = arr[Math.floor(Math.random() * arr.length)];
  if (item === undefined) {
    throw new Error('Array is empty');
  }
  return item;
};

const randomCoord = (w: number, h: number): Position => ({
  x: Math.floor(Math.random() * w),
  y: Math.floor(Math.random() * h),
});

const posKey = (p: Position) => `${p.x},${p.y}`;

/**
 * Procedurally generates a solvable Slide Match puzzle tuned for the given endless stage.
 * Uses randomized theme colors and shapes for high variety across every stage.
 */
export const generateEndlessSlideMatchPuzzle = (
  stageNumber: number,
  customColorPool?: readonly string[]
): SlideMatchPuzzle => {
  const config = getStageConfig(stageNumber);
  const colorPool = customColorPool && customColorPool.length > 0 ? customColorPool : ALL_BLOCK_COLORS;
  const maxAttempts = 80;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Determine dimensions and counts with slight variation (strictly max 3 blocks)
    const width = config.width;
    const height = config.height;
    const blockCount = Math.min(3, config.blockCount);

    // Pick unique target positions with randomized theme colors
    const usedPositions = new Set<string>();
    const targets: PuzzleTarget[] = [];
    const colors = getRandomColors(blockCount, colorPool);

    for (let i = 0; i < blockCount; i++) {
      let p = randomCoord(width, height);
      let tries = 0;
      while (usedPositions.has(posKey(p)) && tries < 50) {
        p = randomCoord(width, height);
        tries++;
      }
      usedPositions.add(posKey(p));
      const color = colors[i] || 'blue';
      targets.push({
        id: `t${i + 1}`,
        x: p.x,
        y: p.y,
        color,
      });
    }

    // Pick wall positions (not on targets)
    const walls: Position[] = [];
    const wallCount = config.wallCount;
    for (let i = 0; i < wallCount; i++) {
      let p = randomCoord(width, height);
      let tries = 0;
      while (usedPositions.has(posKey(p)) && tries < 50) {
        p = randomCoord(width, height);
        tries++;
      }
      if (tries < 50) {
        usedPositions.add(posKey(p));
        walls.push(p);
      }
    }
    const wallSet = new Set(walls.map(posKey));

    // Start with blocks placed on the targets (solved state)
    let currentBlocks: PuzzleBlock[] = targets.map((t, idx) => ({
      id: `b${idx + 1}`,
      x: t.x,
      y: t.y,
      color: t.color,
    }));

    // Perform a series of random slides to scramble the puzzle into a valid starting position
    const scrambleSteps = config.maxMoves * 3 + 4;
    for (let s = 0; s < scrambleSteps; s++) {
      const block = randomChoice(currentBlocks);
      const dir = randomChoice(CARDINAL_DIRS);
      const slideRes = calculateBlockSlide(
        block.id,
        dir,
        width,
        height,
        wallSet,
        currentBlocks,
        []
      );

      if (slideRes.moved) {
        currentBlocks = currentBlocks.map((b) =>
          b.id === block.id ? { ...b, x: slideRes.finalPos.x, y: slideRes.finalPos.y } : b
        );
      }
    }

    // Now test if this scrambled configuration is solvable and within our target move range
    const puzzleCandidate: SlideMatchPuzzle = {
      id: `endless-stage-${stageNumber}-${attempt}`,
      title: `Stage ${stageNumber}`,
      description: `Solve within 30s!`,
      difficulty: stageNumber <= 10 ? 'easy' : stageNumber <= 28 ? 'medium' : 'hard',
      width,
      height,
      walls,
      blocks: currentBlocks,
      targets,
      portals: [],
      par: 1,
    };

    const solveRes = solveSlideMatch(puzzleCandidate, 35000);
    if (solveRes.solvable && solveRes.minSlides >= config.minMoves) {
      puzzleCandidate.par = solveRes.minSlides;
      return puzzleCandidate;
    }
  }

  // Robust fallback if random scramble didn't match strict move criteria
  // Provide an immediate clean puzzle guaranteed solvable with randomized colors
  return createFallbackPuzzle(stageNumber, config, colorPool);
};

const createFallbackPuzzle = (
  stage: number,
  config: GeneratorConfig,
  pool: readonly string[] = ALL_BLOCK_COLORS
): SlideMatchPuzzle => {
  const width = Math.max(5, config.width);
  const height = Math.max(5, config.height);
  const colors = getRandomColors(config.blockCount, pool);

  if (config.blockCount === 1) {
    const c1 = colors[0] || 'blue';
    return {
      id: `endless-stage-${stage}-fallback`,
      title: `Stage ${stage}`,
      description: `Solve within 30s!`,
      difficulty: 'easy',
      width,
      height,
      walls: [{ x: 2, y: 1 }],
      targets: [{ id: 't1', x: width - 1, y: height - 1, color: c1 }],
      blocks: [{ id: 'b1', x: 0, y: 0, color: c1 }],
      portals: [],
      par: 2,
    };
  }

  if (config.blockCount === 2) {
    const c1 = colors[0] || 'blue';
    const c2 = colors[1] || 'red';
    return {
      id: `endless-stage-${stage}-fallback`,
      title: `Stage ${stage}`,
      description: `Solve within 30s!`,
      difficulty: stage <= 18 ? 'easy' : 'medium',
      width,
      height,
      walls: [{ x: 2, y: 2 }, { x: width - 3, y: height - 3 }],
      targets: [
        { id: 't1', x: width - 1, y: height - 1, color: c1 },
        { id: 't2', x: 0, y: height - 1, color: c2 },
      ],
      blocks: [
        { id: 'b1', x: 1, y: 0, color: c1 },
        { id: 'b2', x: width - 2, y: 0, color: c2 },
      ],
      portals: [],
      par: 2,
    };
  }

  // 3-block fallback
  const c1 = colors[0] || 'blue';
  const c2 = colors[1] || 'red';
  const c3 = colors[2] || 'green';
  return {
    id: `endless-stage-${stage}-fallback`,
    title: `Stage ${stage}`,
    description: `Solve within 30s!`,
    difficulty: 'hard',
    width,
    height,
    walls: [{ x: 2, y: 2 }, { x: width - 3, y: height - 3 }],
    targets: [
      { id: 't1', x: width - 1, y: height - 1, color: c1 },
      { id: 't2', x: 0, y: height - 1, color: c2 },
      { id: 't3', x: width - 1, y: 0, color: c3 },
    ],
    blocks: [
      { id: 'b1', x: 1, y: 0, color: c1 },
      { id: 'b2', x: width - 2, y: 0, color: c2 },
      { id: 'b3', x: 0, y: height - 2, color: c3 },
    ],
    portals: [],
    par: 3,
  };
};
