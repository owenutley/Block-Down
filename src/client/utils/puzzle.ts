import type { BlockType, LevelConfig } from '../types';
import {
  dirToVector,
  getNextPosWithPortalsDetails,
  getNextPosWithPortals,
  simulateSolutionPushes,
  calculatePuzzlePar,
  TrajectoryStep,
  PortalTrajectory,
} from '../../shared/puzzle';

export {
  dirToVector,
  getNextPosWithPortalsDetails,
  getNextPosWithPortals,
  simulateSolutionPushes,
  calculatePuzzlePar,
};
export type { TrajectoryStep, PortalTrajectory };

export const colorToBlockType = (color: string): BlockType => {
  switch (color.toLowerCase()) {
    case 'red': return 'red-heart';
    case 'blue': return 'blue-diamond';
    case 'yellow': return 'yellow-crescent';
    case 'purple': return 'purple-circle';
    case 'green': return 'green-cross';
    case 'orange': return 'orange-square';
    case 'gray':
    case 'grey':
      return 'gray-neutral';
    default: return 'red-heart';
  }
};
export const calculateParPushes = (levelConfig: LevelConfig): number => {
  return calculatePuzzlePar(levelConfig);
};

export const calculateStars = (pushCount: number, par: number): 1 | 2 | 3 => {
  if (pushCount <= 0) return 3;
  if (pushCount <= par) return 3;
  const twoStarLimit = Math.max(par + 2, Math.ceil(par * 1.4));
  if (pushCount <= twoStarLimit) return 2;
  return 1;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const convertPuzzleToLevelConfig = (puzzle: any): LevelConfig => {
  const playerPos = puzzle.player || puzzle.startPos || { x: 1, y: 1 };
  const rawBlocks = puzzle.blocks || [];
  const rawTargets = puzzle.targets || puzzle.destinations || [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formattedBlocks = rawBlocks.map((b: any) => {
    const x = b.x !== undefined ? b.x : b.pos?.x ?? 0;
    const y = b.y !== undefined ? b.y : b.pos?.y ?? 0;
    const color = b.color || b.type || 'red';
    return {
      id: b.id || `b_${Math.random()}`,
      pos: { x, y },
      type: colorToBlockType(color),
    };
  });

  const formattedTargets = rawTargets
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((t: any) => {
      const color = t.color || t.type || '';
      return color !== 'gray' && color !== 'grey';
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((t: any) => {
      const x = t.x !== undefined ? t.x : t.pos?.x ?? 0;
      const y = t.y !== undefined ? t.y : t.pos?.y ?? 0;
      const color = t.color || t.type || 'red';
      return {
        id: t.id || `t_${Math.random()}`,
        pos: { x, y },
        type: colorToBlockType(color),
      };
    });

  const config: LevelConfig = {
    name: puzzle.name,
    author: puzzle.author,
    gridSize: Math.max(puzzle.width || 9, puzzle.height || 9),
    startPos: playerPos,
    walls: puzzle.walls || [],
    blocks: formattedBlocks,
    destinations: formattedTargets,
    portals: puzzle.portals || [],
    moves: puzzle.playerMoves || puzzle.solutionMoves || [],
    ...(puzzle.splashMovesCount !== undefined ? { splashMovesCount: puzzle.splashMovesCount } : {}),
    ...(puzzle.theme ? { theme: puzzle.theme } : {}),
    ...(puzzle.character ? { character: puzzle.character } : {}),
    ...(typeof puzzle.par === 'number' && puzzle.par > 0 ? { par: puzzle.par } : {}),
  };
  config.par = calculateParPushes(config);
  return config;
};

export const blockTypeToEmoji = (typeOrColor: string): string => {
  const lower = (typeOrColor || '').toLowerCase();
  if (lower.includes('red')) return '🟥';
  if (lower.includes('blue')) return '🟦';
  if (lower.includes('yellow')) return '🟨';
  if (lower.includes('green')) return '🟩';
  if (lower.includes('orange')) return '🟧';
  if (lower.includes('purple')) return '🟪';
  if (lower.includes('gray') || lower.includes('grey') || lower.includes('stone') || lower.includes('neutral')) return '⬛';
  return '🟦';
};

export const formatBlockPushEmojis = (pushHistory: string[] = []): string => {
  if (!pushHistory || pushHistory.length === 0) return '';
  return pushHistory.map((item) => blockTypeToEmoji(item)).join(' ');
};

