import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createPuzzle,
  getPuzzle,
  getPuzzlesByDifficulty,
  assignDailyPuzzle,
  getCurrentDailyPuzzle,
  getUpcomingPuzzles,
  updatePuzzleStats,
  initializeSamplePuzzles,
} from './puzzle';
import { Puzzle } from '../../shared/types';
import { redis } from '@devvit/web/server';

// Mock redis module
vi.mock('@devvit/web/server', () => ({
  redis: {
    set: vi.fn(),
    get: vi.fn(),
    del: vi.fn(),
  },
}));

const createTestPuzzle = (id: string, difficulty: any = 'easy'): Puzzle => ({
  id,
  name: `Test Puzzle ${id}`,
  difficulty,
  width: 5,
  height: 5,
  player: { x: 1, y: 1 },
  walls: [{ x: 0, y: 0 }],
  blocks: [{ id: 'b1', color: 'red', x: 2, y: 2 }],
  targets: [{ id: 't1', color: 'red', x: 3, y: 2 }],
  createdAt: Date.now(),
});

describe('Puzzle Database Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createPuzzle', () => {
    it('should create a puzzle and store it in Redis', async () => {
      const puzzle = createTestPuzzle('test-1', 'easy');

      // Mock the get call for the difficulty index (returns null initially)
      (redis.get as any).mockResolvedValueOnce(null);
      // Mock the set calls
      (redis.set as any).mockResolvedValue(undefined);

      await createPuzzle(puzzle);

      // Verify puzzle was stored
      expect(redis.set).toHaveBeenCalledWith('puzzle:test-1', JSON.stringify(puzzle));
      // Verify difficulty index was updated
      expect(redis.set).toHaveBeenCalledWith('puzzles:easy', JSON.stringify(['test-1']));
    });
  });

  describe('getPuzzle', () => {
    it('should retrieve a puzzle by ID', async () => {
      const puzzle = createTestPuzzle('test-1', 'medium');

      (redis.get as any).mockResolvedValueOnce(JSON.stringify(puzzle));

      const result = await getPuzzle('test-1');

      expect(redis.get).toHaveBeenCalledWith('puzzle:test-1');
      expect(result).toEqual(puzzle);
    });

    it('should return null if puzzle does not exist', async () => {
      (redis.get as any).mockResolvedValueOnce(null);

      const result = await getPuzzle('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getPuzzlesByDifficulty', () => {
    it('should retrieve all puzzles of a specific difficulty', async () => {
      const ids = ['tutorial-1', 'tutorial-2'];
      const puzzles: Puzzle[] = [
        createTestPuzzle('tutorial-1', 'tutorial'),
        createTestPuzzle('tutorial-2', 'tutorial'),
      ];

      // Mock the difficulty index retrieval
      (redis.get as any).mockResolvedValueOnce(JSON.stringify(ids));
      // Mock puzzle retrievals
      (redis.get as any).mockResolvedValueOnce(JSON.stringify(puzzles[0]));
      (redis.get as any).mockResolvedValueOnce(JSON.stringify(puzzles[1]));

      const result = await getPuzzlesByDifficulty('tutorial');

      expect(redis.get).toHaveBeenCalledWith('puzzles:tutorial');
      expect(result).toEqual(puzzles);
    });
  });

  describe('assignDailyPuzzle', () => {
    it('should assign a puzzle as the daily puzzle', async () => {
      const puzzle = createTestPuzzle('daily-1', 'medium');

      (redis.get as any).mockResolvedValueOnce(JSON.stringify(puzzle));
      (redis.set as any).mockResolvedValue(undefined);

      const today = new Date().toISOString().split('T')[0];
      const result = await assignDailyPuzzle('daily-1', today);

      expect(result.puzzleId).toBe('daily-1');
      expect(result.date).toBe(today);
      expect(result.difficulty).toBe('medium');
    });
  });

  describe('getCurrentDailyPuzzle', () => {
    it('should retrieve the current daily puzzle with full puzzle data', async () => {
      const today = new Date().toISOString().split('T')[0];
      const dailyData = {
        date: today,
        puzzleId: 'daily-1',
        difficulty: 'medium' as const,
        assignedAt: Date.now(),
      };

      const puzzle = createTestPuzzle('daily-1', 'medium');

      (redis.get as any)
        .mockResolvedValueOnce(JSON.stringify(dailyData))
        .mockResolvedValueOnce(JSON.stringify(puzzle));

      const result = await getCurrentDailyPuzzle();

      expect(result).toEqual({ ...dailyData, puzzle });
    });
  });

  describe('getUpcomingPuzzles', () => {
    it('should retrieve upcoming puzzles from the queue', async () => {
      const ids = ['upcoming-1', 'upcoming-2', 'upcoming-3'];
      const puzzles: Puzzle[] = [
        createTestPuzzle('upcoming-1', 'easy'),
        createTestPuzzle('upcoming-2', 'medium'),
        createTestPuzzle('upcoming-3', 'hard'),
      ];

      (redis.get as any).mockResolvedValueOnce(JSON.stringify(ids));
      (redis.get as any)
        .mockResolvedValueOnce(JSON.stringify(puzzles[0]))
        .mockResolvedValueOnce(JSON.stringify(puzzles[1]))
        .mockResolvedValueOnce(JSON.stringify(puzzles[2]));

      const result = await getUpcomingPuzzles(3);

      expect(redis.get).toHaveBeenCalledWith('upcoming:puzzles');
      expect(result).toEqual(puzzles);
    });
  });

  describe('updatePuzzleStats', () => {
    it('should update puzzle statistics', async () => {
      (redis.get as any).mockResolvedValueOnce(null); // No existing stats

      await updatePuzzleStats('test-1', {
        attempts: 5,
        completions: 2,
        scores: [50, 60, 70],
      });

      expect(redis.set).toHaveBeenCalled();
      const callArgs = (redis.set as any).mock.calls[0];
      expect(callArgs[0]).toBe('stats:test-1');

      const stats = JSON.parse(callArgs[1]);
      expect(stats.totalAttempts).toBe(5);
      expect(stats.totalCompletions).toBe(2);
      expect(stats.averageScore).toBe(60);
      expect(stats.bestScore).toBe(70);
    });
  });

  describe('initializeSamplePuzzles', () => {
    it('should initialize sample puzzles of all difficulties', async () => {
      (redis.get as any).mockResolvedValue(null); // Empty difficulty lists
      (redis.set as any).mockResolvedValue(undefined);

      await initializeSamplePuzzles();

      // Verify set was called for each puzzle
      expect(redis.set).toHaveBeenCalled();

      // Verify difficulty indices were created
      const setCalls = (redis.set as any).mock.calls;
      const hasAllDifficulties = setCalls.some((call: any[]) =>
        call[0].includes('tutorial')
      ) &&
        setCalls.some((call: any[]) => call[0].includes('easy')) &&
        setCalls.some((call: any[]) => call[0].includes('medium')) &&
        setCalls.some((call: any[]) => call[0].includes('hard'));

      expect(hasAllDifficulties).toBe(true);
    });
  });
});
