/**
 * Shared progression math and utilities for the Lichtenberg Book progress system.
 *
 * Curve specifications:
 * - 50 total nodes forming an open book of fractured light.
 * - Node 1 is free (0 cumulative points).
 * - For n from 2 to 50: incremental cost is 20 + (n - 2) = 18 + n.
 * - Total cumulative points at Node 50 is 2,156 points.
 */

export const TOTAL_BOOK_NODES = 34;

export const DAILY_PUZZLE_BOOK_POINTS = 20;
export const SLIDE_MATCH_BOOK_POINTS = 10;
export const DAILY_STREAK_BOOK_POINTS = 5;
export const SURVEY_VOTE_BOOK_POINTS = 15;
export const PUZZLE_CREATED_BOOK_POINTS = 30;

/**
 * Pre-computed incremental point costs for each node from 1 to 34.
 * Index 0 is unused (1-indexed for clarity: costs[1] = 0, costs[2] = 20, costs[3] = 21, ..., costs[34] = 52).
 */
export const NODE_INCREMENTAL_COSTS: readonly number[] = (() => {
  const costs: number[] = [0]; // index 0 unused
  costs.push(0); // Node 1 is free
  for (let n = 2; n <= TOTAL_BOOK_NODES; n++) {
    costs.push(18 + n);
  }
  return Object.freeze(costs);
})();

/**
 * Pre-computed cumulative point thresholds required to unlock each node from 1 to 34.
 * Index 0 is unused (1-indexed: thresholds[1] = 0, thresholds[2] = 20, thresholds[3] = 41, ..., thresholds[34] = 1188).
 */
export const NODE_CUMULATIVE_THRESHOLDS: readonly number[] = (() => {
  const thresholds: number[] = [0]; // index 0 unused
  let sum = 0;
  for (let n = 1; n <= TOTAL_BOOK_NODES; n++) {
    sum += NODE_INCREMENTAL_COSTS[n] ?? 0;
    thresholds.push(sum);
  }
  return Object.freeze(thresholds);
})();

export const MAX_BOOK_POINTS = NODE_CUMULATIVE_THRESHOLDS[TOTAL_BOOK_NODES] ?? 1188;

export type BookPointActivityId =
  | 'daily'
  | 'streak'
  | 'slide_match'
  | 'survey'
  | 'create';

export type BookPointActivity = {
  id: BookPointActivityId;
  label: string;
  points: number;
  isCompleted: boolean;
  description: string;
  category: 'daily' | 'survey' | 'community';
};

export const DEFAULT_BOOK_ACTIVITIES: readonly BookPointActivity[] = Object.freeze([
  {
    id: 'daily',
    label: 'Daily Puzzle',
    points: DAILY_PUZZLE_BOOK_POINTS,
    isCompleted: false,
    description: "Solve today's daily puzzle",
    category: 'daily',
  },
  {
    id: 'slide_match',
    label: 'Slide Match',
    points: SLIDE_MATCH_BOOK_POINTS,
    isCompleted: false,
    description: 'Finish an endless slide run',
    category: 'daily',
  },
  {
    id: 'streak',
    label: 'Daily Streak',
    points: DAILY_STREAK_BOOK_POINTS,
    isCompleted: false,
    description: 'Keep your consecutive solve streak alive',
    category: 'daily',
  },
  {
    id: 'survey',
    label: 'Survey Vote',
    points: SURVEY_VOTE_BOOK_POINTS,
    isCompleted: false,
    description: 'Vote on the community poll',
    category: 'survey',
  },
  {
    id: 'create',
    label: 'Create Puzzle',
    points: PUZZLE_CREATED_BOOK_POINTS,
    isCompleted: false,
    description: 'Publish a level in the puzzle maker',
    category: 'community',
  },
]);

export type BookProgressState = {
  totalPoints: number;
  unlockedNodeCount: number; // 1 to 34
  isComplete: boolean;
  completionPercent: number; // 0 to 100
  // Next node details (null if isComplete)
  nextNode: number | null;
  pointsInCurrentNode: number;
  pointsNeededForNextNode: number;
  percentToNextNode: number;
  activities?: BookPointActivity[];
};

/**
 * Computes the highest unlocked node count (1 to 34) based on cumulative points.
 */
export const getUnlockedNodeCount = (points: number): number => {
  const safePoints = Math.max(0, points);
  let highest = 1;
  for (let n = 1; n <= TOTAL_BOOK_NODES; n++) {
    const threshold = NODE_CUMULATIVE_THRESHOLDS[n] ?? 0;
    if (safePoints >= threshold) {
      highest = n;
    } else {
      break;
    }
  }
  return highest;
};

/**
 * Evaluates the full progression state from total points.
 */
export const calculateBookProgressState = (
  points: number,
  activities?: BookPointActivity[]
): BookProgressState => {
  const safePoints = Math.max(0, points);
  const unlockedNodeCount = getUnlockedNodeCount(safePoints);
  const isComplete = unlockedNodeCount >= TOTAL_BOOK_NODES;
  const completionPercent = Math.min(100, Math.round((safePoints / MAX_BOOK_POINTS) * 100));
  const currentActivities = activities || DEFAULT_BOOK_ACTIVITIES.map((a) => ({ ...a }));

  if (isComplete) {
    return {
      totalPoints: safePoints,
      unlockedNodeCount: TOTAL_BOOK_NODES,
      isComplete: true,
      completionPercent: 100,
      nextNode: null,
      pointsInCurrentNode: 0,
      pointsNeededForNextNode: 0,
      percentToNextNode: 100,
      activities: currentActivities,
    };
  }

  const nextNode = unlockedNodeCount + 1;
  const currentThreshold = NODE_CUMULATIVE_THRESHOLDS[unlockedNodeCount] ?? 0;
  const neededCost = NODE_INCREMENTAL_COSTS[nextNode] ?? (18 + nextNode);
  const pointsInCurrentNode = Math.max(0, safePoints - currentThreshold);
  const percentToNextNode = Math.min(100, Math.max(0, Math.round((pointsInCurrentNode / neededCost) * 100)));

  return {
    totalPoints: safePoints,
    unlockedNodeCount,
    isComplete: false,
    completionPercent,
    nextNode,
    pointsInCurrentNode,
    pointsNeededForNextNode: neededCost,
    percentToNextNode,
    activities: currentActivities,
  };
};
