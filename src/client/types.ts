import { PortalDirection, PuzzlePortal } from '../shared/types';
export type { PortalDirection, PuzzlePortal };

export type GameDifficulty = 'tutorial' | 'daily' | 'easy' | 'medium' | 'hard';
export type BlockType = 'red-heart' | 'blue-diamond' | 'yellow-crescent' | 'purple-circle' | 'green-cross' | 'orange-square' | 'gray-neutral';
export type Position = { x: number; y: number };

export type BlockData = {
  pos: Position;
  type: BlockType;
  noTransition?: boolean;
};

export type DestinationData = {
  pos: Position;
  type: BlockType;
};

export type LevelConfig = {
  name?: string;
  author?: string;
  walls: Position[];
  blocks: BlockData[];
  destinations: DestinationData[];
  portals?: PuzzlePortal[];
  startPos: Position;
  gridSize: number;
  moves?: string[];
  par?: number;
  splashMovesCount?: number;
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
  portals?: PuzzlePortal[];
  playerMoves?: string[];
  splashMovesCount?: number;
};

