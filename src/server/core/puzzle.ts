import { redis } from '@devvit/web/server';
import { Puzzle, DailyPuzzle, PuzzleDifficulty, DailyTier, GeneratedPuzzle } from '../../shared/types';
import { calculatePuzzlePar } from '../../shared/puzzle';
import { generateBacktrackingLevel } from '../../shared/backtrackingGenerator';

/**
 * Redis key patterns for puzzle storage
 */
export const KEYS = {
  // Puzzle storage by ID
  PUZZLE: (id: string) => `puzzle:${id}`,
  // All puzzle IDs by difficulty (stored as JSON array)
  PUZZLES_BY_DIFFICULTY: (difficulty: PuzzleDifficulty) => `puzzles:${difficulty}`,
  // Daily puzzle assignment
  DAILY_PUZZLE: (date: string) => `daily:${date}`,
  // Daily puzzle tier assignment
  DAILY_TIER_PUZZLE: (date: string, tier: DailyTier) => `daily_tier:${date}:${tier}`,
  // Current daily puzzle (today)
  CURRENT_DAILY: 'current:daily',
  // Upcoming puzzles queue (stored as JSON array)
  UPCOMING_PUZZLES: 'upcoming:puzzles',
  // Past puzzles archive (stored as JSON array)
  PAST_PUZZLES: 'past:puzzles',
  // Puzzle statistics
  PUZZLE_STATS: (id: string) => `stats:${id}`,
  // Active puzzle by type (splash, tutorial)
  ACTIVE_PUZZLE: (type: string) => `active:${type}`,
  // Community player-made puzzles index
  COMMUNITY_PUZZLES: 'puzzles:community',
};

/**
 * Get today's date in YYYY-MM-DD format
 */
const getTodayDate = (): string => {
  const date = new Date();
  return date.toISOString().split('T')[0] || '';
};

/**
 * Helper: Get array from Redis (stored as JSON)
 */
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

/**
 * Helper: Save array to Redis (as JSON)
 */
const setArray = async (key: string, items: string[]): Promise<void> => {
  await redis.set(key, JSON.stringify(items));
};

/**
 * Store a puzzle in the database
 */
export const createPuzzle = async (puzzle: Puzzle): Promise<void> => {
  const puzzleWithPar: Puzzle = {
    ...puzzle,
    par: calculatePuzzlePar(puzzle),
  };
  const key = KEYS.PUZZLE(puzzleWithPar.id);
  // Easy companion puzzles are indexed separately to prevent mixing into the standard daily rotation pool
  const difficultyKey = puzzleWithPar.id.includes('easy') && puzzleWithPar.difficulty === 'daily'
    ? 'puzzles:daily_easy'
    : KEYS.PUZZLES_BY_DIFFICULTY(puzzleWithPar.difficulty);

  // Store puzzle data
  await redis.set(key, JSON.stringify(puzzleWithPar));

  // Add to difficulty index
  const difficultyPuzzles = await getArray(difficultyKey);
  if (!difficultyPuzzles.includes(puzzleWithPar.id)) {
    difficultyPuzzles.push(puzzleWithPar.id);
    await setArray(difficultyKey, difficultyPuzzles);
  }
};

/**
 * Get a puzzle by ID
 */
export const getPuzzle = async (id: string): Promise<Puzzle | null> => {
  try {
    let data = await redis.get(KEYS.PUZZLE(id));
    if (!data && id === 'tutorial-1') {
      await initializeSamplePuzzles();
      data = await redis.get(KEYS.PUZZLE(id));
    }
    if (!data || data === 'undefined' || data === 'null') return null;
    const parsed = JSON.parse(data) as Puzzle;

    // Self-heal: ensure par is always present and persisted in DB
    if ((parsed.par === undefined || parsed.par <= 0) && parsed.playerMoves && parsed.playerMoves.length > 0) {
      parsed.par = calculatePuzzlePar(parsed);
      await redis.set(KEYS.PUZZLE(id), JSON.stringify(parsed));
    }

    return parsed;
  } catch (err) {
    console.error(`Error loading puzzle ${id}:`, err);
    return null;
  }
};

/**
 * Get all puzzles by difficulty
 */
export const getPuzzlesByDifficulty = async (
  difficulty: PuzzleDifficulty,
  limit?: number
): Promise<Puzzle[]> => {
  const ids = await getArray(KEYS.PUZZLES_BY_DIFFICULTY(difficulty));
  // Filter out any companion easy puzzle IDs (e.g. daily-easy-*) from the standard daily pool
  const filteredIds = difficulty === 'daily'
    ? ids.filter((id: string) => !id.includes('easy'))
    : ids;
  const slicedIds = limit !== undefined ? filteredIds.slice(0, limit) : filteredIds;
  const puzzles = await Promise.all(
    slicedIds.map((id: string) => getPuzzle(id))
  );
  return puzzles.filter((p): p is Puzzle => p !== null && (difficulty !== 'daily' || !p.id.includes('easy')));
};

/**
 * Get all puzzle IDs by difficulty
 */
export const getPuzzleIdsByDifficulty = async (
  difficulty: PuzzleDifficulty
): Promise<string[]> => {
  return await getArray(KEYS.PUZZLES_BY_DIFFICULTY(difficulty));
};

/**
 * Add a custom puzzle ID to the community puzzles index
 */
export const addCommunityPuzzle = async (puzzleId: string): Promise<void> => {
  const communityIds = await getArray(KEYS.COMMUNITY_PUZZLES);
  if (!communityIds.includes(puzzleId)) {
    communityIds.push(puzzleId);
    await setArray(KEYS.COMMUNITY_PUZZLES, communityIds);
  }
};

/**
 * Get all community player-made puzzles sorted with newest up top and oldest down below
 */
