import { existsSync, readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { defineConfig } from '@playwright/test';
import {
  E2E_API_PORT,
  E2E_API_URL,
  E2E_JWT_SECRET,
  E2E_WEB_PORT,
  E2E_WEB_URL,
} from './e2e/support/env.js';

// End-to-end tests run the real API against the throwaway *_test database from backend/.env.
const backendEnvPath = '../backend/.env';
const backendEnv = existsSync(backendEnvPath) ? parseEnv(readFileSync(backendEnvPath, 'utf8')) : {};
const testDatabaseUrl = process.env.TEST_DATABASE_URL ?? backendEnv.TEST_DATABASE_URL;

if (!testDatabaseUrl?.split('?')[0].endsWith('_test')) {
  throw new Error('Set TEST_DATABASE_URL (database name ending in _test) in backend/.env to run E2E tests.');
}

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [['list']],
  use: {
    baseURL: E2E_WEB_URL,
    // Uses the locally installed Google Chrome instead of downloading a browser build.
    channel: 'chrome',
    viewport: { width: 1440, height: 900 },
    reducedMotion: 'reduce',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: [
    {
      command: 'npx prisma migrate deploy && node src/server.js',
      cwd: '../backend',
      url: `${E2E_API_URL}/health`,
      reuseExistingServer: false,
      timeout: 90_000,
      env: {
        NODE_ENV: 'test',
        PORT: String(E2E_API_PORT),
        DATABASE_URL: testDatabaseUrl,
        JWT_SECRET: E2E_JWT_SECRET,
        JWT_EXPIRES_IN: '1h',
        CORS_ORIGINS: E2E_WEB_URL,
        AUTH_RATE_LIMIT_MAX: '500',
        API_RATE_LIMIT_MAX: '100000',
        BCRYPT_SALT_ROUNDS: '4',
        PRISMA_HIDE_UPDATE_MESSAGE: '1',
      },
    },
    {
      command: `npx vite --port ${E2E_WEB_PORT} --strictPort`,
      url: E2E_WEB_URL,
      reuseExistingServer: false,
      timeout: 60_000,
      env: { VITE_API_URL: E2E_API_URL },
    },
  ],
});
