import { redis } from '@devvit/web/server';
import {
  AnalyticsEventName,
  AnalyticsDashboardData,
  AnalyticsFeatureStat,
  DailyActiveUserPoint,
} from '../../shared/types';

const KEYS = {
  ALL_USERS: 'analytics:users:all',
  DAU: (date: string) => `analytics:dau:${date}`,
  EVENTS_TOTAL: 'analytics:events:total',
  EVENTS_DAILY: (date: string) => `analytics:events:daily:${date}`,
  DATES_LIST: 'analytics:dates:list',
};

const getTodayDate = (): string => new Date().toISOString().split('T')[0] || '';

const getYesterdayDate = (): string => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0] || '';
};

const EVENT_CATEGORIES: Record<string, 'screen' | 'gameplay' | 'creator' | 'economy'> = {
  screen_view_daily: 'screen',
  screen_view_campaign: 'screen',
  screen_view_past_puzzles: 'screen',
  screen_view_puzzle_maker: 'screen',
  screen_view_shop: 'screen',
  screen_view_profile: 'screen',
  screen_view_howto: 'screen',
  game_start: 'gameplay',
  game_solve_completed: 'gameplay',
  game_undo_used: 'gameplay',
  game_reset_used: 'gameplay',
  maker_auto_generate: 'creator',
  maker_puzzle_playtested: 'creator',
  maker_puzzle_published: 'creator',
  shop_theme_purchased: 'economy',
  shop_trail_purchased: 'economy',
  theme_equipped: 'economy',
  streak_freeze_used: 'gameplay',
  daily_bonus_claimed: 'economy',
};

/**
 * Records an analytics event and marks the user as active for today.
 */
