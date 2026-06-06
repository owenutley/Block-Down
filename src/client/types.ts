export type GameDifficulty = 'tutorial' | 'daily' | 'easy' | 'medium' | 'hard';
export type BlockType = 'red-heart' | 'blue-diamond' | 'yellow-crescent' | 'purple-circle' | 'green-cross' | 'orange-square';
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

