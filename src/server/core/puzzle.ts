import { redis } from '@devvit/web/server';
import { Puzzle, DailyPuzzle, PuzzleDifficulty } from '../../shared/types';

/**
 * Redis key patterns for puzzle storage
 */
const KEYS = {
  // Puzzle storage by ID
  PUZZLE: (id: string) => `puzzle:${id}`,
  // All puzzle IDs by difficulty (stored as JSON array)
  PUZZLES_BY_DIFFICULTY: (difficulty: PuzzleDifficulty) => `puzzles:${difficulty}`,
  // Daily puzzle assignment
  DAILY_PUZZLE: (date: string) => `daily:${date}`,
  // Current daily puzzle (today)
  CURRENT_DAILY: 'current:daily',
  // Upcoming puzzles queue (stored as JSON array)
  UPCOMING_PUZZLES: 'upcoming:puzzles',
  // Past puzzles archive (stored as JSON array)
  PAST_PUZZLES: 'past:puzzles',
  // Puzzle statistics
  PUZZLE_STATS: (id: string) => `stats:${id}`,
};

/**
 * Get today's date in YYYY-MM-DD format
 */
const getTodayDate = (): string => {
  const date = new Date();
  return date.toISOString().split('T')[0] || '';
};

/**
 * Helper: Get array from Redis (stored as JSON)
 */
const getArray = async (key: string): Promise<string[]> => {
  const data = await redis.get(key);
  return data ? JSON.parse(data) : [];
};

/**
 * Helper: Save array to Redis (as JSON)
 */
const setArray = async (key: string, items: string[]): Promise<void> => {
  await redis.set(key, JSON.stringify(items));
};

/**
 * Store a puzzle in the database
 */
export const createPuzzle = async (puzzle: Puzzle): Promise<void> => {
  const key = KEYS.PUZZLE(puzzle.id);
  const difficultyKey = KEYS.PUZZLES_BY_DIFFICULTY(puzzle.difficulty);

  // Store puzzle data
  await redis.set(key, JSON.stringify(puzzle));

  // Add to difficulty index
  const difficultyPuzzles = await getArray(difficultyKey);
  if (!difficultyPuzzles.includes(puzzle.id)) {
    difficultyPuzzles.push(puzzle.id);
    await setArray(difficultyKey, difficultyPuzzles);
  }
};

/**
 * Get a puzzle by ID
 */
export const getPuzzle = async (id: string): Promise<Puzzle | null> => {
  const data = await redis.get(KEYS.PUZZLE(id));
  return data ? JSON.parse(data) : null;
};

/**
 * Get all puzzles by difficulty
 */
export const getPuzzlesByDifficulty = async (
  difficulty: PuzzleDifficulty
): Promise<Puzzle[]> => {
  const ids = await getArray(KEYS.PUZZLES_BY_DIFFICULTY(difficulty));
  const puzzles = await Promise.all(
    ids.map((id: string) => getPuzzle(id))
  );
  return puzzles.filter((p): p is Puzzle => p !== null);
};

/**
 * Get all puzzles across all difficulties
 */
export const getAllPuzzles = async (): Promise<Puzzle[]> => {
  const difficulties: PuzzleDifficulty[] = ['tutorial', 'easy', 'medium', 'hard'];
  const allPuzzles = await Promise.all(
    difficulties.map((d) => getPuzzlesByDifficulty(d))
  );
  return allPuzzles.flat();
};

/**
 * Assign a puzzle as the daily puzzle for a given date
 */
export const assignDailyPuzzle = async (
  puzzleId: string,
  date: string = getTodayDate()
): Promise<DailyPuzzle> => {
  const puzzle = await getPuzzle(puzzleId);
  if (!puzzle) {
    throw new Error(`Puzzle not found: ${puzzleId}`);
  }

  const dailyPuzzle: DailyPuzzle = {
    date,
    puzzleId,
    difficulty: puzzle.difficulty,
    assignedAt: Date.now(),
  };

  const key = KEYS.DAILY_PUZZLE(date);
  await redis.set(key, JSON.stringify(dailyPuzzle));

  // If it's today, also update current daily
  if (date === getTodayDate()) {
    await redis.set(KEYS.CURRENT_DAILY, JSON.stringify(dailyPuzzle));
  }

  return dailyPuzzle;
};

