import { GameDifficulty, LevelConfig } from '../types';

export const LEVEL_CONFIGS: Record<GameDifficulty, LevelConfig> = {
  tutorial: {
    walls: [{ x: 8, y: 7 }],
    blocks: [
      { pos: { x: 3, y: 3 }, type: 'yellow-crescent' },
      { pos: { x: 2, y: 7 }, type: 'green-cross' },
      { pos: { x: 2, y: 2 }, type: 'red-heart' },
    ],
    destinations: [
      { pos: { x: 10, y: 3 }, type: 'yellow-crescent' },
      { pos: { x: 7, y: 0 }, type: 'green-cross' },
      { pos: { x: 0, y: 6 }, type: 'red-heart' },
    ],
    startPos: { x: 1, y: 1 },
    gridSize: 11,
  },
  daily: {
    walls: [],
    blocks: [],
    destinations: [],
    startPos: { x: 5, y: 5 },
    gridSize: 11,
  },
  easy: {
    walls: [{ x: 9, y: 1 }],
    blocks: [
      { pos: { x: 2, y: 1 }, type: 'blue-diamond' },
      { pos: { x: 2, y: 6 }, type: 'red-heart' },
    ],
    destinations: [
      { pos: { x: 10, y: 6 }, type: 'red-heart' },
      { pos: { x: 8, y: 10 }, type: 'blue-diamond' },
    ],
    startPos: { x: 5, y: 5 },
    gridSize: 11,
  },
  medium: {
    walls: [
      { x: 1, y: 5 },
      { x: 8, y: 6 },
      { x: 4, y: 0 },
      { x: 9, y: 1 },
      { x: 2, y: 7 },
      { x: 3, y: 2 },
      { x: 10, y: 3 },
      { x: 9, y: 9 },
    ],
    blocks: [
      { pos: { x: 4, y: 9 }, type: 'green-cross' },
      { pos: { x: 8, y: 9 }, type: 'red-heart' },
      { pos: { x: 6, y: 9 }, type: 'blue-diamond' },
    ],
    destinations: [
      { pos: { x: 2, y: 5 }, type: 'green-cross' },
      { pos: { x: 9, y: 8 }, type: 'red-heart' },
      { pos: { x: 10, y: 0 }, type: 'blue-diamond' },
    ],
    startPos: { x: 1, y: 1 },
    gridSize: 11,
  },
  hard: {
    walls: [
      { x: 0, y: 5 },
      { x: 1, y: 5 },
      { x: 1, y: 7 },
      { x: 2, y: 2 },
      { x: 4, y: 6 },
      { x: 5, y: 2 },
      { x: 5, y: 8 },
      { x: 6, y: 1 },
      { x: 7, y: 8 },
    ],
    blocks: [
      { pos: { x: 7, y: 3 }, type: 'red-heart' },
      { pos: { x: 4, y: 2 }, type: 'blue-diamond' },
      { pos: { x: 5, y: 4 }, type: 'yellow-crescent' },
      { pos: { x: 3, y: 4 }, type: 'purple-circle' },
      { pos: { x: 1, y: 2 }, type: 'green-cross' },
      { pos: { x: 7, y: 1 }, type: 'orange-square' },
    ],
    destinations: [
      { pos: { x: 4, y: 8 }, type: 'red-heart' },
      { pos: { x: 0, y: 3 }, type: 'blue-diamond' },
      { pos: { x: 6, y: 8 }, type: 'yellow-crescent' },
      { pos: { x: 2, y: 5 }, type: 'purple-circle' },
      { pos: { x: 6, y: 3 }, type: 'green-cross' },
      { pos: { x: 8, y: 8 }, type: 'orange-square' },
    ],
    startPos: { x: 7, y: 0 },
    gridSize: 9,
  },
};
