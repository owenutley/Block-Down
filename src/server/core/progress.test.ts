import { expect } from 'vitest';
import { test } from '../test';
import { redis } from '@devvit/web/server';
import {
  getCompletedPuzzles,
  markPuzzleCompleted,
  getAttemptedPuzzles,
  markPuzzleAttempted,
  clearUserProgress,
  getUserCurrency,
  setUserCurrency,
  addUserCurrency,
  awardCurrencyForPuzzle,
  getUserStars,
  recordPuzzleStars,
  getUserStreak,
  recordDailyStreak,
  getUserPodiums,
  awardPodiumFinish,
  getUserDistinctStats,
  recordDistinctStats,
  getUserStreakHistory,
  getUserFreezes,
  isCurrentDailyPuzzle,
  hasClaimedDailyStartBonus,
  checkAndAwardDailyStartBonus,
} from './progress';
import { createPuzzle } from './puzzle';

test('Should track unique attempts', async () => {
  const username = 'test-user';
  
  // Initially no attempts
  let attempted = await getAttemptedPuzzles(username);
  expect(attempted).toEqual([]);
  
  // First attempt
  let isNew = await markPuzzleAttempted(username, 'puzzle-1');
  expect(isNew).toBe(true);
  
  attempted = await getAttemptedPuzzles(username);
  expect(attempted).toEqual(['puzzle-1']);
  
  // Second attempt should not be new
  isNew = await markPuzzleAttempted(username, 'puzzle-1');
  expect(isNew).toBe(false);

  // 10 subsequent attempts should all return false
  for (let i = 0; i < 10; i++) {
    const res = await markPuzzleAttempted(username, 'puzzle-1');
    expect(res).toBe(false);
  }
  
  attempted = await getAttemptedPuzzles(username);
  expect(attempted).toEqual(['puzzle-1']);
});

test('Should track unique completions', async () => {
  const username = 'test-user';
  
  // Initially no completions
  const completed = await getCompletedPuzzles(username);
  expect(completed).toEqual([]);
  
  // First completion
  let result = await markPuzzleCompleted(username, 'puzzle-1');
  expect(result.isNew).toBe(true);
  expect(result.completed).toEqual(['puzzle-1']);
  
  // Second completion should not be new
  result = await markPuzzleCompleted(username, 'puzzle-1');
  expect(result.isNew).toBe(false);
  expect(result.completed).toEqual(['puzzle-1']);
});

test('Should clear progress and attempts', async () => {
  const username = 'test-user';
  
  await markPuzzleAttempted(username, 'puzzle-1');
  await markPuzzleCompleted(username, 'puzzle-1');
  
  await clearUserProgress(username);
  
  const attempted = await getAttemptedPuzzles(username);
  const completed = await getCompletedPuzzles(username);
  
  expect(attempted).toEqual([]);
  expect(completed).toEqual([]);
});

test('Should initialize, add, and clear currency', async () => {
  const username = 'test-currency-user';
  
  // Default is 0
  let currency = await getUserCurrency(username);
  expect(currency).toBe(0);
  
  // Set currency
  await setUserCurrency(username, 50);
  currency = await getUserCurrency(username);
  expect(currency).toBe(50);
  
  // Add currency
  const updated = await addUserCurrency(username, 25);
  expect(updated).toBe(75);
  
  currency = await getUserCurrency(username);
  expect(currency).toBe(75);
  
  // Clear progress should clear currency
  await clearUserProgress(username);
  currency = await getUserCurrency(username);
  expect(currency).toBe(0);
});

test('Should award currency based on puzzle type', async () => {
  const username = 'test-award-user';
  
  // Clean start
  await clearUserProgress(username);
  
  // Create mock puzzle in DB first
  await createPuzzle({
    id: 'daily-123',
    name: 'Daily Test Puzzle',
    difficulty: 'daily',
    width: 3,
    height: 3,
    player: { x: 0, y: 0 },
    walls: [],
    blocks: [],
    targets: [],
    createdAt: Date.now()
  });
  
  // Mock today's daily puzzle in redis: current:daily
  const dailyPuzzle = {
    date: '2026-05-29',
    puzzleId: 'daily-123',
    difficulty: 'daily',
    assignedAt: Date.now()
  };
  await redis.set('current:daily', JSON.stringify(dailyPuzzle));
  
  // Award for current daily (50)
  let rewarded = await awardCurrencyForPuzzle(username, 'daily-123');
  expect(rewarded).toBe(50);
  
  let total = await getUserCurrency(username);
  expect(total).toBe(50);
  
  // Award for a past/campaign puzzle (10)
  rewarded = await awardCurrencyForPuzzle(username, 'campaign-456');
  expect(rewarded).toBe(10);
  
  total = await getUserCurrency(username);
  expect(total).toBe(60);
  
  // Clean up mock
  await redis.del('current:daily');
});

