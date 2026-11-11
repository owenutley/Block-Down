import { describe, it, expect } from 'vitest';
import {
  solvePuzzle,
  simulateMove,
  isStateSolved,
  generatePuzzle,
  generateBacktrackingLevel,
  minPushesRemaining,
  isValidDistancePattern,
  scoreSolutionQuality,
  PuzzleSolverInput,
} from './puzzleSolver';
import { Built } from '../../shared/backtrackingGenerator';

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
      portals: medium.portals,
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
      portals: hard.portals,
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
      portals: expert.portals,
    });
    expect(expertSol?.solved).toBe(true);
    expect(expertSol?.pushCount).toBeGreaterThanOrEqual(4);
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
        portals: p.portals,
      });
      expect(sol?.solved).toBe(true);
      expect(sol?.pushCount).toBeGreaterThanOrEqual(4);
    }
  }, 60000);

  it('generates valid solvable levels across tiers using generateBacktrackingLevel', () => {
    // Test stage 1 (Tier 0: 2 blocks)
    const stage1 = generateBacktrackingLevel(1);
    expect(stage1.width).toBe(9);
    expect(stage1.height).toBe(9);
    expect(stage1.blocks.length).toBe(2);
    expect(stage1.targets.length).toBe(2);
    expect(stage1.solutionMoves.length).toBeGreaterThan(0);

    const sol1 = solvePuzzle({
      width: stage1.width,
      height: stage1.height,
      player: stage1.player,
      walls: stage1.walls,
      blocks: stage1.blocks,
      targets: stage1.targets,
      portals: stage1.portals,
    });
    expect(sol1?.solved).toBe(true);

    // Test stage 6 (Tier 1: 3 blocks)
    const stage6 = generateBacktrackingLevel(6);
    expect(stage6.blocks.length).toBe(3);
    expect(stage6.targets.length).toBeGreaterThanOrEqual(2);
    expect(stage6.solutionMoves.length).toBeGreaterThan(0);

    let curPlayer = stage6.player;
    let curBlocks = stage6.blocks;
    for (const move of stage6.solutionMoves) {
      const res = simulateMove(
        {
          width: stage6.width,
          height: stage6.height,
          player: curPlayer,
          walls: stage6.walls,
          blocks: curBlocks,
          targets: stage6.targets,
          portals: stage6.portals,
        },
        curPlayer,
        curBlocks,
        move
      );
      if (res.moved) {
        curPlayer = res.player;
        curBlocks = res.blocks;
      }
    }
    expect(isStateSolved(curBlocks, stage6.targets)).toBe(true);
  }, 25000);

  it('correctly computes admissible minPushesRemaining heuristic', () => {
    // 1. Block at exact target -> 0
    expect(minPushesRemaining([{ x: 2, y: 3 }], [{ x: 2, y: 3 }])).toBe(0);

    // 2. Block sharing one axis (same x, different y) -> 1
    expect(minPushesRemaining([{ x: 2, y: 1 }], [{ x: 2, y: 5 }])).toBe(1);

    // 3. Block sharing one axis (different x, same y) -> 1
    expect(minPushesRemaining([{ x: 1, y: 5 }], [{ x: 4, y: 5 }])).toBe(1);

    // 4. Block differing on both axes -> 2
    expect(minPushesRemaining([{ x: 1, y: 1 }], [{ x: 4, y: 5 }])).toBe(2);

    // 5. Multi-block sum (0 + 1 + 2 = 3)
    const blocks = [
      { x: 0, y: 0 },
      { x: 3, y: 1 },
      { x: 5, y: 5 },
    ];
    const targets = [
      { x: 0, y: 0 }, // 0
      { x: 3, y: 8 }, // 1
      { x: 2, y: 1 }, // 2
    ];
    expect(minPushesRemaining(blocks, targets)).toBe(3);
  });

  it('supports custom board sizing for generateBacktrackingLevel', () => {
    const customSize = 7;
    const puzzle = generateBacktrackingLevel(1, customSize);
    expect(puzzle.width).toBe(customSize);
    expect(puzzle.height).toBe(customSize);
    expect(puzzle.player.x).toBeLessThan(customSize);
    expect(puzzle.player.y).toBeLessThan(customSize);
    for (const b of puzzle.blocks) {
      expect(b.x).toBeLessThan(customSize);
      expect(b.y).toBeLessThan(customSize);
    }
    for (const t of puzzle.targets) {
      expect(t.x).toBeLessThan(customSize);
      expect(t.y).toBeLessThan(customSize);
    }
  });

  describe('Causal gray block and portal validation', () => {
    it('accepts gray block when it acts as an active bumper for a colored block', () => {
      // 9x9 board with no walls
      const B: Built = {
        L: { size: 9, wallSet: new Set(), portals: [] },
        targets: [{ x: 5, y: 5, color: 'red' }],
        // Block 0 = red (starts at 1, 5), Block 1 = gray (starts at 6, 5)
        starts: [{ x: 1, y: 5 }, { x: 6, y: 5 }],
        blockColors: ['red', 'gray'],
        player: { x: 0, y: 5 },
        plan: [],
      };

      // Push red block right (dir 3 = Right). It slides and hits gray block at (6, 5), stopping at (5, 5) = target!
      const analysis = scoreSolutionQuality(B, [{ i: 0, d: 3 }]);
      expect(analysis.grayIsMeaningful).toBe(true);
      expect(analysis.score).toBeGreaterThan(0);
    });

    it('accepts gray block when cleared in 1 push to unlock a slide lane', () => {
      // Gray block starts at (3, 5), blocking red block at (1, 5) from sliding to target at (7, 5)
      const B: Built = {
        L: { size: 9, wallSet: new Set(), portals: [] },
        targets: [{ x: 8, y: 5, color: 'red' }],
        starts: [{ x: 1, y: 5 }, { x: 3, y: 5 }],
        blockColors: ['red', 'gray'],
        player: { x: 3, y: 4 }, // Player stands above gray block
        plan: [],
      };

      // 1. Push gray block down (d = 1) to clear the row
      // 2. Push red block right (d = 3), sliding across cleared cell (3, 5) to board edge (8, 5) = target
      const analysis = scoreSolutionQuality(B, [
        { i: 1, d: 1 }, // Push gray down
        { i: 0, d: 3 }, // Push red right
      ]);
      expect(analysis.grayIsMeaningful).toBe(true);
    });

    it('rejects gray block if it was pushed without being a bumper or clearing a lane', () => {
      // Gray block at (1, 1), red block at (1, 5) -> target (8, 5)
      const B: Built = {
        L: { size: 9, wallSet: new Set(), portals: [] },
        targets: [{ x: 8, y: 5, color: 'red' }],
        starts: [{ x: 1, y: 5 }, { x: 1, y: 1 }],
        blockColors: ['red', 'gray'],
        player: { x: 0, y: 1 },
        plan: [],
      };

      // Gray block is just pushed right into the void (never hit, doesn't clear red's lane)
      const analysis = scoreSolutionQuality(B, [
        { i: 1, d: 3 }, // Push gray right
        { i: 0, d: 3 }, // Push red right
      ]);
      expect(analysis.grayIsMeaningful).toBe(false);
    });

    it('rejects gray block if it takes multiple pushes to clear an obstacle lane without bumper duty', () => {
      // Gray block at (3, 5), red block at (1, 5)
      const B: Built = {
        L: { size: 9, wallSet: new Set(), portals: [] },
        targets: [{ x: 8, y: 5, color: 'red' }],
        starts: [{ x: 1, y: 5 }, { x: 3, y: 5 }],
        blockColors: ['red', 'gray'],
        player: { x: 3, y: 4 },
        plan: [],
      };

      // Pushing gray block down, then right, then red right: 2 gray pushes for obstacle clearing = padding
      const analysis = scoreSolutionQuality(B, [
        { i: 1, d: 1 }, // Gray down to (3, 8)
        { i: 1, d: 3 }, // Gray right to (8, 8) (pointless shuffle)
        { i: 0, d: 3 }, // Red right
      ]);
      expect(analysis.grayIsMeaningful).toBe(false);
    });
  });
});

