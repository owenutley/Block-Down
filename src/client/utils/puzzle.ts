import { BlockType, LevelConfig, PuzzleData } from '../types';

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

export const convertPuzzleToLevelConfig = (puzzle: PuzzleData): LevelConfig => {
  return {
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
};
