import { BlockType, LevelConfig, Position, PuzzleData, BlockData, PuzzlePortal, PortalDirection } from '../types';

export const colorToBlockType = (color: string): BlockType => {
  switch (color.toLowerCase()) {
    case 'red': return 'red-heart';
    case 'blue': return 'blue-diamond';
    case 'yellow': return 'yellow-crescent';
    case 'purple': return 'purple-circle';
    case 'green': return 'green-cross';
    case 'orange': return 'orange-square';
    case 'gray':
    case 'grey':
      return 'gray-neutral';
    default: return 'red-heart';
  }
};

export const dirToVector = (dir: PortalDirection): Position => {
  switch (dir) {
    case 'Up': return { x: 0, y: -1 };
    case 'Down': return { x: 0, y: 1 };
    case 'Left': return { x: -1, y: 0 };
    case 'Right': return { x: 1, y: 0 };
  }
};

const positionKey = (pos: Position) => `${pos.x},${pos.y}`;

export type PortalTrajectory = {
  finalPos: Position;
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
  const visitedPortals = new Set<string>();
  let firstEntryPortal: PuzzlePortal | undefined;
  let firstExitPortal: PuzzlePortal | undefined;

  while (true) {
    const nextPos = { x: currentPos.x + currentDir.x, y: currentPos.y + currentDir.y };

    const entryPortal = portals.find(p => {
      if (p.x !== currentPos.x || p.y !== currentPos.y) return false;
      const portalVec = dirToVector(p.dir);
      return portalVec.x === -currentDir.x && portalVec.y === -currentDir.y;
    });

    const isNextWallOrBound =
      nextPos.x < 0 || nextPos.x >= gridSize ||
      nextPos.y < 0 || nextPos.y >= gridSize ||
      wallSet.has(positionKey(nextPos));

    const blockAtNext = blockPositions.some(
      b => b.x === nextPos.x && b.y === nextPos.y && (b.x !== startPos.x || b.y !== startPos.y)
    );

    if (isNextWallOrBound || blockAtNext) {
      if (entryPortal && !visitedPortals.has(entryPortal.id)) {
        const exitPortal = portals.find(p => p.color.toLowerCase() === entryPortal.color.toLowerCase() && p.id !== entryPortal.id);
        if (exitPortal) {
          const exitCell = { x: exitPortal.x, y: exitPortal.y };
          const exitBlocked = blockPositions.some(
            b => b.x === exitCell.x && b.y === exitCell.y && (b.x !== startPos.x || b.y !== startPos.y)
          );
          if (!exitBlocked && !wallSet.has(positionKey(exitCell))) {
            if (!firstEntryPortal) firstEntryPortal = entryPortal;
            if (!firstExitPortal) firstExitPortal = exitPortal;

            visitedPortals.add(entryPortal.id);
            visitedPortals.add(exitPortal.id);
            currentPos = exitCell;
            currentDir = dirToVector(exitPortal.dir);
            continue;
          }
        }
      }
      break;
    }

    currentPos = nextPos;
  }

  return {
    finalPos: currentPos,
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

export const simulateSolutionPushes = (levelConfig: LevelConfig): number => {
  if (!levelConfig.moves || levelConfig.moves.length === 0) {
    return Math.max(2, levelConfig.blocks.length * 2);
  }

  let player = { ...levelConfig.startPos };
  let blocks = levelConfig.blocks.map(b => ({ ...b, pos: { ...b.pos } }));
  const wallSet = new Set(levelConfig.walls.map(positionKey));
  let pushCount = 0;

  const pushBlock = (blockPos: Position, direction: Position, currentBlocks: BlockData[]): Position => {
    return getNextPosWithPortals(
      blockPos,
      direction,
      levelConfig.gridSize,
      wallSet,
      currentBlocks.map(b => b.pos),
      levelConfig.portals || []
    );
  };

  for (const move of levelConfig.moves) {
    let dir = { x: 0, y: 0 };
    switch (move.toLowerCase()) {
      case 'up': dir = { x: 0, y: -1 }; break;
      case 'down': dir = { x: 0, y: 1 }; break;
      case 'left': dir = { x: -1, y: 0 }; break;
      case 'right': dir = { x: 1, y: 0 }; break;
      default: continue;
    }

    const portals = levelConfig.portals || [];
    const portalOnCurrentCell = portals.find(p => p.x === player.x && p.y === player.y);
    if (portalOnCurrentCell) {
      const portalVec = dirToVector(portalOnCurrentCell.dir);
      if (portalVec.x === -dir.x && portalVec.y === -dir.y) {
        const exitPortal = portals.find(
          p => p.color.toLowerCase() === portalOnCurrentCell.color.toLowerCase() && p.id !== portalOnCurrentCell.id
        );
        if (exitPortal) {
          const exitPos = { x: exitPortal.x, y: exitPortal.y };
          const isExitWallOrBound =
            exitPos.x < 0 || exitPos.x >= levelConfig.gridSize ||
            exitPos.y < 0 || exitPos.y >= levelConfig.gridSize ||
            wallSet.has(positionKey(exitPos));
          if (!isExitWallOrBound) {
            const blockIdxAtExit = blocks.findIndex(b => b.pos.x === exitPos.x && b.pos.y === exitPos.y);
            if (blockIdxAtExit !== -1) {
              const block = blocks[blockIdxAtExit];
              if (block) {
                const exitDir = dirToVector(exitPortal.dir);
                const blockNewPos = pushBlock(block.pos, exitDir, blocks);
                if (blockNewPos.x !== block.pos.x || blockNewPos.y !== block.pos.y) {
                  pushCount++;
                  blocks = blocks.map((b, idx) => idx === blockIdxAtExit ? { ...b, pos: blockNewPos } : b);
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
    if (nextPlayerPos.x < 0 || nextPlayerPos.x >= levelConfig.gridSize || nextPlayerPos.y < 0 || nextPlayerPos.y >= levelConfig.gridSize) {
      continue;
    }
    if (wallSet.has(positionKey(nextPlayerPos))) {
      continue;
    }

    const blockIdx = blocks.findIndex(b => b.pos.x === nextPlayerPos.x && b.pos.y === nextPlayerPos.y);
    if (blockIdx !== -1) {
      const block = blocks[blockIdx];
      if (!block) continue;
      const oldBlockPos = block.pos;
      const blockNewPos = pushBlock(oldBlockPos, dir, blocks);

      if (blockNewPos.x !== oldBlockPos.x || blockNewPos.y !== oldBlockPos.y) {
        pushCount++;
        blocks = blocks.map((b, idx) => idx === blockIdx ? { ...b, pos: blockNewPos } : b);
        player = nextPlayerPos;
      }
    } else {
      player = nextPlayerPos;
    }
  }

  return pushCount > 0 ? pushCount : Math.max(2, levelConfig.blocks.length * 2);
};

export const calculateParPushes = (levelConfig: LevelConfig): number => {
  if (levelConfig.par && levelConfig.par > 0) {
    return levelConfig.par;
  }
  return simulateSolutionPushes(levelConfig);
};

export const calculateStars = (pushCount: number, par: number): 1 | 2 | 3 => {
  if (pushCount <= 0) return 3;
  if (pushCount <= par) return 3;
  const twoStarLimit = Math.max(par + 2, Math.ceil(par * 1.4));
  if (pushCount <= twoStarLimit) return 2;
  return 1;
};

export const convertPuzzleToLevelConfig = (puzzle: any): LevelConfig => {
  const playerPos = puzzle.player || puzzle.startPos || { x: 1, y: 1 };
  const rawBlocks = puzzle.blocks || [];
  const rawTargets = puzzle.targets || puzzle.destinations || [];

  const formattedBlocks = rawBlocks.map((b: any) => {
    const x = b.x !== undefined ? b.x : b.pos?.x ?? 0;
    const y = b.y !== undefined ? b.y : b.pos?.y ?? 0;
    const color = b.color || b.type || 'red';
    return {
      id: b.id || `b_${Math.random()}`,
      pos: { x, y },
      type: colorToBlockType(color),
    };
  });

  const formattedTargets = rawTargets
    .filter((t: any) => {
      const color = t.color || t.type || '';
      return color !== 'gray' && color !== 'grey';
    })
    .map((t: any) => {
      const x = t.x !== undefined ? t.x : t.pos?.x ?? 0;
      const y = t.y !== undefined ? t.y : t.pos?.y ?? 0;
      const color = t.color || t.type || 'red';
      return {
        id: t.id || `t_${Math.random()}`,
        pos: { x, y },
        type: colorToBlockType(color),
      };
    });

  const config: LevelConfig = {
    name: puzzle.name,
    gridSize: Math.max(puzzle.width || 9, puzzle.height || 9),
    startPos: playerPos,
    walls: puzzle.walls || [],
    blocks: formattedBlocks,
    destinations: formattedTargets,
    portals: puzzle.portals || [],
    moves: puzzle.playerMoves || puzzle.solutionMoves || [],
    ...(puzzle.splashMovesCount !== undefined ? { splashMovesCount: puzzle.splashMovesCount } : {}),
  };
  config.par = calculateParPushes(config);
  return config;
};
