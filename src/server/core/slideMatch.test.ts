/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import '../test';
import {
  saveSlideMatchPuzzle,
  getSlideMatchPuzzle,
  recordSlideMatchWin,
  deleteSlideMatchPuzzle,
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
});
