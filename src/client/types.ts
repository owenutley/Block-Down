export type GameDifficulty = 'tutorial' | 'daily' | 'easy' | 'medium' | 'hard';
export type BlockType = 'red-circle' | 'blue-square' | 'yellow-triangle' | 'purple-star' | 'green-leaf' | 'orange-block';
export type Position = { x: number; y: number };

export interface BlockData {
  pos: Position;
  type: BlockType;
}

export interface DestinationData {
  pos: Position;
  type: BlockType;
}

export interface LevelConfig {
  walls: Position[];
  blocks: BlockData[];
  destinations: DestinationData[];
  startPos: Position;
  gridSize: number;
  moves?: string[];
}
