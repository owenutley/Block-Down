/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import '../test';
import {
  saveSlideMatchPuzzle,
  getSlideMatchPuzzle,
  recordSlideMatchWin,
  deleteSlideMatchPuzzle,
  recordSlideMatchEndlessRun,
  getSlideMatchEndlessStats,
} from './slideMatch';
import { SlideMatchPuzzle } from '../../shared/types';
import { redis } from '@devvit/web/server';

vi.mock('@devvit/web/server', () => ({
  redis: {
    set: vi.fn(),
    get: vi.fn(),
    del: vi.fn(),
  },
}));

const createTestSlideMatchPuzzle = (id: string, difficulty: any = 'easy'): SlideMatchPuzzle => ({
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

describe('Slide Match Server Storage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('saves a puzzle with automatically computed par', async () => {
    const puzzle = createTestSlideMatchPuzzle('sm-test-1', 'easy');
    (redis.get as any).mockResolvedValueOnce(null);
    (redis.set as any).mockResolvedValue(undefined);

    const saved = await saveSlideMatchPuzzle(puzzle);
    expect(saved.par).toBe(1);
    expect(redis.set).toHaveBeenCalledWith(
      'slidematch:puzzle:sm-test-1',
      expect.stringContaining('"id":"sm-test-1"')
    );
    expect(redis.set).toHaveBeenCalledWith(
      'slidematch:puzzles:easy',
      JSON.stringify(['sm-test-1'])
    );
  });

  it('retrieves puzzle by id', async () => {
    const puzzle = createTestSlideMatchPuzzle('sm-test-1', 'easy');
    (redis.get as any).mockResolvedValueOnce(JSON.stringify(puzzle));

    const result = await getSlideMatchPuzzle('sm-test-1');
    expect(result?.id).toBe('sm-test-1');
  });

  it('deletes a puzzle and cleans up difficulty index', async () => {
    const puzzle = createTestSlideMatchPuzzle('sm-test-1', 'easy');
    (redis.get as any)
      .mockResolvedValueOnce(JSON.stringify(puzzle)) // getSlideMatchPuzzle
      .mockResolvedValueOnce(JSON.stringify(['sm-test-1', 'sm-test-2'])); // get difficulty index

    const success = await deleteSlideMatchPuzzle('sm-test-1');
    expect(success).toBe(true);
    expect(redis.del).toHaveBeenCalledWith('slidematch:puzzle:sm-test-1');
    expect(redis.set).toHaveBeenCalledWith('slidematch:puzzles:easy', JSON.stringify(['sm-test-2']));
  });

  it('records user win with correct stars and progress', async () => {
    const puzzle = createTestSlideMatchPuzzle('sm-test-1', 'easy');
    puzzle.par = 2;

    (redis.get as any)
      .mockResolvedValueOnce(JSON.stringify(puzzle)) // getSlideMatchPuzzle in recordSlideMatchWin
      .mockResolvedValueOnce(JSON.stringify([])) // progress completedIds
      .mockResolvedValueOnce(JSON.stringify({})) // stars
      .mockResolvedValueOnce(JSON.stringify({})); // bestSlides

    const winResult = await recordSlideMatchWin('testuser', 'sm-test-1', 2);
    expect(winResult.starsEarned).toBe(3);
    expect(winResult.isNewCompletion).toBe(true);
    expect(winResult.progress.completedIds).toContain('sm-test-1');
    expect(winResult.progress.stars['sm-test-1']).toBe(3);
    expect(winResult.progress.bestSlides['sm-test-1']).toBe(2);
  });

  it('awards shards on first daily endless run and skips shards on second run today', async () => {
    const today = new Date().toISOString().split('T')[0] || '';

    // First run: no prior reward date
    (redis.get as any)
      .mockResolvedValueOnce(JSON.stringify({ highScore: 0, highestStage: 0, totalRuns: 0, totalPuzzlesSolved: 0 })) // ENDLESS_STATS
      .mockResolvedValueOnce(null) // ENDLESS_LAST_REWARD_DATE (eligible)
      .mockResolvedValueOnce('50'); // getUserCurrency

    const run1 = await recordSlideMatchEndlessRun('player1', 1200, 3);
    expect(run1.dailyRewardGranted).toBe(true);
    expect(run1.dailyRewardAlreadyClaimed).toBe(false);
    expect(run1.shardsEarned).toBeGreaterThan(0); // 3*5 + 10 + 25 = 50
    expect(redis.set).toHaveBeenCalledWith(
      'slidematch:endless_last_reward_date:player1',
      today
    );

    // Second run today: already claimed
    (redis.get as any)
      .mockResolvedValueOnce(JSON.stringify({ highScore: 1200, highestStage: 3, totalRuns: 1, totalPuzzlesSolved: 3 })) // ENDLESS_STATS
      .mockResolvedValueOnce(today); // ENDLESS_LAST_REWARD_DATE (already today)

    const run2 = await recordSlideMatchEndlessRun('player1', 1500, 4);
    expect(run2.dailyRewardGranted).toBe(false);
    expect(run2.dailyRewardAlreadyClaimed).toBe(true);
    expect(run2.shardsEarned).toBe(0);
  });

  it('correctly calculates dailyRewardAvailable in getSlideMatchEndlessStats', async () => {
    const today = new Date().toISOString().split('T')[0] || '';

    // Eligible (no reward date)
    (redis.get as any)
      .mockResolvedValueOnce(JSON.stringify({ highScore: 500, highestStage: 2, totalRuns: 1, totalPuzzlesSolved: 2 }))
      .mockResolvedValueOnce(null);

    const stats1 = await getSlideMatchEndlessStats('player1');
    expect(stats1.dailyRewardAvailable).toBe(true);

    // Ineligible (already claimed today)
    (redis.get as any)
      .mockResolvedValueOnce(JSON.stringify({ highScore: 500, highestStage: 2, totalRuns: 1, totalPuzzlesSolved: 2 }))
      .mockResolvedValueOnce(today);

    const stats2 = await getSlideMatchEndlessStats('player1');
    expect(stats2.dailyRewardAvailable).toBe(false);
  });
});
