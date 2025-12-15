import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Run tests in sequential mode (one at a time)
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    // Test timeouts
    testTimeout: 600000, // 10 minutes per test
    hookTimeout: 60000, // 1 minute for beforeAll/afterAll hooks
    // Only run integration tests when explicitly specified
    include: ['tests/integration/**/*.test.ts'],
  },
});