export const getCommunityPuzzles = async (): Promise<Puzzle[]> => {
  const ids = await getArray(KEYS.COMMUNITY_PUZZLES);
  const puzzles = await Promise.all(ids.map((id: string) => getPuzzle(id)));
  const validPuzzles = puzzles.filter((p): p is Puzzle => p !== null);

  // Also include any 'custom' difficulty puzzles if missing from index
  const customDiffPuzzles = await getPuzzlesByDifficulty('custom');
  for (const p of customDiffPuzzles) {
    if (!validPuzzles.some((existing) => existing.id === p.id)) {
      validPuzzles.push(p);
      void addCommunityPuzzle(p.id);
    }
  }

  // Sort descending by createdAt (newest up top, oldest down below)
  return validPuzzles.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
};

export type CommunitySpotlightData = {
  title: string;
  puzzle: Puzzle;
  creator: string;
  plays: number;
  solveCount: number;
  featuredReason: string;
};

/**
 * Get featured Community Puzzle of the Week for Splash showcase
 */
export const getCommunitySpotlight = async (): Promise<CommunitySpotlightData | null> => {
  try {
    const explicitId = await redis.get('spotlight:community_weekly');
    if (explicitId) {
      const explicitPuzzle = await getPuzzle(explicitId);
      if (explicitPuzzle) {
        const stats = await getPuzzleStats(explicitId);
        return {
          title: explicitPuzzle.name || 'Spotlight Puzzle',
          puzzle: explicitPuzzle,
          creator: explicitPuzzle.author || 'Community Creator',
          plays: stats.completions || 0,
          solveCount: stats.completions || 0,
          featuredReason: 'Weekly Staff Pick',
        };
      }
    }

    const communityPuzzles = await getCommunityPuzzles();
    if (communityPuzzles.length > 0) {
      const topPuzzle = communityPuzzles[0];
      if (topPuzzle) {
        const stats = await getPuzzleStats(topPuzzle.id);
        return {
          title: topPuzzle.name || 'Spotlight Puzzle',
          puzzle: topPuzzle,
          creator: topPuzzle.author || 'Community Creator',
          plays: stats.completions || 0,
          solveCount: stats.completions || 0,
          featuredReason: 'Community Favorite',
        };
      }
    }

    return null;
  } catch (err) {
    console.error('Failed to get community spotlight:', err);
    return null;
  }
};

/**
 * Get all puzzles across all difficulties
 */
export const getAllPuzzles = async (): Promise<Puzzle[]> => {
  const difficulties: PuzzleDifficulty[] = ['tutorial', 'daily', 'easy', 'medium', 'hard', 'splash', 'custom'];
  const allPuzzles = await Promise.all(
    difficulties.map((d) => getPuzzlesByDifficulty(d))
  );
  return allPuzzles.flat();
};

/**
 * Helper: Extract the proper date from a puzzle ID if it starts with 'daily-YYYY-MM-DD' or 'daily-easy-YYYY-MM-DD'
 */
export const getProperDateFromPuzzleId = (puzzleId: string): string | null => {
  if (puzzleId.startsWith('daily-easy-')) {
    const dateStr = puzzleId.replace('daily-easy-', '');
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return dateStr;
    }
  }
  if (puzzleId.startsWith('daily-')) {
    const dateStr = puzzleId.replace('daily-', '');
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return dateStr;
    }
  }
  return null;
};

/**
 * Get the next available date starting from today that doesn't have a daily puzzle
 */
export const getNextAvailableDailyDate = async (): Promise<string> => {
  const date = new Date();
  while (true) {
    const dateStr = date.toISOString().split('T')[0] || '';
    const dailyAssigned = await redis.get(KEYS.DAILY_PUZZLE(dateStr));
    const puzzleExists = await redis.get(KEYS.PUZZLE(`daily-${dateStr}`));
    if (!dailyAssigned && !puzzleExists) {
      return dateStr;
    }
    date.setDate(date.getDate() + 1);
  }
};

/**
 * Determine the Warm-Up puzzle tier (0, 1, or 2) and generator stage based on calendar day progression:
 * - Mon & Tue: Tier 0 (Stage 1: 2 blocks, min 3 pushes)
 * - Wed & Thu: Tier 1 (Stage 6: 3 blocks, min 5 pushes)
 * - Fri, Sat & Sun: Tier 2 (Stage 11: 3 blocks, min 7 pushes)
 */
export const getEasyPuzzleTierForDate = (dateStr: string): { tier: number; stage: number } => {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dateObj = new Date(Date.UTC(y || 2026, (m || 1) - 1, d || 1));
  const dayOfWeek = dateObj.getUTCDay(); // 0 = Sun, 1 = Mon, 2 = Tue, 3 = Wed, 4 = Thu, 5 = Fri, 6 = Sat

  let tier = 0;
  if (dayOfWeek === 1 || dayOfWeek === 2) {
    // Monday, Tuesday -> Tier 0 (2 blocks, min 3 pushes)
    tier = 0;
  } else if (dayOfWeek === 3 || dayOfWeek === 4) {
    // Wednesday, Thursday -> Tier 1 (3 blocks, min 5 pushes)
    tier = 1;
  } else {
    // Friday, Saturday, Sunday -> Tier 2 (3 blocks, min 7 pushes)
    tier = 2;
  }

  const stage = 1 + tier * 5;
  return { tier, stage };
};

/**
 * Ensure a companion Easy Warm-Up puzzle exists for the specified date.
 * If not already present in Redis, automatically generates a level varying between
 * Tier 0, Tier 1, and Tier 2 based on calendar day progression.
 */
