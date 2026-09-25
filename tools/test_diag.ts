import { generateReversePushPuzzle } from '../src/client/utils/puzzleSolver.ts';

console.log('Testing generation with debug...');
const start = Date.now();
const p = generateReversePushPuzzle({
  width: 9,
  height: 9,
  minBlocks: 3,
  maxBlocks: 3,
  minTotalPushes: 8,
  maxTotalPushes: 12,
  minPushesPerBlock: 2,
  maxPushesPerBlock: 4,
  minSolutionPushCount: 6,
  minAverageSlideDistance: 2.8,
  maxAttempts: 100,
});
console.log('Finished in', Date.now() - start, 'ms');
console.log('Solution moves count:', p.solutionMoves.length);
console.log('Avg slide dist:', p.averageSlideDistance);
console.log('Push distances:', p.pushDistances);
