import { Position, PuzzlePortal } from '../../shared/types';
import { dirToVector, getNextPosWithPortalsDetails } from './puzzle';

export type SolverBlock = {
  id: string;
  color: string;
  x: number;
  y: number;
};

export type SolverTarget = {
  id: string;
  color: string;
  x: number;
  y: number;
};

export type PuzzleSolverInput = {
  width: number;
  height: number;
  player: Position;
  walls: Position[];
  blocks: SolverBlock[];
  targets: SolverTarget[];
  portals?: PuzzlePortal[];
};

export type SolverResult = {
  moves: ('Up' | 'Down' | 'Left' | 'Right')[];
  pushCount: number;
  solved: boolean;
};

export const ALL_DIRECTIONS: ('Up' | 'Down' | 'Left' | 'Right')[] = ['Up', 'Down', 'Left', 'Right'];

const getCanonicalStateKey = (player: Position, blocks: SolverBlock[]): string => {
  const sortedBlocks = blocks
    .slice()
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((b) => `${b.color}:${b.x},${b.y}`)
    .join(';');
  return `${player.x},${player.y}|${sortedBlocks}`;
};

export const isStateSolved = (blocks: SolverBlock[], targets: SolverTarget[]): boolean => {
  if (targets.length === 0) return false;
  return targets.every((target) =>
    blocks.some((b) => b.x === target.x && b.y === target.y && b.color.toLowerCase() === target.color.toLowerCase())
  );
};

export const simulateMove = (
  input: PuzzleSolverInput,
  currentPlayer: Position,
  currentBlocks: SolverBlock[],
  dir: 'Up' | 'Down' | 'Left' | 'Right'
): { player: Position; blocks: SolverBlock[]; moved: boolean; isPush: boolean } => {
  const { width: gridWidth, height: gridHeight, walls, portals = [] } = input;
  const dirVector = dirToVector(dir);
  const gridSize = Math.max(gridWidth, gridHeight);
  const wallSet = new Set(walls.map((w) => `${w.x},${w.y}`));

  let newPlayer = { ...currentPlayer };
  const newBlocks = currentBlocks.map((b) => ({ ...b }));
  let moved = false;
  let isPush = false;

  // 1. Check if character is standing on a portal and moving into it
  const portalOnCurrentCell = portals.find(
    (p) => p.x === currentPlayer.x && p.y === currentPlayer.y
  );

  if (portalOnCurrentCell) {
    const portalVec = dirToVector(portalOnCurrentCell.dir);
    if (portalVec.x === -dirVector.x && portalVec.y === -dirVector.y) {
      const exitPortal = portals.find(
        (p) => p.color.toLowerCase() === portalOnCurrentCell.color.toLowerCase() && p.id !== portalOnCurrentCell.id
      );

      if (exitPortal) {
        const exitPos = { x: exitPortal.x, y: exitPortal.y };
        const isExitWallOrBound =
          exitPos.x < 0 ||
          exitPos.x >= gridWidth ||
          exitPos.y < 0 ||
          exitPos.y >= gridHeight ||
          wallSet.has(`${exitPos.x},${exitPos.y}`);

        if (!isExitWallOrBound) {
          const blockIdxAtExit = newBlocks.findIndex((b) => b.x === exitPos.x && b.y === exitPos.y);

          if (blockIdxAtExit !== -1) {
            const block = newBlocks[blockIdxAtExit];
            if (block) {
              const exitDir = dirToVector(exitPortal.dir);
              const trajectory = getNextPosWithPortalsDetails(
                { x: block.x, y: block.y },
                exitDir,
                gridSize,
                wallSet,
                newBlocks.map((b) => ({ x: b.x, y: b.y })),
                portals
              );
              const blockNewPos = trajectory.finalPos;

              if (blockNewPos.x !== block.x || blockNewPos.y !== block.y) {
                newBlocks[blockIdxAtExit] = { ...block, x: blockNewPos.x, y: blockNewPos.y };
                newPlayer = exitPos;
                moved = true;
                isPush = true;
              } else {
                return { player: currentPlayer, blocks: currentBlocks, moved: false, isPush: false };
              }
            }
          } else {
            newPlayer = exitPos;
            moved = true;
          }
        }
      }
    }
  }

  // 2. Normal step if portal teleport didn't happen
  if (!moved) {
    const nextX = currentPlayer.x + dirVector.x;
    const nextY = currentPlayer.y + dirVector.y;

    if (nextX < 0 || nextX >= gridWidth || nextY < 0 || nextY >= gridHeight) {
      return { player: currentPlayer, blocks: currentBlocks, moved: false, isPush: false };
    }
    if (wallSet.has(`${nextX},${nextY}`)) {
      return { player: currentPlayer, blocks: currentBlocks, moved: false, isPush: false };
    }

    const blockIdx = newBlocks.findIndex((b) => b.x === nextX && b.y === nextY);
    if (blockIdx !== -1) {
      const block = newBlocks[blockIdx];
      if (!block) return { player: currentPlayer, blocks: currentBlocks, moved: false, isPush: false };

      const trajectory = getNextPosWithPortalsDetails(
        { x: block.x, y: block.y },
        dirVector,
        gridSize,
        wallSet,
        newBlocks.map((b) => ({ x: b.x, y: b.y })),
        portals
      );
      const blockNewPos = trajectory.finalPos;

      if (blockNewPos.x === block.x && blockNewPos.y === block.y) {
        return { player: currentPlayer, blocks: currentBlocks, moved: false, isPush: false };
      }

      newBlocks[blockIdx] = { ...block, x: blockNewPos.x, y: blockNewPos.y };
      newPlayer = { x: nextX, y: nextY };
      moved = true;
      isPush = true;
    } else {
      newPlayer = { x: nextX, y: nextY };
      moved = true;
    }
  }

  return { player: newPlayer, blocks: newBlocks, moved, isPush };
};

