import { describe, it, expect } from 'vitest';
import { generateEndlessSlideMatchPuzzle } from './slideMatchGenerator';
import { isSlideMatchSolved, solveSlideMatch } from './slideMatch';

describe('slideMatchGenerator', () => {
  it('generates solvable puzzles for early stages', () => {
    for (let stage = 1; stage <= 4; stage++) {
      const puzzle = generateEndlessSlideMatchPuzzle(stage);
      expect(puzzle).toBeDefined();
      expect(puzzle.blocks.length).toBe(1);
      expect(puzzle.targets.length).toBe(1);

      // Verify that starting state is not already solved
      const alreadySolved = isSlideMatchSolved(puzzle.blocks, puzzle.targets);
      expect(alreadySolved).toBe(false);

      // Verify BFS solver can solve it
      const solveRes = solveSlideMatch(puzzle);
      expect(solveRes.solvable).toBe(true);
      expect(solveRes.minSlides).toBeGreaterThanOrEqual(1);
    }
  });

  it('generates solvable puzzles for mid and high stages with max 3 blocks', () => {
    const testStages = [6, 12, 18, 25, 35, 50, 75];
    for (const stage of testStages) {
      const puzzle = generateEndlessSlideMatchPuzzle(stage);
      expect(puzzle).toBeDefined();
      expect(puzzle.blocks.length).toBeGreaterThanOrEqual(2);
      expect(puzzle.blocks.length).toBeLessThanOrEqual(3);
      expect(puzzle.targets.length).toBe(puzzle.blocks.length);

      const solveRes = solveSlideMatch(puzzle);
      expect(solveRes.solvable).toBe(true);
      expect(solveRes.minSlides).toBeGreaterThanOrEqual(1);
    }
  });

  it('uses randomized colors from the theme color pool across stages', () => {
    const observedColors = new Set<string>();
    for (let i = 0; i < 20; i++) {
      const puzzle = generateEndlessSlideMatchPuzzle(i + 1);
      for (const block of puzzle.blocks) {
        observedColors.add(block.color);
      }
    }
    // Across 20 stage generations with 1-3 blocks, multiple distinct colors should be observed
    expect(observedColors.size).toBeGreaterThan(1);
  });
});