export const ensureDailyEasyPuzzle = async (
  date: string,
  dailyNumber?: number,
  forcedTier?: number
): Promise<Puzzle> => {
  const easyId = `daily-easy-${date}`;
  const existingTierId = await redis.get(KEYS.DAILY_TIER_PUZZLE(date, 'easy'));
  const lookupId = existingTierId || easyId;
  const existingPuzzle = await getPuzzle(lookupId);
  if (existingPuzzle) {
    if (!existingTierId) {
      await redis.set(KEYS.DAILY_TIER_PUZZLE(date, 'easy'), lookupId);
    }
    return existingPuzzle;
  }

  const { tier, stage } = forcedTier !== undefined
    ? {
        tier: Math.max(0, Math.min(2, forcedTier)),
        stage: 1 + Math.max(0, Math.min(2, forcedTier)) * 5,
      }
    : getEasyPuzzleTierForDate(date);

  // Generate a fresh easy companion puzzle (Tier 0, 1, or 2) with fail-safe fallback chain
  let generated: GeneratedPuzzle;
  try {
    generated = generateBacktrackingLevel(stage, 9);
  } catch (err) {
    console.warn(`Initial generation failed for Warm-Up stage ${stage}, stepping down to stage 1:`, err);
    try {
      generated = generateBacktrackingLevel(1, 9);
    } catch (err2) {
      console.error('All procedural generation attempts failed, using static safe fallback:', err2);
      generated = {
        width: 9,
        height: 9,
        player: { x: 4, y: 4 },
        walls: [
          { x: 2, y: 1 },
          { x: 6, y: 7 },
        ],
        blocks: [
          { id: 'b_red_0', color: 'red', x: 2, y: 4 },
          { id: 'b_blue_1', color: 'blue', x: 6, y: 4 },
        ],
        targets: [
          { id: 't_red_0', color: 'red', x: 2, y: 2 },
          { id: 't_blue_1', color: 'blue', x: 6, y: 6 },
        ],
        portals: [],
        solutionMoves: ['Left', 'Up', 'Right', 'Down'],
        par: 2,
      };
    }
  }
  const name = dailyNumber ? `Daily #${dailyNumber} Warm-Up` : `Daily Warm-Up (${date})`;
  const easyPuzzle: Puzzle = {
    id: easyId,
    name,
    difficulty: 'daily',
    width: generated.width,
    height: generated.height,
    player: generated.player,
    walls: generated.walls,
    blocks: generated.blocks,
    targets: generated.targets,
    portals: generated.portals,
    createdAt: Date.now(),
    par: generated.par,
    playerMoves: generated.solutionMoves,
    splashMovesCount: Math.min(3, generated.solutionMoves.length),
    author: `Block Down Warm-Up (Tier ${tier})`,
  };

  await createPuzzle(easyPuzzle);
  await redis.set(KEYS.DAILY_TIER_PUZZLE(date, 'easy'), easyId);
  return easyPuzzle;
};

/**
 * Determine the Standard Challenge puzzle tier (4, 5, or 6) and generator stage based on calendar day progression:
 * - Mon & Tue: Tier 4 (Stage 21: 5 blocks, min 11 pushes)
 * - Wed & Thu: Tier 5 (Stage 26: 5 blocks, min 13 pushes)
 * - Fri, Sat & Sun: Tier 6 (Stage 31: 6 blocks, min 16 pushes)
 */
export const getStandardPuzzleTierForDate = (dateStr: string): { tier: number; stage: number } => {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dateObj = new Date(Date.UTC(y || 2026, (m || 1) - 1, d || 1));
  const dayOfWeek = dateObj.getUTCDay(); // 0 = Sun, 1 = Mon, 2 = Tue, 3 = Wed, 4 = Thu, 5 = Fri, 6 = Sat

  let tier = 4;
  if (dayOfWeek === 1 || dayOfWeek === 2) {
    // Monday, Tuesday -> Tier 4 (5 blocks, min 11 pushes)
    tier = 4;
  } else if (dayOfWeek === 3 || dayOfWeek === 4) {
    // Wednesday, Thursday -> Tier 5 (5 blocks, min 13 pushes)
    tier = 5;
  } else {
    // Friday, Saturday, Sunday -> Tier 6 (6 blocks, min 16 pushes)
    tier = 6;
  }

  const stage = 1 + tier * 5;
  return { tier, stage };
};

/**
 * Ensure a Standard Daily Challenge puzzle exists for the specified date.
 * If not already present in Redis, automatically generates a level varying between
 * Tier 4, Tier 5, and Tier 6 based on calendar day progression:
 * - Mon & Tue: Tier 4 (Stage 21)
 * - Wed & Thu: Tier 5 (Stage 26)
 * - Fri, Sat & Sun: Tier 6 (Stage 31)
 */
