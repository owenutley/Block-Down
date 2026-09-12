import { context, redis, reddit } from '@devvit/web/server';
import { Hono } from 'hono';
import type { OnAppInstallRequest, OnPostDeleteRequest, TriggerResponse } from '@devvit/web/shared';

import { createPost } from '../core/post';

export const triggers = new Hono();

triggers.post('/on-app-install', async (c) => {
  try {
    const post = await createPost();

    const input = await c.req.json<OnAppInstallRequest>();

    return c.json<TriggerResponse>(
      {
        status: 'success',
        message: `Post created in subreddit ${context.subredditName} with id ${post.id} (trigger: ${input.type})`,
      },
      200
    );
  } catch (error) {
    console.error(`Error creating post: ${error}`);
    return c.json<TriggerResponse>(
      {
        status: 'error',
        message: 'Failed to create post',
      },
      400
    );
  }
});

triggers.post('/on-post-delete', async (c) => {
  try {
    const input = await c.req.json<OnPostDeleteRequest>();
    const { postId } = input;

    if (postId) {
      const storedNum = await redis.get(`post_number:${postId}`);
      const promises = [
        redis.del(`post_puzzle:${postId}`),
        redis.del(`post_number:${postId}`),
      ];
      if (storedNum) {
        promises.push(redis.del(`number_post:${storedNum}`));
      }
      await Promise.all(promises);
    }

    return c.json<TriggerResponse>(
      {
        status: 'success',
        message: `Cleaned up mapping for deleted post ${postId}`,
      },
      200
    );
  } catch (error) {
    console.error(`Error handling onPostDelete trigger: ${error}`);
    return c.json<TriggerResponse>(
      {
        status: 'error',
        message: 'Failed to handle post deletion trigger',
      },
      400
    );
  }
});

triggers.post('/on-comment-create', async (c) => {
  try {
    const input = await c.req.json<{ commentId?: string; comment?: { id: string; body?: string } }>();
    const commentId = input.commentId || input.comment?.id;

    if (commentId) {
      const comment = await reddit.getCommentById(commentId);
      if (comment && comment.postId) {
        const postId = comment.postId;
        const parentId = comment.parentId;
        const scoresCommentId = await redis.get(`post_scores_comment:${postId}`);

        let isUnderScoresThread = false;
        if (scoresCommentId) {
          const formattedScoresId = scoresCommentId.startsWith('t1_') ? scoresCommentId : `t1_${scoresCommentId}`;
          if (parentId === formattedScoresId) {
            isUnderScoresThread = true;
          }
        }

        if (!isUnderScoresThread && parentId && parentId.startsWith('t1_')) {
          try {
            const parentComment = await reddit.getCommentById(parentId);
            if (parentComment?.body && parentComment.body.includes('--SCORES--')) {
              isUnderScoresThread = true;
            }
          } catch (e) {
            console.warn('Failed to fetch parent comment for score verification:', e);
          }
        }

        if (isUnderScoresThread) {
          const authorName = comment.authorName || '';
          const body = comment.body || '';

          // 1. Extract verification code
          const codeMatch = body.match(/BD-[A-F0-9]{4}-[A-F0-9]{4}/i);
          const claimedCode = codeMatch ? codeMatch[0].toUpperCase() : null;

          // 2. Extract metrics from text
          const pushesMatch = body.match(/Pushes\*?: \*\*(\d+)\*\*/i) || body.match(/Pushes\*?: (\d+)/i);
          const movesMatch = body.match(/Moves\*?: (\d+)/i);
          const timeMatch = body.match(/Solve Time\*?: (\d+)s/i) || body.match(/Solve Time\*?: (\d+)m (\d+)s/i);
          const spoilerMatch = body.match(/Block Order\*?: >!\s*(.*?)\s*!</i) || body.match(/>!\s*(.*?)\s*!</);

          let stars = 1;
          if (body.includes('⭐⭐⭐')) stars = 3;
          else if (body.includes('⭐⭐')) stars = 2;

          let solveSeconds = 0;
          if (timeMatch) {
            if (timeMatch[2] !== undefined) {
              solveSeconds = parseInt(timeMatch[1] || '0', 10) * 60 + parseInt(timeMatch[2] || '0', 10);
            } else {
              solveSeconds = parseInt(timeMatch[1] || '0', 10);
            }
          }

          const pushes = pushesMatch ? parseInt(pushesMatch[1] || '0', 10) : 0;
          const moves = movesMatch ? parseInt(movesMatch[1] || '0', 10) : 0;
          const blockOrder = spoilerMatch ? spoilerMatch[1]?.trim() || '' : '';

          const mappedPuzzleId = (await redis.get(`post_puzzle:${postId}`)) || 'p';

          let isLegit = false;
          if (claimedCode && pushes > 0) {
            const payload = `${mappedPuzzleId}:${authorName}:${pushes}:${moves}:${solveSeconds}:${stars}:${blockOrder}`;
            let hash = 0;
            for (let i = 0; i < payload.length; i++) {
              const char = payload.charCodeAt(i);
              hash = ((hash << 5) - hash) + char;
              hash |= 0;
            }
            const hex = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
            const expectedCode = `BD-${hex.slice(0, 4)}-${hex.slice(4, 8)}`;

            if (claimedCode === expectedCode) {
              isLegit = true;
            }
          }

          if (!isLegit) {
            console.warn(`Removing illegitimate score comment ${commentId} by u/${authorName}`);
            try {
              await comment.delete();
            } catch {
              try {
                await reddit.remove(comment.id);
              } catch (removeErr) {
                console.error('Failed to remove fake score comment:', removeErr);
              }
            }
          }
        }
      }
    }

    return c.json<TriggerResponse>(
      {
        status: 'success',
        message: `Processed comment creation trigger for comment ${commentId || 'unknown'}`,
      },
      200
    );
  } catch (error) {
    console.error(`Error handling onCommentCreate trigger: ${error}`);
    return c.json<TriggerResponse>(
      {
        status: 'error',
        message: 'Failed to handle comment creation trigger',
      },
      400
    );
  }
});

