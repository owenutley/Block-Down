import { solvePuzzlePushBFS, pruneUnusedWalls, getPuzzlePushMetrics, getReachableTiles, type SolverBlock, type SolverTarget, type Position, type PuzzleSolverInput } from '../src/client/utils/puzzleSolver.ts';

const width = 9;
const height = 9;
const numBlocks = 3;
const colorPool = ['red', 'blue', 'yellow', 'purple', 'green', 'orange'];

console.log('Testing 20 attempts with push tile validation...');
let solvedCount = 0;

for (let attempt = 0; attempt < 20; attempt++) {
  const walls: Position[] = [];
  const wallSet = new Set<string>();

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
    targets.push({ id: `t_${colorPool[b]}_${b}`, color: colorPool[b]!, x: tx, y: ty });
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

  for (let bIdx = numBlocks - 1; bIdx >= 0; bIdx--) {
    let placed = false;

    for (let tryCount = 0; tryCount < 30; tryCount++) {
      const draftWalls: Position[] = [];
      const draftWallKeys: string[] = [];
      let curr = { ...currentPositions[bIdx]! };

      const cardDirs: Position[] = [
        { x: 0, y: -1 },
        { x: 0, y: 1 },
        { x: -1, y: 0 },
        { x: 1, y: 0 },
      ];

      const dirOptions: { dir: Position; maxSteps: number }[] = [];
      for (const d of cardDirs) {
        const rev = { x: -d.x, y: -d.y };
        const maxSteps = getClearSteps(curr, rev, draftWallKeys, bIdx);
        if (maxSteps >= 1) {
          dirOptions.push({ dir: d, maxSteps });
        }
      }

      if (dirOptions.length === 0) continue;
      dirOptions.sort((a, b) => b.maxSteps - a.maxSteps);
      let currFwd = dirOptions[0]!.dir;

      const targetSw = { x: curr.x + currFwd.x, y: curr.y + currFwd.y };
      const targetSwK = `${targetSw.x},${targetSw.y}`;
      if (
        targetSw.x >= 0 && targetSw.x < width &&
        targetSw.y >= 0 && targetSw.y < height &&
        !wallSet.has(targetSwK) &&
        !targets.some((t) => t.x === targetSw.x && t.y === targetSw.y) &&
        !currentPositions.some((p) => p.x === targetSw.x && p.y === targetSw.y)
      ) {
        draftWalls.push(targetSw);
        draftWallKeys.push(targetSwK);
      }

      let stepFailed = false;
      const numPushes = 2 + Math.floor(Math.random() * 2); // 2-3 pushes per block

      for (let p = 0; p < numPushes; p++) {
        if (p > 0) {
          const perps: Position[] =
            currFwd.x === 0 ? [{ x: -1, y: 0 }, { x: 1, y: 0 }] : [{ x: 0, y: -1 }, { x: 0, y: 1 }];

          const perpOptions: { dir: Position; maxSteps: number }[] = [];
          for (const perp of perps) {
            const rev = { x: -perp.x, y: -perp.y };
            const maxSteps = getClearSteps(curr, rev, draftWallKeys, bIdx);
            if (maxSteps >= 1) {
              // Also verify player push tile for next push into currFwd is open
              const nextPushTile = { x: curr.x - currFwd.x, y: curr.y - currFwd.y };
              const isPushTileOpen =
                nextPushTile.x >= 0 && nextPushTile.x < width &&
                nextPushTile.y >= 0 && nextPushTile.y < height &&
                !wallSet.has(`${nextPushTile.x},${nextPushTile.y}`) &&
                !draftWallKeys.includes(`${nextPushTile.x},${nextPushTile.y}`);

              if (isPushTileOpen) {
                perpOptions.push({ dir: perp, maxSteps });
              }
            }
          }

          if (perpOptions.length === 0) {
            stepFailed = true;
            break;
          }

          perpOptions.sort((a, b) => b.maxSteps - a.maxSteps);
          const chosenTurn = perpOptions[0]!.dir;

          const sw = { x: curr.x + chosenTurn.x, y: curr.y + chosenTurn.y };
          const swK = `${sw.x},${sw.y}`;
          if (
            sw.x >= 0 && sw.x < width &&
            sw.y >= 0 && sw.y < height &&
            !wallSet.has(swK) && !draftWallKeys.includes(swK) &&
            !targets.some((t) => t.x === sw.x && t.y === sw.y) &&
            !currentPositions.some((p) => p.x === sw.x && p.y === sw.y)
          ) {
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
    { id: 'b_red_0', color: 'red', x: currentPositions[0]!.x, y: currentPositions[0]!.y },
    { id: 'b_blue_1', color: 'blue', x: currentPositions[1]!.x, y: currentPositions[1]!.y },
    { id: 'b_yellow_2', color: 'yellow', x: currentPositions[2]!.x, y: currentPositions[2]!.y },
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
    const t0 = Date.now();
    const sol = solvePuzzlePushBFS({
      width,
      height,
      player: pos,
      walls,
      blocks,
      targets,
      portals: [],
    }, 2500);

    if (sol && sol.solved && sol.pushCount >= 5) {
      const finalWalls = pruneUnusedWalls(width, height, pos, walls, blocks, targets, sol.pushCount);
      const metrics = getPuzzlePushMetrics(width, height, pos, finalWalls, blocks, targets, sol.moves);
      if (metrics.averageSlideDistance >= 2.6) {
        solvedCount++;
        console.log(`Attempt ${attempt} SUCCESS (${Date.now() - t0}ms): pushes=${sol.pushCount}, moves=${sol.moves.length}, avgDist=${metrics.averageSlideDistance.toFixed(2)}, walls=${finalWalls.length}`);
        break;
      }
    }
  }
}

console.log(`\nTotal solved: ${solvedCount}/20`);
