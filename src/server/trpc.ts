import { initTRPC } from '@trpc/server';
import { TRPCError } from '@trpc/server';
import { transformer } from '../shared/transformer';
import { Context } from './context';
import { context, reddit } from '@devvit/web/server';
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
  deletePuzzle,
  clearAllPuzzles,
} from './core/puzzle';
import { getCompletedPuzzles, markPuzzleCompleted } from './core/progress';
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
  puzzle: t.router({
    /**
     * Get a puzzle by ID
     */
    getById: publicProcedure
      .input(z.string())
      .query(async ({ input }) => {
        return await getPuzzle(input);
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
     * Create a new puzzle (Admin only - would need auth in production)
     */
    create: publicProcedure
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
     * Assign a puzzle as the daily puzzle
     */
    assignDaily: publicProcedure
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
      const today = new Date().toISOString().split('T')[0];
      
      return allDaily
        .filter(p => {
          // ID format is expected to be daily-YYYY-MM-DD
          const parts = p.id.split('daily-');
          if (parts.length < 2) return false;
          const dateStr = parts[1];
          // Keep only puzzles before today
          return dateStr < today;
        })
        .sort((a, b) => b.id.localeCompare(a.id)); // Newest past puzzles first
    }),

    /**
     * Add a puzzle to the upcoming queue
     */
    addUpcoming: publicProcedure
      .input(z.string())
      .mutation(async ({ input }) => {
        await addUpcomingPuzzle(input);
        return { success: true };
      }),

    /**
     * Archive a puzzle to past puzzles
     */
    archive: publicProcedure
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
     * Initialize sample puzzles (for development/testing)
     */
    initializeSamples: publicProcedure.mutation(async () => {
      await initializeSamplePuzzles();
      return { success: true };
    }),
    /**
     * Delete a puzzle
     */
    delete: publicProcedure
      .input(z.string())
      .mutation(async ({ input }) => {
        await deletePuzzle(input);
        return { success: true };
      }),

    /**
     * Clear all puzzles (Factory Reset)
     */
    clearAll: publicProcedure.mutation(async () => {
      await clearAllPuzzles();
      return { success: true };
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
        return await markPuzzleCompleted(username, input);
      }),
  }),
  admin: t.router({
    /**
     * Check if current user is admin
     */
    checkAuth: publicProcedure.query(async () => {
      const admin = await isAdmin();
      const username = await reddit.getCurrentUsername();
      return { isAdmin: admin, username };
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
  }),
});

export type AppRouter = typeof appRouter;
