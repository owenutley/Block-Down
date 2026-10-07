import { redis } from '@devvit/web/server';
import {
  SlideMatchPuzzle,
  SlideMatchDifficulty,
  SlideMatchProgress,
  SlideMatchCampaignData,
  SlideMatchEndlessStats,
  SlideMatchEndlessRecordResult,
} from '../../shared/types';
import { solveSlideMatch, calculateSlideMatchStars } from '../../shared/slideMatch';
import { getUserCurrency, setUserCurrency } from './progress';

const KEYS = {
  PUZZLE: (id: string) => `slidematch:puzzle:${id}`,
  DIFFICULTY_INDEX: (difficulty: SlideMatchDifficulty) => `slidematch:puzzles:${difficulty}`,
  PROGRESS: (username: string) => `slidematch:progress:${username}`,
  STARS: (username: string) => `slidematch:stars:${username}`,
  BEST_SLIDES: (username: string) => `slidematch:best_slides:${username}`,
  ENDLESS_STATS: (username: string) => `slidematch:endless:${username}`,
  INITIALIZED: 'slidematch:initialized:v1',
};

export const DEFAULT_SLIDEMATCH_PUZZLES: SlideMatchPuzzle[] = [
  // Easy 1: Simple 1-slide match
  {
    id: 'sm-easy-1',
    name: 'First Slide',
    difficulty: 'easy',
    width: 6,
    height: 6,
    walls: [
      { x: 5, y: 1 },
      { x: 5, y: 3 },
    ],
    blocks: [
      { id: 'b1', color: 'red', x: 1, y: 1 },
      { id: 'b2', color: 'blue', x: 1, y: 3 },
    ],
    targets: [
      { id: 't1', color: 'red', x: 4, y: 1 },
      { id: 't2', color: 'blue', x: 4, y: 3 },
    ],
    portals: [],
    par: 2,
    createdAt: Date.now(),
  },
  // Easy 2: Corner turn using walls
  {
    id: 'sm-easy-2',
    name: 'Corner Slide',
    difficulty: 'easy',
    width: 6,
    height: 6,
    walls: [
      { x: 4, y: 1 },
      { x: 4, y: 4 },
      { x: 2, y: 4 },
    ],
    blocks: [
      { id: 'b1', color: 'yellow', x: 1, y: 1 },
    ],
    targets: [
      { id: 't1', color: 'yellow', x: 3, y: 4 },
    ],
    portals: [],
    par: 2,
    createdAt: Date.now(),
  },
  // Easy 3: Neutral block obstacle
  {
    id: 'sm-easy-3',
    name: 'Stone Stop',
    difficulty: 'easy',
    width: 7,
    height: 7,
    walls: [],
    blocks: [
      { id: 'b1', color: 'green', x: 1, y: 2 },
      { id: 'b2', color: 'gray', x: 4, y: 2 },
    ],
    targets: [
      { id: 't1', color: 'green', x: 3, y: 2 },
    ],
    portals: [],
    par: 1,
    createdAt: Date.now(),
  },
  // Medium 1: Block coordination
  {
    id: 'sm-med-1',
    name: 'Block Collision',
    difficulty: 'medium',
    width: 7,
    height: 7,
    walls: [
      { x: 5, y: 2 },
      { x: 1, y: 5 },
    ],
    blocks: [
      { id: 'b1', color: 'red', x: 1, y: 2 },
      { id: 'b2', color: 'purple', x: 3, y: 5 },
    ],
    targets: [
      { id: 't1', color: 'red', x: 4, y: 2 },
      { id: 't2', color: 'purple', x: 3, y: 2 },
    ],
    portals: [],
    par: 3,
    createdAt: Date.now(),
  },
  // Medium 2: Portal Gateway
  {
    id: 'sm-med-2',
    name: 'Warp Slide',
    difficulty: 'medium',
    width: 7,
    height: 7,
    walls: [
      { x: 6, y: 1 },
      { x: 1, y: 6 },
    ],
    blocks: [
      { id: 'b1', color: 'blue', x: 0, y: 1 },
      { id: 'b2', color: 'orange', x: 6, y: 5 },
    ],
    targets: [
      { id: 't1', color: 'blue', x: 5, y: 5 },
      { id: 't2', color: 'orange', x: 2, y: 5 },
    ],
    portals: [
      { id: 'p1', color: 'cyan', x: 5, y: 1, dir: 'Left' },
      { id: 'p2', color: 'cyan', x: 1, y: 5, dir: 'Right' },
    ],
    par: 4,
    createdAt: Date.now(),
  },
  // Hard 1: Multi-step slide puzzle
  {
    id: 'sm-hard-1',
    name: 'Gridlock',
    difficulty: 'hard',
    width: 8,
    height: 8,
    walls: [
      { x: 6, y: 1 },
      { x: 1, y: 6 },
      { x: 6, y: 6 },
    ],
    blocks: [
      { id: 'b1', color: 'red', x: 1, y: 1 },
      { id: 'b2', color: 'blue', x: 3, y: 3 },
      { id: 'b3', color: 'gray', x: 5, y: 3 },
      { id: 'b4', color: 'yellow', x: 2, y: 6 },
    ],
    targets: [
      { id: 't1', color: 'red', x: 5, y: 1 },
      { id: 't2', color: 'blue', x: 4, y: 3 },
      { id: 't3', color: 'yellow', x: 5, y: 6 },
    ],
    portals: [],
    par: 5,
    createdAt: Date.now(),
  },
];

