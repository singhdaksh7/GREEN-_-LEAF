import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
    setupFiles: ['test/helpers/setupEnv.ts'],
    globals: true,
    hookTimeout: 120000,
    testTimeout: 30000,
    // All integration test files share one MySQL test database
    // (TEST_DATABASE_URL, see test/helpers/testDb.ts) and clear its tables
    // between tests rather than each getting an isolated instance — run
    // them one at a time so state from concurrently-running files never
    // interleaves.
    fileParallelism: false,
  },
});
