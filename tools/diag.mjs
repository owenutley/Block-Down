// Documents/game-dev/devvit-games/block-down/src/client/utils/puzzle.ts
var dirToVector = (dir) => {
  switch (dir) {
    case "Up":
      return { x: 0, y: -1 };
    case "Down":
      return { x: 0, y: 1 };
    case "Left":
      return { x: -1, y: 0 };
    case "Right":
      return { x: 1, y: 0 };
  }
};

// Documents/game-dev/devvit-games/block-down/src/client/utils/puzzleSolver.ts
var isStateSolved = (blocks, targets) => {
  if (targets.length === 0) return false;
  return targets.every(
    (target) => blocks.some((b) => b.x === target.x && b.y === target.y && b.color.toLowerCase() === target.color.toLowerCase())
  );
};
var getReachableTiles = (width2, height2, player, wallSet, blockSet) => {
  const reachable = /* @__PURE__ */ new Set();
  const startKey = `${player.x},${player.y}`;
  reachable.add(startKey);
  const queue = [{ ...player }];
  let qHead = 0;
  const dirs = [
    { x: 0, y: -1 },
    { x: 0, y: 1 },
    { x: -1, y: 0 },
    { x: 1, y: 0 }
  ];
  while (qHead < queue.length) {
    const curr = queue[qHead++];
    for (const d of dirs) {
      const nx = curr.x + d.x;
      const ny = curr.y + d.y;
      const k = `${nx},${ny}`;
      if (nx >= 0 && nx < width2 && ny >= 0 && ny < height2 && !wallSet.has(k) && !blockSet.has(k) && !reachable.has(k)) {
        reachable.add(k);
        queue.push({ x: nx, y: ny });
      }
    }
  }
  return reachable;
};
var findWalkPath = (width2, height2, start, target, wallSet, blockSet) => {
  if (start.x === target.x && start.y === target.y) return [];
  const visited = /* @__PURE__ */ new Set();
  visited.add(`${start.x},${start.y}`);
  const queue = [{ pos: start, moves: [] }];
  let qHead = 0;
  const dirMoves = [
    { dir: "Up", v: { x: 0, y: -1 } },
    { dir: "Down", v: { x: 0, y: 1 } },
    { dir: "Left", v: { x: -1, y: 0 } },
    { dir: "Right", v: { x: 1, y: 0 } }
  ];
  while (qHead < queue.length) {
    const curr = queue[qHead++];
    for (const dm of dirMoves) {
      const nx = curr.pos.x + dm.v.x;
      const ny = curr.pos.y + dm.v.y;
      const k = `${nx},${ny}`;
      if (nx === target.x && ny === target.y) {
        return [...curr.moves, dm.dir];
      }
      if (nx >= 0 && nx < width2 && ny >= 0 && ny < height2 && !wallSet.has(k) && !blockSet.has(k) && !visited.has(k)) {
        visited.add(k);
        queue.push({ pos: { x: nx, y: ny }, moves: [...curr.moves, dm.dir] });
      }
    }
  }
  return null;
};
var simulatePushSlide = (width2, height2, block, otherBlocks, wallSet, dir) => {
  const dirVector = dirToVector(dir);
  const otherBlockSet = new Set(otherBlocks.map((b) => `${b.x},${b.y}`));
  let currX = block.x;
  let currY = block.y;
  while (true) {
    const nextX = currX + dirVector.x;
    const nextY = currY + dirVector.y;
    const k = `${nextX},${nextY}`;
    if (nextX < 0 || nextX >= width2 || nextY < 0 || nextY >= height2 || wallSet.has(k) || otherBlockSet.has(k)) {
      break;
    }
    currX = nextX;
    currY = nextY;
  }
  return { x: currX, y: currY };
};
var solvePuzzlePushBFS = (input, maxPushStates = 6e3) => {
  const { width: width2, height: height2, player, walls, blocks, targets } = input;
  const wallSet = new Set(walls.map((w) => `${w.x},${w.y}`));
  if (isStateSolved(blocks, targets)) {
    return { moves: [], pushCount: 0, solved: true };
  }
  const getPushStateKey = (curBlocks, reachable) => {
    const sortedBlocks = curBlocks.slice().sort((a, b) => a.id.localeCompare(b.id)).map((b) => `${b.id}:${b.x},${b.y}`).join(";");
    let minReachable = "none";
    for (const k of reachable) {
      if (minReachable === "none" || k < minReachable) {
        minReachable = k;
      }
    }
    return `${minReachable}|${sortedBlocks}`;
  };
  const initialBlockSet = new Set(blocks.map((b) => `${b.x},${b.y}`));
  const initialReachable = getReachableTiles(width2, height2, player, wallSet, initialBlockSet);
  const visited = /* @__PURE__ */ new Set();
  visited.add(getPushStateKey(blocks, initialReachable));
  const queue = [
    {
      player: { ...player },
      blocks: blocks.map((b) => ({ ...b })),
      pushHistory: []
    }
  ];
  const dirs = [
    { dir: "Up", v: { x: 0, y: -1 } },
    { dir: "Down", v: { x: 0, y: 1 } },
    { dir: "Left", v: { x: -1, y: 0 } },
    { dir: "Right", v: { x: 1, y: 0 } }
  ];
  let qHead = 0;
  let explored = 0;
  while (qHead < queue.length && explored < maxPushStates) {
    const curr = queue[qHead++];
    explored++;
    const curBlockSet = new Set(curr.blocks.map((b) => `${b.x},${b.y}`));
    const curReachable = getReachableTiles(width2, height2, curr.player, wallSet, curBlockSet);
    for (let bIdx = 0; bIdx < curr.blocks.length; bIdx++) {
      const block = curr.blocks[bIdx];
      const otherBlocks = curr.blocks.filter((_, i) => i !== bIdx);
      for (const d of dirs) {
        const pushTile = { x: block.x - d.v.x, y: block.y - d.v.y };
        const pushKey = `${pushTile.x},${pushTile.y}`;
        if (!curReachable.has(pushKey)) continue;
        const newBlockPos = simulatePushSlide(width2, height2, block, otherBlocks, wallSet, d.dir);
        if (newBlockPos.x === block.x && newBlockPos.y === block.y) {
          continue;
        }
        const newPlayerPos = { x: block.x, y: block.y };
        const newBlocks = curr.blocks.map(
          (b, i) => i === bIdx ? { ...b, x: newBlockPos.x, y: newBlockPos.y } : { ...b }
        );
        const newPushHistory = [
          ...curr.pushHistory,
          {
            fromPlayer: curr.player,
            toPushTile: pushTile,
            blockIdx: bIdx,
            pushDir: d.dir
          }
        ];
        if (isStateSolved(newBlocks, targets)) {
          const fullMoves = [];
          let simPlayer = { ...player };
          const simBlocks = blocks.map((b) => ({ ...b }));
          for (const step of newPushHistory) {
            const stepBlockSet = new Set(simBlocks.map((b) => `${b.x},${b.y}`));
            const walkMoves = findWalkPath(width2, height2, simPlayer, step.toPushTile, wallSet, stepBlockSet);
            if (!walkMoves) return null;
            fullMoves.push(...walkMoves);
            fullMoves.push(step.pushDir);
            const movingBlock = simBlocks[step.blockIdx];
            const others = simBlocks.filter((_, i) => i !== step.blockIdx);
            const endPos = simulatePushSlide(width2, height2, movingBlock, others, wallSet, step.pushDir);
            simPlayer = { x: movingBlock.x, y: movingBlock.y };
            simBlocks[step.blockIdx] = { ...movingBlock, x: endPos.x, y: endPos.y };
          }
          return {
            moves: fullMoves,
            pushCount: newPushHistory.length,
            solved: true
          };
        }
        const newBlockSet = new Set(newBlocks.map((b) => `${b.x},${b.y}`));
        const newReachable = getReachableTiles(width2, height2, newPlayerPos, wallSet, newBlockSet);
        const stateKey = getPushStateKey(newBlocks, newReachable);
        if (!visited.has(stateKey)) {
          visited.add(stateKey);
          queue.push({
            player: newPlayerPos,
            blocks: newBlocks,
            pushHistory: newPushHistory
          });
        }
      }
    }
  }
  return null;
};
var pruneUnusedWalls = (width2, height2, player, walls, blocks, targets, expectedPushCount) => {
  let activeWalls = [...walls];
  for (let i = activeWalls.length - 1; i >= 0; i--) {
    const candidateWall = activeWalls[i];
    const testWalls = activeWalls.filter((w) => w !== candidateWall);
    const testInput = {
      width: width2,
      height: height2,
      player,
      walls: testWalls,
      blocks,
      targets,
      portals: []
    };
    const result = solvePuzzlePushBFS(testInput, 800);
    if (result && result.solved && result.pushCount === expectedPushCount) {
      activeWalls = testWalls;
    }
  }
  return activeWalls;
};

