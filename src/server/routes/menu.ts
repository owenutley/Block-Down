import { Hono } from 'hono';
import type { UiResponse } from '@devvit/web/shared';
import { createPost } from '../core/post';
import { isAdmin } from '../admin';

export const menu = new Hono();

menu.post('/post-create', async (c) => {
  try {
    const isMod = await isAdmin();
    if (!isMod) {
      return c.json<UiResponse>(
        {
          showToast: 'You must be a moderator of this subreddit to perform this action.',
        },
        403
      );
    }

    const post = await createPost();

    return c.json<UiResponse>(
      {
        navigateTo: `https://reddit.com/comments/${post.id}`,
      },
      200
    );
  } catch (error) {
    console.error(`Error creating post: ${error}`);
    return c.json<UiResponse>(
      {
        showToast: 'Failed to create post',
      },
      400
    );
  }
});
