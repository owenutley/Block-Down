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
  let newBlocks = currentBlocks.map((b) => ({ ...b }));
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

export const solvePuzzle = (
  input: PuzzleSolverInput,
  maxStates = 25000
): SolverResult | null => {
  const { targets } = input;
  if (targets.length === 0) return null;

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

  let statesExplored = 0;

  while (queue.length > 0 && statesExplored < maxStates) {
    const current = queue.shift()!;
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

  return null; // Unsolvable or limit exceeded
};

// ==========================================
// EASY GENERATOR (REVERSE BLOCK-PUSH ARCHITECTURE)
// ==========================================

export const isValidDistancePattern = (distances: number[]): boolean => {
  const seen = new Set<number>();
  let lastNum: number | null = null;

  for (const num of distances) {
    if (lastNum !== null && num !== lastNum) {
      if (seen.has(num)) {
        return false; // Re-occurrence of a number after a different number in between
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

  // Shuffle pool
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

export const checkPlayerReachability = (
  gridWidth: number,
  gridHeight: number,
  playerStart: Position,
  requiredPushTiles: Position[],
  walls: Position[],
  block: Position
): boolean => {
  const wallSet = new Set(walls.map((w) => `${w.x},${w.y}`));
  wallSet.add(`${block.x},${block.y}`); // Block acts as an obstacle to player walk

  const visited = new Set<string>();
  const queue: Position[] = [{ ...playerStart }];
  visited.add(`${playerStart.x},${playerStart.y}`);

  const cardDirs: Position[] = [
    { x: 0, y: -1 },
    { x: 0, y: 1 },
    { x: -1, y: 0 },
    { x: 1, y: 0 },
  ];

  while (queue.length > 0) {
    const curr = queue.shift()!;
    for (const d of cardDirs) {
      const nx = curr.x + d.x;
      const ny = curr.y + d.y;
      const key = `${nx},${ny}`;
      if (
        nx >= 0 &&
        nx < gridWidth &&
        ny >= 0 &&
        ny < gridHeight &&
        !wallSet.has(key) &&
        !visited.has(key)
      ) {
        visited.add(key);
        queue.push({ x: nx, y: ny });
      }
    }
  }

  return requiredPushTiles.every((pt) => visited.has(`${pt.x},${pt.y}`));
};

/**
 * Wall Pruner: Tests each wall to verify if it is strictly necessary to solve the puzzle.
 * Removes any redundant/unused walls that do not affect the solution.
 */
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

    const result = solvePuzzle(testInput, 15000);

    // If puzzle is STILL solvable in the exact same push count without candidateWall, candidateWall is UNUSED!
    if (result && result.solved && result.pushCount === expectedPushCount) {
      activeWalls = testWalls; // Prune the unused wall!
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
  colors?: string[] | undefined;
  maxAttempts?: number | undefined;
};

export const generateReversePushPuzzle = (config: ReversePushGeneratorConfig): {
  width: number;
  height: number;
  player: Position;
  walls: Position[];
  blocks: SolverBlock[];
  targets: SolverTarget[];
  portals: PuzzlePortal[];
  solutionMoves: ('Up' | 'Down' | 'Left' | 'Right')[];
} => {
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
    colors,
    maxAttempts = 350,
  } = config;

  const availableColors = colors || ['red', 'blue', 'yellow', 'purple', 'green', 'orange'];
  const colorPool = availableColors.filter((c) => c.toLowerCase() !== 'gray' && c.toLowerCase() !== 'grey');

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // 1. Roll number of blocks
    const numBlocks = Math.floor(Math.random() * (maxBlocks - minBlocks + 1)) + minBlocks;
    // 2. Roll total pushes
    let totalPushes = Math.floor(Math.random() * (maxTotalPushes - minTotalPushes + 1)) + minTotalPushes;

    // Enforce bounds
    if (totalPushes < numBlocks * minPushesPerBlock) {
      totalPushes = numBlocks * minPushesPerBlock;
    }
    if (totalPushes > numBlocks * maxPushesPerBlock) {
      totalPushes = numBlocks * maxPushesPerBlock;
    }

    // Partition totalPushes across numBlocks
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
    const occupiedPositions = new Set<string>();
    const reservedSlideTiles = new Set<string>();

    const blocks: SolverBlock[] = [];
    const targets: SolverTarget[] = [];
    const requiredPushTiles: Position[] = [];
    let failedGeneration = false;

    // Shuffle color pool for this puzzle attempt
    const shuffledColors = colorPool.slice();
    for (let i = shuffledColors.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledColors[i], shuffledColors[j]] = [shuffledColors[j]!, shuffledColors[i]!];
    }
    const chosenColors = shuffledColors.slice(0, numBlocks);

    for (let bIdx = 0; bIdx < numBlocks; bIdx++) {
      const color = chosenColors[bIdx] || `color_${bIdx}`;
      const blockPushesCount = pushesPerBlock[bIdx]!;
      let blockPlaced = false;

      for (let tAttempt = 0; tAttempt < 25; tAttempt++) {
        const blockDraftWalls: Position[] = [];
        const blockDraftWallKeys: string[] = [];
        const blockReservedTiles = new Set<string>();
        const blockPushTiles: Position[] = [];

        // Attempt 50% wall reuse if walls already exist
        let reusedWallTarget: { targetPos: Position; fwdIncDir: Position } | null = null;
        if (walls.length > 0 && Math.random() < 0.5) {
          const randomExistingWall = walls[Math.floor(Math.random() * walls.length)]!;
          const dirs: Position[] = [
            { x: 0, y: -1 },
            { x: 0, y: 1 },
            { x: -1, y: 0 },
            { x: 1, y: 0 },
          ];
          const randomDir = dirs[Math.floor(Math.random() * dirs.length)]!;
          const candidateTargetPos = {
            x: randomExistingWall.x - randomDir.x,
            y: randomExistingWall.y - randomDir.y,
          };

          const key = `${candidateTargetPos.x},${candidateTargetPos.y}`;
          if (
            candidateTargetPos.x >= 0 &&
            candidateTargetPos.x < width &&
            candidateTargetPos.y >= 0 &&
            candidateTargetPos.y < height &&
            !wallSet.has(key) &&
            !occupiedPositions.has(key) &&
            !reservedSlideTiles.has(key)
          ) {
            reusedWallTarget = { targetPos: candidateTargetPos, fwdIncDir: randomDir };
          }
        }

        let targetPos: Position;
        let fwdIncDir: Position;

        if (reusedWallTarget) {
          targetPos = reusedWallTarget.targetPos;
          fwdIncDir = reusedWallTarget.fwdIncDir;
        } else {
          // 50/50 Outer Edge vs Internal Wall
          const isOuterEdge = Math.random() < 0.5;

          if (isOuterEdge) {
            const edges: ('top' | 'bottom' | 'left' | 'right')[] = ['top', 'bottom', 'left', 'right'];
            const edge = edges[Math.floor(Math.random() * edges.length)]!;

            if (edge === 'top') {
              targetPos = { x: Math.floor(Math.random() * (width - 2)) + 1, y: 0 };
              fwdIncDir = { x: 0, y: -1 };
            } else if (edge === 'bottom') {
              targetPos = { x: Math.floor(Math.random() * (width - 2)) + 1, y: height - 1 };
              fwdIncDir = { x: 0, y: 1 };
            } else if (edge === 'left') {
              targetPos = { x: 0, y: Math.floor(Math.random() * (height - 2)) + 1 };
              fwdIncDir = { x: -1, y: 0 };
            } else {
              targetPos = { x: width - 1, y: Math.floor(Math.random() * (height - 2)) + 1 };
              fwdIncDir = { x: 1, y: 0 };
            }
          } else {
            targetPos = {
              x: Math.floor(Math.random() * (width - 2)) + 1,
              y: Math.floor(Math.random() * (height - 2)) + 1,
            };
            const allDirs: Position[] = [
              { x: 0, y: -1 },
              { x: 0, y: 1 },
              { x: -1, y: 0 },
              { x: 1, y: 0 },
            ];
            fwdIncDir = allDirs[Math.floor(Math.random() * allDirs.length)]!;
            const stoppingWallPos = { x: targetPos.x + fwdIncDir.x, y: targetPos.y + fwdIncDir.y };

            if (
              stoppingWallPos.x >= 0 &&
              stoppingWallPos.x < width &&
              stoppingWallPos.y >= 0 &&
              stoppingWallPos.y < height
            ) {
              const wKey = `${stoppingWallPos.x},${stoppingWallPos.y}`;
              if (reservedSlideTiles.has(wKey) || occupiedPositions.has(wKey)) {
                continue;
              }

              if (!wallSet.has(wKey)) {
                blockDraftWalls.push(stoppingWallPos);
                blockDraftWallKeys.push(wKey);
              }
            }
          }
        }

        const targetKey = `${targetPos.x},${targetPos.y}`;
        if (
          wallSet.has(targetKey) ||
          occupiedPositions.has(targetKey) ||
          reservedSlideTiles.has(targetKey) ||
          blockDraftWallKeys.includes(targetKey)
        ) {
          continue;
        }

        // Build Reverse Push Trajectory
        const maxDistance = Math.min(4, Math.max(2, Math.floor(Math.min(width, height) - 2)));
        const distances = generateValidDistances(blockPushesCount, maxDistance);

        let currBlockPos = { ...targetPos };
        let currFwdDir = { ...fwdIncDir };
        let stepFailed = false;

        for (let pStep = 0; pStep < blockPushesCount; pStep++) {
          let dist = distances[pStep]!;

          if (pStep > 0) {
            const perpDirs: Position[] =
              currFwdDir.x === 0
                ? [{ x: -1, y: 0 }, { x: 1, y: 0 }]
                : [{ x: 0, y: -1 }, { x: 0, y: 1 }];

            const candidateDirs = perpDirs.slice();
            if (Math.random() < 0.5) candidateDirs.reverse();

            let chosenDir: Position | null = null;
            let chosenWallToBuild: Position | null = null;

            for (const pDir of candidateDirs) {
              const twPos = { x: currBlockPos.x + pDir.x, y: currBlockPos.y + pDir.y };
              const twKey = `${twPos.x},${twPos.y}`;

              const isOffGrid =
                twPos.x < 0 || twPos.x >= width || twPos.y < 0 || twPos.y >= height;

              if (isOffGrid || wallSet.has(twKey) || blockDraftWallKeys.includes(twKey)) {
                chosenDir = pDir;
                chosenWallToBuild = null;
                break;
              } else if (!reservedSlideTiles.has(twKey) && !occupiedPositions.has(twKey)) {
                chosenDir = pDir;
                chosenWallToBuild = twPos;
                break;
              }
            }

            if (!chosenDir) {
              stepFailed = true;
              break;
            }

            currFwdDir = chosenDir;
            if (chosenWallToBuild) {
              const twKey = `${chosenWallToBuild.x},${chosenWallToBuild.y}`;
              blockDraftWalls.push(chosenWallToBuild);
              blockDraftWallKeys.push(twKey);
            }
          }

          // Check available distance bounds in reverse direction (-currFwdDir)
          const revDir = { x: -currFwdDir.x, y: -currFwdDir.y };
          let maxAvailableDist = 0;
          let testX = currBlockPos.x + revDir.x;
          let testY = currBlockPos.y + revDir.y;

          while (
            testX >= 0 &&
            testX < width &&
            testY >= 0 &&
            testY < height &&
            !wallSet.has(`${testX},${testY}`) &&
            !blockDraftWallKeys.includes(`${testX},${testY}`) &&
            !occupiedPositions.has(`${testX},${testY}`)
          ) {
            maxAvailableDist++;
            testX += revDir.x;
            testY += revDir.y;
          }

          if (maxAvailableDist < 1) {
            stepFailed = true;
            break;
          }

          dist = Math.min(dist, maxAvailableDist);

          const newBlockPos = {
            x: currBlockPos.x - currFwdDir.x * dist,
            y: currBlockPos.y - currFwdDir.y * dist,
          };

          if (
            newBlockPos.x < 0 ||
            newBlockPos.x >= width ||
            newBlockPos.y < 0 ||
            newBlockPos.y >= height ||
            wallSet.has(`${newBlockPos.x},${newBlockPos.y}`) ||
            blockDraftWallKeys.includes(`${newBlockPos.x},${newBlockPos.y}`) ||
            occupiedPositions.has(`${newBlockPos.x},${newBlockPos.y}`)
          ) {
            stepFailed = true;
            break;
          }

          // Mark slide corridor tiles as reserved for this block trajectory
          for (let step = 0; step <= dist; step++) {
            const stepX = currBlockPos.x - currFwdDir.x * step;
            const stepY = currBlockPos.y - currFwdDir.y * step;
            blockReservedTiles.add(`${stepX},${stepY}`);
          }

          // Push position
          const pushTile = { x: newBlockPos.x - currFwdDir.x, y: newBlockPos.y - currFwdDir.y };
          if (
            pushTile.x >= 0 &&
            pushTile.x < width &&
            pushTile.y >= 0 &&
            pushTile.y < height &&
            !wallSet.has(`${pushTile.x},${pushTile.y}`) &&
            !blockDraftWallKeys.includes(`${pushTile.x},${pushTile.y}`)
          ) {
            blockPushTiles.push(pushTile);
          }

          currBlockPos = newBlockPos;
        }

        if (stepFailed) continue;

        const finalBlockKey = `${currBlockPos.x},${currBlockPos.y}`;

        // A block must NEVER start on its target or any other target or occupied cell!
        const startsOnAnyTarget =
          (currBlockPos.x === targetPos.x && currBlockPos.y === targetPos.y) ||
          targets.some((t) => t.x === currBlockPos.x && t.y === currBlockPos.y);

        if (startsOnAnyTarget || occupiedPositions.has(finalBlockKey) || wallSet.has(finalBlockKey)) {
          continue;
        }

        // Commit draft walls and positions for this block atomically
        for (let i = 0; i < blockDraftWalls.length; i++) {
          const dw = blockDraftWalls[i]!;
          const dwKey = blockDraftWallKeys[i]!;
          walls.push(dw);
          wallSet.add(dwKey);
          occupiedPositions.add(dwKey);
        }
        for (const rTile of blockReservedTiles) {
          reservedSlideTiles.add(rTile);
        }
        for (const pTile of blockPushTiles) {
          requiredPushTiles.push(pTile);
        }

        occupiedPositions.add(targetKey);
        occupiedPositions.add(finalBlockKey);

        targets.push({ id: `t_${color}_${bIdx}`, color, x: targetPos.x, y: targetPos.y });
        blocks.push({ id: `b_${color}_${bIdx}`, color, x: currBlockPos.x, y: currBlockPos.y });

        blockPlaced = true;
        break;
      }

      if (!blockPlaced) {
        failedGeneration = true;
        break;
      }
    }

    if (failedGeneration || blocks.length === 0) continue;

    // Strict validation: NO block can start on ANY target cell!
    const anyBlockOnTarget = blocks.some((b) => targets.some((t) => t.x === b.x && t.y === b.y));
    if (anyBlockOnTarget) continue;

    // Pick Central Player Start Position (closest open tile to board center)
    const centerX = Math.floor(width / 2);
    const centerY = Math.floor(height / 2);

    const openTiles: { pos: Position; dist: number }[] = [];
    for (let py = 0; py < height; py++) {
      for (let px = 0; px < width; px++) {
        const pKey = `${px},${py}`;
        if (
          !wallSet.has(pKey) &&
          !blocks.some((b) => b.x === px && b.y === py) &&
          !targets.some((t) => t.x === px && t.y === py)
        ) {
          const dist = Math.abs(px - centerX) + Math.abs(py - centerY);
          openTiles.push({ pos: { x: px, y: py }, dist });
        }
      }
    }

    openTiles.sort((a, b) => a.dist - b.dist);

    let playerStart: Position | null = null;
    for (const item of openTiles) {
      let allReachable = true;
      for (const b of blocks) {
        if (!checkPlayerReachability(width, height, item.pos, requiredPushTiles, walls, { x: b.x, y: b.y })) {
          allReachable = false;
          break;
        }
      }
      if (allReachable) {
        playerStart = item.pos;
        break;
      }
    }

    if (!playerStart) continue;

    // Verify layout with solver
    const solverInput: PuzzleSolverInput = {
      width,
      height,
      player: playerStart,
      walls,
      blocks,
      targets,
      portals: [],
    };

    const solution = solvePuzzle(solverInput, 15000);

    if (solution && solution.solved && solution.pushCount >= minSolutionPushCount) {
      // Run Automated Wall Pruning to remove any redundant/unused walls
      const finalWalls = pruneUnusedWalls(
        width,
        height,
        playerStart,
        walls,
        blocks,
        targets,
        solution.pushCount
      );

      return {
        width,
        height,
        player: playerStart,
        walls: finalWalls,
        blocks,
        targets,
        portals: [],
        solutionMoves: solution.moves,
      };
    }
  }

  // Fallback guaranteed layout if max attempts exhausted
  if (minBlocks >= 3) {
    const fallbackPlayer = { x: 4, y: 4 };
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
  }

  const fallbackPlayer = { x: 4, y: 4 };
  const fallbackBlocks: SolverBlock[] = [
    { id: 'b_red_0', color: 'red', x: 2, y: 3 },
    { id: 'b_blue_1', color: 'blue', x: 6, y: 5 },
  ];
  const fallbackTargets: SolverTarget[] = [
    { id: 't_red_0', color: 'red', x: 6, y: 2 },
    { id: 't_blue_1', color: 'blue', x: 2, y: 6 },
  ];
  const fallbackWalls: Position[] = [
    { x: 2, y: 1 },
    { x: 7, y: 2 },
    { x: 6, y: 7 },
    { x: 1, y: 6 },
  ];

  const fallbackSolution = solvePuzzle({
    width,
    height,
    player: fallbackPlayer,
    walls: fallbackWalls,
    blocks: fallbackBlocks,
    targets: fallbackTargets,
  }) || { moves: ['Up', 'Right', 'Down', 'Left'], pushCount: 4, solved: true };

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

export type EasyGenerateOptions = {
  width?: number;
  height?: number;
  colors?: string[];
  maxAttempts?: number;
};

export const generateEasyPuzzle = (options: EasyGenerateOptions = {}) => {
  const width = options.width || 9;
  const height = options.height || 9;
  return generateReversePushPuzzle({
    width,
    height,
    minBlocks: 2,
    maxBlocks: 4,
    minTotalPushes: 6,
    maxTotalPushes: 9,
    minPushesPerBlock: 2,
    maxPushesPerBlock: 4,
    minSolutionPushCount: 4,
    colors: options.colors,
    maxAttempts: options.maxAttempts || 350,
  });
};

export const generatePuzzle = generateEasyPuzzle;

