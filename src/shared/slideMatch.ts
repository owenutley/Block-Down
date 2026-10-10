import { Position, PuzzlePortal, PortalDirection, PuzzleBlock, PuzzleTarget, SlideMatchMove } from './types';
import { dirToVector } from './puzzle';

const positionKey = (pos: Position) => `${pos.x},${pos.y}`;

export type SlideTrajectoryStep = {
  from: Position;
  to: Position;
  entryPortal?: PuzzlePortal;
  exitPortal?: PuzzlePortal;
};

export type SlideResult = {
  finalPos: Position;
  steps: SlideTrajectoryStep[];
  moved: boolean;
};

/**
 * Computes the sliding trajectory for a single block in a direction until collision with walls,
 * grid bounds, other blocks, or teleporting through portals.
 */
export const calculateBlockSlide = (
  blockId: string,
  dir: PortalDirection | Position,
  width: number,
  height: number,
  wallSet: Set<string>,
  allBlocks: PuzzleBlock[],
  portals: PuzzlePortal[] = []
): SlideResult => {
  const block = allBlocks.find((b) => b.id === blockId);
  if (!block) {
    return { finalPos: { x: 0, y: 0 }, steps: [], moved: false };
  }

  const startPos = { x: block.x, y: block.y };
  let currentPos = { ...startPos };
  let currentDir = typeof dir === 'string' ? dirToVector(dir) : { ...dir };

  if (currentDir.x === 0 && currentDir.y === 0) {
    return { finalPos: startPos, steps: [{ from: startPos, to: startPos }], moved: false };
  }

  // Other blocks (excluding the moving one)
  const otherBlocks = allBlocks.filter((b) => b.id !== blockId);
  const otherBlockKeys = new Set(otherBlocks.map((b) => `${b.x},${b.y}`));

  let segmentStartPos = { ...startPos };
  const visitedPortals = new Set<string>();
  const steps: SlideTrajectoryStep[] = [];

  while (true) {
    const nextPos = { x: currentPos.x + currentDir.x, y: currentPos.y + currentDir.y };

    const entryPortal = portals.find((p) => {
      if (p.x !== currentPos.x || p.y !== currentPos.y) return false;
      const portalVec = dirToVector(p.dir);
      return portalVec.x === -currentDir.x && portalVec.y === -currentDir.y;
    });

    const isNextWallOrBound =
      nextPos.x < 0 ||
      nextPos.x >= width ||
      nextPos.y < 0 ||
      nextPos.y >= height ||
      wallSet.has(positionKey(nextPos));

    const blockAtNext = otherBlockKeys.has(positionKey(nextPos));

    if (isNextWallOrBound || blockAtNext) {
      if (entryPortal && !visitedPortals.has(entryPortal.id)) {
        const exitPortal = portals.find(
          (p) => p.color.toLowerCase() === entryPortal.color.toLowerCase() && p.id !== entryPortal.id
        );
        if (exitPortal) {
          const exitCell = { x: exitPortal.x, y: exitPortal.y };
          const exitBlocked = otherBlockKeys.has(positionKey(exitCell));
          const exitInWall = wallSet.has(positionKey(exitCell));

          if (!exitBlocked && !exitInWall) {
            steps.push({
              from: { ...segmentStartPos },
              to: { x: entryPortal.x, y: entryPortal.y },
              entryPortal,
              exitPortal,
            });

            visitedPortals.add(entryPortal.id);
            visitedPortals.add(exitPortal.id);
            currentPos = exitCell;
            segmentStartPos = { ...exitCell };
            currentDir = dirToVector(exitPortal.dir);
            continue;
          }
        }
      }
      break;
    }

    currentPos = nextPos;
  }

  if (segmentStartPos.x !== currentPos.x || segmentStartPos.y !== currentPos.y || steps.length === 0) {
    steps.push({
      from: { ...segmentStartPos },
      to: { ...currentPos },
    });
  }

  const moved = currentPos.x !== startPos.x || currentPos.y !== startPos.y;

  return {
    finalPos: currentPos,
    steps,
    moved,
  };
};

