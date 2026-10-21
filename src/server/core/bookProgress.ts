import { redis } from '@devvit/web/server';
import {
  calculateBookProgressState,
  BookProgressState,
  BookPointActivity,
  DEFAULT_BOOK_ACTIVITIES,
  MAX_BOOK_POINTS,
  DAILY_PUZZLE_BOOK_POINTS,
  SLIDE_MATCH_BOOK_POINTS,
  DAILY_STREAK_BOOK_POINTS,
  SURVEY_VOTE_BOOK_POINTS,
  PUZZLE_CREATED_BOOK_POINTS,
} from '../../shared/lichtenbergProgress';
import { getCurrentDailyPuzzle } from './puzzle';

const BOOK_POINTS_KEY = (username: string) => `user_book_points:${username}`;
export const BOOK_ACTIVITY_LOCK_KEY = (activity: string, username: string) =>
  `user_book_lock:${activity}:${username}`;

/**
 * Gets the raw lifetime book points for a user (defaults to 0).
 */
export const getUserBookPoints = async (username: string): Promise<number> => {
  if (!username) return 0;
  const raw = await redis.get(BOOK_POINTS_KEY(username));
  if (!raw) return 0;
  const parsed = parseInt(raw, 10);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
};

/**
 * Gets the completion state for all points-earning activities for the specified user.
 */
export const getUserBookActivities = async (username: string): Promise<BookPointActivity[]> => {
  if (!username) {
    return DEFAULT_BOOK_ACTIVITIES.map((a) => ({ ...a, isCompleted: false }));
  }

  const todayStr = new Date().toISOString().slice(0, 10);

  try {
    // 1. Daily Puzzle
    const currentDaily = await getCurrentDailyPuzzle().catch(() => null);
    const dailyPuzzleId = currentDaily?.puzzleId || `daily-${todayStr}`;
    const dailyLockKey = BOOK_ACTIVITY_LOCK_KEY(`daily-puzzle:${dailyPuzzleId}`, username);

    // 2. Daily Streak
    const streakLockKey = BOOK_ACTIVITY_LOCK_KEY(`daily-streak:${todayStr}`, username);

    // 3. Slide Match
    const slideMatchLockKey = BOOK_ACTIVITY_LOCK_KEY(`slidematch-endless:${todayStr}`, username);

    // 4. Survey Vote
    const allSurveysRaw = await redis.get('surveys:all_list').catch(() => null);
    let latestSurveyId: string | null = null;
    if (allSurveysRaw) {
      try {
        const parsed = JSON.parse(allSurveysRaw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          latestSurveyId = parsed[0];
        }
      } catch {
        // ignore parse errors
      }
    }
    const surveyLockKey = latestSurveyId
      ? BOOK_ACTIVITY_LOCK_KEY(`survey:${latestSurveyId}`, username)
      : null;
    const surveyVoteKey = latestSurveyId
      ? `survey_user_vote:${latestSurveyId}:${username}`
      : null;

    // 5. Create Puzzle (Daily Bounty)
    const createDailyLockKey = BOOK_ACTIVITY_LOCK_KEY(`puzzle-published-today:${todayStr}`, username);

    const [dailyDone, streakDone, slideDone, surveyLockDone, surveyVoteDone, createDone] =
      await Promise.all([
        redis.get(dailyLockKey).catch(() => null),
        redis.get(streakLockKey).catch(() => null),
        redis.get(slideMatchLockKey).catch(() => null),
        surveyLockKey ? redis.get(surveyLockKey).catch(() => null) : Promise.resolve(null),
        surveyVoteKey ? redis.get(surveyVoteKey).catch(() => null) : Promise.resolve(null),
        redis.get(createDailyLockKey).catch(() => null),
      ]);

    const isSurveyCompleted = Boolean(surveyLockDone || surveyVoteDone);

    return [
      {
        id: 'daily',
        label: 'Daily Puzzle',
        points: DAILY_PUZZLE_BOOK_POINTS,
        isCompleted: Boolean(dailyDone),
        description: "Solve today's featured daily puzzle",
        category: 'daily',
      },
      {
        id: 'slide_match',
        label: 'Slide Match',
        points: SLIDE_MATCH_BOOK_POINTS,
        isCompleted: Boolean(slideDone),
        description: 'Complete an endless speed slide run',
        category: 'daily',
      },
      {
        id: 'streak',
        label: 'Daily Streak',
        points: DAILY_STREAK_BOOK_POINTS,
        isCompleted: Boolean(streakDone),
        description: 'Solve on consecutive days to maintain your streak',
        category: 'daily',
      },
      {
        id: 'survey',
        label: 'Survey Vote',
        points: SURVEY_VOTE_BOOK_POINTS,
        isCompleted: isSurveyCompleted,
        description: 'Vote in the active community question poll',
        category: 'survey',
      },
      {
        id: 'create',
        label: 'Create Puzzle',
        points: PUZZLE_CREATED_BOOK_POINTS,
        isCompleted: Boolean(createDone),
        description: 'Publish a custom level in the puzzle maker',
        category: 'community',
      },
    ];
  } catch (err) {
    console.error('Failed to get user book activities:', err);
    return DEFAULT_BOOK_ACTIVITIES.map((a) => ({ ...a, isCompleted: false }));
  }
};

/**
 * Gets the computed Lichtenberg book progress state for a user including active activity statuses.
 */
export const getUserBookProgress = async (username: string): Promise<BookProgressState> => {
  const [points, activities] = await Promise.all([
    getUserBookPoints(username),
    getUserBookActivities(username),
  ]);
  return calculateBookProgressState(points, activities);
};

/**
 * Awards book points to a user.
 * Optional activityLockKey prevents awarding duplicate points for the same daily or unique activity.
 */
export const awardBookPoints = async (
  username: string,
  amount: number,
  activityLockKey?: string
): Promise<{ newTotal: number; added: number }> => {
  if (!username || amount <= 0) {
    const current = await getUserBookPoints(username);
    return { newTotal: current, added: 0 };
  }

  // Idempotency check if an activity key is specified (e.g. daily-solve-2026-10-16)
  if (activityLockKey) {
    const lockKey = BOOK_ACTIVITY_LOCK_KEY(activityLockKey, username);
    const alreadyAwarded = await redis.get(lockKey);
    if (alreadyAwarded) {
      const current = await getUserBookPoints(username);
      return { newTotal: current, added: 0 };
    }
    // Mark as awarded with a 90-day retention
    await redis.set(lockKey, 'true');
    await redis.expire(lockKey, 90 * 24 * 60 * 60);
  }

  const current = await getUserBookPoints(username);
  const nextTotal = Math.min(MAX_BOOK_POINTS, current + amount);
  await redis.set(BOOK_POINTS_KEY(username), nextTotal.toString());

  return {
    newTotal: nextTotal,
    added: nextTotal - current,
  };
};

/**
 * Developer helper: set book points directly for testing.
 */
export const setDevBookPoints = async (username: string, points: number): Promise<number> => {
  if (!username) return 0;
  const safePoints = Math.max(0, Math.min(MAX_BOOK_POINTS, Math.round(points)));
  await redis.set(BOOK_POINTS_KEY(username), safePoints.toString());
  return safePoints;
};

export {
  DAILY_PUZZLE_BOOK_POINTS,
  SLIDE_MATCH_BOOK_POINTS,
  DAILY_STREAK_BOOK_POINTS,
  SURVEY_VOTE_BOOK_POINTS,
  PUZZLE_CREATED_BOOK_POINTS,
};
