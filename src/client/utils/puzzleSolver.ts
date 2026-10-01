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
  if (walls.length === 0) return [];

  // 1. Trace-based quick check: find which walls are actually contacted during the solution
  const traceInput: PuzzleSolverInput = {
    width,
    height,
    player,
    walls,
    blocks,
    targets,
    portals: [],
  };

  const initialSolution = solvePuzzlePushBFS(traceInput, 300, expectedPushCount);
  if (!initialSolution || !initialSolution.solved) return walls;

  const initialMetrics = getDetailedInteractionMetrics(
    width,
    height,
    player,
    walls,
    blocks,
    initialSolution.moves
  );

  const contactedWallKeys = new Set<string>();
  for (const step of initialMetrics.pushSequence) {
    if (step.stoppedBy === 'wall') {
      const dirVec = dirToVector(step.dir);
      const wallPos = { x: step.to.x + dirVec.x, y: step.to.y + dirVec.y };
      contactedWallKeys.add(`${wallPos.x},${wallPos.y}`);
    }
  }

  // 2. Batch prune: candidate walls are those NOT contacted in the solution trajectory
  const candidateWallsToKeep = walls.filter((w) => contactedWallKeys.has(`${w.x},${w.y}`));
  const testBatchInput: PuzzleSolverInput = {
    width,
    height,
    player,
    walls: candidateWallsToKeep,
    blocks,
    targets,
    portals: [],
  };

  const batchResult = solvePuzzlePushBFS(testBatchInput, 250, expectedPushCount);
  if (batchResult && batchResult.solved && batchResult.pushCount === expectedPushCount) {
    return candidateWallsToKeep;
  }

  // 3. Fallback fine-grained pruning if batch prune removed an anti-shortcut wall
  let activeWalls = [...walls];
  for (let i = activeWalls.length - 1; i >= 0; i--) {
    const candidateWall = activeWalls[i];
    if (!candidateWall) continue;
    if (contactedWallKeys.has(`${candidateWall.x},${candidateWall.y}`)) {
      continue; // keep contacted walls
    }

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

    const result = solvePuzzlePushBFS(testInput, 150, expectedPushCount);
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
  par?: number | undefined;
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
    maxAttempts = 15,
  } = config;

  const availableColors = colors || ['red', 'blue', 'yellow', 'purple', 'green', 'orange'];
  const colorPool = availableColors.filter((c) => c.toLowerCase() !== 'gray' && c.toLowerCase() !== 'grey');

  const attemptBudget = Math.min(Math.max(maxAttempts, 8), 30);
  let bestCandidate: GeneratedPuzzle | null = null;
  let bestScore = -Infinity;

  for (let attempt = 0; attempt < attemptBudget; attempt++) {
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
    const reservedTiles = new Set<string>(); // Player push standing tiles & corridors

    const shuffledColors = colorPool.slice();
    for (let i = shuffledColors.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledColors[i], shuffledColors[j]] = [shuffledColors[j]!, shuffledColors[i]!];
    }
    const chosenColors = shuffledColors.slice(0, numBlocks);

    // 1. Place Targets across distinct quadrants & perimeter
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
      for (let tTry = 0; tTry < 40; tTry++) {
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

    // Helper: count unobstructed steps in reverse direction without crossing reserved tiles
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
          currentPositions.some((pos, idx) => idx !== ignoreIdx && pos.x === cx && pos.y === cy)
        ) {
          break;
        }
        count++;
      }
      return count;
    };

    // 2. Sequential Reverse-Time Scrambling with Step-Level Backtracking
    const currentPositions = targets.map((t) => ({ x: t.x, y: t.y }));
    let layoutFailed = false;

    type BlockScrambleStep = {
      pos: Position;
      fwdDir: Position;
      draftWalls: Position[];
      draftWallKeys: string[];
      reservedKeys: string[];
    };

    for (let bIdx = numBlocks - 1; bIdx >= 0; bIdx--) {
      const blockPushes = pushesPerBlock[bIdx] || 2;
      const startTarget = targets[bIdx]!;
      let blockPlaced = false;

      // Try multiple seed initial directions for this block
      for (let seedTry = 0; seedTry < 16 && !blockPlaced; seedTry++) {
        const cardDirs: Position[] = [
          { x: 0, y: -1 },
          { x: 0, y: 1 },
          { x: -1, y: 0 },
          { x: 1, y: 0 },
        ];

        // Shuffle candidate initial directions
        for (let i = cardDirs.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [cardDirs[i], cardDirs[j]] = [cardDirs[j]!, cardDirs[i]!];
        }

        // DFS Backtracking state stack for this block
        const stack: {
          pushIdx: number;
          currPos: Position;
          currFwd: Position;
          steps: BlockScrambleStep[];
          triedTurns: Position[];
        }[] = [];

        // Seed stack with valid initial arrival directions (requires at least 2 clear steps for block + player push stance)
        for (const initDir of cardDirs) {
          const rev = { x: -initDir.x, y: -initDir.y };
          const maxSteps = getClearSteps(startTarget, rev, [], bIdx);
          if (maxSteps >= 2) {
            stack.push({
              pushIdx: 0,
              currPos: { x: startTarget.x, y: startTarget.y },
              currFwd: initDir,
              steps: [],
              triedTurns: [],
            });
          }
        }

        let dfsSteps = 0;
        while (stack.length > 0 && dfsSteps < 120) {
          dfsSteps++;
          const frame = stack[stack.length - 1];
          if (!frame) break;

          // Accept placed block if target pushes reached OR if at least 2 pushes completed and we can't push further
          if (frame.pushIdx >= blockPushes || (frame.pushIdx >= 2 && stack.length === 1)) {
            // Check start position is not on a target
            if (!targets.some((t) => t.x === frame.currPos.x && t.y === frame.currPos.y)) {
              // Commit all draft walls and reservations from frame
              for (const step of frame.steps) {
                for (let dwIdx = 0; dwIdx < step.draftWalls.length; dwIdx++) {
                  walls.push(step.draftWalls[dwIdx]!);
                  wallSet.add(step.draftWallKeys[dwIdx]!);
                }
                for (const rk of step.reservedKeys) {
                  reservedTiles.add(rk);
                }
              }
              currentPositions[bIdx] = { ...frame.currPos };
              blockPlaced = true;
              break;
            } else if (frame.pushIdx >= blockPushes) {
              stack.pop();
              continue;
            }
          }

          // Generate next turn options
          const allDraftKeys = frame.steps.flatMap((s) => s.draftWallKeys);
          let perps: Position[];

          if (frame.pushIdx === 0) {
            perps = [frame.currFwd];
          } else {
            perps =
              frame.currFwd.x === 0 ? [{ x: -1, y: 0 }, { x: 1, y: 0 }] : [{ x: 0, y: -1 }, { x: 0, y: 1 }];
          }

          // Filter out already tried turns in this frame
          const untriedPerps = perps.filter(
            (p) => !frame.triedTurns.some((tt) => tt.x === p.x && tt.y === p.y)
          );

          if (untriedPerps.length === 0) {
            // If we have completed at least 2 valid pushes, try committing if off target
            if (frame.pushIdx >= 2 && !targets.some((t) => t.x === frame.currPos.x && t.y === frame.currPos.y)) {
              for (const step of frame.steps) {
                for (let dwIdx = 0; dwIdx < step.draftWalls.length; dwIdx++) {
                  walls.push(step.draftWalls[dwIdx]!);
                  wallSet.add(step.draftWallKeys[dwIdx]!);
                }
                for (const rk of step.reservedKeys) {
                  reservedTiles.add(rk);
                }
              }
              currentPositions[bIdx] = { ...frame.currPos };
              blockPlaced = true;
              break;
            }
            stack.pop(); // Backtrack
            continue;
          }

          // Pick one untried turn
          const chosenTurn = untriedPerps[Math.floor(Math.random() * untriedPerps.length)]!;
          frame.triedTurns.push(chosenTurn);

          const rev = { x: -chosenTurn.x, y: -chosenTurn.y };
          const maxSteps = getClearSteps(frame.currPos, rev, allDraftKeys, bIdx);
          // Need at least 2 clear steps: 1 for block position, 1 for player push tile behind block
          if (maxSteps < 2) continue;

          // Calculate stopping wall behind the turn (in forward play, block hits swPos)
          const stepDraftWalls: Position[] = [];
          const stepDraftKeys: string[] = [];

          const swPos = { x: frame.currPos.x + chosenTurn.x, y: frame.currPos.y + chosenTurn.y };
          const swK = `${swPos.x},${swPos.y}`;
          const isSwBorder = swPos.x < 0 || swPos.x >= width || swPos.y < 0 || swPos.y >= height;
          const isSwBlock = currentPositions.some((pos) => pos.x === swPos.x && pos.y === swPos.y);
          const isSwWall = wallSet.has(swK) || allDraftKeys.includes(swK);
          const isSwTarget = targets.some((t) => t.x === swPos.x && t.y === swPos.y);
          const isSwReserved = reservedTiles.has(swK);

          // Cannot place wall on targets or reserved player stance tiles
          if (isSwTarget) continue;
          if (!isSwBorder && !isSwBlock && !isSwWall && isSwReserved) continue;

          if (!isSwBorder && !isSwBlock && !isSwWall) {
            stepDraftWalls.push(swPos);
            stepDraftKeys.push(swK);
          }

          const maxPull = maxSteps - 1;
          const minPull = maxPull >= 3 ? 2 : 1;
          const desiredDist = Math.floor(Math.random() * (maxPull - minPull + 1)) + minPull;

          const nextPos = {
            x: frame.currPos.x + rev.x * desiredDist,
            y: frame.currPos.y + rev.y * desiredDist,
          };

          // Player push tile in forward play: player stands at nextPos - chosenTurn = nextPos + rev
          const playerPushTile = {
            x: nextPos.x + rev.x,
            y: nextPos.y + rev.y,
          };
          const playerPushKey = `${playerPushTile.x},${playerPushTile.y}`;
          const stepReservedKeys = [playerPushKey];

          const newStep: BlockScrambleStep = {
            pos: nextPos,
            fwdDir: chosenTurn,
            draftWalls: stepDraftWalls,
            draftWallKeys: stepDraftKeys,
            reservedKeys: stepReservedKeys,
          };

          stack.push({
            pushIdx: frame.pushIdx + 1,
            currPos: nextPos,
            currFwd: chosenTurn,
            steps: [...frame.steps, newStep],
            triedTurns: [],
          });
        }
      }

      if (!blockPlaced) {
        layoutFailed = true;
        break;
      }
    }

    if (layoutFailed) continue;

    // 3. Assemble Blocks & Anti-Shortcut Line-of-Sight Baffle Check
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

    if (representativeTiles.length === 0) continue;

    for (let i = representativeTiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [representativeTiles[i], representativeTiles[j]] = [representativeTiles[j]!, representativeTiles[i]!];
    }

    const attemptProgress = attempt / attemptBudget;
    const effMinSolutionPush = attemptProgress > 0.4 ? Math.max(3, minSolutionPushCount - 2) : minSolutionPushCount;
    const effMinAvgDist = attemptProgress > 0.4 ? Math.max(1.8, minAverageSlideDistance - 0.6) : minAverageSlideDistance;
    const effMinCollisions = attemptProgress > 0.4 ? Math.max(0, minBlockCollisions - 1) : minBlockCollisions;
    const effMinSwitches = attemptProgress > 0.4 ? Math.max(0, minBlockSwitches - 1) : minBlockSwitches;
    const minAcceptablePush = Math.max(3, minSolutionPushCount - 3);

    let playerStart: Position | null = null;
    let verifiedSolution: SolverResult | null = null;
    let bestPlayerMetrics: InteractionMetrics | null = null;

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

      const sol = solvePuzzlePushBFS(testInput, numBlocks >= 4 ? 10000 : 4000);
      if (sol && sol.solved && sol.pushCount >= minAcceptablePush) {
        const metrics = getDetailedInteractionMetrics(width, height, pos, walls, blocks, sol.moves);
        playerStart = pos;
        verifiedSolution = sol;
        bestPlayerMetrics = metrics;

        if (
          sol.pushCount >= effMinSolutionPush &&
          metrics.averageSlideDistance >= effMinAvgDist &&
          metrics.blockCollisions >= effMinCollisions &&
          metrics.blockSwitches >= effMinSwitches
        ) {
          break;
        }
      }
    }

    if (!playerStart || !verifiedSolution || !bestPlayerMetrics) continue;

    // 5. Automated Wall Pruning
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

    const puzzleCandidate: GeneratedPuzzle = {
      width,
      height,
      player: playerStart,
      walls: finalWalls,
      blocks,
      targets,
      portals: [],
      solutionMoves: verifiedSolution.moves,
      par: verifiedSolution.pushCount,
      averageSlideDistance: Math.round(finalMetrics.averageSlideDistance * 10) / 10,
      pushDistances: finalMetrics.slideDistances,
      blockCollisions: finalMetrics.blockCollisions,
      blockSwitches: finalMetrics.blockSwitches,
      pushSequence: finalMetrics.pushSequence,
    };

    // Candidate Quality Score Q
    const score =
      verifiedSolution.pushCount * 2.5 +
      finalMetrics.blockCollisions * 4.0 +
      finalMetrics.blockSwitches * 3.0 +
      finalMetrics.averageSlideDistance * 2.0 -
      finalWalls.length * 0.3;

    if (score > bestScore) {
      bestScore = score;
      bestCandidate = puzzleCandidate;
    }

    // Early Exit: if candidate passes all target metrics or hits high quality score
    const meetsAllTargets =
      verifiedSolution.pushCount >= minSolutionPushCount &&
      finalMetrics.averageSlideDistance >= minAverageSlideDistance &&
      finalMetrics.blockCollisions >= minBlockCollisions &&
      finalMetrics.blockSwitches >= minBlockSwitches;

    if (meetsAllTargets || score >= 24) {
      return puzzleCandidate;
    }
  }

  if (bestCandidate) {
    return bestCandidate;
  }

  // Emergency dynamic fallback: generate a guaranteed random solvable puzzle on the fly
  return generateReversePushPuzzle({
    ...config,
    minBlocks: Math.max(2, minBlocks - 1),
    maxBlocks: Math.max(2, minBlocks),
    minTotalPushes: 4,
    maxTotalPushes: 6,
    minPushesPerBlock: 2,
    maxPushesPerBlock: 3,
    minSolutionPushCount: 4,
    minAverageSlideDistance: 1.8,
    minBlockCollisions: 0,
    minBlockSwitches: 0,
    maxAttempts: 8,
  });
};