export const ensureDailyStandardPuzzle = async (
  date: string,
  dailyNumber?: number,
  forcedTier?: number
): Promise<Puzzle> => {
  const standardId = `daily-${date}`;
  const existingTierId = await redis.get(KEYS.DAILY_TIER_PUZZLE(date, 'standard'));
  const lookupId = existingTierId && !existingTierId.includes('easy') ? existingTierId : standardId;
  const existingPuzzle = await getPuzzle(lookupId);
  if (existingPuzzle && !existingPuzzle.id.includes('easy')) {
    if (!existingTierId) {
      await redis.set(KEYS.DAILY_TIER_PUZZLE(date, 'standard'), lookupId);
    }
    return existingPuzzle;
  }

  const { tier, stage } = forcedTier !== undefined
    ? {
        tier: Math.max(0, Math.min(6, forcedTier)),
        stage: 1 + Math.max(0, Math.min(6, forcedTier)) * 5,
      }
    : getStandardPuzzleTierForDate(date);

  // Generate a fresh challenge puzzle (Tier 4, 5, or 6) with fail-safe fallback chain
  let generated: GeneratedPuzzle;
  try {
    generated = generateBacktrackingLevel(stage, 9);
  } catch (err) {
    console.warn(`Initial generation failed for Standard stage ${stage}, stepping down:`, err);
    try {
      generated = generateBacktrackingLevel(21, 9); // Tier 4 fallback
    } catch (err2) {
      console.warn('Fallback generation failed, trying Tier 3 stage 16:', err2);
      try {
        generated = generateBacktrackingLevel(16, 9); // Tier 3 fallback
      } catch (err3) {
        console.error('All procedural generation attempts failed for standard daily, using static safe fallback:', err3);
        generated = {
          width: 9,
          height: 9,
          player: { x: 4, y: 4 },
          walls: [
            { x: 1, y: 1 },
            { x: 7, y: 1 },
            { x: 1, y: 7 },
            { x: 7, y: 7 },
          ],
          blocks: [
            { id: 'b_red_0', color: 'red', x: 2, y: 3 },
            { id: 'b_blue_1', color: 'blue', x: 6, y: 3 },
            { id: 'b_green_2', color: 'green', x: 3, y: 6 },
            { id: 'b_yellow_3', color: 'yellow', x: 5, y: 6 },
            { id: 'b_purple_4', color: 'purple', x: 4, y: 2 },
          ],
          targets: [
            { id: 't_red_0', color: 'red', x: 0, y: 3 },
            { id: 't_blue_1', color: 'blue', x: 8, y: 3 },
            { id: 't_green_2', color: 'green', x: 3, y: 8 },
            { id: 't_yellow_3', color: 'yellow', x: 5, y: 8 },
            { id: 't_purple_4', color: 'purple', x: 4, y: 0 },
          ],
          portals: [],
          solutionMoves: [
            'Up', 'Up', 'Left', 'Left', 'Down', 'Left', 'Right', 'Right', 'Right', 'Right',
            'Down', 'Right', 'Down', 'Down', 'Left', 'Down', 'Right', 'Right', 'Down', 'Up', 'Up', 'Up', 'Up', 'Up',
          ],
          par: 5,
        };
      }
    }
  }

  const name = dailyNumber ? `Daily Puzzle #${dailyNumber}` : `Daily Puzzle (${date})`;
  const standardPuzzle: Puzzle = {
    id: standardId,
    name,
    difficulty: 'daily',
    width: generated.width,
    height: generated.height,
    player: generated.player,
    walls: generated.walls,
    blocks: generated.blocks,
    targets: generated.targets,
    portals: generated.portals,
    createdAt: Date.now(),
    par: generated.par,
    playerMoves: generated.solutionMoves,
    splashMovesCount: Math.min(3, generated.solutionMoves.length),
    author: `Block Down (Tier ${tier})`,
  };

  await createPuzzle(standardPuzzle);
  await redis.set(KEYS.DAILY_TIER_PUZZLE(date, 'standard'), standardId);
  return standardPuzzle;
};

/**
 * Assign a puzzle as the daily puzzle for a given date
 */
export const assignDailyPuzzle = async (
  puzzleId: string,
  date?: string
): Promise<DailyPuzzle> => {
  let resolvedPuzzleId = puzzleId;
  const properDate = getProperDateFromPuzzleId(puzzleId) || date || getTodayDate();

  // Guard: Never assign an easy companion puzzle as the standard daily puzzle
  if (resolvedPuzzleId.includes('easy')) {
    console.warn(`Blocking attempt to assign easy puzzle ${resolvedPuzzleId} as standard daily puzzle`);
    const stdCandidate = await getPuzzle(`daily-${properDate}`);
    if (stdCandidate && !stdCandidate.id.includes('easy')) {
      resolvedPuzzleId = stdCandidate.id;
    } else {
      const ensuredStd = await ensureDailyStandardPuzzle(properDate);
      resolvedPuzzleId = ensuredStd.id;
    }
  }

  const puzzle = await getPuzzle(resolvedPuzzleId);
  if (!puzzle) {
    throw new Error(`Puzzle not found: ${resolvedPuzzleId}`);
  }

  // Ensure companion easy puzzle exists for this date
  let easyPuzzleId: string | undefined = undefined;
  try {
    const easyPuzzle = await ensureDailyEasyPuzzle(properDate);
    easyPuzzleId = easyPuzzle.id;
  } catch (err) {
    console.error('Failed to ensure easy puzzle on assignDailyPuzzle:', err);
  }

  const dailyPuzzle: DailyPuzzle = {
    date: properDate,
    puzzleId: resolvedPuzzleId,
    difficulty: puzzle.difficulty,
    assignedAt: Date.now(),
    easyPuzzleId,
  };

  const key = KEYS.DAILY_PUZZLE(properDate);
  await redis.set(key, JSON.stringify(dailyPuzzle));
  await redis.set(KEYS.DAILY_TIER_PUZZLE(properDate, 'standard'), resolvedPuzzleId);
  if (easyPuzzleId) {
    await redis.set(KEYS.DAILY_TIER_PUZZLE(properDate, 'easy'), easyPuzzleId);
  }

  // If it's today, also update current daily
  if (properDate === getTodayDate()) {
    await redis.set(KEYS.CURRENT_DAILY, JSON.stringify(dailyPuzzle));
  }

  // Auto-update the post mapping if a post already exists for this date
  const postId = await redis.get(`date_post:${properDate}`);
  if (postId) {
    await redis.set(`post_puzzle:${postId}`, resolvedPuzzleId);
    if (easyPuzzleId) {
      await redis.set(`post_puzzle_easy:${postId}`, easyPuzzleId);
    }
  }

  return dailyPuzzle;
};

/**
 * Assign a specific tier puzzle (easy or standard) for a given date
 */
