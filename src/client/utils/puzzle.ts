import { BlockType, LevelConfig } from '../types';

export const colorToBlockType = (color: string): BlockType => {
  switch (color.toLowerCase()) {
    case 'red': return 'red-circle';
    case 'blue': return 'blue-square';
    case 'yellow': return 'yellow-triangle';
    case 'purple': return 'purple-star';
    case 'green': return 'green-leaf';
    case 'orange': return 'orange-block';
    default: return 'red-circle';
  }
};

export const convertPuzzleToLevelConfig = (puzzle: any): LevelConfig => {
  return {
    gridSize: Math.max(puzzle.width, puzzle.height),
    startPos: puzzle.player,
    walls: puzzle.walls || [],
    blocks: (puzzle.blocks || []).map((b: any) => ({
      pos: { x: b.x, y: b.y },
      type: colorToBlockType(b.color)
    })),
    destinations: (puzzle.targets || []).map((t: any) => ({
      pos: { x: t.x, y: t.y },
      type: colorToBlockType(t.color)
    })),
    moves: puzzle.playerMoves || []
  };
};
