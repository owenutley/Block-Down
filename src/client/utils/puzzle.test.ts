import { describe, it, expect } from 'vitest';
import { calculateParPushes, calculateStars, colorToBlockType, convertPuzzleToLevelConfig, simulateSolutionPushes, getNextPosWithPortalsDetails } from './puzzle';
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

  describe('Neutral Gray Blocks', () => {

    it('maps gray and grey colors to gray-neutral block type', () => {
      expect(colorToBlockType('gray')).toBe('gray-neutral');
      expect(colorToBlockType('grey')).toBe('gray-neutral');
      expect(colorToBlockType('GRAY')).toBe('gray-neutral');
    });

    it('converts puzzle with gray neutral blocks without creating gray destinations', () => {
      const puzzle = {
        id: 'test-puzzle',
        name: 'Test Level',
        difficulty: 'easy',
        width: 5,
        height: 5,
        player: { x: 0, y: 0 },
        walls: [],
        blocks: [
          { x: 1, y: 1, color: 'red' },
          { x: 2, y: 2, color: 'gray' },
        ],
        targets: [
          { x: 1, y: 3, color: 'red' },
        ],
      };

      const levelConfig = convertPuzzleToLevelConfig(puzzle);
      expect(levelConfig.blocks).toHaveLength(2);
      expect(levelConfig.blocks.find(b => b.type === 'gray-neutral')).toBeDefined();
      expect(levelConfig.destinations).toHaveLength(1);
      expect(levelConfig.destinations[0]?.type).toBe('red-heart');
    });

    it('includes neutral block pushes when simulating solution moves', () => {
      const levelConfig: LevelConfig = {
        gridSize: 5,
        startPos: { x: 0, y: 1 },
        walls: [],
        blocks: [
          { type: 'gray-neutral', pos: { x: 1, y: 1 } },
        ],
        destinations: [],
        moves: ['Right'],
      };

      const pushCount = simulateSolutionPushes(levelConfig);
      expect(pushCount).toBe(1);
    });
  });

  describe('Portals', () => {
    it('converts puzzle with portals into levelConfig', () => {
      const puzzle = {
        id: 'portal-puzzle',
        name: 'Portal Test',
        difficulty: 'medium',
        width: 5,
        height: 5,
        player: { x: 0, y: 0 },
        walls: [],
        blocks: [{ x: 1, y: 2, color: 'blue' }],
        targets: [{ x: 4, y: 4, color: 'blue' }],
        portals: [
          { id: 'p1', color: 'red', x: 0, y: 2, dir: 'Right' as const },
          { id: 'p2', color: 'red', x: 4, y: 2, dir: 'Down' as const },
        ],
      };

      const levelConfig = convertPuzzleToLevelConfig(puzzle);
      expect(levelConfig.portals).toHaveLength(2);
      expect(levelConfig.portals?.[0]?.color).toBe('red');
    });

    it('teleports sliding block to matching exit portal and changes direction', () => {
      const levelConfig: LevelConfig = {
        gridSize: 5,
        startPos: { x: 2, y: 2 },
        walls: [],
        blocks: [{ type: 'blue-diamond', pos: { x: 1, y: 2 } }],
        destinations: [],
        portals: [
          { id: 'p1', color: 'red', x: 0, y: 2, dir: 'Right' },
          { id: 'p2', color: 'red', x: 4, y: 0, dir: 'Down' },
        ],
        moves: ['Left'],
      };

      // Player starts at (2,2), moves Left to (1,2), pushing block at (1,2) Left into cell (0,2).
      // At (0,2), block hits Portal p1 facing Right (opposite to Left move).
      // Block teleports to Portal p2 at (4,0) facing Down.
      // Block continues sliding Down from (4,0) to bottom (4,4).
      const pushCount = simulateSolutionPushes(levelConfig);
      expect(pushCount).toBe(1);
    });

    it('returns detailed trajectory waypoints including entry and exit portals', () => {
      const wallSet = new Set<string>();
      const blockPositions = [{ x: 1, y: 2 }];
      const portals = [
        { id: 'p1', color: 'red', x: 0, y: 2, dir: 'Right' as const },
        { id: 'p2', color: 'red', x: 4, y: 0, dir: 'Down' as const },
      ];

      const trajectory = getNextPosWithPortalsDetails(
        { x: 1, y: 2 },
        { x: -1, y: 0 },
        5,
        wallSet,
        blockPositions,
        portals
      );

      expect(trajectory.entryPortal?.id).toBe('p1');
      expect(trajectory.exitPortal?.id).toBe('p2');
      expect(trajectory.finalPos).toEqual({ x: 4, y: 4 });
    });

    it('teleports player character through portals when standing on portal and moving in portal direction', () => {
      const levelConfig: LevelConfig = {
        gridSize: 5,
        startPos: { x: 1, y: 2 },
        walls: [],
        blocks: [{ type: 'blue-diamond', pos: { x: 4, y: 2 } }],
        destinations: [{ type: 'blue-diamond', pos: { x: 4, y: 4 } }],
        portals: [
          { id: 'p1', color: 'red', x: 2, y: 2, dir: 'Left' },
          { id: 'p2', color: 'red', x: 4, y: 0, dir: 'Left' },
        ],
        // Moves: Right to stand on portal (2,2), Right to travel through portal to (4,0), Down to (4,1), Down to push block at (4,2)
        moves: ['Right', 'Right', 'Down', 'Down'],
      };

      const pushCount = simulateSolutionPushes(levelConfig);
      expect(pushCount).toBe(1);
    });
  });
});
