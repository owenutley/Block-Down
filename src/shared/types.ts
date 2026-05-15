/**
 * Puzzle difficulty levels
 */
export type PuzzleDifficulty = 'tutorial' | 'easy' | 'medium' | 'hard';

/**
 * Individual puzzle structure
 */
export type Puzzle = {
  id: string;
  difficulty: PuzzleDifficulty;
  blocks: number[][]; // 2D array representing the puzzle grid
  target: number; // Target score/moves to complete
  title: string;
  description?: string;
  createdAt: number; // Unix timestamp
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
