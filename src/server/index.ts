import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { trpcServer } from '@hono/trpc-server';

import { createServer, getServerPort } from '@devvit/web/server';
import { menu } from './routes/menu';
import { triggers } from './routes/triggers';
import { appRouter } from './trpc';
import { createContext } from './context';
import { createDailyPost } from './core/post';

const app = new Hono();

const devvitGlobal = globalThis as any;
if (typeof devvitGlobal.Devvit?.addSchedulerJob === 'function') {
  devvitGlobal.Devvit.addSchedulerJob(
    {
      name: 'block-down.daily-post',
      cron: '0 0 * * *',
      timezone: 'UTC',
    },
    async () => {
      try {
        await createDailyPost();
      } catch (error) {
        console.error('Failed to create daily post:', error);
      }
    }
  );
}

const api = new Hono();
api.use(
  '/trpc/*',
  trpcServer({
    endpoint: '/api/trpc',
    router: appRouter,
    createContext,
  })
);

const internal = new Hono();
internal.route('/menu', menu);
internal.route('/triggers', triggers);

app.route('/api', api);
app.route('/internal', internal);

serve({
  fetch: app.fetch,
  createServer: createServer,
  port: getServerPort(),
});
