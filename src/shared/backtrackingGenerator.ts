import { Position, SolverBlock, SolverTarget, GeneratedPuzzle } from './types';

export type DirName = 'Up' | 'Down' | 'Left' | 'Right';
export type Pt = { x: number; y: number };
export type Push = { i: number; d: number };

export type Portal = {
  id: string;
  color: string;
  x: number;
  y: number;
  dir: DirName;
};

export const DX = [0, 0, -1, 1];
export const DY = [-1, 1, 0, 0];
export const DIR_NAMES: DirName[] = ['Up', 'Down', 'Left', 'Right'];
export const OPP_DIR = [1, 0, 3, 2]; // Up <-> Down, Left <-> Right

export const COLOR_NAMES = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];

const N = 9;
const rnd = (n: number) => Math.floor(Math.random() * n);
export const key = (x: number, y: number, size: number = N) => y * size + x;
export const inB = (x: number, y: number, size: number = N) => x >= 0 && y >= 0 && x < size && y < size;
export const isCorner = (x: number, y: number, size: number = N) =>
  (x === 0 || x === size - 1) && (y === 0 || y === size - 1);

export function dirIndex(dir: DirName): number {
  return DIR_NAMES.indexOf(dir);
}

export type Board = {
  size: number;
  wallSet: Set<number>;
  portals: Portal[];
};

export type ColoredTarget = Pt & { color: string };

export function isBlocked(L: Board, x: number, y: number): boolean {
  return !inB(x, y, L.size) || L.wallSet.has(key(x, y, L.size));
}

const hasBlock = (blocks: Pt[], x: number, y: number) => blocks.some((b) => b.x === x && b.y === y);

export function getPortalAt(L: Board, x: number, y: number): Portal | undefined {
  return L.portals.find((p) => p.x === x && p.y === y);
}

export function getPairedPortal(L: Board, portal: Portal): Portal | undefined {
  return L.portals.find((p) => p.color === portal.color && p.id !== portal.id);
}

export type SlideResult = {
  path: Pt[];
  endDir: number;
  usedPortal: boolean;
};

/**
 * Full slide evaluation including directional portal teleports and loop protection.
 */
export function slideDetails(
  L: Board,
  blocks: Pt[],
  idx: number,
  d: number,
  player?: Pt
): SlideResult {
  const path: Pt[] = [{ x: blocks[idx]!.x, y: blocks[idx]!.y }];
  let x = blocks[idx]!.x;
  let y = blocks[idx]!.y;
  let curD = d;
  let usedPortal = false;
  const visitedStates = new Set<number>();

  for (let steps = 0; steps < L.size * L.size * 2; steps++) {
    const stateKey = (y * L.size + x) * 4 + curD;
    if (visitedStates.has(stateKey)) break;
    visitedStates.add(stateKey);

    const nx = x + DX[curD]!;
    const ny = y + DY[curD]!;
    if (isBlocked(L, nx, ny)) break;
    if (player && player.x === nx && player.y === ny) break;
    if (blocks.some((b, i) => i !== idx && b.x === nx && b.y === ny)) break;

    x = nx;
    y = ny;
    path.push({ x, y });

    // Check if the block stepped onto an active portal
    const entryPortal = getPortalAt(L, x, y);
    if (entryPortal) {
      const exitPortal = getPairedPortal(L, entryPortal);
      if (
        exitPortal &&
        !isBlocked(L, exitPortal.x, exitPortal.y) &&
        !(player && player.x === exitPortal.x && player.y === exitPortal.y) &&
        !blocks.some((b, i) => i !== idx && b.x === exitPortal.x && b.y === exitPortal.y)
      ) {
        x = exitPortal.x;
        y = exitPortal.y;
        curD = dirIndex(exitPortal.dir);
        usedPortal = true;
        path.push({ x, y });
      }
    }
  }
  return { path, endDir: curD, usedPortal };
}

/** Cells a block passes through (start first) when pushed in direction d. */
export function slidePath(L: Board, blocks: Pt[], idx: number, d: number, player?: Pt): Pt[] {
  return slideDetails(L, blocks, idx, d, player).path;
}

/** Cells the player can walk to without pushing anything. */
export function reach(L: Board, blocks: Pt[], from: Pt): Set<number> {
  const seen = new Set<number>([key(from.x, from.y, L.size)]);
  const q: Pt[] = [from];
  let head = 0;
  while (head < q.length) {
    const c = q[head++]!;
    for (let d = 0; d < 4; d++) {
      const nx = c.x + DX[d]!;
      const ny = c.y + DY[d]!;
      const k = key(nx, ny, L.size);
      if (isBlocked(L, nx, ny) || seen.has(k) || hasBlock(blocks, nx, ny)) continue;
      seen.add(k);
      q.push({ x: nx, y: ny });
    }
  }
  return seen;
}

/**
 * Checks if a block is stuck where it can never reach ANY target of its color.
 * Accounts for portals placed along edges (an edge has an escape if a portal sits on that edge).
 */