export const assignDailyTierPuzzle = async (
  puzzleId: string,
  tier: DailyTier,
  date?: string
): Promise<DailyPuzzle> => {
  const properDate = getProperDateFromPuzzleId(puzzleId) || date || getTodayDate();
  const puzzle = await getPuzzle(puzzleId);
  if (!puzzle) {
    throw new Error(`Puzzle not found: ${puzzleId}`);
  }

  if (tier === 'standard') {
    return await assignDailyPuzzle(puzzleId, properDate);
  }

  // Assigning easy tier
  await redis.set(KEYS.DAILY_TIER_PUZZLE(properDate, 'easy'), puzzleId);
  const postId = await redis.get(`date_post:${properDate}`);
  if (postId) {
    await redis.set(`post_puzzle_easy:${postId}`, puzzleId);
  }

  let dailyPuzzle: DailyPuzzle;
  const existingDaily = await redis.get(KEYS.DAILY_PUZZLE(properDate));
  if (existingDaily) {
    dailyPuzzle = JSON.parse(existingDaily) as DailyPuzzle;
    dailyPuzzle.easyPuzzleId = puzzleId;
  } else {
    dailyPuzzle = {
      date: properDate,
      puzzleId: `daily-${properDate}`,
      difficulty: 'daily',
      assignedAt: Date.now(),
      easyPuzzleId: puzzleId,
    };
  }
  await redis.set(KEYS.DAILY_PUZZLE(properDate), JSON.stringify(dailyPuzzle));
  return dailyPuzzle;
};

/**
 * Get today's daily puzzle
 */
export const getCurrentDailyPuzzle = async (): Promise<(DailyPuzzle & { puzzle: Puzzle }) | null> => {
  try {
    const today = getTodayDate();
    const dailyData = await redis.get(KEYS.DAILY_PUZZLE(today));
    if (dailyData && dailyData !== 'undefined' && dailyData !== 'null') {
      const daily = JSON.parse(dailyData) as DailyPuzzle;
      const puzzle = await getPuzzle(daily.puzzleId);
      if (puzzle) {
        return { ...daily, puzzle };
      }
    }

    const legacyData = await redis.get(KEYS.CURRENT_DAILY);
    if (!legacyData || legacyData === 'undefined' || legacyData === 'null') return null;

    const daily = JSON.parse(legacyData) as DailyPuzzle;
    const puzzle = await getPuzzle(daily.puzzleId);

    if (!puzzle) return null;

    return { ...daily, puzzle };
  } catch (err) {
    console.error('Error getting current daily puzzle:', err);
    return null;
  }
};

/**
 * Get daily puzzle for a specific date.
 * If no standard daily puzzle is yet assigned or found in Redis,
 * automatically generates one based on day-of-week tier rules (Mon/Tue T4, Wed/Thu T5, Fri/Sat/Sun T6)
 * and ensures companion warm-up puzzle exists.
 */
export const getDailyPuzzle = async (
  date: string
): Promise<(DailyPuzzle & { puzzle: Puzzle }) | null> => {
  try {
    const dailyData = await redis.get(KEYS.DAILY_PUZZLE(date));
    let daily: DailyPuzzle | null = null;
    if (dailyData && dailyData !== 'undefined' && dailyData !== 'null') {
      try {
        daily = JSON.parse(dailyData) as DailyPuzzle;
      } catch {
        daily = null;
      }
    }

    let standardId = daily?.puzzleId;

    // Self-heal: If daily.puzzleId mistakenly points to an easy companion puzzle or is missing
    if (!standardId || standardId.includes('easy')) {
      const explicitStdId = await redis.get(KEYS.DAILY_TIER_PUZZLE(date, 'standard'));
      if (explicitStdId && !explicitStdId.includes('easy')) {
        standardId = explicitStdId;
      } else {
        const stdCandidate = await getPuzzle(`daily-${date}`);
        if (stdCandidate && !stdCandidate.id.includes('easy')) {
          standardId = stdCandidate.id;
        }
      }
    }

    let puzzle: Puzzle | null = null;
    if (standardId) {
      puzzle = await getPuzzle(standardId);
    }

    // If still no puzzle or puzzle not found, auto-generate standard daily challenge puzzle!
    if (!puzzle) {
      puzzle = await ensureDailyStandardPuzzle(date);
      standardId = puzzle.id;
    }

    // Also ensure easy companion warm-up puzzle exists
    let easyPuzzleId = daily?.easyPuzzleId;
    if (!easyPuzzleId) {
      easyPuzzleId = (await redis.get(KEYS.DAILY_TIER_PUZZLE(date, 'easy'))) || undefined;
    }
    if (!easyPuzzleId) {
      try {
        const easyPuzzle = await ensureDailyEasyPuzzle(date);
        easyPuzzleId = easyPuzzle.id;
      } catch (err) {
        console.warn('Failed to ensure easy companion puzzle in getDailyPuzzle:', err);
      }
    }

    const resolvedStandardId = puzzle.id;
    const assignedAt = daily?.assignedAt || Date.now();
    const updatedDaily: DailyPuzzle = {
      date,
      puzzleId: resolvedStandardId,
      difficulty: puzzle.difficulty,
      assignedAt,
      easyPuzzleId,
    };

    await redis.set(KEYS.DAILY_PUZZLE(date), JSON.stringify(updatedDaily));
    await redis.set(KEYS.DAILY_TIER_PUZZLE(date, 'standard'), resolvedStandardId);
    if (easyPuzzleId) {
      await redis.set(KEYS.DAILY_TIER_PUZZLE(date, 'easy'), easyPuzzleId);
    }

    // If it's today, also update current daily
    if (date === getTodayDate()) {
      await redis.set(KEYS.CURRENT_DAILY, JSON.stringify(updatedDaily));
    }

    return {
      ...updatedDaily,
      puzzle,
    };
  } catch (err) {
    console.error(`Error getting daily puzzle for ${date}:`, err);
    return null;
  }
};

