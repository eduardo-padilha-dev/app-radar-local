import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    globalSetup: ['./test/setup-database.ts'],
    fileParallelism: false,
    root: './',
    include: ['**/*.e2e-spec.ts'],
  },
});
