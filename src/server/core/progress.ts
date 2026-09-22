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
const PODIUMS_KEY = (username: string) => `user_podiums:${username}`;
const FREEZE_KEY = (username: string) => `user_freezes:${username}`;
const STATS_KEY = (username: string) => `user_distinct_stats:${username}`;
const SOLVE_DATES_KEY = (username: string) => `user_solve_dates:${username}`;

export type StreakFreezeRecord = {
  date: string;
  timestamp: number;
};

export type UserStreakData = {
  currentStreak: number;
  maxStreak: number;
  lastSolvedDate: string | null;
  freezesUsedIn30Days: number;
  availableFreezes: number;
  recentFreezeDates: string[];
};

export type UserDistinctStats = {
  totalPuzzlesSolved: number;
  totalTargetBlocksCompleted: number;
  totalBlockPushes: number;
  totalPieceMoves: number;
  totalStarsEarned: number;
};

export type CalendarDayStatus = {
  date: string;
  status: 'solved' | 'frozen' | 'missed';
};

export type UserPodiumStats = {
  firstPlace: number;
  secondPlace: number;
  thirdPlace: number;
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
      redis.expire(PODIUMS_KEY(username), ttl),
      redis.expire(FREEZE_KEY(username), ttl),
      redis.expire(STATS_KEY(username), ttl),
      redis.expire(SOLVE_DATES_KEY(username), ttl),
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
 * Get freeze records for a user
 */
export const getUserFreezes = async (username: string): Promise<StreakFreezeRecord[]> => {
  if (!username) return [];
  const data = await redis.get(FREEZE_KEY(username));
  await refreshUserTTL(username);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
};

/**
 * Get distinct user statistics
 */
export const getUserDistinctStats = async (username: string): Promise<UserDistinctStats> => {
  if (!username) {
    return {
      totalPuzzlesSolved: 0,
      totalTargetBlocksCompleted: 0,
      totalBlockPushes: 0,
      totalPieceMoves: 0,
      totalStarsEarned: 0,
    };
  }

  const [statsData, completedPuzzles, starsData] = await Promise.all([
    redis.get(STATS_KEY(username)),
    getCompletedPuzzles(username),
    getUserStars(username),
  ]);

  const stats: UserDistinctStats = {
    totalPuzzlesSolved: completedPuzzles.length,
    totalTargetBlocksCompleted: 0,
    totalBlockPushes: 0,
    totalPieceMoves: 0,
    totalStarsEarned: 0,
  };

  if (statsData) {
    try {
      const parsed: Partial<UserDistinctStats> = JSON.parse(statsData);
      stats.totalTargetBlocksCompleted = parsed.totalTargetBlocksCompleted || 0;
      stats.totalBlockPushes = parsed.totalBlockPushes || 0;
      stats.totalPieceMoves = parsed.totalPieceMoves || 0;
    } catch {
      // Ignore JSON parse errors
    }
  }

  // Calculate total stars across all puzzles
  const totalStars = Object.values(starsData).reduce((sum, val) => sum + (val || 0), 0);
  stats.totalStarsEarned = totalStars;
  stats.totalPuzzlesSolved = completedPuzzles.length;

  // Baseline floor for existing players who completed puzzles before distinct stats were logged
  if (completedPuzzles.length > 0) {
    if (stats.totalTargetBlocksCompleted === 0) {
      stats.totalTargetBlocksCompleted = completedPuzzles.length * 2;
    }
    if (stats.totalBlockPushes === 0) {
      stats.totalBlockPushes = completedPuzzles.length * 8;
    }
    if (stats.totalPieceMoves === 0) {
      stats.totalPieceMoves = completedPuzzles.length * 14;
    }
  }

  return stats;
};

/**
 * Record increment to distinct user statistics
 */
export const recordDistinctStats = async (
  username: string,
  statsDelta: {
    targetBlocksCompleted?: number;
    blockPushes?: number;
    pieceMoves?: number;
  }
): Promise<UserDistinctStats> => {
  if (!username) {
    return {
      totalPuzzlesSolved: 0,
      totalTargetBlocksCompleted: 0,
      totalBlockPushes: 0,
      totalPieceMoves: 0,
      totalStarsEarned: 0,
    };
  }

  const rawData = await redis.get(STATS_KEY(username));
  let savedTargets = 0;
  let savedPushes = 0;
  let savedMoves = 0;

  if (rawData) {
    try {
      const parsed: Partial<UserDistinctStats> = JSON.parse(rawData);
      savedTargets = parsed.totalTargetBlocksCompleted || 0;
      savedPushes = parsed.totalBlockPushes || 0;
      savedMoves = parsed.totalPieceMoves || 0;
    } catch {
      // Ignore parse error
    }
  }

  const updatedTargets = savedTargets + (statsDelta.targetBlocksCompleted || 0);
  const updatedPushes = savedPushes + (statsDelta.blockPushes || 0);
  const updatedMoves = savedMoves + (statsDelta.pieceMoves || 0);

  await redis.set(STATS_KEY(username), JSON.stringify({
    totalTargetBlocksCompleted: updatedTargets,
    totalBlockPushes: updatedPushes,
    totalPieceMoves: updatedMoves,
  }));

  await refreshUserTTL(username);
  return getUserDistinctStats(username);
};

/**
 * Record a solve date for calendar tracking
 */
export const recordSolveDate = async (username: string, dateStr: string): Promise<void> => {
  if (!username || !dateStr) return;
  const data = await redis.get(SOLVE_DATES_KEY(username));
  let dates: string[] = [];
  if (data) {
    try {
      dates = JSON.parse(data);
    } catch {
      dates = [];
    }
  }
  if (!dates.includes(dateStr)) {
    dates.push(dateStr);
    await redis.set(SOLVE_DATES_KEY(username), JSON.stringify(dates));
  }
  await refreshUserTTL(username);
};

/**
 * Get solve dates for calendar tracking
 */
export const getSolveDates = async (username: string): Promise<string[]> => {
  if (!username) return [];
  const data = await redis.get(SOLVE_DATES_KEY(username));
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
};

/**
 * Get 60-day calendar streak history for user
 */
export const getUserStreakHistory = async (
  username: string,
  daysCount = 60,
  targetDate?: string
): Promise<CalendarDayStatus[]> => {
  if (!username) return [];

  const [solveDates, freezes] = await Promise.all([
    getSolveDates(username),
    getUserFreezes(username),
  ]);

  const freezeDates = new Set(freezes.map(f => f.date));
  const solveDateSet = new Set(solveDates);

  const todayStr = targetDate || new Date().toISOString().split('T')[0] || '';
  const todayMs = new Date(todayStr).getTime();

  const history: CalendarDayStatus[] = [];

  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date(todayMs - i * 86400000);
    const dateStr = d.toISOString().split('T')[0] || '';

    let status: 'solved' | 'frozen' | 'missed' = 'missed';
    if (solveDateSet.has(dateStr)) {
      status = 'solved';
    } else if (freezeDates.has(dateStr)) {
      status = 'frozen';
    }

    history.push({ date: dateStr, status });
  }

  return history;
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
  puzzleId: string,
  additionalIds: string[] = []
): Promise<{ completed: string[]; isNew: boolean }> => {
  if (!username) return { completed: [], isNew: false };
  
  const completed = await getCompletedPuzzles(username);
  const targetIds = [puzzleId, ...additionalIds].filter(Boolean);
  let isNew = false;

  for (const id of targetIds) {
    if (!completed.includes(id)) {
      completed.push(id);
      isNew = true;
    }
  }
  
  if (isNew) {
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
 * Get user streak data with streak freeze calculations
 */
export const getUserStreak = async (username: string, targetDate?: string): Promise<UserStreakData> => {
  const defaultStreak: UserStreakData = {
    currentStreak: 0,
    maxStreak: 0,
    lastSolvedDate: null,
    freezesUsedIn30Days: 0,
    availableFreezes: 3,
    recentFreezeDates: [],
  };

  if (!username) return defaultStreak;

  const [streakRaw, freezes] = await Promise.all([
    redis.get(STREAK_KEY(username)),
    getUserFreezes(username),
  ]);
  await refreshUserTTL(username);

  const today = targetDate || new Date().toISOString().split('T')[0] || '';
  const todayMs = new Date(today).getTime();
  const THIRTY_DAYS_MS = 30 * 86400000;

  // Filter freezes used in past 30 days relative to today
  const recentFreezes = freezes.filter(f => todayMs - f.timestamp <= THIRTY_DAYS_MS);
  const freezesUsedIn30Days = recentFreezes.length;
  const availableFreezes = Math.max(0, 3 - freezesUsedIn30Days);
  const recentFreezeDates = recentFreezes.map(f => f.date);

  if (!streakRaw) {
    return {
      ...defaultStreak,
      freezesUsedIn30Days,
      availableFreezes,
      recentFreezeDates,
    };
  }

  try {
    const streakData: Partial<UserStreakData> = JSON.parse(streakRaw);
    let currentStreak = streakData.currentStreak || 0;
    const maxStreak = streakData.maxStreak || 0;
    const lastSolvedDate = streakData.lastSolvedDate || null;

    if (lastSolvedDate && lastSolvedDate !== today) {
      const lastMs = new Date(lastSolvedDate).getTime();
      const diffTime = todayMs - lastMs;
      const diffDays = Math.floor(diffTime / 86400000);

      if (diffDays > 1) {
        const missedDays = diffDays - 1;
        if (missedDays > availableFreezes) {
          // Missed more days than available freezes: streak breaks
          currentStreak = 0;
        }
      }
    }

    return {
      currentStreak,
      maxStreak,
      lastSolvedDate,
      freezesUsedIn30Days,
      availableFreezes,
      recentFreezeDates,
    };
  } catch {
    return {
      ...defaultStreak,
      freezesUsedIn30Days,
      availableFreezes,
      recentFreezeDates,
    };
  }
};

/**
 * Record a puzzle solve for daily streak calculation with automatic streak freeze protection
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
  freezesApplied?: number;
}> => {
  if (!username) {
    return { currentStreak: 0, maxStreak: 0, isNewDay: false, streakBonus: 0, isMilestone: false };
  }

  const today = targetDate || new Date().toISOString().split('T')[0] || '';
  await recordSolveDate(username, today);

  const streakData = await getUserStreak(username, today);

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
  let freezesApplied = 0;

  if (streakData.lastSolvedDate) {
    const lastMs = new Date(streakData.lastSolvedDate).getTime();
    const todayMs = new Date(today).getTime();
    const diffDays = Math.floor((todayMs - lastMs) / 86400000);

    if (diffDays === 1) {
      newStreak = streakData.currentStreak + 1;
    } else if (diffDays > 1) {
      const missedDays = diffDays - 1;
      if (missedDays <= streakData.availableFreezes) {
        // Automatically apply freezes for missed days
        const freezes = await getUserFreezes(username);
        for (let i = 1; i <= missedDays; i++) {
          const missedMs = lastMs + i * 86400000;
          const missedDateStr = new Date(missedMs).toISOString().split('T')[0] || '';
          if (!freezes.some(f => f.date === missedDateStr)) {
            freezes.push({ date: missedDateStr, timestamp: missedMs });
            freezesApplied++;
          }
        }
        await redis.set(FREEZE_KEY(username), JSON.stringify(freezes));
        newStreak = streakData.currentStreak + 1;
      } else {
        // Missed too many days -> reset streak to 1
        newStreak = 1;
      }
    }
  }

  const newMax = Math.max(streakData.maxStreak, newStreak);
  const updatedStreakData: UserStreakData = {
    currentStreak: newStreak,
    maxStreak: newMax,
    lastSolvedDate: today,
    freezesUsedIn30Days: streakData.freezesUsedIn30Days + freezesApplied,
    availableFreezes: Math.max(0, streakData.availableFreezes - freezesApplied),
    recentFreezeDates: streakData.recentFreezeDates,
  };

  await redis.set(STREAK_KEY(username), JSON.stringify({
    currentStreak: updatedStreakData.currentStreak,
    maxStreak: updatedStreakData.maxStreak,
    lastSolvedDate: updatedStreakData.lastSolvedDate,
  }));

  // Determine streak bonus and milestone
  let streakBonus = 0;
  let isMilestone = false;
  let milestoneText: string | undefined = undefined;

  if (newStreak === 3) {
    streakBonus = 50;
    isMilestone = true;
    milestoneText = '3-Day Streak Milestone! +50 Shards';
  } else if (newStreak === 7) {
    streakBonus = 150;
    isMilestone = true;
    milestoneText = '7-Day Streak Milestone! +150 Shards';
  } else if (newStreak === 14) {
    streakBonus = 400;
    isMilestone = true;
    milestoneText = '14-Day Streak Milestone! +400 Shards';
  } else if (newStreak > 0 && newStreak % 30 === 0) {
    const times = newStreak / 30;
    const rawBonus = 1000 + 500 * (times - 1);
    streakBonus = Math.min(5000, rawBonus);
    isMilestone = true;
    milestoneText = `${newStreak}-Day Streak Master! +${streakBonus.toLocaleString()} Shards`;
  } else if (newStreak > 1) {
    streakBonus = 10;
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
    freezesApplied,
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
    redis.del(FREEZE_KEY(username)),
    redis.del(STATS_KEY(username)),
    redis.del(SOLVE_DATES_KEY(username)),
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
 * Check if a puzzle ID corresponds to today's active daily puzzle (within 24 hours)
 */
export const isCurrentDailyPuzzle = async (puzzleId: string): Promise<boolean> => {
  if (!puzzleId) return false;
  const todayStr = new Date().toISOString().split('T')[0] || '';
  if (puzzleId === `daily-${todayStr}`) return true;

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

  if (!todayPuzzleId) {
    const currentDaily = await getCurrentDailyPuzzle();
    if (currentDaily) {
      todayPuzzleId = currentDaily.puzzleId;
    }
  }

  return !!todayPuzzleId && todayPuzzleId === puzzleId;
};

/**
 * Check if a user has already claimed the 10-shard daily puzzle start bonus today
 */
export const hasClaimedDailyStartBonus = async (username: string): Promise<boolean> => {
  if (!username) return false;
  const todayStr = new Date().toISOString().split('T')[0] || '';
  const bonusKey = `daily_start_bonus:${username}:${todayStr}`;
  const claimed = await redis.get(bonusKey);
  return !!claimed;
};

/**
 * Award 10 shards to a player for starting the current daily puzzle (once per 24h window)
 */
export const checkAndAwardDailyStartBonus = async (
  username: string,
  puzzleId: string
): Promise<{ awarded: boolean; amount: number }> => {
  if (!username || !puzzleId) return { awarded: false, amount: 0 };
  const isCurrent = await isCurrentDailyPuzzle(puzzleId);
  if (!isCurrent) return { awarded: false, amount: 0 };

  const todayStr = new Date().toISOString().split('T')[0] || '';
  const bonusKey = `daily_start_bonus:${username}:${todayStr}`;
  const alreadyClaimed = await redis.get(bonusKey);
  if (alreadyClaimed) {
    return { awarded: false, amount: 0 };
  }

  await redis.set(bonusKey, '1');
  await addUserCurrency(username, 10);
  return { awarded: true, amount: 10 };
};

/**
 * Calculate and award currency for a puzzle completion
 */
export const awardCurrencyForPuzzle = async (username: string, puzzleId: string): Promise<number> => {
  if (!username) return 0;
  const isCurrent = await isCurrentDailyPuzzle(puzzleId);
  const reward = isCurrent ? 100 : 10;
  await addUserCurrency(username, reward);
  return reward;
};

/**
 * Get player podium stats (1st, 2nd, 3rd place finishes)
 */
export const getUserPodiums = async (username: string): Promise<UserPodiumStats> => {
  if (!username) {
    return { firstPlace: 0, secondPlace: 0, thirdPlace: 0 };
  }
  const data = await redis.get(PODIUMS_KEY(username));
  await refreshUserTTL(username);

  if (!data) {
    return { firstPlace: 0, secondPlace: 0, thirdPlace: 0 };
  }

  try {
    const stats: Partial<UserPodiumStats> = JSON.parse(data);
    return {
      firstPlace: stats.firstPlace || 0,
      secondPlace: stats.secondPlace || 0,
      thirdPlace: stats.thirdPlace || 0,
    };
  } catch {
    return { firstPlace: 0, secondPlace: 0, thirdPlace: 0 };
  }
};

/**
 * Award a podium finish (1st, 2nd, or 3rd place) to a user
 */
export const awardPodiumFinish = async (
  username: string,
  place: 1 | 2 | 3
): Promise<UserPodiumStats> => {
  if (!username) {
    return { firstPlace: 0, secondPlace: 0, thirdPlace: 0 };
  }

  const current = await getUserPodiums(username);
  if (place === 1) current.firstPlace += 1;
  else if (place === 2) current.secondPlace += 1;
  else if (place === 3) current.thirdPlace += 1;

  await redis.set(PODIUMS_KEY(username), JSON.stringify(current));
  await refreshUserTTL(username);
  return current;
};