export function deadBlockColor(
  L: Board,
  b: Pt,
  color: string,
  targets: ColoredTarget[],
  size: number = N
): boolean {
  if (color === 'gray') return false;
  if (getPortalAt(L, b.x, b.y)) return false;

  const matching = targets.filter((t) => t.color === color);
  if (matching.length === 0) return false;
  if (matching.some((t) => t.x === b.x && t.y === b.y)) return false;
  if (isCorner(b.x, b.y, size)) return true;

  if (b.x === 0 || b.x === size - 1) {
    const hasTargetOnEdge = matching.some((t) => t.x === b.x);
    const hasPortalOnEdge = L.portals.some((p) => p.x === b.x);
    if (!hasTargetOnEdge && !hasPortalOnEdge) return true;
  }
  if (b.y === 0 || b.y === size - 1) {
    const hasTargetOnEdge = matching.some((t) => t.y === b.y);
    const hasPortalOnEdge = L.portals.some((p) => p.y === b.y);
    if (!hasTargetOnEdge && !hasPortalOnEdge) return true;
  }
  return false;
}

/**
 * Admissible lower bound on pushes remaining.
 * When portals exist on the board, a single push can change both X and Y axes via teleportation,
 * so any unsolved colored block has a safe admissible lower bound of 1 push.
 * Also supports the 2-argument signature (bs: Pt[], targets: Pt[]).
 */
export function minPushesRemaining(
  arg1: Board | Pt[],
  arg2: Pt[],
  arg3?: string[],
  arg4?: ColoredTarget[]
): number {
  if (Array.isArray(arg1)) {
    const bs = arg1;
    const targets = arg2;
    let h = 0;
    for (let i = 0; i < bs.length; i++) {
      const b = bs[i]!;
      const t = targets[i];
      if (!t) continue;
      if (b.x === t.x && b.y === t.y) continue;
      if (b.x === t.x || b.y === t.y) h += 1;
      else h += 2;
    }
    return h;
  }

  const L = arg1;
  const bs = arg2;
  const blockColors = arg3!;
  const targets = arg4!;

  const hasPortals = L.portals.length > 0;
  let h = 0;
  for (let i = 0; i < bs.length; i++) {
    const color = blockColors[i]!;
    if (color === 'gray') continue;
    const b = bs[i]!;
    let bestForBlock = hasPortals ? 1 : 2;
    for (const t of targets) {
      if (t.color !== color) continue;
      if (b.x === t.x && b.y === t.y) {
        bestForBlock = 0;
        break;
      }
      if (!hasPortals && (b.x === t.x || b.y === t.y)) {
        bestForBlock = Math.min(bestForBlock, 1);
      }
    }
    h += bestForBlock;
  }
  return h;
}

/** True when every target cell is occupied by a block of the matching color. */
export function isSolved(bs: Pt[], blockColors: string[], targets: ColoredTarget[]): boolean {
  return targets.every((t) =>
    bs.some((b, i) => blockColors[i] === t.color && b.x === t.x && b.y === t.y)
  );
}

// ---------------------------------------------------------------- solver

type SNode = {
  bs: Pt[];
  p: Pt;
  r: Set<number>;
  parent: SNode | null;
  i: number;
  d: number;
};

type SearchResult = {
  found: SNode | null;
  depth: number;
  exhausted: boolean;
};

/** Breadth-first search supporting shared color pools, gray blocks, and portals. */
export function search(
  L: Board,
  starts: Pt[],
  blockColors: string[],
  targets: ColoredTarget[],
  player: Pt,
  maxStates: number,
  maxDepth: number = Infinity
): SearchResult {
  const size = L.size;

  const normKey = (bs: Pt[], r: Set<number>) => {
    let m = 1e9;
    for (const k of r) if (k < m) m = k;
    const byColor = new Map<string, number[]>();
    for (let i = 0; i < bs.length; i++) {
      const c = blockColors[i]!;
      const k = key(bs[i]!.x, bs[i]!.y, size);
      const list = byColor.get(c);
      if (list) list.push(k);
      else byColor.set(c, [k]);
    }
    const parts: string[] = [];
    for (const [c, coords] of byColor.entries()) {
      coords.sort((a, b) => a - b);
      parts.push(`${c}:${coords.join(',')}`);
    }
    return parts.join(';') + '|' + m;
  };

  const initR = reach(L, starts, player);
  let frontier: SNode[] = [
    { bs: starts.map((s) => ({ ...s })), p: { ...player }, r: initR, parent: null, i: -1, d: -1 },
  ];
  const seen = new Set<string>([normKey(starts, initR)]);

  for (let depth = 0; frontier.length > 0; depth++) {
    const next: SNode[] = [];
    for (const st of frontier) {
      if (isSolved(st.bs, blockColors, targets)) {
        return { found: st, depth, exhausted: false };
      }
      if (depth >= maxDepth) continue;
      const r = st.r;
      for (let i = 0; i < st.bs.length; i++) {
        const color = blockColors[i]!;
        for (let d = 0; d < 4; d++) {
          const sx = st.bs[i]!.x - DX[d]!;
          const sy = st.bs[i]!.y - DY[d]!;
          if (!inB(sx, sy, size) || !r.has(key(sx, sy, size))) continue;
          const path = slidePath(L, st.bs, i, d);
          if (path.length < 2) continue;
          const end = path[path.length - 1]!;
          if (deadBlockColor(L, end, color, targets, size)) continue;

          const bs = st.bs.map((b) => ({ ...b }));
          const p = { ...st.bs[i]! };
          bs[i] = { ...end };

          const h = minPushesRemaining(L, bs, blockColors, targets);
          if (depth + 1 + h > maxDepth) continue;

          const childR = reach(L, bs, p);
          if (h === 0 && isSolved(bs, blockColors, targets)) {
            return {
              found: { bs, p, r: childR, parent: st, i, d },
              depth: depth + 1,
              exhausted: false,
            };
          }
          const k = normKey(bs, childR);
          if (seen.has(k)) continue;
          seen.add(k);
          if (seen.size > maxStates) return { found: null, depth, exhausted: true };
          next.push({ bs, p, r: childR, parent: st, i, d });
        }
      }
    }
    frontier = next;
  }
  return { found: null, depth: -1, exhausted: false };
}

