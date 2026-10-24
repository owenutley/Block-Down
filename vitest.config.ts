import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    root: __dirname,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    typecheck: {
      enabled: false,
    },
    testTimeout: 15000,
    reporters: ['dot'],
    coverage: {
      enabled: false,
      provider: 'v8',
      reporter: ['text-summary', 'html'],
    },
  },
});

