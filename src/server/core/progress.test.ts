import { expect } from 'vitest';
import { test } from '../test';
import { getCompletedPuzzles, markPuzzleCompleted, getAttemptedPuzzles, markPuzzleAttempted, clearUserProgress } from './progress';

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
  let completed = await getCompletedPuzzles(username);
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
