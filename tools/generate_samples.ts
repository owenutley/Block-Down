import { generatePuzzle } from '../src/client/utils/puzzleSolver';

function renderAsciiGrid(puzzle: ReturnType<typeof generatePuzzle>): string {
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
    // If block is on target, mark with uppercase inside braces or star
    if (grid[b.y]![b.x] !== ' . ' && grid[b.y]![b.x]?.startsWith('[')) {
      grid[b.y]![b.x] = `*${sym}*`;
    } else {
      grid[b.y]![b.x] = ` ${sym} `;
    }
  }

  // Player
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

console.log('=== GENERATING 3 MODERATE PUZZLE SAMPLES ===\n');

for (let i = 1; i <= 3; i++) {
  const p = generatePuzzle({ width: 9, height: 9 });
  console.log(`\n================== SAMPLE PUZZLE ${i} ==================`);
  console.log(`Player Start: (${p.player.x}, ${p.player.y})`);
  console.log(`Blocks (${p.blocks.length}):`, p.blocks.map(b => `${b.color}@(${b.x},${b.y})`).join(', '));
  console.log(`Targets (${p.targets.length}):`, p.targets.map(t => `${t.color}@(${t.x},${t.y})`).join(', '));
  console.log(`Walls (${p.walls.length}):`, p.walls.map(w => `(${w.x},${w.y})`).join(', '));
  console.log(`Solution Moves (${p.solutionMoves.length}):`, p.solutionMoves.join(' → '));
  console.log('\nASCII Board Representation (P=Player, #=Wall, lower=Block, [UPPER]=Target):');
  console.log(renderAsciiGrid(p));
  console.log('\nRaw JSON Config:');
  console.log(JSON.stringify(p, null, 2));
}
