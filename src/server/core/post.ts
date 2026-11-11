import { redis, reddit, media, context } from '@devvit/web/server';
import { PREVIEW_DATA_URL } from './previewAsset';
import {
  assignDailyPuzzle,
  getDailyPuzzle,
  ensureDailyEasyPuzzle,
  ensureDailyStandardPuzzle,
  ensureDailyTierLevelPuzzle,
  getPuzzle,
  getProperDateFromPuzzleId,
  getLeaderboard,
  KEYS,
} from './puzzle';
import { awardPodiumFinish, addUserCurrency } from './progress';
import { SIX_TIER_ROLLOUT_NUMBER, DIFFICULTY_TIERS } from '../../shared/difficultyTiers';

/**
 * Calculates difficulty-scaled Light Whisps reward bonus for podium winners.
 * 1st place: 60 (Tier 1) to 250 (Tier 6)
 * 2nd place: ~60% of 1st place
 * 3rd place: ~30% of 1st place
 */
export const getPodiumWhispsReward = (tierLevel: number, place: 1 | 2 | 3): number => {
  const baseRewardByTier: Record<number, number> = {
    1: 60,   // Very Easy
    2: 80,   // Easy / Warm-Up
    3: 120,  // Medium / Standard
    4: 160,  // Hard
    5: 200,  // Very Hard
    6: 250,  // Extreme
  };
  const firstPlaceReward = baseRewardByTier[tierLevel] || 120;
  if (place === 1) return firstPlaceReward;
  if (place === 2) return Math.round(firstPlaceReward * 0.6);
  return Math.round(firstPlaceReward * 0.3);
};

/**
 * Redis key for tracking daily puzzle counter
 */
const DAILY_PUZZLE_COUNTER_KEY = 'daily-puzzle-counter';
const SHARE_IMAGE_CACHE_KEY = 'post_share_image_url_v2';

/**
 * Finalize previous daily puzzle leaderboards (24h after post),
 * award top 3 podium wins and scaled Light Whisps across all active difficulty tiers,
 * and post a comprehensive official winner summary comment.
 */
