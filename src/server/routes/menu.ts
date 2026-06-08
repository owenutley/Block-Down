import { Hono } from 'hono';
import type { UiResponse } from '@devvit/web/shared';
import { createPost } from '../core/post';
import { isDev } from '../dev';

export const menu = new Hono();

menu.post('/post-create', async (c) => {
  try {
    const isDeveloper = await isDev();
    if (!isDeveloper) {
      return c.json<UiResponse>(
        {
          showToast: 'You must be a developer of this app to perform this action.',
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
