import { solvePuzzlePushBFS, pruneUnusedWalls, getPuzzlePushMetrics, type SolverBlock, type SolverTarget, type Position, type PuzzleSolverInput } from '../src/client/utils/puzzleSolver.ts';

export function testSmartWallGen() {
  const width = 9;
  const height = 9;
  const numBlocks = 3;
  const colorPool = ['red', 'blue', 'yellow', 'purple', 'green', 'orange'];

  for (let attempt = 0; attempt < 50; attempt++) {
    const walls: Position[] = [];
    const wallSet = new Set<string>();

    const chosenColors = colorPool.slice(0, numBlocks);

    // 1. Distribute targets across distinct quadrants / perimeters
    const targets: SolverTarget[] = [];
    const quadrants = [
      { minX: 1, maxX: 3, minY: 1, maxY: 3 },
      { minX: 5, maxX: 7, minY: 1, maxY: 3 },
      { minX: 1, maxX: 3, minY: 5, maxY: 7 },
      { minX: 5, maxX: 7, minY: 5, maxY: 7 },
    ];
    for (let i = quadrants.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [quadrants[i], quadrants[j]] = [quadrants[j]!, quadrants[i]!];
    }

    for (let b = 0; b < numBlocks; b++) {
      const q = quadrants[b]!;
      const tx = Math.floor(Math.random() * (q.maxX - q.minX + 1)) + q.minX;
      const ty = Math.floor(Math.random() * (q.maxY - q.minY + 1)) + q.minY;
      targets.push({ id: `t_${chosenColors[b]}_${b}`, color: chosenColors[b]!, x: tx, y: ty });
    }

    const currentPositions = targets.map((t) => ({ x: t.x, y: t.y }));

    const getClearSteps = (from: Position, rev: Position, draftKeys: string[], ignoreIdx: number): number => {
      let steps = 0;
      for (let s = 1; s < 9; s++) {
        const nx = from.x + rev.x * s;
        const ny = from.y + rev.y * s;
        const k = `${nx},${ny}`;
        if (
          nx < 0 || nx >= width || ny < 0 || ny >= height ||
          wallSet.has(k) || draftKeys.includes(k) ||
          targets.some((t) => t.x === nx && t.y === ny) ||
          currentPositions.some((p, idx) => idx !== ignoreIdx && p.x === nx && p.y === ny)
        ) {
          break;
        }
        steps++;
      }
      return steps;
    };

    let layoutFailed = false;

    // Scramble in reverse order
    for (let bIdx = numBlocks - 1; bIdx >= 0; bIdx--) {
      let placed = false;

      for (let tryCount = 0; tryCount < 20; tryCount++) {
        const draftWalls: Position[] = [];
        const draftWallKeys: string[] = [];

        let curr = { ...currentPositions[bIdx]! };
        const cardDirs: Position[] = [
          { x: 0, y: -1 },
          { x: 0, y: 1 },
          { x: -1, y: 0 },
          { x: 1, y: 0 },
        ];

        // Evaluate available runways
        const dirOptions: { dir: Position; maxSteps: number }[] = [];
        for (const d of cardDirs) {
          const rev = { x: -d.x, y: -d.y };
          const maxSteps = getClearSteps(curr, rev, draftWallKeys, bIdx);
          if (maxSteps >= 2) {
            dirOptions.push({ dir: d, maxSteps });
          }
        }

        if (dirOptions.length === 0) continue;

        dirOptions.sort((a, b) => b.maxSteps - a.maxSteps);
        const topDirs = dirOptions.filter((d) => d.maxSteps >= Math.max(2, dirOptions[0]!.maxSteps - 1));
        const chosenEntry = topDirs[Math.floor(Math.random() * topDirs.length)]!;
        let currFwd = chosenEntry.dir;

        // Stopping wall behind target ONLY if not already stopped by border/block/wall
        const targetSw = { x: curr.x + currFwd.x, y: curr.y + currFwd.y };
        const targetSwK = `${targetSw.x},${targetSw.y}`;
        const isTargetSwBorder = targetSw.x < 0 || targetSw.x >= width || targetSw.y < 0 || targetSw.y >= height;
        const isTargetSwBlock = currentPositions.some((p) => p.x === targetSw.x && p.y === targetSw.y);
        const isTargetSwExistingWall = wallSet.has(targetSwK);
        const isTargetSwTarget = targets.some((t) => t.x === targetSw.x && t.y === targetSw.y);

        if (!isTargetSwBorder && !isTargetSwBlock && !isTargetSwExistingWall && !isTargetSwTarget) {
          draftWalls.push(targetSw);
          draftWallKeys.push(targetSwK);
        }

        const numPushes = 3; // 3 pushes per block
        let stepFailed = false;

        for (let p = 0; p < numPushes; p++) {
          if (p > 0) {
            const perps: Position[] =
              currFwd.x === 0 ? [{ x: -1, y: 0 }, { x: 1, y: 0 }] : [{ x: 0, y: -1 }, { x: 0, y: 1 }];

            const perpOptions: { dir: Position; maxSteps: number }[] = [];
            for (const perp of perps) {
              const rev = { x: -perp.x, y: -perp.y };
              const maxSteps = getClearSteps(curr, rev, draftWallKeys, bIdx);
              if (maxSteps >= 2) {
                perpOptions.push({ dir: perp, maxSteps });
              }
            }

            if (perpOptions.length === 0) {
              stepFailed = true;
              break;
            }

            perpOptions.sort((a, b) => b.maxSteps - a.maxSteps);
            const chosenTurn = perpOptions[0]!.dir;

            // Stopping wall for turn ONLY if needed
            const sw = { x: curr.x + chosenTurn.x, y: curr.y + chosenTurn.y };
            const swK = `${sw.x},${sw.y}`;
            const isSwBorder = sw.x < 0 || sw.x >= width || sw.y < 0 || sw.y >= height;
            const isSwBlock = currentPositions.some((p) => p.x === sw.x && p.y === sw.y);
            const isSwWall = wallSet.has(swK) || draftWallKeys.includes(swK);
            const isSwTarget = targets.some((t) => t.x === sw.x && t.y === sw.y);

            if (isSwTarget) {
              stepFailed = true;
              break;
            }

            if (!isSwBorder && !isSwBlock && !isSwWall) {
              draftWalls.push(sw);
              draftWallKeys.push(swK);
            }

            currFwd = chosenTurn;
          }

          const rev = { x: -currFwd.x, y: -currFwd.y };
          const maxSteps = getClearSteps(curr, rev, draftWallKeys, bIdx);
          const maxPullDist = maxSteps - 1;

          if (maxPullDist < 1) {
            stepFailed = true;
            break;
          }

          // Target 2 to 6 tile sweeping slide
          const minPull = maxPullDist >= 3 ? 3 : (maxPullDist >= 2 ? 2 : 1);
          const pullDist = Math.floor(Math.random() * (maxPullDist - minPull + 1)) + minPull;

          curr = {
            x: curr.x + rev.x * pullDist,
            y: curr.y + rev.y * pullDist,
          };
        }

        if (stepFailed) continue;
        if (targets.some((t) => t.x === curr.x && t.y === curr.y)) continue;

        for (let dw = 0; dw < draftWalls.length; dw++) {
          walls.push(draftWalls[dw]!);
          wallSet.add(draftWallKeys[dw]!);
        }
        currentPositions[bIdx] = { ...curr };
        placed = true;
        break;
      }

      if (!placed) {
        layoutFailed = true;
        break;
      }
    }

    if (layoutFailed) continue;

    const blocks: SolverBlock[] = [];
    for (let i = 0; i < numBlocks; i++) {
      const pos = currentPositions[i]!;
      blocks.push({ id: `b_${chosenColors[i]}_${i}`, color: chosenColors[i]!, x: pos.x, y: pos.y });
    }

    const openTiles: Position[] = [];
    for (let py = 0; py < height; py++) {
      for (let px = 0; px < width; px++) {
        const k = `${px},${py}`;
        if (!wallSet.has(k) && !blocks.some((b) => b.x === px && b.y === py) && !targets.some((t) => t.x === px && t.y === py)) {
          openTiles.push({ x: px, y: py });
        }
      }
    }

    for (let i = openTiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [openTiles[i], openTiles[j]] = [openTiles[j]!, openTiles[i]!];
    }

    let playerStart: Position | null = null;
    let verifiedSolution: ReturnType<typeof solvePuzzlePushBFS> = null;

    for (const pos of openTiles.slice(0, 3)) {
      const testInput: PuzzleSolverInput = {
        width,
        height,
        player: pos,
        walls,
        blocks,
        targets,
        portals: [],
      };

      const sol = solvePuzzlePushBFS(testInput, 800);
      if (sol && sol.solved && sol.pushCount >= 6) {
        const metrics = getPuzzlePushMetrics(width, height, pos, walls, blocks, targets, sol.moves);
        if (metrics.averageSlideDistance >= 2.8) {
          playerStart = pos;
          verifiedSolution = sol;
          break;
        }
      }
    }

    if (!playerStart || !verifiedSolution) continue;

    const finalWalls = pruneUnusedWalls(width, height, playerStart, walls, blocks, targets, verifiedSolution.pushCount);
    const finalMetrics = getPuzzlePushMetrics(width, height, playerStart, finalWalls, blocks, targets, verifiedSolution.moves);

    return {
      attempt,
      player: playerStart,
      walls: finalWalls,
      blocks,
      targets,
      solutionMoves: verifiedSolution.moves,
      pushCount: verifiedSolution.pushCount,
      totalMoves: verifiedSolution.moves.length,
      averageSlideDistance: Math.round(finalMetrics.averageSlideDistance * 10) / 10,
      slideDistances: finalMetrics.slideDistances,
    };
  }

  return null;
}

console.log('Testing testSmartWallGen...');
for (let i = 1; i <= 5; i++) {
  const t0 = Date.now();
  const p = testSmartWallGen();
  console.log(`Puzzle ${i} in ${Date.now() - t0}ms:`, {
    pushes: p?.pushCount,
    moves: p?.totalMoves,
    avgDist: p?.averageSlideDistance,
    distances: p?.slideDistances,
    walls: p?.walls.length,
    attempt: p?.attempt,
  });
}