export const finalizePreviousDailyLeaderboards = async (): Promise<void> => {
  try {
    const today = getTodayDate();
    const currentDate = new Date(today);

    for (let i = 1; i <= 30; i++) {
      const pastDateObj = new Date(currentDate);
      pastDateObj.setDate(pastDateObj.getDate() - i);
      const pastDate = pastDateObj.toISOString().split('T')[0] || '';
      if (!pastDate) continue;

      const finalizedKey = `podium_finalized:${pastDate}`;
      const isFinalized = await redis.get(finalizedKey);
      if (isFinalized) continue;

      const postId = await redis.get(`date_post:${pastDate}`);
      if (!postId) continue;

      const postNum = await redis.get(`post_number:${postId}`);
      const puzzleNumText = postNum ? `#${postNum}` : pastDate;

      const formatVersion =
        (await redis.get(`post_format_version:${postId}`)) ||
        (await redis.get(`daily_format_version:${pastDate}`)) ||
        'v1_two_tier';

      type TierTarget = {
        label: string;
        tierLevel: number;
        puzzleId: string | null;
      };

      const tierTargets: TierTarget[] = [];

      if (formatVersion === 'v2_six_tier') {
        for (const meta of DIFFICULTY_TIERS) {
          let pId = await redis.get(`post_puzzle_tier:${postId}:${meta.key}`);
          if (!pId) {
            pId = await redis.get(KEYS.DAILY_TIER_PUZZLE(pastDate, meta.key));
          }
          if (pId) {
            tierTargets.push({
              label: `Tier ${meta.tier} • ${meta.name}`,
              tierLevel: meta.tier,
              puzzleId: pId,
            });
          }
        }
      } else {
        // v1_two_tier (or legacy)
        // 1. Warm-Up / Easy companion
        let easyId = await redis.get(`post_puzzle_easy:${postId}`);
        if (!easyId) {
          easyId = await redis.get(KEYS.DAILY_TIER_PUZZLE(pastDate, 'easy'));
        }

        // 2. Main Daily Challenge
        const daily = await getDailyPuzzle(pastDate);
        const mainId = daily?.puzzleId || (await redis.get(`post_puzzle:${postId}`));

        if (easyId && easyId !== mainId) {
          tierTargets.push({
            label: 'Warm-Up (Easy)',
            tierLevel: 2,
            puzzleId: easyId,
          });
        }

        if (mainId) {
          tierTargets.push({
            label: 'Daily Challenge',
            tierLevel: 3,
            puzzleId: mainId,
          });
        }
      }

      if (tierTargets.length === 0) continue;

      // Mark as finalized to prevent duplicate processing
      await redis.set(finalizedKey, 'true');

      const formatTime = (sec: number) => {
        if (sec < 60) return `${sec}s`;
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m}m ${s < 10 ? '0' : ''}${s}s`;
      };

      const medalIcons = ['🥇 1st Place', '🥈 2nd Place', '🥉 3rd Place'];
      const tierSections: string[] = [];

      for (const target of tierTargets) {
        if (!target.puzzleId) continue;
        const leaderboard = await getLeaderboard(target.puzzleId);

        let sectionContent = '';
        if (leaderboard.length === 0) {
          sectionContent = '_No completed solutions recorded for this tier._';
        } else {
          const top3 = leaderboard.slice(0, 3);
          const lines = await Promise.all(
            top3.map(async (entry, idx) => {
              const place = (idx + 1) as 1 | 2 | 3;
              const username = entry.username.startsWith('u/') ? entry.username : `u/${entry.username}`;
              const rawUsername = entry.username.replace(/^u\//, '');
              const whisps = getPodiumWhispsReward(target.tierLevel, place);

              // Award podium finish medal stats to player profile
              await awardPodiumFinish(rawUsername, place);

              // Award bonus Light Whisps currency to player account
              if (whisps > 0) {
                await addUserCurrency(rawUsername, whisps);
              }

              return `• ${medalIcons[idx]}: ${username} — ${entry.score} pushes, ${entry.moveCount} steps (${formatTime(entry.solveTime)}) (+${whisps} Whisps)`;
            })
          );
          sectionContent = lines.join('\n\n');
        }

        tierSections.push(`#### ⚡ **${target.label}**\n\n${sectionContent}`);
      }

      const commentText =
        `### 🏆 **Official Daily Puzzle ${puzzleNumText} Winners!**\n\n` +
        `Congratulations to the podium solvers across all difficulty tiers!\n\n` +
        `${tierSections.join('\n\n---\n\n')}\n\n` +
        `Thank you to everyone who competed! The next daily puzzle is live now!`;

      try {
        const targetId = (postId.startsWith('t3_') ? postId : `t3_${postId}`) as `t3_${string}`;
        const comment = await reddit.submitComment({
          id: targetId,
          text: commentText,
        });
        if (comment) {
          await comment.distinguish(true);
        }
      } catch (err) {
        console.error(`Failed to submit leaderboard summary comment on post ${postId}:`, err);
      }
    }
  } catch (error) {
    console.error('Error finalizing previous daily leaderboards:', error);
  }
};

/**
 * Uploads preview banner to Reddit CDN if not cached, returns https://i.redd.it/... URL
 */
export const getOrUploadShareImageUrl = async (): Promise<string | undefined> => {
  try {
    const cachedUrl = await redis.get(SHARE_IMAGE_CACHE_KEY);
    if (cachedUrl) {
      return cachedUrl;
    }

    const uploaded = await media.upload({
      url: PREVIEW_DATA_URL,
      type: 'image',
    });

    if (uploaded?.mediaUrl) {
      await redis.set(SHARE_IMAGE_CACHE_KEY, uploaded.mediaUrl);
      return uploaded.mediaUrl;
    }
  } catch (error) {
    console.error('Failed to upload share image to Reddit CDN:', error);
  }
  return undefined;
};

/**
 * Get the current daily puzzle counter
 */
export const getDailyPuzzleCounter = async (): Promise<number> => {
  const count = await redis.get(DAILY_PUZZLE_COUNTER_KEY);
  return count ? parseInt(count, 10) : 0;
};

/**
 * Increment and return the daily puzzle counter
 */
const incrementDailyPuzzleCounter = async (): Promise<number> => {
  const current = await getDailyPuzzleCounter();
  const next = current + 1;
  await redis.set(DAILY_PUZZLE_COUNTER_KEY, String(next));
  return next;
};

const getTodayDate = (): string => {
  const date = new Date();
  return date.toISOString().split('T')[0] || '';
};

