import { redis } from '@devvit/web/server';
import {
  WeeklyChallengeData,
  WeeklyChallengePhase,
  WeeklyLeaderboardEntry,
  WeeklyWinnerAward,
  PlayerWeeklyAwardsSummary,
  Puzzle,
} from '../../shared/types';
import { getPuzzle } from './puzzle';
import { getUserCurrency, addUserCurrency } from './progress';

/**
 * Calculates current weekly contest time window based on Saturday 7:00 PM MST (Sunday 02:00:00 UTC).
 * 
 * - Week start: Sunday 02:00:00 UTC
 * - Creation Deadline (3 days / 72 hours): Wednesday 02:00:00 UTC
 * - Week end / finalization: Sunday 02:00:00 UTC
 */
export function getWeeklyCycleTiming(currentDate = new Date()) {
  const nowMs = currentDate.getTime();
  const d = new Date(currentDate);

  // Find most recent Sunday 02:00:00 UTC
  // d.getUTCDay(): 0 is Sunday, 1 is Monday ... 6 is Saturday
  const day = d.getUTCDay();
  const hours = d.getUTCHours();
  
  let daysSinceSunday = day;
  if (day === 0 && hours < 2) {
    // Before 02:00 UTC Sunday -> still belongs to previous week cycle
    daysSinceSunday = 7;
  }

  const startUtc = new Date(Date.UTC(
    d.getUTCFullYear(),
    d.getUTCMonth(),
    d.getUTCDate() - daysSinceSunday,
    2, 0, 0, 0
  ));

  const startTime = startUtc.getTime();
  const creationDeadline = startTime + (3 * 24 * 60 * 60 * 1000); // +72h (Wednesday 02:00 UTC)
  const endTime = startTime + (7 * 24 * 60 * 60 * 1000); // +168h (Next Sunday 02:00 UTC)

  // ISO-like week identifier based on start date (e.g., "weekly-2026-10-04")
  const yyyy = startUtc.getUTCFullYear();
  const mm = String(startUtc.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(startUtc.getUTCDate()).padStart(2, '0');
  const weekId = `week-${yyyy}-${mm}-${dd}`;

  const isCreationOpen = nowMs < creationDeadline;
  const phase: WeeklyChallengePhase = isCreationOpen
    ? 'creation'
    : nowMs < endTime
    ? 'solving'
    : 'finalized';

  return {
    weekId,
    phase,
    startTime,
    creationDeadline,
    endTime,
    isCreationOpen,
    timeRemainingMs: Math.max(0, endTime - nowMs),
  };
}

export type PuzzleWeeklyStats = {
  attempts: number;
  solves: number;
  totalPushes: number;
  totalTimeMs: number;
  uniquePlayers: string[];
};

/**
 * Calculates dynamic difficulty score (0 - 100) using Bayesian formula
 */
export function calculateDynamicDifficulty(
  puzzle: { par?: number; blocks?: unknown[]; portals?: unknown[] },
  stats?: PuzzleWeeklyStats | null
): { difficultyScore: number; solveRate: number } {
  const par = Math.max(1, puzzle.par || 4);
  const blocksCount = puzzle.blocks?.length || 2;
  const portalsCount = puzzle.portals?.length || 0;

  // 1. Base Complexity Factor (0 - 100)
  const baseComplexity = Math.min(100, (par * 8) + (blocksCount * 10) + (portalsCount * 12));

  if (!stats || stats.attempts === 0) {
    // Unattempted: smoothed neutral failure rate (50%) + base complexity
    const failureRate = 50;
    const excessPushFactor = 40;
    const timeFactor = 30;
    const score = Number(((baseComplexity * 0.25) + (failureRate * 0.45) + (excessPushFactor * 0.20) + (timeFactor * 0.10)).toFixed(1));
    return { difficultyScore: score, solveRate: 0 };
  }

  const attempts = stats.attempts;
  const solves = stats.solves;

  // 2. Failure Rate Factor with Laplace smoothing (0 - 100)
  const failureRate = 100 * (1 - ((solves + 1) / (attempts + 2)));

  // 3. Excess Push Factor (0 - 100)
  let excessPushFactor = 40;
  if (solves > 0) {
    const avgSolvesPushes = stats.totalPushes / solves;
    const pushDeltaRatio = (avgSolvesPushes - par) / par;
    excessPushFactor = Math.min(100, Math.max(0, 50 + (pushDeltaRatio * 50)));
  }

  // 4. Time Factor (0 - 100)
  const avgTimeSeconds = solves > 0 ? (stats.totalTimeMs / solves) / 1000 : 60;
  const timeFactor = Math.min(100, (avgTimeSeconds / 120) * 100);

  // Weighted sum
  const difficultyScore = Number(
    ((baseComplexity * 0.25) + (failureRate * 0.45) + (excessPushFactor * 0.20) + (timeFactor * 0.10)).toFixed(1)
  );

  const solveRate = Math.round((solves / attempts) * 100);

  return { difficultyScore, solveRate };
}

const normalizeUsername = (u: string) => u.replace(/^u\//i, '').trim().toLowerCase();

/**
 * Registers a user's first published puzzle in the 3-day creation window
 */
export async function registerWeeklyChallengeEntry(
  username: string,
  puzzleId: string,
  _puzzle?: Puzzle,
  now = new Date()
): Promise<boolean> {
  const timing = getWeeklyCycleTiming(now);

  // If 3-day creation window is closed, do not enter active week contest
  if (!timing.isCreationOpen) {
    return false;
  }

  const userKey = normalizeUsername(username);
  const userEntryKey = `weekly:${timing.weekId}:user:${userKey}`;
  const existingEntry = await redis.get(userEntryKey);

  if (existingEntry) {
    // User already has an entry for this week's contest
    return false;
  }

  // Record user entry mapping
  await redis.set(userEntryKey, puzzleId);

  // Add to active week puzzles list
  const puzzlesKey = `weekly:${timing.weekId}:puzzles`;
  const rawPuzzles = await redis.get(puzzlesKey);
  const puzzlesList: string[] = rawPuzzles ? JSON.parse(rawPuzzles) : [];

  if (!puzzlesList.includes(puzzleId)) {
    puzzlesList.push(puzzleId);
    await redis.set(puzzlesKey, JSON.stringify(puzzlesList));
  }

  // Initialize weekly stats for this puzzle
  const statsKey = `weekly:${timing.weekId}:stats:${puzzleId}`;
  const initialStats: PuzzleWeeklyStats = {
    attempts: 0,
    solves: 0,
    totalPushes: 0,
    totalTimeMs: 0,
    uniquePlayers: [],
  };
  await redis.set(statsKey, JSON.stringify(initialStats));

  return true;
}

/**
 * Records attempt/solve stats when someone plays a qualifying contest puzzle
 */
export async function recordWeeklyPuzzlePlay(
  puzzleId: string,
  solved: boolean,
  pushes: number,
  timeMs: number,
  playerUsername?: string,
  now = new Date()
): Promise<void> {
  const timing = getWeeklyCycleTiming(now);
  const statsKey = `weekly:${timing.weekId}:stats:${puzzleId}`;
  const rawStats = await redis.get(statsKey);

  if (!rawStats) {
    return; // Not an active weekly challenge puzzle
  }

  const stats: PuzzleWeeklyStats = JSON.parse(rawStats);
  stats.attempts += 1;

  if (solved) {
    stats.solves += 1;
    stats.totalPushes += pushes;
    stats.totalTimeMs += timeMs;
  }

  if (playerUsername) {
    const uLower = normalizeUsername(playerUsername);
    if (!stats.uniquePlayers.includes(uLower)) {
      stats.uniquePlayers.push(uLower);
    }
  }

  await redis.set(statsKey, JSON.stringify(stats));
}

/**
 * Retrieves compiled weekly challenge leaderboard and contest status
 */
export async function getWeeklyChallengeData(
  targetUsername?: string,
  now = new Date()
): Promise<WeeklyChallengeData> {
  const timing = getWeeklyCycleTiming(now);
  const puzzlesKey = `weekly:${timing.weekId}:puzzles`;
  const rawPuzzles = await redis.get(puzzlesKey);
  const puzzleIds: string[] = rawPuzzles ? JSON.parse(rawPuzzles) : [];

  const entries: WeeklyLeaderboardEntry[] = [];
  const uLower = targetUsername ? normalizeUsername(targetUsername) : null;
  let userEntry: WeeklyLeaderboardEntry | null = null;

  for (const pid of puzzleIds) {
    const puzzle = await getPuzzle(pid);
    if (!puzzle) continue;

    const statsKey = `weekly:${timing.weekId}:stats:${pid}`;
    const rawStats = await redis.get(statsKey);
    const stats: PuzzleWeeklyStats | null = rawStats ? JSON.parse(rawStats) : null;

    const { difficultyScore, solveRate } = calculateDynamicDifficulty(puzzle, stats);

    const entry: WeeklyLeaderboardEntry = {
      rank: 0, // assigned after sorting
      puzzleId: pid,
      puzzleName: puzzle.name,
      author: puzzle.author || 'Community Architect',
      difficultyScore,
      attempts: stats?.attempts || 0,
      solves: stats?.solves || 0,
      solveRate,
      par: puzzle.par || 4,
      blocksCount: puzzle.blocks?.length || 0,
      portalsCount: puzzle.portals?.length || 0,
      potentialReward: 0,
    };

    entries.push(entry);
  }

  // Sort descending: highest difficulty score first; tiebreak on lowest solves / highest attempts
  entries.sort((a, b) => {
    if (b.difficultyScore !== a.difficultyScore) {
      return b.difficultyScore - a.difficultyScore;
    }
    if (a.solves !== b.solves) {
      return a.solves - b.solves;
    }
    return b.attempts - a.attempts;
  });

  // Assign ranks & potential rewards
  entries.forEach((e, idx) => {
    e.rank = idx + 1;
    if (e.rank === 1 && e.attempts >= 1) e.potentialReward = 500;
    else if (e.rank === 2 && e.attempts >= 1) e.potentialReward = 250;
    else if (e.rank === 3 && e.attempts >= 1) e.potentialReward = 100;
    else e.potentialReward = 0;

    if (uLower && normalizeUsername(e.author) === uLower) {
      userEntry = e;
    }
  });

  return {
    weekId: timing.weekId,
    phase: timing.phase,
    startTime: timing.startTime,
    creationDeadline: timing.creationDeadline,
    endTime: timing.endTime,
    isCreationOpen: timing.isCreationOpen,
    timeRemainingMs: timing.timeRemainingMs,
    leaderboard: entries,
    totalEntries: entries.length,
    userEntry,
  };
}

/**
 * Finalizes current week's challenge, awards top 3 podiums, stores lifetime awards, and archives
 */
export async function finalizeWeeklyChallenge(now = new Date()): Promise<{
  weekId: string;
  winners: WeeklyWinnerAward[];
}> {
  const timing = getWeeklyCycleTiming(now);
  const data = await getWeeklyChallengeData(undefined, now);

  // Require at least 1 attempt to qualify for podium standing
  const qualified = data.leaderboard.filter((e) => e.attempts >= 1);
  const winners: WeeklyWinnerAward[] = [];
  const dateAwarded = new Date(now).toISOString().slice(0, 10);

  const rewardTiers: { rank: 1 | 2 | 3; shards: number }[] = [
    { rank: 1, shards: 500 },
    { rank: 2, shards: 250 },
    { rank: 3, shards: 100 },
  ];

  for (let i = 0; i < Math.min(qualified.length, 3); i++) {
    const entry = qualified[i];
    const tier = rewardTiers[i];
    if (!entry || !tier) continue;

    const award: WeeklyWinnerAward = {
      weekId: timing.weekId,
      rank: tier.rank,
      puzzleId: entry.puzzleId,
      puzzleName: entry.puzzleName,
      shardReward: tier.shards,
      difficultyScore: entry.difficultyScore,
      dateAwarded,
      claimed: false,
    };

    winners.push(award);

    const authorKey = normalizeUsername(entry.author);

    // 1. Append to user persistent lifetime awards
    const userAwardsKey = `user:awards:${authorKey}`;
    const rawAwards = await redis.get(userAwardsKey);
    const awardsList: WeeklyWinnerAward[] = rawAwards ? JSON.parse(rawAwards) : [];
    awardsList.unshift(award);
    await redis.set(userAwardsKey, JSON.stringify(awardsList));

    // 2. Set pending claim notification for app launch
    const pendingKey = `weekly:rewards:pending:${authorKey}`;
    const rawPending = await redis.get(pendingKey);
    const pendingList: WeeklyWinnerAward[] = rawPending ? JSON.parse(rawPending) : [];
    pendingList.push(award);
    await redis.set(pendingKey, JSON.stringify(pendingList));
  }

  // Archive week snapshot
  const archiveKey = `weekly:${timing.weekId}:archive`;
  await redis.set(
    archiveKey,
    JSON.stringify({
      weekId: timing.weekId,
      winners,
      leaderboard: data.leaderboard,
      finalizedAt: Date.now(),
    })
  );

  return { weekId: timing.weekId, winners };
}

/**
 * Retrieves lifetime awards won by a player
 */
export async function getUserWeeklyAwards(username: string): Promise<PlayerWeeklyAwardsSummary> {
  const userAwardsKey = `user:awards:${normalizeUsername(username)}`;
  const rawAwards = await redis.get(userAwardsKey);
  const history: WeeklyWinnerAward[] = rawAwards ? JSON.parse(rawAwards) : [];

  let firstPlace = 0;
  let secondPlace = 0;
  let thirdPlace = 0;
  let totalShardsEarned = 0;

  for (const a of history) {
    if (a.rank === 1) firstPlace++;
    else if (a.rank === 2) secondPlace++;
    else if (a.rank === 3) thirdPlace++;
    totalShardsEarned += a.shardReward;
  }

  return {
    totalAwards: history.length,
    trophies: {
      firstPlace,
      secondPlace,
      thirdPlace,
    },
    totalShardsEarned,
    history,
  };
}

/**
 * Checks if user has an unclaimed weekly prize
 */
export async function checkPendingWeeklyReward(username: string): Promise<WeeklyWinnerAward | null> {
  const pendingKey = `weekly:rewards:pending:${normalizeUsername(username)}`;
  const rawPending = await redis.get(pendingKey);
  if (!rawPending) return null;

  const pendingList: WeeklyWinnerAward[] = JSON.parse(rawPending);
  return pendingList.length > 0 ? (pendingList[0] || null) : null;
}

/**
 * Claims pending weekly contest shards and credits user balance
 */
export async function claimPendingWeeklyReward(username: string): Promise<{
  success: boolean;
  claimedAward: WeeklyWinnerAward | null;
  newBalance: number;
}> {
  const uLower = normalizeUsername(username);
  const pendingKey = `weekly:rewards:pending:${uLower}`;
  const rawPending = await redis.get(pendingKey);

  if (!rawPending) {
    const current = await getUserCurrency(uLower);
    return { success: false, claimedAward: null, newBalance: current };
  }

  const pendingList: WeeklyWinnerAward[] = JSON.parse(rawPending);
  if (pendingList.length === 0) {
    const current = await getUserCurrency(uLower);
    return { success: false, claimedAward: null, newBalance: current };
  }

  const awardToClaim = pendingList.shift()!;
  await redis.set(pendingKey, JSON.stringify(pendingList));

  // Add shards to player balance
  const newBalance = await addUserCurrency(uLower, awardToClaim.shardReward);

  return {
    success: true,
    claimedAward: awardToClaim,
    newBalance,
  };
}