/**
 * Get today's daily puzzle
 */
export const getCurrentDailyPuzzle = async (): Promise<(DailyPuzzle & { puzzle: Puzzle }) | null> => {
  const dailyData = await redis.get(KEYS.CURRENT_DAILY);
  if (!dailyData) return null;

  const daily = JSON.parse(dailyData) as DailyPuzzle;
  const puzzle = await getPuzzle(daily.puzzleId);

  if (!puzzle) return null;

  return { ...daily, puzzle };
};

/**
 * Get daily puzzle for a specific date
 */
export const getDailyPuzzle = async (
  date: string
): Promise<(DailyPuzzle & { puzzle: Puzzle }) | null> => {
  const dailyData = await redis.get(KEYS.DAILY_PUZZLE(date));
  if (!dailyData) return null;

  const daily = JSON.parse(dailyData) as DailyPuzzle;
  const puzzle = await getPuzzle(daily.puzzleId);

  if (!puzzle) return null;

  return { ...daily, puzzle };
};

/**
 * Add a puzzle to the upcoming queue
 */
export const addUpcomingPuzzle = async (puzzleId: string): Promise<void> => {
  const puzzles = await getArray(KEYS.UPCOMING_PUZZLES);
  if (!puzzles.includes(puzzleId)) {
    puzzles.push(puzzleId);
    await setArray(KEYS.UPCOMING_PUZZLES, puzzles);
  }
};

/**
 * Get next puzzle from upcoming queue
 */
export const getNextUpcomingPuzzle = async (): Promise<Puzzle | null> => {
  const puzzles = await getArray(KEYS.UPCOMING_PUZZLES);
  if (puzzles.length === 0) return null;
  const nextId = puzzles[0];
  if (!nextId) return null;
  return getPuzzle(nextId);
};

/**
 * Get all upcoming puzzles
 */
export const getUpcomingPuzzles = async (limit: number = 10): Promise<Puzzle[]> => {
  const ids = await getArray(KEYS.UPCOMING_PUZZLES);
  const limitedIds = ids.slice(0, Math.min(limit, 50));
  const puzzles = await Promise.all(
    limitedIds.map((id: string) => getPuzzle(id))
  );
  return puzzles.filter((p): p is Puzzle => p !== null);
};

/**
 * Remove a puzzle from upcoming and add to past
 */
export const archivePuzzle = async (puzzleId: string): Promise<void> => {
  // Remove from upcoming
  const upcoming = await getArray(KEYS.UPCOMING_PUZZLES);
  const filteredUpcoming = upcoming.filter((id: string) => id !== puzzleId);
  await setArray(KEYS.UPCOMING_PUZZLES, filteredUpcoming);

  // Add to past
  const past = await getArray(KEYS.PAST_PUZZLES);
  if (!past.includes(puzzleId)) {
    past.push(puzzleId);
    await setArray(KEYS.PAST_PUZZLES, past);
  }
};

/**
 * Get past puzzles
 */
export const getPastPuzzles = async (limit: number = 30): Promise<Puzzle[]> => {
  const ids = await getArray(KEYS.PAST_PUZZLES);
  // Get the last 'limit' items
  const limitedIds = ids.slice(Math.max(0, ids.length - limit));
  const puzzles = await Promise.all(
    limitedIds.map((id: string) => getPuzzle(id))
  );
  return puzzles.filter((p): p is Puzzle => p !== null);
};

/**
 * Get puzzle statistics
 */
export const getPuzzleStats = async (puzzleId: string) => {
  const data = await redis.get(KEYS.PUZZLE_STATS(puzzleId));
  return data ? JSON.parse(data) : null;
};

/**
 * Update puzzle statistics
 */