export const createPost = async () => {
  const shareImageUrl = await getOrUploadShareImageUrl();
  const post = await reddit.submitCustomPost({
    title: 'block-down',
    styles: shareImageUrl ? { shareImageUrl } : undefined,
  });

  if (post?.id) {
    await redis.set(`main_app_post:${post.id}`, 'true');
    try {
      await reddit.approve(post.id);
    } catch (err) {
      console.warn('Post approval notice:', err);
    }

    try {
      const scoresComment = await reddit.submitComment({
        id: post.id,
        text: `🏆 **--SCORES & DISCUSSION--**\n\nShare your level completion scores, step orders, and feedback in reply to this comment!`,
      });
      if (scoresComment) {
        await scoresComment.distinguish(true);
        await redis.set(`post_scores_comment:${post.id}`, scoresComment.id);
      }
    } catch (err) {
      console.error('Failed to submit stickied scores comment on post:', err);
    }
  }

  return post;
};

export const createDailyPost = async (puzzleId?: string, date?: string) => {
  let targetDate = date;

  if (puzzleId && !targetDate) {
    targetDate = getProperDateFromPuzzleId(puzzleId) || undefined;
  }

  if (!targetDate) {
    targetDate = getTodayDate();
  }

  if (puzzleId) {
    const puzzle = await getPuzzle(puzzleId);
    if (!puzzle) {
      throw new Error(`Puzzle not found: ${puzzleId}`);
    }
    await assignDailyPuzzle(puzzleId, targetDate);
  }

  // Get and increment the daily puzzle counter
  const dailyPuzzleNumber = await incrementDailyPuzzleCounter();

  // Automatically ensure standard challenge puzzle exists (procedural generation if not found)
  const standardPuzzle = await ensureDailyStandardPuzzle(targetDate, dailyPuzzleNumber);
  await assignDailyPuzzle(standardPuzzle.id, targetDate);

  const daily = await getDailyPuzzle(targetDate);

  const shareImageUrl = await getOrUploadShareImageUrl();
  const title = `Daily Puzzle #${dailyPuzzleNumber}`;
  const post = await reddit.submitCustomPost({
    title,
    styles: shareImageUrl ? { shareImageUrl } : undefined,
  });

  if (post?.id) {
    await reddit.approve(post.id);
    if (daily && !daily.puzzleId.includes('easy')) {
      await redis.set(`post_puzzle:${post.id}`, daily.puzzleId);
      // Map to this brand new most recent post
      await redis.set(`puzzle_post:${daily.puzzleId}`, post.id);

      try {
        const easyPuzzle = await ensureDailyEasyPuzzle(targetDate, dailyPuzzleNumber);
        await redis.set(`post_puzzle_easy:${post.id}`, easyPuzzle.id);
        await redis.set(`puzzle_post:${easyPuzzle.id}`, post.id);
        await redis.set(`daily_tier:${targetDate}:easy`, easyPuzzle.id);
      } catch (err) {
        console.error('Failed to create/map easy companion puzzle for daily post:', err);
      }
    }
    await redis.set(`post_number:${post.id}`, dailyPuzzleNumber.toString());
    await redis.set(`date_post:${targetDate}`, post.id);
    await redis.set(`number_post:${dailyPuzzleNumber}`, post.id);

    if (dailyPuzzleNumber >= SIX_TIER_ROLLOUT_NUMBER) {
      await redis.set(`post_format_version:${post.id}`, 'v2_six_tier');
      await redis.set(`daily_format_version:${targetDate}`, 'v2_six_tier');
      for (const meta of DIFFICULTY_TIERS) {
        try {
          const tierPuz = await ensureDailyTierLevelPuzzle(targetDate, meta.tier, dailyPuzzleNumber);
          await redis.set(`post_puzzle_tier:${post.id}:${meta.key}`, tierPuz.id);
        } catch (err) {
          console.error(`Failed to pre-seed tier ${meta.tier} for daily post ${post.id}:`, err);
        }
      }
    }

    try {
      const scoresComment = await reddit.submitComment({
        id: post.id,
        text: `🏆 **--SCORES & COMMUNITY DISCUSSION--**\n\nShare your level completion scores and step orders below!\n\n• **Feedback & Suggestions**: Let us know your thoughts on today's puzzle difficulty.\n• **Bug Reports**: Let us know what happened and what device you are using.\n\nThank you for playing Block-Down!`,
      });
      if (scoresComment) {
        await scoresComment.distinguish(true);
        await redis.set(`post_scores_comment:${post.id}`, scoresComment.id);
      }
    } catch (err) {
      console.error('Failed to submit stickied scores comment on daily post:', err);
    }
  }

  // Finalize past daily leaderboards & award top 3 podium wins
  await finalizePreviousDailyLeaderboards();

  return post;
};

/**
 * Create a custom user puzzle post on Reddit immediately
 */
