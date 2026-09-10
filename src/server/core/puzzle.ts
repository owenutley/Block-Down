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
  let data = await redis.get(KEYS.PUZZLE(id));
  if (!data && id === 'tutorial-1') {
    await initializeSamplePuzzles();
    data = await redis.get(KEYS.PUZZLE(id));
  }
  return data ? JSON.parse(data) : null;
};

/**
 * Get all puzzles by difficulty
 */
export const getPuzzlesByDifficulty = async (
  difficulty: PuzzleDifficulty,
  limit?: number
): Promise<Puzzle[]> => {
  const ids = await getArray(KEYS.PUZZLES_BY_DIFFICULTY(difficulty));
  const slicedIds = limit !== undefined ? ids.slice(0, limit) : ids;
  const puzzles = await Promise.all(
    slicedIds.map((id: string) => getPuzzle(id))
  );
  return puzzles.filter((p): p is Puzzle => p !== null);
};

/**
 * Get all puzzle IDs by difficulty
 */
export const getPuzzleIdsByDifficulty = async (
  difficulty: PuzzleDifficulty
): Promise<string[]> => {
  return await getArray(KEYS.PUZZLES_BY_DIFFICULTY(difficulty));
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
 * Helper: Extract the proper date from a puzzle ID if it starts with 'daily-YYYY-MM-DD'
 */
export const getProperDateFromPuzzleId = (puzzleId: string): string | null => {
  if (puzzleId.startsWith('daily-')) {
    const dateStr = puzzleId.replace('daily-', '');
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return dateStr;
    }
  }
  return null;
};

/**
 * Get the next available date starting from today that doesn't have a daily puzzle
 */
export const getNextAvailableDailyDate = async (): Promise<string> => {
  const date = new Date();
  while (true) {
    const dateStr = date.toISOString().split('T')[0] || '';
    const dailyAssigned = await redis.get(KEYS.DAILY_PUZZLE(dateStr));
    const puzzleExists = await redis.get(KEYS.PUZZLE(`daily-${dateStr}`));
    if (!dailyAssigned && !puzzleExists) {
      return dateStr;
    }
    date.setDate(date.getDate() + 1);
  }
};

/**
 * Assign a puzzle as the daily puzzle for a given date
 */
export const assignDailyPuzzle = async (
  puzzleId: string,
  date?: string
): Promise<DailyPuzzle> => {
  const puzzle = await getPuzzle(puzzleId);
  if (!puzzle) {
    throw new Error(`Puzzle not found: ${puzzleId}`);
  }

  const properDate = getProperDateFromPuzzleId(puzzleId) || date || getTodayDate();

  const dailyPuzzle: DailyPuzzle = {
    date: properDate,
    puzzleId,
    difficulty: puzzle.difficulty,
    assignedAt: Date.now(),
  };

  const key = KEYS.DAILY_PUZZLE(properDate);
  await redis.set(key, JSON.stringify(dailyPuzzle));

  // If it's today, also update current daily
  if (properDate === getTodayDate()) {
    await redis.set(KEYS.CURRENT_DAILY, JSON.stringify(dailyPuzzle));
  }

  // Auto-update the post mapping if a post already exists for this date
  const postId = await redis.get(`date_post:${properDate}`);
  if (postId) {
    await redis.set(`post_puzzle:${postId}`, puzzleId);
  }

  return dailyPuzzle;
};

/**
 * Get today's daily puzzle
 */
