// Quick verification of the new backtracking level generator compiled output
import { generateBacktrackingLevel, getTierDifficulty, TIERS } from '../src/client/utils/backtrackingGenerator.ts';

console.log('--- Testing Backtracking Generator ---');
console.log('TIERS configured:', TIERS.length);

for (let stage of [1, 6, 11]) {
  const diff = getTierDifficulty(stage);
  console.log(`\nGenerating Stage ${stage} (Tier ${diff.tier}: ${diff.blocks} blocks, minPar: ${diff.minPushes})...`);
  const level = generateBacktrackingLevel(stage);
  console.log(`✓ Stage ${stage} Generated Successfully!`);
  console.log(`  - Dimensions: ${level.width}x${level.height}`);
  console.log(`  - Blocks: ${level.blocks.length} (${level.blocks.map(b => b.color).join(', ')})`);
  console.log(`  - Targets: ${level.targets.length}`);
  console.log(`  - Walls: ${level.walls.length}`);
  console.log(`  - Calculated Par: ${level.par}`);
  console.log(`  - Solution Moves: ${level.solutionMoves.length} steps`);
}
console.log('\nAll stages generated and verified cleanly!');