export const recordAnalyticsEvent = async (
  username: string | null | undefined,
  eventName: AnalyticsEventName
): Promise<void> => {
  try {
    const today = getTodayDate();

    // 1. Record user in unique sets if a username exists
    if (username && username.trim() !== '') {
      const normalizedUser = username.toLowerCase().replace(/^u\//, '').trim();
      const allUsersStr = (await redis.get(KEYS.ALL_USERS)) || '[]';
      let allUsers: string[] = [];
      try {
        allUsers = JSON.parse(allUsersStr);
      } catch {
        allUsers = [];
      }
      if (!allUsers.includes(normalizedUser)) {
        allUsers.push(normalizedUser);
        await redis.set(KEYS.ALL_USERS, JSON.stringify(allUsers));
      }

      // Today's DAU set
      const dauStr = (await redis.get(KEYS.DAU(today))) || '[]';
      let todayUsers: string[] = [];
      try {
        todayUsers = JSON.parse(dauStr);
      } catch {
        todayUsers = [];
      }
      if (!todayUsers.includes(normalizedUser)) {
        todayUsers.push(normalizedUser);
        await redis.set(KEYS.DAU(today), JSON.stringify(todayUsers));
      }
    }

    // 2. Increment total event count
    const totalEventsStr = (await redis.get(KEYS.EVENTS_TOTAL)) || '{}';
    let totalEvents: Record<string, number> = {};
    try {
      totalEvents = JSON.parse(totalEventsStr);
    } catch {
      totalEvents = {};
    }
    totalEvents[eventName] = (totalEvents[eventName] || 0) + 1;
    await redis.set(KEYS.EVENTS_TOTAL, JSON.stringify(totalEvents));

    // 3. Increment daily event count
    const dailyEventsStr = (await redis.get(KEYS.EVENTS_DAILY(today))) || '{}';
    let dailyEvents: Record<string, number> = {};
    try {
      dailyEvents = JSON.parse(dailyEventsStr);
    } catch {
      dailyEvents = {};
    }
    dailyEvents[eventName] = (dailyEvents[eventName] || 0) + 1;
    await redis.set(KEYS.EVENTS_DAILY(today), JSON.stringify(dailyEvents));

    // 4. Index date in date list
    const datesStr = (await redis.get(KEYS.DATES_LIST)) || '[]';
    let datesList: string[] = [];
    try {
      datesList = JSON.parse(datesStr);
    } catch {
      datesList = [];
    }
    if (!datesList.includes(today)) {
      datesList.push(today);
      if (datesList.length > 30) {
        datesList = datesList.slice(-30);
      }
      await redis.set(KEYS.DATES_LIST, JSON.stringify(datesList));
    }
  } catch (err) {
    console.error('Failed to record analytics event:', err);
  }
};

/**
 * Retrieves the compiled analytics dashboard summary.
 */
export const getAnalyticsDashboardData = async (): Promise<AnalyticsDashboardData> => {
  try {
    const today = getTodayDate();
    const yesterday = getYesterdayDate();

    // 1. Total unique players
    const allUsersStr = (await redis.get(KEYS.ALL_USERS)) || '[]';
    let allUsers: string[] = [];
    try {
      allUsers = JSON.parse(allUsersStr);
    } catch {
      allUsers = [];
    }
    const totalUniquePlayers = allUsers.length;

    // 2. Today's DAU
    const todayDauStr = (await redis.get(KEYS.DAU(today))) || '[]';
    let todayUsers: string[] = [];
    try {
      todayUsers = JSON.parse(todayDauStr);
    } catch {
      todayUsers = [];
    }
    const todayDau = todayUsers.length;

    // 3. Yesterday's DAU
    const yesterdayDauStr = (await redis.get(KEYS.DAU(yesterday))) || '[]';
    let yesterdayUsers: string[] = [];
    try {
      yesterdayUsers = JSON.parse(yesterdayDauStr);
    } catch {
      yesterdayUsers = [];
    }
    const yesterdayDau = yesterdayUsers.length;

    // 4. Events stats (Total & Today)
    const totalEventsStr = (await redis.get(KEYS.EVENTS_TOTAL)) || '{}';
    let totalEvents: Record<string, number> = {};
    try {
      totalEvents = JSON.parse(totalEventsStr);
    } catch {
      totalEvents = {};
    }

    const todayEventsStr = (await redis.get(KEYS.EVENTS_DAILY(today))) || '{}';
    let todayEvents: Record<string, number> = {};
    try {
      todayEvents = JSON.parse(todayEventsStr);
    } catch {
      todayEvents = {};
    }

    const allEventKeys = Array.from(new Set([...Object.keys(totalEvents), ...Object.keys(EVENT_CATEGORIES)]));
    const topFeatures: AnalyticsFeatureStat[] = allEventKeys
      .map((key) => ({
        name: key,
        category: EVENT_CATEGORIES[key] || 'gameplay',
        totalCount: totalEvents[key] || 0,
        todayCount: todayEvents[key] || 0,
      }))
      .sort((a, b) => b.totalCount - a.totalCount);

    // 5. 14-day DAU history
    const datesStr = (await redis.get(KEYS.DATES_LIST)) || '[]';
    let datesList: string[] = [];
    try {
      datesList = JSON.parse(datesStr);
    } catch {
      datesList = [];
    }
    if (!datesList.includes(today)) {
      datesList.push(today);
    }

    const recentDates = datesList.slice(-14);
    const dauHistory: DailyActiveUserPoint[] = await Promise.all(
      recentDates.map(async (date) => {
        const uStr = (await redis.get(KEYS.DAU(date))) || '[]';
        let uList: string[] = [];
        try {
          uList = JSON.parse(uStr);
        } catch {
          uList = [];
        }

        const dEventStr = (await redis.get(KEYS.EVENTS_DAILY(date))) || '{}';
        let dEventMap: Record<string, number> = {};
        try {
          dEventMap = JSON.parse(dEventStr);
        } catch {
          dEventMap = {};
        }
        const eventsCount = Object.values(dEventMap).reduce((sum, val) => sum + val, 0);

        return {
          date,
          dau: uList.length,
          eventsCount,
        };
      })
    );

    const totalSolves = totalEvents.game_solve_completed || 0;

    return {
      totalUniquePlayers,
      todayDau,
      yesterdayDau,
      totalSolves,
      topFeatures,
      dauHistory,
      lastUpdated: Date.now(),
    };
  } catch (err) {
    console.error('Failed to get analytics dashboard data:', err);
    return {
      totalUniquePlayers: 0,
      todayDau: 0,
      yesterdayDau: 0,
      totalSolves: 0,
      topFeatures: [],
      dauHistory: [],
      lastUpdated: Date.now(),
    };
  }
};

/**
 * Resets analytics data (for developer debugging/testing only).
 */
export const resetAnalyticsData = async (): Promise<void> => {
  const datesStr = (await redis.get(KEYS.DATES_LIST)) || '[]';
  let datesList: string[] = [];
  try {
    datesList = JSON.parse(datesStr);
  } catch {
    datesList = [];
  }

  for (const date of datesList) {
    await redis.del(KEYS.DAU(date));
    await redis.del(KEYS.EVENTS_DAILY(date));
  }

  const today = getTodayDate();
  await redis.del(KEYS.DAU(today));
  await redis.del(KEYS.EVENTS_DAILY(today));
  await redis.del(KEYS.ALL_USERS);
  await redis.del(KEYS.EVENTS_TOTAL);
  await redis.del(KEYS.DATES_LIST);
};
