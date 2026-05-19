import { initTRPC } from '@trpc/server';
import { transformer } from '../shared/transformer';
import { Context } from './context';
import { context, reddit } from '@devvit/web/server';
import { countDecrement, countGet, countIncrement } from './core/count';
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
} from './core/puzzle';
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
      .input(z.enum(['tutorial', 'easy', 'medium', 'hard']))
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
          difficulty: z.enum(['tutorial', 'easy', 'medium', 'hard']),
          blocks: z.array(z.array(z.number())),
          target: z.number().positive(),
          title: z.string(),
          description: z.string().optional(),
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
});

export type AppRouter = typeof appRouter;
