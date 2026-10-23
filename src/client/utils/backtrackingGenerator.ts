import { Position } from '../../shared/types';
import { SolverBlock, SolverTarget, GeneratedPuzzle } from './puzzleSolver';

export type Pt = { x: number; y: number };
export type Push = { i: number; d: number };

export const DX = [0, 0, -1, 1];
export const DY = [-1, 1, 0, 0];
export const DIR_NAMES: ('Up' | 'Down' | 'Left' | 'Right')[] = ['Up', 'Down', 'Left', 'Right'];

export const COLOR_NAMES = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];

const N = 9;
const rnd = (n: number) => Math.floor(Math.random() * n);
export const key = (x: number, y: number, size: number = N) => y * size + x;
export const inB = (x: number, y: number, size: number = N) => x >= 0 && y >= 0 && x < size && y < size;
export const isCorner = (x: number, y: number, size: number = N) =>
  (x === 0 || x === size - 1) && (y === 0 || y === size - 1);

export type Board = {
  size: number;
  wallSet: Set<number>;
};

export function isBlocked(L: Board, x: number, y: number): boolean {
  return !inB(x, y, L.size) || L.wallSet.has(key(x, y, L.size));
}

const hasBlock = (blocks: Pt[], x: number, y: number) => blocks.some((b) => b.x === x && b.y === y);