/** Walking route (directions) between two cells without pushing. */
export function walkPath(
  L: Board,
  blocks: Pt[],
  from: Pt,
  to: Pt,
  size: number = L.size
): number[] | null {
  const prev = new Map<number, { k: number; d: number } | null>([[key(from.x, from.y, size), null]]);
  const q: Pt[] = [from];
  let head = 0;
  while (head < q.length) {
    const c = q[head++]!;
    if (c.x === to.x && c.y === to.y) {
      const out: number[] = [];
      let k = key(c.x, c.y, size);
      for (let pr = prev.get(k); pr; pr = prev.get(k)) {
        out.push(pr.d);
        k = pr.k;
      }
      return out.reverse();
    }
    for (let d = 0; d < 4; d++) {
      const nx = c.x + DX[d]!;
      const ny = c.y + DY[d]!;
      const k = key(nx, ny, size);
      if (isBlocked(L, nx, ny) || prev.has(k) || hasBlock(blocks, nx, ny)) continue;
      prev.set(k, { k: key(c.x, c.y, size), d });
      q.push({ x: nx, y: ny });
    }
  }
  return null;
}

/** Turn a list of pushes into full player moves (walking + pushes). */
export function pushesToMoves(
  L: Board,
  starts: Pt[],
  player: Pt,
  pushes: Push[]
): DirName[] | null {
  const moves: DirName[] = [];
  let bs = starts.map((s) => ({ ...s }));
  let p = { ...player };
  for (const { i, d } of pushes) {
    const stand = { x: bs[i]!.x - DX[d]!, y: bs[i]!.y - DY[d]! };
    const walk = walkPath(L, bs, p, stand, L.size);
    if (!walk) return null;
    for (const w of walk) moves.push(DIR_NAMES[w]!);
    moves.push(DIR_NAMES[d]!);
    const path = slidePath(L, bs, i, d);
    if (path.length < 2) return null;
    p = { ...bs[i]! };
    bs = bs.map((b) => ({ ...b }));
    bs[i] = { ...path[path.length - 1]! };
  }
  return moves;
}

// ---------------------------------------------------------------- templates & portals

export type Built = {
  L: Board;
  targets: ColoredTarget[];
  starts: Pt[];
  blockColors: string[];
  player: Pt;
  plan: Push[];
};

function applyStructuralTemplate(
  walls: Set<number>,
  presetTargets: Pt[],
  size: number
): void {
  const mid = Math.floor(size / 2);
  const roll = Math.random();

  if (roll < 0.30) {
    // Motif 1: Edge Alcoves / Recessed Pockets (Puzzle 1 style)
    const edge = rnd(4);
    const slots = [1, mid, size - 2];
    const count = 1 + rnd(2);
    for (let i = 0; i < count; i++) {
      const u = slots[rnd(slots.length)]!;
      const [tx, ty] =
        edge === 0 ? [u, 0] : edge === 1 ? [u, size - 1] : edge === 2 ? [0, u] : [size - 1, u];
      if (!hasBlock(presetTargets, tx, ty)) {
        presetTargets.push({ x: tx, y: ty });
        for (const delta of [-1, 1]) {
          const wx = edge <= 1 ? tx + delta : tx;
          const wy = edge <= 1 ? ty : ty + delta;
          if (inB(wx, wy, size)) walls.add(key(wx, wy, size));
        }
      }
    }
  } else if (roll < 0.60) {
    // Motif 2: 4-Pillar Center Cage (Puzzle 3 style)
    const corners = [
      { x: mid - 1, y: mid - 1 },
      { x: mid + 1, y: mid - 1 },
      { x: mid - 1, y: mid + 1 },
      { x: mid + 1, y: mid + 1 },
    ];
    for (const c of corners) {
      if (inB(c.x, c.y, size)) walls.add(key(c.x, c.y, size));
    }
  } else if (roll < 0.80) {
    // Motif 3: Symmetric Choke Pillars
    const offset = 2 + rnd(2);
    walls.add(key(offset, mid, size));
    walls.add(key(size - 1 - offset, mid, size));
  }
}

