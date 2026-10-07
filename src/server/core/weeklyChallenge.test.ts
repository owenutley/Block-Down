import { expect, vi } from 'vitest';
import { test } from '../test';
import {
  getWeeklyCycleTiming,
  calculateDynamicDifficulty,
  canUserPublishWeeklyPuzzle,
  registerWeeklyChallengeEntry,
  recordWeeklyPuzzlePlay,
  getWeeklyChallengeData,
  finalizeWeeklyChallenge,
  getUserWeeklyAwards,
  claimPendingWeeklyReward,
} from './weeklyChallenge';
import { redis } from '@devvit/web/server';
import { getPuzzle } from './puzzle';
import { addUserCurrency } from './progress';
import { Puzzle, WeeklyWinnerAward } from '../../shared/types';

vi.mock('./puzzle', () => ({
  getPuzzle: vi.fn(),
}));

vi.mock('./progress', () => ({
  getUserCurrency: vi.fn().mockResolvedValue(100),
  addUserCurrency: vi.fn().mockResolvedValue(600),
}));

const createMockPuzzle = (id: string, name: string, author: string, par = 6): Puzzle => ({
  id,
  name,
  difficulty: 'custom',
  width: 9,
  height: 9,
  player: { x: 0, y: 0 },
  walls: [],
  blocks: [
    { id: 'b1', color: 'red', x: 1, y: 1 },
    { id: 'b2', color: 'blue', x: 2, y: 2 },
  ],
  targets: [
    { id: 't1', color: 'red', x: 3, y: 3 },
    { id: 't2', color: 'blue', x: 4, y: 4 },
  ],
  portals: [],
  createdAt: 1000,
  author,
  par,
});

test('getWeeklyCycleTiming calculates active week and next week cycles correctly', () => {
  // 2026-10-04 is a Sunday at 12:00 UTC (week 2026-10-04 active, next week is 2026-10-11)
  const sundayMidday = new Date(Date.UTC(2026, 9, 4, 12, 0, 0));
  const timingSunday = getWeeklyCycleTiming(sundayMidday);

  expect(timingSunday.weekId).toBe('week-2026-10-04');
  expect(timingSunday.nextWeekId).toBe('week-2026-10-11');
  expect(timingSunday.phase).toBe('active');
  expect(timingSunday.timeRemainingMs).toBeGreaterThan(0);

  // 2026-10-07 is a Wednesday at 12:00 UTC (still active in the same week cycle)
  const wednesdayMidday = new Date(Date.UTC(2026, 9, 7, 12, 0, 0));
  const timingWed = getWeeklyCycleTiming(wednesdayMidday);

  expect(timingWed.weekId).toBe('week-2026-10-04');
  expect(timingWed.nextWeekId).toBe('week-2026-10-11');
  expect(timingWed.phase).toBe('active');
});

test('calculateDynamicDifficulty returns high difficulty for unplayed and lowers when solved easily', () => {
  const puzzle = { par: 6, blocks: [1, 2, 3], portals: [1, 2] };

  const { difficultyScore } = calculateDynamicDifficulty(puzzle, null);
  expect(difficultyScore).toBeGreaterThan(50);

  const statsLowSolves = {
    attempts: 10,
    solves: 1,
    totalPushes: 15,
    totalTimeMs: 45000,
    uniquePlayers: ['u1'],
  };
  const statsHighSolves = {
    attempts: 10,
    solves: 9,
    totalPushes: 54,
    totalTimeMs: 15000,
    uniquePlayers: ['u1', 'u2'],
  };

  const hardDiff = calculateDynamicDifficulty(puzzle, statsLowSolves).difficultyScore;
  const easyDiff = calculateDynamicDifficulty(puzzle, statsHighSolves).difficultyScore;

  expect(easyDiff).toBeLessThan(hardDiff);
});

test('canUserPublishWeeklyPuzzle and registerWeeklyChallengeEntry enforce 1 puzzle per week entering next week competition', async () => {
  const now = new Date(Date.UTC(2026, 9, 4, 12, 0, 0));
  const mockP1 = createMockPuzzle('p1', 'Alice Level 1', 'alice');

  // 1. Initial check: can publish
  const statusBefore = await canUserPublishWeeklyPuzzle('alice', now);
  expect(statusBefore.canPublish).toBe(true);
  expect(statusBefore.nextWeekId).toBe('week-2026-10-11');

  // 2. Register first puzzle: enters next week's competition
  const registered = await registerWeeklyChallengeEntry('alice', 'p1', mockP1, now);
  expect(registered).toBe(true);

  // Verify next week's pool in Redis
  expect(await redis.get('weekly:week-2026-10-11:user:alice')).toBe('p1');
  const nextPuzzles = JSON.parse((await redis.get('weekly:week-2026-10-11:puzzles')) || '[]');
  expect(nextPuzzles).toContain('p1');

  // 3. Check status: cannot publish again this week
  const statusAfter = await canUserPublishWeeklyPuzzle('alice', now);
  expect(statusAfter.canPublish).toBe(false);
  expect(statusAfter.publishedPuzzleId).toBe('p1');

  // 4. Second attempt in same week should be rejected
  const secondAttempt = await registerWeeklyChallengeEntry(
    'alice',
    'p2',
    createMockPuzzle('p2', 'Alice Level 2', 'alice'),
    now
  );
  expect(secondAttempt).toBe(false);

  // 5. In the following week, user should be able to post a new puzzle for the week after that
  const nextWeekDate = new Date(Date.UTC(2026, 9, 11, 14, 0, 0));
  const nextWeekStatus = await canUserPublishWeeklyPuzzle('alice', nextWeekDate);
  expect(nextWeekStatus.canPublish).toBe(true);
  expect(nextWeekStatus.nextWeekId).toBe('week-2026-10-18');
});

