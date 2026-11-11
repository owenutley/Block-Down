import { describe, it, expect } from 'vitest';
import { simulateSolutionPushes, calculatePuzzlePar, dirToVector, getSolutionHeaderTitle } from './puzzle';
import { Puzzle } from './types';

describe('Shared Puzzle Par Calculation and Physics', () => {
  it('correctly maps direction names to 2D vectors', () => {
    expect(dirToVector('Up')).toEqual({ x: 0, y: -1 });
    expect(dirToVector('Down')).toEqual({ x: 0, y: 1 });
    expect(dirToVector('Left')).toEqual({ x: -1, y: 0 });
    expect(dirToVector('Right')).toEqual({ x: 1, y: 0 });
  });

  it('calculates par from existing explicit par property', () => {
    const puzzle: Partial<Puzzle> = {
      par: 7,
      playerMoves: ['Up', 'Down'],
    };
    expect(calculatePuzzlePar(puzzle)).toBe(7);
  });

  it('simulates solution pushes when par is not explicitly set', () => {
    const puzzle: Partial<Puzzle> = {
      width: 5,
      height: 5,
      player: { x: 0, y: 1 },
      walls: [{ x: 4, y: 1 }],
      blocks: [{ id: 'b1', color: 'red', x: 1, y: 1 }],
      targets: [{ id: 't1', color: 'red', x: 3, y: 1 }],
      playerMoves: ['Right'], // Player at 0,1 pushes block at 1,1 towards right wall (4,1), block slides to 3,1
    };

    expect(simulateSolutionPushes(puzzle)).toBe(1);
    expect(calculatePuzzlePar(puzzle)).toBe(1);
  });

  it('counts multiple pushes correctly across multiple moves', () => {
    const puzzle: Partial<Puzzle> = {
      width: 6,
      height: 6,
      player: { x: 0, y: 1 },
      walls: [{ x: 5, y: 1 }, { x: 4, y: 5 }],
      blocks: [
        { id: 'b1', color: 'red', x: 1, y: 1 },
        { id: 'b2', color: 'blue', x: 4, y: 2 },
      ],
      playerMoves: [
        'Right', // Push b1 to (4,1)
        'Down',  // Player moves down
        'Right',
        'Right',
        'Right',
        'Down',  // Push b2 from (4,2) to (4,4)
      ],
    };

    const pushes = simulateSolutionPushes(puzzle);
    expect(pushes).toBe(2);
    expect(calculatePuzzlePar(puzzle)).toBe(2);
  });

  it('falls back gracefully to block count heuristic when moves are empty', () => {
    const puzzle: Partial<Puzzle> = {
      blocks: [
        { id: 'b1', color: 'red', x: 1, y: 1 },
        { id: 'b2', color: 'blue', x: 2, y: 2 },
      ],
      playerMoves: [],
    };

    expect(simulateSolutionPushes(puzzle)).toBe(4);
    expect(calculatePuzzlePar(puzzle)).toBe(4);
  });

  describe('getSolutionHeaderTitle', () => {
    it('returns Easy Block Down Solution for 2-tier warm-up daily puzzles', () => {
      expect(
        getSolutionHeaderTitle({
          title: 'Daily #45 Warm-Up',
          puzzleId: 'daily-easy-2026-11-10',
          dailyTier: 'easy',
        })
      ).toBe('Easy Block Down Solution');
    });

    it('returns Hard Block Down Solution for 2-tier main daily challenge puzzles', () => {
      expect(
        getSolutionHeaderTitle({
          title: 'Daily Puzzle #45',
          puzzleId: 'daily-2026-11-10',
          dailyTier: 'standard',
        })
      ).toBe('Hard Block Down Solution');
    });

    it('returns Very Easy for Tier 1 and Easy for Tier 2', () => {
      expect(
        getSolutionHeaderTitle({
          title: 'Daily #165 [Very Easy]',
          dailyTier: 'very-easy',
        })
      ).toBe('Very Easy Block Down Solution');

      expect(
        getSolutionHeaderTitle({
          title: 'Daily #165 [Easy]',
          dailyTier: 'tier_2',
        })
      ).toBe('Easy Block Down Solution');
    });

    it('returns Medium Block Down Solution for 6-tier Tier 3', () => {
      expect(
        getSolutionHeaderTitle({
          title: 'Daily #165 [Medium]',
          dailyTier: 'medium',
        })
      ).toBe('Medium Block Down Solution');
    });

    it('returns distinct headers for each of the 6 difficulty tiers', () => {
      expect(
        getSolutionHeaderTitle({
          title: 'Daily #165 [Very Easy]',
          dailyTier: 'very-easy',
        })
      ).toBe('Very Easy Block Down Solution');

      expect(
        getSolutionHeaderTitle({
          title: 'Daily #165 [Easy]',
          dailyTier: 'easy',
        })
      ).toBe('Easy Block Down Solution');

      expect(
        getSolutionHeaderTitle({
          title: 'Daily #165 [Medium]',
          dailyTier: 'medium',
        })
      ).toBe('Medium Block Down Solution');

      expect(
        getSolutionHeaderTitle({
          title: 'Daily #165 [Hard]',
          dailyTier: 'hard',
        })
      ).toBe('Hard Block Down Solution');

      expect(
        getSolutionHeaderTitle({
          title: 'Daily #165 [Very Hard]',
          dailyTier: 'very-hard',
        })
      ).toBe('Very Hard Block Down Solution');

      expect(
        getSolutionHeaderTitle({
          title: 'Daily #165 [Extreme]',
          dailyTier: 'extreme',
        })
      ).toBe('Extreme Block Down Solution');
    });

    it('returns distinct headers for numeric tier representations (tier_1 to tier_6)', () => {
      expect(getSolutionHeaderTitle({ dailyTier: 'tier_1' })).toBe('Very Easy Block Down Solution');
      expect(getSolutionHeaderTitle({ dailyTier: 'tier_2' })).toBe('Easy Block Down Solution');
      expect(getSolutionHeaderTitle({ dailyTier: 'tier_3' })).toBe('Medium Block Down Solution');
      expect(getSolutionHeaderTitle({ dailyTier: 'tier_4' })).toBe('Hard Block Down Solution');
      expect(getSolutionHeaderTitle({ dailyTier: 'tier_5' })).toBe('Very Hard Block Down Solution');
      expect(getSolutionHeaderTitle({ dailyTier: 'tier_6' })).toBe('Extreme Block Down Solution');
    });

    it('identifies Very Hard and Extreme from puzzleId or title alone', () => {
      expect(
        getSolutionHeaderTitle({
          puzzleId: 'daily-very-hard-2026-12-01',
        })
      ).toBe('Very Hard Block Down Solution');

      expect(
        getSolutionHeaderTitle({
          title: 'Sector 5 [Very Hard]',
        })
      ).toBe('Very Hard Block Down Solution');

      expect(
        getSolutionHeaderTitle({
          puzzleId: 'daily-extreme-2026-12-01',
        })
      ).toBe('Extreme Block Down Solution');

      expect(
        getSolutionHeaderTitle({
          title: 'Sector 6 [Extreme]',
        })
      ).toBe('Extreme Block Down Solution');
    });

    it('identifies Easy from puzzleId alone', () => {
      expect(
        getSolutionHeaderTitle({
          puzzleId: 'daily-easy-2026-12-01',
        })
      ).toBe('Easy Block Down Solution');
    });

    it('identifies Easy from title alone when tier/id are missing', () => {
      expect(
        getSolutionHeaderTitle({
          title: 'Daily #12 Warm-Up',
        })
      ).toBe('Easy Block Down Solution');
    });

    it('defaults to Hard Block Down Solution for main daily when tier is omitted', () => {
      expect(
        getSolutionHeaderTitle({
          title: 'Daily Puzzle #12',
          puzzleId: 'daily-2026-12-01',
        })
      ).toBe('Hard Block Down Solution');
    });
  });
});