export const createUserPuzzlePost = async (puzzleId: string, puzzleName: string) => {
  const shareImageUrl = await getOrUploadShareImageUrl();
  const title = puzzleName && puzzleName.trim() ? puzzleName.trim() : 'Custom Block Down Puzzle';
  const subredditName = context.subredditName;

  // Submit strictly as USER
  const post = await reddit.submitCustomPost({
    title,
    subredditName,
    runAs: 'USER',
    userGeneratedContent: {
      text: title,
    },
    styles: shareImageUrl ? { shareImageUrl } : undefined,
  });

  if (post?.id) {
    try {
      await reddit.approve(post.id);
    } catch (err) {
      console.warn('Post approval skipped or failed:', err);
    }

    // Try applying flair safely if template exists on subreddit
    if (subredditName) {
      try {
        await reddit.setPostFlair({
          subredditName,
          postId: post.id,
          text: 'Player Challenge',
        });
      } catch (flairErr) {
        console.warn('Could not apply "Player Challenge" post flair:', flairErr);
      }
    }

    const rawId = post.id.replace(/^t3_/, '');
    await redis.set(`post_puzzle:${post.id}`, puzzleId);
    await redis.set(`post_puzzle:t3_${rawId}`, puzzleId);
    await redis.set(`post_puzzle:${rawId}`, puzzleId);
    await redis.set(`puzzle_post:${puzzleId}`, post.id);

    try {
      const scoresComment = await reddit.submitComment({
        id: post.id,
        text: `🏆 **--SCORES--**\n\nShare your level completion scores and step orders below!`,
      });
      if (scoresComment) {
        await scoresComment.distinguish(true);
        await redis.set(`post_scores_comment:${post.id}`, scoresComment.id);
      }
    } catch (err) {
      console.warn('Failed to submit --SCORES-- comment on custom puzzle post:', err);
    }
  }

  return post;
};

/**
 * Rebuild post mappings dynamically for up to 100 recent daily posts
 */
