/**
 * Puzzle difficulty levels
 */
export type PuzzleDifficulty = 'tutorial' | 'daily' | 'easy' | 'medium' | 'hard' | 'splash';

export type Position = { x: number; y: number };

export type PuzzleBlock = {
  id: string;
  color: string;
  x: number;
  y: number;
};

export type PuzzleTarget = {
  id: string;
  color: string;
  x: number;
  y: number;
};

export type PortalDirection = 'Up' | 'Down' | 'Left' | 'Right';

export type PuzzlePortal = {
  id: string;
  color: string;
  x: number;
  y: number;
  dir: PortalDirection;
};

/**
 * Individual puzzle structure
 */
export type Puzzle = {
  id: string;
  name: string;
  difficulty: PuzzleDifficulty;
  width: number;
  height: number;
  player: Position;
  walls: Position[];
  blocks: PuzzleBlock[];
  targets: PuzzleTarget[];
  portals?: PuzzlePortal[];
  createdAt: number; // Unix timestamp
  playerMoves?: string[]; // Used for splash screen automated playback
  splashMovesCount?: number; // Used to customize the number of moves shown on the splash page
};

/**
 * Daily puzzle assignment
 */
export type DailyPuzzle = {
  date: string; // YYYY-MM-DD format
  puzzleId: string;
  difficulty: PuzzleDifficulty;
  assignedAt: number; // Unix timestamp
};

/**
 * Puzzle statistics
 */
export type PuzzleStats = {
  totalAttempts: number;
  totalCompletions: number;
  averageScore: number;
  bestScore: number;
};

/**
 * User puzzle progress
 */
export type UserPuzzleProgress = {
  puzzleId: string;
  attempts: number;
  completed: boolean;
  bestScore: number;
  lastAttemptedAt: number;
};
