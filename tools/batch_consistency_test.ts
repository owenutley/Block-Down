import { generateModeratePuzzle } from '../src/client/utils/puzzleSolver';

console.log('Testing 20 consecutive puzzle generations for consistency and performance...\n');

const results: {
  id: number;
  timeMs: number;
  moves: number;
  walls: number;
  blocks: number;
  playerPos: string;
}[] = [];

const startTime = Date.now();

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
    playerPos: `(${p.player.x},${p.player.y})`,
  };
  results.push(r);
  console.log(`[Puzzle #${r.id.toString().padStart(2, '0')}] Time: ${r.timeMs.toString().padStart(4, ' ')}ms | Blocks: ${r.blocks} | Walls: ${r.walls} | Moves: ${r.moves.toString().padStart(2, ' ')} | Player: ${r.playerPos}`);
}

const totalTime = Date.now() - startTime;
const avgTime = Math.round(totalTime / results.length);
const avgMoves = Math.round(results.reduce((acc, r) => acc + r.moves, 0) / results.length);
const avgWalls = (results.reduce((acc, r) => acc + r.walls, 0) / results.length).toFixed(1);

console.log(`\n=== SUMMARY ===`);
console.log(`Generated ${results.length}/20 puzzles successfully in ${totalTime}ms`);
console.log(`Average Generation Time: ${avgTime}ms per puzzle`);
console.log(`Average Moves: ${avgMoves}`);
console.log(`Average Walls: ${avgWalls}`);
