import { context, redis } from '@devvit/web/server';
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
      await Promise.all([
        redis.del(`post_puzzle:${postId}`),
        redis.del(`post_number:${postId}`),
      ]);
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
