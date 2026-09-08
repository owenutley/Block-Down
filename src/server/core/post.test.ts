import { expect, vi } from 'vitest';
import { test } from '../test';
import { redis, reddit } from '@devvit/web/server';
import { assignDailyPuzzle, createPuzzle } from './puzzle';
import { finalizePreviousDailyLeaderboards } from './post';
import { getUserPodiums } from './progress';

test('Should finalize past daily leaderboards and award top 3 podium wins', async () => {
  const today = new Date();
  const pastDateObj = new Date(today);
  pastDateObj.setDate(pastDateObj.getDate() - 1);
  const pastDate = pastDateObj.toISOString().split('T')[0] || '';

  const puzzleId = `daily-${pastDate}`;
  await createPuzzle({
    id: puzzleId,
    name: 'Past Daily Test',
    difficulty: 'daily',
    width: 9,
    height: 9,
    player: { x: 0, y: 0 },
    walls: [],
    blocks: [],
    targets: [],
    createdAt: Date.now(),
  });

  await assignDailyPuzzle(puzzleId, pastDate);

  // Set mock post mapping
  const postId = `t3_test_${pastDate}`;
  await redis.set(`date_post:${pastDate}`, postId);
  await redis.set(`post_number:${postId}`, '42');

  // Directly set leaderboard JSON in Redis to bypass getUserByUsername checks in unit test harness
  const mockLeaderboard = [
    { username: 'alice', score: 3, solveTime: 12, moveCount: 5, timestamp: Date.now() },
    { username: 'bob', score: 4, solveTime: 15, moveCount: 7, timestamp: Date.now() },
    { username: 'charlie', score: 5, solveTime: 20, moveCount: 9, timestamp: Date.now() },
  ];
  await redis.set(`leaderboard:${puzzleId}`, JSON.stringify(mockLeaderboard));

  // Mock reddit.getUserByUsername & reddit.submitComment to avoid devvit mock errors
  vi.spyOn(reddit, 'getUserByUsername').mockImplementation(async (username: string) => {
    return { username, id: `id_${username}` } as any;
  });
  vi.spyOn(reddit, 'submitComment').mockImplementation(async () => {
    return { id: 't1_comment', distinguish: async () => {} } as any;
  });

  // Run finalization
  await finalizePreviousDailyLeaderboards();

  // Verify podium awards
  const alicePodium = await getUserPodiums('alice');
  const bobPodium = await getUserPodiums('bob');
  const charliePodium = await getUserPodiums('charlie');

  expect(alicePodium.firstPlace).toBe(1);
  expect(bobPodium.secondPlace).toBe(1);
  expect(charliePodium.thirdPlace).toBe(1);

  // Verify marked finalized
  const isFinalized = await redis.get(`podium_finalized:${pastDate}`);
  expect(isFinalized).toBe('true');
});
