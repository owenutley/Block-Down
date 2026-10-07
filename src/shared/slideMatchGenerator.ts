import { Position, PuzzleBlock, PuzzleTarget, SlideMatchPuzzle } from './types';
import { calculateBlockSlide, solveSlideMatch } from './slideMatch';

const BLOCK_COLORS = ['blue', 'red', 'green', 'yellow', 'purple', 'cyan'];
const CARDINAL_DIRS = ['Up', 'Down', 'Left', 'Right'] as const;

type GeneratorConfig = {
  width: number;
  height: number;
  blockCount: number;
  minMoves: number;
  maxMoves: number;
  wallCount: number;
};

const getStageConfig = (stage: number): GeneratorConfig => {
  if (stage <= 2) {
    return {
      width: 5,
      height: 5,
      blockCount: 1,
      minMoves: 1,
      maxMoves: 2,
      wallCount: 0,
    };
  }
  if (stage <= 4) {
    return {
      width: 5,
      height: 5,
      blockCount: stage === 3 ? 1 : 2,
      minMoves: 2,
      maxMoves: 3,
      wallCount: 1,
    };
  }
  if (stage <= 8) {
    return {
      width: 6,
      height: 6,
      blockCount: 2,
      minMoves: 2,
      maxMoves: 3,
      wallCount: 2,
    };
  }
  if (stage <= 14) {
    return {
      width: 6,
      height: 6,
      blockCount: stage > 10 ? 3 : 2,
      minMoves: 3,
      maxMoves: 4,
      wallCount: 3,
    };
  }
  if (stage <= 22) {
    return {
      width: 7,
      height: 7,
      blockCount: 3,
      minMoves: 3,
      maxMoves: 5,
      wallCount: 4,
    };
  }
  return {
    width: 7,
    height: 7,
    blockCount: stage > 30 ? 4 : 3,
    minMoves: 4,
    maxMoves: 6,
    wallCount: 5,
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
 */
export const generateEndlessSlideMatchPuzzle = (stageNumber: number): SlideMatchPuzzle => {
  const config = getStageConfig(stageNumber);
  const maxAttempts = 60;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Determine dimensions and counts with slight variation
    const width = config.width;
    const height = config.height;
    const blockCount = config.blockCount;

    // Pick unique target positions
    const usedPositions = new Set<string>();
    const targets: PuzzleTarget[] = [];
    const colors = BLOCK_COLORS.slice(0, blockCount);

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
      difficulty: stageNumber <= 5 ? 'easy' : stageNumber <= 15 ? 'medium' : 'hard',
      width,
      height,
      walls,
      blocks: currentBlocks,
      targets,
      portals: [],
      par: 1,
    };

    const solveRes = solveSlideMatch(puzzleCandidate, 25000);
    if (solveRes.solvable && solveRes.minSlides >= config.minMoves) {
      puzzleCandidate.par = solveRes.minSlides;
      return puzzleCandidate;
    }
  }

  // Robust fallback if random scramble didn't match strict move criteria
  // Provide an immediate clean puzzle guaranteed solvable
  return createFallbackPuzzle(stageNumber, config);
};

const createFallbackPuzzle = (stage: number, config: GeneratorConfig): SlideMatchPuzzle => {
  const width = Math.max(5, config.width);
  const height = Math.max(5, config.height);

  if (config.blockCount === 1) {
    return {
      id: `endless-stage-${stage}-fallback`,
      title: `Stage ${stage}`,
      description: `Solve within 30s!`,
      difficulty: 'easy',
      width,
      height,
      walls: [{ x: 2, y: 1 }],
      targets: [{ id: 't1', x: 4, y: 4, color: 'blue' }],
      blocks: [{ id: 'b1', x: 0, y: 0, color: 'blue' }],
      portals: [],
      par: 2,
    };
  }

  return {
    id: `endless-stage-${stage}-fallback`,
    title: `Stage ${stage}`,
    description: `Solve within 30s!`,
    difficulty: 'medium',
    width,
    height,
    walls: [{ x: 2, y: 2 }],
    targets: [
      { id: 't1', x: width - 1, y: height - 1, color: 'blue' },
      { id: 't2', x: 0, y: height - 1, color: 'red' },
    ],
    blocks: [
      { id: 'b1', x: 1, y: 0, color: 'blue' },
      { id: 'b2', x: width - 2, y: 0, color: 'red' },
    ],
    portals: [],
    par: 2,
  };
};