/**
 * Get daily puzzle for a specific date and tier ('easy' | 'standard')
 */
export const getDailyTierPuzzle = async (
  date: string,
  tier: DailyTier = 'standard'
): Promise<(DailyPuzzle & { puzzle: Puzzle }) | null> => {
  try {
    if (tier === 'easy') {
      const easyPuzzle = await ensureDailyEasyPuzzle(date);
      const dailyData = await redis.get(KEYS.DAILY_PUZZLE(date));
      let assignedAt = Date.now();
      if (dailyData) {
        try {
          const parsed = JSON.parse(dailyData) as DailyPuzzle;
          assignedAt = parsed.assignedAt;
        } catch {
          // ignore
        }
      }
      return {
        date,
        puzzleId: easyPuzzle.id,
        difficulty: easyPuzzle.difficulty,
        assignedAt,
        puzzle: easyPuzzle,
      };
    }

    return await getDailyPuzzle(date);
  } catch (err) {
    console.error(`Error getting daily ${tier} puzzle for ${date}:`, err);
    return null;
  }
};

/**
 * Add a puzzle to the upcoming queue
 */
export const addUpcomingPuzzle = async (puzzleId: string): Promise<void> => {
  const puzzles = await getArray(KEYS.UPCOMING_PUZZLES);
  if (!puzzles.includes(puzzleId)) {
    puzzles.push(puzzleId);
    await setArray(KEYS.UPCOMING_PUZZLES, puzzles);
  }
};

/**
 * Get next puzzle from upcoming queue
 */
export const getNextUpcomingPuzzle = async (): Promise<Puzzle | null> => {
  const puzzles = await getArray(KEYS.UPCOMING_PUZZLES);
  if (puzzles.length === 0) return null;
  const nextId = puzzles[0];
  if (!nextId) return null;
  return getPuzzle(nextId);
};

/**
 * Get all upcoming puzzles
 */
export const getUpcomingPuzzles = async (limit: number = 10): Promise<Puzzle[]> => {
  const ids = await getArray(KEYS.UPCOMING_PUZZLES);
  const limitedIds = ids.slice(0, Math.min(limit, 50));
  const puzzles = await Promise.all(
    limitedIds.map((id: string) => getPuzzle(id))
  );
  return puzzles.filter((p): p is Puzzle => p !== null);
};

/**
 * Remove a puzzle from upcoming and add to past
 */
export const archivePuzzle = async (puzzleId: string): Promise<void> => {
  // Remove from upcoming
  const upcoming = await getArray(KEYS.UPCOMING_PUZZLES);
  const filteredUpcoming = upcoming.filter((id: string) => id !== puzzleId);
  await setArray(KEYS.UPCOMING_PUZZLES, filteredUpcoming);

  // Add to past
  const past = await getArray(KEYS.PAST_PUZZLES);
  if (!past.includes(puzzleId)) {
    past.push(puzzleId);
    await setArray(KEYS.PAST_PUZZLES, past);
  }
};

/**
 * Get past puzzles
 */
export const getPastPuzzles = async (limit: number = 30): Promise<Puzzle[]> => {
  const ids = await getArray(KEYS.PAST_PUZZLES);
  // Get the last 'limit' items
  const limitedIds = ids.slice(Math.max(0, ids.length - limit));
  const puzzles = await Promise.all(
    limitedIds.map((id: string) => getPuzzle(id))
  );
  return puzzles.filter((p): p is Puzzle => p !== null);
};

/**
 * Helper: Resolve all known key aliases for a puzzle ID (canonical ID, daily key, post ID)
 */
export const getPuzzleAliases = async (puzzleId: string): Promise<string[]> => {
  const aliases = new Set<string>();
  if (!puzzleId) return [];

  aliases.add(puzzleId);

  // 1. If puzzleId is a postId, check post_puzzle mapping
  if (puzzleId.startsWith('t3_') || puzzleId.match(/^[a-z0-9_]{5,40}$/i)) {
    const mapped = await redis.get(`post_puzzle:${puzzleId}`);
    if (mapped) aliases.add(mapped);
  }

  // 2. If puzzleId starts with 'daily-'
  const properDate = getProperDateFromPuzzleId(puzzleId);
  if (properDate) {
    const dailyData = await redis.get(KEYS.DAILY_PUZZLE(properDate));
    if (dailyData) {
      try {
        const parsed = JSON.parse(dailyData);
        if (parsed.puzzleId) aliases.add(parsed.puzzleId);
      } catch (e) {
        // ignore invalid JSON
      }
    }
    const postIdForDate = await redis.get(`date_post:${properDate}`);
    if (postIdForDate) aliases.add(postIdForDate);
  }

  // 3. Check if puzzle exists by ID
  const puzzle = await getPuzzle(puzzleId);
  if (puzzle) {
    aliases.add(puzzle.id);
    const puzzleDate = getProperDateFromPuzzleId(puzzle.id);
    if (puzzleDate) {
      aliases.add(`daily-${puzzleDate}`);
      const postIdForDate = await redis.get(`date_post:${puzzleDate}`);
      if (postIdForDate) aliases.add(postIdForDate);
    }
  }

  return Array.from(aliases);
};

/**
 * Get puzzle statistics
 */
