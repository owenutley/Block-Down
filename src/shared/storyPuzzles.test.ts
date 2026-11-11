import { describe, it, expect } from 'vitest';
import { STORY_CHAMBERS, getCuratedStoryChamber } from './storyPuzzles';
import { isChamberAisleClear } from './story';

describe('Story Mode Chamber Definitions', () => {
  it('has 40 total curated chambers (10 per chapter across 4 chapters)', () => {
    expect(STORY_CHAMBERS.length).toBe(40);
    for (let ch = 1; ch <= 4; ch++) {
      const chambersInCh = STORY_CHAMBERS.filter((c) => c.chapter === ch);
      expect(chambersInCh.length).toBe(10);
    }
  });

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
});