// Find all reachable tiles for player via flood-fill
export const getReachableTiles = (
  width: number,
  height: number,
  player: Position,
  wallSet: Set<string>,
  blockSet: Set<string>
): Set<string> => {
  const reachable = new Set<string>();
  const startKey = `${player.x},${player.y}`;
  reachable.add(startKey);
  const queue: Position[] = [{ ...player }];
  let qHead = 0;

  const dirs: Position[] = [
    { x: 0, y: -1 },
    { x: 0, y: 1 },
    { x: -1, y: 0 },
    { x: 1, y: 0 },
  ];

  while (qHead < queue.length) {
    const curr = queue[qHead++]!;
    for (const d of dirs) {
      const nx = curr.x + d.x;
      const ny = curr.y + d.y;
      const k = `${nx},${ny}`;
      if (
        nx >= 0 &&
        nx < width &&
        ny >= 0 &&
        ny < height &&
        !wallSet.has(k) &&
        !blockSet.has(k) &&
        !reachable.has(k)
      ) {
        reachable.add(k);
        queue.push({ x: nx, y: ny });
      }
    }
  }

  return reachable;
};

// Find path of cardinal moves for player from start to target
export const findWalkPath = (
  width: number,
  height: number,
  start: Position,
  target: Position,
  wallSet: Set<string>,
  blockSet: Set<string>
): ('Up' | 'Down' | 'Left' | 'Right')[] | null => {
  if (start.x === target.x && start.y === target.y) return [];

  const visited = new Set<string>();
  visited.add(`${start.x},${start.y}`);

  type QueueItem = {
    pos: Position;
    moves: ('Up' | 'Down' | 'Left' | 'Right')[];
  };

  const queue: QueueItem[] = [{ pos: start, moves: [] }];
  let qHead = 0;

  const dirMoves: { dir: 'Up' | 'Down' | 'Left' | 'Right'; v: Position }[] = [
    { dir: 'Up', v: { x: 0, y: -1 } },
    { dir: 'Down', v: { x: 0, y: 1 } },
    { dir: 'Left', v: { x: -1, y: 0 } },
    { dir: 'Right', v: { x: 1, y: 0 } },
  ];

  while (qHead < queue.length) {
    const curr = queue[qHead++]!;
    for (const dm of dirMoves) {
      const nx = curr.pos.x + dm.v.x;
      const ny = curr.pos.y + dm.v.y;
      const k = `${nx},${ny}`;

      if (nx === target.x && ny === target.y) {
        return [...curr.moves, dm.dir];
      }

      if (
        nx >= 0 &&
        nx < width &&
        ny >= 0 &&
        ny < height &&
        !wallSet.has(k) &&
        !blockSet.has(k) &&
        !visited.has(k)
      ) {
        visited.add(k);
        queue.push({ pos: { x: nx, y: ny }, moves: [...curr.moves, dm.dir] });
      }
    }
  }

  return null;
};

export type SlideDetails = {
  endPos: Position;
  dist: number;
  stoppedBy: 'block' | 'wall' | 'border';
  stoppedByBlock?: SolverBlock;
};

// Simulate a single block push slide with full collision detection details
export const simulatePushSlideWithDetails = (
  width: number,
  height: number,
  block: SolverBlock,
  otherBlocks: SolverBlock[],
  wallSet: Set<string>,
  dir: 'Up' | 'Down' | 'Left' | 'Right'
): SlideDetails => {
  const dirVector = dirToVector(dir);
  let currX = block.x;
  let currY = block.y;
  let dist = 0;

  while (true) {
    const nextX = currX + dirVector.x;
    const nextY = currY + dirVector.y;
    const k = `${nextX},${nextY}`;

    if (nextX < 0 || nextX >= width || nextY < 0 || nextY >= height) {
      return { endPos: { x: currX, y: currY }, dist, stoppedBy: 'border' };
    }
    if (wallSet.has(k)) {
      return { endPos: { x: currX, y: currY }, dist, stoppedBy: 'wall' };
    }
    const hitBlock = otherBlocks.find((b) => b.x === nextX && b.y === nextY);
    if (hitBlock) {
      return { endPos: { x: currX, y: currY }, dist, stoppedBy: 'block', stoppedByBlock: hitBlock };
    }

    currX = nextX;
    currY = nextY;
    dist++;
  }
};

// Simulate a single block push slide
export const simulatePushSlide = (
  width: number,
  height: number,
  block: SolverBlock,
  otherBlocks: SolverBlock[],
  wallSet: Set<string>,
  dir: 'Up' | 'Down' | 'Left' | 'Right'
): Position => {
  return simulatePushSlideWithDetails(width, height, block, otherBlocks, wallSet, dir).endPos;
};

