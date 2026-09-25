import { generateHardPuzzle, generateModeratePuzzle } from '../src/client/utils/puzzleSolver.ts';

console.log('Testing 3 hard puzzles:');
for (let i = 0; i < 3; i++) {
  const t0 = Date.now();
  const p = generateHardPuzzle({
    minBlocks: 3,
    maxBlocks: 3,
    minTotalPushes: 8,
    maxTotalPushes: 12,
    minSolutionPushCount: 7,
    minAverageSlideDistance: 3.0,
    minBlockCollisions: 1,
    minBlockSwitches: 3,
  });
  console.log(`Hard Puzzle ${i + 1} (${Date.now() - t0}ms):`, {
    pushes: p.pushDistances?.length,
    moves: p.solutionMoves.length,
    collisions: p.blockCollisions,
    switches: p.blockSwitches,
    avgSlide: p.averageSlideDistance,
    distances: p.pushDistances,
  });
}
