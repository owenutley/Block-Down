import { initTRPC } from '@trpc/server';
import { TRPCError } from '@trpc/server';
import { transformer } from '../shared/transformer';
import { Context } from './context';
import { context, reddit, redis } from '@devvit/web/server';
import { countDecrement, countGet, countIncrement } from './core/count';
import { isAdmin } from './admin';
import {
  getPuzzle,
  getPuzzlesByDifficulty,
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
import { getUserThemeStatus, purchaseTheme, setUserActiveTheme } from './core/shop';
import { ThemeId } from '../shared/themes';
import { Puzzle, PuzzleDifficulty } from '../shared/types';
import { z } from 'zod';

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
 * Admin procedure - requires authentication as admin user
 */
export const adminProcedure = t.procedure.use(async ({ next }) => {
  const admin = await isAdmin();
  if (!admin) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You do not have permission to access this endpoint',
    });
  }
  return next();
});

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
     * Create a new puzzle (Admin only)
     */
    create: adminProcedure
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
     * Assign a puzzle as the daily puzzle (Admin only)
     */
    assignDaily: adminProcedure
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
     * Add a puzzle to the upcoming queue (Admin only)
     */
    addUpcoming: adminProcedure
      .input(z.string())
      .mutation(async ({ input }) => {
        await addUpcomingPuzzle(input);
        return { success: true };
      }),

    /**
     * Archive a puzzle to past puzzles (Admin only)
     */
    archive: adminProcedure
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
     * Initialize sample puzzles (Admin only)
     */
    initializeSamples: adminProcedure.mutation(async () => {
      await initializeSamplePuzzles();
      return { success: true };
    }),
    /**
     * Delete a puzzle (Admin only)
     */
    delete: adminProcedure
      .input(z.string())
      .mutation(async ({ input }) => {
        await deletePuzzle(input);
        return { success: true };
      }),

    /**
     * Clear all puzzles (Admin only)
     */
    clearAll: adminProcedure.mutation(async () => {
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
      // Fetch up to 20 of each difficulty
      const easy = await getPuzzlesByDifficulty('easy');
      const medium = await getPuzzlesByDifficulty('medium');
      const hard = await getPuzzlesByDifficulty('hard');

      const campaignPuzzles = [
        ...easy.slice(0, 20),
        ...medium.slice(0, 20),
        ...hard.slice(0, 20)
      ];

      const username = await reddit.getCurrentUsername();
      const completed = username ? await getCompletedPuzzles(username) : [];

      const stats = await Promise.all(
        campaignPuzzles.map(async (p) => {
          const s = await getPuzzleStats(p.id);
          return {
            puzzleId: p.id,
            totalAttempts: s?.totalAttempts || 0,
            totalCompletions: s?.totalCompletions || 0,
            averageScore: s?.averageScore || 0,
            bestScore: s?.bestScore || 0
          };
        })
      );

      return {
        puzzles: campaignPuzzles,
        completedIds: completed,
        stats,
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
  admin: t.router({
    /**
     * Check if current user is admin
     */
    checkAuth: publicProcedure.query(async () => {
      const admin = await isAdmin();
      const username = await reddit.getCurrentUsername();
      const { postId } = context;
      return { isAdmin: admin, username, currentPostId: postId || null };
    }),

    /**
     * Get the mapped puzzle and number for a given date (Admin only)
     */
    getPostMappingByDate: adminProcedure
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
     * Set the mapped puzzle and number for a given date (Admin only)
     */
    setPostMappingByDate: adminProcedure
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
     * Create or publish the daily post for a chosen puzzle (Admin only)
     */
    createDailyPost: adminProcedure
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
     * Create a new puzzle (Admin only)
     */
    createPuzzle: adminProcedure
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
     * Set active puzzle (Admin only)
     */
    setActive: adminProcedure
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
     * Assign a puzzle as the daily puzzle (Admin only)
     */
    assignDaily: adminProcedure
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
     * Add a puzzle to the upcoming queue (Admin only)
     */
    addUpcoming: adminProcedure
      .input(z.string().min(1))
      .mutation(async ({ input }) => {
        await addUpcomingPuzzle(input);
        return { success: true };
      }),

    /**
     * Delete a puzzle (Admin only)
     */
    deletePuzzle: adminProcedure
      .input(z.string().min(1))
      .mutation(async ({ input }) => {
        await deletePuzzle(input);
        return { success: true };
      }),

    /**
     * Get all puzzles (Admin view)
     */
    getAllPuzzles: adminProcedure.query(async () => {
      return await getAllPuzzles();
    }),

    /**
     * Get upcoming puzzles (Admin view)
     */
    getUpcoming: adminProcedure
      .input(z.number().min(1).max(50).optional())
      .query(async ({ input }) => {
        return await getUpcomingPuzzles(input || 10);
      }),

    /**
     * Adjust current user's currency (Admin only)
     */
    adjustCurrency: adminProcedure
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
     * Get the next available daily date (Admin only)
     */
    getNextAvailableDailyDate: adminProcedure.query(async () => {
      return await getNextAvailableDailyDate();
    }),

    /**
     * Set the daily puzzle counter (Admin only)
     */
    setDailyNumber: adminProcedure
      .input(z.object({ number: z.number().min(0) }))
      .mutation(async ({ input }) => {
        await redis.set('daily-puzzle-counter', input.number.toString());
        return { success: true };
      }),

    /**
     * Sync daily posts with their proper puzzles (Admin only)
     */
    syncDailyPosts: adminProcedure.mutation(async () => {
      return await syncDailyPostsWithPuzzles();
    }),
  }),
  shop: t.router({
    getStatus: publicProcedure.query(async () => {
      const username = await reddit.getCurrentUsername();
      if (!username) return { activeTheme: 'neon' as ThemeId, purchasedThemes: ['neon' as ThemeId] };
      return await getUserThemeStatus(username);
    }),
    purchase: publicProcedure
      .input(z.object({ themeId: z.enum(['neon', 'arcade', 'cosmic', 'zen']) }))
      .mutation(async ({ input }) => {
        const username = await reddit.getCurrentUsername();
        if (!username) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'You must be logged in',
          });
        }
        const res = await purchaseTheme(username, input.themeId as ThemeId);
        if (!res.success) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: res.error || 'Failed to purchase theme',
          });
        }
        return res;
      }),
    setActive: publicProcedure
      .input(z.object({ themeId: z.enum(['neon', 'arcade', 'cosmic', 'zen']) }))
      .mutation(async ({ input }) => {
        const username = await reddit.getCurrentUsername();
        if (!username) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'You must be logged in',
          });
        }
        const res = await setUserActiveTheme(username, input.themeId as ThemeId);
        if (!res.success) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: res.error || 'Failed to set active theme',
          });
        }
        return res;
      }),
  }),
});

export type AppRouter = typeof appRouter;
