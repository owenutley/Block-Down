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
  awardCurrencyForPuzzle
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