test('recordWeeklyPuzzlePlay increments attempts, solves, pushes, and unique players in active week', async () => {
  const now = new Date(Date.UTC(2026, 9, 6, 12, 0, 0));
  const existingStats = {
    attempts: 2,
    solves: 1,
    totalPushes: 6,
    totalTimeMs: 10000,
    uniquePlayers: ['player1'],
  };
  await redis.set('weekly:week-2026-10-04:stats:p1', JSON.stringify(existingStats));

  await recordWeeklyPuzzlePlay('p1', true, 5, 8000, 'player2', now);

  const updatedRaw = await redis.get('weekly:week-2026-10-04:stats:p1');
  expect(updatedRaw).toBeDefined();
  const updated = JSON.parse(updatedRaw!);
  expect(updated.attempts).toBe(3);
  expect(updated.solves).toBe(2);
  expect(updated.totalPushes).toBe(11);
  expect(updated.totalTimeMs).toBe(18000);
  expect(updated.uniquePlayers).toEqual(['player1', 'player2']);
});

test('getWeeklyChallengeData sorts by lowest solve rate, puts unplayed puzzles at #1, and breaks ties by later entry', async () => {
  const now = new Date(Date.UTC(2026, 9, 6, 12, 0, 0));
  
  // 3 Puzzles in active week:
  // p_early_unplayed: 0 attempts, 0 solves (0% solve rate, created at 1000)
  // p_late_unplayed: 0 attempts, 0 solves (0% solve rate, created at 2000 -> should rank higher than p_early_unplayed)
  // p_solved: 2 attempts, 1 solve (50% solve rate, created at 3000 -> should drop below 0% solve rate puzzles)
  // p_easy: 5 attempts, 5 solves (100% solve rate, created at 4000)
  await redis.set('weekly:week-2026-10-04:puzzles', JSON.stringify(['p_early_unplayed', 'p_late_unplayed', 'p_solved', 'p_easy']));
  
  await redis.set('weekly:week-2026-10-04:stats:p_early_unplayed', JSON.stringify({ attempts: 0, solves: 0, totalPushes: 0, totalTimeMs: 0, uniquePlayers: [] }));
  await redis.set('weekly:week-2026-10-04:stats:p_late_unplayed', JSON.stringify({ attempts: 0, solves: 0, totalPushes: 0, totalTimeMs: 0, uniquePlayers: [] }));
  await redis.set('weekly:week-2026-10-04:stats:p_solved', JSON.stringify({ attempts: 2, solves: 1, totalPushes: 10, totalTimeMs: 20000, uniquePlayers: [] }));
  await redis.set('weekly:week-2026-10-04:stats:p_easy', JSON.stringify({ attempts: 5, solves: 5, totalPushes: 20, totalTimeMs: 20000, uniquePlayers: [] }));

  // Alice published next week puzzle
  await redis.set('weekly:week-2026-10-04:author:alice', 'next_p1');

  vi.mocked(getPuzzle).mockImplementation((id: string) => {
    if (id === 'p_early_unplayed') return Promise.resolve({ ...createMockPuzzle('p_early_unplayed', 'Early Unplayed', 'alice'), createdAt: 1000 });
    if (id === 'p_late_unplayed') return Promise.resolve({ ...createMockPuzzle('p_late_unplayed', 'Late Unplayed', 'bob'), createdAt: 2000 });
    if (id === 'p_solved') return Promise.resolve({ ...createMockPuzzle('p_solved', 'Solved Level', 'carol'), createdAt: 3000 });
    if (id === 'p_easy') return Promise.resolve({ ...createMockPuzzle('p_easy', 'Easy Level', 'dan'), createdAt: 4000 });
    if (id === 'next_p1') return Promise.resolve(createMockPuzzle('next_p1', 'Alice Future Masterpiece', 'alice'));
    return Promise.resolve(null);
  });

  const data = await getWeeklyChallengeData('alice', now);
  expect(data.weekId).toBe('week-2026-10-04');
  expect(data.leaderboard.length).toBe(4);

  // #1: Late Unplayed (0% solve rate, later createdAt 2000)
  expect(data.leaderboard[0]?.puzzleId).toBe('p_late_unplayed');
  expect(data.leaderboard[0]?.rank).toBe(1);
  expect(data.leaderboard[0]?.potentialReward).toBe(500);

  // #2: Early Unplayed (0% solve rate, earlier createdAt 1000)
  expect(data.leaderboard[1]?.puzzleId).toBe('p_early_unplayed');
  expect(data.leaderboard[1]?.rank).toBe(2);
  expect(data.leaderboard[1]?.potentialReward).toBe(250);

  // #3: Solved Level (50% solve rate)
  expect(data.leaderboard[2]?.puzzleId).toBe('p_solved');
  expect(data.leaderboard[2]?.rank).toBe(3);
  expect(data.leaderboard[2]?.potentialReward).toBe(100);

  // #4: Easy Level (100% solve rate)
  expect(data.leaderboard[3]?.puzzleId).toBe('p_easy');
  expect(data.leaderboard[3]?.rank).toBe(4);
  expect(data.leaderboard[3]?.potentialReward).toBe(0);
});

