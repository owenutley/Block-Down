import * as fs from 'fs';
import * as path from 'path';
import { performance } from 'perf_hooks';
import {
  generateBacktrackingLevel,
  TIERS,
  Board,
  Pt,
  dirIndex,
  DX,
  DY,
  key,
  slideDetails,
  isSolved,
  DirName,
} from '../src/shared/backtrackingGenerator';
import { GeneratedPuzzle } from '../src/shared/types';

// ANSI color codes for terminal output
const ANSI: Record<string, string> = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  purple: '\x1b[35m',
  orange: '\x1b[38;5;208m',
  gray: '\x1b[90m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
};

const PORTAL_ARROWS: Record<string, string> = {
  Up: '^',
  Down: 'v',
  Left: '<',
  Right: '>',
};

/** Exact JSON schema matching the hand-built puzzle format */
export type HandBuiltPuzzleFormat = {
  width: number;
  height: number;
  player: { x: number; y: number };
  walls: { x: number; y: number }[];
  blocks: { id: string; color: string; x: number; y: number }[];
  targets: { id: string; color: string; x: number; y: number }[];
  portals: { id: string; color: string; x: number; y: number; dir: DirName }[];
  playerMoves: DirName[];
  par: number;
};

type SimulationStats = {
  valid: boolean;
  pushes: number;
  walkSteps: number;
  portalTeleports: number;
  grayPushes: number;
  blockBumpersUsed: number;
  qualityScore: number;
};

/** Generates an ID matching the hand-built format (e.g., `b_1791818949898_13sc`) */
function makeEntityId(prefix: 'b' | 't' | 'p'): string {
  const ts = Date.now() + Math.floor(Math.random() * 1000);
  const suffix = Math.random().toString(36).substring(2, 6).padEnd(4, '0');
  return `${prefix}_${ts}_${suffix}`;
}

/** Converts a GeneratedPuzzle into the exact hand-built JSON schema */
function toHandBuiltFormat(p: GeneratedPuzzle): HandBuiltPuzzleFormat {
  return {
    width: p.width,
    height: p.height,
    player: { x: p.player.x, y: p.player.y },
    walls: p.walls.map((w) => ({ x: w.x, y: w.y })),
    blocks: p.blocks.map((b) => ({
      id: makeEntityId('b'),
      color: b.color,
      x: b.x,
      y: b.y,
    })),
    targets: p.targets.map((t) => ({
      id: makeEntityId('t'),
      color: t.color,
      x: t.x,
      y: t.y,
    })),
    portals: (p.portals ?? []).map((pt) => ({
      id: makeEntityId('p'),
      color: pt.color,
      x: pt.x,
      y: pt.y,
      dir: pt.dir as DirName,
    })),
    playerMoves: [...(p.solutionMoves as DirName[])],
    par: p.par,
  };
}

/**
 * Replays `solutionMoves` step-by-step from the start state to verify validity
 * and compute an overall quality score for ranking candidates within a tier.
 */