export const getPuzzleStats = async (puzzleId: string) => {
  const data = await redis.get(KEYS.PUZZLE_STATS(puzzleId));
  let stats = data ? JSON.parse(data) : null;

  if (!stats) {
    const aliases = await getPuzzleAliases(puzzleId);
    for (const alias of aliases) {
      if (alias === puzzleId) continue;
      const aliasData = await redis.get(KEYS.PUZZLE_STATS(alias));
      if (aliasData) {
        try {
          stats = JSON.parse(aliasData);
          if (stats) break;
        } catch (e) {
          // ignore invalid JSON
        }
      }
    }
  }

  try {
    const leaderboard = await getLeaderboard(puzzleId);
    if (leaderboard && leaderboard.length > 0) {
      if (!stats) {
        stats = {
          totalAttempts: leaderboard.length,
          totalCompletions: leaderboard.length,
          averageScore: Math.round(leaderboard.reduce((acc, e) => acc + e.score, 0) / leaderboard.length),
          bestScore: Math.min(...leaderboard.map((e) => e.score)),
        };
      } else if ((stats.totalCompletions || 0) < leaderboard.length) {
        stats.totalCompletions = leaderboard.length;
        stats.totalAttempts = Math.max(stats.totalAttempts || 0, leaderboard.length);
      }
    }
  } catch (err) {
    // Ignore leaderboard sync fallback error
  }

  return stats;
};

/**
 * Get raw puzzle statistics directly from Redis (without fallback leaderboard calculations)
 */
export const getRawPuzzleStats = async (puzzleId: string) => {
  const data = await redis.get(KEYS.PUZZLE_STATS(puzzleId));
  let stats = null;
  if (data && data !== 'undefined' && data !== 'null') {
    try {
      stats = JSON.parse(data);
    } catch {
      stats = null;
    }
  }

  if (!stats) {
    const aliases = await getPuzzleAliases(puzzleId);
    for (const alias of aliases) {
      if (alias === puzzleId) continue;
      const aliasData = await redis.get(KEYS.PUZZLE_STATS(alias));
      if (aliasData) {
        try {
          stats = JSON.parse(aliasData);
          if (stats) break;
        } catch (e) {
          // ignore invalid JSON
        }
      }
    }
  }

  return stats;
};

/**
 * Update puzzle statistics
 */
export const updatePuzzleStats = async (
  puzzleId: string,
  stats: {
    attempts?: number;
    completions?: number;
    scores?: number[];
    times?: number[];
    moves?: number[];
  }
): Promise<void> => {
  const aliases = await getPuzzleAliases(puzzleId);
  if (!aliases.includes(puzzleId)) {
    aliases.push(puzzleId);
  }

  const existing = (await getRawPuzzleStats(puzzleId)) || {
    totalAttempts: 0,
    totalCompletions: 0,
    averageScore: 0,
    bestScore: 0,
    bestTime: 0,
    bestMoves: 0,
  };

  const updated = {
    ...existing,
    totalAttempts: Math.max((existing.totalAttempts || 0) + (stats.attempts || 0), (existing.totalCompletions || 0) + (stats.completions || 0)),
    totalCompletions: (existing.totalCompletions || 0) + (stats.completions || 0),
  };

  if (stats.scores && stats.scores.length > 0) {
    const allScores = [...(existing.scores || []), ...stats.scores];
    updated.scores = allScores;
    updated.averageScore = allScores.reduce((a: number, b: number) => a + b, 0) / allScores.length;
    const validScores = allScores.filter(s => s > 0);
    updated.bestScore = validScores.length > 0 ? Math.min(...validScores) : 0;
  }

  if (stats.times && stats.times.length > 0) {
    const allTimes = [...(existing.times || []), ...stats.times];
    updated.times = allTimes;
    const validTimes = allTimes.filter(t => t > 0);
    updated.bestTime = validTimes.length > 0 ? Math.min(...validTimes) : 0;
  }

  if (stats.moves && stats.moves.length > 0) {
    const allMoves = [...(existing.moves || []), ...stats.moves];
    updated.moves = allMoves;
    const validMoves = allMoves.filter(m => m > 0);
    updated.bestMoves = validMoves.length > 0 ? Math.min(...validMoves) : 0;
  }

  const updatedJson = JSON.stringify(updated);
  for (const alias of aliases) {
    await redis.set(KEYS.PUZZLE_STATS(alias), updatedJson);
  }
};

/**
 * Delete a puzzle (use with caution)
 */
export const deletePuzzle = async (id: string): Promise<void> => {
  const puzzle = await getPuzzle(id);
  
  if (puzzle) {
    await redis.del(KEYS.PUZZLE(id));
  }

  // Remove from difficulty index (check all difficulties in case of orphaned IDs)
  const difficulties: PuzzleDifficulty[] = ['tutorial', 'daily', 'easy', 'medium', 'hard', 'splash'];
  for (const difficulty of difficulties) {
    const difficultyKey = KEYS.PUZZLES_BY_DIFFICULTY(difficulty);
    const difficultyPuzzles = await getArray(difficultyKey);
    if (difficultyPuzzles.includes(id)) {
      const filtered = difficultyPuzzles.filter((pid: string) => pid !== id);
      await setArray(difficultyKey, filtered);
    }
  }
};

export const DEFAULT_FALLBACK_PUZZLE: Puzzle = {
  id: 'tutorial-1',
  name: 'Learn the Basics',
  difficulty: 'tutorial',
  width: 9,
  height: 9,
  player: { x: 4, y: 4 },
  walls: [],
  blocks: [
    {
      id: 'b_1781284146022_2fqg',
      color: 'red',
      x: 2,
      y: 2,
    },
    {
      id: 'b_1781284149635_th0d',
      color: 'blue',
      x: 6,
      y: 6,
    },
    {
      id: 'b_1781284151869_xr3j',
      color: 'green',
      x: 3,
      y: 5,
    },
  ],
  targets: [
    {
      id: 't_1781284157018_mlm3',
      color: 'red',
      x: 0,
      y: 2,
    },
    {
      id: 't_1781284158827_bj3s',
      color: 'green',
      x: 3,
      y: 8,
    },
    {
      id: 't_1781284160746_acal',
      color: 'blue',
      x: 8,
      y: 6,
    },
  ],
  createdAt: 1718000000000,
  par: 3,
  playerMoves: [
    'Up',
    'Up',
    'Left',
    'Left',
    'Right',
    'Down',
    'Down',
    'Down',
    'Down',
    'Right',
    'Right',
    'Right',
  ],
};