test('finalizeWeeklyChallenge calculates top 3 winners without requiring minimum plays', async () => {
  const saturdayEnd = new Date(Date.UTC(2026, 9, 10, 23, 0, 0));
  
  // 3 unplayed puzzles entered into competition
  await redis.set('weekly:week-2026-10-04:puzzles', JSON.stringify(['p1', 'p2', 'p3']));
  await redis.set('weekly:week-2026-10-04:stats:p1', JSON.stringify({ attempts: 0, solves: 0, totalPushes: 0, totalTimeMs: 0, uniquePlayers: [] }));
  await redis.set('weekly:week-2026-10-04:stats:p2', JSON.stringify({ attempts: 0, solves: 0, totalPushes: 0, totalTimeMs: 0, uniquePlayers: [] }));
  await redis.set('weekly:week-2026-10-04:stats:p3', JSON.stringify({ attempts: 0, solves: 0, totalPushes: 0, totalTimeMs: 0, uniquePlayers: [] }));

  vi.mocked(getPuzzle).mockImplementation((id: string) => {
    const created = id === 'p1' ? 1000 : id === 'p2' ? 2000 : 3000;
    return Promise.resolve({ ...createMockPuzzle(id, `Puzzle ${id}`, `author_${id}`), createdAt: created });
  });

  const res = await finalizeWeeklyChallenge(saturdayEnd);

  expect(res.winners.length).toBe(3);
  expect(res.winners[0]?.puzzleId).toBe('p3'); // Latest createdAt: 3000
  expect(res.winners[0]?.rank).toBe(1);
  expect(res.winners[0]?.shardReward).toBe(500);

  expect(res.winners[1]?.puzzleId).toBe('p2'); // createdAt: 2000
  expect(res.winners[1]?.shardReward).toBe(250);

  expect(res.winners[2]?.puzzleId).toBe('p1'); // createdAt: 1000
  expect(res.winners[2]?.shardReward).toBe(100);
});

test('getUserWeeklyAwards retrieves lifetime trophies and awards for user profile', async () => {
  const lifetimeAwards: WeeklyWinnerAward[] = [
    {
      weekId: 'week-2026-10-04',
      rank: 1,
      puzzleId: 'p1',
      puzzleName: 'Hard Level',
      shardReward: 500,
      difficultyScore: 92.5,
      dateAwarded: '2026-10-10',
      claimed: true,
    },
  ];
  await redis.set('user:awards:winneruser', JSON.stringify(lifetimeAwards));

  const awardsSummary = await getUserWeeklyAwards('winnerUser');
  expect(awardsSummary.totalAwards).toBe(1);
  expect(awardsSummary.trophies.firstPlace).toBe(1);
  expect(awardsSummary.totalShardsEarned).toBe(500);
});

test('claimPendingWeeklyReward claims pending reward and credits shards to user balance', async () => {
  const pendingReward: WeeklyWinnerAward = {
    weekId: 'week-2026-10-04',
    rank: 1,
    puzzleId: 'p1',
    puzzleName: 'Hard Level',
    shardReward: 500,
    difficultyScore: 92.5,
    dateAwarded: '2026-10-10',
    claimed: false,
  };

  await redis.set('weekly:rewards:pending:winneruser', JSON.stringify([pendingReward]));

  const result = await claimPendingWeeklyReward('winnerUser');

  expect(result.success).toBe(true);
  expect(addUserCurrency).toHaveBeenCalledWith('winneruser', 500);
  expect(result.claimedAward?.shardReward).toBe(500);
});

