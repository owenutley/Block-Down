import { describe, it, expect } from 'vitest';
import { calculateParPushes, calculateStars } from './puzzle';
import { LevelConfig } from '../types';

describe('Puzzle Client Utilities', () => {
  const sampleLevel: LevelConfig = {
    gridSize: 5,
    startPos: { x: 0, y: 0 },
    walls: [{ x: 4, y: 4 }],
    blocks: [
      { type: 'blue-diamond', pos: { x: 1, y: 1 } },
      { type: 'yellow-crescent', pos: { x: 2, y: 2 } },
    ],
    destinations: [
      { type: 'blue-diamond', pos: { x: 1, y: 4 } },
      { type: 'yellow-crescent', pos: { x: 4, y: 2 } },
    ],
    par: 4,
  };

  it('calculates par from levelConfig.par or simulates/estimates solution', () => {
    expect(calculateParPushes(sampleLevel)).toBe(4);

    const levelWithoutPar: LevelConfig = {
      gridSize: 5,
      startPos: { x: 0, y: 0 },
      walls: [{ x: 4, y: 4 }],
      blocks: [
        { type: 'blue-diamond', pos: { x: 1, y: 1 } },
        { type: 'yellow-crescent', pos: { x: 2, y: 2 } },
      ],
      destinations: [
        { type: 'blue-diamond', pos: { x: 1, y: 4 } },
        { type: 'yellow-crescent', pos: { x: 4, y: 2 } },
      ],
    };
    expect(calculateParPushes(levelWithoutPar)).toBe(4);
  });

  it('calculates stars accurately according to push counts and par', () => {
    // Par = 4
    // Optimal / Par or better -> 3 Stars
    expect(calculateStars(3, 4)).toBe(3);
    expect(calculateStars(4, 4)).toBe(3);

    // Within par limit (e.g. 5 or 6 pushes for par 4) -> 2 Stars
    expect(calculateStars(5, 4)).toBe(2);
    expect(calculateStars(6, 4)).toBe(2);

    // Excess pushes -> 1 Star
    expect(calculateStars(8, 4)).toBe(1);
    expect(calculateStars(15, 4)).toBe(1);
  });
});