const getArray = async (key: string): Promise<string[]> => {
  try {
    const data = await redis.get(key);
    if (!data || data === 'undefined' || data === 'null') return [];
    return JSON.parse(data);
  } catch (err) {
    console.error(`Error parsing array for ${key}:`, err);
    return [];
  }
};

const setArray = async (key: string, items: string[]): Promise<void> => {
  await redis.set(key, JSON.stringify(items));
};

export const initializeSlideMatchSamples = async (): Promise<void> => {
  const isInit = await redis.get(KEYS.INITIALIZED);
  if (isInit) return;

  for (const puzzle of DEFAULT_SLIDEMATCH_PUZZLES) {
    await saveSlideMatchPuzzle(puzzle);
  }
  await redis.set(KEYS.INITIALIZED, 'true');
};

export const saveSlideMatchPuzzle = async (puzzle: SlideMatchPuzzle): Promise<SlideMatchPuzzle> => {
  const solveRes = solveSlideMatch(puzzle);
  const par = puzzle.par && puzzle.par > 0 ? puzzle.par : solveRes.solvable ? solveRes.minSlides : 2;

  const toSave: SlideMatchPuzzle = {
    ...puzzle,
    par,
    solutionMoves: solveRes.solutionMoves.length > 0 ? solveRes.solutionMoves : puzzle.solutionMoves,
    createdAt: puzzle.createdAt || Date.now(),
  };

  await redis.set(KEYS.PUZZLE(toSave.id), JSON.stringify(toSave));

  const diffKey = KEYS.DIFFICULTY_INDEX(toSave.difficulty);
  const existingIds = await getArray(diffKey);
  if (!existingIds.includes(toSave.id)) {
    existingIds.push(toSave.id);
    await setArray(diffKey, existingIds);
  }

  return toSave;
};

export const getSlideMatchPuzzle = async (id: string): Promise<SlideMatchPuzzle | null> => {
  try {
    let data = await redis.get(KEYS.PUZZLE(id));
    if (!data) {
      await initializeSlideMatchSamples();
      data = await redis.get(KEYS.PUZZLE(id));
    }
    if (!data || data === 'undefined' || data === 'null') return null;
    return JSON.parse(data) as SlideMatchPuzzle;
  } catch (err) {
    console.error(`Error getting SlideMatch puzzle ${id}:`, err);
    return null;
  }
};

export const getSlideMatchPuzzlesByDifficulty = async (
  difficulty: SlideMatchDifficulty
): Promise<SlideMatchPuzzle[]> => {
  await initializeSlideMatchSamples();
  const ids = await getArray(KEYS.DIFFICULTY_INDEX(difficulty));
  const puzzles: SlideMatchPuzzle[] = [];

  for (const id of ids) {
    const p = await getSlideMatchPuzzle(id);
    if (p) {
      puzzles.push(p);
    }
  }

  return puzzles;
};

export const getAllSlideMatchPuzzles = async (): Promise<SlideMatchPuzzle[]> => {
  await initializeSlideMatchSamples();
  const [easy, med, hard] = await Promise.all([
    getSlideMatchPuzzlesByDifficulty('easy'),
    getSlideMatchPuzzlesByDifficulty('medium'),
    getSlideMatchPuzzlesByDifficulty('hard'),
  ]);
  return [...easy, ...med, ...hard];
};

export const deleteSlideMatchPuzzle = async (id: string): Promise<boolean> => {
  const p = await getSlideMatchPuzzle(id);
  if (!p) return false;

  await redis.del(KEYS.PUZZLE(id));
  const diffKey = KEYS.DIFFICULTY_INDEX(p.difficulty);
  const existingIds = await getArray(diffKey);
  const updated = existingIds.filter((item) => item !== id);
  await setArray(diffKey, updated);
  return true;
};

export const reorderSlideMatchPuzzles = async (
  difficulty: SlideMatchDifficulty,
  orderedIds: string[]
): Promise<void> => {
  await setArray(KEYS.DIFFICULTY_INDEX(difficulty), orderedIds);
};

