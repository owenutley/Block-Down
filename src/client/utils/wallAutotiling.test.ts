import { describe, it, expect } from 'vitest';
import {
  computeWallNeighbors,
  computeWallCornerRadii,
} from './wallAutotiling';

describe('Wall Autotiling: computeWallNeighbors', () => {
  it('returns all false for an isolated wall with no neighbors', () => {
    const wallSet = new Set<string>(['2,2']);
    const neighbors = computeWallNeighbors(2, 2, wallSet);

    expect(neighbors.top).toBe(false);
    expect(neighbors.bottom).toBe(false);
    expect(neighbors.left).toBe(false);
    expect(neighbors.right).toBe(false);
    expect(neighbors.bottomRight).toBe(false);
  });

  it('correctly detects horizontal neighbors', () => {
    const wallSet = new Set<string>(['1,2', '2,2', '3,2']);

    const leftWall = computeWallNeighbors(1, 2, wallSet);
    expect(leftWall.right).toBe(true);
    expect(leftWall.left).toBe(false);

    const midWall = computeWallNeighbors(2, 2, wallSet);
    expect(midWall.left).toBe(true);
    expect(midWall.right).toBe(true);
    expect(midWall.top).toBe(false);
    expect(midWall.bottom).toBe(false);

    const rightWall = computeWallNeighbors(3, 2, wallSet);
    expect(rightWall.left).toBe(true);
    expect(rightWall.right).toBe(false);
  });

  it('correctly detects vertical neighbors', () => {
    const wallSet = new Set<string>(['2,1', '2,2', '2,3']);

    const topWall = computeWallNeighbors(2, 1, wallSet);
    expect(topWall.bottom).toBe(true);
    expect(topWall.top).toBe(false);

    const midWall = computeWallNeighbors(2, 2, wallSet);
    expect(midWall.top).toBe(true);
    expect(midWall.bottom).toBe(true);
    expect(midWall.left).toBe(false);
    expect(midWall.right).toBe(false);

    const bottomWall = computeWallNeighbors(2, 3, wallSet);
    expect(bottomWall.top).toBe(true);
    expect(bottomWall.bottom).toBe(false);
  });

  it('correctly detects corner/diagonal neighbor for 2x2 wall clusters', () => {
    const wallSet = new Set<string>(['0,0', '1,0', '0,1', '1,1']);

    const topLeftWall = computeWallNeighbors(0, 0, wallSet);
    expect(topLeftWall.right).toBe(true);
    expect(topLeftWall.bottom).toBe(true);
    expect(topLeftWall.bottomRight).toBe(true);
    expect(topLeftWall.top).toBe(false);
    expect(topLeftWall.left).toBe(false);
  });
});

describe('Wall Autotiling: computeWallCornerRadii', () => {
  const defaultR = 'calc(var(--cell-size) * 0.16)';

  it('returns default uniform radius for non-wall cells', () => {
    const radii = computeWallCornerRadii(false, undefined, defaultR);
    expect(radii).toBe(defaultR);
  });

  it('returns all 4 corners rounded for isolated walls', () => {
    const isolatedNeighbors = {
      top: false,
      bottom: false,
      left: false,
      right: false,
    };
    const radii = computeWallCornerRadii(true, isolatedNeighbors, defaultR);
    expect(radii).toBe(`${defaultR} ${defaultR} ${defaultR} ${defaultR}`);
  });

  it('flattens touching corners for horizontal connected walls', () => {
    // Left-most wall: right side is shared, so TR and BR become 0px
    const leftNeighbors = {
      top: false,
      bottom: false,
      left: false,
      right: true,
    };
    expect(computeWallCornerRadii(true, leftNeighbors, defaultR)).toBe(
      `${defaultR} 0px 0px ${defaultR}`
    );

    // Right-most wall: left side is shared, so TL and BL become 0px
    const rightNeighbors = {
      top: false,
      bottom: false,
      left: true,
      right: false,
    };
    expect(computeWallCornerRadii(true, rightNeighbors, defaultR)).toBe(
      `0px ${defaultR} ${defaultR} 0px`
    );

    // Middle horizontal wall: both sides shared, all 4 corners flat
    const midNeighbors = {
      top: false,
      bottom: false,
      left: true,
      right: true,
    };
    expect(computeWallCornerRadii(true, midNeighbors, defaultR)).toBe(
      '0px 0px 0px 0px'
    );
  });

  it('flattens touching corners for vertical connected walls', () => {
    // Top-most wall: bottom side is shared, so BR and BL become 0px
    const topNeighbors = {
      top: false,
      bottom: true,
      left: false,
      right: false,
    };
    expect(computeWallCornerRadii(true, topNeighbors, defaultR)).toBe(
      `${defaultR} ${defaultR} 0px 0px`
    );

    // Bottom-most wall: top side is shared, so TL and TR become 0px
    const bottomNeighbors = {
      top: true,
      bottom: false,
      left: false,
      right: false,
    };
    expect(computeWallCornerRadii(true, bottomNeighbors, defaultR)).toBe(
      `0px 0px ${defaultR} ${defaultR}`
    );

    // Middle vertical wall: top and bottom shared, all 4 corners flat
    const midNeighbors = {
      top: true,
      bottom: true,
      left: false,
      right: false,
    };
    expect(computeWallCornerRadii(true, midNeighbors, defaultR)).toBe(
      '0px 0px 0px 0px'
    );
  });

  it('keeps only the exterior corner rounded in a 2x2 corner wall block', () => {
    // Top-left cell in a 2x2: only TL is exterior
    const topLeft = {
      top: false,
      bottom: true,
      left: false,
      right: true,
    };
    expect(computeWallCornerRadii(true, topLeft, defaultR)).toBe(
      `${defaultR} 0px 0px 0px`
    );

    // Top-right cell in a 2x2: only TR is exterior
    const topRight = {
      top: false,
      bottom: true,
      left: true,
      right: false,
    };
    expect(computeWallCornerRadii(true, topRight, defaultR)).toBe(
      `0px ${defaultR} 0px 0px`
    );

    // Bottom-left cell in a 2x2: only BL is exterior
    const bottomLeft = {
      top: true,
      bottom: false,
      left: false,
      right: true,
    };
    expect(computeWallCornerRadii(true, bottomLeft, defaultR)).toBe(
      `0px 0px 0px ${defaultR}`
    );

    // Bottom-right cell in a 2x2: only BR is exterior
    const bottomRight = {
      top: true,
      bottom: false,
      left: true,
      right: false,
    };
    expect(computeWallCornerRadii(true, bottomRight, defaultR)).toBe(
      `0px 0px ${defaultR} 0px`
    );
  });
});