/**
 * Spawns 1 or 2 pairs of edge-mounted directional portals (like Puzzle 2).
 * Each portal sits on a board border with its exit direction pointing inward.
 */
function spawnPortalPairs(
  pairCount: number,
  walls: Set<number>,
  occupied: Pt[],
  size: number
): Portal[] {
  const portals: Portal[] = [];
  const portalColors = COLOR_NAMES.slice().sort(() => Math.random() - 0.5);

  const edgeSpec = (edge: number, u: number): { x: number; y: number; dir: DirName } => {
    switch (edge) {
      case 0:
        return { x: u, y: 0, dir: 'Down' };
      case 1:
        return { x: u, y: size - 1, dir: 'Up' };
      case 2:
        return { x: 0, y: u, dir: 'Right' };
      default:
        return { x: size - 1, y: u, dir: 'Left' };
    }
  };

  for (let pIdx = 0; pIdx < pairCount; pIdx++) {
    const color = portalColors[pIdx % portalColors.length]!;
    let placedPair = false;

    for (let tr = 0; tr < 50; tr++) {
      // Pick two different edges (often perpendicular like Puzzle 2)
      const edgeA = rnd(4);
      const edgeB = (edgeA + 1 + rnd(3)) % 4;
      const uA = 1 + rnd(size - 2);
      const uB = 1 + rnd(size - 2);

      const specA = edgeSpec(edgeA, uA);
      const specB = edgeSpec(edgeB, uB);

      const kA = key(specA.x, specA.y, size);
      const kB = key(specB.x, specB.y, size);
      if (kA === kB || walls.has(kA) || walls.has(kB)) continue;
      if (hasBlock(occupied, specA.x, specA.y) || hasBlock(occupied, specB.x, specB.y)) continue;
      if (portals.some((p) => (p.x === specA.x && p.y === specA.y) || (p.x === specB.x && p.y === specB.y))) {
        continue;
      }

      // Ensure tile directly in front of each portal is not walled off
      const frontAx = specA.x + DX[dirIndex(specA.dir)]!;
      const frontAy = specA.y + DY[dirIndex(specA.dir)]!;
      const frontBx = specB.x + DX[dirIndex(specB.dir)]!;
      const frontBy = specB.y + DY[dirIndex(specB.dir)]!;
      if (walls.has(key(frontAx, frontAy, size)) || walls.has(key(frontBx, frontBy, size))) continue;

      const stamp = Date.now() + pIdx * 10;
      portals.push(
        { id: `p_${stamp}_${pIdx}a`, color, x: specA.x, y: specA.y, dir: specA.dir },
        { id: `p_${stamp}_${pIdx}b`, color, x: specB.x, y: specB.y, dir: specB.dir }
      );
      placedPair = true;
      break;
    }
    if (!placedPair) break;
  }

  return portals;
}

type ReverseCandidate = {
  S: Pt;
  pushDir: number;
  stand: Pt;
  usedPortal: boolean;
  trackCells: number[];
};

/**
 * Traces backward from a block's resting spot T moving opposite to `endDir`.
 * If the backward trace crosses a portal whose inward direction matches `curDir`,
 * it teleports backward to the paired portal and explores all valid entry directions!
 */
function reverseSlideTrace(
  L: Board,
  bs: Pt[],
  blockIdx: number,
  T: Pt,
  endDir: number,
  extraWall: number | null
): ReverseCandidate[] {
  const size = L.size;
  const results: ReverseCandidate[] = [];

  const isCellBlocked = (x: number, y: number) => {
    if (!inB(x, y, size)) return true;
    const k = key(x, y, size);
    if (k === extraWall || L.wallSet.has(k)) return true;
    return bs.some((b, idx) => idx !== blockIdx && b.x === x && b.y === y);
  };

  const traceSegment = (
    curX: number,
    curY: number,
    forwardDir: number,
    usedPortal: boolean,
    accTrack: number[],
    depth: number
  ) => {
    if (depth > size * 2) return;

    for (let step = 1; step < size; step++) {
      const sx = curX - DX[forwardDir]! * step;
      const sy = curY - DY[forwardDir]! * step;
      if (isCellBlocked(sx, sy)) break;

      const cellKey = key(sx, sy, size);
      const nextTrack = [...accTrack, cellKey];

      const portalAtS = getPortalAt(L, sx, sy);
      if (portalAtS) {
        // If this portal's exit direction matches our forward slide direction,
        // the block could have teleported OUT of `portalAtS` from its paired entry portal!
        if (!usedPortal && dirIndex(portalAtS.dir) === forwardDir) {
          const entryPortal = getPairedPortal(L, portalAtS);
          if (entryPortal && !isCellBlocked(entryPortal.x, entryPortal.y)) {
            const entryTrack = [...nextTrack, key(entryPortal.x, entryPortal.y, size)];
            for (let entryDir = 0; entryDir < 4; entryDir++) {
              traceSegment(entryPortal.x, entryPortal.y, entryDir, true, entryTrack, depth + step);
            }
          }
        }
        // A sliding block cannot pass over a portal without teleporting, nor start directly on one
        break;
      }

      // Check if player can stand behind (sx, sy) to push in `forwardDir`
      const px = sx - DX[forwardDir]!;
      const py = sy - DY[forwardDir]!;
      if (!isCellBlocked(px, py) && !isCorner(sx, sy, size)) {
        results.push({
          S: { x: sx, y: sy },
          pushDir: forwardDir,
          stand: { x: px, y: py },
          usedPortal,
          trackCells: nextTrack,
        });
      }
    }
  };

  traceSegment(T.x, T.y, endDir, false, [key(T.x, T.y, size)], 0);
  return results;
}

