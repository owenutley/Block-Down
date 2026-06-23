import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    pool: 'forks',
    include: [],
    exclude: ['**/node_modules/**', '**/dist/**'],
    // Needed due to the custom conditions within devvit web
    typecheck: {
      enabled: false,
    },
    reporters: ['dot'],
    coverage: {
      enabled: true,
      provider: 'v8',
      reporter: ['text-summary', 'html'],
    },
    projects: [
      {
        test: {
          name: 'server',
          include: ['src/server/**/*.test.ts'],
          exclude: ['**/node_modules/**', '**/dist/**', '**/src/client/**'],
          environment: 'node',
        },
      },
      {
        test: {
          name: 'client',
          include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
          exclude: ['**/node_modules/**', '**/dist/**', '**/src/server/**'],
          environment: 'jsdom',
        },
      },
    ],
  },
});
