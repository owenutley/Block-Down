import {
  TOTAL_BOOK_NODES,
  MAX_BOOK_POINTS,
  NODE_INCREMENTAL_COSTS,
  NODE_CUMULATIVE_THRESHOLDS,
  getUnlockedNodeCount,
  calculateBookProgressState,
  DAILY_PUZZLE_BOOK_POINTS,
  SLIDE_MATCH_BOOK_POINTS,
  DAILY_STREAK_BOOK_POINTS,
  SURVEY_VOTE_BOOK_POINTS,
  PUZZLE_CREATED_BOOK_POINTS,
} from './lichtenbergProgress';

describe('Lichtenberg Book Progression Logic', () => {
  it('has exactly 34 nodes', () => {
    expect(TOTAL_BOOK_NODES).toBe(34);
    expect(NODE_INCREMENTAL_COSTS.length).toBe(35);
    expect(NODE_CUMULATIVE_THRESHOLDS.length).toBe(35);
  });

  it('matches user specifications for incremental node costs', () => {
    // Node 1 is free
    expect(NODE_INCREMENTAL_COSTS[1]).toBe(0);

    // Node 2 costs 20
    expect(NODE_INCREMENTAL_COSTS[2]).toBe(20);

    // Node 3 costs 20 + (3 - 2) = 21
    expect(NODE_INCREMENTAL_COSTS[3]).toBe(21);

    // Node 4 costs 20 + (4 - 2) = 22
    expect(NODE_INCREMENTAL_COSTS[4]).toBe(22);

    // Node 5 costs 20 + (5 - 2) = 23
    expect(NODE_INCREMENTAL_COSTS[5]).toBe(23);

    // Node 34 costs 20 + (34 - 2) = 52
    expect(NODE_INCREMENTAL_COSTS[34]).toBe(52);

    // General formula: for n from 2 to 34, incremental cost is 18 + n
    for (let n = 2; n <= TOTAL_BOOK_NODES; n++) {
      expect(NODE_INCREMENTAL_COSTS[n]).toBe(18 + n);
    }
  });

  it('matches user specifications for cumulative point thresholds', () => {
    // Node 1: 0 cumulative
    expect(NODE_CUMULATIVE_THRESHOLDS[1]).toBe(0);

    // Node 2: 20 cumulative
    expect(NODE_CUMULATIVE_THRESHOLDS[2]).toBe(20);

    // Node 3: 20 + 21 = 41 cumulative
    expect(NODE_CUMULATIVE_THRESHOLDS[3]).toBe(41);

    // Node 4: 41 + 22 = 63 cumulative
    expect(NODE_CUMULATIVE_THRESHOLDS[4]).toBe(63);

    // Node 5: 63 + 23 = 86 cumulative
    expect(NODE_CUMULATIVE_THRESHOLDS[5]).toBe(86);

    // Node 34: 1,188 cumulative
    expect(NODE_CUMULATIVE_THRESHOLDS[34]).toBe(1188);
    expect(MAX_BOOK_POINTS).toBe(1188);
  });

  it('correctly determines unlocked node count by cumulative points', () => {
    expect(getUnlockedNodeCount(0)).toBe(1);
    expect(getUnlockedNodeCount(10)).toBe(1);
    expect(getUnlockedNodeCount(19)).toBe(1);
    expect(getUnlockedNodeCount(20)).toBe(2);
    expect(getUnlockedNodeCount(30)).toBe(2);
    expect(getUnlockedNodeCount(40)).toBe(2);
    expect(getUnlockedNodeCount(41)).toBe(3);
    expect(getUnlockedNodeCount(62)).toBe(3);
    expect(getUnlockedNodeCount(63)).toBe(4);
    expect(getUnlockedNodeCount(1187)).toBe(33);
    expect(getUnlockedNodeCount(1188)).toBe(34);
    expect(getUnlockedNodeCount(9999)).toBe(34);
  });

  it('computes detailed BookProgressState for fresh starting player', () => {
    const state = calculateBookProgressState(0);
    expect(state.totalPoints).toBe(0);
    expect(state.unlockedNodeCount).toBe(1);
    expect(state.isComplete).toBe(false);
    expect(state.completionPercent).toBe(0);
    expect(state.nextNode).toBe(2);
    expect(state.pointsInCurrentNode).toBe(0);
    expect(state.pointsNeededForNextNode).toBe(20);
    expect(state.percentToNextNode).toBe(0);
  });

  it('computes progress state halfway to Node 3', () => {
    // Threshold 2 is 20. Threshold 3 is 41. Cost for node 3 is 21.
    // If user has 30 points: pointsInCurrentNode = 10 / 21 = 48%
    const state = calculateBookProgressState(30);
    expect(state.totalPoints).toBe(30);
    expect(state.unlockedNodeCount).toBe(2);
    expect(state.nextNode).toBe(3);
    expect(state.pointsInCurrentNode).toBe(10);
    expect(state.pointsNeededForNextNode).toBe(21);
    expect(state.percentToNextNode).toBe(48);
  });

  it('computes complete state at max points', () => {
    const state = calculateBookProgressState(1188);
    expect(state.totalPoints).toBe(1188);
    expect(state.unlockedNodeCount).toBe(34);
    expect(state.isComplete).toBe(true);
    expect(state.completionPercent).toBe(100);
    expect(state.nextNode).toBeNull();
    expect(state.pointsInCurrentNode).toBe(0);
    expect(state.percentToNextNode).toBe(100);
  });

  it('verifies activity point award values', () => {
    expect(DAILY_PUZZLE_BOOK_POINTS).toBe(20);
    expect(SLIDE_MATCH_BOOK_POINTS).toBe(10);
    expect(DAILY_STREAK_BOOK_POINTS).toBe(5);
    expect(SURVEY_VOTE_BOOK_POINTS).toBe(15);
    expect(PUZZLE_CREATED_BOOK_POINTS).toBe(30);
  });

  it('includes default activities in progress state', () => {
    const state = calculateBookProgressState(0);
    expect(state.activities).toBeDefined();
    expect(state.activities?.length).toBe(5);
    expect(state.activities?.map((a) => a.id)).toEqual([
      'daily',
      'slide_match',
      'streak',
      'survey',
      'create',
    ]);
    expect(state.activities?.every((a) => a.isCompleted === false)).toBe(true);
  });

  it('preserves custom activities passed to calculateBookProgressState', () => {
    const customActivities = [
      {
        id: 'daily' as const,
        label: 'Daily Puzzle',
        points: 20,
        isCompleted: true,
        description: 'Test',
        category: 'daily' as const,
      },
    ];
    const state = calculateBookProgressState(50, customActivities);
    expect(state.activities).toEqual(customActivities);
  });
});