export type ComplexityPreset = 'easy' | 'medium' | 'hard' | 'expert' | 'custom';

export type PuzzleGenerateOptions = {
  preset?: ComplexityPreset | undefined;
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

export type PuzzleComplexityConfig = PuzzleGenerateOptions;

export const COMPLEXITY_PRESETS: Record<'easy' | 'medium' | 'hard' | 'expert', ReversePushGeneratorConfig> = {
  easy: {
    width: 9,
    height: 9,
    minBlocks: 2,
    maxBlocks: 2,
    minTotalPushes: 4,
    maxTotalPushes: 6,
    minPushesPerBlock: 2,
    maxPushesPerBlock: 3,
    minSolutionPushCount: 4,
    minAverageSlideDistance: 2.0,
    minBlockCollisions: 0,
    minBlockSwitches: 1,
    maxAttempts: 15,
  },
  medium: {
    width: 9,
    height: 9,
    minBlocks: 3,
    maxBlocks: 3,
    minTotalPushes: 6,
    maxTotalPushes: 9,
    minPushesPerBlock: 2,
    maxPushesPerBlock: 4,
    minSolutionPushCount: 6,
    minAverageSlideDistance: 2.6,
    minBlockCollisions: 1,
    minBlockSwitches: 2,
    maxAttempts: 20,
  },
  hard: {
    width: 9,
    height: 9,
    minBlocks: 3,
    maxBlocks: 4,
    minTotalPushes: 8,
    maxTotalPushes: 12,
    minPushesPerBlock: 2,
    maxPushesPerBlock: 4,
    minSolutionPushCount: 7,
    minAverageSlideDistance: 2.8,
    minBlockCollisions: 1,
    minBlockSwitches: 2,
    maxAttempts: 25,
  },
  expert: {
    width: 9,
    height: 9,
    minBlocks: 3,
    maxBlocks: 4,
    minTotalPushes: 8,
    maxTotalPushes: 12,
    minPushesPerBlock: 2,
    maxPushesPerBlock: 4,
    minSolutionPushCount: 7,
    minAverageSlideDistance: 2.7,
    minBlockCollisions: 1,
    minBlockSwitches: 2,
    maxAttempts: 15,
  },
};

export const generateEasyPuzzle = (options: PuzzleGenerateOptions = {}): GeneratedPuzzle => {
  return generateConfigurablePuzzle({ ...options, preset: 'easy' });
};

export const generateModeratePuzzle = (options: PuzzleGenerateOptions = {}): GeneratedPuzzle => {
  return generateConfigurablePuzzle({ ...options, preset: 'medium' });
};

export const generateMediumPuzzle = generateModeratePuzzle;

export const generateHardPuzzle = (options: PuzzleGenerateOptions = {}): GeneratedPuzzle => {
  return generateConfigurablePuzzle({ ...options, preset: 'hard' });
};

export const generateExpertPuzzle = (options: PuzzleGenerateOptions = {}): GeneratedPuzzle => {
  return generateConfigurablePuzzle({ ...options, preset: 'expert' });
};

export const generateConfigurablePuzzle = (options: PuzzleGenerateOptions = {}): GeneratedPuzzle => {
  const presetKey = options.preset && options.preset !== 'custom' ? options.preset : 'medium';
  const base = COMPLEXITY_PRESETS[presetKey] || COMPLEXITY_PRESETS.medium;

  return generateReversePushPuzzle({
    width: options.width || base.width,
    height: options.height || base.height,
    minBlocks: options.minBlocks ?? base.minBlocks,
    maxBlocks: options.maxBlocks ?? base.maxBlocks,
    minTotalPushes: options.minTotalPushes ?? base.minTotalPushes,
    maxTotalPushes: options.maxTotalPushes ?? base.maxTotalPushes,
    minPushesPerBlock: options.minPushesPerBlock ?? base.minPushesPerBlock,
    maxPushesPerBlock: options.maxPushesPerBlock ?? base.maxPushesPerBlock,
    minSolutionPushCount: options.minSolutionPushCount ?? base.minSolutionPushCount,
    minAverageSlideDistance: options.minAverageSlideDistance ?? base.minAverageSlideDistance,
    minBlockCollisions: options.minBlockCollisions ?? base.minBlockCollisions,
    minBlockSwitches: options.minBlockSwitches ?? base.minBlockSwitches,
    colors: options.colors ?? base.colors,
    maxAttempts: options.maxAttempts ?? base.maxAttempts,
  });
};

export const generatePuzzle = generateConfigurablePuzzle;
export type EasyGenerateOptions = PuzzleGenerateOptions;



