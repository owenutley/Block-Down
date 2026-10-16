import { expect } from 'vitest';
import { test } from '../test';
import {
  saveSlideMatchPuzzle,
  getSlideMatchPuzzle,
  recordSlideMatchWin,
  deleteSlideMatchPuzzle,
  recordSlideMatchEndlessRun,
  getSlideMatchEndlessStats,
  getSlideMatchLeaderboard,
  updateSlideMatchLeaderboard,
} from './slideMatch';
import { SlideMatchPuzzle, SlideMatchDifficulty } from '../../shared/types';

const createTestSlideMatchPuzzle = (id: string, difficulty: SlideMatchDifficulty = 'easy'): SlideMatchPuzzle => ({
  id,
  name: `Test Stage ${id}`,
  difficulty,
  width: 5,
  height: 5,
  walls: [{ x: 4, y: 1 }],
  blocks: [{ id: 'b1', color: 'red', x: 0, y: 0 }],
  targets: [{ id: 't1', color: 'red', x: 4, y: 0 }],
  portals: [],
  createdAt: 1000,
});

test('saves a puzzle with automatically computed par', async () => {
  const puzzle = createTestSlideMatchPuzzle('sm-test-1', 'easy');
  const saved = await saveSlideMatchPuzzle(puzzle);
  expect(saved.par).toBe(1);
  const fetched = await getSlideMatchPuzzle('sm-test-1');
  expect(fetched?.id).toBe('sm-test-1');
});

test('retrieves puzzle by id', async () => {
  const puzzle = createTestSlideMatchPuzzle('sm-test-fetch', 'easy');
  await saveSlideMatchPuzzle(puzzle);
  const result = await getSlideMatchPuzzle('sm-test-fetch');
  expect(result?.id).toBe('sm-test-fetch');
});

test('deletes a puzzle and cleans up difficulty index', async () => {
  const puzzle = createTestSlideMatchPuzzle('sm-test-del', 'easy');
  await saveSlideMatchPuzzle(puzzle);
  const success = await deleteSlideMatchPuzzle('sm-test-del');
  expect(success).toBe(true);
  const fetched = await getSlideMatchPuzzle('sm-test-del');
  expect(fetched).toBeNull();
});

test('records user win with correct stars and progress', async () => {
  const puzzle = createTestSlideMatchPuzzle('sm-test-win', 'easy');
  puzzle.par = 2;
  await saveSlideMatchPuzzle(puzzle);

  const winResult = await recordSlideMatchWin('testuser', 'sm-test-win', 2);
  expect(winResult.starsEarned).toBe(3);
  expect(winResult.isNewCompletion).toBe(true);
  expect(winResult.progress.completedIds).toContain('sm-test-win');
  expect(winResult.progress.stars['sm-test-win']).toBe(3);
  expect(winResult.progress.bestSlides['sm-test-win']).toBe(2);
});

test('awards shards on first daily endless run and locks Speed Rush on second run today', async () => {
  const username = 'speed-runner-1';

  // First run: eligible
  const run1 = await recordSlideMatchEndlessRun(username, 1200, 3);
  expect(run1.dailyRewardGranted).toBe(true);
  expect(run1.dailyRewardAlreadyClaimed).toBe(false);
  expect(run1.shardsEarned).toBeGreaterThan(0);
  expect(run1.stats.highScore).toBe(1200);

  // Second run today: locked / already claimed
  const run2 = await recordSlideMatchEndlessRun(username, 1500, 4);
  expect(run2.dailyRewardGranted).toBe(false);
  expect(run2.dailyRewardAlreadyClaimed).toBe(true);
  expect(run2.shardsEarned).toBe(0);
  // Stats remain locked from first run
  expect(run2.stats.highScore).toBe(1200);
});

test('correctly calculates dailyRewardAvailable in getSlideMatchEndlessStats', async () => {
  const username = 'stats-tester';
  const initial = await getSlideMatchEndlessStats(username);
  expect(initial.dailyRewardAvailable).toBe(true);

  // Play a run
  await recordSlideMatchEndlessRun(username, 800, 2);

  const updated = await getSlideMatchEndlessStats(username);
  expect(updated.dailyRewardAvailable).toBe(false);
});

test('updates and retrieves Slide Match all-time leaderboard', async () => {
  await updateSlideMatchLeaderboard({ username: 'runnerUp', score: 1500, highestStage: 4 });
  await updateSlideMatchLeaderboard({ username: 'champion', score: 3000, highestStage: 8 });

  const board = await getSlideMatchLeaderboard('runnerUp');
  expect(board.entries.length).toBeGreaterThanOrEqual(2);
  expect(board.entries[0]?.username).toBe('champion');
  expect(board.entries[0]?.rank).toBe(1);
  expect(board.entries[1]?.username).toBe('runnerUp');
  expect(board.entries[1]?.rank).toBe(2);
  expect(board.userEntry?.username).toBe('runnerUp');
  expect(board.userEntry?.rank).toBe(2);
});
