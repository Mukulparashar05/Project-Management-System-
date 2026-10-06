import { rateLimit } from 'express-rate-limit';
import { env } from '../config/env.js';

function rateLimitHandler(req, res, next, options) {
  res.status(options.statusCode).json({
    success: false,
    message: options.message,
    code: 'RATE_LIMITED',
  });
}

// Applied to login and register. Only failed attempts count, so brute-force and
// credential-stuffing are throttled without locking out users who log in normally.
export const authRateLimiter = rateLimit({
  windowMs: env.AUTH_RATE_LIMIT_WINDOW_MINUTES * 60 * 1000,
  limit: env.AUTH_RATE_LIMIT_MAX,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: 'Too many authentication attempts. Please wait a few minutes and try again.',
  handler: rateLimitHandler,
});

export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.API_RATE_LIMIT_MAX,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: 'Too many requests. Please slow down and try again shortly.',
  handler: rateLimitHandler,
});