// ---------------------------------------------------------------- builder

/**
 * Reverse ("un-push") construction with gray helper blocks, shared colors, portals, and path interference.
 */
export function buildReverse(
  nbColored: number,
  nbGray: number,
  portalPairs: number,
  K: number,
  tier: number,
  size: number = N
): Built | null {
  const nb = nbColored + nbGray;
  const walls = new Set<number>();

  const keep = new Map<number, number>();
  const addKeep = (k: number) => keep.set(k, (keep.get(k) ?? 0) + 1);
  const remKeep = (k: number) => {
    const v = (keep.get(k) ?? 1) - 1;
    if (v > 0) keep.set(k, v);
    else keep.delete(k);
  };

  // Pick color palette: 35% chance to share colors among multiple blocks
  const shuffledPalette = COLOR_NAMES.slice().sort(() => Math.random() - 0.5);
  const shareColors = nbColored >= 2 && Math.random() < 0.35;
  const distinctColorCount = shareColors ? Math.max(1, nbColored - 1 - rnd(2)) : nbColored;

  const blockColors: string[] = [];
  for (let i = 0; i < nbColored; i++) {
    blockColors.push(shuffledPalette[i % distinctColorCount]!);
  }
  for (let i = 0; i < nbGray; i++) {
    blockColors.push('gray');
  }

  // Apply structural wall & alcove templates
  const presetTargets: Pt[] = [];
  applyStructuralTemplate(walls, presetTargets, size);
  for (const w of walls) addKeep(w);

  // 1. Place targets for colored blocks
  const targets: ColoredTarget[] = [];
  for (let b = 0; b < nbColored; b++) {
    const color = blockColors[b]!;
    if (presetTargets.length > 0) {
      const pt = presetTargets.pop()!;
      if (!hasBlock(targets, pt.x, pt.y)) {
        targets.push({ x: pt.x, y: pt.y, color });
        continue;
      }
    }
    for (let tr = 0; tr < 60; tr++) {
      let x: number;
      let y: number;
      if (Math.random() < 0.72) {
        const s = rnd(4);
        const u = 1 + rnd(size - 2);
        [x, y] = s === 0 ? [u, 0] : s === 1 ? [u, size - 1] : s === 2 ? [0, u] : [size - 1, u];
      } else {
        x = 1 + rnd(size - 2);
        y = 1 + rnd(size - 2);
      }
      if (walls.has(key(x, y, size)) || hasBlock(targets, x, y)) continue;
      targets.push({ x, y, color });
      break;
    }
  }
  if (targets.length < nbColored) return null;

  // 2. Spawn portals on edges (if enabled for this level) and protect their tiles
  const portals = portalPairs > 0 ? spawnPortalPairs(portalPairs, walls, targets, size) : [];
  if (portalPairs > 0 && portals.length === 0) return null;
  for (const pt of portals) {
    addKeep(key(pt.x, pt.y, size));
    const fx = pt.x + DX[dirIndex(pt.dir)]!;
    const fy = pt.y + DY[dirIndex(pt.dir)]!;
    if (inB(fx, fy, size)) addKeep(key(fx, fy, size));
  }

  const L: Board = { size, wallSet: walls, portals };

  // 3. Place initial resting spots for all blocks (colored on targets, gray in interior)
  const bs: Pt[] = targets.map((t) => ({ x: t.x, y: t.y }));
  for (let g = 0; g < nbGray; g++) {
    let placed = false;
    for (let tr = 0; tr < 60; tr++) {
      const x = 1 + rnd(size - 2);
      const y = 1 + rnd(size - 2);
      if (walls.has(key(x, y, size)) || hasBlock(bs, x, y) || getPortalAt(L, x, y)) continue;
      bs.push({ x, y });
      placed = true;
      break;
    }
    if (!placed) return null;
  }

  let p: Pt = { x: 0, y: 0 };
  const plan: Push[] = [];
  let nodes = 0;
  const chains: Pt[][] = bs.map((q) => [{ ...q }]);

  const slideTracks = new Map<number, number>();
  const addTrack = (k: number) => slideTracks.set(k, (slideTracks.get(k) ?? 0) + 1);
  const remTrack = (k: number) => {
    const v = (slideTracks.get(k) ?? 1) - 1;
    if (v > 0) slideTracks.set(k, v);
    else slideTracks.delete(k);
  };

  const blockBumperWeight = 3 + tier * 2.5;

  const shortcut = (i: number, S: Pt, plannedDir: number) => {
    const tmp = bs.map((b) => ({ ...b }));
    tmp[i] = { ...S };
    for (let e = 0; e < 4; e++) {
      if (e === plannedDir) continue;
      const path = slidePath(L, tmp, i, e);
      if (path.length < 2) continue;
      const end = path[path.length - 1]!;
      if (hasBlock(chains[i]!, end.x, end.y)) return true;
    }
    return false;
  };

  const options = (last: number, lastD: number) => {
    const r = last === -1 ? new Set<number>() : reach(L, bs, p);
    const opts: {
      i: number;
      pushDir: number;
      S: Pt;
      stand: Pt;
      wall: number | null;
      trackCells: number[];
      w: number;
    }[] = [];

    for (let i = 0; i < nb; i++) {
      for (let endDir = 0; endDir < 4; endDir++) {
        const T = bs[i]!;
        const bx = T.x + DX[endDir]!;
        const by = T.y + DY[endDir]!;
        let wall: number | null = null;
        let w = 4;
        const bk = key(bx, by, size);
        const isBoardEdge = !inB(bx, by, size);
        const isExistingWall = inB(bx, by, size) && walls.has(bk);
        const bumperIdx = inB(bx, by, size) ? bs.findIndex((b) => b.x === bx && b.y === by) : -1;

        if (isBoardEdge || isExistingWall) {
          w = 3.5;
        } else if (bumperIdx !== -1) {
          const isGrayBumper = blockColors[bumperIdx] === 'gray';
          w = blockBumperWeight * (isGrayBumper ? 1.6 : 1.2);
        } else {
          // Don't place a wall on a portal, target, or protected tile
          if (keep.has(bk) || hasBlock(targets, bx, by) || getPortalAt(L, bx, by)) continue;
          wall = bk;
          w = 1;
        }

        let activeReach = r;
        if (wall !== null && last !== -1) {
          walls.add(wall);
          activeReach = reach(L, bs, p);
          walls.delete(wall);
        }

        const route = chains[i]!;
        const candidates = reverseSlideTrace(L, bs, i, T, endDir, wall);

        for (const cand of candidates) {
          if (i === last && cand.pushDir === lastD) continue;
          const { S, pushDir, stand, usedPortal, trackCells } = cand;
          if (last !== -1 && !activeReach.has(key(S.x, S.y, size))) continue;
          if (hasBlock(route, S.x, S.y)) continue;

          // Verify forward slide from S in `pushDir` lands exactly back on T
          if (wall !== null) walls.add(wall);
          const tmp = bs.map((b) => ({ ...b }));
          tmp[i] = { ...S };
          const fwdPath = slidePath(L, tmp, i, pushDir);
          if (wall !== null) walls.delete(wall);

          const fwdEnd = fwdPath[fwdPath.length - 1]!;
          if (fwdPath.length < 2 || fwdEnd.x !== T.x || fwdEnd.y !== T.y) continue;

          let stepWeight = w * (i === last ? 0.35 : 1.0);
          if (usedPortal) stepWeight *= 3.2; // Strongly favor slides that teleport through portals
          if (slideTracks.has(key(S.x, S.y, size))) stepWeight *= 2.5;
          if (blockColors[i] === 'gray' && route.length === 1) stepWeight *= 2.2;

          opts.push({
            i,
            pushDir,
            S,
            stand,
            wall,
            trackCells: [...trackCells, key(stand.x, stand.y, size)],
            w: stepWeight,
          });
        }
      }
    }
    return opts;
  };

  const dfs = (depth: number, last: number, lastD: number): boolean => {
    if (depth >= K) return true;
    if (++nodes > 450) return false;
    const opts = options(last, lastD);
    for (let tries = 0; tries < 3 && opts.length > 0; tries++) {
      let roll = Math.random() * opts.reduce((a, o) => a + o.w, 0);
      let idx = opts.length - 1;
      for (let q = 0; q < opts.length; q++) {
        roll -= opts[q]!.w;
        if (roll < 0) {
          idx = q;
          break;
        }
      }
      const pk = opts.splice(idx, 1)[0]!;
      const T = { ...bs[pk.i]! };
      const pOld = p;
      const S = pk.S;
      if (pk.wall !== null) walls.add(pk.wall);
      if (shortcut(pk.i, S, pk.pushDir)) {
        if (pk.wall !== null) walls.delete(pk.wall);
        tries--;
        continue;
      }

      let walkDirs: number[] | null = null;
      if (last !== -1) {
        walkDirs = walkPath(L, bs, S, pOld, size);
        if (!walkDirs) {
          if (pk.wall !== null) walls.delete(pk.wall);
          tries--;
          continue;
        }
      }

      const kk: number[] = [];
      const tk: number[] = [];
      for (const c of pk.trackCells) {
        addKeep(c);
        kk.push(c);
        addTrack(c);
        tk.push(c);
      }
      if (walkDirs) {
        let wx = S.x;
        let wy = S.y;
        for (const dir of walkDirs) {
          wx += DX[dir]!;
          wy += DY[dir]!;
          const wk = key(wx, wy, size);
          addKeep(wk);
          kk.push(wk);
        }
      }

      bs[pk.i] = S;
      p = pk.stand;
      plan.unshift({ i: pk.i, d: pk.pushDir });
      chains[pk.i]!.push(S);
      if (dfs(depth + 1, pk.i, pk.pushDir)) return true;

      chains[pk.i]!.pop();
      plan.shift();
      bs[pk.i] = T;
      p = pOld;
      for (const c of kk) remKeep(c);
      for (const c of tk) remTrack(c);
      if (pk.wall !== null) walls.delete(pk.wall);
      if (nodes > 450) return false;
    }
    return false;
  };

  if (!dfs(0, -1, -1)) return null;

  for (let i = 0; i < nb; i++) {
    const c = blockColors[i]!;
    if (c === 'gray') {
      if (chains[i]!.length < 2) return null;
    } else {
      if (targets.some((t) => t.color === c && t.x === bs[i]!.x && t.y === bs[i]!.y)) return null;
      if (deadBlockColor(L, bs[i]!, c, targets, size)) return null;
    }
  }

  // Add 1-2 decoy walls that don't obstruct keep cells or portals
  const decoys = rnd(3);
  for (let i = 0; i < decoys; i++) {
    const x = 1 + rnd(size - 2);
    const y = 1 + rnd(size - 2);
    const k = key(x, y, size);
    if (keep.has(k) || hasBlock(bs, x, y) || hasBlock(targets, x, y) || getPortalAt(L, x, y)) continue;
    walls.add(k);
  }

  const region = [...reach(L, bs, p)].filter((k) => !getPortalAt(L, k % size, Math.floor(k / size)));
  if (region.length === 0) return null;
  const pk = region[rnd(region.length)]!;
  return {
    L,
    targets,
    starts: bs.map((b) => ({ ...b })),
    blockColors,
    player: { x: pk % size, y: Math.floor(pk / size) },
    plan,
  };
}

