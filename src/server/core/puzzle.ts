import { redis, reddit } from '@devvit/web/server';
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
  // Active puzzle by type (splash, tutorial)
  ACTIVE_PUZZLE: (type: string) => `active:${type}`,
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
  const difficulties: PuzzleDifficulty[] = ['tutorial', 'daily', 'easy', 'medium', 'hard', 'splash'];
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
    times?: number[];
    moves?: number[];
  }
): Promise<void> => {
  const key = KEYS.PUZZLE_STATS(puzzleId);
  const existing = await getPuzzleStats(puzzleId) || {
    totalAttempts: 0,
    totalCompletions: 0,
    averageScore: 0,
    bestScore: 0,
    bestTime: 0,
    bestMoves: 0,
  };

  const updated = {
    ...existing,
    totalAttempts: (existing.totalAttempts || 0) + (stats.attempts || 0),
    totalCompletions: (existing.totalCompletions || 0) + (stats.completions || 0),
  };

  if (stats.scores && stats.scores.length > 0) {
    const allScores = [...(existing.scores || []), ...stats.scores];
    updated.scores = allScores;
    updated.averageScore = allScores.reduce((a: number, b: number) => a + b, 0) / allScores.length;
    const validScores = allScores.filter(s => s > 0);
    updated.bestScore = validScores.length > 0 ? Math.min(...validScores) : 0;
  }

  if (stats.times && stats.times.length > 0) {
    const allTimes = [...(existing.times || []), ...stats.times];
    updated.times = allTimes;
    const validTimes = allTimes.filter(t => t > 0);
    updated.bestTime = validTimes.length > 0 ? Math.min(...validTimes) : 0;
  }

  if (stats.moves && stats.moves.length > 0) {
    const allMoves = [...(existing.moves || []), ...stats.moves];
    updated.moves = allMoves;
    const validMoves = allMoves.filter(m => m > 0);
    updated.bestMoves = validMoves.length > 0 ? Math.min(...validMoves) : 0;
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
  const difficulties: PuzzleDifficulty[] = ['tutorial', 'daily', 'easy', 'medium', 'hard', 'splash'];
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
    {
      id: 'tutorial-1',
      name: 'Learn the Basics',
      difficulty: 'tutorial',
      width: 5,
      height: 5,
      player: { x: 1, y: 1 },
      walls: [
        { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 },
        { x: 0, y: 4 }, { x: 1, y: 4 }, { x: 2, y: 4 }, { x: 3, y: 4 }, { x: 4, y: 4 },
        { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 0, y: 3 },
        { x: 4, y: 1 }, { x: 4, y: 2 }, { x: 4, y: 3 }
      ],
      blocks: [
        { id: 'b1', color: 'red', x: 2, y: 2 }
      ],
      targets: [
        { id: 't1', color: 'red', x: 3, y: 2 }
      ],
      createdAt: Date.now(),
      playerMoves: ['right', 'down', 'left', 'up', 'right', 'down', 'left', 'up', 'right', 'down', 'left', 'up'],
    }
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
  const difficulties: PuzzleDifficulty[] = ['tutorial', 'daily', 'easy', 'medium', 'hard', 'splash'];
  for (const difficulty of difficulties) {
    const difficultyKey = KEYS.PUZZLES_BY_DIFFICULTY(difficulty);
    const ids = await getArray(difficultyKey);
    for (const id of ids) {
      await redis.del(KEYS.PUZZLE(id));
      await redis.del(KEYS.PUZZLE_STATS(id));
    }
    await redis.del(difficultyKey);
  }

  // Clear specific active ones
  await redis.del(KEYS.ACTIVE_PUZZLE('splash'));
  await redis.del(KEYS.ACTIVE_PUZZLE('tutorial'));

  // Clear upcoming and past queues
  await redis.del(KEYS.UPCOMING_PUZZLES);
  await redis.del(KEYS.PAST_PUZZLES);
  // Clear current daily
  await redis.del(KEYS.CURRENT_DAILY);
};

/**
 * Set an active puzzle for a specific type
 */
export const setActivePuzzle = async (type: 'splash' | 'tutorial', puzzleId: string): Promise<void> => {
  const puzzle = await getPuzzle(puzzleId);
  if (!puzzle) throw new Error(`Puzzle not found: ${puzzleId}`);
  await redis.set(KEYS.ACTIVE_PUZZLE(type), puzzleId);
};

/**
 * Get the active puzzle for a specific type
 */
export const getActivePuzzle = async (type: 'splash' | 'tutorial'): Promise<Puzzle | null> => {
  const puzzleId = await redis.get(KEYS.ACTIVE_PUZZLE(type));
  if (!puzzleId) {
    // Fallback: get the first puzzle of this difficulty
    const puzzles = await getPuzzlesByDifficulty(type);
    const firstPuzzle = puzzles[0];
    return firstPuzzle || null;
  }
  return await getPuzzle(puzzleId);
};

export type LeaderboardEntry = {
  username: string;
  score: number;
  solveTime: number;
  moveCount: number;
  timestamp: number;
};

/**
 * Get leaderboard entries for a puzzle, pruning any deleted users on-demand
 */
export const getLeaderboard = async (puzzleId: string): Promise<LeaderboardEntry[]> => {
  const data = await redis.get(`leaderboard:${puzzleId}`);
  if (!data) return [];
  
  const entries: LeaderboardEntry[] = JSON.parse(data);
  let hasChanges = false;

  const validatedEntries = await Promise.all(
    entries.map(async (entry) => {
      try {
        const user = await reddit.getUserByUsername(entry.username);
        if (user) {
          return entry;
        }
      } catch (err) {
        console.warn(`Failed to fetch user ${entry.username}, assuming deleted:`, err);
      }
      hasChanges = true;
      return null;
    })
  );

  const prunedEntries = validatedEntries.filter((e): e is LeaderboardEntry => e !== null);
  
  if (hasChanges) {
    await redis.set(`leaderboard:${puzzleId}`, JSON.stringify(prunedEntries));
  }

  return prunedEntries;
};

/**
 * Update leaderboard with a user's completion stats if it qualifies as a record
 */
export const updateLeaderboard = async (
  puzzleId: string,
  entry: { username: string; score: number; solveTime: number; moveCount: number }
): Promise<void> => {
  const leaderboard = await getLeaderboard(puzzleId);
  const existingIdx = leaderboard.findIndex(e => e.username === entry.username);
  
  const newEntry: LeaderboardEntry = {
    ...entry,
    timestamp: Date.now(),
  };

  if (existingIdx !== -1) {
    const existing = leaderboard[existingIdx];
    if (existing) {
      // Determine if new score is better (lower pushes/moves/time is better)
      const isBetter = 
        newEntry.score < existing.score ||
        (newEntry.score === existing.score && newEntry.moveCount < existing.moveCount) ||
        (newEntry.score === existing.score && newEntry.moveCount === existing.moveCount && newEntry.solveTime < existing.solveTime);
      
      if (isBetter) {
        leaderboard[existingIdx] = newEntry;
      }
    }
  } else {
    leaderboard.push(newEntry);
  }

  // Sort: pushes asc, moves asc, time asc
  leaderboard.sort((a, b) => {
    if (a.score !== b.score) return a.score - b.score;
    if (a.moveCount !== b.moveCount) return a.moveCount - b.moveCount;
    return a.solveTime - b.solveTime;
  });

  // Limit to top 10
  const top10 = leaderboard.slice(0, 10);
  await redis.set(`leaderboard:${puzzleId}`, JSON.stringify(top10));
};
