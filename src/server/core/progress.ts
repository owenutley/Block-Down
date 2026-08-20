import { redis } from '@devvit/web/server';
import { getCurrentDailyPuzzle } from './puzzle';

/**
 * Key prefixes for user progress, attempts, and currency
 */
/**
 * Key prefixes for user progress, attempts, and currency
 */
const PROGRESS_KEY = (username: string) => `user_progress:${username}`;
const ATTEMPTS_KEY = (username: string) => `user_attempts:${username}`;
const CURRENCY_KEY = (username: string) => `user_currency:${username}`;
const STARS_KEY = (username: string) => `user_stars:${username}`;
const STREAK_KEY = (username: string) => `user_streak:${username}`;

export type UserStreakData = {
  currentStreak: number;
  maxStreak: number;
  lastSolvedDate: string | null;
};

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
      redis.expire(STARS_KEY(username), ttl),
      redis.expire(STREAK_KEY(username), ttl),
      redis.expire(`user_subscribed:${username}`, ttl),
      redis.expire(`user_active_theme:${username}`, ttl),
      redis.expire(`user_purchased_themes:${username}`, ttl),
      redis.expire(`user_active_trail:${username}`, ttl),
      redis.expire(`user_purchased_trails:${username}`, ttl),
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
 * Get user stars for all puzzles (mapping of puzzleId -> stars 1..3)
 */
export const getUserStars = async (username: string): Promise<Record<string, number>> => {
  if (!username) return {};
  const data = await redis.get(STARS_KEY(username));
  await refreshUserTTL(username);
  return data ? JSON.parse(data) : {};
};

/**
 * Record stars earned on a puzzle (1 to 3 stars).
 * Awards bonus currency if player achieves a new higher star rating on that puzzle.
 */
export const recordPuzzleStars = async (
  username: string,
  puzzleId: string,
  stars: number
): Promise<{ previousStars: number; currentStars: number; isNewRecord: boolean; starReward: number }> => {
  if (!username || stars <= 0) {
    return { previousStars: 0, currentStars: stars, isNewRecord: false, starReward: 0 };
  }

  const allStars = await getUserStars(username);
  const previousStars = allStars[puzzleId] || 0;
  const clampedStars = Math.min(3, Math.max(1, stars));

  if (clampedStars > previousStars) {
    allStars[puzzleId] = clampedStars;
    await redis.set(STARS_KEY(username), JSON.stringify(allStars));

    // Award bonus shards for improving stars:
    // 2 stars: +15 bonus shards
    // 3 stars: +25 bonus shards (+40 if jumping from 0 to 3)
    let starReward = 0;
    if (previousStars < 2 && clampedStars >= 2) starReward += 15;
    if (previousStars < 3 && clampedStars >= 3) starReward += 25;

    if (starReward > 0) {
      await addUserCurrency(username, starReward);
    }

    await refreshUserTTL(username);
    return { previousStars, currentStars: clampedStars, isNewRecord: true, starReward };
  }

  return { previousStars, currentStars: previousStars, isNewRecord: false, starReward: 0 };
};

/**
 * Get user streak data
 */
export const getUserStreak = async (username: string): Promise<UserStreakData> => {
  if (!username) {
    return { currentStreak: 0, maxStreak: 0, lastSolvedDate: null };
  }

  const data = await redis.get(STREAK_KEY(username));
  await refreshUserTTL(username);

  if (!data) {
    return { currentStreak: 0, maxStreak: 0, lastSolvedDate: null };
  }

  try {
    const streakData: UserStreakData = JSON.parse(data);
    const today = new Date().toISOString().split('T')[0] || '';

    // Check if streak was broken (last solved date was more than 1 day before today)
    if (streakData.lastSolvedDate && streakData.lastSolvedDate !== today) {
      const lastDate = new Date(streakData.lastSolvedDate);
      const currentDate = new Date(today);
      const diffTime = currentDate.getTime() - lastDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > 1) {
        // Streak is broken
        streakData.currentStreak = 0;
      }
    }

    return streakData;
  } catch {
    return { currentStreak: 0, maxStreak: 0, lastSolvedDate: null };
  }
};

/**
 * Record a puzzle solve for daily streak calculation
 */
export const recordDailyStreak = async (
  username: string,
  targetDate?: string
): Promise<{
  currentStreak: number;
  maxStreak: number;
  isNewDay: boolean;
  streakBonus: number;
  isMilestone: boolean;
  milestoneText?: string;
}> => {
  if (!username) {
    return { currentStreak: 0, maxStreak: 0, isNewDay: false, streakBonus: 0, isMilestone: false };
  }

  const streakData = await getUserStreak(username);
  const today = targetDate || new Date().toISOString().split('T')[0] || '';

  if (streakData.lastSolvedDate === today) {
    // Already counted today
    return {
      currentStreak: streakData.currentStreak,
      maxStreak: streakData.maxStreak,
      isNewDay: false,
      streakBonus: 0,
      isMilestone: false,
    };
  }

  let newStreak = 1;
  if (streakData.lastSolvedDate) {
    const lastDate = new Date(streakData.lastSolvedDate);
    const currentDate = new Date(today);
    const diffTime = currentDate.getTime() - lastDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      newStreak = streakData.currentStreak + 1;
    }
  }

  const newMax = Math.max(streakData.maxStreak, newStreak);
  const updatedStreakData: UserStreakData = {
    currentStreak: newStreak,
    maxStreak: newMax,
    lastSolvedDate: today,
  };

  await redis.set(STREAK_KEY(username), JSON.stringify(updatedStreakData));

  // Determine streak bonus and milestone
  let streakBonus = 0;
  let isMilestone = false;
  let milestoneText: string | undefined = undefined;

  if (newStreak === 3) {
    streakBonus = 50;
    isMilestone = true;
    milestoneText = '🔥 3-Day Streak Milestone! +50 Shards';
  } else if (newStreak === 7) {
    streakBonus = 150;
    isMilestone = true;
    milestoneText = '🔥 7-Day Streak Milestone! +150 Shards';
  } else if (newStreak === 14) {
    streakBonus = 300;
    isMilestone = true;
    milestoneText = '🔥 14-Day Streak Milestone! +300 Shards';
  } else if (newStreak === 30) {
    streakBonus = 1000;
    isMilestone = true;
    milestoneText = '🔥 30-Day Streak Master! +1,000 Shards';
  } else if (newStreak > 1) {
    streakBonus = 10; // Daily streak continuation bonus
  }

  if (streakBonus > 0) {
    await addUserCurrency(username, streakBonus);
  }

  await refreshUserTTL(username);

  return {
    currentStreak: newStreak,
    maxStreak: newMax,
    isNewDay: true,
    streakBonus,
    isMilestone,
    milestoneText,
  };
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
    redis.del(STARS_KEY(username)),
    redis.del(STREAK_KEY(username)),
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
    } catch {
      // Ignore JSON parsing errors
    }
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