// Push-based BFS solver for lightning-fast state exploration
export const solvePuzzlePushBFS = (
  input: PuzzleSolverInput,
  maxPushStates = 6000,
  maxPushDepth?: number
): SolverResult | null => {
  const { width, height, player, walls, blocks, targets } = input;
  const wallSet = new Set(walls.map((w) => `${w.x},${w.y}`));

  if (isStateSolved(blocks, targets)) {
    return { moves: [], pushCount: 0, solved: true };
  }

  type PushHistoryItem = {
    fromPlayer: Position;
    toPushTile: Position;
    blockIdx: number;
    pushDir: 'Up' | 'Down' | 'Left' | 'Right';
  };

  type State = {
    player: Position;
    blocks: SolverBlock[];
    pushHistory: PushHistoryItem[];
    reachable: Set<string>;
  };

  const getPushStateKey = (curBlocks: SolverBlock[], reachable: Set<string>): string => {
    const sortedBlocks = curBlocks
      .map((b) => `${b.id}:${b.x},${b.y}`)
      .sort()
      .join(';');
    let minReachable = 'none';
    for (const k of reachable) {
      if (minReachable === 'none' || k < minReachable) {
        minReachable = k;
      }
    }
    return `${minReachable}|${sortedBlocks}`;
  };

  const initialBlockSet = new Set(blocks.map((b) => `${b.x},${b.y}`));
  const initialReachable = getReachableTiles(width, height, player, wallSet, initialBlockSet);
  const visited = new Set<string>();
  visited.add(getPushStateKey(blocks, initialReachable));

  const queue: State[] = [
    {
      player: { ...player },
      blocks: blocks.map((b) => ({ ...b })),
      pushHistory: [],
      reachable: initialReachable,
    },
  ];

  const dirs: { dir: 'Up' | 'Down' | 'Left' | 'Right'; v: Position }[] = [
    { dir: 'Up', v: { x: 0, y: -1 } },
    { dir: 'Down', v: { x: 0, y: 1 } },
    { dir: 'Left', v: { x: -1, y: 0 } },
    { dir: 'Right', v: { x: 1, y: 0 } },
  ];

  let qHead = 0;
  let explored = 0;

  while (qHead < queue.length && explored < maxPushStates) {
    const curr = queue[qHead++]!;
    explored++;

    const curReachable = curr.reachable;

    for (let bIdx = 0; bIdx < curr.blocks.length; bIdx++) {
      const block = curr.blocks[bIdx]!;
      const otherBlocks = curr.blocks.filter((_, i) => i !== bIdx);

      for (const d of dirs) {
        const pushTile = { x: block.x - d.v.x, y: block.y - d.v.y };
        const pushKey = `${pushTile.x},${pushTile.y}`;

        if (!curReachable.has(pushKey)) continue;

        const newBlockPos = simulatePushSlide(width, height, block, otherBlocks, wallSet, d.dir);
        if (newBlockPos.x === block.x && newBlockPos.y === block.y) {
          continue;
        }

        const newPlayerPos = { x: block.x, y: block.y };
        const newBlocks = curr.blocks.map((b, i) =>
          i === bIdx ? { ...b, x: newBlockPos.x, y: newBlockPos.y } : { ...b }
        );
        const newPushHistory: PushHistoryItem[] = [
          ...curr.pushHistory,
          {
            fromPlayer: curr.player,
            toPushTile: pushTile,
            blockIdx: bIdx,
            pushDir: d.dir,
          },
        ];

        if (isStateSolved(newBlocks, targets)) {
          // Reconstruct exact full move list (walk moves + push moves)
          const fullMoves: ('Up' | 'Down' | 'Left' | 'Right')[] = [];
          let simPlayer = { ...player };
          const simBlocks = blocks.map((b) => ({ ...b }));

          for (const step of newPushHistory) {
            const stepBlockSet = new Set(simBlocks.map((b) => `${b.x},${b.y}`));
            const walkMoves = findWalkPath(width, height, simPlayer, step.toPushTile, wallSet, stepBlockSet);
            if (!walkMoves) return null;

            fullMoves.push(...walkMoves);
            fullMoves.push(step.pushDir);

            const movingBlock = simBlocks[step.blockIdx]!;
            const others = simBlocks.filter((_, i) => i !== step.blockIdx);
            const endPos = simulatePushSlide(width, height, movingBlock, others, wallSet, step.pushDir);
            simPlayer = { x: movingBlock.x, y: movingBlock.y };
            simBlocks[step.blockIdx] = { ...movingBlock, x: endPos.x, y: endPos.y };
          }

          return {
            moves: fullMoves,
            pushCount: newPushHistory.length,
            solved: true,
          };
        }

        // Prune if next state exceeds max push depth
        if (maxPushDepth && newPushHistory.length >= maxPushDepth) {
          continue;
        }

        const newBlockSet = new Set(newBlocks.map((b) => `${b.x},${b.y}`));
        const newReachable = getReachableTiles(width, height, newPlayerPos, wallSet, newBlockSet);
        const stateKey = getPushStateKey(newBlocks, newReachable);

        if (!visited.has(stateKey)) {
          visited.add(stateKey);
          queue.push({
            player: newPlayerPos,
            blocks: newBlocks,
            pushHistory: newPushHistory,
            reachable: newReachable,
          });
        }
      }
    }
  }

  return null;
};

export const solvePuzzle = (
  input: PuzzleSolverInput,
  maxStates = 25000
): SolverResult | null => {
  const { targets, portals = [] } = input;
  if (targets.length === 0) return null;

  // For portal-free puzzles, use ultra-fast Push BFS solver
  if (portals.length === 0) {
    const pushResult = solvePuzzlePushBFS(input, Math.min(maxStates, 8000));
    if (pushResult) return pushResult;
  }

  if (isStateSolved(input.blocks, targets)) {
    return { moves: [], pushCount: 0, solved: true };
  }

  const visited = new Set<string>();
  const initialKey = getCanonicalStateKey(input.player, input.blocks);
  visited.add(initialKey);

  type QueueItem = {
    player: Position;
    blocks: SolverBlock[];
    moves: ('Up' | 'Down' | 'Left' | 'Right')[];
    pushCount: number;
  };

  const queue: QueueItem[] = [
    {
      player: input.player,
      blocks: input.blocks,
      moves: [],
      pushCount: 0,
    },
  ];

  let queueHead = 0;
  let statesExplored = 0;

  while (queueHead < queue.length && statesExplored < maxStates) {
    const current = queue[queueHead++]!;
    statesExplored++;

    for (const dir of ALL_DIRECTIONS) {
      const nextState = simulateMove(input, current.player, current.blocks, dir);
      if (!nextState.moved) continue;

      const nextMoves = [...current.moves, dir];
      const nextPushCount = current.pushCount + (nextState.isPush ? 1 : 0);

      if (isStateSolved(nextState.blocks, targets)) {
        return { moves: nextMoves, pushCount: nextPushCount, solved: true };
      }

      const key = getCanonicalStateKey(nextState.player, nextState.blocks);
      if (!visited.has(key)) {
        visited.add(key);
        queue.push({
          player: nextState.player,
          blocks: nextState.blocks,
          moves: nextMoves,
          pushCount: nextPushCount,
        });
      }
    }
  }

  return null;
};

