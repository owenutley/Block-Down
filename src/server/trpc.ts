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
import {
  getCompletedPuzzles,
  markPuzzleCompleted,
  markPuzzleAttempted,
  getUserCurrency,
  setUserCurrency,
  awardCurrencyForPuzzle,
  refreshUserTTL,
  getUserStars,
  recordPuzzleStars,
  getUserStreak,
  recordDailyStreak,
} from './core/progress';
import { createDailyPost, getDailyPuzzleCounter, syncDailyPostsWithPuzzles, createUserPuzzlePost } from './core/post';
import { getUserThemeStatus, purchaseTheme, setUserActiveTheme, getUserTrailStatus, purchaseTrail, setUserActiveTrail, getUserCharacterStatus, purchaseCharacter, setUserActiveCharacter, checkAndGrantCampaignRewards } from './core/shop';
import { THEMES, ALL_SHAPE_IDS, ThemeId, CHARACTERS } from '../shared/themes';
import { TrailId } from '../shared/trails';
import { getAllThemeConfigs, updateThemeConfig, resetThemeConfig } from './core/theme';
import { getTutorialPages, saveTutorialPage, deleteTutorialPage, reorderTutorialPages } from './core/howto';
import { Puzzle, PuzzleDifficulty } from '../shared/types';
import { z } from 'zod';

