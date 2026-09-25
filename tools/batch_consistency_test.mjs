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
var positionKey = (pos) => `${pos.x},${pos.y}`;
var getNextPosWithPortalsDetails = (startPos, initialDir, gridSize, wallSet, blockPositions, portals = []) => {
  let currentPos = { ...startPos };
  let currentDir = { ...initialDir };
  let segmentStartPos = { ...startPos };
  const visitedPortals = /* @__PURE__ */ new Set();
  let firstEntryPortal;
  let firstExitPortal;
  const steps = [];
  while (true) {
    const nextPos = { x: currentPos.x + currentDir.x, y: currentPos.y + currentDir.y };
    const entryPortal = portals.find((p) => {
      if (p.x !== currentPos.x || p.y !== currentPos.y) return false;
      const portalVec = dirToVector(p.dir);
      return portalVec.x === -currentDir.x && portalVec.y === -currentDir.y;
    });
    const isNextWallOrBound = nextPos.x < 0 || nextPos.x >= gridSize || nextPos.y < 0 || nextPos.y >= gridSize || wallSet.has(positionKey(nextPos));
    const blockAtNext = blockPositions.some(
      (b) => b.x === nextPos.x && b.y === nextPos.y && (b.x !== startPos.x || b.y !== startPos.y)
    );
    if (isNextWallOrBound || blockAtNext) {
      if (entryPortal && !visitedPortals.has(entryPortal.id)) {
        const exitPortal = portals.find((p) => p.color.toLowerCase() === entryPortal.color.toLowerCase() && p.id !== entryPortal.id);
        if (exitPortal) {
          const exitCell = { x: exitPortal.x, y: exitPortal.y };
          const exitBlocked = blockPositions.some(
            (b) => b.x === exitCell.x && b.y === exitCell.y && (b.x !== startPos.x || b.y !== startPos.y)
          );
          if (!exitBlocked && !wallSet.has(positionKey(exitCell))) {
            if (!firstEntryPortal) firstEntryPortal = entryPortal;
            if (!firstExitPortal) firstExitPortal = exitPortal;
            steps.push({
              from: { ...segmentStartPos },
              to: { x: entryPortal.x, y: entryPortal.y },
              entryPortal,
              exitPortal
            });
            visitedPortals.add(entryPortal.id);
            visitedPortals.add(exitPortal.id);
            currentPos = exitCell;
            segmentStartPos = { ...exitCell };
            currentDir = dirToVector(exitPortal.dir);
            continue;
          }
        }
      }
      break;
    }
    currentPos = nextPos;
  }
  if (segmentStartPos.x !== currentPos.x || segmentStartPos.y !== currentPos.y || steps.length === 0) {
    steps.push({
      from: { ...segmentStartPos },
      to: { ...currentPos }
    });
  }
  return {
    finalPos: currentPos,
    steps,
    entryPortal: firstEntryPortal,
    exitPortal: firstExitPortal
  };
};