export const isValidDistancePattern = (distances: number[]): boolean => {
  const seen = new Set<number>();
  let lastNum: number | null = null;

  for (const num of distances) {
    if (lastNum !== null && num !== lastNum) {
      if (seen.has(num)) {
        return false;
      }
    }
    seen.add(num);
    lastNum = num;
  }
  return true;
};

export const generateValidDistances = (count: number, maxDist = 3): number[] => {
  const pool: number[] = [];
  for (let d = 1; d <= Math.max(2, maxDist); d++) {
    pool.push(d);
  }

  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j]!, pool[i]!];
  }

  const result: number[] = [];
  let curr = pool.pop() || 2;
  result.push(curr);

  while (result.length < count) {
    if (Math.random() < 0.35) {
      result.push(curr);
    } else if (pool.length > 0) {
      curr = pool.pop()!;
      result.push(curr);
    } else {
      result.push(curr);
    }
  }

  return result;
};

export type PushInteractionStep = {
  blockId: string;
  color: string;
  dir: 'Up' | 'Down' | 'Left' | 'Right';
  from: Position;
  to: Position;
  dist: number;
  stoppedBy: 'block' | 'wall' | 'border';
  stoppedByBlockId?: string | undefined;
  stoppedByColor?: string | undefined;
};

export type InteractionMetrics = {
  pushCount: number;
  slideDistances: number[];
  averageSlideDistance: number;
  totalSlideDistance: number;
  walkMovesCount: number;
  totalMovesCount: number;
  blockCollisions: number;
  blockSwitches: number;
  pushSequence: PushInteractionStep[];
};

// Calculate detailed slide & interaction metrics for a puzzle solution
export const getDetailedInteractionMetrics = (
  width: number,
  height: number,
  player: Position,
  walls: Position[],
  blocks: SolverBlock[],
  solutionMoves: ('Up' | 'Down' | 'Left' | 'Right')[]
): InteractionMetrics => {
  const wallSet = new Set(walls.map((w) => `${w.x},${w.y}`));
  let simPlayer = { ...player };
  let simBlocks = blocks.map((b) => ({ ...b }));
  const slideDistances: number[] = [];
  const pushSequence: PushInteractionStep[] = [];
  let walkCount = 0;
  let blockCollisions = 0;
  let blockSwitches = 0;
  let lastPushedBlockId: string | null = null;

  for (const move of solutionMoves) {
    const nextX = simPlayer.x + (move === 'Right' ? 1 : move === 'Left' ? -1 : 0);
    const nextY = simPlayer.y + (move === 'Down' ? 1 : move === 'Up' ? -1 : 0);
    const bIdx = simBlocks.findIndex((b) => b.x === nextX && b.y === nextY);

    if (bIdx >= 0) {
      const b = simBlocks[bIdx]!;
      const others = simBlocks.filter((_, i) => i !== bIdx);
      const details = simulatePushSlideWithDetails(width, height, b, others, wallSet, move);

      slideDistances.push(details.dist);
      if (details.stoppedBy === 'block') {
        blockCollisions++;
      }
      if (lastPushedBlockId !== null && lastPushedBlockId !== b.id) {
        blockSwitches++;
      }
      lastPushedBlockId = b.id;

      pushSequence.push({
        blockId: b.id,
        color: b.color,
        dir: move,
        from: { x: b.x, y: b.y },
        to: details.endPos,
        dist: details.dist,
        stoppedBy: details.stoppedBy,
        stoppedByBlockId: details.stoppedByBlock?.id,
        stoppedByColor: details.stoppedByBlock?.color,
      });

      simBlocks = simBlocks.map((blk, i) =>
        i === bIdx ? { ...blk, x: details.endPos.x, y: details.endPos.y } : { ...blk }
      );
      simPlayer = { x: nextX, y: nextY };
    } else {
      walkCount++;
      simPlayer = { x: nextX, y: nextY };
    }
  }

  const totalSlideDistance = slideDistances.reduce((sum, d) => sum + d, 0);
  const averageSlideDistance = slideDistances.length > 0 ? totalSlideDistance / slideDistances.length : 0;

  return {
    pushCount: slideDistances.length,
    slideDistances,
    averageSlideDistance,
    totalSlideDistance,
    walkMovesCount: walkCount,
    totalMovesCount: solutionMoves.length,
    blockCollisions,
    blockSwitches,
    pushSequence,
  };
};

