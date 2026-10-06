import { execSync } from 'node:child_process';
import { resolveTestDatabaseUrl } from './testDatabaseUrl.js';

// Recreates the test database from the committed migrations before the suite runs.
export default function setup() {
  execSync('npx prisma migrate reset --force --skip-seed --skip-generate', {
    env: { ...process.env, DATABASE_URL: resolveTestDatabaseUrl(), PRISMA_HIDE_UPDATE_MESSAGE: '1' },
    stdio: 'pipe',
  });
}
