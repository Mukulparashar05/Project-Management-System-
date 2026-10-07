import { createHmac, randomUUID } from 'node:crypto';
import { expect } from '@playwright/test';
import { E2E_API_URL, E2E_JWT_SECRET } from './env.js';

export const PASSWORD = 'Password123';
export const TOKEN_STORAGE_KEY = 'orbit.authToken';

let sequence = 0;
export function uniqueEmail(prefix = 'e2e') {
  sequence += 1;
  return `${prefix}-${Date.now()}-${sequence}@example.test`;
}

export async function registerViaApi(request, overrides = {}) {
  const user = { fullName: 'E2E User', email: uniqueEmail(), password: PASSWORD, ...overrides };
  const response = await request.post(`${E2E_API_URL}/auth/register`, { data: user });
  expect(response.status()).toBe(201);
  const { token } = (await response.json()).data;
  return { ...user, token };
}

export async function apiCall(request, token, method, path, data) {
  const response = await request.fetch(`${E2E_API_URL}${path}`, {
    method,
    data,
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(response.ok(), `${method} ${path} -> ${response.status()}`).toBeTruthy();
  return (await response.json()).data;
}

export async function loginViaUi(page, { email, password = PASSWORD }) {
  await page.goto('/login');
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

/** Signs an already-expired HS256 token the same way the API does. */
export function signExpiredToken(userId) {
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const header = encode({ alg: 'HS256', typ: 'JWT' });
  const payload = encode({ sub: userId, jti: randomUUID(), iss: 'orbit-pms-api', iat: now - 7200, exp: now - 3600 });
  const signature = createHmac('sha256', E2E_JWT_SECRET).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${signature}`;
}
