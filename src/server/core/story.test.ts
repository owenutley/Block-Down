import { expect } from 'vitest';
import { test } from '../test';
import {
  getUserStoryProgress,
  saveUserStoryProgress,
  recordChamberCompletion,
  getStoryChamberPuzzle,
} from './story';

test('Story Mode: retrieves default progress for new user', async () => {
  const username = 'new_grid_walker';
  const progress = await getUserStoryProgress(username);
  expect(progress.currentChapter).toBe(1);
  expect(progress.currentChamber).toBe(1);
  expect(progress.completedChambers).toEqual([]);
  expect(progress.chamberStars).toEqual({});
  expect(progress.unlockedLore).toContain('ch1_intro');
});

test('Story Mode: records chamber completion and advances chamber', async () => {
  const username = 'hero_walker';
  const { progress } = await recordChamberCompletion(username, 1, 1, 3);

  expect(progress.completedChambers).toContain('ch1_1');
  expect(progress.chamberStars['ch1_1']).toBe(3);
  expect(progress.currentChapter).toBe(1);
  expect(progress.currentChamber).toBe(2); // Advanced to chamber 2
});

test('Story Mode: milestone completion unlocks lore and advances chapter', async () => {
  const username = 'speedy_walker';
  // Fast-forward user to Chapter 1 Chamber 10
  await saveUserStoryProgress(username, {
    currentChapter: 1,
    currentChamber: 10,
    completedChambers: ['ch1_1', 'ch1_2', 'ch1_3', 'ch1_4', 'ch1_5', 'ch1_6', 'ch1_7', 'ch1_8', 'ch1_9'],
    chamberStars: {},
    unlockedLore: ['ch1_intro', 'ch1_mid'],
    unlockedRewards: [],
  });

  const { progress, newReward } = await recordChamberCompletion(username, 1, 10, 3);

  expect(progress.completedChambers).toContain('ch1_10');
  expect(progress.unlockedLore).toContain('ch1_boss');
  expect(progress.currentChapter).toBe(2); // Advanced to Chapter 2!
  expect(progress.currentChamber).toBe(1); // Reset to Chamber 1 of Chapter 2
  expect(newReward).toBeDefined();
  expect(newReward?.id).toBe('echo_bot');
});

test('Story Mode: loads curated chamber with guaranteed clear aisle and spawn', async () => {
  const puzzle = await getStoryChamberPuzzle(1, 1);
  expect(puzzle).not.toBeNull();
  expect(puzzle?.id).toBe('story_ch1_1');
  expect(puzzle?.player).toEqual({ x: 4, y: 8 });
  expect(puzzle?.theme).toBe('neon');
});