test('Should track star ratings and award bonus shards', async () => {
  const username = 'star-user';
  await clearUserProgress(username);

  // Initial stars
  const stars = await getUserStars(username);
  expect(stars).toEqual({});

  // Record 2 stars (+2 whisps: 1 for 1st star + 1 for 2nd star)
  let res = await recordPuzzleStars(username, 'level-1', 2);
  expect(res.currentStars).toBe(2);
  expect(res.starReward).toBe(2);
  expect(res.isNewRecord).toBe(true);

  let currency = await getUserCurrency(username);
  expect(currency).toBe(2);

  // Upgrade to 3 stars (+1 delta whisp for par/below par, total 3)
  res = await recordPuzzleStars(username, 'level-1', 3);
  expect(res.currentStars).toBe(3);
  expect(res.starReward).toBe(1);
  expect(res.isNewRecord).toBe(true);

  currency = await getUserCurrency(username);
  expect(currency).toBe(3);

  // Lower star attempt should not decrease
  res = await recordPuzzleStars(username, 'level-1', 1);
  expect(res.currentStars).toBe(3);
  expect(res.starReward).toBe(0);
  expect(res.isNewRecord).toBe(false);
});

test('Should track daily streak and award milestone bonuses', async () => {
  const username = 'streak-user';
  await clearUserProgress(username);

  // Initial streak
  const streak = await getUserStreak(username);
  expect(streak.currentStreak).toBe(0);

  // Day 1
  let res = await recordDailyStreak(username, '2026-08-17');
  expect(res.currentStreak).toBe(1);
  expect(res.maxStreak).toBe(1);
  expect(res.isNewDay).toBe(true);
  expect(res.streakBonus).toBe(1);

  // Playing again on the same day does not advance streak
  res = await recordDailyStreak(username, '2026-08-17');
  expect(res.currentStreak).toBe(1);
  expect(res.isNewDay).toBe(false);

  // Consecutive Day 2 (Bonus: 2 whisps)
  res = await recordDailyStreak(username, '2026-08-18');
  expect(res.currentStreak).toBe(2);
  expect(res.isNewDay).toBe(true);
  expect(res.streakBonus).toBe(2);

  // Consecutive Day 3 (Bonus: 3 whisps)
  res = await recordDailyStreak(username, '2026-08-19');
  expect(res.currentStreak).toBe(3);
  expect(res.streakBonus).toBe(3);

  // Day 7 (7 bonus whisps)
  await redis.set(`user_streak:${username}`, JSON.stringify({ currentStreak: 6, maxStreak: 6, lastSolvedDate: '2026-08-19' }));
  res = await recordDailyStreak(username, '2026-08-20');
  expect(res.currentStreak).toBe(7);
  expect(res.streakBonus).toBe(7);

  // Day 14 (14 bonus whisps)
  await redis.set(`user_streak:${username}`, JSON.stringify({ currentStreak: 13, maxStreak: 13, lastSolvedDate: '2026-08-20' }));
  res = await recordDailyStreak(username, '2026-08-21');
  expect(res.currentStreak).toBe(14);
  expect(res.streakBonus).toBe(14);

  // Day 30 (30 bonus whisps)
  await redis.set(`user_streak:${username}`, JSON.stringify({ currentStreak: 29, maxStreak: 29, lastSolvedDate: '2026-08-21' }));
  res = await recordDailyStreak(username, '2026-08-22');
  expect(res.currentStreak).toBe(30);
  expect(res.streakBonus).toBe(30);

  // Day 60 (60 bonus whisps)
  await redis.set(`user_streak:${username}`, JSON.stringify({ currentStreak: 59, maxStreak: 59, lastSolvedDate: '2026-08-22' }));
  res = await recordDailyStreak(username, '2026-08-23');
  expect(res.currentStreak).toBe(60);
  expect(res.streakBonus).toBe(60);

  // Day 150 (150 bonus whisps, max cap reached)
  await redis.set(`user_streak:${username}`, JSON.stringify({ currentStreak: 149, maxStreak: 149, lastSolvedDate: '2026-08-23' }));
  res = await recordDailyStreak(username, '2026-08-24');
  expect(res.currentStreak).toBe(150);
  expect(res.streakBonus).toBe(150);

  // Day 151 (capped at 150 bonus whisps, streak advances to 151)
  await redis.set(`user_streak:${username}`, JSON.stringify({ currentStreak: 150, maxStreak: 150, lastSolvedDate: '2026-08-24' }));
  res = await recordDailyStreak(username, '2026-08-25');
  expect(res.currentStreak).toBe(151);
  expect(res.streakBonus).toBe(150);

  // Day 300 (still capped at 150 bonus whisps)
  await redis.set(`user_streak:${username}`, JSON.stringify({ currentStreak: 299, maxStreak: 299, lastSolvedDate: '2026-08-25' }));
  res = await recordDailyStreak(username, '2026-08-26');
  expect(res.currentStreak).toBe(300);
  expect(res.streakBonus).toBe(150);
});

