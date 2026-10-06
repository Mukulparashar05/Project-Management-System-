import * as authService from '../services/auth.service.js';
import { revokeToken } from '../services/token.service.js';
import { sendSuccess } from '../utils/apiResponse.js';

export async function register(req, res) {
  const result = await authService.registerUser(req.validated.body);
  sendSuccess(res, result, 'Account created successfully', 201);
}

export async function login(req, res) {
  const result = await authService.loginUser(req.validated.body);
  sendSuccess(res, result, 'Logged in successfully');
}

export async function logout(req, res) {
  await revokeToken({ jti: req.auth.jti, userId: req.user.id, expiresAt: req.auth.expiresAt });
  sendSuccess(res, null, 'Logged out successfully');
}

export function getCurrentUser(req, res) {
  sendSuccess(res, { user: req.user }, 'Authenticated user retrieved');
}
