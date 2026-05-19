import { redis } from '@devvit/web/server';

/**
 * Key prefix for user progress
 */
const PROGRESS_KEY = (username: string) => `user_progress:${username}`;

/**
 * Get the completed puzzle IDs for a specific user.
 * Returns an array of puzzle IDs.
 */
export const getCompletedPuzzles = async (username: string): Promise<string[]> => {
  if (!username) return [];
  const data = await redis.get(PROGRESS_KEY(username));
  return data ? JSON.parse(data) : [];
};

/**
 * Mark a specific puzzle as completed for a user.
 */
export const markPuzzleCompleted = async (username: string, puzzleId: string): Promise<string[]> => {
  if (!username) return [];
  
  const completed = await getCompletedPuzzles(username);
  
  if (!completed.includes(puzzleId)) {
    completed.push(puzzleId);
    await redis.set(PROGRESS_KEY(username), JSON.stringify(completed));
  }
  
  return completed;
};

/**
 * Clear user progress (used for testing or factory reset)
 */
export const clearUserProgress = async (username: string): Promise<void> => {
  if (!username) return;
  await redis.del(PROGRESS_KEY(username));
};
