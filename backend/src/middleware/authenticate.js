import { isTokenRevoked, verifyAccessToken } from '../services/token.service.js';
import { findPublicUserById } from '../services/user.service.js';
import { AppError } from '../utils/AppError.js';

function extractBearerToken(header) {
  if (!header) return null;
  const [scheme, token, ...rest] = header.trim().split(/\s+/);
  if (scheme?.toLowerCase() !== 'bearer' || !token || rest.length > 0) return null;
  return token;
}

/**
 * Requires a valid, non-revoked JWT for an existing user and exposes the user on req.user.
 * Downstream services scope every query by req.user.id.
 */
export async function authenticate(req, res, next) {
  const token = extractBearerToken(req.get('authorization'));
  if (!token) {
    throw AppError.unauthorized('Authentication required. Please log in.', 'AUTH_REQUIRED');
  }

  const payload = verifyAccessToken(token);
  const [user, revoked] = await Promise.all([
    findPublicUserById(payload.sub),
    isTokenRevoked(payload.jti),
  ]);

  if (!user || revoked) {
    throw AppError.unauthorized('Your session is no longer valid. Please log in again.', 'TOKEN_INVALID');
  }

  req.user = user;
  req.auth = { jti: payload.jti, expiresAt: new Date(payload.exp * 1000) };
  next();
}
