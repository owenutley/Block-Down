import { solvePuzzlePushBFS, simulatePushSlide, getReachableTiles, type SolverBlock, type SolverTarget, type Position } from '../src/client/utils/puzzleSolver.ts';

const width = 9;
const height = 9;
const targets: SolverTarget[] = [
  { id: 't_red_0', color: 'red', x: 2, y: 2 },
  { id: 't_blue_1', color: 'blue', x: 6, y: 2 },
  { id: 't_yellow_2', color: 'yellow', x: 4, y: 6 },
];

const blocks: SolverBlock[] = [
  { id: 'b_red_0', color: 'red', x: 1, y: 5 },
  { id: 'b_blue_1', color: 'blue', x: 3, y: 5 },
  { id: 'b_yellow_2', color: 'yellow', x: 7, y: 3 },
];

const walls: Position[] = [
  { x: 4, y: 7 },
  { x: 3, y: 3 },
  { x: 6, y: 1 },
  { x: 7, y: 5 },
  { x: 2, y: 1 },
];

const player = { x: 0, y: 0 };
console.log('Testing BFS solve...');
const sol = solvePuzzlePushBFS({
  width,
  height,
  player,
  walls,
  blocks,
  targets,
  portals: [],
}, 5000);

console.log('Sol:', sol);