export const syncDailyPostsWithPuzzles = async (): Promise<{ success: boolean; syncedCount: number }> => {
  const { subredditName } = context;
  if (!subredditName) {
    throw new Error('No subreddit context');
  }

  const postsListing = await reddit.getNewPosts({
    subredditName,
    limit: 100,
  });
  const posts = await postsListing.all();

  let syncedCount = 0;
  const seenPuzzles = new Set<string>();

  for (const post of posts) {
    if (!post.title) continue;

    const match = post.title.match(/Daily Puzzle #(\d+)/i);
    if (!match) continue;

    const numStr = match[1];
    if (!numStr) continue;

    const dateObj = typeof post.createdAt === 'object' ? post.createdAt : new Date(post.createdAt);
    const postDate = dateObj.toISOString().split('T')[0];
    if (!postDate) continue;

    // Always record the general mapping indexes
    await redis.set(`date_post:${postDate}`, post.id);
    await redis.set(`post_number:${post.id}`, numStr);
    await redis.set(`number_post:${numStr}`, post.id);

    // Check if this post already has a stored puzzle mapping (e.g. repeated daily puzzle)
    let puzzleId = await redis.get(`post_puzzle:${post.id}`);
    if (!puzzleId) {
      puzzleId = `daily-${postDate}`;
    }
    let puzzle = await getPuzzle(puzzleId);
    if (!puzzle) {
      const parsedNum = parseInt(numStr, 10);
      puzzle = await ensureDailyStandardPuzzle(postDate, isNaN(parsedNum) ? undefined : parsedNum);
      puzzleId = puzzle.id;
    }
    if (puzzle) {
      await redis.set(`post_puzzle:${post.id}`, puzzleId);
      // Since posts are ordered newest to oldest, the first post encountered is the most recent
      if (!seenPuzzles.has(puzzleId)) {
        await redis.set(`puzzle_post:${puzzleId}`, post.id);
        seenPuzzles.add(puzzleId);
      }
      await assignDailyPuzzle(puzzleId, postDate);
      try {
        const easyPuzzle = await ensureDailyEasyPuzzle(postDate, parseInt(numStr, 10));
        await redis.set(`post_puzzle_easy:${post.id}`, easyPuzzle.id);
      } catch (err) {
        console.error('Failed to sync easy puzzle for post:', err);
      }
    }
    syncedCount++;
  }

  return { success: true, syncedCount };
};

/**
 * Look up the Reddit post ID corresponding to a given puzzle ID or puzzle number.
 * Resolves to the most recent accurate puzzle posting when a puzzle is repeated.
 */
export const getPostIdForPuzzle = async (
  puzzleId?: string,
  puzzleNumber?: number
): Promise<string | null> => {
  // 1. If explicit puzzleNumber provided (e.g. Daily Puzzle #45), check if that exact post exists
  if (puzzleNumber && puzzleNumber > 0) {
    const numberPostId = await redis.get(`number_post:${puzzleNumber}`);
    if (numberPostId) {
      return numberPostId;
    }
  }

  if (!puzzleId) {
    return context.postId || null;
  }

  // 2. If current context post matches this puzzle, player is actively playing in this post
  if (context.postId) {
    const ctxMappedPuzzle = await redis.get(`post_puzzle:${context.postId}`);
    if (ctxMappedPuzzle === puzzleId) {
      return context.postId;
    }
  }

  // 3. Direct reverse mapping key (stores the most recent accurate post)
  const mappedPostId = await redis.get(`puzzle_post:${puzzleId}`);
  if (mappedPostId) {
    return mappedPostId;
  }

  const puzzle = await getPuzzle(puzzleId);

  // If this puzzle is explicitly part of the campaign / tutorial, it has no post
  if (
    puzzle &&
    (puzzle.difficulty === 'easy' ||
      puzzle.difficulty === 'medium' ||
      puzzle.difficulty === 'hard' ||
      puzzle.difficulty === 'tutorial')
  ) {
    return null;
  }

  // 4. For daily puzzles, check date mapping
  const dailyDate = getProperDateFromPuzzleId(puzzleId);
  if (dailyDate) {
    const datePostId = await redis.get(`date_post:${dailyDate}`);
    if (datePostId) {
      await redis.set(`puzzle_post:${puzzleId}`, datePostId);
      return datePostId;
    }
  }

  // 5. Check if puzzle object contains postId
  if (puzzle?.postId) {
    await redis.set(`puzzle_post:${puzzleId}`, puzzle.postId);
    return puzzle.postId;
  }

  // 6. Search recent posts in subreddit (ordered newest to oldest) to find the most recent accurate post
  try {
    const { subredditName } = context;
    if (subredditName) {
      const postsListing = await reddit.getNewPosts({
        subredditName,
        limit: 100,
      });
      const posts = await postsListing.all();
      for (const p of posts) {
        const storedPuzzleId = await redis.get(`post_puzzle:${p.id}`);
        if (storedPuzzleId === puzzleId) {
          await redis.set(`puzzle_post:${puzzleId}`, p.id);
          return p.id;
        }

        const match = p.title?.match(/Daily Puzzle #(\d+)/i);
        if (match && match[1]) {
          const num = parseInt(match[1], 10);
          const mappedToNum = await redis.get(`number_post:${num}`);
          if (mappedToNum === p.id) {
            const numPuzzleId = await redis.get(`post_puzzle:${p.id}`);
            if (numPuzzleId === puzzleId) {
              await redis.set(`puzzle_post:${puzzleId}`, p.id);
              return p.id;
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn('Failed searching recent subreddit posts for puzzle post ID:', err);
  }

  // 7. Fallback to context.postId if available
  if (context.postId) {
    return context.postId;
  }

  return null;
};

/**
 * Creates a Reddit post directly advertising the Slide Match Endless Runner gameplay
 */
export const createSlideMatchPost = async (stageId?: string) => {
  const shareImageUrl = await getOrUploadShareImageUrl();
  const title = 'Slide Match';
  const post = await reddit.submitCustomPost({
    title,
    styles: shareImageUrl ? { shareImageUrl } : undefined,
  });

  if (post?.id) {
    await redis.set(`slidematch_post:${post.id}`, 'true');
    if (stageId) {
      await redis.set(`post_slidematch_stage:${post.id}`, stageId);
      await redis.set(`slidematch_stage_post:${stageId}`, post.id);
    }
    try {
      await reddit.approve(post.id);
    } catch (err) {
      console.warn('Post approval notice:', err);
    }

    try {
      const comment = await reddit.submitComment({
        id: post.id,
        text: `**SLIDE MATCH: ENDLESS SPEED RUNNER**\n\nHow far can you push your puzzle instincts before the clock hits zero?\n\n• **30-Second Limit**: Solve each sliding block puzzle before time runs out!\n• **Procedural Stages**: Endless progressive challenges starting simple and getting progressively deeper.\n• **Light Whisps & Rewards**: Collect Light Whisps for every single stage cleared.\n\nDrop your highest stage and best high scores in the replies!`,
      });
      if (comment) {
        await comment.distinguish(true);
        await redis.set(`post_scores_comment:${post.id}`, comment.id);
      }
    } catch (err) {
      console.error('Failed to submit comment on slide match post:', err);
    }
  }

  return post;
};

