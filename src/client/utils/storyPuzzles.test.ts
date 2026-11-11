import { describe, it, expect } from 'vitest';
import { STORY_CHAMBERS, getCuratedStoryChamber } from '../../shared/storyPuzzles';
import { isChamberAisleClear } from '../../shared/story';
import { solvePuzzle, PuzzleSolverInput } from './puzzleSolver';

describe('Story Mode Chamber Solver Verification', () => {
  it('guarantees that every chamber has a clear door aisle at (4, 0) and spawn at (4, 8)', () => {
    for (const chamber of STORY_CHAMBERS) {
      const puzzle = getCuratedStoryChamber(chamber.chapter, chamber.chamber);
      expect(puzzle).not.toBeNull();
      if (!puzzle) continue;

      expect(puzzle.player).toEqual({ x: 4, y: 8 });
      expect(isChamberAisleClear(puzzle)).toBe(true);

      // Verify explicit absence of walls, targets, blocks on top door (4, 0) and spawn (4, 8)
      expect(puzzle.walls.some((w) => (w.x === 4 && w.y === 0) || (w.x === 4 && w.y === 8))).toBe(false);
      expect(puzzle.targets.some((t) => (t.x === 4 && t.y === 0) || (t.x === 4 && t.y === 8))).toBe(false);
      expect(puzzle.blocks.some((b) => (b.x === 4 && b.y === 0) || (b.x === 4 && b.y === 8))).toBe(false);
    }
  });

  for (const chamber of STORY_CHAMBERS) {
    it(`solves Chapter ${chamber.chapter} Chamber ${chamber.chamber} (${chamber.name})`, () => {
      const puzzle = getCuratedStoryChamber(chamber.chapter, chamber.chamber);
      if (!puzzle) throw new Error('Puzzle not found');

      const solverInput: PuzzleSolverInput = {
        width: puzzle.width,
        height: puzzle.height,
        player: puzzle.player,
        walls: puzzle.walls,
        blocks: puzzle.blocks,
        targets: puzzle.targets,
      };

      if (puzzle.portals) {
        solverInput.portals = puzzle.portals;
      }

      const result = solvePuzzle(solverInput);

      if (!result || !result.solved) {
        throw new Error(`Chamber ${chamber.id} is not solvable!`);
      }
      expect(result.solved).toBe(true);
      expect(result.pushCount).toBeGreaterThan(0);
    });
  }
});