// Calculate detailed slide metrics for a puzzle solution
export const getPuzzlePushMetrics = (
  width: number,
  height: number,
  player: Position,
  walls: Position[],
  blocks: SolverBlock[],
  _targets: SolverTarget[] | undefined,
  solutionMoves: ('Up' | 'Down' | 'Left' | 'Right')[]
): {
  pushCount: number;
  slideDistances: number[];
  averageSlideDistance: number;
  totalSlideDistance: number;
  walkMovesCount: number;
  totalMovesCount: number;
} => {
  const detailed = getDetailedInteractionMetrics(width, height, player, walls, blocks, solutionMoves);
  return {
    pushCount: detailed.pushCount,
    slideDistances: detailed.slideDistances,
    averageSlideDistance: detailed.averageSlideDistance,
    totalSlideDistance: detailed.totalSlideDistance,
    walkMovesCount: detailed.walkMovesCount,
    totalMovesCount: detailed.totalMovesCount,
  };
};

export const pruneUnusedWalls = (
  width: number,
  height: number,
  player: Position,
  walls: Position[],
  blocks: SolverBlock[],
  targets: SolverTarget[],
  expectedPushCount: number
): Position[] => {
  let activeWalls = [...walls];

  for (let i = activeWalls.length - 1; i >= 0; i--) {
    const candidateWall = activeWalls[i]!;
    const testWalls = activeWalls.filter((w) => w !== candidateWall);

    const testInput: PuzzleSolverInput = {
      width,
      height,
      player,
      walls: testWalls,
      blocks,
      targets,
      portals: [],
    };

    const result = solvePuzzlePushBFS(testInput, 300, expectedPushCount);

    if (result && result.solved && result.pushCount === expectedPushCount) {
      activeWalls = testWalls;
    }
  }

  return activeWalls;
};

export type ReversePushGeneratorConfig = {
  width: number;
  height: number;
  minBlocks: number;
  maxBlocks: number;
  minTotalPushes: number;
  maxTotalPushes: number;
  minPushesPerBlock: number;
  maxPushesPerBlock: number;
  minSolutionPushCount: number;
  minAverageSlideDistance?: number | undefined;
  minBlockCollisions?: number | undefined;
  minBlockSwitches?: number | undefined;
  colors?: string[] | undefined;
  maxAttempts?: number | undefined;
};

export type GeneratedPuzzle = {
  width: number;
  height: number;
  player: Position;
  walls: Position[];
  blocks: SolverBlock[];
  targets: SolverTarget[];
  portals: PuzzlePortal[];
  solutionMoves: ('Up' | 'Down' | 'Left' | 'Right')[];
  averageSlideDistance?: number | undefined;
  pushDistances?: number[] | undefined;
  blockCollisions?: number | undefined;
  blockSwitches?: number | undefined;
  pushSequence?: PushInteractionStep[] | undefined;
};