export const getSlideMatchUserProgress = async (username: string): Promise<SlideMatchProgress> => {
  if (!username) {
    return { completedIds: [], stars: {}, bestSlides: {} };
  }

  try {
    const [compData, starsData, bestData] = await Promise.all([
      redis.get(KEYS.PROGRESS(username)),
      redis.get(KEYS.STARS(username)),
      redis.get(KEYS.BEST_SLIDES(username)),
    ]);

    const completedIds: string[] = compData ? JSON.parse(compData) : [];
    const stars: Record<string, number> = starsData ? JSON.parse(starsData) : {};
    const bestSlides: Record<string, number> = bestData ? JSON.parse(bestData) : {};

    return { completedIds, stars, bestSlides };
  } catch (err) {
    console.error(`Error loading user SlideMatch progress:`, err);
    return { completedIds: [], stars: {}, bestSlides: {} };
  }
};

export const getSlideMatchCampaignData = async (username: string): Promise<SlideMatchCampaignData> => {
  const [puzzles, progress] = await Promise.all([
    getAllSlideMatchPuzzles(),
    getSlideMatchUserProgress(username),
  ]);

  return {
    puzzles,
    completedIds: progress.completedIds,
    stars: progress.stars,
    bestSlides: progress.bestSlides,
  };
};

export const recordSlideMatchWin = async (
  username: string,
  puzzleId: string,
  slideCount: number
): Promise<{ starsEarned: number; isNewCompletion: boolean; progress: SlideMatchProgress }> => {
  const puzzle = await getSlideMatchPuzzle(puzzleId);
  const par = puzzle?.par || 2;
  const starsEarned = calculateSlideMatchStars(slideCount, par);

  const currentProgress = await getSlideMatchUserProgress(username);
  const isNewCompletion = !currentProgress.completedIds.includes(puzzleId);

  const completedIds = isNewCompletion
    ? [...currentProgress.completedIds, puzzleId]
    : currentProgress.completedIds;

  const previousStars = currentProgress.stars[puzzleId] || 0;
  const newStars = Math.max(previousStars, starsEarned);
  const stars = { ...currentProgress.stars, [puzzleId]: newStars };

  const prevBest = currentProgress.bestSlides[puzzleId];
  const newBest = prevBest !== undefined ? Math.min(prevBest, slideCount) : slideCount;
  const bestSlides = { ...currentProgress.bestSlides, [puzzleId]: newBest };

  if (username) {
    await Promise.all([
      redis.set(KEYS.PROGRESS(username), JSON.stringify(completedIds)),
      redis.set(KEYS.STARS(username), JSON.stringify(stars)),
      redis.set(KEYS.BEST_SLIDES(username), JSON.stringify(bestSlides)),
    ]);
  }

  const updatedProgress: SlideMatchProgress = {
    completedIds,
    stars,
    bestSlides,
  };

  return {
    starsEarned,
    isNewCompletion,
    progress: updatedProgress,
  };
};

/**
 * Get endless runner stats for a user
 */
export const getSlideMatchEndlessStats = async (username: string): Promise<SlideMatchEndlessStats> => {
  if (!username) {
    return { highScore: 0, highestStage: 0, totalRuns: 0, totalPuzzlesSolved: 0 };
  }
  try {
    const raw = await redis.get(KEYS.ENDLESS_STATS(username));
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error fetching endless stats:', err);
  }
  return { highScore: 0, highestStage: 0, totalRuns: 0, totalPuzzlesSolved: 0 };
};

/**
 * Record completed endless runner session and grant shards
 */
export const recordSlideMatchEndlessRun = async (
  username: string,
  score: number,
  stagesCleared: number
): Promise<SlideMatchEndlessRecordResult> => {
  const currentStats = await getSlideMatchEndlessStats(username);

  const isNewHighScore = score > currentStats.highScore;
  const isNewHighestStage = stagesCleared > currentStats.highestStage;

  const newStats: SlideMatchEndlessStats = {
    highScore: Math.max(currentStats.highScore, score),
    highestStage: Math.max(currentStats.highestStage, stagesCleared),
    totalRuns: currentStats.totalRuns + 1,
    totalPuzzlesSolved: currentStats.totalPuzzlesSolved + stagesCleared,
  };

  // Shard economy: 5 shards per stage cleared + 25 bonus if new high score + 10 for participating (>0 stages)
  let shardsEarned = stagesCleared * 5;
  if (stagesCleared > 0) shardsEarned += 10;
  if (isNewHighScore && score > 0) shardsEarned += 25;

  if (username) {
    await redis.set(KEYS.ENDLESS_STATS(username), JSON.stringify(newStats));
    if (shardsEarned > 0) {
      const currentCurrency = await getUserCurrency(username);
      await setUserCurrency(username, currentCurrency + shardsEarned);
    }
  }

  return {
    isNewHighScore,
    isNewHighestStage,
    shardsEarned,
    stats: newStats,
  };
};
