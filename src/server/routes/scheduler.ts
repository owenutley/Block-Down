import { Hono } from 'hono';
import { createDailyPost } from '../core/post';
import { finalizeWeeklyChallenge } from '../core/weeklyChallenge';

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

scheduler.post('/weekly-challenge', async (c) => {
  try {
    const res = await finalizeWeeklyChallenge();
    return c.json({ status: 'success', weekId: res.weekId, winnersCount: res.winners.length }, 200);
  } catch (error) {
    console.error(`Error running weekly challenge scheduler: ${error}`);
    return c.json({ error: String(error) }, 500);
  }
});

