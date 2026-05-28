import { Hono } from 'hono';
import { createDailyPost } from '../core/post';

export const scheduler = new Hono();

scheduler.post('/daily-post', async (c) => {
  try {
    await createDailyPost();
    return c.json({ status: 'success' }, 200);
  } catch (error) {
    console.error(`Error running daily post scheduler: ${error}`);
    return c.json({ error: String(error) }, 500);
  }
});