test('Should track player podium finishes (1st, 2nd, and 3rd place)', async () => {
  const username = 'podium-user';
  await clearUserProgress(username);

  // Initially 0 for all
  let stats = await getUserPodiums(username);
  expect(stats).toEqual({ firstPlace: 0, secondPlace: 0, thirdPlace: 0 });

  // Award 1st place
  stats = await awardPodiumFinish(username, 1);
  expect(stats.firstPlace).toBe(1);

  // Award 2nd place twice
  await awardPodiumFinish(username, 2);
  stats = await awardPodiumFinish(username, 2);
  expect(stats.secondPlace).toBe(2);

  // Award 3rd place
  stats = await awardPodiumFinish(username, 3);
  expect(stats.thirdPlace).toBe(1);

  // Read back
  stats = await getUserPodiums(username);
  expect(stats).toEqual({ firstPlace: 1, secondPlace: 2, thirdPlace: 1 });
});

test('Should automatically apply streak freeze when days are missed', async () => {
  const username = 'freeze-test-user';
  await clearUserProgress(username);

  // Day 1: Solve
  let res = await recordDailyStreak(username, '2026-09-01');
  expect(res.currentStreak).toBe(1);

  // Miss Day 2 (2026-09-02) and Day 3 (2026-09-03). Solve on Day 4 (2026-09-04)
  res = await recordDailyStreak(username, '2026-09-04');
  expect(res.currentStreak).toBe(2);
  expect(res.freezesApplied).toBe(2);

  const freezes = await getUserFreezes(username);
  expect(freezes.length).toBe(2);
  expect(freezes.map((f) => f.date)).toEqual(['2026-09-02', '2026-09-03']);

  const streakData = await getUserStreak(username, '2026-09-04');
  expect(streakData.freezesUsedIn30Days).toBe(2);
  expect(streakData.availableFreezes).toBe(1);

  // Now miss 2 more days (2026-09-05 and 2026-09-06). User only has 1 freeze left!
  // Solve on Day 7 (2026-09-07) -> missed 2 days, exceeds 1 available freeze -> streak breaks!
  res = await recordDailyStreak(username, '2026-09-07');
  expect(res.currentStreak).toBe(1); // Streak reset
  expect(res.streakBonus).toBe(1);
});

test('Should track distinct user stats correctly', async () => {
  const username = 'distinct-stats-user';
  await clearUserProgress(username);

  let stats = await getUserDistinctStats(username);
  expect(stats.totalPuzzlesSolved).toBe(0);

  await markPuzzleCompleted(username, 'level-1');
  await markPuzzleCompleted(username, 'level-2');

  await recordDistinctStats(username, {
    targetBlocksCompleted: 5,
    blockPushes: 12,
    pieceMoves: 20,
  });

  stats = await getUserDistinctStats(username);
  expect(stats.totalPuzzlesSolved).toBe(2);
  expect(stats.totalTargetBlocksCompleted).toBe(5);
  expect(stats.totalBlockPushes).toBe(12);
  expect(stats.totalPieceMoves).toBe(20);
});

test('Should return streak history calendar for past 60 days', async () => {
  const username = 'calendar-user';
  await clearUserProgress(username);

  await recordDailyStreak(username, '2026-09-01');
  await recordDailyStreak(username, '2026-09-04'); // Freezes 09-02 and 09-03

  const history = await getUserStreakHistory(username, 5, '2026-09-04');
  expect(history.length).toBe(5);
  // Dates: 08-31 (missed), 09-01 (solved), 09-02 (frozen), 09-03 (frozen), 09-04 (solved)
  expect(history.map((h) => h.status)).toEqual(['missed', 'solved', 'frozen', 'frozen', 'solved']);
});

test('Should award 10 shards for starting the current daily puzzle once per day', async () => {
  const username = 'start-bonus-user';
  await clearUserProgress(username);

  const todayStr = new Date().toISOString().split('T')[0] || '';
  const dailyPuzzleId = `daily-${todayStr}`;

  expect(await isCurrentDailyPuzzle(dailyPuzzleId)).toBe(true);
  expect(await isCurrentDailyPuzzle('random-level')).toBe(false);

  // Initially not claimed
  let claimed = await hasClaimedDailyStartBonus(username);
  expect(claimed).toBe(false);

  // Attempting a non-daily puzzle does not award bonus
  let bonusRes = await checkAndAwardDailyStartBonus(username, 'random-level');
  expect(bonusRes.awarded).toBe(false);
  expect(bonusRes.amount).toBe(0);
  expect(await getUserCurrency(username)).toBe(0);

  // Starting current daily puzzle awards 10 shards
  bonusRes = await checkAndAwardDailyStartBonus(username, dailyPuzzleId);
  expect(bonusRes.awarded).toBe(true);
  expect(bonusRes.amount).toBe(10);
  expect(await getUserCurrency(username)).toBe(10);

  // Status is now claimed
  claimed = await hasClaimedDailyStartBonus(username);
  expect(claimed).toBe(true);

  // Re-starting does not award again
  bonusRes = await checkAndAwardDailyStartBonus(username, dailyPuzzleId);
  expect(bonusRes.awarded).toBe(false);
  expect(bonusRes.amount).toBe(0);
  expect(await getUserCurrency(username)).toBe(10);

  // Clean up
  await redis.del(`daily_start_bonus:${username}:${todayStr}`);
});
