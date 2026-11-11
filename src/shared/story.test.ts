import { describe, it, expect } from 'vitest';
import {
  getChamberDoorCoordinates,
  sanitizeChamberTopology,
  isChamberAisleClear,
  STORY_CHAPTERS,
  STORY_TRANSMISSIONS,
} from './story';
import { Puzzle } from './types';

describe('Story Mode Configuration & Topology', () => {
  it('defines 4 narrative chapters', () => {
    expect(STORY_CHAPTERS.length).toBe(4);
    expect(STORY_CHAPTERS[0]?.themeId).toBe('neon');
    expect(STORY_CHAPTERS[1]?.themeId).toBe('winter');
    expect(STORY_CHAPTERS[2]?.themeId).toBe('forest');
    expect(STORY_CHAPTERS[3]?.themeId).toBe('candy');
  });

  it('calculates correct chamber door coordinates for 9x9 and 7x7 boards', () => {
    const coords9 = getChamberDoorCoordinates(9);
    expect(coords9.doorX).toBe(4);
    expect(coords9.topDoorPos).toEqual({ x: 4, y: 0 });
    expect(coords9.bottomSpawnPos).toEqual({ x: 4, y: 8 });

    const coords7 = getChamberDoorCoordinates(7);
    expect(coords7.doorX).toBe(3);
    expect(coords7.topDoorPos).toEqual({ x: 3, y: 0 });
    expect(coords7.bottomSpawnPos).toEqual({ x: 3, y: 6 });
  });

  it('sanitizes chamber topology by stripping walls at topDoor and bottomSpawn positions', () => {
    const rawPuzzle: Puzzle = {
      id: 'test_chamber',
      name: 'Chamber 1',
      difficulty: 'easy',
      width: 9,
      height: 9,
      player: { x: 4, y: 8 },
      walls: [
        { x: 1, y: 1 },
        { x: 4, y: 0 }, // Should be removed (top door)
        { x: 4, y: 8 }, // Should be removed (bottom spawn)
        { x: 2, y: 2 },
      ],
      blocks: [],
      targets: [],
      createdAt: 1000,
    };

    const sanitized = sanitizeChamberTopology(rawPuzzle);

    // Should only contain walls not on (4,0) or (4,8)
    expect(sanitized.walls).toEqual([
      { x: 1, y: 1 },
      { x: 2, y: 2 },
    ]);
  });

  it('contains dialogue scripts for key milestone transmissions', () => {
    expect(STORY_TRANSMISSIONS.ch1_intro).toBeDefined();
    expect(STORY_TRANSMISSIONS.ch1_boss).toBeDefined();
    expect(STORY_TRANSMISSIONS.ch2_boss).toBeDefined();
    expect(STORY_TRANSMISSIONS.ch3_boss).toBeDefined();
    expect(STORY_TRANSMISSIONS.ch4_boss).toBeDefined();
  });

  it('detects when top door threshold (4,0) or bottom spawn (4,8) is blocked by targets or blocks', () => {
    const blockedDoorPuzzle: Puzzle = {
      id: 'blocked_door',
      name: 'Blocked Chamber',
      difficulty: 'easy',
      width: 9,
      height: 9,
      player: { x: 0, y: 0 },
      walls: [],
      blocks: [{ id: 'b1', color: 'red', x: 2, y: 2 }],
      targets: [{ id: 't1', color: 'red', x: 4, y: 0 }], // Target on door!
      createdAt: 1000,
    };
    expect(isChamberAisleClear(blockedDoorPuzzle)).toBe(false);

    const clearDoorPuzzle: Puzzle = {
      id: 'clear_door',
      name: 'Clear Chamber',
      difficulty: 'easy',
      width: 9,
      height: 9,
      player: { x: 4, y: 8 },
      walls: [],
      blocks: [{ id: 'b1', color: 'red', x: 2, y: 2 }],
      targets: [{ id: 't1', color: 'red', x: 2, y: 5 }],
      createdAt: 1000,
    };
    expect(isChamberAisleClear(clearDoorPuzzle)).toBe(true);
  });
});

