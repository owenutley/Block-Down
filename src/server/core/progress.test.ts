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
  recordDailyStreak
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
  
  // Award for current daily (100)
  let rewarded = await awardCurrencyForPuzzle(username, 'daily-123');
  expect(rewarded).toBe(100);
  
  let total = await getUserCurrency(username);
  expect(total).toBe(100);
  
  // Award for a past/campaign puzzle (10)
  rewarded = await awardCurrencyForPuzzle(username, 'campaign-456');
  expect(rewarded).toBe(10);
  
  total = await getUserCurrency(username);
  expect(total).toBe(110);
  
  // Clean up mock
  await redis.del('current:daily');
});

test('Should track star ratings and award bonus shards', async () => {
  const username = 'star-user';
  await clearUserProgress(username);

  // Initial stars
  const stars = await getUserStars(username);
  expect(stars).toEqual({});

  // Record 2 stars (+15 shards)
  let res = await recordPuzzleStars(username, 'level-1', 2);
  expect(res.currentStars).toBe(2);
  expect(res.starReward).toBe(15);
  expect(res.isNewRecord).toBe(true);

  let currency = await getUserCurrency(username);
  expect(currency).toBe(15);

  // Upgrade to 3 stars (+10 delta shards)
  res = await recordPuzzleStars(username, 'level-1', 3);
  expect(res.currentStars).toBe(3);
  expect(res.starReward).toBe(10);
  expect(res.isNewRecord).toBe(true);

  currency = await getUserCurrency(username);
  expect(currency).toBe(25);

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

  // Playing again on the same day does not advance streak
  res = await recordDailyStreak(username, '2026-08-17');
  expect(res.currentStreak).toBe(1);
  expect(res.isNewDay).toBe(false);

  // Consecutive Day 2
  res = await recordDailyStreak(username, '2026-08-18');
  expect(res.currentStreak).toBe(2);
  expect(res.isNewDay).toBe(true);

  // Consecutive Day 3 (Milestone: 50 bonus shards)
  res = await recordDailyStreak(username, '2026-08-19');
  expect(res.currentStreak).toBe(3);
  expect(res.isMilestone).toBe(true);
  expect(res.streakBonus).toBe(50);
});
