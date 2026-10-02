import { expect, vi } from 'vitest';
import { test } from '../test';
import {
  getWeeklyCycleTiming,
  calculateDynamicDifficulty,
  registerWeeklyChallengeEntry,
  recordWeeklyPuzzlePlay,
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

test('getWeeklyCycleTiming calculates 3-day creation window and 4-day solving battle phase correctly', () => {
  // 2026-10-04 is a Sunday at 12:00 UTC (Creation phase active)
  const sundayMidday = new Date(Date.UTC(2026, 9, 4, 12, 0, 0));
  const timingSunday = getWeeklyCycleTiming(sundayMidday);

  expect(timingSunday.isCreationOpen).toBe(true);
  expect(timingSunday.phase).toBe('creation');

  // 2026-10-07 is a Wednesday at 12:00 UTC (Creation closed, Solving battle phase active)
  const wednesdayMidday = new Date(Date.UTC(2026, 9, 7, 12, 0, 0));
  const timingWed = getWeeklyCycleTiming(wednesdayMidday);

  expect(timingWed.isCreationOpen).toBe(false);
  expect(timingWed.phase).toBe('solving');
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

test('registerWeeklyChallengeEntry registers first puzzle during creation window and rejects second entry or late entry', async () => {
  const sundayTime = new Date(Date.UTC(2026, 9, 4, 12, 0, 0));
  const mockP1 = createMockPuzzle('p1', 'Alice Level', 'alice');

  const registered = await registerWeeklyChallengeEntry(
    'alice',
    'p1',
    mockP1,
    sundayTime
  );

  expect(registered).toBe(true);
  expect(await redis.get('weekly:week-2026-10-04:user:alice')).toBe('p1');

  // Second entry attempt by same author should be rejected
  const secondAttempt = await registerWeeklyChallengeEntry(
    'alice',
    'p2',
    createMockPuzzle('p2', 'Alice Level 2', 'alice'),
    sundayTime
  );
  expect(secondAttempt).toBe(false);

  // Late entry after creation deadline should be rejected
  const thursdayTime = new Date(Date.UTC(2026, 9, 8, 12, 0, 0));
  const lateAttempt = await registerWeeklyChallengeEntry(
    'bob',
    'p_late',
    createMockPuzzle('p_late', 'Late Level', 'bob'),
    thursdayTime
  );
  expect(lateAttempt).toBe(false);
});

test('recordWeeklyPuzzlePlay increments attempts, solves, pushes, and unique players in Redis', async () => {
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

test('finalizeWeeklyChallenge calculates top 3 winners and awards shards based on difficulty ranking', async () => {
  const saturdayEnd = new Date(Date.UTC(2026, 9, 10, 23, 0, 0));
  
  await redis.set('weekly:week-2026-10-04:puzzles', JSON.stringify(['p1', 'p2', 'p3']));
  await redis.set('weekly:week-2026-10-04:stats:p1', JSON.stringify({ attempts: 5, solves: 1, totalPushes: 12, totalTimeMs: 30000, uniquePlayers: [] }));
  await redis.set('weekly:week-2026-10-04:stats:p2', JSON.stringify({ attempts: 5, solves: 2, totalPushes: 10, totalTimeMs: 25000, uniquePlayers: [] }));
  await redis.set('weekly:week-2026-10-04:stats:p3', JSON.stringify({ attempts: 5, solves: 4, totalPushes: 8, totalTimeMs: 15000, uniquePlayers: [] }));

  vi.mocked(getPuzzle).mockImplementation((id: string) => Promise.resolve(createMockPuzzle(id, `Puzzle ${id}`, `author_${id}`)));

  const res = await finalizeWeeklyChallenge(saturdayEnd);

  expect(res.winners.length).toBe(3);
  expect(res.winners[0]?.rank).toBe(1);
  expect(res.winners[0]?.shardReward).toBe(500);
  expect(res.winners[1]?.shardReward).toBe(250);
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
  await redis.set('weekly:awards:winneruser', JSON.stringify(lifetimeAwards));

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

  await redis.set('weekly:awards:winneruser', JSON.stringify([pendingReward]));

  const result = await claimPendingWeeklyReward('winnerUser');

  expect(result.success).toBe(true);
  expect(addUserCurrency).toHaveBeenCalledWith('winneruser', 500);
  expect(result.claimedAward?.shardReward).toBe(500);
});
