import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    pool: 'forks',
    exclude: ['**/node_modules/**', '**/dist/**'],
    typecheck: {
      enabled: false,
    },
    reporters: ['dot'],
    coverage: {
      enabled: false,
      provider: 'v8',
      reporter: ['text-summary', 'html'],
    },
  },
});
