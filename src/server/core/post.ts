import { redis, reddit } from '@devvit/web/server';
import {
  assignDailyPuzzle,
  getAllPuzzles,
  getDailyPuzzle,
  getPuzzle,
  getPuzzlesByDifficulty,
  initializeSamplePuzzles,
} from './puzzle';

/**
 * Redis key for tracking daily puzzle counter
 */
const DAILY_PUZZLE_COUNTER_KEY = 'daily-puzzle-counter';

/**
 * Get the current daily puzzle counter
 */
export const getDailyPuzzleCounter = async (): Promise<number> => {
  const count = await redis.get(DAILY_PUZZLE_COUNTER_KEY);
  return count ? parseInt(count, 10) : 0;
};

/**
 * Increment and return the daily puzzle counter
 */
const incrementDailyPuzzleCounter = async (): Promise<number> => {
  const current = await getDailyPuzzleCounter();
  const next = current + 1;
  await redis.set(DAILY_PUZZLE_COUNTER_KEY, String(next));
  return next;
};

const getTodayDate = (): string => {
  const date = new Date();
  return date.toISOString().split('T')[0] || '';
};

export const createPost = async () => {
  return await reddit.submitCustomPost({
    title: 'block-down',
  });
};

export const createDailyPost = async (puzzleId?: string, date?: string) => {
  const targetDate = date || getTodayDate();

  if (puzzleId) {
    const puzzle = await getPuzzle(puzzleId);
    if (!puzzle) {
      throw new Error(`Puzzle not found: ${puzzleId}`);
    }
    await assignDailyPuzzle(puzzleId, targetDate);
  }

  let daily = await getDailyPuzzle(targetDate);

  if (!daily) {
    let dailyPuzzles = await getPuzzlesByDifficulty('daily');
    let dateMarked = dailyPuzzles.find((p) => p.id === `daily-${targetDate}` || p.id.endsWith(`-${targetDate}`));
    let fallback = dateMarked || dailyPuzzles[0] || (await getAllPuzzles())[0];

    if (!fallback) {
      // Auto-initialize sample puzzles if database is completely empty
      await initializeSamplePuzzles();
      dailyPuzzles = await getPuzzlesByDifficulty('daily');
      dateMarked = dailyPuzzles.find((p) => p.id === `daily-${targetDate}` || p.id.endsWith(`-${targetDate}`));
      fallback = dateMarked || dailyPuzzles[0] || (await getAllPuzzles())[0];
    }

    if (!fallback) {
      throw new Error('No puzzle available in the database to assign as the daily puzzle.');
    }

    await assignDailyPuzzle(fallback.id, targetDate);
    daily = await getDailyPuzzle(targetDate);
  }

  if (!daily) {
    throw new Error('Failed to resolve a daily puzzle after assignment.');
  }

  // Get and increment the daily puzzle counter
  const dailyPuzzleNumber = await incrementDailyPuzzleCounter();

  const title = `Daily Puzzle #${dailyPuzzleNumber}`;
  const post = await reddit.submitCustomPost({ title });

  if (post?.id) {
    await reddit.approve(post.id);
    await redis.set(`post_puzzle:${post.id}`, daily.puzzleId);
    await redis.set(`post_number:${post.id}`, dailyPuzzleNumber.toString());
  }

  return post;
};