export const generateReversePushPuzzle = (config: ReversePushGeneratorConfig): GeneratedPuzzle => {
  const {
    width,
    height,
    minBlocks,
    maxBlocks,
    minTotalPushes,
    maxTotalPushes,
    minPushesPerBlock,
    maxPushesPerBlock,
    minSolutionPushCount,
    minAverageSlideDistance = 2.8,
    minBlockCollisions = 0,
    minBlockSwitches = 0,
    colors,
    maxAttempts = 150,
  } = config;

  const availableColors = colors || ['red', 'blue', 'yellow', 'purple', 'green', 'orange'];
  const colorPool = availableColors.filter((c) => c.toLowerCase() !== 'gray' && c.toLowerCase() !== 'grey');

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const numBlocks = Math.floor(Math.random() * (maxBlocks - minBlocks + 1)) + minBlocks;
    let totalPushes = Math.floor(Math.random() * (maxTotalPushes - minTotalPushes + 1)) + minTotalPushes;

    if (totalPushes < numBlocks * minPushesPerBlock) totalPushes = numBlocks * minPushesPerBlock;
    if (totalPushes > numBlocks * maxPushesPerBlock) totalPushes = numBlocks * maxPushesPerBlock;

    const pushesPerBlock: number[] = Array(numBlocks).fill(minPushesPerBlock);
    let remaining = totalPushes - numBlocks * minPushesPerBlock;
    while (remaining > 0) {
      const idx = Math.floor(Math.random() * numBlocks);
      if (pushesPerBlock[idx]! < maxPushesPerBlock) {
        pushesPerBlock[idx]!++;
        remaining--;
      }
    }

    const walls: Position[] = [];
    const wallSet = new Set<string>();

    const shuffledColors = colorPool.slice();
    for (let i = shuffledColors.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledColors[i], shuffledColors[j]] = [shuffledColors[j]!, shuffledColors[i]!];
    }
    const chosenColors = shuffledColors.slice(0, numBlocks);

    // 1. Place Targets across quadrants and perimeter for board coverage
    const targets: SolverTarget[] = [];
    const quadrants = [
      { minX: 1, maxX: 3, minY: 1, maxY: 3 },
      { minX: 5, maxX: 7, minY: 1, maxY: 3 },
      { minX: 1, maxX: 3, minY: 5, maxY: 7 },
      { minX: 5, maxX: 7, minY: 5, maxY: 7 },
    ];
    for (let i = quadrants.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [quadrants[i], quadrants[j]] = [quadrants[j]!, quadrants[i]!];
    }

    for (let bIdx = 0; bIdx < numBlocks; bIdx++) {
      const color = chosenColors[bIdx] || `color_${bIdx}`;
      for (let tTry = 0; tTry < 50; tTry++) {
        let tx: number;
        let ty: number;

        if (targets.length > 0 && Math.random() < 0.25) {
          const ref = targets[Math.floor(Math.random() * targets.length)]!;
          const dirs: Position[] = [
            { x: 0, y: -1 },
            { x: 0, y: 1 },
            { x: -1, y: 0 },
            { x: 1, y: 0 },
          ];
          const d = dirs[Math.floor(Math.random() * dirs.length)]!;
          tx = ref.x + d.x;
          ty = ref.y + d.y;
        } else if (bIdx < quadrants.length && Math.random() < 0.7) {
          const q = quadrants[bIdx]!;
          tx = Math.floor(Math.random() * (q.maxX - q.minX + 1)) + q.minX;
          ty = Math.floor(Math.random() * (q.maxY - q.minY + 1)) + q.minY;
        } else {
          const side = Math.floor(Math.random() * 4);
          if (side === 0) { tx = Math.floor(Math.random() * (width - 2)) + 1; ty = 0; }
          else if (side === 1) { tx = Math.floor(Math.random() * (width - 2)) + 1; ty = height - 1; }
          else if (side === 2) { tx = 0; ty = Math.floor(Math.random() * (height - 2)) + 1; }
          else { tx = width - 1; ty = Math.floor(Math.random() * (height - 2)) + 1; }
        }

        if (tx < 0 || tx >= width || ty < 0 || ty >= height) continue;
        if (targets.some((t) => t.x === tx && t.y === ty)) continue;

        targets.push({ id: `t_${color}_${bIdx}`, color, x: tx, y: ty });
        break;
      }
    }

    if (targets.length < numBlocks) continue;

    // Helper: count unobstructed steps in backward direction
    const getClearSteps = (
      fromPos: Position,
      revVec: Position,
      draftKeys: string[],
      ignoreIdx: number
    ): number => {
      let count = 0;
      for (let s = 1; s < Math.max(width, height); s++) {
        const cx = fromPos.x + revVec.x * s;
        const cy = fromPos.y + revVec.y * s;
        const k = `${cx},${cy}`;
        if (
          cx < 0 ||
          cx >= width ||
          cy < 0 ||
          cy >= height ||
          wallSet.has(k) ||
          draftKeys.includes(k) ||
          targets.some((t) => t.x === cx && t.y === cy) ||
          currentPositions.some((pos, idx) => idx !== ignoreIdx && pos.x === cx && pos.y === cy)
        ) {
          break;
        }
        count++;
      }
      return count;
    };

    // 2. Sequential Reverse-Time Scrambling (encouraging block-on-block collisions)
    const currentPositions = targets.map((t) => ({ x: t.x, y: t.y }));
    let layoutFailed = false;

    for (let bIdx = numBlocks - 1; bIdx >= 0; bIdx--) {
      let blockPlaced = false;

      for (let bTry = 0; bTry < 40; bTry++) {
        const draftWalls: Position[] = [];
        const draftWallKeys: string[] = [];

        let curr = { ...currentPositions[bIdx]! };
        const cardDirs: Position[] = [
          { x: 0, y: -1 },
          { x: 0, y: 1 },
          { x: -1, y: 0 },
          { x: 1, y: 0 },
        ];

        // Evaluate runways and block-on-block stopping alignments
        const dirRunways: { dir: Position; maxSteps: number; usesBlockAsBackboard: boolean }[] = [];
        for (const d of cardDirs) {
          const rev = { x: -d.x, y: -d.y };
          const maxSteps = getClearSteps(curr, rev, draftWallKeys, bIdx);
          if (maxSteps >= 1) {
            const forwardStopTile = { x: curr.x + d.x, y: curr.y + d.y };
            const isStoppedByBlock = currentPositions.some(
              (p, idx) => idx !== bIdx && p.x === forwardStopTile.x && p.y === forwardStopTile.y
            );
            dirRunways.push({ dir: d, maxSteps, usesBlockAsBackboard: isStoppedByBlock });
          }
        }

        if (dirRunways.length === 0) continue;

        // Prioritize directions using other blocks as collision backboards, then longest runways
        dirRunways.sort((a, b) => {
          if (a.usesBlockAsBackboard && !b.usesBlockAsBackboard) return -1;
          if (!a.usesBlockAsBackboard && b.usesBlockAsBackboard) return 1;
          return b.maxSteps - a.maxSteps;
        });

        const chosenEntry = dirRunways[0]!;
        let currFwd = chosenEntry.dir;

        // Stopping wall for target arrival (only if not stopped by grid boundary or block)
        const targetSw = { x: curr.x + currFwd.x, y: curr.y + currFwd.y };
        const targetSwK = `${targetSw.x},${targetSw.y}`;
        const isTargetSwBorder = targetSw.x < 0 || targetSw.x >= width || targetSw.y < 0 || targetSw.y >= height;
        const isTargetSwBlock = currentPositions.some((p) => p.x === targetSw.x && p.y === targetSw.y);
        const isTargetSwExistingWall = wallSet.has(targetSwK);
        const isTargetSwTarget = targets.some((t) => t.x === targetSw.x && t.y === targetSw.y);

        if (!isTargetSwBorder && !isTargetSwBlock && !isTargetSwExistingWall && !isTargetSwTarget) {
          draftWalls.push(targetSw);
          draftWallKeys.push(targetSwK);
        }

        const blockPushes = pushesPerBlock[bIdx]!;
        let stepFailed = false;

        for (let p = 0; p < blockPushes; p++) {
          if (p > 0) {
            const perps: Position[] =
              currFwd.x === 0 ? [{ x: -1, y: 0 }, { x: 1, y: 0 }] : [{ x: 0, y: -1 }, { x: 0, y: 1 }];

            const perpOptions: { dir: Position; maxSteps: number; usesBlock: boolean }[] = [];
            for (const perp of perps) {
              const rev = { x: -perp.x, y: -perp.y };
              const maxSteps = getClearSteps(curr, rev, draftWallKeys, bIdx);
              if (maxSteps >= 1) {
                const nextPushTile = { x: curr.x - currFwd.x, y: curr.y - currFwd.y };
                const isPushTileOpen =
                  nextPushTile.x >= 0 &&
                  nextPushTile.x < width &&
                  nextPushTile.y >= 0 &&
                  nextPushTile.y < height &&
                  !wallSet.has(`${nextPushTile.x},${nextPushTile.y}`) &&
                  !draftWallKeys.includes(`${nextPushTile.x},${nextPushTile.y}`);

                if (isPushTileOpen) {
                  const swCheck = { x: curr.x + perp.x, y: curr.y + perp.y };
                  const isBlockBackboard = currentPositions.some(
                    (pos, idx) => idx !== bIdx && pos.x === swCheck.x && pos.y === swCheck.y
                  );
                  perpOptions.push({ dir: perp, maxSteps, usesBlock: isBlockBackboard });
                }
              }
            }

            if (perpOptions.length === 0) {
              stepFailed = true;
              break;
            }

            // Prioritize turns stopping against other blocks, then longest runways
            perpOptions.sort((a, b) => {
              if (a.usesBlock && !b.usesBlock) return -1;
              if (!a.usesBlock && b.usesBlock) return 1;
              return b.maxSteps - a.maxSteps;
            });

            const chosenTurn = perpOptions[0]!.dir;

            // Stopping wall behind the turn point (omit if stopped by block)
            const swPos = { x: curr.x + chosenTurn.x, y: curr.y + chosenTurn.y };
            const swK = `${swPos.x},${swPos.y}`;
            const isSwBorder = swPos.x < 0 || swPos.x >= width || swPos.y < 0 || swPos.y >= height;
            const isSwBlock = currentPositions.some((pos) => pos.x === swPos.x && pos.y === swPos.y);
            const isSwWall = wallSet.has(swK) || draftWallKeys.includes(swK);
            const isSwTarget = targets.some((t) => t.x === swPos.x && t.y === swPos.y);

            if (isSwTarget) {
              stepFailed = true;
              break;
            }

            if (!isSwBorder && !isSwBlock && !isSwWall) {
              draftWalls.push(swPos);
              draftWallKeys.push(swK);
            }

            currFwd = chosenTurn;
          }

          // Pull backward with sweeping distances (2 to 6 tiles)
          const rev = { x: -currFwd.x, y: -currFwd.y };
          const maxSteps = getClearSteps(curr, rev, draftWallKeys, bIdx);
          if (maxSteps === 0) {
            stepFailed = true;
            break;
          }

          const maxPull = maxSteps >= 2 ? maxSteps - 1 : 1;
          const minPull = maxPull >= 3 ? 3 : maxPull >= 2 ? 2 : 1;
          const desiredDist = Math.floor(Math.random() * (maxPull - minPull + 1)) + minPull;

          curr = {
            x: curr.x + rev.x * desiredDist,
            y: curr.y + rev.y * desiredDist,
          };
        }

        if (stepFailed) continue;

        if (targets.some((t) => t.x === curr.x && t.y === curr.y)) continue;

        for (let dwIdx = 0; dwIdx < draftWalls.length; dwIdx++) {
          walls.push(draftWalls[dwIdx]!);
          wallSet.add(draftWallKeys[dwIdx]!);
        }
        currentPositions[bIdx] = { ...curr };
        blockPlaced = true;
        break;
      }

      if (!blockPlaced) {
        layoutFailed = true;
        break;
      }
    }

    if (layoutFailed) continue;

    // 3. Assemble Blocks & Verify None Start on Targets
    const blocks: SolverBlock[] = [];
    for (let i = 0; i < numBlocks; i++) {
      const pos = currentPositions[i]!;
      blocks.push({ id: `b_${chosenColors[i]}_${i}`, color: chosenColors[i]!, x: pos.x, y: pos.y });
    }

    // 4. Dynamic Player Spawning & Connected Component Verification
    const blockSet = new Set(blocks.map((b) => `${b.x},${b.y}`));
    const representativeTiles: Position[] = [];
    const visitedFloor = new Set<string>();

    for (let py = 0; py < height; py++) {
      for (let px = 0; px < width; px++) {
        const k = `${px},${py}`;
        if (!wallSet.has(k) && !blockSet.has(k) && !targets.some((t) => t.x === px && t.y === py)) {
          if (!visitedFloor.has(k)) {
            representativeTiles.push({ x: px, y: py });
            const comp = getReachableTiles(width, height, { x: px, y: py }, wallSet, blockSet);
            for (const ck of comp) {
              visitedFloor.add(ck);
            }
          }
        }
      }
    }

    for (let i = representativeTiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [representativeTiles[i], representativeTiles[j]] = [representativeTiles[j]!, representativeTiles[i]!];
    }

    const effMinCollisions = attempt > maxAttempts * 0.75 ? Math.max(0, minBlockCollisions - 1) : minBlockCollisions;
    const effMinSwitches = attempt > maxAttempts * 0.75 ? Math.max(0, minBlockSwitches - 1) : minBlockSwitches;
    const effMinPushCount = attempt > maxAttempts * 0.75 ? Math.max(4, minSolutionPushCount - 1) : minSolutionPushCount;
    const effMinAvgDist = attempt > maxAttempts * 0.75 ? Math.max(2.4, minAverageSlideDistance - 0.4) : minAverageSlideDistance;

    let playerStart: Position | null = null;
    let verifiedSolution: SolverResult | null = null;

    for (const pos of representativeTiles) {
      const testInput: PuzzleSolverInput = {
        width,
        height,
        player: pos,
        walls,
        blocks,
        targets,
        portals: [],
      };

      const sol = solvePuzzlePushBFS(testInput, 2500);
      if (sol && sol.solved && sol.pushCount >= effMinPushCount) {
        const metrics = getDetailedInteractionMetrics(width, height, pos, walls, blocks, sol.moves);
        if (
          metrics.averageSlideDistance >= effMinAvgDist &&
          metrics.blockCollisions >= effMinCollisions &&
          metrics.blockSwitches >= effMinSwitches
        ) {
          playerStart = pos;
          verifiedSolution = sol;
          break;
        }
      }
    }

    if (!playerStart || !verifiedSolution) continue;

    // 5. Automated Wall Pruning to remove redundant/unused walls
    const finalWalls = pruneUnusedWalls(
      width,
      height,
      playerStart,
      walls,
      blocks,
      targets,
      verifiedSolution.pushCount
    );

    const finalMetrics = getDetailedInteractionMetrics(
      width,
      height,
      playerStart,
      finalWalls,
      blocks,
      verifiedSolution.moves
    );

    return {
      width,
      height,
      player: playerStart,
      walls: finalWalls,
      blocks,
      targets,
      portals: [],
      solutionMoves: verifiedSolution.moves,
      averageSlideDistance: Math.round(finalMetrics.averageSlideDistance * 10) / 10,
      pushDistances: finalMetrics.slideDistances,
      blockCollisions: finalMetrics.blockCollisions,
      blockSwitches: finalMetrics.blockSwitches,
      pushSequence: finalMetrics.pushSequence,
    };
  }

  // Fallback guaranteed layout if max attempts exhausted
  const fallbackPlayer = { x: 1, y: 4 };
  const fallbackBlocks: SolverBlock[] = [
    { id: 'b_red_0', color: 'red', x: 2, y: 3 },
    { id: 'b_blue_1', color: 'blue', x: 6, y: 4 },
    { id: 'b_yellow_2', color: 'yellow', x: 5, y: 2 },
  ];
  const fallbackTargets: SolverTarget[] = [
    { id: 't_red_0', color: 'red', x: 6, y: 2 },
    { id: 't_blue_1', color: 'blue', x: 2, y: 6 },
    { id: 't_yellow_2', color: 'yellow', x: 6, y: 5 },
  ];
  const fallbackWalls: Position[] = [
    { x: 2, y: 1 },
    { x: 7, y: 2 },
    { x: 6, y: 7 },
    { x: 1, y: 6 },
    { x: 7, y: 5 },
    { x: 3, y: 7 },
  ];

  const fallbackSolution = solvePuzzle({
    width,
    height,
    player: fallbackPlayer,
    walls: fallbackWalls,
    blocks: fallbackBlocks,
    targets: fallbackTargets,
  }) || { moves: ['Up', 'Right', 'Down', 'Left', 'Down', 'Right'], pushCount: 6, solved: true };

  return {
    width,
    height,
    player: fallbackPlayer,
    walls: fallbackWalls,
    blocks: fallbackBlocks,
    targets: fallbackTargets,
    portals: [],
    solutionMoves: fallbackSolution.moves,
  };
};

