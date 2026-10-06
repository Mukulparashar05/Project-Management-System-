import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

// Must run before the app modules are imported, because the limiter reads its config at load time.
vi.hoisted(() => {
  process.env.AUTH_RATE_LIMIT_MAX = '3';
});

const { api, prisma, resetDatabase } = await import('./helpers.js');

beforeAll(resetDatabase);
afterAll(() => prisma.$disconnect());

describe('authentication rate limiting', () => {
  it('blocks repeated failed logins from the same IP with 429', async () => {
    const attempt = () =>
      api().post('/api/auth/login').send({ email: 'victim@example.test', password: 'Guess12345' });

    for (let i = 0; i < 3; i += 1) {
      const response = await attempt();
      expect(response.status).toBe(401);
    }

    const blocked = await attempt();
    expect(blocked.status).toBe(429);
    expect(blocked.body).toEqual({
      success: false,
      message: 'Too many authentication attempts. Please wait a few minutes and try again.',
      code: 'RATE_LIMITED',
    });
    expect(blocked.headers).toHaveProperty('ratelimit-policy');
  });
});
