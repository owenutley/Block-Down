import { BlockType, LevelConfig, Position, PuzzleData, BlockData } from '../types';

export const colorToBlockType = (color: string): BlockType => {
  switch (color.toLowerCase()) {
    case 'red': return 'red-heart';
    case 'blue': return 'blue-diamond';
    case 'yellow': return 'yellow-crescent';
    case 'purple': return 'purple-circle';
    case 'green': return 'green-cross';
    case 'orange': return 'orange-square';
    default: return 'red-heart';
  }
};

const positionKey = (pos: Position) => `${pos.x},${pos.y}`;

export const simulateSolutionPushes = (levelConfig: LevelConfig): number => {
  if (!levelConfig.moves || levelConfig.moves.length === 0) {
    return Math.max(2, levelConfig.blocks.length * 2);
  }

  let player = { ...levelConfig.startPos };
  let blocks = levelConfig.blocks.map(b => ({ ...b, pos: { ...b.pos } }));
  const wallSet = new Set(levelConfig.walls.map(positionKey));
  let pushCount = 0;

  const pushBlock = (blockPos: Position, direction: Position, currentBlocks: BlockData[]): Position => {
    let currentPos = { ...blockPos };
    let nextPos = { x: currentPos.x + direction.x, y: currentPos.y + direction.y };

    while (
      nextPos.x >= 0 && nextPos.x < levelConfig.gridSize &&
      nextPos.y >= 0 && nextPos.y < levelConfig.gridSize &&
      !wallSet.has(positionKey(nextPos))
    ) {
      const blockAtNext = currentBlocks.some(b => b.pos.x === nextPos.x && b.pos.y === nextPos.y && (b.pos.x !== blockPos.x || b.pos.y !== blockPos.y));
      if (blockAtNext) {
        break;
      }
      currentPos = nextPos;
      nextPos = { x: currentPos.x + direction.x, y: currentPos.y + direction.y };
    }

    return currentPos;
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

export const convertPuzzleToLevelConfig = (puzzle: PuzzleData): LevelConfig => {
  const config: LevelConfig = {
    gridSize: Math.max(puzzle.width, puzzle.height),
    startPos: puzzle.player,
    walls: puzzle.walls || [],
    blocks: (puzzle.blocks || []).map((b) => ({
      pos: { x: b.x, y: b.y },
      type: colorToBlockType(b.color)
    })),
    destinations: (puzzle.targets || []).map((t) => ({
      pos: { x: t.x, y: t.y },
      type: colorToBlockType(t.color)
    })),
    moves: puzzle.playerMoves || []
  };
  config.par = calculateParPushes(config);
  return config;
};
