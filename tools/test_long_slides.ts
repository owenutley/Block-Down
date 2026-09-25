import { generateReversePushPuzzle } from '../src/client/utils/puzzleSolver';

console.log('Testing Enhanced Long-Slide Generator...\n');

for (let i = 1; i <= 3; i++) {
  const p = generateReversePushPuzzle({
    width: 9,
    height: 9,
    minBlocks: 3,
    maxBlocks: 3,
    minTotalPushes: 8,
    maxTotalPushes: 12,
    minPushesPerBlock: 3,
    maxPushesPerBlock: 5,
    minSolutionPushCount: 7,
    maxAttempts: 250,
  });

  console.log(`\n================== SAMPLE PUZZLE ${i} ==================`);
  console.log(`Player Start: (${p.player.x}, ${p.player.y})`);
  console.log(`Blocks (${p.blocks.length}):`, p.blocks.map(b => `${b.color}@(${b.x},${b.y})`).join(', '));
  console.log(`Targets (${p.targets.length}):`, p.targets.map(t => `${t.color}@(${t.x},${t.y})`).join(', '));
  console.log(`Walls (${p.walls.length}):`, p.walls.map(w => `(${w.x},${w.y})`).join(', '));
  console.log(`Total Solution Moves: ${p.solutionMoves.length}`);
}