/**
 * Check if the current block configuration satisfies the win condition:
 * Every colored target has a block of matching color occupying its coordinate.
 */
export const isSlideMatchSolved = (blocks: PuzzleBlock[], targets: PuzzleTarget[]): boolean => {
  if (targets.length === 0) return false;

  for (const target of targets) {
    const targetColor = target.color.toLowerCase();
    if (targetColor === 'gray' || targetColor === 'grey') continue;

    const matchedBlock = blocks.find(
      (b) => b.x === target.x && b.y === target.y && b.color.toLowerCase() === targetColor
    );
    if (!matchedBlock) {
      return false;
    }
  }

  return true;
};

/**
 * Calculate stars (1-3) based on total slides and par
 */
export const calculateSlideMatchStars = (slideCount: number, par: number): 1 | 2 | 3 => {
  if (slideCount <= 0) return 3;
  if (slideCount <= par) return 3;
  const twoStarLimit = Math.max(par + 2, Math.ceil(par * 1.35));
  if (slideCount <= twoStarLimit) return 2;
  return 1;
};

const CARDINAL_DIRS: PortalDirection[] = ['Up', 'Down', 'Left', 'Right'];

export type SlideMatchSolveResult = {
  solvable: boolean;
  minSlides: number;
  solutionMoves: SlideMatchMove[];
};

/**
 * Fast BFS solver to find minimum slides and solution moves for a Slide Match puzzle.
 */
export const solveSlideMatch = (
  puzzle: {
    width: number;
    height: number;
    walls: Position[];
    blocks: PuzzleBlock[];
    targets: PuzzleTarget[];
    portals?: PuzzlePortal[] | undefined;
  },
  maxExplored = 40000
): SlideMatchSolveResult => {
  const wallSet = new Set(puzzle.walls.map(positionKey));
  const portals = puzzle.portals || [];
  const targets = puzzle.targets;

  if (isSlideMatchSolved(puzzle.blocks, targets)) {
    return { solvable: true, minSlides: 0, solutionMoves: [] };
  }

  // State representation: serialized block positions sorted by ID
  const serializeState = (blocks: PuzzleBlock[]): string => {
    return blocks
      .map((b) => `${b.id}:${b.x},${b.y}`)
      .sort()
      .join('|');
  };

  type BFSNode = {
    blocks: PuzzleBlock[];
    moves: SlideMatchMove[];
  };

  const initialBlocks = puzzle.blocks.map((b) => ({ ...b }));
  const initialKey = serializeState(initialBlocks);
  const visited = new Set<string>([initialKey]);

  const queue: BFSNode[] = [{ blocks: initialBlocks, moves: [] }];
  let queueIdx = 0;

  while (queueIdx < queue.length && queueIdx < maxExplored) {
    const current = queue[queueIdx++];
    if (!current) break;

    // Try moving each block in each of the 4 directions
    for (const block of current.blocks) {
      for (const dir of CARDINAL_DIRS) {
        const slideRes = calculateBlockSlide(
          block.id,
          dir,
          puzzle.width,
          puzzle.height,
          wallSet,
          current.blocks,
          portals
        );

        if (!slideRes.moved) continue;

        const nextBlocks = current.blocks.map((b) =>
          b.id === block.id ? { ...b, x: slideRes.finalPos.x, y: slideRes.finalPos.y } : { ...b }
        );

        const stateKey = serializeState(nextBlocks);
        if (visited.has(stateKey)) continue;
        visited.add(stateKey);

        const nextMoves = [...current.moves, { blockId: block.id, dir }];

        if (isSlideMatchSolved(nextBlocks, targets)) {
          return {
            solvable: true,
            minSlides: nextMoves.length,
            solutionMoves: nextMoves,
          };
        }

        queue.push({
          blocks: nextBlocks,
          moves: nextMoves,
        });
      }
    }
  }

  return {
    solvable: false,
    minSlides: 0,
    solutionMoves: [],
  };
};
