import jwt from 'jsonwebtoken';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { api, prisma, registerUser, resetDatabase } from './helpers.js';

beforeEach(resetDatabase);
afterAll(() => prisma.$disconnect());

const validUser = { fullName: 'Ada Example', email: 'ada@example.test', password: 'Password123' };

describe('POST /api/auth/register', () => {
  it('creates an account, hashes the password and returns a token without sensitive fields', async () => {
    const response = await api().post('/api/auth/register').send(validUser);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Account created successfully');
    expect(response.body.data.user).toMatchObject({ fullName: 'Ada Example', email: 'ada@example.test' });
    expect(response.body.data.token).toEqual(expect.any(String));
    expect(JSON.stringify(response.body)).not.toMatch(/password/i);

    const stored = await prisma.user.findUnique({ where: { email: 'ada@example.test' } });
    expect(stored.passwordHash).not.toBe(validUser.password);
    expect(stored.passwordHash).toMatch(/^\$2[aby]\$\d{2}\$/);
  });

  it('normalises the email address before storing it', async () => {
    const response = await api()
      .post('/api/auth/register')
      .send({ ...validUser, email: '  Ada@Example.TEST ' });

    expect(response.status).toBe(201);
    expect(response.body.data.user.email).toBe('ada@example.test');
  });

  it('rejects a duplicate email with 409, regardless of letter case', async () => {
    await api().post('/api/auth/register').send(validUser);
    const response = await api()
      .post('/api/auth/register')
      .send({ ...validUser, email: 'ADA@example.test' });

    expect(response.status).toBe(409);
    expect(response.body).toEqual({
      success: false,
      message: 'An account with this email already exists',
      code: 'EMAIL_IN_USE',
    });
  });

  it.each([
    [{ ...validUser, fullName: '   ' }, 'fullName'],
    [{ ...validUser, email: 'not-an-email' }, 'email'],
    [{ ...validUser, password: 'short1' }, 'password'],
    [{ ...validUser, password: 'onlyletters' }, 'password'],
    [{ ...validUser, password: '12345678' }, 'password'],
    [{ ...validUser, password: `${'a1'.repeat(37)}` }, 'password'],
    [{ email: 'ada@example.test', password: 'Password123' }, 'fullName'],
  ])('rejects invalid input %# with 400', async (payload, field) => {
    const response = await api().post('/api/auth/register').send(payload);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.code).toBe('VALIDATION_ERROR');
    expect(response.body.errors.map((error) => error.field)).toContain(field);
  });

  it('rejects unexpected fields instead of silently accepting them', async () => {
    const response = await api()
      .post('/api/auth/register')
      .send({ ...validUser, role: 'admin' });

    expect(response.status).toBe(400);
    expect(response.body.errors[0].field).toBe('role');
  });
});

describe('POST /api/auth/login', () => {
  it('logs in with valid credentials', async () => {
    await registerUser(validUser);
    const response = await api()
      .post('/api/auth/login')
      .send({ email: 'ADA@example.test', password: 'Password123' });

    expect(response.status).toBe(200);
    expect(response.body.data.user.email).toBe('ada@example.test');
    expect(response.body.data.token).toEqual(expect.any(String));
    expect(JSON.stringify(response.body)).not.toMatch(/passwordHash/);
  });

  it('returns the same 401 for a wrong password and for an unknown email', async () => {
    await registerUser(validUser);
    const wrongPassword = await api()
      .post('/api/auth/login')
      .send({ email: validUser.email, password: 'WrongPassword1' });
    const unknownEmail = await api()
      .post('/api/auth/login')
      .send({ email: 'nobody@example.test', password: 'Password123' });

    for (const response of [wrongPassword, unknownEmail]) {
      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        success: false,
        message: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS',
      });
    }
  });

  it('validates login input', async () => {
    const response = await api().post('/api/auth/login').send({ email: 'ada@example.test' });

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual([{ field: 'password', message: 'Password is required' }]);
  });
});

describe('GET /api/auth/me', () => {
  it('returns the authenticated user', async () => {
    const { user, auth } = await registerUser(validUser);
    const response = await api().get('/api/auth/me').set(auth);

    expect(response.status).toBe(200);
    expect(response.body.data.user).toEqual(user);
  });

  it('requires a token', async () => {
    const response = await api().get('/api/auth/me');

    expect(response.status).toBe(401);
    expect(response.body.code).toBe('AUTH_REQUIRED');
  });

  it('rejects a malformed token', async () => {
    const response = await api().get('/api/auth/me').set('Authorization', 'Bearer not-a-jwt');

    expect(response.status).toBe(401);
    expect(response.body.code).toBe('TOKEN_INVALID');
  });

  it('rejects an expired token with a clear session-expired message', async () => {
    const { user } = await registerUser(validUser);
    const expiredToken = jwt.sign(
      { exp: Math.floor(Date.now() / 1000) - 60 },
      process.env.JWT_SECRET,
      { algorithm: 'HS256', issuer: 'orbit-pms-api', subject: user.id, jwtid: crypto.randomUUID() },
    );

    const response = await api().get('/api/auth/me').set('Authorization', `Bearer ${expiredToken}`);

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      success: false,
      message: 'Your session has expired. Please log in again.',
      code: 'TOKEN_EXPIRED',
    });
  });

  it('rejects a token signed with a different secret', async () => {
    const { user } = await registerUser(validUser);
    const forged = jwt.sign({}, 'a-completely-different-secret-value-123456', {
      algorithm: 'HS256',
      issuer: 'orbit-pms-api',
      subject: user.id,
      jwtid: crypto.randomUUID(),
    });

    const response = await api().get('/api/auth/me').set('Authorization', `Bearer ${forged}`);

    expect(response.status).toBe(401);
    expect(response.body.code).toBe('TOKEN_INVALID');
  });

  it('rejects an unsigned "alg: none" token', async () => {
    const { user } = await registerUser(validUser);
    const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
    const unsigned = `${encode({ alg: 'none', typ: 'JWT' })}.${encode({
      sub: user.id,
      jti: crypto.randomUUID(),
      iss: 'orbit-pms-api',
      exp: Math.floor(Date.now() / 1000) + 3600,
    })}.`;

    const response = await api().get('/api/auth/me').set('Authorization', `Bearer ${unsigned}`);

    expect(response.status).toBe(401);
    expect(response.body.code).toBe('TOKEN_INVALID');
  });
});

describe('POST /api/auth/logout', () => {
  it('revokes only the token that logged out', async () => {
    const { auth: webSession } = await registerUser(validUser);
    const mobileLogin = await api()
      .post('/api/auth/login')
      .send({ email: validUser.email, password: validUser.password });
    const mobileSession = { Authorization: `Bearer ${mobileLogin.body.data.token}` };

    const logout = await api().post('/api/auth/logout').set(webSession);
    expect(logout.status).toBe(200);
    expect(logout.body).toEqual({ success: true, data: null, message: 'Logged out successfully' });

    const reuse = await api().get('/api/auth/me').set(webSession);
    expect(reuse.status).toBe(401);
    expect(reuse.body.code).toBe('TOKEN_INVALID');

    const otherDevice = await api().get('/api/auth/me').set(mobileSession);
    expect(otherDevice.status).toBe(200);
  });

  it('requires authentication', async () => {
    const response = await api().post('/api/auth/logout');
    expect(response.status).toBe(401);
  });
});
