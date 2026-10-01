import { describe, it, expect } from 'vitest';
import { simulateSolutionPushes, calculatePuzzlePar, dirToVector } from './puzzle';
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
});
