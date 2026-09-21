export type WallNeighbors = {
  top: boolean;
  bottom: boolean;
  left: boolean;
  right: boolean;
  bottomRight?: boolean | undefined;
};

/**
 * Computes neighboring wall connectivity for a given cell (x, y) based on a set of wall keys "x,y".
 */
export const computeWallNeighbors = (
  x: number,
  y: number,
  wallSet: ReadonlySet<string>
): WallNeighbors => ({
  top: wallSet.has(`${x},${y - 1}`),
  bottom: wallSet.has(`${x},${y + 1}`),
  left: wallSet.has(`${x - 1},${y}`),
  right: wallSet.has(`${x + 1},${y}`),
  bottomRight: wallSet.has(`${x + 1},${y + 1}`),
});

/**
 * Computes selective 4-corner CSS border-radius for connected walls.
 * Only outer exposed corners are rounded, while adjacent shared corners are flattened (0px),
 * seamlessly merging multi-tile walls into unified shapes.
 */
export const computeWallCornerRadii = (
  hasWall: boolean,
  wallNeighbors?: WallNeighbors | undefined,
  radiusVal = 'calc(var(--cell-size) * 0.16)'
): string => {
  if (!hasWall) return radiusVal;
  const rTL = !wallNeighbors?.top && !wallNeighbors?.left ? radiusVal : '0px';
  const rTR = !wallNeighbors?.top && !wallNeighbors?.right ? radiusVal : '0px';
  const rBR = !wallNeighbors?.bottom && !wallNeighbors?.right ? radiusVal : '0px';
  const rBL = !wallNeighbors?.bottom && !wallNeighbors?.left ? radiusVal : '0px';
  return `${rTL} ${rTR} ${rBR} ${rBL}`;
};
