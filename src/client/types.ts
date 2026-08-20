export type GameDifficulty = 'tutorial' | 'daily' | 'easy' | 'medium' | 'hard';
export type BlockType = 'red-heart' | 'blue-diamond' | 'yellow-crescent' | 'purple-circle' | 'green-cross' | 'orange-square';
export type Position = { x: number; y: number };

export type BlockData = {
  pos: Position;
  type: BlockType;
};

export type DestinationData = {
  pos: Position;
  type: BlockType;
};

export type LevelConfig = {
  walls: Position[];
  blocks: BlockData[];
  destinations: DestinationData[];
  startPos: Position;
  gridSize: number;
  moves?: string[];
  par?: number;
};

export type PuzzleData = {
  id: string;
  name: string;
  difficulty: string;
  width: number;
  height: number;
  player: Position;
  walls: Position[];
  blocks: { x: number; y: number; color: string }[];
  targets: { x: number; y: number; color: string }[];
  playerMoves?: string[];
};

