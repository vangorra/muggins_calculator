import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.spec.ts'],
    coverage: {
      include: ['src/**/*.ts'],
      exclude: ['src/main.ts', 'src/worker.ts'],
      reporter: ['text', 'lcov'],
    },
  },
});
