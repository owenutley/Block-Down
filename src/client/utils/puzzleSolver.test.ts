// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  solvePuzzle,
  generateEasyPuzzle,
  isValidDistancePattern,
  PuzzleSolverInput,
} from './puzzleSolver';

describe('puzzleSolver', () => {
  it('solves a simple puzzle in correct moves with sliding physics', () => {
    const input: PuzzleSolverInput = {
      width: 5,
      height: 5,
      player: { x: 0, y: 0 },
      walls: [{ x: 4, y: 0 }],
      blocks: [{ id: 'b1', color: 'red', x: 1, y: 0 }],
      targets: [{ id: 't1', color: 'red', x: 3, y: 0 }],
    };

    const result = solvePuzzle(input);
    expect(result).not.toBeNull();
    expect(result?.solved).toBe(true);
    expect(result?.moves).toEqual(['Right']);
  });

  it('detects already solved state', () => {
    const input: PuzzleSolverInput = {
      width: 5,
      height: 5,
      player: { x: 0, y: 0 },
      walls: [],
      blocks: [{ id: 'b1', color: 'red', x: 2, y: 2 }],
      targets: [{ id: 't1', color: 'red', x: 2, y: 2 }],
    };

    const result = solvePuzzle(input);
    expect(result).not.toBeNull();
    expect(result?.solved).toBe(true);
    expect(result?.moves).toEqual([]);
  });

  it('validates distance patterns correctly', () => {
    // Bad / Rejected Sandwich Patterns (1-#-1, 2-#-2, 3-#-3, 4-#-4, #-1-#-1)
    expect(isValidDistancePattern([1, 2, 1])).toBe(false);
    expect(isValidDistancePattern([2, 3, 2])).toBe(false);
    expect(isValidDistancePattern([3, 1, 3])).toBe(false);
    expect(isValidDistancePattern([4, 2, 4])).toBe(false);
    expect(isValidDistancePattern([3, 1, 2, 1])).toBe(false);

    expect(isValidDistancePattern([3, 3, 2, 3])).toBe(false);
    expect(isValidDistancePattern([3, 2, 1, 2])).toBe(false);
    expect(isValidDistancePattern([1, 4, 2, 4])).toBe(false);
    expect(isValidDistancePattern([5, 1, 5])).toBe(false);
    expect(isValidDistancePattern([2, 2, 1, 2])).toBe(false);

    // Good / Allowed Patterns (Adjacent duplicates allowed, no sandwiches)
    expect(isValidDistancePattern([4, 4, 1, 2])).toBe(true);
    expect(isValidDistancePattern([5, 5, 1])).toBe(true);
    expect(isValidDistancePattern([2, 2, 1])).toBe(true);
    expect(isValidDistancePattern([2, 2, 3])).toBe(true);
    expect(isValidDistancePattern([1, 3, 2])).toBe(true);
  });

  it('generates a valid Easy puzzle on a 9x9 grid', () => {
    const generated = generateEasyPuzzle({
      width: 9,
      height: 9,
    });

    expect(generated.width).toBe(9);
    expect(generated.height).toBe(9);
    expect(generated.blocks.length).toBeGreaterThanOrEqual(2);
    expect(generated.blocks.length).toBeLessThanOrEqual(4);
    expect(generated.targets.length).toEqual(generated.blocks.length);

    // Verify no block starts on any target cell
    for (const b of generated.blocks) {
      for (const t of generated.targets) {
        expect(b.x === t.x && b.y === t.y).toBe(false);
      }
    }

    // Verify solver solves the generated Easy puzzle cleanly
    const solution = solvePuzzle({
      width: generated.width,
      height: generated.height,
      player: generated.player,
      walls: generated.walls,
      blocks: generated.blocks,
      targets: generated.targets,
      portals: generated.portals,
    });

    expect(solution).not.toBeNull();
    expect(solution?.solved).toBe(true);
    expect(solution?.pushCount).toBeGreaterThanOrEqual(4);
  });
});
