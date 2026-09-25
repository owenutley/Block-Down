import { generateModeratePuzzle, getPuzzlePushMetrics, type SolverBlock, type SolverTarget, type Position } from '../src/client/utils/puzzleSolver.ts';

function renderAsciiGrid(puzzle: ReturnType<typeof generateModeratePuzzle>): string {
  const grid: string[][] = Array.from({ length: puzzle.height }, () =>
    Array.from({ length: puzzle.width }, () => ' . ')
  );

  for (const w of puzzle.walls) {
    grid[w.y]![w.x] = ' # ';
  }

  for (const t of puzzle.targets) {
    const sym = t.color.charAt(0).toUpperCase();
    grid[t.y]![t.x] = `[${sym}]`;
  }

  for (const b of puzzle.blocks) {
    const sym = b.color.charAt(0).toLowerCase();
    if (grid[b.y]![b.x] !== ' . ' && grid[b.y]![b.x]?.startsWith('[')) {
      grid[b.y]![b.x] = `*${sym}*`;
    } else {
      grid[b.y]![b.x] = ` ${sym} `;
    }
  }

  const p = puzzle.player;
  if (grid[p.y]![p.x] === ' . ') {
    grid[p.y]![p.x] = ' P ';
  } else {
    grid[p.y]![p.x] = '(P)';
  }

  const lines = grid.map((row, y) => `${y} | ${row.join('')}`).join('\n');
  const header = '    ' + Array.from({ length: puzzle.width }, (_, x) => ` ${x} `).join('');
  return `${header}\n   +${'-'.repeat(puzzle.width * 3)}+\n${lines}\n   +${'-'.repeat(puzzle.width * 3)}+`;
}

console.log('=== GENERATING 3 VERIFIED HIGH-COMPLEXITY LONG-SLIDE PUZZLES ===\n');

for (let i = 1; i <= 3; i++) {
  const t0 = Date.now();
  const puzzle = generateModeratePuzzle();
  const genMs = Date.now() - t0;

  const metrics = getPuzzlePushMetrics(
    puzzle.width,
    puzzle.height,
    puzzle.player,
    puzzle.walls,
    puzzle.blocks,
    puzzle.targets,
    puzzle.solutionMoves
  );

  console.log(`\n================== SAMPLE PUZZLE ${i} (${genMs}ms) ==================`);
  console.log(`Player Start: (${puzzle.player.x}, ${puzzle.player.y})`);
  console.log(`Blocks (${puzzle.blocks.length}):`, puzzle.blocks.map(b => `${b.color}@(${b.x},${b.y})`).join(', '));
  console.log(`Targets (${puzzle.targets.length}):`, puzzle.targets.map(t => `${t.color}@(${t.x},${t.y})`).join(', '));
  console.log(`Walls (${puzzle.walls.length}):`, puzzle.walls.map(w => `(${w.x},${w.y})`).join(', '));
  console.log(`Push Count: ${metrics.pushCount}`);
  console.log(`Slide Distances: [${metrics.slideDistances.join(', ')}]`);
  console.log(`Average Slide Distance: ${metrics.averageSlideDistance.toFixed(2)} tiles`);
  console.log(`Walk Moves: ${metrics.walkMovesCount}`);
  console.log(`Total Solution Moves: ${metrics.totalMovesCount}`);
  console.log(`Solution Moves: ${puzzle.solutionMoves.join(' → ')}`);
  console.log('\nASCII Board:');
  console.log(renderAsciiGrid(puzzle));
  console.log('\nRaw JSON:');
  console.log(JSON.stringify(puzzle, null, 2));
}