export const getCurrentDailyPuzzle = async (): Promise<(DailyPuzzle & { puzzle: Puzzle }) | null> => {
  const today = getTodayDate();
  const dailyData = await redis.get(KEYS.DAILY_PUZZLE(today));
  if (dailyData) {
    const daily = JSON.parse(dailyData) as DailyPuzzle;
    const puzzle = await getPuzzle(daily.puzzleId);
    if (puzzle) {
      return { ...daily, puzzle };
    }
  }

  const legacyData = await redis.get(KEYS.CURRENT_DAILY);
  if (!legacyData) return null;

  const daily = JSON.parse(legacyData) as DailyPuzzle;
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
 * Helper: Resolve all known key aliases for a puzzle ID (canonical ID, daily key, post ID)
 */
export const getPuzzleAliases = async (puzzleId: string): Promise<string[]> => {
  const aliases = new Set<string>();
  if (!puzzleId) return [];

  aliases.add(puzzleId);

  // 1. If puzzleId is a postId, check post_puzzle mapping
  if (puzzleId.startsWith('t3_') || puzzleId.match(/^[a-z0-9_]{5,40}$/i)) {
    const mapped = await redis.get(`post_puzzle:${puzzleId}`);
    if (mapped) aliases.add(mapped);
  }

  // 2. If puzzleId starts with 'daily-'
  const properDate = getProperDateFromPuzzleId(puzzleId);
  if (properDate) {
    const dailyData = await redis.get(KEYS.DAILY_PUZZLE(properDate));
    if (dailyData) {
      try {
        const parsed = JSON.parse(dailyData);
        if (parsed.puzzleId) aliases.add(parsed.puzzleId);
      } catch (e) {}
    }
    const postIdForDate = await redis.get(`date_post:${properDate}`);
    if (postIdForDate) aliases.add(postIdForDate);
  }

  // 3. Check if puzzle exists by ID
  const puzzle = await getPuzzle(puzzleId);
  if (puzzle) {
    aliases.add(puzzle.id);
    const puzzleDate = getProperDateFromPuzzleId(puzzle.id);
    if (puzzleDate) {
      aliases.add(`daily-${puzzleDate}`);
      const postIdForDate = await redis.get(`date_post:${puzzleDate}`);
      if (postIdForDate) aliases.add(postIdForDate);
    }
  }

  return Array.from(aliases);
};

/**
 * Get puzzle statistics
 */
export const getPuzzleStats = async (puzzleId: string) => {
  const data = await redis.get(KEYS.PUZZLE_STATS(puzzleId));
  let stats = data ? JSON.parse(data) : null;

  if (!stats) {
    const aliases = await getPuzzleAliases(puzzleId);
    for (const alias of aliases) {
      if (alias === puzzleId) continue;
      const aliasData = await redis.get(KEYS.PUZZLE_STATS(alias));
      if (aliasData) {
        try {
          stats = JSON.parse(aliasData);
          if (stats) break;
        } catch (e) {}
      }
    }
  }

  try {
    const leaderboard = await getLeaderboard(puzzleId);
    if (leaderboard && leaderboard.length > 0) {
      if (!stats) {
        stats = {
          totalAttempts: leaderboard.length,
          totalCompletions: leaderboard.length,
          averageScore: Math.round(leaderboard.reduce((acc, e) => acc + e.score, 0) / leaderboard.length),
          bestScore: Math.min(...leaderboard.map((e) => e.score)),
        };
      } else if ((stats.totalCompletions || 0) < leaderboard.length) {
        stats.totalCompletions = leaderboard.length;
        stats.totalAttempts = Math.max(stats.totalAttempts || 0, leaderboard.length);
      }
    }
  } catch (err) {
    // Ignore leaderboard sync fallback error
  }

  return stats;
};

/**
 * Get raw puzzle statistics directly from Redis (without fallback leaderboard calculations)
 */
export const getRawPuzzleStats = async (puzzleId: string) => {
  const data = await redis.get(KEYS.PUZZLE_STATS(puzzleId));
  let stats = data ? JSON.parse(data) : null;

  if (!stats) {
    const aliases = await getPuzzleAliases(puzzleId);
    for (const alias of aliases) {
      if (alias === puzzleId) continue;
      const aliasData = await redis.get(KEYS.PUZZLE_STATS(alias));
      if (aliasData) {
        try {
          stats = JSON.parse(aliasData);
          if (stats) break;
        } catch (e) {}
      }
    }
  }

  return stats;
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
  const aliases = await getPuzzleAliases(puzzleId);
  if (!aliases.includes(puzzleId)) {
    aliases.push(puzzleId);
  }

  const existing = (await getRawPuzzleStats(puzzleId)) || {
    totalAttempts: 0,
    totalCompletions: 0,
    averageScore: 0,
    bestScore: 0,
    bestTime: 0,
    bestMoves: 0,
  };

  const updated = {
    ...existing,
    totalAttempts: Math.max((existing.totalAttempts || 0) + (stats.attempts || 0), (existing.totalCompletions || 0) + (stats.completions || 0)),
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

  const updatedJson = JSON.stringify(updated);
  for (const alias of aliases) {
    await redis.set(KEYS.PUZZLE_STATS(alias), updatedJson);
  }
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
      width: 9,
      height: 9,
      player: { x: 4, y: 4 },
      walls: [],
      blocks: [
        {
          id: 'b_1781284146022_2fqg',
          color: 'red',
          x: 2,
          y: 2,
        },
        {
          id: 'b_1781284149635_th0d',
          color: 'blue',
          x: 6,
          y: 6,
        },
        {
          id: 'b_1781284151869_xr3j',
          color: 'green',
          x: 3,
          y: 5,
        },
      ],
      targets: [
        {
          id: 't_1781284157018_mlm3',
          color: 'red',
          x: 0,
          y: 2,
        },
        {
          id: 't_1781284158827_bj3s',
          color: 'green',
          x: 3,
          y: 8,
        },
        {
          id: 't_1781284160746_acal',
          color: 'blue',
          x: 8,
          y: 6,
        },
      ],
      createdAt: Date.now(),
      playerMoves: [
        'Up',
        'Up',
        'Left',
        'Left',
        'Right',
        'Down',
        'Down',
        'Down',
        'Down',
        'Right',
        'Right',
        'Right',
      ],
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
 * Get leaderboard entries for a puzzle
 */
export const getLeaderboard = async (puzzleId: string): Promise<LeaderboardEntry[]> => {
  const data = await redis.get(`leaderboard:${puzzleId}`);
  let entries: LeaderboardEntry[] = [];
  if (data) {
    try {
      entries = JSON.parse(data);
    } catch (err) {
      console.error(`Failed to parse leaderboard data for ${puzzleId}:`, err);
    }
  }

  // Fallback: If no entries directly on puzzleId, check aliases
  if (entries.length === 0) {
    const aliases = await getPuzzleAliases(puzzleId);
    for (const alias of aliases) {
      if (alias === puzzleId) continue;
      const aliasData = await redis.get(`leaderboard:${alias}`);
      if (aliasData) {
        try {
          const aliasEntries: LeaderboardEntry[] = JSON.parse(aliasData);
          if (aliasEntries.length > 0) {
            entries = aliasEntries;
            // Sync to requested puzzleId so subsequent calls hit cache directly
            await redis.set(`leaderboard:${puzzleId}`, JSON.stringify(aliasEntries));
            break;
          }
        } catch (e) {}
      }
    }
  }

  return entries;
};

/**
 * Update leaderboard with a user's completion stats if it qualifies as a record
 */
export const updateLeaderboard = async (
  puzzleId: string,
  entry: { username: string; score: number; solveTime: number; moveCount: number }
): Promise<void> => {
  const leaderboard = await getLeaderboard(puzzleId);
  const existingIdx = leaderboard.findIndex(
    e => e.username.toLowerCase() === entry.username.toLowerCase()
  );
  
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
