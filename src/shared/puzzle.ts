import { Position, PuzzlePortal, PortalDirection, Puzzle } from './types';

export const dirToVector = (dir: PortalDirection | string): Position => {
  switch (dir.toLowerCase()) {
    case 'up':
      return { x: 0, y: -1 };
    case 'down':
      return { x: 0, y: 1 };
    case 'left':
      return { x: -1, y: 0 };
    case 'right':
      return { x: 1, y: 0 };
    default:
      return { x: 0, y: 0 };
  }
};

const positionKey = (pos: Position) => `${pos.x},${pos.y}`;

export type TrajectoryStep = {
  from: Position;
  to: Position;
  entryPortal?: PuzzlePortal | undefined;
  exitPortal?: PuzzlePortal | undefined;
};

export type PortalTrajectory = {
  finalPos: Position;
  steps: TrajectoryStep[];
  entryPortal?: PuzzlePortal | undefined;
  exitPortal?: PuzzlePortal | undefined;
};

export const getNextPosWithPortalsDetails = (
  startPos: Position,
  initialDir: Position,
  gridSize: number,
  wallSet: Set<string>,
  blockPositions: Position[],
  portals: PuzzlePortal[] = []
): PortalTrajectory => {
  let currentPos = { ...startPos };
  let currentDir = { ...initialDir };
  let segmentStartPos = { ...startPos };
  const visitedPortals = new Set<string>();
  let firstEntryPortal: PuzzlePortal | undefined;
  let firstExitPortal: PuzzlePortal | undefined;
  const steps: TrajectoryStep[] = [];

  while (true) {
    const nextPos = { x: currentPos.x + currentDir.x, y: currentPos.y + currentDir.y };

    const entryPortal = portals.find((p) => {
      if (p.x !== currentPos.x || p.y !== currentPos.y) return false;
      const portalVec = dirToVector(p.dir);
      return portalVec.x === -currentDir.x && portalVec.y === -currentDir.y;
    });

    const isNextWallOrBound =
      nextPos.x < 0 ||
      nextPos.x >= gridSize ||
      nextPos.y < 0 ||
      nextPos.y >= gridSize ||
      wallSet.has(positionKey(nextPos));

    const blockAtNext = blockPositions.some(
      (b) => b.x === nextPos.x && b.y === nextPos.y && (b.x !== startPos.x || b.y !== startPos.y)
    );

    if (isNextWallOrBound || blockAtNext) {
      if (entryPortal && !visitedPortals.has(entryPortal.id)) {
        const exitPortal = portals.find(
          (p) => p.color.toLowerCase() === entryPortal.color.toLowerCase() && p.id !== entryPortal.id
        );
        if (exitPortal) {
          const exitCell = { x: exitPortal.x, y: exitPortal.y };
          const exitBlocked = blockPositions.some(
            (b) => b.x === exitCell.x && b.y === exitCell.y && (b.x !== startPos.x || b.y !== startPos.y)
          );
          if (!exitBlocked && !wallSet.has(positionKey(exitCell))) {
            if (!firstEntryPortal) firstEntryPortal = entryPortal;
            if (!firstExitPortal) firstExitPortal = exitPortal;

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

  return {
    finalPos: currentPos,
    steps,
    entryPortal: firstEntryPortal,
    exitPortal: firstExitPortal,
  };
};

export const getNextPosWithPortals = (
  startPos: Position,
  initialDir: Position,
  gridSize: number,
  wallSet: Set<string>,
  blockPositions: Position[],
  portals: PuzzlePortal[] = []
): Position => {
  return getNextPosWithPortalsDetails(startPos, initialDir, gridSize, wallSet, blockPositions, portals).finalPos;
};

export type SimLevelInput = {
  gridSize?: number;
  width?: number;
  height?: number;
  player?: Position;
  startPos?: Position;
  walls?: Position[];
  blocks?: { x?: number; y?: number; pos?: Position }[];
  targets?: { x?: number; y?: number; pos?: Position }[];
  destinations?: { x?: number; y?: number; pos?: Position }[];
  portals?: PuzzlePortal[];
  moves?: string[];
  playerMoves?: string[];
  solutionMoves?: string[];
  par?: number;
};

/**
 * Simulates a sequence of player moves on a puzzle and counts the number of pushes.
 */
export const simulateSolutionPushes = (puzzle: SimLevelInput): number => {
  const moves = puzzle.moves || puzzle.playerMoves || puzzle.solutionMoves || [];
  const rawBlocks = puzzle.blocks || [];
  if (moves.length === 0) {
    return Math.max(2, rawBlocks.length * 2);
  }

  const gridSize = puzzle.gridSize || Math.max(puzzle.width || 9, puzzle.height || 9);
  let player: Position = { ...(puzzle.player || puzzle.startPos || { x: 0, y: 0 }) };
  let blocks: Position[] = rawBlocks.map((b) => ({
    x: b.x !== undefined ? b.x : b.pos?.x ?? 0,
    y: b.y !== undefined ? b.y : b.pos?.y ?? 0,
  }));
  const wallSet = new Set((puzzle.walls || []).map(positionKey));
  const portals = puzzle.portals || [];
  let pushCount = 0;

  const pushBlock = (blockPos: Position, direction: Position, currentBlocks: Position[]): Position => {
    return getNextPosWithPortals(
      blockPos,
      direction,
      gridSize,
      wallSet,
      currentBlocks,
      portals
    );
  };

  for (const move of moves) {
    const dir = dirToVector(move);
    if (dir.x === 0 && dir.y === 0) continue;

    const portalOnCurrentCell = portals.find((p) => p.x === player.x && p.y === player.y);
    if (portalOnCurrentCell) {
      const portalVec = dirToVector(portalOnCurrentCell.dir);
      if (portalVec.x === -dir.x && portalVec.y === -dir.y) {
        const exitPortal = portals.find(
          (p) => p.color.toLowerCase() === portalOnCurrentCell.color.toLowerCase() && p.id !== portalOnCurrentCell.id
        );
        if (exitPortal) {
          const exitPos = { x: exitPortal.x, y: exitPortal.y };
          const isExitWallOrBound =
            exitPos.x < 0 ||
            exitPos.x >= gridSize ||
            exitPos.y < 0 ||
            exitPos.y >= gridSize ||
            wallSet.has(positionKey(exitPos));
          if (!isExitWallOrBound) {
            const blockIdxAtExit = blocks.findIndex((b) => b.x === exitPos.x && b.y === exitPos.y);
            if (blockIdxAtExit !== -1) {
              const blockPos = blocks[blockIdxAtExit];
              if (blockPos) {
                const exitDir = dirToVector(exitPortal.dir);
                const blockNewPos = pushBlock(blockPos, exitDir, blocks);
                if (blockNewPos.x !== blockPos.x || blockNewPos.y !== blockPos.y) {
                  pushCount++;
                  blocks = blocks.map((b, idx) => (idx === blockIdxAtExit ? blockNewPos : b));
                  player = exitPos;
                }
              }
            } else {
              player = exitPos;
            }
            continue;
          }
        }
      }
    }

    const nextPlayerPos = { x: player.x + dir.x, y: player.y + dir.y };
    if (
      nextPlayerPos.x < 0 ||
      nextPlayerPos.x >= gridSize ||
      nextPlayerPos.y < 0 ||
      nextPlayerPos.y >= gridSize ||
      wallSet.has(positionKey(nextPlayerPos))
    ) {
      continue;
    }

    const blockIdx = blocks.findIndex((b) => b.x === nextPlayerPos.x && b.y === nextPlayerPos.y);
    if (blockIdx !== -1) {
      const blockPos = blocks[blockIdx];
      if (!blockPos) continue;
      const blockNewPos = pushBlock(blockPos, dir, blocks);

      if (blockNewPos.x !== blockPos.x || blockNewPos.y !== blockPos.y) {
        pushCount++;
        blocks = blocks.map((b, idx) => (idx === blockIdx ? blockNewPos : b));
        player = nextPlayerPos;
      }
    } else {
      player = nextPlayerPos;
    }
  }

  return pushCount > 0 ? pushCount : Math.max(2, rawBlocks.length * 2);
};

/**
 * Calculates or retrieves the authoritative par push count for a puzzle.
 */
export const calculatePuzzlePar = (puzzle: Partial<Puzzle> | SimLevelInput): number => {
  if (typeof puzzle.par === 'number' && puzzle.par > 0) {
    return puzzle.par;
  }
  return simulateSolutionPushes(puzzle);
};
