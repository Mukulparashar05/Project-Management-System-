/**
 * Cross-platform workflow: web and mobile share one account, one API and one database.
 * The web side runs in Chrome; the mobile side is the real React Native app running under
 * Jest (mobile/__tests__/live) against the same API instance. Requires mobile dependencies.
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import { E2E_API_URL } from './support/env.js';
import { loginViaUi, PASSWORD, uniqueEmail } from './support/helpers.js';

const MOBILE_DIR = resolve(import.meta.dirname, '../../mobile');

function startMobilePhase(phase, environment) {
  const child = spawn('npx', ['jest', '--config', 'jest.live.config.js', '--runInBand', '-t', `phase ${phase}`], {
    cwd: MOBILE_DIR,
    env: { ...process.env, ...environment, CI: 'true' },
  });
  let output = '';
  child.stdout.on('data', (chunk) => (output += chunk));
  child.stderr.on('data', (chunk) => (output += chunk));
  const finished = new Promise((resolvePromise) => child.on('exit', (code) => resolvePromise({ code, output })));
  return { finished };
}

async function waitForFile(path, timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs;
  while (!existsSync(path)) {
    if (Date.now() > deadline) throw new Error(`Timed out waiting for ${path}`);
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 100));
  }
}

test.skip(!existsSync(join(MOBILE_DIR, 'node_modules')), 'Install mobile dependencies to run this test.');

test('changes made on one platform show up on the other after a refresh', async ({ page }) => {
  test.setTimeout(180_000);
  const syncDir = mkdtempSync(join(tmpdir(), 'orbit-sync-'));
  const account = { email: uniqueEmail('cross'), password: PASSWORD };
  const projectName = `Cross-platform ${Date.now()}`;
  const mobileEnvironment = {
    ORBIT_LIVE_API_URL: E2E_API_URL,
    ORBIT_LIVE_EMAIL: account.email,
    ORBIT_LIVE_PASSWORD: account.password,
    ORBIT_LIVE_PROJECT: projectName,
    ORBIT_LIVE_SYNC_DIR: syncDir,
  };

  try {
    // 1-3. Web: register, create a project and a task.
    await page.goto('/register');
    await page.getByLabel('Full name').fill('Cross Platform');
    await page.getByLabel('Email address').fill(account.email);
    await page.getByLabel('Password', { exact: true }).fill(account.password);
    await page.getByLabel('Confirm password').fill(account.password);
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page).toHaveURL(/\/dashboard$/);

    await page.getByRole('link', { name: 'Projects' }).first().click();
    await page.getByRole('button', { name: 'New project' }).first().click();
    await page.getByRole('dialog', { name: 'New project' }).getByLabel('Project name').fill(projectName);
    await page.getByRole('dialog', { name: 'New project' }).getByRole('button', { name: 'Create project' }).click();
    await page.getByRole('link', { name: projectName }).click();
    await page.getByRole('button', { name: 'New task' }).click();
    await page.getByRole('dialog', { name: 'New task' }).getByLabel('Task name').fill('Created on web');
    await page.getByRole('dialog', { name: 'New task' }).getByRole('button', { name: 'Create task' }).click();
    await expect(page.getByText('Task “Created on web” created')).toBeVisible();
    const projectUrl = page.url();

    // 4-6. Mobile: same account sees the project and task, completes it, raises its priority
    // and creates a new task.
    const phaseOne = await startMobilePhase(1, mobileEnvironment).finished;
    expect(phaseOne.code, phaseOne.output).toBe(0);

    // 9-10. Web: a refresh shows every change made on the phone.
    await page.goto(projectUrl);
    await expect(page.getByRole('checkbox', { name: 'Mark “Created on web” as not completed' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    await expect(page.getByLabel('Priority of Created on web')).toHaveValue('HIGH');
    await expect(page.getByText('Created on Android')).toBeVisible();
    await expect(page.getByText('1 of 2 tasks completed')).toBeVisible();

    // Reverse direction with pull-to-refresh: the phone has the project open while the web
    // changes a task; the phone sees it after pulling to refresh.
    const phaseTwo = startMobilePhase(2, mobileEnvironment);
    await waitForFile(join(syncDir, 'web-change.ready'));
    await page.reload();
    await page.getByLabel('Status of Created on Android').selectOption('IN_PROGRESS');
    await expect(page.getByText('Status set to In progress')).toBeVisible();
    await page.getByRole('button', { name: 'Edit Created on web' }).click();
    await page.getByRole('dialog', { name: 'Edit task' }).getByLabel('Task name').fill('Renamed on web');
    await page.getByRole('dialog', { name: 'Edit task' }).getByRole('button', { name: 'Save changes' }).click();
    await expect(page.getByText('Task updated')).toBeVisible();
    writeFileSync(join(syncDir, 'web-change.done'), '');

    const result = await phaseTwo.finished;
    expect(result.code, result.output).toBe(0);
  } finally {
    rmSync(syncDir, { recursive: true, force: true });
  }
});
