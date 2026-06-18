import { redis, reddit, context } from '@devvit/web/server';
import {
  assignDailyPuzzle,
  getDailyPuzzle,
  getPuzzle,
  getPuzzlesByDifficulty,
  getProperDateFromPuzzleId,
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
  let targetDate = date;

  if (puzzleId && !targetDate) {
    targetDate = getProperDateFromPuzzleId(puzzleId) || undefined;
  }

  if (!targetDate) {
    targetDate = getTodayDate();
  }

  if (puzzleId) {
    const puzzle = await getPuzzle(puzzleId);
    if (!puzzle) {
      throw new Error(`Puzzle not found: ${puzzleId}`);
    }
    await assignDailyPuzzle(puzzleId, targetDate);
  }

  let daily = await getDailyPuzzle(targetDate);

  if (!daily) {
    const dailyPuzzles = await getPuzzlesByDifficulty('daily');
    const fallback = dailyPuzzles.find((p) => p.id === `daily-${targetDate}` || p.id.endsWith(`-${targetDate}`));

    if (fallback) {
      await assignDailyPuzzle(fallback.id, targetDate);
      daily = await getDailyPuzzle(targetDate);
    }
  }

  // Get and increment the daily puzzle counter
  const dailyPuzzleNumber = await incrementDailyPuzzleCounter();

  const title = `Daily Puzzle #${dailyPuzzleNumber}`;
  const post = await reddit.submitCustomPost({ title });

  if (post?.id) {
    await reddit.approve(post.id);
    if (daily) {
      await redis.set(`post_puzzle:${post.id}`, daily.puzzleId);
    }
    await redis.set(`post_number:${post.id}`, dailyPuzzleNumber.toString());
    await redis.set(`date_post:${targetDate}`, post.id);
    await redis.set(`number_post:${dailyPuzzleNumber}`, post.id);
  }

  return post;
};

/**
 * Rebuild post mappings dynamically for up to 100 recent daily posts
 */
export const syncDailyPostsWithPuzzles = async (): Promise<{ success: boolean; syncedCount: number }> => {
  const { subredditName } = context;
  if (!subredditName) {
    throw new Error('No subreddit context');
  }

  const postsListing = await reddit.getNewPosts({
    subredditName,
    limit: 100,
  });
  const posts = await postsListing.all();

  let syncedCount = 0;

  for (const post of posts) {
    if (!post.title) continue;

    const match = post.title.match(/Daily Puzzle #(\d+)/i);
    if (!match) continue;

    const numStr = match[1];
    if (!numStr) continue;

    const dateObj = typeof post.createdAt === 'object' ? post.createdAt : new Date(post.createdAt);
    const postDate = dateObj.toISOString().split('T')[0];
    if (!postDate) continue;

    // Always record the general mapping indexes
    await redis.set(`date_post:${postDate}`, post.id);
    await redis.set(`post_number:${post.id}`, numStr);
    await redis.set(`number_post:${numStr}`, post.id);

    const puzzleId = `daily-${postDate}`;
    const puzzle = await getPuzzle(puzzleId);
    if (puzzle) {
      await redis.set(`post_puzzle:${post.id}`, puzzleId);
      await assignDailyPuzzle(puzzleId, postDate);
    }
    syncedCount++;
  }

  return { success: true, syncedCount };
};
