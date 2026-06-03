import { redis } from '@devvit/web/server';
import { getCurrentDailyPuzzle } from './puzzle';

/**
 * Key prefixes for user progress, attempts, and currency
 */
const PROGRESS_KEY = (username: string) => `user_progress:${username}`;
const ATTEMPTS_KEY = (username: string) => `user_attempts:${username}`;
const CURRENCY_KEY = (username: string) => `user_currency:${username}`;

/**
 * Refresh TTL for all user-specific data to 30 days (2592000 seconds)
 */
export const refreshUserTTL = async (username: string): Promise<void> => {
  if (!username) return;
  const ttl = 30 * 24 * 60 * 60; // 30 days
  try {
    await Promise.all([
      redis.expire(PROGRESS_KEY(username), ttl),
      redis.expire(ATTEMPTS_KEY(username), ttl),
      redis.expire(CURRENCY_KEY(username), ttl),
      redis.expire(`user_subscribed:${username}`, ttl),
      redis.expire(`user_active_theme:${username}`, ttl),
      redis.expire(`user_purchased_themes:${username}`, ttl),
    ]);
  } catch (err) {
    console.error(`Failed to refresh TTL for user ${username}:`, err);
  }
};

/**
 * Get the completed puzzle IDs for a specific user.
 * Returns an array of puzzle IDs.
 */
export const getCompletedPuzzles = async (username: string): Promise<string[]> => {
  if (!username) return [];
  const data = await redis.get(PROGRESS_KEY(username));
  await refreshUserTTL(username);
  return data ? JSON.parse(data) : [];
};

/**
 * Mark a specific puzzle as completed for a user.
 * Returns the updated list of completed puzzles and whether it was newly completed.
 */
export const markPuzzleCompleted = async (
  username: string,
  puzzleId: string
): Promise<{ completed: string[]; isNew: boolean }> => {
  if (!username) return { completed: [], isNew: false };
  
  const completed = await getCompletedPuzzles(username);
  const isNew = !completed.includes(puzzleId);
  
  if (isNew) {
    completed.push(puzzleId);
    await redis.set(PROGRESS_KEY(username), JSON.stringify(completed));
  }
  
  await refreshUserTTL(username);
  return { completed, isNew };
};

/**
 * Get the attempted puzzle IDs for a specific user.
 * Returns an array of puzzle IDs.
 */
export const getAttemptedPuzzles = async (username: string): Promise<string[]> => {
  if (!username) return [];
  const data = await redis.get(ATTEMPTS_KEY(username));
  await refreshUserTTL(username);
  return data ? JSON.parse(data) : [];
};

/**
 * Mark a specific puzzle as attempted for a user.
 * Returns whether it was newly attempted.
 */
export const markPuzzleAttempted = async (
  username: string,
  puzzleId: string
): Promise<boolean> => {
  if (!username) return false;
  
  const attempted = await getAttemptedPuzzles(username);
  const isNew = !attempted.includes(puzzleId);
  
  if (isNew) {
    attempted.push(puzzleId);
    await redis.set(ATTEMPTS_KEY(username), JSON.stringify(attempted));
  }
  
  await refreshUserTTL(username);
  return isNew;
};

/**
 * Clear user progress (used for testing or factory reset)
 */
export const clearUserProgress = async (username: string): Promise<void> => {
  if (!username) return;
  await Promise.all([
    redis.del(PROGRESS_KEY(username)),
    redis.del(ATTEMPTS_KEY(username)),
    redis.del(CURRENCY_KEY(username)),
    redis.del(`user_subscribed:${username}`),
  ]);
};

/**
 * Get user currency amount (default 0)
 */
export const getUserCurrency = async (username: string): Promise<number> => {
  if (!username) return 0;
  const currencyStr = await redis.get(CURRENCY_KEY(username));
  await refreshUserTTL(username);
  return currencyStr ? parseInt(currencyStr, 10) : 0;
};

/**
 * Set user currency amount
 */
export const setUserCurrency = async (username: string, amount: number): Promise<void> => {
  if (!username) return;
  await redis.set(CURRENCY_KEY(username), amount.toString());
  await refreshUserTTL(username);
};

/**
 * Add an amount to user currency and return the new total
 */
export const addUserCurrency = async (username: string, amount: number): Promise<number> => {
  if (!username) return 0;
  const current = await getUserCurrency(username);
  const updated = current + amount;
  await setUserCurrency(username, updated);
  return updated;
};

/**
 * Calculate and award currency for a puzzle completion
 */
export const awardCurrencyForPuzzle = async (username: string, puzzleId: string): Promise<number> => {
  if (!username) return 0;

  const todayStr = new Date().toISOString().split('T')[0] || '';
  
  // Check if it's the daily puzzle for today's date in UTC
  const dailyData = await redis.get(`daily:${todayStr}`);
  let todayPuzzleId: string | null = null;
  if (dailyData) {
    try {
      const daily = JSON.parse(dailyData);
      todayPuzzleId = daily.puzzleId;
    } catch {}
  }

  // Fallback to checking the current daily puzzle key
  if (!todayPuzzleId) {
    const currentDaily = await getCurrentDailyPuzzle();
    if (currentDaily) {
      todayPuzzleId = currentDaily.puzzleId;
    }
  }
  
  // Award 100 for current daily puzzle completed on its day, otherwise 10
  const isCurrentDaily = puzzleId === `daily-${todayStr}` || (todayPuzzleId && todayPuzzleId === puzzleId);
  const reward = isCurrentDaily ? 100 : 10;
  
  await addUserCurrency(username, reward);
  return reward;
};
