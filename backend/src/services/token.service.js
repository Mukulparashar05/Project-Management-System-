import { randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/AppError.js';

const JWT_ISSUER = 'orbit-pms-api';
const JWT_ALGORITHM = 'HS256';

export function signAccessToken(userId) {
  return jwt.sign({}, env.JWT_SECRET, {
    algorithm: JWT_ALGORITHM,
    expiresIn: env.JWT_EXPIRES_IN,
    issuer: JWT_ISSUER,
    subject: userId,
    jwtid: randomUUID(),
  });
}

export function verifyAccessToken(token) {
  try {
    // Pinning the algorithm blocks "alg: none" and algorithm-confusion tokens.
    const payload = jwt.verify(token, env.JWT_SECRET, {
      algorithms: [JWT_ALGORITHM],
      issuer: JWT_ISSUER,
    });
    if (typeof payload.sub !== 'string' || typeof payload.jti !== 'string') {
      throw new Error('Token payload is missing required claims');
    }
    return payload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw AppError.unauthorized('Your session has expired. Please log in again.', 'TOKEN_EXPIRED');
    }
    throw AppError.unauthorized('Invalid authentication token. Please log in again.', 'TOKEN_INVALID');
  }
}

export async function isTokenRevoked(jti) {
  const revoked = await prisma.revokedToken.findUnique({ where: { jti }, select: { jti: true } });
  return revoked !== null;
}

export async function revokeToken({ jti, userId, expiresAt }) {
  await prisma.$transaction([
    prisma.revokedToken.upsert({
      where: { jti },
      create: { jti, userId, expiresAt },
      update: {},
    }),
    // Expired tokens are rejected by signature verification anyway, so their rows can go.
    prisma.revokedToken.deleteMany({ where: { expiresAt: { lt: new Date() } } }),
  ]);
}