/**
 * Initialize sample puzzles (useful for development/testing)
 */
export const initializeSamplePuzzles = async (): Promise<void> => {
  const samplePuzzles: Puzzle[] = [DEFAULT_FALLBACK_PUZZLE];

  for (const puzzle of samplePuzzles) {
    await createPuzzle(puzzle);
  }
};

/**
 * Clear all puzzles and reset the database (Factory Reset)
 */
export const clearAllPuzzles = async (): Promise<void> => {
  // Clear all difficulty arrays and individual puzzles
  const difficulties: PuzzleDifficulty[] = ['tutorial', 'daily', 'easy', 'medium', 'hard', 'splash'];
  for (const difficulty of difficulties) {
    const difficultyKey = KEYS.PUZZLES_BY_DIFFICULTY(difficulty);
    const ids = await getArray(difficultyKey);
    for (const id of ids) {
      await redis.del(KEYS.PUZZLE(id));
      await redis.del(KEYS.PUZZLE_STATS(id));
    }
    await redis.del(difficultyKey);
  }

  // Clear specific active ones
  await redis.del(KEYS.ACTIVE_PUZZLE('splash'));
  await redis.del(KEYS.ACTIVE_PUZZLE('tutorial'));

  // Clear upcoming and past queues
  await redis.del(KEYS.UPCOMING_PUZZLES);
  await redis.del(KEYS.PAST_PUZZLES);
  // Clear current daily
  await redis.del(KEYS.CURRENT_DAILY);
};

/**
 * Set an active puzzle for a specific type
 */
export const setActivePuzzle = async (type: 'splash' | 'tutorial', puzzleId: string): Promise<void> => {
  const puzzle = await getPuzzle(puzzleId);
  if (!puzzle) throw new Error(`Puzzle not found: ${puzzleId}`);
  await redis.set(KEYS.ACTIVE_PUZZLE(type), puzzleId);
};

/**
 * Get the active puzzle for a specific type
 */
export const getActivePuzzle = async (type: 'splash' | 'tutorial'): Promise<Puzzle | null> => {
  const puzzleId = await redis.get(KEYS.ACTIVE_PUZZLE(type));
  if (!puzzleId) {
    // Fallback: get the first puzzle of this difficulty
    const puzzles = await getPuzzlesByDifficulty(type);
    const firstPuzzle = puzzles[0];
    return firstPuzzle || null;
  }
  return await getPuzzle(puzzleId);
};

export type LeaderboardEntry = {
  username: string;
  score: number;
  solveTime: number;
  moveCount: number;
  timestamp: number;
};

/**
 * Get leaderboard entries for a puzzle
 */
export const getLeaderboard = async (puzzleId: string): Promise<LeaderboardEntry[]> => {
  const data = await redis.get(`leaderboard:${puzzleId}`);
  let entries: LeaderboardEntry[] = [];
  if (data) {
    try {
      entries = JSON.parse(data);
    } catch (err) {
      console.error(`Failed to parse leaderboard data for ${puzzleId}:`, err);
    }
  }

  // Fallback: If no entries directly on puzzleId, check aliases
  if (entries.length === 0) {
    const aliases = await getPuzzleAliases(puzzleId);
    for (const alias of aliases) {
      if (alias === puzzleId) continue;
      const aliasData = await redis.get(`leaderboard:${alias}`);
      if (aliasData) {
        try {
          const aliasEntries: LeaderboardEntry[] = JSON.parse(aliasData);
          if (aliasEntries.length > 0) {
            entries = aliasEntries;
            // Sync to requested puzzleId so subsequent calls hit cache directly
            await redis.set(`leaderboard:${puzzleId}`, JSON.stringify(aliasEntries));
            break;
          }
        } catch (e) {
          // ignore invalid JSON
        }
      }
    }
  }

  return entries;
};

/**
 * Update leaderboard with a user's completion stats if it qualifies as a record
 */
export const updateLeaderboard = async (
  puzzleId: string,
  entry: { username: string; score: number; solveTime: number; moveCount: number }
): Promise<void> => {
  const leaderboard = await getLeaderboard(puzzleId);
  const existingIdx = leaderboard.findIndex(
    e => e.username.toLowerCase() === entry.username.toLowerCase()
  );
  
  const newEntry: LeaderboardEntry = {
    ...entry,
    timestamp: Date.now(),
  };

  if (existingIdx !== -1) {
    const existing = leaderboard[existingIdx];
    if (existing) {
      // Determine if new score is better (lower pushes/moves/time is better)
      const isBetter = 
        newEntry.score < existing.score ||
        (newEntry.score === existing.score && newEntry.moveCount < existing.moveCount) ||
        (newEntry.score === existing.score && newEntry.moveCount === existing.moveCount && newEntry.solveTime < existing.solveTime);
      
      if (isBetter) {
        leaderboard[existingIdx] = newEntry;
      }
    }
  } else {
    leaderboard.push(newEntry);
  }

  // Sort: pushes asc, moves asc, time asc
  leaderboard.sort((a, b) => {
    if (a.score !== b.score) return a.score - b.score;
    if (a.moveCount !== b.moveCount) return a.moveCount - b.moveCount;
    return a.solveTime - b.solveTime;
  });

  // Limit to top 10
  const top10 = leaderboard.slice(0, 10);
  await redis.set(`leaderboard:${puzzleId}`, JSON.stringify(top10));
};