/** Play the designed pushes forward with the real rules. */
export function replay(B: Built): boolean {
  const { L, targets, blockColors, plan } = B;
  const size = L.size;
  let bs = B.starts.map((s) => ({ ...s }));
  let p = { ...B.player };
  for (const { i, d } of plan) {
    const sx = bs[i]!.x - DX[d]!;
    const sy = bs[i]!.y - DY[d]!;
    if (!inB(sx, sy, size) || !reach(L, bs, p).has(key(sx, sy, size))) return false;
    const path = slidePath(L, bs, i, d);
    if (path.length < 2) return false;
    p = { ...bs[i]! };
    bs = bs.map((b) => ({ ...b }));
    bs[i] = { ...path[path.length - 1]! };
  }
  return isSolved(bs, blockColors, targets);
}

/**
 * Evaluates how "interesting" an optimal push sequence is.
 * Rewards block bumpers, gray block usage, portal teleports, and switching blocks.
 */
export function scoreSolutionQuality(B: Built, pushes: Push[]): { score: number; usedPortals: boolean } {
  let score = pushes.length * 2;
  const bs = B.starts.map((s) => ({ ...s }));
  let streak = 1;
  let usedPortals = false;
  const touchedBlocks = new Set<number>();

  for (let s = 0; s < pushes.length; s++) {
    const { i, d } = pushes[s]!;
    touchedBlocks.add(i);

    if (s > 0 && pushes[s - 1]!.i === i) {
      streak++;
      if (streak >= 3) score -= 3;
    } else {
      streak = 1;
    }

    const details = slideDetails(B.L, bs, i, d);
    const end = details.path[details.path.length - 1]!;
    const bx = end.x + DX[details.endDir]!;
    const by = end.y + DY[details.endDir]!;

    if (details.usedPortal) {
      usedPortals = true;
      score += 5; // Reward solutions that actually route blocks through portals
    }

    const hitBlockIdx = bs.findIndex((b, idx) => idx !== i && b.x === bx && b.y === by);
    if (hitBlockIdx !== -1) {
      score += 4;
      if (B.blockColors[hitBlockIdx] === 'gray') score += 3;
    }
    if (B.blockColors[i] === 'gray') {
      score += 2;
    }

    bs[i] = { ...end };
  }

  for (let i = 0; i < B.blockColors.length; i++) {
    if (B.blockColors[i] === 'gray' && !touchedBlocks.has(i)) {
      score -= 15;
    }
  }

  return { score, usedPortals };
}

