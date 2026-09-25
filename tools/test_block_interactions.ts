import {
  solvePuzzlePushBFS,
  simulatePushSlide,
  pruneUnusedWalls,
  getReachableTiles,
  type SolverBlock,
  type SolverTarget,
  type Position,
  type PuzzleSolverInput,
} from '../src/client/utils/puzzleSolver.ts';

import { getDetailedInteractionMetrics } from './test_block_interactions.ts';

export function testMultiCollisionGen() {
  const width = 9;
  const height = 9;
  const numBlocks = 3;
  const colorPool = ['red', 'blue', 'yellow', 'purple', 'green', 'orange'];

  for (let attempt = 0; attempt < 100; attempt++) {
    const walls: Position[] = [];
    const wallSet = new Set<string>();

    const chosenColors = colorPool.slice(0, numBlocks);

    // 1. Distribute targets across distinct quadrants
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

    // Scramble in reverse: heavily encourage placing blocks in collision trajectories of each other
    for (let bIdx = numBlocks - 1; bIdx >= 0; bIdx--) {
      let placed = false;

      for (let tryCount = 0; tryCount < 40; tryCount++) {
        const draftWalls: Position[] = [];
        const draftWallKeys: string[] = [];
        let curr = { ...currentPositions[bIdx]! };

        const cardDirs: Position[] = [
          { x: 0, y: -1 },
          { x: 0, y: 1 },
          { x: -1, y: 0 },
          { x: 1, y: 0 },
        ];

        const dirOptions: { dir: Position; maxSteps: number; usesBlockAsBackboard: boolean }[] = [];
        for (const d of cardDirs) {
          const rev = { x: -d.x, y: -d.y };
          const maxSteps = getClearSteps(curr, rev, draftWallKeys, bIdx);
          if (maxSteps >= 1) {
            const forwardStopTile = { x: curr.x + d.x, y: curr.y + d.y };
            const isStoppedByBlock = currentPositions.some((p, idx) => idx !== bIdx && p.x === forwardStopTile.x && p.y === forwardStopTile.y);
            dirOptions.push({ dir: d, maxSteps, usesBlockAsBackboard: isStoppedByBlock });
          }
        }

        if (dirOptions.length === 0) continue;

        dirOptions.sort((a, b) => {
          if (a.usesBlockAsBackboard && !b.usesBlockAsBackboard) return -1;
          if (!a.usesBlockAsBackboard && b.usesBlockAsBackboard) return 1;
          return b.maxSteps - a.maxSteps;
        });

        let currFwd = dirOptions[0]!.dir;

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

        let stepFailed = false;
        const numPushes = 3; // 3 pushes per block

        for (let p = 0; p < numPushes; p++) {
          if (p > 0) {
            const perps: Position[] =
              currFwd.x === 0 ? [{ x: -1, y: 0 }, { x: 1, y: 0 }] : [{ x: 0, y: -1 }, { x: 0, y: 1 }];

            const perpOptions: { dir: Position; maxSteps: number; usesBlock: boolean }[] = [];
            for (const perp of perps) {
              const rev = { x: -perp.x, y: -perp.y };
              const maxSteps = getClearSteps(curr, rev, draftWallKeys, bIdx);
              if (maxSteps >= 1) {
                const nextPushTile = { x: curr.x - currFwd.x, y: curr.y - currFwd.y };
                const isPushTileOpen =
                  nextPushTile.x >= 0 && nextPushTile.x < width &&
                  nextPushTile.y >= 0 && nextPushTile.y < height &&
                  !wallSet.has(`${nextPushTile.x},${nextPushTile.y}`) &&
                  !draftWallKeys.includes(`${nextPushTile.x},${nextPushTile.y}`);

                if (isPushTileOpen) {
                  const swCheck = { x: curr.x + perp.x, y: curr.y + perp.y };
                  const isBlockBackboard = currentPositions.some((pos, idx) => idx !== bIdx && pos.x === swCheck.x && pos.y === swCheck.y);
                  perpOptions.push({ dir: perp, maxSteps, usesBlock: isBlockBackboard });
                }
              }
            }

            if (perpOptions.length === 0) {
              stepFailed = true;
              break;
            }

            perpOptions.sort((a, b) => {
              if (a.usesBlock && !b.usesBlock) return -1;
              if (!a.usesBlock && b.usesBlock) return 1;
              return b.maxSteps - a.maxSteps;
            });

            const chosenTurn = perpOptions[0]!.dir;

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
          if (maxSteps === 0) {
            stepFailed = true;
            break;
          }

          const maxPull = maxSteps >= 2 ? maxSteps - 1 : 1;
          const minPull = maxPull >= 3 ? 3 : (maxPull >= 2 ? 2 : 1);
          const pullDist = Math.floor(Math.random() * (maxPull - minPull + 1)) + minPull;

          curr = { x: curr.x + rev.x * pullDist, y: curr.y + rev.y * pullDist };
        }

        if (stepFailed) continue;

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

    const blocks: SolverBlock[] = [
      { id: `b_${chosenColors[0]}_0`, color: chosenColors[0]!, x: currentPositions[0]!.x, y: currentPositions[0]!.y },
      { id: `b_${chosenColors[1]}_1`, color: chosenColors[1]!, x: currentPositions[1]!.x, y: currentPositions[1]!.y },
      { id: `b_${chosenColors[2]}_2`, color: chosenColors[2]!, x: currentPositions[2]!.x, y: currentPositions[2]!.y },
    ];

    const blockSet = new Set(blocks.map((b) => `${b.x},${b.y}`));

    const representativeTiles: Position[] = [];
    const visitedFloor = new Set<string>();

    for (let py = 0; py < height; py++) {
      for (let px = 0; px < width; px++) {
        const k = `${px},${py}`;
        if (!wallSet.has(k) && !blockSet.has(k) && !targets.some((t) => t.x === px && t.y === py)) {
          if (!visitedFloor.has(k)) {
            representativeTiles.push({ x: px, y: py });
            const comp = getReachableTiles(width, height, { x: px, y: py }, wallSet, blockSet);
            for (const ck of comp) {
              visitedFloor.add(ck);
            }
          }
        }
      }
    }

    for (const pos of representativeTiles) {
      const sol = solvePuzzlePushBFS({
        width,
        height,
        player: pos,
        walls,
        blocks,
        targets,
        portals: [],
      }, 2500);

      if (sol && sol.solved && sol.pushCount >= 6) {
        const finalWalls = pruneUnusedWalls(width, height, pos, walls, blocks, targets, sol.pushCount);
        const metrics = getDetailedInteractionMetrics(width, height, pos, finalWalls, blocks, sol.moves);

        // Filter for high interaction: at least 1 block collision and at least 2 block switches
        if (metrics.blockCollisions >= 1 && metrics.blockSwitches >= 2 && metrics.avgSlideDist >= 2.8) {
          return {
            attempt,
            player: pos,
            walls: finalWalls,
            blocks,
            targets,
            solutionMoves: sol.moves,
            pushCount: sol.pushCount,
            totalMoves: sol.moves.length,
            blockCollisions: metrics.blockCollisions,
            blockSwitches: metrics.blockSwitches,
            averageSlideDistance: Math.round(metrics.avgSlideDist * 10) / 10,
            slideDistances: metrics.slideDistances,
            pushSequence: metrics.pushSequence,
          };
        }
      }
    }
  }

  return null;
}

console.log('Testing 3 multi-collision puzzle samples...');
for (let i = 1; i <= 3; i++) {
  const t0 = Date.now();
  const p = testMultiCollisionGen();
  console.log(`\n================== SAMPLE PUZZLE ${i} (${Date.now() - t0}ms) ==================`);
  console.log(`Pushes: ${p?.pushCount}, Moves: ${p?.totalMoves}, Block Collisions: ${p?.blockCollisions}, Block Switches: ${p?.blockSwitches}, Avg Slide Dist: ${p?.averageSlideDistance}`);
  console.log('Push Sequence:');
  p?.pushSequence.forEach((step, idx) => {
    console.log(`  ${idx + 1}. Push ${step.blockId} ${step.dir} (dist ${step.dist}) -> stopped by ${step.stoppedBy} ${step.stoppedByBlockId ? '(' + step.stoppedByBlockId + ')' : ''}`);
  });
}