function verifyAndAnalyzeMoves(p: GeneratedPuzzle): SimulationStats {
  const L: Board = {
    size: p.width,
    wallSet: new Set(p.walls.map((w) => key(w.x, w.y, p.width))),
    portals: p.portals ?? [],
  };

  const bs: Pt[] = p.blocks.map((b) => ({ x: b.x, y: b.y }));
  const blockColors = p.blocks.map((b) => b.color);
  const player: Pt = { x: p.player.x, y: p.player.y };

  let pushes = 0;
  let walkSteps = 0;
  let portalTeleports = 0;
  let grayPushes = 0;
  let blockBumpersUsed = 0;
  let lastBlockPushed = -1;
  let sameBlockStreak = 1;
  let streakPenalty = 0;

  for (const move of p.solutionMoves as DirName[]) {
    const d = dirIndex(move);
    const nx = player.x + DX[d]!;
    const ny = player.y + DY[d]!;

    const blockIdx = bs.findIndex((b) => b.x === nx && b.y === ny);
    if (blockIdx !== -1) {
      const details = slideDetails(L, bs, blockIdx, d);
      if (details.path.length < 2) {
        return {
          valid: false,
          pushes,
          walkSteps,
          portalTeleports,
          grayPushes,
          blockBumpersUsed,
          qualityScore: -999,
        };
      }
      pushes++;
      if (blockIdx === lastBlockPushed) {
        sameBlockStreak++;
        if (sameBlockStreak >= 3) streakPenalty += 3;
      } else {
        lastBlockPushed = blockIdx;
        sameBlockStreak = 1;
      }

      if (details.usedPortal) portalTeleports++;
      if (blockColors[blockIdx] === 'gray') grayPushes++;

      const end = details.path[details.path.length - 1]!;
      const bx = end.x + DX[details.endDir]!;
      const by = end.y + DY[details.endDir]!;
      if (bs.some((b, i) => i !== blockIdx && b.x === bx && b.y === by)) {
        blockBumpersUsed++;
      }

      player.x = nx;
      player.y = ny;
      bs[blockIdx] = { ...end };
    } else {
      walkSteps++;
      player.x = nx;
      player.y = ny;
    }
  }

  const valid = isSolved(bs, blockColors, p.targets);
  const qualityScore = valid
    ? pushes * 2 + blockBumpersUsed * 4 + portalTeleports * 5 + grayPushes * 3 - streakPenalty
    : -999;

  return {
    valid,
    pushes,
    walkSteps,
    portalTeleports,
    grayPushes,
    blockBumpersUsed,
    qualityScore,
  };
}

/** Formats a puzzle into a colorized 3-char-per-cell ASCII board. */
function renderAsciiBoard(p: GeneratedPuzzle): string {
  const grid: string[][] = Array.from({ length: p.height }, () =>
    Array.from({ length: p.width }, () => `${ANSI.dim} . ${ANSI.reset}`)
  );

  for (const w of p.walls) {
    grid[w.y]![w.x] = ' # ';
  }

  for (const t of p.targets) {
    const col = ANSI[t.color] ?? '';
    const ch = t.color[0]!.toLowerCase();
    grid[t.y]![t.x] = `${col}(${ch})${ANSI.reset}`;
  }

  for (const pt of p.portals ?? []) {
    const col = ANSI[pt.color] ?? '';
    const arrow = PORTAL_ARROWS[pt.dir] ?? 'O';
    grid[pt.y]![pt.x] = `${col}@${arrow} ${ANSI.reset}`;
  }

  for (const b of p.blocks) {
    const col = ANSI[b.color] ?? '';
    const ch = b.color === 'gray' ? 'G' : b.color[0]!.toUpperCase();
    const underTarget = p.targets.find((t) => t.x === b.x && t.y === b.y);
    if (underTarget) {
      const tCh = underTarget.color[0]!.toLowerCase();
      grid[b.y]![b.x] = `${ANSI.bold}${col}[${ch}${tCh}${ANSI.reset}`;
    } else {
      grid[b.y]![b.x] = `${ANSI.bold}${col}[${ch}]${ANSI.reset}`;
    }
  }

  grid[p.player.y]![p.player.x] = `${ANSI.bold}${ANSI.cyan} P ${ANSI.reset}`;

  const header = '   ' + Array.from({ length: p.width }, (_, x) => ` ${x} `).join('');
  const rows = grid.map((row, y) => ` ${y} ` + row.join(''));
  return [header, ...rows].join('\n');
}

/** Simple CLI argument parser supporting positional count and `--save` / `--out <file>` */
function parseArgs(argv: string[]): { countPerTier: number; outFile: string | null } {
  let countPerTier = 2;
  let outFile: string | null = null;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    if (arg === '--save' || arg === '--out' || arg === '-o') {
      const next = argv[i + 1];
      if (next && !next.startsWith('-')) {
        outFile = next;
        i++;
      } else {
        outFile = 'best-generated-puzzles.json';
      }
    } else if (arg.startsWith('--out=')) {
      outFile = arg.split('=')[1] || 'best-generated-puzzles.json';
    } else if (!arg.startsWith('-')) {
      const parsed = parseInt(arg, 10);
      if (!isNaN(parsed) && parsed > 0) countPerTier = parsed;
    }
  }

  return { countPerTier, outFile };
}

