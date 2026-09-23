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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return { username, id: `id_${username}` } as any;
  });
  vi.spyOn(reddit, 'submitComment').mockImplementation(async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

test('getPostIdForPuzzle should resolve community stage post and return null for campaign stages', async () => {
  const { getPostIdForPuzzle } = await import('./post');

  // 1. Direct reverse mapping for community puzzle
  const communityPuzzleId = 'custom-stage-123';
  await redis.set(`puzzle_post:${communityPuzzleId}`, 't3_community_post_99');
  const resolvedDirect = await getPostIdForPuzzle(communityPuzzleId);
  expect(resolvedDirect).toBe('t3_community_post_99');

  // 2. Fallback to puzzle.postId
  const communityWithPostId = 'custom-stage-456';
  await createPuzzle({
    id: communityWithPostId,
    name: 'Player Stage 456',
    difficulty: 'custom',
    width: 9,
    height: 9,
    player: { x: 0, y: 0 },
    walls: [],
    blocks: [],
    targets: [],
    createdAt: Date.now(),
    postId: 't3_player_post_88',
  });
  const resolvedFromPuzzle = await getPostIdForPuzzle(communityWithPostId);
  expect(resolvedFromPuzzle).toBe('t3_player_post_88');
  // Check that it cached reverse mapping
  expect(await redis.get(`puzzle_post:${communityWithPostId}`)).toBe('t3_player_post_88');

  // 3. Daily puzzle via date_post
  const dailyDate = '2026-11-15';
  const dailyPuzzleId = `daily-${dailyDate}`;
  await redis.set(`date_post:${dailyDate}`, 't3_daily_post_1115');
  const resolvedDaily = await getPostIdForPuzzle(dailyPuzzleId);
  expect(resolvedDaily).toBe('t3_daily_post_1115');

  // 4. Campaign stages must return null
  const campaignPuzzleId = 'easy-stage-5';
  await createPuzzle({
    id: campaignPuzzleId,
    name: 'Easy 5',
    difficulty: 'easy',
    width: 9,
    height: 9,
    player: { x: 0, y: 0 },
    walls: [],
    blocks: [],
    targets: [],
    createdAt: Date.now(),
  });
  const resolvedCampaign = await getPostIdForPuzzle(campaignPuzzleId);
  expect(resolvedCampaign).toBeNull();

  // 5. Tutorial stage must return null
  const tutorialPuzzleId = 'tutorial-stage-1';
  await createPuzzle({
    id: tutorialPuzzleId,
    name: 'Tutorial 1',
    difficulty: 'tutorial',
    width: 9,
    height: 9,
    player: { x: 0, y: 0 },
    walls: [],
    blocks: [],
    targets: [],
    createdAt: Date.now(),
  });
  const resolvedTutorial = await getPostIdForPuzzle(tutorialPuzzleId);
  expect(resolvedTutorial).toBeNull();
});

test('getPostIdForPuzzle resolves to the most recent accurate puzzle post when repeated', async () => {
  const { getPostIdForPuzzle } = await import('./post');

  const repeatedPuzzleId = 'daily-repeat-stage-42';
  await createPuzzle({
    id: repeatedPuzzleId,
    name: 'Repeated Daily Challenge',
    difficulty: 'daily',
    width: 9,
    height: 9,
    player: { x: 0, y: 0 },
    walls: [],
    blocks: [],
    targets: [],
    createdAt: Date.now() - 1000000,
    postId: 't3_orig_post_1',
  });

  // Post #1 was the original post for this puzzle
  await redis.set('post_puzzle:t3_orig_post_1', repeatedPuzzleId);
  await redis.set('number_post:1', 't3_orig_post_1');
  await redis.set('post_number:t3_orig_post_1', '1');

  // Post #25 is a later daily post that reused this puzzle due to repeat functionality
  await redis.set('post_puzzle:t3_recent_post_25', repeatedPuzzleId);
  await redis.set('number_post:25', 't3_recent_post_25');
  await redis.set('post_number:t3_recent_post_25', '25');

  // puzzle_post is mapped to the most recent post (t3_recent_post_25)
  await redis.set(`puzzle_post:${repeatedPuzzleId}`, 't3_recent_post_25');

  // Without puzzleNumber, it resolves to the most recent accurate post (Post #25)
  const mostRecent = await getPostIdForPuzzle(repeatedPuzzleId);
  expect(mostRecent).toBe('t3_recent_post_25');

  // When puzzleNumber 1 is explicitly passed, it resolves to Post #1
  const originalPost = await getPostIdForPuzzle(repeatedPuzzleId, 1);
  expect(originalPost).toBe('t3_orig_post_1');

  // When puzzleNumber 25 is explicitly passed, it resolves to Post #25
  const explicitRecent = await getPostIdForPuzzle(repeatedPuzzleId, 25);
  expect(explicitRecent).toBe('t3_recent_post_25');
});

