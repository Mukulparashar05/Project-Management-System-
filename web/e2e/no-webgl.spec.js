import { expect, test } from '@playwright/test';
import { loginViaUi, registerViaApi } from './support/helpers.js';

// Browser launch flags must be set per file: this whole file runs with WebGL turned off.
test.use({ launchOptions: { args: ['--disable-3d-apis', '--disable-webgl'] } });

test('shows the static illustration without WebGL and login still works', async ({ page, request }) => {
  const user = await registerViaApi(request);
  await page.goto('/login');
  await expect(page.getByTestId('scene-fallback')).toBeVisible();
  await expect(page.locator('canvas')).toHaveCount(0);
  await loginViaUi(page, user);
});