// ---------------------------------------------------------------- difficulty & bridge

export const TIERS = [
  { blocks: 2, minPushes: 3, grayChance: 0.0, maxGray: 0, portalChance: 0.0, maxPortalPairs: 0 }, // stages 1-5
  { blocks: 3, minPushes: 5, grayChance: 0.25, maxGray: 1, portalChance: 0.20, maxPortalPairs: 1 }, // stages 6-10
  { blocks: 3, minPushes: 7, grayChance: 0.35, maxGray: 1, portalChance: 0.30, maxPortalPairs: 1 }, // stages 11-15
  { blocks: 4, minPushes: 9, grayChance: 0.40, maxGray: 1, portalChance: 0.35, maxPortalPairs: 2 }, // stages 16-20
  { blocks: 5, minPushes: 11, grayChance: 0.45, maxGray: 2, portalChance: 0.40, maxPortalPairs: 2 }, // stages 21-25
  { blocks: 5, minPushes: 13, grayChance: 0.45, maxGray: 2, portalChance: 0.45, maxPortalPairs: 2 }, // stages 26-30
  { blocks: 6, minPushes: 16, grayChance: 0.50, maxGray: 2, portalChance: 0.45, maxPortalPairs: 2 }, // stages 31+
];

export function getTierDifficulty(level: number) {
  const tier = Math.min(TIERS.length - 1, Math.floor((Math.max(1, level) - 1) / 5));
  return { tier, ...TIERS[tier]! };
}