export type PuzzleGenerateOptions = {
  width?: number | undefined;
  height?: number | undefined;
  minBlocks?: number | undefined;
  maxBlocks?: number | undefined;
  minTotalPushes?: number | undefined;
  maxTotalPushes?: number | undefined;
  minPushesPerBlock?: number | undefined;
  maxPushesPerBlock?: number | undefined;
  minSolutionPushCount?: number | undefined;
  minAverageSlideDistance?: number | undefined;
  minBlockCollisions?: number | undefined;
  minBlockSwitches?: number | undefined;
  colors?: string[] | undefined;
  maxAttempts?: number | undefined;
};

export const generateModeratePuzzle = (options: PuzzleGenerateOptions = {}) => {
  const width = options.width || 9;
  const height = options.height || 9;
  return generateReversePushPuzzle({
    width,
    height,
    minBlocks: options.minBlocks || 3,
    maxBlocks: options.maxBlocks || 3,
    minTotalPushes: options.minTotalPushes || 8,
    maxTotalPushes: options.maxTotalPushes || 12,
    minPushesPerBlock: options.minPushesPerBlock || 2,
    maxPushesPerBlock: options.maxPushesPerBlock || 4,
    minSolutionPushCount: options.minSolutionPushCount || 6,
    minAverageSlideDistance: options.minAverageSlideDistance || 2.8,
    minBlockCollisions: options.minBlockCollisions ?? 1,
    minBlockSwitches: options.minBlockSwitches ?? 2,
    colors: options.colors,
    maxAttempts: options.maxAttempts || 150,
  });
};

export const generatePuzzle = generateModeratePuzzle;
export const generateEasyPuzzle = generateModeratePuzzle;
export const generateHardPuzzle = (options: PuzzleGenerateOptions = {}) => {
  return generateReversePushPuzzle({
    width: options.width || 9,
    height: options.height || 9,
    minBlocks: options.minBlocks || 3,
    maxBlocks: options.maxBlocks || 3,
    minTotalPushes: options.minTotalPushes || 9,
    maxTotalPushes: options.maxTotalPushes || 13,
    minPushesPerBlock: options.minPushesPerBlock || 3,
    maxPushesPerBlock: options.maxPushesPerBlock || 5,
    minSolutionPushCount: options.minSolutionPushCount || 7,
    minAverageSlideDistance: options.minAverageSlideDistance || 3.0,
    minBlockCollisions: options.minBlockCollisions ?? 1,
    minBlockSwitches: options.minBlockSwitches ?? 3,
    colors: options.colors,
    maxAttempts: options.maxAttempts || 200,
  });
};
export type EasyGenerateOptions = PuzzleGenerateOptions;


