/**
 * Captures README screenshots from a running local stack seeded with the demo account.
 *   1. backend: npm run db:seed && npm run dev
 *   2. web:     npm run dev
 *   3. web:     npm run screenshots
 */
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const WEB_URL = process.env.WEB_URL ?? 'http://localhost:5173';
const OUTPUT_DIR = fileURLToPath(new URL('../../docs/screenshots/', import.meta.url));
const DEMO_ACCOUNT = { email: 'demo@orbit.test', password: 'DemoPass123' };
const SCENE_SETTLE_MS = 2500;

const outputPath = (name) => join(OUTPUT_DIR, `${name}.png`);

async function signIn(page) {
  await page.goto(`${WEB_URL}/login`);
  await page.getByLabel('Email address').fill(DEMO_ACCOUNT.email);
  await page.getByLabel('Password', { exact: true }).fill(DEMO_ACCOUNT.password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('**/dashboard');
}

async function captureDesktop(browser) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const page = await context.newPage();

  await page.goto(`${WEB_URL}/register`);
  await page.locator('aside canvas').waitFor();
  await page.waitForTimeout(SCENE_SETTLE_MS);
  await page.screenshot({ path: outputPath('register-desktop') });

  await page.goto(`${WEB_URL}/login`);
  await page.locator('aside canvas').waitFor();
  await page.waitForTimeout(SCENE_SETTLE_MS);
  await page.screenshot({ path: outputPath('login-desktop') });

  await signIn(page);
  await page.getByRole('heading', { name: 'Up next' }).waitFor();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: outputPath('dashboard'), fullPage: true });

  await page.getByRole('link', { name: 'Projects' }).first().click();
  await page.getByRole('article').first().waitFor();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: outputPath('projects'), fullPage: true });

  await page.getByRole('link', { name: 'Website Redesign' }).click();
  await page.getByRole('list', { name: 'Tasks' }).waitFor();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: outputPath('project-detail'), fullPage: true });

  await page.getByRole('button', { name: 'New task' }).click();
  await page.getByRole('dialog', { name: 'New task' }).waitFor();
  await page.waitForTimeout(400);
  await page.screenshot({ path: outputPath('task-form') });

  await context.close();
}

async function captureMobile(browser) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();

  await page.goto(`${WEB_URL}/login`);
  await page.locator('canvas').waitFor();
  await page.waitForTimeout(SCENE_SETTLE_MS);
  await page.screenshot({ path: outputPath('login-mobile') });

  await signIn(page);
  await page.getByRole('heading', { name: 'Up next' }).waitFor();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: outputPath('dashboard-mobile') });

  await context.close();
}

await mkdir(OUTPUT_DIR, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
try {
  await captureDesktop(browser);
  await captureMobile(browser);
  console.log(`Screenshots saved to ${OUTPUT_DIR}`);
} finally {
  await browser.close();
}
