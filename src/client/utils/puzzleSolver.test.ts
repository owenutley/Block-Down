import { describe, it, expect } from 'vitest';
import {
  solvePuzzle,
  generatePuzzle,
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

  it('generates a valid Moderate puzzle on a 9x9 grid', () => {
    const generated = generatePuzzle({
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

    // Verify solver solves the generated puzzle cleanly
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
    expect(solution?.pushCount).toBeGreaterThanOrEqual(5);
  }, 15000);

  it('generates a batch of 5 distinct puzzles rapidly without fallbacks', () => {
    const puzzles = [];
    for (let i = 0; i < 5; i++) {
      const p = generatePuzzle({ width: 9, height: 9 });
      puzzles.push(p);

      // Verify no block starts on a target
      for (const b of p.blocks) {
        for (const t of p.targets) {
          expect(b.x === t.x && b.y === t.y).toBe(false);
        }
      }

      // Verify solvable
      const sol = solvePuzzle({
        width: p.width,
        height: p.height,
        player: p.player,
        walls: p.walls,
        blocks: p.blocks,
        targets: p.targets,
      });

      expect(sol).not.toBeNull();
      expect(sol?.solved).toBe(true);
    }

    // Verify distinct positions across puzzles
    const firstKeys = puzzles[0]?.blocks.map(b => `${b.x},${b.y}`).join(';') || '';
    const secondKeys = puzzles[1]?.blocks.map(b => `${b.x},${b.y}`).join(';') || '';
    expect(firstKeys).not.toEqual(secondKeys);
  }, 20000);

  it('generates puzzles across all calibrated complexity presets (Easy, Medium, Hard, Expert)', () => {
    // 1. Easy
    const easy = generatePuzzle({ preset: 'easy', width: 9, height: 9 });
    expect(easy.blocks.length).toBe(2);
    expect(easy.targets.length).toBe(2);

    const easySol = solvePuzzle({
      width: easy.width,
      height: easy.height,
      player: easy.player,
      walls: easy.walls,
      blocks: easy.blocks,
      targets: easy.targets,
    });
    expect(easySol?.solved).toBe(true);

    // 2. Medium
    const medium = generatePuzzle({ preset: 'medium', width: 9, height: 9 });
    expect(medium.blocks.length).toBe(3);
    expect(medium.targets.length).toBe(3);

    const mediumSol = solvePuzzle({
      width: medium.width,
      height: medium.height,
      player: medium.player,
      walls: medium.walls,
      blocks: medium.blocks,
      targets: medium.targets,
    });
    expect(mediumSol?.solved).toBe(true);

    // 3. Hard
    const hard = generatePuzzle({ preset: 'hard', width: 9, height: 9 });
    expect(hard.blocks.length).toBeGreaterThanOrEqual(3);
    expect(hard.targets.length).toEqual(hard.blocks.length);

    const hardSol = solvePuzzle({
      width: hard.width,
      height: hard.height,
      player: hard.player,
      walls: hard.walls,
      blocks: hard.blocks,
      targets: hard.targets,
    });
    expect(hardSol?.solved).toBe(true);

    // 4. Expert
    const expert = generatePuzzle({ preset: 'expert', width: 9, height: 9 });
    expect(expert.blocks.length).toBeGreaterThanOrEqual(3);
    expect(expert.targets.length).toEqual(expert.blocks.length);

    const expertSol = solvePuzzle({
      width: expert.width,
      height: expert.height,
      player: expert.player,
      walls: expert.walls,
      blocks: expert.blocks,
      targets: expert.targets,
    });
    expect(expertSol?.solved).toBe(true);
    expect(expertSol?.pushCount).toBeGreaterThanOrEqual(6);
  }, 25000);

  it('generates distinct, non-repeating Hard and Expert puzzles with multi-block mechanics', () => {
    // Generate 3 Hard puzzles
    const hardPuzzles = [
      generatePuzzle({ preset: 'hard', width: 9, height: 9 }),
      generatePuzzle({ preset: 'hard', width: 9, height: 9 }),
      generatePuzzle({ preset: 'hard', width: 9, height: 9 }),
    ];

    const hardSignatures = hardPuzzles.map((p) =>
      p.blocks.map((b) => `${b.color}:${b.x},${b.y}`).sort().join(';')
    );
    // Ensure hard puzzles are distinct from each other
    expect(hardSignatures[0]).not.toEqual(hardSignatures[1]);
    expect(hardSignatures[1]).not.toEqual(hardSignatures[2]);

    // Generate 3 Expert puzzles
    const expertPuzzles = [
      generatePuzzle({ preset: 'expert', width: 9, height: 9 }),
      generatePuzzle({ preset: 'expert', width: 9, height: 9 }),
      generatePuzzle({ preset: 'expert', width: 9, height: 9 }),
    ];

    const expertSignatures = expertPuzzles.map((p) =>
      p.blocks.map((b) => `${b.color}:${b.x},${b.y}`).sort().join(';')
    );
    // Ensure expert puzzles are distinct from each other
    expect(expertSignatures[0]).not.toEqual(expertSignatures[1]);
    expect(expertSignatures[1]).not.toEqual(expertSignatures[2]);

    for (const p of [...hardPuzzles, ...expertPuzzles]) {
      const sol = solvePuzzle({
        width: p.width,
        height: p.height,
        player: p.player,
        walls: p.walls,
        blocks: p.blocks,
        targets: p.targets,
      });
      expect(sol?.solved).toBe(true);
      expect(sol?.pushCount).toBeGreaterThanOrEqual(5);
    }
  }, 35000);
});
