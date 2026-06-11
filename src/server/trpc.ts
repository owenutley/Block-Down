import { initTRPC } from '@trpc/server';
import { TRPCError } from '@trpc/server';
import { transformer } from '../shared/transformer';
import { Context } from './context';
import { context, reddit, redis } from '@devvit/web/server';
import { countDecrement, countGet, countIncrement } from './core/count';
import { isDev, getDevAccounts, addDevAccount, removeDevAccount } from './dev';
import {
  getPuzzle,
  getPuzzlesByDifficulty,
  getPuzzleIdsByDifficulty,
  getAllPuzzles,
  getCurrentDailyPuzzle,
  getDailyPuzzle,
  getUpcomingPuzzles,
  getPastPuzzles,
  getPuzzleStats,
  updatePuzzleStats,
  createPuzzle,
  assignDailyPuzzle,
  addUpcomingPuzzle,
  archivePuzzle,
  initializeSamplePuzzles,
  deletePuzzle,
  clearAllPuzzles,
  getActivePuzzle,
  setActivePuzzle,
  getLeaderboard,
  updateLeaderboard,
  getNextAvailableDailyDate,
} from './core/puzzle';
import { getCompletedPuzzles, markPuzzleCompleted, markPuzzleAttempted, getUserCurrency, setUserCurrency, awardCurrencyForPuzzle, refreshUserTTL } from './core/progress';
import { createDailyPost, getDailyPuzzleCounter, syncDailyPostsWithPuzzles } from './core/post';
import { getUserThemeStatus, purchaseTheme, setUserActiveTheme, getUserTrailStatus, purchaseTrail, setUserActiveTrail, getUserCharacterStatus, purchaseCharacter, setUserActiveCharacter } from './core/shop';
import { THEMES, ALL_SHAPE_IDS, ThemeId, CHARACTERS } from '../shared/themes';
import { TrailId } from '../shared/trails';
import { getAllThemeConfigs, updateThemeConfig, resetThemeConfig } from './core/theme';
import { Puzzle, PuzzleDifficulty } from '../shared/types';
import { z } from 'zod';

const shapeEnum = z.enum(ALL_SHAPE_IDS);
const colorEnum = z.enum([
  'red', 'blue', 'yellow', 'purple', 'green', 'orange',
  'indigo', 'cyan', 'white', 'sky', 'teal', 'cobalt',
  'emerald', 'amber', 'crimson', 'pink', 'lime', 'fuchsia', 'rose'
]);
const blockThemeConfigSchema = z.object({
  shape: shapeEnum,
  color: colorEnum,
});
const themeConfigSchema = z.object({
  'red-heart': blockThemeConfigSchema,
  'blue-diamond': blockThemeConfigSchema,
  'yellow-crescent': blockThemeConfigSchema,
  'purple-circle': blockThemeConfigSchema,
  'green-cross': blockThemeConfigSchema,
  'orange-square': blockThemeConfigSchema,
});

/**
 * Initialization of tRPC backend
 * Should be done only once per backend!
 */
const t = initTRPC.context<Context>().create({
  transformer,
});

/**
 * Export reusable router and procedure helpers
 * that can be used throughout the router
 */
export const router = t.router;
export const publicProcedure = t.procedure;

/**
 * Moderator procedure - requires authentication as moderator user
 */
export const devProcedure = t.procedure.use(async ({ next }) => {
  const isDeveloper = await isDev();
  if (!isDeveloper) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You do not have permission to access this endpoint',
    });
  }
  return next();
});

/**
 * @deprecated Use devProcedure instead
 */
export const moderatorProcedure = devProcedure;

