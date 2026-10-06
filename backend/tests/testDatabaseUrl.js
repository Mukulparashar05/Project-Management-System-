import { existsSync, readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';

/**
 * Resolves the test database URL from the environment or backend/.env and refuses to run
 * against anything that is not clearly a test database, because the suite truncates tables.
 */
export function resolveTestDatabaseUrl() {
  const fileEnv = existsSync('.env') ? parseEnv(readFileSync('.env', 'utf8')) : {};
  const url = process.env.TEST_DATABASE_URL ?? fileEnv.TEST_DATABASE_URL;

  if (!url) {
    throw new Error('TEST_DATABASE_URL is not set. Add it to backend/.env (see .env.example).');
  }

  const databaseName = new URL(url).pathname.replace(/^\//, '');
  if (!databaseName.endsWith('_test')) {
    throw new Error(`Refusing to run tests against "${databaseName}": the name must end in _test.`);
  }

  return url;
}