export function generateBacktrackingLevel(levelOrTier: number = 1, size: number = N): GeneratedPuzzle {
  const {
    tier,
    blocks: totalBlocks,
    minPushes,
    grayChance,
    maxGray,
    portalChance,
    maxPortalPairs,
  } = getTierDifficulty(levelOrTier);

  const budget = totalBlocks <= 4 ? 40000 : 15000;
  let solverCalls = totalBlocks <= 3 ? 40 : totalBlocks === 4 ? 14 : 6;

  let bestVerified: {
    B: Built;
    par: number;
    score: number;
    moves: DirName[];
  } | null = null;

  let bestExhausted: {
    B: Built;
    par: number;
    lowerBound: number;
    moves: DirName[];
  } | null = null;

  for (let attempt = 0; attempt < 400 && solverCalls > 0; attempt++) {
    const useGray = maxGray > 0 && Math.random() < grayChance;
    const nbGray = useGray ? 1 + rnd(maxGray) : 0;
    const nbColored = Math.max(1, totalBlocks - nbGray);

    const usePortals = maxPortalPairs > 0 && Math.random() < portalChance;
    const portalPairs = usePortals ? 1 + rnd(maxPortalPairs) : 0;

    const B = buildReverse(nbColored, nbGray, portalPairs, minPushes + rnd(3), tier, size);
    if (!B || !replay(B)) continue;
    solverCalls--;

    const res = search(B.L, B.starts, B.blockColors, B.targets, B.player, budget, B.plan.length);
    if (res.found) {
      const par = res.depth;
      const pushes: Push[] = [];
      for (let n: SNode | null = res.found; n && n.parent; n = n.parent) {
        pushes.unshift({ i: n.i, d: n.d });
      }

      const { score, usedPortals } = scoreSolutionQuality(B, pushes);

      // If portals were spawned, require the shortest solution to actually use at least one portal
      if (B.L.portals.length > 0 && !usedPortals) continue;

      // If gray blocks were spawned, reject if the shortest solution completely ignores them
      const grayUsed = B.blockColors.every(
        (c, idx) => c !== 'gray' || pushes.some((p) => p.i === idx) || score > par * 2
      );
      if (!grayUsed) continue;

      const moves = pushesToMoves(B.L, B.starts, B.player, pushes);
      if (!moves) continue;

      if (!bestVerified || score > bestVerified.score) {
        bestVerified = { B, par, score, moves };
      }
      if (par >= minPushes && score >= minPushes * 2 + 6) break;
    } else if (res.exhausted) {
      const par = B.plan.length;
      const lowerBound = res.depth;
      const moves = pushesToMoves(B.L, B.starts, B.player, B.plan);
      if (!moves) continue;
      if (
        !bestExhausted ||
        lowerBound > bestExhausted.lowerBound ||
        (lowerBound === bestExhausted.lowerBound && par > bestExhausted.par)
      ) {
        bestExhausted = { B, par, lowerBound, moves };
      }
    }
  }

  const chosen = bestVerified ?? bestExhausted;
  if (!chosen) {
    if (levelOrTier > 1) return generateBacktrackingLevel(levelOrTier - 1, size);
    throw new Error('Failed to generate backtracking level');
  }

  const { B, par, moves } = chosen;

  const blocks: SolverBlock[] = B.starts.map((s, i) => ({
    id: `b_${B.blockColors[i]}_${i}`,
    color: B.blockColors[i]!,
    x: s.x,
    y: s.y,
  }));

  const targets: SolverTarget[] = B.targets.map((t, i) => ({
    id: `t_${t.color}_${i}`,
    color: t.color,
    x: t.x,
    y: t.y,
  }));

  const walls: Position[] = [...B.L.wallSet].map((k) => ({
    x: k % size,
    y: Math.floor(k / size),
  }));

  return {
    width: size,
    height: size,
    player: B.player,
    walls,
    blocks,
    targets,
    portals: B.L.portals,
    par,
    solutionMoves: moves,
  };
}