export const appRouter = t.router({
  init: t.router({
    get: publicProcedure.query(async () => {
      const [count, username] = await Promise.all([
        countGet(),
        reddit.getCurrentUsername(),
      ]);

      return {
        count,
        postId: context.postId,
        username,
      };
    }),
  }),
  counter: t.router({
    increment: publicProcedure
      .input(z.number().optional())
      .mutation(async ({ input }) => {
        const { postId } = context;
        return {
          count: await countIncrement(input),
          postId,
          type: 'increment',
        };
      }),
    decrement: publicProcedure
      .input(z.number().optional())
      .mutation(async ({ input }) => {
        const { postId } = context;
        return {
          count: await countDecrement(input),
          postId,
          type: 'decrement',
        };
      }),
    get: publicProcedure.query(async () => {
      return await countGet();
    }),
  }),
  currency: t.router({
    get: publicProcedure.query(async () => {
      const username = await reddit.getCurrentUsername();
      if (!username) return { currency: 0 };
      const currency = await getUserCurrency(username);
      return { currency };
    }),
  }),
  puzzle: t.router({
    /**
     * Get the puzzle and number associated with the current custom post
     */
    getForPost: publicProcedure.query(async () => {
      const { postId } = context;
      let number: number | null = null;
      
      if (postId) {
        const [puzzleId, storedNum] = await Promise.all([
          redis.get(`post_puzzle:${postId}`),
          redis.get(`post_number:${postId}`),
        ]);
        
        if (storedNum) {
          number = parseInt(storedNum, 10);
        }
        
        if (puzzleId) {
          const puzzle = await getPuzzle(puzzleId);
          if (puzzle) {
            return { puzzle, number, fromPost: true };
          }
        }
      }
      
      // Fallback: today's daily puzzle
      const daily = await getCurrentDailyPuzzle();
      const dailyNum = await getDailyPuzzleCounter();
      if (daily) {
        return { puzzle: daily.puzzle, number: dailyNum, fromPost: false };
      }
      
      return null;
    }),

    /**
     * Get a puzzle by ID
     */
    getById: publicProcedure
      .input(z.string())
      .query(async ({ input }) => {
        return await getPuzzle(input);
      }),

    /**
     * Get active puzzle for splash or tutorial
     */
    getActive: publicProcedure
      .input(z.enum(['splash', 'tutorial']))
      .query(async ({ input }) => {
        return await getActivePuzzle(input);
      }),

    /**
     * Get all puzzles by difficulty level
     */
    getByDifficulty: publicProcedure
      .input(z.enum(['tutorial', 'daily', 'easy', 'medium', 'hard', 'splash']))
      .query(async ({ input }) => {
        return await getPuzzlesByDifficulty(input as PuzzleDifficulty);
      }),

    /**
     * Get all puzzles across all difficulties
     */
    getAll: publicProcedure.query(async () => {
      return await getAllPuzzles();
    }),

    /**
     * Get today's daily puzzle
     */
    getCurrentDaily: publicProcedure.query(async () => {
      return await getCurrentDailyPuzzle();
    }),

    /**
     * Get daily puzzle for a specific date
     */
    getDaily: publicProcedure
      .input(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
      .query(async ({ input }) => {
        return await getDailyPuzzle(input);
      }),

    /**
     * Get upcoming puzzles
     */
    getUpcoming: publicProcedure
      .input(z.number().min(1).max(50).optional())
      .query(async ({ input }) => {
        return await getUpcomingPuzzles(input || 10);
      }),

    /**
     * Get past puzzles
     */
    getPast: publicProcedure
      .input(z.number().min(1).max(100).optional())
      .query(async ({ input }) => {
        return await getPastPuzzles(input || 30);
      }),


    /**
     * Get statistics for a puzzle
     */
    getStats: publicProcedure
      .input(z.string())
      .query(async ({ input }) => {
        return await getPuzzleStats(input);
      }),

    /**
     * Get leaderboard for a puzzle
     */
    getLeaderboard: publicProcedure
      .input(z.string())
      .query(async ({ input }) => {
        return await getLeaderboard(input);
      }),

    /**
     * Create a new puzzle (Moderator only)
     */
    create: moderatorProcedure
      .input(
        z.object({
          id: z.string(),
          name: z.string(),
          difficulty: z.enum(['tutorial', 'daily', 'easy', 'medium', 'hard']),
          width: z.number(),
          height: z.number(),
          player: z.object({ x: z.number(), y: z.number() }),
          walls: z.array(z.object({ x: z.number(), y: z.number() })),
          blocks: z.array(z.object({ id: z.string(), color: z.string(), x: z.number(), y: z.number() })),
          targets: z.array(z.object({ id: z.string(), color: z.string(), x: z.number(), y: z.number() })),
        })
      )
      .mutation(async ({ input }) => {
        const puzzle: Puzzle = {
          ...input,
          createdAt: Date.now(),
        };
        await createPuzzle(puzzle);
        return puzzle;
      }),

    /**
     * Assign a puzzle as the daily puzzle (Moderator only)
     */
    assignDaily: moderatorProcedure
      .input(
        z.object({
          puzzleId: z.string(),
          date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await assignDailyPuzzle(input.puzzleId, input.date);
      }),

    /**
     * Get past daily puzzles
     */
    getPastDailyPuzzles: publicProcedure.query(async () => {
      const allDaily = await getPuzzlesByDifficulty('daily');
      const today = new Date().toISOString().split('T')[0] || '';
      
      return allDaily
        .filter(p => {
          // ID format is expected to be daily-YYYY-MM-DD
          const parts = p.id.split('daily-');
          if (parts.length < 2) return false;
          const dateStr = parts[1] || '';
          if (!dateStr || !today) return false;
          // Keep only puzzles before today
          return dateStr < today;
        })
        .sort((a, b) => b.id.localeCompare(a.id)); // Newest past puzzles first
    }),

    /**
     * Add a puzzle to the upcoming queue (Moderator only)
     */
    addUpcoming: moderatorProcedure
      .input(z.string())
      .mutation(async ({ input }) => {
        await addUpcomingPuzzle(input);
        return { success: true };
      }),

    /**
     * Archive a puzzle to past puzzles (Moderator only)
     */
    archive: moderatorProcedure
      .input(z.string())
      .mutation(async ({ input }) => {
        await archivePuzzle(input);
        return { success: true };
      }),

    /**
     * Update puzzle statistics
     */
    updateStats: publicProcedure
      .input(
        z.object({
          puzzleId: z.string(),
          attempts: z.number().optional(),
          completions: z.number().optional(),
          scores: z.array(z.number()).optional(),
        })
      )
      .mutation(async ({ input }) => {
        await updatePuzzleStats(input.puzzleId, {
          attempts: input.attempts,
          completions: input.completions,
          scores: input.scores,
        });
        return { success: true };
      }),

    /**
     * Record a unique attempt on a puzzle
     */
    recordAttempt: publicProcedure
      .input(z.object({ puzzleId: z.string() }))
      .mutation(async ({ input }) => {
        const username = await reddit.getCurrentUsername();
        let shouldIncrement = true;
        if (username) {
          shouldIncrement = await markPuzzleAttempted(username, input.puzzleId);
        }
        if (shouldIncrement) {
          await updatePuzzleStats(input.puzzleId, {
            attempts: 1,
          });
        }
        return { success: true, recorded: shouldIncrement };
      }),

    /**
     * Record a unique completion and score on a puzzle
     */
    recordCompletion: publicProcedure
      .input(
        z.object({
          puzzleId: z.string(),
          score: z.number(),
          solveTime: z.number().optional(),
          moveCount: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const username = await reddit.getCurrentUsername();
        let isNewCompletion = true;
        let rewardedAmount = 0;
        if (username) {
          const result = await markPuzzleCompleted(username, input.puzzleId);
          isNewCompletion = result.isNew;
          if (isNewCompletion) {
            rewardedAmount = await awardCurrencyForPuzzle(username, input.puzzleId);
          }
          // Update puzzle leaderboard
          await updateLeaderboard(input.puzzleId, {
            username,
            score: input.score,
            solveTime: input.solveTime || 0,
            moveCount: input.moveCount || 0,
          });
        }

        await updatePuzzleStats(input.puzzleId, {
          completions: isNewCompletion ? 1 : 0,
          scores: [input.score],
          times: input.solveTime ? [input.solveTime] : undefined,
          moves: input.moveCount ? [input.moveCount] : undefined,
        });

        return { success: true, newCompletion: isNewCompletion, rewardedAmount };
      }),

    /**
     * Initialize sample puzzles (Moderator only)
     */
    initializeSamples: moderatorProcedure.mutation(async () => {
      await initializeSamplePuzzles();
      return { success: true };
    }),
    /**
     * Delete a puzzle (Moderator only)
     */
    delete: moderatorProcedure
      .input(z.string())
      .mutation(async ({ input }) => {
        await deletePuzzle(input);
        return { success: true };
      }),

    /**
     * Clear all puzzles (Moderator only)
     */
    clearAll: moderatorProcedure.mutation(async () => {
      await clearAllPuzzles();
      return { success: true };
    }),

    /**
     * Get the daily puzzle counter (which number today's puzzle is)
     */
    getDailyNumber: publicProcedure.query(async () => {
      return await getDailyPuzzleCounter();
    }),
  }),
  campaign: t.router({
    /**
     * Get the full campaign list (up to 60 levels) and user progress
     */
    get: publicProcedure.query(async () => {
      // Fetch up to 20 IDs of each difficulty
      const [easyIds, mediumIds, hardIds] = await Promise.all([
        getPuzzleIdsByDifficulty('easy'),
        getPuzzleIdsByDifficulty('medium'),
        getPuzzleIdsByDifficulty('hard'),
      ]);

      const easyMeta = easyIds.slice(0, 20).map((id) => ({ id, difficulty: 'easy' as const }));
      const mediumMeta = mediumIds.slice(0, 20).map((id) => ({ id, difficulty: 'medium' as const }));
      const hardMeta = hardIds.slice(0, 20).map((id) => ({ id, difficulty: 'hard' as const }));

      const campaignPuzzles = [
        ...easyMeta,
        ...mediumMeta,
        ...hardMeta
      ];

      const username = await reddit.getCurrentUsername();
      const completed = username ? await getCompletedPuzzles(username) : [];

      return {
        puzzles: campaignPuzzles,
        completedIds: completed,
      };
    }),
    
    /**
     * Mark a puzzle as completed for the current user
     */
    markCompleted: publicProcedure
      .input(z.string())
      .mutation(async ({ input }) => {
        const username = await reddit.getCurrentUsername();
        if (!username) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Must be logged in to save progress'
          });
        }
        const result = await markPuzzleCompleted(username, input);
        let rewardedAmount = 0;
        if (result.isNew) {
          rewardedAmount = await awardCurrencyForPuzzle(username, input);
        }
        return {
          completed: result.completed,
          isNew: result.isNew,
          rewardedAmount
        };
      }),
  }),
  subreddit: t.router({
    subscribe: publicProcedure.mutation(async () => {
      await reddit.subscribeToCurrentSubreddit();
      const username = await reddit.getCurrentUsername();
      if (username) {
        await redis.set(`user_subscribed:${username}`, 'true');
        await refreshUserTTL(username);
      }
      return { success: true };
    }),
    isSubscribed: publicProcedure.query(async () => {
      const username = await reddit.getCurrentUsername();
      if (!username) return { subscribed: false };
      const val = await redis.get(`user_subscribed:${username}`);
      await refreshUserTTL(username);
      return { subscribed: val === 'true' };
    }),
  }),
  dev: t.router({
    /**
     * Check if current user is dev
     */
    checkAuth: publicProcedure.query(async () => {
      const isDeveloper = await isDev();
      const username = await reddit.getCurrentUsername();
      const { postId } = context;
      return { isDev: isDeveloper, username, currentPostId: postId || null };
    }),

    /**
     * Get all dev accounts
     */
    getDevAccounts: devProcedure.query(async () => {
      return await getDevAccounts();
    }),

    /**
     * Add a dev account
     */
    addDevAccount: devProcedure
      .input(z.object({ username: z.string() }))
      .mutation(async ({ input }) => {
        await addDevAccount(input.username);
        return { success: true };
      }),

    /**
     * Remove a dev account
     */
    removeDevAccount: devProcedure
      .input(z.object({ username: z.string() }))
      .mutation(async ({ input }) => {
        await removeDevAccount(input.username);
        return { success: true };
      }),

    /**
     * Get the mapped puzzle and number for a given date (Dev only)
     */
    getPostMappingByDate: devProcedure
      .input(z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }))
      .query(async ({ input }) => {
        const postId = await redis.get(`date_post:${input.date}`);
        if (!postId) {
          return { postId: null, puzzleId: null, number: null };
        }
        const [puzzleId, storedNum] = await Promise.all([
          redis.get(`post_puzzle:${postId}`),
          redis.get(`post_number:${postId}`),
        ]);
        return {
          postId,
          puzzleId: puzzleId || null,
          number: storedNum ? parseInt(storedNum, 10) : null,
        };
      }),

    /**
     * Set the mapped puzzle and number for a given date (Dev only)
     */
    setPostMappingByDate: devProcedure
      .input(
        z.object({
          date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
          puzzleId: z.string().min(1),
          number: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const postId = await redis.get(`date_post:${input.date}`);
        if (!postId) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: `No post found associated with the date ${input.date}`,
          });
        }
        await redis.set(`post_puzzle:${postId}`, input.puzzleId);
        if (input.number !== undefined) {
          await redis.set(`post_number:${postId}`, input.number.toString());
        }
        return { success: true, postId };
      }),

    /**
     * Create or publish the daily post for a chosen puzzle (Dev only)
     */
    createDailyPost: devProcedure
      .input(
        z.object({
          puzzleId: z.string().min(1),
          date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await createDailyPost(input.puzzleId, input.date);
      }),

    /**
     * Create a new puzzle (Dev only)
     */
    createPuzzle: devProcedure
      .input(
        z.object({
          id: z.string().min(1),
          name: z.string().min(1),
          difficulty: z.enum(['tutorial', 'daily', 'easy', 'medium', 'hard', 'splash']),
          width: z.number(),
          height: z.number(),
          player: z.object({ x: z.number(), y: z.number() }),
          walls: z.array(z.object({ x: z.number(), y: z.number() })),
          blocks: z.array(z.object({ id: z.string(), color: z.string(), x: z.number(), y: z.number() })),
          targets: z.array(z.object({ id: z.string(), color: z.string(), x: z.number(), y: z.number() })),
          playerMoves: z.array(z.string()).optional(),
          oldId: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { oldId, ...puzzleData } = input;

        if (oldId && oldId !== input.id) {
          await deletePuzzle(oldId);

          if (oldId.startsWith('daily-')) {
            const oldDate = oldId.replace('daily-', '');
            await redis.del(`daily:${oldDate}`);

            // Clear current:daily if it pointed to the old ID
            const currentDailyData = await redis.get('current:daily');
            if (currentDailyData) {
              const currentDaily = JSON.parse(currentDailyData);
              if (currentDaily.puzzleId === oldId) {
                await redis.del('current:daily');
              }
            }
          }
        }

        const puzzle: Puzzle = {
          ...puzzleData,
          createdAt: Date.now(),
        };
        await createPuzzle(puzzle);
        return puzzle;
      }),

    /**
     * Set active puzzle (Dev only)
     */
    setActive: devProcedure
      .input(
        z.object({
          type: z.enum(['splash', 'tutorial']),
          puzzleId: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        await setActivePuzzle(input.type, input.puzzleId);
        return { success: true };
      }),

    /**
     * Assign a puzzle as the daily puzzle (Dev only)
     */
    assignDaily: devProcedure
      .input(
        z.object({
          puzzleId: z.string().min(1),
          date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await assignDailyPuzzle(input.puzzleId, input.date);
      }),

    /**
     * Add a puzzle to the upcoming queue (Dev only)
     */
    addUpcoming: devProcedure
      .input(z.string().min(1))
      .mutation(async ({ input }) => {
        await addUpcomingPuzzle(input);
        return { success: true };
      }),

    /**
     * Delete a puzzle (Dev only)
     */
    deletePuzzle: devProcedure
      .input(z.string().min(1))
      .mutation(async ({ input }) => {
        await deletePuzzle(input);
        return { success: true };
      }),

    /**
     * Get all puzzles (Dev view)
     */
    getAllPuzzles: devProcedure.query(async () => {
      return await getAllPuzzles();
    }),

    /**
     * Get upcoming puzzles (Dev view)
     */
    getUpcoming: devProcedure
      .input(z.number().min(1).max(50).optional())
      .query(async ({ input }) => {
        return await getUpcomingPuzzles(input || 10);
      }),

    /**
     * Adjust current user's currency (Dev only)
     */
    adjustCurrency: devProcedure
      .input(z.object({ amount: z.number() }))
      .mutation(async ({ input }) => {
        const username = await reddit.getCurrentUsername();
        if (!username) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'You must be logged in',
          });
        }
        const current = await getUserCurrency(username);
        const updated = Math.max(0, current + input.amount);
        await setUserCurrency(username, updated);
        return { success: true, currency: updated };
      }),

    /**
     * Get the next available daily date (Dev only)
     */
    getNextAvailableDailyDate: devProcedure.query(async () => {
      return await getNextAvailableDailyDate();
    }),

    /**
     * Set the daily puzzle counter (Dev only)
     */
    setDailyNumber: devProcedure
      .input(z.object({ number: z.number().min(0) }))
      .mutation(async ({ input }) => {
        await redis.set('daily-puzzle-counter', input.number.toString());
        return { success: true };
      }),

    /**
     * Sync daily posts with their proper puzzles (Dev only)
     */
    syncDailyPosts: devProcedure.mutation(async () => {
      return await syncDailyPostsWithPuzzles();
    }),
  }),
  shop: t.router({
    getStatus: publicProcedure.query(async (): Promise<{
      activeTheme: ThemeId;
      purchasedThemes: ThemeId[];
      activeTrail: TrailId;
      purchasedTrails: TrailId[];
      activeCharacter: string;
      purchasedCharacters: string[];
    }> => {
      const username = await reddit.getCurrentUsername();
      if (!username) {
        return {
          activeTheme: 'neon',
          purchasedThemes: ['neon'],
          activeTrail: 'none',
          purchasedTrails: ['none'],
          activeCharacter: 'neon',
          purchasedCharacters: ['neon'],
        };
      }
      const [themes, trails, chars, isDeveloper] = await Promise.all([
        getUserThemeStatus(username),
        getUserTrailStatus(username),
        getUserCharacterStatus(username),
        isDev(),
      ]);

      if (!isDeveloper) {
        return {
          ...themes,
          ...chars,
          activeTrail: 'none',
          purchasedTrails: ['none'],
        };
      }

      return {
        ...themes,
        ...trails,
        ...chars,
      };
    }),
    purchase: publicProcedure
      .input(z.object({ themeId: z.string() }))
      .mutation(async ({ input }) => {
        const username = await reddit.getCurrentUsername();
        if (!username) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'You must be logged in',
          });
        }
        const res = await purchaseTheme(username, input.themeId);
        if (!res.success) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: res.error || 'Failed to purchase theme',
          });
        }
        return res;
      }),
    setActive: publicProcedure
      .input(z.object({ themeId: z.string() }))
      .mutation(async ({ input }) => {
        const username = await reddit.getCurrentUsername();
        if (!username) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'You must be logged in',
          });
        }
        const res = await setUserActiveTheme(username, input.themeId);
        if (!res.success) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: res.error || 'Failed to set active theme',
          });
        }
        return res;
      }),
    purchaseTrail: devProcedure
      .input(z.object({ trailId: z.enum(['ghost', 'sparkle', 'fire']) }))
      .mutation(async ({ input }) => {
        const username = await reddit.getCurrentUsername();
        if (!username) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'You must be logged in',
          });
        }
        const res = await purchaseTrail(username, input.trailId);
        if (!res.success) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: res.error || 'Failed to purchase trail',
          });
        }
        return res;
      }),
    setActiveTrail: devProcedure
      .input(z.object({ trailId: z.enum(['none', 'ghost', 'sparkle', 'fire']) }))
      .mutation(async ({ input }) => {
        const username = await reddit.getCurrentUsername();
        if (!username) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'You must be logged in',
          });
        }
        const res = await setUserActiveTrail(username, input.trailId);
        if (!res.success) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: res.error || 'Failed to set active trail',
          });
        }
        return res;
      }),
    purchaseCharacter: publicProcedure
      .input(z.object({ characterId: z.string() }))
      .mutation(async ({ input }) => {
        const username = await reddit.getCurrentUsername();
        if (!username) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'You must be logged in',
          });
        }
        const res = await purchaseCharacter(username, input.characterId);
        if (!res.success) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: res.error || 'Failed to purchase character',
          });
        }
        return res;
      }),
    setActiveCharacter: publicProcedure
      .input(z.object({ characterId: z.string() }))
      .mutation(async ({ input }) => {
        const username = await reddit.getCurrentUsername();
        if (!username) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'You must be logged in',
          });
        }
        const res = await setUserActiveCharacter(username, input.characterId);
        if (!res.success) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: res.error || 'Failed to set active character',
          });
        }
        return res;
      }),
  }),
  theme: t.router({
    getAllThemes: publicProcedure.query(async () => {
      return THEMES;
    }),
    getAllCharacters: publicProcedure.query(async () => {
      return CHARACTERS;
    }),
    getAllConfigs: publicProcedure.query(async () => {
      return await getAllThemeConfigs();
    }),
    updateConfig: moderatorProcedure
      .input(
        z.object({
          themeId: z.string(),
          config: themeConfigSchema,
        })
      )
      .mutation(async ({ input }) => {
        await updateThemeConfig(input.themeId, input.config);
        return { success: true };
      }),
    resetConfig: moderatorProcedure
      .input(z.object({ themeId: z.string() }))
      .mutation(async ({ input }) => {
        await resetThemeConfig(input.themeId);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
