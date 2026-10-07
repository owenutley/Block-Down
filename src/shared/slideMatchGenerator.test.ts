import { describe, it, expect } from 'vitest';
import { generateEndlessSlideMatchPuzzle } from './slideMatchGenerator';
import { isSlideMatchSolved, solveSlideMatch } from './slideMatch';

describe('slideMatchGenerator', () => {
  it('generates solvable puzzles for early stages', () => {
    for (let stage = 1; stage <= 5; stage++) {
      const puzzle = generateEndlessSlideMatchPuzzle(stage);
      expect(puzzle).toBeDefined();
      expect(puzzle.blocks.length).toBeGreaterThanOrEqual(1);
      expect(puzzle.targets.length).toBe(puzzle.blocks.length);

      // Verify that starting state is not already solved
      const alreadySolved = isSlideMatchSolved(puzzle.blocks, puzzle.targets);
      expect(alreadySolved).toBe(false);

      // Verify BFS solver can solve it
      const solveRes = solveSlideMatch(puzzle);
      expect(solveRes.solvable).toBe(true);
      expect(solveRes.minSlides).toBeGreaterThanOrEqual(1);
    }
  });

  it('generates solvable puzzles for mid and high stages', () => {
    const testStages = [6, 12, 18, 25];
    for (const stage of testStages) {
      const puzzle = generateEndlessSlideMatchPuzzle(stage);
      expect(puzzle).toBeDefined();
      expect(puzzle.blocks.length).toBeGreaterThanOrEqual(2);

      const solveRes = solveSlideMatch(puzzle);
      expect(solveRes.solvable).toBe(true);
      expect(solveRes.minSlides).toBeGreaterThanOrEqual(1);
    }
  });
});