function main() {
  const { countPerTier, outFile } = parseArgs(process.argv.slice(2));
  console.log(
    `${ANSI.bold}Generating ${countPerTier} level(s) across ${TIERS.length} tiers...${ANSI.reset}\n`
  );

  const summary: Record<string, string | number>[] = [];
  const bestPerTier: HandBuiltPuzzleFormat[] = [];

  for (let tierIdx = 0; tierIdx < TIERS.length; tierIdx++) {
    const stageNumber = tierIdx * 5 + 1;
    let sumPar = 0;
    let sumGray = 0;
    let sumPortals = 0;
    let sumTeleports = 0;
    let sumTimeMs = 0;

    let topCandidate: { puzzle: GeneratedPuzzle; score: number; sampleNum: number } | null = null;

    console.log(
      `${ANSI.bold}==================== TIER ${tierIdx} (Stages ${stageNumber}-${stageNumber + 4}) ====================${ANSI.reset}`
    );

    for (let s = 1; s <= countPerTier; s++) {
      const t0 = performance.now();
      const puzzle = generateBacktrackingLevel(stageNumber);
      const elapsedMs = Math.round(performance.now() - t0);

      const stats = verifyAndAnalyzeMoves(puzzle);
      const grayCount = puzzle.blocks.filter((b) => b.color === 'gray').length;
      const coloredCount = puzzle.blocks.length - grayCount;
      const portalPairs = Math.floor((puzzle.portals?.length ?? 0) / 2);

      sumPar += puzzle.par;
      sumGray += grayCount;
      sumPortals += portalPairs;
      sumTeleports += stats.portalTeleports;
      sumTimeMs += elapsedMs;

      if (stats.valid && (!topCandidate || stats.qualityScore > topCandidate.score)) {
        topCandidate = { puzzle, score: stats.qualityScore, sampleNum: s };
      }

      console.log(
        `\n${ANSI.bold}[Tier ${tierIdx} | Sample #${s}]${ANSI.reset} (${elapsedMs} ms) — ` +
          `Verified: ${stats.valid ? `${ANSI.green}PASS${ANSI.reset}` : `${ANSI.red}FAIL${ANSI.reset}`} | ` +
          `Quality Score: ${ANSI.bold}${stats.qualityScore}${ANSI.reset}`
      );
      console.log(
        `  Par (Pushes): ${puzzle.par} (Min target: ${TIERS[tierIdx]!.minPushes}) | Total Moves: ${puzzle.solutionMoves.length} (${stats.walkSteps} walk + ${stats.pushes} push)`
      );
      console.log(
        `  Blocks: ${coloredCount} colored, ${grayCount} gray (${stats.grayPushes} gray pushes, ${stats.blockBumpersUsed} block-bumper stops)`
      );
      console.log(
        `  Portals: ${portalPairs} pair(s) spawned | ${stats.portalTeleports} teleport(s) in solution\n`
      );

      console.log(renderAsciiBoard(puzzle));
    }

    if (topCandidate) {
      bestPerTier.push(toHandBuiltFormat(topCandidate.puzzle));
    }

    console.log('\n');
    summary.push({
      Tier: tierIdx,
      Stages: `${stageNumber}-${stageNumber + 4}`,
      'Min Par': TIERS[tierIdx]!.minPushes,
      'Avg Par': +(sumPar / countPerTier).toFixed(1),
      'Best Score': topCandidate ? `${topCandidate.score} (#${topCandidate.sampleNum})` : 'N/A',
      'Avg Gray': +(sumGray / countPerTier).toFixed(2),
      'Avg Portals': +(sumPortals / countPerTier).toFixed(2),
      'Avg Teleports': +(sumTeleports / countPerTier).toFixed(2),
      'Avg Time (ms)': Math.round(sumTimeMs / countPerTier),
    });
  }

  console.log(`${ANSI.bold}==================== BATCH SUMMARY ====================${ANSI.reset}`);
  console.table(summary);

  if (outFile) {
    const resolvedPath = path.resolve(process.cwd(), outFile);
    fs.writeFileSync(resolvedPath, JSON.stringify(bestPerTier, null, 2), 'utf-8');
    console.log(
      `\n${ANSI.bold}${ANSI.green}Saved ${bestPerTier.length} top-scoring puzzles (1 per tier) to:${ANSI.reset} ${resolvedPath}`
    );
  }
}

main();
