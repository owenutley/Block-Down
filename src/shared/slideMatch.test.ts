import { describe, it, expect } from 'vitest';
import {
  calculateBlockSlide,
  isSlideMatchSolved,
  calculateSlideMatchStars,
  solveSlideMatch,
} from './slideMatch';
import { PuzzleBlock, PuzzleTarget } from './types';

describe('slideMatch physics & solver', () => {
  it('slides a block until it hits the boundary', () => {
    const blocks: PuzzleBlock[] = [{ id: 'b1', color: 'red', x: 2, y: 2 }];
    const wallSet = new Set<string>();

    const result = calculateBlockSlide('b1', 'Right', 5, 5, wallSet, blocks, []);
    expect(result.moved).toBe(true);
    expect(result.finalPos).toEqual({ x: 4, y: 2 });
  });

  it('slides a block until it hits a wall', () => {
    const blocks: PuzzleBlock[] = [{ id: 'b1', color: 'red', x: 1, y: 2 }];
    const wallSet = new Set<string>(['3,2']);

    const result = calculateBlockSlide('b1', 'Right', 5, 5, wallSet, blocks, []);
    expect(result.moved).toBe(true);
    expect(result.finalPos).toEqual({ x: 2, y: 2 });
  });

  it('slides a block until it hits another block (including neutral blocks)', () => {
    const blocks: PuzzleBlock[] = [
      { id: 'b1', color: 'red', x: 0, y: 2 },
      { id: 'b2', color: 'gray', x: 3, y: 2 },
    ];
    const wallSet = new Set<string>();

    const result = calculateBlockSlide('b1', 'Right', 5, 5, wallSet, blocks, []);
    expect(result.moved).toBe(true);
    expect(result.finalPos).toEqual({ x: 2, y: 2 });
  });

  it('correctly teleports through portals', () => {
    const blocks: PuzzleBlock[] = [{ id: 'b1', color: 'blue', x: 0, y: 1 }];
    const wallSet = new Set<string>(['3,1']);
    const portals = [
      { id: 'p1', color: 'cyan', x: 2, y: 1, dir: 'Left' as const },
      { id: 'p2', color: 'cyan', x: 4, y: 3, dir: 'Down' as const },
    ];

    const result = calculateBlockSlide('b1', 'Right', 6, 6, wallSet, blocks, portals);
    expect(result.moved).toBe(true);
    expect(result.finalPos).toEqual({ x: 4, y: 5 });
    expect(result.steps.length).toBeGreaterThan(1);
  });

  it('verifies solved state', () => {
    const blocks: PuzzleBlock[] = [
      { id: 'b1', color: 'red', x: 1, y: 1 },
      { id: 'b2', color: 'blue', x: 3, y: 3 },
      { id: 'b3', color: 'gray', x: 0, y: 0 },
    ];
    const targets: PuzzleTarget[] = [
      { id: 't1', color: 'red', x: 1, y: 1 },
      { id: 't2', color: 'blue', x: 3, y: 3 },
    ];

    expect(isSlideMatchSolved(blocks, targets)).toBe(true);

    const unsolvedBlocks: PuzzleBlock[] = [
      { id: 'b1', color: 'red', x: 1, y: 2 },
      { id: 'b2', color: 'blue', x: 3, y: 3 },
    ];
    expect(isSlideMatchSolved(unsolvedBlocks, targets)).toBe(false);
  });

  it('calculates stars correctly', () => {
    expect(calculateSlideMatchStars(3, 3)).toBe(3);
    expect(calculateSlideMatchStars(4, 3)).toBe(2);
    expect(calculateSlideMatchStars(8, 3)).toBe(1);
  });

  it('finds optimal solution using BFS solver', () => {
    const puzzle = {
      width: 5,
      height: 5,
      walls: [{ x: 4, y: 1 }],
      blocks: [{ id: 'b1', color: 'red', x: 0, y: 0 }],
      targets: [{ id: 't1', color: 'red', x: 4, y: 0 }],
      portals: [],
    };

    const solution = solveSlideMatch(puzzle);
    expect(solution.solvable).toBe(true);
    expect(solution.minSlides).toBe(1);
    expect(solution.solutionMoves).toEqual([{ blockId: 'b1', dir: 'Right' }]);
  });

  it('determines moveability when directly adjacent to walls vs through portals', () => {
    const blocks: PuzzleBlock[] = [{ id: 'b1', color: 'red', x: 2, y: 2 }];
    const wallSet = new Set<string>(['2,1']); // wall directly above (Up)

    // Up is blocked by wall
    const upBlocked = calculateBlockSlide('b1', 'Up', 5, 5, wallSet, blocks, []);
    expect(upBlocked.moved).toBe(false);

    // Right is open
    const rightOpen = calculateBlockSlide('b1', 'Right', 5, 5, wallSet, blocks, []);
    expect(rightOpen.moved).toBe(true);

    // Up with a portal at (2,2) facing Down (entry when moving Up)
    const portals = [
      { id: 'p1', x: 2, y: 2, dir: 'Down' as const, color: 'cyan', targetId: 'p2' },
      { id: 'p2', x: 4, y: 4, dir: 'Left' as const, color: 'cyan', targetId: 'p1' },
    ];
    const upThroughPortal = calculateBlockSlide('b1', 'Up', 5, 5, wallSet, blocks, portals);
    expect(upThroughPortal.moved).toBe(true);
    expect(upThroughPortal.finalPos).toEqual({ x: 0, y: 4 });
  });
});