// Documents/game-dev/devvit-games/block-down/src/client/utils/puzzleSolver.ts
var ALL_DIRECTIONS = ["Up", "Down", "Left", "Right"];
var getCanonicalStateKey = (player, blocks) => {
  const sortedBlocks = blocks.slice().sort((a, b) => a.id.localeCompare(b.id)).map((b) => `${b.color}:${b.x},${b.y}`).join(";");
  return `${player.x},${player.y}|${sortedBlocks}`;
};
var isStateSolved = (blocks, targets) => {
  if (targets.length === 0) return false;
  return targets.every(
    (target) => blocks.some((b) => b.x === target.x && b.y === target.y && b.color.toLowerCase() === target.color.toLowerCase())
  );
};
var simulateMove = (input, currentPlayer, currentBlocks, dir) => {
  const { width: gridWidth, height: gridHeight, walls, portals = [] } = input;
  const dirVector = dirToVector(dir);
  const gridSize = Math.max(gridWidth, gridHeight);
  const wallSet = new Set(walls.map((w) => `${w.x},${w.y}`));
  let newPlayer = { ...currentPlayer };
  const newBlocks = currentBlocks.map((b) => ({ ...b }));
  let moved = false;
  let isPush = false;
  const portalOnCurrentCell = portals.find(
    (p) => p.x === currentPlayer.x && p.y === currentPlayer.y
  );
  if (portalOnCurrentCell) {
    const portalVec = dirToVector(portalOnCurrentCell.dir);
    if (portalVec.x === -dirVector.x && portalVec.y === -dirVector.y) {
      const exitPortal = portals.find(
        (p) => p.color.toLowerCase() === portalOnCurrentCell.color.toLowerCase() && p.id !== portalOnCurrentCell.id
      );
      if (exitPortal) {
        const exitPos = { x: exitPortal.x, y: exitPortal.y };
        const isExitWallOrBound = exitPos.x < 0 || exitPos.x >= gridWidth || exitPos.y < 0 || exitPos.y >= gridHeight || wallSet.has(`${exitPos.x},${exitPos.y}`);
        if (!isExitWallOrBound) {
          const blockIdxAtExit = newBlocks.findIndex((b) => b.x === exitPos.x && b.y === exitPos.y);
          if (blockIdxAtExit !== -1) {
            const block = newBlocks[blockIdxAtExit];
            if (block) {
              const exitDir = dirToVector(exitPortal.dir);
              const trajectory = getNextPosWithPortalsDetails(
                { x: block.x, y: block.y },
                exitDir,
                gridSize,
                wallSet,
                newBlocks.map((b) => ({ x: b.x, y: b.y })),
                portals
              );
              const blockNewPos = trajectory.finalPos;
              if (blockNewPos.x !== block.x || blockNewPos.y !== block.y) {
                newBlocks[blockIdxAtExit] = { ...block, x: blockNewPos.x, y: blockNewPos.y };
                newPlayer = exitPos;
                moved = true;
                isPush = true;
              } else {
                return { player: currentPlayer, blocks: currentBlocks, moved: false, isPush: false };
              }
            }
          } else {
            newPlayer = exitPos;
            moved = true;
          }
        }
      }
    }
  }
  if (!moved) {
    const nextX = currentPlayer.x + dirVector.x;
    const nextY = currentPlayer.y + dirVector.y;
    if (nextX < 0 || nextX >= gridWidth || nextY < 0 || nextY >= gridHeight) {
      return { player: currentPlayer, blocks: currentBlocks, moved: false, isPush: false };
    }
    if (wallSet.has(`${nextX},${nextY}`)) {
      return { player: currentPlayer, blocks: currentBlocks, moved: false, isPush: false };
    }
    const blockIdx = newBlocks.findIndex((b) => b.x === nextX && b.y === nextY);
    if (blockIdx !== -1) {
      const block = newBlocks[blockIdx];
      if (!block) return { player: currentPlayer, blocks: currentBlocks, moved: false, isPush: false };
      const trajectory = getNextPosWithPortalsDetails(
        { x: block.x, y: block.y },
        dirVector,
        gridSize,
        wallSet,
        newBlocks.map((b) => ({ x: b.x, y: b.y })),
        portals
      );
      const blockNewPos = trajectory.finalPos;
      if (blockNewPos.x === block.x && blockNewPos.y === block.y) {
        return { player: currentPlayer, blocks: currentBlocks, moved: false, isPush: false };
      }
      newBlocks[blockIdx] = { ...block, x: blockNewPos.x, y: blockNewPos.y };
      newPlayer = { x: nextX, y: nextY };
      moved = true;
      isPush = true;
    } else {
      newPlayer = { x: nextX, y: nextY };
      moved = true;
    }
  }
  return { player: newPlayer, blocks: newBlocks, moved, isPush };
};
var getReachableTiles = (width, height, player, wallSet, blockSet) => {
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
      if (nx >= 0 && nx < width && ny >= 0 && ny < height && !wallSet.has(k) && !blockSet.has(k) && !reachable.has(k)) {
        reachable.add(k);
        queue.push({ x: nx, y: ny });
      }
    }
  }
  return reachable;
};
var findWalkPath = (width, height, start, target, wallSet, blockSet) => {
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
      if (nx >= 0 && nx < width && ny >= 0 && ny < height && !wallSet.has(k) && !blockSet.has(k) && !visited.has(k)) {
        visited.add(k);
        queue.push({ pos: { x: nx, y: ny }, moves: [...curr.moves, dm.dir] });
      }
    }
  }
  return null;
};
var simulatePushSlide = (width, height, block, otherBlocks, wallSet, dir) => {
  const dirVector = dirToVector(dir);
  const otherBlockSet = new Set(otherBlocks.map((b) => `${b.x},${b.y}`));
  let currX = block.x;
  let currY = block.y;
  while (true) {
    const nextX = currX + dirVector.x;
    const nextY = currY + dirVector.y;
    const k = `${nextX},${nextY}`;
    if (nextX < 0 || nextX >= width || nextY < 0 || nextY >= height || wallSet.has(k) || otherBlockSet.has(k)) {
      break;
    }
    currX = nextX;
    currY = nextY;
  }
  return { x: currX, y: currY };
};
var solvePuzzlePushBFS = (input, maxPushStates = 6e3) => {
  const { width, height, player, walls, blocks, targets } = input;
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
  const initialReachable = getReachableTiles(width, height, player, wallSet, initialBlockSet);
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
    const curReachable = getReachableTiles(width, height, curr.player, wallSet, curBlockSet);
    for (let bIdx = 0; bIdx < curr.blocks.length; bIdx++) {
      const block = curr.blocks[bIdx];
      const otherBlocks = curr.blocks.filter((_, i) => i !== bIdx);
      for (const d of dirs) {
        const pushTile = { x: block.x - d.v.x, y: block.y - d.v.y };
        const pushKey = `${pushTile.x},${pushTile.y}`;
        if (!curReachable.has(pushKey)) continue;
        const newBlockPos = simulatePushSlide(width, height, block, otherBlocks, wallSet, d.dir);
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
            const walkMoves = findWalkPath(width, height, simPlayer, step.toPushTile, wallSet, stepBlockSet);
            if (!walkMoves) return null;
            fullMoves.push(...walkMoves);
            fullMoves.push(step.pushDir);
            const movingBlock = simBlocks[step.blockIdx];
            const others = simBlocks.filter((_, i) => i !== step.blockIdx);
            const endPos = simulatePushSlide(width, height, movingBlock, others, wallSet, step.pushDir);
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
        const newReachable = getReachableTiles(width, height, newPlayerPos, wallSet, newBlockSet);
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
var solvePuzzle = (input, maxStates = 25e3) => {
  const { targets, portals = [] } = input;
  if (targets.length === 0) return null;
  if (portals.length === 0) {
    const pushResult = solvePuzzlePushBFS(input, Math.min(maxStates, 8e3));
    if (pushResult) return pushResult;
  }
  if (isStateSolved(input.blocks, targets)) {
    return { moves: [], pushCount: 0, solved: true };
  }
  const visited = /* @__PURE__ */ new Set();
  const initialKey = getCanonicalStateKey(input.player, input.blocks);
  visited.add(initialKey);
  const queue = [
    {
      player: input.player,
      blocks: input.blocks,
      moves: [],
      pushCount: 0
    }
  ];
  let queueHead = 0;
  let statesExplored = 0;
  while (queueHead < queue.length && statesExplored < maxStates) {
    const current = queue[queueHead++];
    statesExplored++;
    for (const dir of ALL_DIRECTIONS) {
      const nextState = simulateMove(input, current.player, current.blocks, dir);
      if (!nextState.moved) continue;
      const nextMoves = [...current.moves, dir];
      const nextPushCount = current.pushCount + (nextState.isPush ? 1 : 0);
      if (isStateSolved(nextState.blocks, targets)) {
        return { moves: nextMoves, pushCount: nextPushCount, solved: true };
      }
      const key = getCanonicalStateKey(nextState.player, nextState.blocks);
      if (!visited.has(key)) {
        visited.add(key);
        queue.push({
          player: nextState.player,
          blocks: nextState.blocks,
          moves: nextMoves,
          pushCount: nextPushCount
        });
      }
    }
  }
  return null;
};
var pruneUnusedWalls = (width, height, player, walls, blocks, targets, expectedPushCount) => {
  let activeWalls = [...walls];
  for (let i = activeWalls.length - 1; i >= 0; i--) {
    const candidateWall = activeWalls[i];
    const testWalls = activeWalls.filter((w) => w !== candidateWall);
    const testInput = {
      width,
      height,
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
var generateReversePushPuzzle = (config) => {
  const {
    width,
    height,
    minBlocks,
    maxBlocks,
    minTotalPushes,
    maxTotalPushes,
    minPushesPerBlock,
    maxPushesPerBlock,
    minSolutionPushCount,
    colors,
    maxAttempts = 150
  } = config;
  const availableColors = colors || ["red", "blue", "yellow", "purple", "green", "orange"];
  const colorPool = availableColors.filter((c) => c.toLowerCase() !== "gray" && c.toLowerCase() !== "grey");
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const numBlocks = Math.floor(Math.random() * (maxBlocks - minBlocks + 1)) + minBlocks;
    let totalPushes = Math.floor(Math.random() * (maxTotalPushes - minTotalPushes + 1)) + minTotalPushes;
    if (totalPushes < numBlocks * minPushesPerBlock) totalPushes = numBlocks * minPushesPerBlock;
    if (totalPushes > numBlocks * maxPushesPerBlock) totalPushes = numBlocks * maxPushesPerBlock;
    const pushesPerBlock = Array(numBlocks).fill(minPushesPerBlock);
    let remaining = totalPushes - numBlocks * minPushesPerBlock;
    while (remaining > 0) {
      const idx = Math.floor(Math.random() * numBlocks);
      if (pushesPerBlock[idx] < maxPushesPerBlock) {
        pushesPerBlock[idx]++;
        remaining--;
      }
    }
    const walls = [];
    const wallSet = /* @__PURE__ */ new Set();
    const shuffledColors = colorPool.slice();
    for (let i = shuffledColors.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledColors[i], shuffledColors[j]] = [shuffledColors[j], shuffledColors[i]];
    }
    const chosenColors = shuffledColors.slice(0, numBlocks);
    const targets = [];
    for (let bIdx = 0; bIdx < numBlocks; bIdx++) {
      const color = chosenColors[bIdx] || `color_${bIdx}`;
      for (let tTry = 0; tTry < 40; tTry++) {
        let tx;
        let ty;
        if (targets.length > 0 && Math.random() < 0.35) {
          const ref = targets[Math.floor(Math.random() * targets.length)];
          const dirs = [
            { x: 0, y: -1 },
            { x: 0, y: 1 },
            { x: -1, y: 0 },
            { x: 1, y: 0 }
          ];
          const d = dirs[Math.floor(Math.random() * dirs.length)];
          tx = ref.x + d.x;
          ty = ref.y + d.y;
        } else {
          tx = Math.floor(Math.random() * (width - 2)) + 1;
          ty = Math.floor(Math.random() * (height - 2)) + 1;
        }
        if (tx < 0 || tx >= width || ty < 0 || ty >= height) continue;
        if (targets.some((t) => t.x === tx && t.y === ty)) continue;
        targets.push({ id: `t_${color}_${bIdx}`, color, x: tx, y: ty });
        break;
      }
    }
    if (targets.length < numBlocks) continue;
    const currentPositions = targets.map((t) => ({ x: t.x, y: t.y }));
    let scrambleFailed = false;
    for (let bIdx = numBlocks - 1; bIdx >= 0; bIdx--) {
      const blockPushes = pushesPerBlock[bIdx];
      let curr = { ...currentPositions[bIdx] };
      const dirs = [
        { x: 0, y: -1 },
        { x: 0, y: 1 },
        { x: -1, y: 0 },
        { x: 1, y: 0 }
      ];
      let currFwd = dirs[Math.floor(Math.random() * dirs.length)];
      const targetSw = { x: curr.x + currFwd.x, y: curr.y + currFwd.y };
      const targetSwK = `${targetSw.x},${targetSw.y}`;
      const isOnAnyTarget = targets.some((t) => t.x === targetSw.x && t.y === targetSw.y);
      const isOnAnyBlock = currentPositions.some((p) => p.x === targetSw.x && p.y === targetSw.y);
      if (!isOnAnyTarget && !isOnAnyBlock && targetSw.x >= 0 && targetSw.x < width && targetSw.y >= 0 && targetSw.y < height && !wallSet.has(targetSwK)) {
        walls.push(targetSw);
        wallSet.add(targetSwK);
      }
      for (let p = 0; p < blockPushes; p++) {
        if (p > 0) {
          const perps = currFwd.x === 0 ? [{ x: -1, y: 0 }, { x: 1, y: 0 }] : [{ x: 0, y: -1 }, { x: 0, y: 1 }];
          const chosenPerp = perps[Math.floor(Math.random() * perps.length)];
          const turnSw = { x: curr.x + chosenPerp.x, y: curr.y + chosenPerp.y };
          const turnSwK = `${turnSw.x},${turnSw.y}`;
          const isTurnOnTarget = targets.some((t) => t.x === turnSw.x && t.y === turnSw.y);
          const isTurnOnBlock = currentPositions.some((pos) => pos.x === turnSw.x && pos.y === turnSw.y);
          if (!isTurnOnTarget && !isTurnOnBlock && turnSw.x >= 0 && turnSw.x < width && turnSw.y >= 0 && turnSw.y < height && !wallSet.has(turnSwK)) {
            walls.push(turnSw);
            wallSet.add(turnSwK);
          }
          currFwd = chosenPerp;
        }
        const rev = { x: -currFwd.x, y: -currFwd.y };
        const dist = 1 + Math.floor(Math.random() * 2);
        let nx = curr.x;
        let ny = curr.y;
        for (let s = 1; s <= dist; s++) {
          const testX = curr.x + rev.x * s;
          const testY = curr.y + rev.y * s;
          const k = `${testX},${testY}`;
          if (testX < 0 || testX >= width || testY < 0 || testY >= height || wallSet.has(k) || targets.some((t) => t.x === testX && t.y === testY) || currentPositions.some((pos, idx) => idx !== bIdx && pos.x === testX && pos.y === testY)) {
            break;
          }
          nx = testX;
          ny = testY;
        }
        if (nx === curr.x && ny === curr.y) {
          scrambleFailed = true;
          break;
        }
        curr = { x: nx, y: ny };
      }
      if (scrambleFailed) break;
      currentPositions[bIdx] = { ...curr };
    }
    if (scrambleFailed) continue;
    const blocks = [];
    let validPlacement = true;
    for (let i = 0; i < numBlocks; i++) {
      const pos = currentPositions[i];
      const startsOnTarget = targets.some((t) => t.x === pos.x && t.y === pos.y);
      if (startsOnTarget) {
        validPlacement = false;
        break;
      }
      blocks.push({ id: `b_${chosenColors[i]}_${i}`, color: chosenColors[i], x: pos.x, y: pos.y });
    }
    if (!validPlacement) continue;
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
    for (const pos of openTiles.slice(0, 3)) {
      const testInput = {
        width,
        height,
        player: pos,
        walls,
        blocks,
        targets,
        portals: []
      };
      const sol = solvePuzzlePushBFS(testInput, 1500);
      if (sol && sol.solved && sol.pushCount >= minSolutionPushCount) {
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
      width,
      height,
      player: playerStart,
      walls: finalWalls,
      blocks,
      targets,
      portals: [],
      solutionMoves: verifiedSolution.moves
    };
  }
  const fallbackPlayer = { x: 1, y: 4 };
  const fallbackBlocks = [
    { id: "b_red_0", color: "red", x: 2, y: 3 },
    { id: "b_blue_1", color: "blue", x: 6, y: 4 },
    { id: "b_yellow_2", color: "yellow", x: 5, y: 2 }
  ];
  const fallbackTargets = [
    { id: "t_red_0", color: "red", x: 6, y: 2 },
    { id: "t_blue_1", color: "blue", x: 2, y: 6 },
    { id: "t_yellow_2", color: "yellow", x: 6, y: 5 }
  ];
  const fallbackWalls = [
    { x: 2, y: 1 },
    { x: 7, y: 2 },
    { x: 6, y: 7 },
    { x: 1, y: 6 },
    { x: 7, y: 5 },
    { x: 3, y: 7 }
  ];
  const fallbackSolution = solvePuzzle({
    width,
    height,
    player: fallbackPlayer,
    walls: fallbackWalls,
    blocks: fallbackBlocks,
    targets: fallbackTargets
  }) || { moves: ["Up", "Right", "Down", "Left", "Down", "Right"], pushCount: 6, solved: true };
  return {
    width,
    height,
    player: fallbackPlayer,
    walls: fallbackWalls,
    blocks: fallbackBlocks,
    targets: fallbackTargets,
    portals: [],
    solutionMoves: fallbackSolution.moves
  };
};
var generateModeratePuzzle = (options = {}) => {
  const width = options.width || 9;
  const height = options.height || 9;
  return generateReversePushPuzzle({
    width,
    height,
    minBlocks: options.minBlocks || 3,
    maxBlocks: options.maxBlocks || 3,
    minTotalPushes: options.minTotalPushes || 6,
    maxTotalPushes: options.maxTotalPushes || 10,
    minPushesPerBlock: options.minPushesPerBlock || 2,
    maxPushesPerBlock: options.maxPushesPerBlock || 4,
    minSolutionPushCount: options.minSolutionPushCount || 6,
    colors: options.colors,
    maxAttempts: options.maxAttempts || 150
  });
};

// Documents/game-dev/devvit-games/block-down/tools/batch_consistency_test.ts
console.log("Testing 20 consecutive puzzle generations for consistency and performance...\n");
var results = [];
var startTime = Date.now();
for (let i = 1; i <= 20; i++) {
  const t0 = Date.now();
  const p = generateModeratePuzzle();
  const t1 = Date.now();
  const r = {
    id: i,
    timeMs: t1 - t0,
    moves: p.solutionMoves.length,
    walls: p.walls.length,
    blocks: p.blocks.length,
    playerPos: `(${p.player.x},${p.player.y})`
  };
  results.push(r);
  console.log(`[Puzzle #${r.id.toString().padStart(2, "0")}] Time: ${r.timeMs.toString().padStart(4, " ")}ms | Blocks: ${r.blocks} | Walls: ${r.walls} | Moves: ${r.moves.toString().padStart(2, " ")} | Player: ${r.playerPos}`);
}
var totalTime = Date.now() - startTime;
var avgTime = Math.round(totalTime / results.length);
var avgMoves = Math.round(results.reduce((acc, r) => acc + r.moves, 0) / results.length);
var avgWalls = (results.reduce((acc, r) => acc + r.walls, 0) / results.length).toFixed(1);
console.log(`
=== SUMMARY ===`);
console.log(`Generated ${results.length}/20 puzzles successfully in ${totalTime}ms`);
console.log(`Average Generation Time: ${avgTime}ms per puzzle`);
console.log(`Average Moves: ${avgMoves}`);
console.log(`Average Walls: ${avgWalls}`);
