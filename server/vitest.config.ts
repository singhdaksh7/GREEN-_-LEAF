import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
    globals: true,
    hookTimeout: 120000,
    testTimeout: 30000,
    // Integration test files each spin up their own in-memory MongoDB
    // replica set; running them one at a time keeps memory/CPU usage
    // predictable in CI instead of starting several mongod instances at once.
    fileParallelism: false,
  },
});