const shapeEnum = z.enum(ALL_SHAPE_IDS);
const colorEnum = z.enum([
  'red', 'blue', 'yellow', 'purple', 'green', 'orange',
  'indigo', 'cyan', 'white', 'sky', 'teal', 'cobalt',
  'emerald', 'amber', 'crimson', 'pink', 'lime', 'fuchsia', 'rose',
  'stone', 'slate', 'gray'
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
      if (!username) return { currency: 0, username: undefined };
      const currency = await getUserCurrency(username);
      return { currency, username };
    }),
  }),
  puzzle: t.router({
    /**
     * Get the puzzle and number associated with the current custom post
     */
    getForPost: publicProcedure
      .input(
        z.object({
          dailyNumber: z.number().optional(),
          isPlayMode: z.boolean().optional(),
        }).optional()
      )
      .query(async ({ input }) => {
        const { postId } = context;
        const username = await reddit.getCurrentUsername();

        // 1. Direct Post Mapping: Check if the current post is mapped directly to a custom or specific puzzle
        if (postId && input?.dailyNumber === undefined) {
          const directMappedPuzzleId = await redis.get(`post_puzzle:${postId}`);
          if (directMappedPuzzleId) {
            const directPuzzle = await getPuzzle(directMappedPuzzleId);
            if (directPuzzle) {
              const storedNum = await redis.get(`post_number:${postId}`);
              const numVal = storedNum ? parseInt(storedNum, 10) : 0;
              const dailyNum = await getDailyPuzzleCounter();

              const [prevPostId, nextPostId] = numVal > 0
                ? await Promise.all([
                    redis.get(`number_post:${numVal - 1}`),
                    redis.get(`number_post:${numVal + 1}`),
                  ])
                : [null, null];

              const [completedPuzzles, streak] = username
                ? await Promise.all([getCompletedPuzzles(username), getUserStreak(username)])
                : [[], { currentStreak: 0, maxStreak: 0, lastSolvedDate: null }];
              const stats = await getPuzzleStats(directPuzzle.id);

              return {
                puzzle: directPuzzle,
                number: numVal,
                fromPost: true,
                prevPostId: prevPostId || null,
                nextPostId: nextPostId || null,
                maxDailyNumber: dailyNum || 1,
                isCompleted: completedPuzzles.includes(directPuzzle.id),
                totalCompletions: stats?.totalCompletions || 0,
                streak,
              };
            }
          }
        }

        let number: number | null = null;

        if (input?.dailyNumber !== undefined) {
          number = input.dailyNumber;
          if (username) {
            await redis.set(`user_selected_daily:${username}`, number.toString());
          }
        } else if (input?.isPlayMode && username) {
          const storedSelected = await redis.get(`user_selected_daily:${username}`);
          if (storedSelected) {
            number = parseInt(storedSelected, 10);
          }
        }

        // If still no number resolved, check from the postId
        if (number === null && postId) {
          const storedNum = await redis.get(`post_number:${postId}`);
          if (storedNum) {
            number = parseInt(storedNum, 10);
          }
        }

        // If it's a fresh load of the splash (no input at all), clear the selection
        if (input === undefined && username) {
          await redis.del(`user_selected_daily:${username}`);
        }

        const dailyNum = await getDailyPuzzleCounter();
        const numVal = number || dailyNum || 1;
        const [prevPostId, nextPostId] = await Promise.all([
          redis.get(`number_post:${numVal - 1}`),
          redis.get(`number_post:${numVal + 1}`),
        ]);

        let puzzle: Puzzle | null = null;

        // 2. Check mapped daily post puzzle
        const mappedPostId = await redis.get(`number_post:${numVal}`);
        let mappedPuzzleId: string | null = null;
        if (mappedPostId) {
          mappedPuzzleId = (await redis.get(`post_puzzle:${mappedPostId}`)) || null;
        } else if (postId && numVal === number) {
          mappedPuzzleId = (await redis.get(`post_puzzle:${postId}`)) || null;
        }

        if (mappedPuzzleId) {
          puzzle = await getPuzzle(mappedPuzzleId);
        }

        // 2. Fallback: cycle through all created daily puzzles chronologically
        if (!puzzle) {
          const dailyPuzzles = await getPuzzlesByDifficulty('daily');
          if (dailyPuzzles.length > 0) {
            dailyPuzzles.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
            const idx = (numVal - 1) % dailyPuzzles.length;
            puzzle = dailyPuzzles[idx] || null;
          }
        }

        // 3. Absolute fallback to tutorial-1
        if (!puzzle) {
          puzzle = await getPuzzle('tutorial-1');
        }

        const [completedPuzzles, streak]: [
          string[],
          { currentStreak: number; maxStreak: number; lastSolvedDate: string | null }
        ] = username
          ? await Promise.all([
              getCompletedPuzzles(username),
              getUserStreak(username),
            ])
          : [[], { currentStreak: 0, maxStreak: 0, lastSolvedDate: null }];
        const stats = puzzle ? await getPuzzleStats(puzzle.id) : null;

        return {
          puzzle,
          number: numVal,
          fromPost: !!postId,
          prevPostId: prevPostId || null,
          nextPostId: nextPostId || null,
          maxDailyNumber: dailyNum || 1,
          isCompleted: puzzle ? completedPuzzles.includes(puzzle.id) : false,
          totalCompletions: stats?.totalCompletions || 0,
          streak,
        };
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
          portals: z.array(z.object({ id: z.string(), color: z.string(), x: z.number(), y: z.number(), dir: z.enum(['Up', 'Down', 'Left', 'Right']) })).optional(),
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
          stars: z.number().min(1).max(3).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const username = await reddit.getCurrentUsername();
        let isNewCompletion = true;
        let rewardedAmount = 0;
        let starReward = 0;
        let stars = input.stars || 1;
        let streakResult: {
          currentStreak: number;
          maxStreak: number;
          isNewDay: boolean;
          streakBonus: number;
          isMilestone: boolean;
          milestoneText?: string | undefined;
        } = {
          currentStreak: 0,
          maxStreak: 0,
          isNewDay: false,
    streakBonus: 0,
          isMilestone: false,
        };

        if (username) {
          const isCustomPuzzle = input.puzzleId.startsWith('custom-');
          const result = await markPuzzleCompleted(username, input.puzzleId);
          isNewCompletion = result.isNew;

          if (isNewCompletion && !isCustomPuzzle) {
            rewardedAmount = await awardCurrencyForPuzzle(username, input.puzzleId);
          }

          if (input.stars && !isCustomPuzzle) {
            const starRec = await recordPuzzleStars(username, input.puzzleId, input.stars);
            starReward = starRec.starReward;
            stars = starRec.currentStars;
          }

          if (!isCustomPuzzle) {
            streakResult = await recordDailyStreak(username);
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

        return {
          success: true,
          newCompletion: isNewCompletion,
          rewardedAmount: rewardedAmount + starReward + streakResult.streakBonus,
          baseReward: rewardedAmount,
          starReward,
          stars,
          streak: streakResult,
          username: username || undefined,
        };
      }),

    /**
     * Submit an authentic, verified score comment directly to the Reddit post thread
     */
    postScoreComment: publicProcedure
      .input(
        z.object({
          title: z.string(),
          puzzleId: z.string().optional(),
          pushes: z.number(),
          par: z.number(),
          moves: z.number(),
          solveTime: z.number(),
          stars: z.number(),
          streak: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { postId } = context;
        const username = await reddit.getCurrentUsername();
        const formatTime = (sec: number) => {
          if (sec < 60) return `${sec}s`;
          const m = Math.floor(sec / 60);
          const s = sec % 60;
          return `${m}m ${s < 10 ? '0' : ''}${s}s`;
        };

        const payload = `${input.puzzleId || 'p'}:${username || 'anon'}:${input.pushes}:${input.moves}:${input.solveTime}:${input.stars}`;
        let hash = 0;
        for (let i = 0; i < payload.length; i++) {
          const char = payload.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash |= 0;
        }
        const hex = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
        const verificationCode = `BD-${hex.slice(0, 4)}-${hex.slice(4, 8)}`;

        const ratingText = input.stars === 3 ? '⭐⭐⭐ (Par Master)' : input.stars === 2 ? '⭐⭐ (Great Job)' : '⭐ (Completed)';
        const streakLine = input.streak && input.streak > 0 ? `- 🔥 **Streak**: ${input.streak} Days\n` : '';

        const commentBody = `### 🎮 **Block Down • Verified Solution** ✦\n\n` +
          `**${input.title}**\n` +
          `- ⭐ **Rating**: ${ratingText}\n` +
          `- 🚀 **Pushes**: **${input.pushes}** / ${input.par} Par\n` +
          `- 👣 **Moves**: ${input.moves} steps\n` +
          `- ⏱️ **Solve Time**: ${formatTime(input.solveTime)}\n` +
          streakLine +
          `\n\`🔒 VERIFIED SOLVE • ${verificationCode}\``;

        if (!postId) {
          return { success: false, reason: 'No active post context found' };
        }
        const targetPostId = (postId.startsWith('t3_') ? postId : `t3_${postId}`) as `t3_${string}`;
        try {
          const comment = await reddit.submitComment({
            id: targetPostId,
            text: commentBody,
            runAs: 'USER',
          });
          return { success: true, commentId: comment.id, permalink: comment.permalink };
        } catch {
          try {
            const comment = await reddit.submitComment({
              id: targetPostId,
              text: `u/${username || 'Player'} completed the puzzle!\n\n${commentBody}`,
              runAs: 'APP',
            });
            return { success: true, commentId: comment.id, permalink: comment.permalink };
          } catch (err: unknown) {
            console.error('Failed to submit score comment:', err);
            return { success: false, reason: 'Failed to submit comment to Reddit' };
          }
        }
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

    /**
     * Publish a custom user puzzle to Reddit as an individual post
     */
    publishCustomPuzzle: publicProcedure
      .input(
        z.object({
          name: z.string(),
          startPos: z.object({ x: z.number(), y: z.number() }),
          walls: z.array(z.object({ x: z.number(), y: z.number() })),
          blocks: z.array(
            z.object({
              id: z.string(),
              color: z.string(),
              x: z.number(),
              y: z.number(),
            })
          ),
          targets: z.array(
            z.object({
              id: z.string(),
              color: z.string(),
              x: z.number(),
              y: z.number(),
            })
          ),
          portals: z.array(
            z.object({
              id: z.string(),
              color: z.string(),
              x: z.number(),
              y: z.number(),
              dir: z.enum(['Up', 'Down', 'Left', 'Right']),
            })
          ),
          solutionMoves: z.array(z.string()),
          par: z.number(),
          theme: z.string().optional(),
          character: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const puzzleId = `custom-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

        const username = await reddit.getCurrentUsername();
        const authorName = username ? (username.startsWith('u/') ? username : `u/${username}`) : 'u/Player';
        const challengeTitle = `${authorName}'s Challenge`;

        const puzzleData: Puzzle = {
          id: puzzleId,
          name: challengeTitle,
          difficulty: 'custom',
          width: 9,
          height: 9,
          player: input.startPos,
          walls: input.walls,
          blocks: input.blocks.map((b) => ({
            id: b.id,
            color: b.color,
            x: b.x,
            y: b.y,
          })),
          targets: input.targets.map((t) => ({
            id: t.id,
            color: t.color,
            x: t.x,
            y: t.y,
          })),
          portals: input.portals.map((p) => ({
            id: p.id,
            color: p.color as any,
            x: p.x,
            y: p.y,
            dir: p.dir,
          })),
          playerMoves: input.solutionMoves,
          createdAt: Date.now(),
          author: authorName,
        };

        await createPuzzle(puzzleData);
        const post = await createUserPuzzlePost(puzzleId, challengeTitle);

        return {
          success: true,
          puzzleId,
          postId: post?.id,
          postUrl: post?.url,
        };
      }),

    /**
     * Report user-generated content (puzzle) for content moderation compliance
     */
    reportPuzzle: publicProcedure
      .input(
        z.object({
          puzzleId: z.string(),
          reason: z.string().optional(),
          postId: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const username = await reddit.getCurrentUsername();
        const reporter = username ? (username.startsWith('u/') ? username : `u/${username}`) : 'u/anonymous';
        const reportKey = `reports:${input.puzzleId}`;

        const existingData = await redis.get(reportKey);
        const reports = existingData ? JSON.parse(existingData) : [];
        reports.push({
          reporter,
          reason: input.reason || 'Inappropriate user content',
          timestamp: Date.now(),
          postId: input.postId || '',
        });

        await redis.set(reportKey, JSON.stringify(reports));

        return {
          success: true,
          message: 'Report submitted successfully.',
        };
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

      const combinedIds = [
        ...easyIds.slice(0, 20),
        ...mediumIds.slice(0, 20),
        ...hardIds.slice(0, 20)
      ];

      // Fetch the full puzzles to get their creation timestamps
      const puzzles = await Promise.all(
        combinedIds.map((id) => getPuzzle(id))
      );

      // Filter out nulls and sort by createdAt ascending (oldest first)
      const sortedPuzzles = puzzles
        .filter((p): p is Puzzle => p !== null)
        .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

      const campaignPuzzles: { id: string; difficulty: 'easy' | 'medium' | 'hard' }[] = [];
      for (const p of sortedPuzzles) {
        if (p.difficulty === 'easy' || p.difficulty === 'medium' || p.difficulty === 'hard') {
          campaignPuzzles.push({
            id: p.id,
            difficulty: p.difficulty,
          });
        }
      }

      const username = await reddit.getCurrentUsername();
      const [completed, stars, streak]: [
        string[],
        Record<string, number>,
        { currentStreak: number; maxStreak: number; lastSolvedDate: string | null }
      ] = username
        ? await Promise.all([
            getCompletedPuzzles(username),
            getUserStars(username),
            getUserStreak(username),
          ])
        : [[], {}, { currentStreak: 0, maxStreak: 0, lastSolvedDate: null }];

      if (username) {
        await checkAndGrantCampaignRewards(username, completed, campaignPuzzles);
      }

      return {
        puzzles: campaignPuzzles,
        completedIds: completed,
        stars,
        streak,
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

        // Fetch full campaign list to evaluate tier reward unlocks
        const [easyIds, mediumIds, hardIds] = await Promise.all([
          getPuzzleIdsByDifficulty('easy'),
          getPuzzleIdsByDifficulty('medium'),
          getPuzzleIdsByDifficulty('hard'),
        ]);
        const combinedIds = [...easyIds.slice(0, 20), ...mediumIds.slice(0, 20), ...hardIds.slice(0, 20)];
        const puzzles = await Promise.all(combinedIds.map((id) => getPuzzle(id)));
        const campaignPuzzles = puzzles
          .filter((p): p is Puzzle => p !== null)
          .filter((p) => p.difficulty === 'easy' || p.difficulty === 'medium' || p.difficulty === 'hard')
          .map((p) => ({ id: p.id, difficulty: p.difficulty as 'easy' | 'medium' | 'hard' }));

        const unlockedRewards = await checkAndGrantCampaignRewards(username, result.completed, campaignPuzzles);

        return {
          completed: result.completed,
          isNew: result.isNew,
          rewardedAmount,
          unlockedRewards,
        };
      }),
  }),
  progress: t.router({
    /**
     * Get the current user's daily streak
     */
    getStreak: publicProcedure.query(async () => {
      const username = await reddit.getCurrentUsername();
      if (!username) return { currentStreak: 0, maxStreak: 0, lastSolvedDate: null };
      return await getUserStreak(username);
    }),
    /**
     * Get the user's star ratings across all puzzles
     */
    getStars: publicProcedure.query(async () => {
      const username = await reddit.getCurrentUsername();
      if (!username) return {};
      return await getUserStars(username);
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
          const oldNum = await redis.get(`post_number:${postId}`);
          if (oldNum) {
            await redis.del(`number_post:${oldNum}`);
          }
          await redis.set(`post_number:${postId}`, input.number.toString());
          await redis.set(`number_post:${input.number}`, postId);
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
          portals: z.array(z.object({ id: z.string(), color: z.string(), x: z.number(), y: z.number(), dir: z.enum(['Up', 'Down', 'Left', 'Right']) })).optional(),
          playerMoves: z.array(z.string()).optional(),
          splashMovesCount: z.number().min(0).optional(),
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
     * Update splash moves count for a puzzle (Dev only)
     */
    updateSplashMovesCount: devProcedure
      .input(
        z.object({
          puzzleId: z.string().min(1),
          splashMovesCount: z.number().min(0),
        })
      )
      .mutation(async ({ input }) => {
        const puzzle = await getPuzzle(input.puzzleId);
        if (!puzzle) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: `Puzzle not found: ${input.puzzleId}`,
          });
        }
        const updatedPuzzle: Puzzle = {
          ...puzzle,
          splashMovesCount: input.splashMovesCount,
        };
        await createPuzzle(updatedPuzzle);
        return updatedPuzzle;
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

    /**
     * Toggle cosmetic theme or character unlocked state for current user (Dev only)
     */
    toggleCosmetic: devProcedure
      .input(
        z.object({
          type: z.enum(['theme', 'character']),
          id: z.string().min(1),
          unlocked: z.boolean(),
        })
      )
      .mutation(async ({ input }) => {
        const username = await reddit.getCurrentUsername();
        if (!username) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not logged in' });
        }

        if (input.type === 'theme') {
          const { purchasedThemes } = await getUserThemeStatus(username);
          let updated = [...purchasedThemes];
          if (input.unlocked) {
            if (!updated.includes(input.id)) updated.push(input.id);
          } else {
            updated = updated.filter((t) => t !== input.id);
            if (updated.length === 0) updated.push('neon');
            const active = await redis.get(`user_active_theme:${username}`);
            if (active === input.id) {
              await redis.set(`user_active_theme:${username}`, 'neon');
            }
          }
          await redis.set(`user_purchased_themes:${username}`, JSON.stringify(updated));
        } else {
          const { purchasedCharacters } = await getUserCharacterStatus(username);
          let updated = [...purchasedCharacters];
          if (input.unlocked) {
            if (!updated.includes(input.id)) updated.push(input.id);
          } else {
            updated = updated.filter((c) => c !== input.id);
            if (updated.length === 0) updated.push('neon');
            const active = await redis.get(`user_active_char:${username}`);
            if (active === input.id) {
              await redis.set(`user_active_char:${username}`, 'neon');
            }
          }
          await redis.set(`user_purchased_chars:${username}`, JSON.stringify(updated));
        }
        await refreshUserTTL(username);
        return { success: true };
      }),

    /**
     * Toggle permanent campaign tier earned state for testing (Dev only)
     */
    toggleTierEarned: devProcedure
      .input(
        z.object({
          tier: z.enum(['easy', 'medium', 'hard']),
          earned: z.boolean(),
        })
      )
      .mutation(async ({ input }) => {
        const username = await reddit.getCurrentUsername();
        if (!username) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not logged in' });
        }
        const key = `user_earned_tier:${input.tier}:${username}`;
        if (input.earned) {
          await redis.set(key, 'true');
        } else {
          await redis.del(key);
        }
        await refreshUserTTL(username);
        return { success: true };
      }),

    /**
     * Get campaign tier earned status (Dev only)
     */
    getTierEarnedStatus: devProcedure.query(async () => {
      const username = await reddit.getCurrentUsername();
      if (!username) return { easy: false, medium: false, hard: false };

      const [easy, medium, hard] = await Promise.all([
        redis.get(`user_earned_tier:easy:${username}`),
        redis.get(`user_earned_tier:medium:${username}`),
        redis.get(`user_earned_tier:hard:${username}`),
      ]);

      return {
        easy: easy === 'true',
        medium: medium === 'true',
        hard: hard === 'true',
      };
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
  howto: t.router({
    getAll: publicProcedure.query(async () => {
      return await getTutorialPages();
    }),
    save: devProcedure
      .input(
        z.object({
          id: z.string(),
          order: z.number(),
          title: z.string(),
          subtitle: z.string().optional(),
          icon: z.string().optional(),
          description: z.string(),
          puzzle: z.object({
            width: z.number(),
            height: z.number(),
            player: z.object({ x: z.number(), y: z.number() }),
            walls: z.array(z.object({ x: z.number(), y: z.number() })),
            blocks: z.array(z.object({ id: z.string(), color: z.string(), x: z.number(), y: z.number() })),
            targets: z.array(z.object({ id: z.string(), color: z.string(), x: z.number(), y: z.number() })),
            portals: z.array(z.object({ id: z.string(), color: z.string(), x: z.number(), y: z.number(), dir: z.enum(['Up', 'Down', 'Left', 'Right']) })).optional(),
            solutionMoves: z.array(z.string()).optional(),
          }).optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await saveTutorialPage(input);
      }),
    delete: devProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        return await deleteTutorialPage(input.id);
      }),
    reorder: devProcedure
      .input(z.object({ pageIds: z.array(z.string()) }))
      .mutation(async ({ input }) => {
        return await reorderTutorialPages(input.pageIds);
      }),
  }),
});

export type AppRouter = typeof appRouter;