export const updatePuzzleStats = async (
  puzzleId: string,
  stats: {
    attempts?: number;
    completions?: number;
    scores?: number[];
  }
): Promise<void> => {
  const key = KEYS.PUZZLE_STATS(puzzleId);
  const existing = await getPuzzleStats(puzzleId) || {
    totalAttempts: 0,
    totalCompletions: 0,
    averageScore: 0,
    bestScore: 0,
  };

  const updated = {
    ...existing,
    totalAttempts: (existing.totalAttempts || 0) + (stats.attempts || 0),
    totalCompletions: (existing.totalCompletions || 0) + (stats.completions || 0),
  };

  if (stats.scores && stats.scores.length > 0) {
    const allScores = [...(existing.scores || []), ...stats.scores];
    updated.averageScore = allScores.reduce((a: number, b: number) => a + b, 0) / allScores.length;
    updated.bestScore = Math.max(...allScores, existing.bestScore || 0);
  }

  await redis.set(key, JSON.stringify(updated));
};

/**
 * Delete a puzzle (use with caution)
 */
export const deletePuzzle = async (id: string): Promise<void> => {
  const puzzle = await getPuzzle(id);
  
  if (puzzle) {
    await redis.del(KEYS.PUZZLE(id));
  }

  // Remove from difficulty index (check all difficulties in case of orphaned IDs)
  const difficulties: PuzzleDifficulty[] = ['tutorial', 'easy', 'medium', 'hard'];
  for (const difficulty of difficulties) {
    const difficultyKey = KEYS.PUZZLES_BY_DIFFICULTY(difficulty);
    const difficultyPuzzles = await getArray(difficultyKey);
    if (difficultyPuzzles.includes(id)) {
      const filtered = difficultyPuzzles.filter((pid: string) => pid !== id);
      await setArray(difficultyKey, filtered);
    }
  }
};

/**
 * Initialize sample puzzles (useful for development/testing)
 */
export const initializeSamplePuzzles = async (): Promise<void> => {
  const samplePuzzles: Puzzle[] = [
    // Tutorial puzzles
    {
      id: 'tutorial-1',
      difficulty: 'tutorial',
      blocks: [[1, 1], [1, 1]],
      target: 10,
      title: 'Learn the Basics',
      description: 'Match 4 blocks to clear them',
      createdAt: Date.now(),
    },
    {
      id: 'tutorial-2',
      difficulty: 'tutorial',
      blocks: [[2, 2, 2], [2, 2, 2], [2, 2, 2]],
      target: 30,
      title: 'Cascades',
      description: 'Watch blocks fall and create cascades',
      createdAt: Date.now(),
    },
    // Easy puzzles
    {
      id: 'easy-1',
      difficulty: 'easy',
      blocks: [[1, 2, 3], [1, 2, 3], [1, 2, 3]],
      target: 50,
      title: 'Easy Start',
      createdAt: Date.now(),
    },
    // Medium puzzles
    {
      id: 'medium-1',
      difficulty: 'medium',
      blocks: [[1, 2, 1, 2], [2, 1, 2, 1], [1, 2, 1, 2], [2, 1, 2, 1]],
      target: 100,
      title: 'Medium Challenge',
      createdAt: Date.now(),
    },
    // Hard puzzles
    {
      id: 'hard-1',
      difficulty: 'hard',
      blocks: [[3, 3, 1, 1], [3, 3, 1, 1], [2, 2, 4, 4], [2, 2, 4, 4]],
      target: 200,
      title: 'Hard Mode',
      createdAt: Date.now(),
    },
  ];

  for (const puzzle of samplePuzzles) {
    await createPuzzle(puzzle);
  }
};

/**
 * Clear all puzzles and reset the database (Factory Reset)
 */
export const clearAllPuzzles = async (): Promise<void> => {
  // Clear all difficulty arrays and individual puzzles
  const difficulties: PuzzleDifficulty[] = ['tutorial', 'easy', 'medium', 'hard'];
  for (const difficulty of difficulties) {
    const difficultyKey = KEYS.PUZZLES_BY_DIFFICULTY(difficulty);
    const ids = await getArray(difficultyKey);
    for (const id of ids) {
      await redis.del(KEYS.PUZZLE(id));
      await redis.del(KEYS.PUZZLE_STATS(id));
    }
    await redis.del(difficultyKey);
  }

  // Clear upcoming and past queues
  await redis.del(KEYS.UPCOMING_PUZZLES);
  await redis.del(KEYS.PAST_PUZZLES);

  // Clear current daily
  await redis.del(KEYS.CURRENT_DAILY);
};