/** Cells a block passes through (start first) when pushed in direction d. */
export function slidePath(L: Board, blocks: Pt[], idx: number, d: number, player?: Pt): Pt[] {
  const path: Pt[] = [{ x: blocks[idx]!.x, y: blocks[idx]!.y }];
  let x = blocks[idx]!.x;
  let y = blocks[idx]!.y;
  for (;;) {
    const nx = x + DX[d]!;
    const ny = y + DY[d]!;
    if (isBlocked(L, nx, ny)) break;
    if (player && player.x === nx && player.y === ny) break;
    if (blocks.some((b, i) => i !== idx && b.x === nx && b.y === ny)) break;
    x = nx;
    y = ny;
    path.push({ x, y });
  }
  return path;
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

/** A block stuck where it can never reach its target (corner, or wrong edge). */
export function deadBlock(b: Pt, t: Pt, size: number = N): boolean {
  if (b.x === t.x && b.y === t.y) return false;
  if (isCorner(b.x, b.y, size)) return true;
  if ((b.x === 0 || b.x === size - 1) && t.x !== b.x) return true;
  if ((b.y === 0 || b.y === size - 1) && t.y !== b.y) return true;
  return false;
}

/** Admissible lower bound on the number of pushes required to solve from state bs. */
export function minPushesRemaining(bs: Pt[], targets: Pt[]): number {
  let h = 0;
  for (let i = 0; i < bs.length; i++) {
    const b = bs[i]!;
    const t = targets[i]!;
    if (b.x !== t.x || b.y !== t.y) {
      h += b.x === t.x || b.y === t.y ? 1 : 2;
    }
  }
  return h;
}

// ---------------------------------------------------------------- solver

interface SNode {
  bs: Pt[];
  p: Pt;
  r: Set<number>;
  parent: SNode | null;
  i: number;
  d: number;
}

interface SearchResult {
  found: SNode | null;
  depth: number;
  exhausted: boolean;
}

/** Breadth-first search over pushes (fewest pushes first) with admissible branch-and-bound pruning. */
export function search(
  L: Board,
  starts: Pt[],
  targets: Pt[],
  player: Pt,
  maxStates: number,
  maxDepth: number = Infinity
): SearchResult {
  const size = L.size;
  const normKey = (bs: Pt[], r: Set<number>) => {
    let m = 1e9;
    for (const k of r) if (k < m) m = k;
    return bs.map((b) => key(b.x, b.y, size)).join(',') + '|' + m;
  };
  const initR = reach(L, starts, player);
  let frontier: SNode[] = [
    { bs: starts.map((s) => ({ ...s })), p: { ...player }, r: initR, parent: null, i: -1, d: -1 },
  ];
  const seen = new Set<string>([normKey(starts, initR)]);
  for (let depth = 0; frontier.length > 0; depth++) {
    const next: SNode[] = [];
    for (const st of frontier) {
      if (st.bs.every((b, i) => b.x === targets[i]!.x && b.y === targets[i]!.y)) {
        return { found: st, depth, exhausted: false };
      }
      if (depth >= maxDepth) continue;
      const r = st.r;
      for (let i = 0; i < st.bs.length; i++) {
        for (let d = 0; d < 4; d++) {
          const sx = st.bs[i]!.x - DX[d]!;
          const sy = st.bs[i]!.y - DY[d]!;
          if (!inB(sx, sy, size) || !r.has(key(sx, sy, size))) continue;
          const path = slidePath(L, st.bs, i, d);
          if (path.length < 2) continue;
          const end = path[path.length - 1]!;
          if (deadBlock(end, targets[i]!, size)) continue;
          const bs = st.bs.map((b) => ({ ...b }));
          const p = { ...st.bs[i]! };
          bs[i] = { ...end };
          const h = minPushesRemaining(bs, targets);
          if (depth + 1 + h > maxDepth) continue;
          const childR = reach(L, bs, p);
          if (h === 0) {
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
): ('Up' | 'Down' | 'Left' | 'Right')[] | null {
  const moves: ('Up' | 'Down' | 'Left' | 'Right')[] = [];
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

// ---------------------------------------------------------------- builder

export interface Built {
  L: Board;
  targets: Pt[];
  starts: Pt[];
  player: Pt;
  plan: Push[];
}

/**
 * Reverse ("un-push") construction with backtracking.
 * @param tier difficulty tier 0-6 — higher tiers favour using other blocks as bumpers
 */
export function buildReverse(nb: number, K: number, tier: number, size: number = N): Built | null {
  const walls = new Set<number>();
  const L: Board = { size, wallSet: walls };

  // Cells that a planned slide / standing spot / walking path relies on — never wall these.
  const keep = new Map<number, number>();
  const addKeep = (k: number) => keep.set(k, (keep.get(k) ?? 0) + 1);
  const remKeep = (k: number) => {
    const v = (keep.get(k) ?? 1) - 1;
    if (v > 0) keep.set(k, v);
    else keep.delete(k);
  };

  // 1. Target zones: mostly edges (not corners), with some interior cells.
  const targets: Pt[] = [];
  for (let b = 0; b < nb; b++) {
    for (let tr = 0; tr < 60; tr++) {
      let x: number;
      let y: number;
      if (Math.random() < 0.75) {
        const s = rnd(4);
        const u = 1 + rnd(size - 2);
        [x, y] = s === 0 ? [u, 0] : s === 1 ? [u, size - 1] : s === 2 ? [0, u] : [size - 1, u];
      } else {
        x = 1 + rnd(size - 2);
        y = 1 + rnd(size - 2);
      }
      if (keep.has(key(x, y, size)) || hasBlock(targets, x, y)) continue;
      targets.push({ x, y });
      break;
    }
  }
  if (targets.length < nb) return null;

  const bs = targets.map((q) => ({ ...q }));
  let p: Pt = { x: 0, y: 0 };

  const plan: Push[] = [];
  let nodes = 0;
  // Every spot each block rests on along its route (target first, then backwards).
  const chains: Pt[][] = targets.map((q) => [{ ...q }]);
  // Bumper preference: board edge / wall = 4, another block = rises with tier, brand-new wall = 1.
  const blockBumperWeight = 2 + tier * 2;

  /** Would the block at S reach a later spot of its own route in ONE push (other than the planned one)? */
  const shortcut = (i: number, S: Pt, planned: number) => {
    const tmp = bs.map((b) => ({ ...b }));
    tmp[i] = { ...S };
    for (let e = 0; e < 4; e++) {
      if (e === planned) continue;
      const path = slidePath(L, tmp, i, e);
      if (path.length < 2) continue;
      const end = path[path.length - 1]!;
      if (hasBlock(chains[i]!, end.x, end.y)) return true;
    }
    return false;
  };

  const options = (last: number, lastD: number) => {
    const r = last === -1 ? new Set<number>() : reach(L, bs, p);
    const opts: { i: number; d: number; k: number; wall: number | null; w: number }[] = [];
    for (let i = 0; i < nb; i++) {
      for (let d = 0; d < 4; d++) {
        if (i === last && d === lastD) continue;
        const T = bs[i]!;
        const bx = T.x + DX[d]!;
        const by = T.y + DY[d]!;
        let wall: number | null = null;
        let w = 4; // board edge / existing wall
        const bk = key(bx, by, size);
        const isBoardEdge = !inB(bx, by, size);
        const isExistingWall = inB(bx, by, size) && walls.has(bk);
        const isExistingBlock = inB(bx, by, size) && hasBlock(bs, bx, by);

        if (isBoardEdge || isExistingWall) {
          w = 4;
        } else if (isExistingBlock) {
          w = blockBumperWeight; // another block resting here acts as the bumper
        } else {
          wall = bk;
          if (keep.has(wall) || hasBlock(targets, bx, by)) continue;
          w = 1;
        }

        let activeReach = r;
        if (wall !== null && last !== -1) {
          walls.add(wall);
          activeReach = reach(L, bs, p);
          walls.delete(wall);
        }

        const route = chains[i]!;
        for (let k = 2; k < size - 1; k++) {
          const sx = T.x - DX[d]! * k;
          const sy = T.y - DY[d]! * k;
          const px = sx - DX[d]!;
          const py = sy - DY[d]!;
          if (
            !inB(px, py, size) ||
            isBlocked(L, px, py) ||
            hasBlock(bs, px, py) ||
            key(px, py, size) === wall
          ) {
            break;
          }
          let ok = true;
          for (let j = 1; j <= k; j++) {
            const cx = T.x - DX[d]! * j;
            const cy = T.y - DY[d]! * j;
            if (isBlocked(L, cx, cy) || hasBlock(bs, cx, cy) || key(cx, cy, size) === wall) {
              ok = false;
              break;
            }
          }
          if (!ok) break;
          if (isCorner(sx, sy, size)) continue;
          if (last !== -1 && !activeReach.has(key(sx, sy, size))) continue;
          // Never re-use a row/column this block's route already rests on
          if (DY[d] !== 0 ? route.some((c) => c.y === sy) : route.some((c) => c.x === sx)) continue;
          opts.push({ i, d, k, wall, w: w * (i === last ? 0.5 : 1) });
        }
      }
    }
    return opts;
  };

  const dfs = (depth: number, last: number, lastD: number): boolean => {
    if (depth >= K) return true;
    if (++nodes > 400) return false;
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
      const S = { x: T.x - DX[pk.d]! * pk.k, y: T.y - DY[pk.d]! * pk.k };
      if (pk.wall !== null) walls.add(pk.wall);
      if (shortcut(pk.i, S, pk.d)) {
        if (pk.wall !== null) walls.delete(pk.wall);
        tries--;
        continue;
      }

      // Verify and protect the walking route from post-push player spot S to next push stance pOld
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
      for (let j = 0; j <= pk.k + 1; j++) {
        const c = key(T.x - DX[pk.d]! * j, T.y - DY[pk.d]! * j, size);
        addKeep(c);
        kk.push(c);
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
      p = { x: S.x - DX[pk.d]!, y: S.y - DY[pk.d]! };
      plan.unshift({ i: pk.i, d: pk.d });
      chains[pk.i]!.push(S);
      if (dfs(depth + 1, pk.i, pk.d)) return true;
      chains[pk.i]!.pop();
      plan.shift();
      bs[pk.i] = T;
      p = pOld;
      for (const c of kk) remKeep(c);
      if (pk.wall !== null) walls.delete(pk.wall);
      if (nodes > 400) return false;
    }
    return false;
  };

  if (!dfs(0, -1, -1)) return null;
  if (bs.some((b, i) => (b.x === targets[i]!.x && b.y === targets[i]!.y) || deadBlock(b, targets[i]!, size))) {
    return null;
  }

  // A couple of safe decoy walls
  const decoys = rnd(3);
  for (let i = 0; i < decoys; i++) {
    const x = 1 + rnd(size - 2);
    const y = 1 + rnd(size - 2);
    const k = key(x, y, size);
    if (keep.has(k) || hasBlock(bs, x, y) || hasBlock(targets, x, y)) continue;
    walls.add(k);
  }

  const region = [...reach(L, bs, p)];
  if (region.length === 0) return null;
  const pk = region[rnd(region.length)]!;
  return {
    L,
    targets,
    starts: bs.map((b) => ({ ...b })),
    player: { x: pk % size, y: Math.floor(pk / size) },
    plan,
  };
}

/** Play the designed pushes forward with the real rules. */
export function replay(B: Built): boolean {
  const { L, targets, plan } = B;
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
  return bs.every((b, i) => b.x === targets[i]!.x && b.y === targets[i]!.y);
}

// ---------------------------------------------------------------- difficulty & bridge

export const TIERS = [
  { blocks: 2, minPushes: 3 }, // stages 1-5
  { blocks: 3, minPushes: 5 }, // stages 6-10
  { blocks: 3, minPushes: 7 }, // stages 11-15
  { blocks: 4, minPushes: 9 }, // stages 16-20
  { blocks: 5, minPushes: 11 }, // stages 21-25
  { blocks: 5, minPushes: 13 }, // stages 26-30
  { blocks: 6, minPushes: 16 }, // stages 31+
];

export function getTierDifficulty(level: number): { tier: number; blocks: number; minPushes: number } {
  const tier = Math.min(TIERS.length - 1, Math.floor((Math.max(1, level) - 1) / 5));
  return { tier, ...TIERS[tier]! };
}

export function generateBacktrackingLevel(levelOrTier: number = 1, size: number = N): GeneratedPuzzle {
  const { tier, blocks: nb, minPushes } = getTierDifficulty(levelOrTier);
  const budget = nb <= 4 ? 40000 : 12000;
  let solverCalls = nb <= 3 ? 40 : nb === 4 ? 12 : 4;

  let bestVerified: { B: Built; par: number; moves: ('Up' | 'Down' | 'Left' | 'Right')[] } | null = null;
  let bestExhausted: {
    B: Built;
    par: number;
    lowerBound: number;
    moves: ('Up' | 'Down' | 'Left' | 'Right')[];
  } | null = null;

  for (let attempt = 0; attempt < 400 && solverCalls > 0; attempt++) {
    const B = buildReverse(nb, minPushes + rnd(2), tier, size);
    if (!B || !replay(B)) continue;
    solverCalls--;
    const res = search(B.L, B.starts, B.targets, B.player, budget, B.plan.length);
    if (res.found) {
      const par = res.depth;
      const pushes: Push[] = [];
      for (let n: SNode | null = res.found; n && n.parent; n = n.parent) {
        pushes.unshift({ i: n.i, d: n.d });
      }
      const moves = pushesToMoves(B.L, B.starts, B.player, pushes);
      if (!moves) continue;
      if (!bestVerified || par > bestVerified.par) {
        bestVerified = { B, par, moves };
      }
      if (par >= minPushes) break;
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
  const shuffledColors = COLOR_NAMES.slice().sort(() => Math.random() - 0.5);

  const blocks: SolverBlock[] = B.starts.map((s, i) => ({
    id: `b_${shuffledColors[i % shuffledColors.length]}_${i}`,
    color: shuffledColors[i % shuffledColors.length]!,
    x: s.x,
    y: s.y,
  }));

  const targets: SolverTarget[] = B.targets.map((t, i) => ({
    id: `t_${shuffledColors[i % shuffledColors.length]}_${i}`,
    color: shuffledColors[i % shuffledColors.length]!,
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
    portals: [],
    par,
    solutionMoves: moves,
  };
}
