import { defineConfig } from 'vitest/config';
import { resolveTestDatabaseUrl } from './tests/testDatabaseUrl.js';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
    globalSetup: './tests/globalSetup.js',
    // All test files share one database, so they run one at a time.
    fileParallelism: false,
    testTimeout: 15_000,
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: resolveTestDatabaseUrl(),
      JWT_SECRET: 'test-only-secret-with-at-least-32-characters',
      JWT_EXPIRES_IN: '1h',
      BCRYPT_SALT_ROUNDS: '4',
      AUTH_RATE_LIMIT_MAX: '1000',
      API_RATE_LIMIT_MAX: '100000',
      CORS_ORIGINS: 'http://localhost:5173',
    },
  },
});