// Documents/game-dev/devvit-games/block-down/tools/diag.ts
var width = 9;
var height = 9;
var numBlocks = 3;
var colors = ["red", "blue", "yellow"];
function generateLongSlide() {
  for (let attempt = 0; attempt < 80; attempt++) {
    const walls = [];
    const wallSet = /* @__PURE__ */ new Set();
    const targets = [];
    for (let i = 0; i < numBlocks; i++) {
      for (let tTry = 0; tTry < 40; tTry++) {
        let tx;
        let ty;
        if (targets.length > 0 && Math.random() < 0.3) {
          const ref = targets[Math.floor(Math.random() * targets.length)];
          const dirs = [{ x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }];
          const d = dirs[Math.floor(Math.random() * dirs.length)];
          tx = ref.x + d.x;
          ty = ref.y + d.y;
        } else {
          const isEdge = Math.random() < 0.4;
          if (isEdge) {
            const side = Math.floor(Math.random() * 4);
            if (side === 0) {
              tx = Math.floor(Math.random() * width);
              ty = 0;
            } else if (side === 1) {
              tx = Math.floor(Math.random() * width);
              ty = height - 1;
            } else if (side === 2) {
              tx = 0;
              ty = Math.floor(Math.random() * height);
            } else {
              tx = width - 1;
              ty = Math.floor(Math.random() * height);
            }
          } else {
            tx = Math.floor(Math.random() * (width - 2)) + 1;
            ty = Math.floor(Math.random() * (height - 2)) + 1;
          }
        }
        if (tx < 0 || tx >= width || ty < 0 || ty >= height) continue;
        if (targets.some((t) => t.x === tx && t.y === ty)) continue;
        targets.push({ id: `t_${colors[i]}_${i}`, color: colors[i], x: tx, y: ty });
        break;
      }
    }
    if (targets.length < numBlocks) continue;
    const currentPositions = targets.map((t) => ({ x: t.x, y: t.y }));
    let layoutFailed = false;
    for (let bIdx = numBlocks - 1; bIdx >= 0; bIdx--) {
      let blockPlaced = false;
      for (let bTry = 0; bTry < 20; bTry++) {
        const draftWalls = [];
        const draftWallKeys = [];
        let curr = { ...currentPositions[bIdx] };
        const cardDirs = [
          { x: 0, y: -1 },
          { x: 0, y: 1 },
          { x: -1, y: 0 },
          { x: 1, y: 0 }
        ];
        for (let j = cardDirs.length - 1; j > 0; j--) {
          const k = Math.floor(Math.random() * (j + 1));
          [cardDirs[j], cardDirs[k]] = [cardDirs[k], cardDirs[j]];
        }
        let currFwd = null;
        for (const d of cardDirs) {
          const revX = curr.x - d.x;
          const revY = curr.y - d.y;
          if (revX >= 0 && revX < width && revY >= 0 && revY < height && !wallSet.has(`${revX},${revY}`) && !targets.some((t) => t.x === revX && t.y === revY) && !currentPositions.some((pos, idx) => idx !== bIdx && pos.x === revX && pos.y === revY)) {
            currFwd = d;
            break;
          }
        }
        if (!currFwd) continue;
        const targetSw = { x: curr.x + currFwd.x, y: curr.y + currFwd.y };
        const targetSwK = `${targetSw.x},${targetSw.y}`;
        const targetOnAnyTarget = targets.some((t) => t.x === targetSw.x && t.y === targetSw.y);
        const targetOnAnyBlock = currentPositions.some((p) => p.x === targetSw.x && p.y === targetSw.y);
        if (!targetOnAnyTarget && !targetOnAnyBlock && targetSw.x >= 0 && targetSw.x < width && targetSw.y >= 0 && targetSw.y < height && !wallSet.has(targetSwK)) {
          draftWalls.push(targetSw);
          draftWallKeys.push(targetSwK);
        }
        const numPushes = 2 + (Math.random() < 0.6 ? 1 : 0);
        let stepFailed = false;
        for (let p = 0; p < numPushes; p++) {
          if (p > 0) {
            const perps = currFwd.x === 0 ? [{ x: -1, y: 0 }, { x: 1, y: 0 }] : [{ x: 0, y: -1 }, { x: 0, y: 1 }];
            if (Math.random() < 0.5) perps.reverse();
            let chosenTurn = null;
            let chosenTurnSw = null;
            for (const candidatePerp of perps) {
              const testRevX = curr.x - candidatePerp.x;
              const testRevY = curr.y - candidatePerp.y;
              if (testRevX < 0 || testRevX >= width || testRevY < 0 || testRevY >= height || wallSet.has(`${testRevX},${testRevY}`) || draftWallKeys.includes(`${testRevX},${testRevY}`) || targets.some((t) => t.x === testRevX && t.y === testRevY) || currentPositions.some((pos, idx) => idx !== bIdx && pos.x === testRevX && pos.y === testRevY)) {
                continue;
              }
              const swPos = { x: curr.x + candidatePerp.x, y: curr.y + candidatePerp.y };
              const swK = `${swPos.x},${swPos.y}`;
              const isTurnOnTarget = targets.some((t) => t.x === swPos.x && t.y === swPos.y);
              const isTurnOnBlock = currentPositions.some((pos) => pos.x === swPos.x && pos.y === swPos.y);
              if (isTurnOnTarget) continue;
              chosenTurn = candidatePerp;
              if (!isTurnOnBlock && swPos.x >= 0 && swPos.x < width && swPos.y >= 0 && swPos.y < height && !wallSet.has(swK) && !draftWallKeys.includes(swK)) {
                chosenTurnSw = swPos;
              }
              break;
            }
            if (!chosenTurn) {
              stepFailed = true;
              break;
            }
            if (chosenTurnSw) {
              draftWalls.push(chosenTurnSw);
              draftWallKeys.push(`${chosenTurnSw.x},${chosenTurnSw.y}`);
            }
            currFwd = chosenTurn;
          }
          const rev = { x: -currFwd.x, y: -currFwd.y };
          const desiredDist = 2 + Math.floor(Math.random() * 5);
          let nx = curr.x;
          let ny = curr.y;
          let pulled = 0;
          for (let s = 1; s <= desiredDist; s++) {
            const testX = curr.x + rev.x * s;
            const testY = curr.y + rev.y * s;
            const k = `${testX},${testY}`;
            if (testX < 0 || testX >= width || testY < 0 || testY >= height || wallSet.has(k) || draftWallKeys.includes(k) || targets.some((t) => t.x === testX && t.y === testY) || currentPositions.some((pos, idx) => idx !== bIdx && pos.x === testX && pos.y === testY)) {
              break;
            }
            nx = testX;
            ny = testY;
            pulled++;
          }
          if (pulled === 0) {
            stepFailed = true;
            break;
          }
          curr = { x: nx, y: ny };
        }
        if (stepFailed) continue;
        if (targets.some((t) => t.x === curr.x && t.y === curr.y)) continue;
        for (let dwIdx = 0; dwIdx < draftWalls.length; dwIdx++) {
          walls.push(draftWalls[dwIdx]);
          wallSet.add(draftWallKeys[dwIdx]);
        }
        currentPositions[bIdx] = { ...curr };
        blockPlaced = true;
        break;
      }
      if (!blockPlaced) {
        layoutFailed = true;
        break;
      }
    }
    if (layoutFailed) continue;
    const blocks = [];
    for (let i = 0; i < numBlocks; i++) {
      const pos = currentPositions[i];
      blocks.push({ id: `b_${colors[i]}_${i}`, color: colors[i], x: pos.x, y: pos.y });
    }
    const openTiles = [];
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
      [openTiles[i], openTiles[j]] = [openTiles[j], openTiles[i]];
    }
    let playerStart = null;
    let verifiedSolution = null;
    for (const pos of openTiles.slice(0, 4)) {
      const testInput = {
        width,
        height,
        player: pos,
        walls,
        blocks,
        targets,
        portals: []
      };
      const sol = solvePuzzlePushBFS(testInput, 2500);
      if (sol && sol.solved && sol.pushCount >= 6) {
        playerStart = pos;
        verifiedSolution = sol;
        break;
      }
    }
    if (!playerStart || !verifiedSolution) continue;
    const finalWalls = pruneUnusedWalls(
      width,
      height,
      playerStart,
      walls,
      blocks,
      targets,
      verifiedSolution.pushCount
    );
    return {
      player: playerStart,
      walls: finalWalls,
      blocks,
      targets,
      moves: verifiedSolution.moves,
      pushCount: verifiedSolution.pushCount
    };
  }
  return null;
}
console.log("Generating 5 long-slide puzzles...");
for (let i = 1; i <= 5; i++) {
  const t0 = Date.now();
  const p = generateLongSlide();
  const t1 = Date.now();
  if (p) {
    console.log(`
[Long-Slide Puzzle #${i}] (${t1 - t0}ms)`);
    console.log(`Pushes: ${p.pushCount}, Total Moves: ${p.moves.length}, Walls: ${p.walls.length}, Player: (${p.player.x},${p.player.y})`);
    console.log(`Blocks:`, p.blocks.map((b) => `${b.color}@(${b.x},${b.y})`).join(", "));
    console.log(`Targets:`, p.targets.map((t) => `${t.color}@(${t.x},${t.y})`).join(", "));
  } else {
    console.log(`[Puzzle #${i}] Failed to generate`);
  }
}
